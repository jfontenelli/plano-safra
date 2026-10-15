# Tela 03 — Visão Geral (Planos de Safra e Histórico de versões)

Imagem: `referencias/03-lista-planos.png` (lista antiga). A guia Planos de Safra veio de uma imagem de painel da usuária (filtros, Planejamento das Fazendas e tabela por fazenda), sem o gráfico de área por empresa, que foi retirado.
Na imagem o menu aparece recolhido só para ilustrar esse estado; a regra do menu está no CLAUDE.md.

## Objetivo
Acompanhar o planejamento das fazendas no ano agrícola, filtrar e abrir ou criar um plano.

## Quando aparece
- Ao clicar em "Visão Geral" (dentro de Plano de Safra) no menu, quando existe ao menos um plano.
- Ao abrir o protótipo: ele já vem com os planos de exemplo, só publicados (soja 26/27 e milho safrinha 27/27 da Santa Clara). O plano em construção, o usuário cria e monta ele mesmo.

## Conteúdo
- Título "Visão Geral" e, embaixo, duas guias (mesmo estilo das abas do plano): **Planos de Safra** (abre nela) e **Histórico de versões**.
- **Filtros** num cartão baixo, sem título, compactos e lado a lado: **Ano Agrícola**, **Atividade produtiva**, **Safra** (Safra ou Safrinha), Empresa, Fazenda, Cultura e, só no Histórico, Status; **Limpar filtros** à direita. Valem para as duas guias.
- **Guia Planos de Safra:**
  - **Planejamento das Fazendas** (ⓘ com a regra de contagem; subtítulo "Situação dos planos de safra no contexto selecionado."): três quadros, **Sem plano** (azul), **Em construção** (laranja) e **Publicado** (verde), cada um com ícone, "X de N", barra e "N% das fazendas".
  - **Planos de Safra**: título e botão "+ Criar Plano Safra" no topo do cartão; tabela com uma linha por fazenda e safra. Colunas: Empresa, Fazenda, Safra ("Safra 26/27" ou "Safrinha 27/27"), Cultura, Área (ha), **Sementes**, **TSI**, **Fertilidade**, **Defensivos** (barrinha e %), Status e Ações (⋯).
- **Guia Histórico de versões:** uma linha por versão de cada plano; colunas Safra, Empresa, Atividade, Cultura, Fazenda, Versão, Status, Última atualização, Atualizado por.

