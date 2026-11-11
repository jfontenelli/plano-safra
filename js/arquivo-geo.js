
/*
 * Leitura de arquivos de talhões no navegador: shapefile (.zip ou .shp + .dbf + .prj), KML, KMZ e GeoJSON.
 * Devolve [{ atributos: { coluna: valor }, coords: [[lat, lng], ...] }] (o maior anel externo de cada feição).
 */
window.ArquivoGeo = (function () {
  const texto = (u8) => {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u8); } catch (e) { return new TextDecoder('latin1').decode(u8); }
  };

  async function lerZip(buf) {
    const u8 = new Uint8Array(buf); const dv = new DataView(buf);
    let i = u8.length - 22;
    while (i >= 0 && dv.getUint32(i, true) !== 0x06054b50) i--;
    if (i < 0) throw new Error('Não foi possível abrir o arquivo compactado.');
    const n = dv.getUint16(i + 10, true); let p = dv.getUint32(i + 16, true);
    const arquivos = {};
    for (let k = 0; k < n; k++) {
      const metodo = dv.getUint16(p + 10, true); const tam = dv.getUint32(p + 20, true);
      const nNome = dv.getUint16(p + 28, true); const nExtra = dv.getUint16(p + 30, true); const nCom = dv.getUint16(p + 32, true);
      const local = dv.getUint32(p + 42, true);
      const nome = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nNome));
      const ini = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true);
      const dados = u8.slice(ini, ini + tam);
      if (!nome.endsWith('/')) {
        arquivos[nome] = metodo === 0 ? dados
          : new Uint8Array(await new Response(new Blob([dados]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      }
      p += 46 + nNome + nExtra + nCom;
    }
    return arquivos;
  }

  // Shapefile: polígonos (tipos 5, 15 e 25). Cada feição = lista de anéis [[x, y], ...]
  function lerShp(u8) {
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    const formas = []; let p = 100;
    while (p + 12 <= u8.length) {
      const tam = dv.getInt32(p + 4, false) * 2; const ini = p + 8; const tipo = dv.getInt32(ini, true);
      if ([5, 15, 25].includes(tipo)) {
        const nPartes = dv.getInt32(ini + 36, true); const nPts = dv.getInt32(ini + 40, true);
        const partes = []; for (let k = 0; k < nPartes; k++) partes.push(dv.getInt32(ini + 44 + 4 * k, true));
        const base = ini + 44 + 4 * nPartes;
        formas.push(partes.map((a, k) => {
          const fim = k + 1 < nPartes ? partes[k + 1] : nPts; const anel = [];
          for (let j = a; j < fim; j++) anel.push([dv.getFloat64(base + 16 * j, true), dv.getFloat64(base + 16 * j + 8, true)]);
          return anel;
        }));
      } else formas.push(null);
      p = ini + tam;
    }
    return formas;
  }

  function lerDbf(u8) {
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    const n = dv.getUint32(4, true); const cab = dv.getUint16(8, true); const reg = dv.getUint16(10, true);
    const campos = [];
    for (let p = 32; p + 32 <= cab && u8[p] !== 0x0d; p += 32) {
      let fim = p; while (fim < p + 11 && u8[fim] !== 0) fim++;
      campos.push({ nome: texto(u8.subarray(p, fim)), tam: u8[p + 16] });
    }
    const linhas = [];
    for (let i = 0; i < n; i++) {
      let o = cab + i * reg + 1; const linha = {};
      campos.forEach((c) => { linha[c.nome] = texto(u8.subarray(o, o + c.tam)).trim(); o += c.tam; });
      linhas.push(linha);
    }
    return linhas;
  }

  // UTM → geográfica (WGS 84 / SIRGAS 2000)
  function utmParaLatLng(x, y, zona, sul) {
    const a = 6378137; const f = 1 / 298.257223563; const k0 = 0.9996;
    const e2 = f * (2 - f); const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2)); const ep2 = e2 / (1 - e2);
    const M = (sul ? y - 10000000 : y) / k0;
    const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));
    const f1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
      + (151 * e1 ** 3 / 96) * Math.sin(6 * mu) + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
    const N1 = a / Math.sqrt(1 - e2 * Math.sin(f1) ** 2); const T1 = Math.tan(f1) ** 2; const C1 = ep2 * Math.cos(f1) ** 2;
    const R1 = a * (1 - e2) / (1 - e2 * Math.sin(f1) ** 2) ** 1.5; const D = (x - 500000) / (N1 * k0);
    const lat = f1 - (N1 * Math.tan(f1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24
      + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
    const lng = (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / Math.cos(f1);
    return [lat * 180 / Math.PI, (zona * 6 - 183) + lng * 180 / Math.PI];
  }

  const areaAnel = (anel) => Math.abs(anel.reduce((s, c, i) => { const d = anel[(i + 1) % anel.length]; return s + c[0] * d[1] - d[0] * c[1]; }, 0)) / 2;
  // Fica com o maior anel e tira o ponto repetido do fechamento
  function maiorAnel(aneis) {
    const validos = aneis.map((a) => a.filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]))).filter((a) => a.length >= 3);
    if (!validos.length) return null;
    const anel = validos.reduce((m, a) => (areaAnel(a) > areaAnel(m) ? a : m));
    const [p, u] = [anel[0], anel[anel.length - 1]];
    return p[0] === u[0] && p[1] === u[1] ? anel.slice(0, -1) : anel;
  }

  function deShapefile(shp, dbf, prj) {
    const formas = lerShp(shp); const linhas = dbf ? lerDbf(dbf) : [];
    const zona = prj && /UTM[_ ]zone[_ ](\d{1,2})\s*([NS])?/i.exec(prj);
    const sul = zona && (/S/i.test(zona[2] || '') || /false_northing"?,\s*1(0{7})/i.test(prj) || /south/i.test(prj));
    const saida = [];
    formas.forEach((aneis, i) => {
      if (!aneis) return;
      let anel = maiorAnel(aneis); if (!anel) return;
      const projetado = anel.some(([x, y]) => Math.abs(x) > 180 || Math.abs(y) > 90);
      if (projetado && !zona) {
        throw new Error('O arquivo está em coordenadas projetadas e a zona UTM não foi identificada. Envie o .prj junto ou exporte em coordenadas geográficas (SIRGAS 2000 ou WGS 84).');
      }
      anel = projetado ? anel.map(([x, y]) => utmParaLatLng(x, y, Number(zona[1]), sul)) : anel.map(([x, y]) => [y, x]);
      saida.push({ atributos: linhas[i] || {}, coords: anel });
    });
    return saida;
  }

  function deKml(xml) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    return [...doc.getElementsByTagName('Placemark')].map((pm) => {
      const aneis = [...pm.getElementsByTagName('outerBoundaryIs')].map((o) => o.getElementsByTagName('coordinates')[0]).filter(Boolean)
        .map((c) => c.textContent.trim().split(/\s+/).map((t) => { const [lng, lat] = t.split(',').map(Number); return [lat, lng]; }));
      const coords = maiorAnel(aneis); if (!coords) return null;
      const atributos = {};
      const nome = [...pm.children].find((c) => c.localName === 'name');
      if (nome) atributos.name = nome.textContent.trim();
      [...pm.getElementsByTagName('SimpleData')].forEach((d) => { atributos[d.getAttribute('name')] = d.textContent.trim(); });
      [...pm.getElementsByTagName('Data')].forEach((d) => { const v = d.getElementsByTagName('value')[0]; if (v) atributos[d.getAttribute('name')] = v.textContent.trim(); });
      return { atributos, coords };
    }).filter(Boolean);
  }

  function deGeoJson(json) {
    const feicoes = json.type === 'FeatureCollection' ? json.features : json.type === 'Feature' ? [json] : [{ type: 'Feature', properties: {}, geometry: json }];
    return feicoes.map((f) => {
      const g = f.geometry || {};
      const aneis = g.type === 'Polygon' ? [g.coordinates[0]] : g.type === 'MultiPolygon' ? g.coordinates.map((p) => p[0]) : [];
      const coords = maiorAnel(aneis.map((a) => a.map(([lng, lat]) => [lat, lng])));
      return coords ? { atributos: f.properties || {}, coords } : null;
    }).filter(Boolean);
  }

  const ext = (nome) => (nome.split('.').pop() || '').toLowerCase();

  async function ler(arquivos) {
    const lista = [...arquivos];
    const por = {};
    for (const a of lista) por[ext(a.name)] = a;
    const achar = (mapa, e) => { const k = Object.keys(mapa).find((n) => ext(n) === e && !n.startsWith('__MACOSX')); return k ? mapa[k] : null; };
    let feicoes;
    if (por.zip) {
      const z = await lerZip(await por.zip.arrayBuffer());
      const shp = achar(z, 'shp'); const kml = achar(z, 'kml');
      if (shp) { const prj = achar(z, 'prj'); feicoes = deShapefile(shp, achar(z, 'dbf'), prj ? texto(prj) : ''); }
      else if (kml) feicoes = deKml(texto(kml));
      else throw new Error('O arquivo .zip não tem um shapefile (.shp) nem um .kml dentro.');
    } else if (por.kmz) {
      const kml = achar(await lerZip(await por.kmz.arrayBuffer()), 'kml');
      if (!kml) throw new Error('O arquivo .kmz não tem um .kml dentro.');
      feicoes = deKml(texto(kml));
    } else if (por.kml) feicoes = deKml(await por.kml.text());
    else if (por.shp) {
      feicoes = deShapefile(new Uint8Array(await por.shp.arrayBuffer()), por.dbf ? new Uint8Array(await por.dbf.arrayBuffer()) : null,
        por.prj ? await por.prj.text() : '');
    } else if (por.geojson || por.json) feicoes = deGeoJson(JSON.parse(await (por.geojson || por.json).text()));
    else throw new Error('Formato não reconhecido. Envie .zip (shapefile), .shp, .kml, .kmz ou .geojson.');
    if (!feicoes.length) throw new Error('Nenhum polígono encontrado no arquivo.');
    if (feicoes.some((f) => f.coords.some(([lat, lng]) => Math.abs(lat) > 90 || Math.abs(lng) > 180))) {
      throw new Error('As coordenadas do arquivo não parecem geográficas. Exporte em SIRGAS 2000 ou WGS 84.');
    }
    return feicoes;
  }

  return { ler, lerZip, lerShp, lerDbf, deShapefile, deGeoJson, deKml, utmParaLatLng };
})();
