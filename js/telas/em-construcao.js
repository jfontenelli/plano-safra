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
      <div class="em-construcao__icone" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M3 20h18"/>
          <path d="M5 20V9l7-5 7 5v11"/>
          <path d="M10 20v-6h4v6"/>
        </svg>
      </div>
      <h2 class="em-construcao__titulo">Em construção</h2>
      <p class="em-construcao__texto">Esta tela ainda não foi construída no protótipo.</p>
    </section>
  `;
};
