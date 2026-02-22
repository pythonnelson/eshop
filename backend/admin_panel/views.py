"""Admin dashboard API: users, vendors, categories, products (no orders - vendors manage their own)."""
from datetime import timedelta, datetime
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count
from django.db.models.functions import TruncDate

from .permissions import IsAdminRole
from authentication.serializers import UserSerializer
from vendors.models import VendorProfile
from vendors.serializers import VendorProfileSerializer
from products.models import Category, Product
from products.serializers import CategorySerializer, ProductSerializer
from notifications.services import notify_user

User = get_user_model()


class AdminUserListView(generics.ListAPIView):
    """List all users (vendors & customers). Filter by user_type if provided."""
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        user_type = self.request.query_params.get('user_type')
        if user_type in ('CUSTOMER', 'VENDOR', 'ADMIN'):
            qs = qs.filter(user_type=user_type)
        return qs


class AdminUserDetailView(APIView):
    """Suspend or ban a user. Admin only."""
    permission_classes = [IsAdminRole]
    http_method_names = ['get', 'patch']

    def get(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        if user.is_superuser:
            return Response({'error': 'Cannot suspend or ban superuser'}, status=status.HTTP_403_FORBIDDEN)
        action = request.data.get('action')
        if action == 'ban':
            user.is_active = False
            user.is_suspended = False
            user.suspended_until = None
            user.save(update_fields=['is_active', 'is_suspended', 'suspended_until'])
            return Response({'message': 'User banned', 'user': UserSerializer(user).data})
        if action == 'suspend':
            from datetime import timedelta
            days = int(request.data.get('days', 7))
            user.is_suspended = True
            user.suspended_until = timezone.now() + timedelta(days=days)
            user.save(update_fields=['is_suspended', 'suspended_until'])
            return Response({'message': f'User suspended for {days} days', 'user': UserSerializer(user).data})
        if action == 'unsuspend':
            user.is_suspended = False
            user.suspended_until = None
            user.save(update_fields=['is_suspended', 'suspended_until'])
            return Response({'message': 'User unsuspended', 'user': UserSerializer(user).data})
        if action == 'unban':
            user.is_active = True
            user.save(update_fields=['is_active'])
            return Response({'message': 'User unbanned', 'user': UserSerializer(user).data})
        return Response(
            {'error': 'Invalid action. Use: ban, unban, suspend, unsuspend. For suspend, provide "days" (default 7).'},
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminVendorListView(generics.ListAPIView):
    """List all vendors (any status)."""
    queryset = VendorProfile.objects.all().order_by('-created_at')
    serializer_class = VendorProfileSerializer
    permission_classes = [IsAdminRole]


class AdminVendorDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update vendor (e.g. approve/suspend)."""
    queryset = VendorProfile.objects.all()
    serializer_class = VendorProfileSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ['get', 'patch', 'put']

    def patch(self, request, *args, **kwargs):
        """Allow updating status (APPROVED, SUSPENDED, REJECTED, PENDING)."""
        instance = self.get_object()
        new_status = request.data.get('status')
        if new_status in dict(VendorProfile.STATUS_CHOICES):
            instance.status = new_status
            instance.save(update_fields=['status', 'updated_at'])
            notify_user(
                instance.user,
                f'Vendor status updated',
                f'Your store {instance.store_name} status is now {new_status}.',
                'vendor_status',
                '/vendor'
            )
            return Response(VendorProfileSerializer(instance).data)
        return Response(
            {'error': 'Invalid status. Use one of: PENDING, APPROVED, SUSPENDED, REJECTED'},
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminCategoryListCreateView(generics.ListCreateAPIView):
    """List all categories (including inactive) and create (admin)."""
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminRole]


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a category (admin)."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminRole]


class AdminProductListView(generics.ListAPIView):
    """List all products for admin (including unapproved)."""
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAdminRole]


class AdminProductRetrieveView(generics.RetrieveAPIView):
    """Get full product details for admin (including unapproved)."""
    queryset = Product.objects.all().prefetch_related('additional_images')
    serializer_class = ProductSerializer
    permission_classes = [IsAdminRole]


class AdminProductDetailView(APIView):
    """Approve, reject, or update product (is_active, is_featured)."""
    permission_classes = [IsAdminRole]

    def patch(self, request, **kwargs):
        pk = kwargs.get('pk')
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        updated = []
        is_approved = request.data.get('is_approved')
        if is_approved is not None:
            product.is_approved = bool(is_approved)
            if is_approved:
                product.is_active = True
            updated.extend(['is_approved', 'is_active'])
            notify_user(
                product.vendor.user,
                'Product ' + ('approved' if is_approved else 'rejected'),
                f'Your product "{product.name}" has been {"approved and is now visible to customers" if is_approved else "rejected"}.',
                'product_approval',
                '/vendor/products'
            )
        if request.data.get('is_active') is not None:
            product.is_active = bool(request.data['is_active'])
            updated.append('is_active')
        if request.data.get('is_featured') is not None:
            product.is_featured = bool(request.data['is_featured'])
            updated.append('is_featured')
        if updated:
            product.save(update_fields=list(dict.fromkeys(updated)))
        return Response(ProductSerializer(product).data)


class AdminStatsView(APIView):
    """Growth stats for admin dashboard charts (cumulative users, vendors, categories, products by date)."""
    permission_classes = [IsAdminRole]

    def get(self, request):
        days = min(int(request.query_params.get('days', 30)), 90)
        since = timezone.now().date() - timedelta(days=days)

        def cumulative_series(model, date_field):
            since_dt = timezone.make_aware(datetime.combine(since, datetime.min.time()))
            qs = (
                model.objects.filter(**{f'{date_field}__gte': since_dt})
                .annotate(date=TruncDate(date_field))
                .values('date')
                .annotate(daily=Count('id'))
                .order_by('date')
            )
            rows = list(qs)
            base = model.objects.filter(**{f'{date_field}__lt': since_dt}).count()
            total = model.objects.count()
            cumul = 0
            result = []
            for r in rows:
                cumul += r['daily']
                result.append({'date': str(r['date']), 'count': base + cumul})
            if not result and total > 0:
                result = [{'date': str(timezone.now().date()), 'count': total}]
            return result

        return Response({
            'users': cumulative_series(User, 'date_joined'),
            'vendors': cumulative_series(VendorProfile, 'created_at'),
            'categories': cumulative_series(Category, 'created_at'),
            'products': cumulative_series(Product, 'created_at'),
        })
