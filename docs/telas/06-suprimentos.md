# Tela 06 — Suprimentos

Atualizado em 09/10/2026. Este doc mostra só o estado atual da tela. Decisão alterada é reescrita, não acumulada.
Tudo é **Definido**, exceto as seções "Em aberto" e "Sugestões".
Imagem: `referencias/suprimentos.png` (dashboard "Orçamento de Insumos"), usada como inspiração de organização visual, hierarquia, indicadores e tabelas. Quando imagem e documento divergirem, vale este documento.
**Situação no protótipo:** a definir (falta fechar o cálculo do TSI, ver "Em aberto").

---

## 1. Objetivo

Mostrar, para o plano de uma fazenda, **quanto de cada insumo o plano precisa, quanto há em estoque, quanto falta comprar e quanto isso custa**, com os parâmetros econômicos (produtividade, preço de venda e PTAX) e os custos extras, chegando ao custo total planejado e à receita bruta estimada.

## 2. Lugar na jornada

- Etapa **Suprimentos**, dentro do plano, **para uma fazenda só** (o plano é por fazenda). Não é uma visão consolidada de várias fazendas: os filtros de Empresa e Fazenda da imagem não entram.
- Cabeçalho do plano, igual às outras etapas: "Plano de Safra › Safra 26/27 · Empresa A · Fazenda Santa Maria · Cultura Soja · [status] · ✓ Salvo automaticamente".
- Abas: **Operações · Planejamento · Calendário Agrícola · Suprimentos · Aprovação**, com **Suprimentos** selecionada.

## 3. Conteúdo (de cima para baixo)

### 3.1 Parâmetros econômicos

Seção compacta e editável, informada pelo agricultor:

| Campo | Unidade | Tipo |
|---|---|---|
| Produtividade estimada | sc/ha | Numérico |
| Preço estimado de venda | R$/sc ou US$/sc | Numérico + seletor de moeda (BRL ou USD) |
| PTAX de referência | R$/US$ | Numérico |

- A cultura do protótipo é soja (unidade sc/ha).
- Mudar um parâmetro recalcula os indicadores na hora.
- Os valores ficam guardados no plano (não se perdem ao trocar de etapa).

### 3.2 Indicadores consolidados (no topo, no estilo da imagem)

1. Área de referência (ha)
2. Custo total de insumos (R$)
3. Custos extras (R$)
4. Custo total planejado (R$)
5. Custo planejado por hectare (R$/ha)
6. Custo em sacas por hectare (sc/ha)
7. Receita bruta estimada (R$)

**Sem comparação com a safra anterior** (nem nos indicadores, nem nas tabelas): por agora não teremos esses dados dos clientes.

### 3.3 Composição do orçamento de insumos

Tabela hierárquica e expansível, em três níveis: **Grupo de insumos → Produto → Talhão e operação**.

- **Grupos**: Corretivos · Sementes · **TSI** (grupo próprio) · Fertilizantes · Defensivos.
- **Nível grupo** (consolidado): Grupo de insumos · Custo estimado (R$) · Participação no orçamento (%).
- **Nível produto** (ao abrir um grupo): Produto comercial · Princípio ativo ou formulação (quando houver) · Unidade · Quantidade necessária · Estoque disponível · Quantidade a comprar · Moeda · Preço unitário · Custo total estimado · Previsão de utilização.
- **Nível detalhe** (ao abrir um produto): a necessidade **por talhão e operação** (sem fazenda: o plano é de uma fazenda só).

### 3.4 Custos extras

Seção **opcional**, abaixo da composição do orçamento.
- Estado inicial: "Nenhum custo extra adicionado." e o botão **+ Adicionar custo**. Sem despesas pré-cadastradas nem custos criados sozinhos.
- Cada custo: **Nome do custo** (texto livre) · **Tipo de cálculo** (Por hectare ou Valor total) · **Área (ha)** (só no Por hectare) · **Valor** (R$/ha no Por hectare; R$ no Valor total) · **Custo total calculado** (automático).
  - Por hectare: custo total = área × valor por hectare.
  - Valor total: usa o valor informado (sem área).
- Quantos custos forem necessários; editar e excluir cada um. Sem categorias. A soma vai para os indicadores na hora.
- A área do custo extra é **independente** da área de aplicação dos insumos (não usa sozinha a área de algum produto).
- Custo extra **não gera necessidade de compra** de insumo.

### 3.5 Resumo econômico (no fim da página)

Custo total dos insumos · Custos extras · Custo total planejado · Custo planejado por hectare · Custo em sacas por hectare · Receita bruta estimada.
- **Não chamar a diferença entre receita e custos de "lucro"**: outros custos de produção podem não estar no plano.

### 3.6 Rodapé

- **Sem botão "Salvar planejamento"**: vale o **salvamento automático** do plano (sinal "✓ Salvo automaticamente" no cabeçalho).
- **Sem botão "Continuar para Aprovação"**: a pessoa segue pelas abas do cabeçalho.

## 4. Regras

