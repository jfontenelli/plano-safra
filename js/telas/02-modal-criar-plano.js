/*
 * Tela 02 — Modal Criar Plano de Safra (docs/telas/02-modal-criar-plano.md)
 * Abre por cima da tela de origem. Ao continuar, chama aoCriar(plano).
 */
window.Telas = window.Telas || {};

window.Telas.abrirModalCriarPlano = function ({ aoCriar }) {
  const INICIOS = [
    { valor: 'modelo',   titulo: 'Usar modelo',     icone: Icones.lista,
      texto: 'Use uma estrutura pronta de operações e ajuste conforme necessário.' },
    { valor: 'branco',   titulo: 'Plano em branco', icone: Icones.lapis,
      texto: 'Monte a lista de operações conforme a realidade da fazenda.' },
    { valor: 'importar', titulo: 'Importar XLSX',   icone: Icones.planilha,
      texto: 'Continue um planejamento exportado por este sistema. Só aceita o arquivo .xlsx gerado pelo botão Exportar do Plano de Safra.' },
    { valor: 'clonar',   titulo: 'Clonar safra anterior', icone: Icones.copiar, emBreve: true,
      texto: 'Utilize o plano de uma safra anterior como base para o novo planejamento.' }
  ];

  const modal = Modal.abrir(`
    <form class="formulario" novalidate>
      <div class="modal__corpo">
        <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
        <h2 class="modal__titulo" id="modal-titulo">Criar Plano de Safra</h2>
        <p class="modal__subtitulo">Defina o contexto do novo planejamento.</p>

        <div class="campo">
          <label class="campo__rotulo" for="cp-safra">Safra ${asterisco()}</label>
          <select class="campo__controle" id="cp-safra" name="safra" required></select>
          ${erroObrigatorio('safra')}
          <div class="nova-safra" hidden>
            <input class="campo__controle" id="cp-nova-safra" type="text" placeholder="Nome da safra (ex.: 26/27)"
                   aria-label="Nome da nova safra" autocomplete="off">
            <button class="botao botao--primario" type="button" data-acao="adicionar-safra">Adicionar</button>
            <button class="botao botao--secundario" type="button" data-acao="cancelar-safra">Cancelar</button>
          </div>
        </div>

        ${campoLista('empresa', 'Empresa', 'Selecione uma empresa', DADOS.empresas)}
        ${campoLista('fazenda', 'Fazenda', 'Selecione uma fazenda', DADOS.fazendas)}
        <p class="campo__erro" id="cp-erro-duplicado" role="alert" hidden></p>
        ${campoLista('cultura', 'Cultura', 'Selecione uma cultura', DADOS.culturas)}

        <fieldset class="inicios">
          <legend class="inicios__pergunta">Como deseja iniciar o plano?</legend>
          <div class="inicios__grade">
            ${INICIOS.map(cardInicio).join('')}
          </div>
        </fieldset>

        <div class="importar" hidden>
          <label class="campo__rotulo" for="cp-arquivo">Arquivo exportado pelo Plano de Safra (.xlsx) ${asterisco()}</label>
          <input class="importar__arquivo" id="cp-arquivo" type="file" accept=".xlsx">
          <p class="erro-campo" id="cp-erro-arquivo" role="alert" hidden></p>
          <p class="importar__ok" id="cp-arquivo-ok" hidden></p>
          <div class="importar__diferencas" id="cp-diferencas" role="alert" hidden></div>
        </div>
      </div>

      <div class="modal__rodape">
        <p class="modal__rodape-erro" id="cp-erro-continuar" role="alert" hidden>
          Preencha os campos obrigatórios.</p>
        <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
        <button class="botao botao--primario" type="submit" aria-disabled="true">Continuar para as operações</button>
      </div>
    </form>
  `, { classe: 'modal--formulario' });

  const form = modal.elemento.querySelector('form');
  const selectSafra = form.elements.safra;
  const caixaNovaSafra = form.querySelector('.nova-safra');
  const inputNovaSafra = form.querySelector('#cp-nova-safra');
  const NOVA_SAFRA = '__nova-safra__';
  let safraAnterior = '';
  const erroDuplicado = form.querySelector('#cp-erro-duplicado');
  const botaoContinuar = form.querySelector('[type="submit"]');
  const erroContinuar = form.querySelector('#cp-erro-continuar');
  const OBRIGATORIOS = ['safra', 'empresa', 'fazenda', 'cultura'];
  let tentouContinuar = false;  // os avisos de obrigatório só aparecem depois de tentar continuar

  preencherSafras();
  selectSafra.focus();

  // ----- Importar XLSX -----
  // Os campos do modal são conferidos com os do arquivo; se forem diferentes, a pessoa escolhe quais usar.
  const caixaImportar = form.querySelector('.importar');
  const inputArquivo = form.querySelector('#cp-arquivo');
  const erroArquivo = form.querySelector('#cp-erro-arquivo');
  const okArquivo = form.querySelector('#cp-arquivo-ok');
  const caixaDiferencas = form.querySelector('#cp-diferencas');
  const CAMPOS = [['safra', 'Safra'], ['empresa', 'Empresa'], ['fazenda', 'Fazenda'], ['cultura', 'Cultura']];
  let importado = null;      // arquivo lido: { contexto, germinacao, abas }
  let manterModal = false;   // a pessoa escolheu "Manter os do modal"

  function importando() { return form.elements.inicio.value === 'importar'; }

  function mostrarImportar() {
    caixaImportar.hidden = !importando();
    conferirArquivo();
  }

  inputArquivo.addEventListener('change', async () => {
    importado = null; manterModal = false;
    erroArquivo.hidden = true; okArquivo.hidden = true; caixaDiferencas.hidden = true;
    const arquivo = inputArquivo.files[0];
    if (!arquivo) return;
    const lido = await ArquivoPlano.ler(arquivo);
    if (lido.erro) { erroArquivo.textContent = lido.erro; erroArquivo.hidden = false; return; }
    importado = lido;
    const c = lido.contexto;
    okArquivo.textContent = `Planejamento da safra ${c.safra} · ${c.empresa} · Fazenda ${c.fazenda} · ${c.cultura}`;
    okArquivo.hidden = false;
    // Campos ainda vazios no modal recebem o valor do arquivo
    CAMPOS.forEach(([campo]) => { if (!form.elements[campo].value) escolher(campo, c[campo]); });
    conferirArquivo();
    atualizar();
  });

  // Coloca o valor na lista (se não existir, entra nela) e escolhe
  function escolher(campo, valor) {
    if (!valor) return;
    const select = form.elements[campo];
    if (campo === 'safra') {
      if (!DADOS.safras.includes(valor)) DADOS.safras.push(valor);
      preencherSafras(valor);
      return;
    }
    if (![...select.options].some((o) => o.value === valor)) select.add(new Option(valor, valor));
    select.value = valor;
  }

  function diferencas() {
    if (!importado || !importando()) return [];
    return CAMPOS.filter(([campo]) => form.elements[campo].value && form.elements[campo].value !== importado.contexto[campo]);
  }

  function conferirArquivo() {
    const lista = manterModal ? [] : diferencas();
    caixaDiferencas.hidden = !lista.length;
    if (!lista.length) { caixaDiferencas.innerHTML = ''; return; }
    const fora = form.elements.fazenda.value ? ArquivoPlano.talhoesFora(importado, form.elements.fazenda.value) : [];
    const esc = Util.escapar;
    caixaDiferencas.innerHTML = `
      <p class="importar__titulo">${Icones.alerta} O arquivo é de outro plano</p>
      <ul class="importar__lista">
        ${lista.map(([campo, rotulo]) => `<li>${rotulo}: no modal <strong>${esc(form.elements[campo].value)}</strong> · no arquivo <strong>${esc(importado.contexto[campo])}</strong></li>`).join('')}
      </ul>
      ${fora.length ? `<p class="importar__aviso">Mantendo os do modal, ${fora.length} ${fora.length === 1 ? 'talhão do arquivo não existe' : 'talhões do arquivo não existem'} na Fazenda ${esc(form.elements.fazenda.value)} e ${fora.length === 1 ? 'fica' : 'ficam'} de fora (${fora.map(esc).join(', ')}).</p>` : ''}
      <div class="importar__botoes">
        <button class="botao botao--secundario botao--p" type="button" data-acao="usar-arquivo">Usar os do arquivo</button>
        <button class="botao botao--secundario botao--p" type="button" data-acao="manter-modal">Manter os do modal</button>
      </div>`;
  }

  form.addEventListener('click', (e) => {
    const acao = e.target.closest('[data-acao]')?.dataset.acao;
    if (acao === 'usar-arquivo') {
      CAMPOS.forEach(([campo]) => escolher(campo, importado.contexto[campo]));
      conferirArquivo(); atualizar();
    }
    if (acao === 'manter-modal') { manterModal = true; conferirArquivo(); atualizar(); }
  });

  // ----- Criar nova safra (última opção da lista de safras) -----
  function preencherSafras(selecionada = '') {
    selectSafra.innerHTML = opcoes('Selecione uma safra', DADOS.safras, selecionada) +
      `<option value="${NOVA_SAFRA}">+ Criar nova safra</option>`;
    safraAnterior = selecionada;
  }

  // Escolher "+ Criar nova safra" volta a lista ao valor anterior e abre o campo do nome.
  // Registrado no próprio select, antes da validação do formulário.
  selectSafra.addEventListener('change', () => {
    if (selectSafra.value === NOVA_SAFRA) {
      selectSafra.value = safraAnterior;
      abrirNovaSafra();
    } else {
      safraAnterior = selectSafra.value;
    }
  });

  function abrirNovaSafra() {
    caixaNovaSafra.hidden = false;
    inputNovaSafra.value = '';
    inputNovaSafra.focus();
  }

  function fecharNovaSafra() {
    caixaNovaSafra.hidden = true;
  }

  function adicionarSafra() {
    const nome = inputNovaSafra.value.trim();
    if (!nome) { inputNovaSafra.focus(); return; }
    // Se o nome já existe, só seleciona a safra existente
    if (!DADOS.safras.includes(nome)) DADOS.safras.push(nome);
    preencherSafras(nome);
    fecharNovaSafra();
    selectSafra.focus();
    atualizar();
  }

  form.addEventListener('click', (e) => {
    const acao = e.target.closest('[data-acao]')?.dataset.acao;
    if (acao === 'adicionar-safra') adicionarSafra();
    if (acao === 'cancelar-safra') { fecharNovaSafra(); selectSafra.focus(); }
  });

  inputNovaSafra.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); adicionarSafra(); }
    if (e.key === 'Escape') { e.stopPropagation(); fecharNovaSafra(); selectSafra.focus(); }
  });

  // ----- Validação: quatro campos preenchidos e um plano por safra e fazenda -----
  function valores() {
    const f = form.elements;
    return {
      safra: f.safra.value,
      empresa: f.empresa.value,
      fazenda: f.fazenda.value,
      cultura: f.cultura.value,
      inicio: f.inicio.value
    };
  }

  function atualizar() {
    const v = valores();
    const duplicado = v.safra && v.fazenda &&
      DADOS.planos.some((p) => p.safra === v.safra && p.fazenda === v.fazenda);

    erroDuplicado.hidden = !duplicado;
    erroDuplicado.textContent = duplicado
      ? `Já existe um plano da safra ${v.safra} para a fazenda ${v.fazenda}.` // textContent: não precisa escapar
      : '';
    form.elements.fazenda.classList.toggle('campo__controle--erro', !!duplicado);

    const faltando = OBRIGATORIOS.filter((nome) => !v[nome]);
    // O botão parece desabilitado, mas continua clicável para explicar o que falta
    botaoContinuar.setAttribute('aria-disabled', faltando.length || duplicado ? 'true' : 'false');
    mostrarObrigatorios(tentouContinuar ? faltando : []);
    return { faltando, duplicado };
  }

  // "Preenchimento obrigatório" abaixo de cada campo vazio e a mensagem ao lado dos botões
  function mostrarObrigatorios(faltando) {
    OBRIGATORIOS.forEach((nome) => {
      const vazio = faltando.includes(nome);
      form.querySelector(`#cp-erro-${nome}`).hidden = !vazio;
      form.elements[nome].toggleAttribute('aria-invalid', vazio);
    });
    erroContinuar.hidden = !faltando.length;
  }

  form.addEventListener('change', (e) => {
    if (e.target.name === 'inicio') mostrarImportar();
    else if (e.target !== inputArquivo) { manterModal = false; conferirArquivo(); }
    atualizar();
  });

  // ----- Continuar para as operações -----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    tentouContinuar = true;
    const { faltando, duplicado } = atualizar();
    if (faltando.length) { form.elements[faltando[0]].focus(); return; }
    if (duplicado) { form.elements.fazenda.focus(); return; }
    if (importando()) {
      // Importar: precisa do arquivo lido e, se houver diferença, da escolha da pessoa
      if (!importado) {
        if (erroArquivo.hidden) { erroArquivo.textContent = 'Escolha o arquivo exportado pelo Plano de Safra.'; erroArquivo.hidden = false; }
        inputArquivo.focus(); return;
      }
      if (!caixaDiferencas.hidden) { caixaDiferencas.querySelector('button').focus(); return; }
    }
    const v = valores();
    modal.fechar();
    aoCriar({
      safra: v.safra,
      empresa: v.empresa,
      fazenda: v.fazenda,
      cultura: v.cultura,
      inicio: v.inicio,
      ...(importando() ? { importado } : {})
    });
  });

  // ----- Pedaços de HTML -----
  // Com uma opção só (ex.: cultura, por enquanto só Soja), ela já vem escolhida
  function campoLista(nome, rotulo, textoVazio, itens) {
    return `
      <div class="campo">
        <label class="campo__rotulo" for="cp-${nome}">${rotulo} ${asterisco()}</label>
        <select class="campo__controle" id="cp-${nome}" name="${nome}" required>
          ${opcoes(textoVazio, itens, itens.length === 1 ? itens[0] : '')}
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

  function opcoes(textoVazio, itens, selecionado = '') {
    return `<option value="" disabled ${selecionado ? '' : 'selected'}>${textoVazio}</option>` +
      itens.map((item) =>
        `<option value="${Util.escapar(item)}" ${item === selecionado ? 'selected' : ''}>${Util.escapar(item)}</option>`).join('');
  }

  function cardInicio(c) {
    return `
      <label class="card-inicio ${c.emBreve ? 'card-inicio--desabilitado' : ''}">
        <input class="card-inicio__radio" type="radio" name="inicio" value="${c.valor}"
               ${c.valor === 'modelo' ? 'checked' : ''} ${c.emBreve ? 'disabled' : ''}>
        <span class="card-inicio__icone">${c.icone}</span>
        <span class="card-inicio__textos">
          <span class="card-inicio__titulo">
            ${c.titulo}
            ${c.emBreve ? '<span class="selo">Em breve</span>' : ''}
          </span>
          <span class="card-inicio__texto">${c.texto}</span>
        </span>
      </label>
    `;
  }
};
