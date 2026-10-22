/*
 * Tela 09 — Central de Operações (docs/telas/09-central-operacoes-corp.md), segunda aba de Operações Agrícolas.
 * Mesmo cabeçalho, filtros e layout de Minhas tarefas (Tela 08, js/telas/central-operacoes.js). Visão geral (cartões), gráficos Status da OS e Nº OS por Empresa/Fazenda/Executor
 * e a tabela Ordens de Serviço, com Notificar selecionadas (pede justificativa, que aparece em Minhas tarefas) e Exportar CSV.
 * OS de exemplo: as escritas em DADOS.ordensServico e, para as demais operações planejadas até DADOS.osFechadasAte,
 * OS fechadas geradas por uma regra fixa (sem sorteio).
 */
window.Telas = window.Telas || {};

window.Telas.centralCorp = (function () {
  const B = () => Telas.centralOperacoes.base;
  const esc = Util.escapar;

  // ----- Status da OS (nesta ordem no gráfico) -----
  const STATUS = [
    ['planejada', 'Planejada'], ['recomendada', 'Recomendada'], ['execucao', 'Em execução'], ['fechada', 'Fechada']
  ];
  // Planejada não se divide (o planejamento é automático); passou da data sem recomendação, conta como
  // Sem recomendação (a Recomendada com atraso)
  const NOMES_RECOMENDADA = { 'recomendada-prazo': 'Com recomendação', 'recomendada-atraso': 'Sem recomendação' };
  const STATUS_TODOS = STATUS.flatMap(([id, nome]) => (id === 'planejada' ? [[id, nome]]
    : [[`${id}-atraso`, `${nome} · Em atraso`], [`${id}-prazo`, `${nome} · No prazo`]]))
    .map(([id, nome]) => [id, NOMES_RECOMENDADA[id] || nome]);
  const nomeStatus = (k) => STATUS_TODOS.find(([id]) => id === k)[1];
  const NIVEIS = [['empresa', 'Empresa'], ['fazenda', 'Fazenda'], ['executor', 'Executor']];
  const ACOES = [['pendente', 'Pendente de notificação'], ['enviada', 'Notificação enviada']];

  // Número fixo a partir de um texto (executor e atraso das OS geradas, sem sorteio)
  function numeroDe(texto) {
    let h = 0;
    for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h;
  }

  // ----- Registros: uma linha por talhão × operação, com a OS dela (escrita, gerada) ou ainda planejada -----
  function registros(safra) {
    const { linhasOperacoes, ordens, somaDias, diasEntre, hoje } = B();
    const h = hoje();
    const escritas = ordens(safra);
    const ops = linhasOperacoes(safra).sort((a, b) => a.data.localeCompare(b.data) || a.plano.fazenda.localeCompare(b.plano.fazenda)
      || a.talhao.localeCompare(b.talhao, 'pt-BR', { numeric: true }) || a.operacao.localeCompare(b.operacao));
    const codigo = (DADOS.cadastroSafras.find((s) => s.nome === safra) || { codigo: 0 }).codigo;
    let seq = 0;
    const saida = [];
    ops.forEach((l) => {
      const chave = `${l.plano.fazenda}|${l.plano.safra}|${l.operacao}|${l.talhao}`;
      const os = escritas.find((o) => o.fazenda === l.plano.fazenda && o.operacao === l.operacao && o.talhoes.includes(l.talhao));
      // O número da OS gerada vem da posição da operação entre as feitas até osFechadasAte (não muda depois de notificar)
      const feita = l.data <= (DADOS.osFechadasAte || '');
      if (feita) seq += 1;
      let r;
      if (os) {
        // OS escrita nos dados de exemplo (recomendada que já chegou na data de abertura: em execução, automático)
        const status = os.status === 'recomendada' && os.abertura <= h ? 'execucao' : os.status;
        r = { numero: os.numero, os, status, executor: os.executor || '—', abertura: os.abertura, conclusao: os.conclusao,
          fechamento: os.fechamento || null, justificativa: os.justificativa };
      } else if (feita) {
        // OS gerada: fechada; uma em cada cinco fechou com atraso (1 a 4 dias depois da conclusão prevista)
        const n = numeroDe(chave);
        const conclusao = somaDias(l.data, l.prazo || 1);
        r = { numero: Number(`${codigo}${String(seq).padStart(3, '0')}`), gerada: true, status: 'fechada',
          executor: DADOS.executores[n % DADOS.executores.length], abertura: l.data, conclusao,
          fechamento: n % 5 === 0 ? somaDias(conclusao, 1 + (n % 4)) : somaDias(conclusao, -(n % 2)), justificativa: null };
      } else {
        // Ainda sem OS: planejada; com a data vencida, Sem recomendação (a justificativa, se o gestor pediu, fica em DADOS.justificativasOperacoes)
        const j = (DADOS.justificativasOperacoes || []).find((x) => x.fazenda === l.plano.fazenda && x.safra === l.plano.safra
          && x.operacao === l.operacao && x.talhao === l.talhao);
        r = { numero: null, status: 'planejada', executor: '—', abertura: null, conclusao: null, fechamento: null,
          justificativa: j ? j.justificativa : null };
      }
      // Dias de atraso de cada status
      const atraso = r.status === 'planejada' ? Math.max(0, diasEntre(l.data, h))
        : r.status === 'recomendada' ? Math.max(0, diasEntre(l.data, r.abertura))
          : r.status === 'execucao' ? Math.max(0, diasEntre(r.conclusao, h))
            : Math.max(0, diasEntre(r.conclusao, r.fechamento || r.conclusao));
      const situacao = r.status === 'planejada' ? (atraso > 0 ? 'recomendada-atraso' : 'planejada')
        : `${r.status}-${atraso > 0 ? 'atraso' : 'prazo'}`;
      saida.push({ ...l, ...r, chave, atraso, situacao,
        referencia: r.abertura || l.data,
        acao: r.justificativa ? 'enviada' : atraso > 0 ? 'pendente' : null });
    });
    return saida;
  }

  // ----- Estado (mantém-se ao navegar) -----
  let est = null;
  function novoEstado() {
    const { safraInicial, primeiraData, somaDias, hoje } = B();
    const safra = safraInicial();
    return { safra, cultura: '', empresa: '', fazenda: '', grupo: '', de: primeiraData(safra), ate: somaDias(hoje(), 30),
      status: null, nivel: 'empresa', barra: null, busca: '', statusOS: '', acao: '',
      ordem: { coluna: 'atraso', sentido: 'desc' }, selecao: new Set() };
  }

  // Registros dos filtros do topo (e do período, pela data de abertura; nas planejadas, a data planejada)
  function filtrados(todos) {
    return todos.filter((r) => (!est.cultura || r.plano.cultura === est.cultura) && (!est.empresa || r.plano.empresa === est.empresa)
      && (!est.fazenda || r.plano.fazenda === est.fazenda) && (!est.grupo || r.grupo === est.grupo)
      && (!est.de || r.referencia >= est.de) && (!est.ate || r.referencia <= est.ate));
  }
  const valorNivel = (r, nivel) => (nivel === 'empresa' ? r.plano.empresa : nivel === 'fazenda' ? r.plano.fazenda : r.executor);
  // Contagem: OS distintas (pelo número); operação ainda sem OS conta uma por talhão
  const contar = (rs) => new Set(rs.map((r) => (r.numero ? `os:${r.numero}` : `op:${r.chave}`))).size;

  // ----- Desenho -----
  function desenhar() {
    est = est || novoEstado();
    return `
      ${Telas.centralOperacoes.cabecalho('central')}
      <div class="pagina oc cc">
        <section class="cartao oc-filtros" aria-label="Filtrar ordens de serviço" data-cc-filtros></section>
        <section class="oc-resumo" aria-labelledby="cc-visao-titulo">
          <h2 class="oc-resumo__titulo" id="cc-visao-titulo">Visão geral</h2>
          <div class="cc-cartoes" data-cc-cartoes></div>
        </section>
        <div class="cc-graficos" data-cc-graficos></div>
        <section class="cartao oc-lista" aria-labelledby="cc-tabela-titulo" data-cc-tabela></section>
      </div>`;
  }

  function filtros() {
    const { publicados, safras, opcoesSelect, gruposDaSafra } = B();
    const daSafra = publicados().filter((p) => p.safra === est.safra);
    const presentes = (chave, ordem) => ordem.filter((x) => daSafra.some((p) => p[chave] === x)).map((x) => [x, x]);
    const fazendas = DADOS.fazendas.filter((f) => !est.empresa || (DADOS.fazendasPorEmpresa[est.empresa] || []).includes(f));
    return `
      <div class="filtros oc-filtros__campos">
        ${opcoesSelect('safra', 'Safra', safras().map((s) => [s.nome, s.nome]), '', est.safra)}
        ${opcoesSelect('cultura', 'Cultura', presentes('cultura', DADOS.culturasPlanos), 'Todas', est.cultura)}
        ${opcoesSelect('empresa', 'Empresa', presentes('empresa', DADOS.empresas), 'Todas', est.empresa)}
        ${opcoesSelect('fazenda', 'Fazenda', presentes('fazenda', fazendas), 'Todas', est.fazenda)}
        ${opcoesSelect('grupo', 'Grupo de operação', gruposDaSafra(daSafra), 'Todos', est.grupo)}
        <div class="campo">
          <label class="campo__rotulo" for="oc-de">Data inicial</label>
          <input class="campo__controle" type="date" id="oc-de" data-cc-data="de" value="${est.de || ''}">
        </div>
        <div class="campo">
          <label class="campo__rotulo" for="oc-ate">Data final</label>
          <input class="campo__controle" type="date" id="oc-ate" data-cc-data="ate" value="${est.ate || ''}">
        </div>
        <button class="botao botao--secundario oc-limpar" type="button" data-cc-limpar>${Icones.limpar} Limpar filtros</button>
      </div>
      <p class="oc-filtros__periodo">${Icones.info} O período considera a data de abertura das OS e, nas operações ainda planejadas, a data planejada.</p>`;
  }

  function cartoes(rs) {
    const os = rs.filter((r) => r.numero);
    const total = contar(os);
    const fechadas = contar(os.filter((r) => r.status === 'fechada'));
    const emExec = os.filter((r) => r.status === 'execucao');
    const nExec = contar(emExec);
    // Atraso entre as OS em execução: uma vez por OS (a maior entre os talhões dela)
    const porOS = new Map();
    emExec.forEach((r) => porOS.set(r.numero, Math.max(porOS.get(r.numero) || 0, r.atraso)));
    const atrasos = [...porOS.values()];
    const media = atrasos.length ? atrasos.reduce((s, x) => s + x, 0) / atrasos.length : 0;
    const maior = atrasos.length ? Math.max(...atrasos) : 0;
    const pct = (n) => (total ? `${Math.round((n / total) * 100)}% do total de OS` : '—');
    const dias = (n) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${n === 1 ? 'dia' : 'dias'}`;
    const cartao = (icone, titulo, numero, sub) => `
      <div class="oc-cartao cc-cartao">
        <span class="oc-cartao__icone" aria-hidden="true">${icone}</span>
        <span class="oc-cartao__texto">
          <span class="oc-cartao__titulo">${titulo}</span>
          <span class="oc-cartao__numero cc-cartao__numero">${numero}</span>
          ${sub ? `<span class="oc-cartao__sub">${sub}</span>` : ''}
        </span>
      </div>`;
    return cartao(Icones.documento, 'Total de OS', total.toLocaleString('pt-BR'), 'Recomendadas, em execução e fechadas')
      + cartao(Icones.certo, 'Fechadas', fechadas.toLocaleString('pt-BR'), pct(fechadas))
      + cartao(Icones.documento, 'Em execução', nExec.toLocaleString('pt-BR'), pct(nExec))
      + cartao(Icones.relogio, 'Atraso médio', dias(Math.round(media * 10) / 10), 'Entre as OS em execução')
      + cartao(Icones.relogio, 'Maior atraso', dias(maior), 'Entre as OS em execução');
  }

  // Gráfico de barras verticais (uma série, verde): eixo com 4 linhas de grade, valor em cima, barra selecionável
  function barras(itens, selecionado, atributo, rotuloAria) {
    const max = Math.max(1, ...itens.map((i) => i.valor));
    // Escala redonda: 4 linhas de grade com passo 1, 2, 5, 10, 20, 25, 50…
    const passo = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find((p) => p * 4 >= max) || Math.ceil(max / 4);
    const topo = passo * 4;
    const linhas = [4, 3, 2, 1, 0].map((k) => `<span class="cc-grafico__linha" style="bottom: ${(k / 4) * 100}%"><span>${(k * passo).toLocaleString('pt-BR')}</span></span>`).join('');
    return `
      <div class="cc-grafico" role="group" aria-label="${rotuloAria}">
        <div class="cc-grafico__area">
          ${linhas}
          <div class="cc-grafico__barras" style="--n: ${itens.length}">
            ${itens.map((i) => `
              <button class="cc-barra ${selecionado ? (selecionado === i.id ? 'cc-barra--ativa' : 'cc-barra--apagada') : ''}" type="button"
                      ${atributo}="${esc(i.id)}" aria-pressed="${selecionado === i.id}"
                      title="${esc(i.nome)}: ${i.valor.toLocaleString('pt-BR')}">
                <span class="cc-barra__coluna" style="height: ${(i.valor / topo) * 100}%"><span class="cc-barra__valor">${i.valor.toLocaleString('pt-BR')}</span></span>
              </button>`).join('')}
          </div>
        </div>
        <div class="cc-grafico__rotulos" style="--n: ${itens.length}">${itens.map((i) => `<span>${esc(i.rotulo ?? i.nome)}</span>`).join('')}</div>
        ${itens.some((i) => i.grupo) ? `<div class="cc-grafico__grupos" style="--n: ${itens.length}">${gruposDoEixo(itens)}</div>` : ''}
      </div>`;
  }

  // Eixo em dois níveis: embaixo da barra, a parte curta (Com, No prazo…); na linha de baixo, o grupo
  // (Recomendação, Em execução, Fechada) ocupando as barras dele. Planejada (solto) fica sem traço, na altura dele
  function gruposDoEixo(itens) {
    const blocos = [];
    itens.forEach((i) => {
      const ultimo = blocos[blocos.length - 1];
      if (i.grupo && ultimo && ultimo.grupo === i.grupo) ultimo.n += 1;
      else blocos.push({ grupo: i.grupo, solto: i.solto, n: 1 });
    });
    return blocos.map((b) => `<span class="${b.grupo ? `cc-grafico__grupo${b.solto ? ' cc-grafico__grupo--solto' : ''}` : ''}" style="grid-column: span ${b.n}">${esc(b.grupo || '')}</span>`).join('');
  }

  // Nome do status em duas partes para o eixo: Com recomendação → Com | Recomendação; Em execução · No prazo → No prazo | Em execução
  function partesDoEixo(id, nome) {
    if (id === 'planejada') return { rotulo: '', grupo: nome, solto: true };
    if (id.startsWith('recomendada')) return { rotulo: nome.split(' ')[0], grupo: 'Recomendação' };
    const [grupo, rotulo] = nome.split(' · ');
    return { rotulo, grupo };
  }

  function graficos(rs) {
    const status = STATUS_TODOS.map(([id, nome]) => ({ id, nome, ...partesDoEixo(id, nome),
      valor: contar(rs.filter((r) => r.situacao === id)) }));
    const doStatus = est.status ? rs.filter((r) => r.situacao === est.status) : rs;
    const grupos = new Map();
    doStatus.forEach((r) => { const v = valorNivel(r, est.nivel); if (!grupos.has(v)) grupos.set(v, []); grupos.get(v).push(r); });
    const porNivel = [...grupos.entries()].map(([v, lista]) => ({ id: v, nome: v, valor: contar(lista) }))
      .sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome, 'pt-BR'));
    const nivelNome = NIVEIS.find(([id]) => id === est.nivel)[1];
    return `
      <section class="cartao cc-painel" aria-labelledby="cc-status-titulo">
        <h2 class="cc-painel__titulo" id="cc-status-titulo">Status da OS</h2>
        ${barras(status, est.status, 'data-cc-status', 'Número de OS por status')}
        <p class="cc-painel__nota">Selecione um status para atualizar o gráfico analítico e a tabela.</p>
      </section>
      <section class="cartao cc-painel" aria-labelledby="cc-nivel-titulo">
        <h2 class="cc-painel__titulo" id="cc-nivel-titulo">Nº OS por ${nivelNome} | ${est.status ? esc(nomeStatus(est.status)) : 'Total'}</h2>
        <div class="cc-painel__controles">
          <div><span class="cc-painel__rotulo">Métrica</span><span class="cc-segmento"><span class="cc-segmento__opcao cc-segmento__opcao--ativa">Nº de OS</span></span></div>
          <div><span class="cc-painel__rotulo">Nível</span>
            <span class="cc-segmento" role="group" aria-label="Nível">
              ${NIVEIS.map(([id, nome]) => `<button class="cc-segmento__opcao ${id === est.nivel ? 'cc-segmento__opcao--ativa' : ''}" type="button" data-cc-nivel="${id}" aria-pressed="${id === est.nivel}">${nome}</button>`).join('')}
            </span>
          </div>
        </div>
        ${porNivel.length ? barras(porNivel, est.barra, 'data-cc-barra', `Número de OS por ${nivelNome.toLowerCase()}`) : '<p class="cc-painel__vazio">Nenhuma OS com esses filtros.</p>'}
        <p class="cc-painel__nota">Selecione uma barra para filtrar a tabela; selecione-a novamente para remover o filtro.</p>
      </section>`;
  }

  // ----- Tabela Ordens de Serviço -----
  const dataBR = (iso) => (iso ? Util.data(iso) : '—');
  const COL = [
    ['numero', 'Nº OS', (r) => r.numero, true, (r) => r.numero ?? '—'],
    ['safra', 'Safra', (r) => r.plano.safra],
    ['empresa', 'Empresa', (r) => r.plano.empresa],
    ['fazenda', 'Fazenda', (r) => r.plano.fazenda],
    ['talhao', 'Talhão', (r) => r.talhao],
    ['cultura', 'Cultura', (r) => r.plano.cultura],
    ['grupo', 'Grupo de operação', (r) => r.grupo],
    ['operacao', 'Operação', (r) => r.operacao],
    ['executor', 'Executor', (r) => (r.executor === '—' ? null : r.executor), false, (r) => r.executor],
    ['abertura', 'Data de abertura', (r) => r.abertura, false, (r) => dataBR(r.abertura)],
    ['conclusao', 'Data de conclusão prevista', (r) => r.conclusao, false, (r) => dataBR(r.conclusao)],
    ['fechamento', 'Data de fechamento', (r) => r.fechamento, false, (r) => dataBR(r.fechamento)],
    ['atraso', 'Dias de atraso', (r) => r.atraso, true],
    ['status', 'Status OS', (r) => STATUS_TODOS.findIndex(([id]) => id === r.situacao), false, (r) => nomeStatus(r.situacao)],
    ['acao', 'Status da ação', (r) => r.acao, false, (r) => (r.acao ? ACOES.find(([id]) => id === r.acao)[1] : '—')]
  ];
  const QUEBRA = ['grupo'];
  const texto = (c, r) => { const v = c[4] ? c[4](r) : c[2](r); return v === null || v === undefined ? '—' : v; };

  function daTabela(rs) {
    const { comparar } = B();
    const busca = est.busca.trim();
    const ls = rs.filter((r) => (!est.status || r.situacao === est.status) && (!est.barra || valorNivel(r, est.nivel) === est.barra)
      && (!busca || String(r.numero || '').includes(busca)) && (!est.statusOS || r.situacao === est.statusOS)
      && (!est.acao || r.acao === est.acao));
    const c = COL.find(([id]) => id === est.ordem.coluna);
    const sinal = est.ordem.sentido === 'asc' ? 1 : -1;
    return ls.sort((a, b) => {
      const va = c[2](a); const vb = c[2](b);
      const vazio = (v) => v === null || v === undefined;
      if (vazio(va) || vazio(vb)) return comparar(va, vb);
      return sinal * comparar(va, vb) || comparar(a.referencia, b.referencia) || comparar(a.talhao, b.talhao);
    });
  }
  const podeNotificar = (r) => r.acao === 'pendente';

  function tabela(rs) {
    const ls = daTabela(rs);
    const marcaveis = ls.filter(podeNotificar);
    const chaves = new Set(marcaveis.map((r) => r.chave));
    [...est.selecao].forEach((k) => { if (!chaves.has(k)) est.selecao.delete(k); });
    const n = est.selecao.size;
    const o = est.ordem;
    return `
      <div class="oc-lista__topo cc-tabela__topo">
        <div>
          <h2 class="oc-lista__titulo" id="cc-tabela-titulo">Ordens de Serviço</h2>
          <p class="cc-tabela__sub">${est.status ? esc(nomeStatus(est.status)) : 'Todas as Ordens de Serviço'}${est.barra ? ` · ${esc(est.barra)}` : ''}</p>
        </div>
        <div class="oc-lista__acoes">
          <button class="botao botao--secundario" type="button" data-cc-notificar ${n ? '' : 'disabled'}
                  title="${n ? 'Pedir a justificativa das OS marcadas' : 'Marque OS com atraso pendentes de notificação'}">Notificar selecionadas (${n})</button>
          <button class="botao botao--secundario" type="button" data-cc-exportar>${Icones.baixar} Exportar CSV</button>
        </div>
      </div>
      <div class="cc-tabela__filtros">
        <input class="campo__controle cc-busca" type="search" placeholder="Buscar por Nº OS" aria-label="Buscar por Nº OS" value="${esc(est.busca)}" data-cc-busca>
        <label class="cc-tabela__filtro">Status OS
          <select class="campo__controle" data-cc-statusos>
            <option value="">Todos</option>
            ${STATUS_TODOS.map(([id, nome]) => `<option value="${id}" ${id === est.statusOS ? 'selected' : ''}>${nome}</option>`).join('')}
          </select></label>
        <label class="cc-tabela__filtro">Status da ação
          <select class="campo__controle" data-cc-acao>
            <option value="">Todos</option>
            ${ACOES.map(([id, nome]) => `<option value="${id}" ${id === est.acao ? 'selected' : ''}>${nome}</option>`).join('')}
          </select></label>
      </div>
      <div class="tabela-rolagem oc-tabela__rolagem">
        <table class="tabela oc-tabela">
          <thead><tr>
            <th class="oc-tabela__marcar"><input type="checkbox" class="oc-caixa" data-cc-marcar-todas aria-label="Marcar todas as OS pendentes de notificação"
              ${marcaveis.length && n === marcaveis.length ? 'checked' : ''} ${marcaveis.length ? '' : 'disabled'}></th>
            ${COL.map(([id, rotulo, , num]) => {
              const ativa = o.coluna === id;
              return `
              <th class="${num ? 'tabela__numero' : ''} ${QUEBRA.includes(id) ? 'oc-tabela__quebra' : ''}" ${ativa ? `aria-sort="${o.sentido === 'asc' ? 'ascending' : 'descending'}"` : ''}>
                <span class="titulo-coluna"><span>${rotulo}</span>
                  <button class="titulo-ordenar ${ativa ? 'titulo-ordenar--ativo' : ''} ${ativa && o.sentido === 'desc' ? 'titulo-ordenar--desc' : ''}" type="button"
                          data-cc-ordenar="${id}" title="Ordenar por ${rotulo.toLowerCase()}"
                          aria-label="Ordenar por ${rotulo.toLowerCase()}">${ativa ? Icones.acima : Icones.ordenar}</button>
                </span>
              </th>`;
            }).join('')}
          </tr></thead>
          <tbody>
            ${ls.length ? ls.map((r) => {
              const pode = podeNotificar(r);
              const marcada = est.selecao.has(r.chave);
              return `
              <tr class="${marcada ? 'oc-tabela__linha--marcada' : ''}">
                <td class="oc-tabela__marcar">${pode ? `<input type="checkbox" class="oc-caixa" data-cc-marcar="${esc(r.chave)}" ${marcada ? 'checked' : ''}
                  aria-label="Marcar ${esc(r.numero ? `OS ${r.numero}` : r.operacao)} · ${esc(r.talhao)}">` : ''}</td>
                ${COL.map((c) => `<td class="${c[3] ? 'tabela__numero' : ''} ${QUEBRA.includes(c[0]) ? 'oc-tabela__quebra' : ''} ${c[0] === 'status' ? `cc-status cc-status--${r.situacao.endsWith('atraso') ? 'atraso' : 'prazo'}` : ''}">${esc(texto(c, r))}</td>`).join('')}
              </tr>`;
            }).join('') : `<tr><td class="tabela__vazia" colspan="${COL.length + 1}">Nenhuma OS com esses filtros.</td></tr>`}
          </tbody>
        </table>
      </div>
      <p class="cc-tabela__rodape">${contar(ls).toLocaleString('pt-BR')} ${contar(ls) === 1 ? 'registro' : 'registros'} · ${ls.length.toLocaleString('pt-BR')} ${ls.length === 1 ? 'linha' : 'linhas'} (uma por talhão)</p>`;
  }

  // Notificar: pede a justificativa das linhas marcadas (Minhas tarefas, Tela 08, Justificativas solicitadas)
  function notificar(rs) {
    const { hoje } = B();
    const marcadas = rs.filter((r) => est.selecao.has(r.chave));
    const pedido = (r) => ({ motivo: r.status === 'planejada' || r.status === 'recomendada' ? 'Atraso na recomendação' : 'Atraso na execução',
      data: hoje(), solicitadaPor: { nome: DADOS.usuario.nome }, respondida: false });
    marcadas.forEach((r) => {
      const original = r.numero && !r.gerada ? DADOS.ordensServico.find((o) => o.numero === r.numero) : null;
      if (original) { original.justificativa = pedido(r); return; }
      if (r.gerada) {
        // OS gerada passa a ser escrita, com a justificativa pedida
        DADOS.ordensServico.push({ numero: r.numero, fazenda: r.plano.fazenda, safra: r.plano.safra, operacao: r.operacao,
          talhoes: [r.talhao], status: r.status, abertura: r.abertura, prazo: B().diasEntre(r.abertura, r.conclusao),
          fechamento: r.fechamento, executor: r.executor, justificativa: pedido(r) });
        return;
      }
      DADOS.justificativasOperacoes.push({ fazenda: r.plano.fazenda, safra: r.plano.safra, operacao: r.operacao, grupo: r.grupo,
        talhao: r.talhao, justificativa: pedido(r) });
    });
    est.selecao.clear();
    return marcadas.length;
  }

  // Exportar CSV: as linhas da tabela (com os filtros), separadas por ponto e vírgula, para abrir no Excel
  function exportar(rs) {
    const ls = daTabela(rs);
    const campo = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const linhas = [COL.map(([, rotulo]) => campo(rotulo)).join(';'), ...ls.map((r) => COL.map((c) => campo(texto(c, r))).join(';'))];
    const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ordens-de-servico-${B().hoje()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function aoMostrar(conteudo) {
    est = est || novoEstado();
    const raiz = conteudo.querySelector('.cc');
    const partes = {
      filtros: raiz.querySelector('[data-cc-filtros]'), cartoes: raiz.querySelector('[data-cc-cartoes]'),
      graficos: raiz.querySelector('[data-cc-graficos]'), tabela: raiz.querySelector('[data-cc-tabela]')
    };
    let rs = [];
    const redesenhar = (foco) => {
      rs = filtrados(registros(est.safra));
      partes.filtros.innerHTML = filtros();
      partes.cartoes.innerHTML = cartoes(rs);
      partes.graficos.innerHTML = graficos(rs);
      partes.tabela.innerHTML = tabela(rs);
      if (foco) raiz.querySelector(foco)?.focus();
    };
    const alternar = (chave, valor) => { est[chave] = est[chave] === valor ? null : valor; };

    raiz.addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('[data-cc-limpar]')) { est = novoEstado(); redesenhar('[data-cc-limpar]'); return; }
      const s = t.closest('[data-cc-status]');
      if (s) { alternar('status', s.dataset.ccStatus); est.barra = null; redesenhar(`[data-cc-status="${s.dataset.ccStatus}"]`); return; }
      const nv = t.closest('[data-cc-nivel]');
      if (nv) { est.nivel = nv.dataset.ccNivel; est.barra = null; redesenhar(`[data-cc-nivel="${est.nivel}"]`); return; }
      const b = t.closest('[data-cc-barra]');
      if (b) { alternar('barra', b.dataset.ccBarra); redesenhar(`[data-cc-barra="${CSS.escape(b.dataset.ccBarra)}"]`); return; }
      const o = t.closest('[data-cc-ordenar]');
      if (o) {
        const coluna = o.dataset.ccOrdenar;
        est.ordem = { coluna, sentido: est.ordem.coluna === coluna && est.ordem.sentido === 'asc' ? 'desc' : 'asc' };
        redesenhar(`[data-cc-ordenar="${coluna}"]`);
        return;
      }
      if (t.closest('[data-cc-notificar]')) {
        const n = notificar(rs);
        redesenhar();
        Aviso.mostrar(`${n === 1 ? 'Justificativa pedida' : `${n} justificativas pedidas`}. Aparecem em Minhas tarefas, em Justificativas solicitadas.`);
        return;
      }
      if (t.closest('[data-cc-exportar]')) exportar(rs);
    });

    raiz.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-cc-marcar]')) {
        if (t.checked) est.selecao.add(t.dataset.ccMarcar); else est.selecao.delete(t.dataset.ccMarcar);
        redesenhar(`[data-cc-marcar="${CSS.escape(t.dataset.ccMarcar)}"]`);
        return;
      }
      if (t.matches('[data-cc-marcar-todas]')) {
        if (t.checked) daTabela(rs).filter(podeNotificar).forEach((r) => est.selecao.add(r.chave)); else est.selecao.clear();
        redesenhar('[data-cc-marcar-todas]');
        return;
      }
      if (t.matches('[data-cc-statusos]')) { est.statusOS = t.value; redesenhar('[data-cc-statusos]'); return; }
      if (t.matches('[data-cc-acao]')) { est.acao = t.value; redesenhar('[data-cc-acao]'); return; }
      const f = t.dataset.ocFiltro;
      if (f) {
        est[f] = t.value;
        if (f === 'empresa' && est.fazenda && !(DADOS.fazendasPorEmpresa[est.empresa] || DADOS.fazendas).includes(est.fazenda)) est.fazenda = '';
        if (f === 'safra') est.de = B().primeiraData(est.safra);
        est.barra = null;
        redesenhar(`[data-oc-filtro="${f}"]`);
        return;
      }
      if (t.dataset.ccData) { est[t.dataset.ccData] = t.value; redesenhar(`[data-cc-data="${t.dataset.ccData}"]`); }
    });
    // Busca por Nº OS: filtra enquanto digita (mantém o cursor no campo)
    raiz.addEventListener('input', (e) => {
      if (!e.target.matches('[data-cc-busca]')) return;
      est.busca = e.target.value;
      partes.tabela.innerHTML = tabela(rs);
      const campo = raiz.querySelector('[data-cc-busca]');
      campo.focus();
      campo.setSelectionRange(campo.value.length, campo.value.length);
    });

    redesenhar();
  }

  return { desenhar, aoMostrar, _registros: registros };
})();
