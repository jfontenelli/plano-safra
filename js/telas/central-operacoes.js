/*
 * Tela 08 — Minhas tarefas (docs/telas/08-central-operacoes.md), primeira aba de Gestão da Lavoura › Operações Agrícolas.
 * Quatro cartões (A recomendar, Recomendação em atraso, Execução em atraso, Justificativas solicitadas) e a tabela do
 * cartão escolhido. Vários planos somados, na última versão publicada de cada. As OS vêm dos dados de exemplo
 * (DADOS.ordensServico; DADOS.osFechadasAte: o que é planejado até essa data conta como feito).
 * Também desenha o cabeçalho de Operações Agrícolas (caminho, título, subtítulo e abas), usado pela Central de Operações
 * e pela Agenda Agrícola.
 */
window.Telas = window.Telas || {};

window.Telas.centralOperacoes = (function () {
  const esc = Util.escapar;

  // ----- Cabeçalho de Operações Agrícolas (as três abas) -----
  const ABAS = [
    ['tarefas', 'Minhas tarefas', '#/operacoes-agricolas', 'Operações a recomendar, atrasos e justificativas que aguardam a sua ação.'],
    ['agenda', 'Agenda Agrícola', '#/operacoes-agricolas/agenda', 'Calendário das operações planejadas, dia a dia, em todas as fazendas.'],
    ['central', 'Central OS', '#/operacoes-agricolas/central', 'Acompanhe as ordens de serviço, recomendações e execução das operações agrícolas.']
  ];
  function cabecalho(aba) {
    const [, titulo, , subtitulo] = ABAS.find(([id]) => id === aba);
    return `
      <header class="cabecalho oa-cabecalho">
        <nav class="oa-caminho" aria-label="Caminho">
          <a class="oa-caminho__casa" href="#/operacoes-agricolas" aria-label="Operações Agrícolas">${Icones.casa}</a>
          <a href="#/operacoes-agricolas">Operações Agrícolas</a><span aria-hidden="true">›</span>
          <span class="caminho__atual" aria-current="page">${titulo}</span>
        </nav>
        <div class="oa-cabecalho__titulo">
          <h1 class="cabecalho__titulo">${titulo}</h1>
          <p class="cabecalho__subtitulo">${subtitulo}</p>
        </div>
        <div class="oa-cabecalho__abas">
          <nav class="etapas" aria-label="Abas de Operações Agrícolas">
            ${ABAS.map(([id, nome, href]) => `<a class="etapa ${id === aba ? 'etapa--ativa' : ''}" href="${href}" ${id === aba ? 'aria-current="page"' : ''}>${nome}</a>`).join('')}
          </nav>
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
  const HORIZONTES = [['hoje', 'Hoje', 0], ['semana', 'Semana', 6], ['quinzena', 'Quinzena', 14], ['mes', 'Mês', 29], ['personalizado', 'Personalizado']];

  // ----- Cartões -----
  const CARTOES = [
    { id: 'recomendar', titulo: 'A recomendar', subtitulo: 'Aguardando recomendação agronômica das operações planejadas', icone: Icones.documento, cor: 'verde',
      periodo: 'O período considera a data planejada das operações.' },
    { id: 'atrasoRec', titulo: 'Recomendação em atraso', subtitulo: 'Data planejada vencida', icone: Icones.relogio, cor: 'vermelho',
      periodo: 'O período considera a data planejada das operações.' },
    { id: 'atrasoExec', titulo: 'Execução em atraso', subtitulo: 'Prazo de conclusão vencido', icone: Icones.alerta, cor: 'laranja',
      periodo: 'O período considera a data prevista de conclusão das OS.' },
    { id: 'justificativas', titulo: 'Justificativas solicitadas', subtitulo: 'Aguardando resposta', icone: Icones.balao, cor: 'azul',
      periodo: 'O período considera a data da solicitação de justificativa.' }
  ];

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

  // Operação que já tem OS (ou planejada até DADOS.osFechadasAte, que conta como feita)
  function temOS(l) {
    if (l.data <= (DADOS.osFechadasAte || '')) return true;
    return (DADOS.ordensServico || []).some((os) => os.fazenda === l.plano.fazenda && os.safra === l.plano.safra
      && os.operacao === l.operacao && os.talhoes.includes(l.talhao));
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

  // ----- Estado (mantém-se ao navegar) -----
  let est = null;
  function periodosIniciais(safra) {
    const ini = primeiraData(safra);
    return {
      recomendar: { horizonte: 'semana', de: hoje(), ate: somaDias(hoje(), 6) },
      atrasoRec: { de: ini, ate: hoje() },
      atrasoExec: { de: ini, ate: hoje() },
      justificativas: { de: ini, ate: hoje() }
    };
  }
  function novoEstado() {
    const safra = safraInicial();
    return { safra, cultura: '', empresa: '', fazenda: '', grupo: '', cartao: 'recomendar', periodos: periodosIniciais(safra),
      ordem: {}, selecao: new Set() };
  }

  const passaFiltros = (p) => (!est.cultura || p.cultura === est.cultura) && (!est.empresa || p.empresa === est.empresa)
    && (!est.fazenda || p.fazenda === est.fazenda);
  const passaGrupo = (grupo) => !est.grupo || grupo === est.grupo;
  const noPeriodo = (iso, { de, ate }) => (!de || iso >= de) && (!ate || iso <= ate);

  // Linhas de cada cartão, com os filtros e o período dele
  function linhasDo(cartao, ops) {
    const per = est.periodos[cartao];
    const h = hoje();
    if (cartao === 'recomendar' || cartao === 'atrasoRec') {
      return ops.filter((l) => passaFiltros(l.plano) && passaGrupo(l.grupo) && !temOS(l) && noPeriodo(l.data, per) && (cartao === 'recomendar' || l.data < h))
        .map((l) => ({ ...l, atraso: diasEntre(l.data, h) }));
    }
    const os = ordens(est.safra).filter((o) => passaFiltros(o.plano) && passaGrupo(o.grupo));
    if (cartao === 'atrasoExec') {
      return os.filter((o) => o.status === 'execucao' && o.conclusao < h && noPeriodo(o.conclusao, per))
        .flatMap((o) => o.talhoes.map((t) => ({ ...o, talhao: t, area: o.areaDe(t), atraso: diasEntre(o.conclusao, h) })));
    }
    // Justificativas das OS e das operações ainda sem OS (planejadas com atraso, notificadas na Central de Operações)
    const semOS = (DADOS.justificativasOperacoes || []).filter((j) => j.safra === est.safra).map((j) => {
      const plano = publicados().find((p) => p.fazenda === j.fazenda && p.safra === j.safra);
      return plano ? { ...j, plano, numero: null, talhoes: [j.talhao] } : null;
    }).filter((j) => j && passaFiltros(j.plano) && passaGrupo(j.grupo));
    return [...os, ...semOS].filter((o) => o.justificativa && !o.justificativa.respondida && noPeriodo(o.justificativa.data, per))
      .map((o) => ({ ...o, talhao: o.talhoes.join(', '), aguardando: diasEntre(o.justificativa.data, h) }));
  }

  // ----- Colunas: [id, título, valor para ordenar (null = vazio, vai para o fim), número?, texto da célula, dica ao passar o mouse] -----
  const ha = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dias = (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`;
  const COL = {
    numero: ['numero', 'Nº OS', (l) => l.numero ?? null, true],
    safra: ['safra', 'Safra', (l) => l.plano.safra],
    empresa: ['empresa', 'Empresa', (l) => l.plano.empresa],
    fazenda: ['fazenda', 'Fazenda', (l) => l.plano.fazenda],
    talhao: ['talhao', 'Talhão', (l) => l.talhao],
    area: ['area', 'Área (ha)', (l) => l.area, true, (l) => ha(l.area)],
    cultura: ['cultura', 'Cultura', (l) => l.plano.cultura],
    grupo: ['grupo', 'Grupo de operação', (l) => l.grupo],
    operacao: ['operacao', 'Operação', (l) => l.operacao],
    data: ['data', 'Data planejada', (l) => l.data, false, (l) => Util.data(l.data)],
    atraso: ['atraso', 'Dias em atraso', (l) => l.atraso, true, (l) => dias(l.atraso)],
    abertura: ['abertura', 'Data de abertura', (l) => l.abertura, false, (l) => Util.data(l.abertura)],
    conclusao: ['conclusao', 'Data prevista de conclusão', (l) => l.conclusao, false, (l) => Util.data(l.conclusao)],
    motivo: ['motivo', 'Motivo da solicitação', (l) => l.justificativa.motivo],
    solicitacao: ['solicitacao', 'Data da solicitação', (l) => l.justificativa.data, false, (l) => Util.data(l.justificativa.data)],
    solicitadaPor: ['solicitadaPor', 'Solicitada por', (l) => l.justificativa.solicitadaPor.nome, false, null,
      (l) => l.justificativa.solicitadaPor.perfil || ''],
    aguardando: ['aguardando', 'Dias aguardando', (l) => l.aguardando, true, (l) => dias(l.aguardando)]
  };
  const OPERACAO = ['safra', 'cultura', 'empresa', 'fazenda', 'talhao', 'area', 'grupo', 'operacao', 'data'];
  const COLUNAS = {
    recomendar: OPERACAO,
    atrasoRec: [...OPERACAO, 'atraso'],
    atrasoExec: ['numero', 'safra', 'cultura', 'empresa', 'fazenda', 'talhao', 'area', 'grupo', 'operacao', 'abertura', 'conclusao', 'atraso'],
    justificativas: ['numero', 'fazenda', 'talhao', 'operacao', 'motivo', 'solicitacao', 'solicitadaPor', 'aguardando']
  };
  // Colunas com texto longo, que podem quebrar linha (as demais ficam numa linha só)
  const QUEBRA = ['grupo', 'motivo', 'talhao'];
  // Ordem padrão de cada cartão (antes de o usuário escolher uma coluna)
  const PADRAO = { recomendar: 'data', atrasoRec: 'data', atrasoExec: 'conclusao', justificativas: 'solicitacao' };

  // Ordena pela coluna escolhida; no empate, pela data do cartão e pelo talhão (ex.: ordenar por Operação junta a mesma
  // operação, com as datas em ordem, para recomendar juntas as que estão próximas)
  const comparar = (va, vb) => {
    if (va === null || va === undefined) return vb === null || vb === undefined ? 0 : 1;
    if (vb === null || vb === undefined) return -1;
    return typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR', { numeric: true });
  };
  function ordenadas(ls) {
    const o = est.ordem[est.cartao] || { coluna: PADRAO[est.cartao], sentido: 'asc' };
    const valor = COL[o.coluna][2];
    const sinal = o.sentido === 'asc' ? 1 : -1;
    const data = COL[PADRAO[est.cartao]][2];
    return [...ls].sort((a, b) => {
      const va = valor(a); const vb = valor(b);
      const vazio = (v) => v === null || v === undefined;
      if (vazio(va) || vazio(vb)) return comparar(va, vb);
      return sinal * comparar(va, vb) || comparar(data(a), data(b)) || comparar(a.talhao, b.talhao);
    });
  }

  // Seleção das linhas (A recomendar e Recomendação em atraso): o botão Recomendar age sobre as marcadas
  const SELECIONA = ['recomendar', 'atrasoRec'];
  const chaveLinha = (l) => `${l.plano.id}|${l.talhao}|${l.operacao}|${l.data}`;

  // ----- Desenho -----
  function desenhar() {
    est = est || novoEstado();
    return `
      ${cabecalho('tarefas')}
      <div class="pagina oc">
        <section class="cartao oc-filtros" aria-label="Filtrar operações" data-oc-filtros></section>
        <section class="oc-resumo" aria-labelledby="oc-resumo-titulo">
          <h2 class="oc-resumo__titulo" id="oc-resumo-titulo">Ações</h2>
          <div class="oc-cartoes" data-oc-cartoes></div>
        </section>
        <section class="cartao oc-lista" aria-labelledby="oc-lista-titulo" data-oc-lista></section>
      </div>`;
  }

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

  function filtros() {
    const daSafra = publicados().filter((p) => p.safra === est.safra);
    const presentes = (chave, ordem) => ordem.filter((x) => daSafra.some((p) => p[chave] === x)).map((x) => [x, x]);
    const fazendas = DADOS.fazendas.filter((f) => !est.empresa || (DADOS.fazendasPorEmpresa[est.empresa] || []).includes(f));
    const per = est.periodos[est.cartao];
    const cartao = CARTOES.find((c) => c.id === est.cartao);
    return `
      <div class="filtros oc-filtros__campos">
        ${opcoesSelect('safra', 'Safra', safras().map((s) => [s.nome, s.nome]), '', est.safra)}
        ${opcoesSelect('cultura', 'Cultura', presentes('cultura', DADOS.culturasPlanos), 'Todas', est.cultura)}
        ${opcoesSelect('empresa', 'Empresa', presentes('empresa', DADOS.empresas), 'Todas', est.empresa)}
        ${opcoesSelect('fazenda', 'Fazenda', presentes('fazenda', fazendas), 'Todas', est.fazenda)}
        ${opcoesSelect('grupo', 'Grupo de operação', gruposDaSafra(daSafra), 'Todos', est.grupo)}
        <div class="campo">
          <label class="campo__rotulo" for="oc-de">Data inicial</label>
          <input class="campo__controle" type="date" id="oc-de" data-oc-data="de" value="${per.de || ''}">
        </div>
        <div class="campo">
          <label class="campo__rotulo" for="oc-ate">Data final</label>
          <input class="campo__controle" type="date" id="oc-ate" data-oc-data="ate" value="${per.ate || ''}">
        </div>
        <button class="botao botao--secundario oc-limpar" type="button" data-oc-limpar>${Icones.limpar} Limpar filtros</button>
      </div>
      <p class="oc-filtros__periodo">${Icones.info} ${cartao.periodo}</p>`;
  }

  function cartoes(ops) {
    return CARTOES.map((c) => {
      const n = linhasDo(c.id, ops).length;
      const ativo = c.id === est.cartao;
      return `
        <button class="oc-cartao oc-cartao--${c.cor} ${ativo ? 'oc-cartao--ativo' : ''}" type="button" data-oc-cartao="${c.id}" aria-pressed="${ativo}">
          <span class="oc-cartao__icone" aria-hidden="true">${c.icone}</span>
          <span class="oc-cartao__texto">
            <span class="oc-cartao__titulo">${c.titulo}</span>
            <span class="oc-cartao__numero">${n.toLocaleString('pt-BR')}</span>
            <span class="oc-cartao__sub">${c.subtitulo}</span>
          </span>
        </button>`;
    }).join('');
  }

  function cabecalhoTabela(todas) {
    const o = est.ordem[est.cartao];
    const marcadas = todas.filter((l) => est.selecao.has(chaveLinha(l))).length;
    const caixa = SELECIONA.includes(est.cartao) ? `
      <th class="oc-tabela__marcar"><input type="checkbox" class="oc-caixa" data-oc-marcar-todas aria-label="Marcar todas"
        ${todas.length && marcadas === todas.length ? 'checked' : ''} ${todas.length ? '' : 'disabled'}></th>` : '';
    return `<tr>${caixa}${COLUNAS[est.cartao].map((id) => {
      const [, rotulo, , num] = COL[id];
      const ativa = o && o.coluna === id;
      const sentido = ativa ? o.sentido : null;
      return `
        <th class="${num ? 'tabela__numero' : ''} ${QUEBRA.includes(id) ? 'oc-tabela__quebra' : ''}" ${ativa ? `aria-sort="${sentido === 'asc' ? 'ascending' : 'descending'}"` : ''}>
          <span class="titulo-coluna"><span>${rotulo}</span>
            <button class="titulo-ordenar ${ativa ? 'titulo-ordenar--ativo' : ''} ${sentido === 'desc' ? 'titulo-ordenar--desc' : ''}" type="button"
                    data-oc-ordenar="${id}" title="Ordenar por ${rotulo.toLowerCase()}"
                    aria-label="Ordenar por ${rotulo.toLowerCase()}${ativa ? (sentido === 'asc' ? ', crescente' : ', decrescente') : ''}">${ativa ? Icones.acima : Icones.ordenar}</button>
          </span>
        </th>`;
    }).join('')}</tr>`;
  }

  function lista(ops) {
    const cartao = CARTOES.find((c) => c.id === est.cartao);
    const todas = ordenadas(linhasDo(est.cartao, ops));
    const cols = COLUNAS[est.cartao];
    const horizonte = est.periodos.recomendar.horizonte;
    const seleciona = SELECIONA.includes(est.cartao);
    // Seleção só das linhas que continuam na lista (filtros e período podem ter tirado alguma)
    const chaves = new Set(todas.map(chaveLinha));
    [...est.selecao].forEach((k) => { if (!chaves.has(k)) est.selecao.delete(k); });
    const n = est.selecao.size;
    return `
      <div class="oc-lista__topo">
        <h2 class="oc-lista__titulo" id="oc-lista-titulo">${cartao.titulo}</h2>
        <div class="oc-lista__acoes">
          ${est.cartao === 'recomendar' ? `
            <select class="campo__controle oc-horizonte" data-oc-horizonte aria-label="Período a recomendar">
              ${HORIZONTES.map(([id, nome]) => `<option value="${id}" ${id === horizonte ? 'selected' : ''}>${nome}</option>`).join('')}
            </select>` : ''}
        </div>
      </div>
      <div class="tabela-rolagem oc-tabela__rolagem">
        <table class="tabela oc-tabela">
          <thead>${cabecalhoTabela(todas)}</thead>
          <tbody>
            ${todas.length ? todas.map((l, i) => {
              const k = chaveLinha(l);
              const marcada = seleciona && est.selecao.has(k);
              return `
              <tr class="oc-tabela__linha ${marcada ? 'oc-tabela__linha--marcada' : ''}" tabindex="0" data-oc-linha="${i}"
                  ${seleciona ? `data-oc-chave="${esc(k)}" aria-selected="${marcada}"` : 'title="Abrir OS"'}>
                ${seleciona ? `<td class="oc-tabela__marcar"><input type="checkbox" class="oc-caixa" data-oc-marcar="${esc(k)}" ${marcada ? 'checked' : ''}
                  aria-label="Marcar ${esc(l.operacao)} · ${esc(l.talhao)}"></td>` : ''}
                ${cols.map((id) => {
                  const [, , valor, num, texto, dica] = COL[id];
                  const v = texto ? texto(l) : valor(l);
                  return `<td class="${num ? 'tabela__numero' : ''} ${QUEBRA.includes(id) ? 'oc-tabela__quebra' : ''}" ${dica ? `title="${esc(dica(l))}"` : ''}>${esc(v === null || v === undefined ? '—' : v)}</td>`;
                }).join('')}
              </tr>`;
            }).join('') : `<tr><td class="tabela__vazia" colspan="${cols.length + (seleciona ? 1 : 0)}">Nada encontrado com os filtros e o período escolhidos.</td></tr>`}
          </tbody>
        </table>
      </div>
      ${seleciona ? `
        <div class="oc-recomendar">
          <span class="oc-recomendar__texto" aria-live="polite">${n ? `${n} ${n === 1 ? 'operação marcada' : 'operações marcadas'}` : 'Marque as operações para recomendar'}</span>
          <button class="botao botao--primario" type="button" data-oc-recomendar ${n ? '' : 'disabled'}
                  title="${n ? 'Recomendar as operações marcadas' : 'Marque ao menos uma operação'}">Recomendar</button>
        </div>` : ''}`;
  }

  function aoMostrar(conteudo) {
    est = est || novoEstado();
    const raiz = conteudo.querySelector('.oc');
    const caixaFiltros = raiz.querySelector('[data-oc-filtros]');
    const caixaCartoes = raiz.querySelector('[data-oc-cartoes]');
    const caixaLista = raiz.querySelector('[data-oc-lista]');
    // Redesenha tudo e devolve o foco ao elemento equivalente
    const redesenhar = (foco) => {
      const ops = linhasOperacoes(est.safra);
      caixaFiltros.innerHTML = filtros();
      caixaCartoes.innerHTML = cartoes(ops);
      caixaLista.innerHTML = lista(ops);
      if (foco) raiz.querySelector(foco)?.focus();
    };

    raiz.addEventListener('click', (e) => {
      if (e.target.closest('[data-oc-limpar]')) { est = novoEstado(); redesenhar('[data-oc-limpar]'); return; }
      const c = e.target.closest('[data-oc-cartao]');
      if (c) { est.cartao = c.dataset.ocCartao; est.selecao.clear(); redesenhar(`[data-oc-cartao="${est.cartao}"]`); return; }
      const o = e.target.closest('[data-oc-ordenar]');
      if (o) {
        const atual = est.ordem[est.cartao];
        const coluna = o.dataset.ocOrdenar;
        est.ordem[est.cartao] = { coluna, sentido: atual && atual.coluna === coluna && atual.sentido === 'asc' ? 'desc' : 'asc' };
        redesenhar(`[data-oc-ordenar="${coluna}"]`);
        return;
      }
      if (e.target.closest('[data-oc-recomendar]')) { Telas.abrirModalEmConstrucao('Recomendar OS'); return; }
      if (e.target.closest('.oc-caixa')) return;
      const linha = e.target.closest('[data-oc-linha]');
      if (linha) abrirLinha(linha);
    });
    // Linha com caixa: clicar (ou Enter/Espaço) marca ou desmarca; sem caixa (atrasos de OS, justificativas): "Em construção"
    const abrirLinha = (linha) => {
      const k = linha.dataset.ocChave;
      if (!k) { Telas.abrirModalEmConstrucao('Ordem de Serviço'); return; }
      if (est.selecao.has(k)) est.selecao.delete(k); else est.selecao.add(k);
      redesenhar(`[data-oc-chave="${CSS.escape(k)}"]`);
    };
    raiz.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-oc-linha]')) {
        e.preventDefault();
        abrirLinha(e.target);
      }
    });

    raiz.addEventListener('change', (e) => {
      if (e.target.matches('[data-oc-marcar]')) {
        const k = e.target.dataset.ocMarcar;
        if (e.target.checked) est.selecao.add(k); else est.selecao.delete(k);
        redesenhar(`[data-oc-marcar="${CSS.escape(k)}"]`);
        return;
      }
      if (e.target.matches('[data-oc-marcar-todas]')) {
        const todas = linhasDo(est.cartao, linhasOperacoes(est.safra)).map(chaveLinha);
        if (e.target.checked) todas.forEach((k) => est.selecao.add(k)); else est.selecao.clear();
        redesenhar('[data-oc-marcar-todas]');
        return;
      }
      const f = e.target.dataset.ocFiltro;
      if (f) {
        est[f] = e.target.value;
        if (f === 'empresa' && est.fazenda && !(DADOS.fazendasPorEmpresa[est.empresa] || DADOS.fazendas).includes(est.fazenda)) est.fazenda = '';
        // Outra safra: os períodos que começam na primeira OS da safra passam a começar na dela
        if (f === 'safra') {
          const ini = primeiraData(est.safra);
          ['atrasoRec', 'atrasoExec', 'justificativas'].forEach((k) => { est.periodos[k].de = ini; });
        }
        redesenhar(`[data-oc-filtro="${f}"]`);
        return;
      }
      const d = e.target.dataset.ocData;
      if (d) {
        est.periodos[est.cartao][d] = e.target.value;
        if (est.cartao === 'recomendar') est.periodos.recomendar.horizonte = 'personalizado';
        redesenhar(`[data-oc-data="${d}"]`);
        return;
      }
      if (e.target.matches('[data-oc-horizonte]')) {
        const h = HORIZONTES.find(([id]) => id === e.target.value);
        const per = est.periodos.recomendar;
        per.horizonte = h[0];
        if (h[2] !== undefined) { per.de = hoje(); per.ate = somaDias(hoje(), h[2]); }
        redesenhar('[data-oc-horizonte]');
      }
    });

    redesenhar();
  }

  // Para a Central de Operações (Tela 09): dados, safras, filtros e ordenação compartilhados
  const base = { linhasOperacoes, publicados, safras, safraInicial, primeiraData, somaDias, diasEntre, hoje, ordens,
    opcoesSelect, gruposDaSafra, comparar, esc };
  return { desenhar, aoMostrar, cabecalho, base };
})();
