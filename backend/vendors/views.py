from datetime import timedelta, datetime
from decimal import Decimal

from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.services import notify_admins
from orders.models import OrderItem
from products.models import Product
from .models import VendorProfile
from .serializers import VendorProfileSerializer, VendorRegistrationSerializer


class VendorRegistrationView(generics.CreateAPIView):
    """Vendor registration"""
    serializer_class = VendorRegistrationSerializer
    permission_classes = []
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vendor = serializer.save()
        notify_admins(
            'New vendor registration',
            f'"{vendor.store_name}" is awaiting approval.',
            'vendor_registered',
            '/admin/vendors',
        )
        return Response({
            'message': 'Vendor registered successfully. Awaiting admin approval.',
            'vendor': VendorProfileSerializer(vendor).data
        }, status=status.HTTP_201_CREATED)


class VendorProfileView(generics.RetrieveUpdateAPIView):
    """Get and update vendor profile"""
    serializer_class = VendorProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user.vendor_profile


class VendorListView(generics.ListAPIView):
    """List all approved vendors (public for product filter dropdown)"""
    queryset = VendorProfile.objects.filter(status='APPROVED')
    serializer_class = VendorProfileSerializer
    permission_classes = [AllowAny]


class VendorStatsView(APIView):
    """Stats for vendor dashboard: items sold, revenue, stock, categories, low stock, growth series."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        vendor = getattr(request.user, 'vendor_profile', None)
        if not vendor:
            return Response({'error': 'Not a vendor'}, status=status.HTTP_403_FORBIDDEN)

        products = Product.objects.filter(vendor=vendor)
        order_items = OrderItem.objects.filter(vendor=vendor)

        item_sales = order_items.aggregate(total=Sum('quantity'))['total'] or 0
        revenue = order_items.aggregate(total=Sum('subtotal'))['total'] or Decimal('0')
        items_in_stock = products.aggregate(total=Sum('stock'))['total'] or 0

        categories = list(
            products.filter(category__isnull=False)
            .values('category__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        categories = [{'name': c['category__name'], 'count': c['count']} for c in categories]

        low_stock_threshold = 5
        stock_running_low = list(
            products.filter(stock__lte=low_stock_threshold, stock__gte=0)
            .values('id', 'name', 'stock')
        )

        days = min(int(request.query_params.get('days', 30)), 90)
        since = timezone.now().date() - timedelta(days=days)
        since_dt = timezone.make_aware(datetime.combine(since, datetime.min.time()))

        products_growth = list(
            products.filter(created_at__gte=since_dt)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        base_products = products.filter(created_at__lt=since_dt).count()
        cumul = 0
        products_series = []
        for r in products_growth:
            cumul += r['count']
            products_series.append({'date': str(r['date']), 'count': base_products + cumul})
        if not products_series and products.exists():
            products_series = [{'date': str(timezone.now().date()), 'count': products.count()}]

        orders_growth = list(
            order_items.filter(created_at__gte=since_dt)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(items=Sum('quantity'), revenue=Sum('subtotal'))
            .order_by('date')
        )
        orders_series = [
            {'date': str(r['date']), 'items': r['items'] or 0, 'revenue': float(r['revenue'] or 0)}
            for r in orders_growth
        ]
        if not orders_series and order_items.exists():
            total_items = order_items.aggregate(tot=Sum('quantity'))['tot'] or 0
            total_rev = order_items.aggregate(tot=Sum('subtotal'))['tot'] or Decimal('0')
            orders_series = [{'date': str(timezone.now().date()), 'items': total_items, 'revenue': float(total_rev)}]

        return Response({
            'item_sales': item_sales,
            'revenue': float(revenue),
            'items_in_stock': items_in_stock,
            'categories': categories,
            'stock_running_low': stock_running_low,
            'products_series': products_series,
            'orders_series': orders_series,
        })