# Tela 08 — Operações Agrícolas: aba Minhas tarefas

Atualizado em 23/10/2026 (ordem das abas: Minhas tarefas, Agenda Agrícola, Central OS). Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Imagem: enviada pela usuária em 21/10/2026 (design da antiga Central de Operações do usuário Fazenda, hoje Minhas tarefas). Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** construída.

## Objetivo
Acompanhar, de todas as fazendas, as operações que precisam de recomendação agronômica e as OS com atraso ou com justificativa pendente, para o agrônomo agir.

## Quando aparece
- Menu lateral **Gestão da Lavoura › Operações Agrícolas**: abre nesta aba (a primeira; depois vêm a Agenda Agrícola, Tela 07, e a Central OS, Tela 09).
- Sem nenhum plano cadastrado: o convite "Crie seu primeiro plano para visualizar…" com "+ Criar Plano de Safra" (como as outras telas).

## Conteúdo
- **Cabeçalho** (o mesmo nas três abas): caminho no topo "⌂ Operações Agrícolas › Minhas tarefas" (o nome da aba aberta), título com o nome da aba, subtítulo e as abas **Minhas tarefas · Agenda Agrícola · Central OS**.
  - Subtítulo de Minhas tarefas: "Operações a recomendar, atrasos e justificativas que aguardam a sua ação."
- **Filtros** num cartão: **Safra** (uma escolha; começa na safra de hoje, ex.: 26/27), **Cultura**, **Empresa**, **Fazenda**, **Grupo de operação** (uma escolha cada, "Todas"/"Todos"; os grupos dos planos publicados da safra, na ordem Plantio, Fertilidade, Defensivo, Colheita), **Data inicial**, **Data final** e **Limpar filtros**. Embaixo, o texto do período, conforme o cartão escolhido:
  - A recomendar e Recomendação em atraso: "O período considera a data planejada das operações."
  - Execução em atraso: "O período considera a data prevista de conclusão das OS."
  - Justificativas solicitadas: "O período considera a data da solicitação de justificativa."
- **Ações:** quatro cartões, cada um com ícone, título, número e subtítulo. O escolhido fica destacado em verde e define o que a tabela mostra.

  | Cartão | Subtítulo | O que conta |
  |---|---|---|
  | **A recomendar** | Aguardando recomendação agronômica das operações planejadas | Operações dos planos publicados ainda sem OS recomendada, com data planejada no período |
  | **Recomendação em atraso** | Data planejada vencida | Operações sem OS recomendada com a data planejada antes de hoje, no período |
  | **Execução em atraso** | Prazo de conclusão vencido | OS em execução com a data prevista de conclusão antes de hoje (abertura + prazo de conclusão), no período |
  | **Justificativas solicitadas** | Aguardando resposta | Justificativas pedidas (**Atraso na recomendação** ou **Atraso na execução**) ainda sem resposta, pela data da solicitação no período |

  O número de cada cartão é o número de linhas que ele mostra na tabela, com os filtros e o período dele.
- **Tabela** com o título do cartão escolhido; à direita, só no cartão A recomendar, a lista suspensa **Hoje · Semana · Quinzena · Mês · Personalizado**. Sem busca e sem mapa. Ordena por qualquer coluna (seta no título; vazios no fim); no empate, pela data e pelo talhão: ordenar por **Operação** junta a mesma operação com as datas em ordem, para ver as que estão próximas e recomendar juntas. A coluna **Operação** é o fator agrupador da recomendação: as linhas da mesma operação (talhões com datas próximas) são recomendadas juntas. Sem paginação: todas as linhas, com **rolagem vertical** dentro da tabela (o título das colunas fica fixo).
  - **A recomendar:** Safra · Cultura · Empresa · Fazenda · Talhão · Área (ha) · Grupo de operação · Operação · Data planejada. **Sem produto e dose**: uma operação pode ter vários produtos; eles aparecem só ao recomendar (modal Recomendar OS).
  - **Recomendação em atraso:** as mesmas + **Dias em atraso** (hoje − data planejada).
  - **Execução em atraso:** Nº OS · Safra · Cultura · Empresa · Fazenda · Talhão · Área (ha) · Grupo de operação · Operação · Data de abertura · Data prevista de conclusão · Dias em atraso.
  - **Justificativas solicitadas:** Nº OS · Fazenda · Talhão · Operação · Motivo da solicitação (Atraso na recomendação ou Atraso na execução) · Data da solicitação · **Solicitada por** (o nome de quem pediu; ao passar o mouse, o perfil, ex.: "Agrônomo corporativo") · Dias aguardando.

