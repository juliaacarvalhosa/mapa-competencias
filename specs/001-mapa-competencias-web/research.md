# Research: Mapa de Competências Web

## Decision: Django 5.2 LTS com Python 3.12

**Rationale**: atende ao pedido explícito de Django, oferece suporte de longo prazo e é compatível com Python 3.12. A documentação oficial classifica Django 5.2 como LTS e lista suporte a Python 3.10–3.14. Fonte: [Django 5.2 release notes](https://docs.djangoproject.com/en/5.2/releases/5.2/).

**Alternatives considered**:

- Django 6.x: tecnicamente possível, mas não é necessário para o MVP e aumentaria o risco de adotar mudanças recentes antes de haver necessidade.
- Framework frontend separado: rejeitado porque o piloto já é uma experiência consultiva e templates Django + JavaScript progressivo reduzem dependências e complexidade operacional.

## Decision: PostgreSQL como armazenamento operacional

**Rationale**: a aplicação terá relacionamentos entre entidades, conexões direcionadas, hierarquia de caminhos e atualização posterior do conteúdo. PostgreSQL oferece uma base consistente para esse modelo e o Django recomenda PostgreSQL para ambientes de produção. Fonte: [Django installation FAQ](https://docs.djangoproject.com/en/5.2/faq/install/).

**Alternatives considered**:

- SQLite: adequado para protótipo local, mas menos apropriado como padrão do ambiente Dockerizado de homologação/produção.
- Somente JSON estático: preservaria o HTML atual, mas dificultaria validação relacional, atualização seletiva e futuras telas de administração.

## Decision: fonte JSON versionada + importador idempotente

**Rationale**: o HTML do piloto já contém um objeto de dados estruturado. Extraí-lo para `data/pilot_map.json` preserva a rastreabilidade da fonte e permite reimportar os dados sem codificar conteúdo em templates. O importador deve usar códigos/chaves estáveis e registrar contagens esperadas.

**Alternatives considered**:

- Manter o objeto JSON embutido no HTML: rejeitado porque mistura conteúdo, apresentação e navegação.
- Digitar todo o conteúdo manualmente em migrations: rejeitado pelo volume e pelo risco de perda de acentuação ou registros.

## Decision: templates Django + JavaScript progressivo + CSS próprio

**Rationale**: preserva acessibilidade básica, entrega HTML inicial indexável e permite reproduzir o comportamento do piloto (breadcrumbs, painéis, aprofundamento e conexões) sem introduzir um pipeline frontend adicional.

**Alternatives considered**:

- SPA com React/Vue: rejeitada para o MVP por adicionar build, dependências e uma fronteira de dados desnecessária.
- HTML estático sem backend: rejeitado porque não atende à evolução para dados atualizáveis e deployment Django solicitado.

## Decision: contratos internos somente leitura

**Rationale**: os fluxos de navegação precisam de dados consistentes para atualizar painéis sem duplicar o conteúdo em cada template. Endpoints JSON internos permitem testes de contrato e deixam aberta a evolução para consumo externo, sem transformar o MVP em uma API pública.

**Alternatives considered**:

- API pública versionada desde o primeiro release: rejeitada por escopo; pode ser adicionada quando houver consumidor externo real.
