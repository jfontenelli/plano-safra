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
  culturas: ['Soja', 'Milho', 'Algodão'],

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

  // Cadastro de defensivos (exemplo). Pré-cadastros feitos na tela de Operações entram aqui.
  // unidade: L, mL, kg, g ou t (a dose é sempre por hectare)
  defensivos: [
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
  tiposGrupo: ['Corretivos', 'Sementes', 'Fertilizantes', 'Defensivos', 'Colheita'],

  // Modelo de operações (levantado com clientes). Usado pelo "Usar modelo" e pelos planos de exemplo.
  // tipo null = grupo sem tipo (Preparo do solo, só máquina).
  modeloOperacoes: [
    { nome: 'Preparo do solo', tipo: null, operacoes: [
      { nome: 'Preparo de solo', dap: -50 }
    ] },
    { nome: 'Corretivos', tipo: 'Corretivos', operacoes: [
      { nome: 'Calcário – pré-plantio', dap: -30 }
    ] },
    { nome: 'Semente', tipo: 'Sementes', operacoes: [
      { nome: 'Plantio', dap: 0 }
    ] },
    { nome: 'Fertilizante', tipo: 'Fertilizantes', operacoes: [
      { nome: 'Fósforo – pré-plantio', dap: -20 },
      { nome: '1ª metade do K – pré-plantio', dap: -10 },
      { nome: '2ª Potássio', dap: 25 }
    ] },
    { nome: 'Defensivo', tipo: 'Defensivos', operacoes: [
      { nome: '1ª dessecação – pré-plantio', dap: -15 },
      { nome: '2ª dessecação – opcional pré-plantio', dap: -5 },
      { nome: 'Pré-emergente', dap: 1 },
      { nome: '1ª Pós-emergente (herbicida)', dap: 15 },
      { nome: '2ª Pós-emergente (herbicida + inseticida + fungicida e adjuvante)', dap: 25 },
      { nome: '1ª fungicida + inseticida', dap: 40 },
      { nome: '2ª fungicida + inseticida', dap: 55 },
      { nome: '3ª fungicida + inseticida', dap: 70 },
      { nome: '4ª fungicida + inseticida', dap: 85 },
      { nome: '5ª fungicida + inseticida', dap: null },
      { nome: 'Desfolha', dap: 100 }
    ] },
    { nome: 'Colheita', tipo: 'Colheita', operacoes: [
      { nome: 'Colheita', dap: 107 }
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
      operacoes: {
        '1ª fungicida + inseticida': {
          fenologia: 'V5',
          produtos: [['Fox Xpro', 0.40], ['Engeo Pleno', 0.20]],
          talhoes: ['T01', 'T02', 'T04', 'T05', 'T06', 'T07', 'T08', 'T09', 'T10', 'T11', 'T12'], // T03 sem operação
          ajustes: {
            T02: { dap: 45, doses: { 'Fox Xpro': 0.50 } },
            T04: { doses: { 'Engeo Pleno': null } } // dose pendente
          }
        }
      }
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
          '1ª dessecação – pré-plantio': op([['Roundup Original DI', 2.5], ['DMA 806 BR', 1.0]]),
          '2ª dessecação – opcional pré-plantio': op([['Finale', 2.0]]),
          'Pré-emergente': op([['Dual Gold', 1.5]]),
          '1ª Pós-emergente (herbicida)': op([['Roundup Original DI', 2.0]]),
          '2ª Pós-emergente (herbicida + inseticida + fungicida e adjuvante)':
            op([['Select 240 EC', 0.45], ['Engeo Pleno', 0.20], ['Unizeb Gold', 1.5]]),
          '1ª fungicida + inseticida': op([['Fox Xpro', 0.40], ['Engeo Pleno', 0.20]], 'V5'),
          '2ª fungicida + inseticida': op([['Priori Xtra', 0.30], ['Ampligo', 0.15]]),
          '3ª fungicida + inseticida': op([['Elatus', 0.20], ['Connect', 1.0]]),
          '4ª fungicida + inseticida': op([['Cypress', 0.30], ['Premio', 0.05]]),
          // 5ª fungicida + inseticida: sem talhões (Sem operação)
          'Desfolha': op([['Finale', 2.0]])
        };
      })()
    }
  ]
};
