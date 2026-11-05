/*
 * Calendário Agrícola, a primeira guia de Gestão da Lavoura › Planejado x Executado (DECISOES 4.0), com os seus próprios
 * filtros: a lista suspensa Ano · Mês · Semana · Dia. Ano (abre nele):
 * o ano agrícola por Empresa › Fazenda › Safra/Safrinha (js/telas/calendario-agricola.js; as setas trocam o ano agrícola).
 * Mês, Semana e Dia: a Agenda Agrícola, a grade que antes ficava no Resumo do plano,
 * com as operações de vários planos somados, sem a associação a um plano. Usa a última versão publicada de cada
 * plano. Filtros com várias escolhas: Safra (Safra ou Safrinha), Cultura, Empresa, Fazenda, Talhão e Operação. Sem filtro de
 * Ano Agrícola: o tempo anda pelas setas do calendário. Abre no dia de hoje. A legenda filtra os grupos de operação
 * e o filtro Operação levam o calendário para a primeira operação escolhida; voltar a todas não muda o tempo (só o Hoje vai para hoje).
 * As datas e o desenho da grade vêm do Calendário do plano (js/telas/05-calendario.js).
 * Por enquanto só migrado; o refinamento para a programação das OS vem depois.
 */
window.Telas = window.Telas || {};

