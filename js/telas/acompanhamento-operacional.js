/*
 * Duas guias internas (11/11/2026): Visão Atual das Operações (antes Visão Geral da Operação; abre nela) · Progresso da Operação.
 * Visão Geral: filtros Safra, Cultura, Fazenda (Safra e Fazenda com uma escolha); o Mapa das operações (cada talhão na
 * cor da operação atual, com o nome dela) e a tabela Operação por talhão. Operação atual: a última com OS aberta (aberta
 * ou já fechada), com a área apontada (parcial, se aberta); sem OS aberta, a próxima planejada (0%).
 * Progresso da Operação: o que segue.
 * Gestão da Lavoura › Operações › guia Acompanhamento (11/11/2026; antes Acompanhamento Operacional e Progresso das operações; imagem da usuária "Avanço das Operações"),
 * logo depois do Calendário; endereço #/planejado-executado/acompanhamento. O cabeçalho (título e guias) vem de
 * js/telas/monitoramento-aplicacoes.js.
 *
 * Filtros (barra padronizada): Safra, Fazenda e Operação com uma escolha só (abre na safra atual, na primeira fazenda
 * dela e no Plantio); Cultura com várias; no Mais filtros, Empresa (só com o nível Empresa), Talhão e Grupo de operação.
 * Depois dos filtros, "Operação: Plantio" e:
 *   - os cartões Área executada (verde), Área em execução (azul) e Área planejada (cinza; antes Área restante; três cartões desde 11/11/2026), com a barra e "63% de 10.000 ha planejados";
 *   - Distribuição espacial: o mapa dos talhões da fazenda (o desenho do mapa do Plantio), pintados pela situação da
 *     operação: Executada (verde, OS fechada), Em execução (azul, OS aberta e não fechada), Planejada (cinza; antes Área restante; OS
 *     não aberta); talhão sem a operação, só o contorno. Na dica do talhão em execução, a área apontada ("45 de 85 ha
 *     apontados (53%)", simulada: o protótipo ainda não tem os apontamentos);
 *   - Evolução acumulada: a área executada acumulada (ha) por semana, até hoje.
 * Cartões e gráfico contam só as OS fechadas (a área inteira do talhão); a restante é a planejada menos a executada.
 * Datas de abertura e fechamento: a mesma simulação das outras guias (Telas.monitoramentoAplicacoes.execucao).
 */
window.Telas = window.Telas || {};

