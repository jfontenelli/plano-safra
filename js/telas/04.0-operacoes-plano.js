/*
 * Tela 04.0 — Validação do Plano de Safra (aba Validação; docs/telas/04.0-operacoes.md)
 * Última aba do plano: as pendências do planejamento, um bloco por grupo de operação (os grupos do Planejamento, na
 * mesma ordem). Cada pendência pode ser corrigida (abre o Planejamento no lugar dela) ou ignorada (com Desfazer).
 * As pendências são calculadas a partir do plano, a cada desenho; nada é guardado além das ignoradas.
 * Desenhada dentro da Tela 04 (mesmo cabeçalho do plano); a Tela 04 repassa os cliques para cá.
 */
window.Telas = window.Telas || {};

window.Telas.validacao = (function () {
  const esc = Util.escapar;
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  // Ícone de cada tipo de grupo, num quadrado com a cor do tipo
  const TRATOR = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="16.5" r="3"/><circle cx="18" cy="17.5" r="2"/><path d="M4.5 14V8h6.5l2 6"/><path d="M10 16.5h6M13 14h6.5l.5 1.5"/><path d="M15.5 14V9.5h3M7 8V5"/></svg>';
  const ICONE_TIPO = {
    'Sementes': ['sementes', '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="6" ry="8" transform="rotate(30 12 12)"/></svg>'],
    'Defensivos': ['defensivos', '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg>'],
    // Fertilidade com o broto e Aplicação de insumos (ex.: Corretivos) com o solo; cada um mantém a sua cor
    'Fertilidade': ['fertilidade', Icones.broto],
    'Aplicação de insumos': ['insumos', '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13c3-2 6-2 9 0s6 2 9 0v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M8 6.5v.1M12 4v.1M16 7v.1"/></svg>'],
    'Operação de campo': ['campo', TRATOR]
  };
  const iconeGrupo = (g) => ICONE_TIPO[g.tipo] || ['outro', Icones.lista];
  // O que revisar em cada tipo de grupo (a linha embaixo do nome): sem insumo, Plantio e com insumos
  const COM_INSUMOS = 'Revise operações, DAP, produtos, dose, área e talhões.';
  const DICA_TIPO = {
    'Operação de campo': 'Revise operações, DAP, área e talhões.',
    'Sementes': 'Revise variedade, data de plantio, população de plantas e talhões.',
    'Aplicação de insumos': COM_INSUMOS,
    'Fertilidade': COM_INSUMOS,
    'Defensivos': COM_INSUMOS
  };

  // ----- Pendências -----
  // Talhão planejado na operação: no Plantio, com variedade; na Operação de campo, com a operação; nos grupos com
  // recomendação, com pelo menos um produto (a dose que falta é outra pendência)
  function recebe(g, op, t) {
    if (g.tipo === 'Sementes') return Planos.temVariedadePlantio(op, t.nome);
    const ajuste = op.talhoes[t.nome];
    if (!ajuste) return false;
    if (g.tipo === 'Operação de campo') return true;
    return produtosDoTalhao(op, ajuste).length > 0;
  }

  const produtosDoTalhao = (op, ajuste) => Planos.linhasTalhao(op, ajuste).filter((l) => l.produto);
  const vazio = (v) => v === null || v === undefined || v === '';
  // Itens a conferir em cada talhão planejado, por tipo de grupo (regra 3): [chave, o problema, falta(t)]
  function conferencias(g, op) {
    if (g.tipo === 'Sementes') {
      const comVariedade = (t) => Planos.linhasPlantio(op, t.nome).filter((l) => l.variedade);
      return [
        ['sem-data', 'sem data de plantio', (t) => comVariedade(t).some((l) => !l.data)],
        ['sem-populacao', 'sem população', (t) => comVariedade(t).some((l) => vazio(l.populacao))]
      ];
    }
    if (g.tipo === 'Operação de campo') {
      return [['sem-area', 'sem área', (t) => op.talhoes[t.nome] && Number(op.talhoes[t.nome].pct ?? 100) === 0]];
    }
    return [['sem-dose', 'com produto sem dose', (t) => {
      const ajuste = op.talhoes[t.nome];
      return !!ajuste && produtosDoTalhao(op, ajuste).some((l) => vazio(Planos.doseTalhao(op, ajuste, l)));
    }]];
  }

  const semDap = (op) => op.dap === null || op.dap === undefined || op.dap === '';
  const operacoesEmOrdem = (g) => [...g.operacoes].sort((a, b) => (semDap(a) ? 1e9 : a.dap) - (semDap(b) ? 1e9 : b.dap));

  // Grupos da Validação: os do Planejamento (sem a Colheita, que vem do plantio)
  const gruposValidacao = (plano) => plano.grupos.filter((g) => g.tipo !== 'Colheita' && !g.semGrupo);

  // Pendências de um grupo, por operação: { chave, nome, texto, corrigir: { op, naoPlanejados } }
  function pendenciasDoGrupo(g, ctx) {
    const talhoes = ctx.talhoesFazenda;
    const total = talhoes.length;
    const versao = ctx.plano.versaoAberta;
    const lista = [];
    const ops = operacoesEmOrdem(g);
    // Uma linha por pendência: "Calagem: 5 de 10 talhões sem planejamento". A medida conta sempre os talhões com o
    // problema; vale igual para a versão em construção e a publicada
    const medida = (k, problema) => `${k} de ${plural(total, 'talhão', 'talhões')} ${problema}`;
    ops.forEach((op) => {
      const n = talhoes.filter((t) => recebe(g, op, t)).length;
      // 1. Operação sem talhões planejados: "Gessagem: 10 de 10 talhões sem planejamento"
      if (!n) {
        lista.push({ chave: `${versao}|sem-talhoes|${op.id}`, nome: op.nome, texto: medida(total, 'sem planejamento'), corrigir: { op } });
      // 2. A operação está em alguns talhões, não em todos: "Calagem: 5 de 10 talhões sem planejamento"
      } else if (n < total) {
        lista.push({ chave: `${versao}|parcial|${op.id}`, nome: op.nome, texto: medida(total - n, 'sem planejamento'),
          corrigir: { op, naoPlanejados: true } });
      }
      // 3. O que falta nos talhões planejados: no Plantio, data de plantio e população; nos grupos com insumos, a dose
      // de algum produto; na Operação de campo, a área (0%)
      conferencias(g, op).forEach(([chave, problema, falta]) => {
        const k = talhoes.filter((t) => recebe(g, op, t) && falta(t)).length;
        if (k) lista.push({ chave: `${versao}|${chave}|${op.id}`, nome: op.nome, texto: medida(k, problema), corrigir: { op } });
      });
      // 4. Operação sem DAP, com recomendação em algum talhão (o DAP é da operação; no Plantio é sempre 0)
      if (n && semDap(op) && g.tipo !== 'Sementes') {
        lista.push({ chave: `${versao}|sem-dap|${op.id}`, nome: op.nome, texto: medida(n, 'sem DAP'), corrigir: { op } });
      }
    });
    return lista.map((p) => ({ ...p, ignorada: ctx.estado.ignoradas.has(p.chave) }));
  }

  // Para a confirmação de Publicar versão: quantas pendências não tratadas (nem corrigidas, nem ignoradas)
  function naoTratadas(ctx) {
    estadoPadrao(ctx);
    return { total: gruposValidacao(ctx.plano).reduce((s, g) => s + pendenciasDoGrupo(g, ctx).filter((p) => !p.ignorada).length, 0) };
  }

  function estadoPadrao(ctx) {
    ctx.estado.abertos = ctx.estado.abertos || new Set();
    ctx.estado.ignoradas = ctx.estado.ignoradas || new Set();
  }

  // ----- Desenho -----
  function desenhar(ctx) {
    estadoPadrao(ctx);
    const grupos = gruposValidacao(ctx.plano).map((g) => ({ g, pend: pendenciasDoGrupo(g, ctx) }));
    const pendentes = grupos.reduce((s, x) => s + x.pend.filter((p) => !p.ignorada).length, 0);
    const ignoradas = grupos.reduce((s, x) => s + x.pend.filter((p) => p.ignorada).length, 0);
    // Ocupa a largura toda da área. Embaixo do título, o cartão "Resumo da validação": pendências não tratadas
    // (só ignoradas, o selo cinza; nenhuma, "Sem pendências"), quantos grupos e, à direita, "Ignorar todas as
    // pendências" ou, com tudo ignorado, "Desfazer" (todas voltam a pendentes)
    return `
      <section class="validacao">
        <h2 class="validacao__titulo">Validação do Plano de Safra</h2>
        <p class="validacao__sub">Revise as pendências identificadas no planejamento. Você pode corrigir ou ignorar e seguir em frente.</p>
        <div class="val-resumo">
          <span class="val-resumo__icone" aria-hidden="true">${Icones.prancheta}</span>
          <h3 class="val-resumo__titulo">Resumo da validação</h3>
          ${pendentes ? `<span class="val-selo val-selo--pendente val-selo--grande">${plural(pendentes, 'pendência', 'pendências')}</span>` : ''}
          ${ignoradas ? `<span class="val-selo val-selo--ignorada val-selo--grande">${plural(ignoradas, 'ignorada', 'ignoradas')}</span>` : ''}
          ${!pendentes && !ignoradas ? `<span class="val-selo val-selo--ok val-selo--grande">${Icones.certo} Sem pendências</span>` : ''}
          <span class="val-resumo__grupos">${plural(grupos.length, 'grupo', 'grupos')}</span>
          ${ctx.somenteLeitura ? '' : pendentes ? `
            <button class="botao botao--secundario val-resumo__acao" type="button" data-acao="val-ignorar-todas">${Icones.proibido} Ignorar todas as pendências</button>`
            : ignoradas ? `
            <button class="botao botao--secundario val-resumo__acao" type="button" data-acao="val-desfazer-todas">${Icones.desfazer} Desfazer</button>` : ''}
        </div>
        ${grupos.length ? `<div class="validacao__grupos">${grupos.map((x) => blocoGrupo(x, ctx)).join('')}</div>`
          : '<p class="validacao__vazio">Nenhum grupo de operação no plano.</p>'}
      </section>`;
  }

  // Contagem do grupo: "2 pendências"; com ignoradas, "1 pendente" e "1 ignorada"; nada, "Sem pendências"
  function contagem(pend) {
    const pendentes = pend.filter((p) => !p.ignorada).length;
    const ignoradas = pend.length - pendentes;
    if (!pend.length) return `<span class="val-selo val-selo--ok">${Icones.certo} Sem pendências</span>`;
    if (!ignoradas) return `<span class="val-selo val-selo--pendente"><span class="val-alerta" aria-hidden="true">!</span>${plural(pendentes, 'pendência', 'pendências')}</span>`;
    return `${pendentes ? `<span class="val-selo val-selo--pendente"><span class="val-alerta" aria-hidden="true">!</span>${plural(pendentes, 'pendente', 'pendentes')}</span>` : ''}
      <span class="val-selo val-selo--ignorada"><span class="val-alerta val-alerta--cinza" aria-hidden="true">!</span>${plural(ignoradas, 'ignorada', 'ignoradas')}</span>`;
  }

  function blocoGrupo({ g, pend }, ctx) {
    const aberto = ctx.estado.abertos.has(g.id);
    const [classe, icone] = iconeGrupo(g);
    const pendentes = pend.filter((p) => !p.ignorada).length;
    return `
      <div class="val-grupo ${aberto ? 'val-grupo--aberto' : ''}">
        <!-- A linha inteira abre e fecha o grupo (os botões dentro dela fazem só a ação deles) -->
        <div class="val-grupo__cab" data-acao="val-abrir" data-grupo="${g.id}">
          <button class="val-grupo__abrir" type="button" data-acao="val-abrir" data-grupo="${g.id}" aria-expanded="${aberto}">
            <span class="val-grupo__seta" aria-hidden="true">${aberto ? Icones.abaixo : Icones.proxima}</span>
            <span class="val-grupo__icone val-grupo__icone--${classe}" aria-hidden="true">${icone}</span>
            <span class="val-grupo__textos">
              <span class="val-grupo__nome">${esc(g.nome)}</span>
              ${DICA_TIPO[g.tipo] ? `<span class="val-grupo__dica">${DICA_TIPO[g.tipo]}</span>` : ''}
            </span>
          </button>
          <span class="val-grupo__contagem">${contagem(pend)}</span>
          ${aberto && pendentes && !ctx.somenteLeitura ? `
            <button class="botao botao--secundario botao--p" type="button" data-acao="val-ignorar-grupo" data-grupo="${g.id}">${Icones.proibido} Ignorar todas do grupo</button>` : ''}
          <span class="val-grupo__seta-fim" aria-hidden="true">${Icones.proxima}</span>
        </div>
        ${!aberto ? '' : pend.length ? `<ul class="val-lista">${pend.map((p) => itemPendencia(p, ctx)).join('')}</ul>` : `
          <p class="val-grupo__vazio">${Icones.certo} Nenhuma pendência identificada neste grupo.</p>`}
      </div>`;
  }

  function itemPendencia(p, ctx) {
    const alvo = `data-op="${p.corrigir.op.id}"${p.corrigir.naoPlanejados ? ' data-nao-planejados="1"' : ''}`;
    const acoes = ctx.somenteLeitura
      ? `<button class="botao botao--secundario botao--p" type="button" data-acao="val-corrigir" ${alvo}>Ver no Planejamento</button>`
      : p.ignorada
        ? `<button class="botao botao--secundario botao--p" type="button" data-acao="val-desfazer" data-chave="${esc(p.chave)}">${Icones.desfazer} Desfazer</button>`
        : `<button class="botao botao--secundario botao--p" type="button" data-acao="val-corrigir" ${alvo}>Corrigir</button>
           <button class="botao botao--secundario botao--p" type="button" data-acao="val-ignorar" data-chave="${esc(p.chave)}">${Icones.proibido} Ignorar</button>`;
    return `
      <li class="val-item ${p.ignorada ? 'val-item--ignorada' : ''}">
        <span class="val-item__icone" aria-hidden="true">${p.ignorada ? Icones.olhoFechado : '<span class="val-alerta val-alerta--grande">!</span>'}</span>
        <div class="val-item__texto">
          <p class="val-item__titulo"><strong>${esc(p.nome)}:</strong> ${esc(p.texto)}</p>
        </div>
        <span class="val-selo ${p.ignorada ? 'val-selo--ignorada' : 'val-selo--pendente'}">${p.ignorada ? 'Ignorada' : 'Pendente'}</span>
        <div class="val-item__acoes">${acoes}</div>
      </li>`;
  }

  // ----- Excluir grupo (botão direito na guia do Planejamento): sai com as operações dele, com os talhões e
  // produtos planejados. Confirma (com operações); depois, Desfazer (o grupo volta inteiro, no mesmo lugar). -----
  function excluirGrupo(g, ctx, acoes) {
    const { plano } = ctx;
    const n = g.operacoes.length;
    const excluir = () => {
      const i = plano.grupos.indexOf(g);
      plano.grupos.splice(i, 1);
      acoes.alterou(); acoes.redesenhar(null);
      Aviso.mostrar(`Grupo ${esc(g.nome)} excluído${n ? ` com ${plural(n, 'operação', 'operações')}` : ''}`, { acao: 'Desfazer', aoAgir: () => {
        plano.grupos.splice(Math.min(i, plano.grupos.length), 0, g);
        acoes.alterou(); acoes.redesenhar(null);
      } });
    };
    if (!n) { excluir(); return; }
    Modal.confirmar({
      titulo: `Excluir o grupo ${esc(g.nome)}?`,
      texto: `${n === 1 ? 'A operação dele, com os talhões e produtos planejados, também será excluída.'
        : `As ${n} operações dele, com os talhões e produtos planejados, também serão excluídas.`}`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir grupo', classe: 'perigo', acao: excluir }]
    });
  }

  // ----- Cliques (repassados pela Tela 04). Devolve true quando o clique era daqui. -----
  function aoClicar(e, ctx, acoes) {
    const alvo = e.target.closest('[data-acao^="val-"]');
    if (!alvo) return false;
    estadoPadrao(ctx);
    const { abertos, ignoradas } = ctx.estado;
    const doGrupo = (id) => gruposValidacao(ctx.plano).find((g) => g.id === id);
    switch (alvo.dataset.acao) {
      case 'val-abrir': {
        const id = alvo.dataset.grupo;
        if (abertos.has(id)) abertos.delete(id); else abertos.add(id);
        acoes.redesenhar(`[data-acao="val-abrir"][data-grupo="${id}"]`);
        break;
      }
      case 'val-ignorar':
        ignoradas.add(alvo.dataset.chave);
        acoes.redesenhar(`[data-acao="val-desfazer"][data-chave="${CSS.escape(alvo.dataset.chave)}"]`);
        break;
      case 'val-desfazer':
        ignoradas.delete(alvo.dataset.chave);
        acoes.redesenhar(`[data-acao="val-ignorar"][data-chave="${CSS.escape(alvo.dataset.chave)}"]`);
        break;
      case 'val-ignorar-grupo': {
        const g = doGrupo(alvo.dataset.grupo);
        if (g) pendenciasDoGrupo(g, ctx).forEach((p) => ignoradas.add(p.chave));
        acoes.redesenhar(`[data-acao="val-abrir"][data-grupo="${alvo.dataset.grupo}"]`);
        break;
      }
      case 'val-ignorar-todas':
        gruposValidacao(ctx.plano).forEach((g) => pendenciasDoGrupo(g, ctx).forEach((p) => ignoradas.add(p.chave)));
        acoes.redesenhar('[data-acao="val-desfazer-todas"]');
        break;
      // Desfazer do Resumo da validação: todas as ignoradas voltam a pendentes
      case 'val-desfazer-todas':
        gruposValidacao(ctx.plano).forEach((g) => pendenciasDoGrupo(g, ctx).forEach((p) => ignoradas.delete(p.chave)));
        acoes.redesenhar('[data-acao="val-ignorar-todas"]');
        break;
      case 'val-corrigir':
        acoes.abrirOperacao(alvo.dataset.op, { naoPlanejados: !!alvo.dataset.naoPlanejados });
        break;
      default: return false;
    }
    return true;
  }

  return { desenhar, aoClicar, excluirGrupo, naoTratadas };
})();
