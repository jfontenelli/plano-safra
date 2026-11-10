/*
 * Filtros padronizados (04/11/2026), no modelo da Planejado × Executado (que tem o código próprio, com o mesmo visual).
 *
 * FiltrosBase: os seis filtros-base (Ano agrícola, Atividade produtiva, Safra, Cultura, Empresa e Fazenda), os mesmos em
 * todas as páginas. As escolhas acompanham o usuário entre as páginas (cada página só aproveita as que continuam
 * valendo para ela). Abrem, e o Limpar filtros de qualquer página volta, no ano agrícola e na safra atuais, com o resto
 * em Todas.
 *
 * BarraFiltros.criar(cfg): a barra de uma página. Caixas de várias escolhas (as do Calendário); o que não cabe na linha
 * vai para o Mais filtros, a partir do último; Mais filtros (só quando há filtro no painel) e Limpar filtros à direita,
 * com contorno cinza, texto e ícone pretos; com o menu lateral expandido, só os ícones (o nome na dica); com o menu
 * recolhido, com o nome, a não ser que o nome empurre um filtro para o Mais filtros. Filtros dependentes: a Empresa
 * limita a Fazenda, a Fazenda limita o Talhão, o Ano agrícola e a Atividade limitam a Safra e a Cultura.
 *
 * cfg: {
 *   id: prefixo dos ids ('lp'),
 *   estado: () => o estado da página (chave: 'todos' ou a lista dos valores marcados),
 *   campos: () => [[chave, rótulo, [todos, nenhum, plural], largura mínima]] à mostra (na ordem),
 *   mais: () => [[chave, rótulo, textos]] sempre no Mais filtros,
 *   opcoes: (chave) => [{ valor, nome, extra? }],
 *   depende: { chave: [chaves de que ela depende] },
 *   padrao: () => os valores de Limpar filtros (dos filtros da página; os base vêm de FiltrosBase),
 *   aoMudar: () => atualiza o resultado da página,
 *   unicos: () => [chaves com uma escolha só] (opcional; botões de opção, sem "Todas")
 * }
 */
window.FiltrosBase = (function () {
  const CHAVES = ['ano', 'atividade', 'safra', 'cultura', 'empresa', 'fazenda'];
  let estado = null;

  // Safra atual: a que contém hoje (pelo cadastro: início e fim), a safra antes da safrinha; sem nenhuma, a mais
  // recente. Entre as safras dos planos publicados (como na Planejado × Executado); sem eles, as de todos os planos
  function safraAtual() {
    const publicados = DADOS.planos.filter((p) => Versoes.publicadaComPlanejamento(p));
    const nomes = Util.ordenarSafras((publicados.length ? publicados : DADOS.planos).map((p) => p.safra));
    const safrinha = (s) => { const [a, b] = s.split('/'); return a === b; };
    const h = Util.hojeISO();
    const vigentes = nomes.filter((n) => { const c = Util.cadastroSafra(n); return c.inicio && c.inicio <= h && h <= c.fim; });
    return vigentes.find((n) => !safrinha(n)) || vigentes[0] || nomes.find((n) => !safrinha(n)) || nomes[0] || null;
  }
  function padrao() {
    const safra = safraAtual();
    return { ano: safra ? [String(Util.anoAgricola(safra))] : 'todos', atividade: 'todos', safra: safra ? [safra] : 'todos',
      cultura: 'todos', empresa: 'todos', fazenda: 'todos' };
  }
  const copia = (v) => (Array.isArray(v) ? [...v] : v);
  // Põe no estado da página os filtros-base escolhidos (na primeira vez, os de abertura)
  function ler(est) {
    if (!estado) estado = padrao();
    CHAVES.forEach((c) => { est[c] = copia(estado[c]); });
  }
  // Guarda as escolhas da página (só as chaves mexidas)
  function gravar(est, chaves = CHAVES) {
    if (!estado) estado = padrao();
    chaves.filter((c) => CHAVES.includes(c)).forEach((c) => { estado[c] = copia(est[c]); });
  }
  function limpar() { estado = padrao(); }
  return { CHAVES, safraAtual, padrao, ler, gravar, limpar };
})();