### 4.1 Cálculos

- **Custo total planejado** = custo dos insumos + custos extras.
- **Custo planejado por hectare** = custo total planejado ÷ área de referência.
- **Custo em sacas por hectare** = custo planejado por hectare ÷ preço estimado da saca **em reais**.
- **Receita bruta estimada** = área de referência × produtividade estimada × preço estimado de venda **em reais**.
- **Área de referência** = soma das **áreas físicas dos talhões incluídos no plano**, cada talhão **uma vez só**. **Não** somar as áreas de aplicação dos produtos (um talhão recebe vários insumos e operações). Sem área disponível: indicador sem valor ("—"); não inventar área padrão.

### 4.2 Moeda e PTAX

- Cada insumo tem preço em **BRL ou USD**, individualmente (ex.: **sementes são compradas em reais**).
- A **PTAX** converte para reais só os valores em **USD** (insumos e, se for o caso, o preço de venda). Valor em BRL não passa por conversão.
- Totais e indicadores em **R$**. Na tabela de produtos, o preço unitário aparece na moeda do produto.

### 4.3 Necessidade, estoque e compra

- A necessidade vem do **Planejamento** (doses e talhões de cada operação; no Plantio, as sementes).
- Respeitar a unidade de cada produto; **não somar unidades incompatíveis**.
- **Quantidade a comprar** = quantidade necessária − estoque disponível e elegível (nunca negativa).
- **Não reservar estoque** automaticamente e **não gerar pedido de compra** nesta página.
- Estoque insuficiente **não impede** o avanço do planejamento.
- Rastreabilidade: do produto consolidado se chega à origem (talhão e operação do Planejamento).
- Os preços são **de referência** para o orçamento, não compras efetivadas.
- Mudanças no Planejamento aparecem no orçamento ao voltar para Suprimentos.

### 4.4 Quantidade por grupo

- **Corretivos, Fertilizantes e Defensivos**: dose do talhão × área do talhão, somada por produto (na unidade do produto: t, kg, L).
- **Sementes**: sementes e bags do Plantio (população × área ÷ germinação; 1 bag = 5 milhões de sementes), por variedade.
- **TSI**: dose por 100 kg de semente; precisa dos kg de semente de cada talhão. **Em aberto** (ver seção 7).

## 5. Navegação

- Abas do cabeçalho para as outras etapas. Aprovação ainda não construída: página provisória "Em construção".

## 6. Dados para o protótipo

- **Estoque**, **preços de referência** (com moeda) e o que mais faltar para o cálculo: **dados de exemplo** em `js/dados-exemplo.js`, **sem marca "dados de exemplo" na tela** (os usuários dos testes sabem disso).
- Sementes em R$; parte dos defensivos e fertilizantes em US$, para testar a PTAX.

## 7. Em aberto

1. **Cálculo do TSI** (dose por 100 kg de semente): falta o peso da semente. Opções levantadas:
   - a) PMS de exemplo por variedade no cadastro (kg de semente = sementes × PMS ÷ 1.000.000; TSI = dose × kg ÷ 100). **Sugestão do Claude.**
   - b) Peso de bag fixo de exemplo (ex.: 1 bag = 40 kg).
   - c) Não calcular o TSI por enquanto ("—" com "Precisa do PMS da semente").
2. **Previsão de utilização**: a data prevista da primeira operação que usa o produto (data de plantio + DAP, como no Calendário), ou o intervalo entre a primeira e a última? A confirmar.
3. **Estoque por empresa ou por fazenda** (DECISOES, roteiro de validação 10). No protótipo, por fazenda (dados de exemplo).
4. **Preço de referência**: última compra, média da última safra, média de 2 anos ou compra de maior volume (DECISOES, roteiro 9). No protótipo, um preço de exemplo por produto.
5. **Custo estimado e Receita projetada da lista de planos** (Tela 03): passam a vir desta etapa? Nesta entrega, as outras telas não mudam.

## 8. Decisões tomadas nesta conversa (09/10/2026)

- Etapa dentro do plano, para uma fazenda; cabeçalho e abas iguais às outras etapas (o Planejamento continua nas abas).
- Sem filtros de Empresa e Fazenda.
- **Sem comparação com a safra anterior e sem gráfico** (sem dados dos clientes por agora). Antes, chegou-se a escolher um gráfico por grupo de insumo; caiu junto com a comparação.
- Parâmetros novos, que não estão na imagem: produtividade estimada, preço de venda (R$ ou US$) e PTAX.
- Preços dos insumos em BRL ou USD por produto; PTAX converte só o que está em USD.
- TSI como grupo próprio.
- Necessidade vem do Planejamento (não da etapa Operações).
- Detalhe do produto por talhão e operação, sem fazenda.
- Sem "Salvar planejamento" (salvamento automático) e sem "Continuar para Aprovação" (abas do cabeçalho).
- Mesmo tema visual do protótipo (só o tema claro).
- Estoque, preços e demais dados que faltam: dados de exemplo, sem marca na tela.
