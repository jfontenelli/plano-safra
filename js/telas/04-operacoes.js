/*
 * Tela 04 — Operações, grupo Defensivo (docs/telas/04.1-operacoes-defensivos.md)
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
  // TSI: a dose é por quantidade de semente (a unidade usada pelos clientes fica para os testes)
  const UNIDADES_TSI = ['mL/100 kg', 'g/100 kg', 'mL/ha', 'g/ha'];

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
      // Abre no primeiro grupo das guias (Semente vem antes de Defensivo)
      grupoId: (plano.grupos[0] || {}).id || null,
      opPorGrupo: {},          // operação aberta em cada grupo
      listaRecolhidaPorGrupo: {}, // lista de operações minimizada em cada grupo (Semente começa minimizada)
      marcados: new Set(),     // talhões marcados na tabela
      filtroTalhoes: 'todos',  // todos | nao-planejados | rec:<id da recomendação>
      quadroAberto: false,     // quadro da recomendação filtrada: lista de produtos aberta
      erroNome: null,          // modal: nome da recomendação repetido
      naoEncontrado: {},       // texto digitado sem escolher na lista e que não está no cadastro: { 'linhaId:pa|produto': texto }
      definindo: null,         // modal "Definir recomendação" aberto: { talhoes, editando }
      plantando: null,         // modal "Definir variedade" (grupo Semente): { talhoes, variedade, data, dataTexto, preVariedade, erros }
      passoSemente: 'plantio', // grupo Semente: plantio | tsi
      visaoSemente: 'talhoes', // passo Plantio, "Exibir": talhoes (tabela) | mapa | colheita (previsão de colheita)
      painelTalhao: null,      // talhão aberto no painel lateral (passo Variedade)
      prePainel: null,         // painel: nome da variedade em pré-cadastro
      erroPrePainel: null,
      painelExpandido: false,  // painel do talhão largo (gráficos maiores)
      ordemSemente: null,      // ordem da tabela do Plantio: { coluna, sentido: asc | desc }
      erroGerminacao: null,    // germinação inválida digitada: { texto }
      dicaPlantioVista: false, // a dica acima da tabela some depois do primeiro uso (abrir o painel ou definir variedade)
      dataPainel: null,        // painel: data digitada inválida { talhao, texto }
      copiadoDe: null,         // modal: recomendação de onde os produtos foram copiados
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
  // Lista de operações minimizada: escolha de cada grupo; sem escolha, o grupo Semente (uma operação só) começa minimizado
  function listaRecolhida() {
    const g = grupoAtual();
    if (!g) return false;
    return ui.listaRecolhidaPorGrupo[g.id] ?? ehSemente(g);
  }

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

  // Grupos com o detalhe da recomendação agronômica (talhões, receitas e doses): Defensivos e Fertilidade
  function usaRecomendacao(grupo) {
    return grupo && ['Defensivos', 'Fertilidade'].includes(grupo.tipo);
  }

  function ehFertilidade(grupo) {
    return grupo && grupo.tipo === 'Fertilidade';
  }

  // Dose: "0,40" (duas casas, como nos defensivos); na Fertilidade, sem casas fixas ("130", "1,5")
  function formatarDose(valor) {
    if (!ehFertilidade(grupoAtual()) || valor === null || valor === undefined) return Util.dose(valor);
    return valor.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
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
    ui.plantando = null;
  }

  // ================= Desenho =================
  // Cabeçalho do plano fixo no topo e guias fixas embaixo; o que fica entre eles tem rolagem própria.
  // No grupo Defensivo, a lista de operações e o cartão da operação ocupam essa altura e só a
  // tabela de talhões rola.
  function desenharTudo() {
    desmontarMapa();
    const rolagemAntes = raiz.querySelector('.plano__rolagem')?.scrollTop || 0;
    const listaAntes = raiz.querySelector('.ops-lista__itens')?.scrollTop || 0;
    const modalAntes = raiz.querySelector('.definir-fundo')?.scrollTop || 0;
    const talhoesAntes = raiz.querySelector('.talhoes-rolagem')?.scrollTop || 0;
    raiz.innerHTML = `
      ${cabecalho()}
      <div class="plano__rolagem">
        ${etapa === 'operacoes' ? corpoOperacoes() : etapa === 'calendario' ? Telas.calendario.desenhar(ctxCalendario()) : etapaEmConstrucao()}
      </div>
      ${etapa === 'operacoes' ? rodapeGrupos() : ''}
      ${etapa === 'operacoes' && ui.definindo && opAtual() ? modalDefinir(opAtual()) : ''}
      ${etapa === 'operacoes' && ui.plantando && opAtual() ? modalPlantio(opAtual()) : ''}
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
    montarMapa();
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
        <span class="plano__seta" aria-hidden="true">›</span>
        <p class="plano__contexto">${contexto.map(esc).join('<span class="plano__ponto">·</span>')}
          <span class="plano__ponto">·</span>
          <button class="status status--botao ${somenteLeitura ? 'status--aprovado' : 'status--construcao'}" type="button"
                  data-acao="alternar-status" title="Protótipo: clique para alternar o status"
                  aria-label="Status: ${esc(plano.status)}. Protótipo: clique para alternar o status">${esc(plano.status)}</button></p>
        </div>
        <div class="plano__linha-etapas">
          <nav class="etapas" aria-label="Etapas do plano">
            ${ETAPAS.map((e) => `
              <a class="etapa ${e.id === etapa ? 'etapa--ativa' : ''}" href="#/plano/${plano.id}/${e.id}"
                 ${e.id === etapa ? 'aria-current="page"' : ''}>${e.nome}</a>`).join('')}
          </nav>
          <button class="botao botao--secundario botao--p plano__exportar" type="button" data-acao="exportar-plano"
                  title="Baixar o plano em planilha para guardar ou continuar depois">${Icones.baixar} Exportar (.xlsx)</button>
        </div>
      </header>
      ${somenteLeitura ? `
        <p class="faixa-leitura">${Icones.cadeado} Plano aprovado: somente leitura. O plano aprovado não muda durante a safra.</p>` : ''}
    `;
  }

  // Calendário Agrícola (Tela 05): desenhado aqui dentro, com o mesmo cabeçalho do plano
  function ctxCalendario() {
    ui.calendario = ui.calendario || { visao: 'infografico', talhao: 'todos' };
    return { plano, somenteLeitura, talhoes: talhoesFazenda, estado: ui.calendario };
  }
  const acoesCalendario = { redesenhar: (foco) => (foco ? desenharMantendoFoco(foco) : desenharTudo()), alterou: () => alterou() };

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
    // Grupo Semente: o Plantio (DAP 0) ocupa a página toda, sem a lista de operações
    return `
      <div class="ops">
        ${ehSemente(grupo) && opAtual() ? '' : listaOperacoes(grupo)}
        <section class="ops-detalhe" aria-live="polite">${detalhe(grupo)}</section>
      </div>
    `;
  }

  // ----- Lista lateral -----
  function listaOperacoes(grupo) {
    const atual = opAtual();
    // Minimizada: só os DAPs; o nome da operação aparece ao passar o mouse
    if (listaRecolhida()) {
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
  // Nome da operação no cabeçalho: duplo clique (ou F2) renomeia, no mesmo padrão da lista.
  // Enter ou sair do campo salva; Esc desfaz; nome vazio volta ao anterior.
  function nomeOperacao(op) {
    if (ui.renomeandoOp === op.id) {
      return `<input class="campo__controle op-cabecalho__nome-campo" data-campo="nome-op" value="${esc(op.nome)}"
                     aria-label="Nome da operação" data-foco-inicial>`;
    }
    if (somenteLeitura) return `<h2 class="op-cabecalho__nome">${esc(op.nome)}</h2>`;
    return `<h2 class="op-cabecalho__nome op-cabecalho__nome--editavel" tabindex="0" data-renomear-op="${op.id}"
                title="Clique duas vezes para renomear">${esc(op.nome)}</h2>`;
  }

  function aoDuploClique(e) {
    const nome = e.target.closest('[data-renomear-op]');
    if (!nome || somenteLeitura) return;
    ui.renomeandoOp = nome.dataset.renomearOp; desenharTudo();
  }

  // ----- Detalhe -----
  function detalhe(grupo) {
    const op = opAtual();
    if (!op) {
      return `<div class="cartao vazio"><p class="vazio__texto">${somenteLeitura
        ? 'Nenhuma operação neste grupo.' : 'Nenhuma operação neste grupo. Use "+ Nova operação" para criar.'}</p></div>`;
    }
    if (ehSemente(grupo)) return detalheSemente(op);
    if (!usaRecomendacao(grupo)) {
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
            <p class="em-construcao__texto">Neste protótipo, só os grupos dos tipos Defensivos e Fertilidade têm o detalhe da operação.</p>
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

  // semFenologia: grupo Semente (o plantio é o DAP 0; não tem fenologia)
  function cabecalhoOperacao(op, { semFenologia = false } = {}) {
    const erroDap = errosVisiveis(op).dap;
    const dap = somenteLeitura
      ? `<span class="campo__valor">${op.dap ?? '—'}</span>`
      : `<input class="campo__controle op-cabecalho__dap ${erroDap ? 'campo__controle--erro' : ''}" id="op-dap" type="text" inputmode="numeric"
                data-campo="op-dap" value="${op.dap ?? ''}" placeholder="—" ${erroDap ? 'aria-invalid="true"' : ''}>
         ${erroDap ? '<p class="erro-campo">Informação obrigatória</p>' : ''}`;
    // Fenologia já escrita e sem escolha (todos os grupos): DAP negativo = "Pré-plantio"; DAP 0 = "Plantio"
    const temDap = op.dap !== null && op.dap !== undefined && op.dap !== '';
    const fixa = temDap && op.dap < 0 ? ['Pré-plantio', 'DAP negativo: antes do plantio']
      : temDap && op.dap === 0 ? ['Plantio', 'DAP 0: dia do plantio'] : null;
    const fenologia = somenteLeitura
      ? `<span class="campo__valor">${fixa ? fixa[0] : op.fenologia || '—'}</span>`
      : fixa
        ? `<select class="campo__controle op-cabecalho__fenologia" id="op-fenologia" disabled
                   title="${fixa[1]}"><option selected>${fixa[0]}</option></select>`
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
          ${semFenologia ? '' : `<div class="campo campo--inline"><label class="campo__rotulo" for="op-fenologia">Fenologia</label>${fenologia}</div>`}
        </div>
        ${navegacaoOperacoes(op)}
      </div>`;
  }

  // Anterior e próxima operação do grupo, na ordem do DAP (a mesma da lista): só as setas ← →.
  // Primeira operação: só →; última: só ←. O nome e o DAP do destino aparecem ao passar o mouse.
  function navegacaoOperacoes(op) {
    const ops = operacoesOrdenadas(grupoAtual());
    const i = ops.indexOf(op);
    const botao = (destino, sentido) => {
      if (!destino) return '';
      const dap = destino.dap !== null && destino.dap !== undefined ? ` (DAP ${destino.dap})` : '';
      const dica = `${sentido === 'anterior' ? 'Operação anterior' : 'Próxima operação'}: ${esc(destino.nome)}${dap}`;
      return `
        <button class="botao botao--secundario botao--p op-navegar" type="button" data-acao="navegar-op" data-op="${destino.id}"
                title="${dica}" aria-label="${dica}">${sentido === 'anterior' ? Icones.voltar : Icones.seta}</button>`;
    };
    if (ops.length < 2) return '';
    return `<div class="op-navegacao">${botao(ops[i - 1], 'anterior')}${botao(ops[i + 1], 'proxima')}</div>`;
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
      const e = { produto: !l.produto, dose: vazio(l.dose), repetido: !!repetidoNaMesma(fonte, l) };
      if (e.produto || e.dose || e.repetido) porLinha[l.id] = e;
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
  // Tabela da receita aberta: Princípio ativo · Produto comercial · Dose padrão · Unid.
  function corpoReceita(op, r) {
    const leitura = somenteLeitura;
    const linhas = leitura ? r.produtos.filter(Planos.linhaPreenchida) : rascunho(op).produtos;
    const erros = errosVisiveis(op);
    // Só a linha em pré-cadastro na tabela: sem o cabeçalho (o pré-cadastro já tem os rótulos dele)
    const soPreCadastro = !leitura && ui.preCadastro && linhas.length === 1 && linhas[0].id === ui.preCadastro.linhaId;
    return `
      <div class="recomendacao__corpo">
        <div class="recomendacao__tabela">
          <table class="tabela tabela--compacta tabela-rec ${soPreCadastro ? 'tabela-rec--so-pre' : ''}">
            <thead ${soPreCadastro ? 'hidden' : ''}><tr>
              <th>${T().pa}</th><th>Produto comercial</th><th class="tabela__numero">Dose padrão</th><th>Unid.</th>
              ${leitura ? '' : '<th><span class="so-leitor">Remover</span></th>'}
            </tr></thead>
            <tbody>
              ${linhas.length ? linhas.map((l) => linhaRecomendacao(l, erros.linhas[l.id], leitura)).join('')
                : `<tr><td class="tabela__vazia" colspan="5">Nenhum produto na ${T().nome}.</td></tr>`}
            </tbody>
          </table>
          ${erros.semLinhas ? '<p class="erro-campo">Informe pelo menos um produto.</p>' : ''}
          ${leitura ? '' : acoesReceita(op)}
        </div>
      </div>`;
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
          <td class="tabela__numero">${formatarDose(l.dose) || '—'}</td>
          <td>${Planos.unidadeDose(l)}</td>
        </tr>`;
    }
    if (ui.preCadastro && ui.preCadastro.linhaId === l.id) return linhaPreCadastro(l);

    // Sem produto comercial não há unidade nem dose: o princípio ativo só filtra os produtos
    const semProduto = !l.produto;
    return `
      <tr data-linha="${l.id}">
        <td>${celulaCombo(l, 'pa', l.principioAtivo, `Buscar ${T().pa.toLowerCase()}`, false)}${avisoRepetido(l, 'pa')}</td>
        <td>${celulaCombo(l, 'produto', l.produto, 'Buscar produto', erro.produto)} ${etiquetaPre(l)}${seloTipo(l)}
          ${erro.produto && !ui.naoEncontrado[`${l.id}:produto`] ? '<p class="erro-campo">Escolha o produto comercial</p>' : ''}${avisoRepetido(l, 'produto')}</td>
        <td class="tabela__numero" ${semProduto ? 'title="Escolha o produto comercial para informar a dose"' : ''}>
          <input class="campo__controle campo--compacto campo--dose ${erro.dose && !semProduto ? 'campo__controle--erro' : ''}" type="text" inputmode="decimal"
                 data-campo="linha-dose" value="${formatarDose(l.dose)}" placeholder="—" aria-label="Dose padrão"
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

  // Produto comercial ou princípio ativo repetido, em vermelho:
  //  - na mesma recomendação: "já está nesta recomendação" (bloqueia o aplicar);
  //  - em outra recomendação da operação: "também na Rec 1", com a dose de lá (só avisa).
  const mesmo = (campo) => (a, b) => a[campo] && b[campo] && Util.normalizar(a[campo]) === Util.normalizar(b[campo]);
  const mesmoProduto = mesmo('produto');
  const mesmoPA = mesmo('principioAtivo');

  // Linha anterior da mesma recomendação com o mesmo produto (ou o mesmo princípio ativo): 'produto' | 'pa' | null
  function repetidoNaMesma(linhas, l) {
    const antes = linhas.slice(0, linhas.indexOf(l)).filter(Planos.linhaPreenchida);
    if (antes.some((x) => mesmoProduto(x, l))) return 'produto';
    if (antes.some((x) => mesmoPA(x, l))) return 'pa';
    return null;
  }

  function avisoRepetido(l, coluna) {
    const op = opAtual();
    const atual = receitaAtual(op);
    const linhas = ui.rascunho && atual && ui.rascunho.receitaId === atual.id ? ui.rascunho.produtos : [];
    const naMesma = repetidoNaMesma(linhas, l);
    if (naMesma) {
      return naMesma === coluna
        ? `<p class="aviso-repetido">${Icones.alerta} ${coluna === 'produto' ? 'Produto' : T().pa} já está nesta ${T().nome}</p>`
        : '';
    }
    const dose = (x) => `${formatarDose(x.dose) || '—'} ${Planos.unidadeDose(x)}`;
    const outras = op.receitas.filter((r) => r !== atual).map((r) => {
      if (coluna === 'produto') {
        const igual = r.produtos.find((x) => mesmoProduto(x, l));
        return igual ? `${esc(nomeCurto(r))} · ${dose(igual)}` : null;
      }
      // Princípio ativo: só quando o produto não é o mesmo (senão o aviso já está no produto)
      const igual = r.produtos.find((x) => mesmoPA(x, l) && !mesmoProduto(x, l));
      return igual ? `${esc(nomeCurto(r))} (${esc(igual.produto || igual.principioAtivo)} · ${dose(igual)})` : null;
    }).filter(Boolean);
    return outras.length ? `<p class="aviso-repetido">${Icones.alerta} Também na ${outras.join(' e na ')}</p>` : '';
  }

  // Campo de busca com o texto digitado que não foi encontrado no cadastro (mantém o texto e mostra o erro)
  const MSG_NAO_ENCONTRADO = 'Não encontrado no cadastro. Escolha na lista ou use "+ Pré-cadastrar".';
  function celulaCombo(l, tipo, valor, placeholder, comErro) {
    const digitado = ui.naoEncontrado[`${l.id}:${tipo}`];
    if (digitado === undefined) return combo(l, tipo, valor, placeholder, comErro);
    return combo(l, tipo, digitado, placeholder, true) + `<p class="erro-campo erro-campo--digitado">${MSG_NAO_ENCONTRADO}</p>`;
  }

  // Texto digitado sem clicar numa opção: se for exatamente um item do cadastro, vale como escolhido.
  // Devolve 'ok' (aceito ou nada a fazer) ou 'nao-encontrado'.
  function aceitarDigitado(input) {
    const linha = linhaDoElemento(input);
    if (!linha) return 'ok';
    const tipo = input.dataset.combo;
    const texto = input.value.trim();
    const atual = tipo === 'pa' ? linha.principioAtivo : linha.produto;
    const chave = `${linha.id}:${tipo}`;
    if (!texto || texto === atual) { delete ui.naoEncontrado[chave]; return 'ok'; }
    const igual = (v) => v && Util.normalizar(v) === Util.normalizar(texto);
    if (tipo === 'pa') {
      const d = cadastroAtual().find((x) => igual(x.principioAtivo));
      if (!d) { ui.naoEncontrado[chave] = texto; return 'nao-encontrado'; }
      linha.principioAtivo = d.principioAtivo;
      const prod = Planos.produtoDoCadastro(linha.produto);
      if (prod && prod.principioAtivo !== d.principioAtivo) Object.assign(linha, { produto: '', unidade: '', dose: null, preCadastro: false });
    } else {
      const d = cadastroAtual().find((x) => igual(x.produto));
      if (!d) { ui.naoEncontrado[chave] = texto; return 'nao-encontrado'; }
      Object.assign(linha, { produto: d.produto, principioAtivo: d.principioAtivo || '', unidade: d.unidade, preCadastro: !!d.preCadastro });
    }
    delete ui.naoEncontrado[chave];
    return 'ok';
  }

  function combo(linha, tipo, valor, placeholder, comErro) {
    return `
      <div class="combo">
        <input class="campo__controle campo--compacto ${comErro ? 'campo__controle--erro' : ''}" type="text" data-combo="${tipo}" value="${esc(valor || '')}"
               placeholder="${placeholder}" autocomplete="off" role="combobox" aria-expanded="false"
               aria-label="${tipo === 'pa' ? T().pa : 'Produto comercial'}">
        <div class="combo__lista" role="listbox" hidden></div>
      </div>`;
  }

  // Guarda o que foi digitado no pré-cadastro; preenchido o campo, o erro dele some (sem redesenhar)
  function registrarPre(el) {
    const pc = ui.preCadastro;
    if (!pc) return;
    pc[el.dataset.pre] = el.value;
    if (pc.erros && pc.erros[el.dataset.pre] && el.value.trim()) {
      delete pc.erros[el.dataset.pre];
      el.classList.remove('campo__controle--erro');
      el.removeAttribute('aria-invalid');
      const msg = el.parentElement.querySelector('.pre-cadastro__msg');
      if (msg) msg.textContent = '';
    }
  }

  // A própria linha vira o pré-cadastro, com cada campo embaixo da sua coluna
  // (Princípio ativo · Produto comercial · Dose · Unid.). A dose é informada depois de salvar.
  function linhaPreCadastro(l) {
    const pc = ui.preCadastro;
    const erros = pc.erros || {};
    const id = (campo) => `pre-${campo}-${l.id}`;
    return `
      <tr data-linha="${l.id}" class="tabela-rec__pre tabela-rec__pre--titulo">
        <td colspan="5">
          <p class="pre-cadastro__titulo">Pré-cadastro de defensivo
            <span class="pre-cadastro__ajuda">· Informe o produto comercial e a unidade. ${T().paOpcional}.</span></p>
        </td>
      </tr>
      <tr data-linha="${l.id}" class="tabela-rec__pre">
        <td>
          <label class="pre-cadastro__rotulo" for="${id('pa')}">${T().pa} (opcional)</label>
          <input class="campo__controle campo--compacto" id="${id('pa')}" data-pre="principioAtivo" value="${esc(pc.principioAtivo)}"
                 placeholder="${T().pa}" autocomplete="off">
          <p class="pre-cadastro__msg"></p>
        </td>
        <td>
          <label class="pre-cadastro__rotulo" for="${id('produto')}">Produto comercial *</label>
          <input class="campo__controle campo--compacto ${erros.produto ? 'campo__controle--erro' : ''}" id="${id('produto')}" data-pre="produto"
                 value="${esc(pc.produto)}" placeholder="Produto comercial" autocomplete="off" ${erros.produto ? 'aria-invalid="true"' : ''}>
          <p class="pre-cadastro__msg erro-campo">${erros.produto || ''}</p>
        </td>
        <td></td>
        <td>
          <label class="pre-cadastro__rotulo" for="${id('unidade')}">Unidade *</label>
          <select class="campo__controle campo--compacto ${erros.unidade ? 'campo__controle--erro' : ''}" id="${id('unidade')}" data-pre="unidade" required
                  ${erros.unidade ? 'aria-invalid="true"' : ''}>
            <option value="" ${pc.unidade ? '' : 'selected'} disabled>Unidade</option>
            ${(ehTsi() ? UNIDADES_TSI : UNIDADES).map((u) => `<option ${u === pc.unidade ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
          <p class="pre-cadastro__msg erro-campo">${erros.unidade || ''}</p>
        </td>
        <td></td>
      </tr>
      <tr data-linha="${l.id}" class="tabela-rec__pre tabela-rec__pre--acoes">
        <td colspan="5">
          <div class="pre-cadastro__acoes">
            ${pc.aviso ? `<p class="erro-campo pre-cadastro__erro">${pc.aviso}</p>` : ''}
            <button class="botao botao--secundario botao--p" type="button" data-acao="cancelar-pre">Cancelar</button>
            <button class="botao botao--secundario botao--p pre-cadastro__salvar" type="button" data-acao="salvar-pre">Salvar pré-cadastro</button>
          </div>
        </td>
      </tr>`;
  }

  // ----- Talhões da operação -----
  // Filtros Todos · Não planejados · recomendações; tabela Talhão · Área · produtos; marcar e "Definir recomendação"
  function talhoesVisiveis(op) {
    const rec = recFiltrada(op);
    if (rec) return talhoesFazenda.filter((t) => op.talhoes[t.nome] && op.talhoes[t.nome].receitaId === rec.id);
    return ui.filtroTalhoes === 'nao-planejados' ? talhoesFazenda.filter((t) => naoPlanejado(op, t)) : talhoesFazenda;
  }

  // Não planejado = ainda sem recomendação. No TSI, só conta talhão com variedade (sem variedade não recebe TSI).
  function naoPlanejado(op, t) {
    return !op.talhoes[t.nome] && (!ehTsi() || planejado(op, t.nome));
  }

  // Talhão que pode ser marcado: no TSI, só com variedade
  function marcavel(op, t) {
    return !ehTsi() || planejado(op, t.nome);
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

  // Filtros dos talhões (todos os grupos): etiquetas "Todos os talhões: 12", "Não planejados: 8", "● Rec 1".
  // Selecionada: fundo verde-claro e borda verde (não o verde sólido das abas, para não competir com elas).
  function filtrosTalhoes(itens) {
    return `
      <div class="filtros-talhoes" role="group" aria-label="Filtrar talhões">
        ${itens.map(({ valor, rotulo }) => `
          <button class="filtro-talhoes ${ui.filtroTalhoes === valor ? 'filtro-talhoes--ativo' : ''}" type="button"
                  data-acao="filtro-talhoes" data-filtro="${esc(valor)}" aria-pressed="${ui.filtroTalhoes === valor}">${rotulo}</button>`).join('')}
      </div>`;
  }

  function painelTalhoes(op) {
    const rec = recFiltrada(op);
    const naoPlanejados = talhoesFazenda.filter((t) => naoPlanejado(op, t)).length;
    const tsi = ehTsi();
    // Sem talhão não planejado, a etiqueta some (e quem estava nela volta para Todos os talhões)
    if (!naoPlanejados && ui.filtroTalhoes === 'nao-planejados') ui.filtroTalhoes = 'todos';
    const visiveis = talhoesVisiveis(op);
    const marcar = !somenteLeitura;
    const marcaveis = visiveis.filter((t) => marcavel(op, t));
    const todos = marcaveis.length > 0 && marcaveis.every((t) => ui.marcados.has(t.nome));
    // Uma coluna por produto: os da recomendação filtrada, ou os de todas as recomendações aplicadas
    const colunas = rec ? rec.produtos.filter(Planos.linhaPreenchida) : Planos.colunasDose(op);
    const vazio = !talhoesFazenda.length ? `Nenhum talhão cadastrado na fazenda ${esc(plano.fazenda)}.`
      : !visiveis.length ? `Todos os talhões ${tsi ? 'com variedade ' : ''}já têm ${T().nome}.` : '';
    const nColunas = colunas.length + (marcar ? 3 : 2) + 1; // + Produtividade média (Defensivo) ou Variedade (TSI)
    // TSI com talhão sem variedade: avisa por que a caixa dele está desabilitada e leva ao Plantio
    const semVariedade = tsi && marcar && talhoesFazenda.some((t) => !planejado(op, t.nome));
    return `
      ${semVariedade ? `
        <div class="dica-plantio" role="note">${Icones.info}
          <p>Talhões sem variedade não recebem TSI. Defina a variedade na aba
            <button class="dica-plantio__link" type="button" data-acao="passo-semente" data-passo="plantio">Plantio</button>.</p>
        </div>` : ''}
      ${filtrosTalhoes([
        { valor: 'todos', rotulo: `Todos os talhões: ${talhoesFazenda.length}` },
        ...(naoPlanejados ? [{ valor: 'nao-planejados', rotulo: `Não planejados: ${naoPlanejados}` }] : []),
        ...recsAplicadas(op).map((r) => ({ valor: `rec:${r.id}`, rotulo: `${pontoRec(op, r)}${esc(nomeCurto(r))}` }))
      ])}
      ${rec ? quadroRec(op, rec) : ''}
      <div class="talhoes-rolagem">
        <table class="tabela tabela--compacta tabela-talhoes tabela-doses">
          <thead><tr>
            ${marcar ? `<th class="tabela__marcar"><input type="checkbox" data-acao="marcar-todos" aria-label="Marcar todos"
                 ${todos ? 'checked' : ''} ${marcaveis.length ? '' : 'disabled'}></th>` : ''}
            <th>Talhão</th><th class="tabela__numero">Área (ha)</th>${tsi ? '<th>Variedade</th>' : `<th class="tabela__numero" title="${esc(textoSafrasMedia())}">Produtividade média (${unidadeProdutividade()})</th>`}
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
                return `<td class="tabela__numero">${d === null || d === undefined ? '—' : formatarDose(d)}</td>`;
              }).join('');
              return `
                <tr>
                  ${marcar ? `<td class="tabela__marcar">${marcavel(op, t)
                      ? `<input type="checkbox" data-acao="marcar" data-talhao="${esc(t.nome)}" aria-label="Marcar ${esc(t.nome)}" ${ui.marcados.has(t.nome) ? 'checked' : ''}>`
                      : `<input type="checkbox" disabled aria-label="${esc(t.nome)} sem variedade: defina a variedade antes da TSI" title="Defina a variedade antes da TSI">`}</td>` : ''}
                  <th scope="row" class="tabela__talhao">${r ? `${pontoRec(op, r)}<span class="so-leitor">${esc(r.nome)}: </span>` : ''}${esc(t.nome)}</th>
                  <td class="tabela__numero">${Util.area(t.area).replace(' ha', '')}</td>
                  ${tsi ? `<td>${planejado(op, t.nome) ? esc(op.plantio[t.nome].variedade) : '<span class="tabela__nao-recebe">Sem variedade</span>'}</td>`
                    : `<td class="tabela__numero">${historicoLeitura(t.nome)}</td>`}
                  ${doses}
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${marcar ? barraDefinir(op) : ''}`;
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
            ${produtos.map((l) => `<li>${[l.principioAtivo, l.produto].filter(Boolean).map(esc).join(' · ')} · <strong>${formatarDose(l.dose) || '—'} ${Planos.unidadeDose(l)}</strong></li>`).join('')}
          </ul>` : ''}
      </section>`;
  }

  // Sem talhão marcado: orientação em destaque e botão desabilitado.
  // Com talhão marcado: quantidade e área à esquerda; Limpar e "Definir recomendação" à direita.
  // "Excluir recomendação" aparece antes de Limpar e Definir recomendação quando algum talhão marcado tem recomendação.
  function barraDefinir(op) {
    const n = ui.marcados.size;
    const area = talhoesFazenda.filter((t) => ui.marcados.has(t.nome)).reduce((s, t) => s + t.area, 0);
    const comRec = [...ui.marcados].some((t) => op.talhoes[t]);
    return `
      <div class="barra-definir ${n ? '' : 'barra-definir--vazia'}">
        ${n ? `
          <span class="barra-definir__selecao"><strong>${n} ${n === 1 ? 'talhão' : 'talhões'}</strong> · ${Util.area(area)}</span>
          ${comRec ? `
            <button class="botao botao--perigo-leve barra-definir__excluir" type="button" data-acao="excluir-marcados">${Icones.lixeira} Excluir ${T().nome}</button>` : ''}
          <button class="botao botao--secundario barra-definir__limpar" type="button" data-acao="limpar-selecao"
                  title="Desmarcar todos os talhões" aria-label="Limpar seleção: desmarcar todos os talhões">Limpar</button>`
        : `<span class="barra-definir__texto">${Icones.info} Selecione um ou mais talhões para definir a ${T().nome}.</span>`}
        <button class="botao botao--primario" type="button" data-acao="definir-recomendacao" ${n ? '' : 'disabled'}>Definir ${T().nome}</button>
      </div>`;
  }

  // ----- Modal "Definir recomendação" -----
  // Fica dentro da tela (não no Modal genérico) para reaproveitar a busca de produto, o pré-cadastro,
  // as guias de recomendação e o rascunho, que dependem dos eventos da tela.
  function abrirDefinir(op) {
    const talhoes = talhoesFazenda.filter((t) => ui.marcados.has(t.nome) && marcavel(op, t)).map((t) => t.nome);
    if (!talhoes.length) return;
    if (semDap(op)) return;
    ui.rascunho = null; ui.preCadastro = null; ui.validarOp = null; ui.erroNome = null; ui.naoEncontrado = {}; ui.copiadoDe = null;
    // Talhões marcados que já estão todos na mesma recomendação: abre nela.
    // Senão, cria a próxima (Recomendação 2, Rec 2…), com produto e dose em branco e sem mostrar
    // as outras: o modal é só dessa recomendação. Se for cancelado, a nova vazia é descartada.
    const receitas = new Set(talhoes.map((t) => op.talhoes[t] && op.talhoes[t].receitaId));
    const comum = receitas.size === 1 ? [...receitas][0] : null;
    if (comum) {
      ui.receitaPorOp[op.id] = comum;
      // Talhões marcados com a mesma dose própria: o modal mostra a dose deles, não a padrão
      const r = op.receitas.find((x) => x.id === comum);
      rascunho(op).produtos.forEach((l) => {
        const base = r.produtos.find((x) => x.id === l.id);
        if (!base) return;
        const doses = talhoes.map((t) => Planos.doseTalhao(op, op.talhoes[t], base));
        if (doses.every((d) => d === doses[0])) l.dose = doses[0];
      });
    } else {
      const nova = Planos.novaReceita(op, [], T().base);
      op.receitas.push(nova);
      ui.receitaPorOp[op.id] = nova.id;
    }
    // Doses mostradas ao abrir: ao aplicar em parte dos talhões, só a dose que a pessoa mudar é gravada
    const dosesIniciais = Object.fromEntries(rascunho(op).produtos.map((l) => [l.id, l.dose]));
    ui.definindo = { talhoes, dosesIniciais };
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
    ui.rascunho = null; ui.preCadastro = null; ui.validarOp = null; ui.erroNome = null; ui.naoEncontrado = {}; ui.copiadoDe = null;
    ui.receitaPorOp[op.id] = r.id;
    const talhoes = talhoesFazenda.map((t) => t.nome).filter((t) => op.talhoes[t] && op.talhoes[t].receitaId === r.id);
    ui.definindo = { talhoes, editando: true };
    desenharMantendoFoco('.definir');
  }

  // Cancelar, X ou Esc: descarta o que foi feito no modal (sem perguntar) e mantém os talhões marcados
  function fecharDefinir() {
    const op = opAtual();
    const editando = ui.definindo && ui.definindo.editando;
    ui.rascunho = null; ui.preCadastro = null; ui.validarOp = null; ui.erroNome = null; ui.naoEncontrado = {}; ui.copiadoDe = null;
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
    return `
      <div class="definir-fundo">
        <div class="definir" role="dialog" aria-modal="true" aria-labelledby="definir-titulo" tabindex="-1">
          <div class="definir__topo">
            <div class="definir__titulos">
              <h2 class="definir__titulo" id="definir-titulo">${editando ? 'Editar' : 'Definir'} ${T().nome}</h2>
              <p class="definir__op">${esc(op.nome)} · ${ehTsi() ? 'Tratamento de sementes industrial' : `DAP ${op.dap}`}</p>
              <p class="definir__alvo">${n} ${n === 1 ? 'talhão' : 'talhões'} · ${Util.area(area)}</p>
            </div>
            <button class="botao-icone" type="button" data-acao="fechar-definir" aria-label="Fechar">${Icones.fechar}</button>
          </div>
          <div class="definir__corpo">
            ${r && !somenteLeitura ? `
              <div class="definir__linha-nome">
                ${campoNome(op)}
                ${!editando && !Planos.talhoesDaReceita(op, r).length ? campoCopiar(op, r) : ''}
              </div>` : ''}
            ${r ? corpoReceita(op, r) : `
              <p class="recomendacao__vazia">Nenhuma ${T().nome} nesta operação.</p>`}
          </div>
          <div class="definir__rodape">
            ${r && !somenteLeitura && Planos.talhoesDaReceita(op, r).length ? `
              <button class="botao botao--perigo-leve definir__excluir" type="button" data-acao="excluir-rec">${Icones.lixeira} Excluir ${T().nome}</button>` : ''}
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
        <label class="campo__rotulo" for="rec-nome">Nome da ${T().nome}</label>
        <input class="campo__controle ${ui.erroNome ? 'campo__controle--erro' : ''}" id="rec-nome" data-campo="nome-rec"
               value="${esc(nome)}" autocomplete="off" ${ui.erroNome ? 'aria-invalid="true" aria-describedby="rec-nome-erro"' : ''}>
        ${ui.erroNome ? `<p class="erro-campo" id="rec-nome-erro">${ui.erroNome}</p>` : ''}
      </div>`;
  }


  // Passo TSI do grupo Semente: a recomendação agronômica (receitas, talhões e doses) da operação Plantio
  function ehTsi() {
    return ehSemente(grupoAtual()) && ui.passoSemente === 'tsi';
  }

  // Produtos do cadastro: no TSI só os de tratamento de sementes; nos defensivos, sem eles.
  // Fertilidade: só corretivos e fertilizantes
  function cadastroAtual() {
    const uso = usoAtual();
    return DADOS.defensivos.filter((d) => usoProduto(d) === uso);
  }
  function usoProduto(d) {
    return d.tsi ? 'tsi' : d.fertilidade ? 'fertilidade' : 'defensivo';
  }
  function usoAtual() {
    return ehTsi() ? 'tsi' : ehFertilidade(grupoAtual()) ? 'fertilidade' : 'defensivo';
  }

  // Palavras da recomendação agronômica; no TSI, "TSI" ("Definir TSI", "TSI 1 aplicada")
  function T() {
    // pa: nome da coluna do princípio ativo (na Fertilidade, a matéria-prima: a fonte do nutriente)
    const fert = ehFertilidade(grupoAtual());
    const pa = fert ? 'Matéria-prima' : 'Princípio ativo';
    const paOpcional = fert ? 'A matéria-prima é opcional' : 'O princípio ativo é opcional';
    return ehTsi() ? { nome: 'TSI', Nome: 'TSI', base: 'TSI', pa, paOpcional }
      : { nome: 'recomendação', Nome: 'Recomendação', base: 'Recomendação', pa, paOpcional };
  }

  // ================= Grupo Semente: plantio por talhão =================
  // docs/telas/04.2-operacoes-sementes.md. Passos Plantio (variedade, data e população) · TSI.
  // O TSI usa a recomendação agronômica da Tela 04.1 com as receitas e os talhões da operação Plantio.
  function ehSemente(grupo) {
    return grupo && grupo.tipo === 'Sementes';
  }

  function variedadeDoCadastro(nome) {
    return DADOS.variedades.find((v) => v.nome === nome && v.cultura === plano.cultura) || null;
  }

  function variedadesDaCultura() {
    return DADOS.variedades.filter((v) => v.cultura === plano.cultura);
  }

  // "BRS 6981IPRO · ciclo 103 dias" (lista de variedades)
  function rotuloVariedade(v) {
    return `${v.nome} · ${v.ciclo ? `ciclo ${v.ciclo} dias` : 'ciclo não informado'}`;
  }

  // ----- Datas e decêndios (datas em 'AAAA-MM-DD', sem fuso) -----
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
    'setembro', 'outubro', 'novembro', 'dezembro'];

  function dataLocal(iso) {
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, m - 1, d);
  }

  function somarDias(iso, dias) {
    const dt = dataLocal(iso);
    dt.setDate(dt.getDate() + dias);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  function diaMes(iso) {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  }

  function dataCompleta(iso) {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }

  // Decêndio da data: 1º (dias 1 a 10), 2º (11 a 20), 3º (21 ao fim do mês)
  function decendio(iso) {
    const dt = dataLocal(iso);
    const n = dt.getDate() <= 10 ? 1 : dt.getDate() <= 20 ? 2 : 3;
    const mes = MESES[dt.getMonth()];
    const fim = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    const dias = n === 1 ? '01–10' : n === 2 ? '11–20' : `21–${fim}`;
    return {
      chave: `${iso.slice(0, 7)}-${n}`,               // ordena os decêndios
      curto: `${n}º dec. ${mes}`,                       // eixo do gráfico
      texto: `${n}º dec. de ${mes}`,                    // painel do talhão
      longo: `${n}º decêndio de ${mes} (${dias}/${mes.slice(0, 3)})`
    };
  }

  // Data digitada "07/10/2026" (ou "07102026") → '2026-10-07'; inválida → null
  function dataDeTexto(texto) {
    const d = String(texto || '').replace(/\D/g, '');
    if (d.length !== 8) return null;
    const [dia, mes, ano] = [Number(d.slice(0, 2)), Number(d.slice(2, 4)), Number(d.slice(4))];
    const dt = new Date(ano, mes - 1, dia);
    if (ano < 1900 || dt.getFullYear() !== ano || dt.getMonth() !== mes - 1 || dt.getDate() !== dia) return null;
    return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  // Máscara enquanto digita: só números, com as barras no lugar (dd/mm/aaaa)
  function mascaraData(texto) {
    const d = String(texto || '').replace(/\D/g, '').slice(0, 8);
    return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/');
  }

  // Campo de data de plantio (texto com máscara; grava ao sair do campo ou com Enter)
  // O botão ao lado abre o calendário do navegador (campo de data escondido atrás do botão)
  function campoData(id, campo, iso, texto, erro) {
    return `<div class="campo-data">
              <input class="campo__controle ${erro ? 'campo__controle--erro' : ''}" id="${id}" data-campo="${campo}" type="text"
                     inputmode="numeric" placeholder="dd/mm/aaaa" maxlength="10" autocomplete="off"
                     value="${esc(texto ?? (iso ? dataCompleta(iso) : ''))}" ${erro ? 'aria-invalid="true"' : ''}>
              <button class="botao-icone campo-data__botao" type="button" data-acao="abrir-calendario"
                      aria-label="Escolher a data no calendário" title="Escolher no calendário">${Icones.calendario}</button>
              <input class="campo-data__nativo" type="date" data-campo="${campo}-cal" value="${iso || ''}" tabindex="-1" aria-hidden="true">
            </div>
            ${erro ? `<p class="erro-campo">${erro}</p>` : ''}`;
  }

  // Ano do plantio pela safra do plano ("26/27" → 2026)
  function anoPlantio() {
    const ano = 2000 + Number(String(plano.safra).slice(0, 2));
    return Number.isFinite(ano) ? ano : new Date().getFullYear();
  }

  // Janela recomendada da variedade ('MM-DD' a 'MM-DD'): "1º dec. de outubro a 2º dec. de novembro"
  function janelaTexto(v) {
    if (!v || !v.janela) return '';
    const [ini, fim] = v.janela.map((md) => decendio(`${anoPlantio()}-${md}`).texto);
    return ini === fim ? ini : `${ini} a ${fim}`;
  }

  // Data fora da janela recomendada: só alerta, não bloqueia
  function foraDaJanela(v, data) {
    if (!v || !v.janela || !data) return false;
    const md = data.slice(5);
    return md < v.janela[0] || md > v.janela[1];
  }

  // Previsão de colheita = data de plantio + ciclo da variedade (sem ciclo ou sem data: null)
  function previsaoColheita(p) {
    const v = p && p.variedade ? variedadeDoCadastro(p.variedade) : null;
    return p && p.data && v && v.ciclo ? somarDias(p.data, v.ciclo) : null;
  }

  function semCiclo(p) {
    const v = p && p.variedade ? variedadeDoCadastro(p.variedade) : null;
    return !!(v && !v.ciclo);
  }

  // ----- Histórico do talhão: [safra, variedade, sc/ha, chuva mm] -----
  function historicoTalhao(talhao) {
    return ((DADOS.historico || {})[plano.fazenda] || {})[talhao] || [];
  }

  function mediaHistorica(h) {
    return h.length ? h.reduce((s, x) => s + x[2], 0) / h.length : null;
  }

  function umaCasa(v) {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  // Talhão "planejado" no passo Variedade = tem variedade
  function planejado(op, talhao) {
    return !!(op.plantio[talhao] && op.plantio[talhao].variedade);
  }

  // Colunas da tabela do Plantio: valor (para ordenar) e texto (o que a célula mostra; '' = vazio)
  const textoData = (iso) => (iso ? diaMes(iso) : '');
  const COLUNAS_PLANTIO = [
    { id: 'talhao', rotulo: 'Talhão', valor: (op, t) => t.nome, texto: (op, t) => t.nome },
    { id: 'area', rotulo: 'Área (ha)', numero: true, valor: (op, t) => t.area, texto: (op, t) => Util.area(t.area).replace(' ha', '') },
    { id: 'produtividade', rotulo: 'Produtividade histórica',
      valor: (op, t) => mediaHistorica(historicoTalhao(t.nome)),
      texto: (op, t) => { const m = mediaHistorica(historicoTalhao(t.nome)); return m ? `${umaCasa(m)} sc/ha` : ''; } },
    { id: 'variedade', rotulo: 'Variedade (ciclo)', valor: (op, t) => variedadeTalhao(op, t.nome) || null, texto: (op, t) => variedadeTalhao(op, t.nome) },
    { id: 'plantio', rotulo: 'Plantio', valor: (op, t) => (op.plantio[t.nome] || {}).data || null, texto: (op, t) => textoData((op.plantio[t.nome] || {}).data) },
    { id: 'colheita', rotulo: 'Previsão de colheita', valor: (op, t) => previsaoColheita(op.plantio[t.nome]),
      texto: (op, t) => { const pl = op.plantio[t.nome]; return previsaoColheita(pl) ? textoData(previsaoColheita(pl)) : semCiclo(pl) ? 'Informe o ciclo' : ''; } },
    { id: 'populacao', rotulo: 'População', sub: '(mil plantas/ha)', numero: true,
      valor: (op, t) => populacaoDe(op, t.nome), texto: (op, t) => { const n = populacaoDe(op, t.nome); return n ? numeroTexto(n) : ''; } },
    { id: 'sementes', rotulo: 'Total de sementes', numero: true,
      valor: (op, t) => sementesDe(op, t), texto: (op, t) => { const n = sementesDe(op, t); return n ? milhoes(n) : ''; } },
    { id: 'bags', rotulo: 'Bags', numero: true,
      valor: (op, t) => sementesDe(op, t), texto: (op, t) => { const n = sementesDe(op, t); return n ? bags(n) : ''; } }
  ];
  const colunaPlantio = (id) => COLUNAS_PLANTIO.find((c) => c.id === id);
  // Colunas do tamanho do conteúdo; a Variedade fica com o espaço que sobra
  const classeColuna = (c) => (c.numero ? 'tabela__numero' : c.id === 'variedade' ? 'tabela__expandir' : '');


  // Talhões na ordem escolhida no título da coluna (sem ordem: a dos talhões).
  // Valor vazio (sem variedade, sem data) fica sempre no fim.
  function talhoesVisiveisPlantio(op) {
    const lista = [...talhoesFazenda];
    const ordem = ui.ordemSemente;
    const c = ordem && colunaPlantio(ordem.coluna);
    if (!c) return lista;
    const valor = (t) => c.valor(op, t);
    return lista.sort((a, b) => {
      const va = valor(a); const vb = valor(b);
      if (va === null || va === undefined) return vb === null || vb === undefined ? 0 : 1;
      if (vb === null || vb === undefined) return -1;
      const x = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR', { numeric: true });
      return ordem.sentido === 'desc' ? -x : x;
    });
  }

  // Título de coluna: ordena só pelas setas (1º clique crescente, 2º decrescente).
  // "Produtividade histórica": o nome abre o painel no primeiro talhão da tabela.
  // O rótulo pode ter quebra de linha (<br>); "depois" entra ao lado da seta (ex.: o filtro de variedade).
  function tituloOrdenavel(coluna, rotulo, classe = '', depois = '') {
    const ordem = ui.ordemSemente;
    const texto = rotulo.replace(/<br>/g, ' ');
    const ativa = ordem && ordem.coluna === coluna;
    const sentido = ativa ? ordem.sentido : null;
    const nome = coluna === 'produtividade'
      ? `<button class="titulo-abrir" type="button" data-acao="abrir-primeiro" title="Abrir o painel no primeiro talhão da tabela">${rotulo}</button>`
      : `<span>${rotulo}</span>`;
    return `
      <th class="${classe}" ${ativa ? `aria-sort="${sentido === 'asc' ? 'ascending' : 'descending'}"` : ''}>
        <span class="titulo-coluna">${nome}
          <button class="titulo-ordenar ${ativa ? 'titulo-ordenar--ativo' : ''} ${sentido === 'desc' ? 'titulo-ordenar--desc' : ''}" type="button"
                  data-acao="ordenar-semente" data-coluna="${coluna}" title="Ordenar por ${texto.toLowerCase()}"
                  aria-label="Ordenar por ${texto.toLowerCase()}${ativa ? (sentido === 'asc' ? ', crescente' : ', decrescente') : ''}">${ativa ? Icones.acima : Icones.ordenar}</button>${depois}
        </span>
      </th>`;
  }

  // ----- Cartão da operação de plantio -----
  const PASSOS_SEMENTE = [['plantio', 'Plantio'], ['tsi', 'TSI']];

  function detalheSemente(op) {
    if (!op.plantio) op.plantio = {};
    const passo = ui.passoSemente || 'plantio';
    const comPainel = passo === 'plantio' && ['talhoes', 'mapa'].includes(ui.visaoSemente || 'talhoes') &&
      ui.painelTalhao && talhoesFazenda.some((t) => t.nome === ui.painelTalhao);
    return `
      <div class="semente-layout">
        <section class="cartao op-painel" aria-label="${esc(op.nome)}">
          <div class="semente-topo">
            <div class="passos" role="tablist" aria-label="Passos do plantio">
              ${PASSOS_SEMENTE.map(([id, nome]) => `
                <button class="passo ${passo === id ? 'passo--ativo' : ''}" type="button" role="tab" aria-selected="${passo === id}"
                        data-acao="passo-semente" data-passo="${id}">${nome}</button>`).join('')}
            </div>
            ${passo === 'plantio' ? visoesVariedade() : ''}
          </div>
          ${passo === 'plantio' ? passoVariedade(op) : painelTalhoes(op)}
        </section>
        ${comPainel ? painelTalhao(op, ui.painelTalhao) : ''}
      </div>`;
  }

  // ----- Passo Plantio (variedade, data de plantio e população) -----
  // "Exibir" (à direita dos passos): Tabela · Mapa · Previsão de colheita
  function visoesVariedade() {
    const visao = ui.visaoSemente || 'talhoes';
    const botao = (valor, rotulo) => `
      <button class="visoes__botao ${visao === valor ? 'visoes__botao--ativo' : ''}" type="button" data-acao="visao-semente"
              data-visao="${valor}" aria-pressed="${visao === valor}">${rotulo}</button>`;
    return `
      <div class="exibir">
        <span class="exibir__rotulo" id="exibir-rotulo">Exibir</span>
        <div class="visoes" role="group" aria-labelledby="exibir-rotulo">
          ${botao('talhoes', 'Tabela')}${botao('mapa', 'Mapa')}${botao('colheita', 'Previsão de colheita')}
        </div>
      </div>`;
  }

  function passoVariedade(op) {
    const visao = ui.visaoSemente || 'talhoes';
    return visao === 'colheita' ? visaoColheita(op) : visao === 'mapa' ? `${visaoMapa()}${legendaMapa(op)}` : tabelaVariedade(op);
  }

  // Unidade da produtividade conforme a cultura do plano (por enquanto só soja: sc/ha)
  function unidadeProdutividade() {
    return { Soja: 'sc/ha' }[plano.cultura] || 'sc/ha';
  }

  // Título da coluna ao passar o mouse: as safras que entram na média ("Média das safras 23/24, 24/25 e 25/26").
  // São as 3 últimas ocorrências da cultura em cada talhão; podem não ser seguidas (ex.: 20/21, 23/24 e 25/26).
  function textoSafrasMedia() {
    const safras = [...new Set(talhoesFazenda.flatMap((t) => historicoTalhao(t.nome).map(([safra]) => safra)))].sort();
    if (!safras.length) return 'Sem histórico de produtividade';
    const lista = safras.length > 1 ? `${safras.slice(0, -1).join(', ')} e ${safras[safras.length - 1]}` : safras[0];
    return `Média ${safras.length > 1 ? 'das safras' : 'da safra'} ${lista}`;
  }

  // Produtividade média das 3 últimas safras, só o número (Defensivo; no TSI, por enquanto não); as safras ao passar o mouse
  function historicoLeitura(talhao) {
    const h = historicoTalhao(talhao);
    if (!h.length) return '<span class="tabela__nao-recebe">—</span>';
    const safras = `${h.map(([safra, , sc]) => `${safra}: ${Math.round(sc)}`).join(' · ')} ${unidadeProdutividade()}`;
    return `<span title="${esc(safras)}">${Math.round(mediaHistorica(h))}<span class="so-leitor"> (${esc(safras)})</span></span>`;
  }

  // Mini barras das 3 safras (a mais recente mais escura) e a média em sc/ha
  function miniHistorico(talhao) {
    const h = historicoTalhao(talhao);
    if (!h.length) return '<span class="tabela__nao-recebe">Sem histórico</span>';
    const barras = h.map(([, , sc], i) => {
      const altura = Math.max(3, Math.min(20, Math.round((sc - 40) / 2)));
      return `<span class="historico-mini__barra ${i === h.length - 1 ? 'historico-mini__barra--ultima' : ''}" style="height: ${altura}px"></span>`;
    }).join('');
    return `<span class="historico-mini__barras" aria-hidden="true">${barras}</span><strong>${umaCasa(mediaHistorica(h))}</strong> sc/ha`;
  }

  // Tabela única: plantio e população por talhão; todas as colunas ordenam (setas) e filtram (funil).
  // No pé da tabela, a germinação média do plano, que calcula o total de sementes e os bags.
  function tabelaVariedade(op) {
    const visiveis = talhoesVisiveisPlantio(op);
    const marcar = !somenteLeitura;
    const todos = visiveis.length > 0 && visiveis.every((t) => ui.marcados.has(t.nome));
    const vazio = '<span class="tabela__nao-recebe">—</span>';
    let comPopulacao = 0;
    const linhas = visiveis.map((t) => {
      const p = op.plantio[t.nome];
      const v = p && p.variedade ? variedadeDoCadastro(p.variedade) : null;
      const prev = previsaoColheita(p);
      const aberto = ui.painelTalhao === t.nome;
      const pop = populacaoDe(op, t.nome);
      const s = sementesDe(op, t);
      if (pop) comPopulacao++;
      const variedade = v
        ? `${esc(v.nome)} <span class="tabela__ciclo">(${v.ciclo ? `${v.ciclo} d` : 'ciclo não informado'})</span>${v.preCadastro ? ' <span class="etiqueta-pre">Pré-cadastro</span>' : ''}`
        : '<span class="tabela__nao-recebe">Não planejado</span>';
      const plantio = p && p.data
        ? `${diaMes(p.data)}${foraDaJanela(v, p.data) ? ` <span class="aviso-janela" title="Fora da janela recomendada (${esc(janelaTexto(v))})">${Icones.alerta}<span class="so-leitor">Fora da janela recomendada</span></span>` : ''}`
        : vazio;
      const colheita = prev ? diaMes(prev)
        : semCiclo(p) ? '<span class="texto-alerta">Informe o ciclo</span>' : vazio;
      const populacao = pop
        ? `${foraDaFaixa(v, pop) ? `<span class="aviso-janela" title="Fora da população recomendada (${faixaPopulacao(v)} mil plantas/ha)">${Icones.alerta}<span class="so-leitor">Fora da população recomendada</span></span> ` : ''}${numeroTexto(pop)}`
        : vazio;
      return `
        <tr class="${aberto ? 'linha--aberta' : ''}">
          ${marcar ? `<td class="tabela__marcar"><input type="checkbox" data-acao="marcar" data-talhao="${esc(t.nome)}"
              aria-label="Marcar ${esc(t.nome)}" ${ui.marcados.has(t.nome) ? 'checked' : ''}></td>` : ''}
          <th scope="row" class="tabela__talhao">${esc(t.nome)}</th>
          <td class="tabela__numero">${Util.area(t.area).replace(' ha', '')}</td>
          <td><button class="historico-mini ${aberto ? 'historico-mini--aberto' : ''}" type="button" data-acao="abrir-painel"
                      data-talhao="${esc(t.nome)}" aria-label="Abrir o painel do ${esc(t.nome)}">${miniHistorico(t.nome)}</button></td>
          <td class="tabela__expandir">${variedade}</td>
          <td>${plantio}</td>
          <td>${colheita}</td>
          <td class="tabela__numero">${populacao}</td>
          <td class="tabela__numero">${s ? milhoes(s) : vazio}</td>
          <td class="tabela__numero tabela__forte">${s ? bags(s) : vazio}</td>
        </tr>`;
    }).join('');
    const titulo = (id) => {
      const c = colunaPlantio(id);
      return tituloOrdenavel(id, c.sub ? `${c.rotulo} ${c.sub}` : c.rotulo, classeColuna(c));
    };
    const semGerminacao = comPopulacao && !op.germinacao;
    return `
      ${marcar && !ui.dicaPlantioVista ? `
        <div class="dica-plantio" role="note">${Icones.info}
          <p>Clique na produtividade histórica para definir o plantio talhão a talhão. Ou marque vários talhões para definir em lote.</p>
          <button class="botao-icone dica-plantio__fechar" type="button" data-acao="fechar-dica" aria-label="Fechar a dica" title="Fechar">${Icones.fechar}</button>
        </div>` : ''}
      <div class="populacao-area">
        <div class="talhoes-rolagem">
          <table class="tabela tabela--compacta tabela-talhoes tabela-variedade tabela-populacao">
            <thead><tr>
              ${marcar ? `<th class="tabela__marcar"><input type="checkbox" data-acao="marcar-todos" aria-label="Marcar todos"
                   ${todos ? 'checked' : ''} ${visiveis.length ? '' : 'disabled'}></th>` : ''}
              ${COLUNAS_PLANTIO.map((c) => titulo(c.id)).join('')}
            </tr></thead>
            <tbody>
              ${linhas || `<tr><td class="tabela__vazia" colspan="${marcar ? 10 : 9}">Nenhum talhão com esses filtros.</td></tr>`}
            </tbody>
            <tfoot><tr>
              <td colspan="${marcar ? 10 : 9}">
                <div class="tabela__rodape-germinacao">
                  ${campoGerminacao(op)}
                  ${semGerminacao ? '<span class="texto-alerta">Informe a germinação média para calcular sementes e bags</span>' : ''}
                </div>
              </td>
            </tr></tfoot>
          </table>
        </div>
      </div>
      ${marcar ? barraPlantio(op) : ''}`;
  }

  // Barra de ação: só aparece com talhão marcado (quantos e área · Excluir plantio · Limpar · Definir variedade)
  function barraPlantio(op) {
    const n = ui.marcados.size;
    if (!n) return '';
    const area = talhoesFazenda.filter((t) => ui.marcados.has(t.nome)).reduce((s, t) => s + t.area, 0);
    const comPlantio = [...ui.marcados].some((t) => temPlantio(op, t));
    return `
      <div class="barra-acao" role="region" aria-label="Talhões selecionados">
        <p class="barra-acao__selecao"><strong>${n} ${n === 1 ? 'talhão selecionado' : 'talhões selecionados'}</strong> · ${Util.area(area)}</p>
        ${comPlantio ? `
          <button class="botao botao--perigo-leve barra-definir__excluir" type="button" data-acao="excluir-plantio">${Icones.lixeira} Excluir plantio</button>` : ''}
        <button class="botao botao--secundario barra-definir__limpar" type="button" data-acao="limpar-selecao"
                title="Desmarcar todos os talhões" aria-label="Limpar seleção: desmarcar todos os talhões">Limpar</button>
        <button class="botao botao--primario barra-acao__definir" type="button" data-acao="definir-plantio">${Icones.broto} Definir plantio</button>
      </div>`;
  }

  // ----- Painel do talhão (lateral) -----
  // Histórico de produtividade e chuva; variedade, data de plantio e previsão de colheita.
  // O que se escolhe aqui vale na hora (sem Salvar); as setas passam para o talhão anterior ou próximo.
  function painelTalhao(op, talhao) {
    const t = talhoesFazenda.find((x) => x.nome === talhao);
    const p = op.plantio[talhao] || {};
    const v = p.variedade ? variedadeDoCadastro(p.variedade) : null;
    const h = historicoTalhao(talhao);
    const lista = talhoesVisiveisPlantio(op);
    const i = lista.findIndex((x) => x.nome === talhao);
    const anterior = i > 0 ? lista[i - 1] : null;
    const proximo = i >= 0 && i < lista.length - 1 ? lista[i + 1] : null;
    const seta = (alvo, acao, icone, rotulo) => `
      <button class="botao-icone painel-talhao__seta" type="button" data-acao="${acao}" ${alvo ? '' : 'disabled'}
              title="${alvo ? `${rotulo}: ${esc(alvo.nome)}` : rotulo}" aria-label="${rotulo}${alvo ? `: ${esc(alvo.nome)}` : ''}">${icone}</button>`;

    let variedade;
    if (somenteLeitura) {
      variedade = `<p class="campo__valor">${v ? esc(rotuloVariedade(v)) : '—'}</p>`;
    } else if (ui.prePainel !== null && ui.prePainel !== undefined) {
      variedade = `
        <div class="painel-talhao__pre">
          <p class="pre-cadastro__titulo">Pré-cadastro de variedade <span class="pre-cadastro__ajuda">· Cultura ${esc(plano.cultura)}</span></p>
          <input class="campo__controle ${ui.erroPrePainel ? 'campo__controle--erro' : ''}" data-campo="pt-pre" value="${esc(ui.prePainel)}"
                 placeholder="Nome da variedade" aria-label="Nome da variedade" autocomplete="off" data-foco-inicial>
          ${ui.erroPrePainel ? `<p class="erro-campo">${ui.erroPrePainel}</p>` : ''}
          <div class="painel-talhao__pre-botoes">
            <button class="botao botao--secundario botao--p" type="button" data-acao="pt-pre-cancelar">Cancelar</button>
            <button class="botao botao--secundario botao--p pre-cadastro__salvar" type="button" data-acao="pt-pre-salvar">Salvar pré-cadastro</button>
          </div>
        </div>`;
    } else {
      variedade = `
        <select class="campo__controle" id="pt-variedade" data-campo="pt-variedade">
          <option value="" ${v ? '' : 'selected'} disabled>Selecione a variedade</option>
          ${variedadesDaCultura().map((x) => `<option value="${esc(x.nome)}" ${v && x.nome === v.nome ? 'selected' : ''}>${esc(rotuloVariedade(x))}</option>`).join('')}
          <option value="__pre__">+ Pré-cadastrar variedade</option>
        </select>`;
    }
    const ciclo = v && !v.ciclo && !somenteLeitura ? `
      <div class="campo painel-talhao__ciclo">
        <label class="campo__rotulo" for="pt-ciclo">Ciclo (dias)</label>
        <input class="campo__controle" id="pt-ciclo" data-campo="pt-ciclo" type="text" inputmode="numeric" placeholder="Ex.: 115" autocomplete="off">
        <p class="campo__ajuda">${esc(v.nome)} está sem ciclo para a safra ${esc(plano.safra)}. Informe para calcular a previsão de colheita (vale para todos os talhões com ela).</p>
      </div>` : '';
    const pop = p.populacao || null;
    const populacao = somenteLeitura
      ? `<p class="campo__valor">${pop ? numeroTexto(pop) : '—'}</p>`
      : `<input class="campo__controle populacao__campo" id="pt-populacao" data-campo="pt-populacao" type="text" inputmode="decimal"
                autocomplete="off" placeholder="Ex.: 280" value="${pop ? numeroTexto(pop) : ''}" ${v ? '' : 'disabled'}>`;
    const data = somenteLeitura
      ? `<p class="campo__valor">${p.data ? dataCompleta(p.data) : '—'}</p>`
      : campoData('pt-data', 'pt-data', p.data, ui.dataPainel && ui.dataPainel.talhao === talhao ? ui.dataPainel.texto : null,
          ui.dataPainel && ui.dataPainel.talhao === talhao ? 'Data inválida. Use dd/mm/aaaa.' : '');

    return `
      <aside class="cartao painel-talhao ${ui.painelExpandido ? 'painel-talhao--expandido' : ''}" aria-label="Talhão ${esc(talhao)}">
        <div class="painel-talhao__topo">
          <button class="botao-icone" type="button" data-acao="expandir-painel" aria-pressed="${!!ui.painelExpandido}"
                  title="${ui.painelExpandido ? 'Reduzir o painel' : 'Expandir o painel'}"
                  aria-label="${ui.painelExpandido ? 'Reduzir o painel' : 'Expandir o painel'}">${ui.painelExpandido ? Icones.expandir : Icones.recolher}</button>
          <h3 class="painel-talhao__titulo">${esc(talhao)} · ${Util.area(t ? t.area : 0)}</h3>
          ${seta(anterior, 'painel-anterior', Icones.voltar, 'Talhão anterior')}
          ${seta(proximo, 'painel-proximo', Icones.seta, 'Próximo talhão')}
          <button class="botao-icone" type="button" data-acao="fechar-painel" aria-label="Fechar o painel">${Icones.fechar}</button>
        </div>
        <div class="painel-talhao__rolagem">
          ${h.length ? graficoHistorico(h) : `<p class="painel-talhao__sem-historico">Sem histórico de ${esc(plano.cultura.toLowerCase())} neste talhão.</p>`}
          <div class="painel-talhao__campos">
            <div class="campo">
              <label class="campo__rotulo" for="pt-variedade">Variedade</label>
              ${variedade}
            </div>
            ${ciclo}
            <div class="painel-talhao__datas">
              <div class="campo">
                <label class="campo__rotulo" for="pt-data">Data de plantio</label>
                ${data}
                ${v && v.janela ? `<p class="campo__ajuda">Janela recomendada: ${esc(janelaTexto(v))}</p>` : ''}
                ${foraDaJanela(v, p.data) ? `<p class="aviso-janela-texto">${Icones.alerta} Fora da janela recomendada</p>` : ''}
              </div>
              <div class="campo">
                <label class="campo__rotulo" for="pt-populacao">População (mil plantas/ha)</label>
                ${populacao}
                <p class="campo__ajuda">${!v ? 'Escolha a variedade antes da população' : v.populacao ? `População recomendada: ${faixaPopulacao(v)} mil plantas/ha` : ''}</p>
                ${foraDaFaixa(v, pop) ? `<p class="aviso-janela-texto">${Icones.alerta} Fora da população recomendada</p>` : ''}
              </div>
            </div>
          </div>
        </div>
      </aside>`;
  }

  // Produtividade (linha, sc/ha) e chuva acumulada no ciclo (barras, mm) por safra.
  // O gráfico ocupa a altura livre do painel: as posições são em % da área (os textos não esticam).
  // Cada medida na sua faixa, sem se cruzar: a linha em cima (80 sc/ha a 14%, 40 sc/ha a 46%) e as barras
  // embaixo (até metade da altura), com o valor da chuva dentro da barra. Abaixo, variedade e safra.
  function graficoHistorico(h) {
    const n = h.length;
    const maxChuva = Math.max(1000, ...h.map((x) => x[3]));
    const x = (i) => ((i + 0.5) / n) * 100;
    const ySc = (sc) => 46 - (Math.min(80, Math.max(40, sc)) - 40) * 0.8;
    const descricao = h.map(([safra, variedade, sc, mm]) => `safra ${safra}, ${variedade}: ${sc} sc/ha e ${mm} mm`).join('; ');
    const segmentos = h.slice(1).map(([, , sc], i) =>
      `<line x1="${x(i)}%" y1="${ySc(h[i][2])}%" x2="${x(i + 1)}%" y2="${ySc(sc)}%" stroke="#13603f" stroke-width="2.5"></line>`).join('');
    return `
      <figure class="grafico-historico">
        <figcaption class="grafico-historico__titulo">Produtividade e chuva acumulada por safra</figcaption>
        <div class="grafico-historico__legenda" aria-hidden="true">
          <span><span class="grafico-historico__linha"></span>Produtividade (sc/ha)</span>
          <span><span class="grafico-historico__barra"></span>Chuva no ciclo (mm)</span>
        </div>
        <svg class="grafico-historico__area" role="img" aria-label="Produtividade e chuva por safra: ${esc(descricao)}">
          ${h.map(([safra, , , mm], i) => {
            const altura = (mm / maxChuva) * 50;
            return `
              <rect x="${x(i) - 7.5}%" y="${100 - altura}%" width="15%" height="${altura}%" rx="3" fill="#b9d7f0"><title>Safra ${safra}: ${mm} mm</title></rect>
              <text x="${x(i)}%" y="${100 - altura}%" dy="15" font-size="11" font-weight="600" fill="#1f4f86" text-anchor="middle">${mm} mm</text>`;
          }).join('')}
          ${segmentos}
          ${h.map(([safra, , sc], i) => `
            <circle cx="${x(i)}%" cy="${ySc(sc)}%" r="5" fill="#13603f" stroke="#fff" stroke-width="2"><title>Safra ${safra}: ${sc} sc/ha</title></circle>
            <text x="${x(i)}%" y="${ySc(sc)}%" dy="-9" font-size="12" font-weight="700" fill="#13603f" text-anchor="middle">${sc} sc/ha</text>`).join('')}
        </svg>
        <div class="grafico-historico__eixo" style="grid-template-columns: repeat(${n}, minmax(0, 1fr))" aria-hidden="true">
          ${h.map(([safra, variedade]) => `<span><strong>${esc(variedade)}</strong>Safra ${safra}</span>`).join('')}
        </div>
      </figure>`;
  }

  // ----- Visão Colheita: hectares por decêndio da previsão de colheita -----
  function visaoColheita(op) {
    const comPrevisao = [];
    const semPrevisao = [];
    talhoesFazenda.forEach((t) => {
      const p = op.plantio[t.nome];
      const prev = previsaoColheita(p);
      if (prev) comPrevisao.push({ t, p, dec: decendio(prev) });
      else semPrevisao.push({ t, p });
    });
    const soma = (lista) => lista.reduce((s, x) => s + x.t.area, 0);
    // Só os decêndios com pelo menos uma variedade planejada, em ordem de data
    const grupos = [];
    comPrevisao.sort((a, b) => a.dec.chave.localeCompare(b.dec.chave)).forEach((x) => {
      const g = grupos.find((y) => y.chave === x.dec.chave);
      if (g) g.itens.push(x); else grupos.push({ chave: x.dec.chave, dec: x.dec, itens: [x] });
    });
    const semData = semPrevisao.filter((x) => !semCiclo(x.p));
    const comSemCiclo = semPrevisao.filter((x) => semCiclo(x.p));
    const linhaSem = semPrevisao.length ? `
      <tr class="colheita__sem">
        <th scope="row">Sem previsão de colheita</th>
        <td class="tabela__numero">${Util.area(soma(semPrevisao)).replace(' ha', '')}</td>
        <td>${[comSemCiclo.length ? `${comSemCiclo.map((x) => esc(x.t.nome)).join(', ')} (ciclo não informado)` : '',
               semData.length ? `${semData.map((x) => esc(x.t.nome)).join(', ')} (sem variedade ou data de plantio)` : ''].filter(Boolean).join(' · ')}</td>
        <td>${[...new Set(comSemCiclo.map((x) => x.p.variedade))].map(esc).join(', ') || '—'}</td>
      </tr>` : '';
    return `
      ${grupos.length ? graficoColheita(grupos) : `
        <p class="colheita__vazia">${Icones.info} Nenhum talhão com previsão de colheita ainda. Escolha a variedade e a data de plantio na visão Talhões.</p>`}
      <div class="talhoes-rolagem">
        <table class="tabela tabela--compacta tabela-colheita">
          <thead><tr><th>Decêndio de colheita</th><th class="tabela__numero">Área (ha)</th><th>Talhões</th><th>Variedades</th></tr></thead>
          <tbody>
            ${grupos.map((g) => `
              <tr>
                <th scope="row">${esc(g.dec.longo)}</th>
                <td class="tabela__numero">${Util.area(soma(g.itens)).replace(' ha', '')}</td>
                <td>${g.itens.map((x) => esc(x.t.nome)).join(', ')}</td>
                <td>${[...new Set(g.itens.map((x) => x.p.variedade))].map(esc).join(', ')}</td>
              </tr>`).join('')}
            ${linhaSem}
          </tbody>
        </table>
      </div>`;
  }

  // Barras de uma cor só; eixo Y em hectares; valor em cima de cada barra; detalhe ao passar o mouse
  function graficoColheita(grupos) {
    const area = (g) => g.itens.reduce((s, x) => s + x.t.area, 0);
    const maximo = Math.max(...grupos.map(area));
    const passo = maximo <= 400 ? 100 : maximo <= 1000 ? 200 : 500;
    const topo = Math.max(passo, Math.ceil(maximo / passo) * passo);
    const L = 900; const x0 = 52; const base = 196; const alturaUtil = 160;
    const y = (ha) => base - ha / topo * alturaUtil;
    const fatia = (L - x0) / grupos.length;
    const largura = Math.min(90, fatia * 0.5);
    const ticks = [];
    for (let v = 0; v <= topo; v += passo) ticks.push(v);
    const descricao = grupos.map((g) => `${g.dec.curto}: ${area(g)} ha`).join(', ');
    return `
      <figure class="colheita__grafico">
        <figcaption class="colheita__titulo">Previsão de colheita por decêndio</figcaption>
        <svg viewBox="0 0 ${L} 222" role="img" aria-label="Previsão de colheita por decêndio: ${esc(descricao)}">
          <text x="0" y="14" font-size="11" fill="#5f6b64">Hectares</text>
          ${ticks.map((v) => `
            <line x1="${x0}" y1="${y(v)}" x2="${L}" y2="${y(v)}" stroke="${v ? '#eef1ef' : '#cfd6d2'}"></line>
            <text x="${x0 - 8}" y="${y(v) + 4}" font-size="11" fill="#5f6b64" text-anchor="end">${v}</text>`).join('')}
          ${grupos.map((g, i) => {
            const centro = x0 + fatia * i + fatia / 2;
            const ha = area(g);
            const n = g.itens.length;
            return `
              <rect x="${centro - largura / 2}" y="${y(ha)}" width="${largura}" height="${base - y(ha)}" rx="4" fill="#2f7d57">
                <title>${esc(g.dec.longo)}: ${n} ${n === 1 ? 'talhão' : 'talhões'} · ${ha} ha</title></rect>
              <text x="${centro}" y="${y(ha) - 7}" font-size="13" font-weight="600" fill="#1a1f1c" text-anchor="middle">${ha} ha</text>
              <text x="${centro}" y="${base + 18}" font-size="12" fill="#1a1f1c" text-anchor="middle">${esc(g.dec.curto)}</text>`;
          }).join('')}
        </svg>
      </figure>`;
  }

  // ----- Visão Mapa: talhões coloridos pela variedade sobre imagem de satélite (Esri, sem chave) -----
  // O mapa abre centrado no centróide dos talhões unidos. Clicar num talhão da fazenda abre o painel dele.
  const SATELITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  // Cores das variedades: paleta categórica validada (ordem fixa; a cor segue a variedade, não a posição)
  const CORES_VARIEDADE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
  const COR_NAO_PLANEJADO = '#d9dedb';
  const M_POR_GRAU = 111320;
  const geometriaCache = {};
  let mapa = null; // instância do Leaflet (recriada a cada desenho da tela)
  let mexeuNoMapa = false; // a pessoa arrastou ou deu zoom

  function corVariedade(nome) {
    const i = variedadesDaCultura().findIndex((v) => v.nome === nome);
    return i >= 0 && i < CORES_VARIEDADE.length ? CORES_VARIEDADE[i] : '#6b7c8f';
  }

  // Polígonos dos talhões da fazenda, gerados a partir das áreas (DADOS.geometriaFazendas):
  // talhões em linhas, com carreadores entre eles, girados e levemente inclinados (a área não muda).
  function poligonosFazenda(fazenda) {
    if (geometriaCache[fazenda]) return geometriaCache[fazenda];
    const g = (DADOS.geometriaFazendas || {})[fazenda];
    const talhoes = DADOS.talhoes[fazenda] || [];
    if (!g) return (geometriaCache[fazenda] = []);
    const [lat0, lng0] = g.origem;
    const mPorGrauLng = M_POR_GRAU * Math.cos((lat0 * Math.PI) / 180);
    const giro = (g.giro * Math.PI) / 180;
    const D = g.profundidade; const carreador = 25;
    const latLng = (x, y) => {
      const xr = x * Math.cos(giro) - y * Math.sin(giro);
      const yr = x * Math.sin(giro) + y * Math.cos(giro);
      return [lat0 + yr / M_POR_GRAU, lng0 + xr / mPorGrauLng];
    };
    const lista = [];
    g.linhas.forEach((linha, i) => {
      let x = 0;
      const y = -i * (D + carreador);
      const desvio = (g.inclinacao || 0) * D;
      linha.forEach((nome) => {
        const t = talhoes.find((tt) => tt.nome === nome);
        if (!t) return;
        const largura = (t.area * 10000) / D;
        lista.push({
          talhao: nome, area: t.area,
          coords: [[x, y], [x + largura, y], [x + largura + desvio, y - D], [x + desvio, y - D]].map(([a, b]) => latLng(a, b)),
          centro: latLng(x + largura / 2 + desvio / 2, y - D / 2)
        });
        x += largura + carreador;
      });
    });
    return (geometriaCache[fazenda] = lista);
  }

  // O plano de safra é por fazenda: o mapa mostra os talhões da fazenda do plano
  function fazendasDoMapa(op) {
    return [{ fazenda: plano.fazenda, plantio: op.plantio, propria: true }];
  }

  // Legenda do mapa: variedades da fazenda com a área total de cada uma (maior primeiro) e os não planejados
  function legendaMapa(op) {
    const totais = {};
    let naoPlanejado = 0;
    talhoesFazenda.forEach((t) => {
      const v = op.plantio[t.nome] && op.plantio[t.nome].variedade;
      if (v) totais[v] = (totais[v] || 0) + t.area; else naoPlanejado += t.area;
    });
    const itens = Object.entries(totais).sort((a, b) => b[1] - a[1]).map(([v, ha]) => `
      <li><span class="mapa-legenda__cor" style="background: ${corVariedade(v)}"></span>${esc(v)} <strong>${Util.area(ha)}</strong></li>`).join('')
      + (naoPlanejado ? `<li><span class="mapa-legenda__cor" style="background: ${COR_NAO_PLANEJADO}"></span>Não planejado <strong>${Util.area(naoPlanejado)}</strong></li>` : '');
    return `<ul class="mapa-legenda" aria-label="Legenda: variedades e área total">${itens}</ul>`;
  }

  // Mapa ocupando o espaço livre do cartão
  function visaoMapa() {
    const semGeometria = !poligonosFazenda(plano.fazenda).length;
    return `
      <div class="mapa-area">
        ${semGeometria ? `<p class="mapa__sem">${Icones.info} A Fazenda ${esc(plano.fazenda)} ainda não tem o desenho dos talhões.</p>`
          : `<div id="mapa-variedades" class="mapa" role="region" aria-label="Mapa de variedades por talhão"></div>
             <p class="mapa__dica">${Icones.info} Clique num talhão para definir a variedade</p>`}
      </div>`;
  }

  // Antes de redesenhar: guarda o enquadramento e desmonta o mapa (o HTML da tela é refeito)
  function desmontarMapa() {
    if (!mapa) return;
    ui.mapaVista = { plano: plano.id, centro: mapa.getCenter(), zoom: mapa.getZoom(), mexeu: mexeuNoMapa };
    mapa.remove();
    mapa = null;
  }

  // Depois de redesenhar: monta o mapa, se a visão Mapa estiver na tela
  function montarMapa() {
    const el = raiz.querySelector('#mapa-variedades');
    if (!el) return;
    if (!window.L) {
      el.innerHTML = `<p class="mapa__sem">${Icones.info} Mapa indisponível: sem conexão com a internet.</p>`;
      return;
    }
    const op = opAtual();
    mapa = L.map(el, { zoomControl: true });
    L.tileLayer(SATELITE, { maxZoom: 18, attribution: 'Imagens © Esri, Maxar, Earthstar Geographics' }).addTo(mapa);
    const pontos = [];
    let soma = 0; let sLat = 0; let sLng = 0;
    fazendasDoMapa(op).forEach(({ fazenda, plantio, propria }) => {
      poligonosFazenda(fazenda).forEach((pg) => {
        const p = plantio[pg.talhao];
        const v = p && p.variedade;
        const aberto = propria && ui.painelTalhao === pg.talhao;
        const poligono = L.polygon(pg.coords, {
          color: aberto ? '#ffd400' : '#ffffff', weight: aberto ? 4 : 1.5,
          fillColor: v ? corVariedade(v) : COR_NAO_PLANEJADO, fillOpacity: v ? 0.75 : 0.45
        }).addTo(mapa);
        // Ao passar o mouse: talhão, variedade e área (a cor nunca é a única pista)
        poligono.bindTooltip(`<strong>${esc(propria ? pg.talhao : `${fazenda} · ${pg.talhao}`)}</strong> · ${esc(v || 'Não planejado')} · ${Util.area(pg.area)}`,
          { sticky: true, direction: 'top', className: 'mapa-detalhe' });
        // Nome fixo no meio do talhão, pequeno
        L.marker(pg.centro, { interactive: false, keyboard: false,
          icon: L.divIcon({ className: 'mapa-rotulo', html: esc(pg.talhao), iconSize: null }) }).addTo(mapa);
        if (propria) poligono.on('click', () => abrirPainel(pg.talhao));
        pontos.push(...pg.coords);
        soma += pg.area; sLat += pg.centro[0] * pg.area; sLng += pg.centro[1] * pg.area;
      });
    });
    if (!soma) return;
    // Centro no centróide dos talhões unidos (média pela área), com o zoom que mostra todos
    const centro = [sLat / soma, sLng / soma];
    const v = ui.mapaVista;
    if (v && v.plano === plano.id && v.mexeu) mapa.setView(v.centro, v.zoom);
    else mapa.setView(centro, Math.min(16, mapa.getBoundsZoom(L.latLngBounds(pontos), false, L.point(30, 30))));
    // A partir daqui, arrastar ou dar zoom conta como "a pessoa mexeu" (o enquadramento é mantido ao redesenhar)
    mexeuNoMapa = !!(v && v.plano === plano.id && v.mexeu);
    mapa.on('dragstart zoomstart', () => { mexeuNoMapa = true; });
  }

  // ----- Ações do painel do talhão -----
  function abrirPainel(talhao) {
    ui.painelTalhao = talhao; ui.prePainel = null; ui.erroPrePainel = null; ui.dataPainel = null;
    ui.dicaPlantioVista = true;
    desenharMantendoFoco('.painel-talhao__titulo');
    mostrarLinhaAberta();
  }

  // A linha do talhão aberto no painel fica à vista na tabela (rola só o necessário)
  function mostrarLinhaAberta() {
    const linha = raiz.querySelector('.tabela-variedade tr.linha--aberta');
    const rolagem = raiz.querySelector('.tabela-variedade')?.closest('.talhoes-rolagem');
    if (!linha || !rolagem || !rolagem.getBoundingClientRect) return;
    const cabecalho = rolagem.querySelector('thead')?.getBoundingClientRect().height || 0;
    const r = rolagem.getBoundingClientRect();
    const l = linha.getBoundingClientRect();
    if (l.top < r.top + cabecalho) rolagem.scrollTop -= r.top + cabecalho - l.top;
    else if (l.bottom > r.bottom) rolagem.scrollTop += l.bottom - r.bottom;
  }

  function passarPainel(op, sentido) {
    const lista = talhoesVisiveisPlantio(op);
    const i = lista.findIndex((t) => t.nome === ui.painelTalhao);
    const alvo = lista[i + sentido];
    if (!alvo) return;
    ui.painelTalhao = alvo.nome; ui.prePainel = null; ui.erroPrePainel = null; ui.dataPainel = null;
    desenharMantendoFoco(`[data-acao="${sentido < 0 ? 'painel-anterior' : 'painel-proximo'}"]:not([disabled]), [data-acao="fechar-painel"]`);
    mostrarLinhaAberta();
  }

  function fecharPainel() {
    const t = ui.painelTalhao;
    ui.painelTalhao = null; ui.prePainel = null; ui.erroPrePainel = null; ui.dataPainel = null;
    desenharMantendoFoco(`[data-acao="abrir-painel"][data-talhao="${t}"]`);
  }

  // Muda variedade, data ou população do talhão do painel (vale na hora)
  function alterarPlantioPainel(op, campo, valor) {
    const t = ui.painelTalhao;
    const p = { ...(op.plantio[t] || { variedade: '', data: '' }), [campo]: valor };
    if (!p.populacao) delete p.populacao;
    if (!p.variedade && !p.data) delete op.plantio[t]; else op.plantio[t] = p;
    alterou();
    desenharMantendoFoco(campo === 'data' ? '#pt-data' : campo === 'populacao' ? '#pt-populacao' : '#pt-variedade');
  }

  // Ciclo da variedade informado no painel: vai para o cadastro (pré-cadastro do ciclo) e vale para todos os talhões
  function salvarCiclo(valor) {
    const op = opAtual();
    const p = op && op.plantio[ui.painelTalhao];
    const v = p ? variedadeDoCadastro(p.variedade) : null;
    const n = Util.numero(valor);
    if (!v || !n || n <= 0) return;
    v.ciclo = Math.round(n);
    alterou(); desenharMantendoFoco('#pt-data');
    Aviso.mostrar(`Ciclo de ${esc(v.nome)}: ${v.ciclo} dias`);
  }

  // Pré-cadastro de variedade (nome; cultura do plano), no painel ou no modal
  function preCadastrarVariedade(nome) {
    const limpo = (nome || '').trim();
    if (!limpo) return { erro: 'Informe o nome da variedade.' };
    if (variedadesDaCultura().some((x) => Util.normalizar(x.nome) === Util.normalizar(limpo))) {
      return { erro: 'Essa variedade já está no cadastro. Escolha na lista.' };
    }
    DADOS.variedades.push({ cultura: plano.cultura, nome: limpo, gm: null, ciclo: null, populacao: null, janela: null, preCadastro: true });
    Aviso.mostrar(`Pré-cadastro da variedade "${esc(limpo)}" salvo`);
    return { nome: limpo };
  }

  function salvarPrePainel() {
    const r = preCadastrarVariedade(ui.prePainel);
    if (r.erro) { ui.erroPrePainel = r.erro; desenharMantendoFoco('[data-campo="pt-pre"]'); return; }
    ui.prePainel = null; ui.erroPrePainel = null;
    alterarPlantioPainel(opAtual(), 'variedade', r.nome);
  }

  // ----- Modal "Definir plantio" (variedade, data de plantio e população dos talhões marcados) -----
  function abrirPlantio(op) {
    const talhoes = talhoesFazenda.filter((t) => ui.marcados.has(t.nome)).map((t) => t.nome);
    if (!talhoes.length) return;
    // Talhões marcados com a mesma variedade ou a mesma data: o modal já vem com elas
    const atuais = talhoes.map((t) => op.plantio[t] || {});
    const igual = (campo) => (atuais.every((p) => p[campo] && p[campo] === atuais[0][campo]) ? atuais[0][campo] : '');
    const populacao = igual('populacao');
    ui.plantando = { talhoes, variedade: igual('variedade'), data: igual('data'), populacao: populacao ? numeroTexto(populacao) : '',
                     preVariedade: null, erros: {} };
    desenharMantendoFoco('.definir');
  }

  function fecharPlantio() {
    ui.plantando = null;
    desenharMantendoFoco('[data-acao="definir-plantio"]');
  }

  function modalPlantio(op) {
    const pl = ui.plantando;
    const n = pl.talhoes.length;
    const area = talhoesFazenda.filter((t) => pl.talhoes.includes(t.nome)).reduce((s, t) => s + t.area, 0);
    const v = variedadeDoCadastro(pl.variedade);
    const erro = (campo) => (pl.erros[campo] ? `<p class="erro-campo">${pl.erros[campo]}</p>` : '');
    const classeErro = (campo) => (pl.erros[campo] ? 'campo__controle--erro' : '');
    const variedade = pl.preVariedade !== null ? `
        <div class="plantio__pre">
          <p class="pre-cadastro__titulo">Pré-cadastro de variedade <span class="pre-cadastro__ajuda">· Cultura ${esc(plano.cultura)}. Informe o nome da variedade.</span></p>
          <div class="plantio__pre-linha">
            <input class="campo__controle ${classeErro('preVariedade')}" data-campo="pl-pre" value="${esc(pl.preVariedade)}"
                   placeholder="Nome da variedade" aria-label="Nome da variedade" autocomplete="off">
            <button class="botao botao--secundario botao--p" type="button" data-acao="pl-pre-cancelar">Cancelar</button>
            <button class="botao botao--secundario botao--p pre-cadastro__salvar" type="button" data-acao="pl-pre-salvar">Salvar pré-cadastro</button>
          </div>
          ${erro('preVariedade')}
        </div>` : `
        <select class="campo__controle ${classeErro('variedade')}" id="pl-variedade" data-campo="pl-variedade">
          <option value="" ${pl.variedade ? '' : 'selected'} disabled>Selecione a variedade</option>
          ${variedadesDaCultura().map((x) => `<option value="${esc(x.nome)}" ${x.nome === pl.variedade ? 'selected' : ''}>${esc(rotuloVariedade(x))}</option>`).join('')}
          <option value="__pre__">+ Pré-cadastrar variedade</option>
        </select>
        ${erro('variedade')}`;
    return `
      <div class="definir-fundo">
        <div class="definir definir--estreito" role="dialog" aria-modal="true" aria-labelledby="plantio-titulo" tabindex="-1">
          <div class="definir__topo">
            <div class="definir__titulos">
              <h2 class="definir__titulo" id="plantio-titulo">Definir plantio</h2>
              <p class="definir__op">${esc(op.nome)} · DAP ${op.dap ?? '—'} · Cultura ${esc(plano.cultura)}</p>
              <p class="definir__alvo">${n} ${n === 1 ? 'talhão' : 'talhões'} · ${Util.area(area)}</p>
            </div>
            <button class="botao-icone" type="button" data-acao="pl-fechar" aria-label="Fechar">${Icones.fechar}</button>
          </div>
          <div class="definir__corpo">
            <div class="campo">
              <label class="campo__rotulo" for="pl-variedade">Variedade *</label>
              ${variedade}
            </div>
            <div class="plantio__datas">
              <div class="campo">
                <label class="campo__rotulo" for="pl-data">Data de plantio *</label>
                ${campoData('pl-data', 'pl-data', pl.data, pl.dataTexto, pl.erros.data)}
                ${v && v.janela ? `<p class="campo__ajuda">Janela recomendada: ${esc(janelaTexto(v))}</p>` : ''}
                ${foraDaJanela(v, pl.data) ? `<p class="aviso-janela-texto">${Icones.alerta} Fora da janela recomendada</p>` : ''}
              </div>
              <div class="campo">
                <label class="campo__rotulo" for="pl-populacao">População (mil plantas/ha)</label>
                <input class="campo__controle populacao__campo ${classeErro('populacao')}" id="pl-populacao" data-campo="pl-populacao" type="text"
                       inputmode="decimal" autocomplete="off" placeholder="Ex.: 280" value="${esc(pl.populacao || '')}">
                ${erro('populacao')}
                ${v && v.populacao ? `<p class="campo__ajuda">População recomendada: ${faixaPopulacao(v)} mil plantas/ha</p>` : ''}
                <div class="plantio__aviso-populacao" aria-live="polite">${avisoPopulacaoPlantio(v, Util.numero(pl.populacao || ''))}</div>
              </div>
            </div>
          </div>
          <div class="definir__rodape">
            <button class="botao botao--secundario" type="button" data-acao="pl-fechar">Cancelar</button>
            <button class="botao botao--primario" type="button" data-acao="pl-aplicar">Aplicar em ${n} ${n === 1 ? 'talhão' : 'talhões'}</button>
          </div>
        </div>
      </div>`;
  }

  // Variedade e data obrigatórias; data fora da janela só avisa
  function aplicarPlantio(op) {
    const pl = ui.plantando;
    pl.erros = {};
    if (pl.preVariedade !== null) pl.erros.preVariedade = 'Pré-cadastro não finalizado. Salve ou cancele antes de aplicar.';
    else if (!pl.variedade) pl.erros.variedade = 'Escolha a variedade.';
    if (!pl.data) pl.erros.data = 'Informe a data de plantio.';
    // População é opcional aqui (pode ficar para depois); em branco, a que o talhão já tinha fica
    const populacao = (pl.populacao || '').trim() ? Util.numero(pl.populacao) : null;
    if ((pl.populacao || '').trim() && !(populacao > 0)) pl.erros.populacao = 'Informe um número maior que zero.';
    if (Object.keys(pl.erros).length) { desenharTudo(); return; }
    pl.talhoes.forEach((t) => {
      op.plantio[t] = { ...(op.plantio[t] || {}), variedade: pl.variedade, data: pl.data, ...(populacao ? { populacao } : {}) };
    });
    const n = pl.talhoes.length;
    ui.plantando = null;
    ui.dicaPlantioVista = true;
    ui.filtroTalhoes = 'todos';
    limparSelecao(); alterou(); desenharTudo();
    const rolagem = raiz.querySelector('.talhoes-rolagem');
    if (rolagem) rolagem.scrollTop = 0;
    Aviso.mostrar(`${esc(pl.variedade)} em ${n} ${n === 1 ? 'talhão' : 'talhões'} · plantio em ${dataCompleta(pl.data)}${populacao ? ` · ${numeroTexto(populacao)} mil plantas/ha` : ''}`);
  }

  function salvarPreVariedade() {
    const pl = ui.plantando;
    const r = preCadastrarVariedade(pl.preVariedade);
    if (r.erro) { pl.erros = { preVariedade: r.erro }; desenharTudo(); return; }
    pl.variedade = r.nome; pl.preVariedade = null; pl.erros = {};
    desenharTudo();
  }

  function temPlantio(op, talhao) {
    const p = op.plantio[talhao];
    return !!(p && (p.variedade || p.data));
  }

  function excluirPlantio(op) {
    const alvo = talhoesFazenda.map((t) => t.nome).filter((t) => ui.marcados.has(t) && temPlantio(op, t));
    const n = alvo.length;
    if (!n) return;
    Modal.confirmar({
      titulo: `Excluir o plantio de ${n} ${n === 1 ? 'talhão' : 'talhões'}?`,
      texto: `Variedade, data de plantio, população e TSI ${n === 1 ? 'desse talhão serão apagadas' : 'desses talhões serão apagadas'}. Essa ação não pode ser desfeita.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir plantio', classe: 'perigo', acao: () => {
        alvo.forEach((t) => { delete op.plantio[t]; delete op.talhoes[t]; });
        op.receitas = op.receitas.filter((r) => Planos.talhoesDaReceita(op, r).length);
        ui.filtroTalhoes = 'todos';
        limparSelecao(); alterou(); desenharTudo();
        Aviso.mostrar(`Plantio excluído de ${n} ${n === 1 ? 'talhão' : 'talhões'}`);
      } }]
    });
  }

  // ----- População de plantas e sementes -----
  // Total de sementes = população planejada × área ÷ germinação; bags = sementes ÷ 5 milhões (soja)
  const SEMENTES_POR_BAG = 5000000;

  function variedadeTalhao(op, talhao) {
    const p = op.plantio[talhao];
    return (p && p.variedade) || '';
  }

  function populacaoDe(op, talhao) {
    const p = op.plantio[talhao];
    return p && p.populacao ? p.populacao : null;
  }

  // Sem população ou sem germinação: null ("—")
  function sementesDe(op, t) {
    const pop = populacaoDe(op, t.nome);
    return pop && op.germinacao ? pop * 1000 * t.area / (op.germinacao / 100) : null;
  }

  function numeroTexto(n) {
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  }
  const milhoes = (sementes) => `${umaCasa(sementes / 1e6)} mi`;
  const bags = (sementes) => umaCasa(sementes / SEMENTES_POR_BAG);

  function faixaPopulacao(v) {
    return v && v.populacao ? `${v.populacao[0]} – ${v.populacao[1]}` : null;
  }
  function foraDaFaixa(v, pop) {
    return !!(v && v.populacao && pop && (pop < v.populacao[0] || pop > v.populacao[1]));
  }

  // Só números e uma vírgula decimal; o ponto digitado vira vírgula
  function soNumero(el) {
    let v = el.value.replace(/\./g, ',').replace(/[^\d,]/g, '');
    const virgula = v.indexOf(',');
    if (virgula >= 0) v = v.slice(0, virgula + 1) + v.slice(virgula + 1).replace(/,/g, '');
    if (v !== el.value) el.value = v;
    return v;
  }

  // Germinação média do plano (linha de Total da tabela): um valor só para todos os talhões
  function campoGerminacao(op) {
    if (somenteLeitura) {
      return `<span class="germinacao"><span class="germinacao__rotulo">Germinação média</span>
                <strong>${op.germinacao ? `${numeroTexto(op.germinacao)}%` : '—'}</strong></span>`;
    }
    const erro = ui.erroGerminacao;
    return `
      <span class="germinacao">
        <label class="germinacao__rotulo" for="germinacao">Germinação média</label>
        <input class="campo__controle germinacao__campo ${erro ? 'campo__controle--erro' : ''}" id="germinacao" data-campo="germinacao"
               type="text" inputmode="decimal" autocomplete="off" placeholder="—"
               value="${esc(erro ? erro.texto : op.germinacao ? numeroTexto(op.germinacao) : '')}"
               ${erro ? 'aria-invalid="true" aria-describedby="germinacao-erro"' : ''}>
        <span>%</span>
        ${erro ? '<span class="erro-campo germinacao__erro" id="germinacao-erro">Informe de 1 a 100.</span>' : ''}
      </span>`;
  }

  function salvarGerminacao(op, texto) {
    const n = Util.numero(texto);
    if (texto.trim() && (n === null || n <= 0 || n > 100)) {
      ui.erroGerminacao = { texto };
      desenharMantendoFoco('#germinacao'); return;
    }
    ui.erroGerminacao = null;
    const antes = op.germinacao;
    op.germinacao = texto.trim() ? n : null;
    if (op.germinacao !== antes) alterou();
    desenharTudo();
  }

  // Modal "Definir plantio": aviso (sem bloquear) quando a população fica fora da recomendada
  function avisoPopulacaoPlantio(v, valor) {
    return foraDaFaixa(v, valor) ? `<p class="aviso-janela-texto">${Icones.alerta} Fora da recomendada para ${esc(v.nome)}</p>` : '';
  }

  function digitarPopulacaoPlantio(el) {
    const pl = ui.plantando;
    pl.populacao = soNumero(el);
    const valor = Util.numero(pl.populacao);
    raiz.querySelector('.plantio__aviso-populacao').innerHTML = avisoPopulacaoPlantio(variedadeDoCadastro(pl.variedade), valor);
  }

  // Recomendação nova: "Copiar produtos de" traz os produtos e doses padrão de outra recomendação
  // da mesma operação, como ponto de partida (dá para adicionar, remover e mudar a dose antes de aplicar)
  function campoCopiar(op, r) {
    const origens = op.receitas.filter((x) => x !== r && x.produtos.some(Planos.linhaPreenchida));
    if (!origens.length) return '';
    return `
      <div class="campo definir__copiar">
        <label class="campo__rotulo" for="rec-copiar">Copiar produtos de</label>
        <select class="campo__controle" id="rec-copiar" data-campo="copiar-de">
          <option value="">Escolha uma ${T().nome}</option>
          ${origens.map((x) => {
            // "Rec 1 (Fox Xpro, Engeo Pleno S, Nimbus + 2)": até 3 nomes comerciais, o resto resumido
            const nomes = x.produtos.filter(Planos.linhaPreenchida).map(Planos.nomeLinha);
            const lista = nomes.slice(0, 3).join(', ') + (nomes.length > 3 ? ` + ${nomes.length - 3}` : '');
            return `<option value="${x.id}" ${ui.copiadoDe === x.id ? 'selected' : ''}>${esc(nomeCurto(x))} (${esc(lista)})</option>`;
          }).join('')}
        </select>
      </div>`;
  }

  // Troca os produtos da recomendação em edição pelos da recomendação escolhida (cópia, com ids novos)
  function copiarProdutos(op, id) {
    const origem = op.receitas.find((x) => x.id === id);
    if (!origem) return;
    ui.copiadoDe = id; ui.validarOp = null; ui.preCadastro = null; ui.naoEncontrado = {};
    rascunho(op).produtos = origem.produtos.filter(Planos.linhaPreenchida).map((l) => Planos.novaLinha({
      principioAtivo: l.principioAtivo, produto: l.produto, unidade: l.unidade, dose: l.dose, preCadastro: l.preCadastro }));
    desenharMantendoFoco('#rec-copiar');
    Aviso.mostrar(`Produtos de ${esc(nomeCurto(origem))} copiados`);
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
    const cadastro = cadastroAtual();
    let opcoes;
    if (tipo === 'pa') {
      // Princípios ativos do cadastro (sem repetir)
      const pas = [...new Set(cadastro.map((d) => d.principioAtivo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      opcoes = pas.filter(bate).map((pa) => ({ valor: pa, rotulo: esc(pa),
        pre: cadastro.some((d) => d.principioAtivo === pa && d.preCadastro && !d.produto) }));
    } else {
      // Produtos do cadastro. Com princípio ativo escolhido e ainda sem produto, só os que têm ele.
      // Trocando um produto já escolhido (o princípio ativo veio dele), mostra todos, com os do mesmo
      // princípio ativo primeiro; escolher outro produto atualiza o princípio ativo.
      const trocando = !!linha.produto;
      const mesmoPA = (d) => !!linha.principioAtivo && d.principioAtivo === linha.principioAtivo;
      opcoes = cadastro
        .filter((d) => d.produto && (trocando || !linha.principioAtivo || mesmoPA(d)) && bate(d.produto))
        .sort((a, b) => (trocando ? Number(mesmoPA(b)) - Number(mesmoPA(a)) : 0))
        .map((d) => ({ valor: d.produto, rotulo: `${esc(d.produto)}<span class="combo__sub">${esc(d.garantia || d.principioAtivo || '—')} · ${d.unidade}</span>`, pre: d.preCadastro }));
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
    delete ui.naoEncontrado[`${linha.id}:pa`]; delete ui.naoEncontrado[`${linha.id}:produto`];
    const valor = opcaoEl.dataset.valor;
    if (opcaoEl.hasAttribute('data-pre-cadastrar')) {
      // Pelo princípio ativo, o texto vai para o Princípio ativo; o produto comercial continua obrigatório
      ui.preCadastro = tipo === 'pa'
        ? { linhaId: linha.id, produto: '', principioAtivo: valor, unidade: '', erros: {}, aviso: '' }
        : { linhaId: linha.id, produto: valor, principioAtivo: linha.principioAtivo || '', unidade: '', erros: {}, aviso: '' };
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
    if (etapa === 'calendario' && Telas.calendario.aoClicar(e, ctxCalendario(), acoesCalendario)) return;
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    const op = opAtual();
    const grupo = grupoAtual();

    switch (acao) {
      case 'alternar-lista':
        ui.listaRecolhidaPorGrupo[grupo.id] = !listaRecolhida(); desenharTudo(); break;

      case 'abrir-op': {
        const id = alvo.dataset.op;
        // Dois cliques seguidos no nome = renomear (como nas guias). Feito à mão porque
        // o primeiro clique redesenha a lista e o dblclick do navegador se perderia.
        const agora = Date.now();
        const duplo = ultimoCliqueOp.id === id && agora - ultimoCliqueOp.quando < 450;
        ultimoCliqueOp = { id, quando: agora };
        if (duplo && !somenteLeitura && !listaRecolhida()) { renomearNaLista(id); break; }
        if (op && op.id === id) break;
        sairDaReceita(() => {
          ui.opPorGrupo[grupo.id] = id; ui.renomeandoOp = null;
          limparSelecao(); desenharTudo();
        });
        break;
      }

      // Botões anterior/próxima do cabeçalho: abre a operação (sem o duplo clique de renomear da lista)
      case 'navegar-op':
        sairDaReceita(() => {
          ui.opPorGrupo[grupo.id] = alvo.dataset.op; ui.renomeandoOp = null;
          limparSelecao(); desenharMantendoFoco('.op-navegar');
        });
        break;

      case 'nova-op': sairDaReceita(() => criarOperacao(grupo)); break;

      case 'exportar-plano': ArquivoPlano.exportar(plano); break;

      case 'alternar-status':
        sairDaReceita(() => {
          plano.status = somenteLeitura ? 'Em construção' : 'Aprovado';
          somenteLeitura = plano.status === 'Aprovado';
          ui.renomeandoOp = null; ui.renomeandoGrupo = null;
          limparSelecao(); pararRenomearNaLista();
          desenharMantendoFoco('[data-acao="alternar-status"]');
        }, { removerVazia: false });
        break;

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
        (ehSemente(grupo) && !ehTsi() ? talhoesVisiveisPlantio(op) : talhoesVisiveis(op).filter((t) => marcavel(op, t)))
          .forEach((t) => { if (alvo.checked) ui.marcados.add(t.nome); else ui.marcados.delete(t.nome); });
        desenharMantendoFoco('[data-acao="marcar-todos"]'); break;

      case 'excluir-marcados': excluirDosMarcados(op); break;

      case 'definir-plantio': abrirPlantio(op); break;
      case 'pl-fechar': fecharPlantio(); break;
      case 'pl-aplicar': aplicarPlantio(op); break;
      case 'pl-pre-cancelar': ui.plantando.preVariedade = null; ui.plantando.erros = {}; desenharTudo(); break;
      case 'pl-pre-salvar': salvarPreVariedade(); break;
      case 'excluir-plantio': excluirPlantio(op); break;

      case 'passo-semente':
        ui.passoSemente = alvo.dataset.passo; ui.marcados = new Set(); ui.filtroTalhoes = 'todos'; ui.quadroAberto = false;
        desenharMantendoFoco(`[data-passo="${alvo.dataset.passo}"]`); break;
      case 'visao-semente':
        ui.visaoSemente = alvo.dataset.visao; ui.marcados = new Set();
        desenharMantendoFoco(`[data-visao="${alvo.dataset.visao}"]`); break;
      case 'abrir-painel': abrirPainel(alvo.dataset.talhao); break;
      case 'abrir-calendario': {
        const nativo = alvo.parentElement.querySelector('.campo-data__nativo');
        try { nativo.showPicker(); } catch (erro) { nativo.focus(); nativo.click(); }
        break;
      }
      case 'fechar-dica': ui.dicaPlantioVista = true; desenharMantendoFoco('[data-acao="marcar-todos"]'); break;
      case 'abrir-primeiro': {
        const primeiro = talhoesVisiveisPlantio(op)[0];
        if (primeiro) abrirPainel(primeiro.nome);
        break;
      }
      case 'painel-anterior': passarPainel(op, -1); break;
      case 'painel-proximo': passarPainel(op, 1); break;
      case 'fechar-painel': fecharPainel(); break;
      case 'expandir-painel':
        ui.painelExpandido = !ui.painelExpandido; desenharMantendoFoco('[data-acao="expandir-painel"]'); break;
      case 'pt-pre-cancelar': ui.prePainel = null; ui.erroPrePainel = null; desenharMantendoFoco('#pt-variedade'); break;
      case 'pt-pre-salvar': salvarPrePainel(); break;
      case 'ordenar-semente': {
        const c = alvo.dataset.coluna;
        const atual = ui.ordemSemente;
        ui.ordemSemente = { coluna: c, sentido: atual && atual.coluna === c && atual.sentido === 'asc' ? 'desc' : 'asc' };
        desenharMantendoFoco(`[data-coluna="${c}"]`); break;
      }

      case 'limpar-selecao':
        ui.marcados = new Set(); desenharMantendoFoco('[data-acao="marcar-todos"]'); break;

      case 'definir-recomendacao': abrirDefinir(op); break;
      case 'editar-rec': abrirEditar(op, alvo.dataset.rec); break;
      // Pelo "Editar" (a recomendação inteira): exclui a recomendação. Pelo "Definir recomendação"
      // (talhões marcados): tira a recomendação só desses talhões.
      case 'excluir-rec':
        if (ui.definindo && ui.definindo.editando) excluirReceita(op, receitaAtual(op));
        else excluirDosTalhoes(op, receitaAtual(op), ui.definindo ? ui.definindo.talhoes : []);
        break;
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
    if (etapa === 'calendario' && Telas.calendario.aoMudar(e, ctxCalendario(), acoesCalendario)) return;
    const campo = e.target.dataset.campo;
    const op = opAtual();
    if (campo === 'pl-variedade') {
      const pl = ui.plantando;
      if (e.target.value === '__pre__') { pl.preVariedade = ''; pl.variedade = ''; } else { pl.variedade = e.target.value; }
      delete pl.erros.variedade; desenharTudo(); return;
    }
    // Data escolhida no calendário (já vem como AAAA-MM-DD)
    if (campo === 'pl-data-cal') {
      const pl = ui.plantando;
      pl.data = e.target.value; pl.dataTexto = null; delete pl.erros.data;
      desenharMantendoFoco('#pl-data'); return;
    }
    if (campo === 'pt-data-cal') { ui.dataPainel = null; alterarPlantioPainel(op, 'data', e.target.value); return; }
    if (campo === 'pl-data') {
      const pl = ui.plantando;
      const iso = dataDeTexto(e.target.value);
      pl.dataTexto = null; delete pl.erros.data;
      if (e.target.value.trim() && !iso) { pl.dataTexto = e.target.value; pl.erros.data = 'Data inválida. Use dd/mm/aaaa.'; }
      pl.data = iso || '';
      desenharMantendoFoco('#pl-data'); return;
    }
    if (campo === 'pt-variedade') {
      if (e.target.value === '__pre__') { ui.prePainel = ''; ui.erroPrePainel = null; desenharTudo(); return; }
      alterarPlantioPainel(op, 'variedade', e.target.value); return;
    }
    if (campo === 'pt-data') {
      const iso = dataDeTexto(e.target.value);
      if (e.target.value.trim() && !iso) { ui.dataPainel = { talhao: ui.painelTalhao, texto: e.target.value }; desenharMantendoFoco('#pt-data'); return; }
      ui.dataPainel = null;
      alterarPlantioPainel(op, 'data', iso || ''); return;
    }
    if (campo === 'pt-ciclo') { salvarCiclo(e.target.value); return; }
    if (campo === 'germinacao') { salvarGerminacao(op, e.target.value); return; }
    if (campo === 'pt-populacao') {
      const n = Util.numero(e.target.value);
      alterarPlantioPainel(op, 'populacao', n && n > 0 ? n : null); return;
    }
    if (campo === 'op-dap') {
      const n = Util.numero(e.target.value);
      // DAP é obrigatório: apagar não vale, o campo volta ao valor anterior
      if (n === null && op.dap !== null && op.dap !== undefined) {
        e.target.value = op.dap; Aviso.mostrar('Toda operação precisa de DAP'); return;
      }
      op.dap = n === null ? null : Math.round(n);
      if (op.dap !== null && op.dap <= 0) op.fenologia = ''; // pré-plantio e plantio: fenologia fixa (não se escolhe)
      // A lista se reordena pelo DAP: a operação continua aberta (sem isso, abriria a nova primeira da lista)
      ui.opPorGrupo[grupoAtual().id] = op.id;
      alterou(); desenharTudo();
    } else if (campo === 'copiar-de') {
      if (e.target.value) copiarProdutos(op, e.target.value);
    } else if (campo === 'op-fenologia') {
      op.fenologia = e.target.value; alterou(); desenharTudo();
    } else if (campo === 'linha-dose') {
      // Já registrada ao digitar; sem redesenhar, para o clique em "Aplicar" valer de primeira
      e.target.value = formatarDose(Util.numero(e.target.value));
    } else if (e.target.dataset.pre) {
      registrarPre(e.target);
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
    // Plantio: nome do pré-cadastro de variedade (modal e painel); ciclo só com números
    if (e.target.dataset.campo === 'pt-pre') { ui.prePainel = e.target.value; return; }
    if (e.target.dataset.campo === 'pt-data' || e.target.dataset.campo === 'pl-data') {
      const v = mascaraData(e.target.value);
      if (v !== e.target.value) e.target.value = v;
      return;
    }
    if (e.target.dataset.campo === 'pt-ciclo') {
      const v = e.target.value.replace(/[^\d]/g, '');
      if (v !== e.target.value) e.target.value = v;
      return;
    }
    if (e.target.dataset.campo === 'pl-pre') { ui.plantando.preVariedade = e.target.value; return; }
    // Germinação e população só com números e uma vírgula
    if (e.target.dataset.campo === 'germinacao' || e.target.dataset.campo === 'pt-populacao') { soNumero(e.target); return; }
    if (e.target.dataset.campo === 'pl-populacao') { digitarPopulacaoPlantio(e.target); return; }
    if (e.target.dataset.combo) {
      const linha = linhaDoElemento(e.target);
      if (linha) delete ui.naoEncontrado[`${linha.id}:${e.target.dataset.combo}`];
      abrirCombo(e.target); return;
    }
    if (e.target.dataset.pre) { registrarPre(e.target); return; }
  }

  function aoFocar(e) {
    if (e.target.dataset.combo) { e.target.select(); abrirCombo(e.target); }
  }

  function aoDesfocar(e) {
    const el = e.target;
    if (el.dataset.combo) {
      // Sem escolher uma opção: texto igual a um item do cadastro vale como escolhido;
      // texto que não existe fica no campo, com o erro embaixo
      setTimeout(() => {
        if (!raiz.contains(el) || el === document.activeElement) return;
        el.parentElement.querySelector('.combo__lista').hidden = true;
        el.setAttribute('aria-expanded', 'false');
        const linha = linhaDoElemento(el);
        if (!linha) return;
        const td = el.closest('td');
        td.querySelectorAll('.erro-campo--digitado').forEach((p) => p.remove());
        if (aceitarDigitado(el) === 'nao-encontrado') {
          el.classList.add('campo__controle--erro');
          el.closest('.combo').insertAdjacentHTML('afterend', `<p class="erro-campo erro-campo--digitado">${MSG_NAO_ENCONTRADO}</p>`);
          return;
        }
        el.classList.remove('campo__controle--erro');
        // Com erros na tela (já tentou aplicar), redesenha para limpá-los, mantendo o foco onde a pessoa foi
        if (ui.validarOp) {
          const ativo = document.activeElement;
          const linhaAtiva = ativo && ativo.closest && ativo.closest('[data-linha]');
          const campo = ativo && (ativo.dataset.campo ? `[data-campo="${ativo.dataset.campo}"]` : ativo.dataset.combo ? `[data-combo="${ativo.dataset.combo}"]` : null);
          if (linhaAtiva && campo) desenharMantendoFoco(`[data-linha="${linhaAtiva.dataset.linha}"] ${campo}`); else desenharTudo();
          return;
        }
        // Atualiza a linha sem redesenhar: princípio ativo, produto, unidade e dose
        const tr = el.closest('tr');
        tr.querySelector('[data-combo="pa"]').value = linha.principioAtivo;
        tr.querySelector('[data-combo="produto"]').value = linha.produto;
        tr.querySelector('.tabela-rec__unidade').textContent = Planos.unidadeDose(linha) || '—';
        const dose = tr.querySelector('[data-campo="linha-dose"]');
        if (dose) dose.disabled = !linha.produto;
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
    // Cabeçalho da operação: F2 no nome abre o campo
    if (el.dataset.renomearOp && e.key === 'F2' && !somenteLeitura) {
      e.preventDefault(); ui.renomeandoOp = el.dataset.renomearOp; desenharTudo(); return;
    }
    // Lista de operações: F2 no nome abre o campo; no campo, Enter confirma e Esc desfaz
    if (el.dataset.acao === 'abrir-op' && e.key === 'F2' && !somenteLeitura && !listaRecolhida()) {
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
    // Esc fecha o modal "Definir recomendação" ou "Definir plantio" (os campos acima já tratam o próprio Esc)
    if (e.key === 'Escape' && ui.definindo && el.closest('.definir')) { e.preventDefault(); fecharDefinir(); }
    if (e.key === 'Escape' && ui.plantando && el.closest('.definir')) { e.preventDefault(); fecharPlantio(); }
    if (e.key === 'Enter' && el.dataset.campo === 'pl-populacao') { e.preventDefault(); aplicarPlantio(opAtual()); return; }
    if (e.key === 'Enter' && (el.dataset.campo === 'germinacao' || el.dataset.campo === 'pt-populacao')) { e.preventDefault(); el.blur(); return; }
    // Painel do talhão: Enter no ciclo ou no pré-cadastro salva; Esc fecha o painel
    if (e.key === 'Enter' && el.dataset.campo === 'pt-ciclo') { e.preventDefault(); salvarCiclo(el.value); return; }
    if (e.key === 'Enter' && el.dataset.campo === 'pt-pre') { e.preventDefault(); salvarPrePainel(); return; }
    if (e.key === 'Enter' && (el.dataset.campo === 'pt-data' || el.dataset.campo === 'pl-data')) { e.preventDefault(); el.blur(); return; }
    if (e.key === 'Escape' && ui.painelTalhao && el.closest('.painel-talhao')) { e.preventDefault(); fecharPainel(); }
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
    if (op && valor.trim() && valor.trim() !== op.nome) {
      if (nomeOperacaoRepetido(valor, op)) Aviso.mostrar(NOME_OP_REPETIDO);
      else { op.nome = valor.trim(); alterou(); }
    }
    desenharTudo();
  }

  // Nome de operação não se repete no plano (sem diferenciar maiúsculas e acentos)
  const NOME_OP_REPETIDO = 'Já existe uma operação com esse nome';
  function nomeOperacaoRepetido(nome, exceto = null) {
    const n = Util.normalizar(nome.trim());
    return plano.grupos.some((g) => g.operacoes.some((o) => o !== exceto && Util.normalizar(o.nome) === n));
  }

  // Nome vazio ou repetido volta ao anterior
  function salvarNomeNaLista(valor, { redesenhar = true } = {}) {
    if (!ui.renomeandoNaLista) return;
    const op = grupoAtual().operacoes.find((o) => o.id === ui.renomeandoNaLista);
    pararRenomearNaLista();
    const v = valor.trim();
    if (op && v && v !== op.nome) {
      if (nomeOperacaoRepetido(v, op)) Aviso.mostrar(NOME_OP_REPETIDO);
      else { op.nome = v; alterou(); }
    }
    if (redesenhar) desenharTudo();
  }

  // Nova operação: nome e DAP obrigatórios (modal; "Criar operação" só habilita com os dois preenchidos)
  function criarOperacao(grupo) {
    const modal = Modal.abrir(`
      <form class="formulario" novalidate>
        <div class="modal__corpo">
          <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
          <h2 class="modal__titulo" id="modal-titulo">Nova operação</h2>
          <p class="modal__subtitulo">Grupo ${esc(grupo.nome)}. Toda operação precisa de nome e DAP.</p>
          <div class="campo">
            <label class="campo__rotulo" for="no-nome">Nome *</label>
            <input class="campo__controle" id="no-nome" name="nome" autocomplete="off" required aria-describedby="no-nome-erro">
            <p class="erro-campo" id="no-nome-erro" hidden>${NOME_OP_REPETIDO}</p>
          </div>
          <div class="campo">
            <label class="campo__rotulo" for="no-dap">DAP *</label>
            <input class="campo__controle no-dap" id="no-dap" name="dap" type="text" inputmode="numeric" autocomplete="off"
                   placeholder="Ex.: -15, 0, 40" required>
            <p class="campo__ajuda">Dias após o plantio. Negativo = antes do plantio.</p>
          </div>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
          <button class="botao botao--primario" type="submit" disabled>Criar operação</button>
        </div>
      </form>`, { classe: 'modal--pequeno' });
    const form = modal.elemento.querySelector('form');
    // DAP: só números inteiros, com sinal de menos opcional no início
    const dap = () => (/^-?\d+$/.test(form.elements.dap.value.trim()) ? Number(form.elements.dap.value.trim()) : null);
    form.elements.dap.addEventListener('input', (e) => {
      const v = e.target.value.replace(/[^\d-]/g, '').replace(/(?!^)-/g, '');
      if (v !== e.target.value) e.target.value = v;
    });
    const atualizar = () => {
      const nome = form.elements.nome.value.trim();
      const repetido = !!nome && nomeOperacaoRepetido(nome);
      form.elements.nome.classList.toggle('campo__controle--erro', repetido);
      form.elements.nome.setAttribute('aria-invalid', repetido);
      form.querySelector('#no-nome-erro').hidden = !repetido;
      form.querySelector('[type=submit]').disabled = !(nome && !repetido && dap() !== null);
    };
    form.addEventListener('input', atualizar);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (form.querySelector('[type=submit]').disabled) return;
      const nova = Planos.novaOperacao(form.elements.nome.value.trim(), dap());
      grupo.operacoes.push(nova);
      ui.opPorGrupo[grupo.id] = nova.id;
      modal.fechar(); limparSelecao(); alterou(); desenharTudo();
      Aviso.mostrar(`Operação ${esc(nova.nome)} criada`);
    });
    form.elements.nome.focus();
  }

  // "Copiar" (botão direito na lista): leva recomendações, talhões e doses para uma operação
  // que já existe, que mantém nome, DAP e fenologia. Destino com recomendações: confirma a substituição.
  function copiarParaOperacao(grupo, origem) {
    const outras = operacoesOrdenadas(grupo).filter((o) => o !== origem);
    if (!outras.length) { Aviso.mostrar('Não há outra operação no grupo para receber a cópia'); return; }
    const resumo = (o) => {
      const recs = o.receitas.filter((r) => Planos.talhoesDaReceita(o, r).length).length;
      const talhoes = Object.keys(o.talhoes).length;
      return recs ? `${recs} ${recs === 1 ? 'recomendação' : 'recomendações'} · ${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'}` : 'Sem recomendação';
    };
    const modal = Modal.abrir(`
      <form class="formulario" novalidate>
        <div class="modal__corpo">
          <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
          <h2 class="modal__titulo" id="modal-titulo">Copiar ${esc(origem.nome)}</h2>
          <p class="modal__subtitulo">Escolha a operação que vai receber as recomendações agronômicas.</p>
          <fieldset class="copiar-para">
            <legend class="so-leitor">Operação de destino</legend>
            ${outras.map((o) => `
              <label class="copiar-para__item">
                <input type="radio" name="destino" value="${o.id}">
                <span class="copiar-para__nome">${esc(o.nome)}</span>
                <span class="copiar-para__dap">DAP ${o.dap ?? '—'}</span>
                <span class="copiar-para__resumo">${resumo(o)}</span>
              </label>`).join('')}
          </fieldset>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
          <button class="botao botao--primario" type="submit" disabled>Colar</button>
        </div>
      </form>`, { classe: 'modal--pequeno' });
    const form = modal.elemento.querySelector('form');
    form.addEventListener('change', () => { form.querySelector('[type=submit]').disabled = !form.elements.destino.value; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const destino = outras.find((o) => o.id === form.elements.destino.value);
      if (!destino) return;
      const copiar = () => {
        destino.receitas = []; destino.talhoes = {};
        copiarRecomendacoes(origem, destino);
        delete ui.receitaPorOp[destino.id];
        ui.opPorGrupo[grupo.id] = destino.id;
        ui.filtroTalhoes = 'todos'; ui.quadroAberto = false;
        limparSelecao(); alterou(); desenharTudo();
        Aviso.mostrar(`${esc(origem.nome)} copiada para ${esc(destino.nome)}`);
      };
      modal.fechar();
      const recs = destino.receitas.filter((r) => Planos.talhoesDaReceita(destino, r).length).length;
      if (!recs) { copiar(); return; }
      const talhoes = Object.keys(destino.talhoes).length;
      Modal.confirmar({
        titulo: `Substituir o que está em ${esc(destino.nome)}?`,
        texto: `${esc(destino.nome)} já tem ${recs} ${recs === 1 ? 'recomendação' : 'recomendações'} em ${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'}. ${recs === 1 ? 'Ela será substituída' : 'Elas serão substituídas'} pelas de ${esc(origem.nome)}. Essa ação não pode ser desfeita.`,
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Substituir', classe: 'perigo', acao: copiar }]
      });
    });
    form.querySelector('input[type=radio]').focus();
  }

  // Copia recomendações (nome, produtos e doses padrão), talhões e doses próprias, com ids novos
  function copiarRecomendacoes(origem, destino) {
    const idsLinha = {};
    const idsRec = {};
    destino.receitas = origem.receitas.map((r) => {
      const copia = { ...r, id: Planos.novoId('r'), produtos: r.produtos.map((l) => {
        const { id, ...dados } = l;
        const nova = Planos.novaLinha(dados);
        idsLinha[id] = nova.id;
        return nova;
      }) };
      idsRec[r.id] = copia.id;
      return copia;
    });
    Object.entries(origem.talhoes).forEach(([talhao, ajuste]) => {
      if (!idsRec[ajuste.receitaId]) return;
      const novo = Planos.novoAjuste(idsRec[ajuste.receitaId]);
      Object.entries(ajuste.doses).forEach(([linha, dose]) => { if (idsLinha[linha]) novo.doses[idsLinha[linha]] = dose; });
      destino.talhoes[talhao] = novo;
    });
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
    pc.erros = {};
    if (!produto) pc.erros.produto = 'Informe o produto comercial.';
    if (!pc.unidade) pc.erros.unidade = 'Escolha a unidade.';
    pc.aviso = '';
    if (pc.erros.produto || pc.erros.unidade) { desenharTudo(); return; }

    const uso = usoAtual();
    DADOS.defensivos.push({ classe: '', produto, principioAtivo: pa, unidade: pc.unidade, preCadastro: true,
                            ...(uso === 'tsi' ? { tsi: true } : uso === 'fertilidade' ? { fertilidade: true } : {}) });
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
      // O modal fecha (a recomendação aberta nele deixou de existir) e a tabela volta para Todos os talhões
      ui.definindo = null;
      ui.filtroTalhoes = 'todos'; ui.quadroAberto = false;
      alterou(); desenharTudo();
      const rolagem = raiz.querySelector('.talhoes-rolagem');
      if (rolagem) rolagem.scrollTop = 0;
      return indice;
    };
    const n = talhoes.length;
    if (n) {
      Modal.confirmar({
        titulo: `Excluir ${esc(r.nome)}?`,
        texto: `${n === 1 ? 'O talhão ficará' : `Os ${n} talhões ficarão`} sem ${T().nome}. Essa ação não pode ser desfeita.`,
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: `Excluir ${T().nome}`, classe: 'perigo', acao: () => {
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

  // Tira a recomendação só dos talhões marcados; ela continua nos outros.
  // Se não sobrar nenhum talhão, a recomendação deixa de existir.
  function excluirDosTalhoes(op, r, marcados) {
    if (!r) return;
    const alvo = marcados.filter((t) => op.talhoes[t] && op.talhoes[t].receitaId === r.id);
    const n = alvo.length;
    if (!n) return;
    const restam = Planos.talhoesDaReceita(op, r).length - n;
    const nome = esc(nomeCurto(r));
    Modal.confirmar({
      titulo: `Excluir ${esc(r.nome)} de ${n} ${n === 1 ? 'talhão' : 'talhões'}?`,
      texto: textoRestam(nome, restam) + ' Essa ação não pode ser desfeita.',
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: `Excluir ${T().nome}`, classe: 'perigo', acao: () => {
        alvo.forEach((t) => { delete op.talhoes[t]; });
        if (!restam) { op.receitas.splice(op.receitas.indexOf(r), 1); delete ui.receitaPorOp[op.id]; }
        ui.rascunho = null; ui.validarOp = null; ui.preCadastro = null; ui.erroNome = null;
        // Depois de excluir, a tabela volta para Todos os talhões
        ui.filtroTalhoes = 'todos'; ui.quadroAberto = false;
        limparSelecao(); alterou(); desenharTudo();
        const rolagem = raiz.querySelector('.talhoes-rolagem');
        if (rolagem) rolagem.scrollTop = 0;
        Aviso.mostrar(restam ? `${nome} excluída de ${n} ${n === 1 ? 'talhão' : 'talhões'}` : `${nome} excluída`);
      } }]
    });
  }

  // "Rec 1 continua nos outros 11 talhões." / "Rec 1 deixa de existir."
  function textoRestam(nome, restam) {
    if (!restam) return `${nome} deixa de existir.`;
    return `${nome} continua ${restam === 1 ? 'no outro talhão' : `nos outros ${restam} talhões`}.`;
  }

  // "Excluir recomendação" no rodapé da tabela: tira a recomendação dos talhões marcados (podem ser de
  // recomendações diferentes); talhão marcado sem recomendação é ignorado. Recomendação sem talhão deixa de existir.
  function excluirDosMarcados(op) {
    const alvo = talhoesFazenda.map((t) => t.nome).filter((t) => ui.marcados.has(t) && op.talhoes[t]);
    const n = alvo.length;
    if (!n) return;
    const ignorados = ui.marcados.size - n;
    const recs = op.receitas.map((r) => ({ r, n: alvo.filter((t) => op.talhoes[t].receitaId === r.id).length }))
      .filter((x) => x.n);
    const plural = (q) => `${q} ${q === 1 ? 'talhão' : 'talhões'}`;
    let titulo; let detalhe;
    if (recs.length === 1) {
      const { r } = recs[0];
      const restam = Planos.talhoesDaReceita(op, r).length - n;
      titulo = `Excluir ${esc(r.nome)} de ${plural(n)}?`;
      detalhe = textoRestam(esc(nomeCurto(r)), restam);
    } else {
      titulo = `Excluir a ${T().nome} de ${plural(n)}?`;
      detalhe = recs.map((x) => `${esc(nomeCurto(x.r))} sai de ${plural(x.n)}`).join(', ').replace(/, ([^,]*)$/, ' e $1') + '.';
    }
    const aviso = ignorados ? ` ${ignorados === 1 ? '1 talhão marcado já não tem' : `${ignorados} talhões marcados já não têm`} ${T().nome}.` : '';
    Modal.confirmar({
      titulo,
      texto: `${detalhe}${aviso} Essa ação não pode ser desfeita.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: `Excluir ${T().nome}`, classe: 'perigo', acao: () => {
        alvo.forEach((t) => { delete op.talhoes[t]; });
        recs.filter((x) => !Planos.talhoesDaReceita(op, x.r).length)
          .forEach((x) => op.receitas.splice(op.receitas.indexOf(x.r), 1));
        ui.filtroTalhoes = 'todos'; ui.quadroAberto = false;
        limparSelecao(); alterou(); desenharTudo();
        const rolagem = raiz.querySelector('.talhoes-rolagem');
        if (rolagem) rolagem.scrollTop = 0;
        Aviso.mostrar(`${T().Nome} excluída de ${plural(n)}`);
      } }]
    });
  }

  // ----- Aplicar a recomendação nos talhões marcados -----
  // Grava o rascunho na recomendação e liga os talhões marcados a ela (um talhão fica em uma recomendação só
  // na operação: o que estava em outra muda para esta). Os talhões que já usavam a recomendação recebem
  // as alterações: dose padrão nova chega a quem segue o padrão; produto removido ou trocado sai de todos.
  // Exceção: marcando só parte dos talhões de uma recomendação, a mudança vale só para eles (ver aplicarEmParte).
  function aplicarDefinicao(op) {
    const r = receitaAtual(op);
    if (!r) return;
    // Pré-cadastro aberto: não aplica; avisa no próprio bloco
    if (ui.preCadastro) {
      const pc = ui.preCadastro;
      raiz.querySelectorAll('[data-pre]').forEach((el) => { pc[el.dataset.pre] = el.value; });
      pc.aviso = `${Icones.alerta} <span><strong>Pré-cadastro não finalizado.</strong> Salve ou cancele o pré-cadastro antes de aplicar.</span>`;
      desenharTudo();
      return;
    }
    // Campos digitados sem escolher na lista: aceita o que é do cadastro; o que não é fica com erro
    let naoEncontrado = false;
    raiz.querySelectorAll('.definir [data-combo]').forEach((el) => {
      if (aceitarDigitado(el) === 'nao-encontrado') naoEncontrado = true;
    });
    if (naoEncontrado || errosRecomendacao(op).algum) { ui.validarOp = op.id; desenharTudo(); return; }
    // Nome vazio volta ao anterior; nome repetido na operação não é aceito
    const nome = rascunho(op).nome.trim() || r.nome;
    if (op.receitas.some((x) => x !== r && Util.normalizar(x.nome) === Util.normalizar(nome))) {
      ui.erroNome = `Já existe uma ${T().nome} com esse nome`; desenharMantendoFoco('#rec-nome'); return;
    }
    const novas = rascunho(op).produtos.filter(Planos.linhaPreenchida).map((l) => ({ ...l }));
    const { talhoes, editando } = ui.definindo;
    const daRec = Planos.talhoesDaReceita(op, r);
    if (!editando && daRec.some((t) => !talhoes.includes(t))) { aplicarEmParte(op, r, talhoes, novas, nome); return; }
    // Recomendação nova com os mesmos produtos de outra (ex.: copiados dela pelo "Copiar produtos de"):
    // a composição é a identidade, então os talhões entram na que já existe e a dose diferente
    // da padrão dela fica como dose própria do talhão
    const igual = !editando && !daRec.length &&
      op.receitas.find((x) => x !== r && Planos.composicao(x.produtos) === Planos.composicao(novas));
    if (igual) {
      op.receitas.splice(op.receitas.indexOf(r), 1);
      ui.receitaPorOp[op.id] = igual.id;
      talhoes.forEach((t) => {
        const ajuste = op.talhoes[t] = Planos.novoAjuste(igual.id);
        novas.forEach((l) => {
          const base = igual.produtos.find((x) => Planos.chaveLinha(x) === Planos.chaveLinha(l));
          if (base && l.dose !== base.dose) ajuste.doses[base.id] = l.dose;
        });
      });
      const n = talhoes.length;
      concluirAplicacao(op, igual, `${esc(nomeCurto(igual))} aplicada em ${n} ${n === 1 ? 'talhão' : 'talhões'}`);
      return;
    }
    r.nome = nome;
    Planos.talhoesDaReceita(op, r).forEach((t) => {
      const doses = op.talhoes[t].doses;
      Object.keys(doses).forEach((id) => {
        const antes = r.produtos.find((l) => l.id === id);
        const depois = novas.find((l) => l.id === id);
        if (!depois || !antes || Planos.chaveLinha(antes) !== Planos.chaveLinha(depois)) delete doses[id];
      });
    });
    r.produtos = novas;
    talhoes.forEach((t) => {
      const a = op.talhoes[t];
      if (!a || a.receitaId !== r.id) op.talhoes[t] = Planos.novoAjuste(r.id);
    });
    const n = talhoes.length;
    concluirAplicacao(op, r, editando ? `${esc(r.nome)} salva` : `${esc(r.nome)} aplicada em ${n} ${n === 1 ? 'talhão' : 'talhões'}`);
  }

  // Depois de aplicar, a tela volta para "Todos os talhões" (a pessoa escolhe a etiqueta, se quiser)
  function concluirAplicacao(op, destino, mensagem) {
    ui.rascunho = null; ui.validarOp = null; ui.preCadastro = null; ui.erroNome = null;
    ui.filtroTalhoes = 'todos'; ui.quadroAberto = false;
    limparSelecao(); alterou(); desenharTudo();
    const rolagem = raiz.querySelector('.talhoes-rolagem');
    if (rolagem) rolagem.scrollTop = 0;
    Aviso.mostrar(mensagem);
  }

  // Só parte dos talhões de uma recomendação foi marcada: a mudança vale só para eles
  // (regra do docs/DECISOES: a composição de produtos é a identidade da recomendação).
  //  - Mesmos produtos, dose diferente: fica como dose própria dos talhões marcados; a recomendação não muda.
  //  - Produtos diferentes: os talhões marcados saem da recomendação e vão para a que já tem essa
  //    composição; se nenhuma tem, nasce a próxima (Recomendação 2…). A original continua nos outros.
  function aplicarEmParte(op, r, talhoes, novas, nome) {
    const n = talhoes.length;
    const plural = `${n} ${n === 1 ? 'talhão' : 'talhões'}`;
    const restam = Planos.talhoesDaReceita(op, r).filter((t) => !talhoes.includes(t)).length;
    // Dose diferente da padrão de "receita" vira dose própria do talhão.
    // soAlteradas: na mesma recomendação, dose não mexida no modal fica como estava em cada talhão.
    const dosesProprias = (receita, ajuste, soAlteradas) => {
      novas.forEach((l) => {
        const base = receita.produtos.find((x) => Planos.chaveLinha(x) === Planos.chaveLinha(l));
        if (!base || (soAlteradas && ui.definindo.dosesIniciais[l.id] === l.dose)) return;
        if (l.dose === base.dose) delete ajuste.doses[base.id]; else ajuste.doses[base.id] = l.dose;
      });
    };
    const composicao = Planos.composicao(novas);

    if (composicao === Planos.composicao(r.produtos)) {
      if (nome !== r.nome) r.nome = nome; // o nome é da recomendação: vale para todos os talhões dela
      talhoes.forEach((t) => dosesProprias(r, op.talhoes[t], true));
      concluirAplicacao(op, r, `${esc(nomeCurto(r))} aplicada em ${plural} · doses só desses talhões`);
      return;
    }

    let destino = op.receitas.find((x) => x !== r && Planos.composicao(x.produtos) === composicao);
    const criada = !destino;
    if (criada) {
      destino = Planos.novaReceita(op, novas.map((l) => Planos.novaLinha({
        principioAtivo: l.principioAtivo, produto: l.produto, unidade: l.unidade, dose: l.dose, preCadastro: l.preCadastro })), T().base);
      // Nome digitado diferente do original vai para a nova; senão, ela fica com o nome padrão
      if (nome !== r.nome) destino.nome = nome;
      op.receitas.push(destino);
    }
    talhoes.forEach((t) => {
      op.talhoes[t] = Planos.novoAjuste(destino.id);
      if (!criada) dosesProprias(destino, op.talhoes[t], false);
    });
    concluirAplicacao(op, destino, criada
      ? `${esc(nomeCurto(destino))} criada para ${plural} · ${esc(nomeCurto(r))} continua em ${restam} ${restam === 1 ? 'talhão' : 'talhões'}`
      : `${plural} ${n === 1 ? 'passou' : 'passaram'} para ${esc(nomeCurto(destino))}`);
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
    const nomeOp = !listaRecolhida() && e.target.closest('.ops-item__nome[data-op]');
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
        copiar: () => sairDaReceita(() => copiarParaOperacao(grupo, op)),
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
    // Copiar só existe para operações (não para grupos)
    menu.innerHTML = [['inserir', 'Inserir'], ['excluir', 'Excluir'], ['renomear', 'Renomear'], ['copiar', 'Copiar']]
      .filter(([item]) => acoes[item])
      .map(([item, rotulo]) => `<button class="menu-contexto__item" type="button" role="menuitem" data-item="${item}">${rotulo}</button>`)
      .join('');
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
