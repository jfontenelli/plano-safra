/*
 * Planejado x Executado (antes Aplicações, menu Monitoramento), no menu Gestão da Lavoura › Planejado x Executado.
 * Filtros com várias escolhas (as caixas da Agenda Agrícola): Safra (as do cadastro: 26/27, 27/27…), Cultura, Empresa, Fazenda,
 * Talhão, Grupo de operação (abre em Defensivo) e Operação (abre com as fungicidas do modelo), e Limpar filtros.
 * Tabela com uma linha por talhão: Fazenda, Talhão, Variedade, Plantas/m, Data de plantio, uma coluna por operação
 * marcada (na ordem do DAP), Aplicações executadas e Dias sem aplicação. Botões Planejado e Executado
 * (ao menos um ligado); com os dois, aparece a Dif. (dias). Usa a última versão publicada de cada plano.
 * Datas executadas e estande: simulados em DADOS.monitoramento (data executada = data de recomendação da OS).
 */
window.Telas = window.Telas || {};

window.Telas.monitoramentoAplicacoes = (function () {
  const Cal = () => Telas.calendario;
  const esc = Util.escapar;
  const FILTROS = [
    ['safra', 'Safra', ['Todas', 'Nenhuma', 'selecionadas']],
    ['cultura', 'Cultura', ['Todas', 'Nenhuma', 'culturas']],
    ['empresa', 'Empresa', ['Todas', 'Nenhuma', 'empresas']],
    ['fazenda', 'Fazenda', ['Todas', 'Nenhuma', 'fazendas']],
    ['talhao', 'Talhão', ['Todos', 'Nenhum', 'talhões']],
    ['grupo', 'Grupo de operação', ['Todos', 'Nenhum', 'grupos']],
    ['operacao', 'Operação', ['Todas', 'Nenhuma', 'operações']]
  ];

  // Padrão: o grupo Defensivo e as fungicidas do modelo de operações (1ª a 4ª Fungicida)
  const fungicidasModelo = () => ((DADOS.modeloOperacoes.find((g) => g.nome === 'Defensivo') || { operacoes: [] }).operacoes)
    .map((op) => op.nome).filter((n) => /fungicida/i.test(n));
  // Estado da tela: filtros ('todos' ou a lista do que está marcado), a visão (Tabela ou Linha do tempo), o status
  // escolhido na legenda e a ordenação. Mantém-se ao navegar.
  // Abre (e Limpar filtros volta) na safra atual, com marcadas só a Cultura, a Empresa e a Fazenda dos planos dela (as
  // outras ficam na lista, desmarcadas), Talhão em Todos, o grupo Defensivo e as fungicidas
  const novoEstado = () => {
    const safra = safraAtual();
    const daSafra = DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p) && p.safra === safra);
    const valores = (c) => (safra ? [...new Set(daSafra.map((p) => p[c]))] : 'todos');
    return { safra: safra ? [safra] : 'todos', cultura: valores('cultura'), empresa: valores('empresa'), fazenda: valores('fazenda'),
      talhao: 'todos', grupo: ['Defensivo'], operacao: fungicidasModelo(), visao: 'tabela', status: null };
  };
  // Safra atual: a que contém hoje (pelo cadastro: início e fim), a safra antes da safrinha; sem nenhuma, a mais recente
  function safraAtual() {
    const nomes = Util.ordenarSafras(DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p)).map((p) => p.safra));
    const safrinha = (s) => { const [a, b] = s.split('/'); return a === b; };
    const h = hoje();
    const vigentes = nomes.filter((n) => { const c = Util.cadastroSafra(n); return c.inicio && c.inicio <= h && h <= c.fim; });
    return vigentes.find((n) => !safrinha(n)) || vigentes[0] || nomes.find((n) => !safrinha(n)) || nomes[0] || null;
  }
  let est = null;

  // ----- Datas -----
  const sim = () => DADOS.monitoramento || { deslocamentos: [], talhoes: {} };
  const hoje = () => Util.hojeISO();
  function somaDias(iso, n) {
    const [a, m, d] = iso.split('-').map(Number);
    const dt = new Date(a, m - 1, d + n);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
  const diasEntre = (de, ate) => Math.round((Date.parse(ate) - Date.parse(de)) / 86400000);

  // ----- Planos e opções dos filtros -----
  const comPublicada = () => DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p));
  const valorDe = { safra: (p) => p.safra, cultura: (p) => p.cultura, empresa: (p) => p.empresa, fazenda: (p) => p.fazenda };
  const gruposDe = (p) => Versoes.grupos(p, Versoes.ultimaPublicada(p));
  const marcado = (chave, valor) => Cal().marcado(est, chave, valor);
  // Planos que passam por Safra, Cultura, Empresa, Fazenda e Talhão (com ao menos um talhão marcado). Esses filtros são
  // independentes: cada um mostra sempre todas as opções e só muda quando é mexido (ou com Limpar filtros)
  function passa(p) {
    if (!Object.keys(valorDe).every((c) => marcado(c, valorDe[c](p)))) return false;
    return est.talhao === 'todos'
      || Util.talhoesPlano(p, Versoes.ultimaPublicada(p)).some((t) => marcado('talhao', `${p.fazenda}|${t.nome}`));
  }
  const planosFiltrados = () => comPublicada().filter(passa);

  // Cada filtro só muda quando é mexido (ou com Limpar filtros). Exceção: a Operação, quando as marcadas não existem
  // com os outros filtros (ex.: as fungicidas da soja com a safra 27/27, de milho), volta a "Todas", para a tabela
  // mostrar o planejado. "Nenhuma" ([]) fica; sem nenhuma opção, também fica.
  function ajustarFiltros() {
    // Duração › Por talhão: uma Safra, uma Empresa e uma Fazenda por vez (fica a primeira marcada; sem nenhuma, a safra
    // atual ou a primeira opção)
    if (filtroUnico()) UNICOS.forEach((chave) => {
      const ops = opcoes(chave).map((o) => o.valor);
      const marcadas = ops.filter((v) => marcado(chave, v));
      if (marcadas.length === 1) return;
      const atual = chave === 'safra' && ops.includes(safraAtual()) ? safraAtual() : null;
      est[chave] = [marcadas[0] || atual || ops[0]].filter(Boolean);
    });
    const v = est.operacao;
    if (est.ultimo === 'operacao' || !Array.isArray(v) || !v.length) return;
    const ops = opcoes('operacao');
    if (ops.length && !ops.some((o) => v.includes(o.valor))) est.operacao = 'todos';
  }
  const UNICOS = ['safra', 'empresa', 'fazenda'];
  // Duração › Por talhão: abre (e Limpar filtros volta) com todos os grupos e todas as operações, na primeira operação
  // pela ordem do DAP; depois, obedece aos filtros
  function padraoDuracao() {
    if (!filtroUnico()) return;
    est.grupo = 'todos';
    est.operacao = 'todos';
    est.opDuracao = null;
  }
  const filtroUnico = () => est.visao === 'duracao' && (est.duracao || 'talhao') === 'talhao';
  // DAP da operação para a ordem das colunas: Plantio 0; Colheita no fim (vem do ciclo da variedade); sem DAP, no fim
  function dapDe(g, op) {
    if (g.tipo === 'Sementes') return 0;
    if (g.tipo === 'Colheita' || op.dap === null || op.dap === undefined || op.dap === '') return Infinity;
    return Number(op.dap);
  }

  // Opções de cada filtro. Safra, Cultura, Empresa, Fazenda e Talhão: tudo o que existe nos planos com versão publicada
  // (Talhão com a fazenda junto, "Santa Clara · T01", porque o nome se repete entre fazendas). Grupo de operação e
  // Operação: os dos planos que passam pelos filtros; Operação, só dos grupos marcados, na ordem do DAP.
  function opcoes(chave) {
    if (chave === 'talhao') {
      const vistos = new Map();
      comPublicada().forEach((p) => Util.talhoesPlano(p, Versoes.ultimaPublicada(p)).forEach((t) => {
        const valor = `${p.fazenda}|${t.nome}`;
        if (!vistos.has(valor)) vistos.set(valor, { valor, nome: `${p.fazenda} · ${t.nome}`, extra: Util.area(t.area) });
      }));
      return [...vistos.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
    }
    if (chave === 'grupo') {
      const nomes = [];
      planosFiltrados().forEach((p) => gruposDe(p).forEach((g) => { if (!nomes.includes(g.nome)) nomes.push(g.nome); }));
      return nomes.map((n) => ({ valor: n, nome: n }));
    }
    if (chave === 'operacao') return operacoes().map((o) => ({ valor: o.nome, nome: o.nome }));
    const presentes = new Set(comPublicada().map(valorDe[chave]));
    // Safra: as do cadastro (26/27, 27/27…), na ordem do cadastro
    if (chave === 'safra') return Util.ordenarSafras([...presentes]).map((x) => ({ valor: x, nome: x }));
    const ordem = { cultura: DADOS.culturasPlanos, empresa: DADOS.empresas, fazenda: DADOS.fazendas }[chave];
    return ordem.filter((x) => presentes.has(x)).map((x) => ({ valor: x, nome: x }));
  }

  // Operações dos grupos marcados (nome e o menor DAP entre os planos), na ordem do DAP
  function operacoes() {
    const porNome = new Map();
    const plantios = new Set();
    planosFiltrados().forEach((p) => gruposDe(p).filter((g) => Cal().marcado(est, 'grupo', g.nome))
      .forEach((g) => g.operacoes.forEach((op) => {
        if (!op.nome) return;
        porNome.set(op.nome, Math.min(porNome.get(op.nome) ?? Infinity, dapDe(g, op)));
        if (g.tipo === 'Sementes') plantios.add(op.nome);
      })));
    const todas = [...porNome].map(([nome, dap]) => ({ nome, dap, plantio: plantios.has(nome) }))
      .sort((a, b) => a.dap - b.dap || a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
    // Só as planejadas em ao menos um talhão filtrado (ex.: a Gessagem do modelo, sem talhões no plano da Boa Vista, fica
    // de fora: sem coluna, sem opção no filtro Operação e sem gráfico)
    const planejadas = new Set();
    linhas(todas).forEach((r) => Object.keys(r.aplic).forEach((n) => planejadas.add(n)));
    return todas.filter((o) => planejadas.has(o.nome));
  }

  // ----- Linhas: uma por talhão (com ao menos uma operação marcada planejada) -----
  // Data executada (simulada): a de recomendação da OS escrita nos dados, se houver; senão, a planejada + o deslocamento
  // do talhão (ou o da sequência). Só conta se já chegou (até hoje).
  const osDe = (p, talhao, operacao) => (DADOS.ordensServico || []).find((o) => o.fazenda === p.fazenda && o.safra === p.safra
    && o.operacao === operacao && o.talhoes.includes(talhao));
  function executada(p, talhao, operacao, planejado, s, i) {
    const os = osDe(p, talhao, operacao);
    if (os) return os.abertura <= hoje() ? os.abertura : null;
    const lista = sim().deslocamentos;
    const d = operacao in s ? s[operacao] : lista.length ? lista[i % lista.length] : 0;
    if (d === null) return null;
    const data = somaDias(planejado, d);
    return data <= hoje() ? data : null;
  }
  // Data de fechamento da OS (simulada): a da OS escrita nos dados, se fechada; senão, a executada + o prazo de conclusão
  // + o desvio da sequência DADOS.monitoramento.duracoes (ao menos 1 dia). Só conta se já chegou (OS fechada até hoje).
  function fechamento(p, talhao, operacao, exec, prazo, i) {
    if (!exec) return null;
    const os = osDe(p, talhao, operacao);
    if (os) return os.status === 'fechada' && os.fechamento && os.fechamento <= hoje() ? os.fechamento : null;
    const lista = sim().duracoes || [];
    const data = somaDias(exec, Math.max(1, prazo + (lista.length ? lista[i % lista.length] : 0)));
    return data <= hoje() ? data : null;
  }

  function linhas(cols) {
    const nomes = cols.map((c) => c.nome);
    const saida = [];
    planosFiltrados().forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const grupos = Versoes.grupos(p, v);
      const gPlantio = grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] };
      const plantio = gPlantio.operacoes[0] || null;
      const simPlano = sim().talhoes[`${p.fazenda} ${p.safra}`] || {};
      Util.talhoesPlano(p, v).forEach((t, iT) => {
        if (!Cal().marcado(est, 'talhao', `${p.fazenda}|${t.nome}`)) return;
        const base = plantio ? Planos.dataPlantioTalhao(plantio, t.nome) : null;
        if (!base) return;
        const s = simPlano[t.nome] || {};
        const variedades = [...new Set(Planos.linhasPlantio(plantio, t.nome).map((l) => l.variedade).filter(Boolean))];
        const execPlantio = executada(p, t.nome, 'Plantio', base, s, iT);
        const prazoPlantio = Cal().prazoDe(plantio, gPlantio);
        const dataPlantio = { planejado: base, executada: execPlantio, prazo: prazoPlantio,
          fechamento: fechamento(p, t.nome, 'Plantio', execPlantio, prazoPlantio, iT) };
        const aplic = {};
        grupos.filter((g) => Cal().marcado(est, 'grupo', g.nome)).forEach((g) => g.operacoes.forEach((op) => {
          if (!nomes.includes(op.nome)) return;
          // Plantio: a mesma da coluna Data de plantio; Colheita: plantio + ciclo da primeira variedade
          if (g.tipo === 'Sementes') { if (op === plantio) aplic[op.nome] = dataPlantio; return; }
          let planejado;
          if (g.tipo === 'Colheita') {
            const ciclo = (DADOS.variedades.find((x) => x.nome === variedades[0]) || {}).ciclo;
            if (op !== g.operacoes[0] || !ciclo) return;
            planejado = somaDias(base, ciclo);
          } else {
            if (!op.talhoes[t.nome] || op.dap === null || op.dap === undefined || op.dap === '') return;
            planejado = somaDias(base, Number(op.dap));
          }
          const i = iT * 3 + nomes.indexOf(op.nome);
          const exec = executada(p, t.nome, op.nome, planejado, s, i);
          const prazo = Cal().prazoDe(op, g);
          aplic[op.nome] = { planejado, executada: exec, prazo, fechamento: fechamento(p, t.nome, op.nome, exec, prazo, i) };
        }));
        const total = Object.keys(aplic).length;
        if (!total) return;
        const feitas = Object.values(aplic).map((a) => a.executada).filter(Boolean).sort();
        saida.push({ plano: p, talhao: t.nome, variedades, plantio: dataPlantio,
          plantasM: s.plantasM ?? null, aplic, total, feitas: feitas.length,
          ultima: feitas.length ? diasEntre(feitas[feitas.length - 1], hoje()) : null });
      });
    });
    return saida.sort((a, b) => a.plano.fazenda.localeCompare(b.plano.fazenda, 'pt-BR')
      || a.plano.safra.localeCompare(b.plano.safra) || a.talhao.localeCompare(b.talhao, 'pt-BR', { numeric: true }));
  }

  // ----- Desenho -----
  function desenhar() {
    est = est || novoEstado();
    return `
      <header class="cabecalho oa-cabecalho ma-cabecalho" data-ma-cabecalho>${cabecalho()}</header>
      <div class="pagina ma">
        <section class="cartao filtros" aria-label="Filtrar o monitoramento" data-ma-filtros></section>
        <section class="cartao oc-lista ma-lista" aria-label="Aplicações por talhão" data-ma-tabela></section>
      </div>`;
  }

  // Cabeçalho: caminho, título, subtítulo (conforme a guia) e as guias, no mesmo formato das abas do plano (Operações ·
  // Planejamento · Programação): Executadas (tabela), Planejadas × Executadas (desvio por operação) e Duração da Operação
  const GUIAS = [
    ['tabela', 'Executadas', 'Consulte as datas de execução e o status das operações por talhão.'],
    ['linha', 'Planejadas × Executadas', 'Compare as datas planejadas e executadas das operações por talhão.'],
    ['duracao', 'Duração da Operação', 'Compare a duração das OS fechadas com o prazo de conclusão da operação.']
  ];
  function cabecalho() {
    const [, , subtitulo] = GUIAS.find(([id]) => id === est.visao);
    return `
      ${Telas.gestaoLavoura.caminho('Planejado x Executado')}
      <div class="oa-cabecalho__titulo">
        <h1 class="cabecalho__titulo">Planejado x Executado</h1>
        <p class="cabecalho__subtitulo">${subtitulo}</p>
      </div>
      <nav class="etapas ma-guias" aria-label="Guias de Planejado x Executado">
        ${GUIAS.map(([id, nome]) => `<button class="etapa ${id === est.visao ? 'etapa--ativa' : ''}" type="button" data-ma-visao="${id}"
          ${id === est.visao ? 'aria-current="page"' : ''}>${nome}</button>`).join('')}
      </nav>`;
  }

  function filtros() {
    return `
      ${FILTROS.map(([chave, rotulo, textos]) => `
        <div class="campo">
          <span class="campo__rotulo">${rotulo}</span>
          ${Cal().filtroCaixa(est, chave, opcoes(chave), textos, rotulo, { unico: filtroUnico() && UNICOS.includes(chave) })}
        </div>`).join('')}
      <button class="link-acao filtros__limpar" type="button" data-acao="ma-limpar">${Icones.limpar} Limpar filtros</button>`;
  }

  // Status da aplicação, mostrado numa etiqueta na célula dela, com a legenda
  const STATUS = [['adiantada', 'Iniciada antes'], ['prazo', 'Iniciada na data'], ['atrasada', 'Iniciada com atraso'], ['pendente', 'Não iniciada'], ['futura', 'Planejada']];
  function statusDe(a) {
    if (!a.executada) return a.planejado <= hoje() ? 'pendente' : 'futura';
    const d = diasEntre(a.planejado, a.executada);
    return d < 0 ? 'adiantada' : d > 0 ? 'atrasada' : 'prazo';
  }

  // Célula de uma aplicação (a = { planejado, executada } ou undefined, quando não está planejada no talhão): a data
  // executada numa etiqueta na cor do status ("—" sem execução). fixa: a posição entre as colunas congeladas (só a Data
  // de plantio, com o Plantio marcado)
  function celula(a, fixa = null) {
    const st = a ? statusDe(a) : null;
    const congela = fixa === null ? '' : ` data-fixa="${fixa}"`;
    const cls = `ma-ini ${fixa === null ? '' : 'ma-fixa ma-fixa--ultima'}`;
    // Status escolhido na legenda: a aplicação em outro status fica vazia
    if (st && est.status && st !== est.status) return `<td class="${cls}"${congela}></td>`;
    if (!a) return `<td class="${cls} ma-vazio"${congela}>—</td>`;
    // Sem execução: Não iniciada com a exclamação e o nome; Planejada (a futura) com o calendário com relógio e a data planejada, em cinza
    const texto = a.executada ? Util.data(a.executada) : st === 'pendente' ? `${Icones.pendente}${Util.data(a.planejado)}` : `${Icones.futura}${Util.data(a.planejado)}`;
    return `<td class="${cls}"${congela}><span class="ma-etiqueta ma-st--${st}" title="${STATUS.find(([x]) => x === st)[1]}${st === 'futura' ? ` para ${Util.data(a.planejado)}` : st === 'pendente' ? ` · planejada para ${Util.data(a.planejado)}` : ''}">${texto}</span></td>`;
  }

  // ----- Ordenação: est.ordem = { coluna, sentido }. Colunas: fazenda, talhao, variedade, plantasM, plantio, feitas,
  // ultima e, nas aplicações, "op|nome da operação" (a data executada). Vazios sempre no fim; empate: a ordem padrão
  // (fazenda, safra e talhão). -----
  function valorOrdem(r, coluna) {
    const fixos = { fazenda: r.plano.fazenda, talhao: r.talhao, variedade: r.variedades.join(', ') || null, plantasM: r.plantasM,
      plantio: r.plantio.executada, feitas: r.total ? r.feitas / r.total : null, ultima: r.ultima };
    if (coluna in fixos) return fixos[coluna];
    const a = r.aplic[coluna.slice(3)];
    return a ? a.executada : null;
  }
  function ordenar(ls) {
    const o = est.ordem;
    if (!o) return ls;
    const sentido = o.sentido === 'desc' ? -1 : 1;
    return ls.map((r, i) => ({ r, i, v: valorOrdem(r, o.coluna) })).sort((x, y) => {
      const xv = x.v === null || x.v === undefined;
      const yv = y.v === null || y.v === undefined;
      if (xv || yv) return xv - yv || x.i - y.i;
      const c = typeof x.v === 'number' ? x.v - y.v : String(x.v).localeCompare(String(y.v), 'pt-BR', { numeric: true });
      return c * sentido || x.i - y.i;
    }).map((x) => x.r);
  }

  // ----- Planejada × Executada: uma linha por talhão e uma coluna por operação marcada (sem o Plantio). À esquerda, o
  // talhão. Em cada operação, todos na mesma altura: o ponto na linha, na cor do status; a etiqueta em cima ("+2 d",
  // "−3 d", "Não iniciada 10 d", "Em 4 d"), acima dela o nome do status (só nas executadas) e embaixo "Planejada:" / "Executada:".
  // Iniciada na data: sem a etiqueta ("0 d"). Não iniciada: só o ponto vermelho. Planejada: círculo tracejado. -----
  const MT_ZERO = 90;   // altura (px) da linha do ponto
  const diaMes = (iso) => Util.data(iso).slice(0, 5);
  const desvio = (a) => (a.executada ? diasEntre(a.planejado, a.executada) : 0);
  function textoStatus(a, st) {
    if (st === 'pendente') return `Não iniciada ${diasEntre(a.planejado, hoje())} d`;
    if (st === 'futura') return `Em ${diasEntre(hoje(), a.planejado)} d`;
    return dias(desvio(a));
  }
  // Desvio em dias com o sinal: "+2 d", "0 d", "−3 d"
  const dias = (d) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d)} d`;

  function evento(a, nome) {
    const st = statusDe(a);
    if (est.status && st !== est.status) return '';
    const titulo = `${nome} · ${STATUS.find(([x]) => x === st)[1]} · planejada ${Util.data(a.planejado)}${a.executada ? ` · executada ${Util.data(a.executada)}` : ''}`;
    return `
      <div class="mt-ev" title="${esc(titulo)}">
        <span class="mt-ponto mt-ponto--${st}" style="top:${MT_ZERO}px"></span>
        ${a.executada ? `<strong class="mt-ev__nome mt-cor--${st}" style="top:${MT_ZERO - 52}px">${STATUS.find(([x]) => x === st)[1]}</strong>` : ''}
        ${st === 'prazo' ? '' : `<span class="mt-ev__status ma-etiqueta ma-st--${st}" style="top:${MT_ZERO - 12}px">${textoStatus(a, st)}</span>`}
        <span class="mt-ev__datas" style="top:${MT_ZERO + 12}px">Planejada: ${diaMes(a.planejado)}${a.executada ? `<br>Executada: ${diaMes(a.executada)}` : ''}</span>
      </div>`;
  }

  function linhaDoTempo(ls, cols) {
    if (!ls.length) return `<p class="ma-construcao">${est.status ? `Nenhum talhão com aplicação ${STATUS.find(([x]) => x === est.status)[1].toLowerCase()}.` : 'Nenhum talhão com essas operações planejadas.'}</p>`;
    const faixa = (r) => {
      const ops = cols.filter((c) => r.aplic[c.nome]);
      const aps = ops.map((c) => r.aplic[c.nome]);
      const sts = aps.map(statusDe);
      const feitas = aps.filter((a) => a.executada).length;
      return `
        <div class="mt-linha">
          <div class="mt-esq">
            <div class="mt-talhao">
              <p class="mt-talhao__nome"><strong>${esc(r.talhao)}</strong></p>
              <p class="mt-talhao__fazenda">${esc(r.plano.fazenda)}</p>
              <p class="mt-talhao__var">${esc(r.variedades.join(', ') || '—')}</p>
              <p class="mt-talhao__ops">Operações</p>
              <div class="mt-segmentos">${sts.map((s, i) => `<span class="mt-segmento mt-fundo--${s}" title="${esc(ops[i].nome)}: ${STATUS.find(([x]) => x === s)[1]}"></span>`).join('')}</div>
              <p class="mt-talhao__conta">${feitas} de ${aps.length} ${aps.length === 1 ? 'executada' : 'executadas'} <span class="mt-talhao__pct">${aps.length ? Math.round((feitas / aps.length) * 100) : 0}%</span></p>
            </div>
          </div>
          ${cols.map((c) => `<div class="mt-op" style="--mt-zero:${MT_ZERO}px">${r.aplic[c.nome] ? evento(r.aplic[c.nome], c.nome) : ''}</div>`).join('')}
        </div>`;
    };
    return `
      <div class="mt-rolagem">
        <div class="mt">
          <div class="mt-linha mt-linha--cabecalho">
            <div class="mt-esq"><div class="mt-talhao mt-talhao--cabecalho">Talhão</div></div>
            ${cols.map((c) => `<div class="mt-op mt-op--cabecalho">${esc(c.nome)}</div>`).join('')}
          </div>
          ${ls.map(faixa).join('')}
        </div>
      </div>
      <p class="cc-tabela__rodape">${ls.length.toLocaleString('pt-BR')} ${ls.length === 1 ? 'talhão' : 'talhões'} · Hoje: ${Util.data(hoje())}</p>`;
  }

  // ----- Duração da Operação: só as OS fechadas; duração = da abertura da recomendação (data executada) até o
  // fechamento da OS, em dias. Por talhão: um gráfico por operação marcada, uma barra por talhão, com a linha do prazo de
  // conclusão. Por operação: um gráfico, uma barra por operação com a média das durações dos talhões (arredondada) e um
  // tracejado curto no prazo. Barras verdes; números em cinza escuro. -----
  const MD_ALTURA = 220;
  const duracaoDe = (a) => (a && a.fechamento ? diasEntre(a.executada, a.fechamento) : null);
  const media = (xs) => Math.round(xs.reduce((s, x) => s + x, 0) / xs.length);
  const plural = (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`;
  // Eixo: de 0 ao passo acima do maior valor (duração ou prazo), com 5 marcas no máximo
  function escalaDuracao(maior) {
    const passo = [1, 2, 5, 10, 20, 50].find((p) => p * 5 >= maior + 1) || 100;
    return { topo: passo * Math.ceil((maior + 1) / passo), passo };
  }
  // barras: [{ rotulo, sub, valor, texto, prazo, titulo }]; prazoUnico: o prazo da linha inteira (Por talhão, se igual em todos).
  // O número fica acima da barra e do prazo, para o tracejado não passar por cima dele
  function graficoDuracao(barras, { prazoUnico = null, eixoX = '', larga = false } = {}) {
    const { topo, passo } = escalaDuracao(Math.max(...barras.map((b) => Math.max(b.valor, b.prazo))));
    const pct = (v) => `${(v / topo) * 100}%`;
    const marcas = [];
    for (let v = 0; v <= topo; v += passo) marcas.push(v);
    return `
      <div class="md-grafico ${larga ? 'md-grafico--larga' : ''}">
        <p class="md-grafico__eixo-y">Duração (dias)</p>
        <div class="md-plot" style="height:${MD_ALTURA}px">
          ${marcas.map((v) => `<div class="md-grade" style="bottom:${pct(v)}"><span>${v}</span></div>`).join('')}
          ${prazoUnico !== null ? `<div class="md-prazo" style="bottom:${pct(prazoUnico)}"><span>${plural(prazoUnico)}</span></div>` : ''}
          ${barras.map((b) => `
            <div class="md-col" title="${esc(b.titulo)}">
              ${prazoUnico === null ? `<span class="md-prazo-curto" style="bottom:${pct(b.prazo)}"></span>` : ''}
              <div class="md-barra" style="height:${pct(b.valor)}"></div>
              <span class="md-valor" style="bottom:calc(${pct(Math.max(b.valor, prazoUnico ?? b.prazo))} + 6px)">${b.texto}</span>
            </div>`).join('')}
        </div>
        <div class="md-rotulos">
          ${barras.map((b) => `<div class="md-rotulo"><strong>${esc(b.rotulo)}</strong>${b.sub ? `<span>${esc(b.sub)}</span>` : ''}</div>`).join('')}
        </div>
        ${eixoX ? `<p class="md-grafico__eixo-x">${eixoX}</p>` : ''}
        <ul class="md-legenda" aria-label="Legenda">
          <li><span class="md-legenda__barra" aria-hidden="true"></span>Duração da execução</li>
          <li><span class="md-legenda__prazo" aria-hidden="true"></span>Prazo de conclusão</li>
        </ul>
      </div>`;
  }

  // Todas as operações marcadas, inclusive o Plantio e a Colheita, na ordem do DAP
  function duracao(ls, cols) {
    const variasFazendas = new Set(ls.map((r) => r.plano.fazenda)).size > 1;
    if (est.duracao === 'operacao') {
      const barras = cols.map((c) => {
        const aps = ls.map((r) => r.aplic[c.nome]).filter((a) => duracaoDe(a) !== null);
        if (!aps.length) return null;
        const valor = media(aps.map(duracaoDe));
        const prazo = media(aps.map((a) => a.prazo));
        return { rotulo: c.nome, sub: `Prazo: ${prazo} d`, valor, texto: `${valor} d`, prazo,
          titulo: `${c.nome} · média de ${plural(valor)} em ${aps.length} ${aps.length === 1 ? 'talhão' : 'talhões'} · prazo de ${plural(prazo)}` };
      }).filter(Boolean);
      return `<div class="md-rolagem"><section class="md-secao">
        <div class="md-nav">${chaveDuracao()}</div>
        ${barras.length ? graficoDuracao(barras, { larga: true }) : '<p class="ma-construcao">Nenhuma OS fechada nessas operações.</p>'}
      </section></div>`;
    }
    // Por talhão: uma operação por vez (est.opDuracao), com ‹ › para recuar e avançar; só as operações com ao menos uma
    // OS fechada (est.opsDuracao: a lista do ‹ ›)
    if (!cols.length) return semOperacao();
    cols = cols.filter((c) => ls.some((r) => duracaoDe(r.aplic[c.nome]) !== null));
    est.opsDuracao = cols.map((c) => c.nome);
    if (!cols.length) return semOperacao('Nenhuma OS fechada nessas operações.');
    const iOp = Math.max(0, cols.findIndex((c) => c.nome === est.opDuracao));
    est.opDuracao = cols[iOp].nome;
    const secoes = [cols[iOp]].map((c) => {
      const barras = ls.filter((r) => duracaoDe(r.aplic[c.nome]) !== null).map((r) => {
        const a = r.aplic[c.nome];
        const valor = duracaoDe(a);
        return { rotulo: r.talhao, sub: variasFazendas ? r.plano.fazenda : '', valor, texto: String(valor), prazo: a.prazo,
          titulo: `${r.talhao} · ${r.plano.fazenda} · ${plural(valor)} (abertura ${Util.data(a.executada)}, fechamento ${Util.data(a.fechamento)}) · prazo de ${plural(a.prazo)}` };
      });
      const prazos = [...new Set(barras.map((b) => b.prazo))].sort((x, y) => x - y);
      const prazoTexto = !barras.length ? '' : prazos.length === 1 ? plural(prazos[0]) : `de ${prazos[0]} a ${plural(prazos[prazos.length - 1])}`;
      return `
        <section class="md-secao">
          <div class="md-nav">
            <div class="md-nav__setas">
              <button class="botao-icone" type="button" data-ma-op="-1" aria-label="Operação anterior" ${iOp === 0 ? 'disabled' : ''}>${Icones.anterior}</button>
              <button class="botao-icone" type="button" data-ma-op="1" aria-label="Próxima operação" ${iOp === cols.length - 1 ? 'disabled' : ''}>${Icones.proxima}</button>
            </div>
            <div class="md-nav__titulo">
              <h3 class="md-secao__titulo">${esc(c.nome)} <span class="md-nav__conta">${iOp + 1} de ${cols.length}</span></h3>
              ${barras.length ? `<p class="md-secao__prazo">Prazo de conclusão: ${prazoTexto}</p>` : ''}
            </div>
            ${chaveDuracao()}
          </div>
          ${barras.length ? `
            ${graficoDuracao(barras, { prazoUnico: prazos.length === 1 ? prazos[0] : null, eixoX: 'Talhões' })}`
            : '<p class="md-secao__vazio">Nenhuma OS fechada nesta operação.</p>'}
        </section>`;
    }).join('');
    return `<div class="md-rolagem">${secoes}</div>`;
  }

  // Chave Por talhão | Por operação: à direita, no alto da área do gráfico (a legenda fica no rodapé do gráfico)
  function chaveDuracao() {
    const modo = est.duracao || 'talhao';
    const botao = (valor, nome) => `<button class="md-modo__botao ${modo === valor ? 'md-modo__botao--ativo' : ''}" type="button"
      data-ma-duracao="${valor}" aria-pressed="${modo === valor}">${nome}</button>`;
    return `<div class="md-modo" role="group" aria-label="Agrupar por">${botao('talhao', 'Por talhão')}${botao('operacao', 'Por operação')}</div>`;
  }
  const semOperacao = (texto = 'Marque ao menos uma operação no filtro Operação.') => `<section class="md-secao"><div class="md-nav">${chaveDuracao()}</div>
    <p class="ma-construcao">${texto}</p></section>`;

  function tabela() {
    let cols = operacoes().filter((o) => Cal().marcado(est, 'operacao', o.nome));
    // Duração: sem a legenda de status (não filtra pelo status escolhido nas outras guias)
    if (est.visao === 'duracao') return cols.length ? duracao(linhas(cols), cols) : semOperacao();
    // Status escolhido na legenda: só os talhões com ao menos uma aplicação nesse status
    const ls = ordenar(linhas(cols).filter((r) => !est.status || Object.values(r.aplic).some((a) => statusDe(a) === est.status)));
    // O Plantio marcado não ganha coluna: é a Data de plantio, com a etiqueta do status (e entra nas Aplicações executadas)
    const temOperacao = cols.length > 0;
    const plantioMarcado = cols.some((c) => c.plantio);
    cols = cols.filter((c) => !c.plantio);
    // Com um status escolhido, só as operações que têm aplicação nesse status
    if (est.status) cols = cols.filter((c) => ls.some((r) => r.aplic[c.nome] && statusDe(r.aplic[c.nome]) === est.status));
    if (est.visao === 'linha') return `${barra()}${temOperacao ? linhaDoTempo(ls, cols) : '<p class="ma-construcao">Marque ao menos uma operação no filtro Operação.</p>'}`;
    // Título com a seta de ordenar (como nas outras tabelas)
    const o = est.ordem || {};
    const th = (id, rotulo, cls, extra = '') => {
      const ativa = o.coluna === id;
      return `<th class="${cls}" ${extra} ${ativa ? `aria-sort="${o.sentido === 'asc' ? 'ascending' : 'descending'}"` : ''}>
        <span class="titulo-coluna"><span>${esc(rotulo)}</span><button class="titulo-ordenar ${ativa ? 'titulo-ordenar--ativo' : ''} ${ativa && o.sentido === 'desc' ? 'titulo-ordenar--desc' : ''}"
          type="button" data-ma-ordenar="${esc(id)}" title="Ordenar por ${esc(rotulo.toLowerCase())}" aria-label="Ordenar por ${esc(rotulo.toLowerCase())}">${ativa ? Icones.acima : Icones.ordenar}</button></span></th>`;
    };
    const colunas = 7 + cols.length;
    return `
      ${barra()}
      <div class="tabela-rolagem ma-tabela__rolagem">
        <table class="tabela oc-tabela ma-tabela">
          <thead>
            <tr>
              ${th('fazenda', 'Fazenda', 'ma-fixa', 'data-fixa="0"')}
              ${th('talhao', 'Talhão', 'ma-ini ma-fixa', 'data-fixa="1"')}
              ${th('variedade', 'Variedade', 'ma-ini ma-fixa', 'data-fixa="2"')}
              ${th('plantasM', 'Plantas/m', 'ma-ini ma-fixa tabela__numero', 'data-fixa="3"')}
              ${th('plantio', 'Data de plantio', 'ma-ini ma-fixa ma-fixa--ultima', 'data-fixa="4"')}
              ${cols.map((c) => th(`op|${c.nome}`, c.nome, 'ma-ini ma-quebra')).join('')}
              ${th('feitas', 'Aplicações executadas', 'ma-ini ma-quebra tabela__numero')}
              ${th('ultima', 'Dias sem aplicação', 'ma-ini ma-quebra tabela__numero')}
            </tr>
          </thead>
          <tbody>
            ${!temOperacao ? `<tr><td class="tabela__vazia" colspan="${colunas}">Marque ao menos uma operação no filtro Operação.</td></tr>`
              : ls.length ? ls.map((r) => `
              <tr>
                <td class="ma-fixa" data-fixa="0">${esc(r.plano.fazenda)}</td>
                <td class="ma-ini ma-talhao ma-fixa" data-fixa="1">${esc(r.talhao)}</td>
                <td class="ma-ini ma-variedade ma-fixa" data-fixa="2">${esc(r.variedades.join(', ') || '—')}</td>
                <td class="ma-ini tabela__numero ma-fixa" data-fixa="3">${r.plantasM === null ? '—' : Math.round(r.plantasM).toLocaleString('pt-BR')}</td>
                ${plantioMarcado ? celula(r.plantio, 4) : `<td class="ma-ini ma-fixa ma-fixa--ultima" data-fixa="4">${r.plantio.executada ? Util.data(r.plantio.executada) : '—'}</td>`}
                ${cols.map((c) => celula(r.aplic[c.nome])).join('')}
                <td class="ma-ini tabela__numero">${r.feitas}/${r.total}</td>
                <td class="ma-ini tabela__numero">${r.ultima === null ? '—' : r.ultima}</td>
              </tr>`).join('')
              : `<tr><td class="tabela__vazia" colspan="${colunas}">${est.status ? `Nenhum talhão com aplicação ${STATUS.find(([x]) => x === est.status)[1].toLowerCase()}.` : 'Nenhum talhão com essas operações planejadas.'}</td></tr>`}
          </tbody>
        </table>
      </div>
      <p class="cc-tabela__rodape">${ls.length.toLocaleString('pt-BR')} ${ls.length === 1 ? 'talhão' : 'talhões'} · Dias contados até hoje, ${Util.data(hoje())}</p>`;
  }

  // Colunas congeladas (Fazenda até Data de plantio): cada uma fica à esquerda, logo depois das anteriores
  function congelar(caixa) {
    const t = caixa.querySelector('.ma-tabela');
    if (!t) return;
    const ref = t.tBodies[0].rows[0];
    const cels = ref ? [...ref.querySelectorAll('[data-fixa]')] : [];
    if (!cels.length) return;
    const esquerda = [];
    let x = 0;
    cels.forEach((c) => { esquerda[c.dataset.fixa] = x; x += c.getBoundingClientRect().width; });
    t.querySelectorAll('[data-fixa]').forEach((c) => { c.style.left = `${esquerda[c.dataset.fixa]}px`; });
  }

  // Barra acima da tabela: legenda dos status da aplicação (clicável), com as bolinhas da visão Planejada × Executada
  const LEGENDA = ['pendente', 'adiantada', 'prazo', 'atrasada', 'futura'].map((id) => STATUS.find(([x]) => x === id));
  // Dica de cada item da legenda (ao clicar, filtra os talhões; clicado de novo, mostra todos)
  const DICA_LEGENDA = {
    futura: 'A data planejada para início ainda não chegou.',
    adiantada: 'A operação foi iniciada antes da data planejada.',
    prazo: 'A operação foi iniciada na data planejada.',
    atrasada: 'A operação foi iniciada após a data planejada.',
    pendente: 'A data planejada já passou, mas a operação ainda não foi iniciada.',
  };
  function barra() {
    return `
      <div class="ma-barra">
        <div class="ma-legenda">
          <span class="ma-legenda__titulo">Operação</span>
          <ul aria-label="Status da aplicação">
            ${LEGENDA.map(([id, nome]) => `<li><button class="ma-legenda__item ${est.status && est.status !== id ? 'ma-legenda__item--apagado' : ''}" type="button"
                data-ma-status="${id}" aria-pressed="${est.status === id}" title="${est.status === id ? 'Mostrar todos os talhões' : DICA_LEGENDA[id]}">
                ${id === 'pendente' && est.visao === 'tabela' ? `<span class="ma-legenda__icone ma-st--pendente" aria-hidden="true">${Icones.pendente}</span>` : `<span class="ma-legenda__cor mt-ponto--${id}" aria-hidden="true"></span>`}${nome}</button></li>`).join('')}
          </ul>
        </div>
      </div>`;
  }

  function aoMostrar(conteudo) {
    est = est || novoEstado();
    // Os eventos ficam na página da tela (a área de conteúdo é a mesma para todas as telas)
    const raiz = conteudo.querySelector('.ma');
    const caixaFiltros = raiz.querySelector('[data-ma-filtros]');
    const caixaTabela = raiz.querySelector('[data-ma-tabela]');
    const caixaCabecalho = conteudo.querySelector('[data-ma-cabecalho]');
    // Redesenha e devolve o foco ao elemento equivalente
    const redesenhar = (foco) => {
      ajustarFiltros();
      caixaFiltros.innerHTML = filtros();
      caixaCabecalho.innerHTML = cabecalho();
      caixaTabela.innerHTML = tabela();
      congelar(caixaTabela);
      if (foco) conteudo.querySelector(foco)?.focus();
    };
    const ctx = { estado: est };

    // Guias Executadas · Planejadas × Executadas · Duração da Operação (no cabeçalho, fora da página da tela)
    caixaCabecalho.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ma-visao]');
      if (!b) return;
      const entrou = est.visao !== b.dataset.maVisao;
      est.visao = b.dataset.maVisao;
      if (entrou) padraoDuracao();
      redesenhar(`[data-ma-visao="${est.visao}"]`);
    });

    raiz.addEventListener('click', (e) => {
      if (e.target.closest('[data-acao="ma-limpar"]')) {
        // Limpar filtros não muda a visão (Tabela ou Linha do tempo) nem a ordenação
        est = { ...novoEstado(), visao: est.visao, ordem: est.ordem, duracao: est.duracao };
        padraoDuracao();
        ctx.estado = est;
        redesenhar('[data-acao="ma-limpar"]');
        return;
      }
      // Ordenar: a mesma coluna inverte o sentido; outra coluna começa do menor para o maior
      const ord = e.target.closest('[data-ma-ordenar]');
      if (ord) {
        const coluna = ord.dataset.maOrdenar;
        est.ordem = est.ordem && est.ordem.coluna === coluna
          ? { coluna, sentido: est.ordem.sentido === 'asc' ? 'desc' : 'asc' } : { coluna, sentido: 'asc' };
        redesenhar(`[data-ma-ordenar="${CSS.escape(coluna)}"]`);
        return;
      }
      // Duração: Por talhão | Por operação
      const modo = e.target.closest('[data-ma-duracao]');
      if (modo) {
        const entrou = (est.duracao || 'talhao') !== modo.dataset.maDuracao;
        est.duracao = modo.dataset.maDuracao;
        if (entrou) padraoDuracao();
        redesenhar(`[data-ma-duracao="${est.duracao}"]`);
        return;
      }
      // Duração › Por talhão: recuar e avançar a operação
      const passo = e.target.closest('[data-ma-op]');
      if (passo) {
        const nomes = est.opsDuracao || [];
        const i = Math.max(0, nomes.indexOf(est.opDuracao)) + Number(passo.dataset.maOp);
        est.opDuracao = nomes[Math.min(nomes.length - 1, Math.max(0, i))];
        redesenhar(`[data-ma-op="${passo.dataset.maOp}"]`);
        return;
      }
      // Legenda: um status por vez; clicar de novo no mesmo volta a todos
      const st = e.target.closest('[data-ma-status]');
      if (st) {
        est.status = est.status === st.dataset.maStatus ? null : st.dataset.maStatus;
        redesenhar(`[data-ma-status="${st.dataset.maStatus}"]`);
        return;
      }
      // Abrir/fechar as caixas de filtro: como na Agenda Agrícola
      Cal().aoClicar(e, ctx, { redesenhar });
    });

    raiz.addEventListener('change', (e) => {
      // Filtros com caixas: "Todas" marca ou desmarca tudo; cada caixa liga ou desliga a opção
      if (e.target.dataset.campo !== 'cal-filtro') return;
      const chave = e.target.dataset.filtro;
      const valores = opcoes(chave).map((o) => o.valor);
      let marcados = valores.filter((v) => Cal().marcado(est, chave, v));
      if (e.target.type === 'radio') marcados = [e.target.value];
      else if (e.target.value === 'todos') marcados = e.target.checked ? [...valores] : [];
      else if (e.target.checked) marcados.push(e.target.value);
      else marcados = marcados.filter((n) => n !== e.target.value);
      est[chave] = marcados.length === valores.length ? 'todos' : marcados;
      // Outro grupo: a Operação volta a todas as operações dos grupos marcados
      if (chave === 'grupo') est.operacao = 'todos';
      est.filtroAberto = chave;
      est.ultimo = chave;
      redesenhar(`[data-campo="cal-filtro"][data-filtro="${chave}"][value="${CSS.escape(e.target.value)}"]`);
    });

    raiz.addEventListener('input', (e) => Cal().aoDigitar(e, ctx));
    redesenhar();
  }

  // Esc: com uma caixa de filtro aberta, fecha a caixa (não age com modal ou menu aberto, que têm o próprio Esc)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || document.querySelector('.modal-fundo, .menu-contexto')) return;
    const aberta = document.querySelector('.ma .filtros .cal-filtro[open]');
    if (!aberta) return;
    e.preventDefault();
    aberta.open = false;
    est.filtroAberto = null;
    aberta.querySelector('.cal-filtro__botao').focus();
  });

  return { desenhar, aoMostrar };
})();
