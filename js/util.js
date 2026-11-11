/*
 * Cálculos e formatação usados por várias telas.
 */
window.Util = {
  // Ciclo da variedade (dias) na região da fazenda (11/11/2026; DECISOES 4.3): o ciclo do cadastro (Norte) mais o ajuste da
  // região (DADOS.regiaoFazenda e DADOS.ajusteCicloRegiao). Sem ciclo no cadastro: null. Sem fazenda: o ciclo do cadastro
  ajusteCicloFazenda(fazenda) { return (DADOS.ajusteCicloRegiao || {})[(DADOS.regiaoFazenda || {})[fazenda]] || 0; },
  cicloVariedade(v, fazenda) {
    if (!v || v.ciclo === null || v.ciclo === undefined || v.ciclo === '') return null;
    return v.ciclo + Util.ajusteCicloFazenda(fazenda);
  },
  // Nível Empresa à mostra? (DADOS.usaEmpresa; escondido no protótipo desde 09/11/2026)
  comEmpresa() { return DADOS.usaEmpresa !== false; },
  // Listas de filtros, colunas e níveis ([chave, rótulo, ...]): sem o nível Empresa, tira a entrada 'empresa'
  semEmpresa(lista) { return lista.filter((x) => (Array.isArray(x) ? x[0] : x) !== 'empresa' || Util.comEmpresa()); },
  // Planilha (linhas, com o título na primeira): sem o nível Empresa, tira a coluna "Empresa"
  semColunaEmpresa(linhas) {
    const i = Util.comEmpresa() ? -1 : linhas[0].indexOf('Empresa');
    return i < 0 ? linhas : linhas.map((l) => l.filter((_, j) => j !== i));
  },
  // Cor da variedade (Mapa do Plantio e gráfico dos Indicadores): paleta categórica, uma cor por variedade, na ordem
  // do cadastro da cultura (a cor segue a variedade, não a posição); fora da paleta, cinza-azulado
  CORES_VARIEDADE: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  corVariedade(nome, cultura) {
    const i = DADOS.variedades.filter((v) => v.cultura === cultura).findIndex((v) => v.nome === nome);
    return i >= 0 && i < Util.CORES_VARIEDADE.length ? Util.CORES_VARIEDADE[i] : '#6b7c8f';
  },
  // Empresa de uma fazenda (DADOS.fazendasPorEmpresa); sem cadastro, ''
  empresaDaFazenda(fazenda) {
    return Object.keys(DADOS.fazendasPorEmpresa || {}).find((e) => DADOS.fazendasPorEmpresa[e].includes(fazenda)) || '';
  },

  // Talhões incluídos no plano (Criar Plano; depois, Editar talhões), da versão aberta ou da versão indicada.
  // Sem a lista: todos os da fazenda. A área é a planejada no plano (09/11/2026: Criar Plano e Editar talhões; vale
  // em tudo: quantidades, Orçamento, OS); a do cadastro fica em areaCadastrada.
  talhoesPlano(plano, versao) {
    const todos = DADOS.talhoes[plano.fazenda] || [];
    const nomes = versao && window.Versoes ? Versoes.talhoes(plano, versao) : plano.talhoes;
    const areas = (versao && window.Versoes ? Versoes.areas(plano, versao) : plano.areas) || {};
    return (nomes ? todos.filter((t) => nomes.includes(t.nome)) : todos)
      .map((t) => (areas[t.nome] !== undefined && areas[t.nome] !== null ? { ...t, area: areas[t.nome], areaCadastrada: t.area } : t));
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

  // Safras para o filtro Safra, pelo cadastro: da mais recente para a mais antiga (no mesmo ano agrícola, a safrinha
  // vem antes da safra): "27/27", "26/27", "26/26", "25/26"
  ordenarSafras(nomes) {
    const safrinha = (s) => { const [a, b] = String(s).split('/'); return a === b; };
    return [...new Set(nomes)].sort((a, b) => (Util.anoAgricola(b) || 0) - (Util.anoAgricola(a) || 0)
      || safrinha(b) - safrinha(a) || b.localeCompare(a));
  },

  // Posição da safra na ordem de ordenarSafras (mais recente primeiro; no mesmo ano, a safrinha antes da safra),
  // para ordenar tabelas pela coluna Safra: a safra aparece só pelo número ("26/27"), sem Safra/Safrinha na frente
  posicaoSafra(safra, todas) {
    return Util.ordenarSafras(todas).indexOf(safra);
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
