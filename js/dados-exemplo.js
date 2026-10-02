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

  // Planos de safra cadastrados. Vazio = menu "Plano de Safra" abre a Tela 01 (Primeiro uso).
  // Cada plano: { id, safra, empresa, fazenda, cultura, inicio, status, area,
  //               custo, receita, atualizadoEm, atualizadoPor }
  planos: []
};
