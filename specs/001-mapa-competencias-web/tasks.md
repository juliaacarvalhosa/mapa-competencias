---
description: "Task list for implementing the Mapa de Competências Web"
---

# Tasks: Mapa de Competências Web

**Input**: Design documents from `/specs/001-mapa-competencias-web/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: included because the specification defines measurable acceptance flows, data-count validation, API contracts, accessibility and responsive behavior.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Django project, dependency management, containers and environment configuration.

- [ ] T001 Create the Python project metadata and pinned runtime dependencies in `pyproject.toml`
- [ ] T002 [P] Create the Django project entrypoint and settings package in `manage.py` and `config/settings/`
- [ ] T003 [P] Create the initial Django domain app package in `mapa/apps.py`, `mapa/__init__.py`, and `mapa/admin.py`
- [ ] T004 Create the Docker image definition and runtime command in `Dockerfile`
- [ ] T005 [P] Create the web and PostgreSQL services with health checks in `docker-compose.yml`
- [ ] T006 [P] Configure environment examples and local developer commands in `.env.example` and `README.md`
- [ ] T007 [P] Create or update `.gitignore` with Python, virtualenv, Docker, coverage and local secret patterns
- [ ] T008 [P] Create `.dockerignore` with repository metadata, virtualenvs, caches, coverage and local environment files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared data model, import pipeline, routing base and presentation shell required by every user story.

**Checkpoint**: Foundation ready; all user story phases can proceed independently.

- [X] T009 [P] Extract the pilot data object into UTF-8 structured source data in `data/pilot_map.json`
- [ ] T010 [P] Write source validation and expected-count tests in `tests/test_import.py`
- [ ] T011 Implement the relational entities and validation rules from `data-model.md` in `mapa/models.py`
- [ ] T012 Generate and review the initial database migration in `mapa/migrations/0001_initial.py`
- [ ] T013 Implement the idempotent pilot data importer in `mapa/management/commands/import_pilot_data.py`
- [ ] T014 [P] Implement shared connection normalization and adherence labeling in `mapa/services/connections.py`
- [ ] T015 [P] Implement shared navigation and breadcrumb view models in `mapa/services/navigation.py`
- [ ] T016 Configure root and app URL routing in `config/urls.py` and `mapa/urls.py`
- [ ] T017 Create the semantic base template, global metadata and shared layout in `mapa/templates/mapa/base.html`
- [ ] T018 [P] Create the shared visual system, responsive primitives and status styles in `mapa/static/mapa/css/app.css`
- [ ] T019 [P] Create the shared JavaScript state, focus helpers and error-state utilities in `mapa/static/mapa/js/app.js`
- [ ] T020 [P] Configure static files, locale `pt-BR`, timezone and production-safe settings in `config/settings/base.py`, `config/settings/local.py`, and `config/settings/production.py`

---

## Phase 3: User Story 1 - Explorar o mapa por competências (Priority: P1) 🎯 MVP

**Goal**: Allow a visitor to open the home page, navigate through axes and subdivisions, inspect detailed competencies and return through breadcrumbs.

**Independent Test**: Open the home page, select axis `A`, select subdivision `A1`, verify title, competencies, teams and related links, then return home without losing context.

### Tests for User Story 1

- [ ] T021 [P] [US1] Add route and JSON contract tests for home, axis and subdivision responses in `tests/test_navigation.py`
- [ ] T022 [P] [US1] Add browser flow coverage for home → axis → subdivision → home in `tests/e2e/test_critical_flows.py`

### Implementation for User Story 1

- [ ] T023 [US1] Implement home, axis and subdivision view handlers in `mapa/views.py`
- [ ] T024 [US1] Implement the home view and three entry cards in `mapa/templates/mapa/home.html`
- [ ] T025 [US1] Implement axis, subdivision and competence detail templates in `mapa/templates/mapa/detail.html`
- [ ] T026 [US1] Implement readable breadcrumbs, back controls, selection state and keyboard navigation in `mapa/static/mapa/js/app.js`
- [ ] T027 [US1] Implement the pilot visual hierarchy, cards, lists and mobile layout in `mapa/static/mapa/css/app.css`
- [ ] T028 [US1] Implement the internal home, axis and subdivision JSON endpoints in `mapa/views.py` and `mapa/urls.py`
- [ ] T029 [US1] Implement empty, pending, loading and retry states for competence details in `mapa/templates/mapa/detail.html` and `mapa/static/mapa/js/app.js`

**Checkpoint**: User Story 1 is independently usable as the MVP.

---

## Phase 4: User Story 2 - Conectar competências a setores e matérias-primas (Priority: P1)

**Goal**: Allow a visitor to start from a sector or raw material and follow transparent connections to technical competencies.

**Independent Test**: Open a sector and a raw material from home, verify descriptions and related destinations, and confirm each connection displays rationale and adherence.

### Tests for User Story 2

- [ ] T030 [P] [US2] Add JSON contract tests for sector and raw-material profiles in `tests/test_api_contract.py`
- [ ] T031 [P] [US2] Add integration assertions for adherence levels and rationales in `tests/test_navigation.py`

### Implementation for User Story 2

- [ ] T032 [US2] Implement sector and raw-material profile view models in `mapa/services/navigation.py`
- [ ] T033 [US2] Implement sector and raw-material page handlers and JSON responses in `mapa/views.py`
- [ ] T034 [US2] Add sector and raw-material routes in `mapa/urls.py`
- [ ] T035 [US2] Add sector and raw-material profile sections, products, organizations and market data to `mapa/templates/mapa/detail.html`
- [ ] T036 [US2] Add connection cards with destination, rationale and high/medium/exploratory labels in `mapa/templates/mapa/detail.html`
- [ ] T037 [US2] Add sector and raw-material navigation behavior to `mapa/static/mapa/js/app.js`
- [ ] T038 [US2] Add responsive connection grids, market blocks and adherence status styling in `mapa/static/mapa/css/app.css`

**Checkpoint**: User Stories 1 and 2 work independently from the home page.

---

## Phase 5: User Story 3 - Explorar caminhos de P&D e oportunidades futuras (Priority: P2)

**Goal**: Allow a visitor to drill into sector opportunity trees, inspect terminal targets and identify open mappings.

**Independent Test**: Open a sector path, navigate through at least two levels, inspect a leaf with mapped targets or an explicit open state, and return through the path breadcrumbs.

### Tests for User Story 3

- [ ] T039 [P] [US3] Add path-tree contract tests for children, breadcrumbs, terminal targets and open states in `tests/test_api_contract.py`
- [ ] T040 [P] [US3] Add browser coverage for drill-down and back navigation in `tests/e2e/test_critical_flows.py`

### Implementation for User Story 3

- [ ] T041 [US3] Implement path-tree traversal and terminal target resolution in `mapa/services/navigation.py`
- [ ] T042 [US3] Implement path-tree page and JSON handlers in `mapa/views.py`
- [ ] T043 [US3] Add path-tree routes and validation for sector/path identifiers in `mapa/urls.py`
- [ ] T044 [US3] Render path choices, breadcrumb depth, target competence cards and explicit open mapping states in `mapa/templates/mapa/detail.html`
- [ ] T045 [US3] Implement drill-down state, back navigation and focus restoration in `mapa/static/mapa/js/app.js`
- [ ] T046 [US3] Style nested path cards, target panels and exploratory/open status labels in `mapa/static/mapa/css/app.css`

**Checkpoint**: The P&D exploration tree is independently navigable and preserves explicit uncertainty.

---

## Phase 6: User Story 4 - Consultar equipe e carteira de clientes (Priority: P3)

**Goal**: Allow institutional visitors to inspect researchers, valid contact channels and client organizations while exposing incomplete data honestly.

**Independent Test**: Open team and client areas, inspect a researcher with and without contact data, and verify that missing fields are pending and non-actionable.

### Tests for User Story 4

- [ ] T047 [P] [US4] Add researcher and client response tests, including incomplete contact data, in `tests/test_api_contract.py`
- [ ] T048 [P] [US4] Add browser assertions for contact actions, pending fields and client cards in `tests/e2e/test_critical_flows.py`

### Implementation for User Story 4

- [ ] T049 [US4] Implement researcher/team and client portfolio queries in `mapa/services/navigation.py`
- [ ] T050 [US4] Implement researcher/team and client portfolio handlers and JSON responses in `mapa/views.py`
- [ ] T051 [US4] Add team, researcher and client routes in `mapa/urls.py`
- [ ] T052 [US4] Render researcher profiles, valid email/phone actions, pending fields and client cards in `mapa/templates/mapa/detail.html`
- [ ] T053 [US4] Implement contact action guards, panel close behavior and focus return in `mapa/static/mapa/js/app.js`
- [ ] T054 [US4] Style researcher profiles, avatars, team colors, client cards and pending indicators in `mapa/static/mapa/css/app.css`

**Checkpoint**: Team and client information is consultable without inventing incomplete data.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete application against the specification, quickstart and deployment constraints.

- [ ] T055 [P] Add semantic labels, focus-visible states, dialog semantics and non-color status text in `mapa/templates/mapa/base.html`, `mapa/templates/mapa/detail.html`, and `mapa/static/mapa/js/app.js`
- [ ] T056 [P] Add responsive regression coverage at 360px and desktop widths in `tests/e2e/test_critical_flows.py`
- [ ] T057 [P] Add error, empty and retry response tests in `tests/test_navigation.py`
- [ ] T058 Run import count validation and route/API test suite through `docker compose exec web pytest` and fix failures in the affected files
- [ ] T059 Run Django deployment checks through `docker compose exec web python manage.py check --deploy` and address configuration findings in `config/settings/production.py`
- [ ] T060 Run the complete manual smoke test from `specs/001-mapa-competencias-web/quickstart.md` and record any corrective changes in `README.md`
- [ ] T061 [P] Review content encoding, Portuguese labels and source traceability across `data/pilot_map.json`, templates and `mapa/management/commands/import_pilot_data.py`
- [ ] T062 Review all specification requirements against implemented routes, entities, states and acceptance tests in `specs/001-mapa-competencias-web/spec.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: no dependencies; start immediately.
- **Phase 2 Foundational**: depends on Phase 1 and blocks all user stories.
- **Phase 3 US1**: depends on Phase 2 and is the MVP checkpoint.
- **Phase 4 US2**: depends on Phase 2; can run in parallel with US1 when shared files are coordinated.
- **Phase 5 US3**: depends on Phase 2 and the connection model from US2; recommended after US2.
- **Phase 6 US4**: depends on Phase 2 and shared templates/JavaScript; recommended after US1.
- **Phase 7 Polish**: depends on all selected user stories.

