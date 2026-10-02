# Tela Operações (grupo Defensivo)

Atualizado em 02/10/2026. Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Tudo é **Definido**, exceto as seções "Sugestões em teste" e "Em aberto".
Referência no protótipo: `tela/04-operacoes-defensivos`. Referência visual: mockup de 02/10/2026 (grupos no rodapé).
**A imagem é só referência visual. Quando imagem e documento divergirem (nomes, ordem de colunas, botões, comportamento), vale este documento.**

---

## 1. Objetivo

O agrônomo corporativo monta as operações do plano, grupo por grupo: cria as operações com DAP, define a recomendação agronômica (princípio ativo, produto e dose), seleciona em quais talhões aplicar e, se precisar, ajusta talhão a talhão.

## 2. Lugar na jornada

- **Visão Geral** é a tela inicial do Plano de Safra, fora do plano: cards, filtros, lista de planos e "Criar plano".
- Dentro de um plano, as etapas são: **Operações · Calendário Agrícola · Suprimentos · Aprovação**.
- Calendário Agrícola é o único lugar que junta todos os grupos, ordenados por DAP; lá se informa a previsão de cumprimento de cada operação.
- Produtividade e preço esperados ficam em Suprimentos.
- O conteúdo da etapa Aprovação (incluindo a revisão) será definido quando chegarmos nela.

## 3. Layout geral

```
Plano de Safra  ›  Safra 26/27 · Empresa A · Fazenda Santa Maria · Cultura Soja
──────────────
Operações   Calendário Agrícola   Suprimentos   Aprovação
─────────
┌───────────────────────┬──────────────────────────────────────────────────────────┐
│ Operações          ≪  │ 1ª Fungicida   DAP [30]  Fenologia [V5 ▾]                 │
│ ▌1ª Fungicida   ✏️ 🗑  │                    1.085 ha · 11 talhões · 1 pendente     │
│  2ª Fungicida     45  │ Recomendação agronômica                                   │
│  3ª Fungicida     60  │   Princípio ativo · Produto comercial · Unid. · Dose  🗑   │
│  4ª Fungicida     75  │   + Adicionar produto              [Selecionar talhões]   │
│ + Nova operação       │ Talhões da recomendação agronômica            ✏️  🔍      │
│                       │   Talhão · Área · DAP · dose por produto · Status         │
└───────────────────────┴──────────────────────────────────────────────────────────┘
Grupo de operações │ Corretivos │ Semente │ Fertilizante │ Defensivo │ Colheita │ + │      🗑
```

Princípio: o peso visual de cada navegação é inverso à frequência de uso. Etapas em abas no topo, grupos em guias no rodapé (como o Excel), operações na lista lateral, colada ao conteúdo.

## 4. Cabeçalho

- **"Plano de Safra" é um link** que volta para a Visão Geral. O menu lateral também volta.
- Contexto fixo ao lado: Safra · Empresa · Fazenda · Cultura.
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
- **No item selecionado, lápis (renomear) e lixeira (excluir) aparecem ao lado do DAP.** O DAP continua visível em todos os itens.
- **Lista minimizada** (≪ / ≫): coluna estreita com ≫, o rótulo "DAP" e só os DAPs das operações, na mesma ordem; a operação selecionada fica marcada e o nome aparece ao passar o mouse. Clicar no DAP abre a operação.
- O painel de detalhe (direita) não tem lápis nem lixeira.
- Excluir operação com talhões: confirmação mostrando o impacto (ex.: "Excluir 1ª Fungicida? 11 talhões e 2 produtos serão removidos do plano"). Operação vazia: exclui na hora, com "Desfazer".
- A lista não mostra contador de pendências.

## 7. Detalhe da operação

- Nome da operação, **DAP** (campo) e **Fenologia** (lista de seleção, opcional).
- As opções de fenologia vêm do menu Cadastros (a trabalhar depois). No protótipo, estádios da soja como exemplo.
- O DAP da operação vale para todos os talhões, mas pode ser ajustado por talhão.
- Resumo à direita: área (ha) · talhões · pendentes.
- Antes de existir data de plantio (informada no grupo Semente), as operações mostram só o DAP (ex.: −30), sem data.

## 8. Recomendação agronômica

- Colunas: **Princípio ativo · Produto comercial · Unidade · Dose**, com lixeira por linha e "+ Adicionar produto".
- **Os dois campos se filtram nos dois sentidos**: escolhido o princípio ativo, o produto mostra só os produtos com ele; escolhido o produto, o princípio ativo dele é preenchido. O agrônomo começa pelo campo que preferir.
- **Dose**:

| A linha tem | A dose é do | Exemplo |
|---|---|---|
| Produto comercial (com ou sem princípio ativo) | Produto comercial | Fox Xpro · 0,40 L/ha |
| Só princípio ativo | Ingrediente ativo | Azoxistrobina · 60 g i.a./ha |

- A dose é sempre por hectare. Unidades: **L, mL, kg, g, t** (exibidas como L/ha, mL/ha…). Sem produto, a unidade aparece em i.a. (g i.a./ha…).
- Botão **"Selecionar talhões"** ao lado da recomendação.

## 9. Pré-cadastro (nesta tela)

Regras gerais da base (Plano_Safra_Cultura_Variedade_revisado_Julyane.docx): só quando o item não é encontrado; fica disponível para uso e reuso com status "Pré-cadastro"; o responsável pelo cadastro é avisado; ao completar, vira "Cadastro completo" mantendo o vínculo com os planos; o sistema aponta possíveis duplicidades e a consolidação depende do responsável.

