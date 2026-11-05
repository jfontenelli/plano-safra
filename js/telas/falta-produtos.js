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
 * Embaixo, o cartão "Simulação das próximas aplicações" (04/11/2026): Aplicar dose recomendada · Manter desvio médio (abre
 * neste) e a tabela Insumo · Produto · Cobertura do estoque (estoque ÷ necessidade restante ou com desvio) · Operação com
 * risco de falta (seguindo as aplicações na ordem da data planejada, a primeira em que o estoque acaba) · Data prevista
 * de falta (a data planejada dela) · Situação (a do cartão; não muda com o botão).
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
    ['produto', 'Produto', ['Todos', 'Nenhum', 'produtos'], 124]
  ];
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
    const e = { talhao: 'todos', insumo: 'todos', produto: 'todos', operacao: 'todos', busca: {}, filtroAberto: null, modo: 'desvio' };
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
      const situacao = estoque < n.restante ? 'falta' : estoque < comDesvio ? 'desvio' : 'suficiente';
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
      const fator = est.modo === 'recomendada' ? 1 : 1 + x.desvio;
      const necessidade = x.restante * fator;
      const cobertura = necessidade > 0 ? x.estoque / necessidade : Infinity;
      const ordem = [...x.aplicacoes].sort((a, b) => (a.data || '9999').localeCompare(b.data || '9999') || a.talhao.localeCompare(b.talhao, 'pt-BR', { numeric: true }));
      let soma = 0;
      const risco = ordem.find((a) => { soma += a.quantidade * fator; return soma > x.estoque + 1e-9; }) || null;
      return { ...x, cobertura, risco };
    }).sort((a, b) => ((a.risco && a.risco.data) || '9999').localeCompare((b.risco && b.risco.data) || '9999')
      || a.cobertura - b.cobertura || a.produto.localeCompare(b.produto, 'pt-BR'));
  }
  const dataCurta = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
  function tabela(lista) {
    const linhas = simulacao(lista);
    return `
        <section class="cartao fp-secao" aria-labelledby="fp-sim-titulo">
          <h3 class="fp-secao__titulo" id="fp-sim-titulo">Simulação das próximas aplicações</h3>
          <div class="fp-modo" role="group" aria-label="Simulação">
            ${[['recomendada', 'Aplicar dose recomendada'], ['desvio', 'Manter desvio médio']].map(([v, rot]) => `
              <button class="botao botao--p ${est.modo === v ? 'botao--primario' : 'botao--secundario'}" type="button" data-fp-modo="${v}"
                      aria-pressed="${est.modo === v}">${rot}</button>`).join('')}
          </div>
          ${!linhas.length ? '<p class="ind-vazio">Nenhum produto a aplicar com esses filtros.</p>' : `
          <div class="tabela-rolagem"><table class="tabela fp-tabela">
            <thead><tr><th>Insumo</th><th>Produto</th><th class="tabela__numero">Cobertura do estoque</th>
              <th>Operação com risco de falta</th><th>Data prevista de falta</th><th>Situação</th></tr></thead>
            <tbody>${linhas.map((x) => `
              <tr class="fp-linha" data-fp-produto="${Util.escapar(x.produto)}" tabindex="0" title="Ver a previsão de ${Util.escapar(x.produto)}">
                <td>${Util.escapar(classeDe(x))}</td><td>${Util.escapar(x.produto)}</td>
                <td class="tabela__numero">${Number.isFinite(x.cobertura) ? `${fmt(Math.round(x.cobertura * 100))}%` : '—'}</td>
                <td ${x.risco ? `title="${Util.escapar(`${x.risco.fazenda} · ${x.risco.talhao}`)}"` : ''}>${x.risco ? Util.escapar(x.risco.operacao) : '—'}</td>
                <td>${x.risco ? dataCurta(x.risco.data) : '—'}</td>
                <td class="fp-sit fp-sit--${x.situacao}">${nomeSituacao[x.situacao]}</td>
              </tr>`).join('')}</tbody>
          </table></div>`}
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
  // Gráfico do estoque (o único do modal, 04/11/2026): a mesma linha do tempo; o estoque até hoje em linha
  // cheia (reconstruído: o atual + o que foi aplicado depois de cada data) e as duas previsões tracejadas (dose
  // recomendada e mantendo o desvio), caindo a cada aplicação até zerar. Cores validadas: verde, azul e vermelho
  // faltas: { rec, desv } as datas (planejadas) em que o estoque acaba com a dose recomendada e mantendo o desvio
  function graficoEstoque(ops, un, x0, L = 1200, A = 300, faltas = {}) {
    const datasFalta = [faltas.rec, faltas.desv].filter(Boolean);
    const esq = 56; const dir = 24; const topo = 40; const base = A - alturaEixo(ops);
    const ini = esq + 20;
    const x = (i) => (ops.length === 1 ? (esq + L - dir) / 2 : ini + i * ((L - dir - 20 - ini) / (ops.length - 1)));
    const comAplicado = ops.map((o, i) => (o.aplicado > 0 ? i : -1)).filter((i) => i >= 0);
    const ultimaFeita = comAplicado.length ? comAplicado[comAplicado.length - 1] : -1;
    // Até hoje: depois de cada aplicação feita, o atual + o aplicado nas datas seguintes
    const ate = comAplicado.map((i) => [i, x0.estoque + ops.slice(i + 1).reduce((t, o) => t + o.aplicado, 0)]);
    const previsao = (fator) => {
      let usado = 0;
      const pts = ultimaFeita >= 0 ? [[ultimaFeita, x0.estoque]] : [];
      let zera = null;
      ops.forEach((o, i) => {
        if (!o.aFazer || i <= ultimaFeita && ultimaFeita >= 0 && !o.aFazer) return;
        usado += o.aFazer * fator;
        const v = x0.estoque - usado;
        if (v < 0 && !zera) zera = o.data;
        pts.push([i, Math.max(0, v)]);
      });
      return { pts, zera };
    };
    const rec = previsao(1);
    const desv = previsao(1 + x0.desvio);
    const max = Math.max(1, x0.estoque, ...ate.map(([, v]) => v));
    const passo = [1, 2, 2.5, 5, 10].map((m) => m * 10 ** Math.floor(Math.log10(max / 4))).find((v) => max / v <= 5) || max / 4;
    const teto = Math.ceil(max / passo) * passo;
    const y = (v) => base - (v / teto) * (base - topo);
    const marcas = [];
    for (let v = 0; v <= teto + 1e-9; v += passo) marcas.push(v);
    const linha = (pts) => pts.map(([i, v], k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const ponto = (cls, [i, v], dica) => `<circle class="fp-graf__mk ${cls}" cx="${x(i)}" cy="${y(v)}" r="3.5"><title>${Util.escapar(dica)}</title></circle>`;
    return `
      <svg class="fp-graf" viewBox="0 0 ${L} ${A}" width="${L}" height="${A}" role="img" aria-label="Estoque de ${Util.escapar(x0.produto)}">
        <text class="fp-graf__eixo-titulo" x="${esq - 44}" y="${topo - 18}">Estoque (${Util.escapar(un)})</text>
        ${marcas.map((v) => `<line class="fp-graf__grade" x1="${esq}" x2="${L - dir}" y1="${y(v)}" y2="${y(v)}"/>
          <text class="fp-graf__marca" x="${esq - 10}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('')}
        ${ate.length > 1 ? `<path class="fp-graf__linha fp-graf__linha--est-atual" d="${linha(ate)}"/>` : ''}
        ${rec.pts.length > 1 ? `<path class="fp-graf__linha fp-graf__linha--est-rec" d="${linha(rec.pts)}"/>` : ''}
        ${desv.pts.length > 1 ? `<path class="fp-graf__linha fp-graf__linha--est-desv" d="${linha(desv.pts)}"/>` : ''}
        ${ate.map((pt) => ponto('fp-graf__mk--est-atual', pt, `${dataCurta(ops[pt[0]].data)}: ${qtd(pt[1], un)} em estoque`)).join('')}
        ${rec.pts.slice(ultimaFeita >= 0 ? 1 : 0).map((pt) => ponto('fp-graf__mk--est-rec', pt, `${dataCurta(ops[pt[0]].data)} · com a dose recomendada: ${pt[1] > 0 ? `${qtd(pt[1], un)} em estoque` : 'sem estoque'}`)).join('')}
        ${desv.pts.slice(ultimaFeita >= 0 ? 1 : 0).map((pt) => ponto('fp-graf__mk--est-desv', pt, `${dataCurta(ops[pt[0]].data)} · com desvio: ${pt[1] > 0 ? `${qtd(pt[1], un)} em estoque` : 'sem estoque'}`)).join('')}
        ${linhasFalta()}
        ${eixoDatas(ops, x, base)}
      </svg>`;
    // Linhas verticais tracejadas na data planejada em que o estoque acaba: azul = sem desvio (dose recomendada),
    // vermelha = com desvio. Na mesma data, uma linha só, tracejada em azul e vermelho, "Falta com e sem desvio"
    function linhasFalta() {
      const iRec = faltas.rec ? ops.findIndex((o) => o.data === faltas.rec) : -1;
      const iDesv = faltas.desv ? ops.findIndex((o) => o.data === faltas.desv) : -1;
      // lado: 'centro' (centrado na linha), 'esq' (termina na linha) ou 'dir' (começa na linha)
      const selo = (i, texto, cls, linhaY, lado = 'centro') => {
        const larg = texto.length * 6.6 + 20;
        const alvo = lado === 'esq' ? x(i) - 4 - larg / 2 : lado === 'dir' ? x(i) + 4 + larg / 2 : x(i);
        const cx = Math.max(esq + larg / 2, Math.min(alvo, L - dir - larg / 2));
        return `<g class="fp-graf__selo ${cls}"><rect x="${cx - larg / 2}" y="${linhaY}" width="${larg}" height="22" rx="6"/>
          <text x="${cx}" y="${linhaY + 15}" text-anchor="middle">${texto}</text></g>`;
      };
      const vertical = (i, cls) => `<line class="fp-graf__falta ${cls}" x1="${x(i)}" x2="${x(i)}" y1="${topo - 6}" y2="${base}"/>`;
      if (iRec >= 0 && iRec === iDesv) {
        return `${vertical(iRec, 'fp-graf__falta--rec')}${vertical(iRec, 'fp-graf__falta--desv fp-graf__falta--meio')}
          ${selo(iRec, `Falta com e sem desvio · ${dataCurta(faltas.rec)}`, 'fp-graf__selo--ambas', topo - 32)}`;
      }
      // Rótulos na mesma altura: com duas linhas, o da esquerda termina encostado na sua linha e o da direita começa
      // encostado na sua (não se cobrem); com uma linha, centrado nela
      const ordem = [[iDesv, 'desv', `Falta com desvio · ${dataCurta(faltas.desv)}`], [iRec, 'rec', `Falta sem desvio · ${dataCurta(faltas.rec)}`]]
        .filter(([i]) => i >= 0).sort((a, b) => a[0] - b[0]);
      return ordem.map(([i, cls, texto], n) => `${vertical(i, `fp-graf__falta--${cls}`)}
          ${selo(i, texto, `fp-graf__selo--${cls}`, topo - 32, ordem.length > 1 ? (n ? 'dir' : 'esq') : 'centro')}`).join('');
    }
  }

  // Etiqueta ao lado do nome do produto e coluna Insumo da tabela: a classe do cadastro (Fungicida, Herbicida, Inseticida, Micronutriente…);
  // sem classe (ex.: sementes), o grupo de insumo (04/11/2026)
  const classeDe = (x) => ((DADOS.defensivos || []).find((d) => d.produto === x.produto) || {}).classe || x.grupo;
  // Modal do produto (tela toda): cabeçalho, três cartões no padrão da página (Estoque · Se o desvio continuar · Aplicando
  // a dose recomendada), o gráfico do estoque (sem o aviso embaixo, 04/11/2026) e, no rodapé, o desvio médio e ‹ Produto 1 de 9 ›
  function abrirProduto(nome) {
    const x = previsao().find((p) => p.produto === nome);
    if (!x) return;
    // Navegar entre os produtos, na ordem da tabela da página
    const ordem = simulacao(previsao()).map((p) => p.produto);
    const pos = ordem.indexOf(nome);
    const seta = (alvo, passo, icone, rotulo) => `
        <button class="botao-icone painel-talhao__seta" type="button" data-fp-ir="${alvo ? Util.escapar(alvo) : ''}" data-fp-passo="${passo}" ${alvo ? '' : 'disabled'}
                title="${alvo ? `${rotulo}: ${Util.escapar(alvo)}` : rotulo}" aria-label="${rotulo}${alvo ? `: ${Util.escapar(alvo)}` : ''}">${icone}</button>`;
    const un = x.unidade;
    const rRec = risco(x, 1);
    const rDesv = risco(x, 1 + x.desvio);
    const faltaRec = Math.max(0, x.restante - x.estoque);
    const faltaDesv = Math.max(0, x.comDesvio - x.estoque);
    const ops = operacoesDoProduto(x);
    const planos = planosFiltrados().filter((p) => x.porFazenda[p.fazenda]);
    const contexto = [...new Set(planos.map((p) => `Safra ${p.safra} · ${p.cultura} · Fazenda ${p.fazenda}`))].join(' | ');
    const fazendas = Object.keys(x.porFazenda).length;
    const sinal = (d) => `${d > 0 ? '+' : d < 0 ? '−' : ''}${fmt(Math.round(Math.abs(d * 100)))}%`;
    const { elemento, fechar } = Modal.abrir(`
      <div class="modal__corpo fp-modal">
        <button class="botao-icone fp-modal__x" type="button" data-fechar aria-label="Fechar" title="Fechar">${Icones.fechar}</button>
        <header class="fp-modal__cab">
          <h2 class="fp-modal__titulo" id="modal-titulo">${Util.escapar(x.produto)}</h2>
          <span class="fp-modal__insumo">${Util.escapar(classeDe(x))}</span>
          <p class="fp-modal__contexto">${Util.escapar(contexto)}</p>
        </header>
        <div class="orc-cards fp-cards">
          ${cartao('suficiente', 'Estoque', qtd(x.estoque, un), fazendas > 1 ? 'Disponível nas fazendas' : 'Disponível na fazenda')}
          ${cartao('m-desvio', 'Se o desvio continuar', faltaDesv > 0 ? `Faltarão ${qtd(faltaDesv, un)}` : 'Sem falta prevista',
            rDesv ? `${Util.escapar(rDesv.operacao)} · ${dataLonga(rDesv.data)}` : 'O estoque cobre as próximas aplicações')}
          ${cartao('m-rec', 'Aplicando a dose recomendada', faltaRec > 0 ? `Faltarão ${qtd(faltaRec, un)}` : 'Sem falta prevista',
            rRec ? `${Util.escapar(rRec.operacao)} · ${dataLonga(rRec.data)}` : 'O estoque cobre as próximas aplicações')}
        </div>
        <section class="cartao fp-secao fp-modal__grafico" aria-labelledby="fp-graf-titulo">
          <h3 class="fp-secao__titulo" id="fp-graf-titulo">Estoque do produto</h3>
          <p class="fp-modal__sub">Estoque até hoje e previsão para as próximas aplicações.</p>
          <ul class="fp-legenda">
            <!-- Ordem (04/11/2026): Estoque · Previsão com desvio · Falta com desvio · Previsão com a dose recomendada · Falta sem desvio -->
            <li><span class="fp-legenda__traco fp-legenda__traco--est-atual"></span>Estoque</li>
            <li><span class="fp-legenda__traco fp-legenda__traco--est-desv"></span>Previsão com desvio</li>
            ${rDesv ? '<li><span class="fp-legenda__traco fp-legenda__traco--falta-desv"></span>Falta com desvio</li>' : ''}
            <li><span class="fp-legenda__traco fp-legenda__traco--est-rec"></span>Previsão com a dose recomendada</li>
            ${rRec ? '<li><span class="fp-legenda__traco fp-legenda__traco--falta-rec"></span>Falta sem desvio</li>' : ''}
          </ul>
          ${ops.length ? '<div class="fp-graf-area" data-fp-graf></div>' : '<p class="ind-vazio">Nenhuma operação com esse produto nos filtros.</p>'}
        </section>
      </div>
      <div class="modal__rodape fp-modal__rodape">
        <span>Desvio médio da safra atual: ${sinal(x.desvio)}</span>
        <nav class="fp-modal__navegar" aria-label="Navegar entre os produtos">
          ${seta(ordem[pos - 1], -1, Icones.voltar, 'Produto anterior')}
          <span class="painel-talhao__posicao">Produto ${pos + 1} de ${ordem.length}</span>
          ${seta(ordem[pos + 1], 1, Icones.seta, 'Próximo produto')}
        </nav>
      </div>`, { classe: 'modal--tela' });
    // Desenha o gráfico no tamanho da área que sobra (todo o modal cabe na tela, sem rolar); refaz ao redimensionar
    const desenharGrafico = () => {
      const area = elemento.querySelector('[data-fp-graf]');
      if (!area) return;
      const L = Math.max(320, Math.floor(area.clientWidth));
      const A = Math.max(150, Math.floor(area.clientHeight));
      area.innerHTML = graficoEstoque(ops, un, x, L, A, { rec: rRec && rRec.data, desv: rDesv && rDesv.data });
    };
    desenharGrafico();
    const observador = new ResizeObserver(() => { if (!elemento.isConnected) observador.disconnect(); else desenharGrafico(); });
    observador.observe(elemento.querySelector('.fp-modal__grafico'));
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
  const ICONE_IND = { total: () => Icones.caixa, suficiente: () => Icones.caixaOk, desvio: () => Icones.alerta, falta: () => Icones.caixaX };
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
          </div>
        </section>`;
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
    padrao: () => ({ talhao: 'todos', insumo: 'todos', produto: 'todos', operacao: 'todos' }),
    aoMudar: () => { if (caixaCorpo && caixaCorpo.isConnected) caixaCorpo.innerHTML = corpo(); }
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
    // Aplicar dose recomendada · Manter desvio médio; clicar na linha (ou Enter) abre o modal do produto
    caixaCorpo.addEventListener('keydown', (e) => {
      const tr = e.target.closest('[data-fp-produto]');
      if (tr && e.target === tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); abrirProduto(tr.dataset.fpProduto); }
    });
    caixaCorpo.addEventListener('click', (e) => {
      const tr = e.target.closest('[data-fp-produto]');
      if (tr) { abrirProduto(tr.dataset.fpProduto); return; }
      const b = e.target.closest('[data-fp-modo]');
      if (!b) return;
      est.modo = b.dataset.fpModo;
      caixaCorpo.innerHTML = corpo();
      caixaCorpo.querySelector(`[data-fp-modo="${est.modo}"]`)?.focus();
    });
  }

  // previsao: para conferir as contas (e montar o estoque de exemplo)
  return { desenhar, aoMostrar, previsao: () => { est = est || novoEstado(); return previsao(); },
    simulacao: () => { est = est || novoEstado(); return simulacao(previsao()); } };
})();
