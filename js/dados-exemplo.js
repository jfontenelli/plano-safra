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

  // Talhões por fazenda (área em ha). A área de um plano é a soma dos seus talhões.
  talhoes: {
    'São José': [
      { nome: 'T-01', area: 210.5 }, { nome: 'T-02', area: 185.0 }, { nome: 'T-03', area: 232.4 },
      { nome: 'T-04', area: 198.7 }, { nome: 'T-05', area: 176.3 }, { nome: 'T-06', area: 221.9 },
      { nome: 'T-07', area: 205.6 }, { nome: 'T-08', area: 190.2 }, { nome: 'T-09', area: 244.8 },
      { nome: 'T-10', area: 168.4 }, { nome: 'T-11', area: 213.1 }, { nome: 'T-12', area: 183.1 }
    ],
    'Santa Clara': [
      { nome: 'T-01', area: 228.6 }, { nome: 'T-02', area: 241.3 }, { nome: 'T-03', area: 205.9 },
      { nome: 'T-04', area: 219.4 }, { nome: 'T-05', area: 236.7 }, { nome: 'T-06', area: 198.2 },
      { nome: 'T-07', area: 247.5 }, { nome: 'T-08', area: 242.4 }
    ]
  },

  // Planos de safra cadastrados. Começa vazio = menu "Plano de Safra" abre a Tela 01 (Primeiro uso).
  // Cada plano: { id, safra, empresa, fazenda, cultura, inicio, talhoes (nomes), status,
  //               custo, receita, atualizadoEm, atualizadoPor }
  planos: [],

  // Planos carregados pelo menu Demonstração → "Ver com planos de exemplo".
  // O mesmo plano de soja em duas fazendas: um em construção e um aprovado, para mostrar a jornada.
  planosExemplo: [
    {
      safra: '26/27', empresa: 'Empresa A', fazenda: 'São José', cultura: 'Soja', inicio: 'modelo',
      talhoes: ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08', 'T-09', 'T-10', 'T-11', 'T-12'],
      status: 'Em construção',
      custo: null,   // aguardando orçamento
      receita: null, // aguardando premissas de produção
      atualizadoEm: '2026-09-30', atualizadoPor: 'João da Silva'
    },
    {
      safra: '26/27', empresa: 'Empresa A', fazenda: 'Santa Clara', cultura: 'Soja', inicio: 'modelo',
      talhoes: ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08'],
      status: 'Aprovado',
      // PROVISÓRIO: valores digitados até existirem as telas de orçamento e premissas.
      // Custo ≈ R$ 3.150/ha; receita ≈ 63 sc/ha × R$ 122/sc (1.820 ha).
      custo: 5733000,
      receita: 13989000,
      atualizadoEm: '2026-09-25', atualizadoPor: 'Maria Gonçalves'
    }
  ]
};
