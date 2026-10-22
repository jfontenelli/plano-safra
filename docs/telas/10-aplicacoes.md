# Tela 10 — Aplicações (Monitoramento › Aplicações)

Imagem: imagens da usuária (22/10/2026). Os valores das imagens são ilustrativos; vale o layout.

## Objetivo
Acompanhar, talhão a talhão, as aplicações de uma safra: quando cada operação foi executada e se foi no prazo, adiantada, atrasada, se está pendente ou ainda planejada. Uso principal: as aplicações de fungicida (que levam outros produtos junto; o pessoal chama de "a fungicida").

## Quando aparece
Menu lateral **Monitoramento** (grupo com setinha, como Plano de Safra e Gestão da Lavoura) › **Aplicações**. O nome do grupo também leva à página. Sem nenhum plano cadastrado: "Crie seu primeiro plano para visualizar as Aplicações" e o botão "+ Criar Plano de Safra".

## Conteúdo
1. **Cabeçalho:** caminho "⌂ Monitoramento › Aplicações", título **Aplicações** e o subtítulo da visão escolhida; à direita, a chave **Executadas | Planejada × Executada** (a escolhida em verde). Abre em Executadas.
   - Executadas: "Consulte as datas de execução e o status das operações por talhão."
   - Planejada × Executada: "Compare as datas planejadas e executadas das operações por talhão."
2. **Filtros**, todos com várias escolhas (as caixas da Agenda Agrícola, com Pesquisar e "Todas"/"Todos"), nesta ordem: **Safra** (as do cadastro, da mais recente para a mais antiga), **Cultura**, **Empresa**, **Fazenda**, **Talhão** ("Boa Vista · T01"), **Grupo de operação** e **Operação**; **Limpar filtros** à direita.
3. **Legenda "Aplicação"** acima da tabela: Adiantada · No prazo · Atrasada · Pendente · Planejada, com quadradinhos nas cores fortes (as das barrinhas dos talhões na linha do tempo); Pendente e Planejada com o ícone delas.
4. **Executadas** (tabela), uma linha por talhão:
   - Colunas: **Fazenda · Talhão · Variedade · Plantas/m · Data de plantio** · uma coluna por operação marcada (ex.: 1ª Fungicida … 4ª Fungicida) · **Aplicações executadas** (2/4) · **Dias sem aplicação**.
   - Variedade: as variedades do talhão, separadas por vírgula. Plantas/m: número inteiro. Data de plantio: a executada.
   - Em cada operação, uma etiqueta na cor do status: a **data executada** (Adiantada, No prazo, Atrasada); **⓵ Pendente** (vermelho); **📅 data planejada** em cinza (Planejada). Ao passar o mouse, o nome do status ("Planejada para 05/12/2026"). Operação não planejada no talhão: "—".
   - Cabeçalho em uma linha, títulos centralizados (os longos quebram linha), seta de ordenar em todas as colunas. Fazenda até Data de plantio ficam paradas ao rolar para o lado; o cabeçalho fica parado ao rolar para baixo.
   - Rodapé: "10 talhões · Dias contados até hoje, dd/mm/aaaa".
5. **Planejada × Executada** (linha do tempo), uma faixa por talhão (sem o Plantio):
   - À esquerda, parado ao rolar para o lado: o talhão e a fazenda, as variedades, uma barrinha por aplicação na cor do status e "2 de 4 aplicadas · 1 pendente".
   - No topo, parada ao rolar para baixo: a escala de semana em semana, com a etiqueta "Hoje · dd/mm" e a linha pontilhada de hoje, em **cinza**.
   - Em cada operação: o nome curto e a data planejada em cima ("1ª Fung. 30/10"); círculo vazio no planejado e ponto cheio no executado, ligados pelo **desvio** (amarelo se adiantada, laranja se atrasada); no dia, o círculo com o ponto verde dentro; **pendente**, círculo vermelho e traço vermelho tracejado até hoje (atraso acumulado); **planejada**, círculo tracejado cinza. Embaixo, a etiqueta ("No prazo", "+2 dias", "−1 dia", "Pendente há 9 d", "Em 4 d") e "Exec. dd/mm".

