# Tela 07 — Gestão da Lavoura › Calendário (antes Planejamento Operacional e Operações Agrícolas › Calendário Agrícola)

Atualizado em 05/11/2026 (Mês vira a tabela **Talhão × semanas do mês** e a Semana e o Dia a tabela **Talhão × dias**, com barras que atravessam as colunas; no Mês, na Semana e no Dia, a Safra com uma escolha só; o Ano abre no ano agrícola atual com todos os filtros em Todas; fundo branco). Antes, em 03/11/2026 (vira o item **Calendário** do menu (no mesmo dia chamado Planejamento Operacional; o nome ficou grande no menu), com o ícone do calendário, Gestão da Lavoura, antes a guia Calendário Agrícola do Operações Agrícolas, sem guias no cabeçalho; Mês vira a tabela Operação × semanas do mês). Antes, em 29/10/2026 (o item Planejado x Executado passa a se chamar Operações Agrícolas). Antes, em 27/10/2026 (vira a primeira guia do Planejado x Executado, com os seus próprios filtros; barras do Ano clicáveis; voltar a todos não muda o período; trocar para o Ano volta ao nível Empresa). Antes, em 26/10/2026 (juntou o Calendário Agrícola do menu Plano de Safra, que virou a escala Ano, e a Agenda Agrícola, que ficou com Mês, Semana e Dia; página própria em Gestão da Lavoura, sem as abas de Operações Agrícolas). Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Origem: reunião com stakeholders de 19/10/2026: a guia **Calendário** do Resumo do plano (Tela 05) foi migrada para fora do plano, sem a associação a um plano, como Agenda Agrícola. Em 26/10/2026, a Agenda Agrícola e o Calendário Agrícola do menu viraram uma página só, trocada pela lista suspensa de escala. O refinamento para a programação das OS vem depois.
Imagens: `referencias/05.3-resumo-calendario.png` (Mês, Semana e Dia: a do Calendário do Resumo, de onde veio); Ano: canvas de design (Claude Design, 16/10/2026) e, no escuro, imagem da usuária (19/10/2026). Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** construída.

## Objetivo
Ver as operações planejadas de todas as fazendas (vários planos somados): no **ano agrícola**, por empresa e fazenda, para enxergar o ciclo das culturas; e **dia a dia**, para programar as Ordens de Serviço.

## Quando aparece
- **Primeiro item** do menu **Gestão da Lavoura** (Calendário · Operações · Central OS; 03/11/2026). O nome do grupo, o item e o caminho "⌂ Gestão da Lavoura" levam a esta página (`#/calendario-agricola`).
- Sem nenhum plano cadastrado: o convite "Crie seu primeiro plano para visualizar o Calendário" com "+ Criar Plano de Safra" (como Planejamento e Orçamento).

## Conteúdo
- **Cabeçalho:** sem caminho no topo (03/11/2026), título "Calendário", subtítulo "Consulte as operações agrícolas planejadas por ano, mês, semana ou dia." (04/11/2026), a etiqueta "Últimas versões publicadas ⓘ" à direita (só nesta página). Sem guias (03/11/2026).
- **Os filtros são desta página:** a página Operações tem os dela (Tela 10); ir de uma para a outra não leva os filtros.
- **Filtros** num cartão compacto, os mesmos em todas as escalas, com **várias escolhas** (caixa com Pesquisar, "Todas"/"Todos" e uma marcação por opção), menos a **Safra no Mês, na Semana e no Dia** (uma escolha só; detalhe em Regras): **Safra** (as safras do cadastro: 27/27, 26/27, 26/26, 25/26…, da mais recente para a mais antiga), **Cultura**, **Empresa**, **Fazenda**, **Talhão** e **Operação**, nesta ordem, dividindo a linha; **Limpar filtros** logo depois, com a vassoura e o nome, contorno cinza, texto e ícone pretos, sem negrito (04/11/2026), também com o menu lateral expandido. As opções são as que existem nos planos com versão publicada. No Talhão, os talhões dos planos que passam pelos outros filtros, com a fazenda junto ("Santa Clara · T01"), porque o nome se repete entre fazendas.
- **Operação:** as operações dos grupos à mostra na legenda, pelo nome (o mesmo nome em vários planos é uma opção só, ex.: Adubação de plantio da soja e do milho), na ordem da legenda (Plantio, Fertilidade, Defensivo, Colheita) e, dentro do grupo, na ordem do plano; o grupo aparece ao lado.
- **Sem filtro de Ano Agrícola:** o tempo anda pelas setas do calendário.
- **Barra do calendário:** à esquerda, a **legenda que filtra** os grupos de operação (nesta ordem: Corretivos, Plantio, Fertilidade, Defensivo, Colheita, na cor de cada grupo; 03/11/2026; no Ano, também **Hoje**, com o traço da linha pontilhada cinza, quando hoje cai no período); à direita, **Hoje · ‹ › · período · [lista suspensa de escala]**, com as opções **Ano · Mês · Semana · Dia**.
- **Ano:** a tabela **Empresa › Fazenda › Safra** do ano agrícola (detalhe em Regras).
- **Mês:** a tabela Talhão × semanas do mês (detalhe abaixo) e o rodapé **Área operacional**. **Semana:** a tabela Talhão × dias da semana (detalhe abaixo) e o rodapé **Área operacional**. **Dia:** a tabela Talhão × o dia (detalhe abaixo) e o rodapé **Área operacional**.

