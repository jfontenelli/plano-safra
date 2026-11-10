/*
 * Gestão da Lavoura › Operações › guia Calendário (Tela 07; 11/11/2026, antes item do menu): a lista suspensa Mês · Semana · Dia (11/11/2026: o Ano saiu e virou a guia
 * Cronograma de Safras da página Planos, js/telas/cronograma-safras.js). As operações de vários planos somados, sem a
 * associação a um plano, na última versão publicada de cada plano, por talhão. Ano (11/11/2026): a mesma tabela, com os
 * meses da safra escolhida (da primeira operação à colheita); as setas trocam a safra. Filtros: Safra (uma escolha), Cultura,
 * Empresa, Fazenda, Talhão, Grupo de operação e Operação. O tempo anda pelas setas; abre no Mês de hoje.
 * Legenda por status (Atrasada · Em execução · Finalizada · Planejada), etiquetas na cor do status, a atrasada migra
 * para hoje, "N ha previstos" no título de cada coluna. Detalhe em registros().
 * As datas e o desenho da grade vêm do Calendário do plano (js/telas/05-calendario.js).
 */
window.Telas = window.Telas || {};

window.Telas.osCalendario = (function () {
  const esc = Util.escapar;
  const Cal = () => Telas.calendario;
  // Grupos de operação pelo tipo (os nomes de cada plano podem mudar; a cor segue o tipo), nesta ordem na legenda
  // (03/11/2026: Corretivos, do tipo Aplicação de insumos, primeiro)
  const ORDEM_TIPO = ['aplicacao-de-insumos', 'sementes', 'fertilidade', 'defensivos', 'colheita'];
  // Sem o nível Empresa (Util.comEmpresa), sem o filtro Empresa (fica em Todas)
  const FILTROS = Util.semEmpresa([
    ['safra', 'Safra', ['Todas', 'Nenhuma', 'selecionadas']],
    ['cultura', 'Cultura', ['Todas', 'Nenhuma', 'culturas']],
    ['empresa', 'Empresa', ['Todas', 'Nenhuma', 'empresas']],
    ['fazenda', 'Fazenda', ['Todas', 'Nenhuma', 'fazendas']],
    ['talhao', 'Talhão', ['Todos', 'Nenhum', 'talhões']],
    ['grupo', 'Grupo de operação', ['Todos', 'Nenhum', 'grupos']],
    ['operacao', 'Operação', ['Todas', 'Nenhuma', 'operações']]
  ]);

  // Estado da tela: período, dia aberto e filtros ('todos' ou a lista do que está marcado). Mantém-se ao navegar.
  // Abre no Mês de hoje
  const novoEstado = () => ({ escala: 'mes', comAno: true, dataRef: Cal().hojeIso(), safra: 'todos', empresa: 'todos', fazenda: 'todos',
    cultura: 'todos', operacao: 'todos', talhao: 'todos', grupo: 'todos', status: null });
  let est = null;

  // Grupo de operação → a chave (o tipo)
  const tipoDe = (grupo) => Util.normalizar(grupo.tipo || 'outro').replace(/\s+/g, '-');
  const nomeOp = (it) => (it.colheita ? 'Colheita' : it.op.nome || 'Sem operação');
  const posTipo = (t) => (ORDEM_TIPO.includes(t) ? ORDEM_TIPO.indexOf(t) : 99);
  // Aparece no calendário: grupo e operação marcados nos filtros
  const visivel = (it) => Cal().marcado(est, 'grupo', tipoDe(it.grupo)) && Cal().marcado(est, 'operacao', nomeOp(it));
  const comPublicada = () => DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p));
  const valorDe = { safra: (p) => p.safra, empresa: (p) => p.empresa, fazenda: (p) => p.fazenda, cultura: (p) => p.cultura };
  const planosFiltrados = () => comPublicada().filter((p) => Object.keys(valorDe).every((c) => Cal().marcado(est, c, valorDe[c](p))));

  // Opções de cada filtro: o que existe nos planos com versão publicada. Talhão: os talhões dos planos que passam
  // pelos outros filtros, com a fazenda junto ("Santa Clara · T01"), porque o nome se repete entre fazendas.
  // Operação: as operações dos grupos marcados, pelo nome (o mesmo nome em vários planos é uma opção só),
  // na ordem da legenda e, dentro do grupo, na ordem do plano; ao lado, o grupo.
  function opcoes(chave) {
    if (chave === 'grupo') return gruposLegenda(calcular().itens);
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
    // Safra → Empresa → Fazenda; a Empresa só com as que têm a safra escolhida e a Fazenda só com as das empresas
    // marcadas e da safra, em ordem alfabética
    if (chave === 'empresa' || chave === 'fazenda') {
      const base = comPublicada().filter((p) => Cal().marcado(est, 'safra', p.safra)
        && (chave === 'empresa' || Cal().marcado(est, 'empresa', p.empresa)));
      return [...new Set(base.map(valorDe[chave]))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((x) => ({ valor: x, nome: x }));
    }
    const presentes = new Set(comPublicada().map(valorDe[chave]));
    // Safra: as do cadastro (26/27, 27/27…), na ordem do cadastro
    if (chave === 'safra') return Util.ordenarSafras([...presentes]).map((x) => ({ valor: x, nome: x }));
    const ordem = { empresa: DADOS.empresas, fazenda: DADOS.fazendas, cultura: DADOS.culturasPlanos }[chave];
    return ordem.filter((x) => presentes.has(x)).map((x) => ({ valor: x, nome: x }));
  }

  // Uma Safra por vez (05/11/2026; a escolhida; sem escolha, a safra atual ou, sem ela, a mais recente); Empresa,
  // Fazenda, Cultura, Talhão, Grupo de operação e Operação com várias. Empresa e Fazenda dependem da safra: se nenhuma
  // marcada existe com ela (ex.: trocou a safra), voltam a Todas.
  const UNICOS = ['safra'];
  function ajustarUnicos() {
    UNICOS.forEach((chave) => {
      const ops = opcoes(chave).map((o) => o.valor);
      const escolhida = Array.isArray(est[chave]) && est[chave].length === 1 && ops.includes(est[chave][0]) ? est[chave][0] : null;
      const atual = chave === 'safra' && ops.includes(FiltrosBase.safraAtual()) ? FiltrosBase.safraAtual() : null;
      const marcadas = est[chave] === 'todos' ? [] : ops.filter((v) => Cal().marcado(est, chave, v));
      const valor = escolhida || marcadas[0] || atual || ops[0];
      est[chave] = valor ? [valor] : [];
    });
    ['empresa', 'fazenda'].forEach((chave) => {
      if (!Array.isArray(est[chave]) || !est[chave].length) return;
      const ops = opcoes(chave).map((o) => o.valor);
      if (!est[chave].some((v) => ops.includes(v))) est[chave] = 'todos';
    });
  }

  // Operações planejadas de cada plano (só as que têm talhão; a colheita depois do plantio), com os eventos no tempo
  function calcular() {
    const itens = []; const eventos = [];
    let ini = null; let fim = null; // da primeira operação ao fim da colheita, nos planos dos filtros (para o Ano)
    planosFiltrados().forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const talhao = est.talhao === 'todos' ? 'todos'
        : est.talhao.filter((x) => x.startsWith(`${p.fazenda}|`)).map((x) => x.slice(p.fazenda.length + 1));
      const ctx = { plano: { grupos: Versoes.grupos(p, v) }, talhoes: Util.talhoesPlano(p, v), estado: { talhao } };
      const lista = Cal().itens(ctx).filter((it) => (it.colheita ? !it.aguardando : it.talhoes.length > 0));
      const local = `${p.fazenda} · ${p.safra}`;
      lista.forEach((it) => itens.push({ it, local }));
      Cal().eventos(ctx, lista).forEach((ev) => { if (!ini || ev.inicio < ini) ini = ev.inicio; if (!fim || ev.fim > fim) fim = ev.fim; });
      const visiveis = lista.filter(visivel);
      const ano = String(Util.anoAgricola(p.safra));
      Cal().eventos(ctx, visiveis).forEach((ev) => eventos.push({ ...ev, local, ano, fazenda: p.fazenda, plano: p,
        chave: `${p.id}:${ev.it.colheita ? 'colheita' : ev.it.op.id}` }));
    });
    eventos.sort((a, b) => a.inicio.localeCompare(b.inicio));
    const semData = itens.filter(({ it }) => visivel(it) && !eventos.some((ev) => ev.it === it)).length;
    return { itens, eventos, semData, periodoSafra: ini ? { de: `${ini.slice(0, 8)}01`, ate: ultimoDia(fim) } : null };
  }
  const ultimoDia = (iso) => { const d = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), 0); return `${iso.slice(0, 8)}${String(d.getDate()).padStart(2, '0')}`; };

  // Ano: os meses de de a ate, "set 2026"
  function mesesDe(de, ate) {
    const lista = [];
    for (let a = Number(de.slice(0, 4)), m = Number(de.slice(5, 7)); `${a}-${String(m).padStart(2, '0')}-01` <= ate; m === 12 ? (a++, m = 1) : m++) {
      const ini = `${a}-${String(m).padStart(2, '0')}-01`;
      lista.push({ de: ini, ate: ultimoDia(ini), rotulo: `${MESES_SEM[m - 1]} ${a}` });
    }
    return lista;
  }
  // Safras do filtro, da mais antiga para a mais recente (para as setas do Ano)
  const safrasEmOrdem = () => Util.ordenarSafras(opcoes('safra').map((o) => o.valor)).reverse();
  // Ano: Hoje (a safra atual) · ‹ › (a safra anterior e a próxima) · "Safra 26/27" · a escala
  function navAno() {
    const lista = safrasEmOrdem();
    const s = Array.isArray(est.safra) ? est.safra[0] : '';
    const i = lista.indexOf(s);
    const atual = lista.includes(FiltrosBase.safraAtual()) ? FiltrosBase.safraAtual() : lista[lista.length - 1];
    return `
      <div class="cal-nav">
        <button class="botao botao--secundario botao--p cal-nav__hoje" type="button" data-acao="os-safra" data-safra="${esc(atual || '')}" title="Ir para a safra atual">Hoje</button>
        <button class="botao-icone cal-nav__seta" type="button" data-acao="os-safra" data-safra="${esc(lista[i - 1] || '')}" aria-label="Safra anterior" title="Safra anterior" ${i <= 0 ? 'disabled' : ''}>${Icones.anterior}</button>
        <button class="botao-icone cal-nav__seta" type="button" data-acao="os-safra" data-safra="${esc(lista[i + 1] || '')}" aria-label="Próxima safra" title="Próxima safra" ${i < 0 || i >= lista.length - 1 ? 'disabled' : ''}>${Icones.proxima}</button>
        <span class="cal-nav__titulo" aria-live="polite">Safra ${esc(s)}</span>
        ${Cal().seletorEscala(est)}
      </div>`;
  }

  // Grupos (filtro Grupo de operação): os tipos que têm operação, na ordem Corretivos, Plantio, Fertilidade, Defensivo, Colheita (outros no fim)
  function gruposLegenda(itens) {
    const mapa = new Map();
    itens.forEach(({ it }) => { const t = tipoDe(it.grupo); if (!mapa.has(t)) mapa.set(t, it.grupo.nome); });
    return [...mapa.entries()].map(([valor, nome]) => ({ valor, nome })).sort((a, b) => posTipo(a.valor) - posTipo(b.valor));
  }

  function desenhar() {
    est = est || novoEstado();
    // Primeira guia de Operações (11/11/2026): o item Operações do menu volta para ela
    Telas.monitoramentoAplicacoes.marcarCalendario();
    return `
      <header class="cabecalho oa-cabecalho ma-cabecalho" data-os-cabecalho>${Telas.monitoramentoAplicacoes.cabecalho('calendario')}</header>
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
          ${Cal().filtroCaixa(est, chave, opcoes(chave), textos, rotulo, { unico: UNICOS.includes(chave) })}
        </div>`).join('')}
      <div class="bf__acoes bf__acoes--texto">
        <!-- Limpar filtros padronizado (04/11/2026): contorno cinza, texto e ícone pretos, sempre com o nome -->
        <button class="botao botao--secundario bf__botao bf__limpar bf__limpar--so" type="button" data-acao="os-limpar"
                title="Limpar filtros" aria-label="Limpar filtros">${Icones.limpar}<span class="bf__texto">Limpar filtros</span></button>
      </div>`;
  }

  // ----- Status das operações no Mês, na Semana e no Dia (10/11/2026) -----
  // Uma operação num talhão é um registro, com o status pela data de hoje real (não a do período mostrado):
  // - Finalizada (antes Executada; 10/11/2026): a OS foi fechada. Aparece onde ocorreu: da abertura da OS ao fechamento.
  //   As datas vêm da mesma simulação da página Operações (Telas.monitoramentoAplicacoes.execucao).
  // - Em execução (10/11/2026): a OS foi aberta e ainda não foi fechada (mesmo com o prazo vencido). Da abertura até hoje.
  // - Atrasada: o prazo final (dia planejado + previsão de conclusão) passou e a OS nem foi aberta. Migra para hoje:
  //   aparece só no dia de hoje (Semana e Dia) ou na semana de hoje (Mês), com os dias de atraso (a partir do dia
  //   seguinte ao prazo final); some dos períodos anteriores. A data planejada não muda.
  // - Planejada: a OS não foi aberta e o prazo não venceu. Só o dia planejado no talhão, sem duração (a duração vem com
  //   a abertura da OS; 10/11/2026).
  // ref: a data de referência para os hectares previstos (cada operação conta uma vez): Planejada, o dia planejado;
  // Atrasada e Em execução, hoje; Finalizada, o fechamento da OS.
  // Ordem do ciclo da OS (11/11/2026), a mesma dos cartões na célula: não começou (Atrasada, Planejada), Em execução, Finalizada
  const STATUS = [['atrasada', 'Atrasada'], ['planejada', 'Planejada'], ['execucao', 'Em execução'], ['finalizada', 'Finalizada']];
  const DICA_STATUS = {
    atrasada: 'O prazo planejado já passou e a OS não foi aberta.',
    execucao: 'A OS foi aberta e ainda não foi fechada.',
    finalizada: 'A operação foi concluída (OS fechada).',
    planejada: 'A OS ainda não foi aberta e o prazo planejado não venceu.'
  };
  // Ícones, na legenda e nos cartões
  const ICONE = () => ({ atrasada: Icones.pendente, execucao: Icones.relogio, finalizada: Icones.executada, planejada: Icones.calendario });
  // Na mesma célula, uma embaixo da outra, na ordem da legenda: Atrasadas, Planejadas, Em execução e Finalizadas
  const PRIORIDADE = { atrasada: 0, planejada: 1, execucao: 2, finalizada: 3 };
  const diasEntre = (de, ate) => Math.round((Date.parse(ate) - Date.parse(de)) / 86400000);
  function registros(evs) {
    const hoje = Cal().hojeIso();
    const saida = [];
    evs.forEach((ev) => {
      const p = ev.plano;
      const talhoes = Util.talhoesPlano(p, Versoes.ultimaPublicada(p));
      const g = ev.it.grupo;
      const op = ev.it.op;
      ev.talhoes.forEach((t) => {
        const iT = talhoes.findIndex((x) => x.nome === t);
        // Índice da simulação, como nas outras páginas: Plantio, o do talhão; Colheita, iT * 3 + 2; as outras, pela posição no grupo
        const i = ev.it.colheita ? iT * 3 + 2 : g.tipo === 'Sementes' ? iT : iT * 3 + Math.max(0, (g.operacoes || []).indexOf(op));
        const { executada, fechamento } = op ? Telas.monitoramentoAplicacoes.execucao(p, t, op, g, ev.inicio, iT, i) : {};
        // Área operacional: a área planejada do talhão (na colheita de um talhão só, a das variedades dele)
        const area = ev.talhoes.length === 1 ? ev.area : (talhoes[iT] || { area: 0 }).area;
        let r;
        if (fechamento) r = { status: 'finalizada', inicio: executada, fim: fechamento, ref: fechamento };
        else if (executada) r = { status: 'execucao', inicio: executada, fim: hoje, ref: hoje, emExecucao: diasEntre(executada, hoje) };
        else if (ev.fim < hoje) r = { status: 'atrasada', inicio: hoje, fim: hoje, ref: hoje, atraso: diasEntre(ev.fim, hoje) };
        else r = { status: 'planejada', inicio: ev.inicio, fim: ev.inicio, ref: ev.inicio };
        saida.push({ ...r, ev, talhao: `${ev.fazenda}|${t}`, area, executada, fechamento });
      });
    });
    // Status escolhido na legenda: só ele (também nos hectares)
    return saida.filter((r) => !est.status || r.status === est.status);
  }
  // Hectares previstos de uma coluna (dia ou semana): a área dos registros com a data de referência nela
  const haPrevistos = (regs, de, ate) => regs.reduce((s, r) => s + (r.ref >= de && r.ref <= ate ? r.area : 0), 0);

  // Legenda (10/11/2026): Atrasada · Planejada · Em execução · Finalizada, um status por vez (clicar de novo volta a todos); não muda o período
  // No padrão da legenda da página Operações › Desvios de data (10/11/2026): o título "Operações:" e os status, com os
  // mesmos ícones dos cartões do calendário (Atrasada, a exclamação; Em execução, o relógio; Finalizada, o check; Planejada, o calendário)
  const MARCA = Object.fromEntries(STATUS.map(([id]) => [id,
    `<span class="cal-leg__icone cal-st--${id}" aria-hidden="true">${ICONE()[id]}</span>`]));
  function legendaStatus() {
    return `
      <div class="ma-legenda">
        <span class="ma-legenda__titulo">Operações:</span>
        <ul aria-label="Filtrar por status da operação">
          ${STATUS.map(([id, nome]) => `<li><button class="ma-legenda__item ${est.status && est.status !== id ? 'ma-legenda__item--apagado' : ''}" type="button"
              data-acao="os-status" data-status="${id}" aria-pressed="${est.status === id}" title="${est.status === id ? 'Mostrar todos' : DICA_STATUS[id]}">
              ${MARCA[id]}${nome}</button></li>`).join('')}
        </ul>
      </div>`;
  }

  // ----- Mês (05/11/2026, imagem da usuária): uma linha por talhão × as semanas do mês -----
  // Linhas: todos os talhões dos planos que passam pelos filtros (Talhão também), mesmo sem operação no mês; por
  // fazenda (alfabética) e talhão (T01, T02…). O mesmo talhão em vários planos (soja e milho safrinha) é uma linha só.
  function talhoesDoMes() {
    const vistos = new Map();
    planosFiltrados().forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      // Variedades do talhão: as do Plantio do plano (mais de uma, separadas por vírgula)
      const plantio = (Versoes.grupos(p, v).find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0] || null;
      Util.talhoesPlano(p, v).forEach((t) => {
        const chave = `${p.fazenda}|${t.nome}`;
        if (est.talhao !== 'todos' && !est.talhao.includes(chave)) return;
        if (!vistos.has(chave)) vistos.set(chave, { chave, fazenda: p.fazenda, nome: t.nome, area: t.area, variedades: [] });
        const l = vistos.get(chave);
        (plantio ? Planos.linhasPlantio(plantio, t.nome) : []).forEach((x) => {
          if (x.variedade && !l.variedades.includes(x.variedade)) l.variedades.push(x.variedade);
        });
      });
    });
    return [...vistos.values()].sort((a, b) => a.fazenda.localeCompare(b.fazenda, 'pt-BR')
      || a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
  }

  // Colunas da Semana (05/11/2026): os 7 dias, de domingo a sábado, com "dom" em cima e "01 nov" embaixo
  const DIAS_SEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const MESES_SEM = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function diasDaSemana(de, n = 7) {
    const lista = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(Number(de.slice(0, 4)), Number(de.slice(5, 7)) - 1, Number(de.slice(8, 10)) + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      lista.push({ de: iso, ate: iso, dia: DIAS_SEM[d.getDay()], data: `${String(d.getDate()).padStart(2, '0')} ${MESES_SEM[d.getMonth()]}` });
    }
    return lista;
  }

  // Mês e Semana por talhão. Barras: cada operação de um talhão (um registro, com o status) ocupa as colunas inteiras
  // (semanas no Mês, dias na Semana) do início ao fim em que aparece (ver registros()), numa barra só (como um evento
  // de vários dias no Google Agenda), na cor do status. Várias barras na mesma coluna do mesmo talhão ficam uma embaixo da
  // outra (a linha cresce), na ordem Atrasadas, Planejadas, Em execução e Finalizadas. Como a etiqueta da página Operações › Desvios de data (10/11/2026): o ícone (ICONE), o nome e o atraso.
  // Dia (05/11/2026, imagem da usuária): a mesma tabela, com uma coluna só, a do dia; a tabela fica estreita.
  // Embaixo da data de cada coluna, "850 ha previstos" (10/11/2026; haPrevistos).
  function mesPorTalhao(regs, de, ate, escala = 'mes') {
    const naSemana = escala === 'semana' || escala === 'dia';
    const noDia = escala === 'dia';
    const noAno = escala === 'ano';
    const semanas = noAno ? mesesDe(de, ate) : noDia ? diasDaSemana(de, 1) : naSemana ? diasDaSemana(de) : Cal().semanasDoMes(de, ate);
    const linhas = talhoesDoMes();
    if (!linhas.length) return '<p class="cal-painel__vazio">Nenhum talhão nos planos publicados com esses filtros.</p>';
    const hoje = Cal().hojeIso();
    const semanaDe = (iso) => semanas.findIndex((s) => s.de <= iso && iso <= s.ate);
    // Por talhão: as barras (registros no período), com as colunas ocupadas
    const porTalhao = new Map(linhas.map((l) => [l.chave, []]));
    regs.forEach((r) => {
      if (r.fim < de || r.inicio > ate || !porTalhao.has(r.talhao)) return;
      porTalhao.get(r.talhao).push({ r, a: semanaDe(r.inicio < de ? de : r.inicio), b: semanaDe(r.fim > ate ? ate : r.fim) });
    });
    const barrasDe = (chave) => {
      const barras = porTalhao.get(chave);
      barras.sort((x, y) => PRIORIDADE[x.r.status] - PRIORIDADE[y.r.status] || x.a - y.a || y.b - x.b
        || x.r.inicio.localeCompare(y.r.inicio));
      // Cada barra na primeira faixa em que não se sobrepõe a outra
      const faixas = [];
      barras.forEach((br) => {
        let f = faixas.findIndex((ocup) => ocup.every(([a, b]) => b < br.a || a > br.b));
        if (f < 0) { f = faixas.length; faixas.push([]); }
        faixas[f].push([br.a, br.b]);
        br.faixa = f;
      });
      return { barras, faixas: Math.max(1, faixas.length) };
    };
    const diasAtraso = (n) => `${n} ${n === 1 ? 'dia' : 'dias'} de atraso`;
    // Dica (11/11/2026): "Boa Vista · T01 · 2ª Fungicida" e, embaixo, o status com as datas (dd/mm/aaaa) e os dias:
    // "Em Execução desde 15/10/2026 (26 dias)", "Atrasada desde 02/11/2026 (9 dias)" (o dia seguinte ao prazo final),
    // "Finalizada: 10/10/2026 - 15/10/2026 (5 dias)", "Planejada: 15/10/2026"
    const nDias = (n) => `${n} ${n === 1 ? 'dia' : 'dias'}`;
    const dica = (l, { r }) => {
      const situacao = r.status === 'finalizada' ? `Finalizada: ${Util.data(r.executada)} - ${Util.data(r.fechamento)} (${nDias(diasEntre(r.executada, r.fechamento))})`
        : r.status === 'execucao' ? `Em Execução desde ${Util.data(r.executada)} (${nDias(r.emExecucao)})`
        : r.status === 'atrasada' ? `Atrasada desde ${Util.data(Telas.monitoramentoAplicacoes.somaDias(r.ev.fim, 1))} (${nDias(r.atraso)})`
        : `Planejada: ${Util.data(r.ev.inicio)}`;
      return `${l.fazenda} · ${l.nome} · ${r.ev.nome}
