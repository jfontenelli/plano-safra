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
    return grupo.tipo === 'Sementes' ? 3 : 2;
  }

  // Fenologia fixa: DAP negativo = Pré-plantio; DAP 0 = Plantio
  function fenologiaDe(op) {
    if (op.dap === null || op.dap === undefined || op.dap === '') return '';
    if (op.dap < 0) return 'Pré-plantio';
    if (op.dap === 0) return 'Plantio';
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
    const filtro = (nome) => estado.talhao === 'todos' || estado.talhao === nome;
    const daFazenda = talhoes.filter((t) => filtro(t.nome));
    const area = (nomes) => daFazenda.filter((t) => nomes.includes(t.nome)).reduce((s, t) => s + t.area, 0);
    const lista = [];
    let plantio = null;
    plano.grupos.forEach((grupo) => {
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
    if (plantio) {
      const comPrevisao = daFazenda.filter((t) => {
        const p = (plantio.plantio || {})[t.nome];
        const v = p && p.variedade ? variedade(p.variedade) : null;
        return p && p.data && v && v.ciclo;
      }).map((t) => t.nome);
      if (comPrevisao.length) {
        const ciclos = comPrevisao.map((t) => variedade(plantio.plantio[t].variedade).ciclo);
        lista.push({ colheita: true, grupo: { nome: 'Colheita', tipo: 'Colheita' }, op: plantio,
          dap: Math.min(...ciclos), dapMax: Math.max(...ciclos), fenologia: '',
          prazo: plantio.prazoColheita ?? PRAZO_COLHEITA, talhoes: comPrevisao, area: area(comPrevisao), produtos: [],
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

  // Cor do título e ilustração de cada fase
  function visualDe(chave) {
    if (chave === 'pre') return { cor: '#6f5b12', desenho: 'solo' };
    if (chave === 'plantio') return { cor: '#2e7d32', desenho: 'sementes' };
    if (chave === 'colheita') return { cor: '#23395d', desenho: 'graos' };
    if (chave.startsWith('fen:')) {
      const f = chave.slice(4);
      if (/^V|^VE|^VC/.test(f)) return { cor: '#0f7f74', desenho: 'plantula' };
      if (f === 'R1' || f === 'R2') return { cor: '#1b7a8c', desenho: 'flor' };
      if (f === 'R3' || f === 'R4') return { cor: '#2a64a8', desenho: 'vagem' };
      if (f === 'R5' || f === 'R6') return { cor: '#1d5a6b', desenho: 'vagens' };
      return { cor: '#5a5520', desenho: 'madura' };
    }
    return { cor: '#6b7280', desenho: 'plantula' };
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
    if (c.chave === 'colheita') return ['Colheita', faixa];
    if (c.chave === 'sem-dap') return ['Sem DAP', ''];
    if (c.chave.startsWith('fen:')) return [c.chave.slice(4), faixa];
    return [faixa, 'sem fenologia'];
  }

  // Ilustrações simples da fase (SVG, decorativas)
  const DESENHOS = {
    solo: '<ellipse cx="60" cy="64" rx="50" ry="9" fill="#e9e1d3"/><path d="M14 64 Q34 26 60 22 Q86 26 106 64Z" fill="#9a6431"/><path d="M28 50 Q44 36 60 34" stroke="#b97d44" stroke-width="3" fill="none"/>' +
      [[34, 54], [48, 44], [62, 40], [74, 50], [86, 56], [56, 56], [42, 60], [70, 60], [90, 62], [30, 62]].map(([x, y], i) =>
        `<circle cx="${x}" cy="${y}" r="${i % 3 ? 2.6 : 3.4}" fill="${i % 2 ? '#f4efe4' : '#5c3a1c'}"/>`).join(''),
    sementes: '<ellipse cx="60" cy="66" rx="44" ry="7" fill="#efe7d6"/>' +
      [[38, 54, -15], [60, 50, 10], [82, 55, 25], [48, 38, 30], [72, 38, -20]].map(([x, y, r]) =>
        `<ellipse cx="${x}" cy="${y}" rx="14" ry="11" transform="rotate(${r} ${x} ${y})" fill="#ecc98c" stroke="#c99a52" stroke-width="2"/><path d="M${x - 4} ${y - 2} q4 4 8 0" stroke="#c99a52" stroke-width="1.6" fill="none"/>`).join(''),
    plantula: '<ellipse cx="60" cy="68" rx="42" ry="7" fill="#9a6431"/><path d="M60 68 V34" stroke="#4f8a2c" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M60 40 C44 40 32 30 30 18 C44 18 56 26 60 40Z" fill="#6aae3a"/><path d="M60 36 C76 36 88 26 90 14 C76 14 64 22 60 36Z" fill="#82c346"/>',
    flor: '<ellipse cx="60" cy="70" rx="40" ry="6" fill="#9a6431"/><path d="M60 70 V22" stroke="#4f8a2c" stroke-width="4"/>' +
      '<path d="M60 52 C42 54 30 44 28 32 C44 30 56 40 60 52Z" fill="#5fa236"/><path d="M60 44 C78 46 90 36 92 24 C76 22 64 32 60 44Z" fill="#76b941"/>' +
      [[60, 20], [48, 30], [72, 28], [54, 40], [68, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#b97ad8"/><circle cx="${x}" cy="${y}" r="1.8" fill="#f6e6ff"/>`).join(''),
    vagem: '<ellipse cx="60" cy="70" rx="40" ry="6" fill="#9a6431"/><path d="M60 70 V20" stroke="#4f8a2c" stroke-width="4"/>' +
      '<path d="M60 50 C42 52 30 42 28 30 C44 28 56 38 60 50Z" fill="#5fa236"/><path d="M60 40 C78 42 90 32 92 20 C76 18 64 28 60 40Z" fill="#76b941"/>' +
      [[50, 34, -30], [70, 30, 30], [56, 58, -20], [66, 56, 20]].map(([x, y, r]) => `<rect x="${x - 3}" y="${y - 8}" width="6" height="16" rx="3" transform="rotate(${r} ${x} ${y})" fill="#9cc35a"/>`).join('') +
      '<circle cx="60" cy="18" r="4" fill="#b97ad8"/>',
    vagens: '<ellipse cx="60" cy="70" rx="40" ry="6" fill="#9a6431"/>' +
      [[40, 46, -25], [52, 40, -10], [64, 40, 8], [76, 46, 24], [46, 58, -15], [60, 56, 0], [74, 58, 15]].map(([x, y, r]) =>
        `<rect x="${x - 6}" y="${y - 16}" width="12" height="32" rx="6" transform="rotate(${r} ${x} ${y})" fill="#a9cc5f" stroke="#7fa23a" stroke-width="1.5"/>`).join(''),
    madura: '<ellipse cx="60" cy="70" rx="40" ry="6" fill="#9a6431"/><path d="M60 70 V20" stroke="#a5822f" stroke-width="4"/>' +
      [[48, 34, -30], [72, 30, 30], [52, 50, -20], [68, 48, 20], [58, 24, 0]].map(([x, y, r]) =>
        `<rect x="${x - 4}" y="${y - 10}" width="8" height="20" rx="4" transform="rotate(${r} ${x} ${y})" fill="#c9a24a"/>`).join(''),
    graos: '<ellipse cx="60" cy="68" rx="46" ry="7" fill="#efe2bf"/><path d="M18 68 Q60 20 102 68Z" fill="#e1b04c"/>' +
      [[40, 58], [52, 48], [64, 44], [76, 52], [58, 60], [46, 64], [70, 62], [86, 62], [34, 64]].map(([x, y]) =>
        `<ellipse cx="${x}" cy="${y}" rx="5" ry="4" fill="#c9922c"/>`).join('')
  };

  // ----- Desenho -----
  function desenhar(ctx) {
    const { talhoes, estado } = ctx;
    const lista = itens(ctx);
    const total = estado.talhao === 'todos' ? talhoes.length : 1;
    return `
      <section class="calendario">
        <div class="calendario__barra">
          <label class="calendario__filtro">
            <span class="calendario__filtro-rotulo">Talhão</span>
            <select class="campo__controle" data-campo="cal-talhao" aria-label="Talhão">
              <option value="todos" ${estado.talhao === 'todos' ? 'selected' : ''}>Todos os talhões</option>
              ${talhoes.map((t) => `<option value="${esc(t.nome)}" ${estado.talhao === t.nome ? 'selected' : ''}>${esc(t.nome)} · ${Util.area(t.area)}</option>`).join('')}
            </select>
          </label>
          <div class="visoes calendario__visoes" role="group" aria-label="Visão do calendário">
            ${[['infografico', Icones.grafico, 'Infográfico'], ['tabela', Icones.lista, 'Tabela']].map(([v, icone, rotulo]) => `
              <button class="visoes__botao ${estado.visao === v ? 'visoes__botao--ativo' : ''}" type="button" data-acao="cal-visao"
                      data-visao="${v}" aria-pressed="${estado.visao === v}">${icone}${rotulo}</button>`).join('')}
          </div>
        </div>
        ${!lista.length ? '<p class="calendario__vazio">Nenhuma operação no plano.</p>'
          : estado.visao === 'tabela' ? tabela(ctx, lista, total) : infografico(ctx, lista)}
      </section>`;
  }

  function etiqueta(grupo) {
    const tipo = Util.normalizar(grupo.tipo || 'outro').replace(/\s+/g, '-');
    return `<span class="cal-etiqueta cal-etiqueta--${tipo}">${esc(grupo.nome)}</span>`;
  }

  function cartao(item) {
    const n = item.variedades ? item.variedades.size : 0;
    const extra = item.variedades ? `<p class="cal-cartao__sub">${n ? `${n} ${n === 1 ? 'variedade' : 'variedades'}` : 'Sem variedade'}</p>` : '';
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
          const { cor, desenho } = visualDe(c.chave);
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
              <svg class="cal-fase__desenho" viewBox="0 0 120 80" aria-hidden="true">${DESENHOS[desenho]}</svg>
              <div class="cal-fase__itens">${c.itens.map(cartao).join('')}</div>
              <footer class="cal-fase__pe">${Icones.mapa}<span><strong>${Util.area(area)}</strong> · ${talhoes.size} ${talhoes.size === 1 ? 'talhão' : 'talhões'} · ${nOps} ${nOps === 1 ? 'operação' : 'operações'}</span></footer>
            </section>`;
        }).join('')}
      </div>`;
  }

  function tabela(ctx, lista, total) {
    const { somenteLeitura } = ctx;
    // Uma coluna por produto, na ordem em que aparecem no calendário
    const produtos = [];
    lista.forEach((it) => it.produtos.forEach(([chave, p]) => { if (!produtos.some((x) => x.chave === chave)) produtos.push({ chave, nome: p.nome }); }));
    return `
      <div class="cal-tabela talhoes-rolagem">
        <table class="tabela tabela--compacta tabela-talhoes cal-tabela__tabela">
          <thead><tr>
            <th class="tabela__numero">DAP</th><th>Fenologia</th><th>Grupo de operação</th><th>Operação</th><th>Prazo para encerramento da OS</th>
            <th class="tabela__numero">Talhões</th><th class="tabela__numero">Área (ha)</th>
            ${produtos.map((p) => `<th class="tabela__numero">${esc(p.nome)}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${lista.map((it) => {
              const idPrazo = it.colheita ? 'colheita' : it.op.id;
              const prazo = somenteLeitura ? `${it.prazo} ${it.prazo === 1 ? 'dia' : 'dias'}` : `
                <span class="cal-prazo"><input class="campo__controle cal-prazo__campo" type="text" inputmode="numeric" data-campo="cal-prazo"
                       data-op="${idPrazo}" value="${it.prazo}" aria-label="Prazo para encerramento da OS de ${esc(it.colheita ? 'Colheita' : it.op.nome)}, em dias"> dias</span>`;
              const dap = it.colheita && it.dapMax !== it.dap ? `${it.dap} a ${it.dapMax}` : it.dap ?? '—';
              return `
                <tr>
                  <td class="tabela__numero">${dap}</td>
                  <td>${esc(it.fenologia || '—')}</td>
                  <td>${esc(it.grupo.nome)}</td>
                  <th scope="row" class="cal-tabela__op">${esc(it.colheita ? 'Colheita' : it.op.nome)}</th>
                  <td>${prazo}</td>
                  <td class="tabela__numero">${it.talhoes.length}/${total}</td>
                  <td class="tabela__numero">${Util.area(it.area).replace(' ha', '')}</td>
                  ${produtos.map((p) => {
                    const achado = it.produtos.find(([c]) => c === p.chave);
                    if (!achado) return '<td class="tabela__numero tabela__nao-recebe">—</td>';
                    const d = dose(achado[1], it.grupo);
                    return `<td class="tabela__numero" ${d.detalhe ? `title="${esc(d.detalhe)}"` : ''}>${esc(d.texto)}</td>`;
                  }).join('')}
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // ----- Eventos (repassados pela Tela 04). Devolvem true quando o evento era daqui. -----
  function aoClicar(e, ctx, { redesenhar }) {
    const alvo = e.target.closest('[data-acao="cal-visao"]');
    if (!alvo) return false;
    ctx.estado.visao = alvo.dataset.visao;
    redesenhar(`[data-visao="${alvo.dataset.visao}"]`);
    return true;
  }

  function aoMudar(e, ctx, { redesenhar, alterou }) {
    const campo = e.target.dataset.campo;
    if (campo === 'cal-talhao') { ctx.estado.talhao = e.target.value; redesenhar('[data-campo="cal-talhao"]'); return true; }
    if (campo === 'cal-prazo') {
      const n = Math.round(Util.numero(e.target.value));
      const id = e.target.dataset.op;
      const plantio = (ctx.plano.grupos.find((g) => g.tipo === 'Sementes') || { operacoes: [] }).operacoes[0];
      const op = id === 'colheita' ? null : ctx.plano.grupos.flatMap((g) => g.operacoes).find((o) => o.id === id);
      if (n > 0) {
        if (id === 'colheita' && plantio) plantio.prazoColheita = n; else if (op) op.prazo = n;
        alterou();
      }
      redesenhar(null);
      return true;
    }
    return false;
  }

  return { desenhar, aoClicar, aoMudar, prazoDe };
})();
