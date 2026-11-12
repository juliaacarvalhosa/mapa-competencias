# Mapa de Competências — Firjan SENAI · Estrutura do Layout

## 1. Identidade visual
| Token | Valor | Uso |
|---|---|---|
| Azul Firjan SENAI | `#0047B6` | Cabeçalho, títulos de seção, botões, destaques, links |
| Azul profundo | `#00337F` | Estado hover de botões |
| Azul névoa | `#EEF4FD` | Fundos de tags, códigos, botões secundários |
| Branco | `#FFFFFF` | Fundo da página e dos cartões |
| Tinta | `#0B1B3A` | Texto principal |
| Tinta suave | `#5B6B85` | Textos de apoio |
| Linha | `#E3E9F3` | Bordas de cartões e divisores |

- **Tipografia:** Manrope (400–800) para títulos e textos; JetBrains Mono para códigos, metadados e contagens.
- **Raios:** 10px (itens), 14px (cartões), 20px (cartões grandes), pílula (tags e botões).
- **Sombra:** azulada e sutil, aparece apenas no hover.
- **Movimento:** cartões sobem 2px no hover (0,18s); painel lateral desliza da direita.
- Modo escuro removido — visual sempre azul e branco.

## 2. Estrutura geral
```text
┌──────────────────────────────────────────────────────────┐
│ CABEÇALHO FIXO (fundo azul #0047B6, texto branco)         │
│  Marca: título · selo GRT·GPD · gerência · institutos     │
│                                      Trilha de navegação  │
├──────────────────────────────────────────────────────────┤
│ CONTEÚDO (largura máx. 1200px, margens 24px)              │
│  Título da página (38px, 800) + barra azul 40×4px         │
│  Descrição (16px, até 62 caracteres por linha)            │
│  [Grade específica da tela]                               │
│  Rodapé de notas (linha superior fina)                    │
└──────────────────────────────────────────────────────────┘
          PAINEL LATERAL (abre sobre a página, à direita)
```

## 3. Telas
### 3.1 Início — três portas de entrada
Grade de 3 colunas (1fr · 1.3fr · 1fr), empilhada abaixo de 900px.
- **Matérias-primas** (esquerda): lista de itens clicáveis.
- **Competências** (centro): cartões grandes com letra (A, B, C…) em azul 52px, nome e nº de subdivisões.
- **Aplicações** (direita): lista de setores de mercado.
- Rótulos de coluna: maiúsculas, 11,5px, espaçamento largo, azul.

### 3.2 Competência (letra)
Grade 180px · 1fr · 180px: matérias-primas relacionadas | cartões de subdivisão | aplicações relacionadas.
- Cartão de subdivisão: código em selo azul-névoa (ex.: `A1`), título, pontos coloridos das equipes, contagem.
- Faixa horizontal de etapas (pílulas que ficam azuis no hover).

### 3.3 Matéria-prima / Aplicação
- Link "← Voltar ao início" + eyebrow do tipo.
- **Caminhos de P&D:** cartões com borda esquerda colorida (Novo · Modificação · Reciclagem).
- **Exemplos de produtos:** tags em pílula.
- **Tamanho de mercado:** cartões Brasil/Global com selo de confiança (alta, estimativa, não verificado) e fonte em itálico.
- **Empresas / clientes:** grade de cartões.

### 3.4 Painel lateral (detalhe)
- Largura até 560px, borda esquerda azul 4px, fundo escurecido com desfoque.
- Topo: eyebrow azul + título + botão fechar redondo.
- Tags de equipes, lista de tópicos (marcador quadrado azul), botões de ação.
- Pesquisador/equipe: avatar circular azul, nome, cargo, linhas de contato, botões E-mail (azul) e WhatsApp.

## 4. Componentes
| Componente | Estado normal | Hover |
|---|---|---|
| Item de lista / chip | Branco, borda cinza-azulada | Borda azul, sombra, sobe 2px |
| Cartão de competência | Gradiente branco → `#F7FAFF` | Borda azul, sombra |
| Botão primário | Azul `#0047B6`, texto branco, pílula | `#00337F` |
| Botão secundário | Azul-névoa, texto azul | — |
| Tag | Azul-névoa, texto azul 600 | — |
| Nota informativa | Fundo `#F5F8FE`, filete azul à esquerda | — |

## 5. Responsividade
- **> 900px:** grades de 3 colunas.
- **≤ 900px:** colunas empilhadas.
- **≤ 760px:** cartões de letra em coluna única.
- **≤ 600px:** painel ocupa tela inteira; título 28px; margens 16px.
