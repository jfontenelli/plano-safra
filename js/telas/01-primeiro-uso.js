/*
 * Tela 01 — Primeiro uso (docs/telas/01-primeiro-uso.md)
 * Aparece no menu "Plano de Safra" quando ainda não existe nenhum plano.
 */
window.Telas = window.Telas || {};

window.Telas.primeiroUso = function () {
  return `
    <header class="cabecalho">
      <h1 class="cabecalho__titulo">Plano de Safra</h1>
    </header>
    <section class="primeiro-uso">
      ${ilustracao()}
      <h2 class="primeiro-uso__titulo">Comece o planejamento da sua safra</h2>
      <p class="primeiro-uso__texto">
        O Plano de Safra organiza as necessidades de compra de insumos, gera o Calendário Agrícola
        e, após a aprovação, cria automaticamente as Ordens de Serviço.
      </p>
      <button class="botao botao--primario botao--grande" type="button" data-acao="criar-plano">
        <svg class="botao__icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        Criar Plano Safra
      </button>
    </section>
  `;

  // Broto sobre o campo, com nuvens. Feito em SVG para não depender de arquivo de imagem.
  function ilustracao() {
    return `
      <svg class="primeiro-uso__ilustracao" viewBox="0 0 320 240" role="img" aria-label="Broto nascendo no campo">
        <circle cx="160" cy="112" r="96" fill="#eef5f0"/>
        <g fill="#e2e8e4">
          <ellipse cx="70" cy="70" rx="22" ry="9"/>
          <ellipse cx="88" cy="64" rx="16" ry="11"/>
          <ellipse cx="248" cy="96" rx="26" ry="9"/>
          <ellipse cx="264" cy="89" rx="15" ry="11"/>
        </g>
        <path d="M42 176c34-30 80-38 118-30 40 8 80 6 118-12 6 16-2 30-18 38-52 26-186 30-218 6Z" fill="#cfe5d7"/>
        <path d="M60 196c46-30 104-36 150-26 30 6 58 2 80-8-8 30-60 52-132 52-50 0-82-8-98-18Z" fill="#b7d8c3"/>
        <path d="M96 204c40-14 92-18 140-10M120 214c34-8 72-10 104-4" fill="none" stroke="#e6f2ec" stroke-width="3" stroke-linecap="round"/>
        <path d="M160 168v-58" stroke="#187a4f" stroke-width="5" stroke-linecap="round"/>
        <path d="M160 118c-2-26 14-44 46-48 2 30-16 48-46 48Z" fill="#1d8a58"/>
        <path d="M159 128c-2-22-16-36-42-38-1 24 14 38 42 38Z" fill="#26a06a"/>
      </svg>
    `;
  }
};
