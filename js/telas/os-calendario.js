/*
 * Agenda Agrícola, aba de Gestão da Lavoura › Operações Agrícolas (DECISOES 4.0): a grade Mês · Semana · Dia que antes ficava no Resumo do plano,
 * agora com as operações de vários planos somados, sem a associação a um plano. Usa a última versão publicada de cada
 * plano. Filtros com várias escolhas: Safra (Safra ou Safrinha), Empresa, Fazenda, Cultura e Talhão. Sem filtro de
 * Ano Agrícola: o tempo anda pelas setas do calendário. Abre no dia de hoje. A legenda filtra os grupos de operação.
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
    ['ciclo', 'Safra', ['Todas', 'Nenhuma', 'selecionadas']],
    ['empresa', 'Empresa', ['Todas', 'Nenhuma', 'empresas']],
    ['fazenda', 'Fazenda', ['Todas', 'Nenhuma', 'fazendas']],
    ['cultura', 'Cultura', ['Todas', 'Nenhuma', 'culturas']],
    ['talhao', 'Talhão', ['Todos', 'Nenhum', 'talhões']]
  ];

  // Estado da tela: período, dia aberto e filtros ('todos' ou a lista do que está marcado). Mantém-se ao navegar.
  const novoEstado = () => ({ escala: 'mes', dataRef: Cal().hojeIso(), ciclo: 'todos', empresa: 'todos', fazenda: 'todos',
    cultura: 'todos', talhao: 'todos', grupo: 'todos' });
  let est = null;

  const cicloDe = (p) => p.ciclo || 'Safra';
  const tipoDe = (grupo) => Util.normalizar(grupo.tipo || 'outro').replace(/\s+/g, '-');
  const comPublicada = () => DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p));
  const valorDe = { ciclo: cicloDe, empresa: (p) => p.empresa, fazenda: (p) => p.fazenda, cultura: (p) => p.cultura };
  const planosFiltrados = () => comPublicada().filter((p) => Object.keys(valorDe).every((c) => Cal().marcado(est, c, valorDe[c](p))));

  // Opções de cada filtro: o que existe nos planos com versão publicada. Talhão: os talhões dos planos que passam
  // pelos outros filtros, com a fazenda junto ("Santa Clara · T01"), porque o nome se repete entre fazendas.
  function opcoes(chave) {
    if (chave === 'talhao') {
      const vistos = new Map();
      planosFiltrados().forEach((p) => Util.talhoesPlano(p, Versoes.ultimaPublicada(p)).forEach((t) => {
        const valor = `${p.fazenda}|${t.nome}`;
        if (!vistos.has(valor)) vistos.set(valor, { valor, nome: `${p.fazenda} · ${t.nome}`, extra: Util.area(t.area) });
      }));
      return [...vistos.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
    }
    const ordem = { ciclo: ['Safra', 'Safrinha'], empresa: DADOS.empresas, fazenda: DADOS.fazendas, cultura: DADOS.culturasPlanos }[chave];
    const presentes = new Set(comPublicada().map(valorDe[chave]));
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
      const visiveis = lista.filter((it) => Cal().marcado(est, 'grupo', tipoDe(it.grupo)));
      Cal().eventos(ctx, visiveis).forEach((ev) => eventos.push({ ...ev, local,
        chave: `${p.id}:${ev.it.colheita ? 'colheita' : ev.it.op.id}` }));
    });
    eventos.sort((a, b) => a.inicio.localeCompare(b.inicio));
    const semData = itens.filter(({ it }) => Cal().marcado(est, 'grupo', tipoDe(it.grupo)) && !eventos.some((ev) => ev.it === it)).length;
    return { itens, eventos, semData };
  }

  // Grupos da legenda: os tipos que têm operação, na ordem Plantio, Fertilidade, Defensivo, Colheita (outros no fim)
  function gruposLegenda(itens) {
    const mapa = new Map();
    itens.forEach(({ it }) => { const t = tipoDe(it.grupo); if (!mapa.has(t)) mapa.set(t, it.grupo.nome); });
    const pos = (t) => (ORDEM_TIPO.includes(t) ? ORDEM_TIPO.indexOf(t) : 99);
    return [...mapa.entries()].map(([valor, nome]) => ({ valor, nome })).sort((a, b) => pos(a.valor) - pos(b.valor));
  }

  // Legenda que filtra (como era no Resumo): com todos ligados, clicar num grupo mostra só ele; depois, cada clique
  // liga ou desliga o grupo; desligar o último volta a todos
  function legenda(grupos) {
    const todos = grupos.every((o) => Cal().marcado(est, 'grupo', o.valor));
    return `
      <div class="cal-legenda" role="group" aria-label="Filtrar por grupo de operação">
        ${grupos.map((o) => {
          const ligado = Cal().marcado(est, 'grupo', o.valor);
          return `
            <button class="cal-leg ${ligado ? '' : 'cal-leg--desligado'}" type="button" data-acao="os-leg" data-grupo="${esc(o.valor)}" aria-pressed="${ligado && !todos}"
                    title="${todos ? `Mostrar só ${esc(o.nome)}` : ligado ? `Esconder ${esc(o.nome)}` : `Mostrar ${esc(o.nome)}`}">
              <span class="cal-ponto cal-ponto--${esc(o.valor)}"></span>${esc(o.nome)}</button>`;
        }).join('')}
        ${todos ? '' : '<button class="link-acao cal-legenda__todos" type="button" data-acao="os-leg-todos">Mostrar todos</button>'}
      </div>`;
  }

  function desenhar() {
    est = est || novoEstado();
    return `
      ${Telas.centralOperacoes.cabecalho('agenda')}
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

  function corpo() {
    const { itens, eventos, semData } = calcular();
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
        est = Object.assign(novoEstado(), { escala: est.escala, dataRef: est.dataRef });
        ctx.estado = est;
        redesenhar('[data-acao="os-limpar"]');
        return;
      }
      const leg = e.target.closest('[data-acao="os-leg"], [data-acao="os-leg-todos"]');
      if (leg) {
        const valores = gruposLegenda(calcular().itens).map((o) => o.valor);
        let marcados = valores.filter((v) => Cal().marcado(est, 'grupo', v));
        const v = leg.dataset.grupo;
        if (leg.dataset.acao === 'os-leg-todos') marcados = [...valores];
        else if (marcados.length === valores.length) marcados = [v];
        else if (marcados.includes(v)) marcados = marcados.filter((x) => x !== v);
        else marcados.push(v);
        est.grupo = !marcados.length || marcados.length === valores.length ? 'todos' : marcados;
        redesenhar(leg.dataset.acao === 'os-leg' ? `[data-acao="os-leg"][data-grupo="${CSS.escape(v)}"]` : '.cal-leg');
        return;
      }
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
        est.filtroAberto = chave;
        redesenhar(`[data-campo="cal-filtro"][data-filtro="${chave}"][value="${CSS.escape(e.target.value)}"]`);
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
