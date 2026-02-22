from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_suspended',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='suspended_until',
            field=models.DateTimeField(blank=True, help_text='If set and in future, user is suspended', null=True),
        ),
    ]
