# Generated migration for AbandonedCart model

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_alter_product_description'),
    ]

    operations = [
        migrations.CreateModel(
            name='AbandonedCart',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('customer_name', models.CharField(blank=True, max_length=150)),
                ('customer_email', models.EmailField(blank=True, max_length=254)),
                ('customer_phone', models.CharField(blank=True, max_length=20)),
                ('items', models.JSONField(default=list)),
                ('total_items', models.PositiveIntegerField(default=0)),
                ('total_amount', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('status', models.CharField(
                    choices=[('active', 'Active'), ('converted', 'Converted'), ('expired', 'Expired')],
                    default='active',
                    max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('converted_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='abandoned_carts',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'verbose_name': 'Abandoned Cart',
                'verbose_name_plural': 'Abandoned Carts',
                'ordering': ['-updated_at'],
                'indexes': [
                    models.Index(fields=['status', '-updated_at'], name='core_abando_status_idx'),
                    models.Index(fields=['user', 'status'], name='core_abando_user_idx'),
                ],
            },
        ),
    ]
