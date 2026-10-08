/*
 * Tela 04.0 — Operações do plano (docs/telas/04.0-operacoes.md)
 * Etapa 1 do plano: as operações vindas do modelo, numa tabela por fase da cultura (Pré-plantio, Plantio,
 * Manejo da cultura, Colheita), para revisar antes do planejamento talhão a talhão. A fase vem do DAP.
 * Desenhada dentro da Tela 04 (mesmo cabeçalho do plano); a Tela 04 repassa os eventos para cá.
 */
window.Telas = window.Telas || {};

window.Telas.operacoesPlano = (function () {
  const esc = Util.escapar;

  // Faixas na ordem em que as coisas acontecem; dapNovo = DAP sugerido para a operação adicionada na faixa
  const FASES = [
    { id: 'pre', nome: 'Pré-plantio', dapNovo: -1 },
    { id: 'plantio', nome: 'Plantio', dapNovo: 0 },
    { id: 'desenv', nome: 'Manejo da cultura', dapNovo: 1 },
    { id: 'colheita', nome: 'Colheita', dapNovo: null }
  ];

  // Plantio (grupo Sementes) e Colheita: operação fixa (não troca de grupo, não se exclui)
  const fixo = (g) => g.tipo === 'Sementes' || g.tipo === 'Colheita';
  // "Sem grupo": onde ficam as operações de um grupo excluído, até o usuário escolher o grupo de cada uma.
  // Não é um grupo de verdade: não aparece na lista de grupos nem nas guias do Planejamento.
  const semGrupo = (g) => !!g.semGrupo;
  const gruposEscolhiveis = (plano) => plano.grupos.filter((x) => !fixo(x) && !semGrupo(x));

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
    const ler = ctx.somenteLeitura;
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
              <col class="tab-op__c-fase"><col class="tab-op__c-dap"><col class="tab-op__c-fen"><col class="tab-op__c-op"><col class="tab-op__c-grupo"><col class="tab-op__c-prazo">
              ${ler ? '' : '<col class="tab-op__c-acao">'}
            </colgroup>
            <thead><tr>
              <th class="tab-op__fase-cab"><span class="so-leitor">Fase</span></th>
              <th class="tab-op__dap">DAP</th><th>Fenologia</th><th>Operação</th><th>Grupo de operação</th><th>Previsão de conclusão</th>
              ${ler ? '' : '<th class="tab-op__acao"><span class="so-leitor">Ações</span></th>'}
            </tr></thead>
            ${FASES.map((f) => faixa(f, porFase[f.id], ctx)).join('')}
          </table>
        </div>
        ${ler ? '' : '<p class="tab-op__dica">Botão direito numa linha (ou ⋯ no fim dela): Inserir · Excluir · Limpar conteúdo.</p>'}
      </section>`;
  }

  // Cada fase: a faixa vertical à esquerda (nome deitado, na cor da fase, como no Calendário) ocupa todas as linhas da fase
  function faixa(f, itens, ctx) {
    const colunas = ctx.somenteLeitura ? 5 : 6;
    const n = itens.length;
    const linhas = [...itens].sort((a, b) => (a.op.dap ?? Infinity) - (b.op.dap ?? Infinity));
    const fase = `
      <th class="tab-op__fase-v tab-op__fase-v--${f.id}" rowspan="${Math.max(n, 1)}" scope="rowgroup"
          title="${f.nome}: ${n} ${n === 1 ? 'operação' : 'operações'}${f.id === 'colheita' ? ' · a data vem do plantio + ciclo da variedade' : ''}">
        <div class="tab-op__fase-v-conteudo"><span class="tab-op__fase-v-nome">${f.nome}</span></div>
      </th>`;
    if (!n) {
      return `
        <tbody class="tab-op__grupo-fase">
          <tr data-est-fase-vazia="${f.id}">${fase}
            <td colspan="${colunas}" class="tab-op__vazio">Nenhuma operação nesta fase.${ctx.somenteLeitura ? ''
              : ` <button class="link-acao" type="button" data-acao="est-nova-op" data-fase="${f.id}">${Icones.mais} Inserir operação</button>`}</td>
          </tr>
        </tbody>`;
    }
    return `
      <tbody class="tab-op__grupo-fase">
        ${linhas.map(({ g, op }, i) => linha(g, op, f.id, ctx, i === 0 ? fase : '')).join('')}
      </tbody>`;
  }

  function linha(g, op, fase, ctx, celulaFase) {
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
          <option disabled>──────────</option>
          <option value="__novo__">+ Novo grupo de operação</option>
        </select></span>`)
      : fixo(g) || somenteLeitura
      ? `<span class="tab-op__grupo">${ICONE_TIPO[g.tipo] || ''}${somenteLeitura ? esc(g.nome)
          : `<span class="tab-op__grupo-nome" tabindex="0" data-est-renomear-grupo="${g.id}" title="Clique duas vezes para renomear o grupo">${esc(g.nome)}</span>`}</span>`
      : `<span class="tab-op__grupo">${ICONE_TIPO[g.tipo] || ''}
           <select class="campo__controle tab-op__sel-grupo" data-campo="est-grupo" data-op="${op.id}" aria-label="Grupo de operação de ${esc(nomeTexto)}">
             ${gruposEscolhiveis(plano).map((x) => `<option value="${x.id}" ${x === g ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}
             <option disabled>──────────</option>
             <option value="__novo__">+ Novo grupo de operação</option>
             <option value="__renomear__">✎ Renomear “${esc(g.nome)}”…</option>
             <option value="__excluir__">🗑 Excluir grupo “${esc(g.nome)}”…</option>
           </select></span>`;
    const prazo = Telas.calendario.prazoDe(op, g);
    const previsao = somenteLeitura ? `${prazo} ${prazo === 1 ? 'dia' : 'dias'}` : `
      <span class="tab-op__prazo"><input class="campo__controle tab-op__num" type="text" inputmode="numeric" data-campo="est-prazo"
             data-op="${op.id}" value="${prazo}" aria-label="Previsão de conclusão de ${esc(nomeTexto)}, em dias"> dias</span>`;
    // Ações da linha: botão direito na linha ou "⋯" (aparece ao passar o mouse; a Colheita não tem menu)
    const temMenu = !somenteLeitura && g.tipo !== 'Colheita';
    return `
      <tr ${temMenu ? `data-est-linha="${op.id}"` : ''}>
        ${celulaFase}
        <td class="tab-op__dap">${dap}</td>
        <td>${fenologia}</td>
        <td class="tab-op__op">${nome}</td>
        <td>${grupo}</td>
        <td>${previsao}</td>
        ${somenteLeitura ? '' : `<td class="tab-op__acao">${temMenu ? `
          <button class="botao-icone tab-op__mais" type="button" data-acao="est-menu" data-op="${op.id}"
                  title="Inserir, excluir ou limpar a linha" aria-label="Ações da linha ${esc(nomeTexto)}">⋯</button>` : ''}</td>`}
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

  // Adicionar operação na faixa: entra no primeiro grupo que recebe operações (troca na coluna Grupo),
  // com o DAP da fase, e já abre o nome para editar
  // "Sem grupo" do plano (cria antes da Colheita, se ainda não existe)
  function semGrupoDoPlano(plano) {
    let sg = plano.grupos.find(semGrupo);
    if (!sg) {
      sg = { ...Planos.novoGrupo('Sem grupo', ''), semGrupo: true };
      const iColheita = plano.grupos.findIndex((g) => g.tipo === 'Colheita');
      plano.grupos.splice(iColheita >= 0 ? iColheita : plano.grupos.length, 0, sg);
    }
    return sg;
  }

  // Linha nova (Inserir): sem nome e sem grupo, como uma linha limpa; já abre o nome para digitar
  function criarLinha(dap, ctx, acoes) {
    const op = Planos.novaOperacao('', dap);
    semGrupoDoPlano(ctx.plano).operacoes.push(op);
    ctx.estado.renomeandoOp = op.id;
    acoes.alterou(); acoes.redesenhar(null);
  }

  // Inserir numa fase vazia: com o DAP da fase
  function novaOperacao(fase, ctx, acoes) {
    criarLinha(FASES.find((x) => x.id === fase).dapNovo, ctx, acoes);
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
      texto: `${n === 1 ? 'A operação continua' : `As ${n} operações continuam`} no plano, sem grupo de operação. Escolha o grupo de cada uma depois, na etapa Operações.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir grupo', classe: 'perigo', acao: excluir }]
    });
  }

  // Renomear o grupo (vale para todas as operações dele, a guia do Planejamento e o Calendário)
  function renomearGrupo(g, acoes) {
    const modal = Modal.abrir(`
      <form class="formulario" novalidate>
        <div class="modal__corpo">
          <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
          <h2 class="modal__titulo" id="modal-titulo">Renomear grupo de operação</h2>
          <p class="modal__subtitulo">O nome novo vale para todas as operações do grupo e para a guia do Planejamento.</p>
          <div class="campo">
            <label class="campo__rotulo" for="rg-nome">Nome</label>
            <input class="campo__controle" id="rg-nome" name="nome" autocomplete="off" required value="${esc(g.nome)}">
          </div>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
          <button class="botao botao--primario" type="submit">Renomear</button>
        </div>
      </form>`, { classe: 'modal--pequeno' });
    const form = modal.elemento.querySelector('form');
    const campo = form.elements.nome;
    const atualizar = () => { form.querySelector('[type=submit]').disabled = !campo.value.trim(); };
    form.addEventListener('input', atualizar);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = campo.value.trim();
      if (!v) return;
      modal.fechar();
      if (v !== g.nome) { g.nome = v; acoes.alterou(); }
      acoes.redesenhar(null);
    });
    campo.focus(); campo.select();
  }

  // ----- Menu da linha: Inserir · Excluir · Limpar conteúdo -----
  // Inserir: linha nova logo abaixo, na mesma fase e com o mesmo DAP (Plantio: DAP 0), sem nome e sem grupo, já com o nome aberto
  function inserirAbaixo(op, g, ctx, acoes) {
    criarLinha(g && g.tipo !== 'Sementes' ? op.dap : 0, ctx, acoes);
  }

  // Limpar conteúdo: a linha fica toda em branco no mesmo lugar (inclusive o DAP; ela fica na fase em que estava):
  // sem nome, sem grupo, sem fenologia, previsão de conclusão no padrão e sem planejamento (talhões e produtos).
  // Com talhões planejados, confirma. Depois, Desfazer.
  function limparConteudo(op, g, ctx, acoes) {
    const { plano } = ctx;
    const limpar = () => {
      const antes = { nome: op.nome, dap: op.dap, faseSemDap: op.faseSemDap, fenologia: op.fenologia, prazo: op.prazo, receitas: op.receitas, talhoes: op.talhoes, grupo: g, i: g.operacoes.indexOf(op) };
      op.faseSemDap = faseDe(g, op);
      op.nome = ''; op.dap = null; op.fenologia = ''; op.prazo = null; op.receitas = []; op.talhoes = {};
      let sg = plano.grupos.find(semGrupo);
      const criado = !sg;
      if (!semGrupo(g)) {
        if (criado) { sg = { ...Planos.novoGrupo('Sem grupo', ''), semGrupo: true }; plano.grupos.splice(plano.grupos.indexOf(g), 0, sg); }
        g.operacoes.splice(antes.i, 1);
        sg.operacoes.push(op);
      }
      const ig = semGrupo(g) ? -1 : plano.grupos.indexOf(g);
      if (ig >= 0 && !g.operacoes.length && !fixo(g)) plano.grupos.splice(ig, 1);
      acoes.alterou(); acoes.redesenhar(null);
      Aviso.mostrar('Linha limpa', { acao: 'Desfazer', aoAgir: () => {
        Object.assign(op, { nome: antes.nome, dap: antes.dap, faseSemDap: antes.faseSemDap, fenologia: antes.fenologia, prazo: antes.prazo, receitas: antes.receitas, talhoes: antes.talhoes });
        if (!semGrupo(antes.grupo)) {
          sg.operacoes.splice(sg.operacoes.indexOf(op), 1);
          if (!plano.grupos.includes(antes.grupo)) plano.grupos.splice(Math.max(0, plano.grupos.indexOf(sg)), 0, antes.grupo);
          antes.grupo.operacoes.splice(antes.i, 0, op);
          if (!sg.operacoes.length) plano.grupos.splice(plano.grupos.indexOf(sg), 1);
        }
        acoes.alterou(); acoes.redesenhar(null);
      } });
    };
    const talhoes = Object.keys(op.talhoes || {}).length;
    if (!talhoes) { limpar(); return; }
    Modal.confirmar({
      titulo: 'Limpar o conteúdo da linha?',
      texto: `${esc(op.nome || 'A operação')} já está planejada em ${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'}; esse planejamento também será apagado. A linha fica toda em branco.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Limpar conteúdo', classe: 'perigo', acao: limpar }]
    });
  }

  function abrirMenuLinha(ancora, x, y, opId, ctx, acoes) {
    const achado = acharOp(ctx.plano, opId);
    if (!achado) return;
    const { g, op } = achado;
    const itens = { inserir: () => inserirAbaixo(op, g, ctx, acoes) };
    if (!fixo(g)) {
      itens.excluir = () => excluirOperacao(op.id, ctx, acoes);
      itens.limpar = () => limparConteudo(op, g, ctx, acoes);
    }
    acoes.menu(ancora, x, y, op.nome || 'Linha sem nome', itens);
  }

  // Botão direito na linha (ou tecla de menu / Shift+F10 num campo da linha)
  function aoMenuContexto(e, ctx, acoes) {
    if (ctx.somenteLeitura) return false;
    const tr = e.target.closest('tr[data-est-linha]');
    const vazia = e.target.closest('tr[data-est-fase-vazia]');
    if (!tr && !vazia) return false;
    e.preventDefault();
    if (vazia) {
      acoes.menu(vazia, e.clientX || vazia.getBoundingClientRect().left, e.clientY || vazia.getBoundingClientRect().bottom,
        'Fase vazia', { inserir: () => novaOperacao(vazia.dataset.estFaseVazia, ctx, acoes) });
      return true;
    }
    const caixa = tr.getBoundingClientRect();
    abrirMenuLinha(tr, e.clientX || caixa.left + 24, e.clientY || caixa.bottom, tr.dataset.estLinha, ctx, acoes);
    return true;
  }

  // ----- Eventos (repassados pela Tela 04). Devolvem true quando o evento era daqui. -----
  function aoClicar(e, ctx, acoes) {
    const alvo = e.target.closest('[data-acao^="est-"]');
    if (!alvo) return false;
    // O aviso do topo é só um aviso: fechado, não volta para este plano enquanto a página estiver aberta
    if (alvo.dataset.acao === 'est-fechar-aviso') { ctx.estado.avisoFechado = true; acoes.redesenhar(null); }
    if (alvo.dataset.acao === 'est-nova-op') novaOperacao(alvo.dataset.fase, ctx, acoes);
    if (alvo.dataset.acao === 'est-excluir-op') excluirOperacao(alvo.dataset.op, ctx, acoes);
    if (alvo.dataset.acao === 'est-menu') {
      const caixa = alvo.getBoundingClientRect();
      abrirMenuLinha(alvo, caixa.left, caixa.bottom, alvo.dataset.op, ctx, acoes);
    }
    return true;
  }

  function aoDuploClique(e, ctx, acoes) {
    if (ctx.somenteLeitura) return false;
    const rg = e.target.closest('[data-est-renomear-grupo]');
    if (rg) { renomearGrupo(ctx.plano.grupos.find((x) => x.id === rg.dataset.estRenomearGrupo), acoes); return true; }
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
      // Excluir o grupo: as operações ficam no plano, sem grupo
      if (e.target.value === '__excluir__') {
        e.target.value = g.id;
        excluirGrupo(g, ctx, acoes);
        return true;
      }
      if (e.target.value === '__renomear__') {
        e.target.value = g.id;
        renomearGrupo(g, acoes);
        return true;
      }
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
      if (op.dap !== null) delete op.faseSemDap; // com DAP, a fase volta a vir dele
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

  // excluirGrupo também é usado pelo Planejamento (botão direito na guia), com a mesma regra
  return { desenhar, aoClicar, aoDuploClique, aoTeclar, aoDesfocar, aoMudar, aoMenuContexto, excluirGrupo };
})();
