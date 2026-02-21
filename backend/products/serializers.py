from rest_framework import serializers
from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for categories"""
    subcategories = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = '__all__'
    
    def get_subcategories(self, obj):
        """Get child categories"""
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.all(), many=True).data
        return []


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images"""
    
    class Meta:
        model = ProductImage
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for products"""
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    additional_images = ProductImageSerializer(many=True, read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)
    discount_percentage = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['vendor', 'created_at', 'updated_at']


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products"""
    
    class Meta:
        model = Product
        fields = [
            'category',
            'name',
            'description',
            'price',
            'compare_at_price',
            'tax_percent',
            'discount_percent',
            'shipping_fee',
            'stock',
            'sku',
            'image',
            'is_active',
            'is_featured',
        ]
    
    def create(self, validated_data):
        """Create product with vendor from request"""
        vendor = self.context['request'].user.vendor_profile
        product = Product.objects.create(vendor=vendor, **validated_data)
        return product