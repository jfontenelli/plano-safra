# Orçamento de Insumos (antes "Suprimentos") — rascunho para retomar

**Atualização em 16/10/2026: construído** (`js/telas/orcamento.js`; doc atual em `docs/telas/06-orcamento.md`, que vale sobre este rascunho). Na construção, algumas decisões de 15/10 mudaram: saíram as guias Safra/Safrinha (voltou o filtro Safra), entraram a moeda de exibição R$/US$, os 4 cards da referência (Custo em sacas só com uma cultura) e a receita estimada num card só, e os grupos de insumo da referência. Este rascunho fica como histórico.

Situação em 15/10/2026: decisões fechadas, implementação pausada.

## O que tem nesta pasta

| Arquivo | O que é |
|---|---|
| `design-claude.html` | O design do Claude Design, copiado do artifact e funcionando direto no navegador (abra com dois cliques). Precisa de internet para o d3. |
| `dados-design.js` | Os dados fictícios do design (67 talhões em 4 fazendas, 33 produtos, 967 aplicações, estoque por fazenda). |
| `dash-local.js` | Substitui o ambiente de dashboard do claude.ai (`dash.data`, `dash.calc`, `dash.params`…) para a página abrir fora dele. |
| `prompt-claude-design.md` | O prompt enviado ao Claude Design (contexto, regras, dados de exemplo, visual). |
| `captura-resumo.png`, `captura-por-talhao.png` | Capturas da página como está hoje. |

- Artifact original no claude.ai: https://claude.ai/artifact/EDJuuiRWBQ2yJs8YbSvMrZ (tipo Dashboard; o conteúdo fica no banco do artifact: `files/index.html`, `datasets/*`, `dash/params`).
- Na cópia local foram corrigidos dois defeitos do design: a frase de resumo mostrava "[object HTMLElement]" e os filtros empilhavam (grade CSS inválida). O resto está igual ao design.

## Como o design está hoje (de cima para baixo)

1. Título "Suprimentos" (vai virar **Orçamento de Insumos**) e a etiqueta **"Últimas versões publicadas ⓘ"**; uma frase de resumo ("Orçamento de R$ 15,72 mi para 3.661 ha. Falta comprar R$ 10,22 mi (65%), a maior parte em fertilidade.").
2. **Filtros**: Ano Agrícola, Safra (Todas/Safra/Safrinha), Empresa, Fazenda, Cultura, Limpar filtros.
3. **Parâmetros do orçamento** (faixa verde-clara): PTAX (R$/US$) e, por cultura, Produtividade esperada (sc/ha) e Preço de venda (R$/sc ou US$/sc). Mudar recalcula tudo.
4. **Resumo** em 5 números: Valor total (R$ e ≈ US$ pela PTAX) · Custo por hectare (R$/ha e US$/ha) · Custo em sacas por hectare, por cultura (com "% de N sc/ha esperadas") · Falta comprar (R$, % do orçamento, barra coberto por estoque × a comprar) · Área considerada (ha físicos, talhões, fazendas, planos).
5. **Onde está o dinheiro**, lado a lado:
   - **Custo por tipo de insumo**: faixa colorida por grupo + tabela Grupo › subgrupo com R$/ha, Valor total (R$), US$/ha, % em US$ e % do total.
   - **Custo por fazenda**: barras de R$/ha com o valor total; clicar filtra a fazenda; dica ao passar o mouse (área, custo, falta comprar).
6. **Detalhe** em duas guias, com busca e "Abrir tudo / Recolher tudo":
   - **Por produto**: grupos recolhíveis com subtotal; colunas Produto, Subgrupo, Necessidade, Valor unit., Valor total, Estoque, A comprar, Situação (Coberto · Parcial % · Sem estoque); botão "Só o que falta comprar"; clicar no produto abre o painel com a necessidade, o estoque e a compra **por fazenda**.
   - **Por talhão**: Empresa (linha de total) › Fazenda (recolhível, com subtotal) › talhões; colunas Fazenda/talhão, Cultura (com a safra), Área, Custo por ha, **vs média da fazenda** (barra; acima de +10% em amarelo), Custo total; "Mostrar mais" de 40 em 40; clicar no talhão abre o painel com os produtos dele por grupo (dose, quantidade, custo).

## Decisões já tomadas com a usuária (15/10/2026)