## Regras
- **Vários planos somados**, sempre a **última versão publicada de cada plano**; plano sem versão publicada não aparece. Entram as operações já planejadas (com talhão; a colheita depois do plantio), com a data de cada talhão: data de plantio + DAP (Plantio: a data de plantio; Colheita: plantio + ciclo da variedade), até o fim da previsão de conclusão.
- **Abre no Mês**, no **mês de hoje** (03/11/2026; antes abria no Ano). Ao trocar para o Ano, vale a regra da troca de escala (abaixo); o ano agrícola guardado de início é o de hoje (01/09 a 31/08) ou, sem plano publicado nele, o mais recente com planos. A escala, o ano agrícola, o dia mostrado, os filtros e o dia aberto se mantêm ao navegar entre telas. **Limpar filtros** mantém a escala, o ano agrícola e o dia mostrado.
- **Legenda:** pelos tipos de grupo (os nomes vêm dos planos). **Um grupo por vez:** clicar num grupo mostra só ele; clicar em outro grupo substitui o anterior. Clicar de novo no grupo à mostra, ou em "Mostrar todos", volta a todos os grupos.
- **Troca de escala** (05/11/2026): do Mês, da Semana ou do Dia para o Ano, vai para o **ano agrícola atual** (o de hoje ou, sem planos publicados nele, o mais recente), inteiro, no **nível Empresa** (empresas e fazendas fechadas, como ao abrir), com **todos os filtros em Todas** (safras e safrinhas, culturas, empresas, fazendas, talhões, operações e todos os grupos da legenda). Do Ano para Mês, Semana ou Dia, **voltam os filtros escolhidos antes** no Mês, se os do Ano não foram mexidos (mexidos, valem os do Ano, com a primeira safra marcada); fica no dia mostrado antes, se ele estiver no ano agrícola; senão, em **hoje** (se for o ano agrícola de hoje) ou em **01/09** do ano agrícola.

### Ano
- **Hoje · ‹ › · ano · [Ano ▾]:** o ano aparece só como "2026" ("Ano agrícola 2026" ao passar o mouse). As setas trocam o ano agrícola, entre os anos que têm planos publicados (apagadas no primeiro e no último); **Hoje** volta ao ano agrícola de hoje (ou ao mais recente com planos). Escolher um grupo na legenda ou operações no filtro Operação **não muda o ano**.
- Tabela **Empresa › Fazenda › Safra** (a safra só pelo número: 26/27, 27/27), com os planos do ano agrícola que passam pelos filtros Safra, Cultura, Empresa e Fazenda. **Abre no nível Empresa** (empresas e fazendas fechadas); a seta abre e fecha cada empresa e cada fazenda (a escolha se mantém ao navegar).
- **Barras só no nível mais aberto de cada ramo:** empresa fechada mostra as operações de todas as fazendas dela juntas; ao abrir a empresa, as barras passam para as fazendas; ao abrir a fazenda, ficam só na safra e na safrinha. Juntar: a mesma operação da mesma cultura vai do primeiro ao último dia.
- Colunas: **Fazenda / Safra · Cultura · Área** · a linha do tempo, **do mês da primeira operação ao da última** (ex.: junho de 2026, calagem, a junho de 2027), uma coluna por mês. Empresa: a área total. Fazenda: a **sucessão de culturas** ("Soja → Milho"), a área dos talhões. Safra e safrinha: "Safra 26/27" / "Safrinha 27/27", a cultura e a área.
- **Cada operação é uma barra transparente e arredondada**, do início no primeiro talhão ao fim da previsão de conclusão no último, numa **faixa por grupo de operação** (Operação de campo cinza, antes do Plantio; Plantio verde; Fertilidade e Aplicação de insumos roxo; Defensivo laranja; Colheita dourado; 29/10/2026). Onde operações do mesmo grupo se sobrepõem, a cor fica mais forte. Entram os talhões com data de plantio que passam pelo filtro Talhão, e as operações que passam pelo filtro Operação e pela legenda. Nome, grupo, cultura, datas e área ao passar o mouse, com "Clique para ver no mês".
- **Clicar numa barra** leva ao **Mês**, no mês do começo da operação (o primeiro talhão). Marca os filtros da linha da barra (linha da empresa: Empresa; da fazenda: Empresa e Fazenda; da safra: Empresa, Fazenda e Safra) e a **Cultura** da barra. A operação **não vira filtro**: o Mês mostra todas as operações, e não aparece "Mostrar todos". Depois do clique, **Hoje** volta aos filtros de antes do clique e vai para hoje; mexer num filtro, Limpar filtros ou voltar ao Ano encerra isso.
- **Hoje: só a linha vertical pontilhada cinza** (igual no claro e no escuro), sem etiqueta. Sem versão nas linhas e sem nota de rodapé.
- Sem planos com os filtros no ano: "Nenhum plano publicado com esses filtros neste ano agrícola." Com planos, mas sem operação com data: "Nenhuma operação com data nos planos publicados com esses filtros."

