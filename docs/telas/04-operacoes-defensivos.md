# Tela Operações (grupo Defensivo)

Atualizado em 05/10/2026. Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Tudo é **Definido**, exceto as seções "Sugestões em teste" e "Em aberto".
Referência no protótipo: `tela/04-operacoes-defensivos`. Referência visual: mockup de 02/10/2026 (grupos no rodapé).
**A imagem é só referência visual. Quando imagem e documento divergirem (nomes, ordem de colunas, botões, comportamento), vale este documento.**

---

## 1. Objetivo

O agrônomo corporativo monta as operações do plano, grupo por grupo: cria as operações com DAP, monta as recomendações da recomendação agronômica (produtos e doses padrão), aplica cada recomendação nos talhões e, se precisar, ajusta talhão a talhão.

## 2. Lugar na jornada

- **Visão Geral** é a tela inicial do Plano de Safra, fora do plano: cards, filtros, lista de planos e "Criar plano".
- Dentro de um plano, as etapas são: **Operações · Calendário Agrícola · Suprimentos · Aprovação**.
- Calendário Agrícola é o único lugar que junta todos os grupos, ordenados por DAP; lá se informa a previsão de cumprimento de cada operação.
- Produtividade e preço esperados ficam em Suprimentos.
- O conteúdo da etapa Aprovação (incluindo a revisão) será definido quando chegarmos nela.

## 3. Layout geral

```
Plano de Safra  ›  Safra 26/27 · Empresa A · Fazenda Santa Maria · Cultura Soja · Em construção
──────────────
Operações   Calendário Agrícola   Suprimentos   Aprovação
─────────
┌───────────────────────┬──────────────────────────────────────────────────────────┐
│ Operações   ✏️   DAP ≪│ 1ª Fungicida   DAP [30]  Fenologia [V5 ▾]                │
│ ▌1ª Fungicida     30  │ 1.085 ha · 11 talhões · 1 sem operação · 1 sem dose       │
│  2ª Fungicida     45  │ Recomendação agronômica                                   │
│  3ª Fungicida     60  │   Recomendação 1 │ Recomendação 2 │ + Nova recomendação              🗑   │
│  4ª Fungicida     75  │   Princípio ativo · Produto comercial · Unid. · Dose padrão│
│                       │   [Aplicar nos talhões]   [Salvar recomendação] [+ Adicionar produto]│
│ + Nova operação       │ Talhões da recomendação agronômica            ✏️  🔍      │
│                       │   Talhão · Área · dose por produto (cor da linha = status)│
└───────────────────────┴──────────────────────────────────────────────────────────┘
Grupo de operações │ Corretivos │ Semente │ Fertilizante │ Defensivo │ Colheita │ + │      🗑
```

Princípio: o peso visual de cada navegação é inverso à frequência de uso. Etapas em abas no topo, grupos em guias no rodapé (como o Excel), operações na lista lateral, colada ao conteúdo.

## 4. Cabeçalho

- **"Plano de Safra" é um link** que volta para a Visão Geral. O menu lateral também volta.
- Contexto fixo ao lado: Safra · Empresa · Fazenda · Cultura · Status do plano (Em construção ou Aprovado).
- Etapas em abas sublinhadas, sem número: Operações · Calendário Agrícola · Suprimentos · Aprovação.

## 5. Grupos de operação (guias no rodapé)

- Guias no rodapé da página, como as abas de planilha do Excel, com o rótulo "Grupo de operações" à esquerda. O rodapé fica fixo.
- Sugestão inicial: Corretivos, Semente, Fertilizante, Defensivo, Colheita.
- **"+"** no fim das guias cria um grupo: pede nome e tipo (obrigatórios).
- Tipos: Corretivos, Sementes, Fertilizantes, Defensivos, Colheita. O tipo define as informações mínimas pedidas no grupo.
- **Renomear: duplo clique na guia**, como no Excel.
- **Excluir: lixeira na ponta direita do rodapé**, agindo sobre a guia selecionada.
- Arrastar a guia reordena os grupos.
- As guias não mostram contador de pendências.

## 6. Operações do grupo (lista lateral)