- **Nome**: menu **Orçamento**; título da página **Orçamento de Insumos**.
- **Cards principais do dashboard** (do "Resumo dos Custos" da planilha), por enquanto **5**: **Valor total R$ · Valor total US$ · Custo por hectare R$ · Custo por hectare US$ · Custo por hectare sc**. Ficam para quando os outros custos voltarem: Custo operacional por hectare R$, Custo total por hectare R$ e Custo total por hectare sc. No design atual os cards são outros (Valor total, Custo por ha, sc/ha por cultura, Falta comprar, Área considerada): trocar ao implementar.
- **Outros custos (operacionais e adicionais): fora por enquanto** (decidido em 15/10). Já conversado, para quando voltar: o usuário adicionaria quantos quisesse (nome livre: custo operacional, combustível, depreciação de máquinas, seguro, frete…), cada um por hectare (R$/ha) ou valor total (R$), valendo para todos os planos da guia, cada guia com os seus; mostrados numa tabela "Custos operacionais e adicionais" com "+ Adicionar custo", ao lado do custo de insumos por hectare (a tabela começaria só com os insumos).
- **Escopo**: um dashboard com **todos os planos de safra** (não é mais por fazenda dentro do plano). Soma a **última versão publicada** de cada plano (etiqueta "Últimas versões publicadas ⓘ").
- **Guias no topo por tipo de plano**: **Safra** e **Safrinha**, cada uma um orçamento separado (sai o filtro "Safra"). **Pecuária fica de fora** até existir plano de pecuária. Juntar tudo numa visão só: pensar depois.
- **Datas (regra para o produto inteiro)**: safra de 01/09 a 31/08 do ano seguinte; safrinha de 01/01 a 31/08 do ano seguinte ao início da safra; as duas no mesmo ano agrícola (o do início da safra). Falta aplicar no protótipo: cadastro 27/27 começando em 2027-01-01, regra das safras criadas no modal (`Util.cadastroSafra`) e `DECISOES.md`.
- **Parâmetros no dashboard, separados por guia** (cada guia é um orçamento completo e independente): a Safra e a Safrinha têm cada uma a sua **PTAX** (R$/US$), e, **por cultura**, produtividade esperada (na unidade da cultura) e preço de venda (R$/sc ou US$/sc).
- **Moedas**: R$ e US$ por produto; totais em R$ e em US$ (PTAX); custo por hectare também em sacas.
- **Cálculo**: necessidade = dose × área do talhão, somada por produto; valor unitário da **base histórica**; valor total = necessidade × valor unitário.
- **Estoque por fazenda**; a comprar = necessidade − estoque, **fazenda a fazenda** (nunca negativo), somado.
- **Sementes por bag**: necessidade em bags (sementes do plano ÷ 5 milhões) e preço por bag (ex.: R$ 1.150/bag). A unidade aparece com a referência, para saberem de onde vem: **"bag (5 milhões de sementes)"** (na coluna de unidade, no preço e na necessidade).
- **Sem fornecedor** por enquanto.
- **Mais simples** (15/10): **sem comparação com a média** (da fazenda ou do talhão): sai a coluna **"vs média da fazenda"** da guia Por talhão e o texto da média do grupo. O **Custo por fazenda** fica (barras de R$/ha e total de cada fazenda, ao lado do custo por tipo de insumo; clicar filtra a fazenda), sem média. Também ficam de fora, por enquanto, a **previsão de utilização** do produto e trazer **Custo estimado e Receita projetada** para a Visão Geral.
- **Subgrupo** = a "classe" que já existe no cadastro de produtos (Corretivo, Fosfatado, Potássico, Micronutriente…; Herbicida, Fungicida, Inseticida…). Se ela preferir os nomes da planilha (Adubo calcário, Adubo macro, Adubo micro solo, Adubo micro foliar), troca.
- **TSI fica de fora** por enquanto (o cálculo precisa do peso da semente; opção sugerida para depois: PMS por variedade).
- **Planos de exemplo para o Orçamento**: deixar pelo menos uma fazenda livre em cada guia.
  - Safra 26/27 (soja): Santa Clara (já existe), **Boa Vista** e **Primavera** publicadas; São José livre.
  - Safrinha 27/27 (milho): Santa Clara (já existe) e **Boa Vista** publicadas; São José e Primavera livres.
  - Acrescentar aos dados de exemplo: moeda e valor unitário de cada produto e o estoque de cada produto em cada fazenda.

## Ainda em aberto (perguntar ao retomar)

- Nada pendente das conversas de 15/10. Ao implementar, conferir com a usuária o layout final (design sem os itens retirados, com guias Safra/Safrinha e os 5 cards).

## Para retomar

1. Abrir `design-claude.html` e reler este README.
2. Conferir com a usuária se algo mudou desde 15/10 (uma pergunta por vez).
3. Reescrever `docs/telas/06-suprimentos.md` (renomear para Orçamento) e atualizar `DECISOES.md` e `TELAS.md` com o ok da usuária.
4. Implementar em `js/telas/` com os dados reais dos planos (não os dados fictícios do design), na branch `suprimentos`.