### Mês, Semana e Dia
- **Hoje · ‹ › · período · [Mês ▾]:** as setas andam um mês, uma semana ou um dia, atravessando os anos.
- Escolher um grupo na legenda ou operações no filtro Operação leva o calendário para a **operação escolhida mais cedo** (mesmo que já tenha passado), na escala aberta. Voltar a todos (**Mostrar todos**, clicar de novo no grupo à mostra ou Operação em Todas) **não muda o período**: só mostra de novo as operações dele. Só o botão **Hoje** vai para hoje.
- **Filtros no Mês, na Semana e no Dia** (05/11/2026): a **Safra** tem **uma escolha só** (botões de opção, sem "Todas"); Cultura, Empresa, Fazenda, Talhão e Operação, várias. Ao abrir (e com Limpar filtros), a **safra atual** (a que contém hoje, a safra antes da safrinha) ou, sem ela, a mais recente; o resto em Todas. A **Empresa** só lista as que têm a safra escolhida e a **Fazenda** só as dessas empresas e da safra, em ordem alfabética; trocando a safra, se nenhuma marcada existe nela, voltam a Todas.
- **Mês** (05/11/2026, imagens da usuária; antes uma linha por operação e, antes ainda, a grade de dias): uma **tabela Talhão × semanas do mês**, no **fundo branco** da página.
  - **Cabeçalho** em cinza claro, parado ao rolar: **Talhão** (à esquerda, no formato dos títulos das semanas) e as **semanas do calendário (domingo a sábado) cortadas no começo e no fim do mês**, com as datas em negrito, "01–07 nov". Novembro de 2026: 01–07 · 08–14 · 15–21 · 22–28 · 29–30 nov; dezembro de 2026: 01–05 · 06–12 · 13–19 · 20–26 · 27–31 dez; semana de um dia só, "31 mai".
  - **Coluna Talhão** (parada ao rolar para o lado), no formato do cartão do talhão da Planejado × Executado: **T01** em negrito, embaixo a **fazenda** e, menor e em cinza, a **variedade** do Plantio (mais de uma, separadas por vírgula; sem plantio, "—").
  - **Linhas:** **todos os talhões** dos planos que passam pelos filtros (também o Talhão), mesmo sem operação no mês, **ordenados pelo nome da fazenda e pelo do talhão** (T01, T02…). O mesmo talhão em mais de um plano é uma linha só.
  - **Barras:** cada operação de um talhão é uma **barra** no fundo claro da cor do grupo, com a bolinha e o **nome em negrito**, que ocupa as **semanas inteiras** do início ao fim da previsão de conclusão; semanas seguidas viram **uma barra só**, como um evento de vários dias no Google Agenda. Duas operações na mesma semana do mesmo talhão ficam uma embaixo da outra (a linha cresce). Ao passar o mouse: "2ª Fungicida · Boa Vista · 26/27 · 10 – 18 nov 2026 · T01 · 132 ha". Semanas que já passaram: as barras esmaecidas.
  - **Clicar em qualquer lugar do título de uma semana** (a célula cinza inteira, não só a data "15–21 nov") abre a **Semana** (domingo a sábado) com **todas as operações** (sem mexer nos filtros); as barras não são clicáveis (03/11/2026). A **semana de hoje** tem o título em texto branco num **fundo verde-escuro arredondado**, como o número do dia de hoje no calendário.
  - Muitos talhões: a tabela rola por dentro; o rodapé **Área operacional** fica no fim da tela.
