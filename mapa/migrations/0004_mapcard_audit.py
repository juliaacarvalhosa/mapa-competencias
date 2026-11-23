from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('mapa', '0003_mapcard')]

    operations = [
        migrations.AddField(model_name='mapcard', name='created_by', field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name='mapcard', name='updated_by', field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name='mapcard', name='history', field=models.JSONField(default=list)),
    ]
