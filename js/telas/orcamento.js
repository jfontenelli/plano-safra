/*
 * Orçamento de Insumos do menu (antes Suprimentos; decisões em rascunhos/orcamento/README.md).
 * Todos os planos somados, na última versão publicada de cada um, no Ano Agrícola escolhido.
 *  - Moeda de exibição (R$ | US$): tudo é mostrado na moeda escolhida, convertido pela PTAX de referência.
 *  - Filtros: Ano Agrícola, Safra (Safra/Safrinha), Empresa, Fazenda, Talhão, Cultura e Insumos (grupo de insumo).
 *  - Estimativas de comercialização (Editar parâmetros): PTAX e, por cultura, preço e produtividade esperados.
 *  - Resumo do orçamento, Orçamento por tipo de insumo e Detalhamento do orçamento (Por produto · Por talhão).
 * Cálculo: necessidade = dose × área do talhão (sementes: população × área ÷ germinação, na embalagem da cultura);
 * custo = necessidade × valor unitário (DADOS.precosInsumos e precosSementes); a comprar = necessidade − estoque,
 * fazenda a fazenda, nunca negativo (DADOS.estoqueInsumos).
 */
window.Telas = window.Telas || {};

window.Telas.orcamento = (function () {
  const esc = Util.escapar;
  const CICLOS = ['Safra', 'Safrinha'];

  // Estado da sessão (só em memória): mantido ao navegar entre telas
  let moeda = 'R$';
  let filtros = {};
  let guiaDetalhe = 'produto';
  let busca = '';
  // Paginação do detalhamento: a pessoa escolhe quantos itens por página (começa em 10)
  const POR_PAGINA = [10, 20, 50, 100];
  let porPagina = 10;
  let pagina = 1;
  let multiAberto = null; // filtro de várias escolhas com a lista aberta
  // Ordenação do detalhamento, por guia: { coluna, sentido: 'asc' | 'desc' } (null = ordem padrão)
  const ordem = { produto: null, talhao: null };
  let congelado = true;   // cabeçalho, filtros e estimativas fixos no topo ao rolar (o alfinete descongela)
  // Parâmetros de cada Ano Agrícola: { ptax, linhas: [{ cultura, moeda, preco, produtividade }] }
  const parametros = {};

  // Sem ciclo informado (plano criado no modal), pelo nome da safra ("27/27", os dois anos iguais, é safrinha)
  const cicloDe = (p) => p.ciclo || (String(p.safra).split('/')[0] === String(p.safra).split('/')[1] ? 'Safrinha' : 'Safra');
  // Só planos publicados: o não iniciado (só a 0.1, vazia) fica fora, mesmo na área e na receita
  const publicados = () => DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p));
  // Ano Agrícola: uma escolha só (os parâmetros são do ano). Os outros: várias escolhas (vazio = todos)
  const filtrosIniciais = () => ({ anoAgricola: Util.anoAgricolaMaisRecente(Util.anosAgricolas(publicados())),
    ciclo: [], empresa: [], fazenda: [], talhao: [], cultura: [], insumo: [] });
  const passa = (campo, valor) => !filtros[campo].length || filtros[campo].includes(valor);

  // ----- Filtros -----
  // Planos do ano agrícola; com "ate", também os filtros de cima até aquele campo (as opções dependem dos de cima)
  const CAMPOS = ['ciclo', 'empresa', 'fazenda', 'cultura'];
  function planosFiltrados(ate) {
    const usados = ate ? CAMPOS.slice(0, CAMPOS.indexOf(ate)) : CAMPOS;
    const valor = (p, c) => (c === 'ciclo' ? cicloDe(p) : p[c]);
    return publicados().filter((p) => String(Util.anoAgricola(p.safra)) === filtros.anoAgricola
      && usados.every((c) => passa(c, valor(p, c))));
  }
  const talhoesDe = (p) => Util.talhoesPlano(p, Versoes.ultimaPublicada(p));
  function opcoes(campo) {
    if (campo === 'anoAgricola') return Util.anosAgricolas(publicados());
    if (campo === 'insumo') return DADOS.gruposInsumo;
    if (campo === 'talhao') {
      const nomes = new Set(planosFiltrados().flatMap((p) => talhoesDe(p).map((t) => t.nome)));
      return [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
    }
    const naLista = new Set(planosFiltrados(campo).map((p) => (campo === 'ciclo' ? cicloDe(p) : p[campo])));
    const cadastro = { ciclo: CICLOS, empresa: DADOS.empresas, fazenda: DADOS.fazendas, cultura: DADOS.culturasPlanos }[campo];
    return cadastro.filter((item) => naLista.has(item));
  }

  // ----- Parâmetros (PTAX e estimativa de comercialização), por Ano Agrícola -----
  const unidadeDe = (cultura) => (DADOS.comercializacao[cultura] || {}).unidade || 'sc';
  function parametrosDoAno() {
    const ano = filtros.anoAgricola;
    const par = parametros[ano] = parametros[ano] || { ptax: DADOS.ptaxReferencia, linhas: [] };
    // As culturas dos planos publicados do ano entram sozinhas, com os valores de exemplo
    const doAno = publicados().filter((p) => String(Util.anoAgricola(p.safra)) === ano);
    DADOS.culturasPlanos.filter((c) => doAno.some((p) => p.cultura === c)).forEach((cultura) => {
      if (par.linhas.some((l) => l.cultura === cultura)) return;
      const ex = DADOS.comercializacao[cultura] || {};
      par.linhas.push({ cultura, moeda: ex.moeda || 'R$', preco: ex.preco ?? null, produtividade: ex.produtividade ?? null, doPlano: true });
    });
    return par;
  }
  const ptax = () => parametrosDoAno().ptax || 0;
  // R$ → moeda de exibição (e o contrário para valores em US$)
  const emReais = (valor, m) => (m === 'US$' ? valor * ptax() : valor);
  const exibir = (reais) => (moeda === 'US$' ? (ptax() ? reais / ptax() : 0) : reais);
  // Preço da cultura (por saca ou arroba), em R$
  function precoCultura(cultura) {
    const l = parametrosDoAno().linhas.find((x) => x.cultura === cultura);
    return l && l.preco ? emReais(l.preco, l.moeda) : null;
  }

  // ----- Cálculo: uma linha por talhão × produto -----
  const cadastroDe = (nome) => DADOS.defensivos.find((d) => d.produto === nome) || {};
  const grupoDe = (cad) => DADOS.grupoInsumoPorClasse[cad.classe] || (cad.fertilidade ? 'Fertilizantes' : 'Defensivos');

  function consumo() {
    const itens = [];
    planosFiltrados().forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const talhoes = talhoesDe(p).filter((t) => passa('talhao', t.nome));
      Versoes.grupos(p, v).forEach((g) => g.operacoes.forEach((op) => talhoes.forEach((t) => {
        const base = { plano: p, talhao: t.nome, area: t.area };
        // Sementes, uma por variedade do talhão: população × área de aplicação ÷ germinação, na embalagem da cultura
        const linhasPl = Planos.linhasPlantio(op, t.nome);
        linhasPl.forEach((pl, i) => {
          if (!pl.variedade || !pl.populacao) return;
          const areaVar = Planos.areaLinhaPlantio(linhasPl, i, t.area) || 0;
          const germ = (Planos.germinacaoLinha(op, t.nome, pl) || 100) / 100;
          const emb = DADOS.embalagemSemente[p.cultura] || DADOS.embalagemSemente.Soja;
          const preco = DADOS.precosSementes[pl.variedade];
          itens.push({ ...base, produto: pl.variedade, grupo: 'Sementes', unidade: emb.texto,
            quantidade: pl.populacao * 1000 * areaVar / germ / emb.sementes, moedaPreco: 'R$', preco: preco ?? null });
        });
        const ajuste = op.talhoes && op.talhoes[t.nome];
        if (!ajuste) return;
        Planos.linhasTalhao(op, ajuste).forEach((linha) => {
          const cad = cadastroDe(linha.produto);
          const [moedaPreco, preco] = DADOS.precosInsumos[linha.produto] || ['R$', null];
          itens.push({ ...base, produto: linha.produto, grupo: grupoDe(cad), unidade: linha.unidade || cad.unidade || '',
            quantidade: Planos.doseTalhao(op, ajuste, linha) * t.area, moedaPreco, preco });
        });
      })));
    });
    return itens
      .filter((i) => passa('insumo', i.grupo))
      .map((i) => ({ ...i, custo: i.preco === null ? 0 : emReais(i.quantidade * i.preco, i.moedaPreco) }));
  }

  // Área de cada plano no filtro (talhões incluídos; com Talhão, só ele), por cultura
  function areas() {
    const porCultura = {};
    let total = 0;
    planosFiltrados().forEach((p) => {
      const a = talhoesDe(p).filter((t) => passa('talhao', t.nome)).reduce((s, t) => s + t.area, 0);
      total += a;
      porCultura[p.cultura] = (porCultura[p.cultura] || 0) + a;
    });
    return { total, porCultura };
  }
  const soma = (xs, f) => xs.reduce((s, x) => s + f(x), 0);

  // ----- Formatação -----
  const fmt = (n, casas = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  // Valores do dashboard arredondados, sem casa decimal; o que tem valor mas arredondaria para zero mostra 0,1
  const arred = (n) => (n > 0 && Math.round(n) === 0 ? fmt(0.1, 1) : fmt(n));
  const dinheiro = (reais) => `${moeda} ${arred(exibir(reais))}`;
  // Custo unitário: com centavos (arredondado, R$ 4,78/kg viraria R$ 5)
  const unitario = (reais) => `${moeda} ${fmt(exibir(reais), 2)}`;
  const quantidade = arred;
  const numero = (texto) => { const n = Number(String(texto).replace(/\./g, '').replace(',', '.')); return String(texto).trim() === '' || Number.isNaN(n) ? null : n; };
  const decimal = (n, casas) => (n === null || n === undefined ? '' : fmt(n, casas));
  // Custo por hectare em sacas (ou arrobas) da cultura: custo/ha ÷ preço da saca
  function emSacas(custo, area, cultura) {
    const preco = precoCultura(cultura);
    return area && preco ? custo / area / preco : null;
  }
  const textoSacas = (n, cultura) => (n === null ? '—' : `${arred(n)} ${unidadeDe(cultura)}/ha`);

  // ----- Desenho -----
  function desenhar() {
    if (!filtros.anoAgricola || !Util.anosAgricolas(publicados()).includes(filtros.anoAgricola)) filtros = filtrosIniciais();
    // Cabeçalho, filtros e estimativas ficam fixos no topo enquanto a página rola
    return `
      <div class="orc-fixo ${congelado ? '' : 'orc-fixo--solto'}">
      <header class="cabecalho orc-cabecalho">
        <div class="orc-topo">
          <h1 class="cabecalho__titulo">Orçamento de Insumos</h1>
          <span class="cag-etiqueta" title="Mostra a última versão publicada de cada plano. Alterações em versões em construção aparecem aqui depois de publicadas.">${Icones.info} Últimas versões publicadas</span>
        </div>
        <div class="orc-moeda" role="group" aria-label="Moeda de exibição">
          <span class="orc-moeda__rotulo" title="Os valores em outra moeda são convertidos pela PTAX de referência">Moeda de exibição ${Icones.info}</span>
          ${['R$', 'US$'].map((m) => `<button class="orc-moeda__opcao ${m === moeda ? 'orc-moeda__opcao--ativa' : ''}" type="button"
              data-orc-moeda="${m}" aria-pressed="${m === moeda}">${m}</button>`).join('')}
          ${botaoCongelar()}
        </div>
      </header>
      <div class="orc-fixo__barra">
        <section class="cartao filtros" aria-label="Filtrar o orçamento" data-orc-filtros></section>
        <section class="cartao orc-estimativas" aria-label="Estimativas de comercialização" data-orc-estimativas></section>
      </div>
      </div>
      <div class="pagina orc-pagina">
        <div class="orc-corpo" data-orc-corpo></div>
      </div>`;
  }

  function botaoCongelar() {
    const texto = congelado ? 'Descongelar cabeçalho' : 'Congelar cabeçalho';
    return `<button class="botao-icone orc-congelar ${congelado ? 'orc-congelar--ativo' : ''}" type="button" data-acao="orc-congelar"
        title="${texto}" aria-label="${texto}" aria-pressed="${congelado}">${Icones.alfinete}</button>`;
  }

  function desenharFiltros() {
    const anos = opcoes('anoAgricola');
    return `
      <div class="campo">
        <label class="campo__rotulo" for="orc-anoAgricola">Ano Agrícola</label>
        <select class="campo__controle" id="orc-anoAgricola" data-filtro="anoAgricola">
          ${anos.map((a) => `<option value="${esc(a)}" ${a === filtros.anoAgricola ? 'selected' : ''}>${esc(a)}</option>`).join('')}
        </select>
      </div>
      ${multi('ciclo', 'Safra', 'Todas', 'selecionadas')}
      ${multi('empresa', 'Empresa', 'Todas', 'selecionadas')}
      ${multi('fazenda', 'Fazenda', 'Todas', 'selecionadas')}
      ${multi('talhao', 'Talhão', 'Todos', 'selecionados')}
      ${multi('cultura', 'Cultura', 'Todas', 'selecionadas')}
      ${multi('insumo', 'Insumos', 'Todos', 'selecionados')}
      <button class="link-acao filtros__limpar" type="button" data-acao="orc-limpar">${Icones.limpar} Limpar filtros</button>`;
  }

  // Filtro de várias escolhas: botão com o resumo ("Todas", o nome ou "2 selecionadas") e lista com caixas de marcar
  function multi(nome, rotulo, todos, plural) {
    const itens = opcoes(nome);
    filtros[nome] = filtros[nome].filter((v) => itens.includes(v)); // a opção saiu (mudou um filtro de cima)
    const marcados = filtros[nome];
    const texto = !marcados.length ? todos : marcados.length === 1 ? marcados[0] : `${marcados.length} ${plural}`;
    const aberto = multiAberto === nome;
    return `
      <div class="campo orc-multi" data-multi="${nome}">
        <span class="campo__rotulo" id="orc-${nome}-rotulo">${rotulo}</span>
        <button class="campo__controle orc-multi__botao" type="button" data-multi-botao="${nome}" aria-haspopup="true"
                aria-expanded="${aberto}" aria-labelledby="orc-${nome}-rotulo orc-${nome}-texto">
          <span id="orc-${nome}-texto">${esc(texto)}</span></button>
        <div class="orc-multi__lista" ${aberto ? '' : 'hidden'} role="group" aria-labelledby="orc-${nome}-rotulo">
          <label class="orc-multi__item orc-multi__item--todos"><input type="checkbox" data-multi-todos="${nome}" ${marcados.length ? '' : 'checked'}> ${todos}</label>
          ${itens.map((item) => `<label class="orc-multi__item"><input type="checkbox" data-multi-item="${nome}" value="${esc(item)}"
              ${marcados.includes(item) ? 'checked' : ''}> ${esc(item)}</label>`).join('')}
        </div>
      </div>`;
  }

  // Estimativas de comercialização numa linha: PTAX e, por cultura, preço e produtividade; Editar parâmetros abre o modal
  function desenharEstimativas() {
    const par = parametrosDoAno();
    const culturas = par.linhas.filter((l) => l.cultura).map((l) => {
      const u = unidadeDe(l.cultura);
      const preco = l.preco === null ? 'preço a informar' : `${l.moeda} ${fmt(l.preco, 2)}/${u}`;
      const prod = l.produtividade === null ? 'produtividade a informar' : `${fmt(l.produtividade)} ${u}/ha`;
      return `<span class="orc-estimativas__item"><strong>${esc(l.cultura)}:</strong> ${preco} · ${prod}</span>`;
    }).join('');
    return `
      <span class="orc-estimativas__titulo">${Icones.broto} Estimativas de comercialização</span>
      <span class="orc-estimativas__item"><strong>PTAX:</strong> R$ ${par.ptax ? fmt(par.ptax, 2) : '—'}/US$</span>
      ${culturas}
      <button class="botao botao--secundario orc-botao-compacto orc-estimativas__editar" type="button" data-acao="orc-parametros">${Icones.lapis} Editar parâmetros</button>`;
  }

  function desenharCorpo() {
    if (!planosFiltrados().length) return '<section class="cartao orc-vazio">Nenhum plano publicado com esses filtros.</section>';
    const itens = consumo();
    const { total: area, porCultura } = areas();
    const custo = soma(itens, (i) => i.custo);
    const culturas = Object.keys(porCultura);
    return `
      ${resumo(itens, area, custo, culturas, porCultura)}
      ${porTipo(itens, area, custo, culturas, porCultura)}
      ${detalhamento(itens)}`;
  }

  // ----- Resumo do orçamento: 4 cards e a receita estimada de cada cultura -----
  // Custo em sacas: só com uma cultura no filtro. Receita estimada: um card só, somando as culturas
  // (área de cada cultura × produtividade esperada × preço esperado)
  function resumo(itens, area, custo, culturas, porCultura) {
    const unica = culturas.length === 1 ? culturas[0] : null;
    const sacas = unica ? card('sacas', `Custo em sacas · ${esc(unica)}`, textoSacas(emSacas(custo, area, unica), unica), Icones.broto) : '';
    const receitas = culturas.map((c) => {
      const l = parametrosDoAno().linhas.find((x) => x.cultura === c);
      const preco = precoCultura(c);
      return l && l.produtividade && preco ? porCultura[c] * l.produtividade * preco : null;
    }).filter((v) => v !== null);
    return `
      <section class="cartao orc-secao" aria-labelledby="orc-titulo-resumo">
        <h2 class="orc-secao__titulo" id="orc-titulo-resumo">Resumo do orçamento</h2>
        <div class="orc-cards">
          ${card('area', 'Área produtiva', `${fmt(area)} ha`, Icones.talhoes)}
          ${card('custo', 'Custo total', dinheiro(custo), Icones.moedas)}
          ${card('hectare', 'Custo por hectare', area ? dinheiro(custo / area) : '—', Icones.grafico)}
          ${sacas}
          ${card('receita', 'Receita estimada', receitas.length ? dinheiro(soma(receitas, (v) => v)) : '—', Icones.grafico)}
        </div>
      </section>`;
  }
  function card(chave, rotulo, valor, icone) {
    return `
      <div class="orc-card orc-card--${chave}"><span class="orc-card__icone" aria-hidden="true">${icone}</span>
        <div class="orc-card__corpo"><span class="orc-card__rotulo">${rotulo}</span><strong class="orc-card__numero">${valor}</strong></div></div>`;
  }

  // ----- Orçamento por tipo de insumo: barra cinza até 100% e verde até o % do custo; sacas por cultura -----
  function porTipo(itens, area, custo, culturas, porCultura) {
    const grupos = DADOS.gruposInsumo.filter((g) => passa('insumo', g))
      .map((g) => ({ g, itens: itens.filter((i) => i.grupo === g) }))
      .map((x) => ({ ...x, custo: soma(x.itens, (i) => i.custo) }))
      .sort((a, b) => b.custo - a.custo);
    return `
      <section class="cartao orc-secao" aria-labelledby="orc-titulo-tipo">
        <h2 class="orc-secao__titulo" id="orc-titulo-tipo">Orçamento por tipo de insumo</h2>
        <div class="tabela-rolagem orc-tipo-tabela">
          <table class="tabela orc-tabela">
            <thead><tr><th>Tipo de insumo</th><th class="orc-tipo__barra-col"><span class="so-leitor">Participação</span></th><th class="tabela__numero">%</th>
              <th class="tabela__numero">Custo total</th><th class="tabela__numero">${moeda}/ha</th>
              ${culturas.map((c) => `<th class="tabela__numero">${esc(c)} ${unidadeDe(c)}/ha</th>`).join('')}</tr></thead>
            <tbody>${grupos.map(({ g, itens: doGrupo, custo: cg }) => {
              const p = custo ? cg / custo * 100 : 0;
              return `<tr>
                <td>${esc(g)}</td>
                <td class="orc-tipo__barra-col"><span class="orc-barra" aria-hidden="true"><span style="width: ${p.toFixed(1)}%"></span></span></td>
                <td class="tabela__numero">${arred(p)}%</td>
                <td class="tabela__numero">${dinheiro(cg)}</td>
                <td class="tabela__numero">${area ? dinheiro(cg / area) : '—'}</td>
                ${culturas.map((c) => {
                  const n = emSacas(soma(doGrupo.filter((i) => i.plano.cultura === c), (i) => i.custo), porCultura[c], c);
                  return `<td class="tabela__numero">${n === null ? '—' : arred(n)}</td>`;
                }).join('')}
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </section>`;
  }

  // ----- Detalhamento do orçamento: Por produto · Por talhão -----
  function linhasPorProduto(itens) {
    const mapa = new Map();
    itens.forEach((i) => {
      const x = mapa.get(i.produto) || { grupo: i.grupo, produto: i.produto, unidade: i.unidade, moedaPreco: i.moedaPreco,
        preco: i.preco, necessidade: 0, custo: 0, porFazenda: {} };
      x.necessidade += i.quantidade;
      x.custo += i.custo;
      x.porFazenda[i.plano.fazenda] = (x.porFazenda[i.plano.fazenda] || 0) + i.quantidade;
      mapa.set(i.produto, x);
    });
    // Estoque e a comprar fazenda a fazenda (a comprar nunca negativo)
    const estoqueDe = (f, produto) => (DADOS.estoqueInsumos[f] || {})[produto] || 0;
    return [...mapa.values()].map((x) => {
      const fazendas = Object.entries(x.porFazenda);
      return { ...x, estoque: soma(fazendas, ([f]) => estoqueDe(f, x.produto)),
        comprar: soma(fazendas, ([f, n]) => Math.max(0, n - estoqueDe(f, x.produto))),
        unitario: x.preco === null ? null : emReais(x.preco, x.moedaPreco) };
    }).sort((a, b) => DADOS.gruposInsumo.indexOf(a.grupo) - DADOS.gruposInsumo.indexOf(b.grupo) || b.custo - a.custo);
  }

  function linhasPorTalhao(itens) {
    const mapa = new Map();
    itens.forEach((i) => {
      const chave = `${i.plano.id}|${i.talhao}`;
      const x = mapa.get(chave) || { plano: i.plano, talhao: i.talhao, area: i.area, custo: 0 };
      x.custo += i.custo;
      mapa.set(chave, x);
    });
    return [...mapa.values()].sort((a, b) => DADOS.empresas.indexOf(a.plano.empresa) - DADOS.empresas.indexOf(b.plano.empresa)
      || a.plano.fazenda.localeCompare(b.plano.fazenda, 'pt-BR') || (cicloDe(a.plano) === 'Safrinha') - (cicloDe(b.plano) === 'Safrinha')
      || a.talhao.localeCompare(b.talhao, 'pt-BR', { numeric: true }));
  }

  const contem = (textos) => !busca || textos.some((t) => String(t).toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')));
  const doProduto = (itens) => linhasPorProduto(itens).filter((l) => contem([l.produto, l.grupo]));
  const doTalhao = (itens) => linhasPorTalhao(itens).filter((l) => contem([l.plano.fazenda, l.talhao, l.plano.cultura, l.plano.empresa]));

  function detalhamento(itens) {
    const guias = [['produto', 'Por produto'], ['talhao', 'Por talhão']];
    return `
      <section class="cartao orc-secao orc-detalhe" aria-labelledby="orc-titulo-detalhe">
        <div class="orc-detalhe__topo">
          <h2 class="orc-secao__titulo" id="orc-titulo-detalhe">Detalhamento do orçamento</h2>
          <nav class="orc-guias" aria-label="Detalhar por">
            ${guias.map(([id, nome]) => `<button class="orc-guia ${id === guiaDetalhe ? 'orc-guia--ativa' : ''}" type="button"
                data-orc-guia="${id}" aria-pressed="${id === guiaDetalhe}">${nome}</button>`).join('')}
          </nav>
          <label class="orc-busca">${Icones.busca}<span class="so-leitor">Buscar</span>
            <input class="campo__controle" type="search" data-orc-busca value="${esc(busca)}"
                   placeholder="${guiaDetalhe === 'produto' ? 'Buscar produto ou grupo de insumo' : 'Buscar fazenda, talhão ou cultura'}"></label>
          <button class="botao orc-exportar" type="button" data-acao="orc-exportar">${Icones.baixar} Exportar XLSX</button>
        </div>
        <div data-orc-tabela-detalhe>${tabelaDetalhe(itens)}</div>
      </section>`;
  }

  // Só as linhas da página; ajusta a página se ela passou do fim (ex.: depois de buscar)
  function daPagina(ls) {
    const paginas = Math.max(1, Math.ceil(ls.length / porPagina));
    pagina = Math.min(Math.max(1, pagina), paginas);
    return ls.slice((pagina - 1) * porPagina, pagina * porPagina);
  }
  function paginacao(total) {
    const paginas = Math.max(1, Math.ceil(total / porPagina));
    const de = total ? (pagina - 1) * porPagina + 1 : 0;
    const ate = Math.min(pagina * porPagina, total);
    return `
      <div class="orc-paginacao">
        <label class="orc-paginacao__por">Itens por página
          <select class="campo__controle" data-orc-por-pagina>
            ${POR_PAGINA.map((n) => `<option ${n === porPagina ? 'selected' : ''}>${n}</option>`).join('')}
          </select></label>
        <span class="orc-paginacao__texto">${fmt(de)}–${fmt(ate)} de ${fmt(total)}</span>
        <button class="botao-icone" type="button" data-orc-pagina="${pagina - 1}" ${pagina <= 1 ? 'disabled' : ''} aria-label="Página anterior">${Icones.anterior}</button>
        <span class="orc-paginacao__texto">Página ${pagina} de ${paginas}</span>
        <button class="botao-icone" type="button" data-orc-pagina="${pagina + 1}" ${pagina >= paginas ? 'disabled' : ''} aria-label="Próxima página">${Icones.proxima}</button>
      </div>`;
  }

  // Colunas de cada guia: [id, título, valor para ordenar (null = vazio, vai para o fim), número?]
  const COLUNAS = {
    produto: [
      ['grupo', 'Grupo de insumo', (l) => l.grupo],
      ['produto', 'Produto', (l) => l.produto],
      ['necessidade', 'Necessidade de consumo', (l) => l.necessidade, true],
      ['estoque', 'Volume em estoque', (l) => l.estoque || null, true],
      ['comprar', 'Volume a ser comprado', (l) => l.comprar, true],
      ['unidade', 'Unidade', (l) => l.unidade],
      ['unitario', 'Custo unitário', (l) => l.unitario, true],
      ['custo', 'Custo total', (l) => l.custo, true]
    ],
    talhao: [
      ['safra', 'Safra', (l) => `${l.plano.safra} ${cicloDe(l.plano)}`],
      ['empresa', 'Empresa', (l) => l.plano.empresa],
      ['fazenda', 'Fazenda', (l) => l.plano.fazenda],
      ['cultura', 'Cultura', (l) => l.plano.cultura],
      ['talhao', 'Talhão', (l) => l.talhao],
      ['area', 'Hectares', (l) => l.area, true],
      ['custo', 'Custo total', (l) => l.custo, true],
      ['porHa', `${moeda}/ha`, (l) => l.custo / l.area, true],
      ['sacas', 'Custo em sacas', (l) => emSacas(l.custo, l.area, l.plano.cultura), true]
    ]
  };
  // 1º clique crescente, 2º decrescente; vazios sempre no fim
  function ordenadas(ls) {
    const o = ordem[guiaDetalhe];
    if (!o) return ls;
    const valor = COLUNAS[guiaDetalhe].find(([c]) => c === o.coluna)[2];
    const sinal = o.sentido === 'asc' ? 1 : -1;
    return [...ls].sort((a, b) => {
      const va = valor(a); const vb = valor(b);
      if (va === null || va === undefined) return vb === null || vb === undefined ? 0 : 1;
      if (vb === null || vb === undefined) return -1;
      return sinal * (typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR', { numeric: true }));
    });
  }
  function cabecalhoDetalhe() {
    const o = ordem[guiaDetalhe];
    return `<tr>${COLUNAS[guiaDetalhe].map(([coluna, rotulo, , num]) => {
      const ativa = o && o.coluna === coluna;
      const sentido = ativa ? o.sentido : null;
      return `
        <th class="${num ? 'tabela__numero' : ''}" ${ativa ? `aria-sort="${sentido === 'asc' ? 'ascending' : 'descending'}"` : ''}>
          <span class="titulo-coluna"><span>${rotulo}</span>
            <button class="titulo-ordenar ${ativa ? 'titulo-ordenar--ativo' : ''} ${sentido === 'desc' ? 'titulo-ordenar--desc' : ''}" type="button"
                    data-orc-ordenar="${coluna}" title="Ordenar por ${rotulo.toLowerCase()}"
                    aria-label="Ordenar por ${rotulo.toLowerCase()}${ativa ? (sentido === 'asc' ? ', crescente' : ', decrescente') : ''}">${ativa ? Icones.acima : Icones.ordenar}</button>
          </span>
        </th>`;
    }).join('')}</tr>`;
  }

  function tabelaDetalhe(itens) {
    const vazio = (n) => `<tr><td class="tabela__vazia" colspan="${n}">Nada encontrado.</td></tr>`;
    if (guiaDetalhe === 'produto') {
      const ls = ordenadas(doProduto(itens));
      return `
        <div class="tabela-rolagem"><table class="tabela orc-tabela">
          <thead>${cabecalhoDetalhe()}</thead>
          <tbody>${ls.length ? daPagina(ls).map((l) => `<tr>
            <td class="orc-tabela__grupo">${esc(l.grupo)}</td><td>${esc(l.produto)}</td>
            <td class="tabela__numero">${quantidade(l.necessidade)}</td>
            <td class="tabela__numero">${l.estoque ? quantidade(l.estoque) : '—'}</td>
            <td class="tabela__numero">${quantidade(l.comprar)}</td>
            <td class="orc-tabela__unidade">${esc(l.unidade)}</td>
            <td class="tabela__numero">${l.unitario === null ? '<span class="orc-pendente">Sem preço</span>' : unitario(l.unitario)}</td>
            <td class="tabela__numero">${dinheiro(l.custo)}</td></tr>`).join('') : vazio(8)}</tbody>
        </table></div>${paginacao(ls.length)}`;
    }
    const ls = ordenadas(doTalhao(itens));
    return `
      <div class="tabela-rolagem"><table class="tabela orc-tabela">
        <thead>${cabecalhoDetalhe()}</thead>
        <tbody>${ls.length ? daPagina(ls).map((l) => `<tr>
          <td>${esc(cicloDe(l.plano))} ${esc(l.plano.safra)}</td><td>${esc(l.plano.empresa)}</td><td>${esc(l.plano.fazenda)}</td>
          <td>${esc(l.plano.cultura)}</td><td>${esc(l.talhao)}</td><td class="tabela__numero">${fmt(l.area)}</td>
          <td class="tabela__numero">${dinheiro(l.custo)}</td><td class="tabela__numero">${dinheiro(l.custo / l.area)}</td>
          <td class="tabela__numero">${textoSacas(emSacas(l.custo, l.area, l.plano.cultura), l.plano.cultura)}</td></tr>`).join('') : vazio(9)}</tbody>
      </table></div>${paginacao(ls.length)}`;
  }

  // Exportar XLSX: a guia aberta do detalhamento, com os filtros e a busca, na moeda de exibição
  function exportar() {
    const itens = consumo();
    const m = moeda;
    const dois = (n) => +n.toFixed(2);
    const linhas = guiaDetalhe === 'produto'
      ? [['Grupo de insumo', 'Produto', 'Necessidade de consumo', 'Volume em estoque', 'Volume a ser comprado', 'Unidade', `Custo unitário (${m})`, `Custo total (${m})`],
        ...ordenadas(doProduto(itens)).map((l) => [l.grupo, l.produto, dois(l.necessidade), dois(l.estoque), dois(l.comprar), l.unidade,
          l.unitario === null ? '' : dois(exibir(l.unitario)), dois(exibir(l.custo))])]
      : [['Safra', 'Empresa', 'Fazenda', 'Cultura', 'Talhão', 'Hectares', `Custo total (${m})`, `${m}/ha`, 'Custo em sacas (por ha)'],
        ...ordenadas(doTalhao(itens)).map((l) => {
          const s = emSacas(l.custo, l.area, l.plano.cultura);
          return [`${cicloDe(l.plano)} ${l.plano.safra}`, l.plano.empresa, l.plano.fazenda, l.plano.cultura, l.talhao, l.area,
            dois(exibir(l.custo)), dois(exibir(l.custo / l.area)), s === null ? '' : +s.toFixed(1)];
        })];
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, XLSX.utils.aoa_to_sheet(linhas), guiaDetalhe === 'produto' ? 'por_produto' : 'por_talhao');
    XLSX.writeFile(livro, `orcamento-insumos-${filtros.anoAgricola}-${guiaDetalhe === 'produto' ? 'por-produto' : 'por-talhao'}.xlsx`);
  }

  // ----- Modal Editar parâmetros: PTAX e estimativa de comercialização por cultura (Aplicar guarda) -----
  function abrirParametros(aoAplicar) {
    const rascunho = structuredClone(parametrosDoAno());
    const modal = Modal.abrir(`
      <div class="modal__corpo">
        <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
        <h2 class="modal__titulo" id="modal-titulo">Estimativas de comercialização</h2>
        <p class="modal__subtitulo">Ano Agrícola ${esc(filtros.anoAgricola)}. Usadas no custo em sacas e na receita estimada.</p>
        <div data-orc-par></div>
      </div>
      <div class="modal__rodape">
        <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
        <button class="botao botao--primario" type="button" data-acao="orc-aplicar">Aplicar</button>
      </div>`, { classe: 'modal--formulario modal--largo' });
    const caixa = modal.elemento.querySelector('[data-orc-par]');
    const redesenhar = (foco) => {
      caixa.innerHTML = conteudoParametros(rascunho);
      if (foco) caixa.querySelector(foco)?.focus();
    };
    caixa.addEventListener('change', (e) => {
      if (e.target.matches('[data-orc-ptax]')) { rascunho.ptax = numero(e.target.value); e.target.value = decimal(rascunho.ptax, 2); return; }
      const campo = e.target.dataset.orcCampo;
      if (!campo) return;
      const l = rascunho.linhas[Number(e.target.dataset.i)];
      if (campo === 'preco' || campo === 'produtividade') { l[campo] = numero(e.target.value); e.target.value = decimal(l[campo], campo === 'preco' ? 2 : 0); return; }
      l[campo] = e.target.value;
      if (campo === 'cultura') redesenhar(`[data-orc-campo="moeda"][data-i="${e.target.dataset.i}"]`); // muda a unidade
    });
    caixa.addEventListener('click', (e) => {
      if (e.target.closest('[data-acao="orc-adicionar"]')) {
        rascunho.linhas.push({ cultura: '', moeda: 'R$', preco: null, produtividade: null });
        redesenhar(`[data-orc-campo="cultura"][data-i="${rascunho.linhas.length - 1}"]`);
        return;
      }
      const remover = e.target.closest('[data-orc-remover]');
      if (remover) { rascunho.linhas.splice(Number(remover.dataset.orcRemover), 1); redesenhar('[data-acao="orc-adicionar"]'); }
    });
    modal.elemento.querySelector('[data-acao="orc-aplicar"]').addEventListener('click', () => {
      rascunho.linhas = rascunho.linhas.filter((l) => l.cultura);
      parametros[filtros.anoAgricola] = rascunho;
      modal.fechar();
      aoAplicar();
    });
    redesenhar('#orc-ptax');
  }

  function conteudoParametros(par) {
    const livres = Object.keys(DADOS.comercializacao).filter((c) => !par.linhas.some((l) => l.cultura === c));
    return `
      <div class="orc-ptax" title="Converte para R$ os valores em US$ (insumos e preço de venda)">
        <label class="orc-ptax__rotulo" for="orc-ptax">PTAX de referência</label>
        <span class="orc-valor"><span class="orc-valor__moeda">R$</span>
          <input class="campo__controle orc-valor__campo" id="orc-ptax" inputmode="decimal" data-orc-ptax value="${decimal(par.ptax, 2)}"></span>
        <span class="orc-ptax__texto">por US$ 1,00</span>
      </div>
      <div class="orc-parametros__topo">
        <h3 class="orc-parametros__titulo">Por cultura</h3>
        <button class="botao botao--secundario orc-botao-compacto" type="button" data-acao="orc-adicionar"
                ${livres.length ? '' : 'disabled title="Todas as culturas já estão na lista"'}>${Icones.mais} Adicionar cultura</button>
      </div>
      <table class="tabela orc-culturas">
        <thead><tr><th>Cultura</th><th>Preço esperado</th><th>Produtividade esperada</th><th class="orc-culturas__acoes"><span class="so-leitor">Ações</span></th></tr></thead>
        <tbody>${par.linhas.map((l, i) => linhaCultura(l, i, livres)).join('')}</tbody>
      </table>`;
  }

  function linhaCultura(l, i, livres) {
    const u = l.cultura ? unidadeDe(l.cultura) : 'sc';
    // Cultura adicionada: escolhe na lista (as que ainda não estão); a dos planos é fixa
    const cultura = l.doPlano ? esc(l.cultura) : `
      <select class="campo__controle orc-culturas__cultura" data-orc-campo="cultura" data-i="${i}" aria-label="Cultura" required>
        <option value="">Selecione</option>
        ${[l.cultura, ...livres].filter(Boolean).map((c) => `<option ${c === l.cultura ? 'selected' : ''}>${esc(c)}</option>`).join('')}
      </select>`;
    return `
      <tr>
        <td>${cultura}</td>
        <td><span class="orc-preco">
          <select class="campo__controle orc-preco__moeda" data-orc-campo="moeda" data-i="${i}" aria-label="Moeda do preço">
            ${['R$', 'US$'].map((m) => `<option ${m === l.moeda ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
          <input class="campo__controle orc-valor__campo" inputmode="decimal" data-orc-campo="preco" data-i="${i}" aria-label="Preço esperado" value="${decimal(l.preco, 2)}">
          <span class="orc-unidade">/${u}</span></span></td>
        <td><span class="orc-preco">
          <input class="campo__controle orc-valor__campo" inputmode="decimal" data-orc-campo="produtividade" data-i="${i}" aria-label="Produtividade esperada" value="${decimal(l.produtividade, 0)}">
          <span class="orc-unidade">${u}/ha</span></span></td>
        <td class="orc-culturas__acoes">${l.doPlano ? '' : `<button class="botao-icone" type="button" data-orc-remover="${i}" title="Remover cultura" aria-label="Remover cultura">${Icones.lixeira}</button>`}</td>
      </tr>`;
  }

  // ----- Eventos -----
  function aoMostrar(conteudo) {
    const caixaFiltros = conteudo.querySelector('[data-orc-filtros]');
    const estimativas = conteudo.querySelector('[data-orc-estimativas]');
    const corpo = conteudo.querySelector('[data-orc-corpo]');
    const atualizarCorpo = () => { estimativas.innerHTML = desenharEstimativas(); corpo.innerHTML = desenharCorpo(); };
    // foco: seletor do elemento que volta a ter o foco depois de redesenhar
    const atualizar = (foco) => {
      pagina = 1;
      caixaFiltros.innerHTML = desenharFiltros();
      if (foco) caixaFiltros.querySelector(foco)?.focus();
      atualizarCorpo();
    };
    caixaFiltros.addEventListener('change', (e) => {
      const select = e.target.closest('[data-filtro]');
      if (select) { filtros.anoAgricola = select.value; atualizar('[data-filtro="anoAgricola"]'); return; }
      // Várias escolhas: a lista continua aberta para marcar mais (as opções de baixo dependem das de cima)
      const todos = e.target.closest('[data-multi-todos]');
      const item = e.target.closest('[data-multi-item]');
      if (todos) { filtros[todos.dataset.multiTodos] = []; atualizar(`[data-multi-todos="${todos.dataset.multiTodos}"]`); }
      if (item) {
        const nome = item.dataset.multiItem;
        filtros[nome] = item.checked ? [...filtros[nome], item.value] : filtros[nome].filter((v) => v !== item.value);
        atualizar(`[data-multi-item="${nome}"][value="${CSS.escape(item.value)}"]`);
      }
    });
    caixaFiltros.addEventListener('click', (e) => {
      const botao = e.target.closest('[data-multi-botao]');
      if (botao) {
        const nome = botao.dataset.multiBotao;
        multiAberto = multiAberto === nome ? null : nome;
        caixaFiltros.innerHTML = desenharFiltros();
        caixaFiltros.querySelector(multiAberto ? `[data-multi="${nome}"] input` : `[data-multi-botao="${nome}"]`)?.focus();
        return;
      }
      if (!e.target.closest('[data-acao="orc-limpar"]')) return;
      filtros = filtrosIniciais();
      multiAberto = null;
      atualizar();
    });
    // Fecha a lista ao clicar fora dela ou com Esc
    const fecharMulti = (focar) => {
      if (!multiAberto) return;
      const nome = multiAberto;
      multiAberto = null;
      caixaFiltros.innerHTML = desenharFiltros();
      if (focar) caixaFiltros.querySelector(`[data-multi-botao="${nome}"]`)?.focus();
    };
    document.addEventListener('mousedown', function fora(e) {
      if (!document.body.contains(caixaFiltros)) { document.removeEventListener('mousedown', fora); return; }
      if (multiAberto && !e.target.closest('.orc-multi')) fecharMulti(false);
    });
    caixaFiltros.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMulti(true); });
    conteudo.querySelector('.orc-moeda').addEventListener('click', (e) => {
      const alfinete = e.target.closest('[data-acao="orc-congelar"]');
      if (alfinete) {
        congelado = !congelado;
        conteudo.querySelector('.orc-fixo').classList.toggle('orc-fixo--solto', !congelado);
        alfinete.outerHTML = botaoCongelar();
        conteudo.querySelector('[data-acao="orc-congelar"]').focus();
        return;
      }
      const b = e.target.closest('[data-orc-moeda]');
      if (!b || b.dataset.orcMoeda === moeda) return;
      moeda = b.dataset.orcMoeda;
      conteudo.querySelectorAll('[data-orc-moeda]').forEach((x) => {
        const ativa = x.dataset.orcMoeda === moeda;
        x.classList.toggle('orc-moeda__opcao--ativa', ativa);
        x.setAttribute('aria-pressed', ativa);
      });
      atualizarCorpo();
    });
    estimativas.addEventListener('click', (e) => {
      if (e.target.closest('[data-acao="orc-parametros"]')) abrirParametros(atualizarCorpo);
    });
    corpo.addEventListener('click', (e) => {
      const guia = e.target.closest('[data-orc-guia]');
      if (guia && guia.dataset.orcGuia !== guiaDetalhe) {
        guiaDetalhe = guia.dataset.orcGuia;
        busca = '';
        pagina = 1;
        atualizarCorpo();
        corpo.querySelector(`[data-orc-guia="${guiaDetalhe}"]`).focus();
        return;
      }
      if (e.target.closest('[data-acao="orc-exportar"]')) exportar();
      const seta = e.target.closest('[data-orc-ordenar]');
      if (seta) {
        const c = seta.dataset.orcOrdenar;
        const o = ordem[guiaDetalhe];
        ordem[guiaDetalhe] = { coluna: c, sentido: o && o.coluna === c && o.sentido === 'asc' ? 'desc' : 'asc' };
        pagina = 1;
        redesenharTabela(`[data-orc-ordenar="${c}"]`);
        return;
      }
      const ir = e.target.closest('[data-orc-pagina]');
      if (ir && !ir.disabled) {
        pagina = Number(ir.dataset.orcPagina);
        redesenharTabela(`[aria-label="${ir.getAttribute('aria-label')}"]:not(:disabled)`);
        corpo.querySelector('[data-orc-tabela-detalhe]').scrollIntoView({ block: 'nearest' });
      }
    });
    const redesenharTabela = (foco) => {
      corpo.querySelector('[data-orc-tabela-detalhe]').innerHTML = tabelaDetalhe(consumo());
      if (foco) corpo.querySelector(foco)?.focus();
    };
    corpo.addEventListener('change', (e) => {
      if (!e.target.matches('[data-orc-por-pagina]')) return;
      porPagina = Number(e.target.value);
      pagina = 1;
      redesenharTabela('[data-orc-por-pagina]');
    });
    // Busca: redesenha só a tabela, para não perder o foco do campo
    corpo.addEventListener('input', (e) => {
      if (!e.target.matches('[data-orc-busca]')) return;
      busca = e.target.value;
      pagina = 1;
      redesenharTabela();
    });
    atualizar();
  }

  return { desenhar, aoMostrar };
})();
