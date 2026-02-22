from django.urls import path
from .views import (
    CategoryListView,
    ProductListView,
    ProductDetailView,
    ProductReviewsSummaryView,
    ProductReviewsListView,
    VendorProductListView,
    VendorProductDetailView,
    VendorProductImageAddView,
    VendorProductImageDeleteView,
)


app_name = "products"

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('', ProductListView.as_view(), name='product-list'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('<int:pk>/reviews-summary/', ProductReviewsSummaryView.as_view(), name='product-reviews-summary'),
    path('<int:pk>/reviews/', ProductReviewsListView.as_view(), name='product-reviews'),
    path('vendor/products/', VendorProductListView.as_view(), name='vendor-product-list'),
    path('vendor/products/<int:pk>/', VendorProductDetailView.as_view(), name='vendor-product-detail'),
    path('vendor/products/<int:pk>/images/', VendorProductImageAddView.as_view(), name='vendor-product-images-add'),
    path('vendor/products/<int:pk>/images/<int:image_pk>/', VendorProductImageDeleteView.as_view(), name='vendor-product-images-delete'),
]