window.Telas.osCalendario = (function () {
  const esc = Util.escapar;
  const Cal = () => Telas.calendario;
  // Grupos de operação pelo tipo (os nomes de cada plano podem mudar; a cor segue o tipo), nesta ordem na legenda
  // (03/11/2026: Corretivos, do tipo Aplicação de insumos, primeiro)
  const ORDEM_TIPO = ['aplicacao-de-insumos', 'sementes', 'fertilidade', 'defensivos', 'colheita'];
  const FILTROS = [
    ['safra', 'Safra', ['Todas', 'Nenhuma', 'selecionadas']],
    ['cultura', 'Cultura', ['Todas', 'Nenhuma', 'culturas']],
    ['empresa', 'Empresa', ['Todas', 'Nenhuma', 'empresas']],
    ['fazenda', 'Fazenda', ['Todas', 'Nenhuma', 'fazendas']],
    ['talhao', 'Talhão', ['Todos', 'Nenhum', 'talhões']],
    ['operacao', 'Operação', ['Todas', 'Nenhuma', 'operações']]
  ];

  // Estado da tela: período, dia aberto e filtros ('todos' ou a lista do que está marcado). Mantém-se ao navegar.
  // Abre no Mês de hoje (03/11/2026; antes no Ano)
  const novoEstado = () => ({ escala: 'mes', anoAgricola: anoInicial(), dataRef: Cal().hojeIso(), safra: 'todos', empresa: 'todos', fazenda: 'todos',
    cultura: 'todos', operacao: 'todos', talhao: 'todos', grupo: 'todos' });
  let est = null;

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
    // Mês, Semana e Dia: Safra → Empresa → Fazenda; a Empresa só com as que têm a safra escolhida e a Fazenda só com
    // as das empresas marcadas e da safra, em ordem alfabética
    if (unicoAtivo() && (chave === 'empresa' || chave === 'fazenda')) {
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

  // Mês, Semana e Dia (05/11/2026): uma Safra por vez (a escolhida; sem escolha, a safra atual ou, sem ela, a mais
  // recente); Empresa, Fazenda, Cultura, Talhão e Operação com várias. Empresa e Fazenda dependem da safra: se nenhuma
  // marcada existe com ela (ex.: trocou a safra), voltam a Todas. O Ano fica com várias escolhas em todos.
  const UNICOS = ['safra'];
  // Todos os filtros da página (os da barra e os grupos da legenda): o Ano abre com todos em Todas
  const FILTROS_TODOS = ['safra', 'cultura', 'empresa', 'fazenda', 'talhao', 'operacao', 'grupo'];
  const unicoAtivo = () => est.escala !== 'ano';
  function ajustarUnicos() {
    if (!unicoAtivo()) return;
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
    planosFiltrados().forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const talhao = est.talhao === 'todos' ? 'todos'
        : est.talhao.filter((x) => x.startsWith(`${p.fazenda}|`)).map((x) => x.slice(p.fazenda.length + 1));
      const ctx = { plano: { grupos: Versoes.grupos(p, v) }, talhoes: Util.talhoesPlano(p, v), estado: { talhao } };
      const lista = Cal().itens(ctx).filter((it) => (it.colheita ? !it.aguardando : it.talhoes.length > 0));
      const local = `${p.fazenda} · ${p.safra}`;
      lista.forEach((it) => itens.push({ it, local }));
      const visiveis = lista.filter(visivel);
      const ano = String(Util.anoAgricola(p.safra));
      Cal().eventos(ctx, visiveis).forEach((ev) => eventos.push({ ...ev, local, ano, fazenda: p.fazenda,
        chave: `${p.id}:${ev.it.colheita ? 'colheita' : ev.it.op.id}` }));
    });
    eventos.sort((a, b) => a.inicio.localeCompare(b.inicio));
    const semData = itens.filter(({ it }) => visivel(it) && !eventos.some((ev) => ev.it === it)).length;
    return { itens, eventos, semData };
  }

  // Grupos da legenda: os tipos que têm operação, na ordem Corretivos, Plantio, Fertilidade, Defensivo, Colheita (outros no fim)
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
          ${Cal().filtroCaixa(est, chave, opcoes(chave), textos, rotulo, { unico: unicoAtivo() && UNICOS.includes(chave) })}
        </div>`).join('')}
      <div class="bf__acoes bf__acoes--texto">
        <!-- Limpar filtros padronizado (04/11/2026): contorno cinza, texto e ícone pretos, sempre com o nome -->
        <button class="botao botao--secundario bf__botao bf__limpar bf__limpar--so" type="button" data-acao="os-limpar"
                title="Limpar filtros" aria-label="Limpar filtros">${Icones.limpar}<span class="bf__texto">Limpar filtros</span></button>
      </div>`;
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

  // Mês e Semana por talhão. Barras: cada operação de um talhão ocupa as colunas inteiras (semanas no Mês, dias na
  // Semana) do início ao fim da previsão de conclusão; colunas seguidas viram uma barra só (como um evento de vários
  // dias no Google Agenda). Duas barras na mesma coluna do mesmo talhão ficam uma embaixo da outra (a linha cresce).
  // Dia (05/11/2026, imagem da usuária): a mesma tabela, com uma coluna só, a do dia; a tabela fica estreita.
  function mesPorTalhao(evs, de, ate, escala = 'mes') {
    const naSemana = escala === 'semana' || escala === 'dia';
    const noDia = escala === 'dia';
    const semanas = noDia ? diasDaSemana(de, 1) : naSemana ? diasDaSemana(de) : Cal().semanasDoMes(de, ate);
    const linhas = talhoesDoMes();
    if (!linhas.length) return '<p class="cal-painel__vazio">Nenhum talhão nos planos publicados com esses filtros.</p>';
    const hoje = Cal().hojeIso();
    const semanaDe = (iso) => semanas.findIndex((s) => s.de <= iso && iso <= s.ate);
    // Por talhão: as operações (chave do plano + operação) com as semanas ocupadas e os períodos
    const ops = new Map(linhas.map((l) => [l.chave, new Map()]));
    evs.forEach((ev) => {
      if (ev.fim < de || ev.inicio > ate) return;
      const a = semanaDe(ev.inicio < de ? de : ev.inicio);
      const b = semanaDe(ev.fim > ate ? ate : ev.fim);
      ev.talhoes.forEach((t) => {
        const doTalhao = ops.get(`${ev.fazenda}|${t}`);
        if (!doTalhao) return;
        if (!doTalhao.has(ev.chave)) doTalhao.set(ev.chave, { ev, semanas: new Set(), periodos: [] });
        const o = doTalhao.get(ev.chave);
        for (let i = a; i <= b; i++) o.semanas.add(i);
        o.periodos.push({ inicio: ev.inicio, fim: ev.fim, a, b });
      });
    });
    const barrasDe = (chave) => {
      const barras = [];
      ops.get(chave).forEach((o) => {
        const lista = [...o.semanas].sort((x, y) => x - y);
        lista.forEach((i, k) => {
          if (k > 0 && lista[k - 1] === i - 1) barras[barras.length - 1].b = i;
          else barras.push({ ev: o.ev, periodos: o.periodos, a: i, b: i });
        });
      });
      barras.sort((x, y) => x.a - y.a || y.b - x.b || x.ev.inicio.localeCompare(y.ev.inicio));
      // Uma faixa por barra que se sobrepõe a outra
      const fimFaixa = [];
      barras.forEach((br) => {
        let f = fimFaixa.findIndex((fim) => fim < br.a);
        if (f < 0) { f = fimFaixa.length; fimFaixa.push(br.b); } else fimFaixa[f] = br.b;
        br.faixa = f;
      });
      return { barras, faixas: Math.max(1, fimFaixa.length) };
    };
    const dica = (l, br) => {
      const ps = br.periodos.filter((p) => p.b >= br.a && p.a <= br.b);
      const inicio = ps.map((p) => p.inicio).sort()[0];
      const fim = ps.map((p) => p.fim).sort().pop();
      return `${br.ev.nome} · ${br.ev.local} · ${Cal().faixaDias({ inicio, fim })} · ${l.nome} · ${Util.area(l.area)}`;
    };
    let linha = 2; // a 1ª linha da grade é o cabeçalho
    const corpoLinhas = linhas.map((l) => {
      const { barras, faixas } = barrasDe(l.chave);
      const r = linha;
      linha += faixas;
      const area = `grid-row: ${r} / span ${faixas}`;
      return `
        <div class="cal-tal__info" style="${area}; grid-column: 1"><strong class="cal-tal__talhao">${esc(l.nome)}</strong>
          <span class="cal-tal__fazenda">${esc(l.fazenda)}</span><span class="cal-tal__var">${esc(l.variedades.join(', ') || '—')}</span></div>
        ${semanas.map((s, i) => `<div class="cal-tal__cel ${s.ate < hoje ? 'cal-tal--passado' : ''}" style="${area}; grid-column: ${i + 2}"></div>`).join('')}
        ${barras.map((br) => `
          <span class="cal-tal__barra cal-ponto--${br.ev.tipo} ${semanas[br.b].ate < hoje ? 'cal-tal--passado' : ''}"
                style="grid-row: ${r + br.faixa}; grid-column: ${br.a + 2} / ${br.b + 3}" title="${esc(dica(l, br))}">
            <span class="cal-ponto cal-ponto--${br.ev.tipo}"></span><span class="cal-tal__nome">${esc(br.ev.nome)}</span></span>`).join('')}`;
    }).join('');
    return `
      <div class="cal-mestab">
        <div class="cal-tal ${noDia ? 'cal-tal--dia' : ''}" style="--semanas: ${semanas.length}">
          <div class="cal-tal__cab cal-tal__cab--info" style="grid-column: 1">Talhão</div>
          ${semanas.map((s, i) => `<div class="cal-tal__cab ${s.ate < hoje ? 'cal-tal--passado' : ''}" style="grid-column: ${i + 2}">
            ${noDia ? `
            <span class="cal-mestab__semana cal-tal__dia cal-tal__dia--fixo"><span class="cal-tal__dia-sem">${s.dia}</span><span class="cal-mestab__rotulo ${s.de === hoje ? 'cal-mestab__rotulo--atual' : ''}">${s.data}</span></span>` : naSemana ? `
            <button class="cal-mestab__semana cal-tal__dia" type="button" data-acao="os-dia" data-dia="${s.de}"
                    title="Ver o dia ${s.data}${s.de === hoje ? ' (hoje)' : ''}"><span class="cal-tal__dia-sem">${s.dia}</span><span class="cal-mestab__rotulo ${s.de === hoje ? 'cal-mestab__rotulo--atual' : ''}">${s.data}</span></button>` : `
            <button class="cal-mestab__semana" type="button" data-acao="cal-semana" data-dia="${s.de}"
                    title="Ver a semana de ${s.rotulo}${s.de <= hoje && hoje <= s.ate ? ' (semana atual)' : ''}"><span class="cal-mestab__rotulo ${s.de <= hoje && hoje <= s.ate ? 'cal-mestab__rotulo--atual' : ''}">${s.rotulo}</span></button>`}</div>`).join('')}
          ${corpoLinhas}
        </div>
      </div>`;
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
      ${itens.length ? Cal().calendarioMes({ est, todos: eventos, semData, corpoMes: mesPorTalhao })
        : `<p class="cag__vazio">${planosFiltrados().length ? 'Nenhuma operação planejada nos planos publicados com esses filtros.' : 'Nenhum plano publicado com esses filtros.'}</p>`}`;
  }

  // Operação aberta pela barra do Ano: os filtros de antes do clique ficam guardados em est.daBarra. Hoje volta a
  // eles; mexer num filtro, Limpar filtros ou voltar ao Ano esquece o que foi guardado.
  function voltarDaBarra() {
    if (!est.daBarra) return;
    Object.assign(est, est.daBarra);
    est.daBarra = null;
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
      caixaFiltros.innerHTML = filtros();
      caixa.innerHTML = corpo();
      if (foco) raiz.querySelector(foco)?.focus();
    };
    const ctx = { estado: est };
    const acoes = { redesenhar };

    raiz.addEventListener('click', (e) => {
      if (e.target.closest('[data-acao="os-limpar"]')) {
        est = Object.assign(novoEstado(), { escala: est.escala, dataRef: est.dataRef, anoAgricola: est.anoAgricola });
        est.daBarra = null;
        ctx.estado = est;
        redesenhar('[data-acao="os-limpar"]');
        return;
      }
      const leg = e.target.closest('[data-acao="os-leg"], [data-acao="os-leg-todos"]');
      if (leg) {
        const v = leg.dataset.grupo;
        const soEle = Array.isArray(est.grupo) && est.grupo.length === 1 && est.grupo[0] === v;
        if (leg.dataset.acao === 'os-leg-todos') voltarDaBarra();
        est.grupo = leg.dataset.acao === 'os-leg-todos' || soEle ? 'todos' : [v];
        // No Ano, o ano agrícola fica; no Mês, na Semana e no Dia, um grupo leva à primeira operação dele. Voltar a
        // todos (Mostrar todos ou o grupo à mostra) não muda o tempo: só o botão Hoje vai para hoje
        if (est.escala !== 'ano' && est.grupo !== 'todos') {
          const primeira = calcular().eventos[0];
          if (primeira) est.dataRef = primeira.inicio;
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
      // Barra do Ano: abre o Mês no começo da operação clicada, nos filtros da linha (empresa, fazenda, safra) e na
      // cultura da barra; a operação não vira filtro
      const barra = e.target.closest('[data-cag-op]');
      if (barra) {
        const d = barra.dataset;
        est.daBarra = { operacao: est.operacao, cultura: est.cultura, empresa: est.empresa, fazenda: est.fazenda, safra: est.safra };
        est.cultura = [d.cagCultura];
        est.empresa = [d.cagEmpresa];
        if (d.cagFazenda) est.fazenda = [d.cagFazenda];
        if (d.cagSafra) est.safra = [d.cagSafra];
        est.dataRef = d.cagOp;
        est.escala = 'mes'; est.diaAberto = null; est.filtrosMes = null;
        redesenhar('[data-campo="cal-escala"]');
        return;
      }
      if (Telas.calendarioAgricola.aoClicar(e, redesenhar)) return;
      // Semana: clicar no título de um dia abre o Dia
      const dia = e.target.closest('[data-acao="os-dia"]');
      if (dia) { est.escala = 'dia'; est.dataRef = dia.dataset.dia; est.diaAberto = null; redesenhar('[data-campo="cal-escala"]'); return; }
      // Hoje, depois de abrir uma operação pela barra do Ano: volta a todas as operações (o Calendário vai para hoje)
      if (e.target.closest('[data-acao="cal-hoje"]')) voltarDaBarra();
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
        est.daBarra = null;
        // Operação, como a legenda: com escolha, vai para a operação mais cedo; com todas, o tempo fica
        if (chave === 'operacao' && est.escala !== 'ano' && est.operacao !== 'todos') {
          const primeira = calcular().eventos[0];
          if (primeira) est.dataRef = primeira.inicio;
          est.diaAberto = null;
        }
        est.filtroAberto = chave;
        redesenhar(`[data-campo="cal-filtro"][data-filtro="${chave}"][value="${CSS.escape(e.target.value)}"]`);
        return;
      }
      // Escala (05/11/2026): o Ano abre no ano agrícola atual (o de hoje ou, sem planos nele, o mais recente) com todos os
      // filtros em Todas (safras e safrinhas, culturas, empresas, fazendas, talhões, operações e grupos). Do Ano para
      // Mês, Semana ou Dia, o dia mostrado antes, se estiver no ano agrícola; senão, hoje (no ano de hoje) ou o começo
      // do ano agrícola
      if (e.target.dataset.campo === 'cal-escala' && (e.target.value === 'ano' || est.escala === 'ano')) {
        if (e.target.value === 'ano') {
          est.anoAgricola = anoInicial();
          // A escolha do Mês fica guardada para a volta
          est.filtrosMes = Object.fromEntries(FILTROS_TODOS.map((c) => [c, est[c]]));
          FILTROS_TODOS.forEach((c) => { est[c] = 'todos'; });
          // O ano agrícola inteiro, no nível Empresa (como ao abrir)
          Telas.calendarioAgricola.recolherTudo();
        } else {
          // Do Ano para Mês, Semana ou Dia: voltam os filtros escolhidos antes no Mês, se os do Ano não foram mexidos
          // (mexidos, valem os do Ano, com a primeira marcada de Safra, Empresa e Fazenda)
          if (est.filtrosMes && FILTROS_TODOS.every((c) => est[c] === 'todos')) Object.assign(est, est.filtrosMes);
          est.filtrosMes = null;
          if (anoDe(est.dataRef) !== est.anoAgricola) {
            est.dataRef = anoDe(Cal().hojeIso()) === est.anoAgricola ? Cal().hojeIso() : `${est.anoAgricola}-09-01`;
          }
        }
        est.escala = e.target.value; est.diaAberto = null;
        if (e.target.value === 'ano') est.daBarra = null;
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
