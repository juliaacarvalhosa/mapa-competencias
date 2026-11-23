from django.test import TestCase
from unittest.mock import patch
import json
from mapa.models import MapCard


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

    def test_card_edit_requires_name_and_keeps_original_version(self):
        payload = {
            'password': 'test-password', 'name': '', 'action': 'update',
            'item_type': 'competencia', 'item_key': 'A1',
            'fields': {'title': 'Novo título', 'bullets': ['Uma competência'], 'teams': ['Equipe']},
        }
        with self.settings(MAP_EDIT_PASSWORD='test-password'):
            response = self.client.post('/mapa/cards/edit/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 400)

        payload['password'] = 'test-password'
        payload['name'] = 'Pessoa editora'
        with self.settings(MAP_EDIT_PASSWORD='test-password'):
            response = self.client.post('/mapa/cards/edit/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        card = MapCard.objects.get(item_type='competencia', item_key='A1')
        self.assertEqual(card.updated_by, 'Pessoa editora')
        self.assertEqual(card.history[0]['data']['title'], 'Pré-tratamento')

    def test_new_card_is_marked_and_has_creator(self):
        payload = {
            'password': 'test-password', 'name': 'Pessoa criadora', 'action': 'add',
            'item_type': 'material', 'item_key': '',
            'fields': {'nome': 'Material de teste', 'explicacao': 'Descrição', 'produtos': ['Produto']},
        }
        with self.settings(MAP_EDIT_PASSWORD='test-password'):
            response = self.client.post('/mapa/cards/edit/', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        card = MapCard.objects.get(item_type='material', item_key='Material de teste')
        self.assertTrue(card.is_new)
        self.assertEqual(card.created_by, 'Pessoa criadora')
