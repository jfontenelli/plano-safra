# Tela 06 — Orçamento de Insumos

Atualizado em 16/10/2026. Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Tudo é **Definido**, exceto as seções "Em aberto" e "Sugestões".
Imagem: `referencias/suprimentos.png` e a referência enviada pela usuária em 16/10 (dashboard "Orçamento de Insumos"), como inspiração de organização e hierarquia. Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** construída (`js/telas/orcamento.js`).

## Objetivo
Mostrar, para todos os planos do Ano Agrícola, **quanto de cada insumo os planos precisam, quanto há em estoque, quanto falta comprar e quanto isso custa**, com o custo por hectare (em moeda e em sacas) e a receita estimada.

## Quando aparece
- Item **Orçamento** do menu Plano de Safra (antes "Suprimentos"). Título da página: **Orçamento de Insumos**.
- Soma a **última versão publicada de cada plano** (etiqueta "ⓘ Últimas versões publicadas" ao lado do título). Versão em construção não entra.
- Sem nenhum plano: o convite "Crie seu primeiro plano para visualizar o Orçamento de Insumos" (DECISOES 4.0).

## Conteúdo (de cima para baixo)

### Parte fixa no topo
Cabeçalho, filtros e estimativas ficam **congelados no topo** enquanto a página rola. O **alfinete** no canto direito do cabeçalho congela e descongela (verde e preenchido = congelado; cinza, só o contorno = solto; texto ao passar o mouse "Descongelar cabeçalho" / "Congelar cabeçalho"). Começa congelado; a escolha se mantém ao navegar.

1. **Cabeçalho** (baixo): título, etiqueta "Últimas versões publicadas" e, à direita, **Moeda de exibição ⓘ [R$ | US$]** e o alfinete.
2. **Filtros**, numa linha: **Ano Agrícola** (uma escolha só, sem "Todos") · **Safra** (Safra/Safrinha) · **Empresa** · **Fazenda** · **Talhão** · **Cultura** · **Insumos** · Limpar filtros.
   - Menos o Ano Agrícola, todos têm **várias escolhas**: lista com caixas de marcar e "Todas"/"Todos" no topo; o campo mostra "Todas", o nome escolhido ou "2 selecionadas". A lista fica aberta enquanto se marca; fecha ao clicar fora ou com Esc.
   - As opções vêm dos planos publicados e dependem dos filtros de cima (ex.: com duas fazendas marcadas, Talhão mostra só os talhões delas). Opção que sai da lista é desmarcada.
   - **Insumos** = os grupos de insumo (abaixo).
   - Limpar filtros: Ano Agrícola volta ao de hoje; os demais a "Todas"/"Todos".
3. **Estimativas de comercialização**, numa linha: "PTAX: R$ 5,20/US$ · Soja: US$ 23,00/sc · 65 sc/ha · Milho: R$ 55,00/sc · 110 sc/ha" e o botão **Editar parâmetros**.

### Resumo do orçamento
Cards sem texto de rodapé, cada um com o ícone num círculo verde e o valor em destaque (com cinco cards, o ícone e o valor ficam um pouco menores para caber):
- **Área produtiva** (ha) · **Custo total** · **Custo por hectare** · **Custo em sacas · Cultura** (só quando o filtro resulta em **uma cultura**) · **Receita estimada** (um card só, somando as culturas).

### Orçamento por tipo de insumo
Uma linha por grupo de insumo, do mais caro ao mais barato: Tipo de insumo · barra (cinza até 100%, verde UniSystem até o % do custo) · % · Custo total · R$/ha (ou US$/ha) · **uma coluna de sacas por cultura** do filtro ("Soja sc/ha", "Milho sc/ha"; algodão em @/ha).

### Detalhamento do orçamento
Título, guias **Por produto · Por talhão**, busca e **Exportar XLSX** (botão com contorno verde e a seta para baixo).
- **Por produto** (uma linha por produto, sem setas de abrir): Grupo de insumo · Produto · Necessidade de consumo · Volume em estoque · Volume a ser comprado · Unidade · Custo unitário · Custo total. Busca por produto ou grupo.
- **Por talhão**: Safra · Empresa · Fazenda · Cultura · Talhão · Hectares · Custo total · R$/ha (na moeda escolhida) · Custo em sacas. Busca por fazenda, talhão ou cultura.
- Sem linha de Total.
- **Ordenar** por qualquer coluna: seta no título (1º clique crescente, 2º decrescente; vazios sempre no fim), como na Visão Geral. Cada guia guarda a sua ordenação.
- **Paginação** embaixo: "Itens por página" (10, 20, 50, 100; começa em 10), "1–10 de 52", "Página 1 de 6" e as setas. Filtrar, buscar, ordenar ou trocar de guia volta à página 1.
- **Exportar XLSX**: a guia aberta, com filtros, busca e ordenação, na moeda de exibição, com os valores exatos.