${situacao}`;
    };
    // Colunas que já passaram: a coluna inteira esmaecida (o fundo cinza leve, o título e os cartões); hoje sem fundo
    const fundo = (s) => (s.ate < hoje ? 'cal-tal--passado' : '');
    let linha = 2; // a 1ª linha da grade é o cabeçalho
    const corpoLinhas = linhas.map((l) => {
      const { barras, faixas } = barrasDe(l.chave);
      const r = linha;
      linha += faixas;
      const area = `grid-row: ${r} / span ${faixas}`;
      return `
        <div class="cal-tal__info" style="${area}; grid-column: 1"><strong class="cal-tal__talhao">${esc(l.nome)}</strong>
          <span class="cal-tal__fazenda">${esc(l.fazenda)}</span><span class="cal-tal__var">${esc(l.variedades.join(', ') || '—')}</span></div>
        ${semanas.map((s, i) => `<div class="cal-tal__cel ${fundo(s)}" style="${area}; grid-column: ${i + 2}"></div>`).join('')}
        ${barras.map((br) => `
          <span class="cal-tal__barra cal-st--${br.r.status} ${semanas[br.b].ate < hoje ? 'cal-tal--passado' : ''}"
                style="grid-row: ${r + br.faixa}; grid-column: ${br.a + 2} / ${br.b + 3}" title="${esc(dica(l, br))}">
            <span class="cal-tal__conteudo"><span class="cal-tal__icone" aria-hidden="true">${ICONE()[br.r.status]}</span><span class="cal-tal__nome">${esc(br.r.ev.nome)}</span>${br.r.status === 'atrasada'
              ? `<span class="cal-tal__selo" aria-label="${diasAtraso(br.r.atraso)}">${br.r.atraso}d</span>`
              : ''}</span></span>`).join('')}`;
    }).join('');
    // Colunas que já passaram (o dia ou a semana inteira antes de hoje): "N ha executados", só a área das finalizadas
    // (fechamento da OS na coluna); hoje e os dias seguintes, "N ha previstos" (10/11/2026)
    const ha = (s) => (s.ate < hoje
      ? `<span class="cal-tal__ha">${Util.area(haPrevistos(regs.filter((r) => r.status === 'finalizada'), s.de, s.ate))} executados</span>`
      : `<span class="cal-tal__ha">${Util.area(haPrevistos(regs, s.de, s.ate))} previstos</span>`);
    return `
      <div class="cal-mestab">
        <div class="cal-tal ${noDia ? 'cal-tal--dia' : ''} ${noAno ? 'cal-tal--ano' : ''}" style="--semanas: ${semanas.length}">
          <div class="cal-tal__cab cal-tal__cab--info" style="grid-column: 1">Talhão</div>
          ${semanas.map((s, i) => `<div class="cal-tal__cab ${fundo(s)}" style="grid-column: ${i + 2}" ${s.de <= hoje && hoje <= s.ate ? 'data-coluna-hoje' : ''}>
            ${noDia ? `
            <span class="cal-mestab__semana cal-tal__dia cal-tal__dia--fixo"><span class="cal-tal__dia-sem">${s.dia}</span><span class="cal-mestab__rotulo ${s.de === hoje ? 'cal-mestab__rotulo--atual' : ''}">${s.data}</span>${ha(s)}</span>` : naSemana ? `
            <button class="cal-mestab__semana cal-tal__dia" type="button" data-acao="os-dia" data-dia="${s.de}"
                    title="Ver o dia ${s.data}${s.de === hoje ? ' (hoje)' : ''}"><span class="cal-tal__dia-sem">${s.dia}</span><span class="cal-mestab__rotulo ${s.de === hoje ? 'cal-mestab__rotulo--atual' : ''}">${s.data}</span>${ha(s)}</button>` : `
            ${noAno ? `
            <button class="cal-mestab__semana cal-tal__sem" type="button" data-acao="os-mes" data-dia="${s.de}"
                    title="Ver o mês de ${s.rotulo}${s.de <= hoje && hoje <= s.ate ? ' (mês atual)' : ''}"><span class="cal-mestab__rotulo ${s.de <= hoje && hoje <= s.ate ? 'cal-mestab__rotulo--atual' : ''}">${s.rotulo}</span>${ha(s)}</button>` : `
            <button class="cal-mestab__semana cal-tal__sem" type="button" data-acao="cal-semana" data-dia="${s.de}"
                    title="Ver a semana de ${s.rotulo}${s.de <= hoje && hoje <= s.ate ? ' (semana atual)' : ''}"><span class="cal-mestab__rotulo ${s.de <= hoje && hoje <= s.ate ? 'cal-mestab__rotulo--atual' : ''}">${s.rotulo}</span>${ha(s)}</button>`}`}</div>`).join('')}
          ${corpoLinhas}
        </div>
      </div>`;
  }

  function corpo() {
    const { itens, eventos, semData, periodoSafra } = calcular();
    if (est.escala === 'ano') {
      return `
      <div class="calendario__barra os-cal__barra">
        ${legendaStatus()}
        ${navAno()}
      </div>
      ${itens.length && periodoSafra ? `
      <div class="cal-mes"><div class="cal-mes__principal">
        ${semData ? `<p class="calendario__pendentes">${Icones.info}<span>${semData} ${semData === 1 ? 'operação planejada fica' : 'operações planejadas ficam'} fora do calendário: sem data de plantio nos talhões dela.</span></p>` : ''}
        ${mesPorTalhao(registros(eventos), periodoSafra.de, periodoSafra.ate, 'ano')}
      </div></div>`
        : `<p class="cag__vazio">${planosFiltrados().length ? 'Nenhuma operação planejada nos planos publicados com esses filtros.' : 'Nenhum plano publicado com esses filtros.'}</p>`}`;
    }
    // Mês, Semana e Dia (10/11/2026): legenda por status; os registros (operação × talhão, com o status) no lugar dos
    // eventos; sem o rodapé Área operacional (a área fica nos títulos das colunas)
    return `
      <div class="calendario__barra os-cal__barra">
        ${legendaStatus()}
        ${Cal().navCalendario(est)}
      </div>
      ${itens.length ? Cal().calendarioMes({ est, todos: registros(eventos), semData, corpoMes: mesPorTalhao, semRodape: true })
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
      ajustarUnicos();
      const rolagem = caixa.querySelector('.cal-mestab')?.scrollLeft || 0;
      caixaFiltros.innerHTML = filtros();
      caixa.innerHTML = corpo();
      // Largura da coluna Talhão (parada à esquerda): o nome do cartão gruda logo depois dela ao rolar para o lado
      const box = caixa.querySelector('.cal-mestab');
      const info = box && box.querySelector('.cal-tal__cab--info');
      if (info) box.style.setProperty('--info-largura', `${info.offsetWidth}px`);
      if (est.escala === 'ano') rolarAno(rolagem);
      if (foco) raiz.querySelector(foco)?.focus({ preventScroll: true });
    };
    // Ano (11/11/2026): a rolagem para sempre no começo de um mês (logo depois da coluna Talhão, que fica parada). Abre
    // sempre com o mês anterior ao de hoje na primeira coluna (ao entrar no Ano, ao voltar à página, com Hoje e ao trocar a safra; sem ele, no começo);
    // nos outros redesenhos (filtros, legenda), fica onde estava
    // Ao mudar o tamanho da janela (ou recolher o menu), refaz a largura dos meses
    new ResizeObserver(() => { if (est.escala === 'ano' && caixa.isConnected) rolarAno(caixa.querySelector('.cal-mestab')?.scrollLeft || 0); }).observe(caixa);
    function rolarAno(antes) {
      const box = caixa.querySelector('.cal-mestab');
      const info = box && box.querySelector('.cal-tal__cab--info');
      if (!box || !info) return;
      box.style.scrollPaddingLeft = `${info.offsetWidth}px`;
      // Meses de largura igual que enchem a área visível (ao lado da coluna Talhão) num número inteiro de meses: assim a
      // rolagem, até no fim, para sempre no começo de um mês (cada mês com ao menos 200 px)
      const grade = box.querySelector('.cal-tal--ano');
      const disp = box.clientWidth - info.offsetWidth;
      const meses = grade.querySelectorAll('.cal-tal__cab:not(.cal-tal__cab--info)').length;
      const cabem = Math.max(1, Math.min(meses, Math.floor(disp / 200)));
      grade.style.setProperty('--mes-largura', `${Math.floor(disp / cabem)}px`);
      const hojeCab = box.querySelector('[data-coluna-hoje]');
      if (est.irParaHoje) {
        // O mês anterior ao de hoje na primeira coluna, e o de hoje logo depois (sem o de hoje na safra, o começo)
        const anterior = hojeCab && hojeCab.previousElementSibling;
        const alvo = anterior && anterior.matches('.cal-tal__cab:not(.cal-tal__cab--info)') ? anterior : hojeCab;
        box.scrollLeft = alvo ? box.scrollLeft + alvo.getBoundingClientRect().left - box.getBoundingClientRect().left - info.offsetWidth : 0;
      } else box.scrollLeft = antes;
      est.irParaHoje = false;
    }
    const ctx = { estado: est };
    const acoes = { redesenhar };

    raiz.addEventListener('click', (e) => {
      if (e.target.closest('[data-acao="os-limpar"]')) {
        est = Object.assign(novoEstado(), { escala: est.escala, dataRef: est.dataRef });
        ctx.estado = est;
        redesenhar('[data-acao="os-limpar"]');
        return;
      }
      // Legenda do Mês, da Semana e do Dia (10/11/2026): um status por vez; clicar de novo volta a todos. O período fica
      const st = e.target.closest('[data-acao="os-status"]');
      if (st) {
        est.status = est.status === st.dataset.status ? null : st.dataset.status;
        redesenhar(`[data-acao="os-status"][data-status="${st.dataset.status}"]`);
        return;
      }
      // Semana: clicar no título de um dia abre o Dia
      // Ano: o título do mês abre o Mês; Hoje e as setas trocam a safra (o filtro)
      const mes = e.target.closest('[data-acao="os-mes"]');
      if (mes) { est.escala = 'mes'; est.dataRef = mes.dataset.dia; est.diaAberto = null; redesenhar('[data-campo="cal-escala"]'); return; }
      const sf = e.target.closest('[data-acao="os-safra"]');
      if (sf) {
        if (!sf.disabled && sf.dataset.safra) { est.safra = [sf.dataset.safra]; ajustarUnicos(); }
        est.irParaHoje = true;
        redesenhar(sf.classList.contains('cal-nav__hoje') ? '.cal-nav__hoje' : `[aria-label="${sf.getAttribute('aria-label')}"]:not(:disabled)`);
        return;
      }
      const dia = e.target.closest('[data-acao="os-dia"]');
      if (dia) { est.escala = 'dia'; est.dataRef = dia.dataset.dia; est.diaAberto = null; redesenhar('[data-campo="cal-escala"]'); return; }
      // Hoje, setas, dia, painel do dia, "+N talhões" e abrir/fechar as caixas de filtro: como no Calendário do plano
      Cal().aoClicar(e, ctx, acoes);
    });

    raiz.addEventListener('change', (e) => {
      // Filtros com caixas: "Todas" marca ou desmarca tudo; cada caixa liga ou desliga a opção
      if (e.target.dataset.campo === 'cal-filtro') {
        const chave = e.target.dataset.filtro;
        const valores = opcoes(chave).map((o) => o.valor);
        let marcados = valores.filter((v) => Cal().marcado(est, chave, v));
        if (e.target.type === 'radio') marcados = [e.target.value];
        else if (e.target.value === 'todos') marcados = e.target.checked ? [...valores] : [];
        else if (e.target.checked) marcados.push(e.target.value);
        else marcados = marcados.filter((n) => n !== e.target.value);
        est[chave] = marcados.length === valores.length && e.target.type !== 'radio' ? 'todos' : marcados;
        // Trocar a Safra refaz Empresa e Fazenda (as marcadas ficam, se ainda existirem)
        if (e.target.type === 'radio') ajustarUnicos();
        // Grupo de operação e Operação (10/11/2026): com escolha, vai para a operação mais cedo; de volta a Todos, vai
        // para hoje (como o botão Hoje)
        if (chave === 'operacao' || chave === 'grupo') {
          if (est[chave] === 'todos') est.dataRef = Cal().hojeIso();
          else {
            const primeira = calcular().eventos[0];
            if (primeira) est.dataRef = primeira.inicio;
          }
          est.diaAberto = null;
        }
        est.filtroAberto = chave;
        redesenhar(`[data-campo="cal-filtro"][data-filtro="${chave}"][value="${CSS.escape(e.target.value)}"]`);
        return;
      }
      // Para o Ano: no mês de hoje
      if (e.target.dataset.campo === 'cal-escala' && e.target.value === 'ano') est.irParaHoje = true;
      // Do Ano para Mês, Semana ou Dia: hoje, se estiver na safra; senão, o começo da safra
      if (e.target.dataset.campo === 'cal-escala' && est.escala === 'ano') {
        const p = calcular().periodoSafra;
        const hoje = Cal().hojeIso();
        est.dataRef = !p || (p.de <= hoje && hoje <= p.ate) ? hoje : p.de;
        est.escala = e.target.value; est.diaAberto = null;
        redesenhar('[data-campo="cal-escala"]');
        return;
      }
      Cal().aoMudar(e, ctx, acoes);
    });

    raiz.addEventListener('input', (e) => Cal().aoDigitar(e, ctx));
    est.irParaHoje = true;
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
