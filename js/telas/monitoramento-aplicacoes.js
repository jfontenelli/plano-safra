/*
 * Operações Agrícolas (antes Planejado x Executado e, antes ainda, Aplicações do menu Monitoramento), no menu Gestão da Lavoura › Operações Agrícolas.
 * A primeira guia, Calendário Agrícola, é a página de js/telas/os-calendario.js (com o mesmo cabeçalho).
 * Filtros com várias escolhas (as caixas da Agenda Agrícola): Safra (as do cadastro dos anos marcados: 26/27, 27/27…),
 * Cultura, Empresa, Fazenda, Talhão, Grupo de operação (abre em Defensivo) e Operação (abre com as fungicidas do modelo);
 * em "Mais filtros", o painel "Filtros adicionais" com Ano agrícola e Atividade produtiva (e os que não couberem na
 * linha); e Limpar filtros (04/11/2026).
 * Tabela com uma linha por talhão: Fazenda, Talhão, Variedade, Plantas/m, Data de plantio, uma coluna por operação
 * marcada (na ordem do DAP), Aplicações executadas e Dias sem aplicação. Botões Planejado e Executado
 * (ao menos um ligado); com os dois, aparece a Dif. (dias). Usa a última versão publicada de cada plano.
 * Datas executadas e estande: simulados em DADOS.monitoramento (data executada = data de recomendação da OS).
 */
window.Telas = window.Telas || {};

