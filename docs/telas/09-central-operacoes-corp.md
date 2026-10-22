# Tela 09 — Operações Agrícolas: aba Central de Operações

Atualizado em 22/10/2026. Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Imagens: enviadas pela usuária em 21/10/2026 (cartões Visão geral, gráficos Status da OS e Nº OS por Empresa, tabela Ordens de Serviço e o filtro Status da ação). Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** construída (direto no HTML, sem passar pelo Claude Design).

## Objetivo
Dar ao gestor a visão de todas as OS das fazendas: quantas, em que status, quanto atraso, por empresa, fazenda ou executor, e pedir justificativa das OS com atraso.

## Quando aparece
- Menu **Gestão da Lavoura › Operações Agrícolas**, aba **Central de Operações** (a segunda; a primeira é Minhas tarefas, Tela 08). Sem perfis de usuário por enquanto.

## Conteúdo
- **Cabeçalho e layout:** os mesmos da Tela 08 (caminho, título, subtítulo, abas Minhas tarefas · Central de Operações · Agenda Agrícola, etiqueta "Últimas versões publicadas"; mesmo CSS).
- **Filtros:** os mesmos da Tela 08: Safra, Cultura, Empresa, Fazenda, Grupo de operação, Data inicial, Data final e Limpar filtros. O período abre da primeira operação da safra até hoje + 30 dias e considera a data de abertura das OS (nas operações ainda planejadas, a data planejada); o texto embaixo dos filtros diz isso.
- **Visão geral:** cinco cartões: **Total de OS** (recomendadas, em execução e fechadas; as planejadas ainda não são OS) · **Fechadas** (% do total de OS) · **Em execução** (% do total de OS) · **Atraso médio** (dias, entre as OS em execução) · **Maior atraso** (dias, entre as OS em execução).
- **Gráficos** (barras verticais, valor em cima):
  - **Status da OS:** Planejada | Com recomendação (a Recomendada no prazo) | Sem recomendação (a Recomendada com atraso) | Em execução · No prazo | Em execução · Em atraso | Fechada · No prazo | Fechada · Em atraso (os mesmos nomes no filtro e na coluna Status OS da tabela). No eixo, dois níveis: embaixo de cada barra, a parte curta (Planejada, Com, Sem, No prazo, Em atraso); na linha de baixo, o grupo (Recomendação, Em execução, Fechada) com um traço sobre as barras dele. O nome completo aparece ao passar o mouse na barra. Selecionar um status atualiza o outro gráfico e a tabela.
  - **Nº OS por Empresa | Total:** Métrica "Nº de OS"; Nível **Empresa | Fazenda | Executor**. Selecionar uma barra filtra a tabela; selecionar de novo tira o filtro.
- **Tabela Ordens de Serviço** ("Todas as Ordens de Serviço"):
  - Busca por Nº OS, **Status OS** e **Status da ação** (Todos · Pendente de notificação · Notificação enviada).
  - Botões **Notificar selecionadas (N)** (ativo com ao menos uma OS marcada) e **Exportar CSV**.
  - Colunas, todas ordenáveis: caixa de marcar · Nº OS · Safra · Empresa · Fazenda · Talhão · Cultura · Grupo de operação · Operação · Executor · Data de abertura · Data de conclusão prevista · Data de fechamento · Dias de atraso · Status OS · Status da ação. Abre ordenada por Dias de atraso (maior primeiro).
  - Uma linha por talhão (uma OS com dois talhões tem duas linhas). As operações ainda planejadas entram na tabela, sem Nº OS e sem executor.
  - Caixa de marcar só nas linhas **com atraso** e **pendentes de notificação**.
  - Rolagem vertical, título das colunas fixo, sem paginação (como na Tela 08). Embaixo, "N registros · N linhas (uma por talhão)".

## Regras
- **Notificar selecionadas:** pede a **justificativa** das OS marcadas. Elas passam a **Notificação enviada** e aparecem em Minhas tarefas (Tela 08), no cartão **Justificativas solicitadas**, com o motivo (Atraso na recomendação ou Atraso na execução) e **Solicitada por** = o usuário do rodapé ("Unisystem").
- **Executor:** informado no modal **Recomendar OS** (ainda a construir). Nas OS de exemplo, já vem preenchido (ex.: "Equipe Beta").

## Dados de exemplo (protótipo)
- As OS de exemplo são **geradas a partir dos planos publicados**, por uma regra fixa (sem sorteio): toda operação planejada até `osFechadasAte` (12/10/2026) vira uma OS **fechada**, com número (código da safra + sequência, ex.: 11013), executor (`executores`), abertura na data planejada e conclusão prevista pelo prazo da operação; uma em cada cinco fechou com atraso (1 a 4 dias). As OS escritas à mão em `ordensServico` (com executor e data de fechamento) continuam valendo e mandam sobre as geradas. As operações depois de 12/10 sem OS ficam como planejadas. Os números da Central da Fazenda não mudam.
- Justificativa pedida numa OS gerada: ela passa para `ordensServico`. Numa operação ainda planejada: vai para `justificativasOperacoes` e aparece na Central da Fazenda sem Nº OS.

- **Status de cada linha e Dias de atraso:**
  - **Planejada** (operação ainda sem OS, data planejada ainda não chegou): sem atraso e sem divisão em no prazo / com atraso (o planejamento é automático). Passou a data planejada sem recomendação: entra em **Sem recomendação**, sem Nº OS, com atraso = hoje − data planejada.
  - **Recomendada** (OS que ainda não chegou na data de abertura): atraso = data de abertura − data planejada (recomendada depois da data).
  - **Em execução** (chegou a data de abertura, automático): atraso = hoje − data de conclusão prevista (abertura + prazo de conclusão).
  - **Fechada:** atraso = data de fechamento − data de conclusão prevista.
  - Em execução e Fechada: com atraso maior que zero, "· Em atraso"; senão, "· No prazo". Recomendada: com atraso, **Sem recomendação**; senão, **Com recomendação**.
- **Contagem nos cartões e gráficos:** OS distintas (pelo número); operação planejada conta uma por talhão.
- **Status da ação:** "Pendente de notificação" nas linhas com atraso ainda sem justificativa pedida; "Notificação enviada" nas que já têm; "—" nas demais.
- **Motivo da justificativa pedida:** Sem recomendação → **Atraso na recomendação**; Em execução ou Fechada com atraso → **Atraso na execução**. "Solicitada por" = o usuário do rodapé; a data é a de hoje.
- **Exportar CSV:** as linhas da tabela (com os filtros e a ordem dela), todas as colunas, separadas por ponto e vírgula (abre no Excel), arquivo `ordens-de-servico-AAAA-MM-DD.csv`.

## Navegação
- Notificar selecionadas → aviso "N justificativas pedidas. Aparecem em Minhas tarefas, em Justificativas solicitadas."
- Aba Minhas tarefas → Tela 08; aba Agenda Agrícola → Tela 07.

## Sugestões (a validar)
- Gráfico Nº OS por nível com a métrica "Dias de atraso" além de "Nº de OS".
- Mostrar no Status OS um ícone de alerta junto do texto "com atraso" (hoje: texto em vermelho).