window.BarraFiltros = (function () {
  const Cal = () => Telas.calendario;
  const GAP = 12;

  function criar(cfg) {
    let visiveis = Infinity; // quantos dos campos cabem na linha (o resto vai para o Mais filtros)
    let aberto = false; // painel Filtros adicionais
    let caixa = null;
    let observador = null;
    const est = () => cfg.estado();
    const pop = () => `${cfg.id}-mais-filtros`;
    // Sem o nível Empresa (Util.comEmpresa), o filtro Empresa não aparece (fica em Todas)
    const semEmpresa = (lista) => lista.filter(([c]) => c !== 'empresa' || Util.comEmpresa());
    const camposDe = () => semEmpresa(cfg.campos());

    function campo([chave, rotulo, textos, minimo]) {
      return `
        <div class="campo" ${minimo ? `style="min-width: ${minimo}px"` : ''}>
          <span class="campo__rotulo">${rotulo}</span>
          ${Cal().filtroCaixa(est(), chave, cfg.opcoes(chave), textos, rotulo, { unico: (cfg.unicos ? cfg.unicos() : []).includes(chave) })}
        </div>`;
    }
    function html() {
      const campos = camposDe();
      const n = Math.min(visiveis, campos.length);
      const noPainel = [...semEmpresa(cfg.mais()), ...campos.slice(n)];
      if (!noPainel.length) aberto = false;
      return `
        ${campos.slice(0, n).map(campo).join('')}
        <div class="bf__acoes">
          ${noPainel.length ? `<button class="botao botao--secundario bf__botao" type="button" data-bf="mais"
                  aria-expanded="${aberto}" aria-controls="${pop()}" title="Mais filtros" aria-label="Mais filtros">${Icones.ajustes}<span class="bf__texto">Mais filtros</span></button>` : ''}
          <button class="botao botao--secundario bf__botao bf__limpar ${noPainel.length ? '' : 'bf__limpar--so'}" type="button" data-bf="limpar"
                  title="Limpar filtros" aria-label="Limpar filtros">${Icones.limpar}<span class="bf__texto">Limpar filtros</span></button>
          ${aberto ? `
          <div class="dr-pop bf__pop" id="${pop()}" role="dialog" aria-labelledby="${pop()}-titulo">
            <div class="dr-pop__cab">
              <h3 class="dr-pop__titulo" id="${pop()}-titulo">Filtros adicionais</h3>
              <button class="botao-icone" type="button" data-bf="fechar" aria-label="Fechar" title="Fechar">${Icones.fechar}</button>
            </div>
            ${noPainel.map(([c, r, t]) => campo([c, r, t])).join('')}
          </div>` : ''}
        </div>`;
    }

    // Redesenha só a barra e devolve o foco ao elemento equivalente
    function redesenhar(foco) {
      if (!caixa || !caixa.isConnected) return;
      caixa.innerHTML = html();
      if (foco) caixa.querySelector(foco)?.focus();
    }

    // Quantos campos cabem na linha, ao lado das ações; muda com a largura da janela e ao expandir/recolher o menu
    function encaixar() {
      if (!caixa || !caixa.isConnected) { if (observador) observador.disconnect(); return; }
      const campos = camposDe();
      const cs = getComputedStyle(caixa);
      const base = caixa.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const cabem = (livre) => {
        let n = 0;
        let usado = 0;
        while (n < campos.length && usado + (campos[n][3] || 120) + GAP <= livre) { usado += (campos[n][3] || 120) + GAP; n++; }
        return n;
      };
      // As ações com o painel ainda sem filtro mudam de largura (aparece o Mais filtros): mede com tudo à mostra e
      // com o botão, e fica com o que couber
      const medir = (n) => { visiveis = n; caixa.innerHTML = html(); return caixa.querySelector('.bf__acoes').offsetWidth; };
      const anterior = visiveis;
      const calcular = () => {
        let n = cabem(base - medir(campos.length));
        if (n < campos.length || cfg.mais().length) n = cabem(base - medir(Math.min(n, campos.length - 1)));
        return n;
      };
      caixa.classList.remove('bf--compacto');
      const comNome = calcular();
      caixa.classList.add('bf--compacto');
      const soIcone = calcular();
      caixa.classList.toggle('bf--compacto', soIcone > comNome);
      visiveis = Math.max(comNome, soIcone);
      const foco = document.activeElement && caixa.contains(document.activeElement) ? focoDe(document.activeElement) : null;
      caixa.innerHTML = html();
      if (foco && anterior !== visiveis) caixa.querySelector(foco)?.focus();
    }
    const focoDe = (el) => (el.dataset.bf ? `[data-bf="${el.dataset.bf}"]`
      : el.closest('.cal-filtro') ? `.cal-filtro[data-filtro="${el.closest('.cal-filtro').dataset.filtro}"] .cal-filtro__botao` : null);

    // Valores guardados que não são mais opção (ex.: de outra página, ou plano excluído) saem; sem nenhum, Todas
    function validar() {
      const e = est();
      if (!Util.comEmpresa() && 'empresa' in e) e.empresa = 'todos';
      [...camposDe(), ...semEmpresa(cfg.mais())].forEach(([c]) => {
        if (!Array.isArray(e[c]) || !e[c].length) return;
        const valores = cfg.opcoes(c).map((o) => o.valor);
        const ficam = e[c].filter((v) => valores.includes(v));
        // Filtro de uma escolha só: a escolhida fica, mesmo sendo a única opção
        const unico = (cfg.unicos ? cfg.unicos() : []).includes(c);
        e[c] = ficam.length && (unico || ficam.length < valores.length) ? ficam : 'todos';
      });
    }
    // Depois de mexer num filtro: nos que dependem dele, as marcadas que não são mais opção saem (sem nenhuma, Todas)
    function podar(mexido, mudadas) {
      const e = est();
      Object.keys(cfg.depende || {}).filter((c) => cfg.depende[c].includes(mexido)).forEach((c) => {
        if (!Array.isArray(e[c]) || !e[c].length) return;
        const valores = cfg.opcoes(c).map((o) => o.valor);
        const ficam = e[c].filter((v) => valores.includes(v));
        const novo = ficam.length && ((cfg.unicos ? cfg.unicos() : []).includes(c) || ficam.length < valores.length) ? ficam : 'todos';
        if (JSON.stringify(novo) !== JSON.stringify(e[c])) { e[c] = novo; mudadas.push(c); }
        podar(c, mudadas);
      });
    }

    function limpar() {
      FiltrosBase.limpar();
      const e = est();
      FiltrosBase.ler(e);
      Object.assign(e, cfg.padrao ? cfg.padrao() : {});
      e.busca = {};
      e.filtroAberto = null;
      aberto = false;
      validar();
      redesenhar('[data-bf="limpar"]');
      cfg.aoMudar();
    }

    function ligar(elemento) {
      caixa = elemento;
      caixa.classList.add('bf');
      validar();
      caixa.innerHTML = html();
      const ctx = { get estado() { return est(); } };

      caixa.addEventListener('click', (e) => {
        const acao = e.target.closest('[data-bf]');
        if (acao && acao.dataset.bf === 'mais') { aberto = !aberto; redesenhar(aberto ? '.bf__pop .cal-filtro__botao' : '[data-bf="mais"]'); return; }
        if (acao && acao.dataset.bf === 'fechar') { aberto = false; redesenhar('[data-bf="mais"]'); return; }
        if (acao && acao.dataset.bf === 'limpar') { limpar(); return; }
        // Clique fora do painel (numa caixa da linha de cima…): fecha o painel sem redesenhar a barra, para o clique
        // continuar valendo (abrir a caixa, marcar a opção)
        if (aberto && !e.target.closest('.bf__pop')) {
          aberto = false;
          caixa.querySelector('.bf__pop')?.remove();
          caixa.querySelector('[data-bf="mais"]')?.setAttribute('aria-expanded', 'false');
        }
        Cal().aoClicar(e, ctx, { redesenhar: (foco) => redesenhar(foco) });
      });

      // Filtros com caixas: "Todas" marca ou desmarca tudo; cada caixa liga ou desliga a opção
      caixa.addEventListener('change', (e) => {
        if (e.target.dataset.campo !== 'cal-filtro') return;
        const st = est();
        const chave = e.target.dataset.filtro;
        const valores = cfg.opcoes(chave).map((o) => o.valor);
        let marcados = valores.filter((v) => Cal().marcado(st, chave, v));
        if (e.target.type === 'radio') marcados = [e.target.value];
        else if (e.target.value === 'todos') marcados = e.target.checked ? [...valores] : [];
        else if (e.target.checked) marcados.push(e.target.value);
        else marcados = marcados.filter((n) => n !== e.target.value);
        st[chave] = marcados.length === valores.length && e.target.type !== 'radio' ? 'todos' : marcados;
        const mudadas = [chave];
        podar(chave, mudadas);
        FiltrosBase.gravar(st, mudadas);
        st.filtroAberto = chave;
        redesenhar(`[data-campo="cal-filtro"][data-filtro="${chave}"][value="${CSS.escape(e.target.value)}"]`);
        cfg.aoMudar();
      });
      caixa.addEventListener('input', (e) => Cal().aoDigitar(e, ctx));

      // Esc: fecha a caixa de filtro aberta; sem caixa aberta, o painel Filtros adicionais
      caixa.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const aberta = caixa.querySelector('.cal-filtro[open]');
        if (aberta) {
          e.preventDefault();
          aberta.open = false;
          est().filtroAberto = null;
          aberta.querySelector('.cal-filtro__botao').focus();
          return;
        }
        if (aberto) { e.preventDefault(); aberto = false; redesenhar('[data-bf="mais"]'); }
      });

      if (observador) observador.disconnect();
      observador = new ResizeObserver(encaixar);
      observador.observe(caixa);
    }

    // Clique fora da barra (nos cartões, no cabeçalho, no menu…): fecha a caixa de filtro aberta e o painel Filtros
    // adicionais. Na captura: antes de a página se redesenhar (depois, o elemento clicado já saiu da página)
    document.addEventListener('click', (e) => {
      if (!caixa || !caixa.isConnected || caixa.contains(e.target)) return;
      const abertas = caixa.querySelectorAll('.cal-filtro[open]');
      abertas.forEach((c) => { c.open = false; });
      if (abertas.length && est()) est().filtroAberto = null;
      if (aberto) { aberto = false; redesenhar(); }
    }, true);

    return { ligar, redesenhar: () => { validar(); redesenhar(); encaixar(); }, validar };
  }

  return { criar };
})();
