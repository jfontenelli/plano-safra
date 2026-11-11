/*
 * Plano de Safra › Cronograma de Safras: item do menu logo abaixo de Planos (11/11/2026; antes guia da página Planos e,
 * antes ainda, a escala Ano do Calendário de Gestão da Lavoura).
 * O ano agrícola por Empresa › Fazenda › Safra/Safrinha (a tabela de js/telas/calendario-agricola.js), na última versão
 * publicada de cada plano. Filtros próprios da página (não mudam a lista de Planos): Ano agrícola com uma escolha só,
 * Atividade produtiva, Safra, Cultura, Empresa, Fazenda e Operação; a legenda dos grupos filtra um grupo por vez. Hoje e
 * as setas trocam o Ano agrícola (o filtro). As barras só informam (sem clique).
 * Ao chegar de outra página, os filtros voltam ao começo: só o Ano agrícola (o das outras páginas, se tiver plano
 * publicado; senão o de hoje ou o mais recente), como na página Planos.
 */
window.Telas = window.Telas || {};

window.Telas.cronogramaSafras = (function () {
  const esc = Util.escapar;
  const Cal = () => Telas.calendario;
  // Grupos pelo tipo, na ordem da legenda e das faixas (Preparo do solo, Corretivos, Plantio, Fertilidade, Defensivo, Colheita)
  const ORDEM_TIPO = ['operacao-de-campo', 'aplicacao-de-insumos', 'sementes', 'fertilidade', 'defensivos', 'colheita'];
  const tipoDe = (g) => Util.normalizar(g.tipo || 'outro').replace(/\s+/g, '-');
  const posTipo = (t) => (ORDEM_TIPO.includes(t) ? ORDEM_TIPO.indexOf(t) : 99);
  const nomeOp = (it) => (it.colheita ? 'Colheita' : it.op.nome || 'Sem operação');
  // Grupo escolhido na legenda: 'todos' ou [tipo] (um por vez). Mantém-se ao navegar.
  const est = { grupo: 'todos' };

  const comPublicada = (planos) => planos.filter((p) => Versoes.publicadaComPlanejamento(p));
  const anos = () => Util.anosAgricolas(comPublicada(DADOS.planos));
  const anoDe = (iso) => { const [a, m] = iso.split('-').map(Number); return String(m >= 9 ? a : a - 1); };
  // Ano agrícola de hoje (ou, sem plano publicado nele, o mais recente)
  const anoAtual = () => { const lista = anos(); const h = anoDe(Cal().hojeIso()); return lista.includes(h) ? h : Util.anoAgricolaMaisRecente(lista); };

  // Operações planejadas dos planos (para a legenda e o filtro Operação)
  function itens(planos) {
    const saida = [];
    comPublicada(planos).forEach((p) => {
      const v = Versoes.ultimaPublicada(p);
      const ctx = { plano: { grupos: Versoes.grupos(p, v), fazenda: p.fazenda }, talhoes: Util.talhoesPlano(p, v), estado: { talhao: 'todos' } };
      Cal().itens(ctx).filter((it) => (it.colheita ? !it.aguardando : it.talhoes.length > 0)).forEach((it) => saida.push(it));
    });
    return saida;
  }
  function grupos(planos) {
    const mapa = new Map();
    itens(planos).forEach((it) => { const t = tipoDe(it.grupo); if (!mapa.has(t)) mapa.set(t, it.grupo.nome); });
    return [...mapa.entries()].map(([valor, nome]) => ({ valor, nome })).sort((a, b) => posTipo(a.valor) - posTipo(b.valor));
  }
  // Opções do filtro Operação: as dos grupos à mostra na legenda, pelo nome, na ordem da legenda e do plano
  function opcoesOperacao(planos) {
    const vistos = new Map();
    itens(planos).filter((it) => Cal().marcado(est, 'grupo', tipoDe(it.grupo))).forEach((it, i) => {
      const nome = nomeOp(it);
      if (!vistos.has(nome)) vistos.set(nome, { valor: nome, nome, extra: it.grupo.nome, pos: posTipo(tipoDe(it.grupo)), i });
    });
    return [...vistos.values()].sort((a, b) => a.pos - b.pos || a.i - b.i);
  }

  // Legenda que filtra (como no Ano do Calendário): um grupo por vez; clicar de novo, ou em Mostrar todos, volta a todos
  function legenda(lista, temHoje) {
    const todos = lista.every((o) => Cal().marcado(est, 'grupo', o.valor));
    return `
      <div class="cal-legenda" role="group" aria-label="Filtrar por grupo de operação">
        ${lista.map((o) => {
          const ligado = Cal().marcado(est, 'grupo', o.valor);
          return `
            <button class="cal-leg ${ligado ? '' : 'cal-leg--desligado'}" type="button" data-cs-grupo="${esc(o.valor)}" aria-pressed="${ligado && !todos}"
                    title="${ligado && !todos ? 'Mostrar todos' : `Mostrar só ${esc(o.nome)}`}">
              <span class="cal-ponto cal-ponto--${esc(o.valor)}"></span>${esc(o.nome)}</button>`;
        }).join('')}
        ${todos ? '' : '<button class="link-acao cal-legenda__todos" type="button" data-cs-grupo="">Mostrar todos</button>'}
        ${temHoje ? '<span class="os-cal__hoje"><span class="cag__cor cag__cor--hoje" aria-hidden="true"></span>Hoje</span>' : ''}
      </div>`;
  }

  // Hoje · ‹ › · o ano: trocam o filtro Ano agrícola (entre os anos com plano publicado)
  function nav(ano) {
    const lista = anos();
    const i = lista.indexOf(ano);
    return `
      <div class="cal-nav">
        <button class="botao botao--secundario botao--p cal-nav__hoje" type="button" data-cs-ano="${esc(anoAtual())}" title="Ir para o ano agrícola de hoje">Hoje</button>
        <button class="botao-icone cal-nav__seta" type="button" data-cs-ano="${esc(lista[i - 1] || '')}" aria-label="Ano agrícola anterior" title="Ano agrícola anterior" ${i <= 0 ? 'disabled' : ''}>${Icones.anterior}</button>
        <button class="botao-icone cal-nav__seta" type="button" data-cs-ano="${esc(lista[i + 1] || '')}" aria-label="Próximo ano agrícola" title="Próximo ano agrícola" ${i < 0 || i >= lista.length - 1 ? 'disabled' : ''}>${Icones.proxima}</button>
        <span class="cal-nav__titulo" title="Ano agrícola ${esc(ano)}" aria-live="polite">${esc(ano)}</span>
      </div>`;
  }

  // ----- Filtros da página (próprios: a página Planos tem os dela) -----
  const filtros = { operacao: 'todos', busca: {}, filtroAberto: null };
  const BASE = [
    ['ano', 'Ano agrícola', ['Todos', 'Nenhum', 'anos'], 104],
    ['atividade', 'Atividade produtiva', ['Todas', 'Nenhuma', 'atividades'], 140],
    ['safra', 'Safra', ['Todas', 'Nenhuma', 'safras'], 92],
    ['cultura', 'Cultura', ['Todas', 'Nenhuma', 'culturas'], 104],
    ['empresa', 'Empresa', ['Todas', 'Nenhuma', 'empresas'], 124],
    ['fazenda', 'Fazenda', ['Todas', 'Nenhuma', 'fazendas'], 124],
    ['operacao', 'Operação', ['Todas', 'Nenhuma', 'operações'], 124]
  ];
  const DEPENDE = { safra: ['ano', 'atividade'], cultura: ['ano', 'atividade'], fazenda: ['empresa'] };
  const marcado = (chave, valor) => Cal().marcado(filtros, chave, valor);
  const valorDe = (p, campo) => (campo === 'ano' ? String(Util.anoAgricola(p.safra)) : p[campo]);
  const passa = (p) => FiltrosBase.CHAVES.every((c) => marcado(c, valorDe(p, c)));
  const planosPara = (chave) => DADOS.planos.filter((p) => (DEPENDE[chave] || []).every((c) => marcado(c, valorDe(p, c))));
  const comoOpcoes = (lista) => lista.map((x) => ({ valor: x, nome: x }));
  // Opções de cada filtro: só os valores que aparecem nos planos (na ordem do cadastro); Ano agrícola: os anos com
  // plano publicado (os que a tabela mostra)
  function opcoes(chave) {
    if (chave === 'ano') return comoOpcoes([...anos()].reverse());
    if (chave === 'operacao') return opcoesOperacao(DADOS.planos.filter(passa));
    const naLista = new Set(planosPara(chave).map((p) => valorDe(p, chave)));
    if (chave === 'safra') return comoOpcoes(Util.ordenarSafras([...naLista]));
    // Empresa e Fazenda: também as fazendas de cada empresa (como na página Planos)
    const porEmpresa = DADOS.fazendasPorEmpresa || {};
    if (chave === 'empresa') Object.keys(porEmpresa).forEach((e) => naLista.add(e));
    if (chave === 'fazenda') Object.entries(porEmpresa).forEach(([e, fs]) => { if (marcado('empresa', e)) fs.forEach((x) => naLista.add(x)); });
    const cadastro = { atividade: DADOS.atividades, cultura: DADOS.culturasPlanos, empresa: DADOS.empresas, fazenda: DADOS.fazendas }[chave];
    return comoOpcoes(cadastro.filter((x) => naLista.has(x)));
  }
  const barra = BarraFiltros.criar({
    id: 'cs',
    estado: () => filtros,
    campos: () => BASE,
    mais: () => [],
    unicos: () => ['ano'],
    opcoes,
    depende: DEPENDE,
    padrao: () => ({ operacao: 'todos' }),
    aoMudar: () => atualizar(document.getElementById('conteudo'))
  });

  // Chegada de outra página: os filtros voltam ao começo. Este arquivo carrega antes do app.js, então o aviso de
  // troca de endereço chega antes do desenho da tela.
  let entrou = true;
  window.addEventListener('hashchange', (e) => {
    if (new URL(e.oldURL).hash !== new URL(e.newURL).hash) entrou = true;
  });
  // Um ano agrícola por vez: o marcado (se tiver plano publicado); senão o de hoje ou o mais recente
  function anoValido() {
    const lista = anos();
    const marcados = Array.isArray(filtros.ano) ? filtros.ano.filter((a) => lista.includes(a)) : [];
    filtros.ano = [marcados.length && !marcados.includes(anoAtual()) ? marcados[0] : anoAtual()];
  }

  function desenhar() {
    if (entrou) {
      FiltrosBase.ler(filtros);
      Object.assign(filtros, { atividade: 'todos', safra: 'todos', cultura: 'todos', empresa: 'todos', fazenda: 'todos',
        operacao: 'todos', busca: {}, filtroAberto: null });
      entrou = false;
    }
    anoValido();
    return `
      <header class="cabecalho vg-cabecalho">
        <!-- Fundo do campo no topo: só aparece no modo escuro (como em Planos) -->
        <span class="vg-cabecalho__fundo" style="background-image: url('img/fundo-plano-safra.jpg')" aria-hidden="true"></span>
        <div class="vg-cabecalho__titulo">
          <h1 class="cabecalho__titulo">Cronograma de Safras</h1>
          <!-- 11/11/2026: no lugar da etiqueta "Últimas versões" -->
          <p class="cabecalho__subtitulo">Consulte o cronograma dos planos de safras atualizados</p>
        </div>
      </header>
      <div class="pagina cs-pagina">
        <section class="cartao filtros" aria-label="Filtrar o cronograma" data-cs-filtros></section>
        <div class="cs" data-cs></div>
      </div>`;
  }

  function atualizar(conteudo) {
    const caixa = conteudo.querySelector('[data-cs]');
    if (!caixa) return;
    const ano = Array.isArray(filtros.ano) && filtros.ano.length === 1 ? filtros.ano[0] : anoAtual();
    const planos = comPublicada(DADOS.planos.filter(passa));
    const { html, temHoje } = Telas.calendarioAgricola.tabela({
      planos,
      talhaoOk: () => true,
      opOk: (o) => Cal().marcado(est, 'grupo', tipoDe(o)) && marcado('operacao', o.tipo === 'Colheita' ? 'Colheita' : o.nome)
    });
    caixa.innerHTML = `
      <section class="cartao cs__barra" aria-label="Legenda e ano agrícola">
        ${legenda(grupos(planos), temHoje)}
        ${nav(ano)}
      </section>
      <div class="cs__ano">${html}</div>`;
  }

  function aoMostrar(conteudo) {
    barra.ligar(conteudo.querySelector('[data-cs-filtros]'));
    atualizar(conteudo);
    const caixa = conteudo.querySelector('[data-cs]');
    caixa.addEventListener('click', (e) => {
      // Legenda: um grupo por vez (muda as opções do filtro Operação)
      const g = e.target.closest('[data-cs-grupo]');
      if (g) {
        const v = g.dataset.csGrupo;
        const soEle = Array.isArray(est.grupo) && est.grupo.length === 1 && est.grupo[0] === v;
        est.grupo = !v || soEle ? 'todos' : [v];
        barra.redesenhar();
        atualizar(conteudo);
        caixa.querySelector(v ? `[data-cs-grupo="${CSS.escape(v)}"]` : '.cal-leg')?.focus();
        return;
      }
      // Hoje e as setas: trocam o filtro Ano agrícola
      const a = e.target.closest('[data-cs-ano]');
      if (a && !a.disabled && a.dataset.csAno) {
        const foco = a.classList.contains('cal-nav__hoje') ? '.cal-nav__hoje' : `[aria-label="${a.getAttribute('aria-label')}"]:not(:disabled)`;
        filtros.ano = [a.dataset.csAno];
        FiltrosBase.gravar(filtros, ['ano']);
        barra.redesenhar();
        atualizar(conteudo);
        caixa.querySelector(foco)?.focus();
        return;
      }
      // Abrir/fechar empresa e fazenda
      Telas.calendarioAgricola.aoClicar(e, (foco) => { atualizar(conteudo); if (foco) caixa.querySelector(foco)?.focus(); });
    });
  }

  return { desenhar, aoMostrar };
})();
