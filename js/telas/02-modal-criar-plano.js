/*
 * Tela 02 — Modal Criar Plano de Safra (docs/telas/02-modal-criar-plano.md)
 * Abre por cima da tela de origem. Só identifica o plano: informações gerais (Safra, Empresa, Atividade, Cultura)
 * e uma ou mais fazendas, cada uma com os talhões incluídos. Cria um plano por fazenda.
 * Ao criar, chama aoCriar({ safra, empresa, atividade, cultura, fazendas: [{ fazenda, talhoes }] }).
 * Como começar o plano (modelo, do zero, XLSX, copiar) fica no Planejamento (Telas.inicioPlano).
 */
window.Telas = window.Telas || {};

window.Telas.abrirModalCriarPlano = function ({ aoCriar }) {
  const esc = Util.escapar;
  const NOVA_SAFRA = '__nova-safra__';
  const GERAIS = ['safra', 'empresa', 'atividade', 'cultura'];

  // Blocos de fazenda: { chave, fazenda, talhoes (nomes incluídos) }
  let proximaChave = 1;
  const blocos = [novoBloco()];
  let tentouCriar = false;      // os avisos de obrigatório só aparecem depois de tentar criar
  let talhoesAbertos = null;    // chave do bloco com a lista de talhões aberta

  function novoBloco() { return { chave: proximaChave++, fazenda: '', talhoes: [] }; }

  const modal = Modal.abrir(`
    <form class="formulario" novalidate>
      <div class="modal__corpo">
        <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
        <h2 class="modal__titulo" id="modal-titulo">Criar Plano de Safra</h2>
        <p class="modal__subtitulo">Defina as informações gerais do plano e selecione as fazendas que farão parte da criação.</p>

        <h3 class="cp-secao">Informações gerais</h3>
        <div class="cp-gerais">
          <div class="campo">
            <label class="campo__rotulo" for="cp-safra">Safra ${asterisco()}</label>
            <select class="campo__controle" id="cp-safra" name="safra" required></select>
            ${erroObrigatorio('safra')}
          </div>
          ${campoLista('empresa', 'Empresa', 'Selecione', DADOS.empresas)}
          ${campoLista('atividade', 'Atividade', 'Selecione', DADOS.atividades, DADOS.atividadesEmBreve, 'Agricultura')}
          ${campoLista('cultura', 'Cultura', 'Selecione', DADOS.culturas)}
        </div>

        <h3 class="cp-secao cp-secao--linha">Fazendas</h3>
        <div class="cp-fazendas" id="cp-fazendas"></div>
        <button class="botao botao--secundario cp-adicionar" type="button" data-acao="cp-adicionar">${Icones.mais} Adicionar fazenda</button>
      </div>

      <div class="modal__rodape">
        <p class="modal__rodape-erro" id="cp-erro-criar" role="alert" hidden></p>
        <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
        <button class="botao botao--primario" type="submit" aria-disabled="true">Criar Plano de Safra</button>
      </div>
    </form>
  `, { classe: 'modal--formulario modal--largo' });

  const form = modal.elemento.querySelector('form');
  const selectSafra = form.elements.safra;
  const caixaFazendas = form.querySelector('#cp-fazendas');
  const botaoCriar = form.querySelector('[type="submit"]');
  const erroCriar = form.querySelector('#cp-erro-criar');
  let safraAnterior = '';

  preencherSafras();
  desenharFazendas();
  selectSafra.focus();

  // ----- Fazendas -----
  function desenharFazendas() {
    caixaFazendas.innerHTML = blocos.map(blocoFazenda).join('');
    atualizar();
  }

  function blocoFazenda(b, i) {
    const todos = DADOS.talhoes[b.fazenda] || [];
    const incluidos = todos.filter((t) => b.talhoes.includes(t.nome));
    const area = incluidos.reduce((s, t) => s + t.area, 0);
    const resumo = !b.fazenda ? 'Escolha a fazenda'
      : !incluidos.length ? 'Selecionar talhões'
      : incluidos.length === todos.length ? `Todos os talhões (${todos.length})`
      : `${incluidos.length} de ${todos.length} talhões`;
    const aberto = talhoesAbertos === b.chave;
    return `
      <section class="cp-fazenda" data-bloco="${b.chave}" aria-label="Fazenda ${i + 1}">
        <header class="cp-fazenda__topo">
          <span>Fazenda ${i + 1}</span>
          ${blocos.length > 1 ? `<button class="botao-icone" type="button" data-acao="cp-remover" title="Remover esta fazenda"
                                        aria-label="Remover Fazenda ${i + 1}">${Icones.lixeira}</button>` : ''}
        </header>
        <div class="cp-fazenda__campos">
          <div class="campo">
            <label class="campo__rotulo" for="cp-fazenda-${b.chave}">Fazenda ${asterisco()}</label>
            <select class="campo__controle" id="cp-fazenda-${b.chave}" data-campo="fazenda">
              ${opcoes('Selecione', DADOS.fazendas, b.fazenda)}
            </select>
            <p class="erro-campo" data-erro-fazenda hidden></p>
          </div>
          <div class="campo cp-talhoes">
            <span class="campo__rotulo" id="cp-talhoes-rot-${b.chave}">Talhões (opcional)</span>
            <button class="campo__controle cp-talhoes__botao" type="button" data-acao="cp-talhoes"
                    aria-haspopup="true" aria-expanded="${aberto}" aria-labelledby="cp-talhoes-rot-${b.chave}"
                    ${b.fazenda ? '' : 'disabled'}><span>${resumo}</span>${Icones.abaixo}</button>
            ${aberto ? listaTalhoes(b, todos) : ''}
          </div>
          <div class="campo">
            <span class="campo__rotulo">Área de cultivo</span>
            <p class="campo__controle cp-area" aria-live="polite">${incluidos.length ? Util.area(area) : 'Pendente'}</p>
          </div>
        </div>
        ${b.fazenda && !incluidos.length ? `<p class="cp-fazenda__dica">${Icones.info} A área de cultivo será calculada automaticamente quando houver talhões selecionados.</p>` : ''}
      </section>`;
  }

  // Lista de talhões com caixas de marcar; "Todos" marca ou desmarca tudo
  function listaTalhoes(b, todos) {
    const tudo = todos.length && todos.every((t) => b.talhoes.includes(t.nome));
    return `
      <div class="cp-talhoes__lista" role="group" aria-label="Talhões da Fazenda ${esc(b.fazenda)}">
        <label class="cp-talhoes__item cp-talhoes__item--todos">
          <input type="checkbox" data-talhao="__todos__" ${tudo ? 'checked' : ''}> Todos
        </label>
        ${todos.map((t) => `
          <label class="cp-talhoes__item">
            <input type="checkbox" data-talhao="${esc(t.nome)}" ${b.talhoes.includes(t.nome) ? 'checked' : ''}>
            ${esc(t.nome)} <span class="cp-talhoes__area">${Util.area(t.area)}</span>
          </label>`).join('')}
      </div>`;
  }

  function blocoDe(el) {
    const sec = el.closest('[data-bloco]');
    return sec ? blocos.find((b) => b.chave === Number(sec.dataset.bloco)) : null;
  }

  // Redesenha as fazendas e devolve o foco ao controle equivalente
  function redesenhar(chave, seletor) {
    desenharFazendas();
    caixaFazendas.querySelector(`[data-bloco="${chave}"] ${seletor}`)?.focus();
  }

  form.addEventListener('click', (e) => {
    const acao = e.target.closest('[data-acao]')?.dataset.acao;
    const b = blocoDe(e.target);
    if (acao === 'cp-adicionar') {
      const novo = novoBloco();
      blocos.push(novo);
      talhoesAbertos = null;
      redesenhar(novo.chave, '[data-campo="fazenda"]');
    } else if (acao === 'cp-remover') {
      blocos.splice(blocos.indexOf(b), 1);
      talhoesAbertos = null;
      desenharFazendas();
      form.querySelector('[data-acao="cp-adicionar"]').focus();
    } else if (acao === 'cp-talhoes') {
      talhoesAbertos = talhoesAbertos === b.chave ? null : b.chave;
      redesenhar(b.chave, talhoesAbertos ? '.cp-talhoes__lista input' : '[data-acao="cp-talhoes"]');
    }
  });

  // Clicar fora da lista de talhões fecha a lista
  modal.elemento.addEventListener('mousedown', (e) => {
    if (talhoesAbertos && !e.target.closest('.cp-talhoes')) { talhoesAbertos = null; desenharFazendas(); }
  });
  // Esc na lista de talhões fecha só a lista (não o modal)
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && talhoesAbertos && e.target.closest('.cp-talhoes')) {
      e.stopPropagation();
      const chave = talhoesAbertos;
      talhoesAbertos = null;
      redesenhar(chave, '[data-acao="cp-talhoes"]');
    }
  });

  form.addEventListener('change', (e) => {
    const b = blocoDe(e.target);
    if (b && e.target.dataset.campo === 'fazenda') {
      // Fazenda escolhida: todos os talhões já vêm incluídos (a pessoa desmarca os que não quer)
      b.fazenda = e.target.value;
      b.talhoes = (DADOS.talhoes[b.fazenda] || []).map((t) => t.nome);
      redesenhar(b.chave, '[data-campo="fazenda"]');
      return;
    }
    if (b && e.target.dataset.talhao) {
      const todos = (DADOS.talhoes[b.fazenda] || []).map((t) => t.nome);
      const nome = e.target.dataset.talhao;
      if (nome === '__todos__') b.talhoes = e.target.checked ? todos : [];
      else b.talhoes = e.target.checked ? todos.filter((t) => t === nome || b.talhoes.includes(t)) : b.talhoes.filter((t) => t !== nome);
      redesenhar(b.chave, `[data-talhao="${CSS.escape(nome)}"]`);
      return;
    }
    atualizar();
  });

  // ----- Criar nova safra (última opção da lista de safras) -----
  function preencherSafras(selecionada = '') {
    selectSafra.innerHTML = opcoes('Selecione', DADOS.safras, selecionada) +
      `<option value="${NOVA_SAFRA}">+ Criar nova safra</option>`;
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
      preencherSafras(nome);
      janela.fechar();
      form.elements.empresa.focus();
      atualizar();
    });
    input.focus();
  }

  // ----- Validação -----
  // Informações gerais e a fazenda de cada bloco são obrigatórias; talhões, não.
  // Um único plano por safra e fazenda: não pode repetir fazenda entre os blocos nem criar um plano que já existe.
  function problemas() {
    const f = form.elements;
    const faltando = GERAIS.filter((nome) => !f[nome].value);
    const porBloco = blocos.map((b, i) => {
      if (!b.fazenda) return 'Preenchimento obrigatório';
      if (blocos.findIndex((x) => x.fazenda === b.fazenda) < i) return `A Fazenda ${b.fazenda} já está em outro bloco.`;
      if (f.safra.value && DADOS.planos.some((p) => p.safra === f.safra.value && p.fazenda === b.fazenda)) {
        return `Já existe um plano da safra ${f.safra.value} para a Fazenda ${b.fazenda}.`;
      }
      return '';
    });
    return { faltando, porBloco };
  }

  function atualizar() {
    const { faltando, porBloco } = problemas();
    const bloqueado = faltando.length || porBloco.some(Boolean);
    // O botão parece desabilitado, mas continua clicável para explicar o que falta
    botaoCriar.setAttribute('aria-disabled', bloqueado ? 'true' : 'false');
    GERAIS.forEach((nome) => {
      const vazio = tentouCriar && faltando.includes(nome);
      form.querySelector(`#cp-erro-${nome}`).hidden = !vazio;
      form.elements[nome].toggleAttribute('aria-invalid', vazio);
    });
    caixaFazendas.querySelectorAll('[data-bloco]').forEach((sec, i) => {
      const msg = porBloco[i];
      // Fazenda vazia só é cobrada depois de tentar criar; fazenda repetida ou plano existente, na hora
      const mostrar = msg && (tentouCriar || msg !== 'Preenchimento obrigatório');
      const erro = sec.querySelector('[data-erro-fazenda]');
      erro.textContent = mostrar ? msg : ''; // textContent: não precisa escapar
      erro.hidden = !mostrar;
      sec.querySelector('[data-campo="fazenda"]').classList.toggle('campo__controle--erro', !!mostrar && msg !== 'Preenchimento obrigatório');
    });
    erroCriar.hidden = !(tentouCriar && bloqueado);
    erroCriar.textContent = faltando.length || porBloco.includes('Preenchimento obrigatório')
      ? 'Preencha os campos obrigatórios.' : 'Confira as fazendas.';
    return { faltando, porBloco };
  }

  // ----- Criar Plano de Safra -----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    tentouCriar = true;
    const { faltando, porBloco } = atualizar();
    if (faltando.length) { form.elements[faltando[0]].focus(); return; }
    const i = porBloco.findIndex(Boolean);
    if (i >= 0) { caixaFazendas.querySelectorAll('[data-campo="fazenda"]')[i].focus(); return; }
    const f = form.elements;
    modal.fechar();
    aoCriar({
      safra: f.safra.value,
      empresa: f.empresa.value,
      atividade: f.atividade.value,
      cultura: f.cultura.value,
      fazendas: blocos.map((b) => ({ fazenda: b.fazenda, talhoes: [...b.talhoes] }))
    });
  });

  // ----- Pedaços de HTML -----
  // Com uma opção só (ex.: cultura, por enquanto só Soja), ela já vem escolhida.
  // emBreve: opções que aparecem desabilitadas, com "(Em breve)".
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
