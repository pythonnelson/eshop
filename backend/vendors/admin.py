from django.contrib import admin
from .models import VendorProfile

@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ['store_name', 'business_name', 'status', 'is_verified']
    list_filter = ['status', 'is_verified']
    search_fields = ['store_name', 'business_name']