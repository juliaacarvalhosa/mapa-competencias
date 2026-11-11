# Contract: UI Navigation

## Navigation states

The application supports these canonical states:

- `home`: three entry points and institutional header.
- `eixo/{codigo}`: ordered subdivisions for one competence axis.
- `subdivisao/{codigo}`: detailed competence and connections.
- `setor/{slug}`: sector profile and P&D paths.
- `materia-prima/{slug}`: raw material profile and connections.
- `caminho/{setor}/{path}`: one level of a P&D tree.

## Required controls

- Every non-home state exposes a visible return action and breadcrumb.
- Modal/panel content exposes a close button, Escape handling and focus return to the triggering control.
- Cards and links have accessible names that include the entity title.
- A selected connection exposes destination, rationale and adherence level.
- Empty, pending and exploratory states use distinct labels and explanatory text.

## Responsive behavior

- At 360px viewport width, cards collapse to one column where necessary.
- No essential action depends on hover.
- Long competence descriptions wrap without clipping.
- Tables or market details may stack into labeled blocks on narrow screens.

## Theme behavior

- Light theme is the default.
- Dark theme is optional for MVP but the color system must not encode status by color alone.
- Status labels (alta, média, exploratória, pendente, em aberto) remain understandable without color perception.
