from django.urls import path
from .views import (
    AdminUserListView,
    AdminVendorListView,
    AdminVendorDetailView,
    AdminCategoryListCreateView,
    AdminCategoryDetailView,
    AdminProductListView,
    AdminProductDetailView,
    AdminProductRetrieveView,
    AdminStatsView,
)

app_name = "admin_panel"

urlpatterns = [
    path('users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('vendors/', AdminVendorListView.as_view(), name='admin-vendor-list'),
    path('vendors/<int:pk>/', AdminVendorDetailView.as_view(), name='admin-vendor-detail'),
    path('categories/', AdminCategoryListCreateView.as_view(), name='admin-category-list'),
    path('categories/<int:pk>/', AdminCategoryDetailView.as_view(), name='admin-category-detail'),
    path('products/', AdminProductListView.as_view(), name='admin-product-list'),
    path('products/<int:pk>/approve/', AdminProductDetailView.as_view(), name='admin-product-approve'),
    path('products/<int:pk>/', AdminProductRetrieveView.as_view(), name='admin-product-detail'),
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
]
