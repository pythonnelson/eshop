from django.urls import path
from .views import (
    CategoryListView,
    ProductListView,
    ProductDetailView,
    VendorProductListView,
    VendorProductDetailView
)


app_name = "products"

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('', ProductListView.as_view(), name='product-list'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('vendor/products/', VendorProductListView.as_view(), name='vendor-product-list'),
    path('vendor/products/<int:pk>/', VendorProductDetailView.as_view(), name='vendor-product-detail'),
]