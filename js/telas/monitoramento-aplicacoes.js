/*
 * Aplicações (Monitoramento de Aplicações), no menu Monitoramento › Aplicações.
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
    const v = est.operacao;
    if (est.ultimo === 'operacao' || !Array.isArray(v) || !v.length) return;
    const ops = opcoes('operacao');
    if (ops.length && !ops.some((o) => v.includes(o.valor))) est.operacao = 'todos';
  }
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
    return [...porNome].map(([nome, dap]) => ({ nome, dap, plantio: plantios.has(nome) }))
      .sort((a, b) => a.dap - b.dap || a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
  }

  // ----- Linhas: uma por talhão (com ao menos uma operação marcada planejada) -----
  // Data executada (simulada): a de recomendação da OS escrita nos dados, se houver; senão, a planejada + o deslocamento
  // do talhão (ou o da sequência). Só conta se já chegou (até hoje).
  function executada(p, talhao, operacao, planejado, s, i) {
    const os = (DADOS.ordensServico || []).find((o) => o.fazenda === p.fazenda && o.safra === p.safra
      && o.operacao === operacao && o.talhoes.includes(talhao));
    if (os) return os.abertura <= hoje() ? os.abertura : null;
    const lista = sim().deslocamentos;
    const d = operacao in s ? s[operacao] : lista.length ? lista[i % lista.length] : 0;
    if (d === null) return null;
    const data = somaDias(planejado, d);
    return data <= hoje() ? data : null;
  }

  function linhas(cols) {
    const nomes = cols.map((c) => c.nome);
    const saida = [];
    planosFiltrados().forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const grupos = Versoes.grupos(p, v);
      const plantio = (grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0] || null;
      const simPlano = sim().talhoes[`${p.fazenda} ${p.safra}`] || {};
      Util.talhoesPlano(p, v).forEach((t, iT) => {
        if (!Cal().marcado(est, 'talhao', `${p.fazenda}|${t.nome}`)) return;
        const base = plantio ? Planos.dataPlantioTalhao(plantio, t.nome) : null;
        if (!base) return;
        const s = simPlano[t.nome] || {};
        const variedades = [...new Set(Planos.linhasPlantio(plantio, t.nome).map((l) => l.variedade).filter(Boolean))];
        const dataPlantio = { planejado: base, executada: executada(p, t.nome, 'Plantio', base, s, iT) };
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
          aplic[op.nome] = { planejado, executada: executada(p, t.nome, op.nome, planejado, s, iT * 3 + nomes.indexOf(op.nome)) };
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

  // Cabeçalho: caminho, título e subtítulo (conforme a visão) à esquerda; Executadas (tabela) | Planejada × Executada (linha do tempo) à direita
  function cabecalho() {
    const botao = (valor, nome, icone) => `
      <button class="ma-visao__botao ${est.visao === valor ? 'ma-visao__botao--ativo' : ''}" type="button" data-ma-visao="${valor}"
              aria-pressed="${est.visao === valor}">${icone}${nome}</button>`;
    return `
      <nav class="oa-caminho" aria-label="Caminho">
        <a class="oa-caminho__casa" href="#/monitoramento" aria-label="Monitoramento">${Icones.casa}</a>
        <a href="#/monitoramento">Monitoramento</a><span aria-hidden="true">›</span>
        <span class="caminho__atual" aria-current="page">Aplicações</span>
      </nav>
      <div class="ma-cabecalho__linha">
        <div class="oa-cabecalho__titulo">
          <h1 class="cabecalho__titulo">Aplicações</h1>
          <p class="cabecalho__subtitulo">${est.visao === 'linha' ? 'Compare as datas planejadas e executadas das operações por talhão.' : 'Consulte as datas de execução e o status das operações por talhão.'}</p>
        </div>
        <div class="ma-visao" role="group" aria-label="Visão">
          ${botao('tabela', 'Executadas', Icones.lista)}${botao('linha', 'Planejada × Executada', Icones.calendario)}
        </div>
      </div>`;
  }

  function filtros() {
    return `
      ${FILTROS.map(([chave, rotulo, textos]) => `
        <div class="campo">
          <span class="campo__rotulo">${rotulo}</span>
          ${Cal().filtroCaixa(est, chave, opcoes(chave), textos, rotulo)}
        </div>`).join('')}
      <button class="link-acao filtros__limpar" type="button" data-acao="ma-limpar">${Icones.limpar} Limpar filtros</button>`;
  }

  // Status da aplicação, mostrado numa etiqueta na célula dela, com a legenda
  const STATUS = [['adiantada', 'Adiantada'], ['prazo', 'No prazo'], ['atrasada', 'Atrasada'], ['pendente', 'Pendente'], ['futura', 'Planejada']];
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
    // Sem execução: Pendente com a exclamação e o nome; Planejada (a futura) com o calendário com relógio e a data planejada, em cinza
    const texto = a.executada ? Util.data(a.executada) : st === 'pendente' ? `${Icones.pendente}Pendente` : `${Icones.futura}${Util.data(a.planejado)}`;
    return `<td class="${cls}"${congela}><span class="ma-etiqueta ma-st--${st}" title="${STATUS.find(([x]) => x === st)[1]}${st === 'futura' ? ` para ${Util.data(a.planejado)}` : ''}">${texto}</span></td>`;
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

  // ----- Linha do tempo: uma faixa por talhão, com as operações marcadas (sem o Plantio). Em cada uma: o nome e a data
  // planejada em cima; o círculo vazio no planejado e o ponto cheio no executado, ligados pelo desvio (na cor do
  // status); a etiqueta do status; e "Exec. dd/mm" embaixo. Pendente: traço tracejado do planejado até hoje (atraso
  // acumulado). Futura: círculo tracejado. Hoje: linha pontilhada cinza. -----
  const PX_DIA = 12;
  const diaMes = (iso) => Util.data(iso).slice(0, 5);
  const curto = (nome) => nome.replace(/Fungicida/g, 'Fung.');
  const dias = (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`;
  function textoStatus(a, st) {
    if (st === 'pendente') return `Pendente há ${diasEntre(a.planejado, hoje())} d`;
    if (st === 'futura') return `Em ${diasEntre(hoje(), a.planejado)} d`;
    const d = diasEntre(a.planejado, a.executada);
    return d === 0 ? 'No prazo' : d > 0 ? `+${dias(d)}` : `−${dias(-d)}`;
  }

  function evento(a, nome, x) {
    const st = statusDe(a);
    if (est.status && st !== est.status) return '';
    const xp = x(a.planejado);
    const xe = a.executada ? x(a.executada) : null;
    const centro = xe === null ? xp : (xp + xe) / 2;
    let marca;
    if (st === 'futura') marca = `<span class="mt-ponto mt-ponto--futura" style="left:${xp}px"></span>`;
    else if (st === 'pendente') {
      const xh = x(hoje());
      marca = `<span class="mt-atraso" style="left:${xp}px;width:${Math.max(0, xh - xp)}px"></span>
        <span class="mt-ponto mt-ponto--planejado mt-cor--pendente" style="left:${xp}px"></span>`;
    } else if (st === 'prazo') marca = `<span class="mt-ponto mt-ponto--planejado mt-ponto--no-dia mt-cor--prazo" style="left:${xp}px"></span>`;
    else {
      marca = `<span class="mt-desvio mt-cor--${st}" style="left:${Math.min(xp, xe)}px;width:${Math.abs(xe - xp)}px"></span>
        <span class="mt-ponto mt-ponto--planejado" style="left:${xp}px"></span>
        <span class="mt-ponto mt-ponto--executado mt-cor--${st}" style="left:${xe}px"></span>`;
    }
    const titulo = `${nome} · planejada ${Util.data(a.planejado)}${a.executada ? ` · executada ${Util.data(a.executada)}` : ''}`;
    return `
      <div class="mt-ev" title="${esc(titulo)}">
        <span class="mt-ev__nome" style="left:${xp}px"><strong>${esc(curto(nome))}</strong> ${diaMes(a.planejado)}</span>
        ${marca}
        <span class="mt-ev__status ma-etiqueta ma-st--${st}" style="left:${centro}px">${textoStatus(a, st)}</span>
        ${a.executada ? `<span class="mt-ev__exec" style="left:${centro}px">Exec. ${diaMes(a.executada)}</span>` : ''}
      </div>`;
  }

  function linhaDoTempo(ls, cols) {
    if (!ls.length) return `<p class="ma-construcao">${est.status ? `Nenhum talhão com aplicação ${STATUS.find(([x]) => x === est.status)[1].toLowerCase()}.` : 'Nenhum talhão com essas operações planejadas.'}</p>`;
    // Período: da primeira à última data (planejada ou executada) e hoje, com uma folga de 6 dias de cada lado
    const datas = [hoje()];
    ls.forEach((r) => cols.map((c) => r.aplic[c.nome]).forEach((a) => {
      if (a) datas.push(a.planejado, ...(a.executada ? [a.executada] : []));
    }));
    datas.sort();
    const inicio = somaDias(datas[0], -6);
    const nDias = diasEntre(inicio, somaDias(datas[datas.length - 1], 6));
    const largura = nDias * PX_DIA;
    const x = (iso) => diasEntre(inicio, iso) * PX_DIA;
    // Marcas da escala: de 7 em 7 dias, a partir do 3º dia
    const marcas = [];
    for (let d = 3; d < nDias; d += 7) marcas.push(somaDias(inicio, d));
    const grade = `background-image: repeating-linear-gradient(to right, var(--borda) 0 1px, transparent 1px ${7 * PX_DIA}px); background-position: ${3 * PX_DIA}px 0;`;
    const xh = x(hoje());
    const faixa = (r) => {
      const aps = cols.map((c) => r.aplic[c.nome]).filter(Boolean);
      const sts = aps.map(statusDe);
      const feitas = aps.filter((a) => a.executada).length;
      const pendentes = sts.filter((s) => s === 'pendente').length;
      return `
        <div class="mt-linha">
          <div class="mt-talhao">
            <p class="mt-talhao__nome"><strong>${esc(r.talhao)}</strong> <span>${esc(r.plano.fazenda)}</span></p>
            <p class="mt-talhao__var">Var. ${esc(r.variedades.join(', ') || '—')}</p>
            <div class="mt-segmentos">${sts.map((s) => `<span class="mt-segmento mt-fundo--${s}" title="${STATUS.find(([x]) => x === s)[1]}"></span>`).join('')}</div>
            <p class="mt-talhao__conta">${feitas} de ${aps.length} aplicadas${pendentes ? ` · <span class="mt-talhao__pendente">${pendentes} ${pendentes === 1 ? 'pendente' : 'pendentes'}</span>` : ''}</p>
          </div>
          <div class="mt-trilho" style="${grade}">
            <span class="mt-hoje" style="left:${xh}px"></span>
            ${cols.map((c) => (r.aplic[c.nome] ? evento(r.aplic[c.nome], c.nome, x) : '')).join('')}
          </div>
        </div>`;
    };
    return `
      <div class="mt-rolagem">
        <div class="mt" style="--mt-largura:${largura}px">
          <div class="mt-linha mt-linha--cabecalho">
            <div class="mt-talhao mt-talhao--cabecalho">Talhão</div>
            <div class="mt-trilho mt-escala" style="${grade}">
              ${marcas.map((d) => `<span class="mt-escala__marca" style="left:${x(d)}px">${diaMes(d)}</span>`).join('')}
              <span class="mt-escala__hoje" style="left:${xh}px">Hoje · ${diaMes(hoje())}</span>
              <span class="mt-hoje" style="left:${xh}px"></span>
            </div>
          </div>
          ${ls.map(faixa).join('')}
        </div>
      </div>
      <p class="cc-tabela__rodape">${ls.length.toLocaleString('pt-BR')} ${ls.length === 1 ? 'talhão' : 'talhões'} · Hoje: ${Util.data(hoje())}</p>`;
  }

  function tabela() {
    let cols = operacoes().filter((o) => Cal().marcado(est, 'operacao', o.nome));
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

  // Barra acima da tabela: legenda dos status da aplicação (clicável)
  function barra() {
    return `
      <div class="ma-barra">
        <div class="ma-legenda">
          <span class="ma-legenda__titulo">Aplicação</span>
          <ul aria-label="Status da aplicação">
            ${STATUS.map(([id, nome]) => `<li><button class="ma-legenda__item ${est.status && est.status !== id ? 'ma-legenda__item--apagado' : ''}" type="button"
                data-ma-status="${id}" aria-pressed="${est.status === id}" title="${est.status === id ? 'Mostrar todos os talhões' : `Só os talhões com aplicação ${nome.toLowerCase()}`}">
                <span class="ma-legenda__cor ma-st--${id}" aria-hidden="true">${id === 'pendente' ? Icones.pendente : id === 'futura' ? Icones.futura : ''}</span>${nome}</button></li>`).join('')}
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

    // Executadas | Planejada × Executada (no cabeçalho, fora da página da tela)
    caixaCabecalho.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ma-visao]');
      if (!b) return;
      est.visao = b.dataset.maVisao;
      redesenhar(`[data-ma-visao="${est.visao}"]`);
    });

    raiz.addEventListener('click', (e) => {
      if (e.target.closest('[data-acao="ma-limpar"]')) {
        // Limpar filtros não muda a visão (Tabela ou Linha do tempo) nem a ordenação
        est = { ...novoEstado(), visao: est.visao, ordem: est.ordem };
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
      if (e.target.value === 'todos') marcados = e.target.checked ? [...valores] : [];
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
