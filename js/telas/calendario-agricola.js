/*
 * Calendário Agrícola, visão Ano (DECISOES 4.0): desenha a tabela Empresa › Fazenda › Safra/Safrinha do ano agrícola
 * para js/telas/os-calendario.js, que tem os filtros, a legenda e a navegação (Ano · Mês · Semana · Dia).
 * Empresa e fazenda se recolhem pela seta; cada operação é uma barra transparente, do primeiro ao último talhão, numa
 * faixa por grupo de operação. A linha da fazenda junta a safra e a safrinha. Do mês da primeira operação ao da última.
 * Usa a última versão publicada de cada plano.
 */
window.Telas = window.Telas || {};

window.Telas.calendarioAgricola = (function () {
  const esc = Util.escapar;
  const NOMES_MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  // Cor de cada grupo de operação, pelo tipo (as mesmas do Calendário do plano); uma faixa por grupo, nesta ordem
  // Grupos criados pelo "+": Operação de campo (ex.: Preparo do solo) numa faixa própria, cinza, antes do Plantio;
  // Aplicação de insumos (ex.: Corretivos) junto da Fertilidade (mesma faixa e cor)
  const COR_GRUPO = { 'Operação de campo': '#5b6b73', Sementes: '#1f9d55', Fertilidade: '#8e44ad', 'Aplicação de insumos': '#8e44ad', Defensivos: '#e8772e', Colheita: '#d4a017' };
  const ORDEM_GRUPO = ['Operação de campo', 'Sementes', 'Fertilidade', 'Defensivos', 'Colheita'];
  const faixaDe = (tipo) => Math.max(0, ORDEM_GRUPO.indexOf(tipo === 'Aplicação de insumos' ? 'Fertilidade' : tipo));

  // Empresas abertas ('e:Empresa A') e fazendas abertas ('f:Empresa A|Santa Clara'). Abre no nível Empresa (tudo
  // fechado); a escolha se mantém ao navegar. As barras ficam só no nível mais aberto de cada ramo: empresa fechada
  // mostra as operações de todas as fazendas juntas; aberta, as barras passam para as fazendas; fazenda aberta, para a
  // safra e a safrinha.
  const empresasAbertas = new Set();
  const fazendasAbertas = new Set();

  // Safra/Safrinha do plano: ainda não é escolhida ao criar o plano (DECISOES 4.2: a detalhar); por enquanto, Safra
  // Sem ciclo informado (plano criado no modal), pelo nome da safra ("27/27", os dois anos iguais, é safrinha)
  const cicloDe = (p) => p.ciclo || (String(p.safra).split('/')[0] === String(p.safra).split('/')[1] ? 'Safrinha' : 'Safra');

  // ----- Datas -----
  const dataDe = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };
  const somaDias = (iso, n) => { const d = dataDe(iso); d.setDate(d.getDate() + n); return d; };
  const ddmm = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  const pct = (d, { ini, fim }) => Math.min(100, Math.max(0, (d - ini) / (fim - ini) * 100));
  const mesIndice = (d) => d.getFullYear() * 12 + d.getMonth();
  const dataDoMes = (mi) => new Date(Math.floor(mi / 12), mi % 12, 1);

  // Operações do plano (última versão publicada), uma por operação: começa no primeiro talhão (data de plantio + DAP;
  // Plantio: a data de plantio; Colheita: plantio + ciclo da variedade) e vai até o fim da previsão de conclusão
  // no último talhão. Entram os talhões incluídos com data de plantio e com a operação planejada.
  // talhaoOk e opOk: os filtros Talhão, Operação e a legenda da tela.
  function operacoesDoPlano(p, talhaoOk, opOk) {
    const v = Versoes.publicadaComPlanejamento(p);
    if (!v) return [];
    const grupos = Versoes.grupos(p, v);
    const talhoes = Util.talhoesPlano(p, v);
    // Plantio (várias variedades por talhão): as operações partem da primeira data de plantio do talhão;
    // a colheita, de cada variedade (data de plantio + ciclo dela)
    const opPlantio = (grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0] || null;
    const lista = [];
    grupos.forEach((g) => g.operacoes.forEach((op) => {
      let ini = null; let fim = null; let area = 0;
      const estender = (a, b) => { if (!ini || a < ini) ini = a; if (!fim || b > fim) fim = b; };
      const prazo = op.prazo || (g.tipo === 'Colheita' ? 10 : g.tipo === 'Sementes' ? 3 : 2);
      talhoes.forEach((t) => {
        if (!talhaoOk(t.nome)) return;
        const linhas = Planos.linhasPlantio(opPlantio, t.nome);
        const data = Planos.dataPlantioTalhao(opPlantio, t.nome);
        if (!data) return;
        if (g.tipo === 'Colheita') {
          linhas.forEach((l, i) => {
            const va = DADOS.variedades.find((vv) => vv.nome === l.variedade);
            if (!l.data || !va || !va.ciclo) return;
            estender(somaDias(l.data, va.ciclo), somaDias(l.data, va.ciclo + prazo - 1));
            area += Planos.areaLinhaPlantio(linhas, i, t.area) || 0;
          });
          return;
        }
        // Plantio: a data de cada variedade
        if (g.tipo === 'Sementes') {
          linhas.filter((l) => l.data).forEach((l) => estender(somaDias(l.data, 0), somaDias(l.data, prazo - 1)));
          area += t.area;
          return;
        }
        const ajuste = op.talhoes && op.talhoes[t.nome];
        if (!ajuste || !Planos.linhasTalhao(op, ajuste).length) return;
        if (op.dap === null || op.dap === undefined) return;
        estender(somaDias(data, op.dap), somaDias(data, op.dap + prazo - 1));
        area += t.area;
      });
      const o = { nome: op.nome, grupo: g.nome, tipo: g.tipo, cultura: p.cultura, ini, fim, area };
      if (ini && opOk(o)) lista.push(o);
    }));
    return lista.sort((a, b) => a.ini - b.ini);
  }

  // Janela: do mês da primeira operação ao da última
  function janelaDe(todas) {
    const primeiro = mesIndice(new Date(Math.min(...todas.map((o) => o.ini))));
    const ultimo = mesIndice(new Date(Math.max(...todas.map((o) => o.fim))));
    return { iniMi: primeiro, tam: ultimo - primeiro + 1, ini: dataDoMes(primeiro), fim: dataDoMes(ultimo + 1) };
  }

  // Barras de uma lista de operações: uma faixa por grupo (na ordem da legenda), transparentes (sobreposição mais forte).
  // Clicar na barra abre o Mês no começo da operação (a tela lê a linha: empresa, fazenda e safra; e a cultura).
  // A operação não vira filtro.
  function barras(lista, j, linha) {
    const daLinha = Object.entries(linha).map(([k, v]) => `data-cag-${k}="${esc(v)}"`).join(' ');
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return lista.filter((o) => o.fim >= j.ini && o.ini < j.fim).map((o) => {
      const fimMais = new Date(o.fim); fimMais.setDate(fimMais.getDate() + 1);
      const esq = pct(o.ini, j); const dir = pct(fimMais, j);
      const faixa = faixaDe(o.tipo);
      const dica = `${o.nome} · ${o.grupo} · ${o.cultura} · ${ddmm(o.ini)} a ${ddmm(o.fim)}${o.area ? ` · ${Util.area(o.area)}` : ''}`;
      return `<button class="cag__faixa" type="button" style="left: ${esq.toFixed(2)}%; width: ${Math.max(0.4, dir - esq).toFixed(2)}%; top: ${6 + faixa * 12}px; --c: ${COR_GRUPO[o.tipo] || '#7B8A82'}"
                   data-cag-op="${iso(o.ini)}" data-cag-cultura="${esc(o.cultura)}" ${daLinha}
                   title="${esc(dica)} · Clique para ver no mês" aria-label="${esc(dica)}. Ver no mês"></button>`;
    }).join('');
  }
  // Junta as operações de vários planos (a linha da fazenda): a mesma operação da mesma cultura vai do primeiro ao último dia
  function juntar(listas) {
    const mapa = new Map();
    listas.flat().forEach((o) => {
      const k = `${o.tipo}|${o.nome}|${o.cultura}`;
      const x = mapa.get(k);
      if (!x) mapa.set(k, { ...o });
      else { if (o.ini < x.ini) x.ini = o.ini; if (o.fim > x.fim) x.fim = o.fim; x.area = null; }
    });
    return [...mapa.values()];
  }

  // Tabela do ano agrícola: planos (já filtrados pela tela e pelo ano), talhaoOk(plano, talhão) e opOk(operação).
  // Devolve o HTML e se a linha de hoje aparece (a tela põe "Hoje" na legenda).
  function tabela({ planos, talhaoOk, opOk }) {
    const vazio = (texto) => ({ html: `<p class="cag__vazio">${texto}</p>`, temHoje: false });
    if (!planos.length) return vazio('Nenhum plano publicado com esses filtros neste ano agrícola.');
    const ops = new Map(planos.map((p) => [p, operacoesDoPlano(p, (t) => talhaoOk(p, t), opOk)]));
    const todas = [...ops.values()].flat();
    if (!todas.length) return vazio('Nenhuma operação com data nos planos publicados com esses filtros.');
    const j = janelaDe(todas);
    // Colunas: os meses
    const colunas = Array.from({ length: j.tam }, (_, i) => NOMES_MESES[(j.iniMi + i) % 12]);
    const grade = `grid-template-columns: repeat(${colunas.length}, minmax(0, 1fr))`;
    const fundo = `background-size: calc(100% / ${colunas.length}) 100%`;
    const hoje = new Date();
    const temHoje = hoje >= j.ini && hoje < j.fim;
    // Hoje: só a linha vertical pontilhada, em todas as linhas (sem etiqueta; o nome fica na legenda)
    const marcaHoje = temHoje ? `<span class="cag__hoje" style="left: ${pct(hoje, j).toFixed(2)}%" aria-hidden="true"></span>` : '';
    const seta = (aberto) => `<span class="cag__seta ${aberto ? '' : 'cag__seta--fechada'}" aria-hidden="true">${Icones.abaixo}</span>`;
    const areaDe = (lista) => lista.reduce((s, p) => s + (Util.areaCultivo(p, Versoes.ultimaPublicada(p)) || 0), 0);

    // Agrupado por empresa (na ordem do cadastro); dentro, por fazenda, e a safra antes da safrinha
    const linhas = [];
    DADOS.empresas.filter((e) => planos.some((p) => p.empresa === e)).forEach((e) => {
      const daEmpresa = planos.filter((p) => p.empresa === e);
      const ce = `e:${e}`; const abertaE = empresasAbertas.has(ce);
      linhas.push(`
        <div class="cag__linha cag__linha--empresa" role="row">
          <span role="cell"><button class="cag__abrir" type="button" data-cag-recolher="${esc(ce)}" aria-expanded="${abertaE}">${seta(abertaE)}<strong>${esc(e)}</strong></button></span>
          <span role="cell"></span><span role="cell" class="cag__num"><strong>${Util.area(areaDe(daEmpresa))}</strong></span>
          ${abertaE ? `<span role="cell" class="cag__tempo cag__tempo--vazio" style="${fundo}">${marcaHoje}</span>`
            : `<span role="cell" class="cag__tempo cag__tempo--faixas" style="${fundo}">${barras(juntar(daEmpresa.map((p) => ops.get(p))), j, { empresa: e })}${marcaHoje}</span>`}
        </div>`);
      if (!abertaE) return;
      [...new Set(daEmpresa.map((p) => p.fazenda))].sort((a, b) => a.localeCompare(b, 'pt-BR')).forEach((f) => {
        const daFazenda = daEmpresa.filter((p) => p.fazenda === f)
          .sort((a, b) => (cicloDe(a) === 'Safrinha') - (cicloDe(b) === 'Safrinha') || a.cultura.localeCompare(b.cultura));
        const cf = `f:${e}|${f}`; const abertaF = fazendasAbertas.has(cf);
        // Área da fazenda: a dos talhões (uma vez só), a maior entre a safra e a safrinha
        const areaF = Math.max(...daFazenda.map((p) => Util.areaCultivo(p, Versoes.ultimaPublicada(p)) || 0));
        linhas.push(`
          <div class="cag__linha cag__linha--fazenda" role="row">
            <span role="cell"><button class="cag__abrir" type="button" data-cag-recolher="${esc(cf)}" aria-expanded="${abertaF}">${seta(abertaF)}<strong>${esc(f)}</strong></button></span>
            <span role="cell">${[...new Set(daFazenda.map((p) => p.cultura))].map(esc).join(' → ')}</span>
            <span role="cell" class="cag__num"><strong>${Util.area(areaF)}</strong></span>
            ${abertaF ? `<span role="cell" class="cag__tempo cag__tempo--vazio" style="${fundo}">${marcaHoje}</span>`
              : `<span role="cell" class="cag__tempo cag__tempo--faixas" style="${fundo}">${barras(juntar(daFazenda.map((p) => ops.get(p))), j, { empresa: e, fazenda: f })}${marcaHoje}</span>`}
          </div>`);
        if (!abertaF) return;
        daFazenda.forEach((p) => {
          const v = Versoes.publicadaComPlanejamento(p);
          const area = Util.areaCultivo(p, Versoes.ultimaPublicada(p));
          const lista = ops.get(p);
          linhas.push(`
            <div class="cag__linha cag__linha--safra" role="row">
              <span role="cell">${esc(p.safra)}</span>
              <span role="cell">${esc(p.cultura)}</span>
              <span role="cell" class="cag__num">${area ? Util.area(area) : '<span class="cag__pendente">Pendente</span>'}</span>
              <span role="cell" class="cag__tempo cag__tempo--faixas" style="${fundo}">${lista.length ? barras(lista, j, { empresa: e, fazenda: f, safra: p.safra })
                : `<span class="cag__sem">${Versoes.aIniciar(p) ? 'Plano ainda não iniciado' : v ? 'Nenhuma operação com data na versão publicada' : 'Plano ainda sem versão publicada'}</span>`}${marcaHoje}</span>
            </div>`);
        });
      });
    });

    return { temHoje, html: `
      <div class="cag__rolagem">
        <div class="cag__tabela" role="table" aria-label="Operações por empresa, fazenda e safra">
          <div class="cag__linha cag__linha--cab" role="row">
            <span role="columnheader">Fazenda / Safra</span><span role="columnheader">Cultura</span>
            <span role="columnheader" class="cag__num">Área</span>
            <span role="columnheader" class="cag__meses" style="${grade}">${colunas.map((m) => `<span>${m}</span>`).join('')}</span>
          </div>
          ${linhas.join('')}
        </div>
      </div>` };
  }

  // Recolher/abrir empresa e fazenda (o clique vem da tela; redesenhar refaz a tabela)
  function aoClicar(e, redesenhar) {
    const r = e.target.closest('[data-cag-recolher]');
    if (!r) return false;
    const k = r.dataset.cagRecolher;
    const conjunto = k.startsWith('f:') ? fazendasAbertas : empresasAbertas;
    if (conjunto.has(k)) conjunto.delete(k); else conjunto.add(k);
    redesenhar(`[data-cag-recolher="${CSS.escape(k)}"]`);
    return true;
  }

  // Volta ao nível Empresa (tudo fechado), como ao abrir
  function recolherTudo() { empresasAbertas.clear(); fazendasAbertas.clear(); }

  return { tabela, aoClicar, recolherTudo };
})();
