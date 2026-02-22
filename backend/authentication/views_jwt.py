"""Custom JWT views that reject blocked users."""
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import status
from rest_framework.response import Response

from django.contrib.auth import get_user_model

User = get_user_model()


class BlockedUserTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Reject blocked users when obtaining tokens."""

    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.is_blocked():
            from rest_framework_simplejwt.exceptions import AuthenticationFailed
            raise AuthenticationFailed(
                'Your account has been suspended or banned. Please contact support.'
            )
        return data


class BlockedUserTokenObtainPairView(TokenObtainPairView):
    """Token obtain that rejects blocked users."""
    serializer_class = BlockedUserTokenObtainPairSerializer


class BlockedUserTokenRefreshView(TokenRefreshView):
    """Token refresh that rejects blocked users."""

    def post(self, request, *args, **kwargs):
        from rest_framework_simplejwt.tokens import RefreshToken
        try:
            refresh = RefreshToken(request.data.get('refresh', ''))
            user_id = refresh.get('user_id')
            user = User.objects.filter(pk=user_id).first()
            if user and user.is_blocked():
                return Response(
                    {'detail': 'Your account has been suspended or banned.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception:
            pass  # Let parent handle invalid token
        return super().post(request, *args, **kwargs)
