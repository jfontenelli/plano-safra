/*
 * Casca do protótipo: navegação entre telas, estado do menu lateral e menu Demonstração.
 * A navegação usa o endereço com # (ex.: index.html#/cadastros), assim funciona
 * abrindo o arquivo direto no navegador e no Netlify, e o botão Voltar funciona.
 */
(function () {
  // Rotas. "menu" diz qual item do menu fica destacado.
  // "desenhar" devolve o HTML da tela; "aoMostrar" (opcional) roda depois que ele está na página.
  const ROTAS = {
    // Sem planos: Tela 01. Com planos: Tela 03.
    'plano-safra':    { titulo: 'Plano de Safra', menu: 'plano-safra',
                        desenhar: () => temPlanos() ? Telas.listaPlanos.desenhar() : Telas.primeiroUso(),
                        aoMostrar: (conteudo) => { if (temPlanos()) Telas.listaPlanos.aoMostrar(conteudo); } },
    // Plano aberto: #/plano/<id>. Tela 04 (ainda não construída).
    'plano':          { titulo: 'Plano de Safra', menu: 'plano-safra',
                        desenhar: (id) => Telas.planoEmConstrucao(buscarPlano(id)) },
    'ordens-servico': { titulo: 'Ordens de Serviço', menu: 'ordens-servico',
                        desenhar: () => Telas.emConstrucao('Ordens de Serviço') },
    'cadastros':      { titulo: 'Cadastros', menu: 'cadastros',
                        desenhar: () => Telas.emConstrucao('Cadastros') }
  };
  const ROTA_INICIAL = 'plano-safra';

  // Safras cadastradas no início, para o "Começar do zero" voltar a elas
  const SAFRAS_INICIAIS = [...DADOS.safras];

  // Estado da sessão (só em memória)
  const estado = {
    menuRecolhido: false, // menu começa expandido
    proximoIdPlano: 1
  };

  const menu = document.getElementById('menu');
  const botaoAlternar = document.getElementById('menu-alternar');
  const conteudo = document.getElementById('conteudo');
  const botaoDemo = document.getElementById('demo-botao');
  const opcoesDemo = document.getElementById('demo-opcoes');

  function temPlanos() {
    return DADOS.planos.length > 0;
  }

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
    if (rota.aoMostrar) rota.aoMostrar(conteudo, parametro);
    conteudo.scrollTop = 0;
    document.title = `${rota.titulo} · UniSystem`;

    document.querySelectorAll('.menu__item[data-rota]').forEach((item) => {
      const ativo = item.dataset.rota === rota.menu;
      item.classList.toggle('menu__item--ativo', ativo);
      if (ativo) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  }

  // Vai para a tela; se já estiver nela, desenha de novo
  function irPara(hash) {
    if (location.hash === hash) mostrarTela();
    else location.hash = hash;
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

  // Cria o plano com os dados do modal e abre a Etapa 1 · Cadastro
  function criarPlano(contexto) {
    const plano = {
      id: estado.proximoIdPlano++,
      ...contexto,
      talhoes: [], // área 0 ha até os talhões serem escolhidos
      status: 'Em construção',
      custo: null,
      receita: null,
      atualizadoEm: Util.hojeISO(),
      atualizadoPor: DADOS.usuario.nome
    };
    DADOS.planos.push(plano);
    location.hash = `#/plano/${plano.id}`;
  }

  // ----- Menu Demonstração -----
  function abrirDemo(abrir) {
    opcoesDemo.hidden = !abrir;
    botaoDemo.setAttribute('aria-expanded', String(abrir));
    if (abrir) opcoesDemo.querySelector('.demo__opcao').focus();
  }

  function comecarDoZero() {
    DADOS.planos = [];
    DADOS.safras = [...SAFRAS_INICIAIS];
    irPara('#/plano-safra');
  }

  function verPlanosExemplo() {
    DADOS.safras = [...SAFRAS_INICIAIS];
    DADOS.planos = DADOS.planosExemplo.map((p) => {
      if (!DADOS.safras.includes(p.safra)) DADOS.safras.push(p.safra);
      return { ...p, talhoes: [...p.talhoes], id: estado.proximoIdPlano++ };
    });
    irPara('#/plano-safra');
  }

  botaoDemo.addEventListener('click', () => abrirDemo(opcoesDemo.hidden));

  opcoesDemo.addEventListener('click', (e) => {
    const opcao = e.target.closest('[data-demo]');
    if (!opcao) return;
    abrirDemo(false);
    if (opcao.dataset.demo === 'zero') comecarDoZero();
    else verPlanosExemplo();
  });

  // Fecha as opções ao clicar fora ou com Esc
  document.addEventListener('click', (e) => {
    if (!opcoesDemo.hidden && !e.target.closest('.demo')) abrirDemo(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !opcoesDemo.hidden) { abrirDemo(false); botaoDemo.focus(); }
  });

  // ----- Eventos gerais -----
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
