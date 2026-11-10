# Tela 03 — Planos de Safra, antes Visão Geral (Planos de Safra, Cronograma de Safras e Histórico de versões)

Imagem: `referencias/03-lista-planos.png` (lista antiga). A guia Planos de Safra veio de uma imagem de painel da usuária (filtros, Planejamento das Fazendas e tabela por fazenda), sem o gráfico de área por empresa, que foi retirado.
Na imagem o menu aparece recolhido só para ilustrar esse estado; a regra do menu está no CLAUDE.md.

## Objetivo
Acompanhar o planejamento das fazendas no ano agrícola, filtrar e abrir ou criar um plano.

## Quando aparece
- Ao clicar em "Planos" (dentro de Plano de Safra; antes "Visão Geral") ou em "Plano de Safra" no menu, quando existe ao menos um plano.
- Ao clicar em "‹ Planos de Safra" no cabeçalho de um plano aberto (30/10/2026). **A página abre sempre só no Ano agrícola** (09/11/2026), também ao voltar de um plano: o ano das outras páginas (no começo, o atual) e os demais filtros em Todas.
- Ao abrir o protótipo: ele já vem com os planos de exemplo, só publicados (ano agrícola 2025: soja 25/26 e milho safrinha 26/26 da Santa Clara, publicados; ano agrícola 2026: soja 26/27 e milho safrinha 27/27 da Boa Vista, publicados, e soja 26/27 da Primavera, em construção, iniciada pelo "Usar modelo de operações"; São José sem plano, 29/10/2026).

## Conteúdo
- Título "Planos de Safra" com o caminho "Plano de Safra › Planos" embaixo (30/10/2026) e, abaixo, três guias (mesmo estilo das abas do plano, com a barra verde grossa na selecionada): **Planos de Safra** (abre nela), **Cronograma de Safras** (11/11/2026) e **Histórico de versões**.
- No modo escuro, o topo tem a foto do campo (`img/fundo-plano-safra.jpg`) por trás do título; no claro, não.
- **Filtros** (padronizados em 04/11/2026, DECISOES 4.0) num cartão baixo, acima da tabela, todos com **várias escolhas**: **Ano agrícola · Atividade produtiva · Safra · Cultura · Fazenda** (a Empresa só com o nível Empresa, DECISOES 3) e o filtro de cada guia (no Cronograma de Safras, **Operação**; detalhe abaixo): no Planos de Safra, **Situação do plano** (Não iniciado, Em construção, Publicado; as três opções sempre); no Histórico, **Status do plano** (o status de cada versão: Não iniciado, Em construção, Publicada, Revisada). A coluna Status continua na tabela. **Limpar filtros** no fim da linha; o que não couber vai para o **Mais filtros** (que só aparece nesse caso). Os filtros-base valem para as três guias e acompanham para as outras páginas.
- **Guia Planos de Safra:**
  - **Planos de Safra Cadastrados** (título desde 09/11/2026; antes "Planos de Safra"): título com ícone no topo do cartão e, à direita dele, o botão **+ Criar Plano Safra** (28/10/2026); tabela com os planos (Não iniciado, Em construção e Publicado), uma linha por plano (fazenda e safra). Colunas (09/11/2026): **Safra** (só o número: "26/27" é safra, "27/27" é safrinha), **Fazenda**, **Cultura**, Área (ha), Status e Ações (⋯); com o nível Empresa, a Empresa depois da Safra.
  - **Plano novo** (Não iniciado): linha com fundo **verde-claro** e a etiqueta **"Novo"** (verde) ao lado do nome da fazenda (28/10/2026).
  - **Sem plano nos filtros:** no lugar da tabela, "**Nenhum Plano de Safra cadastrado**" (22 px) e "Clique em [**+ Criar Plano Safra**] para começar seu planejamento." (17 px), com o **botão primário no meio da frase**; o botão do cabeçalho do cartão some (28/10/2026; ver Navegação).
- **Guia Histórico de versões:** uma linha por versão de cada plano; colunas Safra, Empresa, Atividade, Cultura, Fazenda, Versão, Status, Última atualização, Atualizado por. Status da versão: **Não iniciado**, **Em construção**, **Publicada** (só a última publicada do plano) ou **Revisada** (as publicadas antes dela; selo neutro, com contorno).

