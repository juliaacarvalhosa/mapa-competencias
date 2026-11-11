# Feature Specification: Mapa de Competências Web

**Feature Branch**: `001-mapa-competencias-web`

**Created**: 2026-11-11

**Status**: Draft

**Input**: User description: "Nos arquivos \"Mapa de Competências GPA — Piloto (Copy).html\" e \"Mapa de Competências GPA — Piloto (Copy).md\" tenho a estruturação de um mapa de competencias gerado pelo claude e gostaria de reproduzilo em um projeto django, dockerizado, estilização utilizando css e js."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explorar o mapa por competências (Priority: P1)

Como visitante do Centro de Tecnologia da Firjan SENAI SESI, quero navegar pelos eixos de competências e suas subdivisões para entender as capacidades técnicas disponíveis e encontrar detalhes de interesse.

**Why this priority**: É a função central do mapa e entrega valor mesmo sem consultar setores, matérias-primas ou contatos.

**Independent Test**: Abrir o mapa, selecionar um eixo, selecionar uma subdivisão e verificar que são exibidos título, descrição, lista de competências, equipes relacionadas e links para conexões disponíveis.

**Acceptance Scenarios**:

1. **Given** que o visitante está na página inicial, **When** seleciona um dos eixos do mapa, **Then** vê as subdivisões daquele eixo com seus códigos, títulos e quantidade de competências.
2. **Given** que o visitante está na lista de subdivisões, **When** seleciona uma subdivisão, **Then** vê suas competências detalhadas, equipes associadas e caminhos relacionados.
3. **Given** que uma subdivisão possui pesquisadores vinculados, **When** o visitante solicita os responsáveis, **Then** vê os perfis correspondentes e os meios de contato disponíveis, ocultando campos não preenchidos.

### User Story 2 - Conectar competências a setores e matérias-primas (Priority: P1)

Como visitante que busca uma oportunidade de pesquisa aplicada, quero partir de um setor de mercado ou de uma matéria-prima e chegar às competências técnicas relacionadas.

**Why this priority**: O diferencial do piloto é permitir que o mesmo conhecimento seja explorado por diferentes perspectivas de P&D, aproximando capacidade interna e demanda externa.

**Independent Test**: A partir da página inicial, abrir um setor e uma matéria-prima, navegar pelas conexões apresentadas e confirmar que cada destino leva a uma competência ou caminho relacionado.

**Acceptance Scenarios**:

1. **Given** que o visitante está na página inicial, **When** seleciona um setor de aplicação, **Then** vê sua descrição, exemplos de produtos, empresas relacionadas, informações de mercado quando disponíveis e competências conectadas.
2. **Given** que o visitante está na página inicial, **When** seleciona uma matéria-prima, **Then** vê sua descrição, setores relacionados e competências que podem ser aplicadas.
3. **Given** que uma conexão possui grau de aderência, **When** ela é exibida, **Then** o mapa apresenta o nível de aderência e o racional da relação.

### User Story 3 - Explorar caminhos de P&D e oportunidades futuras (Priority: P2)

Como visitante que avalia novas frentes de inovação, quero explorar árvores de aplicações e caminhos de P&D para compreender possibilidades que vão além das competências já consolidadas.

**Why this priority**: Ajuda a transformar o inventário de competências em uma ferramenta de descoberta de oportunidades, sem comprometer o núcleo do mapa.

**Independent Test**: Abrir uma categoria de setor, aprofundar seus ramos até uma folha e retornar pelos níveis, verificando que as conexões e indicações de aderência permanecem coerentes.

**Acceptance Scenarios**:

1. **Given** que uma categoria possui níveis de aprofundamento, **When** o visitante seleciona um ramo, **Then** vê as opções do próximo nível e uma forma clara de retornar ao nível anterior.
2. **Given** que um caminho possui competências técnicas mapeadas, **When** o visitante chega ao nível final, **Then** vê as competências-alvo, o racional e o grau de aderência de cada conexão.
3. **Given** que um caminho ainda não possui uma competência específica, **When** o visitante o acessa, **Then** recebe uma indicação explícita de que o mapeamento está em aberto, sem que o sistema invente uma relação.

