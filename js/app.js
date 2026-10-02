/*
 * Casca do protótipo: navegação entre telas e estado do menu lateral.
 * A navegação usa o endereço com # (ex.: index.html#/cadastros), assim funciona
 * abrindo o arquivo direto no navegador e no Netlify, e o botão Voltar funciona.
 */
(function () {
  // Rotas. "menu" diz qual item do menu fica destacado.
  // Cada tela nova troca o "desenhar" pela sua função em js/telas/.
  const ROTAS = {
    // Sem planos: Tela 01. Com planos: Tela 03 (ainda não construída; por enquanto
    // só o botão "Criar Plano Safra", para abrir o modal de novo).
    'plano-safra':    { titulo: 'Plano de Safra', menu: 'plano-safra',
                        desenhar: () => DADOS.planos.length === 0
                          ? Telas.primeiroUso()
                          : Telas.emConstrucao('Plano de Safra', `
                              <button class="botao botao--primario" type="button" data-acao="criar-plano">
                                ${Icones.mais} Criar Plano Safra
                              </button>`) },
    // Plano aberto: #/plano/<id>. Tela 04 (ainda não construída).
    'plano':          { titulo: 'Plano de Safra', menu: 'plano-safra',
                        desenhar: (id) => Telas.planoEmConstrucao(buscarPlano(id)) },
    'ordens-servico': { titulo: 'Ordens de Serviço', menu: 'ordens-servico',
                        desenhar: () => Telas.emConstrucao('Ordens de Serviço') },
    'cadastros':      { titulo: 'Cadastros', menu: 'cadastros',
                        desenhar: () => Telas.emConstrucao('Cadastros') }
  };
  const ROTA_INICIAL = 'plano-safra';

  // Estado da sessão (só em memória)
  const estado = {
    menuRecolhido: false, // menu começa expandido
    proximoIdPlano: 1
  };

  const menu = document.getElementById('menu');
  const botaoAlternar = document.getElementById('menu-alternar');
  const conteudo = document.getElementById('conteudo');

  function buscarPlano(id) {
    return DADOS.planos.find((p) => String(p.id) === id);
  }

  function rotaAtual() {
    const [nome, parametro] = location.hash.replace(/^#\/?/, '').split('/');
    if (!ROTAS[nome]) return { nome: ROTA_INICIAL };
    // Plano que não existe mais (ex.: página recarregada) volta para a lista
    if (nome === 'plano' && !buscarPlano(parametro)) return { nome: ROTA_INICIAL };
    return { nome, parametro };
  }

  function mostrarTela() {
    const { nome, parametro } = rotaAtual();
    const rota = ROTAS[nome];

    conteudo.innerHTML = rota.desenhar(parametro);
    conteudo.scrollTop = 0;
    document.title = `${rota.titulo} · UniSystem`;

    document.querySelectorAll('.menu__item').forEach((item) => {
      const ativo = item.dataset.rota === rota.menu;
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

  function hojeISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Cria o plano com os dados do modal e abre a Etapa 1 · Cadastro
  function criarPlano(contexto) {
    const plano = {
      id: estado.proximoIdPlano++,
      ...contexto,
      status: 'Em construção',
      area: 0,
      custo: null,
      receita: null,
      atualizadoEm: hojeISO(),
      atualizadoPor: DADOS.usuario.nome
    };
    DADOS.planos.push(plano);
    location.hash = `#/plano/${plano.id}`;
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
      Telas.abrirModalCriarPlano({ aoCriar: criarPlano });
    }
  });

  window.addEventListener('hashchange', mostrarTela);

  desenharUsuario();
  aplicarEstadoMenu();
  mostrarTela();
})();
