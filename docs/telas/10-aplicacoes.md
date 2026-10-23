# Tela 10 — Aplicações (Monitoramento › Aplicações)

Atualizado em 23/10/2026 (legenda Operação com os nomes Não iniciada, Iniciada antes, Iniciada na data, Iniciada com atraso e Planejada, e dicas; Iniciada antes em azul; Planejadas × Executadas sem eixo e sem barra, tudo na mesma altura, com o nome do status acima da etiqueta; antes, no mesmo dia: guias no formato das abas do plano e nova guia Duração da Aplicação). Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Imagem: imagens da usuária (22 e 23/10/2026). Os valores das imagens são ilustrativos; vale o layout.

## Objetivo
Acompanhar, talhão a talhão, as aplicações de uma safra: quando cada operação foi executada e se foi iniciada antes, na data ou com atraso, se ainda não foi iniciada ou se está planejada, e quanto tempo as OS fechadas levaram em relação ao prazo de conclusão. Uso principal: as aplicações de fungicida (que levam outros produtos junto; o pessoal chama de "a fungicida").

## Quando aparece
Menu lateral **Monitoramento** (grupo com setinha, como Plano de Safra e Gestão da Lavoura) › **Aplicações**. O nome do grupo também leva à página. Sem nenhum plano cadastrado: "Crie seu primeiro plano para visualizar as Aplicações" e o botão "+ Criar Plano de Safra".

## Conteúdo
1. **Cabeçalho:** caminho "⌂ Monitoramento › Aplicações", título **Aplicações**, o subtítulo da guia escolhida e as guias **Executadas · Planejadas × Executadas · Duração da Aplicação**, no mesmo formato das abas do plano (Operações · Planejamento · Programação): a escolhida em negrito, com o traço verde embaixo. Abre em Executadas.
   - Executadas: "Consulte as datas de execução e o status das operações por talhão."
   - Planejadas × Executadas: "Compare as datas planejadas e executadas das operações por talhão."
   - Duração da Aplicação: "Compare a duração das OS fechadas com o prazo de conclusão da operação."
2. **Filtros**, com várias escolhas (as caixas da Agenda Agrícola, com Pesquisar e "Todas"/"Todos"), nesta ordem: **Safra** (as do cadastro, da mais recente para a mais antiga), **Cultura**, **Empresa**, **Fazenda**, **Talhão** ("Boa Vista · T01"), **Grupo de operação** e **Operação**; **Limpar filtros** à direita. Exceção na Duração da Aplicação › Por talhão (item 6).
3. **Legenda "Operação"** acima da tabela, em Executadas e Planejadas × Executadas: **Não iniciada · Iniciada antes · Iniciada na data · Iniciada com atraso · Planejada**, com bolinhas nas cores do status (Planejada: círculo tracejado cinza). Em Executadas, a Não iniciada tem o ícone da tabela: a bolinha vermelha com exclamação. Ao passar o mouse, a dica de cada uma:
   - Não iniciada: "A data planejada já passou, mas a operação ainda não foi iniciada."
   - Iniciada antes: "A operação foi iniciada antes da data planejada."
   - Iniciada na data: "A operação foi iniciada na data planejada."
   - Iniciada com atraso: "A operação foi iniciada após a data planejada."
   - Planejada: "A data planejada para início ainda não chegou."
   - Com o status escolhido: "Mostrar todos os talhões".
4. **Executadas** (tabela), uma linha por talhão:
   - Colunas: **Fazenda · Talhão · Variedade · Plantas/m · Data de plantio** · uma coluna por operação marcada (ex.: 1ª Fungicida … 4ª Fungicida) · **Aplicações executadas** (2/4) · **Dias sem aplicação**.
   - Variedade: as variedades do talhão, separadas por vírgula. Plantas/m: número inteiro. Data de plantio: a executada.
   - Em cada operação, uma etiqueta na cor do status: a **data executada** (Iniciada antes, Iniciada na data, Iniciada com atraso); **⓵ data planejada** em vermelho (Não iniciada; ao passar o mouse, "Não iniciada · planejada para dd/mm/aaaa"); **📅 data planejada** em cinza (Planejada). Ao passar o mouse, o nome do status ("Planejada para 05/12/2026"). Operação não planejada no talhão: "—".
   - Cabeçalho em uma linha, títulos centralizados (os longos quebram linha), seta de ordenar em todas as colunas. Fazenda até Data de plantio ficam paradas ao rolar para o lado; o cabeçalho fica parado ao rolar para baixo.
   - Rodapé: "10 talhões · Dias contados até hoje, dd/mm/aaaa".