- Lista à esquerda com nome e DAP de cada operação, ordenada automaticamente pelo DAP; cabeçalho "Operações" com o rótulo "DAP" e o botão ≪; "+ Nova operação" no fim. A lista rola sozinha, sem rolar a página.
- A lista mostra só nome e DAP; o item selecionado fica marcado. Clique simples na linha abre a operação; duplo clique na lista normal não faz nada.
- Botão **lápis ✏️** (só o ícone, com a dica "Editar operações") no cabeçalho da lista, centralizado entre "Operações" e "DAP". Renomear e excluir operações ficam no modo Editar (não no card da operação).
- **Lista minimizada** (≪ / ≫): coluna estreita com ≫, o rótulo "DAP" e só os DAPs das operações, na mesma ordem; a operação selecionada fica marcada e o nome aparece ao passar o mouse. Clicar no DAP abre a operação. No fim da coluna, um "+" cria uma nova operação (o nome abre em edição no card da operação). Minimizada, o lápis não aparece.

**Modo Editar** (só com o plano "Em construção")
- Cada linha ganha uma caixa de seleção à esquerda; no topo da lista, a caixa **"Todos"** (marca/desmarca todas). "+ Nova operação" fica oculto.
- No rodapé da lista, a barra **Cancelar · Excluir (n) · Salvar**.
- A caixa de seleção só é marcada clicando nela mesma; o nome fica reservado para o duplo clique.
- **Renomear: duplo clique no nome** (ou Enter no teclado) transforma o nome em campo de texto, com o nome completo (sem truncar). Enter confirma o campo; Esc desfaz a edição daquele campo. Ao passar o mouse no nome: "Clique duas vezes para renomear".
- O DAP não é editável neste modo (só no cabeçalho da operação). A lista continua ordenada pelo DAP.
- **Salvar**: só fica ativo com algum nome alterado; salva os nomes e sai do modo Editar.
- **Cancelar**: descarta os nomes não salvos e sai do modo Editar.
- **Excluir (n)**: mostra quantas operações estão marcadas; desabilitado com n = 0. Ver "Sugestões em teste" (exclusão).

**Plano aprovado**
- Nenhuma operação pode ser editada. O lápis fica com aparência desabilitada, mas recebe mouse e foco do teclado para mostrar a dica: "Plano aprovado: operações não podem ser editadas".
- A lista não mostra contador de pendências.

## 7. Detalhe da operação

- Card da operação, em duas linhas:
  - **Linha 1:** nome da operação, **DAP** (campo) e **Fenologia** (lista de seleção, opcional). Sem lápis e lixeira: renomear e excluir ficam no modo Editar da lista (seção 6).
  - **Linha 2:** resumo área (ha) · talhões · sem operação · sem dose, alinhado à esquerda, com a lista de operações expandida ou minimizada. "Sem operação" e "sem dose" só aparecem quando maiores que zero.
- As opções de fenologia vêm do menu Cadastros (a trabalhar depois). No protótipo, estádios da soja como exemplo.
- **Uma operação tem um DAP só**, que vale para todos os talhões dela. Outro DAP = outra operação.
- Antes de existir data de plantio (informada no grupo Semente), as operações mostram só o DAP (ex.: −30), sem data.

## 8. Recomendação agronômica

**Regra**
- **Recomendação agronômica = conjunto de produtos + doses padrão.**
- **A composição de produtos determina a identidade da recomendação.**
- **A dose pode variar por talhão sem alterar a identidade da recomendação.**
- Uma operação pode ter mais de uma recomendação. Na mesma operação, **cada talhão fica em uma recomendação só**.

**Lista de recomendações** (topo da seção)
- `Recomendação 1 | Recomendação 2 | + Nova recomendação`, numeradas automaticamente. Só uma fica aberta, com destaque discreto; as demais mostram só o nome. Sem status ("Em edição", "Salva", "Aplicada").
- **"+ Nova recomendação"** cria a próxima, já aberta, com uma linha vazia para o primeiro produto.
- **Numeração**: maior número já usado + 1 (ex.: com Recomendação 1 e Recomendação 3, a próxima é Recomendação 4). Renomear ou excluir não renumera as outras.
- **Recomendação vazia não fica no sistema** (sem produto comercial, sem princípio ativo e sem dose):
  - Recomendação nova que ficou vazia é excluída ao trocar de recomendação, operação, grupo ou etapa, mesmo sendo a única (a operação volta a "Nenhuma recomendação nesta operação"). Sem aviso.
  - "Salvar recomendação" com todas as linhas apagadas exclui a recomendação: sem talhões, na hora, com "Desfazer"; aplicada em talhões, com a mesma confirmação da lixeira ("Excluir Recomendação 1? Ela está aplicada em 11 talhões, que ficarão sem operação. Essa ação não pode ser desfeita.").
