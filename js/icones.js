/*
 * Ícones em SVG usados nas telas (traço, herdam a cor do texto).
 */
window.Icones = (function () {
  const svg = (conteudo) =>
    `<svg class="icone" viewBox="0 0 24 24" aria-hidden="true">${conteudo}</svg>`;

  return {
    limpar: svg('<path d="M20 11a8 8 0 0 0-14.9-4M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4"/>'),
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
    lixeira: svg('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'),
    mapa:   svg('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2Z"/><path d="M9 4v14M15 6v14"/>'),
    talhoes: svg('<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>'),
    anterior: svg('<path d="M15 6l-6 6 6 6"/>'),
    proxima: svg('<path d="M9 6l6 6-6 6"/>'),
    abaixo: svg('<path d="M6 9l6 6 6-6"/>'),
    documento:  svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>'),
    engrenagem: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'),
    info:   svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    alerta: svg('<path d="M12 3l10 18H2Z"/><path d="M12 10v5M12 18h.01"/>'),
    busca:  svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
    recolher: svg('<path d="M11 6l-6 6 6 6M19 6l-6 6 6 6"/>'),
    expandir: svg('<path d="M13 6l6 6-6 6M5 6l6 6-6 6"/>'),
    // Painel do talhão: ampliar (setas diagonais para fora) e reduzir (setas diagonais para dentro)
    ampliar: svg('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
    reduzir: svg('<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>'),
    certo:  svg('<path d="M5 12l5 5 9-10"/>'),
    cadeado: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    casa:   svg('<path d="M3 20h18"/><path d="M5 20V9l7-5 7 5v11"/><path d="M10 20v-6h4v6"/>'),
    copiar: svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
    // Monitoramento › Aplicações: aplicação pendente (exclamação no círculo) e futura (calendário com relógio)
    pendente: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>'),
    futura: svg('<path d="M11 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M4 10h14M8 3v4M14 3v4"/><circle cx="17" cy="17" r="4"/><path d="M17 15.5V17l1 1"/>'),
    relogio: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    calendario: svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
    ordenar: svg('<path d="M8 10l4-4 4 4M8 14l4 4 4-4"/>'),
    acima: svg('<path d="M8 14l4-4 4 4"/>'),
    // Central de Operações: balão (justificativas)
    balao: svg('<path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/>'),
    funil: svg('<path d="M4 5h16l-6 8v5l-4 2v-7Z"/>'),
    baixar: svg('<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 19h14"/>'),
    alfinete: svg('<path d="M12 17v5"/><path d="M9 4h6l-1 6 3 3v2H7v-2l3-3Z"/>'),
    mais_opcoes: svg('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>')
  };
})();