5. **Planejadas × Executadas**, uma linha por talhão e uma coluna por operação marcada (sem o Plantio):
   - À esquerda, parado ao rolar para o lado, o talhão, uma informação por linha: o nome (**T01**, grande), a fazenda, as variedades (sem "Var."), o rótulo **Operações** com uma barrinha por operação na cor do status (ao passar o mouse, "1ª Fungicida: Iniciada na data") e "2 de 4 executadas **50%**" (o percentual em verde). Sem eixo.
   - No topo, parado ao rolar para baixo, o nome de cada operação, num cabeçalho baixo (só a altura do nome). Colunas estreitas, na largura da etiqueta mais longa ("Não iniciada 13 d"); nome longo quebra a linha.
   - Em cada operação, tudo na **mesma altura**, qualquer que seja o desvio, no meio da linha do talhão: só a **bolinha** na cor do status, sem barra (Não iniciada: bolinha vermelha; Planejada: círculo tracejado cinza). A linha das bolinhas atravessa as colunas.
   - Em cima da bolinha, a etiqueta com setinha, sempre com o "d": "+2 d", "−3 d", "Não iniciada 10 d", "Em 4 d". **Iniciada na data** (planejada = executada) fica sem etiqueta: só a bolinha verde. Acima da etiqueta, com um respiro, o **nome do status** em negrito na cor dele (só nas iniciadas: Iniciada antes, Iniciada na data, Iniciada com atraso). Embaixo da bolinha: "Planejada: dd/mm" e, se iniciada, "Executada: dd/mm".
   - Rodapé: "10 talhões · Hoje: dd/mm/aaaa".
6. **Duração da Aplicação**, com a chave **Por talhão | Por operação** (a escolhida em verde) no alto da área do gráfico, à direita. Abre em Por talhão. Barras verdes, números em cinza escuro, prazo de conclusão tracejado; no rodapé do gráfico, a legenda **▬ Duração da execução · ┄ Prazo de conclusão**. Sem a legenda de status.
   - **Por talhão:** uma operação por vez. À esquerda, **‹ ›** juntas e, depois delas, o nome da operação com a posição ("Plantio 6 de 13") e "Prazo de conclusão: 3 dias". O gráfico tem uma barra por talhão com a duração em cima, o eixo **Duração (dias)**, o eixo **Talhões** e a linha do prazo atravessando o gráfico, com "3 dias" na ponta.
   - **Por operação:** um gráfico com uma barra por operação: a duração em cima ("3 d"), o nome e "Prazo: 2 d" embaixo e um tracejado curto na altura do prazo.

## Regras
- **Planos:** a última versão publicada de cada plano (vários planos somados).
- **Data planejada:** a do plano publicado: data de plantio do talhão + DAP da operação (Plantio: a data de plantio; Colheita: plantio + ciclo da primeira variedade). Com várias variedades no talhão, a primeira data de plantio.
- **Data executada:** a data de recomendação da OS (abertura). Só conta se já chegou (até hoje).
- **Status da aplicação:** executada antes do planejado = **Iniciada antes**; no mesmo dia = **Iniciada na data**; depois = **Iniciada com atraso**; sem execução e com a data planejada já passada = **Não iniciada**; sem execução e com a data planejada ainda por vir = **Planejada**. Os mesmos nomes na legenda, nas etiquetas, nas dicas e nas mensagens.
- **Cores:** Iniciada antes azul, Iniciada na data verde, Iniciada com atraso laranja, Não iniciada vermelho, Planejada cinza.
- **Aplicações executadas:** executadas / planejadas no talhão, entre as operações marcadas (o Plantio marcado também conta).
- **Dias sem aplicação:** de hoje até a última aplicação executada (entre as operações marcadas); sem nenhuma, "—".
- **Só as operações planejadas em ao menos um talhão filtrado** aparecem (colunas, filtro Operação e gráficos, nas três guias). Ex.: a Gessagem e a Fosfatagem vêm do modelo, mas o plano da Boa Vista 26/27 não as planejou em nenhum talhão: ficam de fora; com a Santa Clara filtrada, a Gessagem aparece.
- **Colunas de operação** (Executadas e Planejadas × Executadas): as operações marcadas no filtro, na ordem do DAP (Plantio primeiro, Colheita por último). Em Executadas, o Plantio marcado não ganha coluna própria: os dados dele ficam na Data de plantio, com a etiqueta do status.
- **Desvio (Planejadas × Executadas):** dias entre a data planejada e a executada, só na etiqueta ("+2 d" com atraso, "−3 d" antes); na data, sem etiqueta. Não muda a altura da bolinha.
- **Duração da Aplicação:**
  - **Só as OS fechadas.** Duração = da abertura da recomendação (data executada) até o fechamento da OS, em dias.
  - **Prazo de conclusão:** a previsão de conclusão da operação no planejamento (vem do cadastro da operação; sem prazo próprio, o padrão do grupo: 2 dias; Plantio 3; Colheita 10).
  - Entram todas as operações marcadas, inclusive o Plantio e a Colheita.
  - **Por talhão:** só as operações com ao menos uma OS fechada entram no ‹ ›. Abre (ao entrar na guia, ao trocar de Por operação para Por talhão e com Limpar filtros) com **todos os grupos e todas as operações** marcados, na **primeira operação pela ordem do DAP** (ex.: Calagem); depois, obedece aos filtros. **Safra, Empresa e Fazenda com uma escolha por vez** (botões de opção, sem "Todas"); se havia várias marcadas, fica a primeira (na Safra, a safra atual). Prazo igual em todos os talhões: uma linha só; diferente entre fazendas: um tracejado curto em cada barra e "de 2 a 5 dias".
  - **Por operação:** a duração da barra é a **média das durações dos talhões**, arredondada; o prazo, a média dos prazos. Os filtros aceitam várias escolhas.
  - **Eixo Duração:** de 0 ao passo acima do maior valor (duração ou prazo), com até 5 marcas. O número fica acima da barra e do prazo, para o tracejado não passar por cima dele.