### Guia Cronograma de Safras (11/11/2026; antes a escala Ano do Calendário de Gestão da Lavoura, Tela 07)
- **Acima dos filtros, à direita** (só nesta guia), a etiqueta **"ⓘ Últimas versões"**: mostra a última versão publicada de cada plano; plano sem versão publicada não aparece.
- **Filtros:** os filtros-base (Ano agrícola, Atividade produtiva, Safra, Cultura, Fazenda) e **Operação** (no lugar da Situação do plano). Sem Talhão e sem Grupo de operação (quem filtra os grupos é a legenda). Nesta guia, o **Ano agrícola tem uma escolha só**: ao entrar, fica o marcado (com vários, o de hoje, se estiver entre eles, ou o primeiro; com Todos, o de hoje ou o mais recente com planos publicados). O ano escolhido continua nas outras guias e páginas.
- **Operação:** as operações dos grupos à mostra na legenda, pelo nome, na ordem da legenda e do plano; o grupo ao lado.
- **Tira da legenda num cartão** (como a do Calendário): à esquerda, a **legenda dos grupos** (Corretivos, Plantio, Fertilidade, Defensivo, Colheita, na cor de cada um; e **Hoje**, com o traço da linha pontilhada, quando hoje cai no período), que **filtra um grupo por vez** (clicar num grupo mostra só ele; outro substitui; clicar de novo, ou em "Mostrar todos", volta a todos); à direita, depois de um traço, **Hoje · ‹ › · ano**. As setas e o Hoje **trocam o filtro Ano agrícola** (entre os anos com planos publicados; apagadas no primeiro e no último); Hoje vai ao ano agrícola de hoje (ou ao mais recente com planos).
- O ano aparece só como "2026" ("Ano agrícola 2026" ao passar o mouse). Escolher um grupo na legenda ou operações no filtro Operação **não muda o ano**.
- Tabela **Empresa › Fazenda › Safra** (a safra só pelo número: 26/27, 27/27), com os planos publicados do ano agrícola que passam pelos filtros. **Abre no nível Empresa** (empresas e fazendas fechadas); a seta abre e fecha cada empresa e cada fazenda (a escolha se mantém ao navegar).
- **Barras só no nível mais aberto de cada ramo:** empresa fechada mostra as operações de todas as fazendas dela juntas; ao abrir a empresa, as barras passam para as fazendas; ao abrir a fazenda, ficam só na safra e na safrinha. Juntar: a mesma operação da mesma cultura vai do primeiro ao último dia.
- Colunas: **Fazenda / Safra · Cultura · Área** · a linha do tempo, **do mês da primeira operação ao da última** (ex.: junho de 2026, calagem, a junho de 2027), uma coluna por mês. Empresa: a área total. Fazenda: a **sucessão de culturas** ("Soja → Milho"), a área dos talhões. Safra e safrinha: "Safra 26/27" / "Safrinha 27/27", a cultura e a área.
- **Cada operação é uma barra transparente e arredondada**, do início no primeiro talhão ao fim da previsão de conclusão no último, numa **faixa por grupo de operação** (Operação de campo cinza, antes do Plantio; Plantio verde; Fertilidade e Aplicação de insumos roxo; Defensivo laranja; Colheita dourado; 29/10/2026). Onde operações do mesmo grupo se sobrepõem, a cor fica mais forte. Entram os talhões com data de plantio e as operações que passam pelo filtro Operação e pela legenda. Nome, grupo, cultura, datas e área ao passar o mouse.
- As barras **só informam** (sem clique; antes, no Calendário, levavam ao Mês).
- **Hoje: só a linha vertical pontilhada cinza** (igual no claro e no escuro), sem etiqueta. Sem versão nas linhas e sem nota de rodapé.
- Sem planos com os filtros no ano: "Nenhum plano publicado com esses filtros neste ano agrícola." Com planos, mas sem operação com data: "Nenhuma operação com data nos planos publicados com esses filtros."
## Regras
- Um plano por safra e fazenda. Os planos são criados pelo usuário no modal Criar Plano de Safra (Tela 02), não automaticamente.
- **Status** (na tabela): **Não iniciado** (plano criado, só com a 0.1 vazia), **Em construção** e **Publicado**, pela versão de trabalho (a em construção ou, sem ela, a última publicada).
- **Área (ha)**: área de cultivo do plano (talhões incluídos); sem talhões, "—".
- **Destaque do plano novo:** dura enquanto o plano estiver **Não iniciado**; some quando ele entra em construção (Começar o planejamento) ou é publicado. Ao criar, a tabela rola até a linha nova (com vários planos criados de uma vez, todos ficam em destaque).
- **Ordenar por coluna**: seta no título de cada coluna (menos Ações), 1º clique crescente, 2º decrescente; vazios ("—") sempre no fim; Status na ordem Não iniciado, Em construção, Publicado. Sem escolha: por status (Não iniciado, Em construção, Publicado) e, no mesmo status, pela Safra (na ordem do cadastro, a mesma dos filtros) e em ordem alfabética de Empresa, Fazenda e Cultura. A seta da coluna Safra também usa a ordem do cadastro.
- Filtro **Ano Agrícola** (DECISOES 1, cadastro de safras): escolher 2026 traz as safras e safrinhas daquele ano (26/27 e 27/27). Opções: os anos das safras cadastradas e dos planos. Abre no ano agrícola e na safra atuais (04/11/2026), com o resto em Todas. Depois de criar planos, abre no ano agrícola e na safra deles.
- Empresa e Fazenda oferecem também as fazendas das empresas, mesmo sem plano (`fazendasPorEmpresa` nos dados de exemplo); escolhida uma delas, aparece o aviso sem plano.
- **Filtros dependentes:** Ano agrícola e Atividade limitam Safra e Cultura; Empresa limita Fazenda (as fazendas das empresas marcadas). Uma escolha que deixa de ser opção sai; sem nenhuma, volta a "Todas".
- **Limpar filtros**: ano agrícola e safra atuais; os demais a "Todas"/"Todos" (também nas outras páginas, pelos filtros compartilhados).
- Os filtros atualizam a guia; trocar de guia mantém os filtros. A guia escolhida se mantém ao navegar.
- **Um clique na linha de plano abre** o plano, na versão em construção ou, se não houver, na última publicada (em consulta). **Plano não iniciado**: abre o modal "Como deseja iniciar o plano?" (Tela 02). Pelo teclado: Tab chega na linha e Enter abre.
- **Menu do plano**: pelo **⋯** no fim da linha ou pelo **botão direito** na linha. Itens, nesta ordem: **Abrir · Criar nova versão · Histórico de versões · Exportar XLSX · (separador) · Excluir plano** (em vermelho).
  - **Abrir**: o mesmo que clicar na linha.
  - **Criar nova versão**: cria a próxima versão a partir da **última publicada** e abre em edição (DECISOES 4.1.1). Com uma versão em construção no plano, aparece desabilitado com "A versão 0.3 já está em construção"; plano não iniciado, com "O plano ainda não foi iniciado". Sem versão em construção, mostra embaixo "A partir da versão 0.2, publicada".
  - **Histórico de versões**: abre a guia Histórico de versões com os filtros naquele plano. Comparação entre versões: a detalhar.
  - **Exportar XLSX**: baixa o plano em planilha (o mesmo arquivo do botão Exportar dentro do plano; ver docs/DECISOES.md, seção 1).
  - **Excluir plano** (em vermelho): permitido enquanto **nenhuma OS** foi gerada a partir do plano; depois, desabilitado com "O plano já gerou Ordens de Serviço". Confirmação: título "Excluir plano?", "Soja · Safra 26/27 · Fazenda São José" e "As operações, recomendações e talhões planejados desse plano serão apagados. Essa ação não pode ser desfeita." · Cancelar · **Excluir plano** (vermelho). Depois, aviso "Plano excluído"; sem nenhum plano, volta à Tela 01.
  - "Copiar para outra fazenda" fica para quando o cliente pedir.
