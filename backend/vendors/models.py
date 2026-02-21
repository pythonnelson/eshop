from django.db import models
from django.conf import settings


class VendorProfile(models.Model):
    """Vendor/Seller Profile"""
    
    STATUS_CHOICES = (
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('SUSPENDED', 'Suspended'),
        ('REJECTED', 'Rejected'),
    )
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vendor_profile'
    )
    store_name = models.CharField(max_length=200, unique=True)
    business_name = models.CharField(max_length=200)
    business_email = models.EmailField()
    business_phone = models.CharField(max_length=15)
    
    # Address
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    
    # Business Details
    business_description = models.TextField(blank=True, null=True)
    logo = models.ImageField(upload_to='vendor_logos/', blank=True, null=True)
    tax_id = models.CharField(max_length=50, blank=True, null=True)
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2, default=10, help_text='Tax percentage to charge')
    default_discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0, blank=True, null=True, help_text='Default discount % for products')
    default_shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=10, help_text='Default shipping/delivery fee')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    is_verified = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vendor_profiles'
        verbose_name = 'Vendor Profile'
        verbose_name_plural = 'Vendor Profiles'
    
    def __str__(self):
        return self.store_name
    
    @property
    def total_products(self):
        return self.products.count()
    
    @property
    def total_sales(self):
        from orders.models import OrderItem
        return OrderItem.objects.filter(vendor=self).count()