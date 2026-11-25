from django.test import TestCase
from unittest.mock import patch
import json
from mapa.models import MapCard
from mapa.views import load_pilot_data


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

    def test_edited_new_card_remains_visible(self):
        create_payload = {
            'password': 'test-password', 'name': 'Pessoa criadora', 'action': 'add',
            'item_type': 'material', 'item_key': '',
            'fields': {'nome': 'Material editável', 'explicacao': 'Descrição', 'produtos': ['Produto']},
        }
        edit_payload = {
            'password': 'test-password', 'editor_name': 'Pessoa editora', 'action': 'update',
            'item_type': 'material', 'item_key': 'Material editável',
            'fields': {'nome': 'Material editável', 'explicacao': 'Descrição atualizada', 'produtos': ['Produto']},
        }
        with self.settings(MAP_EDIT_PASSWORD='test-password'):
            self.client.post('/mapa/cards/edit/', data=json.dumps(create_payload), content_type='application/json')
            response = self.client.post('/mapa/cards/edit/', data=json.dumps(edit_payload), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = load_pilot_data()
        meta = data['cardMeta']['material:Material editável']
        self.assertEqual(meta['created_by'], 'Pessoa criadora')
        self.assertEqual(meta['updated_by'], 'Pessoa editora')
        self.assertEqual([v['name'] for v in meta['history']], ['Pessoa criadora', 'Pessoa editora'])
        self.assertTrue(any(item.get('nome') == 'Material editável' and item.get('explicacao') == 'Descrição atualizada' for item in data['materialsLeft']))

    def test_related_contact_add_edit_and_reload(self):
        payload = {
            'password': 'test-password', 'name': 'Editora', 'action': 'add',
            'item_type': 'contato', 'item_key': 'A1/0',
            'fields': {'nome': 'Pessoa teste', 'email': 'teste@example.com'},
        }
        with self.settings(MAP_EDIT_PASSWORD='test-password'):
            response = self.client.post('/mapa/cards/edit/', payload, content_type='application/json')
            self.assertEqual(response.status_code, 200)
            card = MapCard.objects.get(item_type='contato')
            self.assertTrue(card.item_key.startswith('A1/0/'))
            payload.update(action='update', item_key=card.item_key)
            payload['fields']['telefone'] = '1234'
            response = self.client.post('/mapa/cards/edit/', payload, content_type='application/json')
            self.assertEqual(response.status_code, 200)
        data = self.client.get('/').context['pilot_data']
        self.assertEqual(data['contacts'][card.item_key]['telefone'], '1234')
        history = data['cardMeta']['contato:' + card.item_key]['history']
        self.assertEqual([version['action'] for version in history], ['added', 'edited'])

    def test_delete_directory_contact_only_from_selected_card(self):
        payload = {
            'name': 'Editora', 'action': 'delete', 'item_type': 'contato',
            'item_key': 'A1/0/0', 'password': 'wrong',
        }
        with self.settings(MAP_EDIT_PASSWORD='test-password'):
            response = self.client.post('/mapa/cards/edit/', payload, content_type='application/json')
            self.assertEqual(response.status_code, 403)
            payload['password'] = 'test-password'
            response = self.client.post('/mapa/cards/edit/', payload, content_type='application/json')
            self.assertEqual(response.status_code, 200)
        data = load_pilot_data()
        self.assertTrue(data['contacts']['A1/0/0']['deleted'])
        self.assertNotIn('A1/1/0', data['contacts'])
        self.assertNotIn('deleted', data['leadResearchers'][0])
        history = data['cardMeta']['contato:A1/0/0']['history']
        self.assertEqual([version['action'] for version in history], ['original', 'deleted'])

    def test_history_resolves_only_authors_identifiable_from_card(self):
        versions = [
            {'action': 'added', 'data': {'nome': 'Inicial'}},
            {'action': 'edited', 'data': {'nome': 'Sem autoria'}},
            {'action': 'edited', 'name': 'Outro editor', 'data': {'nome': 'Anterior'}},
            {'action': 'edited', 'data': {'nome': 'Atual'}},
        ]
        MapCard.objects.create(item_type='material', item_key='Inicial', data=versions[-1]['data'],
                               created_by='Criadora', updated_by='Editora', history=versions)
        meta = self.client.get('/').context['pilot_data']['cardMeta']['material:Inicial']
        self.assertEqual([v.get('name') for v in meta['history']],
                         ['Criadora', None, 'Outro editor', 'Editora'])

    def test_database_rejects_blank_card_authors(self):
        from django.db import IntegrityError, transaction

        for creator, editor in [('', 'Editor'), ('  ', 'Editor'), ('Creator', '\t')]:
            with self.subTest(creator=creator, editor=editor):
                with self.assertRaises(IntegrityError), transaction.atomic():
                    MapCard.objects.create(item_type='material', item_key='Teste', created_by=creator,
                                           updated_by=editor)
        card = MapCard.objects.create(item_type='material', item_key='Teste', created_by='Creator',
                                      updated_by='Editor')
        for field in ('created_by', 'updated_by'):
            with self.assertRaises(IntegrityError), transaction.atomic():
                MapCard.objects.filter(pk=card.pk).update(**{field: ''})

    def test_lead_contact_channels_persist_with_author(self):
        key = 'diretorio/chefias/0'
        payload = {'password': 'test-password', 'editor_name': 'Editora', 'action': 'update',
                   'item_type': 'contato', 'item_key': key,
                   'fields': {'nome': 'Pessoa teste', 'telefone': '2122223333', 'whatsapp': '21999998888',
                              'email': 'pessoa@example.com'}}
        with self.settings(MAP_EDIT_PASSWORD='test-password'):
            response = self.client.post('/mapa/cards/edit/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = self.client.get('/').context['pilot_data']
        self.assertEqual(data['contacts'][key]['whatsapp'], '21999998888')
        self.assertEqual(data['cardMeta']['contato:' + key]['history'][-1]['name'], 'Editora')
