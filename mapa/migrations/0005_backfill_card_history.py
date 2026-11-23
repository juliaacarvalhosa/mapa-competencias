from django.db import migrations


def backfill_card_history(apps, schema_editor):
    MapCard = apps.get_model('mapa', 'MapCard')
    for card in MapCard.objects.all():
        history = list(card.history or [])
        if history and history[-1].get('data') == card.data:
            continue
        history.append({
            'data': card.data,
            'name': None,
            'action': 'added' if card.is_new else 'edited',
            'created_at': card.updated_at.strftime('%d/%m/%Y %H:%M'),
        })
        card.history = history
        card.save(update_fields=['history'])


class Migration(migrations.Migration):
    dependencies = [('mapa', '0004_mapcard_audit')]

    operations = [migrations.RunPython(backfill_card_history, migrations.RunPython.noop)]
