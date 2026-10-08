/*
 * Tela 04.0 — Operações do plano (docs/telas/04.0-operacoes.md)
 * Etapa 1 do plano: as operações vindas do modelo, numa tabela por fase da cultura (Pré-plantio, Plantio,
 * Desenvolvimento, Colheita), para revisar antes do planejamento talhão a talhão. A fase vem do DAP.
 * Desenhada dentro da Tela 04 (mesmo cabeçalho do plano); a Tela 04 repassa os eventos para cá.
 */
window.Telas = window.Telas || {};

window.Telas.operacoesPlano = (function () {
  const esc = Util.escapar;

  // Faixas na ordem em que as coisas acontecem; dapNovo = DAP sugerido para a operação adicionada na faixa
  const FASES = [
    { id: 'pre', nome: 'Pré-plantio', dapNovo: -1 },
    { id: 'plantio', nome: 'Plantio', dapNovo: 0 },
    { id: 'desenv', nome: 'Desenvolvimento', dapNovo: 1 },
    { id: 'colheita', nome: 'Colheita', dapNovo: null }
  ];

  // Plantio (grupo Sementes) e Colheita: operação fixa (não troca de grupo, não se exclui)
  const fixo = (g) => g.tipo === 'Sementes' || g.tipo === 'Colheita';

  // Fase pelo DAP: negativo = Pré-plantio; 0 = Plantio; positivo (ou sem DAP) = Desenvolvimento; grupo Colheita = Colheita
  function faseDe(g, op) {
    if (g.tipo === 'Colheita') return 'colheita';
    if (g.tipo === 'Sementes') return 'plantio';
    if (op.dap === null || op.dap === undefined || op.dap === '') return 'desenv';
    return op.dap < 0 ? 'pre' : op.dap === 0 ? 'plantio' : 'desenv';
  }

  // Ícone de cada tipo de grupo (na coluna Grupo de operação)
  const ICONE_TIPO = {
    'Sementes': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:#d9822b" aria-hidden="true"><ellipse cx="12" cy="12" rx="6" ry="8" transform="rotate(30 12 12)" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    'Tratamento de sementes': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:#b0682f" aria-hidden="true"><ellipse cx="12" cy="12" rx="6" ry="8" transform="rotate(30 12 12)" fill="currentColor"/><path d="M9 15c2-1 4-4 5-7" stroke="#fff" stroke-width="1.6" fill="none"/></svg>',
    'Defensivos': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:#2a64a8" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    'Fertilidade': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:#3c8d2f" aria-hidden="true"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" fill="currentColor"/><path d="M5 19l8-8" stroke="#fff" stroke-width="1.6"/></svg>',
    'Colheita': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:#b8860b" aria-hidden="true"><path d="M12 21V8M12 8c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4zm0 5c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
  };
  const iconeFase = (id) => (id === 'colheita' ? ICONE_TIPO.Colheita : Icones.broto);

  // ----- Desenho -----
  function desenhar(ctx) {
    const { plano } = ctx;
    const porFase = {};
    FASES.forEach((f) => { porFase[f.id] = []; });
    plano.grupos.forEach((g) => g.operacoes.forEach((op) => porFase[faseDe(g, op)].push({ g, op })));
    return `
      <section class="estrutura">
        ${ctx.estado.avisoFechado ? '' : `
          <div class="estrutura__aviso" role="note">${Icones.info}
            <p><strong>Revise as operações cadastradas.</strong> Cada operação vira uma Ordem de Serviço (OS) quando o plano for aprovado. Se estiver tudo certo, siga para o planejamento.</p>
            <button class="botao-icone estrutura__fechar" type="button" data-acao="est-fechar-aviso" aria-label="Fechar o aviso" title="Fechar">${Icones.fechar}</button>
          </div>`}
        <div class="tab-op__caixa">
          <table class="tab-op">
            <colgroup>
              <col class="tab-op__c-dap"><col class="tab-op__c-fen"><col class="tab-op__c-op"><col class="tab-op__c-grupo"><col class="tab-op__c-prazo">
              ${ctx.somenteLeitura ? '' : '<col class="tab-op__c-acao">'}
            </colgroup>
            <thead><tr>
              <th class="tab-op__dap">DAP</th><th>Fenologia</th><th>Operação</th><th>Grupo de operação</th><th>Previsão de conclusão</th>
              ${ctx.somenteLeitura ? '' : '<th class="tab-op__acao"><span class="so-leitor">Excluir</span></th>'}
            </tr></thead>
            ${FASES.map((f) => faixa(f, porFase[f.id], ctx)).join('')}
          </table>
        </div>
      </section>`;
  }

  function faixa(f, itens, ctx) {
    const colunas = ctx.somenteLeitura ? 5 : 6;
    const n = itens.length;
    const linhas = [...itens].sort((a, b) => (a.op.dap ?? Infinity) - (b.op.dap ?? Infinity));
    return `
      <tbody>
        <tr class="tab-op__faixa"><th colspan="${colunas}" scope="rowgroup">
          <div class="tab-op__faixa-linha">
            ${iconeFase(f.id)}<span class="tab-op__fase">${f.nome}</span>
            <span class="tab-op__qtd">${n} ${n === 1 ? 'operação' : 'operações'}</span>
            ${f.id === 'colheita' ? '<span class="tab-op__qtd">· a data vem do plantio + ciclo da variedade</span>'
              : ctx.somenteLeitura ? '' : `
              <button class="link-acao tab-op__adicionar" type="button" data-acao="est-nova-op" data-fase="${f.id}">${Icones.mais} Adicionar operação</button>`}
          </div>
        </th></tr>
        ${n ? linhas.map(({ g, op }) => linha(g, op, f.id, ctx)).join('')
          : `<tr><td colspan="${colunas}" class="tab-op__vazio">Nenhuma operação nesta fase.</td></tr>`}
      </tbody>`;
  }

  function linha(g, op, fase, ctx) {
    const { somenteLeitura, estado, plano } = ctx;
    // DAP: Plantio sempre 0; Colheita pelo ciclo da variedade; demais editáveis
    const dap = g.tipo === 'Sementes' ? '<span class="tab-op__fixo" title="O plantio é sempre o DAP 0">0</span>'
      : g.tipo === 'Colheita' ? '<span class="tab-op__fixo" title="Data de plantio + ciclo da variedade, talhão a talhão">Pelo ciclo</span>'
        : somenteLeitura ? `${op.dap ?? '—'}`
          : `<input class="campo__controle tab-op__num" type="text" inputmode="numeric" data-campo="est-dap" data-op="${op.id}"
                    value="${op.dap ?? ''}" placeholder="—" aria-label="DAP de ${esc(op.nome)}">`;
    // Fenologia: só no Desenvolvimento (Pré-plantio, Plantio e Colheita não têm fenologia)
    const fenologia = fase !== 'desenv' ? '<span class="tab-op__fixo" title="Sem fenologia nesta fase">—</span>'
      : somenteLeitura ? `<span class="tab-op__fixo">${esc(op.fenologia || '—')}</span>`
        : `<select class="campo__controle tab-op__fen" data-campo="est-fenologia" data-op="${op.id}" aria-label="Fenologia de ${esc(op.nome)}">
             <option value="">—</option>
             ${DADOS.fenologia.map((f) => `<option ${f === op.fenologia ? 'selected' : ''}>${f}</option>`).join('')}
           </select>`;
    // Nome: texto; dois cliques (ou F2) para renomear
    const nome = estado.renomeandoOp === op.id
      ? `<input class="campo__controle tab-op__campo" data-campo="est-nome-op" data-op="${op.id}" value="${esc(op.nome)}"
                aria-label="Nome da operação" data-foco-inicial>`
      : somenteLeitura ? esc(op.nome)
        : `<span class="tab-op__nome" tabindex="0" data-est-renomear-op="${op.id}" title="Clique duas vezes para renomear">${esc(op.nome)}</span>`;
    // Grupo: Plantio e Colheita fixos; as demais escolhem entre os grupos (ou criam um novo)
    const grupo = fixo(g) || somenteLeitura
      ? `<span class="tab-op__grupo">${ICONE_TIPO[g.tipo] || ''}${esc(g.nome)}</span>`
      : `<span class="tab-op__grupo">${ICONE_TIPO[g.tipo] || ''}
           <select class="campo__controle tab-op__sel-grupo" data-campo="est-grupo" data-op="${op.id}" aria-label="Grupo de operação de ${esc(op.nome)}">
             ${plano.grupos.filter((x) => !fixo(x)).map((x) => `<option value="${x.id}" ${x === g ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}
             <option value="__novo__">+ Novo grupo de operação</option>
           </select></span>`;
    const prazo = Telas.calendario.prazoDe(op, g);
    const previsao = somenteLeitura ? `${prazo} ${prazo === 1 ? 'dia' : 'dias'}` : `
      <span class="tab-op__prazo"><input class="campo__controle tab-op__num" type="text" inputmode="numeric" data-campo="est-prazo"
             data-op="${op.id}" value="${prazo}" aria-label="Previsão de conclusão de ${esc(op.nome)}, em dias"> dias</span>`;
    return `
      <tr>
        <td class="tab-op__dap">${dap}</td>
        <td>${fenologia}</td>
        <td class="tab-op__op">${nome}</td>
        <td>${grupo}</td>
        <td>${previsao}</td>
        ${somenteLeitura ? '' : `<td class="tab-op__acao">${fixo(g) ? '' : `
          <button class="botao-icone" type="button" data-acao="est-excluir-op" data-op="${op.id}"
                  title="Excluir operação" aria-label="Excluir ${esc(op.nome)}">${Icones.lixeira}</button>`}</td>`}
      </tr>`;
  }

  // ----- Ações -----
  function acharOp(plano, id) {
    for (const g of plano.grupos) {
      const op = g.operacoes.find((o) => o.id === id);
      if (op) return { g, op };
    }
    return null;
  }

  // Grupo que fica sem nenhuma operação some do plano (e das guias do Planejamento); Semente e Colheita ficam.
  // Devolve a posição do grupo removido (para o Desfazer), ou -1.
  function removerSeVazio(plano, g) {
    if (g.operacoes.length || fixo(g)) return -1;
    const i = plano.grupos.indexOf(g);
    plano.grupos.splice(i, 1);
    return i;
  }

  // Nome livre para a operação nova: "Nova operação", "Nova operação 2"…
  function nomeNovo(acoes) {
    let n = 1;
    let nome = 'Nova operação';
    while (acoes.nomeOperacaoRepetido(nome, null)) nome = `Nova operação ${++n}`;
    return nome;
  }

  // Adicionar operação na faixa: entra no primeiro grupo que recebe operações (troca na coluna Grupo),
  // com o DAP da fase, e já abre o nome para editar
  function novaOperacao(fase, ctx, acoes) {
    const { plano, estado } = ctx;
    const g = plano.grupos.find((x) => !fixo(x));
    if (!g) { Aviso.mostrar('Crie um grupo de operação no Planejamento para adicionar operações'); return; }
    const f = FASES.find((x) => x.id === fase);
    const op = Planos.novaOperacao(nomeNovo(acoes), f.dapNovo);
    g.operacoes.push(op);
    estado.renomeandoOp = op.id;
    acoes.alterou(); acoes.redesenhar(null);
  }

  // Excluir operação: com talhões planejados, confirma com o impacto; depois, Desfazer (volta o grupo, se tinha sumido)
  function excluirOperacao(id, ctx, acoes) {
    const { plano } = ctx;
    const achado = acharOp(plano, id);
    if (!achado) return;
    const { g, op } = achado;
    const remover = () => {
      const i = g.operacoes.indexOf(op);
      g.operacoes.splice(i, 1);
      const ig = removerSeVazio(plano, g);
      acoes.alterou(); acoes.redesenhar(null);
      Aviso.mostrar(`${esc(op.nome)} excluída${ig >= 0 ? ` (o grupo ${esc(g.nome)} ficou vazio e saiu do plano)` : ''}`, { acao: 'Desfazer', aoAgir: () => {
        if (ig >= 0) plano.grupos.splice(ig, 0, g);
        g.operacoes.splice(i, 0, op);
        acoes.alterou(); acoes.redesenhar(null);
      } });
    };
    const talhoes = Object.keys(op.talhoes || {}).length + Object.keys(op.plantio || {}).length;
    if (!talhoes) { remover(); return; }
    Modal.confirmar({
      titulo: `Excluir ${esc(op.nome)}?`,
      texto: `Ela já está planejada em ${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'}; esse planejamento também será apagado.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir operação', classe: 'perigo', acao: remover }]
    });
  }

  // Trocar o grupo da operação (ou criar um grupo novo para ela); o grupo de origem que ficar vazio some
  function moverParaGrupo(op, origem, destino, ctx, acoes) {
    if (destino === origem) return;
    origem.operacoes.splice(origem.operacoes.indexOf(op), 1);
    destino.operacoes.push(op);
    removerSeVazio(ctx.plano, origem);
    acoes.alterou();
  }

  // ----- Eventos (repassados pela Tela 04). Devolvem true quando o evento era daqui. -----
  function aoClicar(e, ctx, acoes) {
    const alvo = e.target.closest('[data-acao^="est-"]');
    if (!alvo) return false;
    // O aviso do topo é só um aviso: fechado, não volta para este plano enquanto a página estiver aberta
    if (alvo.dataset.acao === 'est-fechar-aviso') { ctx.estado.avisoFechado = true; acoes.redesenhar(null); }
    if (alvo.dataset.acao === 'est-nova-op') novaOperacao(alvo.dataset.fase, ctx, acoes);
    if (alvo.dataset.acao === 'est-excluir-op') excluirOperacao(alvo.dataset.op, ctx, acoes);
    return true;
  }

  function aoDuploClique(e, ctx, acoes) {
    if (ctx.somenteLeitura) return false;
    const o = e.target.closest('[data-est-renomear-op]');
    if (!o) return false;
    ctx.estado.renomeandoOp = o.dataset.estRenomearOp;
    acoes.redesenhar(null);
    return true;
  }

  function aoTeclar(e, ctx, acoes) {
    const el = e.target;
    if (!ctx.somenteLeitura && e.key === 'F2' && el.dataset.estRenomearOp) {
      e.preventDefault();
      ctx.estado.renomeandoOp = el.dataset.estRenomearOp;
      acoes.redesenhar(null);
      return true;
    }
    const campo = el.dataset.campo || '';
    if (!campo.startsWith('est-')) return false;
    if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    if (e.key === 'Escape' && campo === 'est-nome-op') {
      e.preventDefault(); e.stopPropagation();
      ctx.estado.renomeandoOp = null;
      acoes.redesenhar(null);
    }
    return true;
  }

  // Nome: grava ao sair do campo (Enter tira o foco). Vazio volta ao anterior; nome repetido não vale.
  function aoDesfocar(e, ctx, acoes) {
    const el = e.target;
    if (el.dataset.campo !== 'est-nome-op' || !ctx.estado.renomeandoOp) return false;
    const achado = acharOp(ctx.plano, el.dataset.op);
    const v = el.value.trim();
    ctx.estado.renomeandoOp = null;
    if (achado && v && v !== achado.op.nome) {
      if (acoes.nomeOperacaoRepetido(v, achado.op)) Aviso.mostrar('Já existe uma operação com esse nome');
      else { achado.op.nome = v; acoes.alterou(); }
    }
    acoes.redesenhar(`[data-est-renomear-op="${el.dataset.op}"]`);
    return true;
  }

  function aoMudar(e, ctx, acoes) {
    const campo = e.target.dataset.campo || '';
    if (!['est-dap', 'est-fenologia', 'est-prazo', 'est-grupo'].includes(campo)) return false;
    const achado = acharOp(ctx.plano, e.target.dataset.op);
    if (!achado) return true;
    const { g, op } = achado;
    if (campo === 'est-grupo') {
      if (e.target.value === '__novo__') {
        e.target.value = g.id; // volta ao grupo atual até o novo ser criado
        acoes.novoGrupo((novo) => moverParaGrupo(op, g, novo, ctx, acoes));
        return true;
      }
      moverParaGrupo(op, g, ctx.plano.grupos.find((x) => x.id === e.target.value), ctx, acoes);
    } else if (campo === 'est-dap') {
      const n = Util.numero(e.target.value);
      // DAP é obrigatório: apagar não vale, o campo volta ao valor anterior
      if (n === null && op.dap !== null && op.dap !== undefined) {
        e.target.value = op.dap; Aviso.mostrar('Toda operação precisa de DAP'); return true;
      }
      op.dap = n === null ? null : Math.round(n);
      if (op.dap !== null && op.dap <= 0) op.fenologia = ''; // pré-plantio e plantio: sem fenologia
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
