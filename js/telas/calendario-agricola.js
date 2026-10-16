/*
 * Calendário Agrícola do menu (DECISOES 4.0): vários planos somados, no ano agrícola escolhido (safras e safrinhas).
 * Empresa › Fazenda › Safra/Safrinha (empresa e fazenda se recolhem pela seta); cada operação é uma barra transparente,
 * do primeiro ao último talhão, numa faixa por grupo de operação. A linha da fazenda junta a safra e a safrinha.
 * Filtro Período: Ano, Semestre, Trimestre ou Mês, com setas para andar no tempo.
 * Usa a última versão publicada de cada plano (DECISOES 4.0).
 */
window.Telas = window.Telas || {};

window.Telas.calendarioAgricola = (function () {
  const esc = Util.escapar;
  const NOMES_MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const MESES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  // Cor de cada grupo de operação, pelo tipo (as mesmas do Calendário do plano); uma faixa por grupo, nesta ordem
  const COR_GRUPO = { Sementes: '#1f9d55', Fertilidade: '#8e44ad', Defensivos: '#e8772e', Colheita: '#d4a017' };
  const ORDEM_GRUPO = ['Sementes', 'Fertilidade', 'Defensivos', 'Colheita'];
  const PERIODOS = [['ano', 'Ano', 0], ['semestre', 'Semestre', 6], ['trimestre', 'Trimestre', 3], ['mes', 'Mês', 1]];
  const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`;

  let filtros = {};
  // Período (ano, semestre, trimestre, mês), o mês em que ele começa (ano × 12 + mês; null = o padrão), as empresas
  // recolhidas ('e:Empresa A') e as fazendas abertas ('f:Empresa A|Santa Clara'). Abre com as empresas abertas e as
  // fazendas fechadas (safra e safrinha aparecem ao abrir a fazenda). Tudo se mantém ao navegar.
  let periodo = 'ano';
  let inicioPeriodo = null;
  const recolhidos = new Set();
  const fazendasAbertas = new Set();

  // Safra/Safrinha do plano: ainda não é escolhida ao criar o plano (DECISOES 4.2: a detalhar); por enquanto, Safra
  const cicloDe = (p) => p.ciclo || 'Safra';
  const valorDe = (p, campo) => (campo === 'anoAgricola' ? String(Util.anoAgricola(p.safra)) : p[campo]);
  function presentes(campo, cadastro) {
    const naLista = new Set(DADOS.planos.map((p) => valorDe(p, campo)));
    return cadastro.filter((item) => naLista.has(item));
  }
  // Ano Agrícola: junta as safras e safrinhas do ano; começa no de hoje, ou no mais recente com planos
  const filtrosIniciais = () => ({ anoAgricola: Util.anoAgricolaInicial(Util.anosAgricolas(DADOS.planos)), empresa: '', fazenda: '', cultura: '' });
  const planosFiltrados = () => DADOS.planos.filter((p) => ['anoAgricola', 'empresa', 'fazenda', 'cultura'].every((c) => !filtros[c] || valorDe(p, c) === filtros[c]));

  // ----- Datas -----
  const dataDe = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };
  const somaDias = (iso, n) => { const d = dataDe(iso); d.setDate(d.getDate() + n); return d; };
  const ddmm = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  const pct = (d, { ini, fim }) => Math.min(100, Math.max(0, (d - ini) / (fim - ini) * 100));
  const mesIndice = (d) => d.getFullYear() * 12 + d.getMonth();
  const dataDoMes = (mi) => new Date(Math.floor(mi / 12), mi % 12, 1);
  const mesCurto = (mi) => `${NOMES_MESES[mi % 12].toLowerCase()}/${Math.floor(mi / 12)}`;

  // Operações do plano (última versão publicada), uma por operação: começa no primeiro talhão (data de plantio + DAP;
  // Plantio: a data de plantio; Colheita: plantio + ciclo da variedade) e vai até o fim da previsão de conclusão
  // no último talhão. Entram os talhões incluídos com data de plantio e com a operação planejada.
  function operacoesDoPlano(p) {
    const v = Versoes.ultimaPublicada(p);
    if (!v) return [];
    const grupos = Versoes.grupos(p, v);
    const talhoes = Util.talhoesPlano(p, v);
    const pl = ((grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0] || {}).plantio || {};
    const lista = [];
    grupos.forEach((g) => g.operacoes.forEach((op) => {
      let ini = null; let fim = null; let area = 0;
      talhoes.forEach((t) => {
        const x = pl[t.nome];
        if (!x || !x.data) return;
        let dap = op.dap;
        if (g.tipo === 'Colheita') { const va = DADOS.variedades.find((vv) => vv.nome === x.variedade); dap = va && va.ciclo; }
        else if (g.tipo !== 'Sementes') {
          const ajuste = op.talhoes && op.talhoes[t.nome];
          if (!ajuste || !Planos.linhasTalhao(op, ajuste).length) return;
        }
        if (dap === null || dap === undefined) return;
        const prazo = op.prazo || (g.tipo === 'Colheita' ? 10 : g.tipo === 'Sementes' ? 3 : 2);
        const a = somaDias(x.data, dap); const b = somaDias(x.data, dap + prazo - 1);
        if (!ini || a < ini) ini = a;
        if (!fim || b > fim) fim = b;
        area += t.area;
      });
      if (ini) lista.push({ nome: op.nome, grupo: g.nome, tipo: g.tipo, cultura: p.cultura, ini, fim, area });
    }));
    return lista.sort((a, b) => a.ini - b.ini);
  }

  // Janela do período. Ano: do mês da primeira operação ao da última. Semestre e trimestre começam em setembro do
  // ano agrícola; mês, no de hoje (se estiver no intervalo; senão, setembro). As setas andam um período por vez.
  function janelaPeriodo(primeiro, ultimo) {
    const tam = periodo === 'ano' ? ultimo - primeiro + 1 : PERIODOS.find(([id]) => id === periodo)[2];
    const hoje = mesIndice(new Date());
    const padrao = periodo === 'ano' ? primeiro
      : periodo === 'mes' && hoje >= primeiro && hoje <= ultimo ? hoje : Number(filtros.anoAgricola) * 12 + 8;
    const ini = periodo === 'ano' ? primeiro : (inicioPeriodo ?? padrao);
    return { iniMi: ini, tam, ini: dataDoMes(ini), fim: dataDoMes(ini + tam), primeiro, ultimo };
  }
  const janelaDe = (todas) => janelaPeriodo(mesIndice(new Date(Math.min(...todas.map((o) => o.ini)))),
    mesIndice(new Date(Math.max(...todas.map((o) => o.fim)))));

  // Barras de uma lista de operações: uma faixa por grupo (na ordem da legenda), transparentes (sobreposição mais forte)
  function barras(lista, j) {
    return lista.filter((o) => o.fim >= j.ini && o.ini < j.fim).map((o) => {
      const fimMais = new Date(o.fim); fimMais.setDate(fimMais.getDate() + 1);
      const esq = pct(o.ini, j); const dir = pct(fimMais, j);
      const faixa = Math.max(0, ORDEM_GRUPO.indexOf(o.tipo));
      const dica = `${o.nome} · ${o.grupo} · ${o.cultura} · ${ddmm(o.ini)} a ${ddmm(o.fim)}${o.area ? ` · ${Util.area(o.area)}` : ''}`;
      return `<span class="cag__faixa" style="left: ${esq.toFixed(2)}%; width: ${Math.max(0.4, dir - esq).toFixed(2)}%; top: ${6 + faixa * 10}px; background: ${rgba(COR_GRUPO[o.tipo] || '#7B8A82', 0.4)}"
                   title="${esc(dica)}" role="img" aria-label="${esc(dica)}"></span>`;
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

  // ----- Desenho -----
  function desenhar() {
    filtros = filtrosIniciais();
    return `
      <header class="cabecalho">
        <div>
          <h1 class="cabecalho__titulo">Calendário Agrícola</h1>
          <p class="cabecalho__subtitulo">As operações de cada fazenda, por safra e safrinha, na cor do grupo de operação, em todas as empresas do ano agrícola.</p>
        </div>
        <span class="cag-etiqueta" title="Mostra a última versão publicada de cada plano. Alterações em versões em construção aparecem aqui depois de publicadas.">${Icones.info} Últimas versões publicadas</span>
      </header>
      <div class="pagina">
        <section class="cartao filtros" aria-label="Filtrar o calendário">
          ${filtro('anoAgricola', 'Ano Agrícola', Util.anosAgricolas(DADOS.planos), null)}
          ${filtro('empresa', 'Empresa', presentes('empresa', DADOS.empresas))}
          ${filtro('fazenda', 'Fazenda', presentes('fazenda', DADOS.fazendas))}
          ${filtro('cultura', 'Cultura', presentes('cultura', DADOS.culturasPlanos))}
          <div class="campo">
            <label class="campo__rotulo" for="cag-periodo">Período</label>
            <select class="campo__controle" id="cag-periodo" data-cag-periodo>
              ${PERIODOS.map(([id, nome]) => `<option value="${id}" ${id === periodo ? 'selected' : ''}>${nome}</option>`).join('')}
            </select>
          </div>
          <button class="link-acao filtros__limpar" type="button" data-acao="cag-limpar">${Icones.limpar} Limpar filtros</button>
        </section>
        <section class="cag" aria-label="Operações do ano agrícola" data-cag></section>
      </div>`;
  }

  // todos = null: sem a opção "Todas" (o Ano Agrícola é sempre um só)
  function filtro(nome, rotulo, itens, todos = 'Todas') {
    return `
      <div class="campo">
        <label class="campo__rotulo" for="cag-${nome}">${rotulo}</label>
        <select class="campo__controle" id="cag-${nome}" data-filtro="${nome}">
          ${todos ? `<option value="">${todos}</option>` : ''}
          ${itens.map((item) => `<option value="${esc(item)}" ${item === filtros[nome] ? 'selected' : ''}>${esc(item)}</option>`).join('')}
        </select>
      </div>`;
  }

  function linhaDoTempo() {
    const planos = planosFiltrados();
    if (!planos.length) return '<p class="cag__vazio">Nenhum plano com esses filtros.</p>';
    const ops = new Map(planos.map((p) => [p, operacoesDoPlano(p)]));
    const todas = [...ops.values()].flat();
    if (!todas.length) return '<p class="cag__vazio">Nenhuma operação com data nos planos publicados com esses filtros.</p>';
    const j = janelaDe(todas);
    // Colunas: os meses; no período Mês, os dias
    const colunas = periodo === 'mes'
      ? Array.from({ length: Math.round((j.fim - j.ini) / 86400000) }, (_, i) => String(i + 1))
      : Array.from({ length: j.tam }, (_, i) => NOMES_MESES[(j.iniMi + i) % 12]);
    const grade = `grid-template-columns: repeat(${colunas.length}, minmax(0, 1fr))`;
    const fundo = `background-size: calc(100% / ${colunas.length}) 100%`;
    const hoje = new Date();
    const marcaHoje = hoje >= j.ini && hoje < j.fim ? `<span class="cag__hoje" style="left: ${pct(hoje, j).toFixed(2)}%" aria-hidden="true"></span>` : '';
    const rotulo = periodo === 'ano' ? `Ano agrícola ${esc(filtros.anoAgricola)}`
      : periodo === 'mes' ? `${MESES_LONGO[j.iniMi % 12]} de ${Math.floor(j.iniMi / 12)}` : `${mesCurto(j.iniMi)} – ${mesCurto(j.iniMi + j.tam - 1)}`;
    const navegavel = periodo !== 'ano';
    const grupos = ORDEM_GRUPO.map((tipo) => todas.find((o) => o.tipo === tipo)).filter(Boolean);
    const seta = (aberto) => `<span class="cag__seta ${aberto ? '' : 'cag__seta--fechada'}" aria-hidden="true">${Icones.abaixo}</span>`;
    const areaDe = (lista) => lista.reduce((s, p) => s + (Util.areaCultivo(p, Versoes.ultimaPublicada(p)) || 0), 0);

    // Agrupado por empresa (na ordem do cadastro); dentro, por fazenda, e a safra antes da safrinha
    const linhas = [];
    DADOS.empresas.filter((e) => planos.some((p) => p.empresa === e)).forEach((e) => {
      const daEmpresa = planos.filter((p) => p.empresa === e);
      const ce = `e:${e}`; const abertaE = !recolhidos.has(ce);
      linhas.push(`
        <div class="cag__linha cag__linha--empresa" role="row">
          <span role="cell"><button class="cag__abrir" type="button" data-cag-recolher="${esc(ce)}" aria-expanded="${abertaE}">${seta(abertaE)}<strong>${esc(e)}</strong></button></span>
          <span role="cell"></span><span role="cell" class="cag__num"><strong>${Util.area(areaDe(daEmpresa))}</strong></span>
          <span role="cell" class="cag__tempo cag__tempo--vazio" style="${fundo}">${marcaHoje}</span>
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
            <span role="cell" class="cag__tempo cag__tempo--faixas" style="${fundo}">${barras(juntar(daFazenda.map((p) => ops.get(p))), j)}${marcaHoje}</span>
          </div>`);
        if (!abertaF) return;
        daFazenda.forEach((p) => {
          const v = Versoes.ultimaPublicada(p);
          const area = Util.areaCultivo(p, v);
          const lista = ops.get(p);
          linhas.push(`
            <div class="cag__linha cag__linha--safra" role="row">
              <span role="cell">${esc(cicloDe(p))} ${esc(p.safra)}</span>
              <span role="cell">${esc(p.cultura)}</span>
              <span role="cell" class="cag__num">${area ? Util.area(area) : '<span class="cag__pendente">Pendente</span>'}</span>
              <span role="cell" class="cag__tempo cag__tempo--faixas" style="${fundo}">${lista.length ? barras(lista, j)
                : `<span class="cag__sem">${v ? 'Nenhuma operação com data na versão publicada' : 'Plano ainda sem versão publicada'}</span>`}${marcaHoje}</span>
            </div>`);
        });
      });
    });

    return `
      <div class="cag__barra-topo">
        <div class="cag__legenda">
          ${grupos.map((o) => `<span><span class="cag__cor" style="background: ${rgba(COR_GRUPO[o.tipo], 0.55)}" aria-hidden="true"></span>${esc(o.grupo)}</span>`).join('')}
          ${marcaHoje ? '<span><span class="cag__cor cag__cor--hoje" aria-hidden="true"></span>Hoje</span>' : ''}
        </div>
        <div class="cag__navegar">
          ${navegavel ? `<button class="botao-icone" type="button" data-cag-mover="-1" aria-label="Período anterior" ${j.iniMi <= j.primeiro ? 'disabled' : ''}>${Icones.anterior}</button>` : ''}
          <strong>${rotulo}</strong>
          ${navegavel ? `<button class="botao-icone" type="button" data-cag-mover="1" aria-label="Próximo período" ${j.iniMi + j.tam > j.ultimo ? 'disabled' : ''}>${Icones.proxima}</button>` : ''}
        </div>
      </div>
      <div class="cag__rolagem">
        <div class="cag__tabela" role="table" aria-label="Operações por empresa, fazenda e safra">
          <div class="cag__linha cag__linha--cab" role="row">
            <span role="columnheader">Fazenda / Safra</span><span role="columnheader">Cultura</span>
            <span role="columnheader" class="cag__num">Área</span>
            <span role="columnheader" class="cag__meses ${periodo === 'mes' ? 'cag__meses--dias' : ''}" style="${grade}">${colunas.map((m) => `<span>${m}</span>`).join('')}</span>
          </div>
          ${linhas.join('')}
        </div>
      </div>`;
  }

  function aoMostrar(conteudo) {
    const caixa = conteudo.querySelector('[data-cag]');
    const atualizar = () => { caixa.innerHTML = linhaDoTempo(); };
    conteudo.querySelector('[data-cag-periodo]').addEventListener('change', (e) => { periodo = e.target.value; inicioPeriodo = null; atualizar(); });
    // Recolher/abrir empresa e fazenda; setas do período
    caixa.addEventListener('click', (e) => {
      const r = e.target.closest('[data-cag-recolher]');
      if (r) {
        const k = r.dataset.cagRecolher;
        const conjunto = k.startsWith('f:') ? fazendasAbertas : recolhidos;
        if (conjunto.has(k)) conjunto.delete(k); else conjunto.add(k);
        atualizar();
        caixa.querySelector(`[data-cag-recolher="${CSS.escape(k)}"]`)?.focus();
        return;
      }
      const m = e.target.closest('[data-cag-mover]');
      if (m && !m.disabled) {
        const atual = janelaDe(planosFiltrados().flatMap((p) => operacoesDoPlano(p)));
        inicioPeriodo = atual.iniMi + Number(m.dataset.cagMover) * atual.tam;
        atualizar();
        caixa.querySelector(`[data-cag-mover="${m.dataset.cagMover}"]:not(:disabled)`)?.focus();
      }
    });
    conteudo.querySelectorAll('[data-filtro]').forEach((select) => {
      select.addEventListener('change', () => { filtros[select.dataset.filtro] = select.value; atualizar(); });
    });
    conteudo.querySelector('[data-acao="cag-limpar"]').addEventListener('click', () => {
      filtros = filtrosIniciais();
      periodo = 'ano'; inicioPeriodo = null;
      conteudo.querySelector('[data-cag-periodo]').value = periodo;
      conteudo.querySelectorAll('[data-filtro]').forEach((select) => { select.value = filtros[select.dataset.filtro]; });
      atualizar();
    });
    atualizar();
  }

  return { desenhar, aoMostrar };
})();
