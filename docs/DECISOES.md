# Plano de Safra: decisões

Atualizado em 19/10/2026 (modo escuro e Configurações; reunião com stakeholders de 19/10: status Revisada, Calendário em Ordens de Serviço, grupo Plantio, planos de exemplo). Reunião com stakeholders de 13/10/2026: navegação, Visão Geral e versões (ver docs/reunioes/).
Imagem do fluxo: artifact "Fluxo do Plano de Safra" (claude.ai/artifact/4kzr4fg15grTw4YSHKmHf2).

Este doc mostra só o estado atual. Decisão alterada é reescrita, não acumulada.
Tudo aqui é **Definido**, exceto o roteiro de validação (seção 7) e as sugestões (seção 8).

---

## 1. Entregas

- Imagem do fluxo geral: visão do todo, apresentada também aos clientes.
- Protótipo em HTML de maior fidelidade, construído no Claude Code a partir das telas de referência. As telas são construídas individualmente e agregadas ao protótipo, uma a uma.
- O protótipo representa a jornada inteira (inclui custo, orçamento, receita e aprovação). O desenvolvimento entrega por partes.
- Protótipo v1: o que o cliente preenche fica só no navegador dele e se perde ao fechar a página (sem salvar respostas nem anotações).
- Protótipo v1: "Exportar (.xlsx)" (em "Mais ações", no cabeçalho do plano, e no menu do plano da Visão Geral) e opção "Importar XLSX" na criação do plano, que aceita só o arquivo exportado pelo próprio protótipo. O import com mapeamento por cliente fica fora da v1. Depois, exportação e importação passam a seguir o layout do cliente.
- Arquivo exportado: abas **plano** (identificação, usada para conferir o arquivo no importar) · **operacoes** · **cultura_variedade** · **tratamento_sementes** · **corretivo_fertilizante** · **aplicacao_defensivo**, com os nomes de coluna do Excel de rascunho do cliente (sem as colunas de custo por enquanto). Uma linha por talhão × operação × produto, com a recomendação (Rec 1, TSI 2…), dose padrão, dose do talhão e volume (dose × área).
- Tecnologia do protótipo: HTML, CSS e JavaScript puros, sem framework (sem React). Prioridade agora é descobrir e estabilizar como o produto funciona, não a estrutura técnica definitiva. Construção no Claude Code com versionamento no GitHub, em repositório privado na conta pessoal (pode ser transferido para a empresa depois), com publicação pelo Netlify.
- Orientação do Claude Code: CLAUDE.md (regras do projeto), docs/TELAS.md (sequência de telas), docs/DECISOES.md (este doc) e imagens de referência em referencias/ (01-primeiro-uso, 02-modal-criar-plano, 03-lista-planos).
- Protótipo não é MVP; o MVP sai da validação.
- Safrinha: aparece nos planos de exemplo e no filtro Ano Agrícola; ainda não dá para escolher Safra ou Safrinha ao criar o plano.
- **Cadastro de safras** (como no sistema; no protótipo, só nos dados de exemplo): Código, Descrição ("2026/2027"), Apelido ("2026"), Data início, Data fim, **Ano Agrícola** (o "Ano Saldo" do sistema), Código de integração, Dólar padrão da safra e Valor. A safra **sempre começa em 01/09 de um ano e termina em 31/08 do ano seguinte**; o Ano Agrícola é o ano do início. A safrinha tem nome com os dois anos iguais ("27/27") e entra no ano agrícola anterior (2026, junto com a safra 26/27), com as mesmas datas. Safra criada no modal (só com o nome) recebe essas informações pela mesma regra.

## 2. Perfis

| Perfil | Papel |
|---|---|
| Agrônomo corporativo | Constrói o plano (cadastros e planejamento operacional) |
| Time corporativo | Revisa e aprova o plano |
| Analista de compras | Orçamento |
| Agrônomo da fazenda | Recebe o alerta e faz a programação agronômica da OS |
| Líder de operações (nome provisório) | Programação operacional: máquina e operador |
| Funcionário da fazenda | Executa a OS |

Agrônomo da fazenda e líder de operações podem ser a mesma pessoa, conforme a fazenda.

## 3. Cadastros (parametrizados por cliente)

- Grupo de operação → operação (dois níveis).
- Por operação: DAP padrão por cultura e prazo de conclusão padrão (dias). Ex.: plantio 3, defensivo 2, adubação 2, preparo do solo 30.
- Lista de motivos de atraso.
- Variedade (com ciclo), fertilizante e defensivo com as informações para gerar a OS, calcular necessidade e dar a época de aplicação.
- Pré-cadastro mínimo só quando o item não existe.

## 4. Planejamento (agrônomo corporativo)

### 4.0 Navegação geral

