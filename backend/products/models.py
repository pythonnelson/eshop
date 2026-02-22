from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Category(models.Model):
    """Product Categories with hierarchical structure"""
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name='subcategories'
    )
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    @property
    def is_parent(self):
        return self.parent is None


class Product(models.Model):
    """Product Model"""
    
    vendor = models.ForeignKey(
        'vendors.VendorProfile',
        on_delete=models.CASCADE,
        related_name='products'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products'
    )
    
    # Basic Info
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    description = models.TextField()
    brand = models.CharField(max_length=120, blank=True, help_text='Product brand; falls back to vendor store name if empty')
    about_this_item = models.TextField(blank=True, help_text='Bullet points for "About this item" (one per line)')
    technical_specs = models.JSONField(default=dict, blank=True, help_text='Key-value technical specs e.g. {"Size": "24 Inch", "Resolution": "1080p"}')
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='Override vendor tax %')
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='Product discount %')
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text='Override vendor shipping fee')
    compare_at_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Original price before discount"
    )
    
    # Inventory
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    color = models.CharField(max_length=80, blank=True)
    size = models.CharField(max_length=120, blank=True, help_text='e.g. S,M,L or 10,12,14 or one size')
    dimension = models.CharField(max_length=200, blank=True, help_text='e.g. 24 x 18 x 6 inches')
    weight = models.CharField(max_length=80, blank=True, help_text='e.g. 2.5 kg or 5 lbs')
    
    # Media
    image = models.ImageField(upload_to='products/')
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False, help_text="Admin must approve before product is visible to customers")
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True, help_text="0-5 rating")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'is_active']),
            models.Index(fields=['category', 'is_active']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.name}-{self.vendor.store_name}")
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    @property
    def is_in_stock(self):
        return self.stock > 0
    
    @property
    def discount_percentage(self):
        if self.compare_at_price and self.compare_at_price > self.price:
            discount = ((self.compare_at_price - self.price) / self.compare_at_price) * 100
            return round(discount, 2)
        return 0

    def get_effective_price(self):
        """Price after discount_percent is applied."""
        from decimal import Decimal
        pct = self.discount_percent or Decimal('0')
        return (self.price * (Decimal('1') - pct / Decimal('100'))).quantize(Decimal('0.01'))


class ProductImage(models.Model):
    """Additional product images"""
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='additional_images'
    )
    image = models.ImageField(upload_to='products/gallery/')
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'product_images'
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
    
    def __str__(self):
        return f"Image for {self.product.name}"