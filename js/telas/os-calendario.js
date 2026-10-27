/*
 * Calendário Agrícola, item de Gestão da Lavoura (DECISOES 4.0): a lista suspensa Ano · Mês · Semana · Dia. Ano (abre nele):
 * o ano agrícola por Empresa › Fazenda › Safra/Safrinha (js/telas/calendario-agricola.js; as setas trocam o ano agrícola).
 * Mês, Semana e Dia: a Agenda Agrícola, a grade que antes ficava no Resumo do plano,
 * com as operações de vários planos somados, sem a associação a um plano. Usa a última versão publicada de cada
 * plano. Filtros com várias escolhas: Safra (Safra ou Safrinha), Cultura, Empresa, Fazenda, Talhão e Operação. Sem filtro de
 * Ano Agrícola: o tempo anda pelas setas do calendário. Abre no dia de hoje. A legenda filtra os grupos de operação
 * e o filtro Operação levam o calendário para a primeira operação escolhida; com todas, para hoje.
 * As datas e o desenho da grade vêm do Calendário do plano (js/telas/05-calendario.js).
 * Por enquanto só migrado; o refinamento para a programação das OS vem depois.
 */
window.Telas = window.Telas || {};

window.Telas.osCalendario = (function () {
  const esc = Util.escapar;
  const Cal = () => Telas.calendario;
  // Grupos de operação pelo tipo (os nomes de cada plano podem mudar; a cor segue o tipo), nesta ordem na legenda
  const ORDEM_TIPO = ['sementes', 'fertilidade', 'defensivos', 'colheita'];
  const FILTROS = [
    ['safra', 'Safra', ['Todas', 'Nenhuma', 'selecionadas']],
    ['cultura', 'Cultura', ['Todas', 'Nenhuma', 'culturas']],
    ['empresa', 'Empresa', ['Todas', 'Nenhuma', 'empresas']],
    ['fazenda', 'Fazenda', ['Todas', 'Nenhuma', 'fazendas']],
    ['talhao', 'Talhão', ['Todos', 'Nenhum', 'talhões']],
    ['operacao', 'Operação', ['Todas', 'Nenhuma', 'operações']]
  ];

  // Estado da tela: período, dia aberto e filtros ('todos' ou a lista do que está marcado). Mantém-se ao navegar.
  const novoEstado = () => ({ escala: 'ano', anoAgricola: anoInicial(), dataRef: Cal().hojeIso(), safra: 'todos', empresa: 'todos', fazenda: 'todos',
    cultura: 'todos', operacao: 'todos', talhao: 'todos', grupo: 'todos' });
  let est = null;

  const cicloDe = (p) => p.ciclo || 'Safra';
  // Grupo de operação (ou operação do Ano, que traz o tipo) → a chave da cor
  const tipoDe = (grupo) => Util.normalizar(grupo.tipo || 'outro').replace(/\s+/g, '-');
  const nomeOp = (it) => (it.colheita ? 'Colheita' : it.op.nome || 'Sem operação');
  const posTipo = (t) => (ORDEM_TIPO.includes(t) ? ORDEM_TIPO.indexOf(t) : 99);
  // Aparece no calendário: grupo ligado na legenda e operação marcada no filtro
  const visivel = (it) => Cal().marcado(est, 'grupo', tipoDe(it.grupo)) && Cal().marcado(est, 'operacao', nomeOp(it));
  const comPublicada = () => DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p));
  const valorDe = { safra: (p) => p.safra, empresa: (p) => p.empresa, fazenda: (p) => p.fazenda, cultura: (p) => p.cultura };
  // Ano agrícola de uma data (01/09 a 31/08), em texto ("2026"); os anos com plano publicado; o de hoje ou o mais recente
  const anoDe = (iso) => { const [a, m] = iso.split('-').map(Number); return String(m >= 9 ? a : a - 1); };
  const anos = () => Util.anosAgricolas(comPublicada());
  const anoInicial = () => { const lista = anos(); const h = anoDe(Cal().hojeIso()); return lista.includes(h) ? h : Util.anoAgricolaMaisRecente(lista); };
  const planosFiltrados = () => comPublicada().filter((p) => Object.keys(valorDe).every((c) => Cal().marcado(est, c, valorDe[c](p))));

  // Opções de cada filtro: o que existe nos planos com versão publicada. Talhão: os talhões dos planos que passam
  // pelos outros filtros, com a fazenda junto ("Santa Clara · T01"), porque o nome se repete entre fazendas.
  // Operação: as operações dos grupos ligados na legenda, pelo nome (o mesmo nome em vários planos é uma opção só),
  // na ordem da legenda e, dentro do grupo, na ordem do plano; ao lado, o grupo.
  function opcoes(chave) {
    if (chave === 'operacao') {
      const vistos = new Map();
      calcular().itens.filter(({ it }) => Cal().marcado(est, 'grupo', tipoDe(it.grupo))).forEach(({ it }, i) => {
        const nome = nomeOp(it);
        if (!vistos.has(nome)) vistos.set(nome, { valor: nome, nome, extra: it.grupo.nome, pos: posTipo(tipoDe(it.grupo)), i });
      });
      return [...vistos.values()].sort((a, b) => a.pos - b.pos || a.i - b.i);
    }
    if (chave === 'talhao') {
      const vistos = new Map();
      planosFiltrados().forEach((p) => Util.talhoesPlano(p, Versoes.ultimaPublicada(p)).forEach((t) => {
        const valor = `${p.fazenda}|${t.nome}`;
        if (!vistos.has(valor)) vistos.set(valor, { valor, nome: `${p.fazenda} · ${t.nome}`, extra: Util.area(t.area) });
      }));
      return [...vistos.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
    }
    const presentes = new Set(comPublicada().map(valorDe[chave]));
    // Safra: as do cadastro (26/27, 27/27…), na ordem do cadastro
    if (chave === 'safra') return Util.ordenarSafras([...presentes]).map((x) => ({ valor: x, nome: x }));
    const ordem = { empresa: DADOS.empresas, fazenda: DADOS.fazendas, cultura: DADOS.culturasPlanos }[chave];
    return ordem.filter((x) => presentes.has(x)).map((x) => ({ valor: x, nome: x }));
  }

  // Operações planejadas de cada plano (só as que têm talhão; a colheita depois do plantio), com os eventos no tempo
  function calcular() {
    const itens = []; const eventos = [];
    planosFiltrados().forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const talhao = est.talhao === 'todos' ? 'todos'
        : est.talhao.filter((x) => x.startsWith(`${p.fazenda}|`)).map((x) => x.slice(p.fazenda.length + 1));
      const ctx = { plano: { grupos: Versoes.grupos(p, v) }, talhoes: Util.talhoesPlano(p, v), estado: { talhao } };
      const lista = Cal().itens(ctx).filter((it) => (it.colheita ? !it.aguardando : it.talhoes.length > 0));
      const local = `${p.fazenda} · ${cicloDe(p)} ${p.safra}`;
      lista.forEach((it) => itens.push({ it, local }));
      const visiveis = lista.filter(visivel);
      Cal().eventos(ctx, visiveis).forEach((ev) => eventos.push({ ...ev, local,
        chave: `${p.id}:${ev.it.colheita ? 'colheita' : ev.it.op.id}` }));
    });
    eventos.sort((a, b) => a.inicio.localeCompare(b.inicio));
    const semData = itens.filter(({ it }) => visivel(it) && !eventos.some((ev) => ev.it === it)).length;
    return { itens, eventos, semData };
  }

  // Grupos da legenda: os tipos que têm operação, na ordem Plantio, Fertilidade, Defensivo, Colheita (outros no fim)
  function gruposLegenda(itens) {
    const mapa = new Map();
    itens.forEach(({ it }) => { const t = tipoDe(it.grupo); if (!mapa.has(t)) mapa.set(t, it.grupo.nome); });
    return [...mapa.entries()].map(([valor, nome]) => ({ valor, nome })).sort((a, b) => posTipo(a.valor) - posTipo(b.valor));
  }

  // Legenda que filtra: clicar num grupo mostra só ele (outro grupo substitui o anterior); clicar no grupo que está à
  // mostra, ou em Mostrar todos, volta a todos. Com um grupo, o calendário vai para a operação mais cedo dele; com
  // todos, volta para hoje.
  function legenda(grupos, temHoje = false) {
    const todos = grupos.every((o) => Cal().marcado(est, 'grupo', o.valor));
    return `
      <div class="cal-legenda" role="group" aria-label="Filtrar por grupo de operação">
        ${grupos.map((o) => {
          const ligado = Cal().marcado(est, 'grupo', o.valor);
          return `
            <button class="cal-leg ${ligado ? '' : 'cal-leg--desligado'}" type="button" data-acao="os-leg" data-grupo="${esc(o.valor)}" aria-pressed="${ligado && !todos}"
                    title="${ligado && !todos ? 'Mostrar todos' : `Mostrar só ${esc(o.nome)}`}">
              <span class="cal-ponto cal-ponto--${esc(o.valor)}"></span>${esc(o.nome)}</button>`;
        }).join('')}
        ${todos ? '' : '<button class="link-acao cal-legenda__todos" type="button" data-acao="os-leg-todos">Mostrar todos</button>'}
        ${temHoje ? '<span class="os-cal__hoje"><span class="cag__cor cag__cor--hoje" aria-hidden="true"></span>Hoje</span>' : ''}
      </div>`;
  }

  function desenhar() {
    est = est || novoEstado();
    return `
      ${Telas.gestaoLavoura.cabecalho('calendario')}
      <div class="pagina os-cal">
        <section class="cartao filtros" aria-label="Filtrar o calendário" data-os-filtros></section>
        <section class="calendario os-cal__corpo" aria-label="Calendário das operações" data-os></section>
      </div>`;
  }

  function filtros() {
    return `
      ${FILTROS.map(([chave, rotulo, textos]) => `
        <div class="campo">
          <span class="campo__rotulo">${rotulo}</span>
          ${Cal().filtroCaixa(est, chave, opcoes(chave), textos, rotulo)}
        </div>`).join('')}
      <button class="link-acao filtros__limpar" type="button" data-acao="os-limpar">${Icones.limpar} Limpar filtros</button>`;
  }

  // Visão Ano: Hoje (o ano agrícola de hoje) · ‹ › (o ano agrícola anterior e o próximo, entre os que têm plano) · o ano ·
  // a lista suspensa Ano, Mês, Semana, Dia
  function navAno() {
    const lista = anos();
    const i = lista.indexOf(est.anoAgricola);
    return `
      <div class="cal-nav">
        <button class="botao botao--secundario botao--p cal-nav__hoje" type="button" data-acao="os-ano-hoje" title="Ir para o ano agrícola de hoje">Hoje</button>
        <button class="botao-icone cal-nav__seta" type="button" data-os-ano="-1" aria-label="Ano agrícola anterior" title="Ano agrícola anterior" ${i <= 0 ? 'disabled' : ''}>${Icones.anterior}</button>
        <button class="botao-icone cal-nav__seta" type="button" data-os-ano="1" aria-label="Próximo ano agrícola" title="Próximo ano agrícola" ${i >= lista.length - 1 ? 'disabled' : ''}>${Icones.proxima}</button>
        <span class="cal-nav__titulo" title="Ano agrícola ${esc(est.anoAgricola)}" aria-live="polite">${esc(est.anoAgricola)}</span>
        ${Cal().seletorEscala(est)}
      </div>`;
  }

  // Visão Ano: os planos dos filtros no ano agrícola; Talhão, Operação e a legenda filtram as barras
  function corpoAno(itens) {
    const { html, temHoje } = Telas.calendarioAgricola.tabela({
      planos: planosFiltrados().filter((p) => String(Util.anoAgricola(p.safra)) === est.anoAgricola),
      talhaoOk: (p, t) => est.talhao === 'todos' || est.talhao.includes(`${p.fazenda}|${t}`),
      opOk: (o) => Cal().marcado(est, 'grupo', tipoDe(o)) && Cal().marcado(est, 'operacao', o.tipo === 'Colheita' ? 'Colheita' : o.nome)
    });
    return `
      <div class="calendario__barra">
        ${legenda(gruposLegenda(itens), temHoje)}
        ${navAno()}
      </div>
      <div class="os-cal__ano">${html}</div>`;
  }

  function corpo() {
    const { itens, eventos, semData } = calcular();
    if (est.escala === 'ano') return corpoAno(itens);
    const grupos = gruposLegenda(itens);
    return `
      <div class="calendario__barra">
        ${legenda(grupos)}
        ${Cal().navCalendario(est)}
      </div>
      ${itens.length ? Cal().calendarioMes({ est, todos: eventos, semData })
        : `<p class="cag__vazio">${planosFiltrados().length ? 'Nenhuma operação planejada nos planos publicados com esses filtros.' : 'Nenhum plano publicado com esses filtros.'}</p>`}`;
  }

  function aoMostrar(conteudo) {
    est = est || novoEstado();
    // Os eventos ficam na página da tela (a área de conteúdo é a mesma para todas as telas)
    const raiz = conteudo.querySelector('.os-cal');
    const caixaFiltros = raiz.querySelector('[data-os-filtros]');
    const caixa = raiz.querySelector('[data-os]');
    // Redesenha e devolve o foco ao elemento equivalente (os filtros e o calendário são refeitos)
    const redesenhar = (foco) => {
      caixaFiltros.innerHTML = filtros();
      caixa.innerHTML = corpo();
      if (foco) raiz.querySelector(foco)?.focus();
    };
    const ctx = { estado: est };
    const acoes = { redesenhar };

    raiz.addEventListener('click', (e) => {
      if (e.target.closest('[data-acao="os-limpar"]')) {
        est = Object.assign(novoEstado(), { escala: est.escala, dataRef: est.dataRef, anoAgricola: est.anoAgricola });
        ctx.estado = est;
        redesenhar('[data-acao="os-limpar"]');
        return;
      }
      const leg = e.target.closest('[data-acao="os-leg"], [data-acao="os-leg-todos"]');
      if (leg) {
        const v = leg.dataset.grupo;
        const soEle = Array.isArray(est.grupo) && est.grupo.length === 1 && est.grupo[0] === v;
        est.grupo = leg.dataset.acao === 'os-leg-todos' || soEle ? 'todos' : [v];
        // No Ano, o ano agrícola fica; no Mês, na Semana e no Dia, vai para a primeira operação (todos: hoje)
        if (est.escala !== 'ano') {
          const primeira = est.grupo === 'todos' ? null : calcular().eventos[0];
          est.dataRef = primeira ? primeira.inicio : Cal().hojeIso();
          est.diaAberto = null;
        }
        redesenhar(leg.dataset.acao === 'os-leg' ? `[data-acao="os-leg"][data-grupo="${CSS.escape(v)}"]` : '.cal-leg');
        return;
      }
      // Visão Ano: Hoje, setas do ano agrícola e abrir/fechar empresa e fazenda
      const ano = e.target.closest('[data-os-ano]');
      if (ano && !ano.disabled) {
        const lista = anos();
        est.anoAgricola = lista[lista.indexOf(est.anoAgricola) + Number(ano.dataset.osAno)];
        redesenhar(`[data-os-ano="${ano.dataset.osAno}"]:not(:disabled)`);
        return;
      }
      if (e.target.closest('[data-acao="os-ano-hoje"]')) { est.anoAgricola = anoInicial(); redesenhar('[data-acao="os-ano-hoje"]'); return; }
      if (Telas.calendarioAgricola.aoClicar(e, redesenhar)) return;
      // Hoje, setas, dia, painel do dia, "+N talhões" e abrir/fechar as caixas de filtro: como no Calendário do plano
      Cal().aoClicar(e, ctx, acoes);
    });

    raiz.addEventListener('change', (e) => {
      // Filtros com caixas: "Todas" marca ou desmarca tudo; cada caixa liga ou desliga a opção
      if (e.target.dataset.campo === 'cal-filtro') {
        const chave = e.target.dataset.filtro;
        const valores = opcoes(chave).map((o) => o.valor);
        let marcados = valores.filter((v) => Cal().marcado(est, chave, v));
        if (e.target.value === 'todos') marcados = e.target.checked ? [...valores] : [];
        else if (e.target.checked) marcados.push(e.target.value);
        else marcados = marcados.filter((n) => n !== e.target.value);
        est[chave] = marcados.length === valores.length ? 'todos' : marcados;
        // Operação, como a legenda: com escolha, vai para a operação mais cedo; com todas, volta para hoje
        if (chave === 'operacao' && est.escala !== 'ano') {
          const primeira = est.operacao === 'todos' ? null : calcular().eventos[0];
          est.dataRef = primeira ? primeira.inicio : Cal().hojeIso();
          est.diaAberto = null;
        }
        est.filtroAberto = chave;
        redesenhar(`[data-campo="cal-filtro"][data-filtro="${chave}"][value="${CSS.escape(e.target.value)}"]`);
        return;
      }
      // Escala: para o Ano, o ano agrícola do dia mostrado (se tiver plano); do Ano para Mês, Semana ou Dia, o dia
      // mostrado antes, se estiver no ano agrícola; senão, hoje (no ano de hoje) ou o começo do ano agrícola
      if (e.target.dataset.campo === 'cal-escala' && (e.target.value === 'ano' || est.escala === 'ano')) {
        if (e.target.value === 'ano') {
          const a = anoDe(est.diaAberto || est.dataRef);
          if (anos().includes(a)) est.anoAgricola = a;
        } else if (anoDe(est.dataRef) !== est.anoAgricola) {
          est.dataRef = anoDe(Cal().hojeIso()) === est.anoAgricola ? Cal().hojeIso() : `${est.anoAgricola}-09-01`;
        }
        est.escala = e.target.value; est.diaAberto = null;
        redesenhar('[data-campo="cal-escala"]');
        return;
      }
      Cal().aoMudar(e, ctx, acoes);
    });

    raiz.addEventListener('input', (e) => Cal().aoDigitar(e, ctx));
    redesenhar();
  }

  // Esc: com uma caixa de filtro aberta, fecha a caixa (não age com modal ou menu aberto, que têm o próprio Esc)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || document.querySelector('.modal-fundo, .menu-contexto')) return;
    const aberta = document.querySelector('.os-cal .filtros .cal-filtro[open]');
    if (!aberta) return;
    e.preventDefault();
    aberta.open = false;
    est.filtroAberto = null;
    aberta.querySelector('.cal-filtro__botao').focus();
  });

  return { desenhar, aoMostrar };
})();
