# Tela 07 — Gestão da Lavoura › Calendário Agrícola

Atualizado em 26/10/2026 (juntou o Calendário Agrícola do menu Plano de Safra, que virou a escala Ano, e a Agenda Agrícola, que ficou com Mês, Semana e Dia; página própria em Gestão da Lavoura, sem as abas de Operações Agrícolas). Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Origem: reunião com stakeholders de 19/10/2026: a guia **Calendário** do Resumo do plano (Tela 05) foi migrada para fora do plano, sem a associação a um plano, como Agenda Agrícola. Em 26/10/2026, a Agenda Agrícola e o Calendário Agrícola do menu viraram uma página só, trocada pela lista suspensa de escala. O refinamento para a programação das OS vem depois.
Imagens: `referencias/05.3-resumo-calendario.png` (Mês, Semana e Dia: a do Calendário do Resumo, de onde veio); Ano: canvas de design (Claude Design, 16/10/2026) e, no escuro, imagem da usuária (19/10/2026). Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** construída.

## Objetivo
Ver as operações planejadas de todas as fazendas (vários planos somados): no **ano agrícola**, por empresa e fazenda, para enxergar o ciclo das culturas; e **dia a dia**, para programar as Ordens de Serviço.

## Quando aparece
- Menu lateral **Gestão da Lavoura** (grupo com setinha para minimizar, como o Plano de Safra) › **Calendário Agrícola**, o primeiro item (depois vêm Central OS, Tela 09, e Planejado x Executado, Tela 10). O nome do grupo também leva a esta página (`#/calendario-agricola`).
- Sem nenhum plano cadastrado: o convite "Crie seu primeiro plano para visualizar o Calendário Agrícola" com "+ Criar Plano de Safra" (como Planejamento e Orçamento).

## Conteúdo
- **Cabeçalho:** caminho no topo "⌂ Gestão da Lavoura › Calendário Agrícola", título "Calendário Agrícola", subtítulo "As operações planejadas de todas as fazendas: o ano agrícola por empresa e fazenda, e o dia a dia no mês, na semana e no dia." e a etiqueta "Últimas versões publicadas ⓘ" à direita.
- **Filtros** num cartão compacto, os mesmos em todas as escalas, todos com **várias escolhas** (caixa com Pesquisar, "Todas"/"Todos" e uma marcação por opção): **Safra** (as safras do cadastro: 27/27, 26/27, 26/26, 25/26…, da mais recente para a mais antiga), **Cultura**, **Empresa**, **Fazenda**, **Talhão** e **Operação**, nesta ordem; **Limpar filtros** à direita. As opções são as que existem nos planos com versão publicada. No Talhão, os talhões dos planos que passam pelos outros filtros, com a fazenda junto ("Santa Clara · T01"), porque o nome se repete entre fazendas.
- **Operação:** as operações dos grupos à mostra na legenda, pelo nome (o mesmo nome em vários planos é uma opção só, ex.: Adubação de plantio da soja e do milho), na ordem da legenda (Plantio, Fertilidade, Defensivo, Colheita) e, dentro do grupo, na ordem do plano; o grupo aparece ao lado.
- **Sem filtro de Ano Agrícola:** o tempo anda pelas setas do calendário.
- **Barra do calendário:** à esquerda, a **legenda que filtra** os grupos de operação (Plantio, Fertilidade, Defensivo, Colheita, na cor de cada grupo; no Ano, também **Hoje**, com o traço da linha pontilhada cinza, quando hoje cai no período); à direita, **Hoje · ‹ › · período · [lista suspensa de escala]**, com as opções **Ano · Mês · Semana · Dia**.
- **Ano:** a tabela **Empresa › Fazenda › Safra/Safrinha** do ano agrícola (detalhe em Regras).
- **Mês, Semana e Dia:** a **grade** de domingo a sábado, o **painel do dia** e o rodapé **Área operacional** do período, como eram no Resumo (Tela 05, antiga seção 6.1).

## Regras
- **Vários planos somados**, sempre a **última versão publicada de cada plano**; plano sem versão publicada não aparece. Entram as operações já planejadas (com talhão; a colheita depois do plantio), com a data de cada talhão: data de plantio + DAP (Plantio: a data de plantio; Colheita: plantio + ciclo da variedade), até o fim da previsão de conclusão.
- **Abre no Ano**, no **ano agrícola de hoje** (01/09 a 31/08) ou, sem plano publicado nele, no **mais recente com planos**. A escala, o ano agrícola, o dia mostrado, os filtros e o dia aberto se mantêm ao navegar entre telas. **Limpar filtros** mantém a escala, o ano agrícola e o dia mostrado.
- **Legenda:** pelos tipos de grupo (os nomes vêm dos planos). **Um grupo por vez:** clicar num grupo mostra só ele; clicar em outro grupo substitui o anterior. Clicar de novo no grupo à mostra, ou em "Mostrar todos", volta a todos os grupos.
- **Troca de escala:** do Mês, da Semana ou do Dia para o Ano, vai para o ano agrícola do dia mostrado (se ele tiver planos publicados; senão, fica o ano que estava). Do Ano para Mês, Semana ou Dia, fica no dia mostrado antes, se ele estiver no ano agrícola; senão, em **hoje** (se for o ano agrícola de hoje) ou em **01/09** do ano agrícola.