## Regras
- **Planos:** a última versão publicada de cada plano (vários planos somados).
- **Data planejada:** a do plano publicado: data de plantio do talhão + DAP da operação (Plantio: a data de plantio; Colheita: plantio + ciclo da primeira variedade). Com várias variedades no talhão, a primeira data de plantio.
- **Data executada:** a data de recomendação da OS (abertura). Só conta se já chegou (até hoje).
- **Status da aplicação:** executada antes do planejado = **Adiantada**; no mesmo dia = **No prazo**; depois = **Atrasada**; sem execução e com a data planejada já passada = **Pendente**; sem execução e com a data planejada ainda por vir = **Planejada**.
- **Cores:** Adiantada amarelo, No prazo verde, Atrasada laranja, Pendente vermelho, Planejada cinza.
- **Aplicações executadas:** executadas / planejadas no talhão, entre as operações marcadas (o Plantio marcado também conta).
- **Dias sem aplicação:** de hoje até a última aplicação executada (entre as operações marcadas); sem nenhuma, "—".
- **Colunas de operação:** as operações marcadas no filtro, na ordem do DAP (Plantio primeiro, Colheita por último). O Plantio marcado não ganha coluna própria: os dados dele ficam na Data de plantio, com a etiqueta do status.
- **Filtros:**
  - Ao abrir e com **Limpar filtros**: Safra = a **safra atual** (a que contém hoje pelo cadastro; a safra antes da safrinha; sem nenhuma, a mais recente); Cultura, Empresa e Fazenda marcadas só com as dos planos dessa safra (as outras ficam na lista, desmarcadas); Talhão em Todos; Grupo de operação **Defensivo**; Operação = as fungicidas do modelo (1ª a 4ª Fungicida). Limpar filtros não muda a visão nem a ordenação.
  - Safra, Cultura, Empresa, Fazenda e Talhão mostram **sempre todas as opções** e são **independentes**: cada um só muda quando é mexido (ou com Limpar filtros). Uma combinação sem planos deixa a tabela vazia.
  - Grupo de operação e Operação mostram o que existe nos planos filtrados (Operação: só dos grupos marcados). Trocar o grupo volta a Operação a todas. Se as operações marcadas não existem nos planos filtrados (ex.: as fungicidas da soja na safra 27/27, de milho), a Operação volta a todas, para mostrar o planejado.
  - Filtro com uma opção só mostra o nome dela (ex.: "Soja"), não "Todas".
- **Legenda clicável**, um status por vez (como na Agenda Agrícola): ficam só os talhões com ao menos uma aplicação nesse status, só as operações com aplicação nele, e as aplicações em outros status ficam vazias; os outros status da legenda ficam apagados. Clicar de novo volta a tudo. Vale nas duas visões.
- **Ordenação:** a mesma coluna inverte o sentido; outra coluna começa do menor para o maior; nas operações, pela data executada; vazios sempre no fim; empate na ordem padrão (fazenda, safra e talhão).

## Navegação
- Menu Monitoramento ou Monitoramento › Aplicações → esta página (`#/monitoramento`).
- Caminho "⌂ Monitoramento" → esta página.
- Executadas | Planejada × Executada → troca a visão (os filtros continuam).

## Para testar
- Dados em `js/dados-exemplo.js`, `monitoramento`: por talhão, o estande (`plantasM`, plantas por metro, inteiro) e, por operação, o deslocamento da execução em dias (positivo = atraso, negativo = adiantamento, `null` = não executada); sem deslocamento próprio, a sequência `deslocamentos`. As datas planejadas vêm dos planos de exemplo.
- **O exemplo anda com o dia** (`dataReferencia`, 25/11/2026; DECISOES 4.0): hoje é o dia em que o protótipo é aberto, e a página abre sempre no mesmo ponto da safra: na Boa Vista 26/27, a 1ª Fungicida quase toda executada (T06 pendente), a 2ª em parte (T02 pendente), a 3ª e a 4ª planejadas.
- Legenda Pendente → T02 (2ª Fungicida) e T06 (1ª Fungicida).
- Safra 27/27 com Cultura Milho → as operações de Defensivo do milho, todas planejadas.
