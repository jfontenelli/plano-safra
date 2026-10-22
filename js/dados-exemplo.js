/*
 * Dados de exemplo do protótipo.
 * Edite à vontade: tudo fica só na memória do navegador e se perde ao fechar a página.
 */
window.DADOS = {
  // Usuário mostrado no rodapé do menu lateral
  usuario: {
    nome: 'Unisystem',
    iniciais: 'U'
  },

  // Listas do modal "Criar Plano de Safra". Safras novas criadas no modal entram aqui.
  safras:   ['24/25', '25/26'],
  // Cadastro de safras (como no sistema). A safra começa em 01/09 de um ano e termina em 31/08 do ano seguinte;
  // o Ano Agrícola ("Ano Saldo" no sistema) é o ano do início e junta as safras e safrinhas daquele ano.
  // Safrinha ("27/27": plantio e colheita no mesmo ano) entra no ano agrícola anterior, junto com a safra 26/27,
  // e tem as mesmas datas dela. Safra criada no modal (só com o nome) segue a mesma regra (Util.cadastroSafra).
  // dolar: moeda padrão da safra; valor: cotação padrão (vazio = não informado)
  cadastroSafras: [
    { codigo: 9,  nome: '24/25', descricao: '2024/2025', apelido: '2024', inicio: '2024-09-01', fim: '2025-08-31', anoAgricola: 2024, codigoIntegracao: '', dolar: 'DOLAR', valor: null },
    { codigo: 10, nome: '25/26', descricao: '2025/2026', apelido: '2025', inicio: '2025-09-01', fim: '2026-08-31', anoAgricola: 2025, codigoIntegracao: '', dolar: 'DOLAR', valor: null },
    { codigo: 12, nome: '26/26', descricao: '2026/2026', apelido: '2026', inicio: '2025-09-01', fim: '2026-08-31', anoAgricola: 2025, codigoIntegracao: '', dolar: 'DOLAR', valor: null },
    { codigo: 11, nome: '26/27', descricao: '2026/2027', apelido: '2026', inicio: '2026-09-01', fim: '2027-08-31', anoAgricola: 2026, codigoIntegracao: '', dolar: 'DOLAR', valor: null },
    { codigo: 13, nome: '27/27', descricao: '2027/2027', apelido: '2027', inicio: '2026-09-01', fim: '2027-08-31', anoAgricola: 2026, codigoIntegracao: '', dolar: 'DOLAR', valor: null },
    { codigo: 14, nome: '27/28', descricao: '2027/2028', apelido: '2027', inicio: '2027-09-01', fim: '2028-08-31', anoAgricola: 2027, codigoIntegracao: '', dolar: 'DOLAR', valor: null }
  ],
  empresas: ['Empresa A', 'Empresa B', 'Empresa C'],
  // Atividade produtiva. Por enquanto só Agricultura (soja); as outras aparecem como "Em breve"
  atividades: ['Agricultura', 'Pecuária', 'Silvicultura'],
  atividadesEmBreve: ['Pecuária', 'Silvicultura'],
  fazendas: ['São José', 'Boa Vista', 'Santa Clara', 'Primavera'],
  // Fazendas de cada empresa (exemplo, para o Painel da Visão Geral: "Sem plano" e área total). Ajuste à vontade.
  fazendasPorEmpresa: {
    'Empresa A': ['São José', 'Santa Clara'],
    'Empresa B': ['Boa Vista'],
    'Empresa C': ['Primavera']
  },
  // Culturas que o Criar Plano oferece
  culturas: ['Soja', 'Milho'],
  // Culturas que aparecem nos planos (os de exemplo têm milho safrinha), para os filtros
  culturasPlanos: ['Soja', 'Milho'],

  // Orçamento de Insumos: PTAX de referência (R$ por US$ 1,00) e a estimativa de comercialização por cultura.
  // A unidade de venda vem da cultura (soja e milho em saca, algodão em arroba). Valores iniciais de exemplo.
  ptaxReferencia: 5.2,
  comercializacao: {
    'Soja':    { unidade: 'sc', moeda: 'US$', preco: 23, produtividade: 65 },
    'Milho':   { unidade: 'sc', moeda: 'R$', preco: 55, produtividade: 110 },
    'Algodão': { unidade: '@' }
  },

  // Talhões por fazenda (área em ha). A tela de Operações mostra todos os talhões da fazenda.
  talhoes: {
    'São José': [
      { nome: 'T01', area: 120 }, { nome: 'T02', area: 85 },  { nome: 'T03', area: 100 },
      { nome: 'T04', area: 70 },  { nome: 'T05', area: 95 },  { nome: 'T06', area: 130 },
      { nome: 'T07', area: 110 }, { nome: 'T08', area: 75 },  { nome: 'T09', area: 140 },
      { nome: 'T10', area: 90 },  { nome: 'T11', area: 65 },  { nome: 'T12', area: 105 }
    ],
    'Santa Clara': [
      { nome: 'T01', area: 110 }, { nome: 'T02', area: 95 },  { nome: 'T03', area: 140 },
      { nome: 'T04', area: 80 },  { nome: 'T05', area: 125 }, { nome: 'T06', area: 60 },
      { nome: 'T07', area: 135 }, { nome: 'T08', area: 100 }
    ],
    'Boa Vista': [
      { nome: 'T01', area: 132 }, { nome: 'T02', area: 98 },  { nome: 'T03', area: 145 },
      { nome: 'T04', area: 76 },  { nome: 'T05', area: 120 }, { nome: 'T06', area: 88 },
      { nome: 'T07', area: 64 },  { nome: 'T08', area: 110 }, { nome: 'T09', area: 93 },
      { nome: 'T10', area: 57 }
    ],
    'Primavera': [
      { nome: 'T01', area: 150 }, { nome: 'T02', area: 115 }, { nome: 'T03', area: 82 },
      { nome: 'T04', area: 128 }, { nome: 'T05', area: 69 },  { nome: 'T06', area: 104 }
    ]
  },

  // Cadastro de variedades (exemplo), por cultura, para a região das fazendas (médio-norte de Mato Grosso,
  // Sorriso/Sinop) e a safra do plano. Valores próximos da realidade, a partir de referências públicas
  // (consultadas em 07/10/2026):
  //  - TMG 2383 IPRO: grupo de maturação 8.3; em Sorriso, ciclo de 116 dias e 220 mil plantas/ha
  //    (tmg.agr.br/cultivar/tmg-2383-ipro; attosementes.com.br/sementes-soja-2022/tmg-2383-ipro)
  //  - Cultivares de GM 7.6 a 8.1 em Sinop: ciclos de 107 a 118 dias (agrosolsementes.com.br, BMX Olimpo IPRO)
  //  - Demais: ciclo pelo grupo de maturação no médio-norte do MT; populações e janelas aproximadas
  //    (calendário de semeadura do MT após o vazio sanitário; plantio cedo abre a janela do milho safrinha).
  // gm: grupo de maturação · ciclo: dias da semeadura à colheita (null = não informado para a safra)
  // populacao: recomendada, mil plantas/ha [mínima, máxima] · janela: recomendada, [início, fim] em 'MM-DD'
  // Pré-cadastros feitos na tela de Operações (grupo Plantio) entram aqui, sem recomendação.
  variedades: [
    { cultura: 'Soja', nome: 'BMX Foco IPRO',   gm: 7.4, ciclo: 104, populacao: [260, 320], janela: ['09-16', '10-31'] },
    { cultura: 'Soja', nome: 'NS 7709 IPRO',    gm: 7.7, ciclo: 108, populacao: [240, 300], janela: ['09-16', '10-31'] },
    { cultura: 'Soja', nome: 'BMX Olimpo IPRO', gm: 8.0, ciclo: 112, populacao: [220, 280], janela: ['09-20', '11-10'] },
    { cultura: 'Soja', nome: 'TMG 2383 IPRO',   gm: 8.3, ciclo: 116, populacao: [200, 240], janela: ['09-20', '11-10'] },
    { cultura: 'Soja', nome: 'M 8372 IPRO',     gm: 8.3, ciclo: 118, populacao: [200, 260], janela: ['09-25', '11-20'] },
    // Sem ciclo cadastrado para a safra: para testar "Informe o ciclo"
    { cultura: 'Soja', nome: 'TMG 7063 IPRO',   gm: 6.3, ciclo: null, populacao: [300, 360], janela: ['09-16', '10-20'] },
    // Milho safrinha (2ª safra) no médio-norte do MT: plantio logo depois da colheita da soja, de janeiro até o
    // começo de março (depois disso, a falta de chuva no fim do ciclo derruba a produtividade); colheita de
    // maio a julho. Híbridos precoces, 120 a 135 dias da semeadura à colheita; 60 a 70 mil plantas/ha.
    // Valores aproximados para o protótipo (referências públicas de Embrapa, Imea e catálogos das empresas): conferir.
    { cultura: 'Milho', nome: 'DKB 360 PRO3',  ciclo: 125, populacao: [60, 68], janela: ['01-01', '03-05'] },
    { cultura: 'Milho', nome: 'AG 8700 PRO3',  ciclo: 130, populacao: [60, 66], janela: ['01-01', '03-01'] },
    { cultura: 'Milho', nome: 'P3707VYH',      ciclo: 128, populacao: [62, 70], janela: ['01-01', '03-05'] },
    { cultura: 'Milho', nome: 'FS 575 PWU',    ciclo: 132, populacao: [58, 65], janela: ['01-01', '02-28'] }
  ],

  // Histórico por talhão (últimas 3 safras de soja): [safra, variedade, produtividade (sc/ha), chuva no ciclo (mm)].
  // Próximo da realidade do médio-norte do MT (Conab): 23/24 teve seca e calor, 3.179 kg/ha (≈ 53 sc/ha);
  // 24/25, 3.700 kg/ha (≈ 62 sc/ha). Chuva em Sinop: ≈ 1.975 mm/ano; out 151, jan 310, fev 289 mm.
  // 25/26 é ilustrativa. Valores gerados por talhão; troque por reais se quiser.
  historico: (function () {
    const safras = [
      // [safra, produtividade base (sc/ha), chuva base no ciclo (mm), variedades usadas]
      ['23/24', 53, 760, ['BMX Olimpo IPRO', 'TMG 2383 IPRO', 'NS 7709 IPRO']],
      ['24/25', 62, 1050, ['TMG 2383 IPRO', 'BMX Foco IPRO', 'BMX Olimpo IPRO']],
      ['25/26', 63, 980, ['M 8372 IPRO', 'BMX Olimpo IPRO', 'NS 7709 IPRO']]
    ];
    const porFazenda = { 'São José': 12, 'Santa Clara': 8, 'Boa Vista': 10, 'Primavera': 6 };
    const h = {};
    Object.entries(porFazenda).forEach(([fazenda, n], f) => {
      h[fazenda] = {};
      for (let i = 1; i <= n; i++) {
        const t = `T${String(i).padStart(2, '0')}`;
        // Variação de cada talhão (solo, relevo): de −4 a +4 sc/ha e de −50 a +50 mm
        h[fazenda][t] = safras.map(([safra, prod, chuva, vars], k) => [
          safra, vars[(i + f + k) % vars.length],
          prod + ((i * 7 + k * 3 + f) % 9) - 4,
          chuva + ((i * 13 + k * 17 + f * 5) % 101) - 50
        ]);
      }
    });
    return h;
  })(),

  // Desenho dos talhões (fictício) no médio-norte de Mato Grosso, perto de Sorriso, para a visão Mapa.
  // Cada fazenda: origem [lat, lng], giro (graus), profundidade dos talhões (m) e as linhas de talhões.
  // Os polígonos são gerados a partir da área de cada talhão (em "talhoes"), então a área do desenho é a mesma.
  geometriaFazendas: {
    'São José':    { origem: [-12.5520, -55.8790], giro: 7,  profundidade: 1000, inclinacao: 0.10,
                     linhas: [['T01', 'T02', 'T03', 'T04'], ['T05', 'T06', 'T07', 'T08'], ['T09', 'T10', 'T11', 'T12']] },
    'Santa Clara': { origem: [-12.6420, -55.7480], giro: -4, profundidade: 1100, inclinacao: -0.08,
                     linhas: [['T01', 'T02', 'T03', 'T04'], ['T05', 'T06', 'T07', 'T08']] },
    'Boa Vista':   { origem: [-12.4980, -55.6920], giro: 3,  profundidade: 1050, inclinacao: 0.06,
                     linhas: [['T01', 'T02', 'T03', 'T04', 'T05'], ['T06', 'T07', 'T08', 'T09', 'T10']] },
    'Primavera':   { origem: [-12.7150, -55.8120], giro: -6, profundidade: 1150, inclinacao: 0.05,
                     linhas: [['T01', 'T02', 'T03'], ['T04', 'T05', 'T06']] }
  },

  // Cadastro de defensivos (exemplo). Pré-cadastros feitos na tela de Operações entram aqui.
  // unidade: L, mL, kg, g ou t (a dose é sempre por hectare)
  defensivos: [
    // Fertilidade (corretivos e fertilizantes), soja. fertilidade: true = só aparece no grupo Fertilidade.
    // classe = tipo do produto; principioAtivo = matéria-prima (a fonte do nutriente: faz o papel do princípio
    // ativo dos defensivos e ajuda a achar o produto); garantia = teores, mostrados na busca. Teores típicos
    // de mercado e da legislação de fertilizantes (MAPA); conferir com o fornecedor.
    { fertilidade: true, classe: 'Corretivo',      produto: 'Calcário dolomítico PRNT 85%', principioAtivo: 'Calcário dolomítico', garantia: 'CaO 30% + MgO 14%', unidade: 't' },
    { fertilidade: true, classe: 'Corretivo',      produto: 'Calcário calcítico PRNT 85%',  principioAtivo: 'Calcário calcítico',  garantia: 'CaO 45%',           unidade: 't' },
    { fertilidade: true, classe: 'Condicionador',  produto: 'Gesso agrícola',               principioAtivo: 'Gesso (sulfato de cálcio)', garantia: 'Ca 17% + S 14%', unidade: 't' },
    { fertilidade: true, classe: 'Fosfatado',      produto: 'MAP 11-52-00',                 principioAtivo: 'MAP',                 garantia: 'N 11% + P₂O₅ 52%', unidade: 'kg' },
    { fertilidade: true, classe: 'Fosfatado',      produto: 'Superfosfato simples 18%',     principioAtivo: 'Superfosfato simples', garantia: 'P₂O₅ 18% + Ca 16% + S 10%', unidade: 'kg' },
    { fertilidade: true, classe: 'Fosfatado',      produto: 'Superfosfato triplo 41%',      principioAtivo: 'Superfosfato triplo', garantia: 'P₂O₅ 41% + Ca 10%', unidade: 'kg' },
    { fertilidade: true, classe: 'Potássico',      produto: 'KCl 00-00-60',                 principioAtivo: 'Cloreto de potássio', garantia: 'K₂O 60%',           unidade: 'kg' },
    { fertilidade: true, classe: 'Formulado NPK',  produto: 'Formulado 02-20-18',           principioAtivo: 'MAP + Cloreto de potássio', garantia: 'N 2% + P₂O₅ 20% + K₂O 18%', unidade: 'kg' },
    { fertilidade: true, classe: 'Formulado NPK',  produto: 'Formulado 00-20-20',           principioAtivo: 'Superfosfato simples + Cloreto de potássio', garantia: 'P₂O₅ 20% + K₂O 20%', unidade: 'kg' },
    { fertilidade: true, classe: 'Micronutriente', produto: 'FTE BR-12',                    principioAtivo: 'Fritas (FTE)',        garantia: 'Zn 9% + B 1,8% + Mn 2% + Cu 0,8%', unidade: 'kg' },
    // Do plano de fertilidade de um cliente (os que já existem acima — calcário calcítico e dolomítico, MAP e
    // KCl — não foram repetidos). A composição destas marcas não foi encontrada em fonte pública: a matéria-prima
    // vem só do nome quando ele é claro; garantia, tipo e unidade (L para os foliares) A CONFERIR com o cliente.
    { fertilidade: true, classe: 'Corretivo',      produto: 'Calcário dolomítico filler',   principioAtivo: 'Calcário dolomítico', unidade: 't' },
    { fertilidade: true, classe: 'Fosfatado',      produto: 'Adubo 00-23-00',               principioAtivo: '',                    garantia: 'P₂O₅ 23%', unidade: 'kg' },
    { fertilidade: true, classe: 'Micronutriente', produto: 'Complex Dualbor',              principioAtivo: 'Boro',                unidade: 'L' },
    { fertilidade: true, classe: '',               produto: 'Midas +63S + 3B',              principioAtivo: '',                    unidade: 'kg' },
    { fertilidade: true, classe: '',               produto: 'Support',                      principioAtivo: '',                    unidade: 'L' },
    { fertilidade: true, classe: 'Micronutriente', produto: 'Borosol K',                    principioAtivo: 'Boro',                unidade: 'L' },
    { fertilidade: true, classe: '',               produto: 'Vigora',                       principioAtivo: '',                    unidade: 'L' },
    { fertilidade: true, classe: 'Micronutriente', produto: 'Compat Copper',                principioAtivo: 'Cobre',               unidade: 'L' },
    { fertilidade: true, classe: '',               produto: 'Compat Pro',                   principioAtivo: '',                    unidade: 'L' },
    { fertilidade: true, classe: 'Micronutriente', produto: 'Nutre Boro',                   principioAtivo: 'Boro',                unidade: 'L' },
    { fertilidade: true, classe: '',               produto: 'Tonus',                        principioAtivo: '',                    unidade: 'L' },
    { fertilidade: true, classe: 'Micronutriente', produto: 'Nutre Fer',                    principioAtivo: 'Ferro',               unidade: 'L' },
    { fertilidade: true, classe: 'Micronutriente', produto: 'Nutre Cobre',                  principioAtivo: 'Cobre',               unidade: 'L' },
    { fertilidade: true, classe: 'Micronutriente', produto: 'Nutre Zinco',                  principioAtivo: 'Zinco',               unidade: 'L' },
    { classe: 'Fungicida',  produto: 'Fox Xpro',            principioAtivo: 'Bixafen + Protioconazol + Trifloxistrobina', unidade: 'L' },
    { classe: 'Fungicida',  produto: 'Fox',                 principioAtivo: 'Trifloxistrobina + Protioconazol',           unidade: 'L' },
    { classe: 'Fungicida',  produto: 'Priori Xtra',         principioAtivo: 'Azoxistrobina + Ciproconazol',               unidade: 'L' },
    { classe: 'Fungicida',  produto: 'Aproach Prima',       principioAtivo: 'Picoxistrobina + Ciproconazol',              unidade: 'L' },
    { classe: 'Fungicida',  produto: 'Elatus',              principioAtivo: 'Azoxistrobina + Benzovindiflupir',           unidade: 'kg' },
    { classe: 'Fungicida',  produto: 'Cypress',             principioAtivo: 'Difenoconazol + Ciproconazol',               unidade: 'L' },
    { classe: 'Fungicida',  produto: 'Unizeb Gold',         principioAtivo: 'Mancozebe',                                  unidade: 'kg' },
    { classe: 'Inseticida', produto: 'Engeo Pleno',         principioAtivo: 'Tiametoxam + Lambda-cialotrina',             unidade: 'L' },
    { classe: 'Inseticida', produto: 'Ampligo',             principioAtivo: 'Clorantraniliprole + Lambda-cialotrina',     unidade: 'L' },
    { classe: 'Inseticida', produto: 'Premio',              principioAtivo: 'Clorantraniliprole',                         unidade: 'L' },
    { classe: 'Inseticida', produto: 'Connect',             principioAtivo: 'Imidacloprido + Beta-ciflutrina',            unidade: 'L' },
    { classe: 'Inseticida', produto: 'Orthene 750 BR',      principioAtivo: 'Acefato',                                    unidade: 'kg' },
    { classe: 'Herbicida',  produto: 'Roundup Original DI', principioAtivo: 'Glifosato',                                  unidade: 'L' },
    { classe: 'Herbicida',  produto: 'Roundup WG',          principioAtivo: 'Glifosato',                                  unidade: 'kg' },
    { classe: 'Herbicida',  produto: 'Zapp QI 620',         principioAtivo: 'Glifosato',                                  unidade: 'L' },
    { classe: 'Herbicida',  produto: 'Finale',              principioAtivo: 'Glufosinato de amônio',                      unidade: 'L' },
    { classe: 'Herbicida',  produto: 'Heat',                principioAtivo: 'Saflufenacil',                               unidade: 'g' },
    { classe: 'Herbicida',  produto: 'Dual Gold',           principioAtivo: 'S-metolacloro',                              unidade: 'L' },
    { classe: 'Herbicida',  produto: 'Spider',              principioAtivo: 'Diclosulam',                                 unidade: 'g' },
    { classe: 'Herbicida',  produto: 'Select 240 EC',       principioAtivo: 'Cletodim',                                   unidade: 'L' },
    { classe: 'Herbicida',  produto: 'DMA 806 BR',          principioAtivo: '2,4-D',                                      unidade: 'L' },
    // Milho (exemplos para o plano de safrinha; conferir registro e dose na bula)
    { fertilidade: true, classe: 'Nitrogenado', produto: 'Ureia 45%',      principioAtivo: 'Ureia',               garantia: 'N 45%', unidade: 'kg' },
    { classe: 'Herbicida',  produto: 'Primóleo',            principioAtivo: 'Atrazina',                                   unidade: 'L' },
    { classe: 'Herbicida',  produto: 'Callisto',            principioAtivo: 'Mesotriona',                                 unidade: 'L' },
    // Tratamento de semente (on farm), biológicos, adjuvantes e óleos: para o Orçamento ter todos os grupos de insumo.
    // Doses por hectare (TS: ≈ 60 kg de semente de soja por ha). Exemplos; conferir registro e dose na bula.
    { classe: 'Tratamento de semente', produto: 'Standak Top',      principioAtivo: 'Fipronil + Piraclostrobina + Tiofanato-metílico', unidade: 'L' },
    { classe: 'Tratamento de semente', produto: 'Cruiser 350 FS',   principioAtivo: 'Tiametoxam',                     unidade: 'L' },
    { classe: 'Biológico',  produto: 'Masterfix L Soja',    principioAtivo: 'Bradyrhizobium japonicum (inoculante)',      unidade: 'L' },
    { classe: 'Biológico',  produto: 'Trichodermil SC',     principioAtivo: 'Trichoderma harzianum',                      unidade: 'L' },
    { classe: 'Biológico',  produto: 'Dipel WG',            principioAtivo: 'Bacillus thuringiensis',                     unidade: 'kg' },
    { classe: 'Adjuvante',  produto: 'Agral',               principioAtivo: 'Nonilfenol etoxilado (espalhante adesivo)',  unidade: 'L' },
    { classe: 'Adjuvante',  produto: 'LI 700',              principioAtivo: 'Lecitina + ácido propiônico (acidificante)', unidade: 'L' },
    { classe: 'Óleo',       produto: 'Assist',              principioAtivo: 'Óleo mineral',                               unidade: 'L' },
    { classe: 'Óleo',       produto: 'Áureo',               principioAtivo: 'Óleo vegetal (éster metílico de soja)',      unidade: 'L' }
  ],

  // ----- Orçamento de Insumos -----
  // Grupos de insumo (filtro Insumos e Custo por tipo de insumo), pela classe do produto. Fertilidade sem classe: Fertilizantes.
  gruposInsumo: ['Fertilizantes', 'Defensivos', 'Sementes', 'Corretivos', 'Tratamento de semente', 'Adjuvantes', 'Biológicos', 'Óleo'],
  grupoInsumoPorClasse: {
    'Corretivo': 'Corretivos', 'Condicionador': 'Corretivos',
    'Fosfatado': 'Fertilizantes', 'Potássico': 'Fertilizantes', 'Formulado NPK': 'Fertilizantes',
    'Micronutriente': 'Fertilizantes', 'Nitrogenado': 'Fertilizantes',
    'Herbicida': 'Defensivos', 'Fungicida': 'Defensivos', 'Inseticida': 'Defensivos',
    'Tratamento de semente': 'Tratamento de semente', 'Biológico': 'Biológicos', 'Adjuvante': 'Adjuvantes', 'Óleo': 'Óleo'
  },

  // Valor unitário de cada insumo (base histórica de compras: aqui, estimativas para o médio-norte do MT, safra 26/27,
  // produto posto na fazenda). [moeda, valor por unidade do cadastro]. Como no cliente: importados em US$ (fertilizantes,
  // fungicidas, inseticidas), nacionais em R$. Referências consultadas em 16/10/2026 (valores aproximados, a conferir):
  //  - Fertilizantes CFR Brasil (Itaú BBA, out/26): ureia US$ 470/t, MAP US$ 830/t, KCl US$ 355/t; + frete e margem até o MT
  //  - Calcário dolomítico R$ 254/t e gesso R$ 273/t em SP (FAESP, mai/26); no MT, perto das jazidas, menos
  //  - Glifosato: mediana R$ 25,80/L na safra 26/27 (Agrolink); Fox Xpro ≈ R$ 260/L em anúncios
  //  - Custeio da soja MT 26/27 ≈ R$ 4.320/ha, fertilizantes e corretivos ≈ R$ 2.070/ha (Imea): os planos ficam nessa faixa
  precosInsumos: {
    // Corretivos
    'Calcário dolomítico PRNT 85%': ['R$', 185], 'Calcário calcítico PRNT 85%': ['R$', 195],
    'Calcário dolomítico filler': ['R$', 240], 'Gesso agrícola': ['R$', 290],
    // Fertilizantes (US$ por kg)
    'MAP 11-52-00': ['US$', 0.92], 'Superfosfato simples 18%': ['US$', 0.34], 'Superfosfato triplo 41%': ['US$', 0.74],
    'KCl 00-00-60': ['US$', 0.43], 'Formulado 02-20-18': ['US$', 0.63], 'Formulado 00-20-20': ['US$', 0.56],
    'Adubo 00-23-00': ['US$', 0.48], 'Ureia 45%': ['US$', 0.55], 'FTE BR-12': ['R$', 6.8],
    // Fertilizantes foliares (R$ por L ou kg)
    'Complex Dualbor': ['R$', 48], 'Midas +63S + 3B': ['R$', 4.2], 'Support': ['R$', 62], 'Borosol K': ['R$', 44],
    'Vigora': ['R$', 85], 'Compat Copper': ['R$', 70], 'Compat Pro': ['R$', 58], 'Nutre Boro': ['R$', 39], 'Tonus': ['R$', 66],
    'Nutre Fer': ['R$', 42], 'Nutre Cobre': ['R$', 47], 'Nutre Zinco': ['R$', 41],
    // Fungicidas (US$)
    'Fox Xpro': ['US$', 50], 'Fox': ['US$', 34], 'Priori Xtra': ['US$', 38], 'Aproach Prima': ['US$', 35],
    'Elatus': ['US$', 118], 'Cypress': ['US$', 29], 'Unizeb Gold': ['R$', 36],
    // Inseticidas (US$)
    'Engeo Pleno': ['US$', 46], 'Ampligo': ['US$', 68], 'Premio': ['US$', 145], 'Connect': ['US$', 17], 'Orthene 750 BR': ['R$', 92],
    // Herbicidas (R$; g = por grama)
    'Roundup Original DI': ['R$', 26], 'Roundup WG': ['R$', 44], 'Zapp QI 620': ['R$', 30], 'Finale': ['R$', 47],
    'Heat': ['R$', 1.15], 'Dual Gold': ['R$', 72], 'Spider': ['R$', 3.9], 'Select 240 EC': ['R$', 60],
    'DMA 806 BR': ['R$', 31], 'Primóleo': ['R$', 27], 'Callisto': ['R$', 285],
    // Tratamento de semente, biológicos, adjuvantes e óleos
    'Standak Top': ['US$', 92], 'Cruiser 350 FS': ['US$', 68],
    'Masterfix L Soja': ['R$', 48], 'Trichodermil SC': ['R$', 75], 'Dipel WG': ['R$', 155],
    'Agral': ['R$', 29], 'LI 700': ['R$', 54], 'Assist': ['R$', 14], 'Áureo': ['R$', 23]
  },

  // Sementes: embalagem de compra por cultura e valor por embalagem de cada variedade (R$).
  // Soja em bag de 5 milhões de sementes; milho em saco de 60 mil sementes. Estimativas para 26/27, a conferir:
  // soja ≈ R$ 450/ha e milho safrinha ≈ R$ 1.300/ha de semente, nas populações dos planos.
  embalagemSemente: {
    'Soja': { nome: 'bag', sementes: 5000000, texto: 'bag (5 milhões de sementes)' },
    'Milho': { nome: 'saco', sementes: 60000, texto: 'saco (60 mil sementes)' }
  },
  precosSementes: {
    'BMX Foco IPRO': 7400, 'NS 7709 IPRO': 7100, 'BMX Olimpo IPRO': 7600, 'TMG 2383 IPRO': 6800,
    'M 8372 IPRO': 7300, 'TMG 7063 IPRO': 6500,
    'DKB 360 PRO3': 1180, 'AG 8700 PRO3': 1090, 'P3707VYH': 1240, 'FS 575 PWU': 980
  },

  // Estoque de cada insumo em cada fazenda, na unidade do cadastro (sementes: na embalagem). A comprar = necessidade
  // − estoque, fazenda a fazenda (nunca negativo). Exemplo: sobra da safra passada e compras antecipadas.
  estoqueInsumos: {
    'Santa Clara': {
      'Calcário dolomítico PRNT 85%': 900, 'KCl 00-00-60': 60000, 'MAP 11-52-00': 80000, 'Ureia 45%': 40000,
      'Roundup Original DI': 2400, 'Finale': 800, 'Fox Xpro': 120, 'Engeo Pleno': 150, 'Priori Xtra': 260,
      'Connect': 400, 'Assist': 300, 'Masterfix L Soja': 250,
      'BMX Foco IPRO': 4, 'TMG 2383 IPRO': 6, 'DKB 360 PRO3': 120
    },
    'Boa Vista': {
      'Calcário calcítico PRNT 85%': 400, 'Formulado 02-20-18': 150000, 'Zapp QI 620': 1500, 'Roundup WG': 600,
      'Unizeb Gold': 900, 'Agral': 60, 'Áureo': 200, 'Standak Top': 40,
      'NS 7709 IPRO': 10, 'AG 8700 PRO3': 200
    },
    'Primavera': {
      'Gesso agrícola': 500, 'Formulado 00-20-20': 90000, 'Roundup Original DI': 1200, 'DMA 806 BR': 300,
      'Select 240 EC': 150, 'Cypress': 100, 'Borosol K': 300,
      'BMX Olimpo IPRO': 8
    }
  },

  // Estádios fenológicos da soja (exemplo; depois virão do menu Cadastros)
  fenologia: ['VE', 'VC', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'],

  // Tipos de grupo de operação (definem as informações mínimas pedidas no grupo)
  // Fertilidade junta corretivos e fertilizantes. O Tratamento de sementes (TSI) saiu por enquanto: rascunhos/tsi/
  tiposGrupo: ['Sementes', 'Defensivos', 'Fertilidade', 'Colheita'],

  // Modelo de operações (levantado com clientes). Usado pelo "Usar modelo" e pelos planos de exemplo.
  // prazo: prazo para encerramento da OS, em dias (DECISOES 4.3: preparo, calcário, fósforo, 1ª dessecação e
  // 1ª metade do K = 5; plantio 3); sem prazo, vale o padrão do grupo (2 dias; Plantio 3). Colheita: 10.
  // Por enquanto, para os testes com usuários, os grupos Plantio, Defensivo e Fertilidade (os outros grupos
  // do modelo — Preparo do solo e Colheita — estão no histórico do git).
  // Fertilidade (soja no Cerrado/MT): calagem 60 a 90 dias antes do plantio (pH alvo 5,5–6,0); gessagem;
  // potássio a lanço antecipado (7 a 30 dias antes) e em cobertura; fósforo (MAP) no sulco de plantio.
  // K₂O ≈ 20 kg por tonelada de soja produzida (MT/MS). Fontes: Embrapa (Circular Técnica 33, Documentos
  // 458/2023, Sistema soja-milho) e ensaios no MT (Rev. Cerrado Agrociências/UNIPAM; Agrarian/UFGD).
  modeloOperacoes: [
    { nome: 'Plantio', tipo: 'Sementes', operacoes: [
      { nome: 'Plantio', dap: 0, prazo: 3 }
    ] },
    // Fenologia pré-preenchida (DAP positivo), pela literatura para soja no MT (cultivares de 104 a 118 dias):
    // herbicida pós-emergente em V2 e V4 (glifosato até V4); fungicida preventivo da ferrugem a partir de R1, com
    // 14 a 21 dias entre aplicações (R3, R4, R5); dessecação pré-colheita em R7 (Embrapa; Rev. Bras. Herbicidas).
    // DAP × estádio conferido pela duração média dos estádios (Fehr & Caviness) num ciclo de ~110 dias:
    // R1 ~40, R3 ~50, R4 ~60, R5 ~70, R6 ~85, R7 ~100 (fungicidas ajustados com a usuária: 3ª em R4, 4ª em R5).
    // Pré-emergente: aplicado antes da emergência, sem estádio (fica sem fenologia).
    { nome: 'Defensivo', tipo: 'Defensivos', operacoes: [
      { nome: '1ª Dessecação: pré-plantio', dap: -15, prazo: 5 },
      { nome: '2ª Dessecação: pré-plantio', dap: -5 },
      { nome: 'Pré-emergente', dap: 1 },
      { nome: '1ª Pós-emergente', dap: 15, fenologia: 'V2' },
      { nome: '2ª Pós-emergente', dap: 25, fenologia: 'V4' },
      { nome: '1ª Fungicida', dap: 40, fenologia: 'R1' },
      { nome: '2ª Fungicida', dap: 55, fenologia: 'R3' },
      { nome: '3ª Fungicida', dap: 70, fenologia: 'R4' },
      { nome: '4ª Fungicida', dap: 85, fenologia: 'R5' },
      { nome: 'Desfolha', dap: 100, fenologia: 'R7' }
    ] },
    { nome: 'Fertilidade', tipo: 'Fertilidade', operacoes: [
      { nome: 'Calagem', dap: -90, prazo: 5 },
      { nome: 'Gessagem', dap: -60, prazo: 5 },
      { nome: '1ª Adubação potássica', dap: -15, prazo: 5 },
      { nome: 'Fosfatagem', dap: -10, prazo: 5 },
      { nome: 'Adubação de plantio', dap: 0 },
      // K em cobertura em V4 (antes do fechamento); foliar a partir de ~20 dias após a emergência (V4) e com 50 DAP (R3)
      { nome: '2ª Adubação potássica', dap: 25, fenologia: 'V4' },
      // Adubação foliar (micronutrientes: boro, cobre, zinco, ferro), como no plano de fertilidade do cliente
      { nome: '1ª Adubação foliar', dap: 25, fenologia: 'V4' },
      { nome: '2ª Adubação foliar', dap: 50, fenologia: 'R3' }
    ] },
    // Colheita: o DAP vem do ciclo da variedade (data de plantio + ciclo); fenologia Colheita; previsão de conclusão 10 dias
    { nome: 'Colheita', tipo: 'Colheita', operacoes: [
      { nome: 'Colheita', prazo: 10 }
    ] }
  ],

  // Modelos de operações das outras culturas (só para o plano de exemplo de safrinha, por enquanto).
  // DAP pela prática no médio-norte do MT; sem fenologia (o cadastro de estádios é o da soja).
  modelosCultura: {
    // Milho safrinha: as sementes já vêm tratadas (sem grupo TSI). Cigarrinha (Dalbulus maidis) no começo do
    // ciclo, cobertura nitrogenada em V4–V6 (≈ 25 DAP), lagarta-do-cartucho (sem fungicida no modelo).
    'Milho': [
      { nome: 'Plantio', tipo: 'Sementes', operacoes: [{ nome: 'Plantio', dap: 0, prazo: 3 }] },
      { nome: 'Defensivo', tipo: 'Defensivos', operacoes: [
        { nome: '1ª Inseticida: cigarrinha', dap: 7 },
        { nome: '2ª Inseticida: cigarrinha', dap: 15 },
        { nome: 'Herbicida pós-emergente', dap: 20 },
        { nome: 'Inseticida: lagarta-do-cartucho', dap: 30 }
      ] },
      { nome: 'Fertilidade', tipo: 'Fertilidade', operacoes: [
        { nome: 'Adubação de plantio', dap: 0 },
        { nome: 'Adubação potássica', dap: 20 },
        { nome: 'Cobertura nitrogenada', dap: 25 }
      ] },
      { nome: 'Colheita', tipo: 'Colheita', operacoes: [{ nome: 'Colheita', prazo: 10 }] }
    ]
  },

  // Planos de safra cadastrados. Começa vazio = menu "Plano de Safra" abre a Tela 01 (Primeiro uso).
  planos: [],

  // ----- Ordens de Serviço de exemplo (Central de Operações, Tela 08) -----
  // Operações com data planejada até esta data contam como já feitas (OS fechada), para o exemplo não encher de
  // atrasos antigos. As demais só têm OS se estiverem na lista abaixo.
  osFechadasAte: '2026-10-12',
  // Uma OS por operação (pelo nome) e talhões de um plano (fazenda + safra). status: 'recomendada' (ainda não abriu),
  // 'execucao' ou 'fechada'. abertura + prazo (dias) = data prevista de conclusão; fechamento: data em que a OS foi fechada.
  // executor: equipe que executa (no sistema, informado no modal Recomendar OS).
  // justificativa: motivo 'Atraso na recomendação' ou 'Atraso na execução', quem pediu (nome e perfil) e
  // respondida: false = aguardando resposta.
  ordensServico: [
    { numero: 1035, fazenda: 'Boa Vista', safra: '26/27', operacao: 'Pré-emergente', talhoes: ['T09'],
      status: 'fechada', abertura: '2026-10-10', prazo: 2, fechamento: '2026-10-12', executor: 'Equipe Ceta',
      justificativa: { motivo: 'Atraso na recomendação', data: '2026-10-12', solicitadaPor: { nome: 'Maria Gonçalves', perfil: 'Agrônomo corporativo' }, respondida: false } },
    { numero: 1038, fazenda: 'Boa Vista', safra: '26/27', operacao: '1ª Pós-emergente', talhoes: ['T04'],
      status: 'fechada', abertura: '2026-10-12', prazo: 2, fechamento: '2026-10-14', executor: 'Equipe Alpha',
      justificativa: { motivo: 'Atraso na recomendação', data: '2026-10-14', solicitadaPor: { nome: 'Maria Gonçalves', perfil: 'Agrônomo corporativo' }, respondida: false } },
    { numero: 1041, fazenda: 'Boa Vista', safra: '26/27', operacao: '2ª Pós-emergente', talhoes: ['T01', 'T02'],
      status: 'execucao', abertura: '2026-10-15', prazo: 2, executor: 'Equipe Beta',
      justificativa: { motivo: 'Atraso na execução', data: '2026-10-18', solicitadaPor: { nome: 'Carlos Menezes', perfil: 'Agrônomo da fazenda' }, respondida: false } },
    { numero: 1042, fazenda: 'Boa Vista', safra: '26/27', operacao: '1ª Adubação foliar', talhoes: ['T01', 'T02'],
      status: 'fechada', abertura: '2026-10-15', prazo: 2, fechamento: '2026-10-16', executor: 'Equipe Beta' },
    { numero: 1043, fazenda: 'Boa Vista', safra: '26/27', operacao: '1ª Pós-emergente', talhoes: ['T05', 'T06'],
      status: 'execucao', abertura: '2026-10-17', prazo: 2, executor: 'Equipe Ômega',
      justificativa: { motivo: 'Atraso na execução', data: '2026-10-20', solicitadaPor: { nome: 'Carlos Menezes', perfil: 'Agrônomo da fazenda' }, respondida: false } },
    { numero: 1044, fazenda: 'Boa Vista', safra: '26/27', operacao: '2ª Pós-emergente', talhoes: ['T07'],
      status: 'recomendada', abertura: '2026-10-22', prazo: 2, executor: 'Equipe Alpha' },
    { numero: 1045, fazenda: 'Boa Vista', safra: '26/27', operacao: '1ª Pós-emergente', talhoes: ['T08'],
      status: 'recomendada', abertura: '2026-10-23', prazo: 2, executor: 'Equipe Ceta' }
  ],
  // Justificativas pedidas na Central de Operações em operações ainda sem OS (planejadas com atraso): começa vazio
  justificativasOperacoes: [],
  // Executores das OS geradas para o exemplo (Central de Operações, Tela 09)
  executores: ['Equipe Alpha', 'Equipe Beta', 'Equipe Ceta', 'Equipe Ômega'],

  // ----- Data de referência do exemplo -----
  // O "hoje" para o qual as datas deste arquivo foram escritas: dentro da janela das fungicidas da soja 26/27, para a
  // página Aplicações ter aplicações executadas, pendentes e planejadas. Ao abrir o protótipo, todas as datas do
  // exemplo (plantio, versões, OS, justificativas) andam a diferença entre hoje e esta data, e hoje cai sempre no mesmo
  // ponto da safra. Os nomes das safras andam os anos agrícolas entre as duas datas (26/27 → 27/28) (js/app.js, ajustarCenario).
  dataReferencia: '2026-11-25',

  // ----- Monitoramento › Aplicações: dados SIMULADOS -----
  // Data executada = data de recomendação da OS (abertura): a da OS escrita acima, se houver; senão, a planejada + um
  // deslocamento em dias (para mais ou para menos). Só conta como executada se essa data já chegou (até hoje).
  // deslocamentos: usados em sequência quando o talhão não tem um deslocamento próprio para a operação.
  // talhoes['Fazenda safra'][talhão]: plantasM (estande medido no monitoramento, plantas por metro, número inteiro) e, por operação
  // (inclusive 'Plantio'), o deslocamento em dias; null = não executada (pendente, se a data planejada já passou).
  monitoramento: {
    deslocamentos: [0, 2, -1, 5, 1, -3, 0, 3, 7, -2, 1, 4],
    talhoes: {
      'Santa Clara 25/26': {
        T01: { plantasM: 13 }, T02: { plantasM: 13 }, T03: { plantasM: 12, '3ª Fungicida': 9 }, T04: { plantasM: 12 },
        T05: { plantasM: 10 }, T06: { plantasM: 12 }, T07: { plantasM: 11, '4ª Fungicida': -4 }, T08: { plantasM: 10 }
      },
      'Santa Clara 26/26': {
        T01: { plantasM: 3 }, T02: { plantasM: 3 }, T03: { plantasM: 3 }, T04: { plantasM: 3 },
        T05: { plantasM: 3 }, T06: { plantasM: 3 }, T07: { plantasM: 3 }, T08: { plantasM: 3 }
      },
      'Boa Vista 26/27': {
        T01: { plantasM: 13, Plantio: 1 },
        T02: { plantasM: 13, Plantio: 0, '2ª Fungicida': null },
        T03: { plantasM: 11, Plantio: 3 },
        T04: { plantasM: 12, Plantio: -2, '1ª Fungicida': 6 },
        T05: { plantasM: 10, Plantio: 5 },
        T06: { plantasM: 11, Plantio: 2, '1ª Fungicida': null },
        T07: { plantasM: 14, Plantio: 0 },
        T08: { plantasM: 11, Plantio: -1 },
        T09: { plantasM: null, Plantio: 4 },
        T10: { plantasM: 14, Plantio: -3, '2ª Fungicida': -2 }
      }
    }
  },

  // Planos carregados ao abrir o protótipo: ano agrícola 2025, soja 25/26 e milho safrinha 26/26 da Santa Clara;
  // ano agrícola 2026, soja 26/27 e milho safrinha 27/27 da Boa Vista (publicados) e soja 26/27 da São José, em
  // construção: iniciado pelo "Usar modelo" (inicio: 'modelo'), com as operações do modelo e ainda sem planejamento.
  // A Primavera fica sem plano. "operacoes" detalha, por nome de operação do modelo: fenologia, produtos [nome, dose],
  // talhões que recebem e ajustes por talhão. Operações não listadas ficam sem recomendação e sem talhões.
  planosExemplo: [
    {
      safra: '25/26', empresa: 'Empresa A', atividade: 'Agricultura', fazenda: 'Santa Clara', cultura: 'Soja',
      // Versões: 0.1 publicada (registro inicial) e 0.2 publicada (sem versão em construção)
      versoes: { criadaEm: '2025-09-18T08:40', publicadaEm: '2025-09-25T17:05' },
      // PROVISÓRIO: valores digitados até existirem as telas de orçamento e premissas.
      // Custo ≈ R$ 3.150/ha; receita ≈ 63 sc/ha × R$ 122/sc (845 ha).
      custo: 2661750,
      receita: 6494670,
      atualizadoEm: '2025-09-25', atualizadoPor: 'Maria Gonçalves',
      operacoes: (function () {
        const todos = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08'];
        const op = (produtos, fenologia = '') => ({ fenologia, produtos, talhoes: todos });
        return {
          // Plantio: variedade, data de plantio e população planejada (mil plantas/ha) por talhão,
          // dentro da população recomendada de cada variedade; germinação em %, a mesma em todos os talhões
          // Fertilidade: calcário e base em todos; gesso só onde a análise de subsuperfície pediu (T01 a T04);
          // cobertura potássica só nos talhões mais arenosos (T05 a T08); T07 com dose maior de KCl
          'Calagem': op([['Calcário dolomítico PRNT 85%', 2]]),
          'Gessagem': { produtos: [['Gesso agrícola', 1.5]], talhoes: ['T01', 'T02', 'T03', 'T04'] },
          '1ª Adubação potássica': { produtos: [['KCl 00-00-60', 130]], talhoes: todos,
            ajustes: { T07: { doses: { 'KCl 00-00-60': 160 } } } },
          'Adubação de plantio': op([['MAP 11-52-00', 180]]),
          '2ª Adubação potássica': { fenologia: 'V4', produtos: [['KCl 00-00-60', 80]], talhoes: ['T05', 'T06', 'T07', 'T08'] },
          'Plantio': { germinacao: 95, plantio: [
            { talhao: 'T01', variedade: 'BMX Foco IPRO',   data: '2025-09-22', populacao: 300 },
            { talhao: 'T02', variedade: 'BMX Foco IPRO',   data: '2025-09-22', populacao: 300 },
            { talhao: 'T03', variedade: 'BMX Olimpo IPRO', data: '2025-09-28', populacao: 250 },
            { talhao: 'T04', variedade: 'BMX Olimpo IPRO', data: '2025-10-01', populacao: 250 },
            { talhao: 'T05', variedade: 'TMG 2383 IPRO',   data: '2025-10-05', populacao: 220 },
            { talhao: 'T06', variedade: 'NS 7709 IPRO',    data: '2025-09-25', populacao: 270 },
            { talhao: 'T07', variedade: 'M 8372 IPRO',     data: '2025-10-10', populacao: 230 },
            { talhao: 'T08', variedade: 'TMG 2383 IPRO',   data: '2025-10-08', populacao: 220 }
          ] },
          '1ª Dessecação: pré-plantio': op([['Roundup Original DI', 2.5], ['DMA 806 BR', 1.0]]),
          '2ª Dessecação: pré-plantio': op([['Finale', 2.0]]),
          // Pré-emergente: aplicado antes da emergência da planta, sem fenologia
          'Pré-emergente': op([['Dual Gold', 1.5]]),
          '1ª Pós-emergente': op([['Roundup Original DI', 2.0]], 'V2'),
          '2ª Pós-emergente':
            op([['Select 240 EC', 0.45], ['Engeo Pleno', 0.20], ['Unizeb Gold', 1.5]], 'V4'),
          // Tratamento de semente on farm e inoculação (operação extra no grupo Defensivo, no dia do plantio)
          'Tratamento de sementes': { grupo: 'Defensivo', dap: 0, produtos: [['Standak Top', 0.12], ['Masterfix L Soja', 0.30]], talhoes: todos },
          '1ª Fungicida': op([['Fox Xpro', 0.40], ['Engeo Pleno', 0.20], ['Áureo', 0.25]], 'R1'),
          '2ª Fungicida': op([['Priori Xtra', 0.30], ['Ampligo', 0.15], ['Assist', 0.50]], 'R3'),
          '3ª Fungicida': op([['Elatus', 0.20], ['Connect', 1.0]], 'R4'),
          '4ª Fungicida': op([['Cypress', 0.30], ['Premio', 0.05]], 'R5'),
          'Desfolha': op([['Finale', 2.0]], 'R7')
        };
      })()
    },
    {
      // Milho safrinha na Santa Clara, depois da soja: cada talhão é plantado 3 dias depois da colheita prevista
      // da soja nele (plantio da soja + ciclo da variedade). Safrinha 26/26, no ano agrícola 2025 (o da soja 25/26)
      safra: '26/26', empresa: 'Empresa A', atividade: 'Agricultura', fazenda: 'Santa Clara', cultura: 'Milho', ciclo: 'Safrinha',
      modelo: 'Milho',
      versoes: { criadaEm: '2025-09-28T10:20', publicadaEm: '2025-10-06T16:40' },
      custo: null, receita: null,
      atualizadoEm: '2025-10-06', atualizadoPor: 'Maria Gonçalves',
      operacoes: (function () {
        const todos = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08'];
        const op = (produtos) => ({ produtos, talhoes: todos });
        return {
          'Plantio': { germinacao: 95, plantio: [
            { talhao: 'T01', variedade: 'DKB 360 PRO3', data: '2026-01-07', populacao: 64 },
            { talhao: 'T02', variedade: 'DKB 360 PRO3', data: '2026-01-07', populacao: 64 },
            { talhao: 'T06', variedade: 'P3707VYH',     data: '2026-01-14', populacao: 66 },
            { talhao: 'T03', variedade: 'AG 8700 PRO3', data: '2026-01-21', populacao: 62 },
            { talhao: 'T04', variedade: 'AG 8700 PRO3', data: '2026-01-24', populacao: 62 },
            { talhao: 'T05', variedade: 'P3707VYH',     data: '2026-02-01', populacao: 66 },
            { talhao: 'T08', variedade: 'FS 575 PWU',   data: '2026-02-04', populacao: 60 },
            { talhao: 'T07', variedade: 'FS 575 PWU',   data: '2026-02-08', populacao: 60 }
          ] },
          'Adubação de plantio': op([['MAP 11-52-00', 120]]),
          'Adubação potássica': op([['KCl 00-00-60', 80]]),
          'Cobertura nitrogenada': op([['Ureia 45%', 150]]),
          '1ª Inseticida: cigarrinha': op([['Engeo Pleno', 0.25]]),
          '2ª Inseticida: cigarrinha': op([['Connect', 1.0]]),
          'Herbicida pós-emergente': op([['Primóleo', 3.0], ['Callisto', 0.3]]),
          'Inseticida: lagarta-do-cartucho': op([['Premio', 0.10]])
        };
      })()
    },
    {
      // Soja 26/27 da Boa Vista (Empresa B): solo mais arenoso, calcário só em metade dos talhões, formulado no plantio
      safra: '26/27', empresa: 'Empresa B', atividade: 'Agricultura', fazenda: 'Boa Vista', cultura: 'Soja',
      versoes: { criadaEm: '2026-09-10T09:15', publicadaEm: '2026-09-22T15:30' },
      custo: null, receita: null,
      atualizadoEm: '2026-09-22', atualizadoPor: 'Carlos Menezes',
      operacoes: (function () {
        const todos = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10'];
        const op = (produtos, fenologia = '') => ({ fenologia, produtos, talhoes: todos });
        return {
          'Calagem': { produtos: [['Calcário calcítico PRNT 85%', 1.5]], talhoes: ['T01', 'T02', 'T03', 'T04', 'T05'] },
          '1ª Adubação potássica': op([['KCl 00-00-60', 150]]),
          'Adubação de plantio': op([['Formulado 02-20-18', 350]]),
          '1ª Adubação foliar': op([['Nutre Boro', 1.0], ['Compat Copper', 0.3]], 'V4'),
          'Plantio': { germinacao: 92, plantio: [
            { talhao: 'T01', variedade: 'NS 7709 IPRO',    data: '2026-09-20', populacao: 280 },
            { talhao: 'T02', variedade: 'NS 7709 IPRO',    data: '2026-09-21', populacao: 280 },
            // T03 e T08 com duas variedades cada (área de aplicação de cada uma, em ha)
            { talhao: 'T03', variedade: 'BMX Olimpo IPRO', data: '2026-09-26', populacao: 250, area: 85 },
            { talhao: 'T03', variedade: 'NS 7709 IPRO',    data: '2026-09-29', populacao: 270, area: 60 },
            { talhao: 'T04', variedade: 'BMX Olimpo IPRO', data: '2026-09-27', populacao: 250 },
            { talhao: 'T05', variedade: 'TMG 2383 IPRO',   data: '2026-10-02', populacao: 220 },
            { talhao: 'T06', variedade: 'TMG 2383 IPRO',   data: '2026-10-03', populacao: 220 },
            { talhao: 'T07', variedade: 'BMX Foco IPRO',   data: '2026-09-24', populacao: 300 },
            { talhao: 'T08', variedade: 'M 8372 IPRO',     data: '2026-10-08', populacao: 230, area: 70 },
            { talhao: 'T08', variedade: 'TMG 2383 IPRO',   data: '2026-10-10', populacao: 220, area: 40 },
            { talhao: 'T09', variedade: 'M 8372 IPRO',     data: '2026-10-09', populacao: 230 },
            { talhao: 'T10', variedade: 'BMX Foco IPRO',   data: '2026-09-25', populacao: 300 }
          ] },
          'Tratamento de sementes': { grupo: 'Defensivo', dap: 0, produtos: [['Standak Top', 0.12], ['Masterfix L Soja', 0.30], ['Trichodermil SC', 0.50]], talhoes: todos },
          '1ª Dessecação: pré-plantio': op([['Zapp QI 620', 2.5], ['Heat', 35], ['LI 700', 0.15]]),
          '2ª Dessecação: pré-plantio': op([['Finale', 2.0]]),
          'Pré-emergente': op([['Spider', 30]]),
          '1ª Pós-emergente': op([['Roundup WG', 1.5]], 'V2'),
          '2ª Pós-emergente': op([['Roundup Original DI', 2.0], ['Engeo Pleno', 0.20]], 'V4'),
          '1ª Fungicida': op([['Fox Xpro', 0.50], ['Áureo', 0.25]], 'R1'),
          '2ª Fungicida': op([['Priori Xtra', 0.30], ['Unizeb Gold', 1.5], ['Assist', 0.50]], 'R3'),
          '3ª Fungicida': op([['Elatus', 0.20], ['Premio', 0.05], ['Áureo', 0.25]], 'R4'),
          '4ª Fungicida': op([['Cypress', 0.30], ['Unizeb Gold', 1.5]], 'R5'),
          'Desfolha': op([['Finale', 2.0]], 'R7')
        };
      })()
    },
    {
      // Milho safrinha 27/27 da Boa Vista, depois da soja (plantio de janeiro a fevereiro)
      safra: '27/27', empresa: 'Empresa B', atividade: 'Agricultura', fazenda: 'Boa Vista', cultura: 'Milho', ciclo: 'Safrinha',
      modelo: 'Milho',
      versoes: { criadaEm: '2026-09-29T08:50', publicadaEm: '2026-10-08T10:10' },
      custo: null, receita: null,
      atualizadoEm: '2026-10-08', atualizadoPor: 'Carlos Menezes',
      operacoes: (function () {
        const todos = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10'];
        const op = (produtos) => ({ produtos, talhoes: todos });
        return {
          'Plantio': { germinacao: 95, plantio: [
            { talhao: 'T01', variedade: 'AG 8700 PRO3', data: '2027-01-08', populacao: 62 },
            { talhao: 'T02', variedade: 'AG 8700 PRO3', data: '2027-01-09', populacao: 62 },
            { talhao: 'T07', variedade: 'DKB 360 PRO3', data: '2027-01-12', populacao: 64 },
            { talhao: 'T10', variedade: 'DKB 360 PRO3', data: '2027-01-13', populacao: 64 },
            { talhao: 'T03', variedade: 'P3707VYH',     data: '2027-01-18', populacao: 66 },
            { talhao: 'T04', variedade: 'P3707VYH',     data: '2027-01-19', populacao: 66 },
            { talhao: 'T05', variedade: 'AG 8700 PRO3', data: '2027-01-25', populacao: 62 },
            { talhao: 'T06', variedade: 'AG 8700 PRO3', data: '2027-01-26', populacao: 62 },
            { talhao: 'T08', variedade: 'FS 575 PWU',   data: '2027-02-03', populacao: 60 },
            { talhao: 'T09', variedade: 'FS 575 PWU',   data: '2027-02-05', populacao: 60 }
          ] },
          'Adubação de plantio': op([['Formulado 02-20-18', 250]]),
          'Adubação potássica': op([['KCl 00-00-60', 70]]),
          'Cobertura nitrogenada': op([['Ureia 45%', 180]]),
          '1ª Inseticida: cigarrinha': op([['Engeo Pleno', 0.25], ['Agral', 0.05]]),
          '2ª Inseticida: cigarrinha': op([['Connect', 1.0]]),
          'Herbicida pós-emergente': op([['Primóleo', 3.0], ['Callisto', 0.3], ['Assist', 0.50]]),
          'Inseticida: lagarta-do-cartucho': op([['Dipel WG', 0.50], ['Premio', 0.10]])
        };
      })()
    },
    {
      // Soja 26/27 da São José (Empresa A): em construção, iniciado pelo "Usar modelo" (0.1 e 0.2 em construção, com as
      // operações do modelo da cultura e ainda sem planejamento), como se o usuário tivesse escolhido essa opção
      safra: '26/27', empresa: 'Empresa A', atividade: 'Agricultura', fazenda: 'São José', cultura: 'Soja',
      inicio: 'modelo',
      versoes: { criadaEm: '2026-10-15T09:30' },
      custo: null, receita: null,
      atualizadoEm: '2026-10-15', atualizadoPor: 'Maria Gonçalves'
    }
  ]
};