window.Telas.monitoramentoAplicacoes = (function () {
  const Cal = () => Telas.calendario;
  const esc = Util.escapar;
  // Base de filtros de todas as páginas (Ano agrícola, Atividade produtiva, Safra, Cultura, Empresa, Fazenda, Talhão), ora
  // à mostra, ora no Mais filtros. Aqui (04/11/2026): à mostra, de Safra a Talhão, Grupo de operação e Operação; no Mais
  // filtros, Ano agrícola e Atividade produtiva
  const FILTROS = [
    ['safra', 'Safra', ['Todas', 'Nenhuma', 'selecionadas']],
    ['cultura', 'Cultura', ['Todas', 'Nenhuma', 'culturas']],
    ['empresa', 'Empresa', ['Todas', 'Nenhuma', 'empresas']],
    ['fazenda', 'Fazenda', ['Todas', 'Nenhuma', 'fazendas']],
    ['talhao', 'Talhão', ['Todos', 'Nenhum', 'talhões']],
    ['grupo', 'Grupo de operação', ['Todos', 'Nenhum', 'grupos']],
    ['operacao', 'Operação', ['Todas', 'Nenhuma', 'operações']]
  ];
  // Largura mínima de cada filtro à mostra (o rótulo e o valor inteiros). O que não couber na linha vai para o Mais
  // filtros, a partir do último (Operação, Grupo de operação…); quantos ficam à mostra depende da largura da tela (04/11/2026)
  const MINIMO = { safra: 92, cultura: 104, empresa: 124, fazenda: 124, talhao: 104, grupo: 136, operacao: 124 };
  let visiveis = FILTROS.length;
  const MAIS_FILTROS = [
    ['ano', 'Ano agrícola', ['Todos', 'Nenhum', 'anos']],
    ['atividade', 'Atividade produtiva', ['Todas', 'Nenhuma', 'atividades']]
  ];

  // Padrão: o grupo Defensivo e as fungicidas do modelo de operações (1ª a 4ª Fungicida)
  const fungicidasModelo = () => ((DADOS.modeloOperacoes.find((g) => g.nome === 'Defensivo') || { operacoes: [] }).operacoes)
    .map((op) => op.nome).filter((n) => /fungicida/i.test(n));
  // Estado da tela: filtros ('todos' ou a lista do que está marcado), a visão (Tabela ou Linha do tempo), o status
  // escolhido na legenda e a ordenação. Mantém-se ao navegar.
  // Abre (e Limpar filtros volta) na safra atual e no ano agrícola dela; Atividade, Cultura, Empresa, Fazenda e Talhão em
  // Todas/Todos (as opções são só as dos planos com planejado e executado); o grupo Defensivo e as fungicidas (04/11/2026)
  const novoEstado = () => {
    const safra = safraAtual();
    return { ano: safra ? [String(Util.anoAgricola(safra))] : 'todos', atividade: 'todos', safra: safra ? [safra] : 'todos',
      cultura: 'todos', empresa: 'todos', fazenda: 'todos',
      talhao: 'todos', grupo: ['Defensivo'], operacao: fungicidasModelo(), visao: 'tabela', status: null, modo: 'datas', maisFiltros: false };
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
  const valorDe = { ano: (p) => String(Util.anoAgricola(p.safra)), atividade: (p) => p.atividade, safra: (p) => p.safra,
    cultura: (p) => p.cultura, empresa: (p) => p.empresa, fazenda: (p) => p.fazenda };
  const gruposDe = (p) => Versoes.grupos(p, Versoes.ultimaPublicada(p));
  const marcado = (chave, valor) => Cal().marcado(est, chave, valor);
  // Planos que passam por Ano, Atividade, Safra, Cultura, Empresa, Fazenda e Talhão (com ao menos um talhão marcado).
  // Filtros dependentes (04/11/2026): Ano agrícola e Atividade limitam as opções de Safra e Cultura; Empresa limita
  // Fazenda; Empresa e Fazenda limitam Talhão (ver DEPENDE)
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
  const DEPENDE = { safra: ['ano', 'atividade'], cultura: ['ano', 'atividade'], fazenda: ['empresa'], talhao: ['empresa', 'fazenda'] };
  // Planos que passam pelos filtros de que a chave depende (para as opções dela)
  const planosPara = (chave) => comPublicada().filter((p) => (DEPENDE[chave] || []).every((c) => marcado(c, valorDe[c](p))));
  // Depois de mexer num filtro: nos que dependem dele, as marcadas que não são mais opção saem; sem nenhuma, ou com todas,
  // volta para Todas/Todos
  function podarDependentes(mexido) {
    Object.keys(DEPENDE).filter((c) => DEPENDE[c].includes(mexido)).forEach((c) => {
      if (!Array.isArray(est[c]) || !est[c].length) return;
      const valores = opcoes(c).map((o) => o.valor);
      const ficam = est[c].filter((v) => valores.includes(v));
      est[c] = ficam.length && ficam.length < valores.length ? ficam : 'todos';
      podarDependentes(c);
    });
  }
  function opcoes(chave) {
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
      planosFiltrados().forEach((p) => gruposDe(p).forEach((g) => { if (!nomes.includes(g.nome)) nomes.push(g.nome); }));
      return nomes.map((n) => ({ valor: n, nome: n }));
    }
    if (chave === 'operacao') return operacoes().map((o) => ({ valor: o.nome, nome: o.nome }));
    const presentes = new Set(planosPara(chave).map(valorDe[chave]));
    // Ano agrícola: do mais recente para o mais antigo
    if (chave === 'ano') return [...presentes].sort((a, b) => Number(b) - Number(a)).map((x) => ({ valor: x, nome: x }));
    // Safra: as do cadastro (26/27, 27/27…) dos anos agrícolas e atividades marcados, na ordem do cadastro
    if (chave === 'safra') return Util.ordenarSafras([...presentes]).map((x) => ({ valor: x, nome: x }));
    const ordem = { atividade: DADOS.atividades, cultura: DADOS.culturasPlanos, empresa: DADOS.empresas, fazenda: DADOS.fazendas }[chave];
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
  // guia: a do endereço (#/planejado-executado/desvios). Desvios de Recomendação: js/telas/desvios-recomendacao.js;
  // Previsão de Falta de Produtos: provisória ("Em construção")
  function desenhar(guia) {
    est = est || novoEstado();
    if (guia && guia !== 'calendario') irParaGuia(guia);
    const cab = `<header class="cabecalho oa-cabecalho ma-cabecalho" data-ma-cabecalho>${cabecalho()}</header>`;
    if (est.visao === 'desvios') return Telas.desviosRecomendacao.desenhar(cab);
    if (est.visao === 'falta') return `${cab}<div class="pagina">${blocoEmConstrucao()}</div>`;
    return `
      ${cab}
      <div class="pagina ma">
        <section class="cartao filtros" aria-label="Filtrar o monitoramento" data-ma-filtros></section>
        <section class="cartao oc-lista ma-lista" aria-label="Aplicações por talhão" data-ma-tabela></section>
      </div>`;
  }

  // Cabeçalho: caminho, título e subtítulo. O Calendário (outra página: js/telas/os-calendario.js) só usa o cabeçalho.
  // O item Operações do menu abre a página Planejado × Executado (03/11/2026), com as guias Planejado × Executado (a
  // tabela por talhão), Desvios de Recomendação e Previsão de Falta de Produtos: o título da guia (sem o caminho no topo,
  // desde 03/11/2026). A Duração da Operação saiu em 29/10/2026; o código dela continua aqui
  const GUIAS = [
    ['calendario', 'Calendário', 'Consulte as operações agrícolas planejadas por ano, mês, semana ou dia.'],
    ['tabela', 'Planejado × Executado', 'Compare as datas planejadas e executadas das operações por talhão.'],
    ['desvios', 'Desvios de Recomendação', 'Analise os desvios entre o recomendado e o executado por produto, operação e nível de análise.'],
    ['falta', 'Previsão de Falta de Produtos', 'Estime a falta de produtos para as operações planejadas.']
  ];
  const GUIAS_PAGINA = ['tabela', 'desvios', 'falta'];
  // visao: a guia (o Calendário chama com 'calendario'). Só no Calendário, a etiqueta das versões publicadas.
  function cabecalho(visao = est.visao) {
    const [, nome, subtitulo] = GUIAS.find(([id]) => id === visao);
    const titulo = `
        <div class="oa-cabecalho__titulo">
          <h1 class="cabecalho__titulo">${nome}</h1>
          <p class="cabecalho__subtitulo">${subtitulo}</p>
        </div>`;
    if (visao === 'calendario') {
      return `${Telas.gestaoLavoura.caminho(nome)}<div class="oa-cabecalho__abas">${titulo}${Telas.gestaoLavoura.etiquetaPublicadas()}</div>`;
    }
    return `
      ${titulo}
      <nav class="ma-guias" aria-label="Guias de Planejado × Executado">
        ${GUIAS_PAGINA.map((id) => `<a class="botao botao--p ${id === visao ? 'botao--primario' : 'botao--secundario'} ma-guia" href="#/planejado-executado/${id}"
          ${id === visao ? 'aria-current="page"' : ''}>${GUIAS.find(([x]) => x === id)[1]}</a>`).join('')}
      </nav>`;
  }
  // Guia escolhida: o Calendário Agrícola é outra página; as demais, esta (vindo do Calendário: #/planejado-executado/tabela)
  function irParaGuia(visao) {
    if (visao === 'calendario') { location.hash = '#/calendario-agricola'; return; }
    if (!GUIAS.some(([id]) => id === visao)) visao = 'tabela'; // guia que saiu (Executadas antiga, linha, duracao): abre em Operações
    if (est.visao !== visao) {
      est.visao = visao;
      padraoDuracao();
    }
  }

  // Filtros à mostra; à direita, depois de um traço, Mais filtros (abre o painel "Filtros adicionais", como nos Desvios de
  // Recomendação) e Limpar filtros (04/11/2026)
  function filtros() {
    const campo = ([chave, rotulo, textos]) => `
        <div class="campo">
          <span class="campo__rotulo">${rotulo}</span>
          ${Cal().filtroCaixa(est, chave, opcoes(chave), textos, rotulo, { unico: filtroUnico() && UNICOS.includes(chave) })}
        </div>`;
    return `
      ${FILTROS.slice(0, visiveis).map((f) => campo(f).replace('class="campo"', `class="campo" style="min-width: ${MINIMO[f[0]]}px"`)).join('')}
      <div class="dr-filtros__acoes ma-filtros__acoes">
        <button class="botao botao--secundario dr-mais ${est.maisFiltros ? 'dr-mais--aberto' : ''}" type="button" data-acao="ma-mais"
                aria-expanded="${!!est.maisFiltros}" aria-controls="ma-mais-filtros" title="Mais filtros" aria-label="Mais filtros">${Icones.ajustes}<span class="ma-acao-texto">Mais filtros</span></button>
        <button class="botao botao--secundario dr-mais ma-limpar" type="button" data-acao="ma-limpar" title="Limpar filtros" aria-label="Limpar filtros">${Icones.limpar}<span class="ma-acao-texto">Limpar filtros</span></button>
        ${est.maisFiltros ? `
        <div class="dr-pop" id="ma-mais-filtros" role="dialog" aria-labelledby="ma-pop-titulo">
          <div class="dr-pop__cab">
            <h3 class="dr-pop__titulo" id="ma-pop-titulo">Filtros adicionais</h3>
            <button class="botao-icone" type="button" data-acao="ma-fechar-mais" aria-label="Fechar" title="Fechar">${Icones.fechar}</button>
          </div>
          ${[...MAIS_FILTROS, ...FILTROS.slice(visiveis)].map(campo).join('')}
        </div>` : ''}
      </div>`;
  }

  // Status da aplicação, mostrado numa etiqueta na célula dela, com a legenda. Nomes desde 29/10/2026: Antecipada (antes
  // Iniciada antes), Iniciada na data, Postergada (antes Iniciada com atraso), Atrasada (antes Não iniciada) e Planejada.
  // As chaves continuam as antigas: 'atrasada' é a Postergada (iniciada depois) e 'pendente' é a Atrasada (não iniciada)
  const STATUS = [['adiantada', 'Antecipada'], ['prazo', 'Iniciada na data'], ['atrasada', 'Postergada'], ['pendente', 'Atrasada'], ['futura', 'Planejada']];
  function statusDe(a) {
    if (!a.executada) return a.planejado <= hoje() ? 'pendente' : 'futura';
    const d = diasEntre(a.planejado, a.executada);
    return d < 0 ? 'adiantada' : d > 0 ? 'atrasada' : 'prazo';
  }

  // Célula de uma aplicação (a = { planejado, executada } ou undefined, quando não está planejada no talhão), numa
  // etiqueta na cor do status. Datas: o calendário e a data executada; Atrasada, a exclamação e a data planejada; Planejada,
  // o calendário e a data planejada, em cinza. Dias: o desvio ("Postergada 2d"); Atrasada com a exclamação; a Planejada
  // ("Em 4d") como em Datas: o calendário e o texto, em cinza.
  function celula(a) {
    const st = a ? statusDe(a) : null;
    // Status escolhido na legenda: a aplicação em outro status fica vazia
    if (st && est.status && st !== est.status) return '<td class="ma-ini"></td>';
    if (!a) return '<td class="ma-ini ma-vazio">—</td>';
    const dica = esc(dicaAplicacao(a, st));
    if (est.modo === 'dias') {
      if (st === 'futura') return `<td class="ma-ini"><span class="ma-etiqueta ma-st--futura" title="${dica}">${Icones.calendario}${textoDias(a, st)}</span></td>`;
      return `<td class="ma-ini"><span class="ma-etiqueta ma-etiqueta--dias ma-st--${st}" title="${dica}">${st === 'pendente' ? Icones.pendente : ''}${textoDias(a, st)}</span></td>`;
    }
    const texto = `${st === 'pendente' ? Icones.pendente : Icones.calendario}${Util.data(a.executada || a.planejado)}`;
    return `<td class="ma-ini"><span class="ma-etiqueta ma-st--${st}" title="${dica}">${texto}</span></td>`;
  }

  // ----- Ordenação: est.ordem = { coluna, sentido }. Colunas: talhao, plantasM, plantio, ultima e, nas aplicações,
  // "op|nome da operação" (em Datas, a data executada ou a planejada; em Dias, o desvio em dias). Vazios sempre no fim; empate: a ordem padrão
  // (fazenda, safra e talhão). -----
  function valorOrdem(r, coluna) {
    const fixos = { fazenda: r.plano.fazenda, talhao: r.talhao, variedade: r.variedades.join(', ') || null, plantasM: r.plantasM,
      plantio: r.plantio.executada, feitas: r.total ? r.feitas / r.total : null, ultima: r.ultima };
    if (coluna in fixos) return fixos[coluna];
    const a = r.aplic[coluna.slice(3)];
    if (!a) return null;
    return est.modo === 'dias' ? desvioDias(a) : a.executada || a.planejado;
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

  // ----- Operações (antes Planejadas × Executadas): etiqueta de cada operação, em Datas ou em Dias (Visualizar por) -----
  // Desvio em dias: executada, da planejada à executada (+ depois, − antes); Atrasada, da planejada até hoje; Planejada,
  // de hoje até a planejada (negativo: ainda falta). Usado também para ordenar em Dias.
  function desvioDias(a) {
    if (a.executada) return diasEntre(a.planejado, a.executada);
    return a.planejado <= hoje() ? diasEntre(a.planejado, hoje()) : -diasEntre(hoje(), a.planejado);
  }
  // Dias: "Na data", "Antecipada 3d", "Postergada 2d", "Atrasada 10d", "Em 4d"
  function textoDias(a, st) {
    const d = Math.abs(desvioDias(a));
    return { prazo: 'Na data', adiantada: `Antecipada ${d}d`, atrasada: `Postergada ${d}d`, pendente: `Atrasada ${d}d`, futura: `Em ${d}d` }[st];
  }
  // Ao passar o mouse: o status e as duas datas
  function dicaAplicacao(a, st) {
    const nome = STATUS.find(([x]) => x === st)[1];
    if (st === 'futura') return `Planejada para ${Util.data(a.planejado)}`;
    if (st === 'pendente') return `Atrasada · planejada para ${Util.data(a.planejado)}`;
    return `${nome} · planejada para ${Util.data(a.planejado)}, executada em ${Util.data(a.executada)}`;
  }

  // Cartão do talhão (coluna Talhão, parada ao rolar para o lado): o nome, a fazenda, as variedades, uma barrinha por
  // operação na cor do status e "2 de 4 executadas 50%"
  function cartaoTalhao(r, cols) {
    const ops = cols.filter((c) => r.aplic[c.nome]);
    const aps = ops.map((c) => r.aplic[c.nome]);
    const sts = aps.map(statusDe);
    const feitas = aps.filter((a) => a.executada).length;
    return `
      <div class="mt-talhao ma-cartao">
        <p class="mt-talhao__nome"><strong>${esc(r.talhao)}</strong></p>
        <div class="ma-cartao__corpo">
          <div class="ma-cartao__local">
            <p class="mt-talhao__fazenda">${esc(r.plano.fazenda)}</p>
            <p class="mt-talhao__var">${esc(r.variedades.join(', ') || '—')}</p>
          </div>
          <div class="ma-cartao__ops">
            <p class="mt-talhao__ops">Operações</p>
            <div class="mt-segmentos">${sts.map((s, i) => `<span class="mt-segmento mt-fundo--${s}" title="${esc(ops[i].nome)}: ${STATUS.find(([x]) => x === s)[1]}"></span>`).join('')}</div>
            <p class="mt-talhao__conta">${feitas} de ${aps.length} ${aps.length === 1 ? 'executada' : 'executadas'} <span class="mt-talhao__pct">${aps.length ? Math.round((feitas / aps.length) * 100) : 0}%</span></p>
          </div>
        </div>
      </div>`;
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
    // O Plantio marcado não ganha coluna: é a Data de plantio
    const temOperacao = cols.length > 0;
    cols = cols.filter((c) => !c.plantio);
    // Com um status escolhido, só as operações que têm aplicação nesse status
    if (est.status) cols = cols.filter((c) => ls.some((r) => r.aplic[c.nome] && statusDe(r.aplic[c.nome]) === est.status));
    // Título com a seta de ordenar (como nas outras tabelas)
    const o = est.ordem || {};
    const th = (id, rotulo, cls, extra = '') => {
      const ativa = o.coluna === id;
      return `<th class="${cls}" ${extra} ${ativa ? `aria-sort="${o.sentido === 'asc' ? 'ascending' : 'descending'}"` : ''}>
        <span class="titulo-coluna"><span>${esc(rotulo)}</span><button class="titulo-ordenar ${ativa ? 'titulo-ordenar--ativo' : ''} ${ativa && o.sentido === 'desc' ? 'titulo-ordenar--desc' : ''}"
          type="button" data-ma-ordenar="${esc(id)}" title="Ordenar por ${esc(rotulo.toLowerCase())}" aria-label="Ordenar por ${esc(rotulo.toLowerCase())}">${ativa ? Icones.acima : Icones.ordenar}</button></span></th>`;
    };
    // Colunas: Talhão (resumo), Estande e Data de plantio paradas à esquerda; as operações; Dias sem aplicação.
    // A Data de plantio é a executada, numa etiqueta neutra (o Plantio marcado não ganha coluna própria)
    const colunas = 4 + cols.length;
    const plantio = (r) => (r.plantio.executada
      ? `<span class="ma-etiqueta ma-etiqueta--neutra">${Icones.calendario}${Util.data(r.plantio.executada)}</span>` : '—');
    return `
      ${barra()}
      <div class="tabela-rolagem ma-tabela__rolagem">
        <table class="tabela oc-tabela ma-tabela ma-tabela--pxe">
          <thead>
            <tr>
              ${th('talhao', 'Talhão (resumo)', 'ma-fixa ma-th-talhao', 'data-fixa="0"')}
              ${th('plantasM', 'Estande (plantas/m)', 'ma-ini ma-fixa ma-quebra tabela__numero', 'data-fixa="1"')}
              ${th('plantio', 'Data de plantio', 'ma-ini ma-fixa ma-fixa--ultima', 'data-fixa="2"')}
              ${cols.map((c) => th(`op|${c.nome}`, c.nome, 'ma-ini ma-quebra')).join('')}
              ${th('ultima', 'Dias sem aplicação', 'ma-ini ma-quebra tabela__numero')}
            </tr>
          </thead>
          <tbody>
            ${!temOperacao ? `<tr><td class="tabela__vazia" colspan="${colunas}">Marque ao menos uma operação no filtro Operação.</td></tr>`
              : ls.length ? ls.map((r) => `
              <tr>
                <td class="ma-fixa ma-td-talhao" data-fixa="0">${cartaoTalhao(r, cols)}</td>
                <td class="ma-ini tabela__numero ma-fixa ma-estande" data-fixa="1">${r.plantasM === null ? '—' : Math.round(r.plantasM).toLocaleString('pt-BR')}</td>
                <td class="ma-ini ma-fixa ma-fixa--ultima" data-fixa="2">${plantio(r)}</td>
                ${cols.map((c) => celula(r.aplic[c.nome])).join('')}
                <td class="ma-ini tabela__numero ma-dias-sem">${r.ultima === null ? '—' : r.ultima}</td>
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
          <span class="ma-legenda__titulo">Operação:</span>
          <ul aria-label="Status da aplicação">
            ${LEGENDA.map(([id, nome]) => `<li><button class="ma-legenda__item ${est.status && est.status !== id ? 'ma-legenda__item--apagado' : ''}" type="button"
                data-ma-status="${id}" aria-pressed="${est.status === id}" title="${est.status === id ? 'Mostrar todos os talhões' : DICA_LEGENDA[id]}">
                ${id === 'pendente' ? `<span class="ma-legenda__icone ma-st--pendente" aria-hidden="true">${Icones.pendente}</span>` : `<span class="ma-legenda__cor mt-ponto--${id}" aria-hidden="true"></span>`}${nome}</button></li>`).join('')}
          </ul>
        </div>
        <div class="ma-modo">
          <span class="ma-modo__titulo">Visualizar por:</span>
          <div class="semente-visoes" role="group" aria-label="Visualizar por">
            ${[['datas', 'Datas', Icones.calendario], ['dias', 'Dias', Icones.lista]].map(([v, rot, ic]) => `
              <button class="botao ${est.modo === v ? 'botao--primario' : 'botao--secundario'} semente-visao" type="button" data-ma-modo="${v}"
                      aria-pressed="${est.modo === v}">${ic}${rot}</button>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function aoMostrar(conteudo, guia) {
    est = est || novoEstado();
    if (guia && guia !== 'calendario') irParaGuia(guia);
    if (est.visao === 'desvios') { Telas.desviosRecomendacao.aoMostrar(conteudo); return; }
    if (est.visao === 'falta') return;
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
    // Quantos filtros cabem na linha, ao lado de Mais filtros e Limpar filtros; muda ao redimensionar a janela ou ao
    // expandir/recolher o menu lateral. Com o menu recolhido, os dois botões mostram o nome; se o nome empurrar um filtro
    // para o Mais filtros, ficam só com o ícone (o nome na dica)
    const encaixar = () => {
      if (!caixaFiltros.isConnected) { observador.disconnect(); return; }
      const cs = getComputedStyle(caixaFiltros);
      const base = caixaFiltros.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const cabem = (livre) => {
        let n = 0;
        let usado = 0;
        while (n < FILTROS.length && usado + MINIMO[FILTROS[n][0]] + 12 <= livre) { usado += MINIMO[FILTROS[n][0]] + 12; n++; }
        return n;
      };
      const acoes = () => caixaFiltros.querySelector('.ma-filtros__acoes').offsetWidth;
      caixaFiltros.classList.remove('ma-filtros--compacto');
      const comNome = cabem(base - acoes());
      caixaFiltros.classList.add('ma-filtros--compacto');
      const soIcone = cabem(base - acoes());
      caixaFiltros.classList.toggle('ma-filtros--compacto', soIcone > comNome);
      const n = Math.max(comNome, soIcone);
      if (n !== visiveis) { visiveis = n; caixaFiltros.innerHTML = filtros(); }
    };
    const observador = new ResizeObserver(encaixar);
    observador.observe(caixaFiltros);
    const ctx = { estado: est };
    fecharMais = () => { est.maisFiltros = false; redesenhar(); };

    raiz.addEventListener('click', (e) => {
      // Mais filtros: abre e fecha o painel Filtros adicionais; o X e o clique fora do painel (e do botão) fecham
      if (e.target.closest('[data-acao="ma-mais"]')) {
        est.maisFiltros = !est.maisFiltros;
        redesenhar(est.maisFiltros ? '.dr-pop .cal-filtro__botao' : '[data-acao="ma-mais"]');
        return;
      }
      if (e.target.closest('[data-acao="ma-fechar-mais"]')) {
        est.maisFiltros = false;
        redesenhar('[data-acao="ma-mais"]');
        return;
      }
      if (est.maisFiltros && !e.target.closest('.dr-pop')) { est.maisFiltros = false; redesenhar(); }
      if (e.target.closest('[data-acao="ma-limpar"]')) {
        // Limpar filtros não muda a guia, a ordenação nem o Visualizar por
        // Os filtros-base voltam ao começo em todas as páginas
        FiltrosBase.limpar();
        est = { ...novoEstado(), visao: est.visao, ordem: est.ordem, duracao: est.duracao, modo: est.modo };
        FiltrosBase.ler(est);
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
      const porDuracao = e.target.closest('[data-ma-duracao]');
      if (porDuracao) {
        const entrou = (est.duracao || 'talhao') !== porDuracao.dataset.maDuracao;
        est.duracao = porDuracao.dataset.maDuracao;
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
      // Visualizar por: Datas · Dias
      const modo = e.target.closest('[data-ma-modo]');
      if (modo) {
        est.modo = modo.dataset.maModo;
        redesenhar(`[data-ma-modo="${est.modo}"]`);
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
      const antes = JSON.stringify(FiltrosBase.CHAVES.map((c) => est[c]));
      est[chave] = marcados.length === valores.length ? 'todos' : marcados;
      // Outro grupo: a Operação volta a todas as operações dos grupos marcados
      if (chave === 'grupo') est.operacao = 'todos';
      // Filtros dependentes: Ano/Atividade › Safra e Cultura; Empresa › Fazenda › Talhão
      podarDependentes(chave);
      // Filtros-base: acompanham para as outras páginas (js/barra-filtros.js)
      if (JSON.stringify(FiltrosBase.CHAVES.map((c) => est[c])) !== antes) FiltrosBase.gravar(est);
      est.filtroAberto = chave;
      est.ultimo = chave;
      redesenhar(`[data-campo="cal-filtro"][data-filtro="${chave}"][value="${CSS.escape(e.target.value)}"]`);
    });

    raiz.addEventListener('input', (e) => Cal().aoDigitar(e, ctx));
    // Esc no painel Filtros adicionais (sem caixa de filtro aberta): fecha e volta ao botão
    raiz.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !est.maisFiltros || raiz.querySelector('.dr-pop .cal-filtro[open]')) return;
      est.maisFiltros = false;
      redesenhar('[data-acao="ma-mais"]');
    });
    // Filtros-base escolhidos nas outras páginas (js/barra-filtros.js): só os que continuam valendo aqui
    FiltrosBase.ler(est);
    validarFiltros();
    redesenhar();
  }
  // Valores marcados que não são opção aqui (ex.: uma fazenda sem planejado e executado) saem; sem nenhum, Todas
  function validarFiltros() {
    [...FiltrosBase.CHAVES, 'talhao'].forEach((c) => {
      if (!Array.isArray(est[c]) || !est[c].length) return;
      const valores = opcoes(c).map((o) => o.valor);
      const ficam = est[c].filter((v) => valores.includes(v));
      est[c] = ficam.length && ficam.length < valores.length ? ficam : 'todos';
    });
  }

  // Clique fora da página (ex.: no cabeçalho ou no menu) com o painel Filtros adicionais aberto: fecha o painel
  let fecharMais = null;
  document.addEventListener('click', (e) => {
    if (!est || !est.maisFiltros || !fecharMais || e.target.closest('.ma')) return;
    if (document.querySelector('.ma .dr-pop')) fecharMais();
  }, true); // na captura: antes de a página se redesenhar (depois, o elemento clicado já saiu da página)

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

  // Para os Desvios de Recomendação: o estado inicial dos filtros (safra atual etc.), somar dias e a execução simulada de
  // uma operação num talhão (data executada, fechamento da OS e a OS escrita nos dados, se houver)
  const estadoInicial = () => novoEstado();
  function execucao(p, talhao, op, g, planejado, iT, i) {
    const s = (sim().talhoes[`${p.fazenda} ${p.safra}`] || {})[talhao] || {};
    const exec = executada(p, talhao, op.nome, planejado, s, i);
    return { executada: exec, fechamento: fechamento(p, talhao, op.nome, exec, Cal().prazoDe(op, g), i), os: osDe(p, talhao, op.nome) || null };
  }

  return { desenhar, aoMostrar, cabecalho, estadoInicial, execucao, somaDias };
})();
