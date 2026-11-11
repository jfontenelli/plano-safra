# Plano de Safra › Resumo › Ciclo Produtivo — guardado para retomar

Em 11/11/2026 a usuária pediu para **deixar o Ciclo Produtivo em rascunho**: a guia saiu do Resumo do plano, que ficou com **Tabela · Produtos**.

## Onde está o Ciclo Produtivo completo, como estava

- **Marca no git: `ciclo-produtivo-11-11-2026`** (commit 7e140f7, o último com a guia, ainda com as colunas por estádio fenológico e as imagens das fases).
  Para ver o arquivo como estava: `git show ciclo-produtivo-11-11-2026:js/telas/05-calendario.js`.
  Para abrir o protótipo inteiro como estava (sem mexer na branch atual): `git worktree add ../plano-safra-ciclo ciclo-produtivo-11-11-2026` e abrir o `index.html` dessa pasta (um plano › Resumo › Ciclo Produtivo).
- **Detalhe da tela:** `docs/telas/05-calendario-agricola.md` (seção do Ciclo Produtivo, antes Infográfico).

## Como estava

- Uma **coluna por fase** da cultura, rolando para o lado: **Pré-plantio** (DAP negativo), **Plantio** (DAP 0), as fases depois do plantio e **Colheita** (pelo ciclo da variedade). Cada coluna com o título na cor da fase, a faixa de DAP e uma imagem; dentro, as operações (etiqueta do grupo, nome, produtos com dose e área) e, no pé, "10 talhões · 2 operações". Os filtros Grupo de operação, Operação e Talhão (os mesmos da Tabela) valem também aqui.
- Até 11/11/2026, as fases depois do plantio eram **pelo estádio fenológico** da operação (V4, R1…), com a imagem do estádio (`img/fenologia/*.svg`). Com a fenologia fora do produto (11/11/2026), passaram a ser **pelo DAP** ("8 DAP", "18 DAP"…), com a imagem neutra do calendário; foi assim que a guia saiu.

## O que mudou no protótipo

| Onde | O que mudou | Como recolocar |
|---|---|---|
| `js/telas/05-calendario.js` · guias do Resumo | saiu `['infografico', Icones.grafico, 'Ciclo Produtivo']` da lista Tabela · Ciclo Produtivo · Produtos | voltar o item entre Tabela e Produtos |
| `js/telas/05-calendario.js` · visão aberta | `estado.visao` só aceita `'produtos'` (senão, Tabela) | voltar `['infografico', 'produtos']` |

**O código continua no protótipo, adormecido:** a função `infografico(ctx, lista)` e as fases (`faseDe`, `visualDe`, `colunas`, `tituloColuna`, `IMAGENS`) em `js/telas/05-calendario.js`, os estilos do infográfico em `css/estilo.css` e as imagens em `img/fenologia/`. Recolocando a guia, ela volta a funcionar (pelo DAP, sem a fenologia).
