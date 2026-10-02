/*
 * Cálculos e formatação usados por várias telas.
 */
window.Util = {
  // Área do plano = soma das áreas dos seus talhões (ha)
  areaPlano(plano) {
    const talhoesFazenda = DADOS.talhoes[plano.fazenda] || [];
    return (plano.talhoes || []).reduce((soma, nome) => {
      const talhao = talhoesFazenda.find((t) => t.nome === nome);
      return soma + (talhao ? talhao.area : 0);
    }, 0);
  },

  // "24/25" < "25/26" < "26/27": a ordem do texto já é a ordem das safras
  safraMaisRecente(safras) {
    return [...safras].sort().pop() || '';
  },

  // 2430 → "2.430 ha"
  area(ha) {
    return `${ha.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ha`;
  },

  // 5733000 → "R$ 5,7 mi"; 850000 → "R$ 850 mil"; vazio → "—"
  reaisResumido(valor) {
    if (valor === null || valor === undefined) return '—';
    if (Math.abs(valor) >= 1e6) {
      return `R$ ${(valor / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
    }
    if (Math.abs(valor) >= 1e3) {
      return `R$ ${Math.round(valor / 1e3).toLocaleString('pt-BR')} mil`;
    }
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  // "2026-09-30" → "30/09/2026"
  data(iso) {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  },

  hojeISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  // Evita que textos digitados (ex.: nome de safra) quebrem o HTML
  escapar(texto) {
    return String(texto).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
};
