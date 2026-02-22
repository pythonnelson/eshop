from django.contrib import admin # type: ignore
from django.urls import path, include # type: ignore
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings

from rest_framework_simplejwt.views import TokenVerifyView, TokenBlacklistView
from authentication.views_jwt import BlockedUserTokenObtainPairView, BlockedUserTokenRefreshView

# API Documentation
schema_view = get_schema_view(
    openapi.Info(
        title="EShop API",
        default_version='v1',
        description="Multi-Vendor E-Commerce Platform API",
        contact=openapi.Contact(email="admin@eshop.com"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='api-docs'),

    path('api-auth/', include('rest_framework.urls')),
    path('api/token/', BlockedUserTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', BlockedUserTokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),

    # API Endpoints
    path('api/auth/', include('authentication.urls')),
    path('api/vendors/', include('vendors.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/admin/', include('admin_panel.urls')),
    path('api/notifications/', include('notifications.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)