# Tratamento de sementes (TSI) — guardado para retomar

Em 15/10/2026 a usuária pediu para **tirar o TSI do Plano de Safra por enquanto** e guardar tudo para recriar mais para frente, retomando do ponto em que paramos.

## Onde está o TSI completo, como estava

- **Marca no git: `tsi-15-10-2026`** (commit c3de1ba, o último com o TSI). Para ver qualquer arquivo como estava:
  `git show tsi-15-10-2026:js/telas/04-operacoes.js` (ou `js/dados-exemplo.js`, `js/planos.js`, `css/estilo.css`…).
  Para abrir o protótipo inteiro como estava (sem mexer na branch atual): `git worktree add ../plano-safra-tsi tsi-15-10-2026` e abrir o `index.html` dessa pasta.
- **Detalhe da tela:** `04.4-operacoes-tratamento-sementes.md` (nesta pasta; antes ficava em `docs/telas/`).
- **Regras que estavam no DECISOES (seção 4.4.1)**, copiadas aqui:
  - Grupo do tipo **Tratamento de sementes**, guia **Tratamento de semente**, logo depois da guia Semente. Operação **Tratamento de sementes (TSI)**, com DAP no cabeçalho (como no Defensivo), sem fenologia; o modelo sugere **DAP −5**.
  - **Tratamento de sementes industrial (TSI)**: receita com nome (TSI 1, TSI 2…), só para talhão com variedade, no padrão da recomendação agronômica (composição de produtos = identidade; dose pode variar por talhão), aplicada **por talhão**. Composta por grupos de produto: fertilizante, fungicida, inseticida, nematicida, inoculante, polímero, pó secante e grafite.
  - Unidade da dose de TSI vem do cadastro do produto; a unidade usada pelos clientes (por 100 kg de sementes, por bag ou por hectare) e a entrada do PMS no plano serão definidas nos testes. Sem cálculo de quantidade de TSI no plano por enquanto.
  - Excluir o plantio de um talhão (sem variedade) tira o talhão também do TSI.

## O que foi tirado do protótipo (para recolocar ao retomar)

| Onde | O que saiu | Como recolocar |
|---|---|---|
| `js/dados-exemplo.js` · `tiposGrupo` | o tipo `'Tratamento de sementes'` (entre Sementes e Defensivos) | voltar o item na lista |
| `js/dados-exemplo.js` · `modeloOperacoes` | o grupo `Tratamento de semente` com a operação `Tratamento de sementes (TSI)`, DAP −5 | copiar da marca `tsi-15-10-2026` |
| `js/dados-exemplo.js` · `defensivos` | os 11 produtos `tsi: true` (Standak Top, Cruiser 350 FS, CropStar, Maxim Advanced, Vitavax-Thiram 200 SC, Avicta 500 FS, Masterfix L Soja, Co + Mo, Disco AG Red L-280, Talco agrícola, Grafite em pó), doses por 100 kg | copiar da marca |
| `js/dados-exemplo.js` · plano de exemplo da Santa Clara (soja) | `'Tratamento de sementes (TSI)'`: TSI 1 em T01–T05 e TSI 2 (com nematicida) em T06–T08 | copiar da marca |
| `js/telas/03-painel.js` · `GRUPOS` | a coluna **TSI** da tabela Planos de Safra (Visão Geral) | voltar `['Tratamento de sementes', 'TSI']` na lista |
| `js/telas/04-operacoes.js` · Excluir plantio | o texto "…germinação **e TSI**…" | voltar o texto |
| `js/arquivo-plano.js` · importar | agora ignora grupos do tipo Tratamento de sementes de arquivos antigos | tirar a linha que pula esse tipo |
| `docs/` | 04.4 movido para cá; DECISOES 4.4.1, TELAS e docs 03/04.0/04.2 com a nota "fora por enquanto" | reescrever com o que for decidido |

**O código da tela continua no protótipo, adormecido** (nenhum grupo de TSI pode ser criado, então ele não aparece): em `js/telas/04-operacoes.js`, `ehGrupoTsi`, `ehTsi`, `detalheTsi`, `UNIDADES_TSI`, o filtro de produtos por uso (`usoProduto` e `usoAtual` com `'tsi'`), a coluna Variedade e o aviso "Talhões sem variedade não recebem TSI" na tabela de talhões, o modal "Definir TSI"; em `js/planos.js`, o nome "TSI N" das receitas e o `tsi` dos exemplos; em `js/arquivo-plano.js`, a aba `tratamento_sementes` do .xlsx; em `js/telas/04.0-operacoes-plano.js`, o ícone do tipo; em `js/telas/05-calendario.js`, a dose do TSI no Resumo; em `css/estilo.css`, os selos de grupo de produto do TSI. Recolocando os dados acima, a guia volta a funcionar como em 15/10.

## Onde paramos (retomar daqui)

1. **Unidade da dose e quantidade de TSI**: a dose dos produtos é por 100 kg de semente, mas o plano só sabe a quantidade de sementes (população × área ÷ germinação). Para calcular a quantidade de produto (e o custo no Orçamento) falta o peso da semente. Opções levantadas:
   - a) **PMS por variedade** no cadastro (kg de semente = sementes × PMS ÷ 1.000.000; produto = dose × kg ÷ 100) — sugestão do Claude; o PMS já estava na especificação da reunião de 13/10;
   - b) peso fixo de bag de exemplo (ex.: 1 bag de 5 milhões de sementes = 40 kg);
   - c) dose por bag ou por hectare, como alguns clientes usam.
2. **TSI no Orçamento de Insumos** (rascunhos/orcamento/): ficou de fora pelo mesmo motivo (falta o peso da semente).
3. TSI aplicado por talhão "pode mudar após os testes" (DECISOES 4.4.1).
