/*
 * Tela 04.0 — Operações do plano (docs/telas/04.0-operacoes.md)
 * Etapa 1 do plano: as operações vindas do modelo, numa tabela só, na ordem em que acontecem (pré-plantio, plantio,
 * manejo da cultura e colheita, sem faixa com o nome da fase), para revisar antes do planejamento talhão a talhão.
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
  const rotuloTipo = (tipo) => (tipo === 'Sementes' ? 'Plantio' : tipo);

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
    'Fertilidade': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:var(--cor-fertilidade)" aria-hidden="true"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" fill="currentColor"/><path d="M5 19l8-8" stroke="#fff" stroke-width="1.6"/></svg>',
    'Colheita': '<svg viewBox="0 0 24 24" class="tab-op__ico" style="color:var(--cor-colheita)" aria-hidden="true"><path d="M12 21V8M12 8c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4zm0 5c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
  };

  // ----- Desenho -----
  function desenhar(ctx) {
    const { plano } = ctx;
    // Filtro por grupo de operação (barra acima da tabela): '' = Todos. Grupo que sumiu do plano volta a Todos.
    const comOperacao = plano.grupos.filter((g) => g.operacoes.length);
    if (ctx.estado.filtroGrupo && !comOperacao.some((g) => g.id === ctx.estado.filtroGrupo)) ctx.estado.filtroGrupo = '';
    const filtro = ctx.estado.filtroGrupo || '';
    // Uma lista só: pela fase (pré-plantio, plantio, manejo, colheita) e, dentro dela, pelo DAP
    const linhas = emOrdem(plano.grupos.filter((g) => !filtro || g.id === filtro)
      .flatMap((g) => g.operacoes.map((op) => ({ g, op, fase: faseDe(g, op) }))));
    const ler = ctx.somenteLeitura;
    // Caixas de marcar sempre à vista (fora da versão publicada); a lixeira do cabeçalho aparece com alguma marcada e
    // exclui as marcadas. Plantio e Colheita (fixas) não têm caixa. Só operações à vista (filtro) podem estar marcadas.
    const marcar = !ler;
    const visiveis = linhas.filter(({ g }) => !fixo(g)).map(({ op }) => op.id);
    ctx.estado.marcadas = new Set([...(ctx.estado.marcadas || [])].filter((id) => visiveis.includes(id)));
    const marcadas = ctx.estado.marcadas;
    return `
      <section class="estrutura">
        ${ler || ctx.estado.avisoFechado ? '' : `
          <div class="estrutura__aviso" role="note">${Icones.info}
            <p><strong>Revise as operações cadastradas.</strong> Cada operação vira uma Ordem de Serviço (OS) a partir da versão publicada. Se estiver tudo certo, siga para o planejamento.</p>
            <button class="botao-icone estrutura__fechar" type="button" data-acao="est-fechar-aviso" aria-label="Fechar o aviso" title="Fechar">${Icones.fechar}</button>
          </div>`}
        <div class="filtro-grupos" role="group" aria-label="Filtrar por grupo de operação">
          <span class="filtro-grupos__rotulo">Grupo de operação</span>
          <button class="filtro-grupos__botao ${filtro ? '' : 'filtro-grupos__botao--ativo'}" type="button" data-acao="est-filtro" data-grupo=""
                  aria-pressed="${!filtro}">Todos</button>
          ${comOperacao.map((g) => `
            <button class="filtro-grupos__botao ${g.id === filtro ? 'filtro-grupos__botao--ativo' : ''}" type="button" data-acao="est-filtro"
                    data-grupo="${g.id}" aria-pressed="${g.id === filtro}">${semGrupo(g) ? Icones.alerta : ICONE_TIPO[g.tipo] || ''}${esc(semGrupo(g) ? 'Sem grupo de operação' : g.nome)}</button>`).join('')}
          ${ler ? '' : `
            <button class="botao botao--secundario botao--p filtro-grupos__editar" type="button" data-acao="est-grupos"
                    aria-haspopup="dialog" title="Renomear, adicionar ou excluir grupos de operação">${Icones.lapis} Editar</button>`}
        </div>
        <div class="tab-op__caixa">
          <table class="tab-op">
            <colgroup>
              ${marcar ? '<col class="tab-op__c-marcar">' : ''}<col class="tab-op__c-dap"><col class="tab-op__c-fen"><col class="tab-op__c-op"><col class="tab-op__c-grupo"><col class="tab-op__c-prazo">
              ${ler ? '' : '<col class="tab-op__c-acao">'}
            </colgroup>
            <thead><tr>
              ${marcar ? `<th class="tab-op__marcar">${caixaTodas(visiveis, marcadas)}</th>` : ''}
              <th class="tab-op__dap">DAP</th><th>Fenologia</th><th>Operação</th><th>Grupo de operação</th><th>Previsão de conclusão</th>
              ${ler ? '' : `<th class="tab-op__acao">${marcadas.size ? `
                <button class="botao-icone tab-op__lixeira" type="button" data-acao="est-excluir-lote"
                        title="Excluir ${plural(marcadas.size, 'operação marcada', 'operações marcadas')}"
                        aria-label="Excluir ${plural(marcadas.size, 'operação marcada', 'operações marcadas')}">${Icones.lixeira}</button>`
                : '<span class="so-leitor">Ações</span>'}</th>`}
            </tr></thead>
            <tbody>${linhas.map(({ g, op, fase }) => linha(g, op, fase, ctx)).join('')}</tbody>
          </table>
        </div>
        ${ler ? '' : '<p class="tab-op__dica">+ no fim da linha: insere uma linha logo abaixo. Botão direito numa linha (ou ⋯): Inserir · Excluir · Limpar conteúdo. Marque as caixas para excluir várias de uma vez (lixeira no título da tabela).</p>'}
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

  // Caixa do cabeçalho: marca ou desmarca todas as operações à vista (estado intermediário com só algumas)
  function caixaTodas(visiveis, marcadas) {
    const n = marcadas.size;
    const todas = visiveis.length > 0 && n === visiveis.length;
    return `<input class="tab-op__caixa-marcar" type="checkbox" data-acao="est-marcar-todas" ${todas ? 'checked' : ''}
                   ${n && !todas ? 'data-intermediario' : ''} ${visiveis.length ? '' : 'disabled'}
                   aria-label="${todas ? 'Desmarcar todas' : 'Marcar todas as operações à vista'}">`;
  }

  function linha(g, op, fase, ctx) {
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
    const marcar = !somenteLeitura;
    const marcada = marcar && estado.marcadas && estado.marcadas.has(op.id);
    return `
      <tr ${temMenu ? `data-est-linha="${op.id}"` : ''} ${marcada ? 'class="tab-op__linha--marcada"' : ''}>
        ${marcar ? `<td class="tab-op__marcar">${fixo(g) ? '' : `
          <input class="tab-op__caixa-marcar" type="checkbox" data-acao="est-marcar" data-op="${op.id}" ${marcada ? 'checked' : ''}
                 aria-label="Marcar ${esc(nomeTexto)}">`}</td>` : ''}
        <td class="tab-op__dap">${dap}</td>
        <td>${fenologia}</td>
        <td class="tab-op__op">${nome}</td>
        <td>${grupo}</td>
        <td>${previsao}</td>
        ${somenteLeitura ? '' : `<td class="tab-op__acao">${temMenu ? `
          <button class="botao-icone tab-op__inserir" type="button" data-acao="est-inserir" data-op="${op.id}"
                  title="Inserir uma linha abaixo" aria-label="Inserir uma linha abaixo de ${esc(nomeTexto)}">${Icones.mais}</button>
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

  // Grupo que fica sem nenhuma operação continua no plano (para receber operações novas). Só o "Sem grupo",
  // que não é um grupo de verdade, some quando fica vazio. Devolve a posição do removido (para o Desfazer), ou -1.
  function removerSeVazio(plano, g) {
    if (g.operacoes.length || !semGrupo(g)) return -1;
    const i = plano.grupos.indexOf(g);
    plano.grupos.splice(i, 1);
    return i;
  }

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
  function criarLinha(dap, ctx, acoes, abaixoDe) {
    ctx.estado.filtroGrupo = ''; // a linha nova nasce sem grupo: volta a Todos para ela aparecer
    const op = Planos.novaOperacao('', dap);
    if (abaixoDe) op.abaixoDe = abaixoDe;
    semGrupoDoPlano(ctx.plano).operacoes.push(op);
    ctx.estado.renomeandoOp = op.id;
    acoes.alterou(); acoes.redesenhar(null);
  }

  // Excluir operação: sempre confirma (com talhões planejados, diz o impacto); depois, Desfazer. O grupo fica, mesmo vazio.
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
      Aviso.mostrar(`${esc(op.nome || 'Linha')} excluída`, { acao: 'Desfazer', aoAgir: () => {
        if (ig >= 0) plano.grupos.splice(ig, 0, g);
        g.operacoes.splice(i, 0, op);
        acoes.alterou(); acoes.redesenhar(null);
      } });
    };
    const talhoes = Object.keys(op.talhoes || {}).length + Object.keys(op.plantio || {}).length;
    Modal.confirmar({
      titulo: `Excluir ${esc(op.nome || 'a linha sem nome')}?`,
      texto: talhoes ? `Ela já está planejada em ${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'}; esse planejamento também será apagado.`
        : 'A operação sai do plano.',
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir operação', classe: 'perigo', acao: remover }]
    });
  }

  // ----- Excluir em lote (lixeira do cabeçalho) -----
  // Fotografia dos grupos e das operações, para o Desfazer do lote
  function fotografar(plano) {
    const grupos = plano.grupos.map((g) => ({ g, ops: [...g.operacoes] }));
    return () => {
      plano.grupos.splice(0, plano.grupos.length, ...grupos.map((x) => x.g));
      grupos.forEach((x) => x.g.operacoes.splice(0, x.g.operacoes.length, ...x.ops));
    };
  }


  // Excluir as marcadas: sempre confirma, com a lista (e o aviso das planejadas em talhões); depois, Desfazer.
  // Os grupos ficam, mesmo vazios.
  function excluirLote(ctx, acoes) {
    const { plano, estado } = ctx;
    const achados = [...estado.marcadas].map((id) => acharOp(plano, id)).filter(Boolean);
    const n = achados.length;
    const planejada = (op) => Object.keys(op.talhoes || {}).length + Object.keys(op.plantio || {}).length > 0;
    const comTalhoes = achados.filter(({ op }) => planejada(op));
    const excluir = () => {
      const voltar = fotografar(plano);
      const ids = achados.map(({ op }) => op.id);
      achados.forEach(({ g, op }) => { g.operacoes.splice(g.operacoes.indexOf(op), 1); });
      [...new Set(achados.map(({ g }) => g))].forEach((g) => removerSeVazio(plano, g));
      estado.marcadas = new Set();
      acoes.alterou(); acoes.redesenhar(null);
      Aviso.mostrar(plural(n, 'operação excluída', 'operações excluídas'), { acao: 'Desfazer', aoAgir: () => {
        voltar(); estado.marcadas = new Set(ids); acoes.alterou(); acoes.redesenhar(null);
      } });
    };
    Modal.confirmar({
      titulo: `Excluir ${plural(n, 'operação', 'operações')}?`,
      texto: `${!comTalhoes.length ? (n === 1 ? 'A operação sai do plano.' : 'As operações abaixo saem do plano.')
        : `${comTalhoes.length === 1 ? (n === 1 ? 'Ela já está planejada' : '1 delas já está planejada')
          : `${comTalhoes.length} delas já estão planejadas`} em talhões; esse planejamento também será apagado.`}
        <ul class="lote__lista">${achados.map(({ op }) => `<li>${esc(op.nome || 'Sem operação')}${planejada(op) ? ' · <strong>planejada em talhões</strong>' : ''}</li>`).join('')}</ul>`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: n === 1 ? 'Excluir operação' : 'Excluir operações', classe: 'perigo', acao: excluir }]
    });
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
      texto: `${n === 1 ? 'A operação continua' : `As ${n} operações continuam`} no plano, sem grupo de operação. Escolha o grupo de cada uma depois, na etapa Operações.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir grupo', classe: 'perigo', acao: excluir }]
    });
  }

  // ----- Editar grupos de operação (botão Editar, à direita do filtro) -----
  // Modal com os grupos do plano numa tabela: renomear (o nome na própria linha), adicionar ("+ Adicionar grupo", com
  // nome e tipo) e excluir (lixeira: a linha fica riscada e "Manter" volta). Plantio e Colheita são fixos: renomeiam,
  // não se excluem. Nada muda até Salvar; Cancelar descarta. Grupo excluído: as operações ficam "Sem grupo" até o
  // usuário escolher o grupo de cada uma. Depois de salvar, Desfazer volta tudo.
  function editarGrupos(ctx, acoes) {
    const { plano } = ctx;
    const linhas = plano.grupos.filter((g) => !semGrupo(g)).map((g) => ({ g, nome: g.nome, tipo: g.tipo, excluir: false }));
    let erro = '';
    const modal = Modal.abrir(`
      <form class="formulario" novalidate>
        <div class="modal__corpo">
          <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
          <h2 class="modal__titulo" id="modal-titulo">Grupos de operação</h2>
          <p class="modal__subtitulo">Renomeie, adicione ou exclua grupos de operação. As alterações serão aplicadas ao salvar.</p>
          <div data-eg></div>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
          <button class="botao botao--primario" type="submit">Salvar</button>
        </div>
      </form>`, { classe: 'modal--grupos' });
    const form = modal.elemento.querySelector('form');
    const caixa = form.querySelector('[data-eg]');
    const chave = (nome) => Util.normalizar(nome.trim());

    function desenharTabela(foco) {
      const ficam = linhas.filter((l) => !l.excluir);
      const repetidos = new Set(ficam.map((l) => chave(l.nome)).filter((k, i, xs) => k && xs.indexOf(k) !== i));
      caixa.innerHTML = `
        <table class="tabela eg-tabela">
          <colgroup><col><col class="eg-c-tipo"><col class="eg-c-n"><col class="eg-c-acao"></colgroup>
          <thead><tr><th>Nome</th><th>Tipo</th><th class="tabela__numero">Operações</th><th><span class="so-leitor">Excluir</span></th></tr></thead>
          <tbody>${linhas.map((l, i) => {
            const n = l.g ? l.g.operacoes.length : 0;
            const invalido = erro && !l.excluir && (!l.nome.trim() || repetidos.has(chave(l.nome)));
            return `
              <tr class="${l.excluir ? 'eg-linha--excluir' : ''}">
                <td><input class="campo__controle eg-nome ${invalido ? 'campo__controle--erro' : ''}" data-eg-nome="${i}" value="${esc(l.nome)}"
                           placeholder="Nome do grupo" aria-label="Nome do grupo" autocomplete="off" ${l.excluir ? 'disabled' : ''}></td>
                <td>${l.g ? `<span class="eg-tipo">${ICONE_TIPO[l.tipo] || ''}${esc(rotuloTipo(l.tipo))}</span>` : `
                  <select class="campo__controle eg-tipo-sel ${erro && !l.tipo ? 'campo__controle--erro' : ''}" data-eg-tipo="${i}" aria-label="Tipo do grupo">
                    <option value="" ${l.tipo ? '' : 'selected'} disabled>Selecione o tipo</option>
                    ${DADOS.tiposGrupo.filter((t) => t !== 'Colheita').map((t) => `<option value="${t}" ${t === l.tipo ? 'selected' : ''}>${rotuloTipo(t)}</option>`).join('')}
                  </select>`}</td>
                <td class="tabela__numero">${l.g ? n : '—'}</td>
                <td class="eg-acao">${fixo(l) ? '<span class="eg-fixo" title="Grupo fixo: não pode ser excluído">Fixo</span>'
                  : l.excluir ? `<button class="link-acao" type="button" data-eg-manter="${i}">Manter</button>`
                    : `<button class="botao-icone" type="button" data-eg-excluir="${i}" title="Excluir o grupo"
                               aria-label="Excluir o grupo ${esc(l.nome || 'novo')}">${Icones.lixeira}</button>`}</td>
              </tr>
              ${l.excluir && n ? `<tr class="eg-aviso"><td colspan="4">${n === 1 ? 'A operação dele fica' : `As ${n} operações dele ficam`} no plano, sem grupo de operação.</td></tr>` : ''}`;
          }).join('')}</tbody>
        </table>
        <button class="link-acao eg-adicionar" type="button" data-eg-adicionar>${Icones.mais} Adicionar grupo</button>
        ${erro ? `<p class="erro-campo" role="alert">${erro}</p>` : ''}`;
      if (foco) caixa.querySelector(foco)?.focus();
    }

    form.addEventListener('input', (e) => {
      const i = e.target.dataset.egNome;
      if (i !== undefined) linhas[i].nome = e.target.value;
    });
    form.addEventListener('change', (e) => {
      const i = e.target.dataset.egTipo;
      if (i !== undefined) linhas[i].tipo = e.target.value;
    });
    form.addEventListener('click', (e) => {
      const ex = e.target.closest('[data-eg-excluir]');
      if (ex) {
        const i = Number(ex.dataset.egExcluir);
        // Grupo novo (ainda não salvo) só sai da lista; grupo do plano fica riscado até salvar
        if (!linhas[i].g) { linhas.splice(i, 1); desenharTabela('[data-eg-adicionar]'); }
        else { linhas[i].excluir = true; desenharTabela(`[data-eg-manter="${i}"]`); }
        return;
      }
      const ma = e.target.closest('[data-eg-manter]');
      if (ma) { linhas[ma.dataset.egManter].excluir = false; desenharTabela(`[data-eg-nome="${ma.dataset.egManter}"]`); return; }
      if (e.target.closest('[data-eg-adicionar]')) {
        linhas.push({ g: null, nome: '', tipo: '', excluir: false });
        desenharTabela(`[data-eg-nome="${linhas.length - 1}"]`);
      }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ficam = linhas.filter((l) => !l.excluir);
      const nomes = ficam.map((l) => chave(l.nome));
      const repetido = ficam.find((l, i) => nomes[i] && nomes.indexOf(nomes[i]) !== i);
      erro = ficam.some((l) => !l.nome.trim() || (!l.g && !l.tipo)) ? 'Preencha o nome e o tipo de todos os grupos.'
        : repetido ? `Já existe um grupo com o nome ${esc(repetido.nome.trim())}.` : '';
      if (erro) { desenharTabela('.campo__controle--erro'); return; }
      const voltar = fotografar(plano);
      const nomesAntes = plano.grupos.map((g) => [g, g.nome]);
      linhas.forEach((l) => { if (l.g && !l.excluir) l.g.nome = l.nome.trim(); });
      linhas.filter((l) => l.excluir).forEach(({ g }) => {
        if (g.operacoes.length) semGrupoDoPlano(plano).operacoes.push(...g.operacoes);
        plano.grupos.splice(plano.grupos.indexOf(g), 1);
      });
      // Grupos novos entram antes da Colheita, que fica sempre por último
      linhas.filter((l) => !l.g).forEach((l) => {
        const iColheita = plano.grupos.findIndex((g) => g.tipo === 'Colheita');
        plano.grupos.splice(iColheita >= 0 ? iColheita : plano.grupos.length, 0, Planos.novoGrupo(l.nome.trim(), l.tipo));
      });
      modal.fechar();
      acoes.alterou(); acoes.redesenhar(null);
      Aviso.mostrar('Grupos de operação salvos', { acao: 'Desfazer', aoAgir: () => {
        voltar(); nomesAntes.forEach(([g, nome]) => { g.nome = nome; });
        acoes.alterou(); acoes.redesenhar(null);
      } });
    });
    desenharTabela('[data-eg-nome="0"]');
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
  // Inserir: linha nova com o mesmo DAP (fica na mesma fase) (Plantio: DAP 0), sem nome e sem grupo, já com o nome aberto
  function inserirAbaixo(op, g, ctx, acoes) {
    criarLinha(g && g.tipo !== 'Sementes' ? op.dap : 0, ctx, acoes, op.id);
  }

  // Limpar conteúdo: a linha fica toda em branco no mesmo lugar (inclusive o DAP; ela fica na fase em que estava):
  // sem nome, sem grupo, sem fenologia, previsão de conclusão no padrão e sem planejamento (talhões e produtos).
  // Com talhões planejados, confirma. Depois, Desfazer.
  function limparConteudo(op, g, ctx, acoes) {
    const { plano } = ctx;
    const limpar = () => {
      ctx.estado.filtroGrupo = ''; // a linha fica sem grupo: volta a Todos para ela continuar à vista
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
    if (!tr) return false;
    e.preventDefault();
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
    if (alvo.dataset.acao === 'est-filtro') { ctx.estado.filtroGrupo = alvo.dataset.grupo; acoes.redesenhar(null); }
    if (alvo.dataset.acao === 'est-grupos') editarGrupos(ctx, acoes);
    if (alvo.dataset.acao === 'est-marcar') {
      const m = ctx.estado.marcadas;
      if (m.has(alvo.dataset.op)) m.delete(alvo.dataset.op); else m.add(alvo.dataset.op);
      acoes.redesenhar(`[data-acao="est-marcar"][data-op="${alvo.dataset.op}"]`);
    }
    if (alvo.dataset.acao === 'est-marcar-todas') {
      const caixas = [...document.querySelectorAll('[data-acao="est-marcar"]')].map((c) => c.dataset.op);
      ctx.estado.marcadas = alvo.checked ? new Set(caixas) : new Set();
      acoes.redesenhar('[data-acao="est-marcar-todas"]');
    }
    if (alvo.dataset.acao === 'est-excluir-lote') excluirLote(ctx, acoes);
    if (alvo.dataset.acao === 'est-inserir') {
      const a = acharOp(ctx.plano, alvo.dataset.op);
      if (a) inserirAbaixo(a.op, a.g, ctx, acoes);
    }
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
      delete op.abaixoDe; // DAP novo: a linha vai para o lugar dela pelo DAP
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
