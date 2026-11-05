/*
 * Previsão de Falta de Produtos: guia da página Planejado × Executado (Gestão da Lavoura › Operações), endereço
 * #/planejado-executado/falta. O cabeçalho (título e guias) vem de js/telas/monitoramento-aplicacoes.js.
 *
 * Barra de filtros padronizada (js/barra-filtros.js) e, embaixo, três cartões (04/11/2026): Estoque suficiente · Falta se
 * o desvio continuar · Falta mesmo sem desvio, com o número de produtos e "X% de N produtos".
 * Por produto (só os que ainda têm o que aplicar nos filtros):
 *   - necessidade restante: a quantidade planejada nas operações ainda não executadas (a mesma conta do Orçamento, nos
 *     talhões marcados; executada: a simulação da Planejado × Executado);
 *   - necessidade com desvio: a restante × (1 + o desvio de quantidade do produto nas OS fechadas, como nos Desvios de
 *     Recomendação; sem OS fechada, 0%);
 *   - estoque: DADOS.estoques (por fazenda e produto; soma das fazendas dos planos filtrados).
 *   Não cobre a restante: Falta mesmo sem desvio; cobre a restante, mas não a com desvio: Falta se o desvio continuar;
 *   senão: Estoque suficiente.
 * Embaixo, o cartão "Disponibilidade de produtos para as operações planejadas" (05/11/2026; antes Simulação das
 * próximas aplicações, com os botões, que saíram): a tabela Insumo · Produto · Desvio médio de quantidade · Cobertura do
 * estoque (estoque ÷ necessidade com desvio) · Operação afetada (seguindo as aplicações na ordem da data planejada, a
 * primeira em que o estoque acaba) · Data prevista de falta (a data planejada dela) · Situação do estoque.
 * Clicar numa linha abre o modal do produto, na tela toda (04/11/2026): cabeçalho (produto, insumo, safra · cultura ·
 * fazenda), três cartões (Estoque atual · Aplicando a dose recomendada · Se o desvio continuar), o gráfico "Quantidade
 * de produto por operação" (todas as operações que usam o produto: Recomendado verde, Aplicado azul, Previsto com desvio
 * azul tracejado, Falta prevista vermelha), o aviso da falta em texto e o rodapé com o desvio médio e Fechar.
 * À mostra: Safra · Cultura · Empresa · Fazenda · Talhão · Insumo · Produto; no Mais filtros: Ano agrícola · Atividade
 * produtiva · Operação agrícola (e os que não couberem na linha). Opções dos planos com versão publicada (a última).
 * Insumo: a classe do produto (Fungicida, Herbicida…; sem classe, o grupo de insumo), a mesma da coluna Insumo e da
 * etiqueta do modal (04/11/2026); Produto: os dos insumos marcados; Operação agrícola: as
 * operações planejadas que usam os insumos e produtos marcados. Dependentes: Ano e Atividade › Safra e Cultura;
 * Empresa › Fazenda › Talhão; Insumo › Produto › Operação agrícola. Os filtros-base acompanham entre as páginas.
 */
window.Telas = window.Telas || {};