- **Onde**: na busca de princípio ativo ou de produto comercial. **"+ Pré-cadastrar "texto digitado""** aparece sempre como última opção da lista de resultados, mesmo quando há resultados parecidos.
- **Como**: a própria linha da recomendação vira um mini-formulário, com o texto digitado já preenchido. Botões: Cancelar e "Salvar pré-cadastro".
- **Mínimo para defensivo**: nome comercial **ou** princípio ativo (ao menos um) **e unidade**.
- Os resultados parecidos aparecem acima da opção de pré-cadastro, para evitar duplicidade na origem.
- Depois de salvo, o produto aparece com a etiqueta **"Pré-cadastro"** na recomendação e na coluna da tabela de talhões.

## 10. Selecionar talhões e aplicar

1. **"Selecionar talhões"** coloca a tabela em modo seleção, sem janela. Título: "Selecione os talhões que recebem a 1ª Fungicida".
2. Aparecem todos os talhões da fazenda com caixa de seleção e "Marcar todos". Os que já recebem a operação vêm marcados. A recomendação continua visível acima.
3. **"Aplicar em N talhões"** confirma. Desmarcar um talhão que já recebia remove a operação dele, e o botão avisa (ex.: "Aplicar em 10 talhões · remover de 1").
4. Se algum talhão marcado tem ajuste, a tela pergunta: "3 talhões têm ajustes." **Manter ajustes** · **Substituir pela recomendação**.
5. Mensagem: "Recomendação aplicada em 11 talhões". "Cancelar" sai sem mudar nada.

## 11. Tabela "Talhões da recomendação agronômica"

**Modo visualizar (padrão)**
- Mostra **todos os talhões da fazenda**, os que recebem e os que não recebem a operação.
- Colunas: Talhão · Área · DAP · uma coluna de dose por produto, com a unidade no cabeçalho (ex.: "Fox Xpro (L/ha)") · Status (última coluna).
- Valores ajustados aparecem iguais aos demais (sem marca de ajuste).
- Lápis ("Ajustar talhões") e busca no cabeçalho da tabela.

**Modo ajustar (opcional, pelo lápis)**
- Caixas de seleção ("Marcar todos" ou um a um).
- Com talhões selecionados, aparece a caixa de ajuste, que vale para **todos os selecionados de uma vez**: DAP, dose de cada produto, adicionar produto, remover produto, remover da operação.
- Campo com valores diferentes entre os selecionados mostra **"vários"**; campo não alterado mantém o valor de cada talhão.
- **"Salvar ajustes"** salva e volta ao modo visualizar. Mensagem: "Ajustes salvos em 2 talhões".

## 12. Status

| Status | Quando |
|---|---|
| Completo | O talhão recebe a operação e tem DAP, produto e dose |
| Pendente | O talhão recebe a operação, mas falta DAP, produto ou dose |
| Sem operação | O talhão não recebe esta operação (decisão do agrônomo). Em cinza; não conta como pendência |

No grupo: o talhão fica pendente quando está "Sem operação" em todas as operações do grupo.

## 13. Vocabulário da tela

Um verbo por ação, do botão à mensagem:

| Verbo | Ação |
|---|---|
| Selecionar | escolher os talhões |
| Aplicar | colocar a recomendação nos talhões |
| Ajustar / Salvar ajustes | mudanças pontuais por talhão |
| Remover | tirar produto ou talhão da operação |

## 14. Demonstração (só no protótipo)

- Ícone de demonstração no menu lateral, acima do usuário, com duas opções: **"Começar do zero"** (limpa os dados e mostra o primeiro uso) e **"Ver com planos de exemplo"** (carrega planos fictícios e abre a Visão Geral).

## 15. Princípios da tela

- Caminho livre: atende perfis diferentes de criação e edição, sem ordem rígida.
- O sistema mostra o que falta (status), não bloqueia.
- Segue o jeito do Excel (guias por grupo, todos os talhões e o que cada um recebe) para facilitar a migração.

## 16. Sugestões em teste (não validadas)

- Títulos de seção em caixa normal ("Recomendação agronômica") em vez de caixa alta, para a tela ficar mais leve.
- Área somada dos talhões selecionados nos modos seleção e ajuste.
- Nova operação: item novo na lista com nome em edição e DAP destacado.
- Ao trocar uma linha de "só princípio ativo" para produto escolhido, limpar a dose em i.a. e pedir a dose do produto (ou converter pela concentração, quando houver no cadastro).
- Observar nos testes se o duplo clique para renomear grupo é descoberto; se não, voltar com o lápis.

## 17. Em aberto

1. Dose recomendada (do fornecedor) em produto de pré-cadastro: mostrar vazio ou "—".
2. Conversão da dose em i.a. para quantidade de produto: quem escolhe o produto comercial e quando (Suprimentos ou programação da OS).
3. Visões alternativas da tabela (Por talhão em matriz de cobertura, Por produto).
4. Operação nova começa com todos os talhões ou vazia.
5. Grupos Semente, Corretivos, Fertilizante e Colheita seguem o mesmo esqueleto? (Semente recebe a data de plantio, por talhão.)
6. Onde fica a escolha entre DAP e DAE.
7. Preparo do solo e operações só de máquina (sem tipo).
8. Talhão de outra cultura com a Cultura fixa no topo.
9. Momento em que o plano entra na lista de planos.
