# Contract: Internal Read-Only Data API

The browser may request JSON from the Django application for progressive navigation. These endpoints are internal application contracts, not a public API commitment.

## Common rules

- Prefix: `/mapa/api/`
- Content type: `application/json; charset=utf-8`
- Language: `pt-BR`
- Unknown identifiers return `404` with `{ "detail": "..." }`.
- Empty collections return `200` with an empty array, never `null`.
- Missing optional fields are represented by `null` or an explicit `status_dados`, never fabricated values.

## Endpoints

### `GET /mapa/api/home`

Returns the three entry collections: `eixos`, `setores`, and `materias_primas`.

### `GET /mapa/api/eixos/{codigo}`

Returns the axis and ordered subdivisions, including counts of detailed competencies.

### `GET /mapa/api/subdivisoes/{codigo}`

Returns the subdivision, detailed competencies, teams, related sectors, related raw materials and connection summaries.

### `GET /mapa/api/setores/{slug}`

Returns sector profile, products, companies, market data, available P&D root nodes and related competence connections.

### `GET /mapa/api/materias-primas/{slug}`

Returns raw material profile and related sectors/competence connections.

### `GET /mapa/api/pesquisadores?origem={codigo}`

Returns matching researchers. Contact actions are included only for valid, populated fields.

### `GET /mapa/api/caminhos/{setor}/{path}`

Returns the current P&D node, ordered children, breadcrumb path and terminal targets. A node without a mapped target must return `estado_mapeamento: "em_aberto"`.

## Error and empty states

- `404`: entity or path not found.
- `422`: malformed path or invalid query parameter.
- `500`: generic error response without database or stack details.
- Frontend must map these responses to a visible retry/return state.
