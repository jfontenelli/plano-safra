/*
 * Tela 03 — Visão Geral, guia Planos de Safra (docs/telas/03-lista-planos.md)
 * Acompanha o planejamento no ano agrícola escolhido, com os mesmos filtros das outras guias:
 * Planejamento das Fazendas (Sem plano, Em construção, Publicado) e Planos de Safra (uma linha por plano, Em construção
 * ou Publicado; a fazenda sem plano só conta nos quadros).
 *
 * Quem entra na conta (uma linha por fazenda e safra):
 *  - Cada safra ou safrinha cadastrada (DADOS.cadastroSafras e as criadas no modal, em DADOS.safras), mesmo sem
 *    nenhum plano: todas as fazendas de todas as empresas (DADOS.fazendasPorEmpresa) podem ter plano nela; a
 *    fazenda sem plano aparece como "Sem plano".
 * Os planos usam a versão de trabalho (a em construção ou, sem ela, a última publicada), como a lista.
 */
window.Telas = window.Telas || {};

window.Telas.painelPlanos = (function () {
  const esc = Util.escapar;
  const cicloDe = (p) => p.ciclo || 'Safra';
  // Safra sem plano: pelo nome ("27/27", os dois anos iguais, é safrinha)
  const cicloDoNome = (safra) => { const [a, b] = String(safra).split('/'); return a === b ? 'Safrinha' : 'Safra'; };

  // Safras cadastradas e as dos planos, sem repetir
  function safras() {
    return [...new Set([...(DADOS.cadastroSafras || []).map((s) => s.nome), ...DADOS.safras, ...DADOS.planos.map((p) => p.safra)])];
  }
  // Anos agrícolas das safras cadastradas e dos planos, do mais antigo ao mais recente ("2026")
  function anos() {
    return [...new Set(safras().map((s) => Util.anoAgricola(s)).filter(Boolean).map(String))].sort();
  }
  // Grupos de operação do Detalhamento (a Colheita vem do plantio e não entra)
  const GRUPOS = [['Sementes', 'Sementes'], ['Fertilidade', 'Fertilidade'], ['Defensivos', 'Defensivos']];
  const media = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const pct = (n) => `${Math.round(n)}%`;
  const ha = (n) => Math.round(n).toLocaleString('pt-BR');

  // ----- Cálculos -----
  // % de um grupo, por área: em cada operação, a área dos talhões com recomendação completa (produto e dose; no
  // Sementes, variedade e data de plantio) ÷ área de cultivo; o grupo é a média das operações. Sem o grupo: null.
  function pctGrupo(p, v, tipo) {
    const ops = Versoes.grupos(p, v).filter((g) => g.tipo === tipo).flatMap((g) => g.operacoes);
    if (!ops.length) return null;
    const talhoes = Util.talhoesPlano(p, v);
    const total = talhoes.reduce((s, t) => s + t.area, 0);
    if (!total) return 0;
    const pronto = (op, t) => (tipo === 'Sementes'
      ? !!(op.plantio && op.plantio[t] && op.plantio[t].variedade && op.plantio[t].data)
      : Planos.statusTalhao(op, t) === 'Completo');
    return media(ops.map((op) => talhoes.filter((t) => pronto(op, t.nome)).reduce((s, t) => s + t.area, 0) / total * 100));
  }

  function statusDe(p) {
    if (!p) return 'sem';
    return Versoes.aIniciar(p) ? 'nao-iniciado' : Versoes.deTrabalho(p).status;
  }

  // Linhas do painel no ano agrícola (em "Todas", em cada ano agrícola), com os filtros. Fazenda sem plano passa
  // pelos filtros de Atividade e Cultura (ainda não tem nenhuma das duas).
  function linhas(f) {
    const doAno = DADOS.planos.filter((p) => !f.anoAgricola || String(Util.anoAgricola(p.safra)) === f.anoAgricola);
    const lista = doAno.map((p) => ({ plano: p, empresa: p.empresa, fazenda: p.fazenda, ciclo: cicloDe(p), safra: p.safra, cultura: p.cultura, atividade: p.atividade }));
    // Cada safra ou safrinha cadastrada no ano agrícola: as fazendas sem plano nela entram como "Sem plano".
    // Um plano por safra e fazenda: a fazenda já com plano nela (de qualquer empresa) não entra de novo.
    safras().filter((s) => !f.anoAgricola || String(Util.anoAgricola(s)) === f.anoAgricola).forEach((safra) => {
      const daSafra = doAno.filter((p) => p.safra === safra);
      const ciclo = daSafra.length ? cicloDe(daSafra[0]) : cicloDoNome(safra);
      Object.entries(DADOS.fazendasPorEmpresa || {}).forEach(([empresa, fazendas]) => fazendas.forEach((fazenda) => {
        if (!daSafra.some((p) => p.fazenda === fazenda)) lista.push({ plano: null, empresa, fazenda, ciclo, safra });
      }));
    });
    const ordemEmpresa = (e) => { const i = DADOS.empresas.indexOf(e); return i < 0 ? 99 : i; };
    return lista
      .filter((l) => (!f.ciclo || l.ciclo === f.ciclo) && (!f.empresa || l.empresa === f.empresa) && (!f.fazenda || l.fazenda === f.fazenda)
        && (!l.plano || ((!f.atividade || l.atividade === f.atividade) && (!f.cultura || l.cultura === f.cultura))))
      .map((l) => {
        const v = l.plano && Versoes.deTrabalho(l.plano);
        const grupos = GRUPOS.map(([tipo]) => (l.plano && !Versoes.aIniciar(l.plano) ? pctGrupo(l.plano, v, tipo) : null));
        return { ...l, status: statusDe(l.plano), grupos,
          area: l.plano ? Util.areaCultivo(l.plano, v) : null };
      })
      .sort((a, b) => ordemEmpresa(a.empresa) - ordemEmpresa(b.empresa) || a.fazenda.localeCompare(b.fazenda, 'pt-BR')
        || (a.ciclo === 'Safrinha') - (b.ciclo === 'Safrinha') || String(a.cultura || '').localeCompare(String(b.cultura || ''), 'pt-BR'));
  }

  // Valores que os filtros Empresa e Fazenda oferecem além dos planos (as fazendas de cada empresa)
  function empresasEFazendas() {
    const pares = Object.entries(DADOS.fazendasPorEmpresa || {});
    return { empresas: pares.map(([e]) => e), fazendas: pares.flatMap(([, fs]) => fs) };
  }

  // ----- Desenho -----
  function desenhar() {
    return `
      <div class="painel" data-guia-painel="painel">
        <section class="painel-kpis" aria-label="Planejamento das Fazendas" data-pn="kpis"></section>

        <section class="cartao lista-planos" aria-labelledby="pn-titulo-planos">
          <div class="secao__topo lista-planos__topo">
            <h2 class="secao__titulo lista-planos__titulo" id="pn-titulo-planos">${Icones.documento} Planos de Safra</h2>
          </div>
          <div class="tabela-rolagem">
            <table class="tabela painel-tabela">
              <thead data-pn="cabecalho"></thead>
              <tbody data-pn="linhas"></tbody>
            </table>
          </div>
        </section>
      </div>`;
  }

  function atualizar(conteudo, filtros) {
    const raiz = conteudo.querySelector('[data-guia-painel="painel"]');
    if (!raiz) return;
    ultimo = { conteudo, filtros };
    const ls = linhas(filtros);
    raiz.querySelector('[data-pn="kpis"]').innerHTML = kpis(ls);
    raiz.querySelector('[data-pn="cabecalho"]').innerHTML = cabecalho();
    // A tabela mostra só os planos (Em construção, incluindo Não iniciado, e Publicado); a fazenda sem plano só conta nos quadros
    const planos = ls.filter((l) => l.plano);
    raiz.querySelector('[data-pn="linhas"]').innerHTML = planos.length ? ordenadas(planos).map(linha).join('')
      : '<tr><td class="tabela__vazia" colspan="10">Nenhum plano com esses filtros.</td></tr>';
  }

  // ----- Ordenar por coluna -----
  // Pela seta do título: 1º clique crescente, 2º decrescente (como na tabela do Plantio). Sem escolha, a ordem
  // padrão (empresa, fazenda, safra antes da safrinha, cultura). Vazios ("—") ficam sempre no fim.
  let ordem = null; // { coluna, sentido: 'asc' | 'desc' }
  let ultimo = null; // { conteudo, filtros } do último desenho, para redesenhar ao ordenar
  const ORDEM_STATUS = ['nao-iniciado', 'construcao', 'publicada'];
  const COLUNAS = [
    ['empresa', 'Empresa', (l) => l.empresa],
    ['fazenda', 'Fazenda', (l) => l.fazenda],
    ['safra', 'Safra', (l) => `${l.safra} ${l.ciclo}`],
    ['cultura', 'Cultura', (l) => l.cultura || null],
    ['area', 'Área (ha)', (l) => l.area || null, 'tabela__numero', 'Área de cultivo: talhões incluídos no plano'],
    ...GRUPOS.map(([tipo, rotulo], i) => [`g${i}`, rotulo, (l) => l.grupos[i], '', rotulo !== tipo ? tipo : '']),
    ['status', 'Status', (l) => ORDEM_STATUS.indexOf(l.status)]
  ];

  function ordenadas(ls) {
    if (!ordem) return ls;
    const valor = COLUNAS.find(([c]) => c === ordem.coluna)[2];
    const sinal = ordem.sentido === 'asc' ? 1 : -1;
    return [...ls].sort((a, b) => {
      const va = valor(a); const vb = valor(b);
      if (va === null || va === undefined) return vb === null || vb === undefined ? 0 : 1;
      if (vb === null || vb === undefined) return -1;
      return sinal * (typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR'));
    });
  }

  function cabecalho() {
    return `<tr>${COLUNAS.map(([coluna, rotulo, , classe = '', dica = '']) => {
      const ativa = ordem && ordem.coluna === coluna;
      const sentido = ativa ? ordem.sentido : null;
      return `
        <th class="${classe}" ${dica ? `title="${esc(dica)}"` : ''} ${ativa ? `aria-sort="${sentido === 'asc' ? 'ascending' : 'descending'}"` : ''}>
          <span class="titulo-coluna"><span>${rotulo}</span>
            <button class="titulo-ordenar ${ativa ? 'titulo-ordenar--ativo' : ''} ${sentido === 'desc' ? 'titulo-ordenar--desc' : ''}" type="button"
                    data-pn-ordenar="${coluna}" title="Ordenar por ${rotulo.toLowerCase()}"
                    aria-label="Ordenar por ${rotulo.toLowerCase()}${ativa ? (sentido === 'asc' ? ', crescente' : ', decrescente') : ''}">${ativa ? Icones.acima : Icones.ordenar}</button>
          </span>
        </th>`;
    }).join('')}<th class="lista-planos__menu">Ações</th></tr>`;
  }

  // ----- Planejamento das Fazendas -----
  const REGRA_CONTAGEM = 'Cada fazenda conta uma vez por safra e uma vez por safrinha. Cadastrada a safra ou a safrinha, todas as fazendas de todas as empresas passam a contar; quem ainda não tem plano nela aparece como Sem plano.';
  function kpis(ls) {
    const total = ls.length;
    const conta = (sts) => ls.filter((l) => sts.includes(l.status)).length;
    const cartoes = [
      ['sem', 'Sem plano', conta(['sem']), Icones.documento],
      ['construcao', 'Em construção', conta(['construcao', 'nao-iniciado']), Icones.engrenagem],
      ['publicada', 'Publicado', conta(['publicada']), Icones.certo]
    ];
    return cartoes.map(([chave, rotulo, n, icone]) => {
      const p = total ? n / total * 100 : 0;
      return `
        <div class="painel-kpi painel-kpi--${chave}">
          <span class="painel-kpi__icone" aria-hidden="true">${icone}</span>
          <div class="painel-kpi__corpo">
            <span class="painel-kpi__rotulo">${rotulo}
              <span class="painel-info" tabindex="0" title="${esc(REGRA_CONTAGEM)}" aria-label="Como as fazendas são contadas">${Icones.info}</span></span>
            <strong class="painel-kpi__numero">${n} de ${total}</strong>
            <span class="painel-kpi__barra" aria-hidden="true"><span style="width: ${p.toFixed(1)}%"></span></span>
            <span class="painel-kpi__texto"><strong>${pct(p)}</strong> das fazendas</span>
          </div>
        </div>`;
    }).join('');
  }

  // ----- Planos de Safra -----
  const STATUS = {
    'nao-iniciado': ['Não iniciado', 'status--nao-iniciado'],
    construcao: ['Em construção', 'status--construcao'],
    publicada: ['Publicado', 'status--aprovado']
  };

  function celulaGrupo(valor) {
    if (valor === null) return '<td class="painel-tabela__vazio">—</td>';
    return `<td><span class="painel-progresso"><span class="painel-progresso__barra" aria-hidden="true"><span style="width: ${valor.toFixed(1)}%"></span></span>${pct(valor)}</span></td>`;
  }

  function linha(l) {
    const [rotulo, classe] = STATUS[l.status];
    const p = l.plano;
    return `
      <tr class="lista-planos__linha" data-plano="${p.id}" tabindex="0" title="Abrir o plano"
          aria-label="Abrir plano ${esc(p.safra)} · ${esc(p.fazenda)} · ${esc(p.cultura)}">
        <td>${esc(l.empresa)}</td>
        <td>${esc(l.fazenda)}</td>
        <td>${esc(l.ciclo)} ${esc(l.safra)}</td>
        <td>${esc(p.cultura)}</td>
        <td class="tabela__numero">${l.area ? ha(l.area) : '<span class="painel-tabela__vazio">—</span>'}</td>
        ${l.grupos.map(celulaGrupo).join('')}
        <td><span class="status ${classe}">${rotulo}</span></td>
        <td class="lista-planos__menu">
          <button class="botao-icone" type="button" data-menu-plano="${p.id}" title="Mais ações"
                  aria-haspopup="menu" aria-label="Mais ações · ${esc(l.fazenda)}, ${esc(l.ciclo)} ${esc(l.safra)}">${Icones.mais_opcoes}</button>
        </td>
      </tr>`;
  }

  // Eventos da guia. acoes: { abrirPlano(p), abrirMenuPlano(id, ancora, x, y, alinharDireita) }
  function ligar(conteudo, acoes) {
    const raiz = conteudo.querySelector('[data-guia-painel="painel"]');
    raiz.addEventListener('click', (e) => {
      const seta = e.target.closest('[data-pn-ordenar]');
      if (seta) {
        const c = seta.dataset.pnOrdenar;
        ordem = { coluna: c, sentido: ordem && ordem.coluna === c && ordem.sentido === 'asc' ? 'desc' : 'asc' };
        atualizar(ultimo.conteudo, ultimo.filtros);
        raiz.querySelector(`[data-pn-ordenar="${c}"]`).focus();
        return;
      }
      const menuPlano = e.target.closest('[data-menu-plano]');
      if (menuPlano) {
        const caixa = menuPlano.getBoundingClientRect();
        acoes.abrirMenuPlano(Number(menuPlano.dataset.menuPlano), menuPlano, caixa.right, caixa.bottom + 4, true);
        return;
      }
      const tr = e.target.closest('tr[data-plano]');
      if (tr) acoes.abrirPlano(DADOS.planos.find((x) => x.id === Number(tr.dataset.plano)));
    });
    // Botão direito na linha do plano: o mesmo menu do ⋯
    raiz.addEventListener('contextmenu', (e) => {
      const tr = e.target.closest('tr[data-plano]');
      if (!tr || e.target.closest('a, button')) return;
      e.preventDefault();
      acoes.abrirMenuPlano(Number(tr.dataset.plano), e.target, e.clientX, e.clientY);
    });
    raiz.addEventListener('keydown', (e) => {
      const tr = e.target.closest('tr[data-plano]');
      if (tr && e.target === tr && e.key === 'Enter') acoes.abrirPlano(DADOS.planos.find((x) => x.id === Number(tr.dataset.plano)));
    });
  }

  return { desenhar, atualizar, ligar, empresasEFazendas, cicloDe, anos };
})();
