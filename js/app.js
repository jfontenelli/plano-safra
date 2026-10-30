/*
 * Casca do protótipo: navegação entre telas, estado do menu lateral e menu do usuário.
 * A navegação usa o endereço com # (ex.: index.html#/cadastros), assim funciona
 * abrindo o arquivo direto no navegador e no Netlify, e o botão Voltar funciona.
 */
(function () {
  // Rotas. "menu" diz qual item do menu fica destacado.
  // "desenhar" devolve o HTML da tela; "aoMostrar" (opcional) roda depois que ele está na página.
  const ROTAS = {
    // Planos (lista de planos). Sem planos: Tela 01. Com planos: Tela 03.
    'plano-safra':    { titulo: 'Planos de Safra', menu: 'planos',
                        desenhar: () => temPlanos() ? Telas.listaPlanos.desenhar() : Telas.primeiroUso(),
                        aoMostrar: (conteudo) => { if (temPlanos()) Telas.listaPlanos.aoMostrar(conteudo); } },
    // Plano aberto: #/plano/<id>/<aba>, só pela lista de planos. Abre no Planejamento (Tela 04); Resumo = Tela 05
    // (aba calendario); Validação = Tela 04.0 (aba revisao). No menu, fica destacado o item Planos.
    'plano':          { titulo: 'Planejamento', menu: 'planos',
                        desenhar: () => Telas.planoOperacoes.desenhar(),
                        aoMostrar: (conteudo, id, etapa) => Telas.planoOperacoes.aoMostrar(conteudo, buscarPlano(id), etapa) },
    // Orçamento de Insumos do menu (antes Suprimentos): vários planos somados, guias Safra e Safrinha
    'orcamento':      { titulo: 'Orçamento de Insumos', menu: 'orcamento',
                        desenhar: () => temPlanos() ? Telas.orcamento.desenhar() : Telas.semPlanos('orcamento'),
                        aoMostrar: (conteudo) => { if (temPlanos()) Telas.orcamento.aoMostrar(conteudo); } },
    // Gestão da Lavoura (vários planos somados): Calendário Agrícola (Ano, Mês, Semana, Dia), Central OS e
    // Operações Agrícolas (antes Planejado x Executado e, antes ainda, Monitoramento › Aplicações)
    // Calendário Agrícola: a primeira guia do Planejado x Executado (o menu e o nome do grupo levam a ela)
    'calendario-agricola': { titulo: 'Operações Agrícolas', menu: 'planejado-executado',
                        desenhar: () => temPlanos() ? Telas.osCalendario.desenhar() : Telas.semPlanos('planejado-executado'),
                        aoMostrar: (conteudo) => { if (temPlanos()) Telas.osCalendario.aoMostrar(conteudo); } },
    'central-os':     { titulo: 'Central OS', menu: 'central-os',
                        desenhar: () => temPlanos() ? Telas.centralCorp.desenhar() : Telas.semPlanos('central-os'),
                        aoMostrar: (conteudo) => { if (temPlanos()) Telas.centralCorp.aoMostrar(conteudo); } },
    'planejado-executado': { titulo: 'Operações Agrícolas', menu: 'planejado-executado',
                        desenhar: () => temPlanos() ? Telas.monitoramentoAplicacoes.desenhar() : Telas.semPlanos('planejado-executado'),
                        aoMostrar: (conteudo, guia) => { if (temPlanos()) Telas.monitoramentoAplicacoes.aoMostrar(conteudo, guia); } },
    'cadastros':      { titulo: 'Cadastros', menu: 'cadastros',
                        desenhar: () => Telas.emConstrucao('Cadastros') }
  };
  const ROTA_INICIAL = 'plano-safra';

  // Estado da sessão (só em memória)
  const estado = {
    menuRecolhido: false, // menu começa expandido
    gruposFechados: new Set(), // grupos do menu (Plano de Safra, Gestão da Lavoura) começam abertos; a setinha minimiza
    proximoIdPlano: 1,
    menuAntesDoPlano: null // menu recolhido ou não antes de abrir o plano (ao abrir, ele recolhe; ao sair, volta assim)
  };

  const menu = document.getElementById('menu');
  const botaoAlternar = document.getElementById('menu-alternar');
  const botoesGrupo = document.querySelectorAll('.menu__grupo-alternar');
  const conteudo = document.getElementById('conteudo');
  const botaoUsuario = document.getElementById('menu-usuario');
  const opcoesUsuario = document.getElementById('usuario-opcoes');

  function temPlanos() {
    return DADOS.planos.length > 0;
  }

  function buscarPlano(id) {
    return DADOS.planos.find((p) => String(p.id) === id);
  }

  function rotaAtual() {
    const [nome, parametro, extra] = location.hash.replace(/^#\/?/, '').split('/');
    // Endereço desconhecido (inclusive o antigo #/planejamento): a lista de planos; nenhum plano abre sozinho
    if (!ROTAS[nome]) return { nome: ROTA_INICIAL };
    // Plano que não existe mais (ex.: página recarregada) volta para a lista
    if (nome === 'plano' && !buscarPlano(parametro)) return { nome: ROTA_INICIAL };
    // Endereço de um plano ainda não iniciado (ex.: página atualizada: os dados voltam ao exemplo inicial): lista de planos,
    // no ano agrícola dele, sem abrir o modal de início (ele só abre ao clicar na linha do plano)
    if (nome === 'plano' && Versoes.aIniciar(buscarPlano(parametro))) {
      const plano = buscarPlano(parametro);
      history.replaceState(null, '', `#/${ROTA_INICIAL}`);
      Telas.listaPlanos.mostrarSafra(plano.safra);
      return { nome: ROTA_INICIAL };
    }
    return { nome, parametro, extra };
  }

  function mostrarTela() {
    const { nome, parametro, extra } = rotaAtual();
    const rota = ROTAS[nome];

    hashAtual = location.hash;
    // Plano aberto: o menu recolhe para o trilho de ícones (mais espaço para as tabelas). Ao sair, volta como estava
    // antes de abrir; aberto pela pessoa dentro do plano, vale só até sair.
    if (nome === 'plano' && estado.menuAntesDoPlano === null) {
      estado.menuAntesDoPlano = estado.menuRecolhido; estado.menuRecolhido = true; aplicarEstadoMenu();
    } else if (nome !== 'plano' && estado.menuAntesDoPlano !== null) {
      estado.menuRecolhido = estado.menuAntesDoPlano; estado.menuAntesDoPlano = null; aplicarEstadoMenu();
    }

    document.querySelector('.aviso')?.remove();
    conteudo.innerHTML = rota.desenhar(parametro, extra);
    if (rota.aoMostrar) rota.aoMostrar(conteudo, parametro, extra);
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
    botoesGrupo.forEach((botao) => {
      const fechado = estado.gruposFechados.has(botao.dataset.grupo);
      botao.closest('.menu__grupo').classList.toggle('menu__grupo--fechado', fechado);
      botao.setAttribute('aria-expanded', String(!fechado));
      botao.title = `${fechado ? 'Abrir' : 'Minimizar'} ${botao.dataset.grupo}`;
    });
  }

  function desenharUsuario() {
    const { nome, iniciais } = window.DADOS.usuario;
    document.getElementById('menu-usuario').innerHTML = `
      <span class="menu__avatar" title="${nome}">${iniciais}</span>
      <span class="menu__usuario-nome">${nome}</span>
    `;
  }

  // Cria um plano por fazenda do modal (Safra + Empresa + Fazenda + Cultura identificam o plano) e volta para a
  // lista de planos, com o filtro na safra dos planos criados (uma linha por fazenda, com a etiqueta "Novo").
  // Cada plano nasce só com a versão 0.1, vazia e publicada (DECISOES 4.1.1). Uma fazenda só: abre direto o
  // "Como deseja iniciar o plano?" dele, pelo mesmo caminho do clique na linha (cancelado, fica na lista).
  // Várias fazendas: o aviso pede para clicar na linha de cada uma.
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
    Telas.listaPlanos.mostrarSafra(contexto.safra);
    // Depois de desenhar a lista (mostrarTela apaga o aviso anterior): a tabela rola até o plano novo e, com uma
    // fazenda, abre o modal de início; com várias, o aviso
    const depois = () => {
      document.querySelector('.lista-planos__linha--novo')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      if (criados.length === 1) Telas.listaPlanos.abrirPlano(criados[0]);
      else Aviso.mostrar(`${criados.length} planos criados (${nomes}). Clique na linha de cada um para começar.`);
    };
    if (location.hash === '#/plano-safra') { mostrarTela(); depois(); }
    else { window.addEventListener('hashchange', depois, { once: true }); location.hash = '#/plano-safra'; }
  }

  // O exemplo anda com o dia (DADOS.dataReferencia): todas as datas do exemplo andam a diferença entre hoje e a data de
  // referência, e hoje cai sempre no mesmo ponto da safra. Os nomes das safras andam os anos agrícolas entre as duas
  // datas (o ano agrícola vira em 01/09; ex.: 26/27 → 27/28), inclusive no cadastro de safras, que anda em anos (a safra
  // começa sempre em 01/09): assim, a safra do exemplo é sempre a safra atual. Uma vez, ao abrir.
  function ajustarCenario() {
    const ref = DADOS.dataReferencia;
    if (!ref) return;
    const hoje = Util.hojeISO();
    const dias = Math.round((Date.parse(hoje) - Date.parse(ref)) / 86400000);
    if (!dias) return;
    const anoAgricola = (iso) => (+iso.slice(5, 7) >= 9 ? +iso.slice(0, 4) : +iso.slice(0, 4) - 1);
    const anos = anoAgricola(hoje) - anoAgricola(ref);
    const dois = (n) => String(n).padStart(2, '0');
    const data = (iso) => {
      const [d, hora] = iso.split('T');
      const [a, m, dd] = d.split('-').map(Number);
      const dt = new Date(a, m - 1, dd + dias);
      const nova = `${dt.getFullYear()}-${dois(dt.getMonth() + 1)}-${dois(dt.getDate())}`;
      return hora ? `${nova}T${hora}` : nova;
    };
    const safra = (nome) => nome.replace(/(\d\d)\/(\d\d)/, (_, a, b) => `${dois((+a + anos) % 100)}/${dois((+b + anos) % 100)}`);
    const ISO = /^\d{4}-\d{2}-\d{2}(T[\d:]+)?$/;
    const SAFRA = /^\d\d\/\d\d$/;
    // Percorre o dado: datas andam os dias; nomes de safra (também nas chaves, ex.: "Boa Vista 26/27") andam os anos
    const andar = (v) => {
      if (typeof v === 'string') return ISO.test(v) ? data(v) : anos && SAFRA.test(v) ? safra(v) : v;
      if (Array.isArray(v)) return v.map(andar);
      if (v && typeof v === 'object') {
        return Object.fromEntries(Object.entries(v).map(([k, x]) => [anos ? k.replace(/\b\d\d\/\d\d\b/, safra) : k, andar(x)]));
      }
      return v;
    };
    ['planosExemplo', 'ordensServico', 'osFechadasAte', 'justificativasOperacoes', 'monitoramento', 'historico', 'safras']
      .forEach((chave) => { if (chave in DADOS) DADOS[chave] = andar(DADOS[chave]); });
    if (anos) {
      DADOS.cadastroSafras = DADOS.cadastroSafras.map((c) => {
        const [a, b] = c.descricao.split('/').map(Number);
        const ano = (iso) => `${+iso.slice(0, 4) + anos}${iso.slice(4)}`;
        return { ...c, nome: safra(c.nome), descricao: `${a + anos}/${b + anos}`, apelido: String(+c.apelido + anos),
          inicio: ano(c.inicio), fim: ano(c.fim), anoAgricola: c.anoAgricola + anos };
      });
    }
  }

  // Mantém as safras já cadastradas (inclusive a criada no modal) e inclui a dos exemplos
  function carregarPlanosExemplo() {
    DADOS.planos = DADOS.planosExemplo.map(({ operacoes, versoes, modelo, inicio, ...p }) => {
      if (!DADOS.safras.includes(p.safra)) DADOS.safras.push(p.safra);
      const plano = { ...p, id: estado.proximoIdPlano++ };
      // Versões do exemplo: 0.1 publicada e 0.2 com o planejamento (em construção ou publicada).
      // inicio 'modelo': iniciado pelo "Usar modelo" (as operações do modelo da cultura, sem planejamento).
      // Sem "operacoes" nem inicio: plano não iniciado (só a 0.1, vazia)
      const criada = new Date(versoes.criadaEm);
      const grupos = operacoes ? Planos.montarExemplo(operacoes, modelo ? DADOS.modelosCultura[modelo] : undefined)
        : inicio === 'modelo' ? Planos.gruposModelo(Planos.modeloDaCultura(p.cultura)) : [];
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
  botoesGrupo.forEach((botao) => botao.addEventListener('click', () => {
    const grupo = botao.dataset.grupo;
    if (estado.gruposFechados.has(grupo)) estado.gruposFechados.delete(grupo); else estado.gruposFechados.add(grupo);
    aplicarEstadoMenu();
  }));

  // Botões das telas avisam o que fazer pelo atributo data-acao
  conteudo.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao) return;
    if (botao.dataset.acao === 'criar-plano') Telas.criarPlano();
  });

  // Abre o modal Criar Plano; inicial: { safra, empresa, fazenda } já preenchidos (ex.: Painel, fazenda sem plano)
  Telas.criarPlano = (inicial = {}) => Telas.abrirModalCriarPlano({ aoCriar: criarPlanos, inicial });

  // Voltar e Avançar do navegador: com alteração não salva no painel do talhão, o endereço volta para o plano e a
  // pergunta aparece; "Descartar" segue para onde a pessoa ia. (Os links e botões da tela já perguntam antes.)
  let hashAtual = location.hash;
  window.addEventListener('hashchange', () => {
    const destino = location.hash;
    if (hashAtual.startsWith('#/plano/') && Telas.planoOperacoes.temAlteracaoPendente()) {
      history.pushState(null, '', hashAtual);
      Telas.planoOperacoes.confirmarSaida(() => { location.hash = destino; });
      return;
    }
    mostrarTela();
  });

  desenharUsuario();
  aplicarEstadoMenu();
  // Ao abrir o protótipo, já vem com os planos de exemplo, com as datas andadas para hoje
  ajustarCenario();
  carregarPlanosExemplo();
  mostrarTela();
})();
