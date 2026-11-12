from django.test import SimpleTestCase
from unittest.mock import patch


class PilotNavigationTests(SimpleTestCase):
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