- **Semana** (05/11/2026; antes a grade com caixinhas e etiquetas de talhão): a **mesma tabela do Mês**, com a coluna **Talhão** (talhão, fazenda e variedade; ordenada por fazenda e talhão) e as **7 colunas dos dias, de domingo a sábado**.
  - **Título do dia em duas linhas:** "dom" em cima (menor, cinza) e "15 nov" embaixo, em negrito; o título **Talhão** fica centralizado na altura das duas linhas, à esquerda. **Hoje:** a data no fundo verde-escuro arredondado.
  - **Barras:** cada operação ocupa os dias do início ao fim da previsão de conclusão; dias seguidos viram uma barra só. Dias que já passaram, esmaecidos.
  - **Clicar no título de um dia** abre o **Dia** daquela data.
- **Dia** (05/11/2026, imagem da usuária; antes a lista do dia com as etiquetas dos talhões): a **mesma tabela**, com a coluna **Talhão** e **uma coluna só**, a do dia ("dom" em cima e "01 nov" embaixo; hoje no verde-escuro; não clicável). Todos os talhões; as operações em andamento no dia, cada uma numa barra com a bolinha e o nome (duas no mesmo talhão, uma embaixo da outra). A tabela fica estreita, à esquerda.
- **Hoje** (05/11/2026): só vai para o período de hoje na escala aberta; **sem painel do dia** à direita (saiu).
- **Dias que já passaram** (antes de hoje): as operações aparecem **esmaecidas** (Mês, Semana e Dia), como no Google Agenda. Hoje e os dias seguintes, na cor normal.
- Ao passar o mouse numa operação: nome, fazenda e safra, período, área e talhões.
- Operações planejadas sem data de plantio nos talhões: ficam fora, com o aviso "N operações planejadas ficam fora do calendário: sem data de plantio nos talhões dela."

### Geral
- Com uma caixa de filtro aberta, **Esc** fecha a caixa.

## Navegação
- Menu Gestão da Lavoura (o nome ou o item Calendário) → esta página (`#/calendario-agricola`).
- Item Operações → a Tela 10.
- Ano › clique numa barra → Mês, no começo da operação.
- "+ Criar Plano de Safra" (sem planos) → modal Criar Plano (Tela 02).

## Para testar
- Abre no Mês de hoje (novembro de 2026), na safra 26/27: Empresa B › Boa Vista, T01 a T10; a 2ª Fungicida do T01 numa barra só de 08 a 21 nov. Safra 25/26: Empresa A, talhões da Santa Clara.
- Trocar para Ano: ano agrícola 2026, todos os filtros em Todas, empresas fechadas; abrir a empresa e a Boa Vista mostra a soja 26/27 e o milho safrinha 27/27.
- ‹ no Ano: ano agrícola 2025, com a soja 25/26 e o milho safrinha 26/26 da Santa Clara.
- Voltar para o Mês: os filtros de antes (ex.: 25/26 › Empresa A › Santa Clara).
- Ano, Empresa B › Boa Vista aberta, clique na barra roxa de maio da 26/27 → Mês de maio, com todas as operações; filtros Empresa B, Boa Vista, 26/27 e Soja; Operação em Todas. Hoje → volta aos filtros de antes e vai para hoje.
- Mês com um grupo escolhido na legenda, Mostrar todos → o mesmo mês, com todos os grupos.
- Semana de 15 a 21 nov de 2026: a 2ª Fungicida do T03 de sex a sáb; clicar em "sex 20 nov" abre o Dia 20 de novembro de 2026.

## Sugestões (a validar)
- Dia: mostrar mais detalhes na barra (o período, "10 – 18 nov", e a safra), que hoje só aparecem ao passar o mouse.
- Mês: com muitas operações na mesma semana de um talhão, juntar em "+N" (como no Google Agenda), para a linha não crescer demais.
- Mês: o rodapé Área operacional ainda soma as operações que começam no mês; talvez somar pelas barras à mostra.
- Renomear o arquivo deste doc para `07-calendario-agricola.md` (o nome atual vem da Agenda Agrícola).
