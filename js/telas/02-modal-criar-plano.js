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
      texto: 'Importe um planejamento existente a partir de uma planilha.' },
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
          <label class="campo__rotulo" for="cp-safra">Safra</label>
          <select class="campo__controle" id="cp-safra" name="safra" required></select>
          <button class="link-acao" type="button" data-acao="nova-safra">${Icones.mais} Criar nova safra</button>
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
      </div>

      <div class="modal__rodape">
        <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
        <button class="botao botao--primario" type="submit" disabled>Continuar para o cadastro</button>
      </div>
    </form>
  `, { classe: 'modal--formulario' });

  const form = modal.elemento.querySelector('form');
  const selectSafra = form.elements.safra;
  const caixaNovaSafra = form.querySelector('.nova-safra');
  const inputNovaSafra = form.querySelector('#cp-nova-safra');
  const linkNovaSafra = form.querySelector('[data-acao="nova-safra"]');
  const erroDuplicado = form.querySelector('#cp-erro-duplicado');
  const botaoContinuar = form.querySelector('[type="submit"]');

  preencherSafras();
  selectSafra.focus();

  // ----- Criar nova safra -----
  function preencherSafras(selecionada = '') {
    selectSafra.innerHTML = opcoes('Selecione uma safra', DADOS.safras, selecionada);
  }

  function abrirNovaSafra() {
    caixaNovaSafra.hidden = false;
    linkNovaSafra.hidden = true;
    inputNovaSafra.value = '';
    inputNovaSafra.focus();
  }

  function fecharNovaSafra() {
    caixaNovaSafra.hidden = true;
    linkNovaSafra.hidden = false;
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
    if (acao === 'nova-safra') abrirNovaSafra();
    if (acao === 'adicionar-safra') adicionarSafra();
    if (acao === 'cancelar-safra') { fecharNovaSafra(); linkNovaSafra.focus(); }
  });

  inputNovaSafra.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); adicionarSafra(); }
    if (e.key === 'Escape') { e.stopPropagation(); fecharNovaSafra(); linkNovaSafra.focus(); }
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
      ? `Já existe um plano da safra ${v.safra} para a fazenda ${v.fazenda}.`
      : '';
    form.elements.fazenda.classList.toggle('campo__controle--erro', !!duplicado);

    botaoContinuar.disabled = !(v.safra && v.empresa && v.fazenda && v.cultura) || duplicado;
  }

  form.addEventListener('change', atualizar);

  // ----- Continuar para o cadastro -----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (botaoContinuar.disabled) return;
    const v = valores();
    modal.fechar();
    aoCriar({
      safra: v.safra,
      empresa: v.empresa,
      fazenda: v.fazenda,
      cultura: v.cultura,
      // Importar XLSX ainda não foi implementado: por enquanto segue como plano em branco
      inicio: v.inicio === 'importar' ? 'branco' : v.inicio
    });
  });

  // ----- Pedaços de HTML -----
  function campoLista(nome, rotulo, textoVazio, itens) {
    return `
      <div class="campo">
        <label class="campo__rotulo" for="cp-${nome}">${rotulo}</label>
        <select class="campo__controle" id="cp-${nome}" name="${nome}" required>
          ${opcoes(textoVazio, itens)}
        </select>
      </div>
    `;
  }

  function opcoes(textoVazio, itens, selecionado = '') {
    return `<option value="" disabled ${selecionado ? '' : 'selected'}>${textoVazio}</option>` +
      itens.map((item) =>
        `<option value="${item}" ${item === selecionado ? 'selected' : ''}>${item}</option>`).join('');
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
