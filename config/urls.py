from django.http import JsonResponse
from django.urls import path
from mapa.views import home, alternative_ux, submit_feedback

urlpatterns = [
    path('', home, name='home'),
    path('alternativa_ux', alternative_ux, name='alternative_ux'),
    path('alternativa_ux/feedback/', submit_feedback, name='submit_feedback'),
    path("health/", lambda request: JsonResponse({"status": "ok"})),
]

