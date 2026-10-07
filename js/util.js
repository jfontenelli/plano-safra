/*
 * Cálculos e formatação usados por várias telas.
 */
window.Util = {
  // Área do plano = soma das áreas dos talhões que recebem ao menos uma operação (ha)
  areaPlano(plano) {
    const noPlano = new Set();
    (plano.grupos || []).forEach((g) => g.operacoes.forEach((op) =>
      [...Object.keys(op.talhoes), ...Object.keys(op.plantio || {})].forEach((t) => noPlano.add(t))));
    return (DADOS.talhoes[plano.fazenda] || [])
      .filter((t) => noPlano.has(t.nome))
      .reduce((soma, t) => soma + t.area, 0);
  },

  // Texto "0,40" ou "0.40" → 0.4; vazio ou inválido → null
  numero(texto) {
    let limpo = String(texto ?? '').trim();
    // Com vírgula, o ponto é separador de milhar ("1.250,5"); sem vírgula, o ponto é decimal ("0.40")
    if (limpo.includes(',')) limpo = limpo.replace(/\./g, '').replace(',', '.');
    if (limpo === '' || limpo === '-') return null;
    const n = Number(limpo);
    return Number.isFinite(n) ? n : null;
  },

  // 0.4 → "0,40" (doses); null → ''
  dose(valor) {
    if (valor === null || valor === undefined) return '';
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  },

  // Compara textos sem diferenciar maiúsculas e acentos
  normalizar(texto) {
    return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
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
