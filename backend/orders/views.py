from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg
from .models import Cart, CartItem, Order, OrderItem
from notifications.services import notify_user
from .serializers import (
    CartSerializer, 
    CartItemSerializer, 
    OrderSerializer,
    OrderCreateSerializer
)


class CartView(generics.RetrieveAPIView):
    """Get customer's cart"""
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        cart, _ = Cart.objects.get_or_create(customer=self.request.user)
        return Cart.objects.prefetch_related('items__product__vendor').get(pk=cart.pk)


class SyncCartView(APIView):
    """Replace cart with provided items (used when merging guest cart - sets quantity, does not add)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from products.models import Product
        cart, _ = Cart.objects.get_or_create(customer=request.user)
        items = request.data.get('items', [])
        if not isinstance(items, list):
            return Response({'error': 'items must be a list'}, status=status.HTTP_400_BAD_REQUEST)
        cart.items.all().delete()
        for it in items:
            product_id = it.get('product_id')
            quantity = int(it.get('quantity', 1))
            if quantity < 1:
                continue
            try:
                product = Product.objects.get(pk=product_id)
            except Product.DoesNotExist:
                continue
            if quantity > product.stock:
                quantity = product.stock
            CartItem.objects.create(cart=cart, product=product, quantity=quantity)
        return Response(CartSerializer(cart).data)


class AddToCartView(APIView):
    """Add item to cart"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        cart, created = Cart.objects.get_or_create(customer=request.user)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        from products.models import Product
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        existing = cart.items.filter(product_id=product_id).first()
        total_qty = (existing.quantity if existing else 0) + quantity
        if total_qty > product.stock:
            return Response(
                {'error': f'Insufficient stock. Available: {product.stock}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Check if item already in cart
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product_id=product_id,
            defaults={'quantity': quantity}
        )
        
        if not created:
            # Update quantity if already exists
            cart_item.quantity += int(quantity)
            cart_item.save()
        
        return Response({
            'message': 'Item added to cart',
            'cart': CartSerializer(cart).data
        }, status=status.HTTP_201_CREATED)


class UpdateCartItemView(generics.UpdateAPIView):
    """Update cart item quantity"""
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CartItem.objects.filter(cart__customer=self.request.user)


class RemoveFromCartView(generics.DestroyAPIView):
    """Remove item from cart"""
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CartItem.objects.filter(cart__customer=self.request.user)


class OrderListView(generics.ListAPIView):
    """List customer's orders"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)


class OrderCreateView(generics.CreateAPIView):
    """Create new order from cart"""
    serializer_class = OrderCreateSerializer
    permission_classes = [IsAuthenticated]


class OrderDetailView(generics.RetrieveAPIView):
    """Get order details"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)


class VendorOrderListView(generics.ListAPIView):
    """List orders that contain this vendor's products (vendor's sales)."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        vendor = getattr(self.request.user, 'vendor_profile', None)
        if not vendor:
            return Order.objects.none()
        return Order.objects.filter(items__vendor=vendor).distinct().order_by('-created_at')


class OrderStatusUpdateView(APIView):
    """Update order status. Admin: any order. Vendor: only orders containing their items."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_id):
        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        if order.status == 'DELIVERED':
            return Response(
                {'error': 'Order is delivered and cannot be updated'},
                status=status.HTTP_400_BAD_REQUEST
            )
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user = request.user
        is_admin = getattr(user, 'user_type', None) == 'ADMIN' or user.is_superuser
        if is_admin:
            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])
            notify_user(order.customer, 'Order status updated', f'Order {order.order_number} is now {new_status}.', 'order_status', f'/my-orders/{order.id}')
            return Response(OrderSerializer(order).data)
        vendor = getattr(user, 'vendor_profile', None)
        if vendor and order.items.filter(vendor=vendor).exists():
            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])
            notify_user(order.customer, 'Order status updated', f'Order {order.order_number} is now {new_status}.', 'order_status', f'/my-orders/{order.id}')
            return Response(OrderSerializer(order).data)
        return Response({'error': 'Not allowed to update this order'}, status=status.HTTP_403_FORBIDDEN)


def _update_product_ratings_and_featured():
    """Update Product.average_rating from OrderItem ratings, then mark top-rated as featured."""
    from products.models import Product
    from decimal import Decimal
    product_ids = list(OrderItem.objects.filter(rating__isnull=False, product_id__isnull=False).values_list('product_id', flat=True).distinct())
    Product.objects.filter(id__in=product_ids).update(average_rating=None)
    for pid in product_ids:
        result = OrderItem.objects.filter(product_id=pid, rating__isnull=False).aggregate(a=Avg('rating'))
        avg = result['a']
        if avg is not None:
            Product.objects.filter(pk=pid).update(average_rating=Decimal(str(round(avg, 2))))
    Product.objects.update(is_featured=False)
    top_ids = list(Product.objects.filter(
        average_rating__isnull=False, is_active=True, is_approved=True
    ).order_by('-average_rating').values_list('id', flat=True)[:10])
    if top_ids:
        Product.objects.filter(id__in=top_ids).update(is_featured=True)


class OrderRateView(APIView):
    """Rate order items (delivered orders only)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.prefetch_related('items').get(pk=pk, customer=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        if order.status != 'DELIVERED':
            return Response({'error': 'Can only rate delivered orders'}, status=status.HTTP_400_BAD_REQUEST)
        items = request.data.get('items', [])
        if not isinstance(items, list):
            return Response({'error': 'items must be a list of {order_item_id, rating}'}, status=status.HTTP_400_BAD_REQUEST)
        order_item_ids = {oi.id for oi in order.items.all()}
        for it in items:
            oi_id = it.get('order_item_id')
            rating = it.get('rating')
            if oi_id is None or rating is None or oi_id not in order_item_ids:
                continue
            try:
                r = int(rating)
                if 1 <= r <= 5:
                    OrderItem.objects.filter(pk=oi_id, order=order).update(rating=r)
            except (ValueError, TypeError):
                pass
        _update_product_ratings_and_featured()
        return Response(OrderSerializer(Order.objects.get(pk=pk)).data)