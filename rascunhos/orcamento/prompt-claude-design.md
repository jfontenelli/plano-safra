# Prompt para o Claude Design — Orçamento de Insumos (item Orçamento do menu)

Cole o texto abaixo no Claude Design e anexe as imagens: as 4 planilhas que os usuários usam hoje (Resumo dos Custos, Custo planejado por tipo de insumo, Resumo Fertilizantes, Resumo Defensivos) e, se quiser, `referencias/suprimentos.png` (dashboard antigo "Orçamento de Insumos", só como inspiração).

---

Preciso do design de uma tela de um software de gestão agrícola, em **português do Brasil**. É um **dashboard de orçamento de insumos** chamado **Orçamento de Insumos** (no menu, **Orçamento**; antes se chamava Suprimentos), que reúne **todos os planos de safra** de um grupo de empresas rurais. Quero um design de alta fidelidade, para desktop (1440 px de largura), navegável, com as interações principais funcionando (filtros, abrir e recolher linhas, guias, painel lateral, campos de parâmetro recalculando os números).

As imagens anexas são as planilhas que os usuários montam hoje à mão. **Use como referência do conteúdo, não como obrigação de layout**: quero algo mais claro que a planilha.

## 1. O produto e quem usa

- **Plano de Safra (UniSystem)**: o agrônomo planeja, para cada fazenda e safra, as operações (plantio, adubação, aplicações de defensivos) com produtos e doses **por talhão** (talhão = área de lavoura dentro da fazenda).
- Um **plano** = empresa + fazenda + cultura + safra ou safrinha. O grupo tem várias empresas, cada empresa várias fazendas, cada fazenda dezenas de talhões.
- Quem usa o Orçamento: **analista de compras e gestor**. Perguntas que a tela responde:
  1. Quanto vai custar a safra (em R$, em US$, por hectare e em sacas por hectare)?
  2. Quanto preciso de cada produto, quanto já tenho em estoque e **quanto falta comprar**?
  3. Quanto custa cada talhão e cada fazenda?

## 2. Onde fica

- Menu lateral verde (já existe): **Plano de Safra** › Visão Geral · Planejamento · Calendário Agrícola · **Orçamento**; depois Ordens de Serviço e Cadastros; usuário no rodapé. Desenhe a tela com esse menu à esquerda, expandido.
- Título da página: **Orçamento de Insumos**. Ao lado dos filtros, uma etiqueta discreta **"Últimas versões publicadas ⓘ"** (o dashboard soma a última versão publicada de cada plano; ao passar o mouse: "O Orçamento mostra a última versão publicada de cada plano. Alterações em versões em construção aparecem aqui depois de publicadas.").

## 3. Regras que já estão decididas

**Safra, safrinha e ano agrícola**
- Safra: de 01/09 de um ano a 31/08 do ano seguinte (ex.: Safra 26/27, de 01/09/2026 a 31/08/2027).
- Safrinha: de 01/01 a 31/08 do ano seguinte ao início da safra (ex.: Safrinha 27/27, de 01/01/2027 a 31/08/2027).
- As duas ficam no mesmo **Ano Agrícola** (o ano do início da safra: 2026).

**Filtros** (em uma linha, no topo): **Ano Agrícola** (um só, sem "Todos"; começa no de hoje), **Safra** (Todas, Safra, Safrinha), **Empresa**, **Fazenda**, **Cultura** e **Limpar filtros**. Pode haver também **Talhão** se você achar útil (pode ser busca em vez de lista).

**Parâmetros informados pelo usuário no próprio dashboard** (campos editáveis; mudar recalcula tudo na hora):
- **PTAX** (R$/US$): um valor para o ano agrícola. Converte o que está em US$.
- **Por cultura** presente nos planos filtrados: **produtividade esperada** (na unidade da cultura: soja e milho em **sc/ha**) e **preço de venda** (em **R$/sc ou US$/sc**, com seletor de moeda).

**Moedas**
- Cada produto tem preço na sua moeda, **R$ ou US$** (ex.: sementes em R$, parte dos fertilizantes e defensivos em US$).
- Os totais aparecem em **R$ e em US$** (convertendo pela PTAX) e o custo por hectare também em **sacas por hectare** (custo/ha em R$ ÷ preço da saca em R$).

**Cálculo**
- **Necessidade de consumo** de cada produto = dose do talhão × área do talhão, somada por produto (na unidade do produto: kg, t, L, g; sementes em sementes/bags).
- **Valor unitário** = custo unitário da **base histórica** (preço de referência; vem pronto, o usuário não digita aqui).
- **Valor total** = necessidade × valor unitário (na moeda do produto).
- **Volume em estoque**: o **estoque é por fazenda**.
- **Volume a ser comprado** = necessidade − estoque, **fazenda a fazenda** (nunca negativo: sobra numa fazenda não cobre a falta de outra), somado.
- **Custo por hectare** = custo ÷ área. Não chamar receita − custo de "lucro".
- Sem comparação com safra anterior (não temos esses dados).

