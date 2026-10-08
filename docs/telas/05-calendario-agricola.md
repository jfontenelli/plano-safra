# Tela 05 — Calendário Agrícola

Atualizado em 08/10/2026. Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Tudo é **Definido**, exceto as seções "Sugestões em teste" e "Em aberto".
Imagens: `referencias/05-calendario-agricola.png` (Infográfico) e `referencias/05-calendario-tabela.png` (cards e Tabela). Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** construída.

---

## 1. Objetivo

Ver **todas as operações do plano juntas**, de todos os grupos (Semente, Defensivo, Fertilidade…), na ordem em que acontecem na safra, com os produtos e doses de cada uma, e o resumo do planejamento. É o único lugar do plano que junta todos os grupos. **Abre com todas as operações cadastradas na etapa Operações** e vai se preenchendo conforme o planejamento.

## 2. Lugar na jornada

- Etapa **Calendário Agrícola** do plano (aba no cabeçalho, entre Planejamento e Suprimentos). Mesmo cabeçalho do plano da Tela 04 (com o botão Exportar).
- Os dados vêm do que foi planejado nas guias da etapa Planejamento. O calendário cresce durante o planejamento.

## 3. Barra de cima

- **Talhão**: "Todos os talhões" ou um talhão ("T01 · 120 ha"). Com um talhão, o calendário mostra só o que ele recebe, com a dose dele, e "Talhões" vira 1/1.
- **Infográfico | Tabela** (botões com ícone; o selecionado em verde-claro com borda verde). Abre no Infográfico.
- Sem "Visão consolidada" e sem "Agenda de atividades" (estão na imagem, mas foram retirados).

## 4. Cards de resumo (no topo do Infográfico e da Tabela)

- Só dois cards (Área e Talhões planejados foram testados e retirados):
- **Previsão de plantio**: da primeira à última data de plantio (talhões com plantio definido: variedade e data) ("01–20/out/2026"; meses diferentes: "22/set–10/out/2026").
- **Previsão de colheita**: da primeira à última previsão (data de plantio + ciclo da variedade).
- Sem plantio: "—" e "Defina o plantio na guia Semente". Os cards valem para a fazenda toda (não mudam com o filtro de talhão).

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
- **Filtros Grupo de operação e Talhão** (à esquerda, acima dos cards; Infográfico/Tabela à direita): cada um é uma caixa com a busca **Pesquisar** no topo, "Todos os grupos" / "Todos os talhões" e uma marcação por opção (no talhão, com a área); dá para marcar vários. O botão mostra "Todos…", o nome (um só), "N grupos" / "N talhões" ou "Nenhum…". Os grupos são os do plano com operação, na ordem do plano, e a Colheita no fim. Valem para o Infográfico e a Tabela.
- **Uma linha por produto**, com a unidade e a **dose de cada talhão**; DAP, Fenologia e Operação ocupam a altura de todos os produtos da operação. Na célula da Operação, o nome em negrito e o **grupo como etiqueta** embaixo. No Plantio, as linhas são **Data de plantio** e **População** (mil pl/ha); na Colheita, **Previsão de colheita**. Operação sem talhão planejado: uma linha, com **"Sem recomendação"** (no Plantio, "Sem variedade") na coluna Produto.
- **Linhas de grade** entre todas as colunas; sem abrir e fechar.
- **Data prevista:** data de plantio + DAP da operação, nos talhões que recebem a operação (sem talhão planejado, nos talhões do filtro com plantio). Datas diferentes entre talhões viram **intervalo**, no formato dos cards ("22/set–10/out/2026"). Colheita: a previsão de colheita dos talhões. Sem plantio ou sem DAP: "—".
- **Área:** soma da área dos talhões que recebem a operação (com o filtro, só os talhões marcados); no Plantio, os talhões com variedade; na Colheita, os com previsão. Sem talhão planejado: "—".
- **Dose do talhão diferente da padrão da receita**: célula em **amarelo** (ao passar o mouse, a dose padrão). **Talhão que não recebe** o produto: "—" em cinza.
- A **previsão de conclusão** não aparece nem se edita aqui: fica na etapa Operações.
- Fenologia da linha: a escolhida na operação; "—" no pré-plantio (DAP negativo), no plantio (DAP 0), na colheita e sem fenologia. Colheita: DAP em faixa ("104 a 118").

## 7. Doses no Infográfico

- Todos os talhões com a mesma dose: "Fox Xpro 0,40 L/ha".
- Dose diferente entre talhões (mais de uma recomendação ou dose própria): faixa "KCl 130 a 160 kg/ha"; ao passar o mouse, o detalhe ("130 kg/ha em 7 talhões · 160 kg/ha no T07").
- Formato da dose como nas guias: duas casas nos defensivos e no TSI; sem casas fixas na Fertilidade.

## 8. Regras

- **Todas as operações cadastradas na etapa Operações** aparecem, já na ordem do DAP. As que ainda não têm talhão planejado mostram "Sem recomendação" (no Plantio, "Sem variedade"); na Tabela, sem seta e sem linhas de produto. Qualquer mudança em Operações ou no Planejamento aparece ao voltar ao Calendário.
- **Plano aprovado:** só aparece o que tem produto e dose (no Plantio, variedade); operação sem recomendação não aparece no Infográfico nem na Tabela.

- A colheita vem do Plantio: previsão = data de plantio + ciclo da variedade; talhão com variedade sem ciclo fica fora da colheita.
- **A coluna Colheita aparece sempre, no fim.** Antes de haver plantio (variedade, data e ciclo), o título diz "(pelo ciclo da variedade)" e o cartão "Aguardando plantio: a data vem do plantio + ciclo da variedade"; na Tabela, DAP "pelo ciclo".
- Talhões de cada operação: no Plantio, os talhões com variedade; nas outras, os talhões com recomendação.
- Quando duas operações caem no mesmo DAP, a ordem segue a das guias (Semente, Defensivo, Fertilidade).
- O prazo de cada operação e o da colheita vão no arquivo exportado (aba operacoes, coluna previsao_cumprimento; aba plano, prazo_colheita) e voltam no importar.

## 9. Para testar

- **Santa Clara** (aprovado): fases Pré-plantio · Plantio · 1 DAP (sem fenologia) · V2 · V4 · R1 · R3 · R4 · R5 · R7 · Colheita (104 a 118 DAP). Fenologia do exemplo: Pré-emergente sem fenologia (antes da emergência), 1ª Pós V2, 2ª Pós V4, 1ª Fungicida R1, 2ª R3, 3ª R4, 4ª R5, Desfolha R7; adubações de 25 DAP em V4 e 2ª foliar em R3 (do modelo).
- **São José** (em construção): operações sem recomendação ("Sem recomendação", Talhões 0/12) e colunas cinza sem fenologia; editar o prazo na Tabela.

## 10. Sugestões em teste (não validadas)

- Etiqueta do cartão com o **nome do grupo** (Fertilidade); na imagem, calcário e MAP aparecem como "Corretivo" e "Fertilizante".
- Título da coluna de produto só com o nome; a unidade vai com a dose na célula.

## 11. Em aberto

1. Datas reais (data de plantio de cada talhão + DAP) e agenda por data — a "Agenda de atividades" foi retirada por enquanto.
2. Status de cada item (o DECISOES fala em mostrar o status; hoje só "Sem recomendação" e Talhões x/y).
