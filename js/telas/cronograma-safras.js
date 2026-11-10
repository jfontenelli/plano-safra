/*
 * Plano de Safra › Planos › guia Cronograma de Safras (11/11/2026; antes a escala Ano do Calendário de Gestão da Lavoura).
 * O ano agrícola por Empresa › Fazenda › Safra/Safrinha (a tabela de js/telas/calendario-agricola.js), na última versão
 * publicada de cada plano. Filtros: os da página Planos (Ano agrícola com uma escolha só nesta guia, Atividade produtiva,
 * Safra, Cultura, Empresa, Fazenda) e Operação; a legenda dos grupos filtra um grupo por vez. Hoje e as setas trocam o
 * Ano agrícola (o filtro). As barras só informam (sem clique).
 * A página (js/telas/03-lista-planos.js) cuida dos filtros e chama desenhar/atualizar/ligar.
 */
window.Telas = window.Telas || {};

window.Telas.cronogramaSafras = (function () {
  const esc = Util.escapar;
  const Cal = () => Telas.calendario;
  // Grupos pelo tipo, na ordem da legenda (Corretivos, Plantio, Fertilidade, Defensivo, Colheita)
  const ORDEM_TIPO = ['aplicacao-de-insumos', 'sementes', 'fertilidade', 'defensivos', 'colheita'];
  const tipoDe = (g) => Util.normalizar(g.tipo || 'outro').replace(/\s+/g, '-');
  const posTipo = (t) => (ORDEM_TIPO.includes(t) ? ORDEM_TIPO.indexOf(t) : 99);
  const nomeOp = (it) => (it.colheita ? 'Colheita' : it.op.nome || 'Sem operação');
  // Grupo escolhido na legenda: 'todos' ou [tipo] (um por vez). Mantém-se ao navegar.
  const est = { grupo: 'todos' };
  let pagina = null; // { filtros, planos: () => os planos da guia, aoMudarAno: (ano) => … }

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
      const ctx = { plano: { grupos: Versoes.grupos(p, v) }, talhoes: Util.talhoesPlano(p, v), estado: { talhao: 'todos' } };
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

  // O painel da guia (escondido nas outras guias)
  function desenhar(visivel) {
    return `<div class="cs" data-guia-painel="cronograma" ${visivel ? '' : 'hidden'} data-cs></div>`;
  }

  function atualizar(conteudo) {
    const caixa = conteudo.querySelector('[data-cs]');
    if (!caixa || !pagina) return;
    const f = pagina.filtros;
    const ano = Array.isArray(f.ano) && f.ano.length === 1 ? f.ano[0] : anoAtual();
    const planos = comPublicada(pagina.planos());
    const { html, temHoje } = Telas.calendarioAgricola.tabela({
      planos,
      talhaoOk: () => true,
      opOk: (o) => Cal().marcado(est, 'grupo', tipoDe(o)) && Cal().marcado(f, 'operacao', o.tipo === 'Colheita' ? 'Colheita' : o.nome)
    });
    caixa.innerHTML = `
      <section class="cartao cs__barra" aria-label="Legenda e ano agrícola">
        ${legenda(grupos(planos), temHoje)}
        ${nav(ano)}
      </section>
      <div class="cs__ano">${html}</div>`;
  }

  // cfg: { filtros, planos, aoMudarAno(ano), aoMudarGrupo() }
  function ligar(conteudo, cfg) {
    pagina = cfg;
    const caixa = conteudo.querySelector('[data-cs]');
    caixa.addEventListener('click', (e) => {
      const g = e.target.closest('[data-cs-grupo]');
      if (g) {
        const v = g.dataset.csGrupo;
        const soEle = Array.isArray(est.grupo) && est.grupo.length === 1 && est.grupo[0] === v;
        est.grupo = !v || soEle ? 'todos' : [v];
        cfg.aoMudarGrupo();
        caixa.querySelector(v ? `[data-cs-grupo="${CSS.escape(v)}"]` : '.cal-leg')?.focus();
        return;
      }
      const a = e.target.closest('[data-cs-ano]');
      if (a && !a.disabled && a.dataset.csAno) {
        const foco = a.classList.contains('cal-nav__hoje') ? '.cal-nav__hoje' : `[aria-label="${a.getAttribute('aria-label')}"]:not(:disabled)`;
        cfg.aoMudarAno(a.dataset.csAno);
        caixa.querySelector(foco)?.focus();
        return;
      }
      // Abrir/fechar empresa e fazenda
      Telas.calendarioAgricola.aoClicar(e, (foco) => { atualizar(conteudo); if (foco) caixa.querySelector(foco)?.focus(); });
    });
  }

  return { desenhar, atualizar, ligar, opcoesOperacao, anoAtual };
})();
