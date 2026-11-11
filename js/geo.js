/*
 * Geometria dos talhões (10/11/2026): uma fonte só para o mapa do plano e para o menu Cadastros.
 * DADOS.geometriaTalhoes[fazenda][talhão] = [[lat, lng], ...] (um anel). As fazendas de exemplo começam com o
 * desenho fictício (DADOS.geometriaFazendas, gerado pela área); a importação de SHP/KML/KMZ grava aqui.
 */
window.Geo = (function () {
  const M_POR_GRAU = 111320;

  function gerar(fazenda) {
    const g = (DADOS.geometriaFazendas || {})[fazenda];
    const talhoes = DADOS.talhoes[fazenda] || [];
    const saida = {};
    if (!g) return saida;
    const [lat0, lng0] = g.origem;
    const mPorGrauLng = M_POR_GRAU * Math.cos((lat0 * Math.PI) / 180);
    const giro = (g.giro * Math.PI) / 180;
    const D = g.profundidade; const carreador = 25;
    const latLng = (x, y) => {
      const xr = x * Math.cos(giro) - y * Math.sin(giro);
      const yr = x * Math.sin(giro) + y * Math.cos(giro);
      return [lat0 + yr / M_POR_GRAU, lng0 + xr / mPorGrauLng];
    };
    g.linhas.forEach((linha, i) => {
      let x = 0;
      const y = -i * (D + carreador);
      const desvio = (g.inclinacao || 0) * D;
      linha.forEach((nome) => {
        const t = talhoes.find((tt) => tt.nome === nome);
        if (!t) return;
        const largura = (t.area * 10000) / D;
        saida[nome] = [[x, y], [x + largura, y], [x + largura + desvio, y - D], [x + desvio, y - D]].map(([a, b]) => latLng(a, b));
        x += largura + carreador;
      });
    });
    return saida;
  }

  function daFazenda(fazenda) {
    DADOS.geometriaTalhoes = DADOS.geometriaTalhoes || {};
    if (!DADOS.geometriaTalhoes[fazenda]) DADOS.geometriaTalhoes[fazenda] = gerar(fazenda);
    return DADOS.geometriaTalhoes[fazenda];
  }

  // Área do anel em hectares (plano local em metros; suficiente para talhões)
  function areaHa(coords) {
    if (!coords || coords.length < 3) return 0;
    const lat0 = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const r = (lat0 * Math.PI) / 180;
    const ky = 111132.92 - 559.82 * Math.cos(2 * r) + 1.175 * Math.cos(4 * r);
    const kx = 111412.84 * Math.cos(r) - 93.5 * Math.cos(3 * r) + 0.118 * Math.cos(5 * r);
    let soma = 0;
    for (let i = 0; i < coords.length; i++) {
      const [y1, x1] = coords[i]; const [y2, x2] = coords[(i + 1) % coords.length];
      soma += (x1 * kx) * (y2 * ky) - (x2 * kx) * (y1 * ky);
    }
    return Math.abs(soma) / 2 / 10000;
  }

  function centro(coords) {
    const n = coords.length || 1;
    return [coords.reduce((s, c) => s + c[0], 0) / n, coords.reduce((s, c) => s + c[1], 0) / n];
  }

  // Como o mapa do plano espera: [{ talhao, area (do cadastro), coords, centro }], só dos talhões com geometria
  function poligonos(fazenda) {
    const g = daFazenda(fazenda);
    return (DADOS.talhoes[fazenda] || []).filter((t) => g[t.nome])
      .map((t) => ({ talhao: t.nome, area: t.area, coords: g[t.nome], centro: centro(g[t.nome]) }));
  }

  return { daFazenda, poligonos, areaHa, centro };
})();