- **Renomear**: duplo clique na recomendação aberta (ou F2), como nas guias de grupo. Enter confirma, Esc desfaz. Dica no mouse: "Clique duas vezes para renomear". Nome vazio volta ao anterior; nome repetido na operação não é aceito ("Já existe uma recomendação com esse nome").
- **Excluir**: lixeira na ponta direita da lista, agindo sobre a recomendação aberta.
  - Com talhões: confirmação com o impacto. Ex.: "Excluir Recomendação 2? Ela está aplicada em 3 talhões, que ficarão sem operação. Essa ação não pode ser desfeita." Botões: Cancelar · Excluir recomendação.
  - Sem talhões: exclui na hora, com "Desfazer".
  - Depois de excluir, abre a primeira recomendação restante; sem nenhuma, aparece só "+ Nova recomendação".
- Operação sem recomendação: "Nenhuma recomendação nesta operação. Use "+ Nova recomendação" para criar."

**Tabela da recomendação**
- Colunas: **Princípio ativo · Produto comercial · Unidade · Dose padrão**, com lixeira por linha.
- **A dose é do produto comercial.** O princípio ativo não tem dose: serve como filtro para encontrar o produto. Escolhido o princípio ativo, o produto mostra só os produtos com ele; escolhido o produto, o princípio ativo dele é preenchido.
- Linha só com princípio ativo: unidade vazia e dose bloqueada ("Escolha o produto comercial para informar a dose").
- A unidade vem do cadastro do produto. A dose é sempre por hectare (L/ha, mL/ha, kg/ha, g/ha, t/ha).
- Exemplo: Bixafen + Protioconazol + Trifloxistrobina · Fox Xpro · L/ha · 0,40.

**Salvar recomendação** (fluxo: montar recomendação → salvar recomendação → aplicar nos talhões)
- As mudanças na recomendação ficam em rascunho até **"Salvar recomendação"**. Trocar de recomendação, operação ou grupo com alteração não salva pergunta: "Descartar as alterações de Recomendação 1?" (Continuar editando · Descartar).
- Trocar de **etapa** (ex.: Calendário Agrícola) e voltar não descarta nada: a recomendação com produto digitado e ainda não salvo continua em rascunho (inclusive recomendação nova).
- **Botões na linha abaixo da tabela**: à esquerda **[Aplicar nos talhões]**; à direita **[Salvar recomendação] [+ Adicionar produto]**.
  - Com alteração não salva: "Salvar recomendação" fica em destaque e **"Aplicar nos talhões" não aparece**.
  - Recomendação salva: "Salvar recomendação" fica visível e desabilitado (os botões não mudam de lugar) e "Aplicar nos talhões" aparece, em destaque.
- Recomendação **ainda não aplicada**: salvar não muda nada na tabela de talhões (a recomendação não está ligada a nenhum talhão).
- Recomendação **já aplicada**: ao salvar, a tela pergunta antes: "Alterar os talhões que já recebem Recomendação 1? Recomendação 1 já está aplicada em 10 talhões. Ao salvar, as alterações valem para eles. Talhões com dose própria mantêm a dose deles." Botões: Cancelar (nada é salvo; a alteração continua em edição) · **Salvar e alterar talhões**. Mensagem: "Recomendação 1 salva e alterada em 10 talhões". Ao confirmar:
  - **Dose padrão alterada**: muda nos talhões que seguem o padrão; talhão com dose própria mantém a dele.
  - **Produto adicionado, removido ou trocado**: muda em todos os talhões da recomendação (é a composição alterada para todos, que atualiza a própria recomendação).
- Salvar aceita linha só com princípio ativo (rascunho de trabalho, enquanto o produto é escolhido).

**Preenchimento mínimo para aplicar**: **DAP**, ao menos uma linha na recomendação e, em cada linha, **produto comercial** e **dose padrão**. Se faltar algo ao clicar, aparece em vermelho abaixo do campo: "Escolha o produto comercial" ou "Informação obrigatória".

