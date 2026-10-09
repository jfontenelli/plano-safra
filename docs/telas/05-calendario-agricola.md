# Tela 05 — Calendário Agrícola

Atualizado em 08/10/2026. Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Tudo é **Definido**, exceto as seções "Sugestões em teste" e "Em aberto".
Imagens: `referencias/05-calendario-agricola.png` (Infográfico) e `referencias/05-calendario-tabela.png` (Tabela; os cards da imagem viraram uma linha de texto). Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** construída.

---

## 1. Objetivo

Ver **todas as operações do plano juntas**, de todos os grupos (Semente, Defensivo, Fertilidade…), na ordem em que acontecem na safra, com os produtos e doses de cada uma, e o resumo do planejamento. É o único lugar do plano que junta todos os grupos. **Abre com todas as operações cadastradas na etapa Operações** e vai se preenchendo conforme o planejamento.

## 2. Lugar na jornada

- Etapa **Calendário Agrícola** do plano (aba no cabeçalho, entre Planejamento e Suprimentos). Mesmo cabeçalho do plano da Tela 04 (com o botão Exportar).
- Os dados vêm do que foi planejado nas guias da etapa Planejamento. O calendário cresce durante o planejamento.

## 3. Barra de cima

- **Talhão**: "Todos os talhões" ou um talhão ("T01 · 120 ha"). Com um talhão, o calendário mostra só o que ele recebe, com a dose dele, e "Talhões" vira 1/1.
- **Tabela | Infográfico** (botões com ícone, nessa ordem; o selecionado em verde-claro com borda verde). **Abre na Tabela**, a visão principal; o Infográfico é complementar.
- Sem "Visão consolidada" e sem "Agenda de atividades" (estão na imagem, mas foram retirados).

## 4. Previsões de plantio e de colheita (texto abaixo dos filtros)

- Uma linha de texto logo abaixo dos filtros, no Infográfico e na Tabela: **Plantio estimado:** 22/set–10/out/2026 · **Colheita estimada:** 04/jan–05/fev/2027 (títulos em negrito, datas sem negrito). (Antes eram cards; os cards, e os de Área e Talhões planejados, foram testados e retirados.)
- **Plantio estimado**: da primeira à última data de plantio (talhões com plantio definido: variedade e data) ("01–20/out/2026"; meses diferentes: "22/set–10/out/2026").
- **Colheita estimada**: da primeira à última previsão (data de plantio + ciclo da variedade).
- Sem plantio: "— (defina o plantio na guia Semente)"; com plantio e variedade sem ciclo, na colheita: "— (variedade sem ciclo)". Valem para a fazenda toda (não mudam com o filtro de talhão).

## 5. Infográfico

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

## 6. Tabela

