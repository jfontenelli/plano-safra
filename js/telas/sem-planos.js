/*
 * Planejamento, Orçamento, Calendário Agrícola, Central OS e Planejado x Executado sem nenhum plano cadastrado (docs/DECISOES.md, 4.0):
 * convite para criar o primeiro plano.
 */
window.Telas = window.Telas || {};

window.Telas.semPlanos = function (item) {
  const TEXTO_PLANO = 'O Plano de Safra organiza as necessidades de compra de insumos, gera o Calendário Agrícola e, '
    + 'a partir da versão publicada, cria automaticamente as Ordens de Serviço.';
  const ITENS = {
    planejamento: { titulo: 'Planejamento', alvo: 'o planejamento', texto: TEXTO_PLANO, icone: Icones.lista },
    calendario:   { titulo: 'Calendário Agrícola', alvo: 'o Calendário Agrícola', texto: TEXTO_PLANO, icone: Icones.calendario },
    'central-os': { titulo: 'Central OS', alvo: 'a Central OS', texto: TEXTO_PLANO, icone: Icones.documento },
    'planejado-executado': { titulo: 'Operações Agrícolas', alvo: 'as Operações Agrícolas', texto: TEXTO_PLANO, icone: Icones.calendario },
    orcamento:    { titulo: 'Orçamento de Insumos', alvo: 'o Orçamento de Insumos',
                    icone: '<svg viewBox="0 0 24 24"><path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
                    texto: 'O plano organiza a necessidade de insumos por safra, empresa, fazenda e cultura. Depois de criado, ele abre aqui automaticamente.' }
  };
  const i = ITENS[item];
  return `
    <header class="cabecalho">
      <h1 class="cabecalho__titulo">${i.titulo}</h1>
    </header>
    <section class="em-construcao sem-planos">
      <div class="em-construcao__icone" aria-hidden="true">${i.icone}</div>
      <h2 class="em-construcao__titulo">Crie seu primeiro plano para visualizar ${i.alvo}</h2>
      <p class="em-construcao__texto">${i.texto}</p>
      <button class="botao botao--primario" type="button" data-acao="criar-plano">${Icones.mais} Criar Plano de Safra</button>
    </section>
  `;
};
