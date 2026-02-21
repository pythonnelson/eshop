from django.db import migrations


def approve_existing(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    Product.objects.all().update(is_approved=True)


class Migration(migrations.Migration):
    dependencies = [('products', '0002_add_product_approval')]
    operations = [migrations.RunPython(approve_existing)]
