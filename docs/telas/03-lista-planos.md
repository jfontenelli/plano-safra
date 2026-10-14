# Tela 03 — Visão Geral (lista de planos)

Imagem: `referencias/03-lista-planos.png`. Rascunho com a coluna Versão e o menu ⋯ novo: `rascunhos/navegacao-contexto.html` (item Visão Geral).
Na imagem o menu aparece recolhido só para ilustrar esse estado; a regra do menu está no CLAUDE.md.

## Objetivo
Ver os planos existentes, filtrar e abrir ou criar um plano.

## Quando aparece
- Ao clicar em "Visão Geral" (dentro de Plano de Safra) no menu, quando existe ao menos um plano.
- Ao abrir o protótipo: ele já vem com os planos de exemplo.

## Conteúdo
- Título "Visão Geral" e, embaixo, duas guias (mesmo estilo das abas do plano): **Visão Geral** e **Histórico de versões**.
- **Filtros** num cartão baixo, sem título, compactos e lado a lado, na ordem das colunas: Safra, Empresa, Atividade, Cultura, Fazenda, Status; **Limpar filtros** à direita. Valem para as duas guias.
- **Guia Visão Geral — Planos de Safra:** título e botão "Criar Plano Safra" dentro do cartão da lista; colunas Safra, Empresa, Atividade, Cultura, Fazenda, **Área de cultivo**, **Versão** (só o número), **Status**, Última atualização, Atualizado por e **Ações** (botão ⋯). Sem seta: a linha inteira abre o plano.
- **Guia Histórico de versões:** uma linha por versão de cada plano; colunas Safra, Empresa, Atividade, Cultura, Fazenda, Versão, Status, Última atualização, Atualizado por.

## Regras
- Opções de cada filtro: **só os valores que existem nos planos da lista** (ex.: Atividade só Agricultura). Status: Não iniciado, Em construção, Publicada.
- Filtro de Safra começa na safra mais recente que tem plano (não em "Todas"). Os demais começam em "Todas"/"Todos". Depois de criar planos, abre na safra deles.
- **Limpar filtros**: Safra volta à mais recente; os demais a "Todas"/"Todos".
- Os filtros atualizam a lista; trocar de guia mantém os filtros. A guia escolhida se mantém ao navegar.
- **Área de cultivo**: soma dos talhões incluídos no plano (modal Criar Plano); sem talhões, "Pendente".
- **Versão**: o número da versão que a linha abre (a mais recente). **Status**: **Não iniciado** (etiqueta branca, bolinha vazada; plano só com a 0.1 vazia), **Em construção** (cinza) ou **Publicada** (verde). Não há mais "Aprovado".
- **Ordem da lista**: Status (Não iniciado, Em construção, Publicada), depois Safra (mais recente primeiro), Fazenda e Cultura em ordem alfabética.
- Custo estimado e Receita projetada saíram da lista; voltam se os usuários pedirem.
- **Um clique na linha abre** o plano, na versão em construção ou, se não houver, na última publicada (em consulta). **Plano não iniciado**: abre o modal "Como deseja iniciar o plano?" (Tela 02). Ao passar o mouse, a linha fica verde-clara e o cursor vira a mãozinha. Pelo teclado: Tab chega na linha e Enter abre. Clicar no ⋯ só abre o menu.
- **Menu do plano**: pelo **⋯** no fim da linha ou pelo **botão direito** na linha. Itens, nesta ordem: **Abrir · Criar nova versão · Histórico de versões · Exportar XLSX · (separador) · Excluir plano** (em vermelho).
  - **Abrir**: o mesmo que clicar na linha.
  - **Criar nova versão**: cria a próxima versão a partir da **última publicada** e abre em edição (DECISOES 4.1.1). Com uma versão em construção no plano, aparece desabilitado com "A versão 0.3 já está em construção" (clicar na linha leva até ela); plano não iniciado, com "O plano ainda não foi iniciado". Sem versão em construção, mostra embaixo "A partir da versão 0.2, publicada".
  - **Histórico de versões**: abre a guia Histórico de versões com os filtros naquele plano. Comparação entre versões: a detalhar.
  - **Exportar XLSX**: baixa o plano em planilha (o mesmo arquivo do botão Exportar dentro do plano; ver docs/DECISOES.md, seção 1).
  - **Excluir plano** (em vermelho): permitido enquanto **nenhuma OS** foi gerada a partir do plano; depois, desabilitado com "O plano já gerou Ordens de Serviço". Confirmação: título "Excluir plano?", "Soja · Safra 26/27 · Fazenda São José" e "As operações, recomendações e talhões planejados desse plano serão apagados. Essa ação não pode ser desfeita." · Cancelar · **Excluir plano** (vermelho). Depois, aviso "Plano excluído"; sem nenhum plano, volta à Tela 01.
  - "Copiar para outra fazenda" fica para quando o cliente pedir.
- **Histórico de versões**:
  - Planos na ordem Safra (mais recente primeiro), Fazenda e Cultura; versões da mais nova para a mais antiga. O filtro Status vale para o status de cada versão; a 0.1 de um plano não iniciado aparece como "Não iniciado".
  - Última atualização / Atualizado por: em construção, a última alteração (salvamento automático); publicada, a publicação.
  - Um clique na linha (ou Enter) abre aquela versão (publicada em consulta). Plano não iniciado: o modal de início.

## Navegação
- "Criar Plano Safra" → abre a Tela 02 (modal) por cima desta tela.
- Clique na linha ou "Abrir" no menu → abre o plano no Planejamento, aba Operações (Tela 04.0), na versão em construção ou na última publicada. Plano não iniciado: antes, o modal "Como deseja iniciar o plano?" (Tela 02).
- Linha do Histórico de versões → abre aquela versão do plano.

## Para testar
- Ter um jeito simples de alternar entre "sem planos" (mostra Tela 01) e "com planos de exemplo" (mostra esta tela).
- Planos de exemplo coerentes entre si (safras, áreas e valores).