### User Story 4 - Consultar equipe e carteira de clientes (Priority: P3)

Como visitante institucional, quero consultar a equipe de pesquisa e a carteira de clientes para identificar interlocutores e evidências de atuação do centro.

**Why this priority**: Reforça a confiança e facilita o contato, mas não é necessária para a primeira exploração do mapa.

**Independent Test**: Abrir a área de equipe e a carteira de clientes, localizar registros, consultar informações disponíveis e validar que dados pendentes são identificados de forma clara.

**Acceptance Scenarios**:

1. **Given** que o visitante abre a área da equipe, **When** seleciona um perfil, **Then** vê nome, função, áreas relacionadas e os contatos preenchidos.
2. **Given** que um perfil possui contato válido, **When** o visitante seleciona o canal de contato, **Then** o sistema abre o canal correspondente com uma mensagem contextualizada.
3. **Given** que um registro possui dados incompletos, **When** ele é exibido, **Then** os campos ausentes aparecem como pendentes, sem gerar valores fictícios.

### Edge Cases

- Quando uma conexão não tiver dados suficientes para ser sustentada, ela deve ser apresentada como exploratória ou não exibida, conforme a classificação disponível.
- Quando uma competência, setor, matéria-prima ou pesquisador não tiver conexões, a interface deve informar que não há relações detalhadas no momento e manter uma navegação de retorno.
- Quando e-mail ou telefone estiver ausente ou inválido, o canal correspondente não deve ser acionável e o usuário deve continuar podendo consultar o restante do perfil.
- Quando o conteúdo for aberto em tela estreita, cards, listas, painéis e navegação devem permanecer legíveis e operáveis sem rolagem horizontal obrigatória.
- Quando o usuário fechar um painel ou usar o botão de voltar, o estado anterior deve ser preservado o suficiente para retomar a exploração sem perder o contexto.
- Quando houver erro de carregamento dos dados, a aplicação deve mostrar uma mensagem compreensível e uma opção de tentar novamente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST apresentar uma página inicial com a identidade institucional e três portas de entrada: competências, setores de aplicação e matérias-primas.
- **FR-002**: O sistema MUST organizar as competências em eixos, subdivisões, códigos, títulos, descrições, listas de capacidades e equipes relacionadas.
- **FR-003**: O sistema MUST permitir navegação de ida e volta entre a página inicial, eixos, subdivisões, itens, caminhos de P&D e detalhes relacionados.
- **FR-004**: O sistema MUST permitir consultar, para uma subdivisão, as competências correlacionadas, setores aplicáveis, matérias-primas relacionadas e pesquisadores responsáveis quando esses dados existirem.
- **FR-005**: O sistema MUST apresentar os setores de aplicação com descrição, camadas de exploração, exemplos de produtos, empresas relacionadas e dados de mercado disponíveis na fonte.
- **FR-006**: O sistema MUST apresentar as matérias-primas com descrição e conexões para setores e competências relacionadas.
- **FR-007**: O sistema MUST representar conexões entre entidades com destino, racional e nível de aderência, distinguindo relações altas, médias e exploratórias.
- **FR-008**: O sistema MUST permitir aprofundar árvores de caminhos de P&D, retornar ao nível anterior e identificar quando um caminho está sem competência específica mapeada.
- **FR-009**: O sistema MUST oferecer consulta da equipe de pesquisa, incluindo lideranças e pesquisadores, com áreas de competência e informações de contato preenchidas.
- **FR-010**: O sistema MUST oferecer uma carteira de clientes/organizações relacionada ao mapa, com os dados existentes na fonte.
- **FR-011**: O sistema MUST representar dados incompletos como pendentes e MUST NOT preencher lacunas com informações inventadas ou estimadas sem indicação explícita.
- **FR-012**: O sistema MUST manter a navegação utilizável em dispositivos móveis e desktops, incluindo controles de retorno, fechamento de painéis e foco visual do item selecionado.
- **FR-013**: O sistema MUST oferecer contraste, hierarquia visual, textos alternativos quando houver imagens e operação por teclado para os controles interativos essenciais.
- **FR-014**: O sistema MUST preservar a acentuação e o idioma português do Brasil nos conteúdos, rótulos e mensagens visíveis.
- **FR-015**: O sistema MUST separar o conteúdo do mapa de sua apresentação para permitir atualização futura de competências, equipes, conexões e dados institucionais sem reescrever todos os fluxos de navegação.
- **FR-016**: O sistema MUST fornecer estados de carregamento, vazio e erro compreensíveis para qualquer consulta que não possa ser exibida imediatamente.

