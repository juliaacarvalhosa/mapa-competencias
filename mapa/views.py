import json
import re
from uuid import uuid4
from hashlib import sha256
from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.http import require_POST
from .models import Feedback, MapCard


def feedback_payload():
    items = list(Feedback.objects.values(
        'item_type', 'item_key', 'item_title', 'name', 'add', 'remove', 'comments', 'created_at'
    ))
    for item in items:
        item['created_at'] = item['created_at'].strftime('%d/%m/%Y %H:%M')
    return items


def load_pilot_data():
    with (settings.BASE_DIR / 'data' / 'pilot_map.json').open(encoding='utf-8') as source:
        data = json.load(source)
    data['cardMeta'] = {}
    data['contacts'] = {}
    for card in MapCard.objects.all():
        history = list(card.history or [])
        is_user_added = card.is_new or any(version.get('action') == 'added' for version in history)
        base_snapshot = None
        if not is_user_added and card.item_type != 'contato':
            if card.item_type == 'competencia':
                base_snapshot = data.get('competencias', {}).get(card.item_key[:1], {}).get('subdivisions', {}).get(card.item_key)
            else:
                base_collection = data.get('materialsLeft' if card.item_type == 'material' else 'sectorsRight', [])
                base_snapshot = next((item for item in base_collection if item.get('nome') == card.item_key), None)
            if base_snapshot is not None:
                base_snapshot = json.loads(json.dumps(base_snapshot))

        original_versions = [version for version in history if version.get('action') == 'original']
        edited_versions = [version for version in history if version.get('action') != 'original']
        if not card.is_new and base_snapshot is not None and not original_versions:
            original_versions = [{
                'data': base_snapshot,
                'name': None,
                'action': 'original',
                'created_at': card.updated_at.strftime('%d/%m/%Y %H:%M'),
            }]
        if edited_versions:
            first, latest = edited_versions[0], edited_versions[-1]
            if first.get('action') == 'added' and not first.get('name') and card.created_by:
                first['name'] = card.created_by
            if not latest.get('name') and latest.get('data') == card.data and card.updated_by:
                latest['name'] = card.updated_by
        history = original_versions + edited_versions
        is_edited = any(version.get('action') not in ('original', 'added') for version in history)
        data['cardMeta'][f'{card.item_type}:{card.item_key}'] = {
            'is_new': card.is_new,
            'is_edited': is_edited,
            'created_by': card.created_by,
            'updated_by': card.updated_by,
            'updated_at': card.updated_at.strftime('%d/%m/%Y %H:%M'),
            'history': history,
        }
        if card.item_type == 'contato':
            data['contacts'][card.item_key] = card.data
        elif card.item_type == 'competencia':
            letter = card.data.get('letter', card.item_key[:1])
            subdivisions = data.setdefault('competencias', {}).setdefault(letter, {}).setdefault('subdivisions', {})
            if is_user_added or card.item_key in subdivisions:
                subdivisions[card.item_key] = card.data
        else:
            collection_name = 'materialsLeft' if card.item_type == 'material' else 'sectorsRight'
            collection = data.setdefault(collection_name, [])
            if is_user_added:
                collection.append(card.data)
            else:
                current = next((item for item in collection if item.get('nome') == card.item_key), None)
                if current:
                    current.update(card.data)
    return data


def alternative_ux(request):
    data = load_pilot_data()
    return render(request, 'mapa/alternative_ux.html', {'pilot_data': data, 'feedback_items': feedback_payload()})


@require_POST
def submit_feedback(request):
    try:
        payload = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Formato inválido.'}, status=400)
    required = ('item_type', 'item_key', 'item_title', 'name')
    if any(not str(payload.get(field, '')).strip() for field in required):
        return JsonResponse({'error': 'Preencha o nome e o item avaliado.'}, status=400)
    if payload.get('item_type') not in dict(Feedback.ITEM_TYPES):
        return JsonResponse({'error': 'Tipo de item inválido.'}, status=400)
    if not any(str(payload.get(field, '')).strip() for field in ('add', 'remove', 'comments')):
        return JsonResponse({'error': 'Escreva pelo menos uma sugestão ou comentário.'}, status=400)
    feedback = Feedback.objects.create(
        item_type=str(payload['item_type']).strip()[:20],
        item_key=str(payload['item_key']).strip()[:160],
        item_title=str(payload['item_title']).strip()[:255],
        name=str(payload['name']).strip()[:120],
        add=str(payload.get('add', '')).strip(),
        remove=str(payload.get('remove', '')).strip(),
        comments=str(payload.get('comments', '')).strip(),
    )
    return JsonResponse({'id': feedback.id, 'created_at': feedback.created_at.strftime('%d/%m/%Y %H:%M')})


