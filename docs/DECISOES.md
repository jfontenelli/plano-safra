# Plano de Safra: decisões

Atualizado em 08/10/2026. Próximo passo: Calendário Agrícola revisado (só o que foi planejado, com resumo).
Imagem do fluxo: artifact "Fluxo do Plano de Safra" (claude.ai/artifact/4kzr4fg15grTw4YSHKmHf2).

Este doc mostra só o estado atual. Decisão alterada é reescrita, não acumulada.
Tudo aqui é **Definido**, exceto o roteiro de validação (seção 7) e as sugestões (seção 8).

---

## 1. Entregas

- Imagem do fluxo geral: visão do todo, apresentada também aos clientes.
- Protótipo em HTML de maior fidelidade, construído no Claude Code a partir das telas de referência. As telas são construídas individualmente e agregadas ao protótipo, uma a uma.
- O protótipo representa a jornada inteira (inclui custo, orçamento, receita e aprovação). O desenvolvimento entrega por partes.
- Protótipo v1: o que o cliente preenche fica só no navegador dele e se perde ao fechar a página (sem salvar respostas nem anotações).
- Protótipo v1: botão "Exportar (.xlsx)" (no cabeçalho do plano e no menu do plano da Visão Geral) e opção "Importar XLSX" na criação do plano, que aceita só o arquivo exportado pelo próprio protótipo. O import com mapeamento por cliente fica fora da v1. Depois, exportação e importação passam a seguir o layout do cliente.
- Arquivo exportado: abas **plano** (identificação, usada para conferir o arquivo no importar) · **operacoes** · **cultura_variedade** · **tratamento_sementes** · **corretivo_fertilizante** · **aplicacao_defensivo**, com os nomes de coluna do Excel de rascunho do cliente (sem as colunas de custo por enquanto). Uma linha por talhão × operação × produto, com a recomendação (Rec 1, TSI 2…), dose padrão, dose do talhão e volume (dose × área).
- Tecnologia do protótipo: HTML, CSS e JavaScript puros, sem framework (sem React). Prioridade agora é descobrir e estabilizar como o produto funciona, não a estrutura técnica definitiva. Construção no Claude Code com versionamento no GitHub, em repositório privado na conta pessoal (pode ser transferido para a empresa depois), com publicação pelo Netlify.
- Orientação do Claude Code: CLAUDE.md (regras do projeto), docs/TELAS.md (sequência de telas), docs/DECISOES.md (este doc) e imagens de referência em referencias/ (01-primeiro-uso, 02-modal-criar-plano, 03-lista-planos).
- Protótipo não é MVP; o MVP sai da validação.
- Safrinha: fora do escopo atual.

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

- Menu lateral verde com logo UniSystem: Plano de Safra, Ordens de Serviço, Cadastros; usuário no rodapé.
- Menu começa expandido (ícone + nome) em todas as telas; o usuário recolhe (só ícones) e expande pela seta; a escolha se mantém ao navegar.

### 4.1 Tela inicial do Plano de Safra

- **Primeiro uso** (nenhum plano cadastrado): ilustração, título "Comece o planejamento da sua safra", texto "O Plano de Safra organiza as necessidades de compra de insumos, gera o Calendário Agrícola e, após a aprovação, cria automaticamente as Ordens de Serviço." e um único botão "Criar Plano Safra". A partir do primeiro plano, essa tela não aparece mais.
- **Com planos**: filtros (Safra, Empresa, Fazenda, Cultura); lista de planos com o botão "Criar Plano Safra" à direita do título da lista. Sem indicadores (cards de Visão geral) no topo.
- Filtro de safra começa na safra mais recente cadastrada (não em "Todas").
- Colunas da lista: Safra, Empresa, Fazenda, Cultura, Área, Custo estimado, Receita projetada, Status, Última atualização, Atualizado por.
- Status do plano: **Em construção** e **Aprovado**.
- Custo e receita ficam vazios até que as informações que os alimentam existam.
- **Menu do plano** na lista (⋯ no começo da linha ou botão direito): Excluir · Exportar (.xlsx) · Abrir. **Só plano Em construção pode ser excluído** (o aprovado gerou OS e é a linha de base), com confirmação. "Copiar para outra fazenda" fica para quando o cliente pedir.

