from django.urls import path
from .views import (
    VendorRegistrationView,
    VendorProfileView,
    VendorListView,
    VendorStatsView,
)

app_name = "vendors"

urlpatterns = [
    path('register/', VendorRegistrationView.as_view(), name='vendor-register'),
    path('profile/', VendorProfileView.as_view(), name='vendor-profile'),
    path('stats/', VendorStatsView.as_view(), name='vendor-stats'),
    path('', VendorListView.as_view(), name='vendor-list'),
]