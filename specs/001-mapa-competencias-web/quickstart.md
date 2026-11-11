# Quickstart: Mapa de Competências Web

## Prerequisites

- Docker Desktop with Compose support.
- Python 3.12 only for local tooling outside containers.
- Repository checked out at the project root.

## Start the application

```powershell
docker compose up --build
```

Open `http://localhost:8000/`.

## Initialize data

In a second terminal:

```powershell
docker compose exec web python manage.py migrate
docker compose exec web python manage.py import_pilot_data data/pilot_map.json
```

The import command must report the number of created/updated entities and finish without duplicate-key errors.

## Automated validation

```powershell
docker compose exec web pytest
```

The suite must cover import counts, navigation routes, connection adherence, explicit exploratory/open states, missing contact fields, JSON contracts and critical keyboard/responsive flows.

## Manual acceptance smoke test

1. Open the home page and confirm the three entry points are visible.
2. Open axis `A`, then subdivision `A1`; verify title, list, teams and connections.
3. Return home, open a sector, follow one P&D branch to a leaf and return using breadcrumbs.
4. Open a raw material and follow one competence connection.
5. Open the team/researcher view and verify blank contact fields are marked pending and cannot be clicked.
6. Repeat the competence flow at a 360px viewport width and using only keyboard focus/Enter/Escape.
7. Stop the database or simulate a failed request and verify the visible retry/error state.

## Production checks

```powershell
docker compose exec web python manage.py check --deploy
```

Before deployment, configure secret key, allowed hosts, database credentials, static files and HTTPS according to the target environment.
