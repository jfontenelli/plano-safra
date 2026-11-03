# Tela 10 — Operações (Gestão da Lavoura › Operações; antes Planejadas × Executadas, guia do Operações Agrícolas e Planejado x Executado)

Atualizado em 03/11/2026 (vira o item **Operações** do menu Gestão da Lavoura (no mesmo dia chamado Planejadas × Executadas; o nome ficou grande no menu), sem guias no cabeçalho; antes, no mesmo dia, as guias Executadas e Planejadas × Executadas viram uma só, **Planejadas × Executadas**: a tabela por talhão com o cartão do talhão e o **Visualizar por: Datas · Dias**; imagens da usuária). Antes, em 29/10/2026 (o item passa a se chamar Operações Agrícolas, antes Planejado x Executado; saiu a guia Duração da Operação; status Antecipada, Postergada e Atrasada, antes Iniciada antes, Iniciada com atraso e Não iniciada). Antes, em 27/10/2026 (o Calendário Agrícola, Tela 07, vira a primeira guia; o item Planejado x Executado é o primeiro de Gestão da Lavoura). Antes, em 26/10/2026 (a página Aplicações, do menu Monitoramento, passa a se chamar Planejado x Executado e vai para Gestão da Lavoura; o menu Monitoramento saiu). Antes, em 23/10/2026 (guia Duração da Aplicação renomeada para Duração da Operação; legenda Operação com os nomes Não iniciada, Iniciada antes, Iniciada na data, Iniciada com atraso e Planejada, e dicas; Iniciada antes em azul; Planejadas × Executadas sem eixo e sem barra, tudo na mesma altura, com o nome do status acima da etiqueta; antes, no mesmo dia: guias no formato das abas do plano e nova guia Duração da Operação). Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Imagem: imagens da usuária (22 e 23/10/2026). Os valores das imagens são ilustrativos; vale o layout.

## Objetivo
Acompanhar, talhão a talhão, as aplicações de uma safra: quando cada operação foi executada e se foi iniciada antes, na data ou com atraso, se ainda não foi iniciada ou se está planejada, e quanto tempo as OS fechadas levaram em relação ao prazo de conclusão. Uso principal: as aplicações de fungicida (que levam outros produtos junto; o pessoal chama de "a fungicida").

## Quando aparece
Menu lateral **Gestão da Lavoura › Operações**, o segundo item (antes vem o Calendário, Tela 07, e depois a Central OS, Tela 09), em `#/planejado-executado`. Sem nenhum plano cadastrado: "Crie seu primeiro plano para visualizar as Operações" e o botão "+ Criar Plano de Safra".

## Conteúdo
1. **Cabeçalho:** caminho "⌂ Gestão da Lavoura › Operações", título **Operações** e o subtítulo "Compare as datas planejadas e executadas das operações por talhão.". Sem guias (03/11/2026: cada página é um item do menu). Os endereços antigos (Executadas, Planejadas × Executadas de bolinhas, Duração) abrem nesta página.
2. **Filtros**, com várias escolhas (as caixas da Agenda Agrícola, com Pesquisar e "Todas"/"Todos"), nesta ordem: **Safra** (as do cadastro, da mais recente para a mais antiga), **Cultura**, **Empresa**, **Fazenda**, **Talhão** ("Boa Vista · T01"), **Grupo de operação** e **Operação**; **Limpar filtros** à direita.
3. **Barra acima da tabela:** à esquerda, a legenda **"Operação:"** com **Atrasada · Antecipada · Iniciada na data · Postergada · Planejada**, nas cores do status (Atrasada: a bolinha vermelha com exclamação; Planejada: círculo tracejado cinza); à direita, separado por uma linha, **"Visualizar por:"** com o interruptor **Datas · Dias** (ícone de calendário e de lista; o escolhido é o botão verde, como o Tabela · Mapa do Plantio). Abre em **Datas**; a escolha se mantém ao navegar e com Limpar filtros. Ao passar o mouse na legenda, a dica de cada status:
   - Atrasada: "A data planejada já passou, mas a operação ainda não foi iniciada."
   - Antecipada: "A operação foi iniciada antes da data planejada."
   - Iniciada na data: "A operação foi iniciada na data planejada."
   - Postergada: "A operação foi iniciada após a data planejada."
   - Planejada: "A data planejada para início ainda não chegou."
   - Com o status escolhido: "Mostrar todos os talhões".
