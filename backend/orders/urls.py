from django.urls import path
from .views import (
    CartView,
    SyncCartView,
    OrderRateView,
    AddToCartView,
    UpdateCartItemView,
    RemoveFromCartView,
    OrderListView,
    OrderCreateView,
    OrderDetailView,
    VendorOrderListView,
    OrderStatusUpdateView,
)
from .stripe_views import CreateStripePaymentIntentView, ConfirmStripePaymentView

app_name = "orders"

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/sync/', SyncCartView.as_view(), name='sync-cart'),
    path('cart/add/', AddToCartView.as_view(), name='add-to-cart'),
    path('cart/items/<int:pk>/', UpdateCartItemView.as_view(), name='update-cart-item'),
    path('cart/items/<int:pk>/remove/', RemoveFromCartView.as_view(), name='remove-from-cart'),
    path('orders/', OrderListView.as_view(), name='order-list'),
    path('orders/create/', OrderCreateView.as_view(), name='order-create'),
    path('stripe/create-intent/', CreateStripePaymentIntentView.as_view(), name='stripe-create-intent'),
    path('stripe/confirm/', ConfirmStripePaymentView.as_view(), name='stripe-confirm'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/rate/', OrderRateView.as_view(), name='order-rate'),
    path('orders/<int:order_id>/status/', OrderStatusUpdateView.as_view(), name='order-status-update'),
    path('vendor/orders/', VendorOrderListView.as_view(), name='vendor-order-list'),
]