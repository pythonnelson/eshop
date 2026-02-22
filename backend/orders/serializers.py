from decimal import Decimal
from django.db import transaction
from django.db.models import F
from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from products.models import Product
from notifications.services import notify_user
from products.serializers import ProductSerializer


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items"""
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = [
            'id', 
            'product', 
            'product_id', 
            'quantity', 
            'selected_color', 
            'selected_size', 
            'subtotal', 
            'added_at'
        ]


class CartSerializer(serializers.ModelSerializer):
    """Serializer for shopping cart"""
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax_amount = serializers.SerializerMethodField()
    shipping_fee = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    def get_tax_amount(self, obj):
        tax = Decimal('0')
        for item in obj.items.select_related('product', 'product__vendor').all():
            p, v = item.product, item.product.vendor
            tax_pct = p.tax_percent if p.tax_percent is not None else (v.tax_percent if v and v.tax_percent is not None else None)
            if tax_pct is None:
                tax_pct = Decimal('10')
            item_sub = p.get_effective_price() * item.quantity
            tax += item_sub * (tax_pct / Decimal('100'))
        return tax

    def get_shipping_fee(self, obj):
        seen = set()
        fee = Decimal('0')
        for item in obj.items.select_related('product', 'product__vendor').all():
            p, v = item.product, item.product.vendor
            v_id = v.id if v else 0
            if v_id not in seen:
                seen.add(v_id)
                ship = p.shipping_fee if p.shipping_fee is not None else (v.default_shipping_fee if v and v.default_shipping_fee is not None else None)
                if ship is None:
                    ship = Decimal('10')
                fee += ship
        return fee

    def get_total_amount(self, obj):
        return obj.total_price + self.get_tax_amount(obj) + self.get_shipping_fee(obj)

    class Meta:
        model = Cart
        fields = [
            'id',
            'items',
            'total_items',
            'total_price',
            'tax_amount',
            'shipping_fee',
            'total_amount',
            'created_at',
            'updated_at'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""
    
    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for orders"""
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = [
            'customer', 
            'order_number', 
            'created_at', 
            'updated_at'
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders"""
    
    class Meta:
        model = Order
        fields = [
            'shipping_address', 
            'shipping_city', 
            'shipping_state',
            'shipping_country', 
            'shipping_postal_code', 
            'customer_notes',
            'payment_method'
        ]
    
    def create(self, validated_data):
        """Create order from cart"""
        user = self.context['request'].user
        
        # Get user's cart
        cart = Cart.objects.get(customer=user)
        
        if not cart.items.exists():
            raise serializers.ValidationError("Cart is empty")
        for item in cart.items.all():
            if item.product.stock < item.quantity:
                raise serializers.ValidationError(
                    f"Insufficient stock for {item.product.name}. Available: {item.product.stock}"
                )
        # Calculate totals using product values first, then vendor, then default
        subtotal = cart.total_price
        tax = Decimal('0')
        shipping_fee = Decimal('0')
        vendor_seen = set()
        for item in cart.items.select_related('product', 'product__vendor').all():
            p, v = item.product, item.product.vendor
            tax_pct = p.tax_percent if p.tax_percent is not None else (v.tax_percent if v and v.tax_percent is not None else None)
            if tax_pct is None:
                tax_pct = Decimal('10')
            item_sub = p.get_effective_price() * item.quantity
            tax += item_sub * (tax_pct / Decimal('100'))
            v_id = v.id if v else 0
            if v_id not in vendor_seen:
                vendor_seen.add(v_id)
                ship = p.shipping_fee if p.shipping_fee is not None else (v.default_shipping_fee if v and v.default_shipping_fee is not None else None)
                if ship is None:
                    ship = Decimal('10')
                shipping_fee += ship
        total = subtotal + tax + shipping_fee

        with transaction.atomic():
            order = Order.objects.create(
                customer=user,
                subtotal=subtotal,
                tax=tax,
                shipping_fee=shipping_fee,
                total_amount=total,
                payment_status='PAID',
                **validated_data
            )
            for cart_item in cart.items.all():
                price = cart_item.product.get_effective_price()
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    vendor=cart_item.product.vendor,
                    product_name=cart_item.product.name,
                    price=price,
                    quantity=cart_item.quantity,
                    subtotal=price * cart_item.quantity,
                    selected_color=cart_item.selected_color,
                    selected_size=cart_item.selected_size
                )
                Product.objects.filter(pk=cart_item.product_id).update(stock=F('stock') - cart_item.quantity)
            vendor_ids = set()
            for cart_item in cart.items.all():
                v = cart_item.product.vendor
                if v.user_id != user.id and v.id not in vendor_ids:
                    vendor_ids.add(v.id)
                    notify_user(v.user, 'New order', f'You have a new order {order.order_number}.', 'order_created', '/vendor/orders')
            cart.items.all().delete()
            notify_user(
                user,
                'Order placed',
                f'Your order {order.order_number} has been placed successfully.',
                'order_created',
                f'/my-orders/{order.id}'
            )
        return order