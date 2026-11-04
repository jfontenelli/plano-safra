/*
 * Duas visões do plano aberto (a versão aberta), cada uma desenhada dentro de outra tela, que repassa os eventos para cá:
 *  - Planejamento › Plantio › Indicadores (docs/telas/04.2-operacoes-sementes.md): os cartões Plantio e Colheita
 *    (período) e a distribuição da área (barras por dia, quinzena ou mês, de plantio ou de colheita).
 *  - Resumo › Produtos (docs/telas/05-calendario-agricola.md): o Planejamento de produto (necessidade de consumo de
 *    cada insumo, com a mesma conta do Orçamento), filtrado pela legenda dos grupos de insumo.
 */
window.Telas = window.Telas || {};

window.Telas.indicadores = (function () {
  const esc = Util.escapar;
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const POR_PAGINA = [10, 25, 50];
  const fmt = (n, casas = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  const ha = (n) => `${fmt(Math.round(n))} ha`;

  // ----- Datas -----
  const data = (iso) => new Date(`${iso}T12:00`);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const somaDias = (i, n) => { const d = data(i); d.setDate(d.getDate() + n); return iso(d); };
  const dias = (a, b) => Math.round((data(b) - data(a)) / 86400000);
  const diaMes = (i) => { const d = data(i); return `${String(d.getDate()).padStart(2, '0')}/${MESES[d.getMonth()]}`; };
  const diaMesAno = (i) => `${diaMes(i)}/${data(i).getFullYear()}`;
  // Período previsto: { datas: "17/dez/2026 – 14/jan/2027", duracao: "Duração: 29 dias" } (contando os dois dias)
  function periodo(datas) {
    if (!datas.length) return null;
    const ord = [...datas].sort();
    const [ini, fim] = [ord[0], ord[ord.length - 1]];
    const n = dias(ini, fim) + 1;
    return { datas: `${diaMesAno(ini)} – ${diaMesAno(fim)}`, duracao: `Duração: ${fmt(n)} ${n === 1 ? 'dia' : 'dias'}` };
  }

  // ----- Plantio e colheita: uma linha por variedade de cada talhão (área, data de plantio, previsão de colheita) -----
  function linhasPlantio(ctx) {
    const op = (ctx.plano.grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0];
    if (!op) return [];
    return ctx.talhoes.flatMap((t) => {
      const linhas = Planos.linhasPlantio(op, t.nome);
      return linhas.map((l, i) => {
        if (!l.variedade) return null;
        const v = DADOS.variedades.find((x) => x.nome === l.variedade);
        const area = Planos.areaLinhaPlantio(linhas, i, t.area) || 0;
        return { area, plantio: l.data || null, colheita: l.data && v && v.ciclo ? somaDias(l.data, v.ciclo) : null };
      }).filter(Boolean);
    });
  }

  // ----- Área no tempo: soma da área por período (dia, quinzena ou mês). Mês e quinzena mostram os períodos vazios
  // no meio (o tempo não pula); o Dia mostra só os dias com área -----
  // Dia: "05/10/2026"; quinzena: 1–15 e 16–fim ("16–31/dez/2026"); mês: "out/26"
  function inicioPeriodo(i, gran) {
    const d = data(i);
    if (gran === 'mes') return iso(new Date(d.getFullYear(), d.getMonth(), 1, 12));
    if (gran === 'quinzena') return iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() <= 15 ? 1 : 16, 12));
    return i;
  }
  function proximoPeriodo(i, gran) {
    const d = data(i);
    if (gran === 'mes') return iso(new Date(d.getFullYear(), d.getMonth() + 1, 1, 12));
    if (gran === 'quinzena') return d.getDate() === 1 ? iso(new Date(d.getFullYear(), d.getMonth(), 16, 12)) : iso(new Date(d.getFullYear(), d.getMonth() + 1, 1, 12));
    return somaDias(i, 1);
  }
  function rotuloPeriodo(i, gran) {
    const d = data(i);
    if (gran === 'mes') return `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
    if (gran === 'quinzena') {
      const fim = d.getDate() === 1 ? 15 : new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return `${String(d.getDate()).padStart(2, '0')}–${fim}/${MESES[d.getMonth()]}/${d.getFullYear()}`;
    }
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  function barras(linhas, campo, gran) {
    const comData = linhas.filter((l) => l[campo]);
    if (!comData.length) return [];
    const soma = new Map();
    comData.forEach((l) => { const k = inicioPeriodo(l[campo], gran); soma.set(k, (soma.get(k) || 0) + l.area); });
    const chaves = [...soma.keys()].sort();
    if (gran === 'dia') return chaves.map((k) => ({ inicio: k, rotulo: rotuloPeriodo(k, gran), area: soma.get(k) }));
    const lista = [];
    for (let k = chaves[0]; k <= chaves[chaves.length - 1]; k = proximoPeriodo(k, gran)) {
      lista.push({ inicio: k, rotulo: rotuloPeriodo(k, gran), area: soma.get(k) || 0 });
    }
    return lista;
  }

  // Eixo: de 0 até um valor redondo acima do maior (5 marcas)
  function escala(max) {
    if (!max) return { topo: 1, passo: 1 };
    const bruto = max / 4;
    const mag = 10 ** Math.floor(Math.log10(bruto));
    const passo = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= bruto);
    return { topo: Math.ceil(max / passo) * passo, passo };
  }

  // ----- Planejamento de produto: necessidade de consumo por produto (a conta do Orçamento, na versão aberta) -----
  function produtos(ctx) {
    const mapa = new Map();
    Telas.orcamento.consumoDoPlano(ctx.plano, ctx.plano.grupos, ctx.talhoes).forEach((i) => {
      if (!i.quantidade) return;
      const x = mapa.get(i.produto) || { grupo: i.grupo, produto: i.produto, unidade: i.unidade, necessidade: 0 };
      x.necessidade += i.quantidade;
      mapa.set(i.produto, x);
    });
    return [...mapa.values()];
  }
  // Colunas: [id, título, valor para ordenar, número?]. Sem escolha: na ordem dos grupos de insumo e do produto
  const COLUNAS = [
    ['grupo', 'Grupo de insumo', (l) => l.grupo],
    ['produto', 'Produto', (l) => l.produto],
    ['necessidade', 'Necessidade de consumo', (l) => l.necessidade, true],
    ['unidade', 'Unidade', (l) => l.unidade]
  ];
  function ordenados(ls, ordem) {
    const texto = (a, b) => String(a).localeCompare(String(b), 'pt-BR', { numeric: true });
    if (!ordem) return [...ls].sort((a, b) => texto(a.grupo, b.grupo) || texto(a.produto, b.produto));
    const [, , valor, numero] = COLUNAS.find(([id]) => id === ordem.coluna);
    const sinal = ordem.sentido === 'asc' ? 1 : -1;
    return [...ls].sort((a, b) => sinal * (numero ? valor(a) - valor(b) : texto(valor(a), valor(b))));
  }
  // Quantidade: sem casas a partir de 100; com uma casa abaixo
  const quantidade = (n) => fmt(n, n >= 100 ? 0 : 1);

  function estadoPadrao(ctx) {
    ctx.estado.ind = ctx.estado.ind || { serie: 'plantio', gran: 'mes', insumo: 'todos', produto: 'todos', ordem: null, pagina: 1, porPagina: 10 };
    return ctx.estado.ind;
  }

  // ----- Desenho: Indicadores (no Plantio) -----
  function desenhar(ctx) {
    const est = estadoPadrao(ctx);
    const linhas = linhasPlantio(ctx);
    const plantadas = linhas.filter((l) => l.plantio);
    const comColheita = linhas.filter((l) => l.colheita);
    // Nenhum talhão com variedade e data de plantio: estado vazio no centro, com o botão que leva à Tabela do Plantio
    if (!plantadas.length) {
      return `
        <div class="resumo-vazio ind-sem-plantio">
          <span class="resumo-vazio__icone" aria-hidden="true">${Icones.broto}</span>
          <h3 class="resumo-vazio__titulo">Nenhum planejamento de plantio cadastrado</h3>
          <p class="resumo-vazio__texto">Defina as variedades e data de plantio para visualizar a previsão de plantio e colheita.</p>
          ${ctx.irParaTabela ? `<button class="botao botao--primario" type="button" data-acao="ind-ir-tabela">Ir para o Planejamento ${Icones.seta}</button>` : ''}
        </div>`;
    }
    return `
      <section class="ind">
        <h2 class="ind__titulo">Indicadores do planejamento</h2>
        <p class="ind__sub">Visão consolidada da área e dos períodos previstos do plano de safra.</p>
        <div class="ind-cartoes">
          ${cartao(Icones.broto, 'Plantio', periodo(plantadas.map((l) => l.plantio)), 'Nenhum talhão com data de plantio ainda.')}
          ${cartao(Icones.colheita, 'Colheita', periodo(comColheita.map((l) => l.colheita)), 'Sem previsão: falta a data de plantio ou o ciclo da variedade.')}
        </div>
        ${grafico(linhas, est)}
      </section>`;
  }

  // ----- Desenho: Produtos (no Resumo) -----
  // Guia Produtos (04/11/2026): filtros Insumos (os grupos de insumo, como no Orçamento) e Produto (os dos insumos
  // marcados), caixas de várias escolhas com Pesquisar, e Limpar filtros (no lugar da legenda colorida, que filtrava)
  function desenharProdutos(ctx) {
    const est = estadoPadrao(ctx);
    const todos = produtos(ctx);
    // A busca e a caixa aberta ficam no estado do Resumo (é ele que o Calendário atualiza ao digitar e ao abrir)
    const caixa = { ...est, busca: ctx.estado.busca || {}, filtroAberto: ctx.estado.filtroAberto };
    const campo = (chave, rotulo, textos) => `
            <div class="campo">
              <span class="campo__rotulo">${rotulo}</span>
              ${Telas.calendario.filtroCaixa(caixa, chave, opcoesProdutos(todos, est, chave), textos, rotulo)}
            </div>`;
    return `
      ${todos.length ? `
      <div class="cartao filtros filtros--plano ind-filtros">
        ${campo('insumo', 'Insumos', ['Todos', 'Nenhum', 'insumos'])}
        ${campo('produto', 'Produto', ['Todos', 'Nenhum', 'produtos'])}
        <div class="bf__acoes bf__acoes--texto">
          <button class="botao botao--secundario bf__botao bf__limpar bf__limpar--so" type="button" data-acao="ind-limpar"
                  title="Limpar filtros" aria-label="Limpar filtros">${Icones.limpar}<span class="bf__texto">Limpar filtros</span></button>
        </div>
      </div>` : ''}
      <section class="ind">${tabelaProdutos(ctx, est)}</section>`;
  }
  // Opções: Insumos na ordem do cadastro de grupos de insumo; Produto, os dos insumos marcados, em ordem alfabética
  function opcoesProdutos(todos, est, chave) {
    if (chave === 'insumo') return [...new Set(todos.map((l) => l.grupo))].sort((a, b) => posGrupo(a) - posGrupo(b)).map((g) => ({ valor: g, nome: g }));
    return [...new Set(todos.filter((l) => Telas.calendario.marcado(est, 'insumo', l.grupo)).map((l) => l.produto))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR')).map((n) => ({ valor: n, nome: n }));
  }
  const passaProduto = (est) => (l) => Telas.calendario.marcado(est, 'insumo', l.grupo) && Telas.calendario.marcado(est, 'produto', l.produto);

  // Grupos de insumo na ordem do cadastro (os que não estão no cadastro, no fim) e a classe da cor de cada um
  const posGrupo = (g) => { const i = DADOS.gruposInsumo.indexOf(g); return i < 0 ? 99 : i; };
  const classeGrupo = (g) => Util.normalizar(g).replace(/[^a-z0-9]+/g, '-');
  // Plantio e Colheita: o período previsto e a duração; sem datas, um traço e o motivo
  function cartao(icone, titulo, per, semDatas) {
    return `
      <div class="cartao ind-cartao">
        <span class="ind-cartao__icone" aria-hidden="true">${icone}</span>
        <div>
          <h3 class="ind-cartao__titulo">${titulo}</h3>
          <p class="ind-cartao__rotulo">Período previsto</p>
          <p class="ind-cartao__valor">${per ? per.datas : '—'}</p>
          <p class="ind-cartao__detalhe">${per ? per.duracao : semDatas}</p>
        </div>
      </div>`;
  }

  // Barras de uma série só (área em ha), na cor de série 1; o valor em cima de cada barra com área; ao passar o
  // mouse, o período e a área. Plantio | Colheita no estilo das guias do Detalhamento do orçamento (texto sublinhado).
  // À direita, "Nível" e a lista Mês · Quinzena · Dia; o gráfico mostra o período inteiro. No Dia, só os dias com área,
  // cada um com a sua data; se não couberem na largura, as barras rolam na horizontal
  function grafico(linhas, est) {
    const lista = barras(linhas, est.serie, est.gran);
    const { topo, passo } = escala(Math.max(0, ...lista.map((b) => b.area)));
    const marcas = [];
    for (let v = 0; v <= topo + 1e-9; v += passo) marcas.push(v);
    const nome = est.serie === 'plantio' ? 'plantio' : 'colheita';
    // Data embaixo girada 90° quando não cabe na largura da coluna (estimada pela largura dos Indicadores já na tela
    // ou, na primeira vez, pela janela menos o menu)
    const area = document.querySelector('.ind')?.clientWidth
      || window.innerWidth - (document.querySelector('.menu')?.offsetWidth || 0) - 100;
    const coluna = Math.max(est.gran === 'dia' ? 46 : 0, (area - 110) / Math.max(1, lista.length));
    const girado = lista.some((b) => b.rotulo.length * 6.6 + 8 > coluna);
    return `
      <section class="cartao ind-secao" aria-labelledby="ind-titulo-tempo">
        <div class="ind-secao__topo">
          <h3 class="ind-secao__titulo" id="ind-titulo-tempo">Distribuição da área planejada</h3>
          <nav class="orc-guias" aria-label="Série do gráfico">
            ${[['plantio', 'Plantio'], ['colheita', 'Colheita']].map(([id, rot]) => `
              <button class="orc-guia ${est.serie === id ? 'orc-guia--ativa' : ''}" type="button" data-acao="ind-serie" data-serie="${id}"
                      aria-pressed="${est.serie === id}">${rot}</button>`).join('')}
          </nav>
          <div class="ind-tempo">
            <label class="ind-tempo__rotulo" for="ind-gran">Nível</label>
            <select class="campo__controle ind-tempo__gran" id="ind-gran" data-campo="ind-gran">
              ${[['mes', 'Mês'], ['quinzena', 'Quinzena'], ['dia', 'Dia']].map(([id, rot]) => `
                <option value="${id}" ${est.gran === id ? 'selected' : ''}>${rot}</option>`).join('')}
            </select>
          </div>
        </div>
        ${!lista.length ? `<p class="ind-vazio">${est.serie === 'plantio' ? 'Nenhum talhão com data de plantio.' : 'Nenhum talhão com colheita prevista (data de plantio e ciclo da variedade).'}</p>` : `
        <div class="ind-grafico ${est.gran === 'dia' ? 'ind-grafico--dia' : ''} ${girado ? 'ind-grafico--girado' : ''}" role="img" aria-label="Área de ${nome} por ${est.gran === 'mes' ? 'mês' : est.gran}: ${lista.filter((b) => b.area).map((b) => `${b.rotulo}, ${ha(b.area)}`).join('; ')}">
          <span class="ind-grafico__eixo-titulo">Área (ha)</span>
          <div class="ind-grafico__plot">
            ${marcas.map((v) => `<span class="ind-grafico__grade" style="bottom: ${v / topo * 100}%"><span>${fmt(v)}</span></span>`).join('')}
            <div class="ind-grafico__barras">
              ${lista.map((b) => `
                <div class="ind-grafico__coluna" title="${b.rotulo}: ${ha(b.area)}">
                  <div class="ind-grafico__barra-area">
                    ${b.area ? `<span class="ind-grafico__valor" style="bottom: ${b.area / topo * 100}%">${fmt(Math.round(b.area))}</span>` : ''}
                    <span class="ind-grafico__barra" style="height: ${b.area / topo * 100}%"></span>
                  </div>
                  <span class="ind-grafico__rotulo">${b.rotulo}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>`}
      </section>`;
  }

  function tabelaProdutos(ctx, est) {
    const todos = produtos(ctx);
    const ls = ordenados(todos.filter(passaProduto(est)), est.ordem);
    const paginas = Math.max(1, Math.ceil(ls.length / est.porPagina));
    est.pagina = Math.min(Math.max(1, est.pagina), paginas);
    const pagina = ls.slice((est.pagina - 1) * est.porPagina, est.pagina * est.porPagina);
    const de = ls.length ? (est.pagina - 1) * est.porPagina + 1 : 0;
    const ate = Math.min(est.pagina * est.porPagina, ls.length);
    const seta = (id) => {
      const ativa = est.ordem && est.ordem.coluna === id;
      return `<button class="titulo-ordenar ${ativa ? 'titulo-ordenar--ativo' : ''}" type="button" data-acao="ind-ordenar" data-coluna="${id}"
                aria-label="Ordenar por ${COLUNAS.find(([c]) => c === id)[1]}">${ativa ? (est.ordem.sentido === 'asc' ? Icones.acima : Icones.abaixo) : Icones.ordenar}</button>`;
    };
    return `
      <section class="cartao ind-secao" aria-labelledby="ind-titulo-produto">
        <div class="ind-secao__topo">
          <div>
            <h3 class="ind-secao__titulo" id="ind-titulo-produto">Planejamento de produto</h3>
            <p class="ind-secao__sub">Necessidade de consumo de insumos considerando todas as operações do plano.</p>
          </div>
          ${ls.length ? `<button class="botao orc-exportar ind-exportar" type="button" data-acao="ind-exportar">${Icones.baixar} Exportar Excel</button>` : ''}
        </div>
        ${!ls.length ? `<p class="ind-vazio">${todos.length ? 'Nenhum produto com esses filtros.' : 'Nenhum insumo planejado (produto com dose ou variedade com população).'}</p>` : `
        <div class="tabela-rolagem"><table class="tabela orc-tabela ind-tabela">
          <thead><tr>${COLUNAS.map(([id, rot, , numero]) => `
            <th class="${numero ? 'tabela__numero' : ''}"><span class="titulo-coluna"><span>${rot}</span>${seta(id)}</span></th>`).join('')}</tr></thead>
          <tbody>${pagina.map((l) => `<tr>
            <td>${esc(l.grupo)}</td><td>${esc(l.produto)}</td>
            <td class="tabela__numero">${quantidade(l.necessidade)}</td><td>${esc(l.unidade)}</td></tr>`).join('')}</tbody>
        </table></div>
        <div class="orc-paginacao">
          <label class="orc-paginacao__por">Itens por página
            <select class="campo__controle" data-campo="ind-por-pagina">
              ${POR_PAGINA.map((n) => `<option ${n === est.porPagina ? 'selected' : ''}>${n}</option>`).join('')}
            </select></label>
          <span class="orc-paginacao__texto">${fmt(de)}–${fmt(ate)} de ${fmt(ls.length)}</span>
          <button class="botao-icone" type="button" data-acao="ind-pagina" data-pagina="${est.pagina - 1}" ${est.pagina <= 1 ? 'disabled' : ''} aria-label="Página anterior">${Icones.anterior}</button>
          <span class="orc-paginacao__texto">Página ${est.pagina} de ${paginas}</span>
          <button class="botao-icone" type="button" data-acao="ind-pagina" data-pagina="${est.pagina + 1}" ${est.pagina >= paginas ? 'disabled' : ''} aria-label="Próxima página">${Icones.proxima}</button>
        </div>`}
      </section>`;
  }

  // Exportar Excel: a tabela inteira (todas as páginas, no grupo de insumo à mostra), na ordem da tela
  function exportar(ctx) {
    const est = estadoPadrao(ctx);
    const p = ctx.plano;
    const linhas = [['Grupo de insumo', 'Produto', 'Necessidade de consumo', 'Unidade'],
      ...ordenados(produtos(ctx).filter(passaProduto(est)), est.ordem).map((l) => [l.grupo, l.produto, +l.necessidade.toFixed(2), l.unidade])];
    const limpo = (t) => Util.normalizar(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, XLSX.utils.aoa_to_sheet(linhas), 'planejamento_produto');
    XLSX.writeFile(livro, `planejamento-produto_${limpo(p.safra)}_${limpo(p.fazenda)}.xlsx`);
  }

  // ----- Eventos (repassados pelo Resumo). Devolvem true quando o evento era daqui. -----
  function aoClicar(e, ctx, { redesenhar }) {
    const alvo = e.target.closest('[data-acao^="ind-"]');
    if (!alvo) return false;
    const est = estadoPadrao(ctx);
    switch (alvo.dataset.acao) {
      case 'ind-serie': est.serie = alvo.dataset.serie; redesenhar(`[data-acao="ind-serie"][data-serie="${est.serie}"]`); break;
      case 'ind-ordenar': {
        const c = alvo.dataset.coluna;
        est.ordem = { coluna: c, sentido: est.ordem && est.ordem.coluna === c && est.ordem.sentido === 'asc' ? 'desc' : 'asc' };
        est.pagina = 1;
        redesenhar(`[data-acao="ind-ordenar"][data-coluna="${c}"]`);
        break;
      }
      case 'ind-limpar':
        est.insumo = 'todos'; est.produto = 'todos'; est.pagina = 1;
        ctx.estado.busca = {}; ctx.estado.filtroAberto = null;
        redesenhar('[data-acao="ind-limpar"]');
        break;
      case 'ind-pagina': est.pagina = Number(alvo.dataset.pagina); redesenhar(`[data-acao="ind-pagina"]:not([disabled])`); break;
      case 'ind-exportar': exportar(ctx); break;
      case 'ind-ir-tabela': if (ctx.irParaTabela) ctx.irParaTabela(); break;
      default: return false;
    }
    return true;
  }

  function aoMudar(e, ctx, { redesenhar }) {
    const est = estadoPadrao(ctx);
    // Filtros Insumos e Produto: "Todos" marca ou desmarca tudo; cada caixa liga ou desliga a opção. Trocar os insumos
    // tira do Produto os que não são mais opção (sem nenhum, Todos)
    if (e.target.dataset.campo === 'cal-filtro' && ['insumo', 'produto'].includes(e.target.dataset.filtro)) {
      const chave = e.target.dataset.filtro;
      const todos = produtos(ctx);
      const valores = opcoesProdutos(todos, est, chave).map((o) => o.valor);
      let marcados = valores.filter((v) => Telas.calendario.marcado(est, chave, v));
      if (e.target.value === 'todos') marcados = e.target.checked ? [...valores] : [];
      else if (e.target.checked) marcados.push(e.target.value);
      else marcados = marcados.filter((n) => n !== e.target.value);
      est[chave] = marcados.length === valores.length ? 'todos' : marcados;
      if (chave === 'insumo' && Array.isArray(est.produto) && est.produto.length) {
        const prods = opcoesProdutos(todos, est, 'produto').map((o) => o.valor);
        const ficam = est.produto.filter((n) => prods.includes(n));
        est.produto = ficam.length && ficam.length < prods.length ? ficam : 'todos';
      }
      est.pagina = 1;
      ctx.estado.filtroAberto = chave;
      redesenhar(`[data-campo="cal-filtro"][data-filtro="${chave}"][value="${CSS.escape(e.target.value)}"]`);
      return true;
    }
    if (e.target.dataset.campo === 'ind-gran') {
      est.gran = e.target.value;
      redesenhar('[data-campo="ind-gran"]');
      return true;
    }
    if (e.target.dataset.campo !== 'ind-por-pagina') return false;
    est.porPagina = Number(e.target.value); est.pagina = 1;
    redesenhar('[data-campo="ind-por-pagina"]');
    return true;
  }

  return { desenhar, desenharProdutos, aoClicar, aoMudar };
})();
