# Tela 03 — Lista de planos

Imagem: `referencias/03-lista-planos.png`
Na imagem o menu aparece recolhido só para ilustrar esse estado; a regra do menu está no CLAUDE.md.

## Objetivo
Ver os planos existentes, filtrar e abrir ou criar um plano.

## Quando aparece
- Ao clicar em "Plano de Safra" no menu, quando existe ao menos um plano.

## Conteúdo
- Título "Plano de Safra".
- **Filtrar planos:** Safra, Empresa, Fazenda, Cultura.
- **Planos de Safra:** botão "Criar Plano Safra" à direita do título da lista; lista com o botão **⋯** (menu do plano) no começo da linha, as colunas Safra, Empresa, Fazenda, Cultura, Área, Custo estimado, Receita projetada, Status, Última atualização, Atualizado por e uma seta no fim (abrir).

## Regras
- Filtro de Safra começa na safra mais recente cadastrada (não em "Todas"). Os demais começam em "Todas".
- Os filtros atualizam a lista.
- Custo e receita vazios aparecem como "—".
- Status do plano: "Em construção" (cinza) ou "Aprovado" (verde).
- **Menu do plano**: pelo **⋯** no começo da linha ou pelo **botão direito** na linha. Itens, nesta ordem: **Excluir · Exportar (.xlsx) · Abrir**.
  - **Excluir** (em vermelho): só para plano **Em construção**. No Aprovado aparece desabilitado, com "Plano aprovado não pode ser excluído" (o aprovado gerou OS e é a linha de base). Confirmação: título "Excluir plano?", "Soja · Safra 26/27 · Fazenda São José" e "As operações, recomendações e talhões planejados desse plano serão apagados. Essa ação não pode ser desfeita." · Cancelar · **Excluir plano** (vermelho). Depois, aviso "Plano excluído"; sem nenhum plano, volta à Tela 01.
  - **Exportar (.xlsx)**: baixa o plano em planilha (o mesmo arquivo do botão Exportar dentro do plano; ver docs/DECISOES.md, seção 1).
  - **Abrir**: o mesmo que a seta.
  - "Copiar para outra fazenda" fica para quando o cliente pedir.

## Navegação
- "Criar Plano Safra" → abre a Tela 02 (modal) por cima desta tela.
- Seta da linha ou "Abrir" no menu → abre o plano na etapa Operações (Tela 04.0).

## Para testar
- Ter um jeito simples de alternar entre "sem planos" (mostra Tela 01) e "com planos de exemplo" (mostra esta tela).
- Planos de exemplo coerentes entre si (safras, áreas e valores).