@require_POST
@transaction.atomic
def edit_card(request):
    try:
        payload = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Formato inválido.'}, status=400)
    if payload.get('password', '') != settings.MAP_EDIT_PASSWORD:
        return JsonResponse({'error': 'Palavra de segurança incorreta.'}, status=403)

    submitted_name = payload.get('editor_name', payload.get('name'))
    editor = submitted_name.strip()[:120] if isinstance(submitted_name, str) else ''
    if not editor:
        return JsonResponse({'error': 'Informe seu nome para registrar a alteracao.'}, status=400)
    item_type = str(payload.get('item_type', '')).strip()
    action = str(payload.get('action', 'update')).strip()
    fields = payload.get('fields') or {}
    if item_type not in ('competencia', 'material', 'setor', 'contato') or (action not in ('update', 'add', 'add_bullet', 'update_bullet') and (item_type, action) != ('contato', 'delete')):
        return JsonResponse({'error': 'Tipo de card ou operação inválida.'}, status=400)
    data = load_pilot_data()

    def text(name, required=True, limit=5000):
        value = str(fields.get(name, '')).strip()
        if required and not value:
            raise ValueError('Preencha todos os campos obrigatórios.')
        return value[:limit]

    def lines(name, required=True):
        value = fields.get(name, [])
        if isinstance(value, str):
            value = value.splitlines()
        value = [str(item).strip() for item in value if str(item).strip()]
        if required and not value:
            raise ValueError('Inclua pelo menos um item na lista.')
        return value[:100]

    try:
        key = str(payload.get('item_key', '')).strip()
        original_key = key
        base_snapshot = None
        if item_type == 'competencia' and key:
            base_snapshot = data.get('competencias', {}).get(key[:1], {}).get('subdivisions', {}).get(key)
        elif item_type in ('material', 'setor') and key:
            base_collection = data.get('materialsLeft' if item_type == 'material' else 'sectorsRight', [])
            base_snapshot = next((item for item in base_collection if item.get('nome') == key), None)
        if base_snapshot is not None:
            base_snapshot = json.loads(json.dumps(base_snapshot))
        if item_type == 'contato':
            parts = key.split('/')
            if action not in ('add', 'update', 'delete') or len(parts) != (2 if action == 'add' else 3):
                raise ValueError('Card de contatos inválido.')
            code, index = parts[:2]
            axis_contact = index == 'eixo' and code in data['competencias']
            subdivision_contact = (code in data['competencias'].get(code[:1], {}).get('subdivisions', {})
                                   and re.fullmatch(r'subdivisao|[0-9]{1,5}', index))
            if not (axis_contact or subdivision_contact):
                raise ValueError('Competência inválida.')
            if action == 'add':
                stored_key = f'{key}/{uuid4().hex}'
            else:
                stored_key = key
                base_snapshot = data['contacts'].get(key)
                if base_snapshot is None:
                    directory = data['leadResearchers'] + data['seniorResearchers']
                    source = parts[2]
                    if not re.fullmatch(r'[0-9]{1,5}', source) or int(source) >= len(directory):
                        raise ValueError('Contato não encontrado.')
                    base_snapshot = directory[int(source)]
            if action == 'delete':
                stored_data = {**base_snapshot, 'deleted': True}
            else:
                stored_data = {field: text(field, field == 'nome', 255) for field in ('nome', 'cargo', 'setor', 'email', 'telefone')}
        elif item_type == 'competencia':
            letter = str(fields.get('letter') or key[:1] or 'A').strip().upper()
            code = str(fields.get('code') or key).strip().upper()
            if action == 'add':
                if code[:1] not in data.get('competencias', {}):
                    raise ValueError('O c&oacute;digo deve come&ccedil;ar com uma letra de eixo v&aacute;lida (A, B, C, D ou E).')
                if letter != code[:1]:
                    raise ValueError('O c&oacute;digo e o eixo selecionado n&atilde;o combinam.')
            subdivisions = data.setdefault('competencias', {}).setdefault(letter, {}).setdefault('subdivisions', {})
            if action in ('add_bullet', 'update_bullet'):
                if key not in subdivisions:
                    raise ValueError('Competência não encontrada.')
                card = subdivisions[key]
                bullets = list(card.get('bullets', []))
                if action == 'add_bullet':
                    bullets.append(text('bullet', True, 5000))
                else:
                    old_bullet = str(fields.get('old_bullet', '')).strip()
                    replacement = text('bullet', True, 5000)
                    bullet_index = fields.get('bullet_index')
                    if bullet_index is not None and str(bullet_index).isdigit() and int(bullet_index) < len(bullets):
                        bullets[int(bullet_index)] = replacement
                    elif old_bullet in bullets:
                        bullets[bullets.index(old_bullet)] = replacement
                    else:
                        raise ValueError('Card interno não encontrado.')
                card['bullets'] = bullets[:100]
                letter = key[:1]
                code = key
            elif action == 'add':
                if code in subdivisions:
                    raise ValueError('Já existe uma competência com esse código.')
                subdivisions[code] = {'title': text('title', True, 255), 'bullets': lines('bullets'), 'teams': lines('teams')}
            else:
                if not key or key[0] not in data.get('competencias', {}) or key not in data['competencias'][key[0]].get('subdivisions', {}):
                    raise ValueError('Competência não encontrada.')
                card = data['competencias'][key[0]]['subdivisions'][key]
                card['title'] = text('title', True, 255)
                card['bullets'] = lines('bullets')
                card['teams'] = lines('teams')
        else:
            collection_name = 'materialsLeft' if item_type == 'material' else 'sectorsRight'
            collection = data.setdefault(collection_name, [])
            if action == 'add':
                name = text('nome', True, 255)
                if any(item.get('nome') == name for item in collection):
                    raise ValueError('Já existe um card com esse nome.')
                collection.append({'nome': name, 'explicacao': text('explicacao'), 'produtos': lines('produtos'), 'mercado_br': {'valor': 'Pendente de preenchimento', 'fonte': 'A informar', 'confianca': 'nao_verificado'}, 'mercado_global': {'valor': 'Pendente de preenchimento', 'fonte': 'A informar', 'confianca': 'nao_verificado'}})
                if item_type == 'setor':
                    collection[-1]['empresas'] = []
            else:
                card = next((item for item in collection if item.get('nome') == key), None)
                if not card:
                    raise ValueError('Card não encontrado.')
                card['nome'] = text('nome', True, 255)
                card['explicacao'] = text('explicacao')
                card['produtos'] = lines('produtos')
        if item_type == 'competencia' and action in ('add_bullet', 'update_bullet'):
            stored_key = key
            stored_data = dict(card)
            stored_data['letter'] = letter
        elif item_type == 'competencia':
            stored_key = code if action == 'add' else key
            stored_data = {'letter': letter, 'title': text('title', True, 255), 'bullets': lines('bullets'), 'teams': lines('teams')}
        elif item_type != 'contato':
            stored_key = name if action == 'add' else key
            stored_data = {'nome': name if action == 'add' else text('nome', True, 255), 'explicacao': text('explicacao'), 'produtos': lines('produtos')}
            if action == 'add':
                stored_data.update({'mercado_br': {'valor': 'Pendente de preenchimento', 'fonte': 'A informar', 'confianca': 'nao_verificado'}, 'mercado_global': {'valor': 'Pendente de preenchimento', 'fonte': 'A informar', 'confianca': 'nao_verificado'}})
                if item_type == 'setor': stored_data['empresas'] = []
        now_label = timezone.now().strftime('%d/%m/%Y %H:%M')
        initial_history = []
        if base_snapshot is not None and action != 'add':
            initial_history.append({'data': base_snapshot, 'name': None, 'action': 'original', 'created_at': now_label})
        version_action = {'add': 'added', 'delete': 'deleted'}.get(action, 'edited')
        current_version = {'data': json.loads(json.dumps(stored_data)), 'name': editor, 'action': version_action, 'created_at': now_label}
        record, created = MapCard.objects.select_for_update().get_or_create(item_type=item_type, item_key=stored_key, defaults={'data': stored_data, 'is_new': action == 'add', 'created_by': editor, 'updated_by': editor, 'history': initial_history + [current_version]})
        if not created:
            history = list(record.history or [])
            if not history and base_snapshot is not None and action != 'add':
                history.extend(initial_history)
            history.append(current_version)
            record.history = history
            record.data = stored_data
            record.is_new = False
            record.updated_by = editor
            record.save()
        if item_type != 'contato' and original_key and stored_key != original_key:
            MapCard.objects.filter(item_type=item_type, item_key=original_key).exclude(pk=record.pk).delete()
    except ValueError as error:
        return JsonResponse({'error': str(error)}, status=400)
    return JsonResponse({'ok': True, 'name': editor})


