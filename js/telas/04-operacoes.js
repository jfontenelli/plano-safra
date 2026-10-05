/*
 * Tela 04 — Operações, grupo Defensivo (docs/telas/04-operacoes-defensivos.md)
 * Plano aberto: cabeçalho com contexto e etapas, lista de operações à esquerda,
 * detalhe da operação à direita e guias de grupo no rodapé.
 * Plano aprovado: somente leitura.
 */
window.Telas = window.Telas || {};

window.Telas.planoOperacoes = (function () {
  const esc = Util.escapar;
  const ETAPAS = [
    { id: 'operacoes',   nome: 'Operações' },
    { id: 'calendario',  nome: 'Calendário Agrícola' },
    { id: 'suprimentos', nome: 'Suprimentos' },
    { id: 'aprovacao',   nome: 'Aprovação' }
  ];
  const UNIDADES = ['L', 'mL', 'kg', 'g', 't'];

  // Estado da tela por plano (grupo e operação abertos etc.), mantido ao navegar
  const estados = {};

  let plano, ui, raiz, etapa, somenteLeitura, talhoesFazenda;

  // ================= Entrada =================
  function desenhar() {
    return '<div class="plano" id="plano-raiz"></div>';
  }

  function aoMostrar(conteudo, p, etapaId) {
    plano = p;
    etapa = ETAPAS.some((e) => e.id === etapaId) ? etapaId : 'operacoes';
    somenteLeitura = plano.status === 'Aprovado';
    talhoesFazenda = DADOS.talhoes[plano.fazenda] || [];
    ui = estados[plano.id] = estados[plano.id] || {
      // Abre no primeiro grupo de Defensivos (o único construído no protótipo); sem ele, no primeiro grupo
      grupoId: (plano.grupos.find(ehDefensivo) || plano.grupos[0] || {}).id || null,
      opPorGrupo: {},          // operação aberta em cada grupo
      listaRecolhida: false,
      modo: 'ver',             // ver | selecionar | ajustar
      marcados: new Set(),
      busca: '',
      renomeandoOp: null,
      renomeandoGrupo: null,
      preCadastro: null,       // { linhaId, produto, principioAtivo, unidade, erro }
      validarOp: null,         // operação cujo "Selecionar talhões" foi clicado com campos faltando
      ajuste: null,            // ajustes em preparo no modo ajustar
      edicao: null,            // modo Editar da lista: { marcadas, nomes, renomeando, nomeAntes }
      receitaPorOp: {},        // receita aberta em cada operação
      rascunho: null,          // cópia da receita aberta, editada até "Salvar receita": { receitaId, produtos }
      renomeandoReceita: null
    };
    ui.edicao = null;          // voltar ao plano sempre abre a lista no modo normal
    if (!somenteLeitura) limparReceitasVazias();
    raiz = conteudo.querySelector('#plano-raiz');
    raiz.addEventListener('click', aoClicar);
    raiz.addEventListener('dblclick', aoDuploClique);
    raiz.addEventListener('change', aoMudar);
    raiz.addEventListener('input', aoDigitar);
    raiz.addEventListener('keydown', aoTeclar);
    raiz.addEventListener('focusin', aoFocar);
    raiz.addEventListener('focusout', aoDesfocar);
    raiz.addEventListener('dragstart', aoArrastar);
    raiz.addEventListener('dragover', aoArrastarSobre);
    raiz.addEventListener('drop', aoSoltar);
    raiz.addEventListener('dragend', () => raiz.querySelectorAll('.guia--alvo').forEach((g) => g.classList.remove('guia--alvo')));
    desenharTudo();
  }

  // ================= Estado atual =================
  function grupoAtual() {
    return plano.grupos.find((g) => g.id === ui.grupoId) || plano.grupos[0] || null;
  }

  // Operações ordenadas pelo DAP padrão (sem DAP no fim)
  function operacoesOrdenadas(grupo) {
    return [...grupo.operacoes].sort((a, b) =>
      (a.dap ?? Infinity) - (b.dap ?? Infinity));
  }

  function opAtual() {
    const grupo = grupoAtual();
    if (!grupo) return null;
    const ops = operacoesOrdenadas(grupo);
    return ops.find((o) => o.id === ui.opPorGrupo[grupo.id]) || ops[0] || null;
  }

  function ehDefensivo(grupo) {
    return grupo && grupo.tipo === 'Defensivos';
  }

  // Toda alteração atualiza "Última atualização" e "Atualizado por" do plano
  function alterou() {
    plano.atualizadoEm = Util.hojeISO();
    plano.atualizadoPor = DADOS.usuario.nome;
  }

  function sairDosModos() {
    ui.modo = 'ver';
    ui.marcados = new Set();
    ui.ajuste = null;
    ui.ajusteFeito = false;  // modo edição dos talhões: já aplicou algo (Cancelar vira "Concluir edição")
    ui.copiaEdicao = null;   // como a operação estava ao entrar no modo edição (para "Cancelar edição")
  }

  // Guarda receitas e talhões da operação ao entrar no modo edição
  function guardarCopiaEdicao(op) {
    ui.copiaEdicao = {
      opId: op.id,
      receitas: structuredClone(op.receitas),
      talhoes: structuredClone(op.talhoes),
      atualizadoEm: plano.atualizadoEm,
      atualizadoPor: plano.atualizadoPor
    };
  }

  // "Cancelar edição": desfaz tudo o que foi aplicado desde que entrou no modo edição
  function cancelarEdicao(op) {
    const c = ui.copiaEdicao;
    if (c && op && c.opId === op.id) {
      op.receitas = c.receitas;
      op.talhoes = c.talhoes;
      plano.atualizadoEm = c.atualizadoEm;
      plano.atualizadoPor = c.atualizadoPor;
    }
    sairDosModos(); desenharTudo();
    Aviso.mostrar('Edição cancelada. As alterações foram descartadas.');
  }

  // ================= Desenho =================
  // Tudo acima das guias fica numa área com rolagem própria; as guias ficam fixas embaixo,
  // fora dela, para a barra de rolagem terminar no topo do rodapé.
  function desenharTudo() {
    const rolagemAntes = raiz.querySelector('.plano__rolagem')?.scrollTop || 0;
    const listaAntes = raiz.querySelector('.ops-lista__itens')?.scrollTop || 0;
    raiz.innerHTML = `
      <div class="plano__rolagem">
        ${cabecalho()}
        ${etapa === 'operacoes' ? corpoOperacoes() : etapaEmConstrucao()}
      </div>
      ${etapa === 'operacoes' ? rodapeGrupos() : ''}
    `;
    // Redesenhar não pode jogar a página (nem a lista de operações) de volta ao topo
    raiz.querySelector('.plano__rolagem').scrollTop = rolagemAntes;
    const lista = raiz.querySelector('.ops-lista__itens');
    if (lista) lista.scrollTop = listaAntes;
    raiz.querySelectorAll('[data-indeterminado]').forEach((el) => { el.indeterminate = true; });
    const foco = raiz.querySelector('[data-foco-inicial]');
    if (foco) { foco.focus({ preventScroll: true }); foco.select?.(); }
  }

  function htmlParaElemento(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  // Redesenha e devolve o foco ao controle equivalente (o anterior foi recriado)
  function desenharMantendoFoco(seletor) {
    desenharTudo();
    raiz.querySelector(seletor)?.focus({ preventScroll: true });
  }

  // O status no subtítulo alterna entre "Em construção" e "Aprovado" ao clicar (só no protótipo)
  function cabecalho() {
    const contexto = [`Safra ${plano.safra}`, plano.empresa, `Fazenda ${plano.fazenda}`, `Cultura ${plano.cultura}`];
    return `
      <header class="plano__cabecalho">
        <a class="plano__titulo" href="#/plano-safra" title="Voltar para a Visão Geral">Plano de Safra</a>
        <p class="plano__contexto">${contexto.map(esc).join('<span class="plano__ponto">·</span>')}
          <button class="status status--botao ${somenteLeitura ? 'status--aprovado' : 'status--construcao'}" type="button"
                  data-acao="alternar-status" title="Protótipo: clique para alternar o status"
                  aria-label="Status: ${esc(plano.status)}. Protótipo: clique para alternar o status">${esc(plano.status)}</button></p>
        <nav class="etapas" aria-label="Etapas do plano">
          ${ETAPAS.map((e) => `
            <a class="etapa ${e.id === etapa ? 'etapa--ativa' : ''}" href="#/plano/${plano.id}/${e.id}"
               ${e.id === etapa ? 'aria-current="page"' : ''}>${e.nome}</a>`).join('')}
        </nav>
      </header>
      ${somenteLeitura ? `
        <p class="faixa-leitura">${Icones.cadeado} Plano aprovado: somente leitura. O plano aprovado não muda durante a safra.</p>` : ''}
    `;
  }

  function etapaEmConstrucao() {
    const nome = ETAPAS.find((e) => e.id === etapa).nome;
    return `
      <section class="em-construcao">
        <div class="em-construcao__icone" aria-hidden="true">${Icones.casa}</div>
        <p class="em-construcao__subtitulo">${nome}</p>
        <h2 class="em-construcao__titulo">Em construção</h2>
        <p class="em-construcao__texto">Esta etapa ainda não foi construída no protótipo.</p>
      </section>
    `;
  }

  function corpoOperacoes() {
    const grupo = grupoAtual();
    if (!grupo) {
      return `
        <div class="ops ops--vazio">
          <div class="cartao vazio">
            <h2 class="vazio__titulo">Nenhum grupo de operações</h2>
            <p class="vazio__texto">${somenteLeitura ? 'Este plano não tem grupos de operações.'
              : 'Use o <strong>+</strong> no rodapé, em "Grupo de operações", para criar o primeiro grupo.'}</p>
          </div>
        </div>`;
    }
    return `
      <div class="ops">
        ${listaOperacoes(grupo)}
        <section class="ops-detalhe" aria-live="polite">${detalhe(grupo)}</section>
      </div>
    `;
  }

  // ----- Lista lateral -----
  function listaOperacoes(grupo) {
    const atual = opAtual();
    // Minimizada: só os DAPs; o nome da operação aparece ao passar o mouse
    if (ui.listaRecolhida) {
      return `
        <aside class="cartao ops-lista ops-lista--recolhida" aria-label="Operações do grupo (só DAP)">
          <button class="botao-icone" type="button" data-acao="alternar-lista" title="Mostrar operações"
                  aria-label="Mostrar lista de operações">${Icones.expandir}</button>
          <span class="ops-lista__rotulo-dap">DAP</span>
          <ul class="ops-lista__itens">
            ${operacoesOrdenadas(grupo).map((op) => {
              const ativo = atual && op.id === atual.id;
              return `
                <li class="ops-item ops-item--dap ${ativo ? 'ops-item--ativo' : ''}">
                  <button class="ops-item__nome" type="button" data-acao="abrir-op" data-op="${op.id}"
                          ${ativo ? 'aria-current="true"' : ''} title="${esc(op.nome)}"
                          aria-label="${esc(op.nome)}, DAP ${op.dap ?? 'não informado'}">${op.dap ?? '—'}</button>
                </li>`;
            }).join('')}
          </ul>
          ${somenteLeitura ? '' : `
            <button class="botao-icone ops-lista__nova-min" type="button" data-acao="nova-op" title="Nova operação"
                    aria-label="Nova operação">${Icones.mais}</button>`}
        </aside>`;
    }
    const ed = ui.edicao;
    const ops = operacoesOrdenadas(grupo);
    return `
      <aside class="cartao ops-lista ${ed ? 'ops-lista--editando' : ''}" aria-label="Operações do grupo">
        <div class="ops-lista__topo">
          <h2 class="rotulo-secao">Operações</h2>
          ${ed ? '' : botaoEditar(grupo)}
          <span class="ops-lista__rotulo-dap">DAP</span>
          ${ed ? '' : `
            <button class="botao-icone" type="button" data-acao="alternar-lista" title="Recolher lista"
                    aria-label="Recolher lista de operações">${Icones.recolher}</button>`}
        </div>
        ${ed ? caixaTodos(ops) : ''}
        <ul class="ops-lista__itens">
          ${ops.map((op) => ed ? itemEdicao(op, atual && op.id === atual.id)
                               : itemOperacao(op, atual && op.id === atual.id)).join('')}
        </ul>
        ${somenteLeitura || ed ? '' : `
          <button class="link-acao ops-lista__nova" type="button" data-acao="nova-op">${Icones.mais} Nova operação</button>`}
        ${grupo.operacoes.length === 0 ? '<p class="ops-lista__vazia">Nenhuma operação neste grupo.</p>' : ''}
        ${ed ? barraEdicao() : ''}
      </aside>
    `;
  }

  // Lápis entre OPERAÇÕES e DAP. Plano aprovado: aparência desabilitada, mas com foco e dica
  // (aria-disabled em vez de disabled, para a dica aparecer no mouse e no teclado).
  function botaoEditar(grupo) {
    if (grupo.operacoes.length === 0) return '';
    if (somenteLeitura) {
      return `
        <button class="botao-icone ops-lista__editar dica" type="button" data-acao="editar-ops" aria-disabled="true"
                data-dica="Plano aprovado: operações não podem ser editadas" aria-label="Editar operações"
                aria-describedby="dica-editar">${Icones.lapis}</button>
        <span class="so-leitor" id="dica-editar">Plano aprovado: operações não podem ser editadas</span>`;
    }
    return `
      <button class="botao-icone ops-lista__editar dica" type="button" data-acao="editar-ops"
              data-dica="Editar operações" aria-label="Editar operações">${Icones.lapis}</button>`;
  }

  function itemOperacao(op, ativo) {
    return `
      <li class="ops-item ${ativo ? 'ops-item--ativo' : ''}">
        <button class="ops-item__nome" type="button" data-acao="abrir-op" data-op="${op.id}"
                ${ativo ? 'aria-current="true"' : ''} title="${esc(op.nome)}">${esc(op.nome)}</button>
        <span class="ops-item__dap">${op.dap ?? '—'}</span>
      </li>`;
  }

  // ----- Modo Editar da lista -----
  // Caixa de seleção só pelo clique nela; o nome fica para o duplo clique (renomear).
  function nomeEmEdicao(op) {
    return ui.edicao.nomes[op.id] ?? op.nome;
  }

  function caixaTodos(ops) {
    const n = ops.filter((o) => ui.edicao.marcadas.has(o.id)).length;
    return `
      <label class="ops-lista__todos">
        <input type="checkbox" data-acao="ed-marcar-todos" ${n && n === ops.length ? 'checked' : ''}
               ${n && n < ops.length ? 'data-indeterminado' : ''}> Todos
      </label>`;
  }

  function itemEdicao(op, ativo) {
    const ed = ui.edicao;
    const nome = nomeEmEdicao(op);
    const nomeHtml = ed.renomeando === op.id
      // Área de texto que cresce com o nome, para mostrá-lo inteiro (sem truncar); Enter não quebra linha
      ? `<textarea class="campo__controle ops-item__nome-campo" data-campo="ed-nome" data-op="${op.id}" rows="2"
                   aria-label="Nome da operação" data-foco-inicial>${esc(nome)}</textarea>`
      : `<button class="ops-item__nome ${op.id in ed.nomes ? 'ops-item__nome--alterado' : ''}" type="button"
                 data-ed-nome="${op.id}" title="Clique duas vezes para renomear"
                 aria-label="${esc(nome)}. Pressione Enter para renomear">${esc(nome)}</button>`;
    return `
      <li class="ops-item ops-item--editar ${ativo ? 'ops-item--ativo' : ''}">
        <input type="checkbox" data-acao="ed-marcar" data-op="${op.id}" ${ed.marcadas.has(op.id) ? 'checked' : ''}
               aria-label="Selecionar ${esc(nome)}">
        ${nomeHtml}
        <span class="ops-item__dap">${op.dap ?? '—'}</span>
      </li>`;
  }

  function barraEdicao() {
    const n = ui.edicao.marcadas.size;
    return `
      <div class="ops-lista__barra">
        <button class="botao botao--secundario botao--p" type="button" data-acao="ed-cancelar">Cancelar</button>
        <button class="botao botao--perigo-leve botao--p" type="button" data-acao="ed-excluir" ${n ? '' : 'disabled'}>Excluir (${n})</button>
        <button class="botao botao--primario botao--p" type="button" data-acao="ed-salvar"
                ${Object.keys(ui.edicao.nomes).length ? '' : 'disabled'}>Salvar</button>
      </div>`;
  }

  // Salvar só fica ativo com algum nome alterado; atualizado enquanto se digita, sem redesenhar
  function registrarNome(op, valor) {
    const v = valor.trim();
    if (!v || v === op.nome) delete ui.edicao.nomes[op.id];
    else ui.edicao.nomes[op.id] = v;
    const salvar = raiz.querySelector('[data-acao="ed-salvar"]');
    if (salvar) salvar.disabled = !Object.keys(ui.edicao.nomes).length;
  }

  function comecarRenomear(id) {
    const op = grupoAtual().operacoes.find((o) => o.id === id);
    if (!op) return;
    ui.edicao.renomeando = id;
    ui.edicao.nomeAntes = ui.edicao.nomes[id];
    desenharTudo();
  }

  function sairDaEdicao() {
    ui.edicao = null;
  }

  // Nome da operação no card; abre em edição quando a operação acaba de ser criada
  function nomeOperacao(op) {
    if (ui.renomeandoOp === op.id) {
      return `<input class="campo__controle op-cabecalho__nome-campo" data-campo="nome-op" value="${esc(op.nome)}"
                     aria-label="Nome da operação" data-foco-inicial>`;
    }
    return `<h2 class="op-cabecalho__nome">${esc(op.nome)}</h2>`;
  }

  // ----- Detalhe -----
  function detalhe(grupo) {
    const op = opAtual();
    if (!op) {
      return `<div class="cartao vazio"><p class="vazio__texto">${somenteLeitura
        ? 'Nenhuma operação neste grupo.' : 'Nenhuma operação neste grupo. Use "+ Nova operação" para criar.'}</p></div>`;
    }
    if (!ehDefensivo(grupo)) {
      return `
        <div class="cartao op-cabecalho">
          <div class="op-cabecalho__linha">
            ${nomeOperacao(op)}
            <span class="op-cabecalho__dap-texto">DAP: <strong>${op.dap ?? '—'}</strong></span>
          </div>
        </div>
        <div class="cartao">
          <section class="em-construcao em-construcao--compacto">
            <div class="em-construcao__icone" aria-hidden="true">${Icones.casa}</div>
            <p class="em-construcao__subtitulo">Grupo ${esc(grupo.nome)}${grupo.tipo ? ` · tipo ${esc(grupo.tipo)}` : ' · sem tipo'}</p>
            <h2 class="em-construcao__titulo">Em construção</h2>
            <p class="em-construcao__texto">Neste protótipo, só o grupo do tipo Defensivos tem o detalhe da operação.</p>
          </section>
        </div>`;
    }
    return `
      ${cabecalhoOperacao(op)}
      ${recomendacao(op)}
      ${tabelaTalhoes(op)}
    `;
  }

  function cabecalhoOperacao(op) {
    const r = Planos.resumo(op, talhoesFazenda);
    const erroDap = errosVisiveis(op).dap;
    const dap = somenteLeitura
      ? `<span class="campo__valor">${op.dap ?? '—'}</span>`
      : `<input class="campo__controle op-cabecalho__dap ${erroDap ? 'campo__controle--erro' : ''}" id="op-dap" type="text" inputmode="numeric"
                data-campo="op-dap" value="${op.dap ?? ''}" placeholder="—" ${erroDap ? 'aria-invalid="true"' : ''}>
         ${erroDap ? '<p class="erro-campo">Informação obrigatória</p>' : ''}`;
    const fenologia = somenteLeitura
      ? `<span class="campo__valor">${op.fenologia || '—'}</span>`
      : `<select class="campo__controle op-cabecalho__fenologia" id="op-fenologia" data-campo="op-fenologia">
           <option value="">—</option>
           ${DADOS.fenologia.map((f) => `<option ${f === op.fenologia ? 'selected' : ''}>${f}</option>`).join('')}
         </select>`;
    const resumo = `
        <ul class="op-resumo" aria-label="Resumo da operação">
          <li>${Icones.mapa}<strong>${Util.area(r.area).replace(' ha', '')}</strong> ha</li>
          <li>${Icones.talhoes}<strong>${r.talhoes}</strong> ${r.talhoes === 1 ? 'talhão' : 'talhões'}</li>
          ${r.semOperacao ? `<li class="op-resumo--alerta">${Icones.alerta}<strong>${r.semOperacao}</strong> sem operação</li>` : ''}
          ${r.semDose ? `<li class="op-resumo--alerta">${Icones.alerta}<strong>${r.semDose}</strong> sem dose</li>` : ''}
        </ul>`;
    // Linha 1: nome, DAP e fenologia. Linha 2: resumo, à esquerda. Renomear e excluir ficam no modo Editar da lista.
    return `
      <div class="cartao op-cabecalho">
        <div class="op-cabecalho__linha">
          ${nomeOperacao(op)}
          <div class="op-cabecalho__campos">
            <div class="campo campo--inline"><label class="campo__rotulo" for="op-dap">DAP</label>${dap}</div>
            <div class="campo campo--inline"><label class="campo__rotulo" for="op-fenologia">Fenologia</label>${fenologia}</div>
          </div>
        </div>
        ${resumo}
      </div>`;
  }

  // ----- Preenchimento mínimo para "Aplicar nos talhões" -----
  // DAP, ao menos uma linha na receita e, em cada linha, produto comercial e dose padrão
  // (a dose é do produto; o princípio ativo só ajuda a encontrar o produto).
  function errosRecomendacao(op) {
    const vazio = (v) => v === null || v === undefined || v === '';
    const r = receitaAtual(op);
    const linhas = r ? r.produtos.filter(Planos.linhaPreenchida) : [];
    const porLinha = {};
    linhas.forEach((l) => {
      const e = { produto: !l.produto, dose: vazio(l.dose) };
      if (e.produto || e.dose) porLinha[l.id] = e;
    });
    const erros = { dap: vazio(op.dap), semLinhas: linhas.length === 0, linhas: porLinha };
    erros.algum = erros.dap || erros.semLinhas || Object.keys(porLinha).length > 0;
    return erros;
  }

  // Erros só aparecem depois que o usuário clicou em "Aplicar nos talhões"
  function errosVisiveis(op) {
    return ui.validarOp === op.id ? errosRecomendacao(op) : { linhas: {} };
  }

  // ----- Receitas da operação -----
  // Receita agronômica = conjunto de produtos + doses padrão. A composição de produtos determina
  // a identidade da receita; a dose pode variar por talhão sem alterar a identidade da receita.
  function receitaAtual(op) {
    if (!op || !op.receitas.length) return null;
    return op.receitas.find((r) => r.id === ui.receitaPorOp[op.id]) || op.receitas[0];
  }

  // A receita aberta é editada numa cópia (rascunho) até "Salvar receita"
  function rascunho(op) {
    const r = receitaAtual(op);
    if (!r) return null;
    if (!ui.rascunho || ui.rascunho.receitaId !== r.id) {
      ui.rascunho = { receitaId: r.id, produtos: r.produtos.map((l) => ({ ...l })) };
      if (!ui.rascunho.produtos.length) ui.rascunho.produtos.push(Planos.novaLinha());
    }
    return ui.rascunho;
  }

  function assinatura(linhas) {
    return JSON.stringify(linhas.filter(Planos.linhaPreenchida)
      .map((l) => [l.id, l.principioAtivo, l.produto, l.unidade, l.dose, l.preCadastro]));
  }

  function rascunhoAlterado(op) {
    const r = receitaAtual(op);
    return !!(r && ui.rascunho && ui.rascunho.receitaId === r.id &&
              assinatura(ui.rascunho.produtos) !== assinatura(r.produtos));
  }

  // Receita sem nenhuma linha preenchida (nem produto, nem princípio ativo) e sem talhões
  function receitaVazia(op, r) {
    return !r.produtos.some(Planos.linhaPreenchida) && !Planos.talhoesDaReceita(op, r).length;
  }

  // Ao voltar para a tela (ex.: depois de outra etapa), exclui as receitas vazias que ficaram para trás,
  // menos a que está em edição com algum produto ainda não salvo
  function limparReceitasVazias() {
    const emEdicao = ui.rascunho && ui.rascunho.produtos.some(Planos.linhaPreenchida) ? ui.rascunho.receitaId : null;
    plano.grupos.forEach((g) => g.operacoes.forEach((op) => {
      op.receitas.filter((r) => r.id !== emEdicao && receitaVazia(op, r)).forEach((r) => {
        op.receitas.splice(op.receitas.indexOf(r), 1);
        if (ui.receitaPorOp[op.id] === r.id) delete ui.receitaPorOp[op.id];
        if (ui.rascunho && ui.rascunho.receitaId === r.id) ui.rascunho = null;
      });
    }));
  }

  // Antes de trocar de receita, operação ou grupo: confirma o descarte das alterações não salvas
  // e exclui a receita que ficou sem nenhum produto (receita vazia não fica no sistema).
  function sairDaReceita(depois, { removerVazia = true } = {}) {
    const op = opAtual();
    const r = receitaAtual(op);
    const seguir = () => {
      ui.rascunho = null; ui.preCadastro = null; ui.validarOp = null; ui.renomeandoReceita = null;
      if (removerVazia && r && receitaVazia(op, r)) {
        op.receitas.splice(op.receitas.indexOf(r), 1);
        delete ui.receitaPorOp[op.id];
      }
      depois();
    };
    if (!rascunhoAlterado(op)) { seguir(); return; }
    Modal.confirmar({
      titulo: `Descartar as alterações de ${esc(r.nome)}?`,
      texto: 'As alterações não salvas na recomendação serão perdidas.',
      botoes: [{ rotulo: 'Continuar editando' }, { rotulo: 'Descartar', classe: 'perigo', acao: seguir }]
    });
  }

  // ----- Recomendação agronômica -----
  function recomendacao(op) {
    const r = receitaAtual(op);
    return `
      <section class="cartao recomendacao" aria-labelledby="titulo-rec">
        <div class="recomendacao__topo">
          <h3 class="rotulo-secao" id="titulo-rec">Recomendação agronômica</h3>
        </div>
        ${listaReceitas(op, r)}
        ${r ? corpoReceita(op, r) : `
          <p class="recomendacao__vazia">Nenhuma recomendação nesta operação.${somenteLeitura ? '' : ' Use "+ Nova recomendação" para criar.'}</p>`}
      </section>`;
  }

  // Receita 1 | Receita 2 | + Nova receita · lixeira na ponta (age sobre a receita aberta)
  function listaReceitas(op, atual) {
    const guias = op.receitas.map((r) => {
      const ativa = atual && r.id === atual.id;
      if (ui.renomeandoReceita === r.id) {
        return `<input class="campo__controle campo--compacto receitas__nome-campo" data-campo="nome-receita"
                       value="${esc(r.nome)}" aria-label="Nome da recomendação" data-foco-inicial>`;
      }
      return `
        <button class="receitas__guia ${ativa ? 'receitas__guia--ativa' : ''}" type="button" role="tab"
                aria-selected="${ativa ? 'true' : 'false'}" data-acao="abrir-receita" data-receita="${r.id}"
                title="${somenteLeitura || ui.modo === 'ajustar' ? esc(r.nome) : 'Clique duas vezes para renomear'}">${esc(r.nome)}</button>`;
    }).join('');
    return `
      <div class="receitas">
        <div class="receitas__guias" role="tablist" aria-label="Recomendações da operação">${guias}</div>
        ${somenteLeitura || ui.modo === 'ajustar' ? '' : `
          <button class="link-acao receitas__nova" type="button" data-acao="nova-receita">${Icones.mais} Nova recomendação</button>
          ${atual ? `
            <button class="botao-icone receitas__excluir" type="button" data-acao="excluir-receita"
                    title="Excluir a ${esc(atual.nome)}" aria-label="Excluir a ${esc(atual.nome)}">${Icones.lixeira}</button>` : ''}`}
      </div>`;
  }

  // Tabela da receita aberta: Princípio ativo · Produto comercial · Unid. · Dose padrão
  function corpoReceita(op, r) {
    // No modo edição da tabela de talhões, a receita fica só para consulta (sem botões)
    const leitura = somenteLeitura || ui.modo === 'ajustar';
    const linhas = leitura ? r.produtos.filter(Planos.linhaPreenchida) : rascunho(op).produtos;
    const erros = errosVisiveis(op);
    return `
      <div class="recomendacao__corpo">
        <div class="recomendacao__tabela">
          <table class="tabela tabela--compacta tabela-rec">
            <thead><tr>
              <th>Princípio ativo</th><th>Produto comercial</th><th>Unid.</th><th class="tabela__numero">Dose padrão</th>
              ${leitura ? '' : '<th><span class="so-leitor">Remover</span></th>'}
            </tr></thead>
            <tbody>
              ${linhas.length ? linhas.map((l) => linhaRecomendacao(l, erros.linhas[l.id], leitura)).join('')
                : '<tr><td class="tabela__vazia" colspan="5">Nenhum produto na recomendação.</td></tr>'}
            </tbody>
          </table>
          ${erros.semLinhas ? '<p class="erro-campo">Informe pelo menos um produto.</p>' : ''}
          ${leitura ? '' : acoesReceita(op)}
        </div>
      </div>`;
  }

  // À esquerda: Aplicar nos talhões (só com a receita salva). À direita: Salvar receita e + Adicionar produto
  function acoesReceita(op) {
    const alterada = rascunhoAlterado(op);
    return `
      <div class="recomendacao__acoes">
        ${ui.modo === 'selecionar' || alterada ? '' : `
          <button class="botao botao--primario recomendacao__aplicar" type="button" data-acao="aplicar-receita">
            ${Icones.mapa} Aplicar nos talhões</button>`}
        ${ui.modo === 'selecionar' ? '' : `
          <button class="botao ${alterada ? 'botao--primario' : 'botao--secundario'}" type="button"
                  data-acao="salvar-receita" ${alterada ? '' : 'disabled'}>Salvar recomendação</button>`}
        <button class="botao botao--secundario" type="button" data-acao="adicionar-linha">${Icones.mais} Adicionar produto</button>
      </div>`;
  }

  // "Fox Xpro (L/ha)"; sem produto comercial, só o princípio ativo (não há unidade)
  function rotuloProduto(l) {
    const u = Planos.unidadeDose(l);
    return `${esc(Planos.nomeLinha(l))}${u ? ` (${u})` : ''}`;
  }

  function etiquetaPre(linha) {
    return linha.preCadastro ? '<span class="etiqueta-pre">Pré-cadastro</span>' : '';
  }

  function linhaRecomendacao(l, erro = {}, leitura = somenteLeitura) {
    if (leitura) {
      return `
        <tr>
          <td>${esc(l.principioAtivo || '—')}</td>
          <td>${esc(l.produto || '—')} ${etiquetaPre(l)}</td>
          <td>${Planos.unidadeDose(l)}</td>
          <td class="tabela__numero">${Util.dose(l.dose) || '—'}</td>
        </tr>`;
    }
    if (ui.preCadastro && ui.preCadastro.linhaId === l.id) return linhaPreCadastro(l);

    // Sem produto comercial não há unidade nem dose: o princípio ativo só filtra os produtos
    const semProduto = !l.produto;
    return `
      <tr data-linha="${l.id}">
        <td>${combo(l, 'pa', l.principioAtivo, 'Buscar princípio ativo', false)}</td>
        <td>${combo(l, 'produto', l.produto, 'Buscar produto', erro.produto)} ${etiquetaPre(l)}
          ${erro.produto ? '<p class="erro-campo">Escolha o produto comercial</p>' : ''}</td>
        <td><span class="tabela-rec__unidade">${Planos.unidadeDose(l) || '—'}</span></td>
        <td class="tabela__numero" ${semProduto ? 'title="Escolha o produto comercial para informar a dose"' : ''}>
          <input class="campo__controle campo--compacto campo--dose ${erro.dose && !semProduto ? 'campo__controle--erro' : ''}" type="text" inputmode="decimal"
                 data-campo="linha-dose" value="${Util.dose(l.dose)}" placeholder="—" aria-label="Dose padrão"
                 ${semProduto ? 'disabled aria-describedby="dica-dose-produto"' : ''} ${erro.dose && !semProduto ? 'aria-invalid="true"' : ''}>
          ${erro.dose && !semProduto ? '<p class="erro-campo">Informação obrigatória</p>' : ''}
        </td>
        <td class="tabela__acao">
          <button class="botao-icone botao-icone--p" type="button" data-acao="remover-linha" title="Remover produto"
                  aria-label="Remover ${esc(Planos.nomeLinha(l))}">${Icones.lixeira}</button>
          ${semProduto ? '<span class="so-leitor" id="dica-dose-produto">Escolha o produto comercial para informar a dose</span>' : ''}
        </td>
      </tr>`;
  }

  function combo(linha, tipo, valor, placeholder, comErro) {
    return `
      <div class="combo">
        <input class="campo__controle campo--compacto ${comErro ? 'campo__controle--erro' : ''}" type="text" data-combo="${tipo}" value="${esc(valor || '')}"
               placeholder="${placeholder}" autocomplete="off" role="combobox" aria-expanded="false"
               aria-label="${tipo === 'pa' ? 'Princípio ativo' : 'Produto comercial'}">
        <div class="combo__lista" role="listbox" hidden></div>
      </div>`;
  }

  // A própria linha vira um mini-formulário de pré-cadastro
  function linhaPreCadastro(l) {
    const pc = ui.preCadastro;
    return `
      <tr data-linha="${l.id}" class="tabela-rec__pre">
        <td colspan="5">
          <div class="pre-cadastro">
            <p class="pre-cadastro__titulo">Pré-cadastro de defensivo
              <span class="pre-cadastro__ajuda">Informe o produto comercial e a unidade. O princípio ativo é opcional.</span></p>
            <div class="pre-cadastro__campos">
              <input class="campo__controle campo--compacto" data-pre="produto" value="${esc(pc.produto)}" placeholder="Produto comercial" aria-label="Produto comercial">
              <input class="campo__controle campo--compacto" data-pre="principioAtivo" value="${esc(pc.principioAtivo)}" placeholder="Princípio ativo" aria-label="Princípio ativo">
              <select class="campo__controle campo--compacto" data-pre="unidade" aria-label="Unidade" required>
                <option value="" ${pc.unidade ? '' : 'selected'} disabled>Unidade</option>
                ${UNIDADES.map((u) => `<option ${u === pc.unidade ? 'selected' : ''}>${u}</option>`).join('')}
              </select>
              <button class="botao botao--secundario botao--p" type="button" data-acao="cancelar-pre">Cancelar</button>
              <button class="botao botao--primario botao--p" type="button" data-acao="salvar-pre">Salvar pré-cadastro</button>
            </div>
            ${pc.erro ? `<p class="campo__erro">${pc.erro}</p>` : ''}
          </div>
        </td>
      </tr>`;
  }

  // ----- Talhões da recomendação agronômica -----
  function tabelaTalhoes(op) {
    const colunas = Planos.colunasDose(op);
    const modo = ui.modo;
    let titulo = 'Talhões da recomendação agronômica';
    if (modo === 'selecionar') titulo = `Selecione os talhões que recebem: ${esc(receitaAtual(op).nome)}`;
    if (modo === 'ajustar') titulo = 'Editar talhões';

    const ferramentas = modo !== 'selecionar' ? `
      <div class="talhoes__ferramentas">
        ${somenteLeitura || modo === 'ajustar' ? '' : `
          <button class="botao-icone botao-icone--borda dica dica--direita" type="button" data-acao="ajustar-talhoes"
                  data-dica="Editar talhões" aria-label="Editar talhões">${Icones.lapis}</button>`}
        <label class="busca">${Icones.busca}
          <input class="busca__campo" type="search" data-campo="busca" value="${esc(ui.busca)}" placeholder="Buscar talhão" aria-label="Buscar talhão">
        </label>
      </div>` : '';

    const comCaixa = modo !== 'ver';
    return `
      <section class="cartao talhoes" aria-labelledby="titulo-talhoes">
        <div class="talhoes__topo">
          <h3 class="rotulo-secao ${modo !== 'ver' ? 'rotulo-secao--destaque' : ''}" id="titulo-talhoes">${titulo}</h3>
          ${ferramentas}
        </div>
        ${modo === 'ajustar' ? '' : legendaTalhoes(op)}
        <div class="tabela-rolagem">
          <table class="tabela tabela--compacta tabela-talhoes">
            <thead><tr>
              ${comCaixa ? `<th class="tabela__marcar"><input type="checkbox" data-acao="marcar-todos" aria-label="Marcar todos"
                   ${todosMarcados(op) ? 'checked' : ''}></th>` : ''}
              <th>Talhão</th><th class="tabela__numero">Área</th>
              ${colunas.map((l) => `<th class="tabela__numero">${rotuloProduto(l)} ${etiquetaPre(l)}</th>`).join('')}
            </tr></thead>
            <tbody id="talhoes-linhas">${linhasTalhoes(op, colunas)}</tbody>
          </table>
        </div>
        ${rodapeTalhoes(op)}
      </section>`;
  }

  // Legenda das cores: cada item só aparece quando existe ao menos 1 talhão nessa situação
  function legendaTalhoes(op) {
    const algumTalhao = Object.keys(op.talhoes).length > 0;
    const laranja = algumTalhao && talhoesFazenda.some((t) => Planos.statusTalhao(op, t.nome) !== 'Completo');
    const cinza = !algumTalhao && talhoesFazenda.length > 0;
    if (!laranja && !cinza) return '';
    return `
      <p class="talhoes__legenda">
        ${laranja ? '<span class="talhoes__cor talhoes__cor--pendente" aria-hidden="true"></span>Sem operação ou sem dose' : ''}
        ${cinza ? '<span class="talhoes__cor talhoes__cor--sem" aria-hidden="true"></span>Operação ainda não aplicada em nenhum talhão' : ''}
      </p>`;
  }

  function talhoesMarcaveis(op) {
    // Selecionar e editar: todos os talhões da fazenda (inclusive os que ainda não recebem a operação)
    return talhoesFazenda;
  }

  function todosMarcados(op) {
    const lista = talhoesMarcaveis(op);
    return lista.length > 0 && lista.every((t) => ui.marcados.has(t.nome));
  }

  function linhasTalhoes(op, colunas) {
    if (!talhoesFazenda.length) {
      return `<tr><td class="tabela__vazia" colspan="${colunas.length + 3}">Nenhum talhão cadastrado na fazenda ${esc(plano.fazenda)}.</td></tr>`;
    }
    const busca = Util.normalizar(ui.busca.trim());
    const visiveis = talhoesFazenda.filter((t) => !busca || Util.normalizar(t.nome).includes(busca));
    if (!visiveis.length) {
      return `<tr><td class="tabela__vazia" colspan="${colunas.length + 3}">Nenhum talhão encontrado.</td></tr>`;
    }
    const algumTalhao = Object.keys(op.talhoes).length > 0;
    return visiveis.map((t) => {
      const ajuste = op.talhoes[t.nome];
      // Sem coluna Status: a cor da linha mostra a situação (com texto oculto para leitor de tela).
      // Operação ainda sem nenhum talhão: tudo cinza. Com algum talhão: sem operação ou sem dose em laranja.
      const status = Planos.statusTalhao(op, t.nome);
      const classeLinha = status === 'Completo' ? '' : (algumTalhao ? 'linha--pendente' : 'linha--sem');
      const situacao = { 'Sem dose': 'sem dose', 'Sem operação': 'sem operação' }[status];
      const caixa = ui.modo === 'ver' ? '' : `
        <td class="tabela__marcar"><input type="checkbox" data-acao="marcar" data-talhao="${t.nome}"
            aria-label="Marcar ${t.nome}" ${ui.marcados.has(t.nome) ? 'checked' : ''}></td>`;
      // No modo edição, talhão sem a operação mostra "—" claro em cada produto
      const vazio = ui.modo === 'ajustar' ? '<td class="tabela__numero tabela__nao-recebe">—</td>' : '<td></td>';
      let doses = colunas.map(() => vazio).join('');
      if (ajuste) {
        doses = colunas.map((col) => {
          const l = Planos.linhaNoTalhao(op, ajuste, col);
          if (!l) return '<td class="tabela__numero tabela__nao-recebe" title="Não recebe este produto">—</td>';
          const d = Planos.doseTalhao(op, ajuste, l);
          return `<td class="tabela__numero">${d === null || d === undefined ? '<span class="falta">—</span>' : Util.dose(d)}</td>`;
        }).join('');
      }
      return `
        <tr class="${classeLinha} ${ui.marcados.has(t.nome) ? 'linha--marcada' : ''}">
          ${caixa}
          <th scope="row" class="tabela__talhao">${t.nome}${situacao ? `<span class="so-leitor"> (${situacao})</span>` : ''}${outraReceita(op, ajuste)}</th>
          <td class="tabela__numero">${Util.area(t.area)}</td>
          ${doses}
        </tr>`;
    }).join('');
  }

  // Ao aplicar uma receita: indica o talhão que está em outra receita (marcá-lo muda a receita dele)
  function outraReceita(op, ajuste) {
    if (ui.modo !== 'selecionar' || !ajuste) return '';
    const r = Planos.receitaDoTalhao(op, ajuste);
    return r && r.id !== receitaAtual(op).id ? `<span class="talhoes__outra">· em ${esc(r.nome)}</span>` : '';
  }

  function rodapeTalhoes(op) {
    if (ui.modo === 'selecionar') {
      const { aplicar, remover } = contagemSelecao(op);
      const texto = aplicar === 0 && remover > 0
        ? `Remover de ${remover} ${remover === 1 ? 'talhão' : 'talhões'}`
        : `Aplicar em ${aplicar} ${aplicar === 1 ? 'talhão' : 'talhões'}${remover ? ` · remover de ${remover}` : ''}`;
      return `
        <div class="talhoes__rodape">
          <span class="talhoes__selecao">${ui.marcados.size} de ${talhoesFazenda.length} talhões marcados ·
            ${Util.area(talhoesFazenda.filter((t) => ui.marcados.has(t.nome)).reduce((s, t) => s + t.area, 0))}</span>
          <button class="botao botao--secundario" type="button" data-acao="cancelar-modo">Cancelar</button>
          <button class="botao botao--primario" type="button" data-acao="aplicar" ${aplicar || remover ? '' : 'disabled'}>${texto}</button>
        </div>`;
    }
    // Modo edição: barra fixa embaixo da tabela. Sem seleção, o Cancelar sai do modo edição;
    // com seleção, o Cancelar fica no fim da barra. Depois de aplicar algo, vira "Concluir edição".
    if (ui.modo === 'ajustar') {
      const n = ui.marcados.size;
      if (!n) {
        return `
          <div class="talhoes__rodape">
            <span class="talhoes__selecao">Marque os talhões que quer ajustar.</span>
            ${botaoCancelarEdicao()}
            <button class="botao ${ui.ajusteFeito ? 'botao--primario' : 'botao--secundario'}" type="button"
                    data-acao="cancelar-modo">${ui.ajusteFeito ? 'Concluir edição' : 'Cancelar'}</button>
          </div>`;
      }
      const area = talhoesFazenda.filter((t) => ui.marcados.has(t.nome)).reduce((s, t) => s + t.area, 0);
      const recebem = [...ui.marcados].filter((t) => op.talhoes[t]).length;
      return `
        <div class="talhoes__rodape">
          <span class="talhoes__selecao"><strong>${n} ${n === 1 ? 'talhão' : 'talhões'}</strong> · ${Util.area(area)}</span>
          <button class="botao botao--perigo-leve botao--p" type="button" data-acao="remover-da-operacao"
                  ${recebem ? '' : 'disabled title="Nenhum dos talhões selecionados recebe a operação"'}>Excluir recomendação</button>
          <button class="botao botao--primario botao--p" type="button" data-acao="ajustar-produtos">Ajustar recomendação</button>
          ${botaoCancelarEdicao('botao--p')}
          <button class="botao botao--secundario botao--p" type="button" data-acao="cancelar-modo">${ui.ajusteFeito ? 'Concluir edição' : 'Cancelar'}</button>
        </div>`;
    }
    return '';
  }

  // Só aparece depois de aplicar algo, à esquerda do "Concluir edição"
  function botaoCancelarEdicao(classe = '') {
    return ui.ajusteFeito
      ? `<button class="botao botao--secundario ${classe}" type="button" data-acao="cancelar-edicao">Cancelar edição</button>`
      : '';
  }

  // Aplicar: talhões marcados recebem a receita; os que estavam nela e foram desmarcados saem da operação
  function contagemSelecao(op) {
    const daReceita = Planos.talhoesDaReceita(op, receitaAtual(op));
    return {
      aplicar: ui.marcados.size,
      remover: daReceita.filter((t) => !ui.marcados.has(t)).length
    };
  }

  // ----- Modal "Ajustar receita de N talhões" (vale para todos os talhões selecionados) -----
  // Mesma estrutura da receita: Princípio ativo · Produto comercial · Unid. · Dose · lixeira.
  // Dose igual em todos aparece no campo; doses diferentes deixam o campo vazio com "Vários".
  // Cancelar, X ou Esc: descarta o que foi feito no modal e mantém a seleção.
  function abrirAjusteProdutos(op) {
    const nomes = talhoesFazenda.filter((t) => ui.marcados.has(t.nome)).map((t) => t.nome);
    const n = nomes.length;
    const selecionados = nomes.map((t) => op.talhoes[t]).filter(Boolean);
    const comum = (valores) => valores.every((v) => v === valores[0]) ? valores[0] : undefined;

    // Produtos que os talhões selecionados já recebem
    const existentes = Planos.colunasDose(op).filter((col) => selecionados.some((a) => Planos.linhaNoTalhao(op, a, col)))
      .map((l) => {
        const doses = selecionados.filter((a) => Planos.linhaNoTalhao(op, a, l))
          .map((a) => Planos.doseTalhao(op, a, Planos.linhaNoTalhao(op, a, l)));
        const doseComum = comum(doses);
        const original = doseComum === undefined ? '' : Util.dose(doseComum);
        return { chave: Planos.chaveLinha(l), linha: l, original, texto: original, varios: doseComum === undefined, removido: false };
      });
    const m = { existentes, novas: [] };
    let seq = 0;

    // T01, T02… até 6; depois "e mais N" (lista completa na dica)
    const listaTalhoes = n <= 6 ? nomes.join(', ')
      : `${nomes.slice(0, 6).join(', ')} <span class="ajuste-modal__mais" tabindex="0" title="${nomes.join(', ')}"
           aria-label="e mais ${n - 6}: ${nomes.slice(6).join(', ')}">e mais ${n - 6}</span>`;

    const modal = Modal.abrir(`
      <div class="modal__corpo">
        <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
        <h2 class="modal__titulo" id="modal-titulo">Ajustar recomendação de ${n} ${n === 1 ? 'talhão' : 'talhões'}</h2>
        <p class="ajuste-modal__talhoes">${listaTalhoes}</p>
        <p class="ajuste-modal__ajuda">Campo não alterado mantém o valor de cada talhão</p>
        <div class="ajuste-modal__conteudo"></div>
      </div>
      <div class="modal__rodape">
        <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
        <button class="botao botao--primario" type="button" data-m="aplicar">Aplicar em ${n} ${n === 1 ? 'talhão' : 'talhões'}</button>
      </div>`, { classe: 'modal--formulario ajuste-modal', devolverFoco: raiz.querySelector('[data-acao="ajustar-produtos"]') });
    const caixa = modal.elemento;
    const conteudo = caixa.querySelector('.ajuste-modal__conteudo');

    const temMudanca = () => m.existentes.some((e) => e.removido || e.texto !== e.original) || m.novas.some((x) => x.produto);
    const atualizarAplicar = () => { caixa.querySelector('[data-m="aplicar"]').disabled = !temMudanca(); };

    function linhaExistente(e, i) {
      const nome = esc(Planos.nomeLinha(e.linha));
      return `
        <tr class="${e.removido ? 'ajuste-modal__removida' : ''}">
          <td>${esc(e.linha.principioAtivo || '—')}</td>
          <td>${esc(e.linha.produto || '—')} ${etiquetaPre(e.linha)}</td>
          <td><span class="tabela-rec__unidade">${Planos.unidadeDose(e.linha) || '—'}</span></td>
          <td class="tabela__numero">
            <input class="campo__controle campo--compacto campo--dose" type="text" inputmode="decimal" data-m="dose" data-i="${i}"
                   data-foco="dose-${i}" value="${esc(e.texto)}" placeholder="${e.varios ? 'Vários' : '—'}"
                   aria-label="Dose de ${nome}" ${e.removido || !e.linha.produto ? 'disabled' : ''}>
          </td>
          <td class="tabela__acao">${e.removido ? `
            <button class="link-acao" type="button" data-m="desfazer" data-i="${i}" data-foco="desfazer-${i}"
                    aria-label="Desfazer a remoção de ${nome}">Desfazer</button>` : `
            <button class="botao-icone botao-icone--p" type="button" data-m="remover" data-i="${i}" data-foco="remover-${i}"
                    title="Remover dos talhões selecionados" aria-label="Remover ${nome} dos talhões selecionados">${Icones.lixeira}</button>`}
          </td>
        </tr>`;
    }

    function linhaNova(x) {
      const lixeira = `
        <td class="tabela__acao">
          <button class="botao-icone botao-icone--p" type="button" data-m="tirar" data-id="${x.id}"
                  title="Tirar esta linha" aria-label="Tirar a linha do produto adicionado">${Icones.lixeira}</button>
        </td>`;
      if (x.pre) {
        // Pré-cadastro na própria linha: produto comercial e unidade obrigatórios; princípio ativo opcional
        return `
          <tr class="tabela-rec__pre">
            <td colspan="5">
              <div class="pre-cadastro">
                <p class="pre-cadastro__titulo">Pré-cadastro de defensivo
                  <span class="pre-cadastro__ajuda">Informe o produto comercial e a unidade. O princípio ativo é opcional.</span></p>
                <div class="pre-cadastro__campos">
                  <input class="campo__controle campo--compacto" data-m="pre-produto" data-id="${x.id}" data-foco="pre-${x.id}"
                         value="${esc(x.pre.produto)}" placeholder="Produto comercial" aria-label="Produto comercial">
                  <input class="campo__controle campo--compacto" data-m="pre-pa" data-id="${x.id}"
                         value="${esc(x.pre.principioAtivo)}" placeholder="Princípio ativo" aria-label="Princípio ativo">
                  <select class="campo__controle campo--compacto" data-m="pre-unidade" data-id="${x.id}" aria-label="Unidade">
                    <option value="" ${x.pre.unidade ? '' : 'selected'} disabled>Unidade</option>
                    ${UNIDADES.map((u) => `<option ${u === x.pre.unidade ? 'selected' : ''}>${u}</option>`).join('')}
                  </select>
                  <button class="botao botao--secundario botao--p" type="button" data-m="pre-cancelar" data-id="${x.id}">Cancelar</button>
                  <button class="botao botao--primario botao--p" type="button" data-m="pre-salvar" data-id="${x.id}">Salvar pré-cadastro</button>
                </div>
                ${x.pre.erro ? `<p class="campo__erro">${x.pre.erro}</p>` : ''}
              </div>
            </td>
          </tr>`;
      }
      if (!x.produto) {
        // Um campo de busca ocupando Princípio ativo e Produto comercial, que procura pelos dois
        return `
          <tr>
            <td colspan="2">
              <div class="combo">
                <input class="campo__controle campo--compacto" type="text" data-m="busca" data-id="${x.id}" data-foco="busca-${x.id}"
                       value="${esc(x.busca)}" placeholder="Buscar por princípio ativo ou produto comercial" autocomplete="off"
                       role="combobox" aria-expanded="false" aria-label="Buscar produto por princípio ativo ou produto comercial">
                <div class="combo__lista" role="listbox" hidden></div>
              </div>
            </td>
            <td><span class="tabela-rec__unidade">—</span></td>
            <td class="tabela__numero" title="Escolha o produto para informar a dose">
              <input class="campo__controle campo--compacto campo--dose" type="text" placeholder="—" aria-label="Dose" disabled>
            </td>
            ${lixeira}
          </tr>`;
      }
      return `
        <tr>
          <td>${esc(x.produto.principioAtivo || '—')}</td>
          <td>${esc(x.produto.produto)} ${x.produto.preCadastro ? '<span class="etiqueta-pre">Pré-cadastro</span>' : ''}</td>
          <td><span class="tabela-rec__unidade">${x.produto.unidade}/ha</span></td>
          <td class="tabela__numero">
            <input class="campo__controle campo--compacto campo--dose" type="text" inputmode="decimal" data-m="nova-dose" data-id="${x.id}"
                   data-foco="nova-dose-${x.id}" value="${esc(x.dose)}" placeholder="—" aria-label="Dose de ${esc(x.produto.produto)}">
          </td>
          ${lixeira}
        </tr>`;
    }

    function desenhar(foco) {
      const linhas = m.existentes.map(linhaExistente).join('') + m.novas.map(linhaNova).join('');
      conteudo.innerHTML = `
        <table class="tabela tabela--compacta tabela-rec ajuste-modal__tabela">
          <thead><tr>
            <th>Princípio ativo</th><th>Produto comercial</th><th>Unid.</th><th class="tabela__numero">Dose</th>
            <th><span class="so-leitor">Remover</span></th>
          </tr></thead>
          <tbody>${linhas || '<tr><td class="tabela__vazia" colspan="5">Os talhões selecionados ainda não recebem produtos.</td></tr>'}</tbody>
        </table>
        <div class="ajuste-modal__acoes">
          <button class="botao botao--secundario" type="button" data-m="adicionar" data-foco="adicionar">${Icones.mais} Adicionar produto</button>
        </div>`;
      atualizarAplicar();
      if (foco) caixa.querySelector(`[data-foco="${foco}"]`)?.focus();
    }

    // Resultados da busca: "Select 240 EC · Cletodim · L/ha"; por último, "+ Pré-cadastrar produto"
    function mostrarResultados(input) {
      const lista = input.parentElement.querySelector('.combo__lista');
      const busca = Util.normalizar(input.value.trim());
      const achados = DADOS.defensivos.filter((d) => d.produto && (!busca ||
        Util.normalizar(d.produto).includes(busca) || Util.normalizar(d.principioAtivo || '').includes(busca))).slice(0, 8);
      lista.innerHTML = achados.map((d) => `
        <button class="combo__opcao" type="button" role="option" data-m="escolher" data-id="${input.dataset.id}" data-produto="${esc(d.produto)}">
          <strong>${esc(d.produto)}</strong><span class="combo__sub"> · ${esc(d.principioAtivo || '—')} · ${d.unidade}/ha</span>
          ${d.preCadastro ? '<span class="etiqueta-pre">Pré-cadastro</span>' : ''}
        </button>`).join('') + `
        <button class="combo__opcao combo__opcao--pre" type="button" role="option" data-m="pre-abrir" data-id="${input.dataset.id}">
          ${Icones.mais} Pré-cadastrar produto</button>`;
      lista.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    const novaPorId = (id) => m.novas.find((x) => x.id === id);

    caixa.addEventListener('click', (e) => {
      const alvo = e.target.closest('[data-m]');
      if (!alvo) return;
      const i = Number(alvo.dataset.i);
      const x = alvo.dataset.id ? novaPorId(alvo.dataset.id) : null;
      switch (alvo.dataset.m) {
        case 'adicionar': {
          const nova = { id: `n${++seq}`, produto: null, busca: '', dose: '', pre: null };
          m.novas.push(nova); desenhar(`busca-${nova.id}`); break;
        }
        case 'remover': m.existentes[i].removido = true; desenhar(`desfazer-${i}`); break;
        case 'desfazer': m.existentes[i].removido = false; desenhar(`remover-${i}`); break;
        case 'tirar': m.novas = m.novas.filter((n2) => n2 !== x); desenhar('adicionar'); break;
        case 'escolher':
          x.produto = Planos.produtoDoCadastro(alvo.dataset.produto); desenhar(`nova-dose-${x.id}`); break;
        case 'pre-abrir':
          x.pre = { produto: x.busca.trim(), principioAtivo: '', unidade: '', erro: '' }; desenhar(`pre-${x.id}`); break;
        case 'pre-cancelar': x.pre = null; desenhar(`busca-${x.id}`); break;
        case 'pre-salvar': {
          const produto = x.pre.produto.trim();
          if (!produto) { x.pre.erro = 'Informe o produto comercial.'; desenhar(`pre-${x.id}`); break; }
          if (!x.pre.unidade) { x.pre.erro = 'Escolha a unidade.'; desenhar(`pre-${x.id}`); break; }
          const d = { classe: '', produto, principioAtivo: x.pre.principioAtivo.trim(), unidade: x.pre.unidade, preCadastro: true };
          DADOS.defensivos.push(d);
          x.produto = d; x.pre = null; desenhar(`nova-dose-${x.id}`);
          break;
        }
        case 'aplicar': {
          if (!temMudanca()) break;
          ui.ajuste = {
            doses: Object.fromEntries(m.existentes.filter((e2) => !e2.removido && e2.texto !== e2.original).map((e2) => [e2.chave, e2.texto])),
            remover: m.existentes.filter((e2) => e2.removido).map((e2) => e2.chave),
            adicionar: m.novas.filter((n2) => n2.produto).map((n2) => ({ produto: n2.produto.produto, dose: n2.dose }))
          };
          modal.fechar();
          salvarAjustes(op);
          break;
        }
      }
    });

    caixa.addEventListener('input', (e) => {
      const el = e.target;
      const x = el.dataset.id ? novaPorId(el.dataset.id) : null;
      if (el.dataset.m === 'dose') { m.existentes[Number(el.dataset.i)].texto = el.value.trim(); atualizarAplicar(); }
      else if (el.dataset.m === 'nova-dose') { x.dose = el.value.trim(); }
      else if (el.dataset.m === 'busca') { x.busca = el.value; mostrarResultados(el); }
      else if (el.dataset.m === 'pre-produto') { x.pre.produto = el.value; }
      else if (el.dataset.m === 'pre-pa') { x.pre.principioAtivo = el.value; }
    });
    caixa.addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset.m === 'pre-unidade') novaPorId(el.dataset.id).pre.unidade = el.value;
      if (el.dataset.m === 'dose' || el.dataset.m === 'nova-dose') {
        const v = Util.numero(el.value);
        if (v !== null) el.value = Util.dose(v);
      }
    });
    caixa.addEventListener('focusin', (e) => { if (e.target.dataset.m === 'busca') mostrarResultados(e.target); });
    caixa.addEventListener('keydown', (e) => {
      const el = e.target;
      if (el.dataset.m === 'busca') {
        const lista = el.parentElement.querySelector('.combo__lista');
        if (e.key === 'Enter') { e.preventDefault(); lista.querySelector('.combo__opcao')?.click(); }
        // Esc com a lista aberta fecha só a lista (não o modal)
        if (e.key === 'Escape' && !lista.hidden) { e.stopPropagation(); lista.hidden = true; el.setAttribute('aria-expanded', 'false'); }
        if (e.key === 'ArrowDown') { e.preventDefault(); lista.querySelector('.combo__opcao')?.focus(); }
      } else if (el.classList.contains('combo__opcao') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        (e.key === 'ArrowDown' ? el.nextElementSibling : el.previousElementSibling)?.focus();
      } else if (el.tagName === 'INPUT' && e.key === 'Enter' && el.dataset.m === 'pre-produto') {
        e.preventDefault(); caixa.querySelector(`[data-m="pre-salvar"][data-id="${el.dataset.id}"]`).click();
      }
    });
    // Clique fora da busca fecha a lista de resultados
    caixa.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.combo')) caixa.querySelectorAll('.combo__lista').forEach((l) => { l.hidden = true; });
    });

    desenhar(m.existentes.length ? 'dose-0' : 'adicionar');
  }

  function novoAjustePreparado() {
    return { doses: {}, adicionar: [], remover: [] };
  }

  // "Excluir recomendação" (barra de seleção): só dos talhões marcados, que ficam sem operação; pede confirmação
  function removerDaOperacao(op) {
    const alvo = [...ui.marcados].filter((t) => op.talhoes[t]);
    const n = alvo.length;
    if (!n) return;
    Modal.confirmar({
      titulo: `Excluir a recomendação de ${n} ${n === 1 ? 'talhão' : 'talhões'}?`,
      texto: n === 1 ? 'Os produtos e doses desse talhão serão apagados e ele ficará sem operação.'
        : 'Os produtos e doses desses talhões serão apagados e eles ficarão sem operação.',
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir recomendação', classe: 'perigo', acao: () => {
        alvo.forEach((t) => { delete op.talhoes[t]; });
        ui.marcados = new Set(); ui.ajuste = novoAjustePreparado(); ui.ajusteFeito = true;
        alterou(); desenharTudo();
        Aviso.mostrar(`Recomendação excluída de ${n} ${n === 1 ? 'talhão' : 'talhões'}`);
      } }]
    });
  }

  // ----- Guias de grupo (rodapé) -----
  function rodapeGrupos() {
    const atual = grupoAtual();
    return `
      <footer class="grupos" aria-label="Grupos de operações">
        <span class="grupos__rotulo">Grupo de operações</span>
        <div class="grupos__guias" role="tablist">
          ${plano.grupos.map((g) => {
            const ativo = atual && g.id === atual.id;
            if (ui.renomeandoGrupo === g.id) {
              return `<span class="guia guia--ativa guia--editando"><input class="guia__campo" data-campo="nome-grupo"
                        value="${esc(g.nome)}" aria-label="Nome do grupo" data-foco-inicial></span>`;
            }
            return `<button class="guia ${ativo ? 'guia--ativa' : ''}" type="button" role="tab" aria-selected="${!!ativo}"
                      data-acao="abrir-grupo" data-grupo="${g.id}" ${somenteLeitura ? '' : 'draggable="true"'}
                      title="${somenteLeitura ? esc(g.nome) : `${esc(g.nome)} · duplo clique para renomear, arraste para reordenar`}">${esc(g.nome)}</button>`;
          }).join('')}
          ${somenteLeitura ? '' : `<button class="guia guia--mais" type="button" data-acao="novo-grupo" title="Novo grupo"
                                     aria-label="Novo grupo de operações">${Icones.mais}</button>`}
        </div>
        ${somenteLeitura || !atual ? '' : `
          <button class="botao-icone botao-icone--borda grupos__excluir" type="button" data-acao="excluir-grupo"
                  title="Excluir o grupo ${esc(atual.nome)}" aria-label="Excluir o grupo ${esc(atual.nome)}">${Icones.lixeira}</button>`}
      </footer>`;
  }

  // ================= Combobox (princípio ativo / produto) =================
  function linhaDoElemento(el) {
    const tr = el.closest('[data-linha]');
    const op = opAtual();
    return tr && op && ui.rascunho ? ui.rascunho.produtos.find((l) => l.id === tr.dataset.linha) : null;
  }

  function opcoesCombo(linha, tipo, texto) {
    const busca = Util.normalizar(texto.trim());
    const bate = (v) => !busca || Util.normalizar(v).includes(busca);
    let opcoes;
    if (tipo === 'pa') {
      // Princípios ativos do cadastro (sem repetir)
      const pas = [...new Set(DADOS.defensivos.map((d) => d.principioAtivo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      opcoes = pas.filter(bate).map((pa) => ({ valor: pa, rotulo: esc(pa),
        pre: DADOS.defensivos.some((d) => d.principioAtivo === pa && d.preCadastro && !d.produto) }));
    } else {
      // Produtos do cadastro; com princípio ativo escolhido, só os que têm ele
      opcoes = DADOS.defensivos
        .filter((d) => d.produto && (!linha.principioAtivo || d.principioAtivo === linha.principioAtivo) && bate(d.produto))
        .map((d) => ({ valor: d.produto, rotulo: `${esc(d.produto)}<span class="combo__sub">${esc(d.principioAtivo || '—')} · ${d.unidade}</span>`, pre: d.preCadastro }));
    }
    opcoes = opcoes.slice(0, 8);
    // "+ Pré-cadastrar" sempre como última opção quando há texto digitado, só na busca de produto comercial
    if (tipo === 'produto' && texto.trim()) opcoes.push({ preCadastrar: true, valor: texto.trim(), rotulo: `${Icones.mais} Pré-cadastrar "${esc(texto.trim())}"` });
    return opcoes;
  }

  function abrirCombo(input) {
    const linha = linhaDoElemento(input);
    if (!linha) return;
    const lista = input.parentElement.querySelector('.combo__lista');
    const tipo = input.dataset.combo;
    const opcoes = opcoesCombo(linha, tipo, input.value === (tipo === 'pa' ? linha.principioAtivo : linha.produto) ? '' : input.value);
    lista.innerHTML = opcoes.length ? opcoes.map((o, i) => `
      <div class="combo__opcao ${o.preCadastrar ? 'combo__opcao--pre' : ''}" role="option" data-indice="${i}"
           data-valor="${esc(o.valor)}" ${o.preCadastrar ? 'data-pre-cadastrar' : ''}>
        ${o.rotulo} ${o.pre ? '<span class="etiqueta-pre">Pré-cadastro</span>' : ''}
      </div>`).join('') : '<div class="combo__nada">Digite para buscar</div>';
    lista.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function fecharCombos() {
    raiz.querySelectorAll('.combo__lista').forEach((l) => { l.hidden = true; });
    raiz.querySelectorAll('[data-combo]').forEach((i) => i.setAttribute('aria-expanded', 'false'));
  }

  function escolherNoCombo(input, opcaoEl) {
    const linha = linhaDoElemento(input);
    const tipo = input.dataset.combo;
    const valor = opcaoEl.dataset.valor;
    if (opcaoEl.hasAttribute('data-pre-cadastrar')) {
      ui.preCadastro = { linhaId: linha.id, produto: valor, principioAtivo: linha.principioAtivo || '', unidade: '', erro: '' };
    } else if (tipo === 'pa') {
      linha.principioAtivo = valor;
      // Produto de outro princípio ativo deixa de valer (e, sem produto, não há unidade nem dose)
      const prod = Planos.produtoDoCadastro(linha.produto);
      if (prod && prod.principioAtivo !== valor) {
        Object.assign(linha, { produto: '', unidade: '', dose: null, preCadastro: false });
      }
    } else {
      const d = Planos.produtoDoCadastro(valor);
      linha.produto = d.produto;
      linha.principioAtivo = d.principioAtivo || '';
      linha.unidade = d.unidade;
      linha.preCadastro = !!d.preCadastro;
    }
    desenharTudo();
  }

  // ================= Ações =================
  function aoClicar(e) {
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    const op = opAtual();
    const grupo = grupoAtual();

    switch (acao) {
      case 'alternar-lista':
        ui.listaRecolhida = !ui.listaRecolhida; desenharTudo(); break;

      case 'abrir-op': {
        const id = alvo.dataset.op;
        if (op && op.id === id) break;
        sairDaReceita(() => {
          ui.opPorGrupo[grupo.id] = id; ui.renomeandoOp = null;
          sairDosModos(); desenharTudo();
        });
        break;
      }

      case 'nova-op':
        sairDaReceita(() => {
          const nova = Planos.novaOperacao('Nova operação', null);
          grupo.operacoes.push(nova);
          ui.opPorGrupo[grupo.id] = nova.id; ui.renomeandoOp = nova.id;
          sairDosModos(); alterou(); desenharTudo();
        });
        break;

      case 'alternar-status':
        sairDaReceita(() => {
          plano.status = somenteLeitura ? 'Em construção' : 'Aprovado';
          somenteLeitura = plano.status === 'Aprovado';
          ui.renomeandoOp = null; ui.renomeandoGrupo = null;
          sairDosModos(); sairDaEdicao();
          desenharMantendoFoco('[data-acao="alternar-status"]');
        }, { removerVazia: false });
        break;

      case 'abrir-receita': {
        if (ui.renomeandoReceita) return;
        // Dois cliques seguidos na receita aberta = renomear (como nas guias de grupo)
        const id = alvo.dataset.receita;
        const agora = Date.now();
        const duplo = ultimoCliqueReceita.id === id && agora - ultimoCliqueReceita.quando < 450;
        ultimoCliqueReceita = { id, quando: agora };
        const aberta = receitaAtual(op);
        if (aberta && aberta.id === id) {
          if (duplo && !somenteLeitura && ui.modo !== 'ajustar') { ui.renomeandoReceita = id; desenharTudo(); }
          break;
        }
        sairDaReceita(() => { ui.receitaPorOp[op.id] = id; sairDosModos(); desenharTudo(); });
        break;
      }

      case 'nova-receita':
        sairDaReceita(() => {
          const nova = Planos.novaReceita(op);
          op.receitas.push(nova);
          ui.receitaPorOp[op.id] = nova.id;
          sairDosModos(); alterou(); desenharTudo();
          raiz.querySelector('.tabela-rec tbody tr:last-child [data-combo="pa"]')?.focus();
        });
        break;

      case 'excluir-receita': excluirReceita(op, receitaAtual(op)); break;

      case 'salvar-receita': salvarReceita(op); break;

      case 'editar-ops':
        if (alvo.getAttribute('aria-disabled') === 'true') break;
        ui.edicao = { marcadas: new Set(), nomes: {}, renomeando: null, nomeAntes: undefined };
        ui.renomeandoOp = null; ui.preCadastro = null;
        sairDosModos(); desenharMantendoFoco('[data-acao="ed-marcar-todos"]'); break;

      case 'ed-marcar':
        if (alvo.checked) ui.edicao.marcadas.add(alvo.dataset.op); else ui.edicao.marcadas.delete(alvo.dataset.op);
        desenharMantendoFoco(`[data-acao="ed-marcar"][data-op="${alvo.dataset.op}"]`); break;

      case 'ed-marcar-todos':
        ui.edicao.marcadas = alvo.checked ? new Set(grupo.operacoes.map((o) => o.id)) : new Set();
        desenharMantendoFoco('[data-acao="ed-marcar-todos"]'); break;

      case 'ed-cancelar':
        sairDaEdicao(); desenharMantendoFoco('[data-acao="editar-ops"]'); break;

      case 'ed-salvar': {
        const nomes = ui.edicao.nomes;
        const n = Object.keys(nomes).length;
        if (!n) break;
        grupo.operacoes.forEach((o) => { if (nomes[o.id]) o.nome = nomes[o.id]; });
        sairDaEdicao(); alterou(); desenharMantendoFoco('[data-acao="editar-ops"]');
        Aviso.mostrar(n === 1 ? '1 nome salvo' : `${n} nomes salvos`);
        break;
      }

      case 'ed-excluir': excluirMarcadas(grupo); break;

      case 'adicionar-linha':
        rascunho(op).produtos.push(Planos.novaLinha()); desenharTudo();
        raiz.querySelector('.tabela-rec tbody tr:last-child [data-combo="pa"]')?.focus();
        break;

      case 'remover-linha': {
        const linha = linhaDoElemento(alvo);
        ui.rascunho.produtos = ui.rascunho.produtos.filter((l) => l !== linha);
        desenharTudo(); break;
      }

      case 'cancelar-pre': ui.preCadastro = null; desenharTudo(); break;
      case 'salvar-pre': salvarPreCadastro(op); break;

      case 'aplicar-receita':
        // Sem o preenchimento mínimo, mostra o que falta e não entra na seleção
        if (errosRecomendacao(op).algum) { ui.validarOp = op.id; desenharTudo(); return; }
        ui.validarOp = null;
        ui.modo = 'selecionar'; ui.marcados = new Set(Planos.talhoesDaReceita(op, receitaAtual(op))); ui.preCadastro = null;
        desenharTudo(); break;

      case 'ajustar-talhoes':
        sairDaReceita(() => {
          ui.modo = 'ajustar'; ui.marcados = new Set(); ui.ajuste = novoAjustePreparado();
          guardarCopiaEdicao(op);
          desenharTudo();
        }, { removerVazia: false });
        break;

      case 'cancelar-modo': sairDosModos(); desenharTudo(); break;
      case 'cancelar-edicao': cancelarEdicao(op); break;

      case 'marcar':
        if (alvo.checked) ui.marcados.add(alvo.dataset.talhao); else ui.marcados.delete(alvo.dataset.talhao);
        desenharTudo(); break;

      case 'marcar-todos':
        ui.marcados = alvo.checked ? new Set(talhoesMarcaveis(op).map((t) => t.nome)) : new Set();
        desenharTudo(); break;

      case 'aplicar': aplicarRecomendacao(op); break;

      case 'ajustar-produtos': abrirAjusteProdutos(op); break;
      case 'remover-da-operacao': removerDaOperacao(op); break;


      case 'abrir-grupo': {
        if (ui.renomeandoGrupo) return;
        // Dois cliques seguidos na mesma guia = renomear (como no Excel). Feito à mão porque
        // o primeiro clique redesenha a guia e o dblclick do navegador se perderia.
        const id = alvo.dataset.grupo;
        const agora = Date.now();
        const duplo = ultimoCliqueGuia.id === id && agora - ultimoCliqueGuia.quando < 450;
        ultimoCliqueGuia = { id, quando: agora };
        if (duplo && !somenteLeitura) { ui.renomeandoGrupo = id; desenharTudo(); break; }
        if (ui.grupoId === id) break;
        sairDaReceita(() => {
          ui.grupoId = id; ui.renomeandoOp = null;
          sairDosModos(); sairDaEdicao(); desenharTudo();
        });
        break;
      }

      case 'novo-grupo': sairDaReceita(novoGrupo); break;
      case 'excluir-grupo': sairDaReceita(() => excluirGrupo(grupo)); break;
    }
  }

  function aoMudar(e) {
    const campo = e.target.dataset.campo;
    const op = opAtual();
    if (campo === 'op-dap') {
      const n = Util.numero(e.target.value);
      op.dap = n === null ? null : Math.round(n);
      alterou(); desenharTudo();
    } else if (campo === 'op-fenologia') {
      op.fenologia = e.target.value; alterou(); desenharTudo();
    } else if (campo === 'linha-dose') {
      // Já registrada ao digitar; sem redesenhar, para o clique em "Salvar receita" valer de primeira
      e.target.value = Util.dose(Util.numero(e.target.value));
    } else if (e.target.dataset.pre) {
      ui.preCadastro[e.target.dataset.pre] = e.target.value;
    }
  }

  // Duplo clique no nome, no modo Editar, abre o campo para renomear. Na lista normal não faz nada.
  function aoDuploClique(e) {
    const nome = e.target.closest('[data-ed-nome]');
    if (nome && ui.edicao) comecarRenomear(nome.dataset.edNome);
  }

  function aoDigitar(e) {
    if (e.target.dataset.campo === 'ed-nome') {
      registrarNome(grupoAtual().operacoes.find((o) => o.id === e.target.dataset.op), e.target.value);
      return;
    }
    // Doses: registradas enquanto se digita; só os botões que dependem delas são atualizados
    if (e.target.dataset.campo === 'linha-dose') {
      linhaDoElemento(e.target).dose = Util.numero(e.target.value);
      const op = opAtual();
      raiz.querySelector('.recomendacao__acoes')?.replaceWith(htmlParaElemento(acoesReceita(op)));
      return;
    }
    if (e.target.dataset.combo) { abrirCombo(e.target); return; }
    if (e.target.dataset.pre) { ui.preCadastro[e.target.dataset.pre] = e.target.value; return; }
    if (e.target.dataset.campo === 'busca') {
      ui.busca = e.target.value;
      const op = opAtual();
      raiz.querySelector('#talhoes-linhas').innerHTML = linhasTalhoes(op, Planos.colunasDose(op));
    }
  }

  function aoFocar(e) {
    if (e.target.dataset.combo) { e.target.select(); abrirCombo(e.target); }
  }

  function aoDesfocar(e) {
    const el = e.target;
    if (el.dataset.combo) {
      // Sem escolher uma opção, o campo volta ao valor da linha
      setTimeout(() => {
        if (!raiz.contains(el) || el === document.activeElement) return;
        const linha = linhaDoElemento(el);
        if (linha) el.value = el.dataset.combo === 'pa' ? linha.principioAtivo : linha.produto;
        el.parentElement.querySelector('.combo__lista').hidden = true;
        el.setAttribute('aria-expanded', 'false');
      }, 150);
    }
    if (el.dataset.campo === 'nome-op') salvarNomeOperacao(el.value);
    if (el.dataset.campo === 'nome-receita') salvarNomeReceita(el.value);
    if (el.dataset.campo === 'nome-grupo') salvarNomeGrupo(el.value);
    if (el.dataset.campo === 'ed-nome' && ui.edicao && ui.edicao.renomeando === el.dataset.op) {
      // Sair do campo confirma o nome (sem salvar ainda: isso é no "Salvar" da barra).
      // Se o foco foi para um botão da tela, o clique dele redesenha; redesenhar aqui o faria se perder.
      ui.edicao.renomeando = null;
      if (!e.relatedTarget?.closest?.('[data-acao]')) desenharTudo();
    }
  }

  function aoTeclar(e) {
    const el = e.target;
    // Modo Editar: Enter (ou F2) no nome abre o campo; no campo, Enter confirma e Esc desfaz só aquele campo
    if (el.dataset.edNome && (e.key === 'Enter' || e.key === 'F2')) {
      e.preventDefault(); comecarRenomear(el.dataset.edNome); return;
    }
    if (el.dataset.campo === 'ed-nome') {
      const id = el.dataset.op;
      if (e.key === 'Enter') {
        e.preventDefault();
        ui.edicao.renomeando = null;
        desenharMantendoFoco(`[data-ed-nome="${id}"]`);
      } else if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        if (ui.edicao.nomeAntes === undefined) delete ui.edicao.nomes[id];
        else ui.edicao.nomes[id] = ui.edicao.nomeAntes;
        ui.edicao.renomeando = null;
        desenharMantendoFoco(`[data-ed-nome="${id}"]`);
      }
      return;
    }
    if (el.dataset.combo) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const primeira = el.parentElement.querySelector('.combo__opcao');
        if (primeira) escolherNoCombo(el, primeira);
      } else if (e.key === 'Escape') {
        e.stopPropagation(); fecharCombos(); el.blur();
      }
      return;
    }
    if (el.dataset.campo === 'nome-op' || el.dataset.campo === 'nome-grupo' || el.dataset.campo === 'nome-receita') {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        ui.renomeandoOp = null; ui.renomeandoGrupo = null; ui.renomeandoReceita = null; desenharTudo();
      }
      return;
    }
    // F2 na receita aberta = renomear (teclado)
    if (el.dataset.receita && e.key === 'F2' && !somenteLeitura && receitaAtual(opAtual())?.id === el.dataset.receita) {
      e.preventDefault(); ui.renomeandoReceita = el.dataset.receita; desenharTudo(); return;
    }
    if (el.dataset.pre && e.key === 'Enter') { e.preventDefault(); salvarPreCadastro(opAtual()); }
    if ((el.dataset.campo === 'op-dap' || el.dataset.campo === 'linha-dose') && e.key === 'Enter') {
      e.preventDefault(); el.blur();
    }
  }

  // Clique na opção do combobox: mousedown para escolher antes do campo perder o foco
  document.addEventListener('mousedown', (e) => {
    const opcao = e.target.closest('.combo__opcao');
    if (!opcao || !raiz || !raiz.contains(opcao)) return;
    e.preventDefault();
    escolherNoCombo(opcao.closest('.combo').querySelector('[data-combo]'), opcao);
  });

  // ----- Operação -----
  function salvarNomeOperacao(valor) {
    if (!ui.renomeandoOp) return;
    const op = grupoAtual().operacoes.find((o) => o.id === ui.renomeandoOp);
    ui.renomeandoOp = null;
    if (op && valor.trim() && valor.trim() !== op.nome) { op.nome = valor.trim(); alterou(); }
    desenharTudo();
  }

  // Exclui as operações marcadas no modo Editar (hipótese a validar com clientes).
  // Com talhões: confirmação com o impacto. Sem talhões: exclui na hora, com Desfazer.
  function excluirMarcadas(grupo) {
    const ops = grupo.operacoes.filter((o) => ui.edicao.marcadas.has(o.id));
    const n = ops.length;
    if (!n) return;
    const talhoes = new Set(ops.flatMap((o) => Object.keys(o.talhoes))).size;
    const produtos = new Set(ops.flatMap((o) => o.receitas.flatMap((r) => r.produtos)
      .filter(Planos.linhaPreenchida).map(Planos.chaveLinha))).size;
    const todas = n === grupo.operacoes.length;
    const nome = (o) => esc(nomeEmEdicao(o));
    const remover = () => {
      // Guarda a posição de cada uma para o Desfazer
      const removidas = ops.map((o) => ({ op: o, indice: grupo.operacoes.indexOf(o) })).sort((a, b) => a.indice - b.indice);
      removidas.slice().reverse().forEach((r) => grupo.operacoes.splice(r.indice, 1));
      // Se a operação aberta saiu, abre a primeira restante (opAtual cai nela)
      if (ops.some((o) => o.id === ui.opPorGrupo[grupo.id])) delete ui.opPorGrupo[grupo.id];
      ops.forEach((o) => { delete ui.edicao.nomes[o.id]; });
      ui.edicao.marcadas = new Set();
      if (grupo.operacoes.length === 0) sairDaEdicao();
      sairDosModos(); alterou(); desenharTudo();
      return removidas;
    };
    const aviso = n === 1 ? `${nome(ops[0])} excluída` : `${n} operações excluídas`;
    if (talhoes) {
      const sujeito = n === 1 ? 'Ela está aplicada' : 'Elas estão aplicadas';
      Modal.confirmar({
        titulo: n === 1 ? `Excluir ${nome(ops[0])}?` : `Excluir ${n} operações?`,
        texto: `${sujeito} em ${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'}`
          + `${produtos ? `, com ${produtos} ${produtos === 1 ? 'produto' : 'produtos'}` : ''}.`
          + `${todas ? ` O grupo ${esc(grupo.nome)} ficará sem operações.` : ''}`
          + ' Essa ação não pode ser desfeita.',
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: n === 1 ? 'Excluir operação' : 'Excluir operações', classe: 'perigo', acao: () => {
          remover(); Aviso.mostrar(aviso);
        } }]
      });
    } else {
      const removidas = remover();
      Aviso.mostrar(`${aviso}${todas ? `. O grupo ${esc(grupo.nome)} ficou sem operações` : ''}`, { acao: 'Desfazer', aoAgir: () => {
        removidas.forEach((r) => grupo.operacoes.splice(Math.min(r.indice, grupo.operacoes.length), 0, r.op));
        if (ui.grupoId === grupo.id && raiz.isConnected) desenharTudo();
      } });
    }
  }

  // ----- Pré-cadastro -----
  function salvarPreCadastro(op) {
    const pc = ui.preCadastro;
    raiz.querySelectorAll('[data-pre]').forEach((el) => { pc[el.dataset.pre] = el.value; });
    const produto = pc.produto.trim();
    const pa = pc.principioAtivo.trim();
    if (!produto) { pc.erro = 'Informe o produto comercial.'; desenharTudo(); return; }
    if (!pc.unidade) { pc.erro = 'Escolha a unidade.'; desenharTudo(); return; }

    DADOS.defensivos.push({ classe: '', produto, principioAtivo: pa, unidade: pc.unidade, preCadastro: true });
    const linha = ui.rascunho.produtos.find((l) => l.id === pc.linhaId);
    Object.assign(linha, { produto, principioAtivo: pa, unidade: pc.unidade, preCadastro: true });
    ui.preCadastro = null;
    desenharTudo();
    Aviso.mostrar(`Pré-cadastro de "${esc(produto)}" salvo`);
  }

  // ----- Salvar e excluir receita -----
  // Receita ainda não aplicada: salva e não muda nada na tabela de talhões.
  // Receita já aplicada: pergunta antes, porque a mudança vale para os talhões dela
  // (dose padrão nova chega a quem segue o padrão; dose própria do talhão fica;
  // produto removido ou trocado sai de todos os talhões da receita).
  function salvarReceita(op) {
    const r = receitaAtual(op);
    if (!rascunhoAlterado(op)) return;
    // Todas as linhas apagadas: a receita vazia não fica no sistema, é excluída
    // (aplicada em talhões, com a mesma confirmação da lixeira; senão, na hora, com Desfazer)
    if (!ui.rascunho.produtos.some(Planos.linhaPreenchida)) { excluirReceita(op, r); return; }
    const talhoes = Planos.talhoesDaReceita(op, r);
    const salvar = () => {
      const novas = ui.rascunho.produtos.filter(Planos.linhaPreenchida).map((l) => ({ ...l }));
      talhoes.forEach((t) => {
        const doses = op.talhoes[t].doses;
        Object.keys(doses).forEach((id) => {
          const antes = r.produtos.find((l) => l.id === id);
          const depois = novas.find((l) => l.id === id);
          if (!depois || !antes || Planos.chaveLinha(antes) !== Planos.chaveLinha(depois)) delete doses[id];
        });
      });
      r.produtos = novas;
      ui.rascunho = null; ui.validarOp = null; ui.preCadastro = null;
      alterou(); desenharTudo();
      const n = talhoes.length;
      Aviso.mostrar(n ? `${esc(r.nome)} salva e alterada em ${n} ${n === 1 ? 'talhão' : 'talhões'}` : `${esc(r.nome)} salva`);
    };
    if (!talhoes.length) { salvar(); return; }
    const n = talhoes.length;
    Modal.confirmar({
      titulo: `Alterar os talhões que já recebem ${esc(r.nome)}?`,
      texto: `${esc(r.nome)} já está aplicada em ${n} ${n === 1 ? 'talhão' : 'talhões'}. Ao salvar, as alterações valem para ${n === 1 ? 'ele' : 'eles'}. Talhões com dose própria mantêm a dose deles.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Salvar e alterar talhões', classe: 'primario', acao: salvar }]
    });
  }

  // Com talhões: confirmação com o impacto (os talhões ficam sem operação). Sem talhões: na hora, com Desfazer.
  function excluirReceita(op, r) {
    if (!r) return;
    const talhoes = Planos.talhoesDaReceita(op, r);
    const remover = () => {
      const indice = op.receitas.indexOf(r);
      op.receitas.splice(indice, 1);
      talhoes.forEach((t) => { delete op.talhoes[t]; });
      delete ui.receitaPorOp[op.id];
      ui.rascunho = null; ui.validarOp = null; ui.preCadastro = null; ui.renomeandoReceita = null;
      sairDosModos(); alterou(); desenharTudo();
      return indice;
    };
    const n = talhoes.length;
    if (n) {
      Modal.confirmar({
        titulo: `Excluir ${esc(r.nome)}?`,
        texto: `Ela está aplicada em ${n} ${n === 1 ? 'talhão, que ficará' : 'talhões, que ficarão'} sem operação. Essa ação não pode ser desfeita.`,
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir recomendação', classe: 'perigo', acao: () => {
          remover(); Aviso.mostrar(`${esc(r.nome)} excluída`);
        } }]
      });
    } else {
      const indice = remover();
      Aviso.mostrar(`${esc(r.nome)} excluída`, { acao: 'Desfazer', aoAgir: () => {
        op.receitas.splice(Math.min(indice, op.receitas.length), 0, r);
        ui.receitaPorOp[op.id] = r.id; ui.rascunho = null;
        if (raiz.isConnected) desenharTudo();
      } });
    }
  }

  let ultimoCliqueReceita = { id: null, quando: 0 };

  // Nome vazio volta ao anterior; nome repetido na mesma operação não é aceito
  function salvarNomeReceita(valor) {
    if (!ui.renomeandoReceita) return;
    const op = opAtual();
    const r = op.receitas.find((x) => x.id === ui.renomeandoReceita);
    ui.renomeandoReceita = null;
    const v = valor.trim();
    if (r && v && v !== r.nome) {
      if (op.receitas.some((x) => x !== r && Util.normalizar(x.nome) === Util.normalizar(v))) {
        Aviso.mostrar('Já existe uma recomendação com esse nome');
      } else {
        r.nome = v; alterou();
      }
    }
    desenharTudo();
  }

  // ----- Aplicar a receita nos talhões -----
  // Os marcados recebem os produtos e as doses padrão da receita (sem perguntar a dose).
  // Talhão de outra receita muda para esta (um talhão fica em uma receita só na operação).
  function aplicarRecomendacao(op) {
    const r = receitaAtual(op);
    const comAjuste = [...ui.marcados].filter((t) => op.talhoes[t] && op.talhoes[t].receitaId === r.id &&
      Planos.temAjuste(op.talhoes[t]));
    const aplicar = (substituir) => {
      const { aplicar: n, remover: m } = contagemSelecao(op);
      Planos.talhoesDaReceita(op, r).forEach((t) => { if (!ui.marcados.has(t)) delete op.talhoes[t]; });
      ui.marcados.forEach((t) => {
        const a = op.talhoes[t];
        if (!a || a.receitaId !== r.id || substituir) op.talhoes[t] = Planos.novoAjuste(r.id);
      });
      sairDosModos(); alterou(); desenharTudo();
      Aviso.mostrar(n
        ? `${esc(r.nome)} aplicada em ${n} ${n === 1 ? 'talhão' : 'talhões'}${m ? ` · removida de ${m}` : ''}`
        : `${esc(r.nome)} removida de ${m} ${m === 1 ? 'talhão' : 'talhões'}`);
    };
    if (comAjuste.length) {
      Modal.confirmar({
        titulo: `${comAjuste.length} ${comAjuste.length === 1 ? 'talhão tem ajustes' : 'talhões têm ajustes'}.`,
        texto: `${comAjuste.join(', ')}: manter as doses próprias desses talhões ou substituir pelas doses padrão da recomendação?`,
        botoes: [
          { rotulo: 'Manter ajustes', classe: 'secundario', acao: () => aplicar(false) },
          { rotulo: 'Substituir pela dose padrão', classe: 'primario', acao: () => aplicar(true) }
        ]
      });
    } else {
      aplicar(false);
    }
  }

  // ----- Ajustar talhões (Aplicar em N talhões, no modal "Ajustar receita") -----
  // Mudar só a dose: fica como dose própria do talhão (a receita não muda).
  // Mudar a composição (adicionar, remover ou trocar produto):
  //  - se já existe receita com a nova composição, os talhões passam para ela;
  //  - se a mudança vale para todos os talhões da receita, a própria receita é atualizada;
  //  - se vale só para parte deles, nasce a próxima receita para esses talhões.
  // Talhão sem a operação que recebe produto passa a receber a operação.
  function salvarAjustes(op) {
    const aj = ui.ajuste;
    const adicionados = aj.adicionar.filter((a) => a.produto);
    const porDestino = new Map();
    const semProdutos = [];
    let alterados = 0;
    [...ui.marcados].forEach((t) => {
      const a = op.talhoes[t];
      const r = a ? Planos.receitaDoTalhao(op, a) : null;
      // Doses do talhão depois do ajuste, por produto (chave): { linha, dose }
      const efetivas = new Map();
      if (a) Planos.linhasTalhao(op, a).forEach((l) => efetivas.set(Planos.chaveLinha(l), { linha: l, dose: Planos.doseTalhao(op, a, l) }));
      Object.entries(aj.doses).forEach(([chave, texto]) => {
        if (efetivas.has(chave)) efetivas.get(chave).dose = Util.numero(texto);
      });
      aj.remover.forEach((chave) => efetivas.delete(chave));
      adicionados.forEach(({ produto, dose }) => {
        const v = Util.numero(dose);
        const linha = Planos.linhaDoProduto(produto, v);
        const chave = Planos.chaveLinha(linha);
        if (efetivas.has(chave)) { if (v !== null) efetivas.get(chave).dose = v; }
        else efetivas.set(chave, { linha, dose: v });
      });
      if (!a && !efetivas.size) return;                       // sem operação e sem produto: continua igual
      alterados++;
      if (!efetivas.size) { semProdutos.push(t); return; }    // ficou sem nenhum produto: sai da operação
      const comp = [...efetivas.keys()].sort().join('|');
      const k = `${r ? r.id : '-'}#${comp}`;
      if (!porDestino.has(k)) porDestino.set(k, { r, comp, talhoes: [] });
      porDestino.get(k).talhoes.push({ t, efetivas });
    });
    semProdutos.forEach((t) => { delete op.talhoes[t]; });

    const criadas = [];
    porDestino.forEach(({ r, comp, talhoes }) => {
      let destino = r && Planos.composicao(r.produtos) === comp ? r
        : op.receitas.find((x) => Planos.composicao(x.produtos) === comp);
      const modelo = talhoes[0].efetivas;
      if (!destino && r && talhoes.length === Planos.talhoesDaReceita(op, r).length) {
        // Composição mudou em todos os talhões da receita: atualiza a própria receita
        r.produtos = r.produtos.filter((l) => modelo.has(Planos.chaveLinha(l)));
        modelo.forEach(({ linha, dose }, chave) => {
          if (!r.produtos.some((l) => Planos.chaveLinha(l) === chave)) r.produtos.push({ ...linha, id: Planos.novoId('l'), dose });
        });
        destino = r;
      } else if (!destino) {
        // Só parte dos talhões (ou talhões que não recebiam a operação): nova receita,
        // mantendo as doses padrão da receita de origem
        destino = Planos.novaReceita(op, [...modelo.values()].map(({ linha, dose }) =>
          ({ ...linha, id: Planos.novoId('l'), dose: r && r.produtos.includes(linha) ? linha.dose : dose })));
        op.receitas.push(destino);
        criadas.push(destino);
      }
      // Dose diferente da padrão da receita de destino fica como dose própria do talhão
      talhoes.forEach(({ t, efetivas }) => {
        const doses = {};
        destino.produtos.filter(Planos.linhaPreenchida).forEach((l) => {
          const e = efetivas.get(Planos.chaveLinha(l));
          if (e && e.dose !== l.dose) doses[l.id] = e.dose;
        });
        op.talhoes[t] = { receitaId: destino.id, doses };
      });
    });

    // Fecha o painel e limpa a seleção; a tabela continua no modo edição
    ui.rascunho = null;
    ui.marcados = new Set(); ui.ajuste = novoAjustePreparado(); ui.ajusteFeito = true;
    alterou(); desenharTudo();
    Aviso.mostrar(`Ajustes aplicados em ${alterados} ${alterados === 1 ? 'talhão' : 'talhões'}` +
      (criadas.length ? ` · criada a ${criadas.map((r) => esc(r.nome)).join(', ')}` : '') +
      '. Marque outros talhões ou conclua a edição.');
  }

  // ----- Grupos -----
  function novoGrupo() {
    const modal = Modal.abrir(`
      <form class="formulario" novalidate>
        <div class="modal__corpo">
          <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
          <h2 class="modal__titulo" id="modal-titulo">Novo grupo de operações</h2>
          <p class="modal__subtitulo">O tipo define as informações mínimas pedidas no grupo.</p>
          <div class="campo">
            <label class="campo__rotulo" for="ng-nome">Nome</label>
            <input class="campo__controle" id="ng-nome" name="nome" autocomplete="off" required>
          </div>
          <div class="campo">
            <label class="campo__rotulo" for="ng-tipo">Tipo</label>
            <select class="campo__controle" id="ng-tipo" name="tipo" required>
              <option value="" disabled selected>Selecione o tipo</option>
              ${DADOS.tiposGrupo.map((t) => `<option>${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
          <button class="botao botao--primario" type="submit" disabled>Criar grupo</button>
        </div>
      </form>`, { classe: 'modal--pequeno' });
    const form = modal.elemento.querySelector('form');
    const atualizar = () => {
      form.querySelector('[type=submit]').disabled = !(form.elements.nome.value.trim() && form.elements.tipo.value);
    };
    form.addEventListener('input', atualizar);
    form.addEventListener('change', atualizar);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (form.querySelector('[type=submit]').disabled) return;
      const grupo = Planos.novoGrupo(form.elements.nome.value.trim(), form.elements.tipo.value);
      plano.grupos.push(grupo);
      ui.grupoId = grupo.id;
      modal.fechar(); sairDosModos(); sairDaEdicao(); alterou(); desenharTudo();
    });
    form.elements.nome.focus();
  }

  function excluirGrupo(grupo) {
    const remover = () => {
      const indice = plano.grupos.indexOf(grupo);
      plano.grupos.splice(indice, 1);
      ui.grupoId = (plano.grupos[indice] || plano.grupos[indice - 1] || {}).id || null;
      sairDaEdicao();
      sairDosModos(); alterou(); desenharTudo();
      return indice;
    };
    const n = grupo.operacoes.length;
    if (n) {
      Modal.confirmar({
        titulo: `Excluir o grupo ${esc(grupo.nome)}?`,
        texto: `${n} ${n === 1 ? 'operação será removida' : 'operações serão removidas'} do plano.`,
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir grupo', classe: 'perigo', acao: () => {
          remover(); Aviso.mostrar(`Grupo ${esc(grupo.nome)} excluído`);
        } }]
      });
    } else {
      const indice = remover();
      Aviso.mostrar(`Grupo ${esc(grupo.nome)} excluído`, { acao: 'Desfazer', aoAgir: () => {
        plano.grupos.splice(indice, 0, grupo); ui.grupoId = grupo.id;
        if (raiz.isConnected) desenharTudo();
      } });
    }
  }

  let ultimoCliqueGuia = { id: null, quando: 0 };

  function salvarNomeGrupo(valor) {
    if (!ui.renomeandoGrupo) return;
    const grupo = plano.grupos.find((g) => g.id === ui.renomeandoGrupo);
    ui.renomeandoGrupo = null;
    if (grupo && valor.trim() && valor.trim() !== grupo.nome) { grupo.nome = valor.trim(); alterou(); }
    desenharTudo();
  }

  // Arrastar guia reordena os grupos
  let arrastando = null;
  function aoArrastar(e) {
    const guia = e.target.closest('[data-grupo]');
    if (!guia) return;
    arrastando = guia.dataset.grupo;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', arrastando);
  }
  function aoArrastarSobre(e) {
    const guia = e.target.closest('[data-grupo]');
    if (!guia || !arrastando) return;
    e.preventDefault();
    raiz.querySelectorAll('.guia--alvo').forEach((g) => g.classList.remove('guia--alvo'));
    if (guia.dataset.grupo !== arrastando) guia.classList.add('guia--alvo');
  }
  function aoSoltar(e) {
    const guia = e.target.closest('[data-grupo]');
    if (!guia || !arrastando) return;
    e.preventDefault();
    const de = plano.grupos.findIndex((g) => g.id === arrastando);
    const para = plano.grupos.findIndex((g) => g.id === guia.dataset.grupo);
    arrastando = null;
    if (de < 0 || para < 0 || de === para) { desenharTudo(); return; }
    const [movido] = plano.grupos.splice(de, 1);
    plano.grupos.splice(para, 0, movido);
    alterou(); desenharTudo();
  }

  return { desenhar, aoMostrar };
})();