4. **Tabela**, uma linha por talhão:
   - Colunas: **Talhão (resumo) · Estande (plantas/m) · Data de plantio** · uma coluna por operação marcada (ex.: 1ª Fungicida … 4ª Fungicida) · **Dias sem aplicação**. Sem as colunas Fazenda e Aplicações executadas (as duas estão no cartão do talhão).
   - **Talhão (resumo):** um cartão com o nome (**T01**, grande), a fazenda e as variedades à esquerda; à direita, o rótulo **Operações**, uma barrinha por operação na cor do status (ao passar o mouse, "1ª Fungicida: Iniciada na data") e "2 de 4 executadas **50%**" (o percentual em verde).
   - **Estande:** plantas por metro, número inteiro, em negrito, centralizado. **Data de plantio:** a executada, numa etiqueta neutra (cinza) com o ícone de calendário, sem a cor do status (o Plantio marcado não ganha coluna própria).
   - **Datas:** em cada operação, uma etiqueta na cor do status com o ícone de calendário e a **data executada** (Antecipada, Iniciada na data, Postergada); **ⓘ data planejada** em vermelho (Atrasada); a **data planejada** em cinza (Planejada).
   - **Dias:** a mesma etiqueta, na mesma cor, com o desvio: **"Na data"**, **"Antecipada 3d"**, **"Postergada 2d"**, **"ⓘ Atrasada 10d"** (com a exclamação; dias desde a data planejada) e **"📅 Em 4d"** (Planejada: dias até a data planejada, com o calendário, em cinza, como em Datas).
   - Ao passar o mouse na etiqueta: o status e as datas ("Postergada · planejada para 23/10/2026, executada em 25/10/2026"; "Planejada para 05/12/2026"; "Atrasada · planejada para 31/10/2026"). Operação não planejada no talhão: "—".
   - **Dias sem aplicação:** em negrito, centralizado.
   - Seta de ordenar em todas as colunas, discreta (aparece ao passar o mouse no título); a da coluna ordenada fica visível. Talhão, Estande e Data de plantio ficam paradas ao rolar para o lado; o cabeçalho fica parado ao rolar para baixo.
   - Rodapé: "10 talhões · Dias contados até hoje, dd/mm/aaaa".

