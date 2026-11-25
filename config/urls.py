from django.http import JsonResponse
from django.urls import path
from django.views.generic import TemplateView
from django.views.decorators.cache import never_cache
from mapa.views import home, alternative_ux, submit_feedback, edit_card

urlpatterns = [
    path('sw.js', never_cache(TemplateView.as_view(
        template_name='mapa/service_worker.js', content_type='application/javascript',
    )), name='service-worker'),
    path('', home, name='home'),
    path('alternativa_ux', alternative_ux, name='alternative_ux'),
    path('alternativa_ux/feedback/', submit_feedback, name='submit_feedback'),
    path('mapa/cards/edit/', edit_card, name='edit_card'),
    path("health/", lambda request: JsonResponse({"status": "ok"})),
]

