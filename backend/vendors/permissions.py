"""Vendor permissions."""
from rest_framework.permissions import BasePermission


class IsApprovedVendor(BasePermission):
    """Only vendors with APPROVED status can create/update/delete. Pending vendors can view (GET)."""

    message = "Your vendor account is pending approval. You cannot create, edit, or delete products until approved."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        vendor = getattr(request.user, 'vendor_profile', None)
        if not vendor:
            return False
        # Allow read-only (GET, HEAD, OPTIONS) for all vendors
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        # Require APPROVED for write operations (POST, PUT, PATCH, DELETE)
        return vendor.status == 'APPROVED'
