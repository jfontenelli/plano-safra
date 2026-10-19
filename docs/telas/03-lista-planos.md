# Tela 03 — Visão Geral (Planos de Safra e Histórico de versões)

Imagem: `referencias/03-lista-planos.png` (lista antiga). A guia Planos de Safra veio de uma imagem de painel da usuária (filtros, Planejamento das Fazendas e tabela por fazenda), sem o gráfico de área por empresa, que foi retirado.
Na imagem o menu aparece recolhido só para ilustrar esse estado; a regra do menu está no CLAUDE.md.

## Objetivo
Acompanhar o planejamento das fazendas no ano agrícola, filtrar e abrir ou criar um plano.

## Quando aparece
- Ao clicar em "Visão Geral" (dentro de Plano de Safra) no menu, quando existe ao menos um plano.
- Ao abrir o protótipo: ele já vem com os planos de exemplo, só publicados (ano agrícola 2025: soja 25/26 e milho safrinha 26/26 da Santa Clara, publicados; ano agrícola 2026: soja 26/27 e milho safrinha 27/27 da Boa Vista, publicados, e soja 26/27 da São José, em construção, iniciada pelo "Usar modelo"). O plano em construção, o usuário cria e monta ele mesmo.

## Conteúdo
- Título "Visão Geral" com o caminho "Plano de Safra › Visão Geral" embaixo e, abaixo, duas guias (mesmo estilo das abas do plano, com a barra verde grossa na selecionada): **Planos de Safra** (abre nela) e **Histórico de versões**. **+ Criar Plano Safra** fica na linha das guias, à direita.
- No modo escuro, o topo tem a foto do campo (`img/fundo-plano-safra.jpg`) por trás do título; no claro, não.
- **Filtros** num cartão baixo, acima dos quadros, sem título, compactos e lado a lado: **Ano Agrícola**, **Atividade produtiva**, **Safra** (Safra ou Safrinha), Empresa, Fazenda, Cultura e, só no Histórico, Status; **Limpar filtros** à direita. Valem para as duas guias.
- **Guia Planos de Safra:**
  - **Planejamento das Fazendas**: três quadros compactos, sem título de seção: **Sem plano** (informativo), **Em construção** (aviso neutro) e **Publicado** (verde), cada um com ícone, ⓘ com a regra de contagem, "X de N", barra e "N% das fazendas" (o % em negrito).
  - **Planos de Safra**: título com ícone no topo do cartão; tabela **só com os planos** (Em construção, incluindo Não iniciado, e Publicado), uma linha por plano (fazenda e safra). A fazenda sem plano não aparece na tabela, só conta nos quadros. Colunas: Empresa, Fazenda, Safra ("Safra 26/27" ou "Safrinha 27/27"), Cultura, Área (ha), Status e Ações (⋯), com larguras fixas e equilibradas (Empresa e Fazenda 18%, Safra 17%, Cultura 14%, Área 12%, Status 15%, Ações 6%; espaço entre a Área e o Status).
- **Guia Histórico de versões:** uma linha por versão de cada plano; colunas Safra, Empresa, Atividade, Cultura, Fazenda, Versão, Status, Última atualização, Atualizado por. Status da versão: **Não iniciado**, **Em construção**, **Publicada** (só a última publicada do plano) ou **Revisada** (as publicadas antes dela; selo neutro, com contorno).

## Regras
- **Quem entra na conta** (quadros): cada fazenda conta **uma vez por safra e uma vez por safrinha**. Cada safra ou safrinha **cadastrada** no ano agrícola (no cadastro de safras ou criada no modal), mesmo sem nenhum plano, faz entrar **todas as fazendas de todas as empresas**; a fazenda sem plano nela conta como **Sem plano**. As fazendas de cada empresa ficam nos dados de exemplo (`fazendasPorEmpresa`). Um plano por safra e fazenda.
- **Status** (na tabela): **Não iniciado** (plano criado, só com a 0.1 vazia; nos quadros conta como Em construção), **Em construção** e **Publicado**, pela versão de trabalho (a em construção ou, sem ela, a última publicada).
- **Área (ha)**: área de cultivo do plano (talhões incluídos); sem talhões, "—".
- **Ordenar por coluna**: seta no título de cada coluna (menos Ações), 1º clique crescente, 2º decrescente; vazios ("—") sempre no fim; Status na ordem Não iniciado, Em construção, Publicado. Sem escolha: empresa, fazenda, safra antes da safrinha, cultura.
- Filtro **Ano Agrícola** (DECISOES 1, cadastro de safras): escolher 2026 traz as safras e safrinhas daquele ano (26/27 e 27/27). Opções: os anos das safras cadastradas e dos planos. Começa no ano agrícola de hoje (01/09 a 31/08); senão, no mais recente. Depois de criar planos, abre no ano agrícola da safra deles.
- Nos quadros, a fazenda sem plano passa pelos filtros de Atividade e Cultura (ainda não tem nenhuma das duas). Empresa e Fazenda oferecem também as fazendas das empresas, mesmo sem plano.
- **Filtro Fazenda segue a Empresa:** com uma empresa escolhida, só as fazendas dela; a fazenda escolhida que não é da nova empresa volta para "Todas".
- **Limpar filtros**: Ano Agrícola volta ao de hoje; os demais a "Todas"/"Todos".
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
- A linha Sem plano saiu da tabela (16/10/2026), com o "Criar plano" do ⋯ dela; a fazenda sem plano só conta nos quadros.
- As colunas Plantio, Fertilidade e Defensivos (% de cada grupo por área) saíram em 19/10/2026 (reunião com stakeholders).

## Navegação
- "+ Criar Plano Safra" → abre a Tela 02 (modal) por cima desta tela; ao criar, volta à guia Planos de Safra no ano agrícola da safra criada.
- Clique na linha ou "Abrir" no menu → abre o plano no Planejamento, aba Operações (Tela 04.0), na versão em construção ou na última publicada. Plano não iniciado: antes, o modal "Como deseja iniciar o plano?" (Tela 02).
- Linha do Histórico de versões → abre aquela versão do plano.

## Para testar
- Ter um jeito simples de alternar entre "sem planos" (mostra Tela 01) e "com planos de exemplo" (mostra esta tela).
- Planos de exemplo coerentes entre si (safras, áreas e valores).
