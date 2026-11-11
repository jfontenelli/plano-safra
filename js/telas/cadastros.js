/*
 * Menu Cadastros (construído em 10/11/2026 em plano-safra-versionamento/plano-safra-cadastro.html; trazido em 11/11/2026).
 * Guias: Fazendas e talhões · Safras · Culturas e variedades · Operações. A guia Produtos ficou de fora.
 * Regras de 11/11/2026 (o que vem do ERP Compass não se cria nem se edita aqui):
 *  - Fazendas e talhões: o nome e a área da fazenda e dos talhões vêm do ERP Compass (só consulta). Aqui só se preenche a
 *    geometria: o ponto da sede da fazenda e o polígono de cada talhão, e só quando ainda não estiverem preenchidos.
 *  - Safras: só consulta (sem a coluna Planos).
 *  - Operações (grupo de operação › operação): vêm do ERP Compass; só o DAP padrão se altera aqui (sem Fenologia, Prazo
 *    de conclusão e lixeiras: não se cria nem se exclui operação).
 *  - Culturas e variedades: vêm do ERP Compass (só consulta: sem Nova cultura, Editar cultura e inserir variedade); sem
 *    a guia Fenologia; variedades só com Variedade · Ciclo (dias).
 * O que a pessoa muda fica só na memória do navegador.
 */
window.Telas = window.Telas || {};

