/*
 * Calendário Agrícola do menu (DECISOES 4.0): vários planos somados, no ano agrícola escolhido (safras e safrinhas).
 * Uma linha por plano (empresa · fazenda · cultura · safra/safrinha), agrupada por empresa, com uma barra do ciclo
 * da cultura na linha do tempo do ano agrícola (setembro a agosto): do primeiro plantio à última colheita prevista.
 * Usa a última versão publicada de cada plano (DECISOES 4.0).
 */
window.Telas = window.Telas || {};

window.Telas.calendarioAgricola = (function () {
  const esc = Util.escapar;
  const NOMES_MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  // Cor de cada cultura na linha do tempo (outras: cinza)
  const COR = { Soja: '#1E7A4C', Milho: '#D9A21B', 'Algodão': '#3F6FB0' };

  let filtros = {};
  // Safra/Safrinha do plano: ainda não é escolhida ao criar o plano (DECISOES 4.2: a detalhar); por enquanto, Safra
  const cicloDe = (p) => p.ciclo || 'Safra';
  const valorDe = (p, campo) => (campo === 'anoAgricola' ? String(Util.anoAgricola(p.safra)) : p[campo]);
  function presentes(campo, cadastro) {
    const naLista = new Set(DADOS.planos.map((p) => valorDe(p, campo)));
    return cadastro.filter((item) => naLista.has(item));
  }
  // Ano Agrícola: junta as safras e safrinhas do ano; começa no de hoje, ou no mais recente com planos
  const filtrosIniciais = () => ({ anoAgricola: Util.anoAgricolaInicial(Util.anosAgricolas(DADOS.planos)), empresa: '', fazenda: '', cultura: '' });

  // ----- Datas -----
  const dataDe = (iso) => { const [a, m, d] = iso.split('-').map(Number); return new Date(a, m - 1, d); };
  const somaDias = (iso, n) => { const d = dataDe(iso); d.setDate(d.getDate() + n); return d; };
  const ddmm = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  // Ano agrícola 2026: como a safra, de 1º de setembro de 2026 a 31 de agosto de 2027; se alguma colheita passar
  // de agosto, a linha do tempo vai até o fim do mês dessa colheita
  function janela(anoAgricola, ultimaData) {
    const ano = Number(anoAgricola);
    const ini = new Date(ano, 8, 1);
    let fim = new Date(ano + 1, 8, 1);
    if (ultimaData && ultimaData >= fim) fim = new Date(ultimaData.getFullYear(), ultimaData.getMonth() + 1, 1);
    const meses = [];
    for (let d = new Date(ini); d < fim; d.setMonth(d.getMonth() + 1)) meses.push(NOMES_MESES[d.getMonth()]);
    return { ini, fim, meses };
  }
  const pct = (d, { ini, fim }) => Math.min(100, Math.max(0, (d - ini) / (fim - ini) * 100));

  // Ciclo da cultura no plano (última versão publicada): primeiro plantio e última colheita prevista
  // (plantio + ciclo da variedade), nos talhões incluídos com data de plantio
  function cicloDoPlano(p) {
    const v = Versoes.ultimaPublicada(p);
    if (!v) return { versao: null };
    const grupos = Versoes.grupos(p, v);
    const talhoes = Util.talhoesPlano(p, v).map((t) => t.nome);
    const op = (grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0];
    const pl = (op && op.plantio) || {};
    const plantios = []; const colheitas = [];
    talhoes.forEach((t) => {
      const x = pl[t];
      if (!x || !x.data) return;
      plantios.push(dataDe(x.data));
      const variedade = DADOS.variedades.find((vv) => vv.nome === x.variedade);
      if (variedade && variedade.ciclo) colheitas.push(somaDias(x.data, variedade.ciclo));
    });
    if (!plantios.length) return { versao: v };
    const min = (xs) => new Date(Math.min(...xs)); const max = (xs) => new Date(Math.max(...xs));
    return { versao: v, plantioIni: min(plantios), plantioFim: max(plantios),
      colheitaIni: colheitas.length ? min(colheitas) : null, colheitaFim: colheitas.length ? max(colheitas) : null };
  }

  // ----- Desenho -----
  function desenhar() {
    filtros = filtrosIniciais();
    return `
      <header class="cabecalho">
        <div>
          <h1 class="cabecalho__titulo">Calendário Agrícola</h1>
          <p class="cabecalho__subtitulo">O ciclo de cada cultura, do plantio à colheita, em todas as empresas e fazendas do ano agrícola.</p>
        </div>
        <span class="cag-etiqueta" title="Mostra a última versão publicada de cada plano. Alterações em versões em construção aparecem aqui depois de publicadas.">${Icones.info} Últimas versões publicadas</span>
      </header>
      <div class="pagina">
        <section class="cartao filtros" aria-label="Filtrar o calendário">
          ${filtro('anoAgricola', 'Ano Agrícola', Util.anosAgricolas(DADOS.planos), null)}
          ${filtro('empresa', 'Empresa', presentes('empresa', DADOS.empresas))}
          ${filtro('fazenda', 'Fazenda', presentes('fazenda', DADOS.fazendas))}
          ${filtro('cultura', 'Cultura', presentes('cultura', DADOS.culturasPlanos))}
          <button class="link-acao filtros__limpar" type="button" data-acao="cag-limpar">${Icones.limpar} Limpar filtros</button>
        </section>
        <section class="cag" aria-label="Linha do tempo do ano agrícola" data-cag></section>
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
    const planos = DADOS.planos.filter((p) => ['anoAgricola', 'empresa', 'fazenda', 'cultura'].every((c) => !filtros[c] || valorDe(p, c) === filtros[c]));
    if (!planos.length) return '<p class="cag__vazio">Nenhum plano com esses filtros.</p>';
    const fins = planos.map((p) => { const c = cicloDoPlano(p); return c.colheitaFim || c.plantioFim; }).filter(Boolean);
    const j = janela(filtros.anoAgricola, fins.length ? new Date(Math.max(...fins)) : null);
    const grade = `grid-template-columns: repeat(${j.meses.length}, minmax(0, 1fr))`;
    const fundo = `background-size: calc(100% / ${j.meses.length}) 100%`;
    const hoje = new Date();
    const hojeNaSafra = hoje >= j.ini && hoje < j.fim;
    const marcaHoje = hojeNaSafra ? `<span class="cag__hoje" style="left: ${pct(hoje, j).toFixed(2)}%" aria-hidden="true"></span>` : '';
    // Agrupado por empresa (na ordem do cadastro); dentro, por fazenda, a safra antes da safrinha, e por cultura
    const empresas = DADOS.empresas.filter((e) => planos.some((p) => p.empresa === e));
    const culturas = [...new Set(planos.map((p) => p.cultura))];
    return `
      <div class="cag__legenda">
        ${culturas.map((c) => `<span><span class="cag__cor" style="background: ${COR[c] || '#7B8A82'}" aria-hidden="true"></span>${esc(c)}</span>`).join('')}
        ${hojeNaSafra ? '<span><span class="cag__cor cag__cor--hoje" aria-hidden="true"></span>Hoje</span>' : ''}
      </div>
      <div class="cag__rolagem">
        <div class="cag__tabela" role="table" aria-label="Ciclo das culturas por empresa e fazenda">
          <div class="cag__linha cag__linha--cab" role="row">
            <span role="columnheader">Fazenda</span><span role="columnheader">Cultura · safra</span>
            <span role="columnheader" class="cag__num">Área</span>
            <span role="columnheader" class="cag__meses" style="${grade}">${j.meses.map((m) => `<span>${m}</span>`).join('')}</span>
          </div>
          ${empresas.map((e) => {
            const doGrupo = planos.filter((p) => p.empresa === e)
              .sort((a, b) => a.fazenda.localeCompare(b.fazenda) || (cicloDe(a) === 'Safrinha') - (cicloDe(b) === 'Safrinha') || a.cultura.localeCompare(b.cultura));
            const ciclos = doGrupo.map((p) => ({ p, c: cicloDoPlano(p) }));
            const area = ciclos.reduce((s, { p, c }) => s + (Util.areaCultivo(p, c.versao) || 0), 0);
            const fazendas = new Set(doGrupo.map((p) => p.fazenda)).size;
            return `
              <div class="cag__empresa" role="row"><strong role="cell">${esc(e)}</strong>
                <span role="cell">${fazendas} ${fazendas === 1 ? 'fazenda' : 'fazendas'} · ${Util.area(area)}</span></div>
              ${ciclos.map(({ p, c }) => linha(p, c, j, marcaHoje, fundo)).join('')}`;
          }).join('')}
        </div>
      </div>
      <p class="cag__nota">Cada barra é o ciclo da cultura: do primeiro plantio à última colheita prevista (plantio + ciclo da variedade). Passe o mouse para ver as datas.</p>`;
  }

  function linha(p, c, j, marcaHoje, fundo) {
    const area = Util.areaCultivo(p, c.versao);
    let barra;
    if (!c.plantioIni) {
      barra = `<span class="cag__sem">${c.versao && !Versoes.aIniciar(p) ? 'Plantio ainda não definido na versão publicada' : 'Plano ainda sem versão publicada com operações'}</span>`;
    } else {
      const fim = c.colheitaFim || c.plantioFim;
      const esq = pct(c.plantioIni, j); const dir = pct(fim, j);
      const dica = `${p.cultura} · ${cicloDe(p)}: plantio de ${ddmm(c.plantioIni)} a ${ddmm(c.plantioFim)}`
        + (c.colheitaIni ? ` · colheita prevista de ${ddmm(c.colheitaIni)} a ${ddmm(c.colheitaFim)}` : ' · colheita sem previsão (variedade sem ciclo)')
        + (area ? ` · ${Util.area(area)}` : '');
      barra = `<span class="cag__barra" style="left: ${esq.toFixed(2)}%; width: ${Math.max(0.6, dir - esq).toFixed(2)}%; background: ${COR[p.cultura] || '#7B8A82'}"
                     title="${esc(dica)}" role="img" aria-label="${esc(dica)}"></span>`;
    }
    return `
      <div class="cag__linha" role="row">
        <span role="cell"><strong>${esc(p.fazenda)}</strong><small>${c.versao ? `versão ${esc(c.versao.num)} publicada` : 'sem versão publicada'}</small></span>
        <span role="cell">${esc(p.cultura)}<small class="cag__ciclo cag__ciclo--${cicloDe(p) === 'Safrinha' ? 'safrinha' : 'safra'}">${esc(cicloDe(p))}</small></span>
        <span role="cell" class="cag__num">${area ? Util.area(area) : '<span class="cag__pendente">Pendente</span>'}</span>
        <span role="cell" class="cag__tempo" style="${fundo}">${barra}${marcaHoje}</span>
      </div>`;
  }

  function aoMostrar(conteudo) {
    const atualizar = () => { conteudo.querySelector('[data-cag]').innerHTML = linhaDoTempo(); };
    conteudo.querySelectorAll('[data-filtro]').forEach((select) => {
      select.addEventListener('change', () => { filtros[select.dataset.filtro] = select.value; atualizar(); });
    });
    conteudo.querySelector('[data-acao="cag-limpar"]').addEventListener('click', () => {
      filtros = filtrosIniciais();
      conteudo.querySelectorAll('[data-filtro]').forEach((select) => { select.value = filtros[select.dataset.filtro]; });
      atualizar();
    });
    atualizar();
  }

  return { desenhar, aoMostrar };
})();
