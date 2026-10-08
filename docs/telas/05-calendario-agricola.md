# Tela 05 — Calendário Agrícola

Atualizado em 08/10/2026. Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Tudo é **Definido**, exceto as seções "Sugestões em teste" e "Em aberto".
Imagem: `referencias/05-calendario-agricola.png` (versão Infográfico). Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** construída.

---

## 1. Objetivo

Ver **todas as operações do plano juntas**, de todos os grupos (Semente, Defensivo, Fertilidade…), na ordem em que acontecem na safra, com os produtos e doses de cada uma, e informar o **prazo para encerramento da OS** de cada operação. É o único lugar do plano que junta todos os grupos.

## 2. Lugar na jornada

- Etapa **Calendário Agrícola** do plano (aba no cabeçalho, entre Planejamento e Suprimentos). Mesmo cabeçalho do plano da Tela 04 (com o botão Exportar).
- Os dados vêm do que foi planejado nas guias da etapa Planejamento. O calendário cresce durante o planejamento.

## 3. Barra de cima

- **Talhão**: "Todos os talhões" ou um talhão ("T01 · 120 ha"). Com um talhão, o calendário mostra só o que ele recebe, com a dose dele, e "Talhões" vira 1/1.
- **Infográfico | Tabela** (botões com ícone; o selecionado em verde-claro com borda verde). Abre no Infográfico.
- Sem "Visão consolidada" e sem "Agenda de atividades" (estão na imagem, mas foram retirados).

## 4. Infográfico

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

## 5. Tabela

- Uma linha por operação, em ordem de DAP, e a linha **Colheita** no fim.
- Colunas: **DAP** · **Fenologia** · **Grupo de operação** · **Operação** · **Prazo para encerramento da OS** · **Talhões** (ex.: 11/12) · **Área (ha)** · **uma coluna por produto** (nome do produto no título; dose com unidade na célula; "—" quando a operação não usa o produto).
- Colunas só com a **largura necessária** (a tabela não estica até a borda); com muitos produtos, rolagem horizontal dentro da tabela.
- **Prazo para encerramento da OS**: campo editável, em dias, que vale para a operação inteira (todos os talhões). Já vem com o padrão: **5 dias** calagem, gessagem, fosfatagem, 1ª dessecação e 1ª adubação potássica; **3 dias** plantio; **2 dias** as demais (e operação nova criada pela pessoa); **10 dias** colheita. No plano aprovado, só texto.
- Fenologia da linha: "Pré-plantio" (DAP negativo), "Plantio" (DAP 0) ou a escolhida na operação; "—" sem fenologia. Colheita: DAP em faixa ("104 a 118").

## 6. Doses

- Todos os talhões com a mesma dose: "Fox Xpro 0,40 L/ha".
- Dose diferente entre talhões (mais de uma recomendação ou dose própria): faixa "KCl 130 a 160 kg/ha"; ao passar o mouse, o detalhe ("130 kg/ha em 7 talhões · 160 kg/ha no T07").
- Formato da dose como nas guias: duas casas nos defensivos e no TSI; sem casas fixas na Fertilidade.

## 7. Regras

- A colheita vem do Plantio: previsão = data de plantio + ciclo da variedade; talhão com variedade sem ciclo fica fora da colheita.
- **A coluna Colheita aparece sempre, no fim.** Antes de haver plantio (variedade, data e ciclo), o título diz "(pelo ciclo da variedade)" e o cartão "Aguardando plantio: a data vem do plantio + ciclo da variedade"; na Tabela, DAP "pelo ciclo".
- Talhões de cada operação: no Plantio, os talhões com variedade; nas outras, os talhões com recomendação.
- Quando duas operações caem no mesmo DAP, a ordem segue a das guias (Semente, Defensivo, Fertilidade).
- O prazo de cada operação e o da colheita vão no arquivo exportado (aba operacoes, coluna previsao_cumprimento; aba plano, prazo_colheita) e voltam no importar.

## 8. Para testar

- **Santa Clara** (aprovado): fases Pré-plantio · Plantio · 1 DAP (sem fenologia) · V2 · V4 · R1 · R3 · R4 · R5 · R7 · Colheita (104 a 118 DAP). Fenologia do exemplo: Pré-emergente sem fenologia (antes da emergência), 1ª Pós V2, 2ª Pós V4, 1ª Fungicida R1, 2ª R3, 3ª R4, 4ª R5, Desfolha R7; adubações de 25 DAP em V4 e 2ª foliar em R3 (do modelo).
- **São José** (em construção): operações sem recomendação ("Sem recomendação", Talhões 0/12) e colunas cinza sem fenologia; editar o prazo na Tabela.

## 9. Sugestões em teste (não validadas)

- Etiqueta do cartão com o **nome do grupo** (Fertilidade); na imagem, calcário e MAP aparecem como "Corretivo" e "Fertilizante".
- Título da coluna de produto só com o nome; a unidade vai com a dose na célula.

## 10. Em aberto

1. Datas reais (data de plantio de cada talhão + DAP) e agenda por data — a "Agenda de atividades" foi retirada por enquanto.
2. Status de cada item (o DECISOES fala em mostrar o status; hoje só "Sem recomendação" e Talhões x/y).