## 9. Pré-cadastro (nesta tela)

Regras gerais da base (Plano_Safra_Cultura_Variedade_revisado_Julyane.docx): só quando o item não é encontrado; fica disponível para uso e reuso com status "Pré-cadastro"; o responsável pelo cadastro é avisado; ao completar, vira "Cadastro completo" mantendo o vínculo com os planos; o sistema aponta possíveis duplicidades e a consolidação depende do responsável.

- **Onde**: só na busca de **produto comercial** da recomendação e na busca do modal "Ajustar recomendação" (seção 11). **"+ Pré-cadastrar "texto digitado""** aparece sempre como última opção da lista de resultados, mesmo quando há resultados parecidos.
- **Como**: a própria linha da recomendação vira um mini-formulário, com o texto digitado já preenchido. Botões: Cancelar e "Salvar pré-cadastro".
- **Mínimo para defensivo**: **nome comercial e unidade**. O princípio ativo é opcional.
- Os resultados parecidos aparecem acima da opção de pré-cadastro, para evitar duplicidade na origem.
- Depois de salvo, o produto aparece com a etiqueta **"Pré-cadastro"** na recomendação e na coluna da tabela de talhões.

## 10. Aplicar nos talhões

1. **"Aplicar nos talhões"** (abaixo da recomendação salva) coloca a tabela de talhões em modo seleção, sem janela. Título: "Selecione os talhões que recebem: Recomendação 1".
2. Aparecem todos os talhões da fazenda com caixa de seleção e "Marcar todos". Os que já estão nesta recomendação vêm marcados. Talhão que está em outra recomendação mostra a indicação (ex.: "· em Recomendação 1"); marcá-lo muda o talhão para esta recomendação.
3. **"Aplicar em N talhões"** confirma. Os talhões recebem os produtos e as **doses padrão** da recomendação, sem perguntar a dose. Desmarcar um talhão que estava nesta recomendação remove a operação dele, e o botão avisa (ex.: "Aplicar em 10 talhões · remover de 1").
4. Se algum talhão marcado (já nesta recomendação) tem dose própria, a tela pergunta: "3 talhões têm ajustes." **Manter ajustes** · **Substituir pela dose padrão**.
5. Mensagem: "Recomendação 1 aplicada em 11 talhões". "Cancelar" sai sem mudar nada.

## 11. Tabela "Talhões da recomendação agronômica"

**Modo visualizar (padrão)**
- Mostra **todos os talhões da fazenda**, os que recebem e os que não recebem a operação.
- Colunas: Talhão · Área · uma coluna de dose por produto, com a unidade no cabeçalho (ex.: "Fox Xpro (L/ha)"), juntando os produtos das recomendações **já aplicadas**. Os produtos de uma recomendação só entram na tabela depois de "Aplicar nos talhões"; montar ou salvar a recomendação não muda a tabela. Produto que não está na recomendação do talhão aparece como "—" apagado. Sem colunas DAP, Status e Recomendação.
- O status aparece na **cor da linha** (ver seção 12), com uma legenda acima da tabela: "Sem operação ou sem dose" (laranja) · "Operação ainda não aplicada em nenhum talhão" (cinza). **Cada item da legenda só aparece quando ao menos 1 talhão está nessa situação**; sem nenhum, a legenda não aparece.
- Valores ajustados aparecem iguais aos demais (sem marca de ajuste).
- **Lápis ✏️** (só o ícone, com a dica "Editar talhões"; mesmo padrão do lápis da lista de operações) e busca no cabeçalho da tabela.

**Modo edição (pelo lápis)**
- Título da tabela: "Editar talhões". **Todos os talhões** têm caixa de seleção, inclusive os que ainda não recebem a operação; "Todos" no cabeçalho. Linhas selecionadas com fundo verde claro.
- Talhão que não recebe a operação mostra "—" claro nas colunas de produto. A unidade fica só no cabeçalho da coluna.
- Sem a legenda de cores (no modo normal ela continua).
- A recomendação acima fica só para consulta: sem "Salvar recomendação", "Aplicar nos talhões", "+ Adicionar produto", "+ Nova recomendação", lixeira e renomear.

