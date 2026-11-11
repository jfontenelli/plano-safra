/*
 * Tela 02 — Criar Plano de Safra (docs/telas/02-modal-criar-plano.md)
 * Desde 09/11/2026: ocupa a tela inteira e tem duas etapas, com o indicador "1 Definir o plano ── 2 Como iniciar".
 *  1. Definir o plano: informações gerais (Safra, Empresa (só com o nível Empresa), Atividade, Cultura) e uma fazenda,
 *     com a tabela de talhões (TabelaAreas: Área cadastrada e Área planejada, editável). Próximo →.
 *  2. Como iniciar: as opções do "Como deseja iniciar o plano?" (Telas.inicioPlano.embutir). ‹ Voltar e
 *     Começar o planejamento.
 * O plano só passa a existir em "Começar o planejamento"; fechar descarta tudo. Uma fazenda por vez.
 * Ao criar, chama aoCriar({ safra, empresa, atividade, cultura, fazenda, talhoes, areas, grupos, aviso }).
 * inicial: { safra, safras, empresa, fazenda } já escolhidos ao abrir (a fazenda com todos os talhões).
 */
window.Telas = window.Telas || {};

window.Telas.abrirModalCriarPlano = function ({ aoCriar, inicial = {} }) {
  const esc = Util.escapar;
  const NOVA_SAFRA = '__nova-safra__';
  // Sem o nível Empresa (Util.comEmpresa, 09/11/2026), o campo Empresa não aparece: a lista de fazendas tem todas e
  // o plano fica com a empresa da sua fazenda (app.js, criarPlanos)
  const GERAIS = ['safra', 'empresa', 'atividade', 'cultura'].filter((c) => c !== 'empresa' || Util.comEmpresa());

  let etapa = 1;
  let tentou = false; // os avisos de obrigatório só aparecem depois de tentar seguir
  // Fazenda e talhões (TabelaAreas): marcados e áreas planejadas
  let fazenda = '';
  const tabela = { todos: [], marcados: new Set(), areas: {}, editando: null, erro: '' };
  function escolherFazenda(f) {
    fazenda = f;
    tabela.todos = DADOS.talhoes[f] || [];
    // Fazenda escolhida: todos os talhões já vêm incluídos (a pessoa desmarca os que não quer), com a área cadastrada
    tabela.marcados = new Set(tabela.todos.map((t) => t.nome));
    tabela.areas = {}; tabela.editando = null; tabela.erro = '';
  }
  if (inicial.fazenda) escolherFazenda(inicial.fazenda);
  // O plano que vai nascer (para a etapa 2: importar confere safra, fazenda e cultura; copiar usa a cultura)
  const rascunho = { id: '__novo__' };

  const modal = Modal.abrir(`
    <div class="cp-tela">
      <header class="cp-tela__topo">
        <ol class="cp-etapas" aria-label="Etapas">
          <li class="cp-etapas__item" data-cp-etapa="1"><span class="cp-etapas__num">1</span> Definir o plano</li>
          <li class="cp-etapas__linha" aria-hidden="true"></li>
          <li class="cp-etapas__item" data-cp-etapa="2"><span class="cp-etapas__num">2</span> Como iniciar</li>
        </ol>
        <button class="modal__fechar cp-tela__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
      </header>

      <form class="formulario cp-tela__corpo" novalidate data-cp-passo="1">
        <div class="cp-tela__miolo">
          <h2 class="modal__titulo" id="modal-titulo">Criar Plano de Safra</h2>
          <p class="modal__subtitulo">Defina as informações gerais e selecione as áreas que farão parte do plano.</p>

          <h3 class="cp-secao">Informações gerais</h3>
          <!-- Safra · (Empresa) · Atividade · Cultura · Fazenda numa linha; embaixo, só os talhões (09/11/2026) -->
          <div class="cp-gerais ${Util.comEmpresa() ? 'cp-gerais--5' : ''}">
            <div class="campo">
              <label class="campo__rotulo" for="cp-safra">Safra ${asterisco()}</label>
              <select class="campo__controle" id="cp-safra" name="safra" required></select>
              ${erroObrigatorio('safra')}
            </div>
            ${Util.comEmpresa() ? campoLista('empresa', 'Empresa', 'Selecione', DADOS.empresas, [], inicial.empresa)
              : '<input type="hidden" name="empresa" value="">'}
            ${campoLista('atividade', 'Atividade', 'Selecione', DADOS.atividades, DADOS.atividadesEmBreve, 'Agricultura')}
            ${campoLista('cultura', 'Cultura', 'Selecione', DADOS.culturas)}
            <div class="campo">
              <label class="campo__rotulo" for="cp-fazenda">Fazenda ${asterisco()}</label>
              <select class="campo__controle" id="cp-fazenda" name="fazenda"></select>
              <p class="erro-campo" id="cp-erro-fazenda" hidden></p>
            </div>
          </div>

          <h3 class="cp-secao cp-secao--linha">Talhões</h3>
          <p class="cp-secao__sub">Selecione os talhões e ajuste a área planejada quando necessário.</p>
          <div class="cp-talhoes-area" data-cp-talhoes></div>
        </div>
      </form>

      <div class="cp-tela__corpo" data-cp-passo="2" hidden>
        <div class="cp-tela__miolo">
          <h2 class="modal__titulo">Como deseja iniciar o plano?</h2>
          <p class="modal__subtitulo" data-cp-contexto></p>
          <div data-ini-corpo></div>
        </div>
      </div>

      <div class="modal__rodape cp-tela__rodape">
        <p class="modal__rodape-erro" id="cp-erro-criar" role="alert" hidden></p>
        <button class="botao botao--secundario" type="button" data-fechar data-cp-so="1">Cancelar</button>
        <button class="botao botao--primario" type="button" data-acao="cp-proximo" data-cp-so="1" aria-disabled="true">Próximo ${Icones.proxima}</button>
        <button class="botao botao--secundario cp-tela__voltar" type="button" data-acao="cp-voltar" data-cp-so="2" hidden>${Icones.anterior} Voltar</button>
        <button class="botao botao--primario" type="button" data-ini="comecar" data-cp-so="2" hidden>Começar o planejamento</button>
      </div>
    </div>
  `, { classe: 'modal--tela modal--criar-plano' });

  const el = modal.elemento;
  const form = el.querySelector('form');
  const selectSafra = form.elements.safra;
  const selectFazenda = form.elements.fazenda;
  const caixaTalhoes = form.querySelector('[data-cp-talhoes]');
  const botaoProximo = el.querySelector('[data-acao="cp-proximo"]');
  const erroCriar = el.querySelector('#cp-erro-criar');
  let safraAnterior = '';

  // Lista de safras: as do cadastro ou, vindo da lista de planos, só as do Ano Agrícola do filtro (inicial.safras)
  const listaSafras = inicial.safras ? [...inicial.safras] : DADOS.safras;
  preencherSafras(inicial.safra && listaSafras.includes(inicial.safra) ? inicial.safra : '');
  preencherFazendas();
  desenharTalhoes();
  mostrarEtapa();
  selectSafra.focus();

  // ----- Fazenda -----
  // Com o nível Empresa, cada empresa tem as suas fazendas (DADOS.fazendasPorEmpresa): a lista segue a empresa
  // escolhida (desabilitada sem empresa). Sem o nível, todas as fazendas.
  function fazendasDaEmpresa() {
    if (!Util.comEmpresa()) return DADOS.fazendas;
    return (DADOS.fazendasPorEmpresa || {})[form.elements.empresa.value] || [];
  }
  function comEmpresaEscolhida() { return !Util.comEmpresa() || !!form.elements.empresa.value; }
  function preencherFazendas() {
    const lista = fazendasDaEmpresa();
    if (fazenda && !lista.includes(fazenda)) escolherFazenda('');
    selectFazenda.disabled = !comEmpresaEscolhida();
    selectFazenda.innerHTML = opcoes(comEmpresaEscolhida() ? 'Selecione' : 'Escolha a empresa', lista, fazenda);
  }
  form.elements.empresa.addEventListener('change', () => { preencherFazendas(); desenharTalhoes(); });
  selectFazenda.addEventListener('change', () => { escolherFazenda(selectFazenda.value); desenharTalhoes(); });

  // Tabela de talhões da fazenda escolhida (sem fazenda, só a dica)
  function desenharTalhoes(foco) {
    caixaTalhoes.innerHTML = fazenda
      ? (tabela.todos.length ? TabelaAreas.html(tabela) : '<p class="cp-fazenda__dica">Esta fazenda não tem talhões cadastrados.</p>')
      : `<p class="cp-fazenda__dica">${Icones.info} Escolha a fazenda para ver os talhões.</p>`;
    TabelaAreas.depois(caixaTalhoes);
    if (foco) caixaTalhoes.querySelector(foco)?.focus();
    atualizar();
  }
  TabelaAreas.ligar(caixaTalhoes, tabela, desenharTalhoes);

  // ----- Etapas -----
  function mostrarEtapa() {
    el.querySelectorAll('[data-cp-passo]').forEach((p) => { p.hidden = Number(p.dataset.cpPasso) !== etapa; });
    el.querySelectorAll('[data-cp-so]').forEach((b) => { b.hidden = Number(b.dataset.cpSo) !== etapa; });
    el.querySelectorAll('[data-cp-etapa]').forEach((li) => {
      const n = Number(li.dataset.cpEtapa);
      li.classList.toggle('cp-etapas__item--ativa', n === etapa);
      li.classList.toggle('cp-etapas__item--feita', n < etapa);
      if (n === etapa) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    erroCriar.hidden = etapa !== 1 || erroCriar.hidden;
  }

  // Etapa 2 (Como iniciar): as opções do modal de início, para o plano que vai nascer
  const desenharInicio = Telas.inicioPlano.embutir(el, el.querySelector('[data-ini-corpo]'), rascunho, {
    aoComecar: (grupos, aviso) => {
      const f = form.elements;
      modal.fechar();
      aoCriar({ safra: f.safra.value, empresa: f.empresa.value, atividade: f.atividade.value, cultura: f.cultura.value,
        fazenda, talhoes: talhoesEscolhidos(), areas: { ...tabela.areas }, grupos, aviso });
    }
  });
  const talhoesEscolhidos = () => tabela.todos.filter((t) => tabela.marcados.has(t.nome)).map((t) => t.nome);

  function irParaInicio() {
    const f = form.elements;
    Object.assign(rascunho, { safra: f.safra.value, empresa: f.empresa.value || Util.empresaDaFazenda(fazenda),
      fazenda, cultura: f.cultura.value, atividade: f.atividade.value, talhoes: talhoesEscolhidos(), areas: { ...tabela.areas } });
    el.querySelector('[data-cp-contexto]').textContent =
      `Safra ${rascunho.safra} · ${Util.comEmpresa() ? `${rascunho.empresa} · ` : ''}Fazenda ${fazenda} · ${rascunho.cultura}`;
    desenharInicio();
    etapa = 2;
    mostrarEtapa();
    (el.querySelector('[name="ini-opcao"]:checked') || el.querySelector('[data-acao="cp-voltar"]')).focus();
  }

  el.addEventListener('click', (e) => {
    const acao = e.target.closest('[data-acao]')?.dataset.acao;
    if (acao === 'cp-proximo') {
      tentou = true;
      const { faltando, fazendaErro } = atualizar();
      if (faltando.length) { form.elements[faltando[0]].focus(); return; }
      if (fazendaErro) { selectFazenda.focus(); return; }
      if (tabela.editando) return; // a área em edição está com erro
      irParaInicio();
    } else if (acao === 'cp-voltar') {
      etapa = 1;
      mostrarEtapa();
      botaoProximo.focus();
    }
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('change', (e) => { if (e.target.name && GERAIS.includes(e.target.name)) atualizar(); });

  // ----- Criar nova safra (última opção da lista de safras) -----
  function preencherSafras(selecionada = '') {
    // 11/11/2026: as safras vêm do ERP Compass (só consulta no produto): sem o "+ Criar nova safra" (o código continua)
    const CRIA_SAFRA = false;
    selectSafra.innerHTML = opcoes('Selecione', listaSafras, selecionada) +
      (CRIA_SAFRA ? `<option value="${NOVA_SAFRA}">+ Criar nova safra</option>` : '');
    safraAnterior = selecionada;
  }

  // Escolher "+ Criar nova safra" volta a lista ao valor anterior e abre a janela "Nova safra".
  // Registrado no próprio select, antes da validação do formulário.
  selectSafra.addEventListener('change', () => {
    if (selectSafra.value === NOVA_SAFRA) {
      selectSafra.value = safraAnterior;
      abrirNovaSafra();
    } else {
      safraAnterior = selectSafra.value;
    }
  });

  // Janela pequena por cima do formulário: só sai dela por Confirmar (ou Enter) ou Cancelar (ou Esc).
  // Clicar fora não fecha: o cursor volta ao campo e aparece "Confirme ou cancele a nova safra".
  function abrirNovaSafra() {
    const janela = Modal.abrir(`
      <form class="formulario" novalidate>
        <div class="modal__corpo">
          <h2 class="modal__titulo" id="modal-titulo-safra">Nova safra</h2>
          <p class="modal__subtitulo">A safra nova entra na lista e fica selecionada.</p>
          <div class="campo">
            <label class="campo__rotulo" for="ns-nome">Safra ${asterisco()}</label>
            <input class="campo__controle" id="ns-nome" type="text" placeholder="Nome da safra (ex.: 26/27)" autocomplete="off">
            <p class="aviso-janela-texto" id="ns-finalizar" role="alert" hidden>${Icones.alerta} Confirme ou cancele a nova safra.</p>
          </div>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
          <button class="botao botao--primario" type="submit" disabled>Confirmar</button>
        </div>
      </form>
    `, {
      classe: 'modal--pequeno',
      idTitulo: 'modal-titulo-safra',
      devolverFoco: selectSafra,
      aoClicarFora: () => { aviso.hidden = false; input.focus(); }
    });
    const formSafra = janela.elemento.querySelector('form');
    const input = formSafra.querySelector('#ns-nome');
    const aviso = formSafra.querySelector('#ns-finalizar');
    const confirmar = formSafra.querySelector('[type="submit"]');
    input.addEventListener('input', () => { confirmar.disabled = !input.value.trim(); });
    formSafra.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = input.value.trim();
      if (!nome) { input.focus(); return; }
      // Se o nome já existe, só seleciona a safra existente
      if (!DADOS.safras.includes(nome)) DADOS.safras.push(nome);
      if (!listaSafras.includes(nome)) listaSafras.push(nome);
      preencherSafras(nome);
      janela.fechar();
      form.elements[GERAIS[1]].focus();
      atualizar();
    });
    input.focus();
  }

  // ----- Validação -----
  // Informações gerais e a fazenda são obrigatórias; talhões, não (sem talhões, a área fica "Pendente").
  // Um único plano por safra, fazenda e cultura (09/11/2026): não deixa criar um plano que já existe
  // (ex.: com a soja 27/27 da Boa Vista, o milho 27/27 da Boa Vista pode).
  function problemas() {
    const f = form.elements;
    const faltando = GERAIS.filter((nome) => !f[nome].value);
    let fazendaErro = '';
    if (!fazenda) fazendaErro = 'Preenchimento obrigatório';
    else if (f.safra.value && f.cultura.value && DADOS.planos.some((p) => p.safra === f.safra.value && p.fazenda === fazenda
      && p.cultura === f.cultura.value)) {
      fazendaErro = `Já existe um plano de ${f.cultura.value} da safra ${f.safra.value} para a Fazenda ${fazenda}.`;
    }
    return { faltando, fazendaErro };
  }

  function atualizar() {
    const { faltando, fazendaErro } = problemas();
    const bloqueado = faltando.length || fazendaErro;
    // O botão parece desabilitado, mas continua clicável para explicar o que falta
    botaoProximo.setAttribute('aria-disabled', bloqueado ? 'true' : 'false');
    GERAIS.forEach((nome) => {
      const vazio = tentou && faltando.includes(nome);
      form.querySelector(`#cp-erro-${nome}`).hidden = !vazio;
      form.elements[nome].toggleAttribute('aria-invalid', vazio);
    });
    // Fazenda vazia só é cobrada depois de tentar seguir; plano existente, na hora
    const mostrar = fazendaErro && (tentou || fazendaErro !== 'Preenchimento obrigatório');
    const erro = form.querySelector('#cp-erro-fazenda');
    erro.textContent = mostrar ? fazendaErro : '';
    erro.hidden = !mostrar;
    selectFazenda.classList.toggle('campo__controle--erro', !!mostrar && fazendaErro !== 'Preenchimento obrigatório');
    erroCriar.hidden = !(tentou && bloqueado) || etapa !== 1;
    erroCriar.textContent = faltando.length || fazendaErro === 'Preenchimento obrigatório'
      ? 'Preencha os campos obrigatórios.' : 'Confira a fazenda.';
    return { faltando, fazendaErro };
  }

  // ----- Pedaços de HTML -----
  // Com uma opção só, ela já vem escolhida. emBreve: opções que aparecem desabilitadas, com "(Em breve)".
  function campoLista(nome, rotulo, textoVazio, itens, emBreve = [], padrao = '') {
    const disponiveis = itens.filter((x) => !emBreve.includes(x));
    const escolhido = padrao || (disponiveis.length === 1 ? disponiveis[0] : '');
    return `
      <div class="campo">
        <label class="campo__rotulo" for="cp-${nome}">${rotulo} ${asterisco()}</label>
        <select class="campo__controle" id="cp-${nome}" name="${nome}" required>
          ${opcoes(textoVazio, itens, escolhido, emBreve)}
        </select>
        ${erroObrigatorio(nome)}
      </div>
    `;
  }

  function asterisco() {
    return '<span class="obrigatorio" aria-hidden="true">*</span>';
  }

  function erroObrigatorio(nome) {
    return `<p class="erro-campo" id="cp-erro-${nome}" hidden>Preenchimento obrigatório</p>`;
  }

  function opcoes(textoVazio, itens, selecionado = '', emBreve = []) {
    return `<option value="" disabled ${selecionado ? '' : 'selected'}>${textoVazio}</option>` +
      itens.map((item) => emBreve.includes(item)
        ? `<option value="${esc(item)}" disabled>${esc(item)} (Em breve)</option>`
        : `<option value="${esc(item)}" ${item === selecionado ? 'selected' : ''}>${esc(item)}</option>`).join('');
  }
};