window.Telas.cadastros = (function () {
  const esc = (t) => Util.escapar(t ?? '');
  const n1 = (v) => (v === null || v === undefined || v === '' ? '' : Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 }));
  const SATELITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const GUIAS = [['fazendas', 'Fazendas e talhões'], ['safras', 'Safras'], ['culturas', 'Culturas e variedades'], ['operacoes', 'Operações']];
  const ERP = 'ERP Compass';
  // Fazenda de exemplo sem geometria (para mostrar o preenchimento do ponto e dos polígonos)
  const SEM_GEOMETRIA = ['São José'];

  const ui = { guia: 'fazendas', fazenda: null, cultura: 'Soja', culturaOp: 'Soja', salvoEm: '' };
  let conteudo = null; let mapa = null; let camadas = {};

  // ----- Dados que só o Cadastros usa (criados a partir do exemplo, na primeira vez) -----
  function preparar() {
    if (!DADOS.sedes) {
      DADOS.sedes = {};
      Object.entries(DADOS.geometriaFazendas || {}).forEach(([f, g]) => {
        if (!SEM_GEOMETRIA.includes(f)) DADOS.sedes[f] = [Number((g.origem[0] + 0.006).toFixed(5)), Number((g.origem[1] - 0.008).toFixed(5))];
      });
      DADOS.geometriaTalhoes = DADOS.geometriaTalhoes || {};
      SEM_GEOMETRIA.forEach((f) => { if (!DADOS.geometriaTalhoes[f]) DADOS.geometriaTalhoes[f] = {}; });
    }
    // Geometria que já veio preenchida (não se muda aqui): a sede e os polígonos que existiam ao abrir o Cadastros
    if (!DADOS.geometriaDeOrigem) {
      DADOS.geometriaDeOrigem = { sedes: new Set(Object.keys(DADOS.sedes)), talhoes: {} };
      DADOS.fazendas.forEach((f) => { DADOS.geometriaDeOrigem.talhoes[f] = new Set(Object.keys(Geo.daFazenda(f))); });
    }
    if (!DADOS.cadastroCulturas) {
      const unidade = (c) => { const u = (DADOS.comercializacao[c] || {}).unidade; return u ? `${u}/ha` : ''; };
      DADOS.cadastroCulturas = ['Soja', 'Milho', 'Algodão', 'Sorgo', 'Milheto', 'Plantas de cobertura', 'Braquiária']
        .map((nome) => ({ nome, atividade: 'Agricultura', unidade: unidade(nome) }));
    }
    if (!ui.fazenda || !DADOS.fazendas.includes(ui.fazenda)) ui.fazenda = DADOS.fazendas[0] || null;
    if (!DADOS.cadastroCulturas.some((c) => c.nome === ui.cultura)) ui.cultura = (DADOS.cadastroCulturas[0] || {}).nome || '';
  }

  const sedeDeOrigem = (f) => DADOS.geometriaDeOrigem.sedes.has(f);
  const desenhoDeOrigem = (f, talhao) => (DADOS.geometriaDeOrigem.talhoes[f] || new Set()).has(talhao);
  const modelo = (cultura) => (cultura === 'Soja' ? DADOS.modeloOperacoes : (DADOS.modelosCultura || {})[cultura]);
  const notaErp = (texto) => `<p class="cad-dica">${Icones.info}<span>${texto}</span></p>`;

  function salvo(texto) {
    const d = new Date();
    ui.salvoEm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const el = conteudo && conteudo.querySelector('.cad-salvo');
    if (el) el.innerHTML = `${Icones.certo} Salvo às ${ui.salvoEm}`;
    Aviso.anunciar(texto || 'Salvo');
  }

  // ===== Casca: cabeçalho com as guias =====
  function desenhar(guia) {
    preparar();
    if (GUIAS.some(([g]) => g === guia)) ui.guia = guia;
    const corpo = { fazendas: guiaFazendas, safras: guiaSafras, culturas: guiaCulturas, operacoes: guiaOperacoes }[ui.guia]();
    return `
      <header class="cabecalho cabecalho--guias">
        <h1 class="cabecalho__titulo">Cadastros</h1>
        <div class="cad-cabecalho__linha">
          <nav class="etapas" aria-label="Guias dos Cadastros">
            ${GUIAS.map(([g, rotulo]) => `<a class="etapa ${g === ui.guia ? 'etapa--ativa' : ''}" href="#/cadastros/${g}" ${g === ui.guia ? 'aria-current="page"' : ''}>${rotulo}</a>`).join('')}
          </nav>
          <span class="cad-salvo" role="status">${ui.salvoEm ? `${Icones.certo} Salvo às ${ui.salvoEm}` : ''}</span>
        </div>
      </header>
      <div class="cad" id="cad" data-guia="${ui.guia}">${corpo}</div>`;
  }

  function aoMostrar(el) {
    conteudo = el;
    if (mapa) { mapa.remove(); mapa = null; }
    const raiz = el.querySelector('#cad');
    raiz.addEventListener('click', aoClicar);
    raiz.addEventListener('change', aoMudar);
    if (ui.guia === 'fazendas') desenharMapa();
  }

  // Desenha de novo a guia, mantendo a rolagem
  function redesenhar() {
    if (!conteudo || !conteudo.querySelector('#cad') || !location.hash.startsWith('#/cadastros')) return;
    const topo = conteudo.scrollTop;
    conteudo.innerHTML = desenhar(ui.guia);
    aoMostrar(conteudo);
    conteudo.scrollTop = topo;
  }

  // ===== Fazendas e talhões =====
  function faltaGeometria(nome) {
    const ts = DADOS.talhoes[nome] || []; const g = Geo.daFazenda(nome);
    return !DADOS.sedes[nome] || ts.some((t) => !g[t.nome]);
  }

  function guiaFazendas() {
    const f = ui.fazenda;
    const item = (nome) => {
      const ts = DADOS.talhoes[nome] || [];
      return `<li><button class="cad-item ${nome === f ? 'cad-item--ativo' : ''}" type="button" data-acao="fazenda" data-nome="${esc(nome)}">
        <span>${esc(nome)}<span class="cad-item__sub">${ts.length} ${ts.length === 1 ? 'talhão' : 'talhões'} · ${Util.area(ts.reduce((s, t) => s + t.area, 0))}</span></span>
        ${faltaGeometria(nome) ? `<span class="cad-item__alerta" title="Falta a geometria: o ponto da sede ou o polígono de algum talhão">${Icones.alerta}</span>` : ''}
      </button></li>`;
    };
    const lista = Util.comEmpresa()
      ? DADOS.empresas.map((e) => `<li class="cad-lista__grupo">${esc(e)}</li>${
          (DADOS.fazendasPorEmpresa[e] || []).map(item).join('') || '<li class="cad-lista__vazio">Nenhuma fazenda</li>'}`).join('')
      : DADOS.fazendas.map(item).join('');
    return `
      <div class="cad-duas">
        <aside class="cartao">
          <label class="cad-chave" title="Para clientes organizados em várias empresas. Ligado, a Empresa aparece nos filtros, no Criar Plano e nas tabelas.">
            <input type="checkbox" data-campo="usa-empresa" ${Util.comEmpresa() ? 'checked' : ''}> Organizar as fazendas por empresa
          </label>
          <ul class="cad-lista">${lista}</ul>
          <p class="cad-nota">As fazendas e os talhões (nome e área) são criados no ${ERP}.</p>
        </aside>
        <div class="cad-coluna">${f ? painelFazenda(f) : `<section class="cartao cad-vazio"><h3>Nenhuma fazenda cadastrada</h3>
          <p>As fazendas são criadas no ${ERP}.</p></section>`}</div>
      </div>`;
  }

  function painelFazenda(f) {
    const ts = DADOS.talhoes[f] || []; const g = Geo.daFazenda(f); const sede = DADOS.sedes[f];
    const totalGeo = ts.reduce((s, t) => s + (g[t.nome] ? Geo.areaHa(g[t.nome]) : 0), 0);
    const sedeFixa = sedeDeOrigem(f);
    const coord = (v) => String(v).replace('.', ',');
    const faltamDesenhos = ts.filter((t) => !desenhoDeOrigem(f, t.nome)).length;
    const sedeHtml = sedeFixa
      ? `<div class="campo"><span class="campo__rotulo">Latitude da sede</span><span class="campo__valor">${coord(sede[0])}</span></div>
         <div class="campo"><span class="campo__rotulo">Longitude da sede</span><span class="campo__valor">${coord(sede[1])}</span></div>
         ${notaErp('O ponto da sede já está preenchido e não muda aqui.')}`
      : `<div class="campo"><label class="campo__rotulo" for="cad-lat">Latitude da sede</label>
           <input class="campo__controle" id="cad-lat" data-campo="sede-lat" inputmode="decimal" placeholder="-12,55200" value="${sede ? coord(sede[0]) : ''}"></div>
         <div class="campo"><label class="campo__rotulo" for="cad-lng">Longitude da sede</label>
           <input class="campo__controle" id="cad-lng" data-campo="sede-lng" inputmode="decimal" placeholder="-55,87900" value="${sede ? coord(sede[1]) : ''}"></div>
         ${notaErp(sede ? 'Arraste o marcador da sede no mapa para ajustar a posição.' : 'Digite a latitude e a longitude (graus decimais) ou clique no mapa para marcar a sede.')}`;
    return `
      <section class="cartao">
        <div class="cad-topo">
          <h2 class="cad-topo__titulo">${esc(f)}<small>${Util.comEmpresa() ? `${esc(Util.empresaDaFazenda(f))} · ` : ''}${Util.area(ts.reduce((s, t) => s + t.area, 0))}</small></h2>
        </div>
        <div class="cad-fazenda">
          <div>${sedeHtml}</div>
          <div id="cad-mapa" class="cad-mapa" aria-label="Mapa da fazenda ${esc(f)}"></div>
        </div>
      </section>
      <section class="cartao">
        <div class="cad-topo">
          <h2 class="cad-topo__titulo">Talhões<small id="cad-total-talhoes">${ts.length} · ${n1(ts.reduce((s, t) => s + t.area, 0))} ha${totalGeo ? ` · área geométrica ${n1(totalGeo)} ha` : ''}</small></h2>
          <div class="cad-topo__acoes">
            ${faltamDesenhos ? `<button class="botao botao--primario botao--p" type="button" data-acao="importar">${Icones.mapa} Importar polígonos</button>` : ''}
          </div>
        </div>
        ${ts.length ? `<div class="tabela-rolagem"><table class="tabela">
          <thead><tr><th>Talhão</th><th class="tabela__numero">Área do talhão (ha)</th>
            <th class="tabela__numero"><span class="titulo-dica" title="Calculada pelo desenho do talhão (polígono)">Área geométrica (ha)</span></th>
            <th>Geometria</th></tr></thead>
          <tbody>${ts.map((t) => `<tr data-talhao="${esc(t.nome)}">
            <td><strong>${esc(t.nome)}</strong></td>
            <td class="tabela__numero">${n1(t.area)}</td>
            <td class="tabela__numero">${g[t.nome] ? n1(Geo.areaHa(g[t.nome])) : '—'}</td>
            <td>${g[t.nome] ? `<span class="cad-ok">${Icones.certo} Polígono</span>`
              : `<span class="cad-falta">Sem geometria</span> · <button class="cad-link" type="button" data-acao="importar">Importar</button>`}</td>
          </tr>`).join('')}</tbody></table></div>
          ${notaErp(`O nome e a área dos talhões vêm do ${ERP}. Aqui só se importa o polígono dos talhões que ainda não têm desenho.`)}`
        : `<div class="cad-vazio"><h3>Esta fazenda ainda não tem talhões</h3><p>Os talhões (nome e área) são criados no ${ERP}.</p></div>`}
      </section>`;
  }

  function desenharMapa() {
    const el = conteudo.querySelector('#cad-mapa'); if (!el) return;
    if (!window.L) { el.innerHTML = `<p class="mapa__sem">${Icones.info} Mapa indisponível: sem conexão com a internet.</p>`; return; }
    const f = ui.fazenda; const sede = DADOS.sedes[f]; const sedeFixa = sedeDeOrigem(f);
    mapa = L.map(el, { zoomControl: true });
    L.tileLayer(SATELITE, { maxZoom: 18, attribution: 'Imagens © Esri, Maxar, Earthstar Geographics' }).addTo(mapa);
    L.control.scale({ position: 'bottomright', imperial: false }).addTo(mapa);
    camadas = {}; const pontos = [];
    Geo.poligonos(f).forEach((pg) => {
      camadas[pg.talhao] = L.polygon(pg.coords, { color: '#ffffff', weight: 1.5, fillColor: '#1baf7a', fillOpacity: 0.45 }).addTo(mapa)
        .bindTooltip(`<strong>${esc(pg.talhao)}</strong> · ${n1(pg.area)} ha`, { sticky: true, direction: 'top', className: 'mapa-detalhe' })
        .on('click', () => {
          const linha = conteudo.querySelector(`tr[data-talhao="${CSS.escape(pg.talhao)}"]`);
          if (!linha) return;
          conteudo.querySelectorAll('.cad-linha--alvo').forEach((l) => l.classList.remove('cad-linha--alvo'));
          linha.classList.add('cad-linha--alvo'); linha.scrollIntoView({ block: 'center', behavior: 'smooth' });
        });
      L.marker(pg.centro, { interactive: false, keyboard: false, icon: L.divIcon({ className: 'mapa-rotulo', html: esc(pg.talhao), iconSize: null }) }).addTo(mapa);
      pontos.push(...pg.coords);
    });
    if (sede) {
      pontos.push(sede);
      L.marker(sede, { draggable: !sedeFixa, title: sedeFixa ? `Sede da ${f}` : `Sede da ${f} (arraste para ajustar)`,
        icon: L.divIcon({ className: 'cad-sede', html: Icones.casa, iconSize: [30, 30], iconAnchor: [15, 15] }) }).addTo(mapa)
        .on('dragend', (e) => { const p = e.target.getLatLng(); gravarSede(p.lat, p.lng); });
    } else {
      mapa.on('click', (e) => { gravarSede(e.latlng.lat, e.latlng.lng); redesenhar(); });
      el.style.cursor = 'crosshair';
    }
    if (pontos.length > 1) mapa.fitBounds(L.latLngBounds(pontos), { padding: [24, 24], maxZoom: 16 });
    else if (pontos.length) mapa.setView(pontos[0], 13);
    else {
      const g = (DADOS.geometriaFazendas || {})[f];
      mapa.setView(g ? g.origem : [-13.5, -55.5], g ? 13 : 6);
    }
  }

  function gravarSede(lat, lng) {
    if (sedeDeOrigem(ui.fazenda)) return;
    DADOS.sedes[ui.fazenda] = [Number(lat.toFixed(5)), Number(lng.toFixed(5))];
    const a = conteudo.querySelector('[data-campo="sede-lat"]'); const b = conteudo.querySelector('[data-campo="sede-lng"]');
    if (a) a.value = String(DADOS.sedes[ui.fazenda][0]).replace('.', ',');
    if (b) b.value = String(DADOS.sedes[ui.fazenda][1]).replace('.', ',');
    salvo('Sede salva');
  }

  // ----- Modal de formulário (campos + Cancelar/Salvar). aoSalvar devolve um texto de erro ou nada -----
  function abrirForm({ titulo, subtitulo, corpo, rotulo = 'Salvar', aoSalvar, classe = '' }) {
    const modal = Modal.abrir(`
      <form novalidate>
        <div class="modal__corpo">
          <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
          <h2 class="modal__titulo" id="modal-titulo">${titulo}</h2>
          ${subtitulo ? `<p class="modal__subtitulo">${subtitulo}</p>` : ''}
          ${corpo}
          <p class="cad-erro" role="alert"></p>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
          <button class="botao botao--primario" type="submit">${rotulo}</button>
        </div>
      </form>`, { classe });
    const form = modal.elemento.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const erro = aoSalvar(form, modal);
      if (erro) { form.querySelector('.cad-erro').textContent = erro; return; }
      modal.fechar();
    });
    const primeiro = form.querySelector('input:not([type="hidden"]):not([readonly]), select');
    if (primeiro) primeiro.focus();
    return modal;
  }
  const campo = (nome, rotulo, valor = '', extra = '') => `<div class="campo"><label class="campo__rotulo" for="cf-${nome}">${rotulo}</label>
    <input class="campo__controle" id="cf-${nome}" name="${nome}" value="${esc(valor)}" autocomplete="off" ${extra}></div>`;
  const lista = (nome, rotulo, opcoes, valor = '', vazio = null) => `<div class="campo"><label class="campo__rotulo" for="cf-${nome}">${rotulo}</label>
    <select class="campo__controle" id="cf-${nome}" name="${nome}">${vazio !== null ? `<option value="">${vazio}</option>` : ''}
      ${opcoes.map((o) => `<option ${o === valor ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
  const val = (form, nome) => (form.elements[nome] ? form.elements[nome].value.trim() : '');
  const igual = (a, b) => Util.normalizar(a).trim() === Util.normalizar(b).trim();

  // ----- Importar polígonos: arquivo → conferência (mapa + tabela) → importar -----
  // Só recebe desenho o talhão que já existe no cadastro (vem do ERP) e ainda não tinha polígono. Talhão que não está no
  // cadastro não é criado aqui; talhão que já tinha polígono não muda.
  function modalImportar() {
    const f = ui.fazenda; let feicoes = null; let coluna = ''; let mapaImp = null;
    const modal = Modal.abrir(`
      <div class="modal__corpo">
        <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
        <h2 class="modal__titulo" id="modal-titulo">Importar polígonos · ${esc(f)}</h2>
        <p class="modal__subtitulo">O desenho de cada talhão é lido do arquivo e ligado ao talhão do cadastro pelo nome. Você confere antes de importar.</p>
        <div id="imp-corpo"></div>
        <p class="cad-erro" role="alert"></p>
      </div>
      <div class="modal__rodape">
        <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
        <button class="botao botao--primario" type="button" id="imp-confirmar" disabled>Importar</button>
      </div>`, { classe: 'modal--cad-largo' });
    const raiz = modal.elemento; const corpo = raiz.querySelector('#imp-corpo'); const erro = raiz.querySelector('.cad-erro');
    const botao = raiz.querySelector('#imp-confirmar');

    function passoArquivo() {
      corpo.innerHTML = `
        <label class="cad-soltar" id="imp-soltar">
          ${Icones.baixar}
          <strong>Arraste o arquivo aqui ou clique para escolher</strong>
          <span>Shapefile compactado (.zip) ou solto (.shp + .dbf + .prj) · KML · KMZ · GeoJSON</span>
          <input type="file" multiple accept=".zip,.shp,.dbf,.prj,.kml,.kmz,.geojson,.json">
        </label>
        <p class="cad-dica">${Icones.info}<span>Não tem um arquivo agora? <button class="cad-link" type="button" id="imp-exemplo">Baixar um arquivo de exemplo (.kml)</button> com os talhões desta fazenda, para testar a importação.</span></p>`;
      const soltar = corpo.querySelector('#imp-soltar');
      soltar.querySelector('input').addEventListener('change', (e) => receber(e.target.files));
      ['dragenter', 'dragover'].forEach((ev) => soltar.addEventListener(ev, (e) => { e.preventDefault(); soltar.classList.add('cad-soltar--sobre'); }));
      ['dragleave', 'drop'].forEach((ev) => soltar.addEventListener(ev, (e) => { e.preventDefault(); soltar.classList.remove('cad-soltar--sobre'); }));
      soltar.addEventListener('drop', (e) => receber(e.dataTransfer.files));
      corpo.querySelector('#imp-exemplo').addEventListener('click', baixarExemplo);
    }

    async function receber(arquivos) {
      erro.textContent = '';
      if (!arquivos || !arquivos.length) return;
      try {
        feicoes = await ArquivoGeo.ler(arquivos);
      } catch (e) { erro.textContent = e.message || 'Não foi possível ler o arquivo.'; return; }
      const colunas = [...new Set(feicoes.flatMap((x) => Object.keys(x.atributos)))];
      coluna = ['talh', 'nome', 'name', 'gleba', 'field', 'descr'].map((p) => colunas.find((c) => c.toLowerCase().includes(p))).find(Boolean) || colunas[0] || '';
      feicoes.forEach((x, i) => { x.area = Geo.areaHa(x.coords); x.nome = nomeDa(x, i); x.incluir = situacao(x) === 'recebe'; });
      passoConferir(colunas);
    }
    const nomeDa = (x, i) => String((coluna && x.atributos[coluna]) || '').trim() || `Talhão ${i + 1}`;
    const existente = (nome) => (DADOS.talhoes[f] || []).find((t) => igual(t.nome, nome));
    // 'recebe' (talhão do cadastro sem polígono de origem) · 'tem' (já tinha polígono) · 'fora' (não está no cadastro)
    const situacao = (x) => { const e = existente(x.nome); return !e ? 'fora' : desenhoDeOrigem(f, e.nome) ? 'tem' : 'recebe'; };

    function passoConferir(colunas) {
      corpo.innerHTML = `
        <div class="cad-imp__resumo">
          <strong>${feicoes.length} ${feicoes.length === 1 ? 'polígono encontrado' : 'polígonos encontrados'} · ${n1(feicoes.reduce((s, x) => s + x.area, 0))} ha</strong>
          ${colunas.length > 1 ? `<div class="campo"><label class="campo__rotulo" for="imp-coluna">Coluna com o nome do talhão</label>
            <select class="campo__controle" id="imp-coluna">${colunas.map((c) => `<option ${c === coluna ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>` : ''}
        </div>
        <div class="cad-imp">
          <div class="cad-imp__tabela"><table class="tabela">
            <thead><tr><th class="tabela__marcar"><span class="so-leitor">Importar</span></th><th>Talhão</th>
              <th class="tabela__numero">Área geométrica (ha)</th><th>O que acontece</th></tr></thead>
            <tbody id="imp-linhas"></tbody></table></div>
          <div id="imp-mapa" class="cad-mapa cad-mapa--p"></div>
        </div>
        <p class="cad-dica">${Icones.info}<span>Só recebe o desenho o talhão que já está no cadastro e ainda não tem polígono. Talhão que não está no cadastro é criado no ${ERP}; corrija o nome se ele estiver escrito diferente.</span></p>`;
      const linhas = corpo.querySelector('#imp-linhas');
      const pintar = () => {
        linhas.innerHTML = feicoes.map((x, i) => {
          const s = situacao(x); const e = existente(x.nome);
          const texto = s === 'recebe' ? `Recebe o desenho: <strong>${esc(e.nome)}</strong> (${n1(e.area)} ha)`
            : s === 'tem' ? `<span class="cad-falta">${esc(e.nome)} já tem polígono: não muda</span>`
            : '<span class="cad-falta">Não está no cadastro desta fazenda</span>';
          return `<tr><td class="tabela__marcar"><input type="checkbox" data-i="${i}" ${x.incluir ? 'checked' : ''} ${s === 'recebe' ? '' : 'disabled'} aria-label="Importar ${esc(x.nome)}"></td>
            <td><input class="cad-campo cad-campo--nome" data-i="${i}" value="${esc(x.nome)}" aria-label="Nome do talhão"></td>
            <td class="tabela__numero">${n1(x.area)}</td>
            <td>${texto}</td></tr>`;
        }).join('');
        const n = feicoes.filter((x) => x.incluir).length;
        botao.disabled = !n; botao.textContent = n ? `Importar ${n} ${n === 1 ? 'polígono' : 'polígonos'}` : 'Importar';
      };
      pintar();
      linhas.addEventListener('change', (e) => {
        const x = feicoes[e.target.dataset.i]; if (!x) return;
        if (e.target.type === 'checkbox') x.incluir = e.target.checked;
        else { x.nome = e.target.value.trim() || x.nome; x.incluir = situacao(x) === 'recebe'; }
        pintar();
      });
      const sel = corpo.querySelector('#imp-coluna');
      if (sel) sel.addEventListener('change', () => { coluna = sel.value; feicoes.forEach((x, i) => { x.nome = nomeDa(x, i); x.incluir = situacao(x) === 'recebe'; }); pintar(); });
      if (window.L) {
        mapaImp = L.map(corpo.querySelector('#imp-mapa'), { zoomControl: true });
        L.tileLayer(SATELITE, { maxZoom: 18, attribution: 'Imagens © Esri, Maxar, Earthstar Geographics' }).addTo(mapaImp);
        const pontos = [];
        feicoes.forEach((x) => { L.polygon(x.coords, { color: '#ffd400', weight: 2, fillColor: '#ffd400', fillOpacity: 0.25 }).addTo(mapaImp).bindTooltip(esc(x.nome), { sticky: true, className: 'mapa-detalhe' }); pontos.push(...x.coords); });
        mapaImp.fitBounds(L.latLngBounds(pontos), { padding: [16, 16] });
      } else corpo.querySelector('#imp-mapa').innerHTML = `<p class="mapa__sem">${Icones.info} Mapa indisponível: sem conexão com a internet.</p>`;
    }

    botao.addEventListener('click', () => {
      const escolhidas = feicoes.filter((x) => x.incluir && situacao(x) === 'recebe');
      const nomes = escolhidas.map((x) => Util.normalizar(existente(x.nome).nome));
      if (new Set(nomes).size !== nomes.length) { erro.textContent = 'Há mais de um polígono para o mesmo talhão. Deixe marcado só um.'; return; }
      const g = Geo.daFazenda(f);
      escolhidas.forEach((x) => { g[existente(x.nome).nome] = x.coords; });
      let sugeriuSede = false;
      if (!DADOS.sedes[f]) { const c = Geo.centro(escolhidas.flatMap((x) => x.coords)); DADOS.sedes[f] = [Number(c[0].toFixed(5)), Number(c[1].toFixed(5))]; sugeriuSede = true; }
      if (mapaImp) mapaImp.remove();
      modal.fechar(); salvo(); redesenhar();
      Aviso.mostrar(`${escolhidas.length} ${escolhidas.length === 1 ? 'polígono importado' : 'polígonos importados'}`
        + (sugeriuSede ? ' · sede sugerida no centro dos talhões: arraste para ajustar' : ''));
    });

    // Arquivo de exemplo: os talhões da fazenda (nomes do cadastro), em quadras perto da sede ou da origem da fazenda
    function baixarExemplo() {
      const g = (DADOS.geometriaFazendas || {})[f];
      const [lat, lng] = DADOS.sedes[f] || (g ? g.origem : [-12.6, -55.75]);
      const kLng = 111320 * Math.cos(lat * Math.PI / 180);
      const ts = DADOS.talhoes[f] || [];
      const porLinha = Math.ceil(Math.sqrt(ts.length || 1));
      const quadra = (i, j, larg, alt) => { const x0 = 400 + i * 1030; const y0 = -400 - j * 930;
        return [[x0, y0], [x0 + larg, y0], [x0 + larg, y0 - alt], [x0, y0 - alt], [x0, y0]].map(([x, y]) => `${(lng + x / kLng).toFixed(6)},${(lat + y / 111320).toFixed(6)},0`).join(' '); };
      const itens = ts.map((t, k) => { const alt = 900; const larg = Math.min(1000, Math.max(300, (t.area * 10000) / alt)); return [t.nome, k % porLinha, Math.floor(k / porLinha), larg, alt]; });
      const kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Talhões de exemplo</name>\n${
        itens.map(([nome, i, j, a, b]) => `<Placemark><name>${esc(nome)}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${quadra(i, j, a, b)}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>`).join('\n')}\n</Document></kml>`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' }));
      a.download = `talhoes-${Util.normalizar(f).replace(/\s+/g, '-')}.kml`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    passoArquivo();
  }

  // ===== Safras (só consulta) =====
  function guiaSafras() {
    const nomes = DADOS.cadastroSafras.map((s) => s.nome);
    const safras = [...DADOS.cadastroSafras].sort((a, b) => Util.posicaoSafra(a.nome, nomes) - Util.posicaoSafra(b.nome, nomes));
    return `
      <section class="cartao">
        <div class="cad-topo">
          <h2 class="cad-topo__titulo">Safras<small>${safras.length}</small></h2>
        </div>
        <p class="cad-nota">As safras são cadastradas no ${ERP} e aparecem aqui só para consulta. A safra vai de 01/09 a 31/08 do ano seguinte; a safrinha (os dois anos iguais, como 27/27) entra no mesmo Ano Agrícola da safra anterior.</p>
        <div class="tabela-rolagem"><table class="tabela">
          <thead><tr><th>Safra</th><th>Descrição</th><th>Início</th><th>Fim</th><th class="tabela__numero">Ano Agrícola</th></tr></thead>
          <tbody>${safras.map((s) => `<tr>
            <td><strong>${esc(s.nome)}</strong></td><td>${esc(s.descricao || '')}</td><td>${s.inicio ? Util.data(s.inicio) : '—'}</td><td>${s.fim ? Util.data(s.fim) : '—'}</td>
            <td class="tabela__numero">${s.anoAgricola ?? '—'}</td></tr>`).join('')}</tbody>
        </table></div>
      </section>`;
  }

  // ===== Culturas e variedades (atividade › cultura › variedades) =====
  function guiaCulturas() {
    const c = DADOS.cadastroCulturas.find((x) => x.nome === ui.cultura);
    const listaHtml = DADOS.atividades.map((a) => {
      const itens = DADOS.cadastroCulturas.filter((x) => x.atividade === a);
      return `<li class="cad-lista__grupo">${esc(a)}</li>${itens.map((x) => {
        const vs = DADOS.variedades.filter((v) => v.cultura === x.nome);
        return `<li><button class="cad-item ${x.nome === ui.cultura ? 'cad-item--ativo' : ''}" type="button" data-acao="cultura" data-nome="${esc(x.nome)}">
          <span>${esc(x.nome)}<span class="cad-item__sub">${vs.length} ${vs.length === 1 ? 'variedade' : 'variedades'}</span></span></button></li>`;
      }).join('') || '<li class="cad-lista__vazio">Nenhuma cultura cadastrada</li>'}`;
    }).join('');
    return `
      <div class="cad-duas">
        <aside class="cartao">
          <ul class="cad-lista">${listaHtml}</ul>
          <p class="cad-nota">As culturas e as variedades são cadastradas no ${ERP}.</p>
        </aside>
        <div class="cad-coluna">${c ? painelCultura(c) : '<section class="cartao cad-vazio"><h3>Nenhuma cultura cadastrada</h3></section>'}</div>
      </div>`;
  }

  function painelCultura(c) {
    const vs = DADOS.variedades.filter((v) => v.cultura === c.nome);
    return `
      <section class="cartao">
        <div class="cad-topo">
          <h2 class="cad-topo__titulo">${esc(c.nome)}</h2>
        </div>
        ${tabelaVariedades(c, vs)}
      </section>`;
  }

  // Variedades (11/11/2026): só a tabela Variedade · Ciclo (dias), para consulta (sem inserir nem editar)
  // Ciclo (dias) por fazenda (11/11/2026): o ciclo muda com a região da fazenda. Uma coluna por fazenda, com o nome
  // ("Faz. Boa Vista") e, embaixo, a etiqueta da região ("Região Norte"), como o produto e o grupo de insumo no plano
  const regiaoDe = (f) => (DADOS.regiaoFazenda || {})[f] || '';
  const cicloNaFazenda = (v, f) => Util.cicloVariedade(v, f);
  function tabelaVariedades(c, vs) {
    if (!vs.length) return `<div class="cad-vazio"><h3>Nenhuma variedade de ${esc(c.nome)}</h3></div>`;
    const fazendas = DADOS.fazendas;
    return `<p class="cad-nota">Ciclo (dias) da semeadura à colheita por região.</p>
      <div class="tabela-rolagem"><table class="tabela cad-ciclos">
      <thead><tr><th>Variedade</th>${fazendas.map((f) => `<th class="tabela__numero cad-ciclos__fazenda"><span>Faz. ${esc(f)}</span>${
        regiaoDe(f) ? `<span class="cal-etiqueta cad-regiao cad-regiao--${esc(Util.normalizar(regiaoDe(f)))}">Região ${esc(regiaoDe(f))}</span>` : ''}</th>`).join('')}</tr></thead>
      <tbody>${vs.map((v) => `<tr><td>${esc(v.nome)}</td>${fazendas.map((f) => `<td class="tabela__numero">${cicloNaFazenda(v, f) ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  // ===== Operações (grupo de operação › operação), por cultura: só consulta =====
  function guiaOperacoes() {
    const culturas = DADOS.cadastroCulturas.filter((c) => c.atividade === 'Agricultura').map((c) => c.nome);
    if (!culturas.includes(ui.culturaOp)) ui.culturaOp = culturas[0];
    const cultura = ui.culturaOp; const grupos = modelo(cultura);
    const topo = `
      <section class="cartao" style="margin-bottom:16px">
        <div class="cad-barra" style="border-bottom:0">
          <div class="campo campo--inline"><label class="campo__rotulo" for="cad-cultura-op">Cultura</label>
            <select class="campo__controle" id="cad-cultura-op" data-campo="cultura-op">${culturas.map((c) => `<option ${c === cultura ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
          <span class="cad-nota cad-nota--solta" style="margin:0; flex:1 1 320px">Os grupos de operação e as operações são cadastrados no <strong>${ERP}</strong> e aparecem aqui só para consulta.
            Aqui só se altera o <strong>DAP padrão</strong>, que vem preenchido ao criar um plano de ${esc(cultura)} pelo <strong>Usar operações cadastradas no ${ERP}</strong> (planos já criados não mudam); no plano, o DAP também se ajusta.</span>
        </div>
      </section>`;
    if (!grupos || !grupos.length) {
      return `${topo}<section class="cartao cad-vazio"><h3>Nenhum grupo de operação para ${esc(cultura)}</h3>
        <p>Os grupos e as operações desta cultura são cadastrados no ${ERP}.</p></section>`;
    }
    return topo + grupos.map((g, gi) => `
      <section class="cartao cad-grupo">
        <div class="cad-grupo__topo">
          <strong class="cad-grupo__nome">${esc(g.nome)}</strong>
          <span class="cad-grupo__tipo">Tipo: ${esc(g.tipo)}</span>
          <div class="cad-grupo__fim">${g.operacoes.length} ${g.operacoes.length === 1 ? 'operação' : 'operações'}</div>
        </div>
        ${g.operacoes.length ? `<div class="tabela-rolagem"><table class="tabela">
          <thead><tr><th>Operação</th><th class="tabela__numero"><span class="titulo-dica" title="Dias após o plantio. Negativo = antes do plantio">DAP padrão</span></th></tr></thead>
          <tbody>${g.operacoes.map((o, oi) => `<tr>
            <td>${esc(o.nome)}</td>
            <td class="tabela__numero"><input class="cad-campo cad-campo--num" data-campo="op-dap" data-g="${gi}" data-o="${oi}" inputmode="numeric" value="${o.dap ?? ''}"
              placeholder="${g.tipo === 'Colheita' ? 'pelo ciclo' : '—'}" aria-label="DAP padrão de ${esc(o.nome)}"></td>
          </tr>`).join('')}</tbody></table></div>` : '<p class="cad-nota">Nenhuma operação neste grupo.</p>'}
      </section>`).join('');
  }

  // ===== Eventos =====
  function aoClicar(e) {
    const alvo = e.target.closest('[data-acao]'); if (!alvo || alvo.disabled) return;
    const acoes = {
      fazenda() { ui.fazenda = alvo.dataset.nome; redesenhar(); },
      importar: () => modalImportar(),
      cultura() { ui.cultura = alvo.dataset.nome; redesenhar(); },
    };
    if (acoes[alvo.dataset.acao]) acoes[alvo.dataset.acao]();
  }

  function aoMudar(e) {
    const el = e.target; const c = el.dataset.campo; if (!c) return;
    const f = ui.fazenda;
    if (c === 'usa-empresa') { DADOS.usaEmpresa = el.checked; salvo(); redesenhar(); return; }
    if ((c === 'sede-lat' || c === 'sede-lng') && !sedeDeOrigem(f)) {
      const lat = Util.numero(conteudo.querySelector('[data-campo="sede-lat"]').value); const lng = Util.numero(conteudo.querySelector('[data-campo="sede-lng"]').value);
      if (lat === null || lng === null) return;
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) { Aviso.mostrar('Latitude entre -90 e 90; longitude entre -180 e 180 (graus decimais).'); return; }
      DADOS.sedes[f] = [lat, lng]; salvo('Sede salva'); redesenhar(); return;
    }
    if (c === 'cultura-op') { ui.culturaOp = el.value; redesenhar(); return; }
    // DAP padrão da operação: número inteiro (negativo = antes do plantio); vazio, sem DAP. Reordena o grupo pelo DAP
    if (c === 'op-dap') {
      const g = (modelo(ui.culturaOp) || [])[el.dataset.g]; const o = g && g.operacoes[el.dataset.o]; if (!o) return;
      const v = el.value.trim(); const n = v === '' ? null : Number(v.replace(',', '.'));
      if (v !== '' && !Number.isFinite(n)) { el.value = o.dap ?? ''; Aviso.mostrar('Informe o DAP em dias (número inteiro).'); return; }
      o.dap = n === null ? undefined : Math.round(n);
      g.operacoes.sort((a, b) => (a.dap ?? Infinity) - (b.dap ?? Infinity));
      salvo('DAP salvo'); redesenhar();
    }
  }

  return { desenhar, aoMostrar };
})();
