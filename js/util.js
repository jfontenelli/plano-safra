/*
 * Cálculos e formatação usados por várias telas.
 */
window.Util = {
  // Talhões incluídos no plano (Criar Plano; depois, Editar talhões), da versão aberta ou da versão indicada.
  // Sem a lista: todos os da fazenda.
  talhoesPlano(plano, versao) {
    const todos = DADOS.talhoes[plano.fazenda] || [];
    const nomes = versao && window.Versoes ? Versoes.talhoes(plano, versao) : plano.talhoes;
    return nomes ? todos.filter((t) => nomes.includes(t.nome)) : todos;
  },

  // Área de cultivo = soma das áreas dos talhões incluídos no plano (ha); sem talhões, null ("Pendente")
  areaCultivo(plano, versao) {
    const talhoes = Util.talhoesPlano(plano, versao);
    return talhoes.length ? talhoes.reduce((soma, t) => soma + t.area, 0) : null;
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

  // Cadastro da safra pelo nome ("26/27"). Safra sem cadastro (criada no modal, só com o nome): pela regra,
  // de 01/09 do primeiro ano a 31/08 do seguinte, e o Ano Agrícola é o primeiro ano. Safrinha ("27/27", os dois
  // anos iguais): no ano agrícola anterior (2026), com as datas dele
  cadastroSafra(nome) {
    const c = (DADOS.cadastroSafras || []).find((s) => s.nome === nome);
    if (c) return c;
    const [a, b] = String(nome).split('/').map((x) => 2000 + Number(x));
    if (!Number.isFinite(a)) return { nome, anoAgricola: null };
    const ano = a === b ? a - 1 : a;
    return { nome, descricao: a === b ? `${a}/${a}` : `${a}/${a + 1}`, apelido: String(a), inicio: `${ano}-09-01`, fim: `${ano + 1}-08-31`, anoAgricola: ano };
  },

  anoAgricola(safra) {
    return Util.cadastroSafra(safra).anoAgricola;
  },

  // Anos agrícolas dos planos, do mais antigo ao mais recente, em texto ("2026"), como nos filtros
  anosAgricolas(planos) {
    return [...new Set(planos.map((p) => Util.anoAgricola(p.safra)).filter(Boolean).map(String))].sort();
  },

  // Ano agrícola que os filtros mostram ao abrir: o de hoje (01/09 a 31/08) se tiver planos; senão, o mais recente
  // Ano agrícola mais recente com planos (Calendário Agrícola e Orçamento abrem nele)
  anoAgricolaMaisRecente(anos) {
    return anos[anos.length - 1] ?? '';
  },

  anoAgricolaInicial(anos) {
    const hoje = new Date();
    const atual = hoje.getMonth() >= 8 ? hoje.getFullYear() : hoje.getFullYear() - 1;
    return anos.includes(String(atual)) ? String(atual) : anos[anos.length - 1] ?? '';
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
