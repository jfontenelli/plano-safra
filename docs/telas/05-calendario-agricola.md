# Tela 05 — Calendário Agrícola

Atualizado em 14/10/2026. Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Tudo é **Definido**, exceto as seções "Sugestões em teste" e "Em aberto".
Imagens: `referencias/05-calendario-agricola.png` (Ciclo Produtivo), `referencias/05-calendario-tabela.png` (Programação) e `referencias/05.3-resumo-calendario.png` (Calendário). Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** construída.

---

## 1. Objetivo

Ver **todas as operações do plano juntas**, de todos os grupos (Semente, Defensivo, Fertilidade…), na ordem em que acontecem na safra, com os produtos e doses de cada uma, e o resumo do planejamento. É o único lugar do plano que junta todos os grupos. **Abre com todas as operações cadastradas na etapa Operações** e vai se preenchendo conforme o planejamento.

## 2. Lugar na jornada

- Etapa **Calendário Agrícola** do plano, na aba **Resumo** do cabeçalho (Operações · Planejamento · Resumo). Mesmo cabeçalho do plano da Tela 04 (com o botão Exportar).
- Os dados vêm do que foi planejado nas guias da etapa Planejamento. O calendário cresce durante o planejamento.

## 3. Barra de cima

- **Três visões em guias**, à esquerda, numa linha própria com uma linha embaixo: **Programação** (antes Tabela) · **Ciclo Produtivo** (antes Infográfico) · **Calendário** (ícone e nome; a ativa em verde-claro com traço verde embaixo). **Abre na Programação.** No Calendário, à direita da mesma linha, Mês · Semana · Dia e o período.
- Embaixo, os filtros **Grupo de operação** e **Talhão** (no Calendário, a legenda filtra os grupos; ver 6.1).
- **Uma superfície só**: o Resumo tem fundo branco e as partes se integram à tela (sem caixas soltas sobre fundo cinza).
- Sem "Visão consolidada" e sem "Agenda de atividades" (estão na imagem, mas foram retirados).

## 4. Previsões de plantio e de colheita

- **Retiradas** das três visões (a linha "Plantio estimado · Colheita estimada" saiu).

## 5. Ciclo Produtivo (antes Infográfico)

- **Uma coluna por fase da cultura**, da esquerda para a direita, com rolagem horizontal e uma seta entre as colunas:
  - **DAP negativo** → uma coluna **Pré-plantio**, com a faixa de DAP (ex.: "−90 a −5 DAP").
  - **DAP 0** → **Plantio**.
  - **DAP positivo** → uma coluna por **fenologia** da operação (VE, V2, V4, R1, R3…), em ordem de DAP, com a faixa de DAP no título.
  - **DAP positivo sem fenologia** → coluna **cinza** com o título "25 DAP" e "sem fenologia", na posição do DAP (a operação não some, e fica claro que falta a fenologia).
  - **Colheita** → aparece quando algum talhão tem previsão de colheita (variedade com ciclo e data de plantio). Título com a faixa de DAP pelo ciclo das variedades (ex.: "104 a 118 DAP").
- **Título** colorido pela fase (pré-plantio, plantio, vegetativo, florescimento, vagens, maturação, colheita; cinza sem fenologia) e, embaixo, a **imagem da fase**, de `img/fenologia/` (feitas pela usuária, uma por estádio): PRE-PLANTIO, PLANTIO, VE, VC, V1 a V6, R1 a R8 e COLHEITA; **NEUTRO** (calendário) nas colunas sem fenologia ("N DAP") e "Sem DAP".
- **Cartões** das operações da fase: etiqueta do **grupo** (Semente, Tratamento de semente, Defensivo, Fertilidade, Colheita), nome da operação e os **produtos com a dose**. O Plantio mostra "N variedades"; o TSI (grupo Tratamento de semente) é um cartão próprio na fase do DAP informado, com os produtos. A Colheita mostra "N variedades". Operação sem recomendação: "Sem recomendação", em cinza.
- **Resumo no pé** de cada fase: área · talhões · operações.
- **Todas as fases com a mesma altura** (a altura livre da tela, mínimo de 360 px); o **resumo fica travado** no rodapé, na mesma linha em todas as colunas. O que passa da altura **rola dentro da própria fase** (título, ilustração e resumo ficam parados).
- Sem o prazo para encerramento da OS (ele fica na Tabela).

