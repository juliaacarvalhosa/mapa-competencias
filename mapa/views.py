import json
from django.conf import settings
from django.shortcuts import render


def home(request):
    with (settings.BASE_DIR / 'data' / 'pilot_map.json').open(encoding='utf-8') as source:
        data = json.load(source)
    return render(request, 'mapa/home.html', {'pilot_data': data})
