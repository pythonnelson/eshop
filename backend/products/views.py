from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from notifications.services import notify_admins
from vendors.permissions import IsApprovedVendor
from .models import Category, Product, ProductImage
from .filters import ProductFilter
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductCreateSerializer,
    ProductImageSerializer,
)


class CategoryListView(generics.ListAPIView):
    """List all categories"""
    queryset = Category.objects.filter(is_active=True, parent=None)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ProductListView(generics.ListAPIView):
    """List all products with filtering (approved only for customers)"""
    queryset = Product.objects.filter(is_active=True, is_approved=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at']


class ProductDetailView(generics.RetrieveAPIView):
    """Get single product details (approved only)"""
    queryset = Product.objects.filter(is_active=True, is_approved=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]


class ProductReviewsSummaryView(APIView):
    """Rating summary: average, total, distribution (5/4/3/2/1 star counts and %)."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        from orders.models import OrderItem
        from django.db.models import Count
        product = Product.objects.filter(pk=pk, is_active=True, is_approved=True).first()
        if not product:
            from rest_framework.response import Response
            from rest_framework import status
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        qs = OrderItem.objects.filter(product_id=pk, rating__isnull=False)
        total = qs.count()
        dist = dict(qs.values('rating').annotate(c=Count('id')).values_list('rating', 'c'))
        dist = {k: dist.get(k, 0) for k in [5, 4, 3, 2, 1]}
        avg = float(product.average_rating or 0)
        pct = {k: round((v / total * 100) if total else 0, 1) for k, v in dist.items()}
        return Response({
            'average': round(avg, 1),
            'total': total,
            'distribution': dist,
            'percentages': pct,
        })


class ProductReviewsListView(APIView):
    """List reviews (order items with ratings) for a product."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        from orders.models import OrderItem, Order
        from rest_framework.response import Response
        from rest_framework import status
        product = Product.objects.filter(pk=pk, is_active=True, is_approved=True).first()
        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        items = OrderItem.objects.filter(
            product_id=pk, rating__isnull=False, order__status='DELIVERED'
        ).select_related('order').order_by('-created_at')[:50]
        reviews = []
        for oi in items:
            reviews.append({
                'id': oi.id,
                'rating': oi.rating,
                'product_name': oi.product_name,
                'customer_name': oi.order.customer.get_full_name() or oi.order.customer.email[:2] + '***',
                'date': oi.created_at.isoformat(),
                'selected_color': oi.selected_color or '',
                'selected_size': oi.selected_size or '',
            })
        return Response({'reviews': reviews})


class VendorProductListView(generics.ListCreateAPIView):
    """Vendor's product list and creation"""
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsApprovedVendor]

    def get_queryset(self):
        return Product.objects.filter(vendor=self.request.user.vendor_profile).prefetch_related('additional_images')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateSerializer
        return ProductSerializer

    def perform_create(self, serializer):
        product = serializer.save()
        notify_admins(
            'New product pending approval',
            f'"{product.name}" from {product.vendor.store_name} needs approval.',
            'product_created',
            '/admin/products',
        )


class VendorProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vendor's product detail, update, delete"""
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsApprovedVendor]

    def get_queryset(self):
        return Product.objects.filter(vendor=self.request.user.vendor_profile).prefetch_related('additional_images')


class VendorProductImageAddView(APIView):
    """Add one or more images to a vendor's product."""
    permission_classes = [IsAuthenticated, IsApprovedVendor]

    def post(self, request, pk):
        product = Product.objects.filter(pk=pk, vendor=request.user.vendor_profile).first()
        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        files = request.FILES.getlist('image')
        if not files:
            return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)
        created = []
        for f in files:
            if f and f.content_type.startswith('image/'):
                pi = ProductImage.objects.create(product=product, image=f)
                created.append(ProductImageSerializer(pi, context={'request': request}).data)
        return Response({'added': len(created), 'images': created}, status=status.HTTP_201_CREATED)


class VendorProductImageDeleteView(APIView):
    """Remove an additional image from a vendor's product."""
    permission_classes = [IsAuthenticated, IsApprovedVendor]

    def delete(self, request, pk, image_pk):
        product = Product.objects.filter(pk=pk, vendor=request.user.vendor_profile).first()
        if not product:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        pi = ProductImage.objects.filter(pk=image_pk, product=product).first()
        if not pi:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
        pi.delete()
        return Response({'deleted': True})