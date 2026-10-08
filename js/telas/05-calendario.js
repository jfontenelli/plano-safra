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
        dap: null, fenologia: 'Colheita', prazo: prazoColheita, talhoes: [], area: 0, produtos: [], variedades: null });
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
              const dap = it.aguardando ? 'pelo ciclo' : it.colheita && it.dapMax !== it.dap ? `${it.dap} a ${it.dapMax}` : it.dap ?? '—';
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
        const opColheita = (ctx.plano.grupos.find((g) => g.tipo === 'Colheita') || { operacoes: [] }).operacoes[0];
        if (id === 'colheita' && opColheita) opColheita.prazo = n;
        else if (id === 'colheita' && plantio) plantio.prazoColheita = n; else if (op) op.prazo = n;
        alterou();
      }
      redesenhar(null);
      return true;
    }
    return false;
  }

  return { desenhar, aoClicar, aoMudar, prazoDe };
})();
