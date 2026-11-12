import json
from hashlib import sha256
from django.conf import settings
from django.shortcuts import render


def home(request):
    with (settings.BASE_DIR / 'data' / 'pilot_map.json').open(encoding='utf-8') as source:
        data = json.load(source)
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
        'stylesheet_version': stylesheet_version,
        'script_version': sha256((settings.BASE_DIR / 'mapa' / 'static' / 'mapa' / 'js' / 'app.js').read_bytes()).hexdigest()[:12],
    })
