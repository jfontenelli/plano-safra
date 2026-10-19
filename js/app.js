/*
 * Casca do protótipo: navegação entre telas, estado do menu lateral e menu do usuário.
 * A navegação usa o endereço com # (ex.: index.html#/cadastros), assim funciona
 * abrindo o arquivo direto no navegador e no Netlify, e o botão Voltar funciona.
 */
(function () {
  // Rotas. "menu" diz qual item do menu fica destacado.
  // "desenhar" devolve o HTML da tela; "aoMostrar" (opcional) roda depois que ele está na página.
  const ROTAS = {
    // Visão Geral. Sem planos: Tela 01. Com planos: Tela 03.
    'plano-safra':    { titulo: 'Visão Geral', menu: 'visao-geral',
                        desenhar: () => temPlanos() ? Telas.listaPlanos.desenhar() : Telas.primeiroUso(),
                        aoMostrar: (conteudo) => { if (temPlanos()) Telas.listaPlanos.aoMostrar(conteudo); } },
    // Menu Planejamento: abre o plano mais recente (ver rotaAtual); sem planos, o convite para criar o primeiro
    'planejamento':   { titulo: 'Planejamento', menu: 'planejamento',
                        desenhar: () => Telas.semPlanos('planejamento') },
    // Plano aberto: #/plano/<id>/<aba>. Abre em Operações (Tela 04.0); Planejamento = Tela 04; Calendário = Tela 05.
    'plano':          { titulo: 'Planejamento', menu: 'planejamento',
                        desenhar: () => Telas.planoOperacoes.desenhar(),
                        aoMostrar: (conteudo, id, etapa) => {
                          estado.ultimoPlanoId = Number(id);
                          Telas.planoOperacoes.aoMostrar(conteudo, buscarPlano(id), etapa);
                        } },
    // Calendário Agrícola do menu: vários planos somados (o ciclo de cada cultura, por empresa e fazenda)
    'calendario':     { titulo: 'Calendário Agrícola', menu: 'calendario',
                        desenhar: () => temPlanos() ? Telas.calendarioAgricola.desenhar() : Telas.semPlanos('calendario'),
                        aoMostrar: (conteudo) => { if (temPlanos()) Telas.calendarioAgricola.aoMostrar(conteudo); } },
    // Orçamento de Insumos do menu (antes Suprimentos): vários planos somados, guias Safra e Safrinha
    'orcamento':      { titulo: 'Orçamento de Insumos', menu: 'orcamento',
                        desenhar: () => temPlanos() ? Telas.orcamento.desenhar() : Telas.semPlanos('orcamento'),
                        aoMostrar: (conteudo) => { if (temPlanos()) Telas.orcamento.aoMostrar(conteudo); } },
    // Ordens de Serviço: por enquanto, o Calendário (Mês, Semana, Dia) das operações de vários planos somados
    'ordens-servico': { titulo: 'Ordens de Serviço', menu: 'ordens-servico',
                        desenhar: () => temPlanos() ? Telas.osCalendario.desenhar() : Telas.semPlanos('ordens-servico'),
                        aoMostrar: (conteudo) => { if (temPlanos()) Telas.osCalendario.aoMostrar(conteudo); } },
    'cadastros':      { titulo: 'Cadastros', menu: 'cadastros',
                        desenhar: () => Telas.emConstrucao('Cadastros') }
  };
  const ROTA_INICIAL = 'plano-safra';

  // Estado da sessão (só em memória)
  const estado = {
    menuRecolhido: false, // menu começa expandido
    proximoIdPlano: 1,
    ultimoPlanoId: null   // último plano aberto (o menu Planejamento abre nele)
  };

  const menu = document.getElementById('menu');
  const botaoAlternar = document.getElementById('menu-alternar');
  const conteudo = document.getElementById('conteudo');
  const botaoUsuario = document.getElementById('menu-usuario');
  const opcoesUsuario = document.getElementById('usuario-opcoes');

  function temPlanos() {
    return DADOS.planos.length > 0;
  }

  function buscarPlano(id) {
    return DADOS.planos.find((p) => String(p.id) === id);
  }

  // Plano mais recente para o menu Planejamento: o último aberto ou, se nenhum foi aberto, o atualizado por último,
  // entre os planos já iniciados (com a forma de iniciar escolhida: modelo, planilha, cópia ou do zero).
  // Plano não iniciado só abre pela linha dele na Visão Geral. Nenhum iniciado: null.
  function planoMaisRecente() {
    const iniciados = DADOS.planos.filter((p) => !Versoes.aIniciar(p));
    return iniciados.find((p) => p.id === estado.ultimoPlanoId)
      || iniciados.sort((a, b) => a.atualizadoEm.localeCompare(b.atualizadoEm)).pop() || null;
  }

  function rotaAtual() {
    let [nome, parametro, extra] = location.hash.replace(/^#\/?/, '').split('/');
    if (!ROTAS[nome]) return { nome: ROTA_INICIAL };
    // Menu Planejamento com planos: abre o plano mais recente já iniciado, na versão em que ele está;
    // sem nenhum iniciado, a Visão Geral (sem o modal de início)
    if (nome === 'planejamento' && temPlanos()) {
      const recente = planoMaisRecente();
      if (!recente) { history.replaceState(null, '', `#/${ROTA_INICIAL}`); return { nome: ROTA_INICIAL }; }
      [nome, parametro, extra] = ['plano', String(recente.id), undefined];
      history.replaceState(null, '', `#/plano/${parametro}`);
    }
    // Plano que não existe mais (ex.: página recarregada) volta para a lista
    if (nome === 'plano' && !buscarPlano(parametro)) return { nome: ROTA_INICIAL };
    // Plano ainda não iniciado (ex.: pelo menu Planejamento): Visão Geral, com o modal "Como deseja iniciar o plano?"
    if (nome === 'plano' && Versoes.aIniciar(buscarPlano(parametro))) {
      const plano = buscarPlano(parametro);
      history.replaceState(null, '', `#/${ROTA_INICIAL}`);
      Telas.listaPlanos.mostrarSafra(plano.safra);
      return { nome: ROTA_INICIAL, iniciar: plano };
    }
    return { nome, parametro, extra };
  }

  function mostrarTela() {
    const { nome, parametro, extra, iniciar } = rotaAtual();
    const rota = ROTAS[nome];

    document.querySelector('.aviso')?.remove();
    conteudo.innerHTML = rota.desenhar(parametro, extra);
    if (rota.aoMostrar) rota.aoMostrar(conteudo, parametro, extra);
    conteudo.scrollTop = 0;
    document.title = `${rota.titulo} · UniSystem`;
    if (iniciar) Telas.listaPlanos.abrirPlano(iniciar);

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

  // Cria um plano por fazenda do modal (Safra + Empresa + Fazenda + Cultura identificam o plano) e volta para a
  // Visão Geral, com o filtro na safra dos planos criados (uma linha por fazenda).
  // Cada plano nasce só com a versão 0.1, vazia e publicada (DECISOES 4.1.1): ao abrir, o Planejamento mostra
  // as opções de início (modelo, do zero, importar XLSX, copiar plano existente).
  // O primeiro plano criado (a partir do primeiro uso) entra na lista junto com os planos de exemplo.
  // talhoes: os talhões incluídos (pode ser vazio: Área de cultivo "Pendente").
  function criarPlanos({ fazendas, ...contexto }) {
    if (!temPlanos()) carregarPlanosExemplo();
    const criados = fazendas.map(({ fazenda, talhoes }) => {
      const plano = {
        id: estado.proximoIdPlano++,
        ...contexto,
        fazenda,
        talhoes,
        custo: null,
        receita: null,
        atualizadoEm: Util.hojeISO(),
        atualizadoPor: DADOS.usuario.nome
      };
      Versoes.iniciar(plano, []);
      DADOS.planos.push(plano);
      return plano;
    });
    const nomes = criados.map((p) => Util.escapar(p.fazenda)).join(', ');
    const aviso = () => Aviso.mostrar(criados.length === 1 ? `Plano criado: Fazenda ${nomes}. Clique na linha para começar.`
      : `${criados.length} planos criados (${nomes}). Clique na linha de cada um para começar.`);
    Telas.listaPlanos.mostrarSafra(contexto.safra);
    // O aviso entra depois de desenhar a lista (mostrarTela apaga o aviso anterior)
    if (location.hash === '#/plano-safra') { mostrarTela(); aviso(); }
    else { window.addEventListener('hashchange', aviso, { once: true }); location.hash = '#/plano-safra'; }
  }

  // Mantém as safras já cadastradas (inclusive a criada no modal) e inclui a dos exemplos
  function carregarPlanosExemplo() {
    DADOS.planos = DADOS.planosExemplo.map(({ operacoes, versoes, modelo, ...p }) => {
      if (!DADOS.safras.includes(p.safra)) DADOS.safras.push(p.safra);
      const plano = { ...p, id: estado.proximoIdPlano++ };
      // Versões do exemplo: 0.1 publicada e 0.2 com o planejamento (em construção ou publicada).
      // Sem "operacoes": plano não iniciado (só a 0.1, vazia)
      const criada = new Date(versoes.criadaEm);
      const grupos = operacoes ? Planos.montarExemplo(operacoes, modelo ? DADOS.modelosCultura[modelo] : undefined) : [];
      Versoes.iniciar(plano, grupos, { quando: criada, por: p.atualizadoPor });
      if (versoes.publicadaEm) {
        Versoes.publicar(plano);
        Object.assign(Versoes.aberta(plano), { publicadaEm: new Date(versoes.publicadaEm), publicadaPor: p.atualizadoPor });
      }
      return plano;
    });
  }

  // ----- Menu do usuário (rodapé): Configurações e Sair -----
  function abrirUsuario(abrir) {
    opcoesUsuario.hidden = !abrir;
    botaoUsuario.setAttribute('aria-expanded', String(abrir));
    if (abrir) opcoesUsuario.querySelector('.usuario__opcao').focus();
  }

  botaoUsuario.addEventListener('click', () => abrirUsuario(opcoesUsuario.hidden));

  opcoesUsuario.addEventListener('click', (e) => {
    const opcao = e.target.closest('[data-usuario]');
    if (!opcao) return;
    abrirUsuario(false);
    if (opcao.dataset.usuario === 'configuracoes') Configuracoes.abrir();
    else Aviso.mostrar('Sair ainda não faz parte do protótipo.');
  });

  // Fecha as opções ao clicar fora ou com Esc
  document.addEventListener('click', (e) => {
    if (!opcoesUsuario.hidden && !e.target.closest('.usuario')) abrirUsuario(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !opcoesUsuario.hidden) { abrirUsuario(false); botaoUsuario.focus(); }
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
    if (botao.dataset.acao === 'criar-plano') Telas.criarPlano();
  });

  // Abre o modal Criar Plano; inicial: { safra, empresa, fazenda } já preenchidos (ex.: Painel, fazenda sem plano)
  Telas.criarPlano = (inicial = {}) => Telas.abrirModalCriarPlano({ aoCriar: criarPlanos, inicial });

  window.addEventListener('hashchange', mostrarTela);

  desenharUsuario();
  aplicarEstadoMenu();
  // Ao abrir o protótipo, já vem com os planos de exemplo
  carregarPlanosExemplo();
  mostrarTela();
})();
