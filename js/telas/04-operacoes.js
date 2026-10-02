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
      ajuste: null             // ajustes em preparo no modo ajustar
    };
    raiz = conteudo.querySelector('#plano-raiz');
    raiz.addEventListener('click', aoClicar);
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
  }

  // ================= Desenho =================
  function desenharTudo() {
    raiz.innerHTML = `
      ${cabecalho()}
      ${etapa === 'operacoes' ? corpoOperacoes() + rodapeGrupos() : etapaEmConstrucao()}
    `;
    const foco = raiz.querySelector('[data-foco-inicial]');
    if (foco) { foco.focus(); foco.select?.(); }
  }

  function cabecalho() {
    const contexto = [`Safra ${plano.safra}`, plano.empresa, `Fazenda ${plano.fazenda}`, `Cultura ${plano.cultura}`];
    return `
      <header class="plano__cabecalho">
        <a class="plano__titulo" href="#/plano-safra" title="Voltar para a Visão Geral">Plano de Safra</a>
        <p class="plano__contexto">${contexto.map(esc).join('<span class="plano__ponto">·</span>')}
          ${somenteLeitura ? '<span class="status status--aprovado">Aprovado</span>' : ''}</p>
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
        </aside>`;
    }
    return `
      <aside class="cartao ops-lista" aria-label="Operações do grupo">
        <div class="ops-lista__topo">
          <h2 class="rotulo-secao">Operações</h2>
          <span class="ops-lista__rotulo-dap">DAP</span>
          <button class="botao-icone" type="button" data-acao="alternar-lista" title="Recolher lista"
                  aria-label="Recolher lista de operações">${Icones.recolher}</button>
        </div>
        <ul class="ops-lista__itens">
          ${operacoesOrdenadas(grupo).map((op) => itemOperacao(op, atual && op.id === atual.id)).join('')}
        </ul>
        ${somenteLeitura ? '' : `
          <button class="link-acao ops-lista__nova" type="button" data-acao="nova-op">${Icones.mais} Nova operação</button>`}
        ${grupo.operacoes.length === 0 ? '<p class="ops-lista__vazia">Nenhuma operação neste grupo.</p>' : ''}
      </aside>
    `;
  }

  function itemOperacao(op, ativo) {
    if (ui.renomeandoOp === op.id) {
      return `
        <li class="ops-item ops-item--ativo">
          <input class="campo__controle campo--compacto" data-campo="nome-op" value="${esc(op.nome)}"
                 aria-label="Nome da operação" data-foco-inicial>
        </li>`;
    }
    // O DAP sempre aparece; no item selecionado, lápis e lixeira ficam ao lado dele
    const acoes = ativo && !somenteLeitura
      ? `<span class="ops-item__acoes">
           <button class="botao-icone botao-icone--p" type="button" data-acao="renomear-op" title="Renomear operação"
                   aria-label="Renomear ${esc(op.nome)}">${Icones.lapis}</button>
           <button class="botao-icone botao-icone--p" type="button" data-acao="excluir-op" title="Excluir operação"
                   aria-label="Excluir ${esc(op.nome)}">${Icones.lixeira}</button>
         </span>`
      : '';
    const lado = `<span class="ops-item__dap">${op.dap ?? '—'}</span>${acoes}`;
    return `
      <li class="ops-item ${ativo ? 'ops-item--ativo' : ''}">
        <button class="ops-item__nome" type="button" data-acao="abrir-op" data-op="${op.id}"
                ${ativo ? 'aria-current="true"' : ''} title="${esc(op.nome)}">${esc(op.nome)}</button>
        ${lado}
      </li>`;
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
        <div class="cartao op-cabecalho"><h2 class="op-cabecalho__nome">${esc(op.nome)}</h2>
          <span class="op-cabecalho__dap-texto">DAP: <strong>${op.dap ?? '—'}</strong></span></div>
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
    return `
      <div class="cartao op-cabecalho">
        <h2 class="op-cabecalho__nome">${esc(op.nome)}</h2>
        <div class="op-cabecalho__campos">
          <div class="campo campo--inline"><label class="campo__rotulo" for="op-dap">DAP</label>${dap}</div>
          <div class="campo campo--inline"><label class="campo__rotulo" for="op-fenologia">Fenologia</label>${fenologia}</div>
        </div>
        <ul class="op-resumo" aria-label="Resumo da operação">
          <li>${Icones.mapa}<strong>${Util.area(r.area).replace(' ha', '')}</strong> ha</li>
          <li>${Icones.talhoes}<strong>${r.talhoes}</strong> ${r.talhoes === 1 ? 'talhão' : 'talhões'}</li>
          <li class="${r.pendentes ? 'op-resumo--alerta' : ''}">${Icones.alerta}<strong>${r.pendentes}</strong> ${r.pendentes === 1 ? 'pendente' : 'pendentes'}</li>
        </ul>
      </div>`;
  }

  // ----- Preenchimento mínimo para "Selecionar talhões" -----
  // DAP padrão, ao menos uma linha e, em cada linha: princípio ativo ou produto, unidade e dose.
  function errosRecomendacao(op) {
    const vazio = (v) => v === null || v === undefined || v === '';
    const linhas = op.produtos.filter((l) => l.recomendacao);
    const porLinha = {};
    linhas.forEach((l) => {
      const e = { produto: !l.produto && !l.principioAtivo, unidade: !l.unidade, dose: vazio(l.dose) };
      if (e.produto || e.unidade || e.dose) porLinha[l.id] = e;
    });
    const erros = { dap: vazio(op.dap), semLinhas: linhas.length === 0, linhas: porLinha };
    erros.algum = erros.dap || erros.semLinhas || Object.keys(porLinha).length > 0;
    return erros;
  }

  // Erros só aparecem depois que o usuário clicou em "Selecionar talhões"
  function errosVisiveis(op) {
    return ui.validarOp === op.id ? errosRecomendacao(op) : { linhas: {} };
  }

  // ----- Recomendação agronômica -----
  function recomendacao(op) {
    const linhas = op.produtos.filter((l) => l.recomendacao);
    const erros = errosVisiveis(op);
    return `
      <section class="cartao recomendacao" aria-labelledby="titulo-rec">
        <div class="recomendacao__topo">
          <h3 class="rotulo-secao" id="titulo-rec">Recomendação agronômica</h3>
        </div>
        <div class="recomendacao__corpo">
          <div class="recomendacao__tabela">
            <table class="tabela tabela--compacta tabela-rec">
              <thead><tr>
                <th>Princípio ativo</th><th>Produto comercial</th><th>Unid.</th><th class="tabela__numero">Dose</th>
                ${somenteLeitura ? '' : '<th><span class="so-leitor">Remover</span></th>'}
              </tr></thead>
              <tbody>
                ${linhas.length ? linhas.map((l) => linhaRecomendacao(l, erros.linhas[l.id])).join('')
                  : `<tr><td class="tabela__vazia" colspan="5">Nenhum produto na recomendação.</td></tr>`}
              </tbody>
            </table>
            ${erros.semLinhas ? '<p class="erro-campo">Informe pelo menos um produto ou princípio ativo.</p>' : ''}
            ${somenteLeitura ? '' : `
              <div class="recomendacao__acoes">
                <button class="link-acao" type="button" data-acao="adicionar-linha">${Icones.mais} Adicionar produto</button>
                ${ui.modo === 'selecionar' ? '' : `
                  <button class="botao botao--primario" type="button" data-acao="selecionar-talhoes">
                    ${Icones.mapa} Selecionar talhões</button>`}
              </div>`}
          </div>
        </div>
      </section>`;
  }

  function etiquetaPre(linha) {
    return linha.preCadastro ? '<span class="etiqueta-pre">Pré-cadastro</span>' : '';
  }

  function linhaRecomendacao(l, erro = {}) {
    if (somenteLeitura) {
      return `
        <tr>
          <td>${esc(l.principioAtivo || '—')}</td>
          <td>${esc(l.produto || '—')} ${etiquetaPre(l)}</td>
          <td>${Planos.unidadeDose(l)}</td>
          <td class="tabela__numero">${Util.dose(l.dose) || '—'}</td>
        </tr>`;
    }
    if (ui.preCadastro && ui.preCadastro.linhaId === l.id) return linhaPreCadastro(l);

    const unidade = l.produto
      ? `<span class="tabela-rec__unidade">${Planos.unidadeDose(l)}</span>`
      : `<select class="campo__controle campo--compacto" data-campo="linha-unidade" aria-label="Unidade">
           ${UNIDADES.map((u) => `<option value="${u}" ${u === l.unidade ? 'selected' : ''}>${u} i.a./ha</option>`).join('')}
         </select>`;
    return `
      <tr data-linha="${l.id}">
        <td>${combo(l, 'pa', l.principioAtivo, 'Buscar princípio ativo', erro.produto)}
          ${erro.produto ? '<p class="erro-campo">Informe o princípio ativo ou o produto</p>' : ''}</td>
        <td>${combo(l, 'produto', l.produto, 'Buscar produto', erro.produto)} ${etiquetaPre(l)}</td>
        <td>${unidade}${erro.unidade ? '<p class="erro-campo">Informação obrigatória</p>' : ''}</td>
        <td class="tabela__numero">
          <input class="campo__controle campo--compacto campo--dose ${erro.dose ? 'campo__controle--erro' : ''}" type="text" inputmode="decimal"
                 data-campo="linha-dose" value="${Util.dose(l.dose)}" placeholder="—" aria-label="Dose"
                 ${erro.dose ? 'aria-invalid="true"' : ''}>
          ${erro.dose ? '<p class="erro-campo">Informação obrigatória</p>' : ''}
        </td>
        <td class="tabela__acao">
          <button class="botao-icone botao-icone--p" type="button" data-acao="remover-linha" title="Remover produto"
                  aria-label="Remover ${esc(Planos.nomeLinha(l))}">${Icones.lixeira}</button>
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
              <span class="pre-cadastro__ajuda">Informe o produto comercial ou o princípio ativo (ao menos um) e a unidade.</span></p>
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
    if (modo === 'selecionar') titulo = `Selecione os talhões que recebem a ${esc(op.nome)}`;
    if (modo === 'ajustar') titulo = 'Ajustar talhões';

    const ferramentas = modo === 'ver' ? `
      <div class="talhoes__ferramentas">
        ${somenteLeitura ? '' : `
          <button class="botao-icone botao-icone--borda" type="button" data-acao="ajustar-talhoes" title="Ajustar talhões"
                  aria-label="Ajustar talhões">${Icones.lapis}</button>`}
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
        ${modo === 'ajustar' && ui.marcados.size ? caixaAjuste(op) : ''}
        <div class="tabela-rolagem">
          <table class="tabela tabela--compacta tabela-talhoes">
            <thead><tr>
              ${comCaixa ? `<th class="tabela__marcar"><input type="checkbox" data-acao="marcar-todos" aria-label="Marcar todos"
                   ${todosMarcados(op) ? 'checked' : ''}></th>` : ''}
              <th>Talhão</th><th class="tabela__numero">Área</th><th class="tabela__numero">DAP</th>
              ${colunas.map((l) => `<th class="tabela__numero">${esc(Planos.nomeLinha(l))} (${Planos.unidadeDose(l)}) ${etiquetaPre(l)}</th>`).join('')}
              <th>Status</th>
            </tr></thead>
            <tbody id="talhoes-linhas">${linhasTalhoes(op, colunas)}</tbody>
          </table>
        </div>
        ${rodapeTalhoes(op)}
      </section>`;
  }

  function talhoesMarcaveis(op) {
    // Selecionar: todos os talhões da fazenda. Ajustar: só os que recebem a operação.
    return ui.modo === 'ajustar' ? talhoesFazenda.filter((t) => op.talhoes[t.nome]) : talhoesFazenda;
  }

  function todosMarcados(op) {
    const lista = talhoesMarcaveis(op);
    return lista.length > 0 && lista.every((t) => ui.marcados.has(t.nome));
  }

  function linhasTalhoes(op, colunas) {
    if (!talhoesFazenda.length) {
      return `<tr><td class="tabela__vazia" colspan="${colunas.length + 5}">Nenhum talhão cadastrado na fazenda ${esc(plano.fazenda)}.</td></tr>`;
    }
    const busca = Util.normalizar(ui.busca.trim());
    const visiveis = talhoesFazenda.filter((t) => !busca || Util.normalizar(t.nome).includes(busca));
    if (!visiveis.length) {
      return `<tr><td class="tabela__vazia" colspan="${colunas.length + 5}">Nenhum talhão encontrado.</td></tr>`;
    }
    return visiveis.map((t) => {
      const ajuste = op.talhoes[t.nome];
      const status = Planos.statusTalhao(op, t.nome);
      const classeStatus = { 'Completo': 'aprovado', 'Pendente': 'pendente', 'Sem operação': 'sem' }[status];
      const marcavel = ui.modo === 'selecionar' || (ui.modo === 'ajustar' && ajuste);
      const caixa = ui.modo === 'ver' ? '' : `
        <td class="tabela__marcar">${marcavel ? `<input type="checkbox" data-acao="marcar" data-talhao="${t.nome}"
            aria-label="Marcar ${t.nome}" ${ui.marcados.has(t.nome) ? 'checked' : ''}>` : ''}</td>`;
      let dap = '', doses = colunas.map(() => '<td></td>').join('');
      if (ajuste) {
        const recebidas = Planos.linhasTalhao(op, ajuste);
        dap = Planos.dapTalhao(op, ajuste) ?? '—';
        doses = colunas.map((l) => {
          if (!recebidas.includes(l)) return '<td class="tabela__numero tabela__nao-recebe" title="Não recebe este produto">—</td>';
          const d = Planos.doseTalhao(op, ajuste, l);
          return `<td class="tabela__numero">${d === null || d === undefined ? '<span class="falta">—</span>' : Util.dose(d)}</td>`;
        }).join('');
      }
      return `
        <tr class="${ajuste ? '' : 'linha--sem'} ${ui.marcados.has(t.nome) ? 'linha--marcada' : ''}">
          ${caixa}
          <th scope="row" class="tabela__talhao">${t.nome}</th>
          <td class="tabela__numero">${Util.area(t.area)}</td>
          <td class="tabela__numero">${dap}</td>
          ${doses}
          <td><span class="status status--${classeStatus}">${status}</span></td>
        </tr>`;
    }).join('');
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
    if (ui.modo === 'ajustar') {
      return `
        <div class="talhoes__rodape">
          <span class="talhoes__selecao">${ui.marcados.size
            ? `${ui.marcados.size} ${ui.marcados.size === 1 ? 'talhão selecionado' : 'talhões selecionados'}`
            : 'Marque os talhões que quer ajustar.'}</span>
          <button class="botao botao--secundario" type="button" data-acao="cancelar-modo">Cancelar</button>
          <button class="botao botao--primario" type="button" data-acao="salvar-ajustes"
                  ${ui.marcados.size && ajusteTemMudanca() ? '' : 'disabled'}>Salvar ajustes</button>
        </div>`;
    }
    return '';
  }

  function contagemSelecao(op) {
    const recebem = Object.keys(op.talhoes);
    return {
      aplicar: ui.marcados.size,
      remover: recebem.filter((t) => !ui.marcados.has(t)).length
    };
  }

  // ----- Caixa de ajuste (vale para todos os talhões selecionados) -----
  function caixaAjuste(op) {
    const aj = ui.ajuste;
    const selecionados = [...ui.marcados].map((t) => op.talhoes[t]).filter(Boolean);

    // Valor comum entre os selecionados ou "vários"
    const comum = (valores) => valores.every((v) => v === valores[0]) ? valores[0] : undefined;
    const daps = selecionados.map((a) => Planos.dapTalhao(op, a));
    const dapComum = comum(daps);
    const valorDap = aj.dap !== undefined ? aj.dap : (dapComum === undefined ? '' : (dapComum ?? ''));
    const placeholderDap = dapComum === undefined && aj.dap === undefined ? 'vários' : '—';

    const linhas = Planos.colunasDose(op).filter((l) =>
      selecionados.some((a) => Planos.linhasTalhao(op, a).includes(l)));
    const camposDose = linhas.map((l) => {
      const doses = selecionados.filter((a) => Planos.linhasTalhao(op, a).includes(l)).map((a) => Planos.doseTalhao(op, a, l));
      const doseComum = comum(doses);
      const preparado = aj.doses[l.id];
      const valor = preparado !== undefined ? preparado : (doseComum === undefined ? '' : Util.dose(doseComum));
      const ph = doseComum === undefined && preparado === undefined ? 'vários' : '—';
      return `
        <div class="campo campo--ajuste">
          <label class="campo__rotulo" for="aj-${l.id}">${esc(Planos.nomeLinha(l))} (${Planos.unidadeDose(l)})</label>
          <input class="campo__controle campo--compacto" id="aj-${l.id}" type="text" inputmode="decimal"
                 data-ajuste="dose" data-linha-id="${l.id}" value="${esc(valor)}" placeholder="${ph}">
        </div>`;
    }).join('');

    const nomeProduto = (p) => esc(p);
    return `
      <div class="ajuste" role="group" aria-label="Ajuste dos talhões selecionados">
        <p class="ajuste__titulo">Ajuste para ${ui.marcados.size} ${ui.marcados.size === 1 ? 'talhão selecionado' : 'talhões selecionados'}
          <span class="ajuste__ajuda">Campo não alterado mantém o valor de cada talhão.</span></p>
        <div class="ajuste__campos">
          <div class="campo campo--ajuste">
            <label class="campo__rotulo" for="aj-dap">DAP</label>
            <input class="campo__controle campo--compacto" id="aj-dap" type="text" inputmode="numeric"
                   data-ajuste="dap" value="${esc(valorDap)}" placeholder="${placeholderDap}">
          </div>
          ${camposDose}
        </div>

        <div class="ajuste__acoes">
          <div class="ajuste__grupo">
            <label class="campo__rotulo" for="aj-novo-produto">Adicionar produto</label>
            <div class="ajuste__linha">
              <select class="campo__controle campo--compacto" id="aj-novo-produto">
                <option value="">Escolha o produto</option>
                ${DADOS.defensivos.filter((d) => d.produto).map((d) =>
                  `<option value="${esc(d.produto)}">${esc(d.produto)} (${d.unidade}/ha)</option>`).join('')}
              </select>
              <input class="campo__controle campo--compacto campo--dose" id="aj-novo-dose" type="text" inputmode="decimal" placeholder="Dose" aria-label="Dose do produto adicionado">
              <button class="botao botao--secundario botao--p" type="button" data-acao="aj-adicionar">Adicionar</button>
            </div>
          </div>
          <div class="ajuste__grupo">
            <label class="campo__rotulo" for="aj-remover-produto">Remover produto</label>
            <div class="ajuste__linha">
              <select class="campo__controle campo--compacto" id="aj-remover-produto">
                <option value="">Escolha o produto</option>
                ${linhas.filter((l) => !aj.remover.includes(l.id)).map((l) =>
                  `<option value="${l.id}">${esc(Planos.nomeLinha(l))}</option>`).join('')}
              </select>
              <button class="botao botao--secundario botao--p" type="button" data-acao="aj-remover">Remover</button>
            </div>
          </div>
          <div class="ajuste__grupo ajuste__grupo--fim">
            <button class="botao botao--perigo-leve botao--p" type="button" data-acao="aj-remover-operacao"
                    aria-pressed="${aj.removerOperacao}">${aj.removerOperacao ? 'Manter na operação' : 'Remover da operação'}</button>
          </div>
        </div>

        ${aj.adicionar.length || aj.remover.length || aj.removerOperacao ? `
          <ul class="ajuste__preparados" aria-label="Mudanças preparadas">
            ${aj.adicionar.map((a, i) => `<li class="chip chip--mais">+ ${nomeProduto(a.produto)} ${Util.dose(a.dose) || '(sem dose)'}
              <button type="button" data-acao="aj-desfazer-adicionar" data-indice="${i}" aria-label="Desfazer">${Icones.fechar}</button></li>`).join('')}
            ${aj.remover.map((id) => `<li class="chip chip--menos">− ${esc(Planos.nomeLinha(op.produtos.find((l) => l.id === id)))}
              <button type="button" data-acao="aj-desfazer-remover" data-linha-id="${id}" aria-label="Desfazer">${Icones.fechar}</button></li>`).join('')}
            ${aj.removerOperacao ? '<li class="chip chip--menos">Remover da operação</li>' : ''}
          </ul>` : ''}
      </div>`;
  }

  function novoAjustePreparado() {
    return { dap: undefined, doses: {}, adicionar: [], remover: [], removerOperacao: false };
  }

  function ajusteTemMudanca() {
    const aj = ui.ajuste;
    return aj && (aj.dap !== undefined || Object.keys(aj.doses).length || aj.adicionar.length ||
                  aj.remover.length || aj.removerOperacao);
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
    return tr && op ? op.produtos.find((l) => l.id === tr.dataset.linha) : null;
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
    // "+ Pré-cadastrar" sempre como última opção quando há texto digitado
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
      ui.preCadastro = { linhaId: linha.id, produto: tipo === 'produto' ? valor : '',
                         principioAtivo: tipo === 'pa' ? valor : (linha.principioAtivo || ''), unidade: '', erro: '' };
    } else if (tipo === 'pa') {
      linha.principioAtivo = valor;
      // Produto de outro princípio ativo deixa de valer
      const prod = Planos.produtoDoCadastro(linha.produto);
      if (prod && prod.principioAtivo !== valor) { linha.produto = ''; linha.preCadastro = false; }
      if (!linha.produto) linha.preCadastro = !!DADOS.defensivos.find((d) => d.principioAtivo === valor && !d.produto && d.preCadastro);
      alterou();
    } else {
      const d = Planos.produtoDoCadastro(valor);
      linha.produto = d.produto;
      linha.principioAtivo = d.principioAtivo || '';
      linha.unidade = d.unidade;
      linha.preCadastro = !!d.preCadastro;
      alterou();
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

      case 'abrir-op':
        ui.opPorGrupo[grupo.id] = alvo.dataset.op; ui.renomeandoOp = null; ui.preCadastro = null; ui.validarOp = null;
        sairDosModos(); desenharTudo(); break;

      case 'nova-op': {
        const nova = Planos.novaOperacao('Nova operação', null);
        grupo.operacoes.push(nova);
        ui.opPorGrupo[grupo.id] = nova.id; ui.renomeandoOp = nova.id;
        sairDosModos(); alterou(); desenharTudo(); break;
      }

      case 'renomear-op':
        ui.renomeandoOp = op.id; desenharTudo(); break;

      case 'excluir-op': excluirOperacao(grupo, op); break;

      case 'adicionar-linha':
        op.produtos.push(Planos.novaLinha()); alterou(); desenharTudo();
        raiz.querySelector('.tabela-rec tbody tr:last-child [data-combo="pa"]')?.focus();
        break;

      case 'remover-linha': {
        const linha = linhaDoElemento(alvo);
        op.produtos = op.produtos.filter((l) => l !== linha);
        Object.values(op.talhoes).forEach((a) => {
          delete a.doses[linha.id];
          a.removidas = a.removidas.filter((id) => id !== linha.id);
        });
        alterou(); desenharTudo(); break;
      }

      case 'cancelar-pre': ui.preCadastro = null; desenharTudo(); break;
      case 'salvar-pre': salvarPreCadastro(op); break;

      case 'selecionar-talhoes':
        // Sem o preenchimento mínimo, mostra o que falta e não entra na seleção
        if (errosRecomendacao(op).algum) { ui.validarOp = op.id; desenharTudo(); return; }
        ui.validarOp = null;
        ui.modo = 'selecionar'; ui.marcados = new Set(Object.keys(op.talhoes)); ui.preCadastro = null;
        desenharTudo(); break;

      case 'ajustar-talhoes':
        ui.modo = 'ajustar'; ui.marcados = new Set(); ui.ajuste = novoAjustePreparado();
        desenharTudo(); break;

      case 'cancelar-modo': sairDosModos(); desenharTudo(); break;

      case 'marcar':
        if (alvo.checked) ui.marcados.add(alvo.dataset.talhao); else ui.marcados.delete(alvo.dataset.talhao);
        desenharTudo(); break;

      case 'marcar-todos':
        ui.marcados = alvo.checked ? new Set(talhoesMarcaveis(op).map((t) => t.nome)) : new Set();
        desenharTudo(); break;

      case 'aplicar': aplicarRecomendacao(op); break;

      case 'aj-adicionar': {
        const produto = raiz.querySelector('#aj-novo-produto').value;
        if (!produto) { raiz.querySelector('#aj-novo-produto').focus(); return; }
        ui.ajuste.adicionar.push({ produto, dose: Util.numero(raiz.querySelector('#aj-novo-dose').value) });
        desenharTudo(); break;
      }
      case 'aj-remover': {
        const id = raiz.querySelector('#aj-remover-produto').value;
        if (!id) { raiz.querySelector('#aj-remover-produto').focus(); return; }
        ui.ajuste.remover.push(id); delete ui.ajuste.doses[id];
        desenharTudo(); break;
      }
      case 'aj-desfazer-adicionar':
        ui.ajuste.adicionar.splice(Number(alvo.dataset.indice), 1); desenharTudo(); break;
      case 'aj-desfazer-remover':
        ui.ajuste.remover = ui.ajuste.remover.filter((id) => id !== alvo.dataset.linhaId); desenharTudo(); break;
      case 'aj-remover-operacao':
        ui.ajuste.removerOperacao = !ui.ajuste.removerOperacao; desenharTudo(); break;

      case 'salvar-ajustes': salvarAjustes(op); break;

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
        ui.grupoId = id; ui.renomeandoOp = null; ui.preCadastro = null;
        sairDosModos(); desenharTudo(); break;
      }

      case 'novo-grupo': novoGrupo(); break;
      case 'excluir-grupo': excluirGrupo(grupo); break;
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
      linhaDoElemento(e.target).dose = Util.numero(e.target.value); alterou(); desenharTudo();
    } else if (campo === 'linha-unidade') {
      linhaDoElemento(e.target).unidade = e.target.value; alterou(); desenharTudo();
    } else if (e.target.dataset.pre) {
      ui.preCadastro[e.target.dataset.pre] = e.target.value;
    } else if (e.target.dataset.ajuste === 'dap') {
      ui.ajuste.dap = e.target.value.trim(); desenharTudo();
    } else if (e.target.dataset.ajuste === 'dose') {
      ui.ajuste.doses[e.target.dataset.linhaId] = e.target.value.trim(); desenharTudo();
    }
  }

  function aoDigitar(e) {
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
    if (el.dataset.campo === 'nome-grupo') salvarNomeGrupo(el.value);
  }

  function aoTeclar(e) {
    const el = e.target;
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
    if ((el.dataset.campo === 'op-dap' || el.dataset.campo === 'linha-dose' || el.dataset.ajuste) && e.key === 'Enter') {
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

  function excluirOperacao(grupo, op) {
    const talhoes = Object.keys(op.talhoes).length;
    const produtos = op.produtos.filter((l) => l.recomendacao).length;
    const remover = () => {
      const indice = grupo.operacoes.indexOf(op);
      grupo.operacoes.splice(indice, 1);
      delete ui.opPorGrupo[grupo.id];
      sairDosModos(); alterou(); desenharTudo();
      return indice;
    };
    if (talhoes) {
      Modal.confirmar({
        titulo: `Excluir ${esc(op.nome)}?`,
        texto: `${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'}${produtos ? ` e ${produtos} ${produtos === 1 ? 'produto' : 'produtos'}` : ''} serão removidos do plano.`,
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir', classe: 'perigo', acao: () => {
          remover(); Aviso.mostrar(`${esc(op.nome)} excluída`);
        } }]
      });
    } else {
      // Operação vazia: exclui na hora, com Desfazer
      const indice = remover();
      Aviso.mostrar(`${esc(op.nome)} excluída`, { acao: 'Desfazer', aoAgir: () => {
        grupo.operacoes.splice(indice, 0, op);
        ui.opPorGrupo[grupo.id] = op.id;
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
    if (!produto && !pa) { pc.erro = 'Informe o produto comercial ou o princípio ativo.'; desenharTudo(); return; }
    if (!pc.unidade) { pc.erro = 'Escolha a unidade.'; desenharTudo(); return; }

    DADOS.defensivos.push({ classe: '', produto, principioAtivo: pa, unidade: pc.unidade, preCadastro: true });
    const linha = op.produtos.find((l) => l.id === pc.linhaId);
    Object.assign(linha, { produto, principioAtivo: pa, unidade: pc.unidade, preCadastro: true });
    ui.preCadastro = null;
    alterou(); desenharTudo();
    Aviso.mostrar(`Pré-cadastro de "${esc(produto || pa)}" salvo`);
  }

  // ----- Selecionar talhões e aplicar -----
  function aplicarRecomendacao(op) {
    const comAjuste = [...ui.marcados].filter((t) => op.talhoes[t] && Planos.temAjuste(op.talhoes[t]));
    const aplicar = (substituir) => {
      const { aplicar: n, remover: m } = contagemSelecao(op);
      Object.keys(op.talhoes).forEach((t) => { if (!ui.marcados.has(t)) delete op.talhoes[t]; });
      ui.marcados.forEach((t) => {
        if (!op.talhoes[t] || substituir) op.talhoes[t] = Planos.novoAjuste();
      });
      Planos.limparExtras(op);
      sairDosModos(); alterou(); desenharTudo();
      Aviso.mostrar(n
        ? `Recomendação aplicada em ${n} ${n === 1 ? 'talhão' : 'talhões'}${m ? ` · removida de ${m}` : ''}`
        : `Operação removida de ${m} ${m === 1 ? 'talhão' : 'talhões'}`);
    };
    if (comAjuste.length) {
      Modal.confirmar({
        titulo: `${comAjuste.length} ${comAjuste.length === 1 ? 'talhão tem ajustes' : 'talhões têm ajustes'}.`,
        texto: `${comAjuste.join(', ')}: manter os valores próprios desses talhões ou substituir pela recomendação?`,
        botoes: [
          { rotulo: 'Manter ajustes', classe: 'secundario', acao: () => aplicar(false) },
          { rotulo: 'Substituir pela recomendação', classe: 'primario', acao: () => aplicar(true) }
        ]
      });
    } else {
      aplicar(false);
    }
  }

  // ----- Ajustar talhões -----
  function salvarAjustes(op) {
    const aj = ui.ajuste;
    const selecionados = [...ui.marcados].filter((t) => op.talhoes[t]);
    selecionados.forEach((t) => {
      if (aj.removerOperacao) { delete op.talhoes[t]; return; }
      const a = op.talhoes[t];

      if (aj.dap !== undefined) {
        const n = Util.numero(aj.dap);
        const v = n === null ? null : Math.round(n);
        if (v === op.dap) delete a.dap; else a.dap = v;
      }

      Object.entries(aj.doses).forEach(([id, texto]) => {
        const linha = op.produtos.find((l) => l.id === id);
        if (!linha || !Planos.linhasTalhao(op, a).includes(linha)) return;
        const v = Util.numero(texto);
        if (linha.recomendacao && v === linha.dose) delete a.doses[id]; else a.doses[id] = v;
      });

      aj.adicionar.forEach(({ produto, dose }) => {
        const daRec = op.produtos.find((l) => l.recomendacao && l.produto === produto);
        if (daRec) {
          // Produto já está na recomendação: volta a valer neste talhão, com a dose informada
          a.removidas = a.removidas.filter((id) => id !== daRec.id);
          if (dose !== null && dose !== daRec.dose) a.doses[daRec.id] = dose;
          return;
        }
        let extra = op.produtos.find((l) => !l.recomendacao && l.produto === produto);
        if (!extra) { extra = Planos.linhaDoProduto(produto, null, false); op.produtos.push(extra); }
        if (!a.extras.includes(extra.id)) a.extras.push(extra.id);
        a.doses[extra.id] = dose;
      });

      aj.remover.forEach((id) => {
        const linha = op.produtos.find((l) => l.id === id);
        if (!linha) return;
        delete a.doses[id];
        if (linha.recomendacao) { if (!a.removidas.includes(id)) a.removidas.push(id); }
        else a.extras = a.extras.filter((x) => x !== id);
      });
    });
    Planos.limparExtras(op);
    const n = selecionados.length;
    sairDosModos(); alterou(); desenharTudo();
    Aviso.mostrar(aj.removerOperacao
      ? `${n} ${n === 1 ? 'talhão removido' : 'talhões removidos'} da operação`
      : `Ajustes salvos em ${n} ${n === 1 ? 'talhão' : 'talhões'}`);
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
      modal.fechar(); sairDosModos(); alterou(); desenharTudo();
    });
    form.elements.nome.focus();
  }

  function excluirGrupo(grupo) {
    const remover = () => {
      const indice = plano.grupos.indexOf(grupo);
      plano.grupos.splice(indice, 1);
      ui.grupoId = (plano.grupos[indice] || plano.grupos[indice - 1] || {}).id || null;
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
