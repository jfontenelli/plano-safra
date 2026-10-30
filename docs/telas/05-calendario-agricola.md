# Tela 05 — Calendário Agrícola

Atualizado em 29/10/2026 (resumo das fases sem a área; Ciclo Produtivo com as variedades e as doses com área; filtro Operação; Área (ha) depois da Operação; colunas Consumo e Dose, antes Unid.; data prevista com o mês em número; texto das colunas fixas quebra a linha). Antes, em 26/10/2026 (a guia Calendário, que saiu em 19/10/2026, hoje são as escalas Mês, Semana e Dia do Calendário Agrícola de Gestão da Lavoura, Tela 07). Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Tudo é **Definido**, exceto as seções "Sugestões em teste" e "Em aberto".
Imagens: `referencias/05-calendario-agricola.png` (Ciclo Produtivo), `referencias/05-calendario-tabela.png` (Programação) e `referencias/05.3-resumo-calendario.png` (Calendário). Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** construída.

---

## 1. Objetivo

Ver **todas as operações do plano juntas**, de todos os grupos (Plantio, Defensivo, Fertilidade…), na ordem em que acontecem na safra, com os produtos e doses de cada uma, e o resumo do planejamento. É o único lugar do plano que junta todos os grupos. **Abre com todas as operações cadastradas na etapa Operações** e vai se preenchendo conforme o planejamento.

## 2. Lugar na jornada

- Etapa **Calendário Agrícola** do plano, na aba **Programação** do cabeçalho (Planejamento · Programação · Revisão; antes Resumo, renomeada em 20/10/2026). Mesmo cabeçalho do plano da Tela 04 (com o botão Exportar).
- Os dados vêm do que foi planejado nas guias da etapa Planejamento. O calendário cresce durante o planejamento.

## 3. Barra de cima

- **Duas visões em guias**, à esquerda, numa linha própria com uma linha embaixo: **Tabela** (antes Programação; 20/10/2026) · **Ciclo Produtivo** (antes Infográfico) (ícone e nome; a ativa em verde-claro com traço verde embaixo). **Abre na Programação.**
- Embaixo, os filtros **Grupo de operação**, **Operação** e **Talhão**.
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
- **Cartões** das operações da fase: etiqueta do **grupo** (Plantio, Tratamento de semente, Defensivo, Fertilidade, Colheita), nome da operação e, embaixo (29/10/2026; antes, "N variedades" e a faixa "130 a 160 kg/ha"): no **Plantio**, o **nome de cada variedade com a área** ("TMG 2383 IPRO · 300 ha", da maior área para a menor; a área é a soma das áreas de aplicação); nos **produtos**, cada produto com **cada dose e a área em que ela é aplicada** ("Calcário A" / "2 t/ha · 100 ha" / "3 t/ha · 10 ha"; doses iguais somam a área; dose própria de talhão em linha separada). A **Colheita** lista as variedades com previsão, com a área. Tudo segue o filtro Talhão. O TSI (grupo Tratamento de semente) é um cartão próprio na fase do DAP informado, com os produtos. Operação sem recomendação: "Sem recomendação", em cinza.
- **Resumo no pé** de cada fase: talhões · operações ("10 talhões · 4 operações"; a área saiu em 29/10/2026).
- **Todas as fases com a mesma altura** (a altura livre da tela, mínimo de 360 px); o **resumo fica travado** no rodapé, na mesma linha em todas as colunas. O que passa da altura **rola dentro da própria fase** (título, ilustração e resumo ficam parados).
- Sem o prazo para encerramento da OS (ele fica na Tabela).

## 6. Programação (antes Tabela)

