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
      marcados: new Set(),     // talhões marcados na tabela
      filtroTalhoes: 'todos',  // todos | nao-planejados | rec:<id da recomendação>
      quadroAberto: false,     // quadro da recomendação filtrada: lista de produtos aberta
      erroNome: null,          // modal: nome da recomendação repetido
      definindo: null,         // modal "Definir recomendação" aberto: { talhoes, editando }
      renomeandoOp: null,
      renomeandoGrupo: null,
      preCadastro: null,       // { linhaId, produto, principioAtivo, unidade, erro }
      validarOp: null,         // operação com o preenchimento mínimo em vermelho (DAP ou recomendação)
      renomeandoNaLista: null, // operação com o nome em edição na lista (duplo clique, F2 ou botão direito)
      receitaPorOp: {},        // receita aberta em cada operação
      rascunho: null,          // cópia da receita aberta, editada até "Aplicar em N talhões": { receitaId, nome, produtos }
    };
    if (!somenteLeitura) limparReceitasVazias();
    raiz = conteudo.querySelector('#plano-raiz');
    raiz.addEventListener('click', aoClicar);
    raiz.addEventListener('contextmenu', aoMenuContexto);
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

  // Ao trocar de operação, grupo ou status: limpa a seleção da tabela e fecha o modal
  function limparSelecao() {
    ui.marcados = new Set();
    ui.definindo = null;
  }

  // ================= Desenho =================
  // Cabeçalho do plano fixo no topo e guias fixas embaixo; o que fica entre eles tem rolagem própria.
  // No grupo Defensivo, a lista de operações e o cartão da operação ocupam essa altura e só a
  // tabela de talhões rola.
  function desenharTudo() {
    const rolagemAntes = raiz.querySelector('.plano__rolagem')?.scrollTop || 0;
    const listaAntes = raiz.querySelector('.ops-lista__itens')?.scrollTop || 0;
    const modalAntes = raiz.querySelector('.definir-fundo')?.scrollTop || 0;
    const talhoesAntes = raiz.querySelector('.talhoes-rolagem')?.scrollTop || 0;
    raiz.innerHTML = `
      ${cabecalho()}
      <div class="plano__rolagem">
        ${etapa === 'operacoes' ? corpoOperacoes() : etapaEmConstrucao()}
      </div>
      ${etapa === 'operacoes' ? rodapeGrupos() : ''}
      ${etapa === 'operacoes' && ui.definindo && opAtual() ? modalDefinir(opAtual()) : ''}
    `;
    // Redesenhar não pode jogar a página (nem a lista de operações ou o modal) de volta ao topo
    raiz.querySelector('.plano__rolagem').scrollTop = rolagemAntes;
    const lista = raiz.querySelector('.ops-lista__itens');
    if (lista) lista.scrollTop = listaAntes;
    const modal = raiz.querySelector('.definir-fundo');
    if (modal) modal.scrollTop = modalAntes;
    const talhoes = raiz.querySelector('.talhoes-rolagem');
    if (talhoes) talhoes.scrollTop = talhoesAntes;
    const foco = raiz.querySelector('[data-foco-inicial]');
    if (foco) { foco.focus({ preventScroll: true }); foco.select?.(); }
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
        <div class="plano__linha">
        <a class="plano__titulo" href="#/plano-safra" title="Voltar para a Visão Geral">Plano de Safra</a>
        <p class="plano__contexto">${contexto.map(esc).join('<span class="plano__ponto">·</span>')}
          <button class="status status--botao ${somenteLeitura ? 'status--aprovado' : 'status--construcao'}" type="button"
                  data-acao="alternar-status" title="Protótipo: clique para alternar o status"
                  aria-label="Status: ${esc(plano.status)}. Protótipo: clique para alternar o status">${esc(plano.status)}</button></p>
        </div>
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
    const ops = operacoesOrdenadas(grupo);
    return `
      <aside class="cartao ops-lista" aria-label="Operações do grupo">
        <div class="ops-lista__topo">
          <h2 class="rotulo-secao">Operações</h2>
          <span class="ops-lista__rotulo-dap">DAP</span>
          <button class="botao-icone" type="button" data-acao="alternar-lista" title="Recolher lista"
                  aria-label="Recolher lista de operações">${Icones.recolher}</button>
        </div>
        <ul class="ops-lista__itens">
          ${ops.map((op) => itemOperacao(op, atual && op.id === atual.id)).join('')}
        </ul>
        ${somenteLeitura ? '' : `
          <button class="link-acao ops-lista__nova" type="button" data-acao="nova-op">${Icones.mais} Nova operação</button>`}
        ${grupo.operacoes.length === 0 ? '<p class="ops-lista__vazia">Nenhuma operação neste grupo.</p>' : ''}
      </aside>
    `;
  }

  // Clique abre a operação; duplo clique (ou F2) renomeia; botão direito abre Inserir · Excluir · Renomear
  function itemOperacao(op, ativo) {
    const nome = ui.renomeandoNaLista === op.id
      // Área de texto que cresce com o nome, para mostrá-lo inteiro (sem truncar); Enter não quebra linha
      ? `<textarea class="campo__controle ops-item__nome-campo" data-campo="lista-nome" data-op="${op.id}" rows="2"
                   aria-label="Nome da operação" data-foco-inicial>${esc(op.nome)}</textarea>`
      : `<button class="ops-item__nome" type="button" data-acao="abrir-op" data-op="${op.id}"
                 ${ativo ? 'aria-current="true"' : ''}
                 title="${somenteLeitura ? esc(op.nome) : `${esc(op.nome)} · clique duas vezes para renomear, botão direito para mais opções`}">${esc(op.nome)}</button>`;
    return `
      <li class="ops-item ${ativo ? 'ops-item--ativo' : ''}">
        ${nome}
        <span class="ops-item__dap">${op.dap ?? '—'}</span>
      </li>`;
  }

  function renomearNaLista(id) {
    ui.renomeandoNaLista = id; ui.renomeandoOp = null;
    desenharTudo();
  }

  function pararRenomearNaLista() {
    ui.renomeandoNaLista = null;
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
    // Primeiro os talhões, depois a recomendação: marca os talhões e "Definir recomendação" abre o modal
    return `
      <section class="cartao op-painel" aria-label="${esc(op.nome)}">
        ${cabecalhoOperacao(op)}
        ${painelTalhoes(op)}
      </section>`;
  }

  function cabecalhoOperacao(op) {
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
    // Nome, DAP e fenologia. Renomear e excluir ficam na lista de operações.
    return `
      <div class="op-cabecalho__linha">
        ${nomeOperacao(op)}
        <div class="op-cabecalho__campos">
          <div class="campo campo--inline"><label class="campo__rotulo" for="op-dap">DAP</label>${dap}</div>
          <div class="campo campo--inline"><label class="campo__rotulo" for="op-fenologia">Fenologia</label>${fenologia}</div>
        </div>
      </div>`;
  }

  // ----- Preenchimento mínimo para aplicar -----
  // DAP, ao menos uma linha na receita e, em cada linha, produto comercial e dose padrão
  // (a dose é do produto; o princípio ativo só ajuda a encontrar o produto).
  function errosRecomendacao(op) {
    const vazio = (v) => v === null || v === undefined || v === '';
    const r = receitaAtual(op);
    const fonte = r && ui.rascunho && ui.rascunho.receitaId === r.id ? ui.rascunho.produtos : (r ? r.produtos : []);
    const linhas = fonte.filter(Planos.linhaPreenchida);
    const porLinha = {};
    linhas.forEach((l) => {
      const e = { produto: !l.produto, dose: vazio(l.dose) };
      if (e.produto || e.dose) porLinha[l.id] = e;
    });
    const erros = { dap: vazio(op.dap), semLinhas: linhas.length === 0, linhas: porLinha };
    erros.algum = erros.dap || erros.semLinhas || Object.keys(porLinha).length > 0;
    return erros;
  }

  // Erros só aparecem depois que o usuário clicou em "Definir recomendação" ou "Aplicar em N talhões"
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
      ui.rascunho = { receitaId: r.id, nome: r.nome, produtos: r.produtos.map((l) => ({ ...l })) };
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
              (assinatura(ui.rascunho.produtos) !== assinatura(r.produtos) || ui.rascunho.nome.trim() !== r.nome));
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
      ui.rascunho = null; ui.preCadastro = null; ui.validarOp = null;
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

  // ----- Recomendação agronômica (dentro do modal "Definir recomendação") -----
  // Receita 1 | Receita 2 | + Nova receita · lixeira na ponta (age sobre a receita aberta)
  function listaReceitas(op, atual) {
    const guias = op.receitas.map((r) => {
      const ativa = atual && r.id === atual.id;
      return `
        <button class="receitas__guia ${ativa ? 'receitas__guia--ativa' : ''}" type="button" role="tab"
                aria-selected="${ativa ? 'true' : 'false'}" data-acao="abrir-receita" data-receita="${r.id}"
                title="${esc(r.nome)}">${esc(r.nome)}${qtdTalhoes(op, r)}</button>`;
    }).join('');
    return `
      <div class="receitas">
        <div class="receitas__guias" role="tablist" aria-label="Recomendações da operação">${guias}</div>
        ${somenteLeitura ? '' : `
          <button class="link-acao receitas__nova" type="button" data-acao="nova-receita">${Icones.mais} Nova recomendação</button>
          ${atual ? `
            <button class="botao-icone receitas__excluir" type="button" data-acao="excluir-receita"
                    title="Excluir a ${esc(atual.nome)}" aria-label="Excluir a ${esc(atual.nome)}">${Icones.lixeira}</button>` : ''}`}
      </div>`;
  }

  // Tabela da receita aberta: Princípio ativo · Produto comercial · Dose padrão · Unid.
  function corpoReceita(op, r) {
    const leitura = somenteLeitura;
    const linhas = leitura ? r.produtos.filter(Planos.linhaPreenchida) : rascunho(op).produtos;
    const erros = errosVisiveis(op);
    return `
      <div class="recomendacao__corpo">
        <div class="recomendacao__tabela">
          <table class="tabela tabela--compacta tabela-rec">
            <thead><tr>
              <th>Princípio ativo</th><th>Produto comercial</th><th class="tabela__numero">Dose padrão</th><th>Unid.</th>
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

  // Quantos talhões já usam a recomendação (na guia)
  function qtdTalhoes(op, r) {
    const n = Planos.talhoesDaReceita(op, r).length;
    return n ? `<span class="receitas__qtd"> · ${n} ${n === 1 ? 'talhão' : 'talhões'}</span>` : '';
  }

  function acoesReceita() {
    return `
      <div class="recomendacao__acoes">
        <button class="link-acao" type="button" data-acao="adicionar-linha">${Icones.mais} Adicionar produto</button>
      </div>`;
  }

  function etiquetaPre(linha) {
    return linha.preCadastro ? '<span class="etiqueta-pre">Pré-cadastro</span>' : '';
  }

  // Tipo do insumo (classe do cadastro: Fungicida, Inseticida, Herbicida…) em selo pequeno abaixo do nome.
  // Produto de pré-cadastro fica sem selo.
  function seloTipo(linha) {
    const d = !linha.preCadastro && linha.produto ? Planos.produtoDoCadastro(linha.produto) : null;
    if (!d || !d.classe) return '';
    return `<span class="etiqueta-tipo etiqueta-tipo--${Util.normalizar(d.classe).replace(/\s+/g, '-')}">${esc(d.classe)}</span>`;
  }

  function linhaRecomendacao(l, erro = {}, leitura = somenteLeitura) {
    if (leitura) {
      return `
        <tr>
          <td>${esc(l.principioAtivo || '—')}</td>
          <td>${esc(l.produto || '—')} ${etiquetaPre(l)}${seloTipo(l)}</td>
          <td class="tabela__numero">${Util.dose(l.dose) || '—'}</td>
          <td>${Planos.unidadeDose(l)}</td>
        </tr>`;
    }
    if (ui.preCadastro && ui.preCadastro.linhaId === l.id) return linhaPreCadastro(l);

    // Sem produto comercial não há unidade nem dose: o princípio ativo só filtra os produtos
    const semProduto = !l.produto;
    return `
      <tr data-linha="${l.id}">
        <td>${combo(l, 'pa', l.principioAtivo, 'Buscar princípio ativo', false)}</td>
        <td>${combo(l, 'produto', l.produto, 'Buscar produto', erro.produto)} ${etiquetaPre(l)}${seloTipo(l)}
          ${erro.produto ? '<p class="erro-campo">Escolha o produto comercial</p>' : ''}</td>
        <td class="tabela__numero" ${semProduto ? 'title="Escolha o produto comercial para informar a dose"' : ''}>
          <input class="campo__controle campo--compacto campo--dose ${erro.dose && !semProduto ? 'campo__controle--erro' : ''}" type="text" inputmode="decimal"
                 data-campo="linha-dose" value="${Util.dose(l.dose)}" placeholder="—" aria-label="Dose padrão"
                 ${semProduto ? 'disabled aria-describedby="dica-dose-produto"' : ''} ${erro.dose && !semProduto ? 'aria-invalid="true"' : ''}>
          ${erro.dose && !semProduto ? '<p class="erro-campo">Informação obrigatória</p>' : ''}
        </td>
        <td><span class="tabela-rec__unidade">${Planos.unidadeDose(l) || '—'}</span></td>
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
              <input class="campo__controle campo--compacto" data-pre="produto" value="${esc(pc.produto)}" placeholder="Produto comercial" aria-label="Produto comercial"
                     ${pc.produto ? '' : 'data-foco-inicial'}>
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

  // ----- Talhões da operação -----
  // Filtros Todos · recomendações · Não planejados; tabela Talhão · Área · produtos; marcar e "Definir recomendação"
  function talhoesVisiveis(op) {
    const rec = recFiltrada(op);
    if (rec) return talhoesFazenda.filter((t) => op.talhoes[t.nome] && op.talhoes[t.nome].receitaId === rec.id);
    return ui.filtroTalhoes === 'nao-planejados' ? talhoesFazenda.filter((t) => !op.talhoes[t.nome]) : talhoesFazenda;
  }

  // Recomendações já aplicadas em algum talhão (as que ganham etiqueta nos filtros)
  function recsAplicadas(op) {
    return op.receitas.filter((r) => Planos.talhoesDaReceita(op, r).length);
  }

  // Filtro de uma recomendação que deixou de existir (ou ficou sem talhões) volta para Todos
  function recFiltrada(op) {
    if (!ui.filtroTalhoes.startsWith('rec:')) return null;
    const r = recsAplicadas(op).find((x) => `rec:${x.id}` === ui.filtroTalhoes);
    if (!r) ui.filtroTalhoes = 'todos';
    return r || null;
  }

  // "Rec 1" enquanto tiver o nome padrão; renomeada, o nome dado
  function nomeCurto(r) {
    const m = /^Recomendação (\d+)$/.exec(r.nome);
    return m ? `Rec ${m[1]}` : r.nome;
  }

  // Cor de cada recomendação (bolinha na etiqueta e no talhão). Fora das cores dos tipos de insumo
  // (Herbicida roxo, Inseticida vermelho, Fungicida azul) para não confundir.
  const CORES_REC = ['#0f766e', '#be185d', '#8a6a2f', '#4d7c0f', '#475569'];
  function corRec(op, r) {
    return CORES_REC[op.receitas.indexOf(r) % CORES_REC.length];
  }

  function pontoRec(op, r) {
    return `<span class="rec-ponto" style="background: ${corRec(op, r)}" aria-hidden="true"></span>`;
  }

  // "DMA 806 BR (L/ha)"; sem produto comercial, só o princípio ativo (não há unidade)
  function rotuloProduto(l) {
    const u = Planos.unidadeDose(l);
    return `${esc(Planos.nomeLinha(l))}${u ? ` (${u})` : ''}`;
  }

  function painelTalhoes(op) {
    const rec = recFiltrada(op);
    const naoPlanejados = talhoesFazenda.filter((t) => !op.talhoes[t.nome]).length;
    const visiveis = talhoesVisiveis(op);
    const marcar = !somenteLeitura;
    const todos = visiveis.length > 0 && visiveis.every((t) => ui.marcados.has(t.nome));
    // Uma coluna por produto: os da recomendação filtrada, ou os de todas as recomendações aplicadas
    const colunas = rec ? rec.produtos.filter(Planos.linhaPreenchida) : Planos.colunasDose(op);
    const filtro = (valor, rotulo) => `
      <button class="filtro-talhoes ${ui.filtroTalhoes === valor ? 'filtro-talhoes--ativo' : ''}" type="button"
              data-acao="filtro-talhoes" data-filtro="${valor}" aria-pressed="${ui.filtroTalhoes === valor}">${rotulo}</button>`;
    const vazio = !talhoesFazenda.length ? `Nenhum talhão cadastrado na fazenda ${esc(plano.fazenda)}.`
      : !visiveis.length ? 'Todos os talhões já têm recomendação.' : '';
    const nColunas = colunas.length + (marcar ? 3 : 2);
    return `
      <div class="filtros-talhoes" role="group" aria-label="Filtrar talhões">
        ${filtro('todos', `Todos · ${talhoesFazenda.length}`)}
        ${recsAplicadas(op).map((r) => filtro(`rec:${r.id}`, `${pontoRec(op, r)}${esc(nomeCurto(r))}`)).join('')}
        ${filtro('nao-planejados', `Não planejados · ${naoPlanejados}`)}
      </div>
      ${rec ? quadroRec(op, rec) : ''}
      <div class="talhoes-rolagem">
        <table class="tabela tabela--compacta tabela-talhoes">
          <thead><tr>
            ${marcar ? `<th class="tabela__marcar"><input type="checkbox" data-acao="marcar-todos" aria-label="Marcar todos"
                 ${todos ? 'checked' : ''} ${visiveis.length ? '' : 'disabled'}></th>` : ''}
            <th>Talhão</th><th class="tabela__numero">Área (ha)</th>
            ${colunas.map((l) => `<th class="tabela__numero">${rotuloProduto(l)} ${etiquetaPre(l)}${seloTipo(l)}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${vazio ? `<tr><td class="tabela__vazia" colspan="${nColunas}">${vazio}</td></tr>` : visiveis.map((t) => {
              const ajuste = op.talhoes[t.nome];
              const r = ajuste ? Planos.receitaDoTalhao(op, ajuste) : null;
              const doses = colunas.map((col) => {
                const l = ajuste ? Planos.linhaNoTalhao(op, ajuste, col) : null;
                if (!l) return '<td class="tabela__numero tabela__nao-recebe">—</td>';
                const d = Planos.doseTalhao(op, ajuste, l);
                return `<td class="tabela__numero">${d === null || d === undefined ? '—' : Util.dose(d)}</td>`;
              }).join('');
              return `
                <tr>
                  ${marcar ? `<td class="tabela__marcar"><input type="checkbox" data-acao="marcar" data-talhao="${esc(t.nome)}"
                      aria-label="Marcar ${esc(t.nome)}" ${ui.marcados.has(t.nome) ? 'checked' : ''}></td>` : ''}
                  <th scope="row" class="tabela__talhao">${r ? `${pontoRec(op, r)}<span class="so-leitor">${esc(r.nome)}: </span>` : ''}${esc(t.nome)}</th>
                  <td class="tabela__numero">${Util.area(t.area).replace(' ha', '')}</td>
                  ${doses}
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${marcar ? barraDefinir() : ''}`;
  }

  // Quadro da recomendação filtrada: nome · talhões · área, "Editar" e "Ver produtos" (começa recolhido)
  function quadroRec(op, r) {
    const talhoes = Planos.talhoesDaReceita(op, r);
    const area = talhoesFazenda.filter((t) => talhoes.includes(t.nome)).reduce((s, t) => s + t.area, 0);
    const aberto = ui.quadroAberto;
    const produtos = r.produtos.filter(Planos.linhaPreenchida);
    return `
      <section class="quadro-rec" aria-label="${esc(r.nome)}">
        <div class="quadro-rec__topo">
          ${pontoRec(op, r)}
          <p class="quadro-rec__titulo"><strong>${esc(nomeCurto(r))}</strong> · ${talhoes.length} ${talhoes.length === 1 ? 'talhão' : 'talhões'} · ${Util.area(area)}</p>
          ${somenteLeitura ? '' : `
            <button class="botao botao--secundario botao--p" type="button" data-acao="editar-rec" data-rec="${r.id}">${Icones.lapis} Editar</button>`}
          <button class="botao botao--secundario botao--p quadro-rec__alternar" type="button" data-acao="alternar-quadro"
                  aria-expanded="${aberto}" aria-controls="quadro-produtos">${aberto ? 'Ocultar produtos' : 'Ver produtos'} ${Icones.abaixo}</button>
        </div>
        ${aberto ? `
          <ul class="quadro-rec__produtos" id="quadro-produtos">
            ${produtos.map((l) => `<li>${[l.principioAtivo, l.produto].filter(Boolean).map(esc).join(' · ')} · <strong>${Util.dose(l.dose) || '—'} ${Planos.unidadeDose(l)}</strong></li>`).join('')}
          </ul>` : ''}
      </section>`;
  }

  // Sem talhão marcado: orientação em destaque e botão desabilitado.
  // Com talhão marcado: quantidade e área à esquerda; Limpar e "Definir recomendação" à direita.
  function barraDefinir() {
    const n = ui.marcados.size;
    const area = talhoesFazenda.filter((t) => ui.marcados.has(t.nome)).reduce((s, t) => s + t.area, 0);
    return `
      <div class="barra-definir ${n ? '' : 'barra-definir--vazia'}">
        ${n ? `
          <span class="barra-definir__selecao"><strong>${n} ${n === 1 ? 'talhão' : 'talhões'}</strong> · ${Util.area(area)}</span>
          <button class="botao botao--secundario barra-definir__limpar" type="button" data-acao="limpar-selecao"
                  title="Desmarcar todos os talhões" aria-label="Limpar seleção: desmarcar todos os talhões">Limpar</button>`
        : `<span class="barra-definir__texto">${Icones.info} Selecione um ou mais talhões para definir a recomendação.</span>`}
        <button class="botao botao--primario" type="button" data-acao="definir-recomendacao" ${n ? '' : 'disabled'}>Definir recomendação</button>
      </div>`;
  }

  // ----- Modal "Definir recomendação" -----
  // Fica dentro da tela (não no Modal genérico) para reaproveitar a busca de produto, o pré-cadastro,
  // as guias de recomendação e o rascunho, que dependem dos eventos da tela.
  function abrirDefinir(op) {
    const talhoes = talhoesFazenda.filter((t) => ui.marcados.has(t.nome)).map((t) => t.nome);
    if (!talhoes.length) return;
    if (semDap(op)) return;
    ui.rascunho = null; ui.preCadastro = null; ui.validarOp = null; ui.erroNome = null;
    // Talhões marcados que já estão todos na mesma recomendação: abre nela.
    // Senão, abre uma recomendação nova (Recomendação 2, Rec 2…), com produto e dose em branco;
    // as já existentes continuam nas guias. Se o modal for cancelado, a nova vazia é descartada.
    const receitas = new Set(talhoes.map((t) => op.talhoes[t] && op.talhoes[t].receitaId));
    const comum = receitas.size === 1 ? [...receitas][0] : null;
    if (comum) {
      ui.receitaPorOp[op.id] = comum;
    } else {
      const nova = Planos.novaReceita(op);
      op.receitas.push(nova);
      ui.receitaPorOp[op.id] = nova.id;
    }
    ui.definindo = { talhoes };
    // Foco no próprio modal (focar a busca abriria a lista de produtos por cima de tudo)
    desenharMantendoFoco('.definir');
  }

  // Sem DAP não dá para aplicar: mostra o erro no cabeçalho e não abre o modal
  function semDap(op) {
    if (op.dap !== null && op.dap !== undefined && op.dap !== '') return false;
    ui.validarOp = op.id; desenharTudo(); raiz.querySelector('#op-dap')?.focus();
    return true;
  }

  // "Editar" no quadro: abre o modal na recomendação, valendo para os talhões dela (sem as outras guias)
  function abrirEditar(op, id) {
    const r = op.receitas.find((x) => x.id === id);
    if (!r || semDap(op)) return;
    ui.rascunho = null; ui.preCadastro = null; ui.validarOp = null; ui.erroNome = null;
    ui.receitaPorOp[op.id] = r.id;
    const talhoes = talhoesFazenda.map((t) => t.nome).filter((t) => op.talhoes[t] && op.talhoes[t].receitaId === r.id);
    ui.definindo = { talhoes, editando: true };
    desenharMantendoFoco('.definir');
  }

  // Cancelar, X ou Esc: descarta o que foi feito no modal (sem perguntar) e mantém os talhões marcados
  function fecharDefinir() {
    const op = opAtual();
    const editando = ui.definindo && ui.definindo.editando;
    ui.rascunho = null; ui.preCadastro = null; ui.validarOp = null; ui.erroNome = null;
    ui.definindo = null;
    if (op) {
      op.receitas.filter((r) => receitaVazia(op, r)).forEach((r) => op.receitas.splice(op.receitas.indexOf(r), 1));
      if (!op.receitas.some((r) => r.id === ui.receitaPorOp[op.id])) delete ui.receitaPorOp[op.id];
    }
    desenharMantendoFoco(editando ? '[data-acao="editar-rec"]' : '[data-acao="definir-recomendacao"]');
  }

  function modalDefinir(op) {
    const { talhoes, editando } = ui.definindo;
    const n = talhoes.length;
    const area = talhoesFazenda.filter((t) => talhoes.includes(t.nome)).reduce((s, t) => s + t.area, 0);
    const r = receitaAtual(op);
    // A recomendação aberta já está em outros talhões: alterar produtos ou doses muda esses talhões também
    const outros = r ? Planos.talhoesDaReceita(op, r).filter((t) => !talhoes.includes(t)).length : 0;
    return `
      <div class="definir-fundo">
        <div class="definir" role="dialog" aria-modal="true" aria-labelledby="definir-titulo" tabindex="-1">
          <div class="definir__topo">
            <div class="definir__titulos">
              <h2 class="definir__titulo" id="definir-titulo">${editando ? 'Editar recomendação' : 'Definir recomendação'}</h2>
              <p class="definir__op">${esc(op.nome)} · DAP ${op.dap}</p>
              <p class="definir__alvo">${n} ${n === 1 ? 'talhão' : 'talhões'} · ${Util.area(area)}</p>
            </div>
            <button class="botao-icone" type="button" data-acao="fechar-definir" aria-label="Fechar">${Icones.fechar}</button>
          </div>
          <div class="definir__corpo">
            ${editando ? '' : listaReceitas(op, r)}
            ${r && !somenteLeitura ? campoNome(op) : ''}
            ${outros ? `<p class="definir__aviso">${Icones.info} ${esc(r.nome)} já está em ${outros} ${outros === 1 ? 'outro talhão' : 'outros talhões'}.
              Se alterar produtos ou doses, ${outros === 1 ? 'ele também muda' : 'eles também mudam'}.</p>` : ''}
            ${r ? corpoReceita(op, r) : `
              <p class="recomendacao__vazia">Nenhuma recomendação nesta operação. Use "+ Nova recomendação" para criar.</p>`}
          </div>
          <div class="definir__rodape">
            ${editando && r && !somenteLeitura ? `
              <button class="botao botao--perigo-leve definir__excluir" type="button" data-acao="excluir-rec-editando">${Icones.lixeira} Excluir recomendação</button>` : ''}
            <button class="botao botao--secundario" type="button" data-acao="fechar-definir">Cancelar</button>
            <button class="botao botao--primario" type="button" data-acao="aplicar-definicao" ${r ? '' : 'disabled'}>${editando
              ? 'Salvar alterações' : `Aplicar em ${n} ${n === 1 ? 'talhão' : 'talhões'}`}</button>
          </div>
        </div>
      </div>`;
  }

  // Nome da recomendação num campo visível (no teste, ninguém achou o renomear por duplo clique)
  function campoNome(op) {
    const nome = rascunho(op).nome;
    return `
      <div class="campo definir__nome">
        <label class="campo__rotulo" for="rec-nome">Nome da recomendação</label>
        <input class="campo__controle ${ui.erroNome ? 'campo__controle--erro' : ''}" id="rec-nome" data-campo="nome-rec"
               value="${esc(nome)}" autocomplete="off" ${ui.erroNome ? 'aria-invalid="true" aria-describedby="rec-nome-erro"' : ''}>
        ${ui.erroNome ? `<p class="erro-campo" id="rec-nome-erro">${ui.erroNome}</p>` : ''}
      </div>`;
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
                      title="${somenteLeitura ? esc(g.nome) : `${esc(g.nome)} · duplo clique para renomear, botão direito para mais opções, arraste para reordenar`}">${esc(g.nome)}</button>`;
          }).join('')}
          ${somenteLeitura ? '' : `<button class="guia guia--mais" type="button" data-acao="novo-grupo" title="Novo grupo"
                                     aria-label="Novo grupo de operações">${Icones.mais}</button>`}
        </div>
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
    // "+ Pré-cadastrar" sempre como última opção quando há texto digitado (princípio ativo e produto comercial)
    if (texto.trim()) opcoes.push({ preCadastrar: true, valor: texto.trim(), rotulo: `${Icones.mais} Pré-cadastrar "${esc(texto.trim())}"` });
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
      // Pelo princípio ativo, o texto vai para o Princípio ativo; o produto comercial continua obrigatório
      ui.preCadastro = tipo === 'pa'
        ? { linhaId: linha.id, produto: '', principioAtivo: valor, unidade: '', erro: '' }
        : { linhaId: linha.id, produto: valor, principioAtivo: linha.principioAtivo || '', unidade: '', erro: '' };
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
        // Dois cliques seguidos no nome = renomear (como nas guias). Feito à mão porque
        // o primeiro clique redesenha a lista e o dblclick do navegador se perderia.
        const agora = Date.now();
        const duplo = ultimoCliqueOp.id === id && agora - ultimoCliqueOp.quando < 450;
        ultimoCliqueOp = { id, quando: agora };
        if (duplo && !somenteLeitura && !ui.listaRecolhida) { renomearNaLista(id); break; }
        if (op && op.id === id) break;
        sairDaReceita(() => {
          ui.opPorGrupo[grupo.id] = id; ui.renomeandoOp = null;
          limparSelecao(); desenharTudo();
        });
        break;
      }

      case 'nova-op': sairDaReceita(() => criarOperacao(grupo)); break;

      case 'alternar-status':
        sairDaReceita(() => {
          plano.status = somenteLeitura ? 'Em construção' : 'Aprovado';
          somenteLeitura = plano.status === 'Aprovado';
          ui.renomeandoOp = null; ui.renomeandoGrupo = null;
          limparSelecao(); pararRenomearNaLista();
          desenharMantendoFoco('[data-acao="alternar-status"]');
        }, { removerVazia: false });
        break;

      case 'abrir-receita': {
        const id = alvo.dataset.receita;
        if (receitaAtual(op)?.id === id) break;
        ui.erroNome = null;
        sairDaReceita(() => { ui.receitaPorOp[op.id] = id; desenharTudo(); });
        break;
      }

      case 'nova-receita':
        sairDaReceita(() => {
          const nova = Planos.novaReceita(op);
          op.receitas.push(nova);
          ui.receitaPorOp[op.id] = nova.id;
          desenharTudo();
          raiz.querySelector('.tabela-rec tbody tr:last-child [data-combo="pa"]')?.focus();
        });
        break;

      case 'excluir-receita': excluirReceita(op, receitaAtual(op)); break;

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

      case 'filtro-talhoes':
        ui.filtroTalhoes = alvo.dataset.filtro; ui.marcados = new Set(); ui.quadroAberto = false;
        desenharMantendoFoco(`[data-filtro="${alvo.dataset.filtro}"]`); break;

      case 'marcar':
        if (alvo.checked) ui.marcados.add(alvo.dataset.talhao); else ui.marcados.delete(alvo.dataset.talhao);
        desenharMantendoFoco(`[data-acao="marcar"][data-talhao="${alvo.dataset.talhao}"]`); break;

      case 'marcar-todos':
        talhoesVisiveis(op).forEach((t) => { if (alvo.checked) ui.marcados.add(t.nome); else ui.marcados.delete(t.nome); });
        desenharMantendoFoco('[data-acao="marcar-todos"]'); break;

      case 'limpar-selecao':
        ui.marcados = new Set(); desenharMantendoFoco('[data-acao="marcar-todos"]'); break;

      case 'definir-recomendacao': abrirDefinir(op); break;
      case 'editar-rec': abrirEditar(op, alvo.dataset.rec); break;
      case 'excluir-rec-editando': excluirReceita(op, receitaAtual(op)); break;
      case 'alternar-quadro':
        ui.quadroAberto = !ui.quadroAberto; desenharMantendoFoco('[data-acao="alternar-quadro"]'); break;
      case 'fechar-definir': fecharDefinir(); break;
      case 'aplicar-definicao': aplicarDefinicao(op); break;

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
          limparSelecao(); pararRenomearNaLista(); desenharTudo();
        });
        break;
      }

      case 'novo-grupo': sairDaReceita(novoGrupo); break;
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
      // Já registrada ao digitar; sem redesenhar, para o clique em "Aplicar" valer de primeira
      e.target.value = Util.dose(Util.numero(e.target.value));
    } else if (e.target.dataset.pre) {
      ui.preCadastro[e.target.dataset.pre] = e.target.value;
    }
  }

  function aoDigitar(e) {
    // Doses: registradas enquanto se digita, sem redesenhar
    if (e.target.dataset.campo === 'linha-dose') {
      // Só números e uma vírgula decimal; o ponto digitado vira vírgula
      let v = e.target.value.replace(/\./g, ',').replace(/[^\d,]/g, '');
      const virgula = v.indexOf(',');
      if (virgula >= 0) v = v.slice(0, virgula + 1) + v.slice(virgula + 1).replace(/,/g, '');
      if (v !== e.target.value) e.target.value = v;
      linhaDoElemento(e.target).dose = Util.numero(e.target.value);
      return;
    }
    if (e.target.dataset.campo === 'nome-rec') { rascunho(opAtual()).nome = e.target.value; return; }
    if (e.target.dataset.combo) { abrirCombo(e.target); return; }
    if (e.target.dataset.pre) { ui.preCadastro[e.target.dataset.pre] = e.target.value; return; }
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
    if (el.dataset.campo === 'nome-grupo') salvarNomeGrupo(el.value);
    if (el.dataset.campo === 'lista-nome') {
      // Sair do campo salva o nome. Se o foco foi para um botão da tela, o clique dele redesenha;
      // redesenhar aqui o faria se perder.
      salvarNomeNaLista(el.value, { redesenhar: !e.relatedTarget?.closest?.('[data-acao]') });
    }
  }

  function aoTeclar(e) {
    const el = e.target;
    // Lista de operações: F2 no nome abre o campo; no campo, Enter confirma e Esc desfaz
    if (el.dataset.acao === 'abrir-op' && e.key === 'F2' && !somenteLeitura && !ui.listaRecolhida) {
      e.preventDefault(); renomearNaLista(el.dataset.op); return;
    }
    if (el.dataset.campo === 'lista-nome') {
      const id = el.dataset.op;
      if (e.key === 'Enter') {
        e.preventDefault();
        salvarNomeNaLista(el.value, { redesenhar: false });
        desenharMantendoFoco(`[data-acao="abrir-op"][data-op="${id}"]`);
      } else if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        pararRenomearNaLista();
        desenharMantendoFoco(`[data-acao="abrir-op"][data-op="${id}"]`);
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
    if (el.dataset.campo === 'nome-op' || el.dataset.campo === 'nome-grupo') {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        ui.renomeandoOp = null; ui.renomeandoGrupo = null; desenharTudo();
      }
      return;
    }
    if (el.dataset.pre && e.key === 'Enter') { e.preventDefault(); salvarPreCadastro(opAtual()); }
    if ((el.dataset.campo === 'op-dap' || el.dataset.campo === 'linha-dose') && e.key === 'Enter') {
      e.preventDefault(); el.blur();
    }
    // Esc fecha o modal "Definir recomendação" (os campos acima já tratam o próprio Esc)
    if (e.key === 'Escape' && ui.definindo && el.closest('.definir')) { e.preventDefault(); fecharDefinir(); }
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

  // Nome vazio volta ao anterior
  function salvarNomeNaLista(valor, { redesenhar = true } = {}) {
    if (!ui.renomeandoNaLista) return;
    const op = grupoAtual().operacoes.find((o) => o.id === ui.renomeandoNaLista);
    pararRenomearNaLista();
    const v = valor.trim();
    if (op && v && v !== op.nome) { op.nome = v; alterou(); }
    if (redesenhar) desenharTudo();
  }

  function criarOperacao(grupo) {
    const nova = Planos.novaOperacao('Nova operação', null);
    grupo.operacoes.push(nova);
    ui.opPorGrupo[grupo.id] = nova.id; ui.renomeandoOp = nova.id;
    limparSelecao(); alterou(); desenharTudo();
  }

  // Exclui a operação pelo botão direito (hipótese a validar com clientes).
  // Com talhões: confirmação com o impacto. Sem talhões: exclui na hora, com Desfazer.
  function excluirOperacao(grupo, op) {
    const talhoes = Object.keys(op.talhoes).length;
    const produtos = new Set(op.receitas.flatMap((r) => r.produtos)
      .filter(Planos.linhaPreenchida).map(Planos.chaveLinha)).size;
    const ultima = grupo.operacoes.length === 1;
    const nome = esc(op.nome);
    const remover = () => {
      const indice = grupo.operacoes.indexOf(op);
      grupo.operacoes.splice(indice, 1);
      // Se a operação aberta saiu, abre a primeira restante (opAtual cai nela)
      if (ui.opPorGrupo[grupo.id] === op.id) delete ui.opPorGrupo[grupo.id];
      limparSelecao(); alterou(); desenharTudo();
      return indice;
    };
    if (talhoes) {
      Modal.confirmar({
        titulo: `Excluir ${nome}?`,
        texto: `Ela está aplicada em ${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'}`
          + `${produtos ? `, com ${produtos} ${produtos === 1 ? 'produto' : 'produtos'}` : ''}.`
          + `${ultima ? ` O grupo ${esc(grupo.nome)} ficará sem operações.` : ''}`
          + ' Essa ação não pode ser desfeita.',
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir operação', classe: 'perigo', acao: () => {
          remover(); Aviso.mostrar(`${nome} excluída`);
        } }]
      });
    } else {
      const indice = remover();
      Aviso.mostrar(`${nome} excluída${ultima ? `. O grupo ${esc(grupo.nome)} ficou sem operações` : ''}`, { acao: 'Desfazer', aoAgir: () => {
        grupo.operacoes.splice(Math.min(indice, grupo.operacoes.length), 0, op);
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

  // ----- Excluir receita -----
  // Com talhões: confirmação com o impacto (os talhões ficam sem operação). Sem talhões: na hora, com Desfazer.
  function excluirReceita(op, r) {
    if (!r) return;
    const talhoes = Planos.talhoesDaReceita(op, r);
    const remover = () => {
      const indice = op.receitas.indexOf(r);
      op.receitas.splice(indice, 1);
      talhoes.forEach((t) => { delete op.talhoes[t]; });
      delete ui.receitaPorOp[op.id];
      ui.rascunho = null; ui.validarOp = null; ui.preCadastro = null; ui.erroNome = null;
      // Pelo "Editar recomendação", o modal fecha (a recomendação editada deixou de existir)
      if (ui.definindo && ui.definindo.editando) ui.definindo = null;
      alterou(); desenharTudo();
      return indice;
    };
    const n = talhoes.length;
    if (n) {
      const area = talhoesFazenda.filter((t) => talhoes.includes(t.nome)).reduce((s, t) => s + t.area, 0);
      Modal.confirmar({
        titulo: `Excluir ${esc(nomeCurto(r))}?`,
        texto: `${n === 1 ? 'O talhão' : `Os ${n} talhões`} (${Util.area(area)}) ${n === 1 ? 'ficará' : 'ficarão'} sem recomendação. Essa ação não pode ser desfeita.`,
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir recomendação', classe: 'perigo', acao: () => {
          remover(); Aviso.mostrar(`${esc(nomeCurto(r))} excluída`);
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

  // ----- Aplicar a recomendação nos talhões marcados -----
  // Grava o rascunho na recomendação e liga os talhões marcados a ela (um talhão fica em uma recomendação só
  // na operação: o que estava em outra muda para esta). Os talhões que já usavam a recomendação recebem
  // as alterações: dose padrão nova chega a quem segue o padrão; produto removido ou trocado sai de todos.
  function aplicarDefinicao(op) {
    const r = receitaAtual(op);
    if (!r) return;
    if (errosRecomendacao(op).algum) { ui.validarOp = op.id; desenharTudo(); return; }
    // Nome vazio volta ao anterior; nome repetido na operação não é aceito
    const nome = rascunho(op).nome.trim() || r.nome;
    if (op.receitas.some((x) => x !== r && Util.normalizar(x.nome) === Util.normalizar(nome))) {
      ui.erroNome = 'Já existe uma recomendação com esse nome'; desenharMantendoFoco('#rec-nome'); return;
    }
    r.nome = nome;
    const novas = rascunho(op).produtos.filter(Planos.linhaPreenchida).map((l) => ({ ...l }));
    Planos.talhoesDaReceita(op, r).forEach((t) => {
      const doses = op.talhoes[t].doses;
      Object.keys(doses).forEach((id) => {
        const antes = r.produtos.find((l) => l.id === id);
        const depois = novas.find((l) => l.id === id);
        if (!depois || !antes || Planos.chaveLinha(antes) !== Planos.chaveLinha(depois)) delete doses[id];
      });
    });
    r.produtos = novas;
    const { talhoes, editando } = ui.definindo;
    talhoes.forEach((t) => {
      const a = op.talhoes[t];
      if (!a || a.receitaId !== r.id) op.talhoes[t] = Planos.novoAjuste(r.id);
    });
    ui.rascunho = null; ui.validarOp = null; ui.preCadastro = null; ui.erroNome = null;
    limparSelecao(); alterou(); desenharTudo();
    const n = talhoes.length;
    Aviso.mostrar(editando ? `${esc(r.nome)} salva` : `${esc(r.nome)} aplicada em ${n} ${n === 1 ? 'talhão' : 'talhões'}`);
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
      modal.fechar(); limparSelecao(); pararRenomearNaLista(); alterou(); desenharTudo();
    });
    form.elements.nome.focus();
  }

  function excluirGrupo(grupo) {
    const remover = () => {
      const indice = plano.grupos.indexOf(grupo);
      const eraAtual = grupo === grupoAtual();
      plano.grupos.splice(indice, 1);
      // pelo botão direito dá para excluir outra guia: a aberta só muda se for a excluída
      if (eraAtual) ui.grupoId = (plano.grupos[indice] || plano.grupos[indice - 1] || {}).id || null;
      pararRenomearNaLista();
      limparSelecao(); alterou(); desenharTudo();
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

  let ultimoCliqueOp = { id: null, quando: 0 };

  // Botão direito (ou tecla de menu / Shift+F10) na guia de grupo ou no nome da operação:
  // Inserir · Excluir · Renomear, como no Excel
  let menuContexto = null;

  function aoMenuContexto(e) {
    if (somenteLeitura) return;
    const guia = e.target.closest('.guia[data-grupo]');
    const nomeOp = !ui.listaRecolhida && e.target.closest('.ops-item__nome[data-op]');
    const ancora = guia || nomeOp;
    if (!ancora) return;
    e.preventDefault();
    // Pelo teclado o evento vem sem coordenadas: abre junto do elemento
    const caixa = ancora.getBoundingClientRect();
    const x = e.clientX || caixa.left;
    const y = e.clientY || (guia ? caixa.top : caixa.bottom);

    if (guia) {
      const grupo = plano.grupos.find((g) => g.id === guia.dataset.grupo);
      if (!grupo) return;
      abrirMenuContexto(ancora, x, y, `Grupo ${grupo.nome}`, {
        inserir: () => sairDaReceita(novoGrupo),
        excluir: () => sairDaReceita(() => excluirGrupo(grupo)),
        renomear: () => sairDaReceita(() => {
          ui.grupoId = grupo.id; ui.renomeandoOp = null;
          limparSelecao(); pararRenomearNaLista();
          ui.renomeandoGrupo = grupo.id;
          desenharTudo();
        })
      });
    } else {
      const grupo = grupoAtual();
      const op = grupo.operacoes.find((o) => o.id === nomeOp.dataset.op);
      if (!op) return;
      abrirMenuContexto(ancora, x, y, op.nome, {
        inserir: () => sairDaReceita(() => criarOperacao(grupo)),
        excluir: () => sairDaReceita(() => excluirOperacao(grupo, op)),
        renomear: () => sairDaReceita(() => {
          ui.opPorGrupo[grupo.id] = op.id;
          limparSelecao(); renomearNaLista(op.id);
        })
      });
    }
  }

  function abrirMenuContexto(ancora, x, y, rotulo, acoes) {
    fecharMenuContexto();
    const menu = document.createElement('div');
    menu.className = 'menu-contexto';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', rotulo);
    menu.innerHTML = `
      <button class="menu-contexto__item" type="button" role="menuitem" data-item="inserir">Inserir</button>
      <button class="menu-contexto__item" type="button" role="menuitem" data-item="excluir">Excluir</button>
      <button class="menu-contexto__item" type="button" role="menuitem" data-item="renomear">Renomear</button>`;
    document.body.appendChild(menu);

    // Abre no ponto do clique; sobe quando não cabe embaixo (caso das guias, no rodapé)
    const { width, height } = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - width - 8))}px`;
    menu.style.top = `${y + height + 8 > window.innerHeight ? Math.max(8, y - height) : y}px`;

    const itens = [...menu.querySelectorAll('.menu-contexto__item')];
    const fecharFora = (ev) => { if (!menu.contains(ev.target)) fecharMenuContexto(); };
    const fecharSemFoco = () => fecharMenuContexto();

    menu.addEventListener('click', (ev) => {
      const item = ev.target.closest('[data-item]');
      if (!item) return;
      fecharMenuContexto();
      acoes[item.dataset.item]();
    });
    menu.addEventListener('keydown', (ev) => {
      const i = itens.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); itens[(i + 1) % itens.length].focus(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); itens[(i - 1 + itens.length) % itens.length].focus(); }
      else if (ev.key === 'Escape' || ev.key === 'Tab') {
        ev.preventDefault(); fecharMenuContexto();
        if (ancora.isConnected) ancora.focus();
      }
    });
    document.addEventListener('mousedown', fecharFora, true);
    window.addEventListener('resize', fecharSemFoco);
    window.addEventListener('scroll', fecharSemFoco, true);

    menuContexto = { menu, fecharFora, fecharSemFoco };
    itens[0].focus();
  }

  function fecharMenuContexto() {
    if (!menuContexto) return;
    document.removeEventListener('mousedown', menuContexto.fecharFora, true);
    window.removeEventListener('resize', menuContexto.fecharSemFoco);
    window.removeEventListener('scroll', menuContexto.fecharSemFoco, true);
    menuContexto.menu.remove();
    menuContexto = null;
  }

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