**Barra de seleção** (fixa embaixo da tabela, sempre visível ao rolar)
- Sem seleção: "Marque os talhões que quer ajustar." e **Cancelar** (sai do modo edição).
- Com seleção: "3 talhões · 305 ha" (quantidade e soma da área) · **"Excluir recomendação"** (texto vermelho, estilo secundário; vale só para os talhões marcados) · **"Ajustar recomendação"** (botão principal verde) · **X** (dica "Cancelar edição": faz o papel do Cancelar e sai do modo edição).
- "Excluir recomendação" pede confirmação: "Excluir a recomendação de 3 talhões? Os produtos e doses desses talhões serão apagados e eles ficarão sem operação." Botões: Cancelar · Excluir recomendação. Mensagem: "Recomendação excluída de 3 talhões". A recomendação continua para os outros talhões. Desabilitado quando nenhum dos selecionados recebe a operação.

**Modal "Ajustar recomendação"** (abre pelo botão "Ajustar recomendação"; a tabela ocupa a largura toda, sem painel lateral)
- Cabeçalho: "Ajustar recomendação de 3 talhões" · lista dos talhões ("T01, T02, T03"; com mais de 6, os 6 primeiros e "e mais N", com a lista completa ao passar o mouse) · "Campo não alterado mantém o valor de cada talhão" (cinza) · X para fechar.
- Corpo no padrão da recomendação: **Princípio ativo · Produto comercial · Unid. · Dose · lixeira**, uma linha por produto presente nos talhões selecionados (princípio ativo e produto só como texto).
  - Mesma dose em todos os selecionados: o campo mostra o valor (ex.: 0,40). Doses diferentes: campo vazio com "Vários".
  - Lixeira: marca o produto para sair só dos talhões selecionados (vale ao aplicar; "Desfazer" volta atrás).
- **"+ Adicionar produto"**: nova linha com **um campo de busca** ocupando Princípio ativo e Produto comercial, que procura pelos dois. Resultados no formato "**Select 240 EC** · Cletodim · L/ha"; o último item é **"+ Pré-cadastrar produto"**. Ao escolher, preenche princípio ativo, produto e unidade, e o foco vai para Dose.
- **Pré-cadastro** na própria linha (sem outro modal): Produto comercial, Princípio ativo e Unidade, com o texto da busca já no Produto comercial. Mesma regra da seção 9: produto comercial e unidade obrigatórios, princípio ativo opcional. Botões: Cancelar · Salvar pré-cadastro. Ao salvar, o produto entra na linha com o selo "Pré-cadastro" e o foco vai para Dose.
- Rodapé: **Cancelar** · **Aplicar em 3 talhões** (botão principal). Sem excluir recomendação no modal.
  - **Aplicar**: grava só nos talhões selecionados, fecha o modal, atualiza a tabela (produto novo ganha coluna; talhões sem ele mostram "—"), limpa a seleção (a tabela continua no modo edição) e mostra "Ajustes aplicados em 3 talhões".
  - **Cancelar, X ou Esc**: descarta o que foi feito no modal e mantém a seleção.
- Foco preso no modal enquanto aberto; ao fechar, volta ao botão "Ajustar recomendação".
- Talhão que não recebia a operação e recebe produto passa a receber a operação. DAP e fenologia não são ajustados por talhão.
- **Recomendações no ajuste** (a composição de produtos é a identidade da recomendação):
  - **Só dose** alterada: fica como dose própria do talhão; **não** cria recomendação. Ex.: Fox Xpro de 0,40 para 0,45 L/ha em 3 talhões da Recomendação 1 → continuam na Recomendação 1, com a diferença de dose registrada.
  - **Composição alterada** (adicionar, remover ou trocar produto) **em parte** dos talhões da recomendação: esses talhões saem da recomendação e nasce a próxima recomendação para eles. Ex.: Recomendação 1 (Fox Xpro + Engeo Pleno) em 10 talhões; em 3 deles adiciona Assist → Recomendação 1 fica com 7; a Recomendação 2 (Fox Xpro + Engeo Pleno + Assist) nasce com os 3.
  - **Composição alterada em todos** os talhões da recomendação: atualiza a própria recomendação.
  - **Composição que já existe** em outra recomendação: os talhões entram nela, sem criar recomendação nova (ex.: em mais 2 talhões da Recomendação 1 adiciona Assist → entram na Recomendação 2; tirar o Assist dos talhões da Recomendação 2 → voltam para a Recomendação 1). Dose diferente da padrão dessa recomendação fica como dose própria do talhão.
  - Talhão sem a operação que recebe produtos entra na recomendação com a mesma composição ou numa recomendação nova.
  - Mensagem: "Ajustes aplicados em 3 talhões · criada a Recomendação 2".

