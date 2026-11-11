# Pré-cadastro (variedade, princípio ativo e produto) — guardado para retomar

Em 11/11/2026 a usuária pediu para **tirar o pré-cadastro desta entrega** e guardá-lo no rascunho.

## Onde está o pré-cadastro completo, como estava

- **Marca no git: `pre-cadastro-11-11-2026`** (commit c3b7396, o último com o pré-cadastro ligado).
  Para ver um arquivo como estava: `git show pre-cadastro-11-11-2026:js/telas/04-operacoes.js`.
  Para abrir o protótipo inteiro como estava (sem mexer na branch atual): `git worktree add ../plano-safra-pre-cadastro pre-cadastro-11-11-2026` e abrir o `index.html` dessa pasta.
- **Regras e detalhe** (continuam em `docs/`): DECISOES ("Pré-cadastro mínimo só quando o item não existe"; ciclo da variedade), Tela 04.1 seção 9 (Pré-cadastro de defensivo, na própria linha da recomendação) e Tela 04.2 (busca de variedade com "+ Pré-cadastrar").

## Como estava

- **Plantio** (variedade, no modal Definir plantio, no painel do talhão e na tabela): a busca mostra a opção **+ Pré-cadastrar "TMG 9999"** quando o texto não bate com nenhuma variedade da cultura. Grava a variedade com a cultura do plano, sem ciclo, e com a etiqueta **Pré-cadastro**. Enter nunca pré-cadastra (só o clique ou as setas).
- **Defensivo e Fertilidade** (princípio ativo / matéria-prima e produto comercial): **+ Pré-cadastrar** é sempre a última opção quando há texto digitado. A própria linha da recomendação vira um mini-formulário (Princípio ativo, Produto, Unidade), com Cancelar e **Salvar pré-cadastro**; o produto fica com a etiqueta **Pré-cadastro** na tabela de produtos e no título da coluna na tabela de talhões. Aplicar com um pré-cadastro aberto avisa "Pré-cadastro não finalizado".
- **Importar planilha** (também fora): produto ou variedade do arquivo que não está no cadastro entrava como pré-cadastro.

## O que mudou no protótipo

| Onde | O que mudou | Como recolocar |
|---|---|---|
| `js/telas/04-operacoes.js` | nova constante `PRE_CADASTRO = false`: as buscas de variedade (`opcoesVariedade`) e de princípio ativo/produto (`opcoesCombo`) não oferecem mais o "+ Pré-cadastrar"; os avisos dizem só "Escolha na lista"; a busca de produto sem resultado mostra "Nenhum item encontrado no cadastro" | trocar para `PRE_CADASTRO = true` |

**O código continua no protótipo, adormecido** (nada mais o chama): `linhaPreCadastro`, `salvarPreCadastro`, `preCadastrarVariedade`, `salvarPrePainel`, os estados `ui.preCadastro` e `ui.prePainel`, a etiqueta `etiqueta-pre` e os estilos `.pre-cadastro*` em `css/estilo.css`. Os dados de exemplo não têm itens em pré-cadastro, então a etiqueta não aparece.
