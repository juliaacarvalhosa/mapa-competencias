from django.test import TestCase
from unittest.mock import patch


class PilotNavigationTests(TestCase):
    def test_home_contains_pilot_and_external_assets(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Centro de Tecnologia da Firjan SENAI SESI')
        self.assertContains(response, '/static/mapa/css/app.css')
        self.assertContains(response, '/static/mapa/js/app.js')
        self.assertContains(response, 'pilot-data')

    def test_stylesheet_url_changes_when_stylesheet_changes(self):
        with patch('pathlib.Path.read_bytes', return_value=b'body{color:blue}'):
            first = self.client.get('/')
        with patch('pathlib.Path.read_bytes', return_value=b'body{color:red}'):
            second = self.client.get('/')
        self.assertNotEqual(first.context['stylesheet_version'], second.context['stylesheet_version'])
        for response in (first, second):
            self.assertContains(response, '/static/mapa/css/app.css?v=' + response.context['stylesheet_version'])

    def test_alternative_ux_view_is_available(self):
        response = self.client.get('/alternativa_ux')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'O que você precisa desenvolver?')
        self.assertContains(response, 'alternative_ux.js')

    def test_home_highlights_feedback_action(self):
        response = self.client.get('/')
        self.assertContains(response, 'feedback-data')
        self.assertContains(response, '/static/mapa/js/app.js')

    def test_feedback_can_be_saved(self):
        response = self.client.post('/alternativa_ux/feedback/', data={
            'item_type': 'competencia',
            'item_key': 'A1',
            'item_title': 'A1 · Pré-tratamento',
            'name': 'Pessoa teste',
            'add': 'Adicionar um exemplo',
            'remove': '',
            'comments': 'Comentário de teste',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