## 6. Programação (antes Tabela)

- **Na ordem da safra** (pré-plantio, plantio, manejo da cultura e colheita), **sem faixa com o nome da fase** (como na etapa Operações; confundia).
- Colunas: **DAP · Fenologia · Data prevista · Área · Operação · Produto · Unid.** e **uma coluna por talhão** (nome, variedade e área no cabeçalho; com o filtro, só os talhões marcados).
- **Filtros Grupo de operação e Talhão** (abaixo das guias): cada um é uma caixa com a busca **Pesquisar** no topo, "Todos os grupos" / "Todos os talhões" e uma marcação por opção (no talhão, com a área); dá para marcar vários. O botão mostra "Todos…", o nome (um só), "N grupos" / "N talhões" ou "Nenhum…". Os grupos são os do plano com operação, na ordem do plano, e a Colheita no fim. Valem para as três visões (no Calendário, o de grupo é a legenda).
- **Calendário sempre ampliado**: ocupa a área logo abaixo das abas do plano, sem botão Expandir/Recolher (testado e retirado). Acima dele, só as guias e os filtros. No plano aprovado, a faixa "somente leitura" não aparece no Calendário (o selo **Aprovado** fica no cabeçalho). Com uma caixa de filtro aberta, a tecla **Esc** fecha a caixa.
- **Uma linha por produto**, com a unidade e a **dose de cada talhão**; DAP, Fenologia, Data prevista, Área e Operação ocupam a altura de todos os produtos da operação. Na célula da Operação, o nome em negrito e o **grupo como etiqueta** embaixo. No Plantio, as linhas são **Data de plantio** e **População** (mil pl/ha); na Colheita, **Previsão de colheita**. Operação sem talhão planejado: uma linha, com **"Sem recomendação"** (no Plantio, "Sem variedade") na coluna Produto (na Unid., se o Produto estiver oculto).
- **Linhas de grade** entre todas as colunas; sem abrir e fechar.
- **Colunas congeladas** ao rolar para a direita: DAP, Fenologia, Data prevista, Área, Operação, Produto e Unid. ficam paradas à esquerda (com uma sombra na borda depois da Unid.); só os talhões rolam. O cabeçalho também fica parado ao rolar para baixo. No menu do botão direito do cabeçalho (qualquer coluna), **Descongelar colunas** faz tudo rolar junto (mesma ordem e larguras; o cabeçalho continua parado ao rolar para baixo); o item vira **Congelar colunas** para voltar. Abre sempre congelada.
- **Nomes das colunas de DAP até Unid.** centralizados na horizontal e na vertical, na célula do cabeçalho.
- **Larguras fixas** das colunas congeladas: DAP 64 · Fenologia 96 · Data prevista 120 · Área 84 · Operação 170 · Produto 150 · Unid. 96. Operação, Produto e Data prevista quebram a linha quando o texto não cabe.
- **Ocultar e exibir colunas** (como no Excel), em **todas as colunas**, de DAP até Unid. e cada talhão: o **botão direito** em qualquer lugar do cabeçalho da coluna (sem seta; o clique esquerdo não faz nada) abre o menu **Ocultar coluna** (e **Exibir todas as colunas**, quando há alguma oculta). A coluna oculta vira uma **faixa estreita com traço duplo**; clicar na faixa exibe a coluna de novo. As demais colunas congeladas se ajustam à esquerda. Com o menu aberto, **Esc** ou um clique fora fecha o menu. Ocultar um talhão só estreita a coluna (ele continua no filtro Talhão, que tira a coluna da tabela).
- **Data prevista:** data de plantio + DAP da operação, nos talhões que recebem a operação (sem talhão planejado, nos talhões do filtro com plantio). Datas diferentes entre talhões viram **intervalo**, no formato das previsões ("22/set–10/out/2026"). Colheita: a previsão de colheita dos talhões. Sem plantio ou sem DAP: "—".
- **Área:** soma da área dos talhões que recebem a operação (com o filtro, só os talhões marcados); no Plantio, os talhões com variedade; na Colheita, os com previsão. Sem talhão planejado: "—".
- **Dose do talhão diferente da padrão da receita**: sem destaque de cor por enquanto (o amarelo foi testado e retirado); ao passar o mouse, a dose padrão. **Talhão que não recebe** o produto: "—" em cinza.
- A **previsão de conclusão** não aparece nem se edita aqui: fica na etapa Operações.
- Fenologia da linha: a escolhida na operação; "—" no pré-plantio (DAP negativo), no plantio (DAP 0), na colheita e sem fenologia. Colheita: DAP em faixa ("104 a 118").

