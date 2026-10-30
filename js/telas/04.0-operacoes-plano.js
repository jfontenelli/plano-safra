/*
 * Tela 04.0 — Revisão do plano (antes aba Operações; docs/telas/04.0-operacoes.md)
 * Última aba do plano: as operações numa tabela só, na ordem em que acontecem (pré-plantio, plantio,
 * manejo da cultura e colheita, sem faixa com o nome da fase), com quantos talhões e hectares recebem cada uma.
 * A fase vem do DAP e define a ordem e a fenologia.
 * Desenhada dentro da Tela 04 (mesmo cabeçalho do plano); a Tela 04 repassa os eventos para cá.
 */
window.Telas = window.Telas || {};

window.Telas.operacoesPlano = (function () {
  const esc = Util.escapar;

  // Fases na ordem em que as coisas acontecem (só ordenam a tabela; não aparecem como faixa)
  const FASES = ['pre', 'plantio', 'desenv', 'colheita'];

  // Plantio (grupo Sementes) e Colheita: operação fixa (não troca de grupo, não se exclui)
  const fixo = (g) => g.tipo === 'Sementes' || g.tipo === 'Colheita';
  // "Sem grupo": onde ficam as operações de um grupo excluído, até o usuário escolher o grupo de cada uma.
  // Não é um grupo de verdade: não aparece na lista de grupos nem nas guias do Planejamento.
  const semGrupo = (g) => !!g.semGrupo;
  const gruposEscolhiveis = (plano) => plano.grupos.filter((x) => !fixo(x) && !semGrupo(x));
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  // Fase pelo DAP: negativo = Pré-plantio; 0 = Plantio; positivo (ou sem DAP) = Manejo da cultura; grupo Colheita = Colheita
  function faseDe(g, op) {
    if (g.tipo === 'Colheita') return 'colheita';
    if (g.tipo === 'Sementes') return 'plantio';
    // Sem DAP (linha limpa): fica na fase em que estava até receber um DAP
    if (op.dap === null || op.dap === undefined || op.dap === '') return op.faseSemDap || 'desenv';
    return op.dap < 0 ? 'pre' : op.dap === 0 ? 'plantio' : 'desenv';
  }

  // Ícone de cada tipo de grupo (na coluna Grupo de operação)
  const ICONE_TIPO = {
    'Sementes': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:var(--cor-sementes)" aria-hidden="true"><ellipse cx="12" cy="12" rx="6" ry="8" transform="rotate(30 12 12)" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    'Tratamento de sementes': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:#b0682f" aria-hidden="true"><ellipse cx="12" cy="12" rx="6" ry="8" transform="rotate(30 12 12)" fill="currentColor"/><path d="M9 15c2-1 4-4 5-7" stroke="#fff" stroke-width="1.6" fill="none"/></svg>',
    'Defensivos': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:var(--cor-defensivos)" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    'Fertilidade': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:var(--cor-fertilidade)" aria-hidden="true"><path d="M3 12c3-2 6-2 9 0s6 2 9 0v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" fill="currentColor"/><circle cx="7.5" cy="16" r="1.2" fill="#fff"/><circle cx="12.5" cy="17.5" r="1.2" fill="#fff"/><circle cx="16.5" cy="15" r="1.2" fill="#fff"/><circle cx="8" cy="6" r="1.4" fill="currentColor"/><circle cx="12" cy="3.5" r="1.4" fill="currentColor"/><circle cx="16" cy="7" r="1.4" fill="currentColor"/></svg>',
    'Colheita': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:var(--cor-colheita)" aria-hidden="true"><path d="M12 21V8M12 8c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4zm0 5c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
  };

  // ----- Desenho -----
  const Cal = () => Telas.calendario; // caixas de filtro (as mesmas da Programação e do Planejado x Executado)
  const FILTROS = [
    ['grupo', 'Grupo de operação', ['Todos os grupos', 'Nenhum grupo', 'grupos']],
    ['operacao', 'Operação', ['Todas as operações', 'Nenhuma operação', 'operações']],
    ['talhao', 'Talhão', ['Todos os talhões', 'Nenhum talhão', 'talhões']],
    ['situacao', 'Situação do planejamento', ['Todas', 'Nenhuma', 'situações'], { unico: true }]
  ];
  // Opções dos filtros: grupos com operação (na ordem do plano), as operações dos grupos marcados, os talhões do plano
  // e a situação (Todas · Completo · Incompleto, com quantas operações há em cada uma)
  function opcoes(ctx, chave) {
    const { plano, estado } = ctx;
    if (chave === 'talhao') return ctx.talhoesFazenda.map((t) => ({ valor: t.nome, nome: t.nome, extra: Util.area(t.area) }));
    if (chave === 'situacao') {
      const linhas = linhasDosFiltros(ctx);
      const n = (sit) => linhas.filter((x) => x.situacao === sit).length;
      return [{ valor: 'todas', nome: `Todas (${linhas.length})` },
        { valor: 'completo', nome: `Completo (${n('completo')})` }, { valor: 'incompleto', nome: `Incompleto (${n('incompleto')})` }];
    }
    const grupos = plano.grupos.filter((g) => g.operacoes.length);
    if (chave === 'grupo') return grupos.map((g) => ({ valor: g.id, nome: semGrupo(g) ? 'Sem grupo de operação' : g.nome }));
    return emOrdem(grupos.filter((g) => Cal().marcado(estado, 'grupo', g.id))
      .flatMap((g) => g.operacoes.map((op) => ({ g, op, fase: faseDe(g, op) }))))
      .map(({ op }) => ({ valor: op.id, nome: op.nome || 'Sem operação' }));
  }

  // Linhas pelos filtros Grupo, Operação e Talhão, com a aplicação de cada uma e a situação: completo quando todos os
  // talhões do filtro recebem a operação (ex.: 10/10), senão incompleto. Uma lista só: pela fase (pré-plantio, plantio,
  // manejo, colheita) e, dentro dela, pelo DAP.
  function linhasDosFiltros(ctx) {
    const marcado = (chave, valor) => Cal().marcado(ctx.estado, chave, valor);
    // Talhão: conta só os talhões marcados (ex.: 1/3 com três talhões no filtro)
    const talhoes = ctx.talhoesFazenda.filter((t) => marcado('talhao', t.nome));
    return emOrdem(ctx.plano.grupos.filter((g) => marcado('grupo', g.id))
      .flatMap((g) => g.operacoes.filter((op) => marcado('operacao', op.id)).map((op) => ({ g, op, fase: faseDe(g, op) }))))
      .map((x) => {
        const aplicacao = aplicacaoDe(x.g, x.op, ctx.plano, talhoes);
        return { ...x, aplicacao, total: talhoes.length, situacao: aplicacao.talhoes < talhoes.length ? 'incompleto' : 'completo' };
      });
  }

  function desenhar(ctx) {
    const { estado } = ctx;
    // Situação: uma escolha por vez; abre em Todas
    if (!Array.isArray(estado.situacao)) estado.situacao = ['todas'];
    const sit = estado.situacao[0];
    const linhas = linhasDosFiltros(ctx).filter((x) => sit === 'todas' || x.situacao === sit);
    return `
      <section class="estrutura">
        <div class="cartao filtros filtros--plano" role="group" aria-label="Filtros">
          ${FILTROS.map(([chave, rotulo, textos, extra]) => `
            <div class="campo">
              <span class="campo__rotulo">${rotulo}</span>
              ${Cal().filtroCaixa(estado, chave, opcoes(ctx, chave), textos, rotulo, extra)}
            </div>`).join('')}
        </div>
        <div class="tab-op__caixa">
          <table class="tab-op">
            <colgroup>
              <col class="tab-op__c-dap"><col class="tab-op__c-fen"><col class="tab-op__c-op"><col class="tab-op__c-grupo"><col class="tab-op__c-talhoes"><col class="tab-op__c-area">
            </colgroup>
            <thead><tr>
              <th class="tab-op__dap">DAP</th><th>Fenologia</th><th>Operação</th><th>Grupo de operação</th><th class="tabela__numero">Talhões</th><th class="tabela__numero">Área de aplicação (ha)</th>
            </tr></thead>
            <tbody>${linhas.length ? linhas.map((x) => linha(x, ctx)).join('')
              : '<tr><td class="tabela__vazia" colspan="6">Nenhuma operação nos filtros escolhidos.</td></tr>'}</tbody>
          </table>
        </div>
      </section>`;
  }

  // Ordem da tabela: fase e DAP. A linha criada pelo "+" (ou Inserir) fica logo abaixo da linha em que se clicou,
  // enquanto tiver o mesmo DAP dela (op.abaixoDe); a mais nova fica mais perto da linha clicada.
  function emOrdem(itens) {
    itens.sort((a, b) => FASES.indexOf(a.fase) - FASES.indexOf(b.fase) || (a.op.dap ?? Infinity) - (b.op.dap ?? Infinity));
    const porId = new Map(itens.map((x) => [x.op.id, x]));
    const abaixo = {};
    const base = [];
    itens.forEach((x) => {
      const ref = x.op.abaixoDe && porId.get(x.op.abaixoDe);
      if (ref && ref.fase === x.fase && (ref.op.dap ?? null) === (x.op.dap ?? null)) (abaixo[ref.op.id] = abaixo[ref.op.id] || []).unshift(x);
      else base.push(x);
    });
    const saida = [];
    const colocar = (x) => { saida.push(x); (abaixo[x.op.id] || []).forEach(colocar); };
    base.forEach(colocar);
    return saida;
  }

  function linha({ g, op, fase, aplicacao, total, situacao }, ctx) {
    const { somenteLeitura, estado, plano } = ctx;
    const nomeTexto = op.nome || 'Sem operação';
    // DAP: Plantio sempre 0; Colheita pelo ciclo da variedade; demais editáveis
    const dap = g.tipo === 'Sementes' ? '<span class="tab-op__fixo" title="O plantio é sempre o DAP 0">0</span>'
      : g.tipo === 'Colheita' ? '<span class="tab-op__fixo" title="Data de plantio + ciclo da variedade, talhão a talhão">Pelo ciclo</span>'
        : somenteLeitura ? `${op.dap ?? '—'}`
          : `<input class="campo__controle tab-op__num" type="text" inputmode="numeric" data-campo="est-dap" data-op="${op.id}"
                    value="${op.dap ?? ''}" placeholder="—" aria-label="DAP de ${esc(nomeTexto)}">`;
    // Fenologia: só no Manejo da cultura (Pré-plantio, Plantio e Colheita não têm fenologia)
    const fenologia = fase !== 'desenv' ? '<span class="tab-op__fixo" title="Sem fenologia nesta fase">—</span>'
      : somenteLeitura ? `<span class="tab-op__fixo">${esc(op.fenologia || '—')}</span>`
        : `<select class="campo__controle tab-op__fen" data-campo="est-fenologia" data-op="${op.id}" aria-label="Fenologia de ${esc(nomeTexto)}">
             <option value="">—</option>
             ${DADOS.fenologia.map((f) => `<option ${f === op.fenologia ? 'selected' : ''}>${f}</option>`).join('')}
           </select>`;
    // Nome: texto; dois cliques (ou F2) para renomear. Linha limpa ou nova: "Sem operação", em cinza
    const nome = estado.renomeandoOp === op.id
      ? `<input class="campo__controle tab-op__campo" data-campo="est-nome-op" data-op="${op.id}" value="${esc(op.nome)}"
                placeholder="Nome da operação" aria-label="Nome da operação" data-foco-inicial>`
      : somenteLeitura ? esc(nomeTexto)
        : `<span class="tab-op__nome ${op.nome ? '' : 'tab-op__nome--vazio'}" tabindex="0" data-est-renomear-op="${op.id}" title="Clique duas vezes para renomear">${esc(nomeTexto)}</span>`;
    // Grupo: Plantio e Colheita fixos; as demais escolhem entre os grupos (ou criam um novo)
    const grupo = semGrupo(g) ? (somenteLeitura ? '<span class="tab-op__grupo tab-op__sem-grupo">Sem grupo de operação</span>' : `
      <span class="tab-op__grupo tab-op__sem-grupo">${Icones.alerta}
        <select class="campo__controle tab-op__sel-grupo tab-op__sel-grupo--vazio" data-campo="est-grupo" data-op="${op.id}" aria-label="Grupo de operação de ${esc(nomeTexto)}: sem grupo">
          <option value="${g.id}" selected disabled>Sem grupo de operação</option>
          ${gruposEscolhiveis(plano).map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join('')}
        </select></span>`)
      : fixo(g) || somenteLeitura
      ? `<span class="tab-op__grupo">${ICONE_TIPO[g.tipo] || ''}${esc(g.nome)}</span>`
      : `<span class="tab-op__grupo">${ICONE_TIPO[g.tipo] || ''}
           <select class="campo__controle tab-op__sel-grupo" data-campo="est-grupo" data-op="${op.id}" aria-label="Grupo de operação de ${esc(nomeTexto)}">
             ${gruposEscolhiveis(plano).map((x) => `<option value="${x.id}" ${x === g ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}
           </select></span>`;
    // Talhões: os que recebem / os do filtro; incompleto (nem todos recebem): a linha inteira em destaque
    const incompleto = situacao === 'incompleto';
    return `
      <tr ${incompleto ? 'class="tab-op__linha--incompleta"' : ''}>
        <td class="tab-op__dap">${dap}</td>
        <td>${fenologia}</td>
        <td class="tab-op__op">${nome}</td>
        <td>${grupo}</td>
        <td class="tabela__numero"><span class="tab-op__talhoes"
            title="${plural(aplicacao.talhoes, 'talhão recebe', 'talhões recebem')} a operação, de ${total}">${aplicacao.talhoes}/${total}</span></td>
        <td class="tabela__numero"><span class="tab-op__area">${Util.area(aplicacao.area).replace(' ha', '')}</span></td>
      </tr>`;
  }

  // Talhões que recebem a operação no planejamento e a soma da área de aplicação deles.
  // Plantio e Colheita: os talhões com variedade no Plantio (a colheita vem do plantio), somando a área de aplicação
  // de cada variedade (sem área informada e com mais de uma variedade, não soma). Demais: os talhões com pelo menos um
  // produto com dose nesta operação; enquanto Defensivo e Fertilidade não têm a coluna de área de aplicação, vale a do talhão.
  function aplicacaoDe(g, op, plano, talhoes) {
    if (g.tipo === 'Sementes' || g.tipo === 'Colheita') {
      const plantio = plano.grupos.filter((x) => x.tipo === 'Sementes').flatMap((x) => x.operacoes)[0];
      const recebem = talhoes.filter((t) => Planos.temVariedadePlantio(plantio, t.nome));
      const area = recebem.reduce((soma, t) => {
        const linhas = Planos.linhasPlantio(plantio, t.nome);
        return soma + linhas.reduce((s, l, i) => s + (l.variedade ? Planos.areaLinhaPlantio(linhas, i, t.area) || 0 : 0), 0);
      }, 0);
      return { talhoes: recebem.length, area };
    }
    const recebem = talhoes.filter((t) => temDose(op, op.talhoes[t.nome]));
    return { talhoes: recebem.length, area: recebem.reduce((soma, t) => soma + (op.talhoes[t.nome].area ?? t.area), 0) };
  }

  // Talhão com pelo menos um produto com dose na operação
  function temDose(op, ajuste) {
    if (!ajuste) return false;
    return Planos.linhasTalhao(op, ajuste).some((l) => {
      const dose = Planos.doseTalhao(op, ajuste, l);
      return l.produto && dose !== null && dose !== undefined && dose !== '';
    });
  }

  // ----- Ações -----
  function acharOp(plano, id) {
    for (const g of plano.grupos) {
      const op = g.operacoes.find((o) => o.id === id);
      if (op) return { g, op };
    }
    return null;
  }

  // Grupo que fica sem nenhuma operação continua no plano (para receber operações novas). Só o "Sem grupo",
  // que não é um grupo de verdade, some quando fica vazio. Devolve a posição do removido (para o Desfazer), ou -1.
  function removerSeVazio(plano, g) {
    if (g.operacoes.length || !semGrupo(g)) return -1;
    const i = plano.grupos.indexOf(g);
    plano.grupos.splice(i, 1);
    return i;
  }

  // Trocar o grupo da operação (ou criar um grupo novo para ela); o grupo de origem continua, mesmo vazio
  function moverParaGrupo(op, origem, destino, ctx, acoes) {
    if (destino === origem) return;
    origem.operacoes.splice(origem.operacoes.indexOf(op), 1);
    destino.operacoes.push(op);
    removerSeVazio(ctx.plano, origem);
    acoes.alterou();
  }

  // Excluir o grupo, mantendo as operações: elas ficam "Sem grupo" até o usuário escolher o grupo de cada uma.
  // Confirma; depois, Desfazer (o grupo volta com as operações).
  function excluirGrupo(g, ctx, acoes) {
    const { plano } = ctx;
    const n = g.operacoes.length;
    const excluir = () => {
      const ig = plano.grupos.indexOf(g);
      const ops = [...g.operacoes];
      let sg = plano.grupos.find(semGrupo);
      const criado = !sg;
      if (criado) {
        sg = { ...Planos.novoGrupo('Sem grupo', ''), semGrupo: true };
        plano.grupos.splice(ig, 0, sg);
      }
      sg.operacoes.push(...ops);
      plano.grupos.splice(plano.grupos.indexOf(g), 1);
      acoes.alterou(); acoes.redesenhar(null);
      Aviso.mostrar(`Grupo ${esc(g.nome)} excluído${n ? `: ${n} ${n === 1 ? 'operação ficou' : 'operações ficaram'} sem grupo` : ''}`, { acao: 'Desfazer', aoAgir: () => {
        ops.forEach((o) => sg.operacoes.splice(sg.operacoes.indexOf(o), 1));
        if (!sg.operacoes.length) plano.grupos.splice(plano.grupos.indexOf(sg), 1);
        plano.grupos.splice(Math.min(ig, plano.grupos.length), 0, g);
        acoes.alterou(); acoes.redesenhar(null);
      } });
    };
    if (!n) { excluir(); return; }
    Modal.confirmar({
      titulo: `Excluir o grupo ${esc(g.nome)}?`,
      texto: `${n === 1 ? 'A operação continua' : `As ${n} operações continuam`} no plano, sem grupo de operação. Escolha o grupo de cada uma depois, na aba Validação.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir grupo', classe: 'perigo', acao: excluir }]
    });
  }

  // ----- Eventos (repassados pela Tela 04). Devolvem true quando o evento era daqui. -----
  // Filtros: abrir e fechar as caixas (clique fora fecha)
  function aoClicar(e, ctx) {
    document.querySelectorAll('.estrutura .cal-filtro[open]').forEach((caixa) => {
      if (!caixa.contains(e.target)) { caixa.open = false; if (ctx.estado.filtroAberto === caixa.dataset.filtro) ctx.estado.filtroAberto = null; }
    });
    const botao = e.target.closest('.estrutura .cal-filtro__botao');
    if (botao) ctx.estado.filtroAberto = botao.closest('.cal-filtro').open ? null : botao.closest('.cal-filtro').dataset.filtro;
    return false;
  }

  // Filtros com caixas: "Todas" marca ou desmarca tudo; cada caixa liga ou desliga a opção.
  // Outro grupo: a Operação volta a todas as operações dos grupos marcados.
  function mudarFiltro(e, ctx, acoes) {
    const est = ctx.estado;
    const chave = e.target.dataset.filtro;
    const valores = opcoes(ctx, chave).map((o) => o.valor);
    let marcados = valores.filter((v) => Cal().marcado(est, chave, v));
    if (e.target.type === 'radio') marcados = [e.target.value];
    else if (e.target.value === 'todos') marcados = e.target.checked ? [...valores] : [];
    else if (e.target.checked) marcados.push(e.target.value);
    else marcados = marcados.filter((n) => n !== e.target.value);
    est[chave] = marcados.length === valores.length && e.target.type !== 'radio' ? 'todos' : marcados;
    if (chave === 'grupo') est.operacao = 'todos';
    est.filtroAberto = chave;
    acoes.redesenhar(`[data-campo="cal-filtro"][data-filtro="${chave}"][value="${CSS.escape(e.target.value)}"]`);
    return true;
  }

  // Pesquisar dentro da caixa de filtro
  function aoDigitar(e, ctx) {
    return Cal().aoDigitar(e, ctx);
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
    if (campo === 'cal-filtro') return mudarFiltro(e, ctx, acoes);
    if (!['est-dap', 'est-fenologia', 'est-grupo'].includes(campo)) return false;
    const achado = acharOp(ctx.plano, e.target.dataset.op);
    if (!achado) return true;
    const { g, op } = achado;
    if (campo === 'est-grupo') {
      moverParaGrupo(op, g, ctx.plano.grupos.find((x) => x.id === e.target.value), ctx, acoes);
    } else if (campo === 'est-dap') {
      const n = Util.numero(e.target.value);
      // DAP é obrigatório: apagar não vale, o campo volta ao valor anterior
      if (n === null && op.dap !== null && op.dap !== undefined) {
        e.target.value = op.dap; Aviso.mostrar('Toda operação precisa de DAP'); return true;
      }
      op.dap = n === null ? null : Math.round(n);
      if (op.dap !== null) delete op.faseSemDap; // com DAP, a fase volta a vir dele
      delete op.abaixoDe; // DAP novo: a linha vai para o lugar dela pelo DAP
      if (op.dap !== null && op.dap <= 0) op.fenologia = ''; // pré-plantio e plantio: sem fenologia
    } else if (campo === 'est-fenologia') {
      op.fenologia = e.target.value;
    }
    acoes.alterou();
    acoes.redesenhar(`[data-campo="${campo}"][data-op="${op.id}"]`);
    return true;
  }

  // excluirGrupo também é usado pelo Planejamento (botão direito na guia), com a mesma regra
  return { desenhar, aoClicar, aoDuploClique, aoTeclar, aoDesfocar, aoMudar, aoDigitar, excluirGrupo };
})();
