/*
 * Janela modal reutilizável (fundo escurecido + caixa central).
 * Pode abrir um modal por cima de outro.
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

    // Com um modal aberto por cima de outro, o Esc fecha só o de cima
    function aoTeclar(e) {
      const abertos = document.querySelectorAll('.modal-fundo');
      if (e.key === 'Escape' && abertos[abertos.length - 1] === fundo) fechar();
    }

    fundo.addEventListener('click', (e) => {
      if (e.target === fundo || e.target.closest('[data-fechar]')) fechar();
    });
    document.addEventListener('keydown', aoTeclar);
    window.addEventListener('hashchange', fechar);

    document.body.appendChild(fundo);
    return { elemento: fundo.firstElementChild, fechar };
  },

  /*
   * Pergunta com botões. botoes: [{ rotulo, classe ('primario' | 'secundario' | 'perigo'), acao }]
   * O primeiro botão "secundario" sem ação funciona como Cancelar.
   */
  confirmar({ titulo, texto, botoes }) {
    const modal = Modal.abrir(`
      <div class="modal__corpo">
        <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
        <h2 class="modal__titulo" id="modal-titulo">${titulo}</h2>
        ${texto ? `<p class="modal__texto">${texto}</p>` : ''}
      </div>
      <div class="modal__rodape">
        ${botoes.map((b, i) => `<button class="botao botao--${b.classe || 'secundario'}" type="button" data-botao="${i}">${b.rotulo}</button>`).join('')}
      </div>
    `, { classe: 'modal--pequeno' });

    modal.elemento.addEventListener('click', (e) => {
      const b = e.target.closest('[data-botao]');
      if (!b) return;
      modal.fechar();
      const acao = botoes[b.dataset.botao].acao;
      if (acao) acao();
    });
    modal.elemento.querySelector('.modal__rodape .botao:last-child').focus();
    return modal;
  }
};

/*
 * Mensagem curta no rodapé da tela ("Recomendação aplicada em 11 talhões"),
 * com ação opcional (ex.: Desfazer). Some sozinha depois de alguns segundos.
 */
window.Aviso = {
  mostrar(texto, { acao, aoAgir } = {}) {
    document.querySelector('.aviso')?.remove();
    const aviso = document.createElement('div');
    aviso.className = 'aviso';
    aviso.setAttribute('role', 'status');
    aviso.innerHTML = `<span>${texto}</span>${acao ? `<button class="aviso__acao" type="button">${acao}</button>` : ''}`;
    document.body.appendChild(aviso);
    const sumir = () => aviso.remove();
    const tempo = setTimeout(sumir, acao ? 7000 : 4000);
    aviso.querySelector('.aviso__acao')?.addEventListener('click', () => {
      clearTimeout(tempo); sumir(); aoAgir();
    });
  }
};