- **Histórico de versões**:
  - Planos na ordem Safra (mais recente primeiro), Fazenda e Cultura; versões da mais nova para a mais antiga. O filtro Status vale para o status de cada versão; a 0.1 de um plano não iniciado aparece como "Não iniciado".
  - Última atualização / Atualizado por: em construção, a última alteração (salvamento automático); publicada, a publicação.
  - Um clique na linha (ou Enter) abre aquela versão (publicada em consulta). Plano não iniciado: o modal de início.
- Custo estimado, Receita projetada e % concluído saíram; voltam se os usuários pedirem.
- A linha Sem plano saiu da tabela (16/10/2026), com o "Criar plano" do ⋯ dela.
- Os quadros Planejamento das Fazendas (Sem plano, Em construção, Publicado, com a contagem de todas as fazendas em cada safra cadastrada) saíram em 20/10/2026.
- As colunas Plantio, Fertilidade e Defensivos (% de cada grupo por área) saíram em 19/10/2026 (reunião com stakeholders).

## Navegação
- "+ Criar Plano Safra" (cabeçalho do cartão) → abre a Tela 02 (Criar Plano de Safra, na tela inteira) por cima desta tela; ao criar, o plano novo abre no Planejamento (09/11/2026).
- Botão "+ Criar Plano Safra" do aviso sem plano → o mesmo modal, já com os filtros: na lista Safra, só as safras do Ano Agrícola do filtro (mais "+ Criar nova safra"), já escolhida quando a safra do filtro Safra é do Ano Agrícola; Empresa e Fazenda do filtro (só a Fazenda escolhida: a empresa dela), a fazenda com todos os talhões. Ano Agrícola em "Todas": a lista de safras completa.
- Clique na linha ou "Abrir" no menu → abre o plano no Planejamento (aba Planejamento, Telas 04.1 a 04.3), na versão em construção ou na última publicada. Plano não iniciado: antes, o modal "Como deseja iniciar o plano?" (Tela 02).
- Linha do Histórico de versões → abre aquela versão do plano.
- Cronograma de Safras: a seta abre e fecha empresa e fazenda; as barras não levam a outra tela.

## Para testar
- Ter um jeito simples de alternar entre "sem planos" (mostra Tela 01) e "com planos de exemplo" (mostra esta tela).
- Planos de exemplo coerentes entre si (safras, áreas e valores).
