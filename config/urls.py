from django.http import JsonResponse
from django.urls import path
from mapa.views import home

urlpatterns = [path('', home, name='home'), path("health/", lambda request: JsonResponse({"status": "ok"}))]