### 4.2 Criar plano (modal "Criar Plano de Safra")

- Subtítulo: "Defina o contexto do novo planejamento."
- Campos, nesta ordem: Safra, Empresa, Fazenda, Cultura.
- Safra: escolhida numa lista; se não existir, "Criar nova safra" ali mesmo. A safra tem só o nome por enquanto.
- Um único plano por safra e fazenda (a refinar).
- Cultura é definida no nível da fazenda e pode ser alterada no talhão.
- **Por enquanto o protótipo funciona só para soja**: a lista de culturas tem só Soja (já vem escolhida no modal). Variedades, população, bags e TSI são de soja.
- "Como deseja iniciar o plano?":
  - **Usar modelo** (pré-selecionado): "Use uma estrutura pronta de operações e ajuste conforme necessário." Lista de operações levantada com os clientes, pré-preenchida para ajustar. Serve também de plano de exemplo para o usuário ver como fica.
  - **Sem "Plano em branco" na v1**: o plano sempre nasce do modelo (ou do arquivo importado); quem quiser outra estrutura exclui grupos ou operações e cria os seus na etapa Operações.
  - **Importar XLSX**: "Continue um plano exportado por este sistema (.xlsx)." Na v1, só o arquivo exportado pelo protótipo. Safra, empresa, fazenda e cultura do modal são conferidas com as do arquivo; se forem diferentes, a pessoa escolhe "Usar os do arquivo" ou "Manter os do modal" (talhões que não existem na fazenda ficam de fora, com aviso).
  - **Clonar safra anterior**: card visível e desabilitado com selo "Em breve", sem ação por enquanto.
- Botões: Cancelar e "Continuar para o cadastro" (leva à etapa 1). "Continuar" fica desabilitado até os quatro campos estarem preenchidos.

### 4.3 Etapas e regras do plano

