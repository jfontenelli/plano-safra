/*
 * Página provisória para telas que ainda não foram construídas.
 */
window.Telas = window.Telas || {};

window.Telas.emConstrucao = function (titulo) {
  return `
    <header class="cabecalho">
      <h1 class="cabecalho__titulo">${titulo}</h1>
    </header>
    <section class="em-construcao">
      ${iconeEmConstrucao()}
      <h2 class="em-construcao__titulo">Em construção</h2>
      <p class="em-construcao__texto">Esta tela ainda não foi construída no protótipo.</p>
    </section>
  `;
};

/*
 * Versão modal da página provisória, para modais ainda não construídos.
 * Fecha pelo X, pelo botão Fechar, pela tecla Esc ou clicando fora.
 */
window.Telas.abrirModalEmConstrucao = function (titulo) {
  const fundo = document.createElement('div');
  fundo.className = 'modal-fundo';
  fundo.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
      <h2 class="modal__titulo" id="modal-titulo">${titulo}</h2>
      <div class="em-construcao em-construcao--modal">
        ${iconeEmConstrucao()}
        <h3 class="em-construcao__titulo">Em construção</h3>
        <p class="em-construcao__texto">Esta tela ainda não foi construída no protótipo.</p>
      </div>
      <div class="modal__rodape">
        <button class="botao botao--secundario" type="button" data-fechar>Fechar</button>
      </div>
    </div>
  `;

  const focoAnterior = document.activeElement;

  function fechar() {
    document.removeEventListener('keydown', aoTeclar);
    window.removeEventListener('hashchange', fechar);
    fundo.remove();
    if (focoAnterior) focoAnterior.focus();
  }

  function aoTeclar(e) {
    if (e.key === 'Escape') fechar();
  }

  fundo.addEventListener('click', (e) => {
    if (e.target === fundo || e.target.closest('[data-fechar]')) fechar();
  });
  document.addEventListener('keydown', aoTeclar);
  window.addEventListener('hashchange', fechar); // trocar de tela pelo menu fecha o modal

  document.body.appendChild(fundo);
  fundo.querySelector('.modal__rodape [data-fechar]').focus();
};

function iconeEmConstrucao() {
  return `
    <div class="em-construcao__icone" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M3 20h18"/>
        <path d="M5 20V9l7-5 7 5v11"/>
        <path d="M10 20v-6h4v6"/>
      </svg>
    </div>
  `;
}