### Modal Editar parâmetros
Título "Estimativas de comercialização"; "Ano Agrícola 2026. Usadas no custo em sacas e na receita estimada."
- **PTAX de referência**: R$ [5,20] por US$ 1,00.
- **Por cultura**, tabela: Cultura · Preço esperado (moeda R$/US$, valor, "/sc" ou "/@") · Produtividade esperada (valor, "sc/ha" ou "@/ha") · lixeira.
  - As culturas dos planos publicados do ano entram sozinhas, com os valores de exemplo, e não podem ser removidas. **+ Adicionar cultura** inclui outra (lista com as que ainda não estão; desabilitado quando todas estão), com lixeira.
  - Unidade pela cultura: soja e milho em saca (sc), algodão em arroba (@).
- Cancelar descarta; **Aplicar** guarda e recalcula a página.

## Regras

### Grupos de insumo
Fertilizantes · Defensivos · Sementes · Corretivos · Tratamento de semente · Adjuvantes · Biológicos · Óleo (os mesmos no gráfico e no filtro Insumos). O grupo vem da classe do produto no cadastro: Corretivo e Condicionador → Corretivos; Fosfatado, Potássico, Formulado NPK, Micronutriente, Nitrogenado e fertilidade sem classe → Fertilizantes; Herbicida, Fungicida, Inseticida → Defensivos; as variedades do Plantio → Sementes.

### Cálculos
- **Necessidade** = dose do talhão × área do talhão, somada por produto, na unidade do cadastro (t, kg, L, g).
- **Sementes**: população × área ÷ germinação, na embalagem da cultura: soja em **bag (5 milhões de sementes)**, milho em **saco (60 mil sementes)**; preço por embalagem, de cada variedade.
- **Custo** = necessidade × valor unitário (base histórica; no protótipo, valores de exemplo). Cada insumo tem moeda própria (R$ ou US$).
- **A comprar** = necessidade − estoque, **fazenda a fazenda** (nunca negativo), somado. Estoque **por fazenda**.
- **Área produtiva** = soma das áreas dos talhões incluídos de cada plano no filtro (com Talhão, só os escolhidos). Com Safra "Todas", soma a safra e a safrinha.
- **Custo por hectare** = custo ÷ área produtiva.
- **Custo em sacas** = custo por hectare ÷ preço da saca (ou arroba) **em reais**.
- **Receita estimada** = soma, por cultura, de área × produtividade esperada × preço esperado em reais.
- Filtro Insumos limita os produtos (e o custo) aos grupos escolhidos; a área continua a dos planos.

### Moeda e PTAX
- A **PTAX de referência** converte para R$ o que está em US$ (insumos e preço de venda). Com **Moeda de exibição US$**, tudo é mostrado em dólar (R$ ÷ PTAX).
- PTAX e estimativas por cultura valem para o **Ano Agrícola** (cada ano tem os seus).

### Arredondamento
- Valores da página **sem casa decimal**; o que tem valor mas arredondaria para zero mostra **0,1** (ex.: 0,1%). Zero de verdade fica 0.
- Ficam com casas: o **custo unitário** (centavos), os parâmetros (PTAX e preços) e o arquivo exportado.

## Navegação
- Editar parâmetros → modal (Cancelar/X/Esc fecha sem mudar).
- Exportar XLSX → baixa a planilha (`orcamento-insumos-2026-por-produto.xlsx` ou `-por-talhao`).

## Para testar
- Planos de exemplo publicados (ano agrícola 2026): soja 26/27 da Santa Clara, da Boa Vista e da Primavera; milho safrinha 27/27 da Santa Clara e da Boa Vista. São José sem plano.
- Dados de exemplo em `js/dados-exemplo.js`: `precosInsumos` (moeda e valor), `embalagemSemente`, `precosSementes`, `estoqueInsumos` (por fazenda), `gruposInsumo`, `grupoInsumoPorClasse`, `ptaxReferencia`, `comercializacao`. Preços estimados para o médio-norte do MT, safra 26/27 (pesquisa de 16/10/2026; a conferir).
- Para ter os 8 grupos, os exemplos têm produtos de Tratamento de semente, Biológicos, Adjuvantes e Óleo. O tratamento de semente on farm entra como operação "Tratamento de sementes" no grupo Defensivo, no dia do plantio, **só nos planos de exemplo** (o TSI continua fora do protótipo; o "Usar modelo" não mudou).

## Em aberto
1. **Custos operacionais e adicionais** (custo operacional, combustível, seguro, frete…): fora por enquanto (decidido em 15/10; ver rascunhos/orcamento/README.md).
2. **Preço de referência**: última compra, média da última safra, média de 2 anos ou compra de maior volume (DECISOES, roteiro 9).
3. **Estoque por empresa ou por fazenda** (DECISOES, roteiro 10). No protótipo, por fazenda.
4. **TSI** de verdade (dose por 100 kg de semente, precisa do PMS): quando o TSI voltar (rascunhos/tsi/).
5. Na tela de Operações, a coluna Bags do milho ainda divide por 5 milhões, como a soja.

## Sugestões
- Com várias escolhas, o campo estreito corta o texto ("2 seleciona…"): trocar por "2 fazendas", "3 talhões".
- Em telas baixas, se a parte fixa apertar, fixar só os filtros.