- Safra, Empresa e Fazenda ficam fixas no topo durante o plano.
- Etapas do plano: **1 Operações → 2 Planejamento → 3 Calendário Agrícola → 4 Suprimentos → 5 Aprovação**. O plano abre em Operações.
- Dentro de Planejamento, sub-etapas por grupo de operação, na ordem do cadastro do cliente (sugestão em validação).
- **Etapa Operações** (docs/telas/04.0-operacoes.md): revisa a estrutura do plano vinda do modelo (grupo de operação, operação, DAP, fenologia e previsão de conclusão). É opcional: quem não quiser mexer segue direto para o Planejamento. Sem resumo nem situação (isso fica no Calendário, depois de planejar).
- O plano também tem produtividade esperada (na unidade da cultura) e preço esperado, opcionais, por cultura, valendo para aquela fazenda e safra. Alimentam a receita projetada. Local a refinar com usuários.
- Previsão de cumprimento no modelo: preparo, calcário, fósforo, 1ª dessecação e 1ª metade do K = 5 dias (levantado com clientes); demais: plantio 3, defensivos 2, corretivo/fertilizante 2; colheita 10 (valor de exemplo).
- Modelo de operações no protótipo: **Semente · Tratamento de semente · Defensivo · Fertilidade · Colheita** (Preparo do solo, levantado com clientes, fica fora por enquanto). As duas dessecações pré-plantio são do grupo Defensivos.
- **Grupo Colheita:** DAP pelo ciclo da variedade (data de plantio + ciclo, talhão a talhão), sem fenologia e previsão de conclusão editável. Não aparece nas guias do Planejamento.
- **Grupo sem operação some do plano** (não teve apontamento), inclusive das guias do Planejamento; Semente e Colheita ficam.
- **Excluir um grupo mantém as operações**: elas ficam "Sem grupo" até o usuário escolher o grupo de cada uma (na etapa Operações); sem grupo, a operação não aparece no Planejamento. Vale na etapa Operações e no Planejamento (botão direito na guia).
- **Plantio:** DAP 0 fixo. **TSI:** DAP −5 sugerido no modelo (Pré-plantio).
- **Tipos de grupo: Sementes, Tratamento de sementes, Defensivos, Fertilidade e Colheita.** O grupo **Fertilidade** junta corretivos e fertilizantes (inclusive adubação foliar). O grupo **Tratamento de sementes** tem o TSI. No protótipo, as guias do Planejamento são Semente · Tratamento de semente · Defensivo · Fertilidade.
- O menu Cadastros não é prioridade agora.
- Etapa Planejamento refina talhão a talhão: cada talhão tem o seu planejamento, e o agrônomo pode aplicar ou copiar para vários talhões de uma vez.
- Programação, execução e gestão da OS ficam em outro item do menu lateral (Ordens de Serviço).
- Plano por safra, empresa, fazenda, talhão e cultura/variedade.
- Data de plantio (ao menos prevista) e escolha entre DAP ou DAE.
- Planejamento por grupo (fertilizantes, sementes, defensivos).
- Momento da operação = fenologia + DAP/DAE (negativo no pré-plantio). Sem DAP padrão, o agrônomo informa.
- **Pré-plantio (DAP negativo), Plantio (DAP 0) e Colheita não têm fenologia** ("—"). Com DAP positivo (Manejo da cultura), o agrônomo escolhe o estádio.
- Fases da safra na etapa Operações: **Pré-plantio · Plantio · Manejo da cultura · Colheita**, definidas pelo DAP.
- Operação "opcional" é só anotação.
- Previsão de colheita = data de plantio + ciclo da variedade para a região da fazenda e a safra do plano. Sem ciclo cadastrado para a safra corrente, abre o pré-cadastro para informar o ciclo. Recalculada com a data real de plantio da OS.
- Restrição de aplicação do produto (ex.: "somente terrestre") aparece só como informação ao lado do produto, vinda do cadastro. Forma de aplicação e vazão não são preenchidas no plano.
- **Calendário Agrícola** (nome provisório): aba vizinha com todas as operações ordenadas por DAP/DAE, cresce durante o planejamento e mostra o status de cada item. Detalhe: docs/telas/05-calendario-agricola.md.
  - Duas visões: **Tabela** (uma linha por operação com os produtos embaixo e uma coluna por talhão, com a dose de cada um; é a visão principal e a que abre primeiro) e **Infográfico** (uma coluna por fase da cultura: Pré-plantio, Plantio, fenologias, Colheita; complementar). Filtro por talhão. Mostra **só o que já foi planejado** (produto e dose; no Plantio, variedade), em construção e no aprovado, e vai se preenchendo conforme o planejamento. Sem nada planejado, o aviso "**Nenhuma operação planejada ainda.** As operações planejadas aparecem aqui com datas e doses por talhão."
  - **Previsões em texto** abaixo dos filtros, nas duas visões: **Plantio estimado** e **Colheita estimada** (da primeira à última data dos talhões com plantio definido). O calendário ocupa a área logo abaixo das abas do plano.
  - **Prazo para encerramento da OS** (previsão de conclusão) é informado na **etapa Operações**, por operação, já preenchido com o padrão (5 dias calagem, gessagem, fosfatagem, 1ª dessecação e 1ª adubação potássica; 3 plantio; 2 as demais; 10 colheita). O Calendário não mostra nem edita.
  - A **colheita** entra no calendário pela previsão do plantio (data de plantio + ciclo da variedade).

### 4.4 Plantio (grupo Semente)

Detalhe da tela: docs/telas/04.2-operacoes-sementes.md.

- Planejamento do plantio, por talhão: **variedade, data de plantio e população de plantas**, numa tabela só. O **tratamento de sementes (TSI)** fica num grupo próprio, logo depois (4.4.1).
- **Data de plantio planejada por dia** (data exata por talhão). A janela de plantio recomendada da variedade é só referência: data fora dela gera alerta, sem bloquear.
- A previsão de colheita (4.3) é agregada por **decêndio**, em hectares, para o agrônomo ver se a colheita fica concentrada e decidir trocar variedade ou data. Capacidade de colheita fica fora da v1.
- **Mapa de variedades da fazenda**: os talhões pintados pela variedade, com a área total de cada variedade, para visualizar e rotacionar as variedades. O plano é por fazenda, então o mapa é por fazenda (sem visão por empresa). Clicar no talhão abre a definição da variedade.
- Escolha da variedade com apoio do histórico do talhão: produtividade das 3 últimas safras da cultura e chuva acumulada no ciclo de cada uma.
- **Germinação por talhão** (%): na v1, estimada no plano (a semente ainda não foi comprada; não há lote). Informada por talhão, com atalho para aplicar o mesmo valor em todos os talhões.
- População de plantas: recomendada (cadastro da variedade, referência, mostrada só no preenchimento) e planejada (agrônomo). Talhão sem variedade não recebe população.
- **Sementes = população planejada × área ÷ germinação. Bags = sementes ÷ 5.000.000** (1 bag de soja = 5 milhões de sementes).
### 4.4.1 Tratamento de sementes (grupo Tratamento de semente)