- **Na ordem da safra** (pré-plantio, plantio, manejo da cultura e colheita), **sem faixa com o nome da fase** (como na Revisão; confundia).
- Colunas: **DAP · Fenologia · Data prevista · Operação · Área (ha) · Produto · Consumo · Dose** e **uma coluna por talhão** (nome, variedade e área no cabeçalho; com o filtro, só os talhões marcados).
- **Filtros Grupo de operação, Operação e Talhão** (abaixo das guias): cada um é uma caixa com a busca **Pesquisar** no topo, "Todos os grupos" / "Todas as operações" / "Todos os talhões" e uma marcação por opção (no talhão, com a área); dá para marcar vários. O botão mostra "Todos…", o nome (um só), "N grupos" / "N operações" / "N talhões" ou "Nenhum…". Os grupos são os do plano com operação, na ordem do plano, e a Colheita no fim. **Operação** (29/10/2026): as operações já planejadas dos grupos marcados, na ordem do DAP (a Colheita no fim, depois do plantio); trocar o Grupo de operação volta a Operação para Todas. Valem para as duas visões.
- **Calendário sempre ampliado**: ocupa a área logo abaixo das abas do plano, sem botão Expandir/Recolher (testado e retirado). Acima dele, só as guias e os filtros. No plano aprovado, a faixa "somente leitura" não aparece no Calendário (o selo **Aprovado** fica no cabeçalho). Com uma caixa de filtro aberta, a tecla **Esc** fecha a caixa.
- **Uma linha por produto**, com o **Consumo** (dose × área, somando os talhões do filtro que recebem o produto, na unidade sem o "/ha": "0,40 L/ha" em 435 ha → "174 L"; dose própria do talhão entra com o valor dele), a **Dose** (a unidade, ex.: L/ha; antes "Unid.") e a **dose de cada talhão**; DAP, Fenologia, Data prevista, Operação e Área ocupam a altura de todos os produtos da operação. Na célula da Operação, o nome em negrito e o **grupo como etiqueta** embaixo. No Plantio, as linhas são **Data de plantio** e **População** (mil pl/ha); na Colheita, **Previsão de colheita** (nessas linhas, o Consumo fica em branco). Operação sem talhão planejado: uma linha, com **"Sem recomendação"** (no Plantio, "Sem variedade") na coluna Produto (na Dose, se o Produto estiver oculto).
- **Nome da operação é um link** (verde, sublinhado; ao passar o mouse, "Abrir 2ª Fungicida no Planejamento"): abre a aba **Planejamento** no grupo da operação, com ela aberta. A Colheita e as operações "Sem grupo" não têm link (não estão no Planejamento).
- **Linhas de grade** entre todas as colunas; sem abrir e fechar.
- **Colunas congeladas** ao rolar para a direita: DAP, Fenologia, Data prevista, Operação, Área, Produto, Consumo e Dose ficam paradas à esquerda (com uma sombra na borda depois da Dose); só os talhões rolam. O cabeçalho também fica parado ao rolar para baixo. No menu do botão direito do cabeçalho (qualquer coluna), **Descongelar colunas** faz tudo rolar junto (mesma ordem e larguras; o cabeçalho continua parado ao rolar para baixo); o item vira **Congelar colunas** para voltar. Abre sempre congelada.
- **Nomes das colunas de DAP até Dose** centralizados na horizontal e na vertical, na célula do cabeçalho.
- **Larguras fixas** das colunas congeladas: DAP 64 · Fenologia 96 · Data prevista 120 · Operação 170 · Área 84 · Produto 150 · Consumo 104 · Dose 96. **O texto quebra a linha quando não cabe**, em todas elas (ex.: o DAP da colheita, "104 a 116"; 29/10/2026), sem cortar.
- **Ocultar e exibir colunas** (como no Excel), em **todas as colunas**, de DAP até Dose e cada talhão: o **botão direito** em qualquer lugar do cabeçalho da coluna (sem seta; o clique esquerdo não faz nada) abre o menu **Ocultar coluna** (e **Exibir todas as colunas**, quando há alguma oculta). A coluna oculta vira uma **faixa estreita com traço duplo**; clicar na faixa exibe a coluna de novo. As demais colunas congeladas se ajustam à esquerda. Com o menu aberto, **Esc** ou um clique fora fecha o menu. Ocultar um talhão só estreita a coluna (ele continua no filtro Talhão, que tira a coluna da tabela).
- **Data prevista:** data de plantio + DAP da operação, nos talhões que recebem a operação (sem talhão planejado, nos talhões do filtro com plantio). Datas diferentes entre talhões viram **intervalo**, com o **mês em número** (29/10/2026): "05/10/2026"; "01–20/10/2026"; "22/09–10/10/2026"; "28/12/2026–05/01/2027". Colheita: a previsão de colheita dos talhões. Sem plantio ou sem DAP: "—".
- **Área (ha):** só o número (sem "ha" na célula), a soma da área dos talhões que recebem a operação (com o filtro, só os talhões marcados); no Plantio, os talhões com variedade; na Colheita, os com previsão. Sem talhão planejado: "—".
- **Dose do talhão diferente da padrão da receita**: sem destaque de cor por enquanto (o amarelo foi testado e retirado); ao passar o mouse, a dose padrão. **Talhão que não recebe** o produto: "—" em cinza.
- A **previsão de conclusão** não aparece nem se edita aqui (vale o padrão do modelo; DECISOES 4.3).
- Fenologia da linha: a escolhida na operação; "—" no pré-plantio (DAP negativo), no plantio (DAP 0), na colheita e sem fenologia. Colheita: DAP em faixa ("104 a 118").