## Regras
- **Vários planos somados**, sempre a **última versão publicada de cada plano** (como a Agenda Agrícola).
- **Linhas de operação** (A recomendar e Recomendação em atraso): uma por **talhão × operação**. Data planejada = data de plantio do talhão + DAP (Plantio: a data de plantio; Colheita: plantio + ciclo da variedade).
  - Plantio e Colheita com várias variedades no talhão: uma linha por data, com a área das variedades daquela data.
  - Os nomes dos grupos são os do plano (Plantio, Fertilidade, Defensivo, Colheita).
- **Operação com OS recomendada** (já tem OS) sai de A recomendar e de Recomendação em atraso.
- **Período de cada cartão** (cada cartão guarda o seu; ao trocar de cartão, Data inicial e Data final mostram o período dele):
  - **A recomendar:** a lista suspensa preenche as datas a partir de hoje: **Hoje** (só hoje), **Semana** (hoje + 6 dias), **Quinzena** (hoje + 14 dias), **Mês** (hoje + 29 dias). Abre em **Semana**. Mudar uma data à mão muda a lista para **Personalizado**.
  - **Recomendação em atraso, Execução em atraso e Justificativas solicitadas:** sem a lista; Data inicial e Data final, que abrem da **primeira OS da safra** até **hoje**. No protótipo, sem OS de verdade, a primeira OS é a data planejada da primeira operação da safra escolhida (nos planos publicados, sem olhar os outros filtros).
  - Trocar a Safra recalcula os períodos que começam na primeira OS da safra. **Limpar filtros** volta à safra de hoje, aos filtros em "Todas", aos períodos iniciais e ao cartão A recomendar.
- **Seleção e Recomendar** (A recomendar e Recomendação em atraso): uma **caixa de marcar** em cada linha e, no título da coluna, uma para marcar todas as linhas da lista (todas as páginas). Clicar na linha também marca. Embaixo da tabela, **alinhado à direita**, "N operações marcadas" e o botão **Recomendar**, ativo com ao menos uma linha marcada. Recomendar abre o modal **Recomendar OS** com as linhas marcadas (abas Recomendação agronômica e Execução da fazenda; o agrônomo pode preencher as duas, uma ou nenhuma). **No protótipo, por enquanto, abre "Em construção".** Trocar de cartão desmarca tudo; linha que sai da lista (filtro ou período) sai da seleção.
- **Execução em atraso e Justificativas solicitadas:** sem caixa; clicar na linha abre "Em construção" (o que acontece lá ainda vai ser definido).

## Dados de exemplo (protótipo)
- Em `js/dados-exemplo.js`, `ordensServico`: as **OS de exemplo** da Boa Vista (soja 26/27), com número, operação, talhões, status (recomendada, em execução ou fechada), data de abertura, prazo de conclusão e justificativa pedida (motivo Atraso na recomendação ou Atraso na execução, data, quem pediu, com nome e perfil, e se foi respondida).
- `osFechadasAte`: as operações com data planejada até essa data contam como já feitas (OS fechada), para o exemplo não encher de atrasos antigos.

## Navegação
- Gestão da Lavoura › Operações Agrícolas → esta aba.
- Aba Agenda Agrícola → Tela 07; aba Central OS → Tela 09.
- Recomendar (linhas marcadas) → modal Recomendar OS ("Em construção").

## Sugestões (a validar)
- Filtro Safra com a safra e a safrinha do mesmo ano juntas (hoje são opções separadas: 2026/2027 e 2027/2027).
- Mostrar no título da tabela o período ("A recomendar · 21/10 a 27/10/2026").