- **Filtros:**
  - Ao abrir e com **Limpar filtros**: Safra = a **safra atual** (a que contém hoje pelo cadastro; a safra antes da safrinha; sem nenhuma, a mais recente); Cultura, Empresa e Fazenda marcadas só com as dos planos dessa safra (as outras ficam na lista, desmarcadas); Talhão em Todos; Grupo de operação **Defensivo**; Operação = as fungicidas do modelo (1ª a 4ª Fungicida). Na Duração › Por talhão, Grupo e Operação em todos (acima). Limpar filtros não muda a guia nem a ordenação.
  - Safra, Cultura, Empresa, Fazenda e Talhão mostram **sempre todas as opções** e são **independentes**: cada um só muda quando é mexido (ou com Limpar filtros). Uma combinação sem planos deixa a tabela vazia.
  - Grupo de operação e Operação mostram o que existe nos planos filtrados (Operação: só dos grupos marcados). Trocar o grupo volta a Operação a todas. Se as operações marcadas não existem nos planos filtrados (ex.: as fungicidas da soja na safra 27/27, de milho), a Operação volta a todas, para mostrar o planejado.
  - Filtro com uma opção só mostra o nome dela (ex.: "Soja"), não "Todas".
- **Legenda clicável** (Executadas e Planejadas × Executadas), um status por vez (como na Agenda Agrícola): ficam só os talhões com ao menos uma aplicação nesse status, só as operações com aplicação nele, e as aplicações em outros status ficam vazias; os outros status da legenda ficam apagados. Clicar de novo volta a tudo.
- **Ordenação** (Executadas): a mesma coluna inverte o sentido; outra coluna começa do menor para o maior; nas operações, pela data executada; vazios sempre no fim; empate na ordem padrão (fazenda, safra e talhão).

## Navegação
- Menu Monitoramento ou Monitoramento › Aplicações → esta página (`#/monitoramento`).
- Caminho "⌂ Monitoramento" → esta página.
- Guias Executadas · Planejadas × Executadas · Duração da Aplicação → trocam a visão (os filtros continuam, menos o padrão da Duração › Por talhão).
- Duração: Por talhão | Por operação; ‹ › → operação anterior / próxima.

## Para testar
- Dados em `js/dados-exemplo.js`, `monitoramento`: por talhão, o estande (`plantasM`, plantas por metro, inteiro) e, por operação, o deslocamento da execução em dias (positivo = atraso, negativo = antecipação, `null` = não executada); sem deslocamento próprio, a sequência `deslocamentos`. As datas planejadas vêm dos planos de exemplo.
- **Duração simulada:** fechamento = data executada + prazo de conclusão + o desvio da sequência `duracoes` (ao menos 1 dia); só conta se o fechamento já chegou. As OS escritas em `ordensServico` usam as próprias datas (só as fechadas).
- **O exemplo anda com o dia** (`dataReferencia`, 25/11/2026; DECISOES 4.0): hoje é o dia em que o protótipo é aberto, e a página abre sempre no mesmo ponto da safra: na Boa Vista 26/27, a 1ª Fungicida quase toda executada (T06 pendente), a 2ª em parte (T02 pendente), a 3ª e a 4ª planejadas.
- Legenda Não iniciada → T02 (2ª Fungicida) e T06 (1ª Fungicida).
- Safra 27/27 com Cultura Milho → as operações de Defensivo do milho, todas planejadas.
- Duração da Aplicação › Por talhão na Boa Vista 26/27 → abre em Calagem 1 de 13 (a 3ª e a 4ª Fungicida ficam de fora, sem OS fechada); Por operação → só a 1ª e a 2ª Fungicida com o padrão de filtros.

## Sugestões (a validar)
- Planejadas × Executadas: operação não planejada no talhão fica vazia (só a linha do zero); poderia mostrar "—", como na tabela.
- Duração › Por operação: números em cinza escuro, como no Por talhão (na imagem eram verdes).
- Duração: ao voltar para Executadas ou Planejadas × Executadas, os filtros ficam como estavam (todos os grupos e operações; escolha única na Safra, Empresa e Fazenda); Limpar filtros volta ao padrão.
- Filtro Operação na Duração › Por talhão listando só as operações com OS fechada.
