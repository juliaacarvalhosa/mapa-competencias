# Guia de Design — Tema Firjan

## 1. Arquivos entregues
| Arquivo | O que é | Onde colocar no Django |
|---|---|---|
| `dashboard.css` | CSS original + **camada "TEMA FIRJAN"** no final | `static/` (mesmo lugar do CSS atual) |
| `dashboard.js` | Igual ao original, só a paleta dos gráficos (`COLORS`, linha 5) foi trocada | `static/` |
| `img/textura-header.jpg` | Textura de ondas tirada do fundo da logo (sem emenda, 1600×480) | `static/img/` — **ao lado** do CSS, numa pasta `img/` |
| `preview-header.png` | Prévia do cabeçalho | apenas referência |

> O caminho da textura é relativo ao CSS: `url("img/textura-header.jpg")`, na variável `--texture` (no topo da camada de tema). Se mudar a pasta, altere só essa linha.

## 2. Fontes (adicionar no `<head>` do template base)
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Semi+Condensed:wght@600;700&display=swap" rel="stylesheet">
```
- **Barlow Semi Condensed** → títulos (h1–h3, nome da marca, títulos de seção)
- **Barlow** → texto e números

## 3. Como o CSS está organizado
1. **Parte original** (linhas iniciais): estrutura, grades, espaçamentos, responsivo, impressão. Não foi mexida.
2. **Camada "TEMA FIRJAN"** (final do arquivo, a partir do comentário `TEMA FIRJAN`): só aparência — cores, cantos, sombras, textura. Por vir depois, ela sobrepõe a parte original. Para voltar ao visual antigo, basta apagar esse bloco.

Ordem dentro da camada de tema:
| Bloco | Seletores principais |
|---|---|
| Tokens (cores, raio, sombras, textura) | `:root` |
| Tipografia | `h1,h2,h3`, `.eyebrow` |
| Botões e campos | `button`, `.button.primary`, `input`, foco |
| **Header com textura** | `.topbar`, `.topbar::after` (faixa laranja), `.brand-mark`, `.data-status`, `.nav-strip a` |
| Conteúdo | `.page-heading` (traço laranja sob o h1), `.card`, `.section` |
| KPIs | `.metric` (barra superior azul + laranja) |
| Tabelas | `thead th` (azul), linhas zebradas, destaque GPA/ISI em laranja claro |
| Status | `.badge`, `.alert`, `.unit-pill` |
| Home | `.hero-image`, `.home-links a` |
| Login | `.login-layout` (fundo com textura), `.login-card` |
| Rodapé | `.footer` |

## 4. Paleta
| Token | Cor | Uso |
|---|---|---|
| `--navy` / `--brand-blue` | `#164194` Azul Firjan | header, títulos, cabeçalho de tabela |
| `--navy-2` / `--navy-3` | `#0f2f6e` / `#0a2152` | sombras do header, rodapé |
| `--blue-soft` | `#e8eefa` | hover de botões e linhas |
| `--orange` | `#E84910` Laranja Firjan | botão principal, faixa do header, aba ativa, destaques |
| `--orange-2` | `#c93c08` | hover do botão principal |
| `--orange-soft` | `#fdeee7` | linhas destacadas, fundos de alerta |
| `--canvas` / `--paper` | `#f4f6fa` / `#fff` | fundo da página / cartões |
| `--ink` / `--muted` / `--line` | `#14213d` / `#5b6b82` / `#dfe5ef` | texto / texto secundário / bordas |

Gráficos (`dashboard.js`): azul, laranja, azul claro, laranja claro, azul escuro, azul acinzentado, cinza.

## 5. Regra de uso das cores
- **Azul** = estrutura e informação (≈80% da tela).
- **Laranja** = ação e destaque (botão principal, item ativo, detalhes). Use com moderação.

## 6. Header
Fundo: degradê azul translúcido **sobre** a textura de ondas, sobre o azul Firjan. Abaixo dele, faixa laranja de 4px. Para deixar a textura mais/menos visível, ajuste as opacidades (`.35` e `.55`) no `linear-gradient` de `.topbar`.
