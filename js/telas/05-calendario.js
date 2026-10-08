/*
 * Tela 05 — Calendário Agrícola (docs/telas/05-calendario-agricola.md)
 * Etapa do plano que junta todos os grupos (Semente, Defensivo, Fertilidade…) em ordem de DAP.
 * Duas visões: Infográfico (uma coluna por fase da cultura) e Tabela (uma linha por operação,
 * uma coluna por produto). Filtro por talhão. Na Tabela se informa o prazo para encerramento da OS.
 * Desenhada dentro da Tela 04 (mesmo cabeçalho do plano); a Tela 04 repassa os eventos para cá.
 */
window.Telas = window.Telas || {};

window.Telas.calendario = (function () {
  const esc = Util.escapar;
  const PRAZO_COLHEITA = 10;

  // ----- Prazo para encerramento da OS (dias): o da operação ou o padrão do tipo do grupo -----
  function prazoDe(op, grupo) {
    if (op.prazo !== null && op.prazo !== undefined) return op.prazo;
    return grupo.tipo === 'Sementes' ? 3 : grupo.tipo === 'Colheita' ? PRAZO_COLHEITA : 2;
  }

  // Pré-plantio (DAP negativo), Plantio (DAP 0) e Colheita não têm fenologia
  function fenologiaDe(op) {
    if (op.dap === null || op.dap === undefined || op.dap === '') return '';
    if (op.dap <= 0) return '';
    return op.fenologia || '';
  }

  function variedade(nome) {
    return DADOS.variedades.find((v) => v.nome === nome) || null;
  }

  // Dose: duas casas nos defensivos e no TSI; sem casas fixas na Fertilidade
  function textoDose(valor, grupo) {
    if (valor === null || valor === undefined) return '—';
    return grupo.tipo === 'Fertilidade' ? valor.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) : Util.dose(valor);
  }

  // ----- Itens do calendário: uma operação de qualquer grupo, ou a colheita (prevista pelo plantio) -----
  function itens(ctx) {
    const { plano, talhoes, estado } = ctx;
    const filtro = (nome) => talhaoMarcado(estado, nome);
    const daFazenda = talhoes.filter((t) => filtro(t.nome));
    const area = (nomes) => daFazenda.filter((t) => nomes.includes(t.nome)).reduce((s, t) => s + t.area, 0);
    const lista = [];
    let plantio = null;
    // Grupo Colheita: não entra como operação; a colheita vem do plantio (abaixo) e usa o nome e a previsão de conclusão dele
    const gColheita = plano.grupos.find((g) => g.tipo === 'Colheita');
    const opColheita = gColheita ? gColheita.operacoes[0] : null;
    plano.grupos.filter((g) => g.tipo !== 'Colheita').forEach((grupo) => {
      grupo.operacoes.forEach((op) => {
        const semente = grupo.tipo === 'Sementes';
        if (semente && !plantio) plantio = op;
        const recebem = daFazenda.map((t) => t.nome).filter((t) =>
          semente ? !!((op.plantio || {})[t] && op.plantio[t].variedade) : !!op.talhoes[t]);
        // Produtos: um por produto comercial, com a dose de cada talhão (receitas da operação; no grupo Tratamento de semente, as TSI)
        const produtos = new Map();
        daFazenda.forEach((t) => {
          const ajuste = op.talhoes[t.nome];
          if (!ajuste) return;
          Planos.linhasTalhao(op, ajuste).forEach((l) => {
            const chave = Planos.chaveLinha(l);
            if (!produtos.has(chave)) produtos.set(chave, { nome: Planos.nomeLinha(l), unidade: Planos.unidadeDose(l), doses: [] });
            produtos.get(chave).doses.push({ talhao: t.nome, dose: Planos.doseTalhao(op, ajuste, l) });
          });
        });
        const variedades = semente ? new Set(recebem.map((t) => op.plantio[t].variedade)) : null;
        lista.push({ grupo, op, dap: op.dap, fenologia: fenologiaDe(op), prazo: prazoDe(op, grupo),
          talhoes: recebem, area: area(recebem), produtos: [...produtos.entries()], variedades });
      });
    });
    // Colheita: talhões com variedade, data de plantio e ciclo; o DAP é o ciclo da variedade
    // Colheita: sempre a última coluna. Com plantio (variedade, data e ciclo), o DAP é o ciclo da variedade;
    // antes disso, aparece "Aguardando plantio" (o DAP é pelo ciclo, só existe depois do plantio)
    const comPrevisao = plantio ? daFazenda.filter((t) => {
      const p = (plantio.plantio || {})[t.nome];
      const v = p && p.variedade ? variedade(p.variedade) : null;
      return p && p.data && v && v.ciclo;
    }).map((t) => t.nome) : [];
    const prazoColheita = opColheita ? prazoDe(opColheita, gColheita) : (plantio && plantio.prazoColheita) ?? PRAZO_COLHEITA;
    if (!comPrevisao.length) {
      lista.push({ colheita: true, aguardando: true, grupo: gColheita || { nome: 'Colheita', tipo: 'Colheita' }, op: opColheita || plantio,
        dap: null, fenologia: '', prazo: prazoColheita, talhoes: [], area: 0, produtos: [], variedades: null });
    }
    {
      if (comPrevisao.length) {
        const ciclos = comPrevisao.map((t) => variedade(plantio.plantio[t].variedade).ciclo);
        lista.push({ colheita: true, grupo: gColheita || { nome: 'Colheita', tipo: 'Colheita' }, op: opColheita || plantio,
          dap: Math.min(...ciclos), dapMax: Math.max(...ciclos), fenologia: '',
          prazo: prazoColheita, talhoes: comPrevisao, area: area(comPrevisao), produtos: [],
          variedades: new Set(comPrevisao.map((t) => plantio.plantio[t].variedade)) });
      }
    }
    const ordemGrupo = (i) => plano.grupos.indexOf(i.grupo);
    return lista.sort((a, b) => (a.colheita - b.colheita) || ((a.dap ?? 9999) - (b.dap ?? 9999)) || (ordemGrupo(a) - ordemGrupo(b)));
  }

  // "0,40 L/ha"; doses diferentes entre talhões: "130 a 160 kg/ha", com o detalhe ao passar o mouse
  function dose(produto, grupo) {
    const valores = [...new Set(produto.doses.map((d) => d.dose))].filter((d) => d !== null && d !== undefined).sort((a, b) => a - b);
    const u = produto.unidade ? ` ${produto.unidade}` : '';
    if (!valores.length) return { texto: '—', detalhe: '' };
    if (valores.length === 1) return { texto: `${textoDose(valores[0], grupo)}${u}`, detalhe: '' };
    const detalhe = valores.map((v) => {
      const ts = produto.doses.filter((d) => d.dose === v).map((d) => d.talhao);
      return `${textoDose(v, grupo)}${u} ${ts.length <= 3 ? `no${ts.length > 1 ? 's' : ''} ${ts.join(', ')}` : `em ${ts.length} talhões`}`;
    }).join(' · ');
    return { texto: `${textoDose(valores[0], grupo)} a ${textoDose(valores[valores.length - 1], grupo)}${u}`, detalhe };
  }

  // ----- Fases (colunas do infográfico) -----
  const ORDEM_FEN = () => DADOS.fenologia;
  function faseDe(item) {
    if (item.colheita) return 'colheita';
    if (item.dap === null || item.dap === undefined || item.dap === '') return 'sem-dap';
    if (item.dap < 0) return 'pre';
    if (item.dap === 0) return 'plantio';
    return item.fenologia ? `fen:${item.fenologia}` : `dap:${item.dap}`;
  }

  // Imagem de cada fase (img/fenologia, uma por estádio). Caminho completo e literal: o script do arquivo único
  // (ferramentas/gerar-compartilhar.js) só embute imagens escritas assim.
  const IMAGENS = {
    pre: 'img/fenologia/PRE-PLANTIO.svg', plantio: 'img/fenologia/PLANTIO.svg', colheita: 'img/fenologia/COLHEITA.svg',
    neutro: 'img/fenologia/NEUTRO.svg',
    VE: 'img/fenologia/VE.svg', VC: 'img/fenologia/VC.svg', V1: 'img/fenologia/V1.svg', V2: 'img/fenologia/V2.svg',
    V3: 'img/fenologia/V3.svg', V4: 'img/fenologia/V4.svg', V5: 'img/fenologia/V5.svg', V6: 'img/fenologia/V6.svg',
    R1: 'img/fenologia/R1.svg', R2: 'img/fenologia/R2.svg', R3: 'img/fenologia/R3.svg', R4: 'img/fenologia/R4.svg',
    R5: 'img/fenologia/R5.svg', R6: 'img/fenologia/R6.svg', R7: 'img/fenologia/R7.svg', R8: 'img/fenologia/R8.svg'
  };

  // Cor do título e imagem de cada fase.
  // Sem fenologia ou sem DAP: imagem neutra (calendário).
  function visualDe(chave) {
    if (chave === 'pre') return { cor: '#6f5b12', imagem: IMAGENS.pre };
    if (chave === 'plantio') return { cor: '#2e7d32', imagem: IMAGENS.plantio };
    if (chave === 'colheita') return { cor: '#23395d', imagem: IMAGENS.colheita };
    if (chave.startsWith('fen:')) {
      const f = chave.slice(4);
      const imagem = IMAGENS[f] || IMAGENS.neutro;
      if (/^V|^VE|^VC/.test(f)) return { cor: '#0f7f74', imagem };
      if (f === 'R1' || f === 'R2') return { cor: '#1b7a8c', imagem };
      if (f === 'R3' || f === 'R4') return { cor: '#2a64a8', imagem };
      if (f === 'R5' || f === 'R6') return { cor: '#1d5a6b', imagem };
      return { cor: '#5a5520', imagem };
    }
    return { cor: '#6b7280', imagem: IMAGENS.neutro };
  }

  function colunas(lista) {
    const mapa = new Map();
    lista.forEach((item) => {
      const chave = faseDe(item);
      if (!mapa.has(chave)) mapa.set(chave, { chave, itens: [], daps: [] });
      const c = mapa.get(chave);
      c.itens.push(item);
      if (item.dap !== null && item.dap !== undefined && item.dap !== '') c.daps.push(item.dap, item.dapMax ?? item.dap);
    });
    const peso = (c) => (c.chave === 'colheita' ? 1e6 : c.chave === 'sem-dap' ? 2e6 : Math.min(...c.daps));
    return [...mapa.values()].sort((a, b) => peso(a) - peso(b) ||
      ORDEM_FEN().indexOf(a.chave.slice(4)) - ORDEM_FEN().indexOf(b.chave.slice(4)));
  }

  function tituloColuna(c) {
    const min = Math.min(...c.daps); const max = Math.max(...c.daps);
    const faixa = c.daps.length ? (min === max ? `${min} DAP` : `${min} a ${max} DAP`) : '';
    if (c.chave === 'pre') return ['Pré-plantio', faixa];
    if (c.chave === 'plantio') return ['Plantio', faixa];
    if (c.chave === 'colheita') return ['Colheita', faixa || 'pelo ciclo da variedade'];
    if (c.chave === 'sem-dap') return ['Sem DAP', ''];
    if (c.chave.startsWith('fen:')) return [c.chave.slice(4), faixa];
    return [faixa, 'sem fenologia'];
  }

  // ----- Desenho -----
  function desenhar(ctx) {
    const { talhoes, estado, plano } = ctx;
    // Em construção: todas as operações cadastradas na etapa Operações, já no calendário; o que ainda não tem
    // talhão planejado aparece como "Sem recomendação" e vai se preenchendo conforme o planejamento.
    // Plano aprovado: só o que tem produto e dose (ou plantio); o resto não aparece.
    const lista = itens(ctx).filter((it) => !ctx.somenteLeitura || (it.colheita ? !it.aguardando : it.talhoes.length > 0))
      .filter((it) => marcado(estado, 'grupo', chaveGrupo(it)));
    return `
      <section class="calendario">
        <div class="calendario__barra">
          <div class="calendario__filtros">
            <div class="calendario__filtro">
              <span class="calendario__filtro-rotulo">Grupo de operação</span>
              ${filtroCaixa(estado, 'grupo', opcoesGrupo(plano), ['Todos os grupos', 'Nenhum grupo', 'grupos'], 'Grupo de operação')}
            </div>
            <div class="calendario__filtro">
              <span class="calendario__filtro-rotulo">Talhão</span>
              ${filtroCaixa(estado, 'talhao', opcoesTalhao(talhoes), ['Todos os talhões', 'Nenhum talhão', 'talhões'], 'Talhões')}
            </div>
          </div>
          <div class="visoes calendario__visoes" role="group" aria-label="Visão do calendário">
            ${[['infografico', Icones.grafico, 'Infográfico'], ['tabela', Icones.lista, 'Tabela']].map(([v, icone, rotulo]) => `
              <button class="visoes__botao ${estado.visao === v ? 'visoes__botao--ativo' : ''}" type="button" data-acao="cal-visao"
                      data-visao="${v}" aria-pressed="${estado.visao === v}">${icone}${rotulo}</button>`).join('')}
          </div>
        </div>
        ${resumo(ctx)}
        ${estado.visao === 'tabela' ? tabela(ctx, lista) : infografico(ctx, lista)}
      </section>`;
  }

  // ----- Cards de resumo (topo do Infográfico e da Tabela) -----
  // Previsão de plantio e de colheita, dos talhões com plantio definido (variedade e data)
  const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function partes(iso) { const [a, m, d] = iso.split('-').map(Number); return { a, m, d }; }
  function somaDias(iso, n) {
    const { a, m, d } = partes(iso);
    const dt = new Date(a, m - 1, d + n);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
  // "01–20/out/2026"; meses diferentes: "22/set–10/out/2026"; anos diferentes: "28/dez/2026–05/jan/2027"
  function intervalo(isos) {
    if (!isos.length) return '';
    const ord = [...isos].sort();
    const i = partes(ord[0]); const f = partes(ord[ord.length - 1]);
    const dd = (x) => String(x.d).padStart(2, '0');
    if (ord[0] === ord[ord.length - 1]) return `${dd(i)}/${MESES_CURTOS[i.m - 1]}/${i.a}`;
    if (i.a !== f.a) return `${dd(i)}/${MESES_CURTOS[i.m - 1]}/${i.a}–${dd(f)}/${MESES_CURTOS[f.m - 1]}/${f.a}`;
    if (i.m !== f.m) return `${dd(i)}/${MESES_CURTOS[i.m - 1]}–${dd(f)}/${MESES_CURTOS[f.m - 1]}/${f.a}`;
    return `${dd(i)}–${dd(f)}/${MESES_CURTOS[f.m - 1]}/${f.a}`;
  }
  function plantioDo(plano) {
    return (plano.grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0] || null;
  }
  function previsaoColheita(p) {
    const v = p && p.variedade ? variedade(p.variedade) : null;
    return p && p.data && v && v.ciclo ? somaDias(p.data, v.ciclo) : null;
  }

  function resumo(ctx) {
    const { plano, talhoes } = ctx;
    const op = plantioDo(plano);
    const pl = (op && op.plantio) || {};
    const comPlantio = talhoes.filter((t) => pl[t.nome] && pl[t.nome].variedade && pl[t.nome].data);
    const datas = comPlantio.map((t) => pl[t.nome].data);
    const colheitas = comPlantio.map((t) => previsaoColheita(pl[t.nome])).filter(Boolean);
    const card = (icone, rotulo, corpo) => `
      <div class="resumo-card">
        <span class="resumo-card__icone">${icone}</span>
        <div class="resumo-card__texto"><span class="resumo-card__rotulo">${rotulo}</span>${corpo}</div>
      </div>`;
    const semPlantio = '<span class="resumo-card__vazio">—</span><span class="resumo-card__dica">Defina o plantio na guia Semente</span>';
    return `
      <section class="resumo-cards" aria-label="Resumo do planejamento">
        ${card(Icones.calendario, 'Previsão de plantio', datas.length ? `<span class="resumo-card__valor resumo-card__valor--data">${intervalo(datas)}</span>` : semPlantio)}
        ${card(Icones.calendario, 'Previsão de colheita', colheitas.length ? `<span class="resumo-card__valor resumo-card__valor--data">${intervalo(colheitas)}</span>`
          : datas.length ? '<span class="resumo-card__vazio">—</span><span class="resumo-card__dica">Variedade sem ciclo</span>' : semPlantio)}
      </section>`;
  }

  function etiqueta(grupo) {
    const tipo = Util.normalizar(grupo.tipo || 'outro').replace(/\s+/g, '-');
    return `<span class="cal-etiqueta cal-etiqueta--${tipo}">${esc(grupo.nome)}</span>`;
  }

  function cartao(item) {
    const n = item.variedades ? item.variedades.size : 0;
    const extra = item.aguardando ? '<p class="cal-cartao__sem">Aguardando plantio: a data vem do plantio + ciclo da variedade</p>'
      : item.variedades ? `<p class="cal-cartao__sub">${n ? `${n} ${n === 1 ? 'variedade' : 'variedades'}` : 'Sem variedade'}</p>` : '';
    const produtos = item.produtos.length ? `
      <ul class="cal-cartao__produtos">
        ${item.produtos.map(([, p]) => {
          const d = dose(p, item.grupo);
          return `<li><span class="cal-cartao__produto">${esc(p.nome)}</span><span class="cal-cartao__dose" ${d.detalhe ? `title="${esc(d.detalhe)}"` : ''}>${esc(d.texto)}</span></li>`;
        }).join('')}
      </ul>` : (!item.variedades && !item.colheita ? '<p class="cal-cartao__sem">Sem recomendação</p>' : '');
    return `
      <article class="cal-cartao">
        ${etiqueta(item.grupo)}
        <h4 class="cal-cartao__nome">${esc(item.colheita ? 'Colheita' : item.op.nome)}</h4>
        ${extra}${produtos}
      </article>`;
  }

  function infografico(ctx, lista) {
    const cols = colunas(lista);
    return `
      <div class="cal-info" role="list" aria-label="Calendário por fase da cultura">
        ${cols.map((c, i) => {
          const { cor, imagem } = visualDe(c.chave);
          const [titulo, sub] = tituloColuna(c);
          const talhoes = new Set(c.itens.flatMap((it) => it.talhoes));
          const area = ctx.talhoes.filter((t) => talhoes.has(t.nome)).reduce((s, t) => s + t.area, 0);
          const nOps = c.itens.length;
          return `
            ${i ? `<span class="cal-info__seta" aria-hidden="true">${Icones.proxima}</span>` : ''}
            <section class="cal-fase" role="listitem" aria-label="${esc(`${titulo} ${sub}`)}">
              <header class="cal-fase__titulo" style="background: ${cor}">
                <span class="cal-fase__nome">${esc(titulo)}</span>${sub ? `<span class="cal-fase__dap">(${esc(sub)})</span>` : ''}
              </header>
              <img class="cal-fase__desenho cal-fase__imagem" src="${imagem}" alt="">
              <div class="cal-fase__itens">${c.itens.map(cartao).join('')}</div>
              <footer class="cal-fase__pe">${Icones.mapa}<span><strong>${Util.area(area)}</strong> · ${talhoes.size} ${talhoes.size === 1 ? 'talhão' : 'talhões'} · ${nOps} ${nOps === 1 ? 'operação' : 'operações'}</span></footer>
            </section>`;
        }).join('')}
      </div>`;
  }

  // ----- Tabela: uma linha por operação (abre e fecha), com os produtos embaixo; uma coluna por talhão -----
  // Faixa da fase à esquerda (as mesmas cores da etapa Operações). Dose do talhão diferente da padrão: amarelo;
  // talhão que não recebe o produto: "—" em cinza.
  const FAIXAS = { pre: 'Pré-plantio', plantio: 'Plantio', desenv: 'Manejo da cultura', colheita: 'Colheita' };
  function faixaDe(it) {
    if (it.colheita) return 'colheita';
    if (it.dap === null || it.dap === undefined || it.dap === '') return 'desenv';
    return it.dap < 0 ? 'pre' : it.dap === 0 ? 'plantio' : 'desenv';
  }

  // Linhas de baixo de cada operação: [rótulo, unidade, valor por talhão → { texto, classe }]
  function subLinhas(it, ctx) {
    const pl = (it.colheita || it.grupo.tipo === 'Sementes') ? ((plantioDo(ctx.plano) || {}).plantio || {}) : null;
    if (it.colheita) {
      return [['Previsão de colheita', 'data', (t) => {
        const prev = previsaoColheita(pl[t.nome]);
        return prev ? { texto: diaMes(prev) } : { texto: '—', classe: 'cal-piv__nao' };
      }]];
    }
    if (it.grupo.tipo === 'Sementes') {
      return [
        ['Data de plantio', 'data', (t) => (pl[t.nome] && pl[t.nome].data ? { texto: diaMes(pl[t.nome].data) } : { texto: '—', classe: 'cal-piv__nao' })],
        ['População', 'mil pl/ha', (t) => (pl[t.nome] && pl[t.nome].populacao ? { texto: Util.dose(pl[t.nome].populacao).replace(/,00$/, '') } : { texto: '—', classe: 'cal-piv__nao' })]
      ];
    }
    const op = it.op;
    return Planos.colunasDose(op).map((col) => [Planos.nomeLinha(col), Planos.unidadeDose(col), (t) => {
      const ajuste = op.talhoes[t.nome];
      const l = ajuste ? Planos.linhaNoTalhao(op, ajuste, col) : null;
      if (!l) return { texto: '—', classe: 'cal-piv__nao' };
      const d = Planos.doseTalhao(op, ajuste, l);
      const ajustada = l.id in ajuste.doses && d !== l.dose;
      return { texto: textoDose(d, it.grupo), classe: ajustada ? 'cal-piv__ajuste' : '', titulo: ajustada ? `Dose do talhão; padrão da receita: ${textoDose(l.dose, it.grupo)}` : '' };
    }]);
  }

  function diaMes(iso) { const { m, d } = partes(iso); return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`; }

  // Data prevista: data de plantio + DAP, nos talhões da operação (sem talhão planejado, nos talhões do filtro com
  // plantio); datas diferentes entre talhões viram intervalo ("22/set–10/out/2026"). Colheita: a previsão de cada talhão.
  function dataPrevista(it, visiveis, pl) {
    const nomes = it.talhoes.length ? it.talhoes : visiveis.map((t) => t.nome);
    const datas = it.colheita
      ? nomes.map((t) => previsaoColheita(pl[t])).filter(Boolean)
      : (it.dap === null || it.dap === undefined || it.dap === '') ? []
      : nomes.filter((t) => pl[t] && pl[t].data).map((t) => somaDias(pl[t].data, Number(it.dap)));
    return datas.length ? intervalo(datas) : '—';
  }

  function tabela(ctx, lista) {
    const { talhoes, estado, plano } = ctx;
    const visiveis = talhoes.filter((t) => talhaoMarcado(estado, t.nome));
    const pl = (plantioDo(plano) || {}).plantio || {};
    // Cada operação ocupa uma linha por produto (DAP, Fenologia e Operação na altura de todas); sem talhão planejado,
    // uma linha só, com "Sem recomendação" (ou "Sem variedade", no Plantio) na coluna Produto
    const grupos = [];
    lista.forEach((it) => {
      const f = faixaDe(it);
      if (!grupos.length || grupos[grupos.length - 1].f !== f) grupos.push({ f, linhas: [] });
      const vazia = !it.colheita && !it.talhoes.length;
      const subs = vazia ? [] : subLinhas(it, ctx);
      const n = Math.max(1, subs.length);
      const nome = it.colheita ? 'Colheita' : it.op.nome || 'Sem operação';
      const dap = it.aguardando ? 'pelo ciclo' : it.colheita && it.dapMax !== it.dap ? `${it.dap} a ${it.dapMax}` : it.dap ?? '—';
      const comum = `
          <td class="cal-piv__num" rowspan="${n}">${dap}</td>
          <td class="cal-piv__fen" rowspan="${n}">${esc(it.fenologia || '—')}</td>
          <td class="cal-piv__data" rowspan="${n}">${dataPrevista(it, visiveis, pl)}</td>
          <td class="cal-piv__area" rowspan="${n}">${it.area ? Util.area(it.area) : '—'}</td>
          <td class="cal-piv__nome" rowspan="${n}">
            <strong>${esc(nome)}</strong>
            <span class="cal-piv__chip">${esc(it.colheita ? it.grupo.nome : nomeGrupo(it.grupo))}</span>
          </td>`;
      if (vazia) {
        grupos[grupos.length - 1].linhas.push(`
          <tr class="cal-piv__linha cal-piv__linha--inicio">${comum}
            <td colspan="2" class="cal-piv__sem">${it.grupo.tipo === 'Sementes' ? 'Sem variedade' : 'Sem recomendação'}</td>
            ${visiveis.map(() => '<td></td>').join('')}
          </tr>`);
        return;
      }
      subs.forEach(([rotulo, unidade, valor], i) => {
        grupos[grupos.length - 1].linhas.push(`
          <tr class="cal-piv__linha ${i ? '' : 'cal-piv__linha--inicio'}">${i ? '' : comum}
            <td class="cal-piv__produto">${esc(rotulo)}</td>
            <td class="cal-piv__unid">${unidade === 'data' ? '' : esc(unidade)}</td>
            ${visiveis.map((t) => {
              const v = valor(t);
              return `<td class="cal-piv__num ${v.classe || ''}" ${v.titulo ? `title="${esc(v.titulo)}"` : ''}>${esc(v.texto)}</td>`;
            }).join('')}
          </tr>`);
      });
    });
    const colunasTalhao = visiveis.map((t) => {
      const v = pl[t.nome] && pl[t.nome].variedade;
      return `<th class="cal-piv__talhao"><strong>${esc(t.nome)}</strong><span>${esc(v || 'Sem variedade')}</span><span>${Util.area(t.area)}</span></th>`;
    }).join('');
    const faixa = (g) => `
                <th class="tab-op__fase-v tab-op__fase-v--${g.f}" rowspan="${g.linhas.length}" scope="rowgroup">
                  <div class="tab-op__fase-v-conteudo"><span class="tab-op__fase-v-nome">${FAIXAS[g.f]}</span></div>
                </th>`;
    const INICIO = '<tr class="cal-piv__linha cal-piv__linha--inicio">';
    return `
      <div class="cal-piv">
        <table class="cal-piv__tabela">
          <thead><tr>
            <th class="cal-piv__fase-cab"><span class="so-leitor">Fase</span></th>
            <th class="cal-piv__num">DAP</th><th>Fenologia</th><th>Data prevista</th><th class="cal-piv__area">Área</th><th>Operação</th><th>Produto</th><th>Unid.</th>
            ${colunasTalhao}
          </tr></thead>
          ${grupos.length ? grupos.map((g) => `
            <tbody>
              ${g.linhas.map((l, i) => (i ? l : l.replace(INICIO, () => INICIO + faixa(g)))).join('')}
            </tbody>`).join('') : `<tbody><tr><td colspan="${8 + visiveis.length}" class="cal-piv__nada">Nenhuma operação com os filtros escolhidos</td></tr></tbody>`}
        </table>
      </div>`;
  }

  // ----- Filtros (Grupo de operação e Talhão): caixa com Pesquisar, "Todos" e uma marcação por opção -----
  // estado.talhao / estado.grupo: 'todos' ou a lista dos valores marcados; estado.busca: texto pesquisado em cada caixa
  function marcado(estado, chave, valor) {
    const v = estado[chave];
    return v === undefined || v === 'todos' || (Array.isArray(v) && v.includes(valor));
  }
  function talhaoMarcado(estado, nome) { return marcado(estado, 'talhao', nome); }
  // Grupo de um item do calendário: o id do grupo; a colheita, "colheita"
  function chaveGrupo(it) { return it.colheita ? 'colheita' : it.grupo.id; }
  function nomeGrupo(g) { return g.semGrupo ? 'Sem grupo de operação' : g.nome; }
  // Opções do filtro de grupo: os grupos com operação, na ordem do plano, e a Colheita no fim
  function opcoesGrupo(plano) {
    const gs = plano.grupos.filter((g) => g.tipo !== 'Colheita' && g.operacoes.length)
      .map((g) => ({ valor: g.id, nome: nomeGrupo(g) }));
    const gc = plano.grupos.find((g) => g.tipo === 'Colheita');
    return [...gs, { valor: 'colheita', nome: gc ? gc.nome : 'Colheita' }];
  }
  function opcoesTalhao(talhoes) {
    return talhoes.map((t) => ({ valor: t.nome, nome: t.nome, extra: Util.area(t.area) }));
  }
  function casaBusca(estado, chave, nome) {
    const q = Util.normalizar(((estado.busca || {})[chave] || '').trim());
    return !q || Util.normalizar(nome).includes(q);
  }
  // chave: 'talhao' ou 'grupo'; textos: [todos, nenhum, plural]
  function filtroCaixa(estado, chave, opcoes, [todos, nenhum, plural], rotulo) {
    const marcadas = opcoes.filter((o) => marcado(estado, chave, o.valor));
    const texto = marcadas.length === opcoes.length ? todos
      : !marcadas.length ? nenhum
      : marcadas.length === 1 ? marcadas[0].nome : `${marcadas.length} ${plural}`;
    return `
      <details class="cal-filtro" data-filtro="${chave}" ${estado.filtroAberto === chave ? 'open' : ''}>
        <summary class="campo__controle cal-filtro__botao" aria-label="${esc(rotulo)}">${esc(texto)}<span class="cal-filtro__seta" aria-hidden="true">${Icones.abaixo}</span></summary>
        <div class="cal-filtro__painel">
          <div class="cal-filtro__busca">
            <input type="search" class="campo__controle" data-campo="cal-busca" data-filtro="${chave}" placeholder="Pesquisar"
                   aria-label="Pesquisar ${esc(rotulo.toLowerCase())}" value="${esc((estado.busca || {})[chave] || '')}" autocomplete="off">
          </div>
          <label class="cal-filtro__opcao cal-filtro__opcao--todos">
            <input type="checkbox" data-campo="cal-filtro" data-filtro="${chave}" value="todos" ${marcadas.length === opcoes.length ? 'checked' : ''}> ${esc(todos)}
          </label>
          ${opcoes.map((o) => `
            <label class="cal-filtro__opcao" data-nome="${esc(Util.normalizar(o.nome))}" ${casaBusca(estado, chave, o.nome) ? '' : 'hidden'}>
              <input type="checkbox" data-campo="cal-filtro" data-filtro="${chave}" value="${esc(o.valor)}" ${marcado(estado, chave, o.valor) ? 'checked' : ''}>
              <span>${esc(o.nome)}</span>${o.extra ? `<span class="cal-filtro__area">${esc(o.extra)}</span>` : ''}
            </label>`).join('')}
          <p class="cal-filtro__nada" ${opcoes.some((o) => casaBusca(estado, chave, o.nome)) ? 'hidden' : ''}>Nada encontrado</p>
        </div>
      </details>`;
  }

  // Pesquisar: esconde as opções que não têm o texto no nome (sem redesenhar, para não perder o foco)
  function aoDigitar(e, ctx) {
    if (e.target.dataset.campo !== 'cal-busca') return false;
    ctx.estado.busca = ctx.estado.busca || {};
    ctx.estado.busca[e.target.dataset.filtro] = e.target.value;
    const q = Util.normalizar(e.target.value.trim());
    const painel = e.target.closest('.cal-filtro__painel');
    const opcoes = [...painel.querySelectorAll('.cal-filtro__opcao[data-nome]')];
    opcoes.forEach((l) => { l.hidden = !!q && !l.dataset.nome.includes(q); });
    painel.querySelector('.cal-filtro__nada').hidden = opcoes.some((l) => !l.hidden);
    return true;
  }

  // ----- Eventos (repassados pela Tela 04). Devolvem true quando o evento era daqui. -----
  function aoClicar(e, ctx, { redesenhar }) {
    // Clique fora de uma caixa de filtro aberta: fecha
    document.querySelectorAll('.cal-filtro[open]').forEach((caixa) => {
      if (!caixa.contains(e.target)) { caixa.open = false; if (ctx.estado.filtroAberto === caixa.dataset.filtro) ctx.estado.filtroAberto = null; }
    });
    const botao = e.target.closest('.cal-filtro__botao');
    if (botao) {
      const caixa = botao.closest('.cal-filtro');
      ctx.estado.filtroAberto = caixa.open ? null : caixa.dataset.filtro;
      return false;
    }
    const alvo = e.target.closest('[data-acao="cal-visao"]');
    if (!alvo) return false;
    ctx.estado.visao = alvo.dataset.visao;
    redesenhar(`[data-visao="${alvo.dataset.visao}"]`);
    return true;
  }

  // Previsão de conclusão: editada na etapa Operações (aqui não se edita)
  function aoMudar(e, ctx, { redesenhar }) {
    if (e.target.dataset.campo !== 'cal-filtro') return false;
    const est = ctx.estado;
    const chave = e.target.dataset.filtro;
    const valores = (chave === 'talhao' ? opcoesTalhao(ctx.talhoes) : opcoesGrupo(ctx.plano)).map((o) => o.valor);
    let marcados = valores.filter((v) => marcado(est, chave, v));
    if (e.target.value === 'todos') marcados = e.target.checked ? [...valores] : [];
    else if (e.target.checked) marcados.push(e.target.value);
    else marcados = marcados.filter((n) => n !== e.target.value);
    est[chave] = marcados.length === valores.length ? 'todos' : marcados;
    est.filtroAberto = chave;
    redesenhar(`[data-campo="cal-filtro"][data-filtro="${chave}"][value="${CSS.escape(e.target.value)}"]`);
    return true;
  }

  return { desenhar, aoClicar, aoMudar, aoDigitar, prazoDe };
})();
