# Gestão da Lavoura › Operações › Desvios de dose — guardado para retomar

Em 05/11/2026 a usuária pediu para **salvar a guia Desvios de dose no rascunho**, para poder recuperá-la como estava se ela for mudada.

## Onde está a guia completa, como estava

- **Marca no git: `desvios-dose-05-11-2026`** (commit 1fd9f8e).
  Para ver um arquivo como estava: `git show desvios-dose-05-11-2026:js/telas/desvios-recomendacao.js`.
  Para abrir o protótipo inteiro como estava (sem mexer na branch atual): `git worktree add ../plano-safra-desvios desvios-dose-05-11-2026` e abrir o `index.html` dessa pasta (`#/planejado-executado/desvios`).
- **Detalhe da guia:** `docs/telas/10-aplicacoes.md`, seção 5 (Desvios de dose, antes Desvios de Recomendação).

## Arquivos da guia

| Onde | O quê |
|---|---|
| `js/telas/desvios-recomendacao.js` | a guia inteira: filtros, Dose · Quantidade, distribuição dos desvios, desvios por nível, Top 10 produtos e detalhamento por OS; também os registros das OS fechadas usados pelo Risco de falta de produto (`registros`) |
| `js/telas/monitoramento-aplicacoes.js` | a guia na lista `GUIAS` (`'desvios'`, "Desvios de dose") e a chamada `Telas.desviosRecomendacao` |
| `css/estilo.css` | os estilos `.dr-*` |
| `js/dados-exemplo.js` | `monitoramento.desviosProduto` (desvios fixos de exemplo) |

A guia **continua no protótipo, funcionando** (só foi guardada a versão de 05/11/2026). Atenção: o Risco de falta de produto usa `Telas.desviosRecomendacao.registros()` para o desvio médio de quantidade; se a guia mudar, essa função precisa continuar existindo.
