from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('mapa', '0002_alter_feedback_item_type')]

    operations = [
        migrations.CreateModel(
            name='MapCard',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_type', models.CharField(max_length=20)),
                ('item_key', models.CharField(max_length=160)),
                ('data', models.JSONField(default=dict)),
                ('is_new', models.BooleanField(default=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ('item_type', 'item_key')},
        ),
        migrations.AddConstraint(
            model_name='mapcard',
            constraint=models.UniqueConstraint(fields=('item_type', 'item_key'), name='unique_map_card'),
        ),
    ]
