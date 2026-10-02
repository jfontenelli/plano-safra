/*
 * Ícones em SVG usados nas telas (traço, herdam a cor do texto).
 */
window.Icones = (function () {
  const svg = (conteudo) =>
    `<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">${conteudo}</svg>`;

  return {
    fechar: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    mais:   svg('<path d="M12 5v14M5 12h14"/>'),
    lista:  svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h1M12 9h4M8 12h1M12 12h4M8 15h1M12 15h4"/>'),
    lapis:  svg('<path d="M4 20l1-4L16 5a2 2 0 0 1 3 3L8 19Z"/><path d="M14 7l3 3"/>'),
    planilha: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9.5 12.5l5 5M14.5 12.5l-5 5"/>'),
    copiar: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>')
  };
})();