### User Story Dependencies

- **US1**: no dependency on another story after the foundation.
- **US2**: no data dependency on US1, but shares navigation, views, templates and CSS files.
- **US3**: uses the connection and sector structures established in US2.
- **US4**: uses shared competence references but remains independently testable.

### Parallel Opportunities

- T002, T003, T005, T006, T007 and T008 can run in parallel after repository inspection.
- T009, T010, T014, T015, T018, T019 and T020 can run in parallel after setup, subject to file ownership.
- Within each story, contract tests and browser tests marked `[P]` can be written in parallel before implementation.
- T030/T031, T039/T040 and T047/T048 are parallel test pairs within their story phases.
- T055, T056, T057 and T061 can run in parallel during polish.

## Implementation Strategy

### MVP First

1. Complete Phases 1 and 2.
2. Complete Phase 3, User Story 1.
3. Run the independent MVP test and the import count validation.
4. Demonstrate the competence navigation before adding sector, P&D and team extensions.

### Incremental Delivery

1. Add US2 to connect sectors and raw materials.
2. Add US3 to expose opportunity trees and open mappings.
3. Add US4 for researchers and client portfolio.
4. Complete cross-cutting accessibility, responsive and deployment validation.

### Format Validation

All implementation tasks use the required checklist format: `- [ ]`, sequential `T###` identifier, optional `[P]` marker, required `[US#]` marker for story tasks, and an explicit file path.
