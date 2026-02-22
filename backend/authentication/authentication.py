"""Custom authentication that rejects banned/suspended users."""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed


class JWTBlockedUserAuthentication(JWTAuthentication):
    """JWT auth that rejects users who are banned or suspended."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if user and user.is_blocked():
            raise AuthenticationFailed(
                'Your account has been suspended or banned. Please contact support.'
            )
        return user
