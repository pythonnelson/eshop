from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CustomerProfile

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for customer registration (user_type always CUSTOMER)"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        phone = validated_data.pop('phone', '') or ''
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=phone or None,
            user_type='CUSTOMER',
        )
        CustomerProfile.objects.create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'phone',
            'user_type',
            'is_active',
            'is_suspended',
            'suspended_until',
            'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']


class CustomerProfileSerializer(serializers.ModelSerializer):
    """Serializer for customer profile"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CustomerProfile
        fields = '__all__'