## 12. Status

| Status | Quando | Linha da tabela |
|---|---|---|
| Completo | O talhão recebe a operação e cada produto da recomendação tem dose | Branca |
| Sem dose | O talhão recebe a operação, mas falta produto comercial ou dose | Laranja claro; a dose que falta aparece como "—" em destaque |
| Sem operação | O talhão da fazenda não recebe esta operação | Laranja claro; **cinza enquanto a operação não foi aplicada em nenhum talhão** |

- Todos os talhões cadastrados da fazenda contam. Operação ainda sem talhões: todos "sem operação" (ex.: 12 talhões → "12 sem operação"), com as linhas em cinza.
- Card da operação: "N sem operação" e "N sem dose", separados, porque pedem ações diferentes (Aplicar nos talhões × lápis da tabela de talhões). Contador zerado não aparece.

- No grupo: o talhão fica "sem operação" no grupo quando está "Sem operação" em todas as operações do grupo.

## 13. Vocabulário da tela

Um verbo por ação, do botão à mensagem:

| Verbo | Ação |
|---|---|
| Selecionar | escolher os talhões |
| Salvar recomendação | guardar os produtos e as doses padrão da recomendação |
| Aplicar | colocar a recomendação nos talhões |
| Editar talhões / Ajustar recomendação / Aplicar em N talhões | mudanças pontuais por talhão (modal "Ajustar recomendação") |
| Remover | tirar produto ou talhão da operação |

## 14. Demonstração (só no protótipo)

- Ícone de demonstração no menu lateral, acima do usuário, com duas opções: **"Começar do zero"** (limpa os dados e mostra o primeiro uso) e **"Ver com planos de exemplo"** (carrega planos fictícios e abre a Visão Geral).
- Clicar no status do plano, no fim do subtítulo do cabeçalho, alterna entre "Em construção" e "Aprovado", para testar os dois estados.

## 15. Princípios da tela

- Caminho livre: atende perfis diferentes de criação e edição, sem ordem rígida.
- O sistema mostra o que falta (status), não bloqueia.
- Segue o jeito do Excel (guias por grupo, todos os talhões e o que cada um recebe) para facilitar a migração.

## 16. Sugestões em teste (não validadas)

- Títulos de seção em caixa normal ("Recomendação agronômica") em vez de caixa alta, para a tela ficar mais leve.
- Área somada dos talhões selecionados nos modos seleção e ajuste.
- Nova operação: item novo na lista com nome em edição e DAP destacado.
- Observar nos testes se o duplo clique para renomear grupo é descoberto; se não, voltar com o lápis.
- Legenda de cores da tabela de talhões só no modo normal (sai no modo edição). Se nos testes as cores forem entendidas sem legenda, tirar também no modo normal.
- **Exclusão de operações no modo Editar (hipótese para validar com clientes):**
  - Com talhões nas marcadas: confirmação com o impacto. Ex.: "Excluir 2 operações? Elas estão aplicadas em 12 talhões, com 5 produtos. Essa ação não pode ser desfeita." Botões: Cancelar · Excluir operações.
  - Sem talhões nas marcadas: exclui na hora, com "Desfazer".
  - Todas as operações do grupo marcadas: avisa que o grupo ficará sem operações.
  - Ao confirmar, exclui as operações com seus talhões e produtos. Se a operação aberta foi excluída, abre a primeira restante da lista (ou o estado vazio do grupo).

## 17. Em aberto

1. Dose recomendada (do fornecedor) em produto de pré-cadastro: mostrar vazio ou "—".
2. Visões alternativas da tabela (Por talhão em matriz de cobertura, Por produto).
3. Operação nova começa com todos os talhões ou vazia.
4. Grupos Semente, Corretivos, Fertilizante e Colheita seguem o mesmo esqueleto? (Semente recebe a data de plantio, por talhão.)
5. Onde fica a escolha entre DAP e DAE.
6. Preparo do solo e operações só de máquina (sem tipo).
7. Talhão de outra cultura com a Cultura fixa no topo.
8. Momento em que o plano entra na lista de planos.
