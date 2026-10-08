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
  empresas: ['Empresa A', 'Empresa B', 'Empresa C'],
  fazendas: ['São José', 'Boa Vista', 'Santa Clara', 'Primavera'],
  // Por enquanto o protótipo funciona só para soja (variedades, população, bags e TSI são de soja)
  culturas: ['Soja'],

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
  // Pré-cadastros feitos na tela de Operações (grupo Semente) entram aqui, sem recomendação.
  variedades: [
    { cultura: 'Soja', nome: 'BMX Foco IPRO',   gm: 7.4, ciclo: 104, populacao: [260, 320], janela: ['09-16', '10-31'] },
    { cultura: 'Soja', nome: 'NS 7709 IPRO',    gm: 7.7, ciclo: 108, populacao: [240, 300], janela: ['09-16', '10-31'] },
    { cultura: 'Soja', nome: 'BMX Olimpo IPRO', gm: 8.0, ciclo: 112, populacao: [220, 280], janela: ['09-20', '11-10'] },
    { cultura: 'Soja', nome: 'TMG 2383 IPRO',   gm: 8.3, ciclo: 116, populacao: [200, 240], janela: ['09-20', '11-10'] },
    { cultura: 'Soja', nome: 'M 8372 IPRO',     gm: 8.3, ciclo: 118, populacao: [200, 260], janela: ['09-25', '11-20'] },
    // Sem ciclo cadastrado para a safra: para testar "Informe o ciclo"
    { cultura: 'Soja', nome: 'TMG 7063 IPRO',   gm: 6.3, ciclo: null, populacao: [300, 360], janela: ['09-16', '10-20'] }
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
                     linhas: [['T01', 'T02', 'T03', 'T04'], ['T05', 'T06', 'T07', 'T08']] }
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
    // Tratamento de sementes industrial (TSI), soja. tsi: true = só aparece no grupo Tratamento de semente.
    // classe = grupo do produto no TSI. Dose por 100 kg de sementes, dentro da faixa de bula dos
    // produtos (Agrofit/MAPA e bulas dos fabricantes); "Co + Mo", pó secante e grafite são genéricos.
    // Valores ilustrativos para o protótipo: conferir com o agrônomo antes de usar.
    { tsi: true, classe: 'Inseticida',   produto: 'Standak Top',         principioAtivo: 'Fipronil + Piraclostrobina + Tiofanato-metílico', unidade: 'mL/100 kg' },
    { tsi: true, classe: 'Inseticida',   produto: 'Cruiser 350 FS',      principioAtivo: 'Tiametoxam',                     unidade: 'mL/100 kg' },
    { tsi: true, classe: 'Inseticida',   produto: 'CropStar',            principioAtivo: 'Imidacloprido + Tiodicarbe',     unidade: 'mL/100 kg' },
    { tsi: true, classe: 'Fungicida',    produto: 'Maxim Advanced',      principioAtivo: 'Azoxistrobina + Fludioxonil + Metalaxil-M', unidade: 'mL/100 kg' },
    { tsi: true, classe: 'Fungicida',    produto: 'Vitavax-Thiram 200 SC', principioAtivo: 'Carboxina + Tiram',            unidade: 'mL/100 kg' },
    { tsi: true, classe: 'Nematicida',   produto: 'Avicta 500 FS',       principioAtivo: 'Abamectina',                     unidade: 'mL/100 kg' },
    { tsi: true, classe: 'Inoculante',   produto: 'Masterfix L Soja',    principioAtivo: 'Bradyrhizobium japonicum',       unidade: 'mL/100 kg' },
    { tsi: true, classe: 'Fertilizante', produto: 'Co + Mo',             principioAtivo: 'Cobalto + Molibdênio',           unidade: 'mL/100 kg' },
    { tsi: true, classe: 'Polímero',     produto: 'Disco AG Red L-280',  principioAtivo: '',                               unidade: 'mL/100 kg' },
    { tsi: true, classe: 'Pó secante',   produto: 'Talco agrícola',      principioAtivo: '',                               unidade: 'g/100 kg' },
    { tsi: true, classe: 'Grafite',      produto: 'Grafite em pó',       principioAtivo: '',                               unidade: 'g/100 kg' },
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
    { classe: 'Herbicida',  produto: 'DMA 806 BR',          principioAtivo: '2,4-D',                                      unidade: 'L' }
  ],

  // Estádios fenológicos da soja (exemplo; depois virão do menu Cadastros)
  fenologia: ['VE', 'VC', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'],

  // Tipos de grupo de operação (definem as informações mínimas pedidas no grupo)
  // Fertilidade junta corretivos e fertilizantes; Tratamento de sementes = TSI (só talhão com variedade)
  tiposGrupo: ['Sementes', 'Tratamento de sementes', 'Defensivos', 'Fertilidade', 'Colheita'],

  // Modelo de operações (levantado com clientes). Usado pelo "Usar modelo" e pelos planos de exemplo.
  // prazo: prazo para encerramento da OS, em dias (DECISOES 4.3: preparo, calcário, fósforo, 1ª dessecação e
  // 1ª metade do K = 5; plantio 3); sem prazo, vale o padrão do grupo (2 dias; Semente 3). Colheita: 10.
  // Por enquanto, para os testes com usuários, os grupos Semente, Defensivo e Fertilidade (os outros grupos
  // do modelo — Preparo do solo e Colheita — estão no histórico do git).
  // Fertilidade (soja no Cerrado/MT): calagem 60 a 90 dias antes do plantio (pH alvo 5,5–6,0); gessagem;
  // potássio a lanço antecipado (7 a 30 dias antes) e em cobertura; fósforo (MAP) no sulco de plantio.
  // K₂O ≈ 20 kg por tonelada de soja produzida (MT/MS). Fontes: Embrapa (Circular Técnica 33, Documentos
  // 458/2023, Sistema soja-milho) e ensaios no MT (Rev. Cerrado Agrociências/UNIPAM; Agrarian/UFGD).
  modeloOperacoes: [
    { nome: 'Semente', tipo: 'Sementes', operacoes: [
      { nome: 'Plantio', dap: 0, prazo: 3 }
    ] },
    // TSI: sem DAP no modelo; o agrônomo informa (como no Defensivo, sem fenologia)
    { nome: 'Tratamento de semente', tipo: 'Tratamento de sementes', operacoes: [
      { nome: 'Tratamento de sementes (TSI)' }
    ] },
    { nome: 'Defensivo', tipo: 'Defensivos', operacoes: [
      { nome: '1ª Dessecação: pré-plantio', dap: -15, prazo: 5 },
      { nome: '2ª Dessecação: pré-plantio', dap: -5 },
      { nome: 'Pré-emergente', dap: 1 },
      { nome: '1ª Pós-emergente', dap: 15 },
      { nome: '2ª Pós-emergente', dap: 25 },
      { nome: '1ª Fungicida', dap: 40 },
      { nome: '2ª Fungicida', dap: 55 },
      { nome: '3ª Fungicida', dap: 70 },
      { nome: '4ª Fungicida', dap: 85 },
      { nome: 'Desfolha', dap: 100 }
    ] },
    { nome: 'Fertilidade', tipo: 'Fertilidade', operacoes: [
      { nome: 'Calagem', dap: -90, prazo: 5 },
      { nome: 'Gessagem', dap: -60, prazo: 5 },
      { nome: '1ª Adubação potássica', dap: -15, prazo: 5 },
      { nome: 'Fosfatagem', dap: -10, prazo: 5 },
      { nome: 'Adubação de plantio', dap: 0 },
      { nome: '2ª Adubação potássica', dap: 25 },
      // Adubação foliar (micronutrientes: boro, cobre, zinco, ferro), como no plano de fertilidade do cliente
      { nome: '1ª Adubação foliar', dap: 25 },
      { nome: '2ª Adubação foliar', dap: 50 }
    ] }
  ],

  // Planos de safra cadastrados. Começa vazio = menu "Plano de Safra" abre a Tela 01 (Primeiro uso).
  planos: [],

  // Planos carregados pelo menu Demonstração → "Ver com planos de exemplo".
  // O mesmo plano (modelo de operações) em duas fazendas: um em construção e um aprovado.
  // "operacoes" detalha, por nome de operação do modelo: fenologia, produtos [nome, dose],
  // talhões que recebem e ajustes por talhão. Operações não listadas ficam sem recomendação e sem talhões.
  planosExemplo: [
    {
      safra: '26/27', empresa: 'Empresa A', fazenda: 'São José', cultura: 'Soja', inicio: 'modelo',
      status: 'Em construção',
      custo: null,   // aguardando orçamento
      receita: null, // aguardando premissas de produção
      atualizadoEm: '2026-09-30', atualizadoPor: 'João da Silva',
      // Em construção: todas as operações começam sem recomendação, para o teste montar do zero
      operacoes: {}
    },
    {
      safra: '26/27', empresa: 'Empresa A', fazenda: 'Santa Clara', cultura: 'Soja', inicio: 'modelo',
      status: 'Aprovado',
      // PROVISÓRIO: valores digitados até existirem as telas de orçamento e premissas.
      // Custo ≈ R$ 3.150/ha; receita ≈ 63 sc/ha × R$ 122/sc (845 ha).
      custo: 2661750,
      receita: 6494670,
      atualizadoEm: '2026-09-25', atualizadoPor: 'Maria Gonçalves',
      operacoes: (function () {
        const todos = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07', 'T08'];
        const op = (produtos, fenologia = '') => ({ fenologia, produtos, talhoes: todos });
        return {
          // Plantio: variedade, data de plantio e população planejada (mil plantas/ha) por talhão,
          // dentro da população recomendada de cada variedade; germinação média do plano em %
          // Fertilidade: calcário e base em todos; gesso só onde a análise de subsuperfície pediu (T01 a T04);
          // cobertura potássica só nos talhões mais arenosos (T05 a T08); T07 com dose maior de KCl
          'Calagem': op([['Calcário dolomítico PRNT 85%', 2]]),
          'Gessagem': { produtos: [['Gesso agrícola', 1.5]], talhoes: ['T01', 'T02', 'T03', 'T04'] },
          '1ª Adubação potássica': { produtos: [['KCl 00-00-60', 130]], talhoes: todos,
            ajustes: { T07: { doses: { 'KCl 00-00-60': 160 } } } },
          'Adubação de plantio': op([['MAP 11-52-00', 180]]),
          '2ª Adubação potássica': { fenologia: 'V4', produtos: [['KCl 00-00-60', 80]], talhoes: ['T05', 'T06', 'T07', 'T08'] },
          // TSI 1 nos talhões sem histórico de nematoide; TSI 2 com nematicida (T06 a T08)
          // DAP −5: tratamento industrial feito alguns dias antes do plantio
          'Tratamento de sementes (TSI)': { dap: -5, tsi: [
            { produtos: [['Standak Top', 200], ['Masterfix L Soja', 200], ['Co + Mo', 100], ['Disco AG Red L-280', 100]],
              talhoes: ['T01', 'T02', 'T03', 'T04', 'T05'] },
            { produtos: [['Maxim Advanced', 100], ['Cruiser 350 FS', 200], ['Avicta 500 FS', 100], ['Masterfix L Soja', 200], ['Disco AG Red L-280', 100]],
              talhoes: ['T06', 'T07', 'T08'] }
          ] },
          'Plantio': { germinacao: 95, plantio: [
            { talhao: 'T01', variedade: 'BMX Foco IPRO',   data: '2026-09-22', populacao: 300 },
            { talhao: 'T02', variedade: 'BMX Foco IPRO',   data: '2026-09-22', populacao: 300 },
            { talhao: 'T03', variedade: 'BMX Olimpo IPRO', data: '2026-09-28', populacao: 250 },
            { talhao: 'T04', variedade: 'BMX Olimpo IPRO', data: '2026-10-01', populacao: 250 },
            { talhao: 'T05', variedade: 'TMG 2383 IPRO',   data: '2026-10-05', populacao: 220 },
            { talhao: 'T06', variedade: 'NS 7709 IPRO',    data: '2026-09-25', populacao: 270 },
            { talhao: 'T07', variedade: 'M 8372 IPRO',     data: '2026-10-10', populacao: 230 },
            { talhao: 'T08', variedade: 'TMG 2383 IPRO',   data: '2026-10-08', populacao: 220 }
          ] },
          '1ª Dessecação: pré-plantio': op([['Roundup Original DI', 2.5], ['DMA 806 BR', 1.0]]),
          '2ª Dessecação: pré-plantio': op([['Finale', 2.0]]),
          'Pré-emergente': op([['Dual Gold', 1.5]], 'VE'),
          '1ª Pós-emergente': op([['Roundup Original DI', 2.0]], 'V2'),
          '2ª Pós-emergente':
            op([['Select 240 EC', 0.45], ['Engeo Pleno', 0.20], ['Unizeb Gold', 1.5]], 'V4'),
          '1ª Fungicida': op([['Fox Xpro', 0.40], ['Engeo Pleno', 0.20]], 'R1'),
          '2ª Fungicida': op([['Priori Xtra', 0.30], ['Ampligo', 0.15]], 'R3'),
          '3ª Fungicida': op([['Elatus', 0.20], ['Connect', 1.0]], 'R5'),
          '4ª Fungicida': op([['Cypress', 0.30], ['Premio', 0.05]], 'R5'),
          'Desfolha': op([['Finale', 2.0]], 'R7')
        };
      })()
    }
  ]
};
