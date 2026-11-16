from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('mapa', '0001_feedback')]
    operations = [
        migrations.AlterField(
            model_name='feedback',
            name='item_type',
            field=models.CharField(choices=[('mapa', 'Mapa completo'), ('competencia', 'Competência'), ('material', 'Matéria-prima'), ('setor', 'Setor')], max_length=20),
        ),
    ]
