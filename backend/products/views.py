from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend

from notifications.services import notify_admins
from .models import Category, Product
from .filters import ProductFilter
from .serializers import (
    CategorySerializer, 
    ProductSerializer, 
    ProductCreateSerializer
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


class VendorProductListView(generics.ListCreateAPIView):
    """Vendor's product list and creation"""
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(vendor=self.request.user.vendor_profile)

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
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Product.objects.filter(vendor=self.request.user.vendor_profile)