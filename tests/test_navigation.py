from django.test import SimpleTestCase


class PilotNavigationTests(SimpleTestCase):
    def test_home_contains_pilot_and_external_assets(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Centro de Tecnologia da Firjan SENAI SESI')
        self.assertContains(response, '/static/mapa/css/app.css')
        self.assertContains(response, '/static/mapa/js/app.js')
        self.assertContains(response, 'pilot-data')
