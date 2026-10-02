# Tela 03 — Lista de planos

Imagem: `referencias/03-lista-planos.png`
Na imagem o menu aparece recolhido só para ilustrar esse estado; a regra do menu está no CLAUDE.md.

## Objetivo
Ver os planos existentes, filtrar, acompanhar os números gerais e abrir ou criar um plano.

## Quando aparece
- Ao clicar em "Plano de Safra" no menu, quando existe ao menos um plano.

## Conteúdo
- Título "Plano de Safra" e botão "Criar Plano Safra" no canto superior direito.
- **Filtrar planos:** Safra, Empresa, Fazenda, Cultura.
- **Visão geral:** três indicadores.
- **Planos de Safra:** lista com as colunas Safra, Empresa, Fazenda, Cultura, Área, Custo estimado, Receita projetada, Status, Última atualização, Atualizado por e uma seta.

## Regras
- Filtro de Safra começa na safra mais recente cadastrada (não em "Todas"). Os demais começam em "Todas".
- Os filtros atualizam indicadores e lista.
- Indicadores, calculados sobre os planos filtrados:
  - Área planejada: soma das áreas; abaixo, "N planos cadastrados".
  - Custo estimado: soma dos planos que têm custo; "—" com a dica "Aguardando orçamento" quando nenhum tem.
  - Receita projetada: soma dos planos que têm receita; "—" com a dica "Aguardando premissas de produção" quando nenhum tem.
- Na lista, custo e receita vazios aparecem como "—".
- Status do plano: "Em construção" (cinza) ou "Aprovado" (verde).

## Navegação
- "Criar Plano Safra" → abre a Tela 02 (modal) por cima desta tela.
- Seta da linha → abre o plano (por enquanto, página provisória com Safra, Empresa e Fazenda no topo e botão para voltar à lista).

## Para testar
- Ter um jeito simples de alternar entre "sem planos" (mostra Tela 01) e "com planos de exemplo" (mostra esta tela).
- Planos de exemplo coerentes entre si (safras, áreas e valores que batem com os indicadores).
