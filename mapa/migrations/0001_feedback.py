from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='Feedback',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_type', models.CharField(choices=[('competencia', 'Competência'), ('material', 'Matéria-prima'), ('setor', 'Setor')], max_length=20)),
                ('item_key', models.CharField(max_length=160)),
                ('item_title', models.CharField(max_length=255)),
                ('name', models.CharField(max_length=120)),
                ('add', models.TextField(blank=True)),
                ('remove', models.TextField(blank=True)),
                ('comments', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={'ordering': ('-created_at',)},
        ),
        migrations.AddIndex(
            model_name='feedback',
            index=models.Index(fields=['item_type', 'item_key'], name='mapa_feedba_item_ty_8277e9_idx'),
        ),
    ]