Detalhe da tela: docs/telas/04.4-operacoes-tratamento-sementes.md.

- Grupo do tipo **Tratamento de sementes**, guia **Tratamento de semente**, logo depois da guia Semente. Operação **Tratamento de sementes (TSI)**, com DAP no cabeçalho (como no Defensivo), sem fenologia; o modelo sugere **DAP −5**.
- **Tratamento de sementes industrial (TSI)**: receita com nome (TSI 1, TSI 2…), só para talhão com variedade, no padrão da recomendação agronômica (composição de produtos = identidade; dose pode variar por talhão), aplicada **por talhão** (pode mudar após os testes). Composta por grupos de produto: fertilizante, fungicida, inseticida, nematicida, inoculante, polímero, pó secante e grafite.
- Unidade da dose de TSI vem do cadastro do produto; a unidade usada pelos clientes (por 100 kg de sementes, por bag ou por hectare) e a entrada do PMS no plano serão definidas nos testes. Sem cálculo de quantidade de TSI no plano por enquanto.
- Excluir o plantio de um talhão (sem variedade) tira o talhão também do TSI.
### 4.5 Fertilidade (corretivos e fertilizantes)

Detalhe da tela: docs/telas/04.3-operacoes-fertilidade.md.

- Grupo do tipo **Fertilidade**, com o mesmo funcionamento da recomendação agronômica do Defensivo (receitas, talhões, doses por talhão).
- No lugar do princípio ativo, a **matéria-prima** (fonte do nutriente: MAP, cloreto de potássio, calcário…), com a mesma lógica: ajuda a achar o produto comercial. A **garantia** (teores) é informação do produto.
- Unidade da dose vem do cadastro do produto: **t/ha** para corretivos, **kg/ha** para fertilizantes de solo, **L/ha** para foliares.
- Adubação foliar fica neste grupo.

## 5. Orçamento e aprovação

- Necessidade de insumos calculada do plano; estoque vem do Compass (integração a definir); necessidade de compra = necessidade − estoque.
- Orçamento (analista de compras): quantidade × preço de referência do histórico; manual sem histórico; comparação com safra anterior.
- Aprovação pelo time corporativo transforma as operações em OS planejadas, travadas como linha de base. O plano aprovado não muda durante a safra.

## 6. Ordem de Serviço

### 6.1 Status

**Operação em planejamento** → (aprovação) → **OS planejada** → **OS programada** → **Em execução** → **Fechada**

| Status | Quando | Com atraso quando |
|---|---|---|
| OS planejada | Após a aprovação | Chegou a data prevista e não foi programada |
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
- Modal de criação: fazenda filtrada pela empresa; aviso imediato quando a fazenda já tem plano na safra, com atalho "Abrir plano existente"; rodapé com botões sempre visível.
- Produtividade e preço em bloco recolhível na etapa Cadastro, com unidade automática pela cultura (sc/ha, @/ha).

## 9. Notas para o protótipo

- Dados de exemplo: operações de soja com DAP (Preparo do solo −50 → Colheita 107).
- Campos: planilha plano_safra_piccini_rascunho.xlsx (abas cultura_variedade, tratamento_sementes, corretivo_fertilizante, aplicacao_defensivo).
- Calendário: escala com muitos talhões; mostrar talhão, data e status; coerência DAP/DAE no pré-plantio; talhões com plantios diferentes pedem ordenar por DAP ou por data.
- Valores das imagens de referência são ilustrativos; no protótipo, números sempre calculados a partir dos dados de exemplo.
- Visual: estilo próprio, clean, menu lateral verde com logo UniSystem (Plano de Safra, Ordens de Serviço, Cadastros) e usuário no rodapé.