### Ano
- **Hoje · ‹ › · ano · [Ano ▾]:** o ano aparece só como "2026" ("Ano agrícola 2026" ao passar o mouse). As setas trocam o ano agrícola, entre os anos que têm planos publicados (apagadas no primeiro e no último); **Hoje** volta ao ano agrícola de hoje (ou ao mais recente com planos). Escolher um grupo na legenda ou operações no filtro Operação **não muda o ano**.
- Tabela **Empresa › Fazenda › Safra/Safrinha**, com os planos do ano agrícola que passam pelos filtros Safra, Cultura, Empresa e Fazenda. **Abre no nível Empresa** (empresas e fazendas fechadas); a seta abre e fecha cada empresa e cada fazenda (a escolha se mantém ao navegar).
- **Barras só no nível mais aberto de cada ramo:** empresa fechada mostra as operações de todas as fazendas dela juntas; ao abrir a empresa, as barras passam para as fazendas; ao abrir a fazenda, ficam só na safra e na safrinha. Juntar: a mesma operação da mesma cultura vai do primeiro ao último dia.
- Colunas: **Fazenda / Safra · Cultura · Área** · a linha do tempo, **do mês da primeira operação ao da última** (ex.: junho de 2026, calagem, a junho de 2027), uma coluna por mês. Empresa: a área total. Fazenda: a **sucessão de culturas** ("Soja → Milho"), a área dos talhões. Safra e safrinha: "Safra 26/27" / "Safrinha 27/27", a cultura e a área.
- **Cada operação é uma barra transparente e arredondada**, do início no primeiro talhão ao fim da previsão de conclusão no último, numa **faixa por grupo de operação** (Plantio verde, Fertilidade roxo, Defensivo laranja, Colheita dourado). Onde operações do mesmo grupo se sobrepõem, a cor fica mais forte. Entram os talhões com data de plantio que passam pelo filtro Talhão, e as operações que passam pelo filtro Operação e pela legenda. Nome, grupo, cultura, datas e área ao passar o mouse.
- **Hoje: só a linha vertical pontilhada cinza** (igual no claro e no escuro), sem etiqueta. Sem versão nas linhas e sem nota de rodapé.
- Sem planos com os filtros no ano: "Nenhum plano publicado com esses filtros neste ano agrícola." Com planos, mas sem operação com data: "Nenhuma operação com data nos planos publicados com esses filtros."

### Mês, Semana e Dia
- **Hoje · ‹ › · período · [Mês ▾]:** as setas andam um mês, uma semana ou um dia, atravessando os anos.
- Escolher um grupo na legenda ou operações no filtro Operação leva o calendário para a **operação escolhida mais cedo** (mesmo que já tenha passado), na escala aberta; voltar a todos volta para **hoje**.
- **Mês:** a tela inteira cabe na janela (cabeçalho e filtros compactos; a grade ocupa a altura que sobra, com mínimo de 300 px). Etiquetas finas só com o nome; as que não cabem no dia viram "+N mais". **Sem etiquetas de talhão no Mês** (não cabem).
- **Semana:** cada operação numa caixinha com o nome, a área e **uma etiqueta por talhão** (T05, T06…, em ordem); a caixinha cresce para caber as etiquetas. Todas as operações do dia aparecem (o dia rola por dentro se a lista for longa).
- **Dia e painel do dia:** cada operação com o nome, **de onde vem** ("Boa Vista · Safra 26/27"), a área, o número de talhões e as **etiquetas dos talhões**; com mais de 12, "+N talhões" mostra todos ("Mostrar menos" volta).
- **Dias que já passaram** (antes de hoje): as operações aparecem **esmaecidas** (Mês, Semana, Dia e painel do dia), como no Google Agenda. Hoje e os dias seguintes, na cor normal.
- Ao passar o mouse numa operação: nome, fazenda e safra, período, área e talhões.
- Operações planejadas sem data de plantio nos talhões: ficam fora, com o aviso "N operações planejadas ficam fora do calendário: sem data de plantio nos talhões dela."

### Geral
- Com uma caixa de filtro aberta, **Esc** fecha a caixa.

## Navegação
- Menu Gestão da Lavoura, Gestão da Lavoura › Calendário Agrícola ou o caminho "⌂ Gestão da Lavoura" → esta página (`#/calendario-agricola`).
- "+ Criar Plano de Safra" (sem planos) → modal Criar Plano (Tela 02).

## Para testar
- Abre em Ano, no ano agrícola 2026: empresas fechadas; abrir a empresa e a Boa Vista mostra a soja 26/27 e o milho safrinha 27/27.
- ‹ no Ano: ano agrícola 2025, com a soja 25/26 e o milho safrinha 26/26 da Santa Clara.
- Trocar para Mês: outubro de 2026 (ou o mês de hoje), com as operações da Boa Vista. Voltar para Ano: o ano agrícola do mês mostrado.
- Semana do começo de outubro de 2026: plantio em vários talhões, com as etiquetas.

## Sugestões (a validar)
- Na caixinha da Semana, mostrar a fazenda junto da área quando há mais de uma fazenda ("Boa Vista · 203 ha").
- Renomear o arquivo deste doc para `07-calendario-agricola.md` (o nome atual vem da Agenda Agrícola).
