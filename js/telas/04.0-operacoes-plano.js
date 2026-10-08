/*
 * Tela 04.0 — Operações do plano (docs/telas/04.0-operacoes.md)
 * Etapa 1 do plano: a estrutura vinda do modelo (grupos e operações com DAP, fenologia e previsão de conclusão),
 * para revisar antes do planejamento talhão a talhão. Quem não quiser mexer segue para o Planejamento pelas etapas do cabeçalho.
 * Desenhada dentro da Tela 04 (mesmo cabeçalho do plano); a Tela 04 repassa os eventos para cá.
 */
window.Telas = window.Telas || {};

window.Telas.operacoesPlano = (function () {
  const esc = Util.escapar;

  // Fenologia fixa: DAP negativo = Pré-plantio; DAP 0 = Plantio; grupo Colheita = Colheita
  function fenologiaFixa(grupo, op) {
    if (grupo.tipo === 'Colheita') return 'Colheita';
    if (op.dap === null || op.dap === undefined || op.dap === '') return null;
    if (op.dap < 0) return 'Pré-plantio';
    if (op.dap === 0) return 'Plantio';
    return null;
  }

  // Operações na ordem do DAP (sem DAP no fim), como na lista do Planejamento
  function ordenadas(grupo) {
    return [...grupo.operacoes].sort((a, b) => (a.dap ?? Infinity) - (b.dap ?? Infinity));
  }

  // ----- Desenho -----
  function desenhar(ctx) {
    const { plano, somenteLeitura, estado } = ctx;
    return `
      <section class="estrutura">
        <div class="estrutura__aviso" role="note">${Icones.info}
          <p><strong>Revise as operações cadastradas.</strong> Cada operação vira uma Ordem de Serviço (OS) quando o plano for aprovado. Se estiver tudo certo, siga para o planejamento.</p>
        </div>
        ${plano.grupos.length ? plano.grupos.map((g) => grupoHtml(g, ctx)).join('')
          : '<p class="estrutura__vazio">Nenhum grupo de operações no plano.</p>'}
        ${somenteLeitura ? '' : `
          <button class="link-acao estrutura__novo-grupo" type="button" data-acao="est-novo-grupo">${Icones.mais} Novo grupo de operações</button>`}
      </section>`;
    function grupoHtml(g) {
      // Grupos começam minimizados: só abre o que a pessoa expandir (ou onde ela acabou de criar uma operação)
      const recolhido = !estado.abertos.has(g.id);
      const n = g.operacoes.length;
      // Semente e Colheita: operação fixa (sem excluir grupo nem operações); plano aprovado: só leitura.
      // TSI: uma operação só; quem não faz exclui o grupo (sem "Excluir todas as operações")
      const fixo = ctx.somenteLeitura || g.tipo === 'Sementes' || g.tipo === 'Colheita';
      return `
        <section class="estrutura__grupo" aria-label="Grupo ${esc(g.nome)}">
          <div class="estrutura__topo">
            <button class="botao-icone estrutura__seta ${recolhido ? 'estrutura__seta--recolhido' : ''}" type="button" data-acao="est-recolher"
                    data-grupo="${g.id}" aria-expanded="${!recolhido}"
                    aria-label="${recolhido ? 'Mostrar' : 'Recolher'} operações de ${esc(g.nome)}" title="${recolhido ? 'Mostrar' : 'Recolher'} operações">${Icones.abaixo}</button>
            ${nomeGrupo(g, ctx)}
            <span class="estrutura__tipo">${g.tipo ? `tipo ${esc(g.tipo)} · ` : ''}${n} ${n === 1 ? 'operação' : 'operações'}</span>
            ${g.tipo === 'Colheita' ? '<span class="estrutura__nota">A data vem do plantio: data de plantio + ciclo da variedade</span>' : ''}
            ${fixo ? '' : `
              <button class="link-acao estrutura__excluir" type="button" data-acao="est-excluir-grupo" data-grupo="${g.id}"
                      title="Excluir o grupo do plano (ex.: quem não faz TSI)">${Icones.lixeira} Excluir grupo</button>`}
          </div>
          ${recolhido ? '' : `
            ${n && !fixo && g.tipo !== 'Tratamento de sementes' ? `
              <div class="estrutura__barra">
                <button class="link-acao estrutura__excluir" type="button" data-acao="est-excluir-todas" data-grupo="${g.id}"
                        title="Excluir todas as operações deste grupo (o grupo continua)">${Icones.lixeira} Excluir todas as operações</button>
              </div>` : ''}
            ${n ? `
              <div class="estrutura__rolagem">
                <table class="tabela tabela--compacta estrutura__tabela">
                  <thead><tr>
                    <th>Operação</th><th class="tabela__numero">DAP</th><th>Fenologia</th><th>Previsão de conclusão</th>
                    ${somenteLeitura ? '' : '<th class="estrutura__acao"><span class="so-leitor">Excluir</span></th>'}
                  </tr></thead>
                  <tbody>${ordenadas(g).map((op) => linha(g, op, ctx)).join('')}</tbody>
                </table>
              </div>` : '<p class="estrutura__vazio">Nenhuma operação neste grupo.</p>'}
            ${somenteLeitura || g.tipo === 'Colheita' || g.tipo === 'Sementes' ? '' : `
              <button class="link-acao estrutura__nova" type="button" data-acao="est-nova-op" data-grupo="${g.id}">${Icones.mais} Nova operação</button>`}`}
        </section>`;
    }
  }

  // Nome do grupo: dois cliques (ou F2) para renomear
  function nomeGrupo(g, { somenteLeitura, estado }) {
    if (estado.renomeandoGrupo === g.id) {
      return `<input class="campo__controle estrutura__campo-grupo" data-campo="est-nome-grupo" data-grupo="${g.id}" value="${esc(g.nome)}"
                     aria-label="Nome do grupo" data-foco-inicial>`;
    }
    return somenteLeitura ? `<h2 class="estrutura__nome">${esc(g.nome)}</h2>`
      : `<h2 class="estrutura__nome estrutura__nome--editavel" tabindex="0" data-est-renomear-grupo="${g.id}"
             title="Clique duas vezes para renomear">${esc(g.nome)}</h2>`;
  }

  function linha(g, op, { somenteLeitura, estado }) {
    const fixa = fenologiaFixa(g, op);
    // Nome: texto; dois cliques (ou F2) para renomear
    const nome = estado.renomeandoOp === op.id
      ? `<input class="campo__controle estrutura__campo-nome" data-campo="est-nome-op" data-op="${op.id}" value="${esc(op.nome)}"
                aria-label="Nome da operação" data-foco-inicial>`
      : somenteLeitura ? esc(op.nome)
        : `<span class="estrutura__op" tabindex="0" data-est-renomear-op="${op.id}" title="Clique duas vezes para renomear">${esc(op.nome)}</span>`;
    // DAP: Plantio sempre 0 (não muda); Colheita pelo ciclo da variedade; demais editáveis
    const dap = g.tipo === 'Sementes' ? '<span class="estrutura__fixo" title="O plantio é sempre o DAP 0">0</span>'
      : g.tipo === 'Colheita' ? '<span class="estrutura__fixo" title="Data de plantio + ciclo da variedade, talhão a talhão">Pelo ciclo</span>'
        : somenteLeitura ? `${op.dap ?? '—'}`
          : `<input class="campo__controle estrutura__num" type="text" inputmode="numeric" data-campo="est-dap" data-op="${op.id}"
                    value="${op.dap ?? ''}" placeholder="—" aria-label="DAP de ${esc(op.nome)}">`;
    const fenologia = fixa || somenteLeitura
      ? `<span class="estrutura__fixo">${esc(fixa || op.fenologia || '—')}</span>`
      : `<select class="campo__controle estrutura__fen" data-campo="est-fenologia" data-op="${op.id}" aria-label="Fenologia de ${esc(op.nome)}">
           <option value="">—</option>
           ${DADOS.fenologia.map((f) => `<option ${f === op.fenologia ? 'selected' : ''}>${f}</option>`).join('')}
         </select>`;
    const prazo = Telas.calendario.prazoDe(op, g);
    const previsao = somenteLeitura ? `${prazo} ${prazo === 1 ? 'dia' : 'dias'}` : `
      <span class="estrutura__prazo"><input class="campo__controle estrutura__num" type="text" inputmode="numeric" data-campo="est-prazo"
             data-op="${op.id}" value="${prazo}" aria-label="Previsão de conclusão de ${esc(op.nome)}, em dias"> dias</span>`;
    return `
      <tr>
        <td class="estrutura__celula-nome">${nome}</td>
        <td class="tabela__numero">${dap}</td>
        <td>${fenologia}</td>
        <td>${previsao}</td>
        ${somenteLeitura ? '' : `<td class="estrutura__acao">${g.tipo === 'Sementes' || g.tipo === 'Colheita' ? '' : `
          <button class="botao-icone" type="button" data-acao="est-excluir-op" data-grupo="${g.id}" data-op="${op.id}"
                  title="Excluir operação" aria-label="Excluir ${esc(op.nome)}">${Icones.lixeira}</button>`}</td>`}
      </tr>`;
  }

  // ----- Eventos (repassados pela Tela 04). Devolvem true quando o evento era daqui. -----
  function acharOp(plano, id) {
    for (const g of plano.grupos) {
      const op = g.operacoes.find((o) => o.id === id);
      if (op) return { g, op };
    }
    return null;
  }

  function aoClicar(e, ctx, acoes) {
    const alvo = e.target.closest('[data-acao^="est-"]');
    if (!alvo) return false;
    const { plano, estado } = ctx;
    const grupo = plano.grupos.find((g) => g.id === alvo.dataset.grupo);
    switch (alvo.dataset.acao) {
      case 'est-recolher':
        if (estado.abertos.has(grupo.id)) estado.abertos.delete(grupo.id); else estado.abertos.add(grupo.id);
        acoes.redesenhar(`[data-acao="est-recolher"][data-grupo="${grupo.id}"]`); break;
      case 'est-nova-op': estado.abertos.add(grupo.id); acoes.criarOperacao(grupo); break;
      case 'est-excluir-op': acoes.excluirOperacao(grupo, grupo.operacoes.find((o) => o.id === alvo.dataset.op)); break;
      case 'est-novo-grupo': acoes.novoGrupo(); break;
      case 'est-excluir-todas': excluirTodas(grupo, ctx, acoes); break;
      case 'est-excluir-grupo': acoes.excluirGrupo(grupo); break;
    }
    return true;
  }

  // Excluir todas as operações do grupo de uma vez (o modelo não serve): o grupo fica, vazio, para receber as do usuário.
  // Confirma com o impacto (operações e talhões já planejados); depois, Desfazer.
  function excluirTodas(grupo, ctx, acoes) {
    const ops = [...grupo.operacoes];
    const comTalhoes = ops.filter((o) => Object.keys(o.talhoes || {}).length).length;
    const n = ops.length;
    Modal.confirmar({
      titulo: n === 1 ? `Excluir a operação de ${esc(grupo.nome)}?` : `Excluir as ${n} operações de ${esc(grupo.nome)}?`,
      texto: `O grupo continua, vazio, para você cadastrar as suas operações.${comTalhoes
        ? ` ${comTalhoes} ${comTalhoes === 1 ? 'operação já tem' : 'operações já têm'} talhões planejados, que também serão apagados.` : ''}`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir operações', classe: 'perigo', acao: () => {
        grupo.operacoes = [];
        acoes.alterou(); acoes.redesenhar(null);
        Aviso.mostrar(`${n} ${n === 1 ? 'operação excluída' : 'operações excluídas'} de ${esc(grupo.nome)}`, { acao: 'Desfazer', aoAgir: () => {
          grupo.operacoes = ops; acoes.alterou(); acoes.redesenhar(null);
        } });
      } }]
    });
  }

  function aoDuploClique(e, ctx, acoes) {
    if (ctx.somenteLeitura) return false;
    const g = e.target.closest('[data-est-renomear-grupo]');
    const o = e.target.closest('[data-est-renomear-op]');
    if (!g && !o) return false;
    ctx.estado.renomeandoGrupo = g ? g.dataset.estRenomearGrupo : null;
    ctx.estado.renomeandoOp = o ? o.dataset.estRenomearOp : null;
    acoes.redesenhar(null);
    return true;
  }

  function aoTeclar(e, ctx, acoes) {
    const el = e.target;
    if (!ctx.somenteLeitura && e.key === 'F2' && (el.dataset.estRenomearGrupo || el.dataset.estRenomearOp)) {
      e.preventDefault();
      ctx.estado.renomeandoGrupo = el.dataset.estRenomearGrupo || null;
      ctx.estado.renomeandoOp = el.dataset.estRenomearOp || null;
      acoes.redesenhar(null);
      return true;
    }
    const campo = el.dataset.campo || '';
    if (!campo.startsWith('est-')) return false;
    if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    if (e.key === 'Escape' && (campo === 'est-nome-op' || campo === 'est-nome-grupo')) {
      e.preventDefault(); e.stopPropagation();
      ctx.estado.renomeandoOp = null; ctx.estado.renomeandoGrupo = null;
      acoes.redesenhar(null);
    }
    return true;
  }

  // Nomes: gravam ao sair do campo (Enter tira o foco). Vazio volta ao anterior; operação com nome repetido não vale.
  function aoDesfocar(e, ctx, acoes) {
    const el = e.target;
    const { plano, estado } = ctx;
    if (el.dataset.campo === 'est-nome-grupo' && estado.renomeandoGrupo) {
      const g = plano.grupos.find((x) => x.id === el.dataset.grupo);
      const v = el.value.trim();
      estado.renomeandoGrupo = null;
      if (g && v && v !== g.nome) { g.nome = v; acoes.alterou(); }
      acoes.redesenhar(`[data-est-renomear-grupo="${el.dataset.grupo}"]`);
      return true;
    }
    if (el.dataset.campo === 'est-nome-op' && estado.renomeandoOp) {
      const achado = acharOp(plano, el.dataset.op);
      const v = el.value.trim();
      estado.renomeandoOp = null;
      if (achado && v && v !== achado.op.nome) {
        if (acoes.nomeOperacaoRepetido(v, achado.op)) Aviso.mostrar('Já existe uma operação com esse nome');
        else { achado.op.nome = v; acoes.alterou(); }
      }
      acoes.redesenhar(`[data-est-renomear-op="${el.dataset.op}"]`);
      return true;
    }
    return false;
  }

  function aoMudar(e, ctx, acoes) {
    const campo = e.target.dataset.campo || '';
    if (!['est-dap', 'est-fenologia', 'est-prazo'].includes(campo)) return false;
    const achado = acharOp(ctx.plano, e.target.dataset.op);
    if (!achado) return true;
    const { op } = achado;
    if (campo === 'est-dap') {
      const n = Util.numero(e.target.value);
      // DAP é obrigatório: apagar não vale, o campo volta ao valor anterior
      if (n === null && op.dap !== null && op.dap !== undefined) {
        e.target.value = op.dap; Aviso.mostrar('Toda operação precisa de DAP'); return true;
      }
      op.dap = n === null ? null : Math.round(n);
      if (op.dap !== null && op.dap <= 0) op.fenologia = ''; // pré-plantio e plantio: fenologia fixa
    } else if (campo === 'est-fenologia') {
      op.fenologia = e.target.value;
    } else if (campo === 'est-prazo') {
      const n = Math.round(Util.numero(e.target.value));
      if (n > 0) op.prazo = n;
    }
    acoes.alterou();
    acoes.redesenhar(`[data-campo="${campo}"][data-op="${op.id}"]`);
    return true;
  }

  return { desenhar, aoClicar, aoDuploClique, aoTeclar, aoDesfocar, aoMudar };
})();