## 6.1 Calendário

- **Terceira visão do Resumo** (Programação · Ciclo Produtivo · **Calendário**). Imagem: `referencias/05.3-resumo-calendario.png` (sem os cards, sem o filtro Fazenda, sem "Planejado" e sem "Pontos de atenção").
- **Barra de cima:** as guias à esquerda; à direita, como nas agendas do Google e do Outlook: **Hoje · ‹ › · Outubro de 2026 · [Mês ▾]**. O título segue a escala (semana: "27 set – 3 out 2026"; dia: "14 de outubro de 2026"). A escala fica numa **lista suspensa** (Mês, Semana, Dia; começa em Mês). Abre no mês de hoje. Trocar a escala vai para o dia aberto no painel ou, se hoje estiver no período, para hoje.
- **Hoje:** vai para hoje, **seleciona o dia e abre o painel** com as operações dele (na visão Dia, só vai para hoje).
- **Legenda que filtra** (no lugar da lista Grupo de operação), com a cor de cada grupo (Semente verde, Tratamento de semente marrom, Defensivo laranja, Fertilidade roxo, Colheita dourado; outros azul). Com todos ligados, clicar num grupo mostra só ele; depois, cada clique liga ou desliga um grupo (desligado: cinza, bolinha vazada); desligar o último volta a todos; com filtro, aparece "Mostrar todos". Mais de 6 grupos: os 5 primeiros à vista e "+ N grupos de operação" com os outros. É o mesmo filtro de grupo da Programação e do Ciclo Produtivo. **Talhão sempre alinhado à direita**, na linha da legenda.
- **Data de cada operação** em cada talhão: data de plantio + DAP (Plantio: a data de plantio; Colheita: plantio + ciclo da variedade). Os talhões que começam no mesmo dia ficam juntos. A operação vai do início até o fim da previsão de conclusão (início + dias − 1). Talhão sem data de plantio: a operação não tem data e fica fora, com o aviso "N operações planejadas ficam fora do calendário: sem data de plantio nos talhões dela."
- **Etiquetas separadas em cada dia** (sem emendar os dias): cada dia mostra uma etiqueta por **operação em andamento** nele (do início, data de plantio + DAP em cada talhão, até o fim da previsão de conclusão), na cor do grupo. A mesma operação em talhões que começam em dias diferentes aparece **uma vez só** no dia (área e talhões somados). (A barra contínua, como no Google Agenda, foi testada e retirada: cortava operações.)
- **Mês:** grade de domingo a sábado que **cabe inteira na tela** (as semanas dividem a altura livre; mínimo de 420 px). Etiquetas **finas** (18 px, letra 11), **só com o nome** numa linha (corta com "…"; nome, período, área e talhões ao passar o mouse). Cabem **quantas a altura do dia permitir** (medida na tela; mínimo de 2); quando não cabem, a última vaga vira **"+N mais"**. Dias de fora do mês em cinza, **com as operações**. **Hoje**: número em destaque e a etiqueta "Hoje".
- **Semana:** etiquetas **maiores e legíveis** (nome em letra 13, em até 2 linhas, e a área), de tamanho fixo (não esticam para ocupar a tela); "+N mais" só se não couberem. **Dia:** a lista do dia, com letra maior.
- **Cabeçalho e rodapé enxutos** (guias, Hoje/setas/período/escala, legenda e Talhão mais baixos, letra 13; rodapé em letra menor), para sobrar espaço ao calendário.
- **Painel do dia** (clicar num dia ou numa operação): coluna à direita, da barra até o fim da tela, com a data, o dia da semana e "**Operações do dia (N)**": as operações **em andamento** no dia (do início ao fim da previsão de conclusão), cada uma com a cor, o nome, "235 ha · 2 talhões" e os **nomes dos talhões** ("T07, T08", em ordem); com mais de 6, os 5 primeiros e **"+N talhões"**, que mostra todos ("Mostrar menos" volta). Período ao passar o mouse. Na visão Dia, a mesma lista. Sem os detalhes da operação. ✕ fecha.
- **Rodapé: Área operacional** do período mostrado, com os filtros: "Área operacional em outubro de 2026: 3.430 ha · 8 operações" (mês e semana: as operações que começam no período; dia: as em andamento).
- Sem cards de resumo, sem conflitos de programação e sem pontos de atenção (testados e retirados).