## Regras
- **Quem entra na conta** (quadros e tabela): cada fazenda conta **uma vez por safra e uma vez por safrinha**. Cada safra ou safrinha **cadastrada** no ano agrícola (no cadastro de safras ou criada no modal), mesmo sem nenhum plano, faz entrar **todas as fazendas de todas as empresas**; a fazenda sem plano nela aparece como **Sem plano**. As fazendas de cada empresa ficam nos dados de exemplo (`fazendasPorEmpresa`). Um plano por safra e fazenda.
- **Status**: **Sem plano**, **Não iniciado** (plano criado, só com a 0.1 vazia; nos quadros conta como Em construção), **Em construção** e **Publicado**, pela versão de trabalho (a em construção ou, sem ela, a última publicada).
- **% de cada grupo, por área**: em cada operação do grupo, a área dos talhões incluídos que têm recomendação completa (produto e dose; no Sementes, variedade e data de plantio) ÷ área de cultivo; o % do grupo é a média das operações. Ex.: Calagem em 80 de 100 ha (80%) e Gessagem em 50 de 100 ha (50%) dão Fertilidade 65%. Grupo que o plano não tem (ex.: milho sem TSI), plano não iniciado e fazenda sem plano: "—". A Colheita não entra (vem do plantio).
- **Área (ha)**: área de cultivo do plano (talhões incluídos); sem plano, "—".
- **Ordenar por coluna**: seta no título de cada coluna (menos Ações), 1º clique crescente, 2º decrescente; vazios ("—") sempre no fim; Status na ordem Sem plano, Não iniciado, Em construção, Publicado. Sem escolha: empresa, fazenda, safra antes da safrinha, cultura.
- Filtro **Ano Agrícola** (DECISOES 1, cadastro de safras): escolher 2026 traz as safras e safrinhas daquele ano (26/27 e 27/27). Opções: os anos das safras cadastradas e dos planos. Começa no ano agrícola de hoje (01/09 a 31/08); senão, no mais recente. Depois de criar planos, abre no ano agrícola da safra deles.
- Fazenda sem plano passa pelos filtros de Atividade e Cultura (ainda não tem nenhuma das duas). Empresa e Fazenda oferecem também as fazendas das empresas, mesmo sem plano.
- **Limpar filtros**: Ano Agrícola volta ao de hoje; os demais a "Todas"/"Todos".
- Os filtros atualizam a guia; trocar de guia mantém os filtros. A guia escolhida se mantém ao navegar.
- **Um clique na linha de plano abre** o plano, na versão em construção ou, se não houver, na última publicada (em consulta). **Plano não iniciado**: abre o modal "Como deseja iniciar o plano?" (Tela 02). Pelo teclado: Tab chega na linha e Enter abre. Linha Sem plano não abre nada.
- **Menu do plano**: pelo **⋯** no fim da linha ou pelo **botão direito** na linha. Itens, nesta ordem: **Abrir · Criar nova versão · Histórico de versões · Exportar XLSX · (separador) · Excluir plano** (em vermelho).
  - **Abrir**: o mesmo que clicar na linha.
  - **Criar nova versão**: cria a próxima versão a partir da **última publicada** e abre em edição (DECISOES 4.1.1). Com uma versão em construção no plano, aparece desabilitado com "A versão 0.3 já está em construção"; plano não iniciado, com "O plano ainda não foi iniciado". Sem versão em construção, mostra embaixo "A partir da versão 0.2, publicada".
  - **Histórico de versões**: abre a guia Histórico de versões com os filtros naquele plano. Comparação entre versões: a detalhar.
  - **Exportar XLSX**: baixa o plano em planilha (o mesmo arquivo do botão Exportar dentro do plano; ver docs/DECISOES.md, seção 1).
  - **Excluir plano** (em vermelho): permitido enquanto **nenhuma OS** foi gerada a partir do plano; depois, desabilitado com "O plano já gerou Ordens de Serviço". Confirmação: título "Excluir plano?", "Soja · Safra 26/27 · Fazenda São José" e "As operações, recomendações e talhões planejados desse plano serão apagados. Essa ação não pode ser desfeita." · Cancelar · **Excluir plano** (vermelho). Depois, aviso "Plano excluído"; sem nenhum plano, volta à Tela 01.
  - "Copiar para outra fazenda" fica para quando o cliente pedir.
- **Linha Sem plano**: o ⋯ tem só **Criar plano**, que abre o modal Criar Plano já com a safra, a empresa e a fazenda (com todos os talhões).
- **Histórico de versões**:
  - Planos na ordem Safra (mais recente primeiro), Fazenda e Cultura; versões da mais nova para a mais antiga. O filtro Status vale para o status de cada versão; a 0.1 de um plano não iniciado aparece como "Não iniciado".
  - Última atualização / Atualizado por: em construção, a última alteração (salvamento automático); publicada, a publicação.
  - Um clique na linha (ou Enter) abre aquela versão (publicada em consulta). Plano não iniciado: o modal de início.
- Custo estimado, Receita projetada e % concluído saíram; voltam se os usuários pedirem.

## Navegação
- "+ Criar Plano Safra" → abre a Tela 02 (modal) por cima desta tela; ao criar, volta à guia Planos de Safra no ano agrícola da safra criada.
- Clique na linha ou "Abrir" no menu → abre o plano no Planejamento, aba Operações (Tela 04.0), na versão em construção ou na última publicada. Plano não iniciado: antes, o modal "Como deseja iniciar o plano?" (Tela 02).
- "Criar plano" no ⋯ de uma linha Sem plano → Tela 02 preenchida.
- Linha do Histórico de versões → abre aquela versão do plano.

## Para testar
- Ter um jeito simples de alternar entre "sem planos" (mostra Tela 01) e "com planos de exemplo" (mostra esta tela).
- Planos de exemplo coerentes entre si (safras, áreas e valores).