window.Telas.acompanhamentoOperacional = (function () {
  const esc = Util.escapar;
  const Cal = () => Telas.calendario;
  const MA = () => Telas.monitoramentoAplicacoes;
  // Filtros (11/11/2026): Safra · Cultura · Fazenda · Talhão · Grupo de operação · Operação, nas duas guias; no Mais
  // filtros, a Empresa (só com o nível Empresa). Operação: uma escolha no Progresso da Operação ('operacao'); várias na
  // Visão Geral ('operacaoV', guardada à parte para uma guia não mudar a outra)
  const FILTROS = [
    ['safra', 'Safra', ['Todas', 'Nenhuma', 'safras'], 100],
    ['cultura', 'Cultura', ['Todas', 'Nenhuma', 'culturas'], 110],
    ['fazenda', 'Fazenda', ['Todas', 'Nenhuma', 'fazendas'], 130],
    ['talhao', 'Talhão', ['Todos', 'Nenhum', 'talhões'], 110],
    ['grupo', 'Grupo de operação', ['Todos', 'Nenhum', 'grupos'], 150],
    ['operacao', 'Operação', ['Todas', 'Nenhuma', 'operações'], 150]
  ];
  const MAIS_FILTROS = [
    ['empresa', 'Empresa', ['Todas', 'Nenhuma', 'empresas']]
  ];
  const UNICOS = ['safra', 'fazenda', 'operacao'];
  const DEPENDE = { cultura: ['safra'], fazenda: ['safra', 'empresa', 'cultura'], talhao: ['safra', 'fazenda'],
    operacao: ['safra', 'cultura', 'fazenda', 'grupo'], operacaoV: ['safra', 'cultura', 'fazenda', 'grupo'] };
  // Nomes e cores dos status do Calendário (11/11/2026): Executada verde, Em execução azul, Planejada cinza
  const COR = { executada: '#1f9d55', execucao: '#1565C0', restante: '#8a948f' };
  const NOME = { executada: 'Executada', execucao: 'Em execução', restante: 'Planejada' };

  let est = null;
  let caixaCorpo = null;
  let mapa = null;
  const novoEstado = () => {
    const e = { sub: 'visao', talhao: 'todos', grupo: 'todos', operacao: 'todos', operacaoV: 'todos', busca: {}, filtroAberto: null };
    FiltrosBase.ler(e);
    return e;
  };
  const marcado = (chave, valor) => Cal().marcado(est, chave, valor);
  const hoje = () => Util.hojeISO();
  const diasEntre = (de, ate) => Math.round((Date.parse(ate) - Date.parse(de)) / 86400000);

  // ----- Planos e opções -----
  const comPublicada = () => DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p));
  const valorDe = { safra: (p) => p.safra, cultura: (p) => p.cultura, empresa: (p) => p.empresa, fazenda: (p) => p.fazenda };
  const passaEm = (p, chaves) => chaves.every((c) => marcado(c, valorDe[c](p)));
  const planosFiltrados = () => comPublicada().filter((p) => passaEm(p, Object.keys(valorDe)));
  const gruposDe = (p) => Versoes.grupos(p, Versoes.ultimaPublicada(p));
  const dapDe = (g, op) => (g.tipo === 'Sementes' ? 0 : g.tipo === 'Colheita' || op.dap === null || op.dap === undefined || op.dap === '' ? Infinity : Number(op.dap));

  function opcoes(chave) {
    if (chave === 'operacaoV') chave = 'operacao';
    const lista = (vals) => vals.map((x) => ({ valor: x, nome: x }));
    if (chave === 'safra') return lista(Util.ordenarSafras(comPublicada().map((p) => p.safra)));
    if (chave === 'cultura') {
      const presentes = new Set(comPublicada().filter((p) => passaEm(p, ['safra'])).map((p) => p.cultura));
      return lista(DADOS.culturasPlanos.filter((c) => presentes.has(c)));
    }
    if (chave === 'empresa') {
      const presentes = new Set(comPublicada().filter((p) => passaEm(p, ['safra'])).map((p) => p.empresa));
      return lista(DADOS.empresas.filter((x) => presentes.has(x)));
    }
    if (chave === 'fazenda') {
      return lista([...new Set(comPublicada().filter((p) => passaEm(p, ['safra', 'empresa', 'cultura'])).map((p) => p.fazenda))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR')));
    }
    if (chave === 'talhao') {
      const vistos = new Map();
      planosFiltrados().forEach((p) => Util.talhoesPlano(p, Versoes.ultimaPublicada(p)).forEach((t) => {
        const valor = `${p.fazenda}|${t.nome}`;
        if (!vistos.has(valor)) vistos.set(valor, { valor, nome: t.nome, extra: Util.area(t.area) });
      }));
      return [...vistos.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
    }
    if (chave === 'grupo') {
      const nomes = [];
      planosFiltrados().forEach((p) => gruposDe(p).forEach((g) => { if (g.operacoes.length && !nomes.includes(g.nome)) nomes.push(g.nome); }));
      return lista(nomes);
    }
    // Operação: as dos grupos marcados, na ordem do DAP (Plantio primeiro entre as do plantio; Colheita no fim)
    const porNome = new Map();
    planosFiltrados().forEach((p) => gruposDe(p).filter((g) => marcado('grupo', g.nome)).forEach((g) => g.operacoes.forEach((op) => {
      if (!op.nome) return;
      const dap = Math.min(porNome.get(op.nome)?.dap ?? Infinity, dapDe(g, op));
      porNome.set(op.nome, { valor: op.nome, nome: op.nome, extra: Number.isFinite(dap) ? `DAP ${dap}` : g.nome, dap,
        plantio: porNome.get(op.nome)?.plantio || g.tipo === 'Sementes' });
    })));
    // Pelo DAP e, no mesmo DAP, em ordem alfabética (11/11/2026); ao lado, "DAP 45" (a Colheita, que vem do ciclo, no fim)
    return [...porNome.values()].sort((a, b) => a.dap - b.dap || a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
  }

  // Operação padrão do Progresso da Operação (11/11/2026): a de data planejada (pelo DAP) mais perto de hoje, nos talhões
  // dos filtros; empate, a primeira em ordem alfabética
  function operacaoDeHoje() {
    const h = hoje();
    const dist = new Map();
    percorrer().forEach((r) => {
      const d = Math.abs(diasEntre(r.planejado, h));
      if (!dist.has(r.nome) || d < dist.get(r.nome)) dist.set(r.nome, d);
    });
    return [...dist.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], 'pt-BR', { numeric: true }))[0]?.[0] || null;
  }
  // Uma escolha só em Safra, Fazenda e Operação: a marcada; senão, Safra a atual, Fazenda a primeira, Operação a de hoje
  const unicos = () => (est.sub === 'visao' ? ['safra', 'fazenda'] : UNICOS);
  function ajustar() {
    unicos().forEach((chave) => {
      const ops = opcoes(chave).map((o) => o.valor);
      const marcadas = est[chave] === 'todos' ? [] : ops.filter((v) => marcado(chave, v));
      const padrao = chave === 'safra' && ops.includes(FiltrosBase.safraAtual()) ? FiltrosBase.safraAtual()
        : chave === 'operacao' ? operacaoDeHoje() : null;
      const valor = (marcadas.length === 1 ? marcadas[0] : null) || padrao || marcadas[0] || ops[0];
      est[chave] = valor ? [valor] : [];
    });
  }

  // ----- A operação escolhida, talhão a talhão -----
  // { talhao, area, situacao: executada | execucao | restante, planejado, executada, fechamento, apontado }
  // Cada operação planejada de cada talhão dos filtros, com a situação: { fazenda, talhao, area, iT, op, nome, g,
  // planejado, executada (abertura da OS), fechamento, situacao: executada | execucao | restante, apontado, ultimo }
  // apontado: a área apontada (fechada, o talhão inteiro; aberta, o apontamento parcial, simulado: uma fração do
  // talhão, a mesma a cada vez); ultimo: a data do último apontamento (fechada, o fechamento; aberta, simulada)
  // grupos: só os marcados no filtro Grupo de operação (Progresso da Operação) ou todos (Visão Geral)
  function percorrer({ grupos: soMarcados = true } = {}) {
    const saida = [];
    planosFiltrados().forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const grupos = Versoes.grupos(p, v);
      const plantio = (grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0] || null;
      Util.talhoesPlano(p, v).forEach((t, iT) => {
        if (!marcado('talhao', `${p.fazenda}|${t.nome}`)) return;
        const base = plantio ? Planos.dataPlantioTalhao(plantio, t.nome) : null;
        grupos.filter((g) => !soMarcados || marcado('grupo', g.nome)).forEach((g) => g.operacoes.forEach((op, iOp) => {
          if (!op.nome) return;
          let planejado = null;
          let i = iT * 3 + iOp;
          if (g.tipo === 'Sementes') {
            if (!Planos.temVariedadePlantio(op, t.nome)) return;
            planejado = base; i = iT;
          } else if (g.tipo === 'Colheita') {
            const variedade = plantio ? (Planos.linhasPlantio(plantio, t.nome).find((l) => l.variedade) || {}).variedade : null;
            const ciclo = (DADOS.variedades.find((x) => x.nome === variedade) || {}).ciclo;
            if (op !== g.operacoes[0] || !base || !ciclo) return;
            planejado = MA().somaDias(base, ciclo); i = iT * 3 + 2;
          } else {
            if (!op.talhoes[t.nome] || !base || op.dap === null || op.dap === undefined || op.dap === '') return;
            planejado = MA().somaDias(base, Number(op.dap));
          }
          if (!planejado) return;
          const { executada, fechamento } = MA().execucao(p, t.nome, op, g, planejado, iT, i);
          const situacao = fechamento ? 'executada' : executada ? 'execucao' : 'restante';
          const apontado = situacao === 'executada' ? t.area
            : situacao === 'execucao' ? Math.round(t.area * [0.25, 0.4, 0.55, 0.7, 0.85][(iT + iOp) % 5]) : 0;
          const ultimo = situacao === 'executada' ? fechamento
            : situacao === 'execucao' ? [MA().somaDias(executada, ((iT + iOp) % 4) + 1), hoje()].sort()[0] : null;
          saida.push({ fazenda: p.fazenda, talhao: t.nome, area: t.area, iT, op, nome: op.nome, g, planejado, executada, fechamento,
            situacao, apontado, ultimo, dap: base ? diasEntre(base, planejado) : null });
        }));
      });
    });
    return saida;
  }
  // Progresso da Operação: a operação escolhida, talhão a talhão
  function talhoesDaOperacao() {
    const nomeOp = Array.isArray(est.operacao) ? est.operacao[0] : null;
    return nomeOp ? percorrer().filter((r) => r.nome === nomeOp) : [];
  }
  // Visão Geral da Operação: a operação atual de cada talhão = a última com OS aberta (aberta ou já fechada; a de
  // abertura mais recente); sem nenhuma OS aberta, a próxima planejada (0 ha, 0%)
  function operacaoAtualPorTalhao() {
    const porTalhao = new Map();
    percorrer().filter((r) => marcado('operacaoV', r.nome)).forEach((r) => {
      const k = `${r.fazenda}|${r.talhao}`;
      if (!porTalhao.has(k)) porTalhao.set(k, []);
      porTalhao.get(k).push(r);
    });
    return [...porTalhao.values()].map((ops) => {
      const abertas = ops.filter((r) => r.executada).sort((a, b) => b.executada.localeCompare(a.executada) || b.planejado.localeCompare(a.planejado));
      return abertas[0] || ops.sort((a, b) => a.planejado.localeCompare(b.planejado))[0];
    }).sort((a, b) => a.fazenda.localeCompare(b.fazenda, 'pt-BR') || a.talhao.localeCompare(b.talhao, 'pt-BR', { numeric: true }));
  }

  // Cor de cada operação (Visão Atual; 11/11/2026, imagem da usuária): tons pastel (amarelo, azul, pêssego, verde, lilás,
  // bege, verde-água, rosa), com texto escuro. Cada operação do modelo recebe uma das 8 pela ordem do plano (DAP), em
  // ciclo, numa ordem que alterna tons para as operações vizinhas no tempo (as que aparecem juntas no mapa) ficarem com
  // cores diferentes. A cor não vem do grupo; o nome vai sempre escrito no talhão e na tabela. Operação fora do
  // modelo: uma das 8, pelo nome.
  const PALETA_CLARO = ['#FEE795', '#A9CDF5', '#F8BE92', '#B6E3A0', '#C9B4F2', '#E6D3BE', '#A6DED6', '#F5B8CF'];
  const PALETA_ESCURO = PALETA_CLARO;
  const ORDEM_PLANO = (() => {
    const lista = [];
    (DADOS.modeloOperacoes || []).forEach((g) => g.operacoes.forEach((op) => lista.push({ nome: op.nome, dap: dapDe(g, op) })));
    return lista.sort((a, b) => a.dap - b.dap).map((o) => o.nome);
  })();
  const ordemModelo = (nome) => (ORDEM_PLANO.includes(nome) ? ORDEM_PLANO.indexOf(nome) : 99);
  function corOperacao(nome) {
    const k = ORDEM_PLANO.includes(nome) ? ORDEM_PLANO.indexOf(nome) : [...nome].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7);
    const paleta = document.documentElement.dataset.tema === 'escuro' ? PALETA_ESCURO : PALETA_CLARO;
    return paleta[k % paleta.length];
  }
  function textoSobre(hex) {
    const [r, g, b] = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return (1.05) / (lum + 0.05) >= (lum + 0.05) / 0.05 ? '#ffffff' : '#1a1f1c';
  }
  // Nome resumido no mapa (11/11/2026): "1ª Fung.", "2ª Pós-emerg.", "1ª Ad. foliar", "TS"…; o nome inteiro na dica e na legenda
  function resumir(nome) {
    if (nome === 'Tratamento de sementes') return 'TS';
    return nome.replace(/Dessecação: pré-plantio/, 'Dessec.').replace(/Adubação potássica/, 'Ad. K').replace(/Adubação/, 'Ad.')
      .replace(/Fungicida/, 'Fung.').replace(/emergente/, 'emerg.').replace(/Gradagem niveladora/, 'Gradagem');
  }

  // "· DAP: 45" ao lado do nome da operação (o DAP dos talhões dos filtros; se variar, "DAP: 118 a 125")
  function textoDap(ls) {
    const daps = ls.map((r) => r.dap).filter((d) => d !== null && d !== undefined);
    if (!daps.length) return '';
    const min = Math.min(...daps); const max = Math.max(...daps);
    return ` <span class="ao-operacao__dap">· DAP: ${min === max ? min : `${min} a ${max}`}</span>`;
  }

  // Expandir e recolher os quadros (11/11/2026): em cada quadro (mapa, tabela, gráfico), um botão. Expandido, o quadro
  // ocupa a largura toda e fica em cima; o outro também passa à largura toda, embaixo. Com os dois na largura toda, o botão
  // de qualquer um recolhe: volta ao estado inicial, lado a lado. Cada guia interna guarda o seu (est.expandidoV,
  // est.expandidoP: o quadro que foi expandido, o de cima)
  const chaveExpandido = () => (est.sub === 'visao' ? 'expandidoV' : 'expandidoP');
  const botaoExpandir = (quadro, nome) => {
    const grande = !!est[chaveExpandido()];
    return `<button class="botao-icone ao-expandir" type="button" data-ao-expandir="${quadro}" aria-pressed="${grande}"
      title="${grande ? 'Recolher (lado a lado)' : `Expandir ${nome}`}" aria-label="${grande ? 'Recolher (lado a lado)' : `Expandir ${nome}`}">${grande ? Icones.reduzir : Icones.ampliar}</button>`;
  };
  // Classes da grade dos quadros e de cada quadro (o expandido vem primeiro)
  const classeQuadros = () => (est[chaveExpandido()] ? 'ao-quadros--empilhado' : '');
  const classeQuadro = (quadro) => (est[chaveExpandido()] === quadro ? 'ao-quadro--expandido' : '');

  // ----- Desenho -----
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  function cartao(classe, titulo, ha, total) {
    return `
      <section class="cartao ao-cartao ao-cartao--${classe}">
        <div class="ao-cartao__textos">
          <h3 class="ao-cartao__titulo">${titulo}</h3>
          <p class="ao-cartao__numero">${Util.area(ha)}</p>
        </div>
        <!-- 11/11/2026, imagem da usuária: a barra e, embaixo dela, à direita, "50% de 983 ha" -->
        <div class="ao-cartao__lado">
          <div class="ao-cartao__barra" role="img" aria-label="${pct(ha, total)}%"><span style="width: ${pct(ha, total)}%"></span></div>
          <p class="ao-cartao__texto">${pct(ha, total)}% de ${Util.area(total)}</p>
        </div>
      </section>`;
  }

  // Evolução acumulada: a área das OS fechadas, somada pela data de fechamento, numa marca por semana até hoje
  // largura: a do quadro, em px (o gráfico é desenhado no tamanho real, sem esticar letras e pontos)
  function grafico(ls, total, largura = 640) {
    const fechadas = ls.filter((l) => l.situacao === 'executada').sort((a, b) => a.fechamento.localeCompare(b.fechamento));
    const datas = ls.map((l) => l.planejado).filter(Boolean).sort();
    const h = hoje();
    if (!datas.length || datas[0] > h) {
      return '<p class="ao-vazio">A operação ainda não começou: nenhuma área executada.</p>';
    }
    const inicio = [datas[0], fechadas[0]?.fechamento].filter(Boolean).sort()[0];
    // Marcas: de 7 em 7 dias, terminando hoje (a primeira, a semana do começo)
    const marcas = [];
    for (let d = h; d >= inicio || marcas.length < 2; d = MA().somaDias(d, -7)) { marcas.unshift(d); if (marcas.length > 26) break; }
    if (marcas[0] > inicio) marcas.unshift(MA().somaDias(marcas[0], -7));
    const acumulado = (d) => fechadas.filter((l) => l.fechamento <= d).reduce((s, l) => s + l.area, 0);
    const pontos = marcas.map((d) => ({ d, v: acumulado(d) }));
    // Escala do eixo: até a área planejada, em passos redondos
    const passo = [10, 20, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000].find((p) => p * 5 >= total) || 10000;
    const topo = Math.max(passo, Math.ceil(total / passo) * passo);
    // Margens: em cima e à direita, espaço para o balão do último ponto ficar inteiro, centrado acima dele
    // Alinhado à esquerda e cobrindo a largura toda do quadro; altura fixa
    // L: o título do eixo Y ("Área (ha)", na vertical) e os números
    const L = 60, T = 44, W = Math.max(320, largura), H = 264, R = 46, B = 30;
    const x = (i) => L + (i / (pontos.length - 1)) * (W - L - R);
    const y = (v) => T + (1 - v / topo) * (H - T - B);
    const linha = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    const area = `${linha} L${x(pontos.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
    const grade = [];
    for (let v = 0; v <= topo; v += passo) grade.push(v);
    const ddmm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
    // Rótulos do eixo X: no máximo 8 (pula alguns, se forem muitas semanas)
    const pulo = Math.ceil(pontos.length / 8);
    const ultimo = pontos[pontos.length - 1];
    return `
      <svg class="ao-grafico" viewBox="0 0 ${W} ${H}" role="img" aria-label="Área executada acumulada: ${Util.area(ultimo.v)} até ${ddmm(ultimo.d)}">
        ${grade.map((v) => `<line class="ao-grafico__grade" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"></line>
          <text class="ao-grafico__eixo" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v.toLocaleString('pt-BR')}</text>`).join('')}
        <text class="ao-grafico__titulo-eixo" transform="translate(12, ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle">Área (ha)</text>
        <path class="ao-grafico__area" d="${area}"></path>
        <path class="ao-grafico__linha" d="${linha}"></path>
        ${pontos.map((p, i) => `
          <g class="ao-grafico__ponto ${i === pontos.length - 1 ? 'ao-grafico__ponto--hoje' : ''}">
            <circle cx="${x(i)}" cy="${y(p.v)}" r="${i === pontos.length - 1 ? 5 : 4}"><title>${ddmm(p.d)}: ${Util.area(p.v)} executados</title></circle>
          </g>
          ${i % pulo === 0 || i === pontos.length - 1 ? `<text class="ao-grafico__eixo" x="${x(i)}" y="${H - 10}" text-anchor="middle">${ddmm(p.d)}</text>` : ''}`).join('')}
        <!-- Balão do último dia: centrado acima do ponto, com a ponta para ele -->
        <g class="ao-grafico__balao" transform="translate(${x(pontos.length - 1)}, ${y(ultimo.v) - 12})">
          <rect x="-40" y="-26" width="80" height="24" rx="5"></rect>
          <path d="M-5,-2 L5,-2 L0,4 Z"></path>
          <text x="0" y="-9" text-anchor="middle">${Util.area(ultimo.v)}</text>
        </g>
      </svg>`;
  }

  function corpo() {
    const ls = talhoesDaOperacao();
    const nomeOp = Array.isArray(est.operacao) && est.operacao[0];
    if (!nomeOp) return '<p class="ao-vazio cartao">Nenhuma operação planejada com esses filtros.</p>';
    const total = ls.reduce((s, l) => s + l.area, 0);
    const areaDe = (sit) => ls.filter((l) => l.situacao === sit).reduce((s, l) => s + l.area, 0);
    const executada = areaDe('executada');
    const legenda = ['executada', 'execucao', 'restante'].map((s) => `
      <li><span class="mapa-legenda__cor" style="background: ${COR[s]}"></span>${NOME[s]}</li>`).join('');
    // Nos títulos dos quadros (11/11/2026): "Distribuição espacial · 1ª Fungicida · DAP: 40"
    // O nome da operação em negrito; o "·" e o DAP em cinza, sem negrito
    const opDoQuadro = ` <span class="ao-quadro__op">· <strong>${esc(nomeOp)}</strong>${textoDap(ls).replace(/<[^>]+>/g, '')}</span>`;
    return `
      <h2 class="ao-operacao"><strong>Operação:</strong> ${esc(nomeOp)}${textoDap(ls)}</h2>
      ${!ls.length ? '<p class="ao-vazio cartao">Nenhum talhão com essa operação planejada nos filtros.</p>' : `
      <div class="ao-cartoes">
        ${cartao('executada', 'Área executada', executada, total)}
        ${cartao('execucao', 'Área em execução', areaDe('execucao'), total)}
        ${cartao('restante', 'Área planejada', areaDe('restante'), total)}
      </div>
      <div class="ao-quadros ${classeQuadros()}">
        <section class="cartao ao-quadro ${classeQuadro('mapa')}">
          <div class="ao-quadro__topo">
            <h3 class="ao-quadro__titulo">Distribuição espacial${opDoQuadro}</h3>
            ${botaoExpandir('mapa', 'o mapa')}
          </div>
          <div class="ao-mapa mapa" data-ao-mapa role="region" aria-label="Mapa dos talhões pela situação da operação"></div>
          <ul class="mapa-legenda ao-legenda" aria-label="Legenda">${legenda}</ul>
        </section>
        <section class="cartao ao-quadro ${classeQuadro('grafico')}">
          <div class="ao-quadro__topo">
            <h3 class="ao-quadro__titulo">Evolução acumulada${opDoQuadro}</h3>
            ${botaoExpandir('grafico', 'o gráfico')}
          </div>
          <p class="ao-quadro__sub">Área executada acumulada (ha)</p>
          <div class="ao-grafico-caixa" data-ao-grafico></div>
        </section>
      </div>`}`;
  }

  // ----- Mapa (o desenho dos talhões do mapa do Plantio) -----
  const SATELITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  function montarMapa() {
    if (mapa) { mapa.remove(); mapa = null; }
    const el = caixaCorpo && caixaCorpo.querySelector('[data-ao-mapa]');
    if (!el) return;
    const fazenda = Array.isArray(est.fazenda) ? est.fazenda[0] : null;
    const poligonos = fazenda ? Telas.planoOperacoes.poligonosFazenda(fazenda) : [];
    if (!window.L) { el.innerHTML = `<p class="mapa__sem">${Icones.info} Mapa indisponível: sem conexão com a internet.</p>`; return; }
    if (!poligonos.length) { el.innerHTML = `<p class="mapa__sem">${Icones.info} A Fazenda ${esc(fazenda || '')} ainda não tem o desenho dos talhões.</p>`; return; }
    const visao = est.sub === 'visao';
    const ls = visao ? operacaoAtualPorTalhao() : talhoesDaOperacao();
    // zoomSnap fracionado: os talhões enchem o quadro (no zoom inteiro, sobrava muito em volta)
    mapa = L.map(el, { zoomControl: true, zoomSnap: 0.1 });
    L.tileLayer(SATELITE, { maxZoom: 18, attribution: 'Imagens © Esri, Maxar, Earthstar Geographics' }).addTo(mapa);
    const pontos = [];
    poligonos.forEach((pg) => {
      const l = ls.find((x) => x.fazenda === fazenda && x.talhao === pg.talhao);
      const poligono = L.polygon(pg.coords, l
        ? { color: '#ffffff', weight: 1.5, fillColor: visao ? corOperacao(l.nome) : COR[l.situacao], fillOpacity: visao ? 0.9 : l.situacao === 'restante' ? 0.85 : 0.9 }
        : { color: '#ffffff', weight: 1, dashArray: '4 4', fillOpacity: 0 }).addTo(mapa);
      const detalhe = visao ? (l ? `${l.nome} · ${Util.area(l.apontado).replace(' ha', '')} de ${Util.area(l.area)} (${pct(l.apontado, l.area)}%)${l.ultimo ? ` · último apontamento ${Util.data(l.ultimo)}` : ' · ainda não iniciada'}` : 'Sem operação planejada')
        : !l ? 'Sem a operação'
        : l.situacao === 'executada' ? `Executada · ${Util.area(l.area)} · ${Util.data(l.executada)} - ${Util.data(l.fechamento)}`
        : l.situacao === 'execucao' ? `Em execução · ${Util.area(l.apontado).replace(' ha', '')} de ${Util.area(l.area)} apontados (${pct(l.apontado, l.area)}%)`
        : `Planejada · ${Util.area(l.area)} · para ${Util.data(l.planejado)}`;
      poligono.bindTooltip(`<strong>${esc(pg.talhao)}</strong> · ${esc(detalhe)}`, { sticky: true, direction: 'top', className: 'mapa-detalhe' });
      // Visão Geral: o talhão e, embaixo, a operação atual
      const rotulo = visao && l ? `<span class="ao-rotulo" style="color: ${textoSobre(corOperacao(l.nome))}"><strong>${esc(pg.talhao)}</strong><span>${esc(resumir(l.nome))}</span></span>` : esc(pg.talhao);
      L.marker(pg.centro, { interactive: false, keyboard: false, icon: L.divIcon({ className: visao && l ? 'ao-rotulo-mapa' : 'mapa-rotulo', html: rotulo, iconSize: null }) }).addTo(mapa);
      pontos.push(...pg.coords);
    });
    mapa.fitBounds(L.latLngBounds(pontos), { padding: [12, 12] });
  }

  function atualizar() {
    if (!caixaCorpo || !caixaCorpo.isConnected) return;
    caixaCorpo.innerHTML = est.sub === 'visao' ? corpoVisao() : corpo();
    desenharGrafico();
    montarMapa();
  }
  // O gráfico na largura do quadro; refeito quando o quadro muda de tamanho (janela, menu, mapa expandido)
  function desenharGrafico() {
    const el = caixaCorpo && caixaCorpo.querySelector('[data-ao-grafico]');
    if (!el || !el.clientWidth) return;
    const ls = talhoesDaOperacao();
    el.innerHTML = grafico(ls, ls.reduce((s, l) => s + l.area, 0), el.clientWidth);
  }
  let larguraGrafico = 0;
  const observador = new ResizeObserver(() => {
    const el = caixaCorpo && caixaCorpo.isConnected && caixaCorpo.querySelector('[data-ao-grafico]');
    if (el && el.clientWidth && el.clientWidth !== larguraGrafico) { larguraGrafico = el.clientWidth; desenharGrafico(); }
  });

  // ----- Visão Geral da Operação -----
  function corpoVisao() {
    const ls = operacaoAtualPorTalhao();
    if (!ls.length) return '<p class="ao-vazio cartao">Nenhum talhão com operações planejadas nos filtros.</p>';
    // Legenda em ordem alfabética (11/11/2026)
    const presentes = [...new Set(ls.map((r) => r.nome))].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
    const etiqueta = (nome) => `<span class="ao-etiqueta" style="background: ${corOperacao(nome)}; color: ${textoSobre(corOperacao(nome))}">${esc(nome)}</span>`;
    return `
      <div class="ao-quadros ao-quadros--visao ${classeQuadros()}">
        <section class="cartao ao-quadro ${classeQuadro('mapa')}">
          <div class="ao-quadro__topo">
            <h3 class="ao-quadro__titulo">Mapa das operações</h3>
            ${botaoExpandir('mapa', 'o mapa')}
          </div>
          <p class="ao-quadro__sub">Última operação com execução apontada na OS por talhão.</p>
          <div class="ao-mapa ao-mapa--visao mapa" data-ao-mapa role="region" aria-label="Mapa dos talhões pela operação atual"></div>
          <ul class="mapa-legenda ao-legenda" aria-label="Legenda">${presentes.map((n) => `
            <li><span class="mapa-legenda__cor" style="background: ${corOperacao(n)}"></span>${esc(n)}</li>`).join('')}</ul>
        </section>
        <section class="cartao ao-quadro ${classeQuadro('tabela')}">
          <div class="ao-quadro__topo">
            <h3 class="ao-quadro__titulo">Operação por talhão</h3>
            ${botaoExpandir('tabela', 'a tabela')}
          </div>
          <p class="ao-quadro__sub">Última operação com execução apontada na OS por talhão.</p>
          <div class="tabela-rolagem">
            <table class="tabela ao-tabela">
              <thead><tr><th>Fazenda</th><th>Talhão</th><th>Operação atual</th><th class="tabela__numero">Área planejada</th>
                <th class="tabela__numero">Área executada</th><th class="tabela__numero">% Apontado</th><th>Último apontamento</th></tr></thead>
              <tbody>${ls.map((r) => `
                <tr><td>${esc(r.fazenda)}</td><td>${esc(r.talhao)}</td><td>${etiqueta(r.nome)}</td>
                  <td class="tabela__numero">${Util.area(r.area)}</td><td class="tabela__numero">${Util.area(r.apontado)}</td>
                  <td class="tabela__numero">${pct(r.apontado, r.area)}%</td><td>${r.ultimo ? Util.data(r.ultimo) : '—'}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </section>
      </div>`;
  }

  const barra = BarraFiltros.criar({
    id: 'ao',
    estado: () => est,
    // Visão Geral: Safra, Cultura e Fazenda; no Mais filtros, Empresa e Talhão. Progresso da Operação: com a Operação
    campos: () => (est.sub === 'visao' ? FILTROS.map((f) => (f[0] === 'operacao' ? ['operacaoV', ...f.slice(1)] : f)) : FILTROS),
    mais: () => MAIS_FILTROS,
    unicos,
    opcoes,
    depende: DEPENDE,
    padrao: () => ({ talhao: 'todos', grupo: 'todos', operacao: 'todos', operacaoV: 'todos' }),
    aoMudar: () => { ajustar(); FiltrosBase.gravar(est, ['safra', 'fazenda']); barra.redesenhar(); atualizar(); }
  });

  // cab: o cabeçalho da página (título e guias)
  function desenhar(cab = '') {
    est = est || novoEstado();
    return `
      ${cab}
      <div class="pagina ma ao">
        <nav class="ao-subguias" aria-label="Guias do Acompanhamento" data-ao-subguias>${subguias()}</nav>
        <section class="cartao filtros" aria-label="Filtrar o acompanhamento" data-ao-filtros></section>
        <div class="ao__corpo" data-ao-corpo></div>
      </div>`;
  }

  function aoMostrar(conteudo) {
    est = est || novoEstado();
    FiltrosBase.ler(est);
    ajustar();
    barra.ligar(conteudo.querySelector('[data-ao-filtros]'));
    caixaCorpo = conteudo.querySelector('[data-ao-corpo]');
    observador.disconnect();
    observador.observe(caixaCorpo);
    trocarSubtitulo(conteudo);
    atualizar();
    // Expandir e recolher os quadros (o mapa, a tabela, o gráfico)
    caixaCorpo.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ao-expandir]');
      if (!b) return;
      const chave = chaveExpandido();
      est[chave] = est[chave] ? null : b.dataset.aoExpandir;
      atualizar();
      caixaCorpo.querySelector(`[data-ao-expandir="${b.dataset.aoExpandir}"]`)?.focus();
    });
    // Guias internas: troca a guia (os filtros ficam; cada guia mostra os dela)
    conteudo.querySelector('[data-ao-subguias]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-ao-sub]');
      if (!b || b.dataset.aoSub === est.sub) return;
      est.sub = b.dataset.aoSub;
      trocarSubtitulo(conteudo);
      ajustar();
      e.currentTarget.innerHTML = subguias();
      e.currentTarget.querySelector(`[data-ao-sub="${est.sub}"]`)?.focus();
      barra.redesenhar();
      atualizar();
    });
  }
  const SUBGUIAS = [['visao', 'Visão Atual das Operações'], ['progresso', 'Progresso da Operação']];
  // Subtítulo da página (o do cabeçalho de Operações), conforme a guia interna (11/11/2026)
  const SUBTITULO = {
    visao: 'Visualize a última operação registrada na Ordem de Serviço de cada talhão e sua distribuição espacial.',
    progresso: 'Acompanhe a área executada, em execução e planejada e a evolução ao longo do tempo da operação selecionada.'
  };
  function trocarSubtitulo(conteudo) {
    const p = conteudo.querySelector('[data-ma-cabecalho] .cabecalho__subtitulo');
    if (p) p.textContent = SUBTITULO[est.sub];
  }
  function subguias() {
    return SUBGUIAS.map(([id, nome]) => `<button class="ao-subguia ${id === est.sub ? 'ao-subguia--ativa' : ''}" type="button" data-ao-sub="${id}"
      aria-pressed="${id === est.sub}">${nome}</button>`).join('');
  }

  return { desenhar, aoMostrar };
})();
