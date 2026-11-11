# Data Model: Mapa de Competências Web

## EixoCompetencia

- `codigo`: string curta, única, normalmente `A`–`E`.
- `titulo`: nome institucional do eixo.
- `descricao`: texto introdutório opcional.
- `ordem`: inteiro para apresentação.
- Relação: possui muitas `SubdivisaoCompetencia`.

## SubdivisaoCompetencia

- `codigo`: string única, normalmente `A1`, `B3` ou `C5`.
- `eixo`: referência obrigatória a `EixoCompetencia`.
- `titulo`: título da subdivisão.
- `descricao`: descrição curta opcional.
- `ordem`: inteiro dentro do eixo.
- Relações: possui muitas `CompetenciaDetalhada`; relaciona-se a `Equipe`, `SetorAplicacao`, `MateriaPrima` e `Pesquisador` por conexões explícitas.
- Validação: código deve começar pelo código do eixo; não pode haver duas subdivisões com o mesmo código.

## CompetenciaDetalhada

- `subdivisao`: referência obrigatória.
- `texto`: descrição da técnica/capacidade.
- `ordem`: inteiro dentro da subdivisão.
- Validação: texto não vazio; preservar acentuação e pontuação da fonte.

## Equipe

- `nome`: único.
- `cor`: token visual estável para a legenda.
- `descricao`: opcional.
- Relação: muitas equipes podem atuar em muitas subdivisões e pesquisadores.

## Pesquisador

- `nome`: obrigatório.
- `funcao`: opcional.
- `email`: opcional, validado quando preenchido.
- `telefone`: opcional, validado/normalizado quando preenchido.
- `areas`: texto ou relação estruturada de áreas associadas.
- `tipo`: liderança ou pesquisador.
- `status_dados`: completo, parcial ou pendente.
- Validação: contato ausente não cria link acionável; não preencher campos com valores fictícios.

## SetorAplicacao

- `nome`: único.
- `descricao`: opcional.
- `ordem`: inteiro.
- `produtos_exemplo`: lista ordenada de textos.
- `empresas_exemplo`: lista ordenada de textos.
- `mercado`: objeto opcional com valor, unidade, fonte, confiança e observação.
- Relações: conexões para matérias-primas, subdivisões e nós de `CaminhoPD`.

## MateriaPrima

- `nome`: único.
- `descricao`: opcional.
- `ordem`: inteiro.
- Relações: conexões para setores e subdivisões.

## CaminhoPD

- `setor`: referência obrigatória.
- `parent`: relação hierárquica opcional para outro caminho.
- `chave`: única dentro do setor e estável para navegação.
- `rotulo`: nome exibido.
- `tipo`: ramo, competência ou matéria-prima.
- `texto`: explicação do caminho.
- `ordem`: inteiro entre irmãos.
- `estado_mapeamento`: mapeado, exploratório ou em_aberto.
- Relações: filhos; conexões para `SubdivisaoCompetencia` e/ou `MateriaPrima`.
- Validação: um nó folha deve possuir destino, ou declarar explicitamente `em_aberto`.

## Conexao

- `origem_tipo` e `origem_id`: entidade de origem.
- `destino_tipo` e `destino_id`: entidade de destino.
- `racional`: motivo da relação.
- `aderencia`: alta, media ou exploratoria.
- `fonte`: referência opcional ao arquivo/registro de origem.
- `ordem`: prioridade de exibição.
- Validação: origem e destino devem existir; racional obrigatório; relações exploratórias devem permanecer identificadas visualmente.

## OrganizacaoCliente

- `nome`: nome da organização.
- `descricao`: opcional.
- `ordem`: inteiro.
- `status_dados`: completo ou pendente.

## Regras de importação

1. O importador deve ser idempotente: uma segunda execução com a mesma fonte não duplica registros.
2. Códigos, chaves e nomes normalizados devem ser usados para atualizar registros existentes.
3. A importação deve falhar de forma explícita se houver códigos duplicados, destinos inexistentes ou contagens incompatíveis com a fonte declarada.
4. A origem bruta deve permanecer versionada em `data/pilot_map.json`; dados derivados devem ser regeneráveis.