**Grupos de insumo** (com subgrupos, como nas planilhas):
- **Sementes** (por variedade).
- **Tratamento de sementes (TSI)**.
- **Fertilidade**: Adubo calcário (corretivos), Adubo macro, Adubo micro solo, Adubo micro foliar.
- **Defensivos**: Herbicida, Fungicida, Inseticida, Adjuvante, Óleo, Biológico.
- Cada produto tem: nome comercial, subgrupo, **fornecedor**, unidade, moeda.

## 4. O que a tela precisa mostrar

1. **Resumo dos custos** (planilha "Resumo dos Custos"): Valor total R$ · Valor total US$ · Custo por hectare R$ · Custo por hectare US$ · Custo por hectare sc · e, se couber, Valor a comprar (R$). Também a área considerada (ha).
2. **Custo por tipo de insumo** (planilha "Custo planejado"): grupo/subgrupo × moeda, com custo por hectare, valor total R$ e custo por ha US$.
3. **Por produto** (planilhas "Resumo Fertilizantes" e "Resumo Defensivos"): Produto · Subgrupo · Fornecedor · Necessidade de consumo · Moeda · Valor unitário · Valor total · Volume em estoque · Volume a ser comprado. Agrupado por grupo de insumo.
4. **Por talhão** (a mesma expansão, vista pelo lado da lavoura): Empresa · Fazenda · Cultura · Talhão · Área do talhão (ha) · Custo por ha · Custo total. Abrindo um talhão: os produtos dele por grupo (produto, dose, quantidade, custo).

## 5. O desafio de design (é aqui que quero a sua proposta)

**Escala real**: um cliente tem facilmente **20 a 40 fazendas, 30 a 80 talhões por fazenda (mais de 1.000 talhões)** e **150 a 300 produtos** (sementes, fertilizantes, defensivos). A tabela por talhão e a tabela por produto ficam enormes. Proponha a melhor forma de o usuário:
- ver o total e entender rapidamente onde está o dinheiro (por grupo, por fazenda, por cultura);
- descer do resumo ao detalhe sem se perder (ex.: grupos e fazendas recolhidos com subtotais; abrir uma linha; painel lateral para o detalhe do talhão ou do produto; busca; ordenar por coluna; destacar o que falta comprar);
- ler números grandes com conforto (alinhamento à direita, separador de milhar, moeda e unidade claras).

Fique à vontade para usar guias ("Por produto" / "Por talhão"), um gráfico simples se ajudar a ver a composição do custo (ex.: barras por grupo de insumo), e para cortar o que for redundante. Se alguma informação das planilhas não fizer sentido no dashboard, diga por quê.

## 6. Visual (o protótipo já existe; mantenha o estilo)

- Clean e profissional; **uma superfície só**: conteúdo em fundo branco, seções separadas por linhas finas, sem cartões soltos boiando sobre fundo cinza.
- Cores: verde da marca `#13603f` (principal), `#187a4f`, verde-escuro do menu `#0e4a31`/`#0a3a26`, verde-claro `#e6f2ec`, amarelo `#f5c400` (só detalhe); fundo `#f6f7f6`, superfície `#ffffff`, borda `#e3e7e4`, texto `#1a1f1c`, texto suave `#5f6b64`.
- Fonte do sistema (Segoe UI); texto base 15 px, tabelas 14 px; raio 10 px.
- Termos do dia a dia da fazenda: safra, safrinha, talhão, sc/ha, PTAX. Nada em inglês na interface.
- A tela deve **caber bem em 1440 × 900** na primeira dobra com o resumo; as tabelas podem rolar.

## 7. Dados de exemplo (use estes nomes; os números podem ser coerentes com a realidade do médio-norte de Mato Grosso)

- Ano Agrícola 2026: **Safra 26/27** (soja) e **Safrinha 27/27** (milho).
- Empresa A: Fazenda São José (12 talhões, 1.185 ha) e Fazenda Santa Clara (8 talhões, 845 ha). Empresa B: Fazenda Boa Vista (10 talhões, 983 ha). Empresa C: Fazenda Primavera (6 talhões, 648 ha). Talhões T01, T02…
- PTAX 5,40. Soja: 63 sc/ha a R$ 122/sc. Milho safrinha: 110 sc/ha a R$ 55/sc.
- Produtos (exemplos): sementes BMX Foco IPRO, TMG 2383 IPRO, DKB 360 PRO3 (R$); Calcário dolomítico PRNT 85% (t, R$, Transcal), Gesso agrícola (t, R$), MAP 11-52-00 (kg, US$, Mosaic), KCl 00-00-60 (kg, US$, Eurochem), Ureia 45% (kg, US$), Borosol K e Nutre Boro (L, R$, micro foliar); herbicidas Roundup Original DI, Zapp QI 620, Finale, Dual Gold (L, US$); fungicidas Fox Xpro, Priori Xtra, Elatus (US$); inseticidas Engeo Pleno, Premio, Connect; óleo e adjuvante; biológico. TSI: Standak Top, Cruiser 350 FS, Masterfix L Soja.
- Alguns produtos com estoque que cobre tudo (a comprar = 0), outros com estoque parcial e outros sem estoque.

## 8. Entregue

- A tela completa navegável (desktop 1440), com os dados de exemplo.
- Uma nota curta explicando as escolhas para as tabelas grandes (por produto e por talhão) e o que você tirou ou juntou das planilhas.
