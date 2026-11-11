# Implementation Plan: Mapa de Competências Web

**Branch**: `001-mapa-competencias-web` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-mapa-competencias-web/spec.md`

## Summary

Reproduzir o mapa de competências do piloto como uma aplicação web consultiva, preservando as três portas de entrada (competências, setores e matérias-primas), as conexões de P&D, os perfis de pesquisadores e os estados de dados pendentes. A implementação será um monólito Django com templates server-rendered, endpoints JSON somente leitura para navegação progressiva, CSS próprio e JavaScript sem framework. O conteúdo será carregado de uma fonte estruturada e persistido em PostgreSQL para permitir atualização sem reescrever a interface.

## Technical Context

**Language/Version**: Python 3.12; Django 5.2 LTS

**Primary Dependencies**: Django, psycopg, pytest-django, Playwright para smoke tests de navegador

**Storage**: PostgreSQL; JSON de origem versionado para importação inicial e reimportação controlada

**Testing**: testes unitários e de integração com pytest-django; testes de acessibilidade e navegação crítica com Playwright; validação de importação por contagens e chaves

**Target Platform**: servidor Linux em containers Docker, acessado por navegadores modernos em desktop e dispositivos móveis

**Project Type**: aplicação web monolítica Django com interface consultiva pública

**Performance Goals**: primeira página e transições principais em até 3 segundos em 95% das tentativas de teste; navegação sem recarregamento completo quando houver dados já carregados

**Constraints**: português do Brasil e acentuação preservados; sem autenticação no MVP; dados ausentes não podem ser inventados; layout operável a partir de 360px; sem dependência de framework de frontend ou build complexo

**Scale/Scope**: 5 eixos, 33 subdivisões, aproximadamente 295 competências detalhadas, 14 setores, 7 matérias-primas, 5 lideranças e 60 pesquisadores; leitura pública e baixo volume de edição

## Constitution Check

Não há gates ratificados: `.specify/memory/constitution.md` ainda contém apenas o template padrão. O plano adota como gates operacionais os requisitos da especificação: dados completos e rastreáveis, testes dos fluxos P1, acessibilidade dos controles essenciais, responsividade mínima de 360px e estados explícitos de vazio/erro/pendência. Não há violação constitucional a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/001-mapa-competencias-web/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- data-api.md
|   `-- ui-navigation.md
`-- tasks.md             # gerado posteriormente por $speckit-tasks
```

### Source Code (repository root)

```text
config/
|-- settings/
|-- urls.py
`-- wsgi.py
mapa/
|-- admin.py
|-- apps.py
|-- models.py
|-- urls.py
|-- views.py
|-- services/
|   |-- navigation.py
|   `-- connections.py
|-- management/commands/import_pilot_data.py
|-- templates/mapa/
|   |-- base.html
|   |-- home.html
|   `-- detail.html
|-- static/mapa/css/app.css
`-- static/mapa/js/app.js
data/pilot_map.json
tests/
|-- test_import.py
|-- test_navigation.py
|-- test_api_contract.py
`-- e2e/test_critical_flows.py
Dockerfile
docker-compose.yml
manage.py
pyproject.toml
README.md
```

**Structure Decision**: monólito Django com um único app de domínio (`mapa`), templates e assets no mesmo projeto, dados de origem versionados e banco relacional para consulta. A interface utiliza HTML semântico renderizado no servidor e JavaScript progressivo para painéis, breadcrumbs, aprofundamento de árvores e conexões. A separação `services/` concentra montagem de view models e regras de conexão para evitar lógica de negócio espalhada em templates.

## Complexity Tracking

Nenhuma violação constitucional ou complexidade excepcional foi identificada.
