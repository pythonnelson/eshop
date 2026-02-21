from rest_framework import serializers
from .models import VendorProfile
from authentication.serializers import UserSerializer


class VendorProfileSerializer(serializers.ModelSerializer):
    """Serializer for vendor profile"""
    user = UserSerializer(read_only=True)
    total_products = serializers.IntegerField(read_only=True)
    total_sales = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = VendorProfile
        fields = '__all__'
        read_only_fields = [
            'user', 
            'status', 
            'is_verified', 
            'created_at', 
            'updated_at'
        ]


class VendorRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for vendor registration"""
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    address_line2 = serializers.CharField(required=False, allow_blank=True, default='')
    business_description = serializers.CharField(required=False, allow_blank=True, default='')
    tax_id = serializers.CharField(required=False, allow_blank=True, default='')
    logo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = VendorProfile
        fields = [
            'email',
            'password',
            'first_name',
            'last_name',
            'phone',
            'store_name',
            'business_name',
            'business_email',
            'business_phone',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'country',
            'postal_code',
            'business_description',
            'logo',
            'tax_id'
        ]

    def create(self, validated_data):
        """Create vendor user and profile"""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        # Extract user data (password must be passed separately to create_user)
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        phone = validated_data.pop('phone', '') or ''

        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone or None,
            user_type='VENDOR'
        )

        # Create vendor profile (strip empty strings to None for optional fields)
        profile_data = {}
        for k, v in validated_data.items():
            if v == '' and k in ('address_line2', 'business_description', 'tax_id'):
                profile_data[k] = None
            else:
                profile_data[k] = v

        vendor_profile = VendorProfile.objects.create(user=user, **profile_data)
        return vendor_profile