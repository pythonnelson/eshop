"""Product filters for API."""
import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    """Filter products by category, vendor, and min rating."""
    min_rating = django_filters.NumberFilter(field_name='average_rating', lookup_expr='gte')
    vendor = django_filters.NumberFilter(field_name='vendor')
    category = django_filters.NumberFilter(field_name='category')

    class Meta:
        model = Product
        fields = ['category', 'vendor', 'min_rating']
