"""Vendor permissions."""
from rest_framework.permissions import BasePermission


class IsApprovedVendor(BasePermission):
    """Only vendors with APPROVED status can create/update/delete."""

    message = "Your vendor account is pending approval. You cannot perform this action until approved."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        vendor = getattr(request.user, 'vendor_profile', None)
        if not vendor:
            return False
        return vendor.status == 'APPROVED'