def home(request):
    data = load_pilot_data()
    with (settings.BASE_DIR / 'data' / 'competence_summaries.json').open(encoding='utf-8') as source:
        data['competenceSummaries'] = json.load(source)
    electro = data['competencias']['A']['subdivisions']['A5']
    electro_bullets = [
        'Plasma — Tecnologia de plasma aplicada à ativação e funcionalização de superfícies, promovendo limpeza, aumento de energia superficial, melhoria da adesão e deposição de revestimentos em diferentes materiais.',
    ]
    electro['bullets'] = [bullet for bullet in electro['bullets'] if bullet != 'Plasma']
    for bullet in electro_bullets:
        if bullet not in electro['bullets']:
            electro['bullets'].append(bullet)
    data['competenceSummaries'].update({
        'Plasma — Tecnologia de plasma aplicada à ativação e funcionalização de superfícies, promovendo limpeza, aumento de energia superficial, melhoria da adesão e deposição de revestimentos em diferentes materiais.': 'Ativação e funcionalização de superfícies por plasma para melhorar limpeza, adesão e revestimentos.',
    })
    a13_descriptions = [
        'Ajuste de formulações de medicamentos para melhorar desempenho, estabilidade, segurança e reprodutibilidade.',
        'Desenvolvimento e otimização de formulações alimentícias com foco em composição, textura, estabilidade e processamento.',
        'Definição da composição química de produtos a partir da atividade biológica desejada e dos resultados dos ensaios.',
        'Desenvolvimento de formulações bioativas para avaliação de eficácia e segurança em estudos pré-clínicos.',
        'Cultivo controlado de células mamíferas para produção, teste e caracterização de soluções biotecnológicas.',
        'Adequação de processos industriais aos requisitos regulatórios de Boas Práticas Laboratoriais e de Fabricação.',
        'Produção padronizada de formulações em ambiente BPF, com controle de qualidade e rastreabilidade.',
    ]
    for bullet, description in zip(data['competencias']['A']['subdivisions']['A13']['bullets'], a13_descriptions):
        data['competenceSummaries'][bullet] = description
    a3 = data['competencias']['A']['subdivisions']['A3']
    a3_descriptions = {
        4: 'Produção, propagação e caracterização de fagos para aplicações biotecnológicas e controle de microrganismos.',
        5: 'Cultivo controlado de células mamíferas para produção de biofármacos, testes de toxicidade e avaliação de respostas celulares.',
        6: 'Tratamento biológico de efluentes com microrganismos, buscando reduzir a carga orgânica e preparar a corrente para as etapas de tratamento terciário.',
    }
    for index, description in a3_descriptions.items():
        data['competenceSummaries'][a3['bullets'][index]] = description
    b3 = data['competencias']['B']['subdivisions']['B3']
    b3['title'] = 'Bioremediação'
    data['competenceSummaries'].update({
        b3['bullets'][0]: 'Remediação de áreas contaminadas com processos físico-químicos, combinados quando necessário a etapas biológicas e de monitoramento.',
        b3['bullets'][1]: 'Uso de microrganismos, bioestimulação, bioaumentação e biorreatores para degradar ou neutralizar contaminantes no solo, na água e em resíduos.',
    })
    b1 = data['competencias']['B']['subdivisions']['B1']
    b5 = data['competencias']['B']['subdivisions'].get('B5')
    if b5:
        b1['bullets'] = list(dict.fromkeys(b1['bullets'] + b5['bullets']))
        del data['competencias']['B']['subdivisions']['B5']
    b6 = data['competencias']['B']['subdivisions'].pop('B6', None)
    if b6:
        data['competencias']['B']['subdivisions']['B5'] = b6
    data['relatedCompetences'] = {
        'B3': [
            {'codigo': 'A3', 'titulo': data['competencias']['A']['subdivisions']['A3']['title'], 'aderencia': 'alta', 'racional': 'A biotecnologia contribui com microrganismos, processos de biodegradação, bioestimulação, bioaumentação e biorreatores para degradar contaminantes.'},
            {'codigo': 'A6', 'titulo': data['competencias']['A']['subdivisions']['A6']['title'], 'aderencia': 'media', 'racional': 'Separação, filtração e purificação ajudam a tratar correntes contaminadas e a remover sólidos ou produtos após a etapa biológica.'},
            {'codigo': 'A10', 'titulo': data['competencias']['A']['subdivisions']['A10']['title'], 'aderencia': 'alta', 'racional': 'A química analítica identifica contaminantes, acompanha produtos de degradação e comprova o desempenho da remediação.'},
            {'codigo': 'A11', 'titulo': data['competencias']['A']['subdivisions']['A11']['title'], 'aderencia': 'media', 'racional': 'Modelagem, sensores e análise de dados apoiam o diagnóstico, a previsão e o monitoramento das plumas de contaminação.'},
            {'codigo': 'B1', 'titulo': data['competencias']['B']['subdivisions']['B1']['title'], 'aderencia': 'alta', 'racional': 'O monitoramento socioambiental acompanha a evolução da área remediada, dos contaminantes e dos indicadores de recuperação.'},
        ],
    }
    a3 = data['competencias']['A']['subdivisions']['A3']
    a3_correlates = [0, 1, 2, 6]
    for index in a3_correlates:
        bullet = a3['bullets'][index]
        data['relatedCompetences']['B3'].append({
            'codigo': 'A3',
            'titulo': a3['title'],
            'displayTitle': bullet,
            'aderencia': 'alta' if index in (0, 6) else 'media',
            'racional': data['competenceSummaries'].get(bullet, bullet),
        })
    a7 = data['competencias']['A']['subdivisions']['A7']
    a7['title'] = 'Desenvolvimento de Processos'
    a7['bullets'] = [
        bullet for bullet in a7['bullets']
        if data['competenceSummaries'].get(bullet, bullet) != bullet
    ]
    oil_gas = {
        'nome': 'Óleo e Gás',
        'explicacao': 'Cadeia de exploração, produção, processamento e transformação de petróleo e gás, incluindo rotas para combustíveis, produtos químicos e redução de impactos ambientais.',
        'produtos': ['Petróleo e derivados', 'Gás natural', 'Combustíveis renováveis', 'Produtos petroquímicos', 'Soluções para águas e efluentes produzidos'],
        'mercado_br': {'valor': 'Setor estratégico da indústria brasileira de energia e química', 'fonte': 'Descrição setorial para o mapa de competências', 'confianca': 'nao_verificado'},
        'mercado_global': {'valor': 'Mercado global de energia, combustíveis e produtos químicos', 'fonte': 'Descrição setorial para o mapa de competências', 'confianca': 'nao_verificado'},
        'empresas': ['Petrobras', 'Shell', 'Baker Hughes', 'SLB', 'Repsol'],
    }
    if not any(sector['nome'] == oil_gas['nome'] for sector in data['sectorsRight']):
        data['sectorsRight'].append(oil_gas)
    oil_relations = {
        'A3': 'Biotecnologia aplicada a biodegradação, tratamento de efluentes e produção de insumos para a cadeia de óleo e gás.',
        'A4': 'Rotas químicas e termoquímicas para conversão de hidrocarbonetos, gás e CO₂ em produtos e intermediários.',
        'A6': 'Separação e purificação de correntes, produtos e efluentes da cadeia de óleo e gás.',
        'A7': 'Desenvolvimento e aumento de maturidade de processos, produtos e unidades aplicadas ao setor.',
        'A8': 'Catálise para conversão, tratamento e melhoria de desempenho de correntes e produtos de óleo e gás.',
        'A10': 'Caracterização analítica de petróleo, gás, derivados, produtos químicos e matrizes complexas do setor.',
    }
    for code, rationale in oil_relations.items():
        entries = data['subToSectors'].setdefault(code, [])
        if not any(entry['setor'] == oil_gas['nome'] for entry in entries):
            entries.append({'setor': oil_gas['nome'], 'racional': rationale, 'aderencia': 'media'})
    stylesheet = settings.BASE_DIR / 'mapa' / 'static' / 'mapa' / 'css' / 'app.css'
    stylesheet_version = sha256(stylesheet.read_bytes()).hexdigest()[:12]
    return render(request, 'mapa/home.html', {
        'pilot_data': data,
        'feedback_items': feedback_payload(),
        'stylesheet_version': stylesheet_version,
        'script_version': sha256((settings.BASE_DIR / 'mapa' / 'static' / 'mapa' / 'js' / 'app.js').read_bytes()).hexdigest()[:12],
    })
