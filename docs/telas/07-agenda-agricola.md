# Tela 07 — Operações Agrícolas: aba Agenda Agrícola

Atualizado em 22/10/2026. Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Origem: reunião com stakeholders de 19/10/2026. A guia **Calendário** do Resumo do plano (Tela 05) foi migrada para fora do plano, sem a associação a um plano. Hoje fica no menu **Gestão da Lavoura › Operações Agrícolas**, aba **Agenda Agrícola** (o menu Ordens de Serviço passou a Gestão da Lavoura em 21/10/2026). **Por enquanto só migrada**; o refinamento para a programação das OS vem depois.
Imagem: `referencias/05.3-resumo-calendario.png` (a do Calendário do Resumo, de onde veio). Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** construída.

## Objetivo
Ver, dia a dia, as operações planejadas de todas as fazendas (vários planos somados), para programar as Ordens de Serviço.

## Quando aparece
- Menu lateral **Gestão da Lavoura** (grupo com setinha para minimizar, como o Plano de Safra) › **Operações Agrícolas**, aba **Agenda Agrícola** (a terceira; antes vêm Minhas tarefas, Tela 08, e a Central de Operações, Tela 09).
- Sem nenhum plano cadastrado: o convite "Crie seu primeiro plano para visualizar a Agenda Agrícola" com "+ Criar Plano de Safra" (como Planejamento, Calendário Agrícola e Orçamento).

## Conteúdo
- **Cabeçalho** (o mesmo de Minhas tarefas e da Central de Operações): caminho no topo "⌂ Operações Agrícolas › Agenda Agrícola", título "Agenda Agrícola", subtítulo "Calendário das operações planejadas, dia a dia, em todas as fazendas." e as abas **Minhas tarefas · Central de Operações · Agenda Agrícola**, com a etiqueta "Últimas versões publicadas ⓘ" à direita.
- **Filtros** num cartão compacto, todos com **várias escolhas** (caixa com Pesquisar, "Todas"/"Todos" e uma marcação por opção): **Safra** (Safra ou Safrinha), **Cultura**, **Empresa**, **Fazenda**, **Talhão** e **Operação**, nesta ordem; **Limpar filtros** à direita. As opções são as que existem nos planos com versão publicada. No Talhão, os talhões dos planos que passam pelos outros filtros, com a fazenda junto ("Santa Clara · T01"), porque o nome se repete entre fazendas.
- **Operação:** as operações dos grupos à mostra na legenda, pelo nome (o mesmo nome em vários planos é uma opção só, ex.: Adubação de plantio da soja e do milho), na ordem da legenda (Plantio, Fertilidade, Defensivo, Colheita) e, dentro do grupo, na ordem do plano; o grupo aparece ao lado. Escolher operações leva o calendário para a **operação escolhida mais cedo**; marcar "Todas" (ou deixar nenhuma) volta para **hoje**.
- **Sem filtro de Ano Agrícola:** o tempo anda pelas setas do calendário, atravessando os anos.
- **Barra do calendário:** à esquerda, a **legenda que filtra** os grupos de operação (Plantio, Fertilidade, Defensivo, Colheita, na cor de cada grupo); à direita, **Hoje · ‹ › · período · [Mês ▾]** (Mês, Semana, Dia).
- **Grade** de domingo a sábado, o **painel do dia** e o rodapé **Área operacional** do período, como eram no Resumo (Tela 05, antiga seção 6.1).

## Regras
- **Vários planos somados**, sempre a **última versão publicada de cada plano**; plano sem versão publicada não aparece. Entram as operações já planejadas (com talhão; a colheita depois do plantio), com a data de cada talhão: data de plantio + DAP (Plantio: a data de plantio; Colheita: plantio + ciclo da variedade), até o fim da previsão de conclusão.
- **Abre no dia de hoje**, no Mês. O período, os filtros e o dia aberto se mantêm ao navegar entre telas. Limpar filtros mantém o período.
- **Legenda:** pelos tipos de grupo (os nomes vêm dos planos). **Um grupo por vez:** clicar num grupo mostra só ele e leva o calendário para a **operação mais cedo dele** (mesmo que já tenha passado), na escala aberta; clicar em outro grupo substitui o anterior. Clicar de novo no grupo à mostra, ou em "Mostrar todos", volta a todos os grupos e o calendário volta para **hoje**.
- **Mês:** a tela inteira cabe na janela (cabeçalho e filtros compactos; a grade ocupa a altura que sobra, com mínimo de 300 px). Etiquetas finas só com o nome; as que não cabem no dia viram "+N mais". **Sem etiquetas de talhão no Mês** (não cabem).
- **Semana:** cada operação numa caixinha com o nome, a área e **uma etiqueta por talhão** (T05, T06…, em ordem); a caixinha cresce para caber as etiquetas. Todas as operações do dia aparecem (o dia rola por dentro se a lista for longa).
- **Dia e painel do dia:** cada operação com o nome, **de onde vem** ("Boa Vista · Safra 26/27"), a área, o número de talhões e as **etiquetas dos talhões**; com mais de 12, "+N talhões" mostra todos ("Mostrar menos" volta).
- **Dias que já passaram** (antes de hoje): as operações aparecem **esmaecidas** (Mês, Semana, Dia e painel do dia), para mostrar que já passou, como no Google Agenda. Hoje e os dias seguintes, na cor normal.
- Ao passar o mouse numa operação: nome, fazenda e safra, período, área e talhões.
- Operações planejadas sem data de plantio nos talhões: ficam fora, com o aviso "N operações planejadas ficam fora do calendário: sem data de plantio nos talhões dela."
- Com uma caixa de filtro aberta, **Esc** fecha a caixa.

## Navegação
- Gestão da Lavoura › Operações Agrícolas → aba Minhas tarefas; aba Agenda Agrícola → esta tela.
- "+ Criar Plano de Safra" (sem planos) → modal Criar Plano (Tela 02).

## Para testar
- Mês de outubro de 2026: as operações da Boa Vista (soja 26/27).
- Fazenda = Santa Clara e voltar pelas setas até 2025: soja 25/26 e milho safrinha 26/26.
- Semana do começo de outubro de 2026: plantio em vários talhões, com as etiquetas.

## Sugestões (a validar)
- Na caixinha da Semana, mostrar a fazenda junto da área quando há mais de uma fazenda ("Boa Vista · 203 ha").
- Filtro Safra pelo nome da safra (25/26, 26/27…) em vez de Safra/Safrinha, já que não há filtro de ano.
