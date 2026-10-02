/*
 * Janela modal reutilizável (fundo escurecido + caixa central).
 * Fecha pela tecla Esc, clicando fora, em qualquer elemento com data-fechar
 * ou ao trocar de tela pelo menu.
 */
window.Modal = {
  abrir(html, opcoes = {}) {
    const fundo = document.createElement('div');
    fundo.className = 'modal-fundo';
    fundo.innerHTML = `<div class="modal ${opcoes.classe || ''}" role="dialog" aria-modal="true"
                            aria-labelledby="modal-titulo">${html}</div>`;

    const focoAnterior = document.activeElement;

    function fechar() {
      document.removeEventListener('keydown', aoTeclar);
      window.removeEventListener('hashchange', fechar);
      fundo.remove();
      if (focoAnterior && document.body.contains(focoAnterior)) focoAnterior.focus();
    }

    function aoTeclar(e) {
      if (e.key === 'Escape') fechar();
    }

    fundo.addEventListener('click', (e) => {
      if (e.target === fundo || e.target.closest('[data-fechar]')) fechar();
    });
    document.addEventListener('keydown', aoTeclar);
    window.addEventListener('hashchange', fechar);

    document.body.appendChild(fundo);
    return { elemento: fundo.firstElementChild, fechar };
  }
};
