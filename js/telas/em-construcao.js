/*
 * Páginas provisórias para telas que ainda não foram construídas.
 */
window.Telas = window.Telas || {};

window.Telas.emConstrucao = function (titulo, acoes = '') {
  return `
    <header class="cabecalho">
      <h1 class="cabecalho__titulo">${titulo}</h1>
      ${acoes}
    </header>
    ${blocoEmConstrucao()}
  `;
};

/*
 * Tela 04 · Etapa 1 · Cadastro do plano (provisória).
 * Safra, Empresa e Fazenda ficam fixas no topo durante o plano.
 */
window.Telas.planoEmConstrucao = function (plano) {
  const esc = Util.escapar;
  return `
    <header class="cabecalho">
      <div>
        <a class="link-voltar" href="#/plano-safra">${Icones.voltar} Voltar para a lista</a>
        <h1 class="cabecalho__titulo">Plano de Safra</h1>
        <dl class="contexto-plano">
          <div><dt>Safra</dt><dd>${esc(plano.safra)}</dd></div>
          <div><dt>Empresa</dt><dd>${esc(plano.empresa)}</dd></div>
          <div><dt>Fazenda</dt><dd>${esc(plano.fazenda)}</dd></div>
        </dl>
      </div>
    </header>
    ${blocoEmConstrucao('Etapa 1 · Cadastro do plano')}
  `;
};

/* Versão modal da página provisória, para modais ainda não construídos. */
window.Telas.abrirModalEmConstrucao = function (titulo) {
  const modal = Modal.abrir(`
    <div class="modal__corpo">
      <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
      <h2 class="modal__titulo" id="modal-titulo">${titulo}</h2>
      ${blocoEmConstrucao()}
    </div>
    <div class="modal__rodape">
      <button class="botao botao--secundario" type="button" data-fechar>Fechar</button>
    </div>
  `);
  modal.elemento.querySelector('.modal__rodape [data-fechar]').focus();
};

function blocoEmConstrucao(subtitulo) {
  return `
    <section class="em-construcao">
      <div class="em-construcao__icone" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M3 20h18"/>
          <path d="M5 20V9l7-5 7 5v11"/>
          <path d="M10 20v-6h4v6"/>
        </svg>
      </div>
      ${subtitulo ? `<p class="em-construcao__subtitulo">${subtitulo}</p>` : ''}
      <h2 class="em-construcao__titulo">Em construção</h2>
      <p class="em-construcao__texto">Esta tela ainda não foi construída no protótipo.</p>
    </section>
  `;
}
