/*
 * Gestão da Lavoura (DECISOES 4.0): o cabeçalho das páginas (caminho, título e subtítulo) e o que a Central OS
 * (js/telas/central-corp.js) usa em comum: datas, planos publicados, safras, operações por talhão, OS de exemplo,
 * filtros e ordenação. Antes ficava em Minhas tarefas (guardada em rascunhos/minhas-tarefas/).
 */
window.Telas = window.Telas || {};

window.Telas.gestaoLavoura = (function () {
  const esc = Util.escapar;

  // ----- Cabeçalho das páginas de Gestão da Lavoura -----
  const PAGINAS = {
    calendario: ['Calendário Agrícola', '#/calendario-agricola', 'As operações planejadas de todas as fazendas: o ano agrícola por empresa e fazenda, e o dia a dia no mês, na semana e no dia.'],
    central: ['Central OS', '#/central-os', 'Acompanhe as ordens de serviço, recomendações e execução das operações agrícolas.']
  };
  // Caminho "⌂ Gestão da Lavoura › Página" (a casa e o nome do grupo levam ao primeiro item, Calendário Agrícola)
  const caminho = (titulo) => `
        <nav class="oa-caminho" aria-label="Caminho">
          <a class="oa-caminho__casa" href="#/calendario-agricola" aria-label="Gestão da Lavoura">${Icones.casa}</a>
          <a href="#/calendario-agricola">Gestão da Lavoura</a><span aria-hidden="true">›</span>
          <span class="caminho__atual" aria-current="page">${titulo}</span>
        </nav>`;
  function cabecalho(pagina) {
    const [titulo, , subtitulo] = PAGINAS[pagina];
    return `
      <header class="cabecalho oa-cabecalho oa-cabecalho--pagina">
        ${caminho(titulo)}
        <div class="oa-cabecalho__abas">
          <div class="oa-cabecalho__titulo">
            <h1 class="cabecalho__titulo">${titulo}</h1>
            <p class="cabecalho__subtitulo">${subtitulo}</p>
          </div>
          <span class="cag-etiqueta" title="Mostra a última versão publicada de cada plano. Alterações em versões em construção aparecem aqui depois de publicadas.">${Icones.info} Últimas versões publicadas</span>
        </div>
      </header>`;
  }

  // ----- Datas -----
  const hoje = () => Util.hojeISO();
  function somaDias(iso, n) {
    const [a, m, d] = iso.split('-').map(Number);
    const dt = new Date(a, m - 1, d + n);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
  const diasEntre = (de, ate) => Math.round((Date.parse(ate) - Date.parse(de)) / 86400000);

  // ----- Planos e safras -----
  const publicados = () => DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p));
  const cadastro = (nome) => DADOS.cadastroSafras.find((s) => s.nome === nome);
  const safrinha = (nome) => { const [a, b] = nome.split('/'); return a === b; };
  // Safras com plano publicado, da mais recente para a mais antiga (a safra antes da safrinha do mesmo ano)
  function safras() {
    const nomes = [...new Set(publicados().map((p) => p.safra))];
    return nomes.map((n) => cadastro(n) || { nome: n, descricao: n, inicio: '' })
      .sort((a, b) => b.inicio.localeCompare(a.inicio) || safrinha(a.nome) - safrinha(b.nome));
  }
  // Safra de hoje (entre o início e o fim do cadastro; a safra antes da safrinha); senão, a mais recente
  function safraInicial() {
    const lista = safras();
    const h = hoje();
    return (lista.find((s) => s.inicio && s.inicio <= h && h <= s.fim) || lista[0] || { nome: '' }).nome;
  }

  // ----- Linhas de operação: uma por talhão × operação (DECISOES 4.0, Tela 08). Sem produtos e doses: uma operação
  // pode ter vários; eles aparecem ao recomendar. -----
  function linhasOperacoes(safra) {
    const saida = [];
    publicados().filter((p) => p.safra === safra).forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const grupos = Versoes.grupos(p, v);
      const talhoes = Util.talhoesPlano(p, v);
      const plantio = (grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0] || null;
      const base = (t) => (plantio ? Planos.dataPlantioTalhao(plantio, t) : null);
      const linha = (t, area, g, op, data) => saida.push({ plano: p, talhao: t, area, grupo: g.nome, operacao: op.nome || 'Sem operação', data,
        prazo: Telas.calendario.prazoDe(op, g) });
      grupos.forEach((g) => g.operacoes.forEach((op) => talhoes.forEach((t) => {
        if (g.tipo === 'Sementes' || g.tipo === 'Colheita') {
          // Plantio: a data de plantio; Colheita: plantio + ciclo da variedade. Várias variedades no talhão: uma linha
          // por data, com a área das variedades daquela data
          if (op !== (g.tipo === 'Sementes' ? plantio : g.operacoes[0])) return;
          const ls = plantio ? Planos.linhasPlantio(plantio, t.nome) : [];
          const porData = new Map();
          ls.forEach((l, i) => {
            if (!l.variedade) return;
            const dataPl = l.data || base(t.nome);
            const ciclo = (DADOS.variedades.find((x) => x.nome === l.variedade) || {}).ciclo;
            const data = g.tipo === 'Sementes' ? dataPl : dataPl && ciclo ? somaDias(dataPl, ciclo) : null;
            if (data) porData.set(data, (porData.get(data) || 0) + (Planos.areaLinhaPlantio(ls, i, t.area) ?? t.area));
          });
          porData.forEach((area, data) => linha(t.nome, area, g, op, data));
          return;
        }
        const ajuste = op.talhoes[t.nome];
        const b = base(t.nome);
        if (!ajuste || !b || op.dap === null || op.dap === undefined || op.dap === '') return;
        linha(t.nome, t.area, g, op, somaDias(b, Number(op.dap)));
      })));
    });
    return saida;
  }

  // OS de exemplo com o plano (publicado) e o grupo da operação
  function ordens(safra) {
    return (DADOS.ordensServico || []).filter((os) => os.safra === safra).map((os) => {
      const plano = publicados().find((p) => p.fazenda === os.fazenda && p.safra === os.safra);
      if (!plano) return null;
      const v = Versoes.ultimaPublicada(plano);
      const grupo = Versoes.grupos(plano, v).find((g) => g.operacoes.some((op) => op.nome === os.operacao));
      const talhoes = Util.talhoesPlano(plano, v);
      return { ...os, plano, grupo: grupo ? grupo.nome : '—', conclusao: somaDias(os.abertura, os.prazo || 0),
        areaDe: (t) => (talhoes.find((x) => x.nome === t) || { area: 0 }).area };
    }).filter(Boolean);
  }

  // Primeira OS da safra: no protótipo, a data planejada da primeira operação da safra (sem olhar os outros filtros)
  function primeiraData(safra) {
    const datas = linhasOperacoes(safra).map((l) => l.data).sort();
    return datas[0] || hoje();
  }

  // Comparação para ordenar colunas (vazios no fim; números e textos com números em ordem natural)
  const comparar = (va, vb) => {
    if (va === null || va === undefined) return vb === null || vb === undefined ? 0 : 1;
    if (vb === null || vb === undefined) return -1;
    return typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR', { numeric: true });
  };

  function opcoesSelect(nome, rotulo, itens, todos, valor) {
    return `
      <div class="campo">
        <label class="campo__rotulo" for="oc-${nome}">${rotulo}</label>
        <select class="campo__controle" id="oc-${nome}" data-oc-filtro="${nome}">
          ${todos ? `<option value="">${todos}</option>` : ''}
          ${itens.map(([v, n]) => `<option value="${esc(v)}" ${v === valor ? 'selected' : ''}>${esc(n)}</option>`).join('')}
        </select>
      </div>`;
  }

  // Grupos de operação dos planos publicados da safra, na ordem Plantio, Fertilidade, Defensivo, Colheita (outros no fim)
  const ORDEM_TIPO = ['Sementes', 'Fertilidade', 'Defensivos', 'Colheita'];
  function gruposDaSafra(daSafra) {
    const tipos = new Map();
    daSafra.forEach((p) => Versoes.grupos(p, Versoes.ultimaPublicada(p)).forEach((g) => { if (!tipos.has(g.nome)) tipos.set(g.nome, g.tipo); }));
    const pos = (t) => (ORDEM_TIPO.includes(t) ? ORDEM_TIPO.indexOf(t) : 99);
    return [...tipos.entries()].sort((a, b) => pos(a[1]) - pos(b[1]) || a[0].localeCompare(b[0], 'pt-BR')).map(([n]) => [n, n]);
  }

  const base = { linhasOperacoes, publicados, safras, safraInicial, primeiraData, somaDias, diasEntre, hoje, ordens,
    opcoesSelect, gruposDaSafra, comparar, esc };
  return { cabecalho, caminho, base };
})();
