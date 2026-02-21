"""Stripe payment integration."""
from decimal import Decimal
import stripe
from django.conf import settings
from django.db import transaction
from django.db.models import F
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, Order, OrderItem
from products.models import Product
from notifications.services import notify_user

stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', None) or ''


class CreateStripePaymentIntentView(APIView):
    """Create order and Stripe PaymentIntent. Returns client_secret for frontend."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not stripe.api_key:
            return Response({'error': 'Stripe is not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        user = request.user
        if getattr(user, 'user_type', None) != 'CUSTOMER':
            return Response({'error': 'Customers only'}, status=status.HTTP_403_FORBIDDEN)
        cart = Cart.objects.filter(customer=user).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
        for item in cart.items.all():
            if item.product.stock < item.quantity:
                return Response(
                    {'error': f'Insufficient stock for {item.product.name}. Available: {item.product.stock}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        data = request.data
        required = ['shipping_address', 'shipping_city', 'shipping_country']
        if not all(data.get(f) for f in required):
            return Response({'error': 'Missing required shipping fields (address, city, country)'}, status=status.HTTP_400_BAD_REQUEST)
        subtotal = cart.total_price
        tax = Decimal('0')
        shipping_fee = Decimal('0')
        vendor_seen = set()
        for item in cart.items.select_related('product', 'product__vendor').all():
            p, v = item.product, item.product.vendor
            tax_pct = getattr(p, 'tax_percent', None) or (getattr(v, 'tax_percent', None) if v else None) or Decimal('10')
            item_sub = p.price * item.quantity
            tax += item_sub * (tax_pct / Decimal('100'))
            v_id = v.id if v else 0
            if v_id not in vendor_seen:
                vendor_seen.add(v_id)
                ship = getattr(p, 'shipping_fee', None) or (getattr(v, 'default_shipping_fee', None) if v else None) or Decimal('10')
                shipping_fee += ship
        total = int((float(subtotal) + float(tax) + float(shipping_fee)) * 100)  # cents
        with transaction.atomic():
            order = Order.objects.create(
                customer=user,
                subtotal=subtotal,
                tax=tax,
                shipping_fee=shipping_fee,
                total_amount=subtotal + tax + shipping_fee,
                payment_status='PENDING',
                shipping_address=data['shipping_address'],
                shipping_city=data['shipping_city'],
                shipping_state=data.get('shipping_state') or '',
                shipping_country=data['shipping_country'],
                shipping_postal_code=data.get('shipping_postal_code') or '',
                customer_notes=data.get('customer_notes', ''),
                payment_method='stripe',
            )
            for item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    vendor=item.product.vendor,
                    product_name=item.product.name,
                    price=item.product.price,
                    quantity=item.quantity,
                    subtotal=item.product.price * item.quantity,
                )
                Product.objects.filter(pk=item.product_id).update(stock=F('stock') - item.quantity)
        try:
            intent = stripe.PaymentIntent.create(
                amount=total,
                currency='usd',
                metadata={'order_id': order.id},
            )
        except stripe.error.StripeError as e:
            for item in order.items.all():
                if item.product_id:
                    Product.objects.filter(pk=item.product_id).update(stock=F('stock') + item.quantity)
            order.delete()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        cart.items.all().delete()
        return Response({'client_secret': intent.client_secret, 'order_id': order.id})


class ConfirmStripePaymentView(APIView):
    """Confirm Stripe payment and set order to PAID."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payment_intent_id = request.data.get('payment_intent_id')
        order_id = request.data.get('order_id')
        if not payment_intent_id or not order_id:
            return Response({'error': 'Missing payment_intent_id or order_id'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            order = Order.objects.get(id=order_id, customer=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        if order.payment_status == 'PAID':
            return Response({'message': 'Already paid', 'order': order.order_number})
        if stripe.api_key:
            try:
                intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                if intent.status != 'succeeded':
                    return Response({'error': 'Payment not completed'}, status=status.HTTP_400_BAD_REQUEST)
            except stripe.error.StripeError:
                return Response({'error': 'Invalid payment'}, status=status.HTTP_400_BAD_REQUEST)
        order.payment_status = 'PAID'
        order.save(update_fields=['payment_status'])
        notify_user(request.user, 'Order placed', f'Your order {order.order_number} has been placed successfully.', 'order_created', f'/my-orders/{order.id}')
        notified = set()
        for oi in order.items.select_related('vendor').all():
            if oi.vendor and oi.vendor.user_id != request.user.id and oi.vendor.id not in notified:
                notified.add(oi.vendor.id)
                notify_user(oi.vendor.user, 'New order', f'You have a new order {order.order_number}.', 'order_created', '/vendor/orders')
        return Response({'message': 'Payment confirmed', 'order_number': order.order_number})