## 7. Doses no Ciclo Produtivo

- Todos os talhões com a mesma dose: "Fox Xpro 0,40 L/ha".
- Dose diferente entre talhões (mais de uma recomendação ou dose própria): faixa "KCl 130 a 160 kg/ha"; ao passar o mouse, o detalhe ("130 kg/ha em 7 talhões · 160 kg/ha no T07").
- Formato da dose como nas guias: duas casas nos defensivos e no TSI; sem casas fixas na Fertilidade.

## 8. Regras

- **Só as operações já planejadas** aparecem (com produto e dose; no Plantio, variedade), na ordem do DAP, **em construção e no aprovado**. Operação ainda sem recomendação não aparece em nenhuma das visões. Qualquer mudança em Operações ou no Planejamento aparece ao voltar ao Calendário. (Antes, em construção, todas as operações cadastradas apareciam como "Sem recomendação"; testado e trocado.)
- **Nada planejado ainda:** no lugar das visões, um aviso (amarelo-claro, como o da etapa Operações): "**Nenhuma operação planejada ainda.** As operações planejadas aparecem aqui com datas e doses por talhão." As guias continuam na barra. Com operações planejadas, o aviso não aparece; se os filtros esconderem tudo, a Programação diz "Nenhuma operação com os filtros escolhidos".

- A colheita vem do Plantio: previsão = data de plantio + ciclo da variedade; talhão com variedade sem ciclo fica fora da colheita.
- **A Colheita aparece no fim, depois que houver plantio** (variedade, data e ciclo), com a previsão de colheita.
- Talhões de cada operação: no Plantio, os talhões com variedade; nas outras, os talhões com recomendação.
- Quando duas operações caem no mesmo DAP, a ordem segue a das guias (Semente, Defensivo, Fertilidade).
- O prazo de cada operação e o da colheita vão no arquivo exportado (aba operacoes, coluna previsao_cumprimento; aba plano, prazo_colheita) e voltam no importar.

## 9. Para testar

- **Santa Clara** (aprovado): fases Pré-plantio · Plantio · 1 DAP (sem fenologia) · V2 · V4 · R1 · R3 · R4 · R5 · R7 · Colheita (104 a 118 DAP). Fenologia do exemplo: Pré-emergente sem fenologia (antes da emergência), 1ª Pós V2, 2ª Pós V4, 1ª Fungicida R1, 2ª R3, 3ª R4, 4ª R5, Desfolha R7; adubações de 25 DAP em V4 e 2ª foliar em R3 (do modelo).
- **São José** (em construção): o que já estiver planejado; sem nada planejado, o aviso "Nenhuma operação planejada ainda".

## 10. Sugestões em teste (não validadas)

- Etiqueta do cartão com o **nome do grupo** (Fertilidade); na imagem, calcário e MAP aparecem como "Corretivo" e "Fertilizante".
- Título da coluna de produto só com o nome; a unidade vai com a dose na célula.

## 11. Em aberto

1. Ajustar o número de faixas ao redimensionar a janela (hoje só no próximo clique).
2. Status de cada item (o DECISOES fala em mostrar o status; hoje só "Sem recomendação" e Talhões x/y).
