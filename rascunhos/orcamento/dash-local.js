/*
 * Substitui o ambiente do dashboard do claude.ai para a página do Claude Design abrir direto no navegador:
 * dash.data, dash.calc, dash.onData, dash.params/setParams, dash.colors e dash.setLink, com os dados de
 * dados-design.js e os parâmetros iniciais do design.
 */
window.dash = (function () {
  const dados = window.DADOS_DESIGN;
  const INICIAIS = { ano: '2026', safra: 'todas', empresa: null, fazenda: null, cultura: null, ptax: 5.4,
    prod_Soja: 63, preco_Soja: 122, moeda_Soja: 'R$', prod_Milho: 110, preco_Milho: 55, moeda_Milho: 'R$' };
  let params = { ...INICIAIS };
  const calcs = {};
  const avisos = [];
  const linhas = (id) => {
    const c = calcs[id];
    if (!c) return dados[id] || [];
    if (!c.cache) c.cache = c.fn(...c.inputs.map(linhas));
    return c.cache;
  };
  const avisar = () => avisos.forEach((fn) => fn());
  return {
    data: (id) => ({ status: 'ok', data: linhas(id), refreshing: false, meta: [] }),
    calc: (id, opcoes) => { calcs[id] = opcoes; },
    onData: (fn) => { avisos.push(fn); fn(); },
    params: () => ({ ...params }),
    setParams: (p) => { params = { ...params, ...p }; avisar(); },
    resetParams: () => { params = { ...INICIAIS }; avisar(); },
    setLink: (nome) => history.replaceState(null, '', `#${nome}`),
    refresh: () => {},
    colors: ['#187a4f', '#c98a00', '#2f6fb0', '#8a5523', '#6b4fa0', '#2a9d8f', '#b5475a', '#7b8a82']
  };
})();
