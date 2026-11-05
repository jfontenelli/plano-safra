/*
 * Gestão da Lavoura › Operações › Desvios de Recomendação (docs/telas/10-aplicacoes.md): os desvios entre o recomendado
 * e o executado, por produto, operação e nível de análise. Desenhada dentro da página Operações
 * (js/telas/monitoramento-aplicacoes.js), que monta o cabeçalho e as guias.
 *
 * Registro: um produto de uma OS fechada (a OS é uma operação num talhão de um plano publicado). A dose e a área
 * executadas são simuladas (DADOS.monitoramento.desviosDose e desviosArea, em sequência); a data de fechamento vem da
 * mesma simulação das Operações. Desvio = aplicado ÷ recomendado − 1 (Dose: a dose; Quantidade: dose × área).
 * Na tela, o registro se chama "OS" (03/11/2026: "% de OS", "Nº de OS", "1–10 de 101 OS").
 */
window.Telas = window.Telas || {};

window.Telas.desviosRecomendacao = (function () {
  const Cal = () => Telas.calendario;
  const MA = () => Telas.monitoramentoAplicacoes;
  const esc = Util.escapar;
  const fmt = (n, casas = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  const pct = (d) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${fmt(Math.abs(d * 100), 1)}%`;
  const POR_PAGINA = [10, 25, 50];
  // Filtros (04/11/2026, barra padronizada: js/barra-filtros.js): à mostra, Safra, Cultura, Empresa, Fazenda, Talhão,
  // Grupo de operação e Operação; no Mais filtros, Ano agrícola, Atividade produtiva e Executor (e os que não couberem na
  // linha). Sem as datas de fechamento (saíram em 04/11/2026: valem todas as OS fechadas). Os filtros-base acompanham
  // entre as páginas. Dependentes: Ano e Atividade › Safra e Cultura; Empresa › Fazenda › Talhão; Grupo › Operação
  const FILTROS = [
    ['safra', 'Safra', ['Todas', 'Nenhuma', 'selecionadas'], 92],
    ['cultura', 'Cultura', ['Todas', 'Nenhuma', 'culturas'], 104],
    ['empresa', 'Empresa', ['Todas', 'Nenhuma', 'empresas'], 124],
    ['fazenda', 'Fazenda', ['Todas', 'Nenhuma', 'fazendas'], 124],
    ['talhao', 'Talhão', ['Todos', 'Nenhum', 'talhões'], 104],
    ['grupo', 'Grupo de operação', ['Todos', 'Nenhum', 'grupos'], 136],
    ['operacao', 'Operação', ['Todas', 'Nenhuma', 'operações'], 124]
  ];
  const MAIS_FILTROS = [
    ['ano', 'Ano agrícola', ['Todos', 'Nenhum', 'anos']],
    ['atividade', 'Atividade produtiva', ['Todas', 'Nenhuma', 'atividades']],
    ['executor', 'Executor', ['Todos', 'Nenhum', 'executores']]
  ];
  const DEPENDE = { safra: ['ano', 'atividade'], cultura: ['ano', 'atividade'], fazenda: ['empresa'], talhao: ['empresa', 'fazenda'], operacao: ['grupo'] };
  // O resultado da página (redesenha depois de mexer num filtro ou no Limpar filtros); ligado em aoMostrar
  let aoMudarFiltros = () => {};
  const barra = BarraFiltros.criar({
    id: 'dr',
    estado: () => est,
    campos: () => FILTROS,
    mais: () => MAIS_FILTROS,
    opcoes: (chave) => opcoes(chave, todosRegistros()),
    depende: DEPENDE,
    padrao: () => ({ talhao: 'todos', grupo: 'todos', operacao: 'todos', executor: 'todos', pagina: 1 }),
    aoMudar: () => { est.pagina = 1; aoMudarFiltros(); }
  });
  // Faixas pelo desvio com sinal (04/11/2026), com a cor de cada uma (a mesma das etiquetas de desvio): abaixo do
  // recomendado (negativo), sem desvio (exatamente 0%, sem tolerância por enquanto; a validar com os usuários), até 10%,
  // de 10% a 20% e acima de 20%. ZERO só absorve o arredondamento da conta, não é tolerância
  const ZERO = 1e-9;
  const FAIXAS = [
    ['abaixo', 'Abaixo do recomendado', (d) => d < -ZERO],
    ['sem', 'Sem desvio', (d) => Math.abs(d) <= ZERO],
    ['ate10', 'Até 10%', (d) => d > ZERO && d <= 0.10],
    ['10a20', '10-20%', (d) => d > 0.10 && d <= 0.20],
    ['acima20', 'Acima de 20%', (d) => d > 0.20]
  ];
  const faixaDe = (d) => FAIXAS.find(([, , f]) => f(d))[0];
  // Níveis do gráfico Desvios por nível (03/11/2026: sem Talhão; Grupo de operação no lugar da Operação)
  const NIVEIS = [['empresa', 'Empresa'], ['fazenda', 'Fazenda'], ['grupo', 'Grupo de operação'], ['executor', 'Executor']];

  let est = null;
  // Cabeçalho, filtros e Analisar por fixos no topo ao rolar (o alfinete solta e prende, como no Orçamento). Mantém-se ao navegar
  let congelado = true;
  let ouvinteRolagem = null;
  // Abre (e Limpar filtros volta) com os filtros-base compartilhados (ano agrícola e safra atuais, o resto em Todas) e
  // os demais em Todos/Todas; Analisar por Dose; nível Empresa
  function novoEstado() {
    const e = { talhao: 'todos', grupo: 'todos', operacao: 'todos', executor: 'todos', busca: {}, filtroAberto: null,
      modo: est ? est.modo : 'dose', nivel: est ? est.nivel : 'empresa', faixa: null, produto: null, buscaDet: '', pagina: 1, porPagina: 10 };
    FiltrosBase.ler(e);
    return e;
  }

  // ----- Registros -----
  const comPublicada = () => DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p));
  const valorDe = { ano: (p) => String(Util.anoAgricola(p.safra)), atividade: (p) => p.atividade, safra: (p) => p.safra,
    cultura: (p) => p.cultura, empresa: (p) => p.empresa, fazenda: (p) => p.fazenda };
  const marcado = (chave, valor) => Cal().marcado(est, chave, valor);
  const planosFiltrados = () => comPublicada().filter((p) => Object.keys(valorDe).every((c) => marcado(c, valorDe[c](p))));
  // Planos que passam pelos filtros de que a chave depende (para as opções dela)
  const planosPara = (chave) => comPublicada().filter((p) => (DEPENDE[chave] || []).every((c) => marcado(c, valorDe[c](p))));
  const unidadeDe = (linha) => linha.unidade || (DADOS.defensivos.find((d) => d.produto === linha.produto) || {}).unidade || '';

  // Todos os registros dos planos filtrados (sem os filtros Grupo, Executor e Período, que entram em filtrados())
  // planos: os da página (os filtrados) ou, para a Previsão de Falta de Produtos, os dela
  function todosRegistros(planos = planosFiltrados()) {
    const sim = DADOS.monitoramento || {};
    const seqDose = sim.desviosDose || [0];
    const seqArea = sim.desviosArea || [0];
    const saida = [];
    let nOS = 0;
    let k = 0;
    planos.forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const grupos = Versoes.grupos(p, v);
      const plantio = (grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0];
      if (!plantio) return;
      Util.talhoesPlano(p, v).forEach((t, iT) => {
        const base = Planos.dataPlantioTalhao(plantio, t.nome);
        if (!base) return;
        grupos.filter((g) => !['Sementes', 'Colheita'].includes(g.tipo)).forEach((g) => g.operacoes.forEach((op, iOp) => {
          const ajuste = op.talhoes && op.talhoes[t.nome];
          if (!ajuste || op.dap === null || op.dap === undefined || op.dap === '') return;
          const planejado = MA().somaDias(base, Number(op.dap));
          const { executada, fechamento, os } = MA().execucao(p, t.nome, op, g, planejado, iT, iT * 3 + iOp);
          if (!fechamento) return;
          nOS += 1;
          const numero = os ? os.numero : 14500 + nOS;
          const executor = os && os.executor ? os.executor : DADOS.executores[nOS % DADOS.executores.length];
          const dArea = seqArea[nOS % seqArea.length];
          Planos.linhasTalhao(op, ajuste).forEach((linha) => {
            const doseRec = Planos.doseTalhao(op, ajuste, linha);
            if (!doseRec) return;
            // Desvio fixo do produto no plano (DADOS.monitoramento.desviosProduto), sem avançar a sequência
            const fixo = ((sim.desviosProduto || {})[`${p.fazenda} ${p.safra}`] || {})[linha.produto];
            const dDose = fixo ?? seqDose[k % seqDose.length];
            if (fixo === undefined) k += 1;
            const doseApl = doseRec * (1 + dDose);
            const areaExec = t.area * (1 + dArea);
            saida.push({ os: `OS-${numero}`, plano: p, safra: p.safra, empresa: p.empresa, fazenda: p.fazenda, talhao: t.nome,
              grupo: g.nome, operacao: op.nome, produto: linha.produto, unidade: unidadeDe(linha), executor, executada, fechamento,
              doseRec, doseApl, qtdRec: doseRec * t.area, qtdApl: doseApl * areaExec });
          });
        }));
      });
    });
    return saida;
  }
  const desvioDe = (r) => (est.modo === 'quantidade' ? r.qtdApl / r.qtdRec - 1 : r.doseApl / r.doseRec - 1);
  // Talhão, Grupo de operação, Operação e Executor
  const filtrados = (todos = todosRegistros()) => todos.filter((r) => marcado('talhao', `${r.fazenda}|${r.talhao}`)
    && marcado('grupo', r.grupo) && marcado('operacao', r.operacao) && marcado('executor', r.executor));

  function opcoes(chave, todos) {
    // Talhão: os dos planos das empresas e fazendas marcadas, com a fazenda junto ("Boa Vista · T01")
    if (chave === 'talhao') {
      const vistos = new Map();
      planosPara('talhao').forEach((p) => Util.talhoesPlano(p, Versoes.ultimaPublicada(p)).forEach((t) => {
        const valor = `${p.fazenda}|${t.nome}`;
        if (!vistos.has(valor)) vistos.set(valor, { valor, nome: `${p.fazenda} · ${t.nome}`, extra: Util.area(t.area) });
      }));
      return [...vistos.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
    }
    if (chave === 'grupo') {
      const nomes = [];
      planosFiltrados().forEach((p) => Versoes.grupos(p, Versoes.ultimaPublicada(p))
        .filter((g) => !['Sementes', 'Colheita'].includes(g.tipo))
        .forEach((g) => { if (!nomes.includes(g.nome)) nomes.push(g.nome); }));
      return nomes.map((n) => ({ valor: n, nome: n }));
    }
    // Operação: as dos grupos marcados, na ordem em que aparecem
    if (chave === 'operacao') {
      const nomes = [];
      todos.filter((r) => marcado('grupo', r.grupo)).forEach((r) => { if (!nomes.includes(r.operacao)) nomes.push(r.operacao); });
      return nomes.map((n) => ({ valor: n, nome: n }));
    }
    if (chave === 'executor') {
      const presentes = new Set(todos.map((r) => r.executor));
      return DADOS.executores.filter((x) => presentes.has(x)).map((x) => ({ valor: x, nome: x }));
    }
    const presentes = new Set(planosPara(chave).map(valorDe[chave]));
    if (chave === 'ano') return [...presentes].sort((a, b) => Number(b) - Number(a)).map((x) => ({ valor: x, nome: x }));
    if (chave === 'safra') return Util.ordenarSafras([...presentes]).map((x) => ({ valor: x, nome: x }));
    const ordem = { atividade: DADOS.atividades, cultura: DADOS.culturasPlanos, empresa: DADOS.empresas, fazenda: DADOS.fazendas }[chave];
    return ordem.filter((x) => presentes.has(x)).map((x) => ({ valor: x, nome: x }));
  }

  // ----- Desenho -----
  // cab: o cabeçalho da página (título e guias), que rola e sai da tela. Fica congelada só a barra: o cartão dos filtros
  // (com o Analisar por e os atalhos das seções embaixo) e, fora dele, à direita, o alfinete
  function desenhar(cab = '') {
    est = est || novoEstado();
    return `
      <div class="dr-raiz">
        ${cab}
        <div class="dr-fixo ${congelado ? '' : 'dr-fixo--solto'}">
          <!-- 05/11/2026: sem o alfinete (os filtros ficam sempre parados no topo) e sem o Analisar por (Dose · Quantidade) -->
          <section class="cartao filtros dr-filtros" aria-label="Filtrar os desvios">
            <div class="filtros dr-bf" data-dr-barra></div>
          </section>
        </div>
        <div class="pagina ma dr"><div class="dr" data-dr-corpo></div></div>
      </div>`;
  }
  function alfinete() {
    const texto = congelado ? 'Descongelar filtros' : 'Congelar filtros';
    return `<button class="botao-icone orc-congelar dr-congelar ${congelado ? 'orc-congelar--ativo' : ''}" type="button" data-dr-acao="congelar"
                title="${texto}" aria-label="${texto}" aria-pressed="${congelado}">${Icones.alfinete}</button>`;
  }
  // Atalhos das seções (rolam até elas; o da seção à mostra fica destacado)
  const SECOES = [['dist', 'Distribuição'], ['nivel', 'Por nível'], ['top', 'Top 10'], ['det', 'Detalhamento']];

  // Linha de baixo do cartão dos filtros: só o Analisar por (fora da barra de filtros). Os atalhos "Ir para:" saíram
  // em 04/11/2026
  function base() {
    return `
        <div class="dr-analisar">${analisar()}</div>`;
  }

  const nomeModo = () => (est.modo === 'quantidade' ? 'Quantidade' : 'Dose');
  // Analisar por: Dose · Quantidade (na base do cartão dos filtros)
  function analisar() {
    return `
        <span class="dr-analisar__titulo">Analisar por:</span>
        ${[['dose', 'Dose'], ['quantidade', 'Quantidade']].map(([v, rot]) => `
          <button class="botao botao--p ${est.modo === v ? 'botao--primario' : 'botao--secundario'} dr-analisar__botao" type="button"
                  data-dr-modo="${v}" aria-pressed="${est.modo === v}">${rot}</button>`).join('')}`;
  }
  // 05/11/2026: só o Detalhamento por OS (a Distribuição, o Por nível e o Top 10 saíram; o código continua aqui, adormecido;
  // a versão completa está na marca desvios-dose-05-11-2026)
  function corpo(regs) {
    return `
      ${!regs.length ? '<section class="cartao dr-secao"><p class="ma-construcao">Nenhuma OS fechada com esses filtros.</p></section>' : `
      ${detalhamento(regs)}`}`;
  }

  // Distribuição: % de registros por faixa de desvio (com sinal). Clicar numa faixa filtra só o gráfico Desvios por nível
  function distribuicao(regs) {
    const n = regs.length;
    const cont = Object.fromEntries(FAIXAS.map(([id]) => [id, 0]));
    regs.forEach((r) => { cont[faixaDe(desvioDe(r))] += 1; });
    return `
      <section class="cartao dr-secao dr-dist dr-ancora" id="dr-sec-dist" aria-labelledby="dr-dist-titulo">
        <h3 class="dr-secao__titulo" id="dr-dist-titulo">${est.modo === 'quantidade' ? 'Distribuição dos desvios por Quantidade de Produto' : 'Distribuição dos desvios de Dose de Produto'}</h3>
        <p class="dr-secao__sub">% de OS por faixa de desvio recomendado x aplicado.</p>
        <ul class="dr-faixas">
          ${FAIXAS.map(([id, rot]) => {
            const p = n ? cont[id] / n : 0;
            const ativa = est.faixa === id;
            return `<li><button class="dr-faixa ${est.faixa && !ativa ? 'dr-faixa--apagada' : ''}" type="button" data-dr-faixa="${id}" aria-pressed="${ativa}"
                title="${ativa ? 'Mostrar todas as faixas no gráfico' : `Ver só ${rot.toLowerCase()} no gráfico Desvios por nível`}">
              <span class="dr-faixa__rotulo">${rot}</span>
              <span class="dr-faixa__trilho"><span class="dr-faixa__barra dr-cor--${id}" style="width:${p * 100}%"></span></span>
              <span class="dr-faixa__pct">${fmt(Math.round(p * 100))}%</span>
              <span class="dr-faixa__n">(${fmt(cont[id])})</span></button></li>`;
          }).join('')}
        </ul>
        ${est.faixa ? '<button class="link-acao dr-todas" type="button" data-dr-acao="todas-faixas">Mostrar todas</button>' : ''}
      </section>`;
  }

  // Desvios por nível: o desvio médio (absoluto) dos registros de cada grupo, sempre do maior para o menor (empate: o nome)
  function porNivel(regs) {
    if (!NIVEIS.some(([v]) => v === est.nivel)) est.nivel = 'empresa';
    const lista = regs.filter((r) => !est.faixa || faixaDe(desvioDe(r)) === est.faixa);
    const chave = { empresa: (r) => r.empresa, fazenda: (r) => r.fazenda, grupo: (r) => r.grupo, executor: (r) => r.executor }[est.nivel];
    const grupos = new Map();
    lista.forEach((r) => { const g = grupos.get(chave(r)) || []; g.push(Math.abs(desvioDe(r))); grupos.set(chave(r), g); });
    let barras = [...grupos].map(([nome, xs]) => ({ nome, valor: xs.reduce((s, x) => s + x, 0) / xs.length * 100 }));
    barras = barras.sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
    const topo = Math.max(5, Math.ceil(Math.max(0, ...barras.map((b) => b.valor)) / 5) * 5);
    const marcas = [];
    for (let v = 0; v <= topo; v += topo / 5) marcas.push(v);
    const faixa = est.faixa ? FAIXAS.find(([id]) => id === est.faixa)[1] : '';
    // Nomes longos ("Aplicação de insumos"): quebram em até três linhas embaixo da barra, numa coluna mais larga
    const rotulo = (nome) => nome;
    const longos = barras.some((b) => b.nome.length > 10);
    return `
      <section class="cartao dr-secao dr-nivel dr-ancora" id="dr-sec-nivel" aria-labelledby="dr-nivel-titulo">
        <!-- O título termina em "por:" e segue com a lista do nível, na mesma linha -->
        <div class="dr-nivel__cab">
          <h3 class="dr-secao__titulo" id="dr-nivel-titulo">${est.modo === 'quantidade' ? 'Desvio de quantidade de produto por:' : 'Desvio de dose de produto por:'}</h3>
          <select class="campo__controle dr-nivel__select" data-dr-nivel aria-label="Nível">
            ${NIVEIS.map(([v, rot]) => `<option value="${v}" ${est.nivel === v ? 'selected' : ''}>${rot}</option>`).join('')}
          </select>
        </div>
        <p class="dr-secao__sub">Comparativo entre os grupos conforme a métrica selecionada${faixa ? ` · faixa ${faixa.toLowerCase()}` : ''}.</p>
        ${!barras.length ? '<p class="ind-vazio">Nenhuma OS nesta faixa.</p>' : `
        <div class="ind-grafico ${barras.length > (longos ? 6 : 8) ? 'ind-grafico--dia' : ''} ${longos ? 'dr-rotulos-longos' : ''}" role="img"
             aria-label="Desvio médio por ${NIVEIS.find(([v]) => v === est.nivel)[1].toLowerCase()}: ${barras.map((b) => `${b.nome}, ${fmt(Math.round(b.valor))}%`).join('; ')}">
          <span class="ind-grafico__eixo-titulo">Desvio (%)</span>
          <div class="ind-grafico__plot dr-nivel__plot">
            ${marcas.map((v) => `<span class="ind-grafico__grade" style="bottom: ${v / topo * 100}%"><span>${fmt(v)}%</span></span>`).join('')}
            <div class="ind-grafico__barras">
              ${barras.map((b) => `
                <div class="ind-grafico__coluna" title="${esc(b.nome)}: ${fmt(Math.round(b.valor))}%">
                  <div class="ind-grafico__barra-area">
                    <span class="ind-grafico__valor" style="bottom: ${b.valor / topo * 100}%">${fmt(Math.round(b.valor))}%</span>
                    <span class="ind-grafico__barra" style="height: ${b.valor / topo * 100}%"></span>
                  </div>
                  <span class="ind-grafico__rotulo">${esc(rotulo(b.nome))}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>`}
      </section>`;
  }

  // Etiqueta do desvio, na cor da faixa, com o sinal
  const etiqueta = (d) => `<span class="dr-etiqueta dr-cor--${faixaDe(d)}">${pct(d)}</span>`;
  const dose = (n, unidade) => `${fmt(n, 2)} ${esc(unidade)}/ha`;
  const qtd = (n, unidade) => `${fmt(Math.round(n))} ${esc(unidade)}`;

  // Top 10 produtos: o desvio do produto (aplicado médio ÷ recomendado médio − 1; em Quantidade, as somas), do maior para o
  // menor em valor absoluto. Clicar num produto filtra o Detalhamento por OS. Grupo de insumo: o do cadastro do produto
  // (os mesmos grupos do Orçamento: Defensivos, Adjuvantes, Biológicos…)
  const grupoInsumo = (produto) => {
    const cad = DADOS.defensivos.find((d) => d.produto === produto) || {};
    return DADOS.grupoInsumoPorClasse[cad.classe] || (cad.fertilidade ? 'Fertilizantes' : 'Defensivos');
  };
  function produtos(regs) {
    const mapa = new Map();
    regs.forEach((r) => {
      const x = mapa.get(r.produto) || { produto: r.produto, unidade: r.unidade, grupos: new Map(), n: 0, doseRec: 0, doseApl: 0, qtdRec: 0, qtdApl: 0 };
      x.n += 1; x.doseRec += r.doseRec; x.doseApl += r.doseApl; x.qtdRec += r.qtdRec; x.qtdApl += r.qtdApl;
      x.grupos.set(r.grupo, (x.grupos.get(r.grupo) || 0) + 1);
      mapa.set(r.produto, x);
    });
    return [...mapa.values()].map((x) => ({ ...x, grupo: [...x.grupos].sort((a, b) => b[1] - a[1])[0][0], grupoInsumo: grupoInsumo(x.produto),
      desvio: est.modo === 'quantidade' ? x.qtdApl / x.qtdRec - 1 : x.doseApl / x.doseRec - 1 }))
      .sort((a, b) => Math.abs(b.desvio) - Math.abs(a.desvio) || a.produto.localeCompare(b.produto, 'pt-BR'));
  }
  // Ordenar por coluna (04/11/2026), no Top 10 e no Detalhamento: seta no título, 1º clique crescente, 2º decrescente.
  // Sem escolha, a ordem padrão (do maior desvio absoluto para o menor). No Top 10, reordena os 10 produtos
  const texto = (a, b) => String(a).localeCompare(String(b), 'pt-BR', { numeric: true });
  const COLUNAS_TOP = {
    grupoInsumo: (x) => x.grupoInsumo, produto: (x) => x.produto,
    rec: (x) => (est.modo === 'quantidade' ? x.qtdRec : x.doseRec / x.n), apl: (x) => (est.modo === 'quantidade' ? x.qtdApl : x.doseApl / x.n),
    desvio: (x) => x.desvio, n: (x) => x.n
  };
  const COLUNAS_DET = {
    os: (r) => r.os, criacao: (r) => r.executada || '', fechamento: (r) => r.fechamento || '', safra: (r) => r.safra, empresa: (r) => r.empresa, fazenda: (r) => r.fazenda, talhao: (r) => r.talhao,
    operacao: (r) => r.operacao, produto: (r) => r.produto, doseRec: (r) => r.doseRec, doseApl: (r) => r.doseApl,
    desvioDose: (r) => r.doseApl / r.doseRec - 1, qtdRec: (r) => r.qtdRec, qtdApl: (r) => r.qtdApl, desvioQtd: (r) => r.qtdApl / r.qtdRec - 1
  };
  function ordenar(lista, ordem, colunas) {
    if (!ordem || !colunas[ordem.coluna]) return lista;
    const v = colunas[ordem.coluna];
    const sinal = ordem.sentido === 'asc' ? 1 : -1;
    return [...lista].sort((a, b) => {
      const x = v(a); const y = v(b);
      return sinal * (typeof x === 'number' && typeof y === 'number' ? x - y : texto(x, y));
    });
  }
  // Título da coluna com a seta (tabela: 'top' ou 'det')
  function titulo(tabela, id, rotulo, classe = '') {
    const ordem = tabela === 'top' ? est.ordemTop : est.ordemDet;
    const ativa = ordem && ordem.coluna === id;
    return `<th class="${classe}"><span class="titulo-coluna"><span>${rotulo}</span><button class="titulo-ordenar ${ativa ? 'titulo-ordenar--ativo' : ''}"
      type="button" data-dr-ordenar="${tabela}:${id}" aria-label="Ordenar por ${rotulo}">${ativa ? (ordem.sentido === 'asc' ? Icones.acima : Icones.abaixo) : Icones.ordenar}</button></span></th>`;
  }

  function topProdutos(regs) {
    const top = ordenar(produtos(regs).slice(0, 10), est.ordemTop, COLUNAS_TOP);
    const q = est.modo === 'quantidade';
    return `
      <section class="cartao dr-secao dr-ancora" id="dr-sec-top" aria-labelledby="dr-top-titulo">
        <div class="dr-secao__topo">
          <div>
            <h3 class="dr-secao__titulo" id="dr-top-titulo">Top 10 produtos com maior desvio de ${nomeModo()}</h3>
            <p class="dr-secao__sub">Clique em produto para selecionar as OS na tabela abaixo.</p>
          </div>
          ${est.produto ? '<button class="link-acao" type="button" data-dr-acao="todos-produtos">Mostrar todos os produtos</button>' : ''}
        </div>
        <div class="tabela-rolagem"><table class="tabela dr-tabela dr-top">
          <thead><tr>${titulo('top', 'grupoInsumo', 'Grupo de insumo')}${titulo('top', 'produto', 'Produto')}
            ${titulo('top', 'rec', q ? 'Quantidade recomendada' : 'Dose recomendada', 'tabela__numero')}
            ${titulo('top', 'apl', q ? 'Quantidade aplicada' : 'Dose aplicada', 'tabela__numero')}
            ${titulo('top', 'desvio', 'Desvio', 'dr-centro')}${titulo('top', 'n', 'Nº de OS', 'tabela__numero')}</tr></thead>
          <tbody>${top.map((x) => `
            <tr class="dr-top__linha ${est.produto === x.produto ? 'dr-top__linha--ativa' : ''} ${est.produto && est.produto !== x.produto ? 'dr-top__linha--apagada' : ''}"
                data-dr-produto="${esc(x.produto)}" tabindex="0" title="${est.produto === x.produto ? 'Mostrar todos os produtos' : `Ver só as OS de ${esc(x.produto)}`}">
              <td>${esc(x.grupoInsumo)}</td><td><strong>${esc(x.produto)}</strong></td>
              <td class="tabela__numero">${q ? qtd(x.qtdRec, x.unidade) : dose(x.doseRec / x.n, x.unidade)}</td>
              <td class="tabela__numero">${q ? qtd(x.qtdApl, x.unidade) : dose(x.doseApl / x.n, x.unidade)}</td>
              <td class="dr-centro">${etiqueta(x.desvio)}</td><td class="tabela__numero">${fmt(x.n)}</td></tr>`).join('')}</tbody>
        </table></div>
      </section>`;
  }

  // Detalhamento por OS: um registro por linha, do maior desvio absoluto para o menor; busca por OS, produto ou talhão
  function linhasDetalhe(regs) {
    const q = Util.normalizar((est.buscaDet || '').trim());
    return regs.filter((r) => (!est.produto || r.produto === est.produto)
      && (!q || [r.os, r.produto, r.talhao].some((x) => Util.normalizar(x).includes(q))))
      .sort((a, b) => Math.abs(desvioDe(b)) - Math.abs(desvioDe(a)) || a.os.localeCompare(b.os, 'pt-BR', { numeric: true }));
  }
  const linhasOrdenadas = (regs) => ordenar(linhasDetalhe(regs), est.ordemDet, COLUNAS_DET);
  function detalhamento(regs) {
    return `
      <section class="cartao dr-secao dr-ancora" id="dr-sec-det" aria-labelledby="dr-det-titulo" data-dr-detalhe>${tabelaDetalhe(regs)}</section>`;
  }
  function tabelaDetalhe(regs) {
    const ls = linhasOrdenadas(regs);
    const paginas = Math.max(1, Math.ceil(ls.length / est.porPagina));
    est.pagina = Math.min(Math.max(1, est.pagina), paginas);
    const pagina = ls.slice((est.pagina - 1) * est.porPagina, est.pagina * est.porPagina);
    const de = ls.length ? (est.pagina - 1) * est.porPagina + 1 : 0;
    const ate = Math.min(est.pagina * est.porPagina, ls.length);
    const dDose = (r) => r.doseApl / r.doseRec - 1;
    const dQtd = (r) => r.qtdApl / r.qtdRec - 1;
    return `
        <div class="dr-secao__topo">
          <div>
            <h3 class="dr-secao__titulo" id="dr-det-titulo">Detalhamento por OS${est.produto ? ` · ${esc(est.produto)}` : ''}</h3>
            <p class="dr-secao__sub">OS filtradas conforme os critérios selecionados.</p>
          </div>
          <div class="dr-det__acoes">
            <label class="dr-busca">${Icones.busca}<input type="search" class="campo__controle" data-dr-busca placeholder="Buscar OS, produto ou talhão"
              value="${esc(est.buscaDet || '')}" aria-label="Buscar OS, produto ou talhão" autocomplete="off"></label>
            <button class="botao orc-exportar" type="button" data-dr-acao="exportar" ${ls.length ? '' : 'disabled'}>${Icones.baixar} Exportar</button>
          </div>
        </div>
        <div class="tabela-rolagem"><table class="tabela dr-tabela dr-det">
          <thead><tr>${titulo('det', 'os', 'Nº OS')}${titulo('det', 'criacao', 'Data de criação')}${titulo('det', 'fechamento', 'Data de fechamento')}${titulo('det', 'safra', 'Safra')}${titulo('det', 'empresa', 'Empresa')}${titulo('det', 'fazenda', 'Fazenda')}
            ${titulo('det', 'talhao', 'Talhão')}${titulo('det', 'operacao', 'Operação')}${titulo('det', 'produto', 'Produto')}
            ${titulo('det', 'doseRec', 'Dose recomendada', 'tabela__numero')}${titulo('det', 'doseApl', 'Dose aplicada', 'tabela__numero')}${titulo('det', 'desvioDose', 'Desvio Dose (%)', 'dr-centro')}
            ${titulo('det', 'qtdRec', 'Quantidade recomendada', 'tabela__numero')}${titulo('det', 'qtdApl', 'Quantidade aplicada', 'tabela__numero')}${titulo('det', 'desvioQtd', 'Desvio Qtd (%)', 'dr-centro')}</tr></thead>
          <tbody>${pagina.length ? pagina.map((r) => `
            <tr title="Fechada em ${Util.data(r.fechamento)} · ${esc(r.executor)}">
              <td>${esc(r.os)}</td><td>${r.executada ? Util.data(r.executada) : '—'}</td><td>${r.fechamento ? Util.data(r.fechamento) : '—'}</td><td>${esc(r.safra)}</td><td>${esc(r.empresa)}</td><td>${esc(r.fazenda)}</td><td>${esc(r.talhao)}</td>
              <td>${esc(r.operacao)}</td><td>${esc(r.produto)}</td>
              <td class="tabela__numero">${dose(r.doseRec, r.unidade)}</td><td class="tabela__numero">${dose(r.doseApl, r.unidade)}</td>
              <td class="dr-centro">${etiqueta(dDose(r))}</td>
              <td class="tabela__numero">${qtd(r.qtdRec, r.unidade)}</td><td class="tabela__numero">${qtd(r.qtdApl, r.unidade)}</td>
              <td class="dr-centro">${etiqueta(dQtd(r))}</td></tr>`).join('')
            : '<tr><td class="tabela__vazia" colspan="15">Nenhuma OS encontrada.</td></tr>'}</tbody>
        </table></div>
        <div class="orc-paginacao">
          <span class="orc-paginacao__texto dr-det__conta">${fmt(de)}–${fmt(ate)} de ${fmt(ls.length)} OS</span>
          <button class="botao-icone" type="button" data-dr-pagina="${est.pagina - 1}" ${est.pagina <= 1 ? 'disabled' : ''} aria-label="Página anterior">${Icones.anterior}</button>
          <span class="orc-paginacao__texto">Página ${est.pagina} de ${paginas}</span>
          <button class="botao-icone" type="button" data-dr-pagina="${est.pagina + 1}" ${est.pagina >= paginas ? 'disabled' : ''} aria-label="Próxima página">${Icones.proxima}</button>
          <label class="orc-paginacao__por dr-det__por">Itens por página
            <select class="campo__controle" data-dr-por-pagina>
              ${POR_PAGINA.map((n) => `<option ${n === est.porPagina ? 'selected' : ''}>${n}</option>`).join('')}
            </select></label>
        </div>`;
  }

  // Exportar: o detalhamento inteiro (todas as páginas, com a busca e o produto escolhido), na ordem da tela
  function exportar(regs) {
    const linhas = [['Nº OS', 'Data de criação', 'Data de fechamento', 'Safra', 'Empresa', 'Fazenda', 'Talhão', 'Operação', 'Produto', 'Unidade', 'Dose recomendada (/ha)',
      'Dose aplicada (/ha)', 'Desvio dose (%)', 'Quantidade recomendada', 'Quantidade aplicada', 'Desvio quantidade (%)', 'Executor'],
    ...linhasOrdenadas(regs).map((r) => [r.os, r.executada ? Util.data(r.executada) : '', r.fechamento ? Util.data(r.fechamento) : '', r.safra, r.empresa, r.fazenda, r.talhao, r.operacao, r.produto, r.unidade,
      +r.doseRec.toFixed(3), +r.doseApl.toFixed(3), +((r.doseApl / r.doseRec - 1) * 100).toFixed(1),
      +r.qtdRec.toFixed(1), +r.qtdApl.toFixed(1), +((r.qtdApl / r.qtdRec - 1) * 100).toFixed(1), r.executor])];
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, XLSX.utils.aoa_to_sheet(linhas), 'desvios');
    XLSX.writeFile(livro, `desvios-recomendacao_${Util.hojeISO()}.xlsx`);
  }

  // ----- Eventos -----
  function aoMostrar(conteudo) {
    est = est || novoEstado();
    est.produto = null; // sem o Top 10 (05/11/2026), nenhum produto escolhido filtra o Detalhamento
    FiltrosBase.ler(est);
    const raiz = conteudo.querySelector('.dr-raiz');
    const caixaAlfinete = raiz.querySelector('[data-dr-alfinete]');
    const rolagem = conteudo.closest('.conteudo') || conteudo;
    const caixaCorpo = raiz.querySelector('[data-dr-corpo]');
    const ctx = { estado: est };
    let regs = [];
    const redesenhar = (foco) => {
      const todos = todosRegistros();
      regs = filtrados(todos);
      caixaCorpo.innerHTML = corpo(regs);
      medirBarra();
      marcarAtalho();
      if (foco) raiz.querySelector(foco)?.focus();
    };
    // Altura da barra congelada: as seções param logo abaixo dela ao usar os atalhos
    const medirBarra = () => {
      const h = congelado ? raiz.querySelector('.dr-fixo').getBoundingClientRect().height : 0;
      raiz.style.setProperty('--dr-fixo-h', `${Math.round(h)}px`);
    };
    // Atalho da seção à mostra: a última cujo topo já passou da barra congelada (Distribuição e Por nível ficam na mesma
    // linha: com o mesmo topo, vale a primeira)
    const marcarAtalho = () => {
      const limite = raiz.querySelector('.dr-fixo').getBoundingClientRect().bottom + 24;
      let atual = SECOES[0][0];
      let topoAnterior = -Infinity;
      SECOES.forEach(([id]) => {
        const s = raiz.querySelector(`#dr-sec-${id}`);
        if (!s) return;
        const topo = Math.round(s.getBoundingClientRect().top);
        if (topo > topoAnterior + 1 && topo <= limite) atual = id;
        topoAnterior = Math.max(topoAnterior, topo);
      });
      raiz.querySelectorAll('[data-dr-ir]').forEach((b) => {
        const ativo = b.dataset.drIr === atual;
        b.classList.toggle('dr-atalho--ativo', ativo);
        if (ativo) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
    };
    // Um ouvinte de rolagem só (o da visita anterior sai)
    if (ouvinteRolagem) ouvinteRolagem.alvo.removeEventListener('scroll', ouvinteRolagem.fn);
    ouvinteRolagem = { alvo: rolagem, fn: () => { if (raiz.isConnected) marcarAtalho(); } };
    rolagem.addEventListener('scroll', ouvinteRolagem.fn, { passive: true });
    const redesenharDetalhe = () => {
      const caixa = raiz.querySelector('[data-dr-detalhe]');
      if (caixa) caixa.innerHTML = tabelaDetalhe(regs);
    };

    aoMudarFiltros = () => redesenhar();
    barra.ligar(raiz.querySelector('[data-dr-barra]'));

    raiz.addEventListener('click', (e) => {
      // A barra de filtros cuida dos próprios cliques
      if (e.target.closest('[data-dr-barra]')) return;
      const acao = e.target.closest('[data-dr-acao]');
      if (acao) {
        const a = acao.dataset.drAcao;
        if (a === 'congelar') {
          congelado = !congelado;
          raiz.querySelector('.dr-fixo').classList.toggle('dr-fixo--solto', !congelado);
          caixaAlfinete.innerHTML = alfinete();
          medirBarra();
          raiz.querySelector('[data-dr-acao="congelar"]').focus();
        }
        else if (a === 'todas-faixas') { est.faixa = null; redesenhar('[data-dr-faixa]'); }
        else if (a === 'todos-produtos') { est.produto = null; est.pagina = 1; redesenhar('[data-dr-produto]'); }
        else if (a === 'exportar') exportar(regs);
        return;
      }
      // Atalhos: rolam até a seção, logo abaixo da barra congelada
      const ir = e.target.closest('[data-dr-ir]');
      if (ir) {
        const secao = raiz.querySelector(`#dr-sec-${ir.dataset.drIr}`);
        if (secao) {
          // Com a barra congelada, a seção para logo abaixo dela já grudada no topo (a altura dela, a partir do topo da área)
          const barra = rolagem.getBoundingClientRect().top + (congelado ? raiz.querySelector('.dr-fixo').offsetHeight : 0);
          rolagem.scrollTop += secao.getBoundingClientRect().top - barra - 16;
          marcarAtalho();
        }
        return;
      }
      const modo = e.target.closest('[data-dr-modo]');
      if (modo) { est.modo = modo.dataset.drModo; redesenhar(`[data-dr-modo="${est.modo}"]`); return; }
      const faixa = e.target.closest('[data-dr-faixa]');
      if (faixa) {
        est.faixa = est.faixa === faixa.dataset.drFaixa ? null : faixa.dataset.drFaixa;
        redesenhar(`[data-dr-faixa="${faixa.dataset.drFaixa}"]`);
        return;
      }
      const prod = e.target.closest('[data-dr-produto]');
      if (prod) {
        est.produto = est.produto === prod.dataset.drProduto ? null : prod.dataset.drProduto;
        est.pagina = 1;
        redesenhar(`[data-dr-produto="${CSS.escape(prod.dataset.drProduto)}"]`);
        return;
      }
      // Ordenar: a mesma coluna inverte o sentido; outra começa do menor para o maior
      const ord = e.target.closest('[data-dr-ordenar]');
      if (ord) {
        const [tabela, coluna] = ord.dataset.drOrdenar.split(':');
        const chave = tabela === 'top' ? 'ordemTop' : 'ordemDet';
        est[chave] = { coluna, sentido: est[chave] && est[chave].coluna === coluna && est[chave].sentido === 'asc' ? 'desc' : 'asc' };
        if (tabela === 'det') { est.pagina = 1; redesenharDetalhe(); } else redesenhar();
        raiz.querySelector(`[data-dr-ordenar="${CSS.escape(ord.dataset.drOrdenar)}"]`)?.focus();
        return;
      }
      const pag = e.target.closest('[data-dr-pagina]');
      if (pag) { est.pagina = Number(pag.dataset.drPagina); redesenharDetalhe(); raiz.querySelector('[data-dr-pagina]:not([disabled])')?.focus(); return; }
      Cal().aoClicar(e, ctx, { redesenhar });
    });
    raiz.addEventListener('keydown', (e) => {
      const prod = e.target.closest('[data-dr-produto]');
      if (prod && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); prod.click(); }
    });
    raiz.addEventListener('change', (e) => {
      if (e.target.matches('[data-dr-nivel]')) { est.nivel = e.target.value; redesenhar('[data-dr-nivel]'); return; }
      if (e.target.matches('[data-dr-por-pagina]')) { est.porPagina = Number(e.target.value); est.pagina = 1; redesenharDetalhe(); raiz.querySelector('[data-dr-por-pagina]')?.focus(); return; }
    });
    // Busca: redesenha só o detalhamento e devolve o foco ao campo, com o cursor no fim
    raiz.addEventListener('input', (e) => {
      if (e.target.matches('[data-dr-busca]')) {
        est.buscaDet = e.target.value; est.pagina = 1;
        redesenharDetalhe();
        const campo = raiz.querySelector('[data-dr-busca]');
        campo.focus(); campo.setSelectionRange(campo.value.length, campo.value.length);
        return;
      }
    });
    redesenhar();
  }

  // Para a Previsão de Falta de Produtos: os registros (produto de OS fechada) dos planos dados
  return { desenhar, aoMostrar, registros: (planos) => todosRegistros(planos) };
})();
