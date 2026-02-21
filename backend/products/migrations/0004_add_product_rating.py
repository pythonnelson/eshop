# Generated migration for product rating

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0003_approve_existing_products'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='average_rating',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='0-5 rating', max_digits=3, null=True),
        ),
    ]
