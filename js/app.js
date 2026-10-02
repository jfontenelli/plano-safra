/*
 * Casca do protótipo: navegação entre telas e estado do menu lateral.
 * A navegação usa o endereço com # (ex.: index.html#/cadastros), assim funciona
 * abrindo o arquivo direto no navegador e no Netlify, e o botão Voltar funciona.
 */
(function () {
  // Rotas do menu. Cada tela nova troca o "desenhar" pela sua função em js/telas/.
  const ROTAS = {
    // Sem planos: Tela 01. Com planos: Tela 03 (ainda não construída).
    'plano-safra':    { titulo: 'Plano de Safra',    desenhar: () => DADOS.planos.length === 0
                                                                ? Telas.primeiroUso()
                                                                : Telas.emConstrucao('Plano de Safra') },
    'ordens-servico': { titulo: 'Ordens de Serviço', desenhar: () => Telas.emConstrucao('Ordens de Serviço') },
    'cadastros':      { titulo: 'Cadastros',         desenhar: () => Telas.emConstrucao('Cadastros') }
  };
  const ROTA_INICIAL = 'plano-safra';

  // Estado da sessão (só em memória)
  const estado = {
    menuRecolhido: false // menu começa expandido
  };

  const menu = document.getElementById('menu');
  const botaoAlternar = document.getElementById('menu-alternar');
  const conteudo = document.getElementById('conteudo');

  function rotaAtual() {
    const nome = location.hash.replace(/^#\/?/, '');
    return ROTAS[nome] ? nome : ROTA_INICIAL;
  }

  function mostrarTela() {
    const nome = rotaAtual();
    const rota = ROTAS[nome];

    conteudo.innerHTML = rota.desenhar();
    conteudo.scrollTop = 0;
    document.title = `${rota.titulo} · UniSystem`;

    document.querySelectorAll('.menu__item').forEach((item) => {
      const ativo = item.dataset.rota === nome;
      item.classList.toggle('menu__item--ativo', ativo);
      if (ativo) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  }

  function aplicarEstadoMenu() {
    menu.classList.toggle('menu--recolhido', estado.menuRecolhido);
    botaoAlternar.setAttribute('aria-expanded', String(!estado.menuRecolhido));
    botaoAlternar.title = estado.menuRecolhido ? 'Expandir menu' : 'Recolher menu';
  }

  function desenharUsuario() {
    const { nome, iniciais } = window.DADOS.usuario;
    document.getElementById('menu-usuario').innerHTML = `
      <span class="menu__avatar" title="${nome}">${iniciais}</span>
      <span class="menu__usuario-nome">${nome}</span>
    `;
  }

  botaoAlternar.addEventListener('click', () => {
    estado.menuRecolhido = !estado.menuRecolhido;
    aplicarEstadoMenu();
  });

  // Botões das telas avisam o que fazer pelo atributo data-acao
  conteudo.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao) return;
    if (botao.dataset.acao === 'criar-plano') {
      Telas.abrirModalEmConstrucao('Criar Plano de Safra'); // Tela 02, ainda não construída
    }
  });

  window.addEventListener('hashchange', mostrarTela);

  desenharUsuario();
  aplicarEstadoMenu();
  mostrarTela();
})();
