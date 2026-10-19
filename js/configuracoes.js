/*
 * Configurações (primeira opção do menu do usuário, no rodapé do menu lateral): modal com as seções à esquerda (por enquanto, Aparência) e,
 * em Aparência, a escolha Claro | Escuro. O tema fica em <html data-tema="escuro"> e vale para todas as telas.
 * A escolha não é guardada: ao recarregar a página, volta ao claro (como os demais dados do protótipo).
 */
window.Configuracoes = (function () {
  const SOL = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const LUA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>';

  const escuro = () => document.documentElement.dataset.tema === 'escuro';
  function usarTema(tema) {
    if (tema === 'escuro') document.documentElement.dataset.tema = 'escuro';
    else delete document.documentElement.dataset.tema;
  }

  function opcoes() {
    return [['claro', 'Claro', SOL, !escuro()], ['escuro', 'Escuro', LUA, escuro()]].map(([id, nome, icone, ativo]) => `
      <button class="cfg-tema ${ativo ? 'cfg-tema--ativo' : ''}" type="button" data-tema="${id}" aria-pressed="${ativo}">${icone}${nome}</button>`).join('');
  }

  function abrir() {
    const modal = Modal.abrir(`
      <div class="cfg__topo">
        <h2 class="modal__titulo" id="modal-titulo">Configurações</h2>
        <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
      </div>
      <div class="cfg">
        <nav class="cfg__secoes" aria-label="Seções das configurações">
          <button class="cfg__secao cfg__secao--ativa" type="button" aria-current="page">${SOL}Aparência</button>
        </nav>
        <section class="cfg__painel" aria-labelledby="cfg-aparencia">
          <h3 class="cfg__titulo" id="cfg-aparencia">Aparência</h3>
          <p class="cfg__texto">Escolha como as telas aparecem.</p>
          <div class="cfg__temas" role="group" aria-label="Tema">${opcoes()}</div>
        </section>
      </div>`, { classe: 'modal--configuracoes' });
    const temas = modal.elemento.querySelector('.cfg__temas');
    temas.addEventListener('click', (e) => {
      const b = e.target.closest('[data-tema]');
      if (!b) return;
      usarTema(b.dataset.tema);
      temas.innerHTML = opcoes();
      temas.querySelector(`[data-tema="${b.dataset.tema}"]`).focus();
    });
    temas.querySelector('.cfg-tema--ativo').focus();
  }

  return { abrir, usarTema };
})();