## Regras
- **Planos:** a última versão publicada de cada plano (vários planos somados).
- **Data planejada:** a do plano publicado: data de plantio do talhão + DAP da operação (Plantio: a data de plantio; Colheita: plantio + ciclo da primeira variedade). Com várias variedades no talhão, a primeira data de plantio.
- **Data executada:** a data de recomendação da OS (abertura). Só conta se já chegou (até hoje).
- **Status da aplicação:** executada antes do planejado = **Antecipada**; no mesmo dia = **Iniciada na data**; depois = **Postergada**; sem execução e com a data planejada já passada = **Atrasada**; sem execução e com a data planejada ainda por vir = **Planejada**. Os mesmos nomes na legenda, nas etiquetas, nas dicas e nas mensagens.
- **Cores:** Antecipada azul, Iniciada na data verde, Postergada laranja, Atrasada vermelho, Planejada cinza.
- **Executadas no cartão:** executadas / planejadas no talhão, entre as operações com coluna (sem o Plantio).
- **Dias sem aplicação:** de hoje até a última aplicação executada (entre as operações marcadas); sem nenhuma, "—".
- **Só as operações planejadas em ao menos um talhão filtrado** aparecem (colunas e filtro Operação). Ex.: a Gessagem e a Fosfatagem vêm do modelo, mas o plano da Boa Vista 26/27 não as planejou em nenhum talhão: ficam de fora; com a Santa Clara filtrada, a Gessagem aparece.
- **Colunas de operação:** as operações marcadas no filtro, na ordem do DAP (Plantio primeiro, Colheita por último). O Plantio marcado não ganha coluna própria: a data dele fica na Data de plantio.
- **Desvio (Dias):** dias entre a data planejada e a executada ("Postergada 2d", "Antecipada 3d", "Na data"); sem execução, desde a planejada até hoje (Atrasada) ou de hoje até a planejada (Planejada, "Em 4d").
- **Filtros:**
  - Ao abrir e com **Limpar filtros**: Safra = a **safra atual** (a que contém hoje pelo cadastro; a safra antes da safrinha; sem nenhuma, a mais recente); Cultura, Empresa e Fazenda marcadas só com as dos planos dessa safra (as outras ficam na lista, desmarcadas); Talhão em Todos; Grupo de operação **Defensivo**; Operação = as fungicidas do modelo (1ª a 4ª Fungicida). Limpar filtros não muda a guia nem a ordenação.
  - Safra, Cultura, Empresa, Fazenda e Talhão mostram **sempre todas as opções** e são **independentes**: cada um só muda quando é mexido (ou com Limpar filtros). Uma combinação sem planos deixa a tabela vazia.
  - Grupo de operação e Operação mostram o que existe nos planos filtrados (Operação: só dos grupos marcados). Trocar o grupo volta a Operação a todas. Se as operações marcadas não existem nos planos filtrados (ex.: as fungicidas da soja na safra 27/27, de milho), a Operação volta a todas, para mostrar o planejado.
  - Filtro com uma opção só mostra o nome dela (ex.: "Soja"), não "Todas".
- **Legenda clicável**, um status por vez (como na Agenda Agrícola): ficam só os talhões com ao menos uma aplicação nesse status, só as operações com aplicação nele, e as aplicações em outros status ficam vazias; os outros status da legenda ficam apagados. Clicar de novo volta a tudo.
- **Ordenação:** a mesma coluna inverte o sentido; outra coluna começa do menor para o maior; nas operações, em Datas pela data (a executada ou, sem execução, a planejada) e em Dias pelo desvio; vazios sempre no fim; empate na ordem padrão (fazenda, safra e talhão).

## Navegação
- Menu Gestão da Lavoura › Operações → esta página. O nome do grupo e o caminho "⌂ Gestão da Lavoura" → o Calendário (Tela 07).
- Os endereços antigos da Executadas, da Planejadas × Executadas de bolinhas e da Duração da Operação abrem na página Operações.

## Para testar
- Dados em `js/dados-exemplo.js`, `monitoramento`: por talhão, o estande (`plantasM`, plantas por metro, inteiro) e, por operação, o deslocamento da execução em dias (positivo = atraso, negativo = antecipação, `null` = não executada); sem deslocamento próprio, a sequência `deslocamentos`. As datas planejadas vêm dos planos de exemplo.
- **O exemplo anda com o ano agrícola** (`dataReferencia`, 25/11/2026; DECISOES 4.0; 03/11/2026, antes andava com o dia): as datas mantêm o dia e o mês, para o plantio e a colheita ficarem na época certa. O que aparece executado depende do dia em que o protótipo é aberto: em 25/11, na Boa Vista 26/27, a 1ª Fungicida quase toda executada (T06 pendente), a 2ª em parte (T02 pendente), a 3ª e a 4ª planejadas; antes disso, menos aplicações executadas.
- Legenda Atrasada → T02 (2ª Fungicida) e T06 (1ª Fungicida).
- Safra 27/27 com Cultura Milho → as operações de Defensivo do milho, todas planejadas.

## Sugestões (a validar)
- Data de plantio numa etiqueta neutra (como na imagem): antes, com o Plantio marcado, levava a cor do status do plantio.