### Key Entities

- **Eixo de competência**: agrupador principal identificado por letra, título e descrição.
- **Subdivisão de competência**: capacidade técnica detalhada associada a um eixo, com código, título, itens, equipes e conexões.
- **Competência detalhada**: atividade, técnica ou capacidade específica apresentada dentro de uma subdivisão.
- **Setor de aplicação**: segmento de mercado com descrição, produtos, organizações, dados de mercado e relações com competências.
- **Matéria-prima**: insumo ou base técnica com descrição e relações com setores e competências.
- **Caminho de P&D**: estrutura hierárquica de exploração de oportunidades, podendo conter ramos, folhas, alvos técnicos e aderência.
- **Pesquisador**: pessoa responsável ou integrante da equipe, com nome, função, áreas, contatos e status de preenchimento.
- **Equipe**: grupo de pesquisa associado a competências, com identificação visual e relação com pesquisadores.
- **Organização cliente**: empresa ou instituição pertencente à carteira apresentada pelo mapa.
- **Conexão**: relação entre entidades do mapa, contendo destino, racional e grau de aderência.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste de aceitação, pelo menos 95% dos participantes conseguem sair da página inicial, abrir uma competência e retornar à página inicial sem orientação externa.
- **SC-002**: Em teste de aceitação, pelo menos 90% dos participantes conseguem chegar de um setor ou matéria-prima a uma competência relacionada em até 3 minutos.
- **SC-003**: O mapa reproduz integralmente, sem perda de registros, os 5 eixos, 33 subdivisões, 14 setores, 7 matérias-primas, 5 lideranças e 60 pesquisadores presentes nos dados do piloto, ressalvadas correções aprovadas de conteúdo.
- **SC-004**: Pelo menos 95% das conexões exibidas no piloto apresentam destino e racional identificáveis; relações sem sustentação suficiente são marcadas como exploratórias ou omitidas.
- **SC-005**: Em telas com largura de 360 pixels ou superior, todos os fluxos P1 permanecem operáveis sem exigir zoom ou rolagem horizontal.
- **SC-006**: Pelo menos 90% dos usuários de teste avaliam como claro o caminho de navegação e conseguem identificar quando um dado está pendente, ausente ou exploratório.
- **SC-007**: A abertura da página inicial e a transição entre telas do mapa ocorrem em até 3 segundos em uma conexão residencial comum, em pelo menos 95% das tentativas de teste.
- **SC-008**: Os fluxos essenciais podem ser executados integralmente por teclado e são compreensíveis por leitores de tela em uma avaliação de acessibilidade dos controles principais.

## Assumptions

- O conteúdo do HTML fornecido é a fonte inicial de verdade para estrutura, navegação e dados do piloto; o arquivo Markdown é tratado como referência institucional complementar.
- A primeira versão é pública para consulta e não exige autenticação nem edição de conteúdo por visitantes.
- A primeira versão prioriza consulta e descoberta; cadastro, busca textual global, filtros avançados, analytics e painel administrativo editorial ficam fora do escopo inicial.
- E-mails, telefones, associações de áreas e dados de mercado podem estar incompletos; a interface deve preservar essa transparência.
- A experiência deve manter a identidade visual do piloto, incluindo linguagem editorial, hierarquia de títulos, cartões, conexões e modo claro/escuro quando aplicável, sem exigir cópia literal de cada detalhe visual.
- Os dados devem poder ser atualizados por uma fonte estruturada mantida pelo projeto, sem depender da edição manual de dezenas de telas.
- A entrega será uma aplicação web implantável em ambiente conteinerizado; decisões de framework, banco, organização de arquivos e pipeline ficam para o plano técnico.