- **Faixa da fase na vertical, à esquerda** (Pré-plantio, Plantio, Manejo da cultura, Colheita), nas mesmas cores da etapa Operações.
- Colunas: **DAP · Fenologia · Data prevista · Área · Operação · Produto · Unid.** e **uma coluna por talhão** (nome, variedade e área no cabeçalho; com o filtro, só os talhões marcados).
- **Filtros Grupo de operação e Talhão** (à esquerda; Tabela/Infográfico à direita; as previsões em texto logo abaixo): cada um é uma caixa com a busca **Pesquisar** no topo, "Todos os grupos" / "Todos os talhões" e uma marcação por opção (no talhão, com a área); dá para marcar vários. O botão mostra "Todos…", o nome (um só), "N grupos" / "N talhões" ou "Nenhum…". Os grupos são os do plano com operação, na ordem do plano, e a Colheita no fim. Valem para o Infográfico e a Tabela.
- **Calendário sempre ampliado**: ocupa a área logo abaixo das abas do plano, sem botão Expandir/Recolher (testado e retirado). Acima dele, só a barra (filtros e Tabela/Infográfico) e a linha das previsões. No plano aprovado, a faixa "somente leitura" não aparece no Calendário (o selo **Aprovado** fica no cabeçalho). Com uma caixa de filtro aberta, a tecla **Esc** fecha a caixa.
- **Uma linha por produto**, com a unidade e a **dose de cada talhão**; DAP, Fenologia, Data prevista, Área e Operação ocupam a altura de todos os produtos da operação. Na célula da Operação, o nome em negrito e o **grupo como etiqueta** embaixo. No Plantio, as linhas são **Data de plantio** e **População** (mil pl/ha); na Colheita, **Previsão de colheita**. Operação sem talhão planejado: uma linha, com **"Sem recomendação"** (no Plantio, "Sem variedade") na coluna Produto (na Unid., se o Produto estiver oculto).
- **Linhas de grade** entre todas as colunas; sem abrir e fechar.
- **Colunas congeladas** ao rolar para a direita: faixa da Fase, DAP, Fenologia, Data prevista, Área, Operação, Produto e Unid. ficam paradas à esquerda (com uma sombra na borda depois da Unid.); só os talhões rolam. O cabeçalho também fica parado ao rolar para baixo. No menu do botão direito do cabeçalho (qualquer coluna), **Descongelar colunas** faz tudo rolar junto (mesma ordem e larguras; o cabeçalho continua parado ao rolar para baixo); o item vira **Congelar colunas** para voltar. Abre sempre congelada.
- **Nomes das colunas de DAP até Unid.** centralizados na horizontal e na vertical, na célula do cabeçalho.
- **Larguras fixas** das colunas congeladas: Fase 44 px · DAP 64 · Fenologia 96 · Data prevista 120 · Área 84 · Operação 170 · Produto 150 · Unid. 96. Operação, Produto e Data prevista quebram a linha quando o texto não cabe.
- **Ocultar e exibir colunas** (como no Excel), em **todas as colunas**, de DAP até Unid. e cada talhão: o **botão direito** em qualquer lugar do cabeçalho da coluna (sem seta; o clique esquerdo não faz nada) abre o menu **Ocultar coluna** (e **Exibir todas as colunas**, quando há alguma oculta). A coluna oculta vira uma **faixa estreita com traço duplo**; clicar na faixa exibe a coluna de novo. As demais colunas congeladas se ajustam à esquerda. Com o menu aberto, **Esc** ou um clique fora fecha o menu. Só a faixa da Fase não tem esse menu. Ocultar um talhão só estreita a coluna (ele continua no filtro Talhão, que tira a coluna da tabela).
- **Data prevista:** data de plantio + DAP da operação, nos talhões que recebem a operação (sem talhão planejado, nos talhões do filtro com plantio). Datas diferentes entre talhões viram **intervalo**, no formato das previsões ("22/set–10/out/2026"). Colheita: a previsão de colheita dos talhões. Sem plantio ou sem DAP: "—".
- **Área:** soma da área dos talhões que recebem a operação (com o filtro, só os talhões marcados); no Plantio, os talhões com variedade; na Colheita, os com previsão. Sem talhão planejado: "—".
- **Dose do talhão diferente da padrão da receita**: sem destaque de cor por enquanto (o amarelo foi testado e retirado); ao passar o mouse, a dose padrão. **Talhão que não recebe** o produto: "—" em cinza.
- A **previsão de conclusão** não aparece nem se edita aqui: fica na etapa Operações.
- Fenologia da linha: a escolhida na operação; "—" no pré-plantio (DAP negativo), no plantio (DAP 0), na colheita e sem fenologia. Colheita: DAP em faixa ("104 a 118").

## 7. Doses no Infográfico

- Todos os talhões com a mesma dose: "Fox Xpro 0,40 L/ha".
- Dose diferente entre talhões (mais de uma recomendação ou dose própria): faixa "KCl 130 a 160 kg/ha"; ao passar o mouse, o detalhe ("130 kg/ha em 7 talhões · 160 kg/ha no T07").
- Formato da dose como nas guias: duas casas nos defensivos e no TSI; sem casas fixas na Fertilidade.

## 8. Regras

- **Só as operações já planejadas** aparecem (com produto e dose; no Plantio, variedade), na ordem do DAP, **em construção e no aprovado**. Operação ainda sem recomendação não aparece no Infográfico nem na Tabela. Qualquer mudança em Operações ou no Planejamento aparece ao voltar ao Calendário. (Antes, em construção, todas as operações cadastradas apareciam como "Sem recomendação"; testado e trocado.)
- **Nada planejado ainda:** no lugar da Tabela e do Infográfico, um aviso (amarelo-claro, como o da etapa Operações): "**Nenhuma operação planejada ainda.** As operações planejadas aparecem aqui com datas e doses por talhão." Os filtros e as previsões continuam na barra. Com operações planejadas, o aviso não aparece; se os filtros esconderem tudo, a Tabela diz "Nenhuma operação com os filtros escolhidos".

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

1. Datas reais (data de plantio de cada talhão + DAP) e agenda por data — a "Agenda de atividades" foi retirada por enquanto.
2. Status de cada item (o DECISOES fala em mostrar o status; hoje só "Sem recomendação" e Talhões x/y).