window.Telas.faltaProdutos = (function () {
  const Cal = () => Telas.calendario;
  const FILTROS = [
    ['safra', 'Safra', ['Todas', 'Nenhuma', 'selecionadas'], 92],
    ['cultura', 'Cultura', ['Todas', 'Nenhuma', 'culturas'], 104],
    ['empresa', 'Empresa', ['Todas', 'Nenhuma', 'empresas'], 124],
    ['fazenda', 'Fazenda', ['Todas', 'Nenhuma', 'fazendas'], 124],
    ['talhao', 'Talhão', ['Todos', 'Nenhum', 'talhões'], 104],
    ['insumo', 'Insumo', ['Todos', 'Nenhum', 'insumos'], 124],
    ['produto', 'Produto', ['Todos', 'Nenhum', 'produtos'], 124],
    // Situação do estoque (05/11/2026): Suficiente · Insuficiente; filtra só a tabela (os cartões contam todos)
    ['situacao', 'Situação do estoque', ['Todas', 'Nenhuma', 'situações'], 124]
  ];
  const SITUACOES = [{ valor: 'suficiente', nome: 'Suficiente' }, { valor: 'falta', nome: 'Insuficiente' }];
  const MAIS_FILTROS = [
    ['ano', 'Ano agrícola', ['Todos', 'Nenhum', 'anos']],
    ['atividade', 'Atividade produtiva', ['Todas', 'Nenhuma', 'atividades']],
    ['operacao', 'Operação agrícola', ['Todas', 'Nenhuma', 'operações']]
  ];
  const DEPENDE = { safra: ['ano', 'atividade'], cultura: ['ano', 'atividade'], fazenda: ['empresa'], talhao: ['empresa', 'fazenda'],
    produto: ['insumo'], operacao: ['insumo', 'produto'] };

  let est = null;
  let caixaCorpo = null;
  const novoEstado = () => {
    const e = { talhao: 'todos', insumo: 'todos', produto: 'todos', operacao: 'todos', situacao: 'todos', busca: {}, filtroAberto: null, pagina: 1, porPagina: 10 };
    FiltrosBase.ler(e);
    return e;
  };
  const marcado = (chave, valor) => Cal().marcado(est, chave, valor);

  // ----- Planos e insumos -----
  const comPublicada = () => DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p));
  const valorDe = { ano: (p) => String(Util.anoAgricola(p.safra)), atividade: (p) => p.atividade, safra: (p) => p.safra,
    cultura: (p) => p.cultura, empresa: (p) => p.empresa, fazenda: (p) => p.fazenda };
  const planosFiltrados = () => comPublicada().filter((p) => Object.keys(valorDe).every((c) => marcado(c, valorDe[c](p))));
  const planosPara = (chave) => comPublicada().filter((p) => (DEPENDE[chave] || []).every((c) => marcado(c, valorDe[c](p))));
  // Insumos planejados dos planos filtrados (e dos talhões marcados): um por produto, operação e talhão, com o grupo de
  // insumo (a mesma conta do Orçamento)
  function insumos() {
    const saida = [];
    planosFiltrados().forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const talhoes = Util.talhoesPlano(p, v).filter((t) => marcado('talhao', `${p.fazenda}|${t.nome}`));
      Versoes.grupos(p, v).forEach((g) => g.operacoes.forEach((op) => {
        Telas.orcamento.consumoDoPlano(p, [{ ...g, operacoes: [op] }], talhoes)
          .filter((i) => i.quantidade > 0)
          .forEach((i) => saida.push({ ...i, operacao: op.nome }));
      }));
    });
    return saida;
  }

  // ----- Previsão por produto -----
  const MA = () => Telas.monitoramentoAplicacoes;
  // Necessidade restante por produto (e por fazenda, para o estoque): operações ainda não executadas nos talhões marcados,
  // com os filtros Insumo, Produto e Operação agrícola. Colheita não tem insumo
  function necessidades() {
    const mapa = new Map();
    planosFiltrados().forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const grupos = Versoes.grupos(p, v);
      const plantio = (grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0];
      Util.talhoesPlano(p, v).forEach((t, iT) => {
        if (!marcado('talhao', `${p.fazenda}|${t.nome}`)) return;
        const base = plantio ? Planos.dataPlantioTalhao(plantio, t.nome) : null;
        grupos.forEach((g) => g.operacoes.forEach((op, iOp) => {
          if (g.tipo === 'Colheita' || !marcado('operacao', op.nome)) return;
          // Data planejada: Plantio, a data de plantio; as outras, plantio + DAP. Sem data, ainda não executada
          let planejado = null;
          if (base && g.tipo === 'Sementes') planejado = base;
          else if (base && op.dap !== null && op.dap !== undefined && op.dap !== '') planejado = MA().somaDias(base, Number(op.dap));
          const i = g.tipo === 'Sementes' ? iT : iT * 3 + iOp;
          if (planejado && MA().execucao(p, t.nome, op, g, planejado, iT, i).executada) return;
          Telas.orcamento.consumoDoPlano(p, [{ ...g, operacoes: [op] }], [t])
            .filter((x) => x.quantidade > 0 && marcado('insumo', classeDe(x)) && marcado('produto', x.produto))
            .forEach((x) => {
              const n = mapa.get(x.produto) || { produto: x.produto, grupo: x.grupo, unidade: x.unidade, restante: 0, porFazenda: {}, aplicacoes: [] };
              n.restante += x.quantidade;
              n.aplicacoes.push({ data: planejado, operacao: op.nome, talhao: t.nome, fazenda: p.fazenda, quantidade: x.quantidade });
              n.porFazenda[p.fazenda] = (n.porFazenda[p.fazenda] || 0) + x.quantidade;
              mapa.set(x.produto, n);
            });
        }));
      });
    });
    return [...mapa.values()];
  }
  // Desvio de quantidade de cada produto nas OS fechadas (aplicado ÷ recomendado − 1, somados), nos talhões marcados
  function desvios() {
    const soma = new Map();
    Telas.desviosRecomendacao.registros(planosFiltrados())
      .filter((r) => marcado('talhao', `${r.fazenda}|${r.talhao}`))
      .forEach((r) => {
        const x = soma.get(r.produto) || { rec: 0, apl: 0 };
        x.rec += r.qtdRec; x.apl += r.qtdApl;
        soma.set(r.produto, x);
      });
    return (produto) => { const x = soma.get(produto); return x && x.rec ? x.apl / x.rec - 1 : 0; };
  }
  const CARTOES = [
    ['suficiente', 'Estoque suficiente'],
    ['desvio', 'Falta com desvio'],
    ['falta', 'Falta sem desvio']
  ];
  function previsao() {
    const desvioDe = desvios();
    const fazendas = [...new Set(planosFiltrados().map((p) => p.fazenda))];
    return necessidades().map((n) => {
      const desvio = desvioDe(n.produto);
      const comDesvio = n.restante * (1 + desvio);
      const estoque = fazendas.reduce((s, f) => s + (((DADOS.estoques || {})[f] || {})[n.produto] || 0), 0);
      // Situação com a dose recomendada (05/11/2026): o estoque cobre ou não a necessidade restante
      const situacao = estoque < n.restante ? 'falta' : 'suficiente';
      return { ...n, desvio, comDesvio, estoque, situacao };
    });
  }
  const fmt = (n) => n.toLocaleString('pt-BR');
  // Cartão no formato do Resumo do orçamento (04/11/2026): ícone num círculo na cor da situação, rótulo pequeno, valor
  // grande e o texto de apoio. Os mesmos ícones na página e no modal: caixa (estoque, verde), alerta (laranja) e proibido
  // (vermelho)
  const ICONE = { suficiente: () => Icones.caixa, desvio: () => Icones.alerta, falta: () => Icones.proibido,
    // Modal: Estoque (verde) · Se o desvio continuar (laranja) · Aplicando a dose recomendada (azul), as cores do gráfico
    'm-desvio': () => Icones.alerta, 'm-rec': () => Icones.alerta };
  const cartao = (id, rotulo, valor, texto) => `
          <div class="orc-card fp-card fp-card--${id}"><span class="orc-card__icone" aria-hidden="true">${ICONE[id]()}</span>
            <div class="orc-card__corpo"><span class="orc-card__rotulo">${rotulo}</span><strong class="orc-card__numero">${valor}</strong>
              <span class="fp-card__texto">${texto}</span></div></div>`;
  // No modal, os cartões das duas previsões escolhem a previsão do gráfico (no lugar dos botões; 04/11/2026)
  const nomeSituacao = Object.fromEntries(CARTOES);
  // Simulação: a necessidade com a dose recomendada (fator 1) ou mantendo o desvio médio do produto (1 + desvio).
  // Cobertura = estoque ÷ necessidade; a operação de risco: seguindo as aplicações pela data planejada (sem data, no fim),
  // a primeira em que a soma passa do estoque
  function simulacao(lista) {
    return lista.map((x) => {
      const fator = 1; // dose recomendada (05/11/2026; antes mantendo o desvio médio)
      const necessidade = x.restante * fator;
      const cobertura = necessidade > 0 ? x.estoque / necessidade : Infinity;
      const ordem = [...x.aplicacoes].sort((a, b) => (a.data || '9999').localeCompare(b.data || '9999') || a.talhao.localeCompare(b.talhao, 'pt-BR', { numeric: true }));
      let soma = 0;
      const risco = ordem.find((a) => { soma += a.quantidade * fator; return soma > x.estoque + 1e-9; }) || null;
      // Operações afetadas (05/11/2026): as das aplicações que o estoque já não cobre (fazenda + operação)
      let acum = 0;
      const afetadas = new Set(ordem.filter((a) => { acum += a.quantidade * fator; return acum > x.estoque + 1e-9; })
        .map((a) => `${a.fazenda}|${a.operacao}`));
      return { ...x, cobertura, risco, afetadas };
    }).sort((a, b) => ((a.risco && a.risco.data) || '9999').localeCompare((b.risco && b.risco.data) || '9999')
      || a.cobertura - b.cobertura || a.produto.localeCompare(b.produto, 'pt-BR'));
  }
  // Filtro Situação do estoque: a linha passa se a situação dela está marcada
  const passaSituacao = (x) => marcado('situacao', x.situacao);
  const dataCurta = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
  // Desvio médio de quantidade do produto nas OS fechadas (aplicado ÷ recomendado − 1, as somas, como o Top 10 dos
  // Desvios de dose em Quantidade): "+12%" aplicou a mais, "−3%" a menos (sem OS fechada, "0%")
  const pct = (d) => { const n = Math.round(d * 100); return `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(n))}%`; };
  // Tabela "Disponibilidade de produtos para as operações planejadas" (05/11/2026, imagem da usuária; antes "Simulação
  // das próximas aplicações", com os botões Aplicar dose recomendada · Manter desvio médio, que saíram): sempre mantendo
  // o desvio médio do produto. Colunas: Insumo · Produto · Desvio médio de quantidade · Cobertura do estoque · Operação afetada
  // · Data prevista de falta · Situação do estoque (Suficiente ou Insuficiente; insuficiente = falta com ou sem desvio,
  // em vermelho, também o desvio da linha)
  // Páginas (05/11/2026, como o Detalhamento por OS dos Desvios de dose): "1–10 de 9 produtos", ‹ Página 1 de 1 › e
  // Itens por página (10, 25, 50)
  const POR_PAGINA = [10, 25, 50];
  function tabela(lista) {
    const todas = simulacao(lista).filter(passaSituacao);
    const paginas = Math.max(1, Math.ceil(todas.length / est.porPagina));
    est.pagina = Math.min(Math.max(1, est.pagina), paginas);
    const linhas = todas.slice((est.pagina - 1) * est.porPagina, est.pagina * est.porPagina);
    const de = todas.length ? (est.pagina - 1) * est.porPagina + 1 : 0;
    const ate = Math.min(est.pagina * est.porPagina, todas.length);
    return `
        <section class="cartao fp-secao" aria-labelledby="fp-sim-titulo">
          <h3 class="fp-secao__titulo" id="fp-sim-titulo">Disponibilidade de produtos para as operações planejadas</h3>
          ${!linhas.length ? `<p class="ind-vazio">${lista.length ? 'Nenhum produto com essa situação do estoque.' : 'Nenhum produto a aplicar com esses filtros.'}</p>` : `
          <div class="tabela-rolagem"><table class="tabela orc-tabela fp-tabela">
            <thead><tr><th>Insumo</th><th>Produto</th><th class="tabela__numero">Desvio médio de quantidade</th><th class="tabela__numero">Cobertura do estoque</th>
              <th>Operação afetada</th><th>Data prevista de falta</th><th>Situação do estoque</th><th>Ação sugerida</th></tr></thead>
            <tbody>${linhas.map((x) => {
              const ok = x.situacao === 'suficiente';
              return `
              <tr class="fp-linha" data-fp-produto="${Util.escapar(x.produto)}" tabindex="0" title="Ver a previsão de ${Util.escapar(x.produto)}">
                <td>${Util.escapar(classeDe(x))}</td><td class="orc-tabela__grupo">${Util.escapar(x.produto)}</td>
                <td class="tabela__numero ${ok ? '' : 'fp-sit--falta'}">${pct(x.desvio)}</td>
                <td class="tabela__numero">${Number.isFinite(x.cobertura) ? `${fmt(Math.round(x.cobertura * 100))}%` : '—'}</td>
                <td ${x.risco ? `title="${Util.escapar(`${x.risco.fazenda} · ${x.risco.talhao}`)}"` : ''}>${x.risco ? Util.escapar(x.risco.operacao) : '—'}</td>
                <td>${x.risco ? dataCurta(x.risco.data) : '—'}</td>
                <td><span class="fp-selo fp-sit--${ok ? 'suficiente' : 'falta'}">${ok ? 'Suficiente' : 'Insuficiente'}</span></td>
                <td class="fp-acao ${ok ? 'fp-acao--nenhuma' : ''}">${ok ? 'Nenhuma'
                  : `Comprar ${qtd(Math.max(0, x.restante - x.estoque), x.unidade)}${x.risco && x.risco.data ? ` até ${dataLonga(x.risco.data)}` : ''}`}</td>
              </tr>`;
            }).join('')}</tbody>
          </table></div>
          <div class="orc-paginacao">
            <span class="orc-paginacao__texto dr-det__conta">${fmt(de)}–${fmt(ate)} de ${fmt(todas.length)} ${todas.length === 1 ? 'produto' : 'produtos'}</span>
            <button class="botao-icone" type="button" data-fp-pagina="${est.pagina - 1}" ${est.pagina <= 1 ? 'disabled' : ''} aria-label="Página anterior">${Icones.anterior}</button>
            <span class="orc-paginacao__texto">Página ${est.pagina} de ${paginas}</span>
            <button class="botao-icone" type="button" data-fp-pagina="${est.pagina + 1}" ${est.pagina >= paginas ? 'disabled' : ''} aria-label="Próxima página">${Icones.proxima}</button>
            <label class="orc-paginacao__por dr-det__por">Itens por página
              <select class="campo__controle" data-fp-por-pagina>
                ${POR_PAGINA.map((n) => `<option ${n === est.porPagina ? 'selected' : ''}>${n}</option>`).join('')}
              </select></label>
          </div>`}
        </section>`;
  }
  // ----- Modal do produto -----
  const qtd = (n, un) => `${fmt(Math.round(n))} ${un}`;
  const dataLonga = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—');
  // A operação em que o estoque acaba, com o fator (1: dose recomendada; 1 + desvio: mantendo o desvio)
  function risco(x, fator) {
    const ordem = [...x.aplicacoes].sort((a, b) => (a.data || '9999').localeCompare(b.data || '9999')
      || a.talhao.localeCompare(b.talhao, 'pt-BR', { numeric: true }));
    let soma = 0;
    const r = ordem.find((a) => { soma += a.quantidade * fator; return soma > x.estoque + 1e-9; });
    if (!r) return null;
    // Quanto falta nessa operação: a soma até a última aplicação dela, menos o estoque (no máximo, o que ela usa)
    const ultima = ordem.map((a) => a.operacao).lastIndexOf(r.operacao);
    const ate = ordem.slice(0, ultima + 1).reduce((t, a) => t + a.quantidade * fator, 0);
    const daOperacao = ordem.filter((a) => a.operacao === r.operacao).reduce((t, a) => t + a.quantidade * fator, 0);
    return { ...r, falta: Math.min(daOperacao, ate - x.estoque) };
  }
  // Todas as aplicações do produto (feitas e próximas), um ponto por data planejada, somando os talhões daquele dia, com
  // o nome da(s) operação(ões) (04/11/2026; antes, um ponto por operação):
  // recomendado (todas), aplicado (as feitas: o da OS fechada ou, sem ela, o recomendado) e previsto com desvio (as
  // próximas: o aplicado dos talhões já feitos + o recomendado × (1 + desvio) dos que faltam)
  function operacoesDoProduto(x) {
    const aplicado = new Map();
    Telas.desviosRecomendacao.registros(planosFiltrados()).filter((r) => r.produto === x.produto)
      .forEach((r) => { const k = `${r.fazenda}|${r.talhao}|${r.operacao}`; aplicado.set(k, (aplicado.get(k) || 0) + r.qtdApl); });
    const ops = new Map();
    planosFiltrados().forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const grupos = Versoes.grupos(p, v);
      const plantio = (grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0];
      Util.talhoesPlano(p, v).forEach((t, iT) => {
        if (!marcado('talhao', `${p.fazenda}|${t.nome}`)) return;
        const base = plantio ? Planos.dataPlantioTalhao(plantio, t.nome) : null;
        grupos.forEach((g) => g.operacoes.forEach((op, iOp) => {
          if (g.tipo === 'Colheita' || !marcado('operacao', op.nome)) return;
          const rec = Telas.orcamento.consumoDoPlano(p, [{ ...g, operacoes: [op] }], [t])
            .filter((i) => i.produto === x.produto).reduce((s2, i) => s2 + i.quantidade, 0);
          if (!rec) return;
          let planejado = null;
          if (base && g.tipo === 'Sementes') planejado = base;
          else if (base && op.dap !== null && op.dap !== undefined && op.dap !== '') planejado = MA().somaDias(base, Number(op.dap));
          const i = g.tipo === 'Sementes' ? iT : iT * 3 + iOp;
          const feita = !!(planejado && MA().execucao(p, t.nome, op, g, planejado, iT, i).executada);
          const chave = planejado || 'sem data';
          const o = ops.get(chave) || { operacoes: [], data: planejado, rec: 0, aplicado: 0, aFazer: 0, feitas: 0, total: 0 };
          if (!o.operacoes.includes(op.nome)) o.operacoes.push(op.nome);
          o.rec += rec; o.total += 1;
          if (feita) {
            const apl = aplicado.get(`${p.fazenda}|${t.nome}|${op.nome}`) ?? rec;
            o.aplicado += apl; o.feitas += 1;
          } else o.aFazer += rec;
          ops.set(chave, o);
        }));
      });
    });
    return [...ops.values()].map((o) => ({ ...o, operacao: o.operacoes.join(' + '), feita: o.feitas === o.total }))
      .sort((a, b) => (a.data || '9999').localeCompare(b.data || '9999'));
  }
  // Nome da operação embaixo do ponto: em até duas linhas (quebra no espaço mais perto do meio)
  function duasLinhas(nome) {
    if (nome.length <= 18) return [nome];
    const meio = nome.length / 2;
    const espacos = [...nome].map((c, k) => (c === ' ' ? k : -1)).filter((k) => k > 0);
    if (!espacos.length) return [nome];
    const k = espacos.reduce((m, e) => (Math.abs(e - meio) < Math.abs(m - meio) ? e : m));
    return [nome.slice(0, k), nome.slice(k + 1)];
  }
  // Eixo das datas (04/11/2026, opção 2): embaixo de todo ponto (toda aplicação planejada), em duas linhas retas, a
  // data e a operação abreviada para caber no espaço entre os pontos ("1ª Fungicida" → "1ª Fung."); o nome inteiro
  // aparece ao passar o mouse
  const alturaEixo = () => 44;
  function abreviar(nome, max) {
    if (nome.length <= max) return nome;
    const palavras = nome.replace(/[:;,]/g, '').split(' ').filter(Boolean);
    const curta = (w) => (w.length > 5 ? `${w.slice(0, 4)}.` : w);
    let txt = palavras[0].length > max ? `${palavras[0].slice(0, Math.max(1, max - 1))}.` : palavras[0];
    for (const w of palavras.slice(1)) {
      const prox = `${txt} ${curta(w)}`;
      if (prox.length > max) break;
      txt = prox;
    }
    return txt;
  }
  function eixoDatas(ops, x, base) {
    const passo = ops.length > 1 ? x(1) - x(0) : 200;
    const max = Math.max(4, Math.floor((passo - 6) / 6.2));
    return ops.map((o, i) => `<g class="fp-graf__eixo"><title>${dataCurta(o.data)} · ${Util.escapar(o.operacao)}</title>
        <text class="fp-graf__eixo-data" x="${x(i)}" y="${base + 18}" text-anchor="middle">${dataCurta(o.data)}</text>
        <text class="fp-graf__eixo-op" x="${x(i)}" y="${base + 33}" text-anchor="middle">${Util.escapar(abreviar(o.operacao, max))}</text></g>`).join('');
  }
  // Gráfico "Projeção do estoque por operação" (05/11/2026, imagem da usuária; antes as previsões com desvio e com a dose
  // recomendada): a mesma linha do tempo; o Estoque atual até hoje em linha verde cheia (reconstruído: o atual + o que
  // foi aplicado depois de cada data) e o Estoque previsto em verde pontilhado, com a dose recomendada, caindo a cada
  // aplicação até zerar; na data planejada em que ele acaba, a linha vertical vermelha com o selo "Estoque insuficiente
  // a partir de 05/12". dataFalta: a data (planejada) em que o estoque acaba com a dose recomendada (ou null)
  // 05/11/2026 (teste da usuária): depois da falta, o previsto desce abaixo do zero, até o que falta comprar; com muitas
  // aplicações o gráfico fica mais largo que a área (rola na horizontal) e o eixo do estoque fica parado à esquerda
  // (eixoFixo: as marcas do eixo saem do svg e vão para o HTML ao lado). Devolve { svg, eixo, xDe }.
  function graficoEstoque(ops, un, x0, L = 1200, A = 300, dataFalta = null, eixoFixo = false) {
    const esq = 56; const dir = 24; const topo = 52; const base = A - alturaEixo(ops);
    const ini = esq + 20;
    const x = (i) => (ops.length === 1 ? (esq + L - dir) / 2 : ini + i * ((L - dir - 20 - ini) / (ops.length - 1)));
    const comAplicado = ops.map((o, i) => (o.aplicado > 0 ? i : -1)).filter((i) => i >= 0);
    const ultimaFeita = comAplicado.length ? comAplicado[comAplicado.length - 1] : -1;
    // Até hoje: depois de cada aplicação feita, o atual + o aplicado nas datas seguintes
    const ate = comAplicado.map((i) => [i, x0.estoque + ops.slice(i + 1).reduce((t, o) => t + o.aplicado, 0)]);
    // Previsto (dose recomendada): a partir do estoque atual, menos o recomendado de cada próxima aplicação
    let usado = 0;
    const prev = ultimaFeita >= 0 ? [[ultimaFeita, x0.estoque]] : [];
    ops.forEach((o, i) => {
      if (!o.aFazer) return;
      usado += o.aFazer;
      prev.push([i, x0.estoque - usado]); // abaixo de zero: o que falta comprar até essa aplicação
    });
    const max = Math.max(1, x0.estoque, ...ate.map(([, v]) => v));
    const min = Math.min(0, ...prev.map(([, v]) => v));
    const faixa = max - min;
    const passo = [1, 2, 2.5, 5, 10].map((m) => m * 10 ** Math.floor(Math.log10(faixa / 4))).find((v) => faixa / v <= 6) || faixa / 4;
    const teto = Math.ceil(max / passo) * passo;
    const piso = Math.floor(min / passo) * passo;
    const y = (v) => base - ((v - piso) / (teto - piso)) * (base - topo);
    const marcas = [];
    for (let v = piso; v <= teto + 1e-9; v += passo) marcas.push(Math.round(v * 1e6) / 1e6);
    const linha = (pts) => pts.map(([i, v], k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const ponto = (cls, [i, v], dica) => `<circle class="fp-graf__mk ${cls}" cx="${x(i)}" cy="${y(v)}" r="3.5"><title>${Util.escapar(dica)}</title></circle>`;
    // Linha vertical vermelha na data da falta, com o selo em duas linhas, centrado nela (sem sair do gráfico)
    const iFalta = dataFalta ? ops.findIndex((o) => o.data === dataFalta) : -1;
    // Estoque previsto: verde pontilhado até a data da falta e, dali em diante (sem estoque, no zero), vermelho
    // pontilhado (05/11/2026)
    const linhasPrevistas = () => {
      if (prev.length < 2) return '';
      const k = iFalta >= 0 ? prev.findIndex(([i]) => i >= iFalta) : -1;
      if (k < 1) return `<path class="fp-graf__linha fp-graf__linha--prevista" d="${linha(prev)}"/>`;
      // Verde até o ponto do estoque insuficiente (a linha vertical); vermelho só dali em diante (05/11/2026)
      const verde = linha(prev.slice(0, k + 1));
      const vermelho = linha(prev.slice(k));
      return `<path class="fp-graf__linha fp-graf__linha--prevista" d="${verde}"/>
        ${prev.length - k > 1 ? `<path class="fp-graf__linha fp-graf__linha--sem-estoque" d="${vermelho}"/>` : ''}`;
    };
    const falta = () => {
      if (iFalta < 0) return '';
      const larg = 132; const alt = 34;
      const cx = Math.max(esq + larg / 2, Math.min(x(iFalta), L - dir - larg / 2));
      return `<line class="fp-graf__falta fp-graf__falta--insuf" x1="${x(iFalta)}" x2="${x(iFalta)}" y1="${topo - 8}" y2="${base}"/>
        <g class="fp-graf__selo fp-graf__selo--insuf"><rect x="${cx - larg / 2}" y="${topo - 8 - alt}" width="${larg}" height="${alt}" rx="6"/>
          <text x="${cx}" y="${topo - 8 - alt + 14}" text-anchor="middle">Estoque insuficiente</text>
          <text x="${cx}" y="${topo - 8 - alt + 28}" text-anchor="middle">a partir de ${dataCurta(dataFalta)}</text></g>`;
    };
    const eixo = `
        <span class="fp-graf__eixo-y-titulo" style="top: ${topo - 34}px">Estoque (${Util.escapar(un)})</span>
        ${marcas.map((v) => `<span class="fp-graf__eixo-y-marca" style="top: ${y(v) - 8}px">${fmt(v)}</span>`).join('')}`;
    const svg = `
      <svg class="fp-graf" viewBox="0 0 ${L} ${A}" width="${L}" height="${A}" role="img" aria-label="Projeção do estoque de ${Util.escapar(x0.produto)}">
        ${eixoFixo ? '' : `<text class="fp-graf__eixo-titulo" x="${esq - 44}" y="${topo - 22}">Estoque (${Util.escapar(un)})</text>`}
        ${marcas.map((v) => `<line class="fp-graf__grade ${v === 0 && piso < 0 ? 'fp-graf__grade--zero' : ''}" x1="${esq}" x2="${L - dir}" y1="${y(v)}" y2="${y(v)}"/>
          ${eixoFixo ? '' : `<text class="fp-graf__marca" x="${esq - 10}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`}`).join('')}
        ${ate.length > 1 ? `<path class="fp-graf__linha fp-graf__linha--est-atual" d="${linha(ate)}"/>` : ''}
        ${linhasPrevistas()}
        ${ate.map((pt) => ponto('fp-graf__mk--est-atual', pt, `${dataCurta(ops[pt[0]].data)}: ${qtd(pt[1], un)} em estoque`)).join('')}
        ${prev.slice(ultimaFeita >= 0 ? 1 : 0).map((pt) => ponto(iFalta >= 0 && pt[0] >= iFalta ? 'fp-graf__mk--sem-estoque' : 'fp-graf__mk--prevista', pt,
          `${dataCurta(ops[pt[0]].data)} · previsto: ${pt[1] >= 0 ? `${qtd(pt[1], un)} em estoque` : `faltam ${qtd(-pt[1], un)}`}`)).join('')}
        ${falta()}
        ${eixoDatas(ops, x, base)}
      </svg>`;
    return { svg, eixo, xDe: x, ultimaFeita };
  }

  // Etiqueta ao lado do nome do produto e coluna Insumo da tabela: a classe do cadastro (Fungicida, Herbicida, Inseticida, Micronutriente…);
  // sem classe (ex.: sementes), o grupo de insumo (04/11/2026)
  const classeDe = (x) => ((DADOS.defensivos || []).find((d) => d.produto === x.produto) || {}).classe || x.grupo;
  // Modal do produto (tela toda): cabeçalho, três cartões no padrão da página (Estoque · Se o desvio continuar · Aplicando
  // a dose recomendada), o gráfico do estoque (sem o aviso embaixo, 04/11/2026) e, no rodapé, ‹ Produto 1 de 9 › (05/11/2026: sem o desvio médio)
  // Tabela das OS do produto no modal (05/11/2026): as OS fechadas do produto nos filtros da página, só com a
  // quantidade (Nº OS · Safra · Empresa · Fazenda · Talhão · Operação · Produto · Quantidade recomendada · Quantidade
  // aplicada · Desvio Qtd (%)), no formato do Detalhamento por OS dos Desvios de dose. Abre do maior para o menor
  // desvio; todas as colunas ordenam (1º clique crescente, 2º decrescente); 5 OS por página.
  const OS_POR_PAGINA = 5;
  const COLUNAS_OS = [
    ['os', 'Nº OS', (r) => r.os], ['criacao', 'Data de criação', (r) => r.executada || ''], ['fechamento', 'Data de fechamento', (r) => r.fechamento || ''],
    ['safra', 'Safra', (r) => r.safra], ['empresa', 'Empresa', (r) => r.empresa],
    ['fazenda', 'Fazenda', (r) => r.fazenda], ['talhao', 'Talhão', (r) => r.talhao], ['operacao', 'Operação', (r) => r.operacao],
    ['produto', 'Produto', (r) => r.produto], ['qtdRec', 'Quantidade recomendada', (r) => r.qtdRec, 'tabela__numero'],
    ['qtdApl', 'Quantidade aplicada', (r) => r.qtdApl, 'tabela__numero'], ['desvio', 'Desvio Qtd (%)', (r) => r.qtdApl / r.qtdRec - 1, 'dr-centro']
  ];
  // Cor do desvio: as faixas dos Desvios de dose (abaixo do recomendado, sem desvio, até 10%, 10-20%, acima de 20%)
  const faixaOS = (d) => (d < -1e-9 ? 'abaixo' : Math.abs(d) <= 1e-9 ? 'sem' : d <= 0.10 ? 'ate10' : d <= 0.20 ? '10a20' : 'acima20');
  // Quantidade da OS: abaixo de 100, com uma casa (6,3 kg e 7,2 kg; sem ela, as duas apareceriam como 6 kg)
  const qtdOS = (n, un) => `${n.toLocaleString('pt-BR', { minimumFractionDigits: n < 100 ? 1 : 0, maximumFractionDigits: n < 100 ? 1 : 0 })} ${Util.escapar(un || '')}`;
  const pctOS = (d) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  function tabelaOS(regs, os) {
    const col = COLUNAS_OS.find(([id]) => id === os.coluna) || COLUNAS_OS[COLUNAS_OS.length - 1];
    const sinal = os.sentido === 'asc' ? 1 : -1;
    const ls = [...regs].sort((a, b) => {
      const u = col[2](a); const v = col[2](b);
      return sinal * (typeof u === 'number' && typeof v === 'number' ? u - v : String(u).localeCompare(String(v), 'pt-BR', { numeric: true }));
    });
    const paginas = Math.max(1, Math.ceil(ls.length / OS_POR_PAGINA));
    os.pagina = Math.min(Math.max(1, os.pagina), paginas);
    const pagina = ls.slice((os.pagina - 1) * OS_POR_PAGINA, os.pagina * OS_POR_PAGINA);
    const de = ls.length ? (os.pagina - 1) * OS_POR_PAGINA + 1 : 0;
    const ate = Math.min(os.pagina * OS_POR_PAGINA, ls.length);
    const titulo = ([id, rotulo, , classe = '']) => {
      const ativa = os.coluna === id;
      return `<th class="${classe}"><span class="titulo-coluna"><span>${rotulo}</span><button class="titulo-ordenar ${ativa ? 'titulo-ordenar--ativo' : ''}"
        type="button" data-fp-os-ordenar="${id}" aria-label="Ordenar por ${rotulo}">${ativa ? (os.sentido === 'asc' ? Icones.acima : Icones.abaixo) : Icones.ordenar}</button></span></th>`;
    };
    if (!ls.length) return '<p class="ind-vazio">Nenhuma OS fechada com esse produto nos filtros.</p>';
    return `
        <div class="tabela-rolagem"><table class="tabela dr-tabela dr-det fp-os">
          <thead><tr>${COLUNAS_OS.map(titulo).join('')}</tr></thead>
          <tbody>${pagina.map((r) => {
            const d = r.qtdApl / r.qtdRec - 1;
            return `
            <tr title="Fechada em ${Util.data(r.fechamento)} · ${Util.escapar(r.executor)}">
              <td>${Util.escapar(r.os)}</td><td>${r.executada ? Util.data(r.executada) : '—'}</td><td>${r.fechamento ? Util.data(r.fechamento) : '—'}</td><td>${Util.escapar(r.safra)}</td><td>${Util.escapar(r.empresa)}</td><td>${Util.escapar(r.fazenda)}</td>
              <td>${Util.escapar(r.talhao)}</td><td>${Util.escapar(r.operacao)}</td><td>${Util.escapar(r.produto)}</td>
              <td class="tabela__numero">${qtdOS(r.qtdRec, r.unidade)}</td><td class="tabela__numero">${qtdOS(r.qtdApl, r.unidade)}</td>
              <td class="dr-centro"><span class="dr-etiqueta dr-cor--${faixaOS(d)}">${pctOS(d)}</span></td></tr>`;
          }).join('')}</tbody>
        </table></div>
        <div class="orc-paginacao fp-os__pag">
          <span class="orc-paginacao__texto">${fmt(de)}–${fmt(ate)} de ${fmt(ls.length)} OS</span>
          <button class="botao-icone" type="button" data-fp-os-pagina="${os.pagina - 1}" ${os.pagina <= 1 ? 'disabled' : ''} aria-label="Página anterior">${Icones.anterior}</button>
          <span class="orc-paginacao__texto">Página ${os.pagina} de ${paginas}</span>
          <button class="botao-icone" type="button" data-fp-os-pagina="${os.pagina + 1}" ${os.pagina >= paginas ? 'disabled' : ''} aria-label="Próxima página">${Icones.proxima}</button>
        </div>`;
  }

  function abrirProduto(nome) {
    const x = previsao().find((p) => p.produto === nome);
    if (!x) return;
    // Navegar entre os produtos, na ordem da tabela da página
    const ordem = simulacao(previsao()).filter(passaSituacao).map((p) => p.produto);
    const pos = ordem.indexOf(nome);
    const seta = (alvo, passo, icone, rotulo) => `
        <button class="botao-icone painel-talhao__seta" type="button" data-fp-ir="${alvo ? Util.escapar(alvo) : ''}" data-fp-passo="${passo}" ${alvo ? '' : 'disabled'}
                title="${alvo ? `${rotulo}: ${Util.escapar(alvo)}` : rotulo}" aria-label="${rotulo}${alvo ? `: ${Util.escapar(alvo)}` : ''}">${icone}</button>`;
    const un = x.unidade;
    // Com a dose recomendada (05/11/2026): a operação em que o estoque acaba e quanto falta
    const rRec = risco(x, 1);
    const faltante = Math.max(0, x.restante - x.estoque);
    const ops = operacoesDoProduto(x);
    const totalPlanejado = ops.reduce((t, o) => t + o.rec, 0);
    const planos = planosFiltrados().filter((p) => x.porFazenda[p.fazenda]);
    const contexto = [...new Set(planos.map((p) => `Safra ${p.safra} · ${p.cultura} · Fazenda ${p.fazenda}`))].join(' | ');
    const sinal = (d) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${fmt(Math.round(Math.abs(d * 100)))}%`;
    const daRestante = (v) => (x.restante > 0 ? `${fmt(Math.round(v / x.restante * 100))}% da necessidade restante` : '—');
    // Cartões (05/11/2026, imagem da usuária): Quantidade total planejada · Necessidade restante · Estoque disponível ·
    // Quantidade faltante (em vermelho; sem falta, "Sem falta" em verde), no padrão dos cartões da página
    const cartaoModal = (id, icone, titulo, valor, texto) => `
          <div class="orc-card fp-ind fp-mc fp-mc--${id}"><span class="orc-card__icone" aria-hidden="true">${icone}</span>
            <div class="orc-card__corpo"><span class="orc-card__rotulo">${titulo}</span><strong class="orc-card__numero">${valor}</strong>
              <span class="fp-ind__texto">${texto}</span></div></div>`;
    const { elemento, fechar } = Modal.abrir(`
      <div class="modal__corpo fp-modal">
        <button class="botao-icone fp-modal__x" type="button" data-fechar aria-label="Fechar" title="Fechar">${Icones.fechar}</button>
        <header class="fp-modal__cab">
          <h2 class="fp-modal__titulo" id="modal-titulo">${Util.escapar(x.produto)}</h2>
          <span class="fp-modal__insumo">${Util.escapar(classeDe(x))}</span>
          <p class="fp-modal__contexto">${Util.escapar(contexto)}</p>
        </header>
        <div class="orc-cards fp-mcards">
          ${cartaoModal('total', Icones.camadas, 'Quantidade total planejada', qtd(totalPlanejado, un), 'Todas as operações do plano')}
          ${cartaoModal('restante', Icones.calendario, 'Necessidade restante', qtd(x.restante, un), 'Para concluir as operações planejadas')}
          ${cartaoModal('estoque', Icones.caixa, 'Estoque disponível', qtd(x.estoque, un), daRestante(x.estoque))}
          ${faltante > 0 ? cartaoModal('faltante', Icones.alerta, 'Quantidade faltante', qtd(faltante, un), daRestante(faltante))
            : cartaoModal('sem-falta', Icones.caixaOk, 'Quantidade faltante', 'Sem falta', 'O estoque cobre a necessidade restante')}
        </div>
        <section class="fp-secao fp-modal__grafico" aria-labelledby="fp-graf-titulo">
          <h3 class="fp-secao__titulo" id="fp-graf-titulo">Projeção do estoque por operação</h3>
          <p class="fp-modal__sub">Saldo estimado de estoque após cada aplicação, conforme o planejamento.</p>
          <ul class="fp-legenda">
            <li><span class="fp-legenda__traco fp-legenda__traco--est-atual"></span>Estoque atual</li>
            <li><span class="fp-legenda__traco fp-legenda__traco--prevista"></span>Estoque previsto com a dose recomendada</li>
            <!-- Estoque insuficiente: o trecho vermelho pontilhado depois da falta (a linha vertical não tem legenda, o selo já explica) -->
            ${rRec ? '<li><span class="fp-legenda__traco fp-legenda__traco--sem-estoque"></span>Estoque insuficiente</li>' : ''}
          </ul>
          ${ops.length ? '<div class="fp-graf-area" data-fp-graf></div>' : '<p class="ind-vazio">Nenhuma operação com esse produto nos filtros.</p>'}
        </section>
        <!-- OS do produto (05/11/2026): fechada ao abrir; o botão abre a tabela embaixo e o gráfico diminui para caber -->
        <section class="fp-secao fp-modal__os" aria-labelledby="fp-os-titulo">
          <!-- O título abre e fecha a tabela (05/11/2026, imagem da usuária): a seta verde à esquerda -->
          <h3 class="fp-secao__titulo fp-os__cab" id="fp-os-titulo">
            <button class="fp-os__alternar" type="button" data-fp-os-alternar aria-expanded="false" aria-controls="fp-os-tabela"></button>
          </h3>
          <div id="fp-os-tabela" data-fp-os hidden></div>
        </section>
      </div>
      <div class="modal__rodape fp-modal__rodape">
        <nav class="fp-modal__navegar" aria-label="Navegar entre os produtos">
          ${seta(ordem[pos - 1], -1, Icones.voltar, 'Produto anterior')}
          <span class="painel-talhao__posicao">Produto ${pos + 1} de ${ordem.length}</span>
          ${seta(ordem[pos + 1], 1, Icones.seta, 'Próximo produto')}
        </nav>
      </div>`, { classe: 'modal--tela' });
    // Desenha o gráfico no tamanho da área que sobra (todo o modal cabe na tela, sem rolar); refaz ao redimensionar
    // Cada aplicação com pelo menos 76 px; se não couber, o gráfico rola na horizontal, abre na última aplicação feita
    // (uma antes de hoje) e o eixo do estoque fica parado à esquerda
    const ESPACO_MIN = 76;
    const desenharGrafico = () => {
      const area = elemento.querySelector('[data-fp-graf]');
      if (!area) return;
      const largura = Math.max(320, Math.floor(area.clientWidth));
      const L = Math.max(largura, 100 + ops.length * ESPACO_MIN);
      const rola = L > largura;
      const A = Math.max(150, Math.floor(area.clientHeight) - (rola ? 14 : 0));
      const g = graficoEstoque(ops, un, x, L, A, rRec && rRec.data, rola);
      const antes = area.querySelector('.fp-graf-rolagem');
      const scrollAntes = antes ? antes.scrollLeft : null;
      area.innerHTML = rola
        ? `<div class="fp-graf-rolagem">${g.svg}</div><div class="fp-graf__eixo-y" aria-hidden="true">${g.eixo}</div>`
        : g.svg;
      if (rola) {
        const r = area.querySelector('.fp-graf-rolagem');
        r.scrollLeft = scrollAntes ?? Math.max(0, g.xDe(Math.max(0, g.ultimaFeita)) - 80);
      }
    };
    desenharGrafico();
    const observador = new ResizeObserver(() => { if (!elemento.isConnected) observador.disconnect(); else desenharGrafico(); });
    observador.observe(elemento.querySelector('.fp-modal__grafico'));
    // Tabela das OS: abre no maior desvio; ordenar e passar páginas redesenham só ela
    const regsOS = Telas.desviosRecomendacao.registros(planosFiltrados())
      .filter((r) => r.produto === x.produto && marcado('talhao', `${r.fazenda}|${r.talhao}`));
    const os = { coluna: 'desvio', sentido: 'desc', pagina: 1 };
    const caixaOS = elemento.querySelector('[data-fp-os]');
    const desenharOS = (foco) => { caixaOS.innerHTML = tabelaOS(regsOS, os); if (foco) caixaOS.querySelector(foco)?.focus(); };
    desenharOS();
    // Exibir / Ocultar OS do produto: abre fechada; aberta, o modal ganha a classe que diminui o gráfico
    const botaoOS = elemento.querySelector('[data-fp-os-alternar]');
    const mostrarOS = (aberta) => {
      caixaOS.hidden = !aberta;
      botaoOS.setAttribute('aria-expanded', String(aberta));
      botaoOS.innerHTML = `<span class="fp-os__seta">${aberta ? Icones.abaixo : Icones.proxima}</span>Histórico de OS do produto`;
      botaoOS.title = aberta ? 'Recolher' : `Expandir (${fmt(regsOS.length)} OS)`;
      elemento.querySelector('.fp-modal').classList.toggle('fp-modal--com-os', aberta);
    };
    mostrarOS(false);
    botaoOS.disabled = !regsOS.length;
    // Ao expandir, o gráfico fica com a altura que tinha (não encolhe) e o modal rola até a tabela; ao recolher, ele volta
    // a ocupar o espaço livre
    botaoOS.addEventListener('click', () => {
      const abrir = caixaOS.hidden;
      const secao = elemento.querySelector('.fp-modal__grafico');
      secao.style.flex = abrir ? `0 0 ${secao.getBoundingClientRect().height}px` : '';
      mostrarOS(abrir);
      if (abrir) elemento.querySelector('.fp-modal__os').scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    caixaOS.addEventListener('click', (e) => {
      const ord = e.target.closest('[data-fp-os-ordenar]');
      if (ord) {
        const id = ord.dataset.fpOsOrdenar;
        os.sentido = os.coluna === id && os.sentido === 'asc' ? 'desc' : 'asc';
        os.coluna = id; os.pagina = 1;
        desenharOS(`[data-fp-os-ordenar="${id}"]`);
        return;
      }
      const pag = e.target.closest('[data-fp-os-pagina]');
      if (pag && !pag.disabled) { os.pagina = Number(pag.dataset.fpOsPagina); desenharOS('[data-fp-os-pagina]:not([disabled])'); }
    });
    elemento.addEventListener('click', (e) => {
      const ir = e.target.closest('[data-fp-ir]');
      if (!ir || !ir.dataset.fpIr) return;
      // Outro produto: abre no lugar deste, com o foco na mesma seta
      fechar();
      abrirProduto(ir.dataset.fpIr);
      document.querySelector(`.modal--tela [data-fp-passo="${ir.dataset.fpPasso}"]:not([disabled])`)?.focus();
    });
  }

  function corpo() {
    const lista = previsao();
    return `${cartoes(lista)}${tabela(lista)}`;
  }
  // Indicadores (05/11/2026, imagem da usuária; antes o quadro "Resumo da situação dos produtos" com três cartões):
  // o título "Risco de falta de produto" e três cartões lado a lado, Total de produtos · Estoque suficiente · Estoque
  // insuficiente (falta com ou sem desvio: as situações Falta com desvio e Falta sem desvio da tabela juntas), com o
  // ícone ao lado do título, o número grande e "X% do total" (no Total, "Produtos analisados").
  const ICONE_IND = { total: () => Icones.caixa, suficiente: () => Icones.caixaOk, desvio: () => Icones.alerta, falta: () => Icones.caixaX, afetadas: () => Icones.alerta };
  function cartoes(lista) {
    const total = lista.length;
    // No padrão do Resumo do orçamento: ícone num círculo à esquerda, rótulo pequeno em cinza e o número grande; o
    // texto de apoio ("89% do total") embaixo, pequeno
    const ind = (id, titulo, n, texto) => `
            <div class="orc-card fp-ind fp-ind--${id}"><span class="orc-card__icone" aria-hidden="true">${ICONE_IND[id]()}</span>
              <div class="orc-card__corpo"><span class="orc-card__rotulo">${titulo}</span><strong class="orc-card__numero">${fmt(n)}</strong>
                <span class="fp-ind__texto">${texto}</span></div></div>`;
    return `
        <section class="cartao orc-secao fp-resumo" aria-labelledby="fp-titulo-inds">
          <h2 class="orc-secao__titulo" id="fp-titulo-inds">Risco de falta de produto</h2>
          <div class="orc-cards fp-inds">
            ${ind('total', 'Total de produtos', total, total ? 'Produtos analisados' : 'Nenhum produto a aplicar')}
            ${[['suficiente', 'Estoque suficiente', (x) => x.situacao === 'suficiente'],
               ['falta', 'Estoque insuficiente', (x) => x.situacao !== 'suficiente']].map(([id, titulo, conta]) => {
              const n = lista.filter(conta).length;
              return ind(id, titulo, n, total ? `${fmt(Math.round(n / total * 100))}% do total` : '—');
            }).join('')}
            <!-- O cartão Operações afetadas saiu em 05/11/2026 (não contribuiu muito) -->
          </div>
        </section>`;
  }


  function opcoes(chave) {
    if (chave === 'situacao') return SITUACOES;
    if (chave === 'talhao') {
      const vistos = new Map();
      planosPara('talhao').forEach((p) => Util.talhoesPlano(p, Versoes.ultimaPublicada(p)).forEach((t) => {
        const valor = `${p.fazenda}|${t.nome}`;
        if (!vistos.has(valor)) vistos.set(valor, { valor, nome: `${p.fazenda} · ${t.nome}`, extra: Util.area(t.area) });
      }));
      return [...vistos.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));
    }
    if (chave === 'insumo' || chave === 'produto' || chave === 'operacao') {
      const lista = insumos().filter((i) => (DEPENDE[chave] || []).every((c) => marcado(c, c === 'insumo' ? classeDe(i) : i.produto)));
      // Insumo (04/11/2026): a classe do produto (Fungicida, Herbicida…), a mesma da coluna Insumo e da etiqueta do modal
      if (chave === 'insumo') {
        return [...new Set(lista.map((i) => classeDe(i)))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((g) => ({ valor: g, nome: g }));
      }
      if (chave === 'produto') {
        return [...new Set(lista.map((i) => i.produto))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((n) => ({ valor: n, nome: n }));
      }
      return [...new Set(lista.map((i) => i.operacao))].map((n) => ({ valor: n, nome: n }));
    }
    const presentes = new Set(planosPara(chave).map(valorDe[chave]));
    if (chave === 'ano') return [...presentes].sort((a, b) => Number(b) - Number(a)).map((x) => ({ valor: x, nome: x }));
    if (chave === 'safra') return Util.ordenarSafras([...presentes]).map((x) => ({ valor: x, nome: x }));
    const ordem = { atividade: DADOS.atividades, cultura: DADOS.culturasPlanos, empresa: DADOS.empresas, fazenda: DADOS.fazendas }[chave];
    return ordem.filter((x) => presentes.has(x)).map((x) => ({ valor: x, nome: x }));
  }

  const barra = BarraFiltros.criar({
    id: 'fp',
    estado: () => est,
    campos: () => FILTROS,
    mais: () => MAIS_FILTROS,
    opcoes,
    depende: DEPENDE,
    padrao: () => ({ talhao: 'todos', insumo: 'todos', produto: 'todos', operacao: 'todos', situacao: 'todos' }),
    aoMudar: () => { est.pagina = 1; if (caixaCorpo && caixaCorpo.isConnected) caixaCorpo.innerHTML = corpo(); }
  });

  // cab: o cabeçalho da página (título e guias)
  function desenhar(cab = '') {
    est = est || novoEstado();
    return `
      ${cab}
      <div class="pagina ma fp">
        <section class="cartao filtros" aria-label="Filtrar o risco de falta de produto" data-fp-filtros></section>
        <div data-fp-corpo></div>
      </div>`;
  }

  function aoMostrar(conteudo) {
    est = est || novoEstado();
    FiltrosBase.ler(est);
    barra.ligar(conteudo.querySelector('[data-fp-filtros]'));
    caixaCorpo = conteudo.querySelector('[data-fp-corpo]');
    caixaCorpo.innerHTML = corpo();
    // Clicar na linha (ou Enter) abre o modal do produto
    caixaCorpo.addEventListener('keydown', (e) => {
      const tr = e.target.closest('[data-fp-produto]');
      if (tr && e.target === tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirProduto(tr.dataset.fpProduto); }
    });
    caixaCorpo.addEventListener('click', (e) => {
      const tr = e.target.closest('[data-fp-produto]');
      if (tr) { abrirProduto(tr.dataset.fpProduto); return; }
      // Páginas da tabela
      const pag = e.target.closest('[data-fp-pagina]');
      if (pag && !pag.disabled) {
        est.pagina = Number(pag.dataset.fpPagina);
        caixaCorpo.innerHTML = corpo();
        caixaCorpo.querySelector('[data-fp-pagina]:not([disabled])')?.focus();
      }
    });
    caixaCorpo.addEventListener('change', (e) => {
      if (!e.target.matches('[data-fp-por-pagina]')) return;
      est.porPagina = Number(e.target.value); est.pagina = 1;
      caixaCorpo.innerHTML = corpo();
      caixaCorpo.querySelector('[data-fp-por-pagina]')?.focus();
    });
  }

  // previsao: para conferir as contas (e montar o estoque de exemplo)
  return { desenhar, aoMostrar, previsao: () => { est = est || novoEstado(); return previsao(); },
    simulacao: () => { est = est || novoEstado(); return simulacao(previsao()); } };
})();