## 6.1 Calendário (saiu do Resumo)

- A terceira visão, **Calendário** (Mês, Semana, Dia), saiu do Resumo em 19/10/2026 (reunião com stakeholders) e hoje são as escalas Mês, Semana e Dia do **Calendário Agrícola** (Gestão da Lavoura › Operações Agrícolas, primeira guia), sem a associação a um plano. O detalhe está na **Tela 07** (docs/telas/07-agenda-agricola.md).

## 7. Doses no Ciclo Produtivo

- Todos os talhões com a mesma dose: "Fox Xpro 0,40 L/ha".
- Dose diferente entre talhões (mais de uma recomendação ou dose própria): faixa "KCl 130 a 160 kg/ha"; ao passar o mouse, o detalhe ("130 kg/ha em 7 talhões · 160 kg/ha no T07").
- Formato da dose como nas guias: duas casas nos defensivos e no TSI; sem casas fixas na Fertilidade.

## 8. Regras

- **Só as operações já planejadas** aparecem (com produto e dose; no Plantio, variedade), na ordem do DAP, **em construção e no aprovado**. Operação ainda sem recomendação não aparece em nenhuma das visões. Qualquer mudança em Operações ou no Planejamento aparece ao voltar ao Calendário. (Antes, em construção, todas as operações cadastradas apareciam como "Sem recomendação"; testado e trocado.)
- **Nada planejado ainda: estado vazio centralizado** (não é aviso: não há nada errado), abaixo das guias Tabela | Ciclo Produtivo, que continuam na barra: o ícone da visão (tabela ou gráfico) num círculo verde-claro de 52 px, o título "**Nenhuma operação planejada ainda**" (16 px), o texto "As operações planejadas aparecem aqui com datas e doses por talhão." (14 px, cinza) e o botão verde **"Ir para o Planejamento →"**, que abre a aba Planejamento na guia **Plantio** (sem ela, na primeira guia), como o clique na aba (pergunta antes, se houver alteração não salva). Largura máxima de 420 px, texto centralizado. Igual na versão publicada (o Planejamento abre para consulta). Com operações planejadas (em qualquer talhão, sem olhar o filtro de talhão), o estado vazio não aparece e os filtros ficam sempre à vista; se os filtros esconderem tudo (ex.: nenhum talhão marcado), a Programação e o Ciclo Produtivo dizem "Nenhuma operação com os filtros escolhidos" (20/10/2026).

- A colheita vem do Plantio: previsão = data de plantio + ciclo da variedade; talhão com variedade sem ciclo fica fora da colheita.
- **A Colheita aparece no fim, depois que houver plantio** (variedade, data e ciclo), com a previsão de colheita.
- Talhões de cada operação: no Plantio, os talhões com variedade; nas outras, os talhões com recomendação.
- Quando duas operações caem no mesmo DAP, a ordem segue a das guias (Plantio, Defensivo, Fertilidade).
- O prazo de cada operação e o da colheita vão no arquivo exportado (aba operacoes, coluna previsao_cumprimento; aba plano, prazo_colheita) e voltam no importar.

## 9. Para testar

- **Santa Clara, soja 25/26** (publicado): fases Pré-plantio · Plantio · 1 DAP (sem fenologia) · V2 · V4 · R1 · R3 · R4 · R5 · R7 · Colheita (104 a 118 DAP). Fenologia do exemplo: Pré-emergente sem fenologia (antes da emergência), 1ª Pós V2, 2ª Pós V4, 1ª Fungicida R1, 2ª R3, 3ª R4, 4ª R5, Desfolha R7; adubações de 25 DAP em V4 e 2ª foliar em R3 (do modelo).
- **Plano criado na hora** (em construção): o que já estiver planejado; sem nada planejado, o estado vazio "Nenhuma operação planejada ainda", com o botão "Ir para o Planejamento".

## 10. Sugestões em teste (não validadas)

- Etiqueta do cartão com o **nome do grupo** (Fertilidade); na imagem, calcário e MAP aparecem como "Corretivo" e "Fertilizante".
- Título da coluna de produto só com o nome; a unidade vai com a dose na célula.

## 11. Em aberto

1. Ajustar o número de faixas ao redimensionar a janela (hoje só no próximo clique).
2. Status de cada item (o DECISOES fala em mostrar o status; hoje só "Sem recomendação" e Talhões x/y).
