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
    broto:  svg('<path d="M12 21v-9"/><path d="M12 12c0-4 2.5-6.5 7-6.5 0 4.5-2.5 6.5-7 6.5Z"/><path d="M12 14c0-3.5-2.2-5.5-6.5-5.5 0 3.8 2.2 5.5 6.5 5.5Z"/>'),
    moedas: svg('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/><path d="M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/>'),
    grafico: svg('<path d="M4 20h16"/><rect x="6" y="12" width="3" height="6" rx=".5"/><rect x="11" y="8" width="3" height="10" rx=".5"/><rect x="16" y="4" width="3" height="14" rx=".5"/>'),
    seta:   svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    voltar: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    demonstracao: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M10 8l4 2-4 2Z"/><path d="M8 20h8M12 16v4"/>'),
    copiar: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>')
  };
})();
