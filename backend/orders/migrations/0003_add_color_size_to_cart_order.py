# Generated manually for color/size selection

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0002_add_order_item_rating"),
    ]

    operations = [
        migrations.AddField(
            model_name="cartitem",
            name="selected_color",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AddField(
            model_name="cartitem",
            name="selected_size",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AlterUniqueTogether(
            name="cartitem",
            unique_together={("cart", "product", "selected_color", "selected_size")},
        ),
        migrations.AddField(
            model_name="orderitem",
            name="selected_color",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
        migrations.AddField(
            model_name="orderitem",
            name="selected_size",
            field=models.CharField(blank=True, default="", max_length=80),
        ),
    ]