- Menu lateral verde com logo UniSystem: Plano de Safra, Ordens de Serviço, Cadastros (ícones: $ no Orçamento, trator em Ordens de Serviço, pessoas em Cadastros); usuário no rodapé. Clicar no usuário abre o **menu do usuário**: **Configurações** e Sair (Sair ainda não faz parte do protótipo).
- **Configurações:** modal com as seções à esquerda (por enquanto, só **Aparência**) e, em Aparência, **Claro | Escuro** (com ícone e nome). Vale para todas as telas. A escolha **não é guardada**: ao recarregar a página, volta ao claro.
- **Modo escuro** (design aprovado em https://claude.ai/artifact/6YjQqELwP5ZRRtfJUfka5P): fundo #0B1720, superfícies #15232D, texto #E6EDF2, verde ativo #176B50, informativo #203A4A, aviso neutro #30363D. Menu lateral no fundo escuro, com o item ativo no verde ativo. A foto do campo no topo da Visão Geral aparece **só no escuro**.
- **Cores dos grupos de operação** no protótipo inteiro (as do Calendário): Plantio verde, Fertilidade roxo, Defensivo laranja, Colheita dourado.
- Abas e guias com a **barra verde grossa** embaixo da selecionada. O caminho do plano no cabeçalho usa setas (Empresa › Fazenda › …). Na versão publicada ou revisada, o aviso de somente consulta aparece num modal ao tentar editar (4.1.1).
- Menu começa expandido (ícone + nome) em todas as telas; o usuário recolhe (só ícones) e expande pela seta; a escolha se mantém ao navegar.
- **Plano de Safra tem quatro itens no menu**, cada um com o seu ícone: **Visão Geral · Planejamento · Calendário Agrícola · Orçamento** (antes Suprimentos). O item selecionado tem destaque discreto em verde.
  - **Visão Geral:** lista de planos (filtros, criar plano, versões). Ver 4.1.
  - **Planejamento:** **um plano e uma versão por vez**, com as abas **Operações · Planejamento · Resumo** no cabeçalho. Pelo menu, abre o **plano mais recente já iniciado** (o último aberto ou, se nenhum foi aberto, o atualizado por último, entre os planos que já escolheram como iniciar: modelo, planilha, cópia ou do zero), na versão em construção ou, se não houver, na última publicada. O plano **não iniciado** só abre pela linha dele na Visão Geral (com o modal de início); sem nenhum plano iniciado, o menu Planejamento vai para a Visão Geral, sem modal (19/10/2026). Para trocar de plano: "Plano de Safra" no cabeçalho ou Visão Geral.
  - **Calendário Agrícola do menu** (construído; refeito em 16/10/2026): as **operações** de cada plano, numa tabela **Empresa › Fazenda › Safra/Safrinha**. **Abre no nível Empresa** (empresas e fazendas fechadas, 19/10/2026); a seta abre e fecha cada empresa e cada fazenda (a escolha se mantém ao navegar).
    - **Barras só no nível mais aberto de cada ramo** (19/10/2026): empresa fechada mostra as operações de todas as fazendas dela juntas; ao abrir a empresa, as barras dela somem e passam para as fazendas; ao abrir a fazenda, as barras dela somem e ficam só na safra e na safrinha. Fechar volta as barras para o nível de cima. Juntar: a mesma operação da mesma cultura vai do primeiro ao último dia.
    - Colunas: Fazenda / Safra · Cultura · Área · a linha do tempo. Empresa: a área total. Fazenda: a **sucessão de culturas** ("Soja → Milho"), a área dos talhões e, fechada, as barras da safra e da safrinha juntas. Safra e safrinha: "Safra 26/27" / "Safrinha 27/27", a cultura e a área.
    - **Cada operação é uma barra transparente**, do início no primeiro talhão (data de plantio + DAP; Plantio: a data de plantio; Colheita: plantio + ciclo da variedade) ao fim da previsão de conclusão no último talhão, numa **faixa por grupo de operação** (Plantio verde, Fertilidade roxo, Defensivo laranja, Colheita dourado; as cores do Calendário do plano). Onde operações do mesmo grupo se sobrepõem, a cor fica mais forte. Entram os talhões com data de plantio e com a operação planejada. Nome, grupo, cultura, datas e área ao passar o mouse.
    - Filtros Empresa, Fazenda, Cultura e **Período**: **Ano** (do mês da primeira operação ao da última, ex.: junho de 2026, calagem, a junho de 2027), **Semestre** e **Trimestre** (começam em setembro), **Mês** (começa no de hoje; uma coluna por dia).
    - **Sem filtro Ano Agrícola** (19/10/2026): o ano fica numa caixa acima da tabela, à direita ("Ano agrícola 2026"), com setas ‹ ›. No período **Ano**, as setas trocam o ano agrícola (entre os anos que têm planos; apagadas no primeiro e no último) e continuam aparecendo quando o ano não tem planos com os filtros. Nos outros períodos, a caixa mostra o período ("setembro de 2025", "set/2026 – fev/2027") e as setas andam um período por vez dentro do ano. Abre no **ano agrícola mais recente com planos** (19/10/2026). Limpar filtros volta ao ano agrícola mais recente e ao período Ano.
    - Legenda dos grupos com **bolinhas** e **Hoje** com um traço da mesma linha pontilhada cinza. Barras arredondadas. **Hoje: só a linha vertical pontilhada cinza** (igual no claro e no escuro), sem etiqueta (19/10/2026). Tabela branca (no escuro, na superfície escura, com as barras mais vivas). Sem versão nas linhas e sem nota de rodapé. Os nomes de empresa, fazenda e safra ficam sem ícone.
    - Testados e retirados (19/10/2026): ícones nos nomes de empresa, fazenda e safra, o "Zoom do período" com rolagem lateral e a etiqueta "Hoje" no topo da linha.
    - Testados e retirados: a barra única do ciclo da cultura (do primeiro plantio à última colheita), um ponto por operação e todas as barras numa faixa só. Design comparativo: https://claude.ai/artifact/GQwaPNJjpEyVKL2dh9prro.
    - Planos de exemplo: ano agrícola 2025, soja 25/26 e milho safrinha 26/26 da Santa Clara; ano agrícola 2026, soja 26/27 e milho safrinha 27/27 da Boa Vista (19/10/2026), com épocas e produtos do médio-norte do MT (aproximados, a conferir). Safra 26/26 no cadastro de safras.
  - **Calendário Agrícola e Orçamento:** **vários planos somados**, com filtros (o ano agrícola começa no **mais recente com planos**; os demais em "Todas"; no Calendário, o ano é escolhido pelas setas, sem filtro). Sem abas. Usam a **última versão publicada de cada plano**, avisado numa etiqueta fixa ao lado do título ("Últimas versões publicadas ⓘ": "Mostra a última versão publicada de cada plano. Alterações em versões em construção aparecem aqui depois de publicadas.").
  - **Orçamento de Insumos** (construído; detalhe na Tela 06): moeda de exibição R$ | US$ (pela PTAX); filtros Ano Agrícola (uma escolha) e, com várias escolhas, Safra, Empresa, Fazenda, Talhão, Cultura e Insumos; estimativas de comercialização (PTAX e, por cultura, preço e produtividade esperados) por Ano Agrícola; **só planos publicados** (a 0.1 vazia, registro da criação do plano, não conta como publicada: plano só com ela fica fora da área, da receita e dos filtros; o mesmo vale no Calendário Agrícola e em Ordens de Serviço); Resumo do orçamento, Orçamento por tipo de insumo e Detalhamento (Por produto · Por talhão). Cabeçalho, filtros e estimativas congelados no topo (alfinete descongela).
  - A **aba Resumo** do Planejamento mostra só o plano e a versão abertos, com **Programação** e **Ciclo Produtivo** (Tela 05). A guia **Calendário** (Mês, Semana, Dia) saiu do Resumo e foi para o menu **Ordens de Serviço** (abaixo). O Calendário Agrícola do menu é outra tela (acima).
  - **Ordens de Serviço** (19/10/2026, reunião com stakeholders; detalhe na Tela 07): por enquanto, o **Calendário das operações** que antes ficava no Resumo do plano, **sem a associação a um plano**: vários planos somados, na **última versão publicada de cada**. Filtros com várias escolhas: **Safra** (Safra ou Safrinha), **Empresa**, **Fazenda**, **Cultura** e **Talhão** ("Santa Clara · T01"). **Sem filtro de Ano Agrícola**: abre no dia de hoje e anda pelas setas do calendário (Mês, Semana, Dia). Legenda que filtra os grupos. Na Semana e no Dia, cada operação mostra **uma etiqueta por talhão**; no Mês, não (não cabe). Por enquanto só migrado; o refinamento para a programação das OS vem depois.
- **Áreas somadas:** **Área territorial** (área física, cada talhão contado uma vez) e **Área produtiva** (soma das áreas dos planos, ou seja, das safras).
- **Sem nenhum plano cadastrado**, Planejamento, Calendário Agrícola e Orçamento mostram "Crie seu primeiro plano para visualizar…" e o botão "+ Criar Plano de Safra". Texto em Planejamento e Calendário: o mesmo da Tela 01. No Orçamento: "O plano organiza a necessidade de insumos por safra, empresa, fazenda e cultura. Depois de criado, ele abre aqui automaticamente."

### 4.1 Visão Geral (tela inicial do Plano de Safra)

- **Primeiro uso** (nenhum plano cadastrado): ilustração, título "Comece o planejamento da sua safra", texto "O Plano de Safra organiza as necessidades de compra de insumos, gera o Calendário Agrícola e, a partir da versão publicada, cria automaticamente as Ordens de Serviço." e um único botão "Criar Plano Safra". A partir do primeiro plano, essa tela não aparece mais.
- O protótipo **abre já com os planos de exemplo**, (ano agrícola 2025: soja 25/26 e milho safrinha 26/26 da Santa Clara, publicados; ano agrícola 2026: soja 26/27 e milho safrinha 27/27 da Boa Vista, publicados (o T03 e o T08 da soja com duas variedades), e soja 26/27 da São José, **em construção**, iniciada pelo "Usar modelo" (as operações do modelo, sem planejamento); Primavera sem plano): o plano em construção, o usuário monta ele mesmo (a partir da São José ou de um plano novo). O item Demonstração saiu do menu (19/10/2026): para ver o primeiro uso, é preciso excluir os planos.
- **Com planos**: título "Visão Geral" com o caminho "Plano de Safra › Visão Geral" embaixo; duas guias, **Planos de Safra** (abre nela) e **Histórico de versões**, com os mesmos filtros; **Criar Plano Safra** na linha das guias, à direita.
- **Filtros** num cartão baixo, acima da tabela: **Ano Agrícola**, **Atividade produtiva**, **Safra** (Safra ou Safrinha), Empresa, Fazenda, Cultura e, só no Histórico, Status; **Limpar filtros** à direita (Ano Agrícola volta ao de hoje; os demais a "Todas"/"Todos").
- Filtro **Ano Agrícola** no lugar de Safra: escolher 2026 traz as safras e safrinhas daquele ano (26/27 e 27/27). Opções: os anos das safras cadastradas e dos planos. Começa no ano agrícola de hoje (01/09 a 31/08); senão, no mais recente. Depois de criar planos, abre no ano agrícola da safra deles.
- **Guia Planos de Safra** (detalhe na Tela 03):
  - **Tabela Planos de Safra**: os planos (Não iniciado, Em construção e Publicado), uma linha por plano (fazenda e safra), criados pelo usuário no modal Criar Plano de Safra (não automaticamente); colunas Empresa, Fazenda, Safra, Cultura, Área (ha), Status, Ações, com larguras fixas e equilibradas. Ordem padrão: status (Não iniciado, Em construção, Publicado) e, no mesmo status, alfabética de Safra, Empresa, Fazenda e Cultura. Ordena por qualquer coluna (seta no título; vazios no fim).
  - **Sem plano nos filtros:** no lugar da tabela, "Nenhum Plano de Safra cadastrado" e "Clique em + Criar Plano Safra para começar seu planejamento.", com o link que abre o modal já com as safras do Ano Agrícola, a Safra, a Empresa e a Fazenda dos filtros (Tela 03).
  - Os quadros Planejamento das Fazendas (Sem plano, Em construção, Publicado) saíram em 20/10/2026.
  - Saíram: as colunas Plantio, Fertilidade e Defensivos com o % de cada grupo por área (19/10/2026, reunião com stakeholders), o gráfico de área planejada por empresa, o % concluído e a lista antiga (Atividade, Última atualização e Atualizado por ficam no Histórico). Custo estimado e Receita projetada voltam se os usuários pedirem.
- **Guia Histórico de versões:** uma linha por versão de cada plano (da mais nova para a mais antiga). Colunas: Safra, Empresa, Atividade, Cultura, Fazenda, Versão, Status (Não iniciado, Em construção, Publicada ou Revisada; 4.1.1), Última atualização, Atualizado por (em construção: a última alteração salva; publicada ou revisada: a publicação). Clicar na linha abre aquela versão (publicada em consulta).
- **Um clique na linha abre** o plano (sem seta), na versão em construção ou, se não houver, na última publicada (em consulta). **Plano não iniciado:** abre o modal "Como deseja iniciar o plano?" (4.1.1).
- **Menu do plano** na tabela Planos de Safra (⋯ no fim da linha ou botão direito), nesta ordem: **Abrir · Criar nova versão · Histórico de versões · Exportar XLSX · (separador) · Excluir plano** (em vermelho).
  - **Criar nova versão:** a partir da **última publicada**; já abre em edição. Com uma versão em construção no plano, aparece desabilitado com "A versão 0.3 já está em construção"; plano não iniciado, com "O plano ainda não foi iniciado". Criar a partir de uma versão mais antiga é feito no Histórico de versões.
  - **Histórico de versões:** abre a guia Histórico de versões com os filtros naquele plano.
  - **Excluir plano:** permitido enquanto **nenhuma OS** foi gerada a partir do plano; depois, desabilitado com "O plano já gerou Ordens de Serviço". Com confirmação.
  - "Copiar para outra fazenda" fica para quando o cliente pedir.

### 4.1.1 Versões do plano

- Versões numeradas em sequência por plano (0.1, 0.2, 0.3…). Números nunca são reutilizados.
- **Status das versões** (19/10/2026, reunião com stakeholders): **Em construção** (ainda sem publicação; editável), **Publicada** (só a **última versão publicada** do plano) e **Revisada** (as publicadas antes dela). Publicada e Revisada são imutáveis, só consulta. Assim, cada plano tem **no máximo uma versão Publicada**: ao publicar uma versão nova, a Publicada de antes passa a Revisada. Vale em todos os lugares: Histórico de versões (e o filtro Status), cabeçalho do plano, Mais ações › Trocar versão, aviso de consulta ("Versão 0.1 revisada: somente consulta…") e Exportar (.xlsx).
- **Ao criar o plano**, nasce só a **versão 0.1, publicada**, com a identificação do plano, data, hora e responsável. Não nasce a 0.2.
- **0.1 vazia (plano não iniciado):** ao abrir o plano (linha da lista, "Abrir" no ⋯ ou menu Planejamento), aparece por cima da Visão Geral o **modal "Como deseja iniciar o plano?"**, com quatro opções nesta ordem:
  - **Usar modelo:** "Use uma estrutura pronta de operações e ajuste conforme necessário." Usa o modelo da cultura do plano (Soja ou Milho).
  - **Importar XLSX:** "Continue um plano exportado por este sistema (.xlsx)." Safra, Empresa, Fazenda e Cultura do plano são conferidas com as do arquivo; se forem diferentes, aviso com "Importar mesmo assim". Talhões do arquivo que não estão no plano ficam de fora, com aviso.
  - **Copiar plano existente:** "Copie um plano de safra da mesma cultura." Lista só os planos da mesma cultura (qualquer fazenda e safra) **já publicados**; copia sempre a **última versão publicada**: grupos, operações e recomendações com produtos e doses padrão, **sem talhões, áreas, plantio e germinação**.
  - **Começar do zero:** "Cadastre suas operações." Começa só com o Plantio e a Colheita (operações fixas), do modelo da cultura do plano.
  - "Começar o planejamento" cria a **0.2 em construção** com esse conteúdo e abre a aba Operações; a 0.1 fica como registro inicial. Cancelar ou X: o plano continua não iniciado.
- **Criar nova versão** (versão publicada): cria a próxima versão da sequência, copiando os dados da versão de origem, em construção, e abre em edição. Guarda a versão de origem (ex.: abrir a 0.1 com a 0.3 já publicada gera a 0.4, origem 0.1).
- **Só uma versão em construção por plano.** Pedir nova versão com outra em construção: aviso "Já existe uma versão em construção (0.3)" e a opção de abri-la; nada é criado nem descartado.
- **Salvamento automático** (versão em construção), como no Excel conectado ao OneDrive: cada alteração grava na hora, mantém o número e o status e registra data, hora e responsável. Sem botão "Salvar alterações" e sem "alterações não salvas". O cabeçalho mostra **"✓ Salvamento automático"**; quando e por quem foi salvo aparece ao passar o mouse ("Salva em 30/09 às 09:12 por João da Silva"). Nunca publica.
- **Publicar versão** (versão em construção, botão principal verde): confirmação "Publicar versão 0.3?" · "A versão será registrada no histórico e não poderá mais ser editada. Para realizar novas alterações, será necessário criar uma nova versão." · Cancelar · Publicar versão. Publicada, a versão guarda uma fotografia imutável dos dados agronômicos e financeiros e fica em consulta. **Não cria a próxima versão sozinha.** Publicar nunca altera outra versão publicada.
- **Versão publicada aberta:** tudo bloqueado, com status, data, hora e responsável da publicação e o botão **Criar nova versão**. Sem Publicar versão.
- **Versão publicada ou revisada: sem faixa fixa de aviso** (19/10/2026). O selo do status fica no cabeçalho. Quando o usuário **tenta editar** (clica num valor das tabelas, como dose, data, variedade, população ou produtividade, ou no cabeçalho da operação), abre o modal "**Versão 0.2 publicada**" (ou "Versão 0.1 revisada"): "Somente consulta. Para alterar, crie uma nova versão a partir desta." · **Cancelar · Criar nova versão**. Com outra versão em construção no plano: "Somente consulta. As alterações são feitas na versão 0.3, que já está em construção." · **Cancelar · Abrir versão 0.3**. Abas, guias, Tabela/Mapa/Previsão de colheita, filtros, ordenação, Mais ações e Exportar funcionam sem modal; clicar em espaço vazio não abre o modal; no Resumo (só consulta), também não.
- **Cabeçalho do plano** (fixo, igual nas abas):
  - Linha de cima: "Plano de Safra › Safra 26/27 · Empresa A · Fazenda São José · Cultura Soja | Versão 0.3 [Em construção]".
  - Linha das abas, à direita: em construção, **"✓ Salvamento automático" · Publicar versão · Mais ações ▾**; publicada, **Criar nova versão · Mais ações ▾**.
  - **Mais ações ▾:** **Editar talhões** (só na versão em construção) **· Exportar (.xlsx) · Trocar versão**. Trocar versão lista as versões do plano (da mais recente para a mais antiga, com status, data e responsável); como tudo já está salvo, troca direto.
- Publicar não é aprovação formal. Sem aprovação por enquanto.

### 4.2 Criar plano (modal "Criar Plano de Safra")

- Subtítulo: "Defina as informações gerais do plano e selecione as fazendas que farão parte da criação."
- **Informações gerais**, todas obrigatórias: Safra, Empresa, **Atividade**, Cultura.
- Safra: escolhida numa lista; se não existir, "Criar nova safra" ali mesmo. A safra tem só o nome por enquanto.
- **Atividade:** Agricultura, Pecuária ou Silvicultura. Por enquanto só Agricultura (já escolhida); as outras aparecem com "(Em breve)".
- **Fazendas:** um bloco por fazenda ("Fazenda 1", "Fazenda 2"…), com **Fazenda** (obrigatória), **Talhões (opcional)** e **Área de cultivo** (calculada). "+ Adicionar fazenda" cria outro bloco; a lixeira remove (com mais de um).
  - Ao escolher a fazenda, **todos os talhões vêm marcados** e a área já aparece; a pessoa desmarca os que não quer.
  - Sem talhões, a área fica "Pendente", com a dica "A área de cultivo será calculada automaticamente quando houver talhões selecionados." Não trava a criação.
  - **O plano mostra só os talhões incluídos** (Planejamento, mapa, Calendário, importação).
  - Incluir ou remover talhões depois, dentro do plano: **Editar talhões** (Mais ações ▾, só na versão em construção): modal "Editar talhões", com o texto "Inclua ou remova talhões da Fazenda São José no plano de safra." e todos os talhões da fazenda em duas colunas (caixas de marcar, "Todos", área de cada um; etiqueta "planejado" no talhão que já tem planejamento; o desmarcado fica riscado em vermelho e o novo, com fundo verde-claro); embaixo, "9 de 12 talhões · Área de cultivo: 870 ha · 3 removidos"; Cancelar e Aplicar. Talhão incluído entra sem planejamento. Removido leva o planejamento dele (plantio, germinação, recomendações e doses); com algum já planejado, confirma: "Remover 3 talhões? T03 e T07 já têm planejamento (plantio, recomendações e doses). Esse planejamento será apagado." Depois, "Talhões atualizados: 3 removidos · Desfazer" (volta os talhões com o planejamento que tinham). Incluir de volta um talhão removido (sem Desfazer): volta em branco. **Cada versão guarda os seus talhões**: a publicada não muda; versão nova copia os talhões da de origem. Na versão publicada, o item não aparece. A Visão Geral mostra a área de cultivo da versão da linha.
- **Um plano por fazenda:** com duas fazendas, nascem dois planos (uma linha cada na Visão Geral).
- **Cada empresa tem as suas fazendas** (19/10/2026): no Criar Plano, a lista Fazenda mostra só as da empresa escolhida (desabilitada sem empresa); no filtro Fazenda da Visão Geral, com uma empresa escolhida, só as dela. Dados de exemplo: Empresa A, São José e Santa Clara; Empresa B, Boa Vista; Empresa C, Primavera.
- Um único plano por safra e fazenda (a refinar): não deixa repetir fazenda entre os blocos nem criar um que já existe.
- Cultura é definida no nível da fazenda e pode ser alterada no talhão.
- **Culturas no protótipo: Soja e Milho.** A lista de culturas do modal tem as duas (nenhuma vem escolhida). O plano de Milho começa pelo **modelo de milho** (o mesmo do plano de exemplo de milho safrinha, sem fenologia, porque o cadastro de estádios é o da soja); o de Soja, pelo modelo da soja.
- **Continua sendo um modal**, aberto pelo "Criar Plano Safra" da Visão Geral, **só com a identificação do plano**. Safra/Safrinha: a detalhar.
- **"Como deseja iniciar o plano?" saiu deste modal**: é outro modal, na primeira vez que o plano é aberto (4.1.1).
- Botões: **Cancelar** e **Criar Plano de Safra** (parece desabilitado até os obrigatórios estarem preenchidos; clicado, mostra o que falta). Ao criar, **volta para a Visão Geral**, com o aviso "Plano criado… Clique na linha para começar." Os planos nascem só com a 0.1 e aparecem como "Não iniciado".

### 4.3 Etapas e regras do plano

- Safra, Empresa e Fazenda ficam fixas no topo durante o plano.
- Abas do plano (menu Planejamento): **Operações · Planejamento · Resumo** (Resumo = o Calendário Agrícola do plano, com Programação e Ciclo Produtivo). O Orçamento (antes Suprimentos) saiu das abas e é item do menu (4.0). Sem etapa de Aprovação por enquanto. O plano abre em Operações (não iniciado: antes, o modal de início; 4.1.1).
- Dentro de Planejamento, sub-etapas por grupo de operação, na ordem do cadastro do cliente (sugestão em validação).
- **Etapa Operações** (docs/telas/04.0-operacoes.md): revisa a estrutura do plano vinda do modelo (grupo de operação, operação, DAP, fenologia e previsão de conclusão). É opcional: quem não quiser mexer segue direto para o Planejamento. Sem resumo nem situação (isso fica no Calendário, depois de planejar).
- O plano também tem produtividade esperada (na unidade da cultura) e preço esperado, opcionais, por cultura, valendo para aquela fazenda e safra. Alimentam a receita projetada. Local a refinar com usuários.
- Previsão de cumprimento no modelo: preparo, calcário, fósforo, 1ª dessecação e 1ª metade do K = 5 dias (levantado com clientes); demais: plantio 3, defensivos 2, corretivo/fertilizante 2; colheita 10 (valor de exemplo).
- Modelo de operações no protótipo: **Plantio · Defensivo · Fertilidade · Colheita** (Tratamento de semente: fora do protótipo por enquanto (15/10/2026); guardado em rascunhos/tsi/ (marca no git `tsi-15-10-2026`)) (Preparo do solo, levantado com clientes, fica fora por enquanto). As duas dessecações pré-plantio são do grupo Defensivos.
- **Grupo Colheita:** DAP pelo ciclo da variedade (data de plantio + ciclo, talhão a talhão), sem fenologia e previsão de conclusão editável. Não aparece nas guias do Planejamento.
- **Grupo sem operação continua no plano** (e nas guias do Planejamento): ao excluir ou mover todas as operações de um grupo, ele fica, para receber operações novas. Só "Sem grupo" some quando fica vazio. Para tirar um grupo, use "Excluir grupo".
- **Excluir um grupo mantém as operações**: elas ficam "Sem grupo" até o usuário escolher o grupo de cada uma (na etapa Operações); sem grupo, a operação não aparece no Planejamento. Vale na etapa Operações e no Planejamento (botão direito na guia).
- **Plantio:** DAP 0 fixo.
- **Etapa Operações** (19/10/2026): caixas de marcar sempre à vista (cinza claro; marcadas em verde, com a linha destacada) e **lixeira** no título da tabela, só com alguma marcada, para **excluir em lote** (com confirmação e Desfazer). **Mover para grupo em lote saiu por enquanto.** O botão **Editar** abre o modal **Grupos de operação** (renomear, adicionar e excluir grupos numa tabela, com Cancelar e Salvar; Plantio e Colheita fixos; grupo excluído: as operações ficam "Sem grupo"). Detalhe na Tela 04.0.
- **Tipos de grupo: Sementes, Defensivos, Fertilidade e Colheita.** O grupo **Fertilidade** junta corretivos e fertilizantes (inclusive adubação foliar). No protótipo, as guias do Planejamento são Plantio · Defensivo · Fertilidade. **O grupo do tipo Sementes se chama Plantio** (19/10/2026, reunião com stakeholders) em todo o protótipo (guias, legendas dos calendários, coluna da Visão Geral, tipo ao criar grupo); só o **Orçamento** continua com **Sementes**, porque lá é o tipo de insumo comprado. O tipo **Tratamento de sementes** (TSI) está fora do protótipo por enquanto (15/10/2026); guardado em rascunhos/tsi/ (marca no git `tsi-15-10-2026`).
- O menu Cadastros não é prioridade agora.
- Etapa Planejamento refina talhão a talhão: cada talhão tem o seu planejamento, e o agrônomo pode aplicar ou copiar para vários talhões de uma vez.
- Programação, execução e gestão da OS ficam em outro item do menu lateral (Ordens de Serviço). Por enquanto, ele mostra o Calendário das operações (4.0 e Tela 07).
- Plano por safra, empresa, fazenda, talhão e cultura/variedade.
- Data de plantio (ao menos prevista) e escolha entre DAP ou DAE.
- Planejamento por grupo (fertilizantes, sementes, defensivos).
- Momento da operação = fenologia + DAP/DAE (negativo no pré-plantio). Sem DAP padrão, o agrônomo informa.
- **Pré-plantio (DAP negativo), Plantio (DAP 0) e Colheita não têm fenologia** ("—"). Com DAP positivo (Manejo da cultura), o agrônomo escolhe o estádio.
- Fases da safra na etapa Operações: **Pré-plantio · Plantio · Manejo da cultura · Colheita**, definidas pelo DAP. Elas só ordenam a tabela e definem a fenologia; **não aparecem como faixa**, nem na etapa Operações nem na Tabela do Resumo (confundia ao excluir operações).
- Operação "opcional" é só anotação.
- Previsão de colheita = data de plantio + ciclo da variedade para a região da fazenda e a safra do plano. Sem ciclo cadastrado para a safra corrente, abre o pré-cadastro para informar o ciclo. Recalculada com a data real de plantio da OS.
- Restrição de aplicação do produto (ex.: "somente terrestre") aparece só como informação ao lado do produto, vinda do cadastro. Forma de aplicação e vazão não são preenchidas no plano.
- **Calendário Agrícola** (nome provisório; dentro do plano, a aba se chama **Resumo**): aba vizinha com todas as operações ordenadas por DAP/DAE, cresce durante o planejamento e mostra o status de cada item. Detalhe: docs/telas/05-calendario-agricola.md.
  - Duas visões, em guias: **Programação** (antes Tabela: uma linha por operação com os produtos embaixo e uma coluna por talhão, com a dose de cada um; a que abre primeiro) e **Ciclo Produtivo** (antes Infográfico: uma coluna por fase da cultura). Filtros por grupo e talhão. A guia **Calendário** (agenda Mês/Semana/Dia) foi para o menu Ordens de Serviço (19/10/2026; 4.0 e Tela 07). Mostra **só o que já foi planejado** (produto e dose; no Plantio, variedade), na versão em construção e na publicada, e vai se preenchendo conforme o planejamento. Sem nada planejado, o aviso "**Nenhuma operação planejada ainda.** As operações planejadas aparecem aqui com datas e doses por talhão."
  - Sem previsões de plantio e colheita em texto (retiradas).
  - **Prazo para encerramento da OS** (previsão de conclusão) é informado na **etapa Operações**, por operação, já preenchido com o padrão (5 dias calagem, gessagem, fosfatagem, 1ª dessecação e 1ª adubação potássica; 3 plantio; 2 as demais; 10 colheita). O Calendário não mostra nem edita.
  - A **colheita** entra no calendário pela previsão do plantio (data de plantio + ciclo da variedade).

### 4.4 Plantio (grupo Plantio)

Detalhe da tela: docs/telas/04.2-operacoes-sementes.md.

- Planejamento do plantio, por talhão: **variedade, data de plantio e população de plantas**, numa tabela só, com **uma linha por variedade**.
- **Várias variedades no mesmo talhão** (19/10/2026; reunião de 13/10, seção 5): cada uma com a sua **área de aplicação**; a soma não passa da área do talhão. A área é informada **em ha** na edição individual (tabela e painel do talhão) e **em % da área de cada talhão** na edição em massa (modal Definir plantio). Ao inserir uma variedade: enquanto ninguém digitou uma área, divide igualmente (em ha ou em %); depois, a nova fica com o que sobra ou em branco.
- **As outras operações do talhão** (defensivos, fertilidade, OS, calendários) partem da **primeira data de plantio** do talhão; a **colheita** é de cada variedade (data de plantio + ciclo dela). Sementes, Orçamento, Previsão de colheita e Exportar contam cada variedade pela área dela.
- **Tabela do Plantio**: clique esquerdo na linha abre o painel do talhão; botão direito: Inserir · Excluir · Limpar conteúdo; a caixa de marcar é da linha (Excluir plantio apaga só as marcadas). **Painel do talhão**: histórico de produtividade e chuva (expandido, minimizável) e as variedades planejadas numa **tabela editável direto nas células** (variedade em lista suspensa, área, plantio, população, germinação e lixeira; sem variedade, uma linha em branco), com **Cancelar** (volta ao que está salvo) e **Salvar** no rodapé (rascunho; nenhum dos dois fecha o painel, só o ✕, que pergunta se houver alterações). **Modal Definir plantio**: composição em % dos talhões marcados, que substitui as variedades deles (com confirmação). Detalhe na Tela 04.2. O **tratamento de sementes (TSI)** está fora do protótipo por enquanto (15/10/2026); guardado em rascunhos/tsi/ (marca no git `tsi-15-10-2026`) (4.4.1).
- **Data de plantio planejada por dia** (data exata por talhão). A janela de plantio recomendada da variedade é só referência: data fora dela gera alerta, sem bloquear.
- A previsão de colheita (4.3) é agregada por **decêndio**, em hectares, para o agrônomo ver se a colheita fica concentrada e decidir trocar variedade ou data. Capacidade de colheita fica fora da v1.
- **Mapa de variedades da fazenda**: os talhões pintados pela variedade, com a área total de cada variedade, para visualizar e rotacionar as variedades. Talhão com várias variedades: **hachura verde** e a legenda "Múltiplas variedades", sem dividir o talhão no mapa. O plano é por fazenda, então o mapa é por fazenda (sem visão por empresa). Clicar no talhão abre a definição da variedade.
- Escolha da variedade com apoio do histórico do talhão: produtividade das 3 últimas safras da cultura e chuva acumulada no ciclo de cada uma.
- **Germinação** (%): na v1, estimada no plano (a semente ainda não foi comprada; não há lote). Informada no **modal Definir plantio** (um valor para as variedades dos talhões marcados) e, variedade a variedade, no **painel do talhão**; na tabela do Plantio, só leitura.
- População de plantas: recomendada (cadastro da variedade, referência, mostrada só no preenchimento) e planejada (agrônomo). Talhão sem variedade também pode receber população (liberado para os testes; travar de novo se confundir).
- **Sementes = população planejada × área de aplicação ÷ germinação.** Embalagem pelo padrão de mercado da cultura: **soja em bags (1 bag = 5 milhões de sementes)**, **milho em sacos (1 saco = 60 mil sementes)**. A mesma no Plantio, no Exportar e no Orçamento.
### 4.4.1 Tratamento de sementes (grupo Tratamento de semente)

**Fora do protótipo por enquanto** (decidido em 15/10/2026). As regras, o detalhe da tela (antigo docs/telas/04.4) e onde paramos estão em `rascunhos/tsi/README.md`; o protótipo como estava, na marca do git `tsi-15-10-2026`. Ponto a decidir ao retomar: como calcular a quantidade de TSI (dose por 100 kg de semente; falta o peso da semente, ex.: PMS por variedade).

### 4.5 Fertilidade (corretivos e fertilizantes)

Detalhe da tela: docs/telas/04.3-operacoes-fertilidade.md.

- Grupo do tipo **Fertilidade**, com o mesmo funcionamento da recomendação agronômica do Defensivo (receitas, talhões, doses por talhão).
- No lugar do princípio ativo, a **matéria-prima** (fonte do nutriente: MAP, cloreto de potássio, calcário…), com a mesma lógica: ajuda a achar o produto comercial. A **garantia** (teores) é informação do produto.
- Unidade da dose vem do cadastro do produto: **t/ha** para corretivos, **kg/ha** para fertilizantes de solo, **L/ha** para foliares.
- Adubação foliar fica neste grupo.

## 5. Orçamento e aprovação

- Necessidade de insumos calculada do plano; estoque vem do Compass (integração a definir); necessidade de compra = necessidade − estoque.
- Orçamento (analista de compras): quantidade × preço de referência do histórico; manual sem histórico; comparação com safra anterior (fora do protótipo por enquanto).
- **Orçamento de Insumos no protótipo** (Tela 06):
  - Grupos de insumo: **Fertilizantes · Defensivos · Sementes · Corretivos · Tratamento de semente · Adjuvantes · Biológicos · Óleo**, pela classe do produto no cadastro.
  - Cada insumo tem moeda própria (R$ ou US$); a **PTAX de referência** converte o que está em US$. Sementes por embalagem da cultura: soja em bag de 5 milhões de sementes, milho em saco de 60 mil.
  - **A comprar = necessidade − estoque, fazenda a fazenda** (nunca negativo). Estoque por fazenda.
  - Custo em sacas = custo/ha ÷ preço da saca (ou @) em reais, **só com uma cultura**; receita estimada = área × produtividade × preço, somada num card só.
  - Valores sem casa decimal; o que arredondaria para zero mostra 0,1 (custo unitário com centavos).
  - Custos operacionais e adicionais: fora por enquanto.
- **Sem aprovação por enquanto.** A **última versão publicada** é a referência para gerar as OS; versão em construção nunca gera OS. Se a última publicada não tiver operações válidas, não gera OS e informa o motivo. Cada OS guarda a versão do plano que a originou. Quando e como as OS são geradas: a detalhar.
- Cada versão publicada guarda a fotografia do orçamento de suprimentos (produtos, quantidades, unidades, preços e data de referência, custos por grupo, total), sem recálculo quando os preços mudam.

## 6. Ordem de Serviço

### 6.1 Status

**Operação em planejamento** → (versão publicada) → **OS planejada** → **OS programada** → **Em execução** → **Fechada**

| Status | Quando | Com atraso quando |
|---|---|---|
| OS planejada | Gerada a partir da última versão publicada | Chegou a data prevista e não foi programada |
| OS programada | Os dois blocos da programação estão completos e a data de abertura é futura | — |
| Em execução | Chegou a data de abertura (automático) | Passou data de abertura + prazo de conclusão sem fechar |
| Fechada | OS fechada | Fechada após data de abertura + prazo de conclusão |

- "No prazo / com atraso" é marca dentro do status, não status novo.
- Programação agronômica pronta sem a operacional: continua planejada, com indicador "aguardando líder de operações".
- Motivo do atraso: da lista do cliente + observação opcional; obrigatório ao avançar a OS atrasada (programar ou fechar); fica no histórico (data, autor, status, motivo, observação). Atraso na programação: informa o agrônomo da fazenda.

### 6.2 Programação

- Alerta ao agrônomo da fazenda antes da data prevista (5 dias, a confirmar).
- **Bloco agronômico** (agrônomo da fazenda): produto, dose, volume, talhões (incluir, remover, agrupar da mesma fazenda), data, forma de aplicação (defensivo: aérea ou terrestre; fertilizante: a lanço ou na linha de plantio).
- **Bloco operacional** (líder de operações; o doc do Compass chama de "líder de execução", é o mesmo papel): máquina, operador, vazão.
- Produto não permitido na forma de aplicação escolhida trava a OS; o gestor pode desbloquear.
- **PMS e germinação na programação (OS de plantio)**: o sistema busca na ordem lote → cadastro da variedade (clientes que não controlam lote) → estimativa do plano. Quando vem da estimativa do plano, os campos aparecem destacados como "estimado no plano" e a programação só é concluída depois que o agrônomo confirma a estimativa ou informa os valores reais. O valor final recalcula a quantidade de sementes.
- **Lote da semente** (clientes que controlam por lote): informado pelo agrônomo da fazenda na programação, bloco agronômico. Regras de seleção de lotes (FEFO, mais de um lote, estoque insuficiente) e fórmulas: ver Plano_Safra_Cultura_Variedade_revisado_Julyane.docx.
- **Data de abertura**: preenchida com a data prevista, editável. Abrir antes = mudar a data.
- Prazo de conclusão vem do cadastro da operação, editável.
- Ajustes em uma OS ou em lote, sem nova aprovação.
- Aplicação fora do plano: agrônomo da fazenda cria a OS direto como programada.
- OS integradas ao Compass; hoje preenchidas no Compass e no UniLavoura.

### 6.3 Informações por momento (em revisão)

- **Planejamento:** identificação (safra, empresa, fazenda, talhão, área do talhão, área de aplicação, cultura, variedade); momento (grupo de operação, operação, fenologia, DAP/DAE, data prevista); insumo (grupo, princípio ativo, produto, unidade, dose recomendada e planejada, volume); semente (variedade, data de plantio, germinação por talhão, população recomendada e planejada, quantidade de sementes e bags; PMS em aberto, ver 4.4); tratamento de sementes (TSI por talhão).
- **Programação:** blocos agronômico e operacional, data de abertura, prazo de conclusão, vazão, sequência de mistura (regra a detalhar), local de estoque, parâmetros de voo, observações. Detalhe por tipo de OS em 6.4.
- **Execução/fechamento:**
  - Apontamento da área executada por talhão, por dia de operação ou pela área total, com saldo a apontar (área prevista − área apontada); cada apontamento guarda data da operação e data de lançamento.
  - Talhões aplicados: área aplicada (ha) e data de aplicação por talhão; incluir talhão novo ou marcar talhão como não aplicado.
  - Incluir talhão: só talhões da mesma fazenda da OS, escolhidos de uma lista; a tela indica isso ao usuário (ex.: "Talhões da Fazenda Santa Ana"). O talhão incluído aparece destacado como desvio e pede justificativa.
  - Talhões programados aparecem listados para marcar aplicado / não aplicado; nenhum vem marcado por padrão; opção "marcar todos como aplicados"; não aplicado pede justificativa.
  - Produtos aplicados por talhão: produto ou lote, unidade, dose da OS, dose aplicada e quantidade. Resumo por produto: retirado, devolvido, a aplicar.
  - Observação e anexos.
  - Área e dose aplicadas não vêm pré-preenchidas no fechamento, para que desvios não passem despercebidos.
  - O valor programado aparece ao lado só como referência e a pessoa digita o valor real; quando diverge, o sistema destaca a diferença e pede justificativa.
  - A OS pode ser fechada com área, talhões, volume ou dose diferentes do programado (inclui saldo a apontar maior que zero e talhão não aplicado).
  - Referência atual: telas de fechamento do Compass (abas Ap. Área/Talhão e Fecha OS). Máquina/implemento e hora/homem ficam fora do protótipo (sugestão).

### 6.4 Informações por tipo de OS
Referência: ordem_servico_compass_erp.docx (telas do Compass).

**Defensivos**
- Planejamento: princípio ativo, produto comercial, unidade (do cadastro), dose recomendada (dosagem do fornecedor, no cadastro do produto), dose planejada (definida pelo agrônomo), quantidade = dose × área (calculada).
- Programação: local de estoque, emissão (data da programação), veiculante (água ou óleo), receituário (a validar), máquina (código e nome do patrimônio, volume do tanque vindo do cadastro do patrimônio), nº de reabastecimentos = volume total de calda (vazão × área) ÷ volume do tanque.
- "Não oficial" (por produto): não aparece no relatório de aplicação aérea nem no plano de voo, mas conta na retirada de estoque, na auditoria e nos custos.
- Aplicação aérea: plano de voo (temperatura máxima, umidade relativa mínima, vento máximo, ângulo, altura de voo, largura da faixa, equipamento, modelo, tipo). Entra assim no protótipo; campos e responsável a validar com os clientes.

**Sementes**
- Quantidade também convertida para a unidade da embalagem do produto.
- Usa cadastro da variedade, cadastro do lote e ciclo da variedade.

**Fertilizantes**
- Planejamento: líquido ou sólido; foliar ou solo (validar com clientes se faz sentido no planejamento). Sem princípio ativo e sem fase.
- Programação: forma de aplicação a lanço ou na linha de plantio (sem aérea, terrestre ou pivô), decidida pelo agrônomo da fazenda (bloco agronômico). Vazão e volume de calda só para fertilizante líquido.

**Colheita**
- Só talhões que tiveram plantio; ao selecionar o talhão vêm área plantada, cultura e variedade.
- Área total e área da OS (nome a melhorar), pois pode planejar 100 ha e colher 80 ha.

### 6.5 Dashboard de Gestão da OS

- Planejado x programado x executado, desvios de aplicação, OS criadas fora do plano.
- Gráfico de status na ordem da jornada: planejada, programada, em execução (no prazo / com atraso), fechada (no prazo / com atraso).
- Motivos de atraso analisáveis.

### 6.6 Fora do Plano de Safra

- Transferência de insumos entre fazendas; estoque por fazenda para cada agrônomo (produto futuro).
- Análise de solo, recomendação nutricional, monitoramento de pragas e doenças, biblioteca agronômica (camadas futuras).

## 7. Roteiro de validação

1. O que acontece quando o plano não é aprovado? (sugestão: status "Necessidade de revisão", volta ao agrônomo com apontamentos)
2. Com quantos dias de antecedência o agrônomo da fazenda deve ser avisado? (base cita 2 e 5 dias)
3. No acompanhamento, comparar planejada x programada x fechada ou só programada x fechada?
4. Onde a OS é programada, alterada e fechada (Plano de Safra, Compass ou UniLavoura) e quem fecha hoje (funcionário, líder de operações ou agrônomo da fazenda)? Define quem informa o atraso na execução.
5. **(Clientes e time interno)** Hipótese: a OS abre na data de abertura informada na programação. Corresponde à rotina? Se não, o que abre a OS (retirada de insumo, ida da máquina a campo)? A retirada de insumo deveria definir a data de abertura? Como funciona em OS sem insumo (ex.: colheita)?
6. No fechamento, incluir talhão só da mesma fazenda da OS atende? Existe caso de a mesma operação atender talhões de outra fazenda?
7. Como chamam quem define máquina e operador? (provisório: líder de operações)
8. Como funciona hoje o processo de compras, do orçamento ao recebimento?
9. Preço de referência do orçamento: última compra, média da última safra, média de 2 anos ou compra de maior volume? Apresentar em dólar, real e sacas (soja/milho) ou @ (algodão) por hectare?
10. Necessidade x estoque no nível da empresa ou por fazenda?
11. Com a safra em andamento, um plano importado do Excel pode gerar OS planejadas sem aprovação?
12. O receituário agronômico precisa estar na OS de defensivo?
13. Plano de voo (aplicação aérea): quais informações são necessárias e quem preenche?
14. Faz sentido informar no planejamento se o fertilizante é líquido ou sólido e foliar ou solo?
15. Onde informar produtividade e preço esperados, e quem conhece o preço de venda?
16. Um plano por safra e fazenda atende, ou há casos de mais de um plano (ex.: por cultura)?

## 8. Sugestões não aprovadas

- Lista inicial de motivos de atraso (clima, máquina quebrada/indisponível, falta de insumo, falta de operador, decisão agronômica, outro) para o cliente revisar.
- Ajuste automático do DAP das operações finais pelo ciclo da variedade (futuro).
- Edição em lote com deslocamento de datas ("adiar 3 dias") e prévia de quantas OS e talhões serão afetados.
- Marcar OS criada direto como programada como "não planejada", com motivo curto.
- Protótipo com 2 ou 3 lotes fictícios por variedade (germinação e PMS diferentes) para mostrar o recálculo, e comparação "Plano x Lote" da quantidade de sementes.
- OS registra a origem do PMS e da germinação (lote, variedade ou estimativa do plano).
- Avisar o responsável pelo cadastro quando uma variedade estiver sem PMS e germinação.
- Tela inicial: colunas "Etapa atual" e "Avanço" (ex.: 32 de 48 talhões planejados); juntar "Última atualização" e "Atualizado por"; linha inteira clicável; busca por fazenda.
- Cultura na lista com complemento quando houver talhões de outra cultura (ex.: "Soja · 3 talhões com milho").
- Criar nova safra propondo o nome no formato padrão (ex.: 2026/27) para evitar duplicidade.
- Modal de criação: aviso imediato quando a fazenda já tem plano na safra, com atalho "Abrir plano existente"; rodapé com botões sempre visível.
- Produtividade e preço em bloco recolhível na etapa Cadastro, com unidade automática pela cultura (sc/ha, @/ha).

## 9. Notas para o protótipo

- Dados de exemplo: operações de soja com DAP (Preparo do solo −50 → Colheita 107).
- Campos: planilha plano_safra_piccini_rascunho.xlsx (abas cultura_variedade, tratamento_sementes, corretivo_fertilizante, aplicacao_defensivo).
- Calendário: escala com muitos talhões; mostrar talhão, data e status; coerência DAP/DAE no pré-plantio; talhões com plantios diferentes pedem ordenar por DAP ou por data.
- Valores das imagens de referência são ilustrativos; no protótipo, números sempre calculados a partir dos dados de exemplo.
- Visual: estilo próprio, clean, menu lateral verde com logo UniSystem (Plano de Safra, Ordens de Serviço, Cadastros) e usuário no rodapé. Modo claro e escuro (Configurações › Aparência; 4.0).
