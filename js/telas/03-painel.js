/*
 * Tela 03 — Visão Geral, guia Planos de Safra (docs/telas/03-lista-planos.md)
 * Planos de Safra no ano agrícola escolhido, com os mesmos filtros das outras guias: uma linha por plano (Não
 * iniciado, Em construção ou Publicado), na versão de trabalho (a em construção ou, sem ela, a última publicada).
 * Sem plano nos filtros: no lugar da tabela, "Nenhum Plano de Safra cadastrado" com o link + Criar Plano Safra.
 */
window.Telas = window.Telas || {};

window.Telas.painelPlanos = (function () {
  const esc = Util.escapar;
  // Safra pelo nome ("27/27", os dois anos iguais, é safrinha); no plano, o ciclo informado ou o do nome
  const cicloDoNome = (safra) => { const [a, b] = String(safra).split('/'); return a === b ? 'Safrinha' : 'Safra'; };
  const cicloDe = (p) => p.ciclo || cicloDoNome(p.safra);

  // Safras cadastradas e as dos planos, sem repetir
  function safras() {
    return [...new Set([...(DADOS.cadastroSafras || []).map((s) => s.nome), ...DADOS.safras, ...DADOS.planos.map((p) => p.safra)])];
  }
  // Anos agrícolas das safras cadastradas e dos planos, do mais antigo ao mais recente ("2026")
  function anos() {
    return [...new Set(safras().map((s) => Util.anoAgricola(s)).filter(Boolean).map(String))].sort();
  }
  const ha = (n) => Math.round(n).toLocaleString('pt-BR');

  function statusDe(p) {
    return Versoes.aIniciar(p) ? 'nao-iniciado' : Versoes.deTrabalho(p).status;
  }

  // Planos do ano agrícola (em "Todas", de todos os anos), com os filtros. Ordem padrão: status (Não iniciado,
  // Em construção, Publicado) e, no mesmo status, Safra, Empresa, Fazenda e Cultura em ordem alfabética
  function linhas(f) {
    const texto = (a, b) => String(a || '').localeCompare(String(b || ''), 'pt-BR');
    return DADOS.planos
      .filter((p) => !f.anoAgricola || String(Util.anoAgricola(p.safra)) === f.anoAgricola)
      .map((p) => ({ plano: p, empresa: p.empresa, fazenda: p.fazenda, ciclo: cicloDe(p), safra: p.safra, cultura: p.cultura, atividade: p.atividade }))
      .filter((l) => (!f.ciclo || l.ciclo === f.ciclo) && (!f.empresa || l.empresa === f.empresa) && (!f.fazenda || l.fazenda === f.fazenda)
        && (!f.atividade || l.atividade === f.atividade) && (!f.cultura || l.cultura === f.cultura))
      .map((l) => ({ ...l, status: statusDe(l.plano), area: Util.areaCultivo(l.plano, Versoes.deTrabalho(l.plano)) }))
      .sort((a, b) => ORDEM_STATUS.indexOf(a.status) - ORDEM_STATUS.indexOf(b.status)
        || texto(`${a.ciclo} ${a.safra}`, `${b.ciclo} ${b.safra}`) || texto(a.empresa, b.empresa)
        || texto(a.fazenda, b.fazenda) || texto(a.cultura, b.cultura));
  }

  // Safras do ano agrícola para o modal Criar Plano (link do aviso sem plano). Já escolhida quando o filtro Safra
  // diz qual (Safra ou Safrinha) e só há uma dela no ano.
  function safrasDoAno(f) {
    if (!f.anoAgricola) return {};
    const lista = safras().filter((s) => String(Util.anoAgricola(s)) === f.anoAgricola)
      .sort((a, b) => (cicloDoNome(a) === 'Safrinha') - (cicloDoNome(b) === 'Safrinha') || a.localeCompare(b));
    const doCiclo = f.ciclo ? lista.filter((s) => cicloDoNome(s) === f.ciclo) : [];
    return { safras: lista, safra: doCiclo.length === 1 ? doCiclo[0] : '' };
  }

  // Valores que os filtros Empresa e Fazenda oferecem além dos planos (as fazendas de cada empresa, mesmo sem plano)
  function empresasEFazendas() {
    const pares = Object.entries(DADOS.fazendasPorEmpresa || {});
    return { empresas: pares.map(([e]) => e), fazendas: pares.flatMap(([, fs]) => fs) };
  }

  // ----- Desenho -----
  function desenhar() {
    return `
      <div class="painel" data-guia-painel="painel">
        <section class="cartao lista-planos" aria-labelledby="pn-titulo-planos">
          <div class="secao__topo lista-planos__topo">
            <h2 class="secao__titulo lista-planos__titulo" id="pn-titulo-planos">${Icones.documento} Planos de Safra</h2>
          </div>
          <div class="tabela-rolagem" data-pn="tabela">
            <table class="tabela painel-tabela">
              <thead data-pn="cabecalho"></thead>
              <tbody data-pn="linhas"></tbody>
            </table>
          </div>
          <div class="painel-vazio" data-pn="vazio" hidden>
            <p class="painel-vazio__titulo">Nenhum Plano de Safra cadastrado</p>
            <p class="painel-vazio__texto">Clique em <button class="link-acao painel-vazio__link" type="button" data-pn-criar>+ Criar Plano Safra</button> para começar seu planejamento.</p>
          </div>
        </section>
      </div>`;
  }

  function atualizar(conteudo, filtros) {
    const raiz = conteudo.querySelector('[data-guia-painel="painel"]');
    if (!raiz) return;
    ultimo = { conteudo, filtros };
    const planos = linhas(filtros);
    // Sem plano nos filtros: o aviso no lugar da tabela
    raiz.querySelector('[data-pn="tabela"]').hidden = !planos.length;
    raiz.querySelector('[data-pn="vazio"]').hidden = !!planos.length;
    raiz.querySelector('[data-pn="cabecalho"]').innerHTML = cabecalho();
    raiz.querySelector('[data-pn="linhas"]').innerHTML = ordenadas(planos).map(linha).join('');
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

  // ----- Planos de Safra -----
  const STATUS = {
    'nao-iniciado': ['Não iniciado', 'status--nao-iniciado'],
    construcao: ['Em construção', 'status--construcao'],
    publicada: ['Publicado', 'status--aprovado']
  };

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
      // Link do aviso sem plano: o modal já com as safras do Ano Agrícola e a Empresa e a Fazenda do filtro (só a
      // fazenda: a empresa dela)
      if (e.target.closest('[data-pn-criar]')) {
        const { empresa, fazenda } = ultimo.filtros;
        const daFazenda = fazenda && Object.keys(DADOS.fazendasPorEmpresa || {}).find((x) => DADOS.fazendasPorEmpresa[x].includes(fazenda));
        Telas.criarPlano({ ...safrasDoAno(ultimo.filtros), empresa: empresa || daFazenda || '', fazenda: fazenda || '' });
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
