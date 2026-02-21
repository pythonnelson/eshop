"""Admin-only permission: user must be ADMIN role or superuser."""
from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    """Allow access only to users with ADMIN role or superuser."""
    message = "Admin access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or getattr(request.user, 'user_type', None) == 'ADMIN'
