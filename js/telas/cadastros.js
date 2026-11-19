/*
 * Menu Cadastros (construído em 10/11/2026 em plano-safra-versionamento/plano-safra-cadastro.html; trazido em 11/11/2026).
 * Itens do menu: Geometria dos talhões · Safras · Culturas e variedades · Operações. A guia Produtos ficou de fora.
 * Regras de 11/11/2026 (o que vem do ERP Compass não se cria nem se edita aqui):
 *  - Geometria dos talhões (13/11/2026; antes Fazendas e talhões): o nome e a área dos talhões vêm do ERP Compass (só
 *    consulta). Aqui só se preenche o polígono de cada talhão; a fazenda não tem geometria (a sede saiu em 13/11/2026).
 *    Filtros Empresa · Filial · Aglomerado (os níveis do ERP: Empresa › Filial › Aglomerado › Fazenda › Talhão) ·
 *    Fazenda (uma por vez) · Talhão. O polígono se desenha no mapa, se edita (arrastar, criar e remover cantos;
 *    Salvar · Cancelar · Excluir polígono), se exclui e se importa (SHP, KML, KMZ; sem GeoJSON desde 17/11/2026), também por cima de um
 *    que já existe. O desenho e a edição usam o Leaflet-Geoman (CDN).
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
  // Páginas do grupo Cadastros no menu (12/11/2026; antes guias): [chave, título, subtítulo]; ordem do menu desde 17/11/2026
  const GUIAS = [
    ['safras', 'Safras', 'Consulte as safras cadastradas no ERP Compass.'],
    ['talhoes', 'Mapa de talhões', 'Visualize os talhões do ERP Compass e desenhe, importe ou edite seus limites no mapa.'],
    ['culturas', 'Culturas e variedades', 'Consulte as culturas e as variedades cadastradas no ERP Compass.'],
    ['operacoes', 'Tarefas', 'Consulte os grupos de tarefa e as tarefas cadastradas no ERP Compass.']
  ];
  // Nome de cada página no menu (17/11/2026): a trilha acima do título usa o nome idêntico ao do menu
  const NOME_MENU = { safras: 'Safras', talhoes: 'Talhões', culturas: 'Culturas', operacoes: 'Tarefas' };
  const ERP = 'ERP Compass';
  // Exemplo (13/11/2026): na São José, alguns talhões começam sem polígono, para mostrar o preenchimento
  const SEM_GEOMETRIA = { 'São José': ['T04', 'T07', 'T10', 'T12'] };

  const ui = { guia: 'safras', fazenda: null, talhao: null, selecionados: new Set(), filtroGeo: 'todos', listaRecolhida: false, culturasRecolhida: false, opsRecolhida: false, busca: '', buscaPonto: null, semAviso: new Set(), cultura: 'Soja', culturaOp: 'Soja', salvoEm: '',
    filtro: { empresa: '', filial: '', aglomerado: '' } };
  let conteudo = null; let mapa = null; let camadas = {};
  // Polígono em desenho ou edição: { talhao, modo: 'desenhar' | 'editar', novo, camada }
  let edicao = null;
  // Vista do mapa guardada ao redesenhar a mesma fazenda (salvar, filtrar); abrir a tela ou trocar de fazenda enquadra tudo
  let vista = null;

  // ----- Dados que só o Cadastros usa (criados a partir do exemplo, na primeira vez) -----
  function preparar() {
    if (!DADOS.cadastroGeoPreparado) {
      DADOS.cadastroGeoPreparado = true;
      Object.entries(SEM_GEOMETRIA).forEach(([f, ts]) => { const g = Geo.daFazenda(f); ts.forEach((t) => delete g[t]); });
    }
    if (!DADOS.cadastroCulturas) {
      const unidade = (c) => { const u = (DADOS.comercializacao[c] || {}).unidade; return u ? `${u}/ha` : ''; };
      DADOS.cadastroCulturas = ['Soja', 'Milho', 'Algodão', 'Sorgo', 'Milheto', 'Plantas de cobertura', 'Braquiária']
        .map((nome) => ({ nome, atividade: 'Agricultura', unidade: unidade(nome) }));
    }
    const vis = fazendasFiltradas();
    if (!ui.fazenda || !vis.includes(ui.fazenda)) { ui.fazenda = vis[0] || null; ui.talhao = null; ui.selecionados.clear(); ui.filtroGeo = 'todos'; }
    const existe = (n) => talhoesDa().some((t) => t.nome === n);
    if (ui.talhao && !existe(ui.talhao)) ui.talhao = null;
    [...ui.selecionados].forEach((n) => { if (!existe(n)) ui.selecionados.delete(n); });
    if (!DADOS.cadastroCulturas.some((c) => c.nome === ui.cultura)) ui.cultura = (DADOS.cadastroCulturas[0] || {}).nome || '';
  }

  // Níveis do ERP de cada fazenda: Empresa › Filial › Aglomerado
  const niveis = (f) => ({ empresa: Util.empresaDaFazenda(f) || '', ...((DADOS.filialAglomerado || {})[f] || { filial: '', aglomerado: '' }) });
  const NIVEIS = [['empresa', 'Empresa', 'Todas'], ['filial', 'Filial', 'Todas'], ['aglomerado', 'Aglomerado', 'Todos']];
  // Fazendas que passam pelos filtros acima de um nível (até: 'empresa' | 'filial' | 'aglomerado' | null = todos)
  function fazendasFiltradas(ate = null) {
    const usar = NIVEIS.map(([c]) => c); const corte = ate ? usar.indexOf(ate) : usar.length;
    return DADOS.fazendas.filter((f) => { const n = niveis(f); return usar.slice(0, corte).every((c) => !ui.filtro[c] || n[c] === ui.filtro[c]); });
  }
  const modelo = (cultura) => (cultura === 'Soja' ? DADOS.modeloOperacoes : (DADOS.modelosCultura || {})[cultura]);
  const notaErp = (texto) => `<p class="cad-dica">${Icones.info}<span>${texto}</span></p>`;

  // "Salvo às hh:mm" no cabeçalho; em Talhões não aparece (18/11/2026): basta o aviso de cada ação
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
    if (guia === 'fazendas') guia = 'talhoes'; // endereço antigo
    if (GUIAS.some(([g]) => g === guia)) ui.guia = guia;
    const corpo = { talhoes: guiaTalhoes, safras: guiaSafras, culturas: guiaCulturas, operacoes: guiaOperacoes }[ui.guia]();
    const [, titulo, subtitulo] = GUIAS.find(([g]) => g === ui.guia);
    // Trilha acima do título (17/11/2026): "Cadastros › <página>", pequena, para saber que está em Cadastros
    // Talhões (13/11/2026): cabeçalho baixo, com o subtítulo logo abaixo do título
    const compacto = ui.guia === 'talhoes';
    return `
      <header class="cabecalho cad-cabecalho ${compacto ? 'cad-cabecalho--compacto' : ''}">
        <div>
          <p class="cad-trilha">Cadastros › <strong>${NOME_MENU[ui.guia]}</strong></p>
          <h1 class="cabecalho__titulo">${titulo}</h1>
          <p class="cabecalho__subtitulo">${subtitulo}</p>
        </div>
        ${ui.guia === 'talhoes' ? '' : `<span class="cad-salvo" role="status">${ui.salvoEm ? `${Icones.certo} Salvo às ${ui.salvoEm}` : ''}</span>`}
      </header>
      <div class="cad" id="cad" data-guia="${ui.guia}">${corpo}</div>`;
  }

  function aoMostrar(el) {
    conteudo = el;
    edicao = null;
    if (mapa) { mapa.remove(); mapa = null; }
    const raiz = el.querySelector('#cad');
    raiz.addEventListener('click', aoClicar);
    raiz.addEventListener('change', aoMudar);
    marcaBuscaCamada = null;
    if (ui.guia === 'talhoes') { desenharMapa(); ligarBusca(); ajustarTabela(); }
  }

  // Desenha de novo a guia, mantendo a rolagem
  function redesenhar({ enquadrar: tudo = false } = {}) {
    if (!conteudo || !conteudo.querySelector('#cad') || !location.hash.startsWith('#/cadastros')) return;
    vista = mapa && !tudo ? { fazenda: ui.fazenda, centro: mapa.getCenter(), zoom: mapa.getZoom() } : null;
    const topo = conteudo.scrollTop;
    conteudo.innerHTML = desenhar(ui.guia);
    aoMostrar(conteudo);
    conteudo.scrollTop = topo;
  }

  // ===== Geometria dos talhões (13/11/2026; antes Fazendas e talhões) =====
  // A fazenda não tem geometria (sem sede): só os talhões têm polígono. Uma fazenda por vez (filtro Fazenda, obrigatório).
  const talhoesDa = () => DADOS.talhoes[ui.fazenda] || [];
  const temGeo = (nome) => !!Geo.daFazenda(ui.fazenda)[nome];

  // Filtros Empresa · Filial · Aglomerado (12/11/2026), em cascata: cada um oferece só o que cabe nos de cima.
  // 13/11/2026: + Fazenda (obrigatória, uma por vez) e Talhão (seleciona o talhão e aproxima o mapa dele)
  function filtrosNiveis() {
    const campos = NIVEIS.map(([c, rotulo, todos]) => {
      const opcoes = [...new Set(fazendasFiltradas(c).map((f) => niveis(f)[c]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      return `<div class="campo"><label class="campo__rotulo" for="cad-f-${c}">${rotulo}</label>
        <select class="campo__controle" id="cad-f-${c}" data-campo="nivel" data-nivel="${c}">
          <option value="">${todos}</option>${opcoes.map((o) => `<option ${o === ui.filtro[c] ? 'selected' : ''}>${esc(o)}</option>`).join('')}
        </select></div>`;
    }).join('');
    const fazendas = fazendasFiltradas(); const ts = talhoesDa();
    const fazenda = `<div class="campo"><label class="campo__rotulo" for="cad-f-fazenda">Fazenda</label>
        <select class="campo__controle" id="cad-f-fazenda" data-campo="fazenda" required>
          ${fazendas.map((f) => `<option ${f === ui.fazenda ? 'selected' : ''}>${esc(f)}</option>`).join('') || '<option value="">Nenhuma fazenda</option>'}
        </select></div>`;
    const talhao = `<div class="campo"><label class="campo__rotulo" for="cad-f-talhao">Talhão</label>
        <select class="campo__controle" id="cad-f-talhao" data-campo="talhao" ${ts.length ? '' : 'disabled'}>
          ${opcoesFiltroTalhao()}
        </select></div>`;
    // Limpar filtros (17/11/2026): o botão da vassoura, como nas outras telas (sempre à mostra; o nome aparece ao
    // passar o mouse e, com o menu recolhido, ao lado do ícone); limpa Empresa · Filial · Aglomerado e o Talhão
    return `<section class="cartao filtros cad-filtros" aria-label="Escolher a fazenda e o talhão">${campos}${fazenda}${talhao}
      <button class="botao botao--secundario bf__botao cad-filtros__limpar" type="button" data-acao="limpar-niveis"
              title="Limpar filtros" aria-label="Limpar filtros">${Icones.limpar}<span class="bf__texto">Limpar filtros</span></button></section>`;
  }

  // Opções do filtro Talhão: Todos · um talhão · e, com vários selecionados (Ctrl/Shift), "N talhões selecionados"
  function opcoesFiltroTalhao() {
    const n = ui.selecionados.size; const um = n === 1 ? [...ui.selecionados][0] : '';
    return `<option value="" ${n === 0 ? 'selected' : ''}>Todos</option>${n > 1 ? `<option value="__varios" selected disabled>${n} talhões selecionados</option>` : ''}${
      talhoesDa().map((t) => `<option ${t.nome === um ? 'selected' : ''}>${esc(t.nome)}</option>`).join('')}`;
  }

  function guiaTalhoes() {
    const f = ui.fazenda;
    if (!f) {
      return `${filtrosNiveis()}<section class="cartao cad-vazio"><h3>Nenhuma fazenda</h3>
        <p>${DADOS.fazendas.length ? 'Nenhuma fazenda com esses filtros.' : `As fazendas são criadas no ${ERP}.`}</p></section>`;
    }
    const ts = talhoesDa(); const g = Geo.daFazenda(f);
    const sem = ts.filter((t) => !g[t.nome]).length;
    // Etiqueta única "Sem geometria: N" (13/11/2026): clicar mostra só os talhões sem geometria; clicar de novo, todos.
    // Sem talhão sem geometria, a etiqueta não aparece
    if (!sem) ui.filtroGeo = 'todos';
    const visiveis = ui.filtroGeo === 'sem' ? ts.filter((t) => !g[t.nome]) : ts;
    const area = ts.reduce((s, t) => s + t.area, 0);
    return `${filtrosNiveis()}
      <section class="cartao cad-geo ${ui.listaRecolhida ? 'cad-geo--recolhida' : ''}" aria-label="Talhões e mapa da fazenda ${esc(f)}">
        <aside class="cad-geo__lista" id="cad-geo-lista" ${ui.listaRecolhida ? 'hidden' : ''}>
          <header class="cad-geo__topo">
            <div class="cad-geo__titulo-linha">
              <h2 class="cad-geo__titulo">Talhões da Fazenda ${esc(f)}</h2>
              <button class="botao-icone cad-geo__alternar" type="button" data-acao="alternar-lista" aria-controls="cad-geo-lista" aria-expanded="true"
                      title="Recolher lista" aria-label="Recolher lista de talhões">${Icones.recolher}</button>
            </div>
            <div class="cad-geo__linha">
            <p class="cad-geo__resumo">${ts.length} ${ts.length === 1 ? 'talhão' : 'talhões'} · ${n1(area)} ha<span id="cad-geo-sel-n">${textoSelecionados()}</span></p>
            ${sem ? `<div class="filtros-talhoes">
              <button class="filtro-talhoes ${ui.filtroGeo === 'sem' ? 'filtro-talhoes--ativo' : ''}" type="button" data-acao="filtro-geo"
                      aria-pressed="${ui.filtroGeo === 'sem'}" title="${ui.filtroGeo === 'sem' ? 'Mostrar todos os talhões' : 'Mostrar só os talhões sem geometria'}">Sem geometria: ${sem}</button></div>` : ''}
            </div>
          </header>
          ${ts.length ? `<div class="cad-geo__tabela"><table class="tabela tabela--compacta cad-talhoes" aria-multiselectable="true"
              title="Ctrl + clique: junta ou tira um talhão da seleção · Shift + clique: seleciona um intervalo">
            <thead><tr><th>Talhão</th><th class="tabela__numero">Área cadastrada (ha)</th>
              <th class="tabela__numero"><span class="titulo-dica" title="Calculada pelo polígono do talhão">Área geometria (ha)</span></th></tr></thead>
            <tbody>${visiveis.map((t) => `<tr data-acao="selecionar" data-talhao="${esc(t.nome)}" tabindex="0"
                class="${ui.selecionados.has(t.nome) ? 'cad-linha--alvo' : ''}" aria-selected="${ui.selecionados.has(t.nome)}">
              <td><strong>${esc(t.nome)}</strong></td>
              <td class="tabela__numero">${n1(t.area)}</td>
              <td class="tabela__numero">${g[t.nome] ? n1(Geo.areaHa(g[t.nome])) : '<span class="cad-sem">Sem geometria</span>'}</td>
            </tr>`).join('')}</tbody></table></div>`
          : `<div class="cad-vazio cad-geo__vazio"><h3>Esta fazenda ainda não tem talhões</h3><p>Os talhões (nome e área) são criados no ${ERP}.</p></div>`}
        </aside>
        <div class="cad-geo__mapa">
          <div class="cad-geo__acoes">
            <!-- 16/11/2026: mesmo padrão do » Culturas -->
            <button class="botao botao--secundario botao--p cad-mostrar-culturas cad-geo__alternar" type="button" data-acao="alternar-lista" aria-controls="cad-geo-lista" aria-expanded="false"
                    title="Mostrar a lista de talhões" aria-label="Mostrar lista de talhões" ${ui.listaRecolhida ? '' : 'hidden'}>${Icones.expandir} Talhões</button>
              <form class="cad-busca" id="cad-busca" role="search" autocomplete="off" novalidate>
              <span class="cad-busca__lupa" aria-hidden="true">${Icones.busca}</span>
              <input class="cad-busca__campo" id="cad-busca-campo" type="text" value="${esc(ui.busca)}"
                     placeholder="Digite a localização" aria-label="Buscar cidade, endereço ou coordenada"
                     title="Cidade, endereço ou coordenada (ex.: -12,552, -55,879). Tecle Enter para buscar." aria-controls="cad-busca-lista">
              <button class="cad-busca__limpar" type="button" data-acao="busca-limpar" aria-label="Limpar a busca" ${ui.busca ? '' : 'hidden'}>${Icones.fechar}</button>
              <div class="cad-busca__lista" id="cad-busca-lista" hidden></div>
              </form>
            <div class="cad-geo__botoes" id="cad-geo-acoes" role="toolbar" aria-label="Ações do talhão">${barraAcoes()}</div>
          </div>
          <div class="cad-mapa-area">
            ${ts.length && !Geo.poligonos(f).length && !ui.semAviso.has(f) ? `<div class="cad-mapa-aviso" role="status">${Icones.info}<span class="cad-mapa-aviso__texto">Esta fazenda ainda não tem talhões com polígonos cadastrados. Importe a geometria ou desenhe os talhões no mapa.</span>
              <button class="botao-icone cad-mapa-aviso__fechar" type="button" data-acao="fechar-aviso-mapa" title="Fechar" aria-label="Fechar o aviso">${Icones.fechar}</button></div>` : ''}
            <div id="cad-mapa" class="cad-mapa" aria-label="Mapa dos talhões da fazenda ${esc(f)}"></div>
            <div class="cad-edicao" id="cad-edicao" aria-live="polite"></div>
          </div>
        </div>
      </section>`;
  }

  // Ações da barra (13/11/2026): só ícones verdes; o nome aparece ao passar o mouse. Desenhar, Editar e Excluir agem
  // sobre o talhão selecionado (na lista, no mapa ou no filtro Talhão); Limpar seleção tira a seleção
  // Com vários selecionados (Ctrl/Shift, 13/11/2026): Excluir vale para todos os que têm polígono; Desenhar e Editar, só com um
  function barraAcoes() {
    const ts = talhoesDa(); const sel = [...ui.selecionados];
    const t = sel.length === 1 ? ts.find((x) => x.nome === sel[0]) : null;
    const tem = !!(t && temGeo(t.nome)); const livre = !edicao;
    const nome = t ? ` ${esc(t.nome)}` : '';
    const comPoligono = sel.filter((n) => temGeo(n));
    const varios = sel.length > 1;
    const botao = (acao, icone, rotulo, ativo, extra = '') => `<button class="cad-icone ${extra}" type="button" data-acao="${acao}"
        title="${rotulo}" aria-label="${rotulo}" ${ativo ? '' : 'disabled'}>${icone}</button>`;
    return [
      // Importar fica com ícone e texto (a ação principal)
      `<button class="botao botao--primario botao--p cad-importar" type="button" data-acao="importar" title="Importar a geometria de um arquivo SHP, KML ou KMZ" ${livre && ts.length ? '' : 'disabled'}>${Icones.importar} Importar geometria</button>`,
      '<span class="cad-geo__divisor" aria-hidden="true"></span>',
      botao('desenhar', Icones.poligono, t && !tem ? `Desenhar o polígono do${nome}` : varios ? 'Desenhar polígono (selecione um talhão só)' : 'Desenhar polígono (selecione um talhão sem geometria)', livre && t && !tem),
      botao('editar', Icones.lapis, tem ? `Editar o polígono do${nome}` : varios ? 'Editar polígono (selecione um talhão só)' : 'Editar polígono (selecione um talhão com geometria)', livre && tem),
      botao('excluir', Icones.lixeira, varios && comPoligono.length ? `Excluir o polígono de ${comPoligono.length} ${comPoligono.length === 1 ? 'talhão' : 'talhões'}`
        : tem ? `Excluir o polígono do${nome}` : 'Excluir polígono (selecione um talhão com geometria)', livre && comPoligono.length > 0, 'cad-icone--perigo'),
      botao('limpar-selecao', Icones.desmarcar, varios ? `Limpar seleção (${sel.length} talhões)` : 'Limpar seleção', livre && sel.length > 0)
    ].join('');
  }
  function pintarAcoes() {
    const el = conteudo && conteudo.querySelector('#cad-geo-acoes');
    if (el) el.innerHTML = barraAcoes();
  }

  const ESTILO = { color: '#ffffff', weight: 1.5, fillColor: '#1baf7a', fillOpacity: 0.45, opacity: 1 };
  const ESTILO_SELECIONADO = { color: '#ffd400', weight: 3, fillColor: '#1baf7a', fillOpacity: 0.6, opacity: 1 };
  const ESTILO_APAGADO = { fillOpacity: 0.15, opacity: 0.45 };
  const ESTILO_EDICAO = { color: '#ffd400', weight: 2.5, fillColor: '#ffd400', fillOpacity: 0.25, opacity: 1 };
  const estiloDe = (nome) => (ui.selecionados.has(nome) ? ESTILO_SELECIONADO : ESTILO);
  const dicaPoligono = (nome, coords) => `<strong>${esc(nome)}</strong> · Área geométrica: ${n1(Geo.areaHa(coords))} ha`;
  // Abaixo deste zoom, os nomes dos talhões somem (aparecem ao passar o mouse), para não se sobreporem
  const ZOOM_ROTULOS = 13;

  // O mapa sempre abre enquadrando todos os talhões da fazenda. Ao redesenhar a mesma fazenda (salvar, filtrar), mantém a vista
  function enquadrar(animar) {
    if (!mapa) return;
    const cs = Object.values(camadas);
    if (cs.length) { mapa.fitBounds(L.featureGroup(cs).getBounds(), { padding: [32, 32], maxZoom: 17, animate: animar }); return; }
    // Fazenda sem nenhum polígono (18/11/2026): o ERP não tem a coordenada da fazenda; o mapa mostra o Brasil inteiro
    // e o aviso sobre o mapa orienta a buscar a localização ou importar a geometria
    mapa.setView([-14.2, -51.9], 4, { animate: animar });
  }

  function desenharMapa() {
    const el = conteudo.querySelector('#cad-mapa'); if (!el) return;
    if (!window.L) { el.innerHTML = `<p class="mapa__sem">${Icones.info} Mapa indisponível: sem conexão com a internet.</p>`; return; }
    const f = ui.fazenda;
    mapa = L.map(el, { zoomControl: true });
    if (mapa.pm) mapa.pm.setLang('pt_br');
    L.tileLayer(SATELITE, { maxZoom: 19, maxNativeZoom: 18, attribution: 'Imagens © Esri, Maxar, Earthstar Geographics' }).addTo(mapa);
    L.control.scale({ position: 'bottomright', imperial: false }).addTo(mapa);
    // Botão para voltar a ver a fazenda inteira (abaixo do + e −)
    const Enquadrar = L.Control.extend({
      options: { position: 'topleft' },
      onAdd() {
        const b = L.DomUtil.create('button', 'leaflet-bar cad-enquadrar');
        b.type = 'button'; b.title = 'Enquadrar todos os talhões da fazenda'; b.setAttribute('aria-label', b.title);
        b.innerHTML = Icones.enquadrar;
        L.DomEvent.disableClickPropagation(b);
        L.DomEvent.on(b, 'click', () => enquadrar(true));
        return b;
      }
    });
    new Enquadrar().addTo(mapa);
    camadas = {};
    Geo.poligonos(f).forEach((pg) => {
      camadas[pg.talhao] = L.polygon(pg.coords, { ...estiloDe(pg.talhao) }).addTo(mapa)
        .bindTooltip(dicaPoligono(pg.talhao, pg.coords), { sticky: true, direction: 'top', className: 'mapa-detalhe' })
        .on('click', (e) => { L.DomEvent.stopPropagation(e); if (!edicao) selecionar(pg.talhao, 'mapa', modoDe(e.originalEvent, true)); });
      L.marker(pg.centro, { interactive: false, keyboard: false, pmIgnore: true,
        icon: L.divIcon({ className: 'mapa-rotulo cad-rotulo', html: esc(pg.talhao), iconSize: null }) }).addTo(mapa);
    });
    if (ui.buscaPonto) marcarBusca(ui.buscaPonto);
    // Clicar fora de um polígono limpa a seleção (13/11/2026)
    mapa.on('click', () => { if (!edicao && ui.selecionados.size) selecionar(null, 'mapa'); });
    if (vista && vista.fazenda === f) mapa.setView(vista.centro, vista.zoom, { animate: false });
    else enquadrar(false);
    vista = null;
    // Só depois de o mapa ter posição: antes disso o polígono ainda não foi desenhado e trazê-lo para a frente dá erro
    ui.selecionados.forEach((n) => { if (camadas[n]) camadas[n].bringToFront(); });
    const rotulos = () => el.classList.toggle('cad-mapa--longe', mapa.getZoom() < ZOOM_ROTULOS);
    mapa.on('zoomend', rotulos); rotulos();
    ligarCriarCanto(el);
    // Passar o mouse na linha da tabela destaca o polígono
    const corpo = conteudo.querySelector('.cad-talhoes tbody');
    if (corpo) {
      const camadaDa = (e) => { const tr = e.target.closest('tr[data-talhao]'); return tr && !edicao ? [tr.dataset.talhao, camadas[tr.dataset.talhao]] : []; };
      corpo.addEventListener('mouseover', (e) => { const [, c] = camadaDa(e); if (c) c.setStyle({ fillOpacity: 0.75, weight: 3 }); });
      corpo.addEventListener('mouseout', (e) => { const [n, c] = camadaDa(e); if (c) c.setStyle(estiloDe(n)); });
      corpo.addEventListener('keydown', (e) => {
        const tr = e.target.closest('tr[data-talhao]');
        if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selecionar(tr.dataset.talhao, 'lista', modoDe(e)); }
      });
      // Shift + clique não seleciona o texto da tabela
      corpo.addEventListener('mousedown', (e) => { if (e.shiftKey) e.preventDefault(); });
    }
    pintarBarra();
  }

  // ----- Busca de lugar no mapa (13/11/2026): cidade, endereço ou nome de lugar pela busca gratuita do OpenStreetMap
  // (Nominatim, só no Brasil, ao teclar Enter) ou coordenada "lat, long" (graus decimais, com vírgula ou ponto) -----
  let resultados = []; let marcaBuscaCamada = null;
  const COORD = /^\s*(-?\d{1,3}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)\s*$/;
  function listaBusca(html) {
    const el = conteudo.querySelector('#cad-busca-lista'); if (!el) return;
    el.innerHTML = html || ''; el.hidden = !html;
  }
  function marcarBusca(p) {
    if (!mapa) return;
    if (marcaBuscaCamada) marcaBuscaCamada.remove();
    marcaBuscaCamada = L.circleMarker([p.lat, p.lng], { radius: 8, color: '#ffffff', weight: 3, fillColor: '#e5484d', fillOpacity: 1, pmIgnore: true })
      .bindTooltip(esc(p.nome), { direction: 'top', offset: [0, -8], className: 'mapa-detalhe' }).addTo(mapa);
  }
  // Fazenda sem polígono (18/11/2026): o X ou buscar a localização tira a faixa do aviso (não volta nesta fazenda)
  function fecharAvisoMapa() {
    ui.semAviso.add(ui.fazenda);
    const aviso = conteudo.querySelector('.cad-mapa-aviso');
    if (aviso) { aviso.remove(); if (mapa) mapa.invalidateSize({ pan: false }); }
  }
  function irPara(r) {
    listaBusca('');
    ui.buscaPonto = { lat: r.lat, lng: r.lng, nome: r.nome };
    fecharAvisoMapa();
    if (!mapa) return;
    marcarBusca(ui.buscaPonto);
    if (r.caixa) mapa.fitBounds(r.caixa, { maxZoom: 15 }); else mapa.setView([r.lat, r.lng], 15);
  }
  async function buscarLugar(texto) {
    const q = texto.trim(); if (!q) return;
    const c = q.match(COORD);
    if (c) {
      const lat = Number(c[1].replace(',', '.')); const lng = Number(c[2].replace(',', '.'));
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) { listaBusca('<p class="cad-busca__msg">Coordenada fora do mapa: latitude entre -90 e 90, longitude entre -180 e 180.</p>'); return; }
      irPara({ lat, lng, nome: `${String(lat).replace('.', ',')}, ${String(lng).replace('.', ',')}` }); return;
    }
    listaBusca('<p class="cad-busca__msg">Buscando…</p>');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=br&accept-language=pt-BR&q=${encodeURIComponent(q)}`;
      const lista = await (await fetch(url)).json();
      resultados = lista.map((x) => ({ lat: Number(x.lat), lng: Number(x.lon), nome: x.display_name,
        caixa: x.boundingbox ? [[Number(x.boundingbox[0]), Number(x.boundingbox[2])], [Number(x.boundingbox[1]), Number(x.boundingbox[3])]] : null }));
      if (!resultados.length) { listaBusca(`<p class="cad-busca__msg">Nenhum lugar encontrado para "${esc(q)}". Confira o nome ou digite a coordenada.</p>`); return; }
      if (resultados.length === 1) { irPara(resultados[0]); return; }
      listaBusca(`<ul aria-label="Lugares encontrados">${resultados.map((r, i) => `<li><button type="button" data-acao="busca-ir" data-i="${i}">${esc(r.nome)}</button></li>`).join('')}</ul>`);
    } catch (e) {
      listaBusca('<p class="cad-busca__msg">Não foi possível buscar agora. Confira a conexão com a internet.</p>');
    }
  }
  function ligarBusca() {
    const form = conteudo.querySelector('#cad-busca'); if (!form) return;
    const campo = form.querySelector('#cad-busca-campo'); const limpar = form.querySelector('.cad-busca__limpar');
    form.addEventListener('submit', (e) => { e.preventDefault(); buscarLugar(campo.value); });
    campo.addEventListener('input', () => { ui.busca = campo.value; limpar.hidden = !campo.value; });
    form.addEventListener('keydown', (e) => { if (e.key === 'Escape') listaBusca(''); });
    form.addEventListener('focusout', () => { setTimeout(() => { if (!form.contains(document.activeElement)) listaBusca(''); }, 150); });
  }
  function limparBusca() {
    ui.busca = ''; ui.buscaPonto = null; resultados = [];
    if (marcaBuscaCamada) { marcaBuscaCamada.remove(); marcaBuscaCamada = null; }
    const campo = conteudo.querySelector('#cad-busca-campo'); if (campo) { campo.value = ''; campo.focus(); }
    const limpar = conteudo.querySelector('.cad-busca__limpar'); if (limpar) limpar.hidden = true;
    listaBusca('');
  }

  // Seleciona talhões (lista, mapa ou filtro Talhão). Modos (13/11/2026): 'unico' (clique), 'alternar' (Ctrl + clique: junta
  // ou tira) e 'intervalo' (Shift + clique na tabela: do último clicado até este, na ordem da tabela). Pelo filtro, o mapa
  // aproxima do talhão; pela lista, só vai até ele se estiver fora da vista; sem talhão (filtro "Todos"), enquadra a fazenda
  const modoDe = (e, mapaClique = false) => (!e ? 'unico' : (e.ctrlKey || e.metaKey) ? 'alternar' : e.shiftKey ? (mapaClique ? 'alternar' : 'intervalo') : 'unico');
  const textoSelecionados = () => (ui.selecionados.size > 1 ? ` · ${ui.selecionados.size} selecionados` : '');
  function selecionar(nome, origem, modo = 'unico') {
    if (edicao) return;
    const sel = ui.selecionados;
    if (!nome) { sel.clear(); ui.talhao = null; }
    else if (modo === 'alternar') { if (sel.has(nome)) sel.delete(nome); else sel.add(nome); ui.talhao = nome; }
    else if (modo === 'intervalo' && ui.talhao) {
      const ordem = [...conteudo.querySelectorAll('.cad-talhoes tbody tr[data-talhao]')].map((tr) => tr.dataset.talhao);
      const a = ordem.indexOf(ui.talhao); const b = ordem.indexOf(nome);
      sel.clear();
      if (a < 0 || b < 0) { sel.add(nome); ui.talhao = nome; } else ordem.slice(Math.min(a, b), Math.max(a, b) + 1).forEach((n) => sel.add(n));
    } else { sel.clear(); sel.add(nome); ui.talhao = nome; }
    Object.entries(camadas).forEach(([t, c]) => c.setStyle(estiloDe(t)));
    sel.forEach((n) => { if (camadas[n]) camadas[n].bringToFront(); });
    marcarLinha(nome && sel.has(nome) ? nome : null, origem !== 'lista');
    const filtro = conteudo.querySelector('#cad-f-talhao'); if (filtro) filtro.innerHTML = opcoesFiltroTalhao();
    const n = conteudo.querySelector('#cad-geo-sel-n'); if (n) n.textContent = textoSelecionados();
    pintarAcoes();
    if (!mapa || modo !== 'unico') return;
    const c = nome && camadas[nome];
    if (c && origem === 'filtro') mapa.fitBounds(c.getBounds(), { padding: [60, 60], maxZoom: 16 });
    else if (c && origem === 'lista' && !mapa.getBounds().contains(c.getBounds())) mapa.panTo(c.getBounds().getCenter());
    else if (!nome && origem === 'filtro') enquadrar(true);
  }

  // Marca na tabela todas as linhas selecionadas; rola até a do talhão indicado
  function marcarLinha(talhao, rolar) {
    conteudo.querySelectorAll('.cad-talhoes tbody tr[data-talhao]').forEach((l) => {
      const s = ui.selecionados.has(l.dataset.talhao);
      l.classList.toggle('cad-linha--alvo', s); l.setAttribute('aria-selected', String(s));
    });
    const linha = talhao && conteudo.querySelector(`tr[data-talhao="${CSS.escape(talhao)}"]`);
    if (linha && rolar) linha.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // A lista mostra só linhas inteiras (13/11/2026): a altura da área de rolagem é o cabeçalho + um número inteiro de
  // linhas, e a rolagem para sempre no começo de uma linha (scroll-snap), nunca no meio de uma célula
  function ajustarTabela() {
    const box = conteudo && conteudo.querySelector('.cad-geo__tabela'); if (!box) return;
    box.style.height = ''; box.style.flex = '';
    const linha = box.querySelector('tbody tr'); const cab = box.querySelector('thead');
    if (!linha || !cab || !box.clientHeight) return;
    const h = linha.getBoundingClientRect().height; const c = cab.getBoundingClientRect().height;
    box.style.scrollPaddingTop = `${c}px`;
    if (box.scrollHeight <= box.clientHeight + 1) return; // todas as linhas cabem
    const n = Math.max(1, Math.floor((box.clientHeight - c) / h));
    const borda = box.offsetHeight - box.clientHeight; // a linha de cima da área
    box.style.flex = 'none'; box.style.height = `${c + n * h + borda}px`;
  }
  window.addEventListener('resize', () => { if (ui.guia === 'talhoes' && location.hash.startsWith('#/cadastros')) ajustarTabela(); });

  // Recolher a lista dá a largura toda ao mapa (13/11/2026)
  function alternarLista() {
    ui.listaRecolhida = !ui.listaRecolhida;
    const sec = conteudo.querySelector('.cad-geo'); const lista = conteudo.querySelector('#cad-geo-lista');
    if (!sec || !lista) return;
    sec.classList.toggle('cad-geo--recolhida', ui.listaRecolhida);
    lista.hidden = ui.listaRecolhida;
    const mostrar = conteudo.querySelector('.cad-geo__acoes > .cad-geo__alternar');
    if (mostrar) mostrar.hidden = !ui.listaRecolhida;
    if (!ui.listaRecolhida) ajustarTabela();
    (ui.listaRecolhida ? mostrar : lista.querySelector('.cad-geo__alternar'))?.focus();
    if (mapa) { mapa.invalidateSize({ pan: false }); if (!edicao) enquadrar(true); }
  }

  // ----- Desenhar e editar o polígono (12/11/2026) -----
  // Cantos da camada: o polígono traz um anel ([[...]]); a linha do desenho em andamento, a lista direto
  const coordsDe = (camada) => { const ll = camada.getLatLngs(); return (Array.isArray(ll[0]) ? ll[0] : ll).map((p) => [Number(p.lat.toFixed(7)), Number(p.lng.toFixed(7))]); };
  const talhaoDe = (nome) => talhoesDa().find((t) => t.nome === nome);
  const podeDesenhar = () => {
    if (mapa && mapa.pm) return true;
    Aviso.mostrar('O desenho no mapa precisa de conexão com a internet.'); return false;
  };
  const cruza = () => !!(edicao && edicao.camada && edicao.camada.pm.hasSelfIntersection && edicao.camada.pm.hasSelfIntersection());

  // Apaga os outros talhões para o escolhido ficar em destaque
  function destacar(nome) {
    ui.talhao = nome; ui.selecionados.clear(); ui.selecionados.add(nome);
    Object.entries(camadas).forEach(([t, c]) => { if (t !== nome) c.setStyle(ESTILO_APAGADO); });
    marcarLinha(nome, true);
    mapa.getContainer().classList.add('cad-mapa--editando');
    pintarAcoes();
  }

  function iniciarDesenho(nome) {
    if (!nome || !podeDesenhar()) return;
    sairDaEdicao();
    edicao = { talhao: nome, modo: 'desenhar', novo: true, pontos: [] };
    destacar(nome);
    mapa.on('pm:drawstart', aoComecarDesenho);
    mapa.on('pm:create', aoTerminarDesenho);
    mapa.pm.enableDraw('Polygon', { snappable: true, snapDistance: 15, allowSelfIntersection: false, finishOn: null,
      templineStyle: { color: '#ffd400' }, hintlineStyle: { color: '#ffd400', dashArray: [5, 5] }, pathOptions: { ...ESTILO_EDICAO } });
    document.addEventListener('keydown', escNoDesenho);
    pintarBarra();
  }
  // Esc cancela o desenho (18/11/2026: sem a faixa embaixo do mapa durante o desenho, não há botão Cancelar)
  function escNoDesenho(e) {
    if (e.key !== 'Escape' || !edicao || edicao.modo !== 'desenhar') return;
    e.preventDefault(); sairDaEdicao();
  }
  function aoComecarDesenho({ workingLayer }) {
    const ler = () => { if (edicao && edicao.modo === 'desenhar') { edicao.pontos = coordsDe(workingLayer); pintarBarra(); } };
    workingLayer.on('pm:vertexadded', ler);
    edicao.ler = ler;
  }
  function aoTerminarDesenho({ layer }) {
    mapa.off('pm:drawstart', aoComecarDesenho); mapa.off('pm:create', aoTerminarDesenho);
    document.removeEventListener('keydown', escNoDesenho);
    if (!edicao) { layer.remove(); return; }
    // Fechou o polígono (clique no primeiro canto ou Salvar; 18/11/2026): grava direto, sem passar pela edição.
    // Para ajustar depois, Editar
    edicao.modo = 'editar'; edicao.camada = layer;
    salvarEdicao();
  }
  function desfazerPonto() {
    const d = mapa && mapa.pm && mapa.pm.Draw && mapa.pm.Draw.Polygon;
    if (d && d._removeLastVertex) { d._removeLastVertex(); if (edicao && edicao.ler) edicao.ler(); }
  }

  function iniciarEdicao(nome) {
    if (!nome || !podeDesenhar()) return;
    if (edicao && edicao.talhao === nome) return;
    sairDaEdicao();
    const camada = camadas[nome]; if (!camada) return;
    edicao = { talhao: nome, modo: 'editar', novo: false, camada };
    destacar(nome);
    camada.setStyle(ESTILO_EDICAO); camada.closeTooltip(); camada.unbindTooltip();
    mapa.fitBounds(camada.getBounds(), { padding: [40, 40], maxZoom: 17 });
    ligarEdicao(camada);
  }
  // Cantos (bolinha branca): arrastar move, botão direito remove; o que fazem aparece ao passar o mouse.
  // Criar canto como no QGIS (13/11/2026): ao passar o mouse sobre um lado, o lado se destaca e um "+" acompanha o mouse;
  // o clique cria o canto exatamente ali. Sem os pontos fixos no meio dos lados (hideMiddleMarkers)
  const OPCOES_EDICAO = { allowSelfIntersection: true, snappable: true, snapDistance: 12, draggable: false, removeVertexOn: 'contextmenu', hideMiddleMarkers: true };
  function ligarEdicao(camada) {
    camada.pm.enable(OPCOES_EDICAO);
    camada.on('pm:markerdrag pm:edit pm:vertexadded pm:vertexremoved', () => { pintarBarra(); setTimeout(dicasDosPontos, 0); });
    camada.on('pm:markerdragstart', () => { arrastandoCanto = true; esconderFantasma(); });
    camada.on('pm:markerdragend', () => { arrastandoCanto = false; });
    pintarBarra(); dicasDosPontos();
  }
  function dicasDosPontos() {
    if (!mapa) return;
    mapa.getContainer().querySelectorAll('.marker-icon').forEach((m) => { m.title = 'Arraste para mover o vértice · botão direito para remover'; });
  }

  let fantasma = null; let ladoRealce = null; let alvoCanto = null; let arrastandoCanto = false;
  const anelDe = (camada) => { const ll = camada.getLatLngs(); return Array.isArray(ll[0]) ? ll[0] : ll; };
  function ligarCriarCanto(el) {
    mapa.on('mousemove', aoMoverNaEdicao);
    el.addEventListener('mouseleave', esconderFantasma);
  }
  function aoMoverNaEdicao(e) {
    if (!edicao || edicao.modo !== 'editar' || !edicao.camada || arrastandoCanto) { esconderFantasma(); return; }
    const anel = anelDe(edicao.camada);
    const p = mapa.latLngToLayerPoint(e.latlng);
    let melhor = null;
    for (let i = 0; i < anel.length; i++) {
      const a = mapa.latLngToLayerPoint(anel[i]); const b = mapa.latLngToLayerPoint(anel[(i + 1) % anel.length]);
      if (p.distanceTo(a) < 12) { esconderFantasma(); return; } // em cima de um canto: vale o canto
      const q = L.LineUtil.closestPointOnSegment(p, a, b); const d = p.distanceTo(q);
      if (d < 10 && (!melhor || d < melhor.d)) melhor = { d, i, q, a, b };
    }
    if (!melhor) { esconderFantasma(); return; }
    const ll = mapa.layerPointToLatLng(melhor.q);
    alvoCanto = { i: melhor.i, ll };
    if (!fantasma) {
      ladoRealce = L.polyline([], { color: '#ffd400', weight: 10, opacity: 0.45, interactive: false, pmIgnore: true }).addTo(mapa);
      fantasma = L.marker(ll, { pmIgnore: true, keyboard: false, zIndexOffset: 1000, title: 'Clique para criar um vértice aqui',
        icon: L.divIcon({ className: 'cad-mais', html: '+', iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(mapa)
        .on('click', (ev) => { L.DomEvent.stopPropagation(ev); criarCanto(); });
    }
    fantasma.setLatLng(ll);
    ladoRealce.setLatLngs([mapa.layerPointToLatLng(melhor.a), mapa.layerPointToLatLng(melhor.b)]);
  }
  function esconderFantasma() {
    if (fantasma) { fantasma.remove(); fantasma = null; }
    if (ladoRealce) { ladoRealce.remove(); ladoRealce = null; }
    alvoCanto = null;
  }
  function criarCanto() {
    if (!edicao || !edicao.camada || !alvoCanto) return;
    const c = edicao.camada; const anel = anelDe(c).slice();
    anel.splice(alvoCanto.i + 1, 0, alvoCanto.ll);
    esconderFantasma();
    c.pm.disable(); c.setLatLngs(anel); c.pm.enable(OPCOES_EDICAO);
    pintarBarra(); setTimeout(dicasDosPontos, 0);
  }

  // Sai do desenho ou da edição sem gravar: o mapa volta ao desenho gravado (o talhão continua selecionado)
  function sairDaEdicao() {
    esconderFantasma();
    document.removeEventListener('keydown', escNoDesenho);
    if (!edicao) return;
    const e = edicao; edicao = null;
    if (mapa && mapa.pm) {
      mapa.pm.disableDraw();
      mapa.off('pm:drawstart', aoComecarDesenho); mapa.off('pm:create', aoTerminarDesenho);
    }
    if (e.camada && e.camada.pm) { e.camada.pm.disable(); e.camada.off('pm:markerdrag pm:edit pm:vertexadded pm:vertexremoved'); }
    if (e.novo && e.camada) e.camada.remove();
    if (!e.novo && e.camada) {
      const g = Geo.daFazenda(ui.fazenda);
      e.camada.setLatLngs(g[e.talhao]);
      e.camada.bindTooltip(dicaPoligono(e.talhao, g[e.talhao]), { sticky: true, direction: 'top', className: 'mapa-detalhe' });
    }
    Object.entries(camadas).forEach(([t, c]) => c.setStyle(estiloDe(t)));
    if (mapa) mapa.getContainer().classList.remove('cad-mapa--editando');
    marcarLinha(ui.talhao, false);
    pintarAcoes();
    pintarBarra();
  }

  function salvarEdicao() {
    if (!edicao || !edicao.camada) return;
    esconderFantasma();
    if (cruza()) { pintarBarra('As linhas do polígono se cruzam. Ajuste os vértices para salvar.'); return; }
    const coords = coordsDe(edicao.camada);
    if (coords.length < 3) { pintarBarra('O polígono precisa de pelo menos 3 vértices.'); return; }
    const nome = edicao.talhao; const novo = edicao.novo;
    Geo.daFazenda(ui.fazenda)[nome] = coords;
    edicao.camada.pm.disable(); edicao = null;
    salvo(novo ? `Polígono de ${nome} salvo` : `Polígono de ${nome} atualizado`); redesenhar();
    Aviso.mostrar(`${novo ? 'Polígono salvo' : 'Polígono atualizado'}: ${esc(nome)} · ${n1(Geo.areaHa(coords))} ha de área geométrica`);
  }

  // Excluir o polígono: do talhão em edição ou dos selecionados (botão Excluir da barra; em lote desde 13/11/2026).
  // Talhão selecionado sem polígono é ignorado. Confirmação e Desfazer valem para todos de uma vez
  function excluirPoligono() {
    if (edicao && edicao.novo) return;
    const f = ui.fazenda; const g = Geo.daFazenda(f);
    const nomes = (edicao ? [edicao.talhao] : [...ui.selecionados]).filter((n) => g[n]);
    if (!nomes.length) return;
    const um = nomes.length === 1;
    Modal.confirmar({
      // 18/11/2026: só a quantidade, sem os nomes dos talhões e sem texto explicativo
      titulo: `Excluir o polígono de ${nomes.length} ${um ? 'talhão' : 'talhões'}?`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir', classe: 'perigo', acao: () => {
        if (edicao && edicao.camada) edicao.camada.pm.disable();
        edicao = null;
        nomes.forEach((n) => delete g[n]);
        const rotulo = um ? `Polígono de ${nomes[0]}` : `${nomes.length} polígonos`;
        // 18/11/2026: sem o aviso com Desfazer (a confirmação já protege a exclusão)
        salvo(`${rotulo} ${um ? 'excluído' : 'excluídos'}`); redesenhar();
      } }]
    });
  }

  // Barra embaixo do mapa, só durante o desenho ou a edição: o que está sendo feito, a área ao vivo e os botões
  function pintarBarra(erro = '') {
    const el = conteudo && conteudo.querySelector('#cad-edicao'); if (!el) return;
    if (!edicao) { el.className = 'cad-edicao'; el.innerHTML = ''; return; }
    const t = talhaoDe(edicao.talhao) || { nome: edicao.talhao, area: 0 };
    const seCruza = edicao.modo === 'editar' && cruza();
    const aviso = erro || (seCruza ? 'As linhas do polígono se cruzam. Ajuste os vértices para salvar.' : '');
    el.className = 'cad-edicao cad-edicao--ativa';
    // Desenho (18/11/2026): a orientação fica na faixa embaixo do mapa durante todo o desenho e some quando o
    // polígono é criado (clique no primeiro vértice, que já grava) ou cancelado (Esc)
    if (edicao.modo === 'desenhar') {
      el.className = 'cad-edicao cad-edicao--ativa cad-edicao--desenho';
      el.innerHTML = `<p class="cad-edicao__titulo">${Icones.poligono}<span><strong>Desenhando ${esc(t.nome)}</strong> · Clique no mapa para marcar os vértices. Para salvar, clique no primeiro ponto. Esc cancela.</span></p>`;
      return;
    }
    // Edição (18/11/2026): só "Editando T04", sem as áreas e sem Excluir polígono (excluir fica no ícone da barra)
    el.innerHTML = `<div class="cad-edicao__info">
           <p class="cad-edicao__titulo">${Icones.lapis}<strong>Editando ${esc(t.nome)}</strong></p>
           ${aviso ? `<p class="cad-erro" role="alert">${aviso}</p>` : ''}
         </div>
         <div class="cad-edicao__acoes">
           <button class="botao botao--secundario botao--p" type="button" data-acao="edicao-cancelar">Cancelar</button>
           <button class="botao botao--primario botao--p" type="button" data-acao="edicao-salvar" ${seCruza ? 'disabled' : ''}>Salvar</button>
         </div>`;
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

  // ----- Importar geometria: arquivo → conferência (mapa + correspondência com o ERP Compass) → importar -----
  // Só recebe desenho o talhão que já existe no cadastro (vem do ERP). Talhão que não está no cadastro não é criado aqui.
  // Desde 12/11/2026, o arquivo também substitui o polígono de um talhão que já tem (desde 13/11/2026, já vem marcado).
  // 16/11/2026: a janela abre com duas abas, **Um talhão** (escolhe o talhão, importa o polígono dele e confere no mapa) e
  // **Vários talhões** (a importação em lote de antes, com a correspondência). Sempre abre em Um talhão, já com o talhão
  // selecionado (sem seleção, o primeiro sem geometria). Pequena na escolha do arquivo; do tamanho da janela na conferência
  function modalImportar() {
    const f = ui.fazenda; let feicoes = null; let coluna = ''; let mapaImp = null;
    let modo = 'um'; // 16/11/2026: a janela sempre abre em Um talhão
    const ts0 = DADOS.talhoes[f] || [];
    let alvoUm = ui.selecionados.size === 1 ? [...ui.selecionados][0]
      : ((ts0.find((t) => !Geo.daFazenda(f)[t.nome]) || ts0[0] || {}).nome || '');
    const modal = Modal.abrir(`
      <div class="modal__corpo">
        <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
        <h2 class="modal__titulo" id="modal-titulo">Importar geometria · ${esc(f)}</h2>
        <p class="modal__subtitulo" id="imp-sub">Escolha como deseja importar as geometrias.</p>
        <div id="imp-corpo"></div>
        <p class="cad-erro" role="alert"></p>
      </div>
      <div class="modal__rodape">
        <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
        <button class="botao botao--primario" type="button" id="imp-confirmar" disabled>Importar</button>
      </div>`, { classe: 'modal--cad-largo modal--cad-imp' });
    const raiz = modal.elemento; const corpo = raiz.querySelector('#imp-corpo'); const erro = raiz.querySelector('.cad-erro');
    const botao = raiz.querySelector('#imp-confirmar'); const sub = raiz.querySelector('#imp-sub');
    const caixa = raiz.querySelector('.modal') || raiz;

    function passoArquivo() {
      const ts = DADOS.talhoes[f] || [];
      corpo.innerHTML = `
        <div class="cad-modo" role="tablist" aria-label="Como importar">
          <button class="cad-modo__opcao ${modo === 'um' ? 'cad-modo__opcao--ativa' : ''}" type="button" role="tab" aria-selected="${modo === 'um'}" data-modo="um">Um talhão</button>
          <button class="cad-modo__opcao ${modo === 'varios' ? 'cad-modo__opcao--ativa' : ''}" type="button" role="tab" aria-selected="${modo === 'varios'}" data-modo="varios">Vários talhões</button>
        </div>
        ${modo === 'um' ? `<div class="campo cad-imp__talhao"><label class="campo__rotulo" for="imp-talhao">Talhão</label>
            <select class="campo__controle" id="imp-talhao">${ts.map((t) => `<option value="${esc(t.nome)}" ${t.nome === alvoUm ? 'selected' : ''}>${esc(t.nome)} — ${n1(t.area)} ha${Geo.daFazenda(f)[t.nome] ? '' : ' · sem geometria'}</option>`).join('')}</select></div>`
          : `<p class="cad-imp__explica">As geometrias serão associadas aos talhões da Fazenda ${esc(f)} após conferência.</p>`}
        <label class="cad-soltar" id="imp-soltar">
          ${Icones.importar}
          <strong>Arraste o arquivo aqui ou clique para escolher</strong>
          <span>Formatos aceitos: Shapefile (.zip ou .shp + .shx + .dbf + .prj), KML e KMZ.</span>
          <input type="file" multiple accept=".zip,.shp,.shx,.dbf,.prj,.kml,.kmz">
        </label>`;
      corpo.querySelectorAll('[data-modo]').forEach((b) => b.addEventListener('click', () => {
        if (modo === b.dataset.modo) return;
        modo = b.dataset.modo; erro.textContent = ''; passoArquivo();
        corpo.querySelector(`[data-modo="${modo}"]`).focus();
      }));
      const selT = corpo.querySelector('#imp-talhao');
      if (selT) selT.addEventListener('change', () => { alvoUm = selT.value; });
      const soltar = corpo.querySelector('#imp-soltar');
      soltar.querySelector('input').addEventListener('change', (e) => receber(e.target.files));
      ['dragenter', 'dragover'].forEach((ev) => soltar.addEventListener(ev, (e) => { e.preventDefault(); soltar.classList.add('cad-soltar--sobre'); }));
      ['dragleave', 'drop'].forEach((ev) => soltar.addEventListener(ev, (e) => { e.preventDefault(); soltar.classList.remove('cad-soltar--sobre'); }));
      soltar.addEventListener('drop', (e) => receber(e.dataTransfer.files));
    }

    async function receber(arquivos) {
      erro.textContent = '';
      if (!arquivos || !arquivos.length) return;
      try {
        feicoes = await ArquivoGeo.ler(arquivos, { lote: modo === 'varios' }); // lote: .shp, .shx e .dbf obrigatórios
      } catch (e) { erro.textContent = e.message || 'Não foi possível ler o arquivo.'; return; }
      const colunas = [...new Set(feicoes.flatMap((x) => Object.keys(x.atributos)))];
      coluna = ['talh', 'nome', 'name', 'gleba', 'field', 'descr'].map((p) => colunas.find((c) => c.toLowerCase().includes(p))).find(Boolean) || colunas[0] || '';
      feicoes.forEach((x) => { x.area = Geo.areaHa(x.coords); x.alvo = ''; });
      feicoes.forEach((x, i) => ligarPeloNome(x, i));
      // Um talhão (16/11/2026): o arquivo precisa ter um polígono só; com mais, avisa e fica na escolha do arquivo
      if (modo === 'um' && feicoes.length !== 1) {
        const n = feicoes.length; feicoes = null;
        corpo.querySelector('#imp-soltar input').value = '';
        erro.textContent = `O arquivo tem ${n} polígonos. Para importar um talhão, use um arquivo com um polígono só. Para vários talhões, use a aba Vários talhões.`;
        return;
      }
      caixa.classList.add('modal--tela'); // a conferência ocupa a janela (13/11/2026)
      if (modo === 'um') passoUm();
      else {
        sub.textContent = `Cada talhão do ${ERP} recebe um polígono do arquivo. Confira a correspondência antes de importar.`;
        caixa.classList.add('modal--imp-lote'); // 17/11/2026: cabeçalho enxuto, como em Um talhão, para o mapa ganhar espaço
        passoConferir(colunas);
      }
    }

    // Um talhão (16/11/2026): o arquivo tem um polígono só, que vai para o talhão escolhido. A conferência mostra no mapa
    // o polígono do arquivo em verde e os talhões já cadastrados em cinza, com legenda, e as áreas em cima. Dá para trocar
    // o talhão antes de importar
    let escolhidoUm = null;
    function passoUm() {
      sub.textContent = 'Confira o polígono no mapa antes de importar.';
      caixa.classList.add('modal--imp-um'); // cabeçalho enxuto, mais espaço para o mapa (16/11/2026)
      const ts = talhoesFaz();
      escolhidoUm = feicoes[0];
      corpo.innerHTML = `
        <div class="cad-imp__um">
          <div class="campo cad-imp__talhao"><label class="campo__rotulo" for="imp-talhao">Talhão</label>
            <select class="campo__controle" id="imp-talhao">${ts.map((t) => `<option value="${esc(t.nome)}" ${t.nome === alvoUm ? 'selected' : ''}>${esc(t.nome)} — ${n1(t.area)} ha${temPoligono(t.nome) ? '' : ' · sem geometria'}</option>`).join('')}</select></div>
          <dl class="cad-imp__numeros" id="imp-numeros"></dl>
          <button class="botao botao--secundario botao--p cad-imp__trocar" type="button" data-trocar>${Icones.importar} Trocar arquivo</button>
        </div>
        <div id="imp-mapa" class="cad-mapa cad-mapa--p cad-imp__mapa-um"></div>
        <p class="cad-imp__legenda"><span><i class="cad-imp__cor cad-imp__cor--cadastrado"></i>Talhão cadastrado</span><span><i class="cad-imp__cor cad-imp__cor--importado"></i>Talhão importado</span></p>`;
      const numeros = corpo.querySelector('#imp-numeros');
      const selT = corpo.querySelector('#imp-talhao');
      let rotuloNovo = null;
      function pintarUm() {
        const t = ts.find((tt) => tt.nome === alvoUm) || {}; const tem = temPoligono(alvoUm);
        const atual = Geo.daFazenda(f)[alvoUm];
        numeros.innerHTML = `
          <div><dt>Área cadastrada</dt><dd>${n1(t.area || 0)} ha</dd></div>
          <div><dt>Polígono atual</dt><dd>${tem ? `${n1(Geo.areaHa(atual))} ha` : '<span class="cad-imp__tag">Sem geometria</span>'}</dd></div>
          <div><dt>Polígono do arquivo</dt><dd>${n1(escolhidoUm.area)} ha <small>${esc(escolhidoUm.nome)}</small></dd></div>`;
        botao.disabled = !alvoUm;
        botao.textContent = tem ? 'Substituir polígono' : 'Importar polígono';
        if (!mapaImp) return;
        const el = rotuloNovo && rotuloNovo.getElement(); if (el) el.textContent = alvoUm;
      }
      if (window.L) {
        mapaImp = L.map(corpo.querySelector('#imp-mapa'), { zoomControl: true });
        L.tileLayer(SATELITE, { maxZoom: 19, maxNativeZoom: 18, attribution: 'Imagens © Esri, Maxar, Earthstar Geographics' }).addTo(mapaImp);
        // 16/11/2026: talhões já cadastrados em cinza (borda e preenchimento) com o nome em preto; o importado em verde
        Geo.poligonos(f).forEach((pg) => {
          L.polygon(pg.coords, { color: '#e3e6e8', weight: 1.5, fillColor: '#9ca3a8', fillOpacity: 0.6, interactive: false }).addTo(mapaImp);
          L.marker(pg.centro, { interactive: false, keyboard: false, icon: L.divIcon({ className: 'cad-imp__rotulo cad-imp__rotulo--cadastrado', html: esc(pg.talhao), iconSize: null }) }).addTo(mapaImp);
        });
        L.polygon(escolhidoUm.coords, { color: '#ffffff', weight: 2, fillColor: '#1baf7a', fillOpacity: 0.7, interactive: false }).addTo(mapaImp);
        rotuloNovo = L.marker(Geo.centro(escolhidoUm.coords), { interactive: false, keyboard: false, icon: L.divIcon({ className: 'cad-imp__rotulo cad-imp__rotulo--ok', html: '', iconSize: null }) }).addTo(mapaImp);
        const enquadrar = () => {
          const atual = Geo.daFazenda(f)[alvoUm];
          const pts = [...escolhidoUm.coords, ...(atual || [])];
          mapaImp.fitBounds(L.latLngBounds(pts), { padding: [32, 32], maxZoom: 17 });
        };
        enquadrar(); pintarUm(); // o rótulo só existe depois que o mapa tem enquadramento
        selT.addEventListener('change', () => { alvoUm = selT.value; pintarUm(); enquadrar(); });
        const aoRedimensionar = () => { if (mapaImp && corpo.isConnected) mapaImp.invalidateSize(); else window.removeEventListener('resize', aoRedimensionar); };
        window.addEventListener('resize', aoRedimensionar);
      } else {
        corpo.querySelector('#imp-mapa').innerHTML = `<p class="mapa__sem">${Icones.info} Mapa indisponível: sem conexão com a internet.</p>`;
        selT.addEventListener('change', () => { alvoUm = selT.value; pintarUm(); });
        pintarUm();
      }
    }
    // Correspondência com o ERP Compass (13/11/2026): cada polígono do arquivo é ligado a um talhão do cadastro. Nome igual
    // (sem diferença de maiúsculas e acentos) já vem ligado; nome diferente fica em "Selecionar talhão" para a pessoa escolher.
    // 13/11/2026: toda linha ligada a um talhão já vem marcada, inclusive a que substitui um polígono que já existe (a linha
    // avisa "Substitui o polígono atual"); quem não quiser trocar, desmarca. Antes (12/11/2026), a que substituía vinha desmarcada.
    let escolhaAberta = null;
    function fecharEscolha() {
      if (!escolhaAberta) return;
      document.removeEventListener('mousedown', escolhaAberta.fora);
      escolhaAberta.painel.remove(); if (escolhaAberta.btn) escolhaAberta.btn.setAttribute('aria-expanded', 'false');
      escolhaAberta = null;
    }
    const nomeDa = (x, i) => String((coluna && x.atributos[coluna]) || '').trim() || `Polígono ${i + 1}`;
    const talhoesFaz = () => DADOS.talhoes[f] || [];
    const temPoligono = (nome) => !!Geo.daFazenda(f)[nome];
    function ligarPeloNome(x, i) {
      x.nome = nomeDa(x, i);
      const t = talhoesFaz().find((tt) => igual(tt.nome, x.nome) && !feicoes.slice(0, i).some((o) => o.alvo === tt.nome));
      x.alvo = t ? t.nome : '';
      x.incluir = !!t;
    }

    // Teste de 13/11/2026: tabela invertida. Uma linha por talhão do ERP Compass (à esquerda, com "Sem geometria" nos que
    // ainda não têm polígono) e, à direita, o polígono do arquivo ligado a ele. Polígonos do arquivo que não ficaram ligados
    // a nenhum talhão aparecem numa nota embaixo da tabela (ficam de fora da importação)
    function passoConferir(colunas) {
      corpo.innerHTML = `
        <div class="cad-imp__resumo">
          <div class="campo cad-imp__coluna"><span class="campo__rotulo" id="imp-coluna-rotulo">Coluna com nome dos talhões</span>
            <button class="cad-escolha" type="button" id="imp-coluna" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="imp-coluna-rotulo imp-coluna"></button></div>
          <strong class="cad-imp__total">${feicoes.length} ${feicoes.length === 1 ? 'polígono encontrado' : 'polígonos encontrados'} · ${n1(feicoes.reduce((s, x) => s + x.area, 0))} ha</strong>
          <button class="botao botao--secundario botao--p cad-imp__trocar" type="button" data-trocar>${Icones.importar} Trocar arquivo</button>
        </div>
        <div class="cad-imp">
          <div class="cad-imp__lado">
            <div class="cad-imp__tabela"><table class="tabela cad-imp__corresp">
              <thead><tr>
                <th class="tabela__marcar"><input type="checkbox" id="imp-todos" aria-label="Marcar todos os talhões ligados a um polígono"></th>
                <th>Talhão no Compass</th><th class="tabela__numero">Área (ha)</th>
                <th>Talhão no arquivo</th></tr></thead>
              <tbody id="imp-linhas"></tbody></table></div>
          </div>
          <div class="cad-imp__lado-mapa">
            <div id="imp-mapa" class="cad-mapa cad-mapa--p"></div>
            <p class="cad-imp__legenda"><span><i class="cad-imp__cor cad-imp__cor--cadastrado"></i>Talhão cadastrado</span><span><i class="cad-imp__cor cad-imp__cor--sem"></i>Polígono sem talhão</span><span><i class="cad-imp__cor cad-imp__cor--importado"></i>Polígono ligado ao talhão</span></p>
          </div>
        </div>`; // 17/11/2026: sem a dica embaixo, sem o "N selecionados" e sem o aviso dos polígonos sem talhão
      const linhas = corpo.querySelector('#imp-linhas'); const todos = corpo.querySelector('#imp-todos');
      const lado = corpo.querySelector('.cad-imp__lado'); const box = corpo.querySelector('.cad-imp__tabela');
      const doTalhao = (nome) => feicoes.find((x) => x.alvo === nome);
      const pintar = () => {
        linhas.innerHTML = talhoesFaz().map((t, k) => {
          const x = doTalhao(t.nome); const tem = temPoligono(t.nome);
          return `<tr>
            <td class="tabela__marcar"><input type="checkbox" data-k="${k}" ${x && x.incluir ? 'checked' : ''} ${x ? '' : 'disabled'}
                 aria-label="Importar o polígono do ${esc(t.nome)}" title="${x ? '' : 'Escolha o polígono do arquivo para poder importar'}"></td>
            <td><strong>${esc(t.nome)}</strong>${!tem ? '<span class="cad-imp__tag">Sem geometria</span>' : x ? '<span class="cad-imp__tag cad-imp__tag--troca" title="O polígono atual deste talhão é substituído pelo do arquivo">Substitui</span>' : ''}</td>
            <td class="tabela__numero">${n1(t.area)}</td>
            <td><button class="cad-escolha ${x ? '' : 'cad-escolha--vazio'}" type="button" data-k="${k}" aria-haspopup="listbox" aria-expanded="false"
                  aria-label="Polígono do arquivo para o ${esc(t.nome)}: ${x ? esc(x.nome) : 'nenhum'}">
                  <span>${x ? `${esc(x.nome)} <span class="cad-escolha__ha">(${n1(x.area)} ha)</span>` : 'Selecionar talhão'}</span>${Icones.abaixo}</button></td></tr>`;
        }).join('');
        const ligados = feicoes.filter((x) => x.alvo);
        const n = ligados.filter((x) => x.incluir).length;
        todos.disabled = !ligados.length;
        todos.checked = ligados.length > 0 && ligados.every((x) => x.incluir);
        todos.indeterminate = n > 0 && !todos.checked;
        botao.disabled = !n; botao.textContent = n ? `Importar ${n} ${n === 1 ? 'polígono' : 'polígonos'}` : 'Importar';
        ajustarImp(); pintarMapaImp();
      };
      pintar();
      // Só linhas inteiras na área de rolagem (a altura que sobra no modal),
      // com a rolagem parando no começo de uma linha. Refeito ao pintar e ao mudar o tamanho da janela
      function ajustarImp() {
        const tr = linhas.querySelector('tr'); const cab = box.querySelector('thead');
        if (!tr || !lado.clientHeight) return;
        const h = tr.getBoundingClientRect().height; const c = cab.getBoundingClientRect().height; const borda = box.offsetHeight - box.clientHeight;
        box.style.scrollPaddingTop = `${c}px`;
        const n = Math.max(1, Math.floor((lado.clientHeight - c - borda) / h));
        box.style.maxHeight = `${c + n * h + borda}px`;
      }
      ajustarImp();
      const aoRedimensionar = () => { if (box.isConnected) { ajustarImp(); if (mapaImp) mapaImp.invalidateSize(); } else window.removeEventListener('resize', aoRedimensionar); };
      window.addEventListener('resize', aoRedimensionar);
      linhas.addEventListener('change', (e) => {
        const t = talhoesFaz()[e.target.dataset.k]; const x = t && doTalhao(t.nome);
        if (!x || e.target.type !== 'checkbox') return;
        x.incluir = e.target.checked;
        erro.textContent = '';
        pintar();
      });
      linhas.addEventListener('click', (e) => {
        const b = e.target.closest('.cad-escolha'); if (!b) return;
        if (escolhaAberta && escolhaAberta.btn === b) fecharEscolha(); else abrirEscolha(Number(b.dataset.k), b);
      });
      corpo.querySelector('.cad-imp__tabela').addEventListener('scroll', () => fecharEscolha());

      // Lista suspensa (nossa, não a do navegador): busca, grupo "Disponíveis" (com a área), "Já associados nesta importação"
      // (16/11/2026: só informativo, sem cadeado; mostra a qual está ligado e pode ser escolhido: passa para cá) e a opção de desfazer. Altura limitada, só linhas inteiras; a rolagem para no começo de
      // uma linha. Abre embaixo do botão (ancora: elemento) ou no ponto do clique no mapa (ancora: {x, y})
      function abrirLista({ ancora, rotulo, placeholder, nenhum, itens, atual, aoEscolher }) {
        fecharEscolha();
        const painel = document.createElement('div');
        painel.className = 'cad-escolha__painel';
        painel.innerHTML = `
          <div class="cad-escolha__busca">${Icones.busca}<input type="text" placeholder="${placeholder}" aria-label="${placeholder.replace('...', '')}" autocomplete="off"></div>
          <div class="cad-escolha__lista" role="listbox" aria-label="${rotulo}"></div>`;
        raiz.appendChild(painel);
        const r = ancora.getBoundingClientRect ? ancora.getBoundingClientRect() : { left: ancora.x, right: ancora.x, top: ancora.y, bottom: ancora.y, width: 0 };
        const largura = Math.max(r.width, 300); // 16/11/2026: cabe a etiqueta Sem geometria
        painel.style.width = `${largura}px`;
        painel.style.left = `${Math.max(8, Math.min(r.left, innerWidth - largura - 8))}px`;
        if (innerHeight - r.bottom < 360 && r.top > innerHeight - r.bottom) painel.style.bottom = `${innerHeight - r.top + 4}px`;
        else painel.style.top = `${r.bottom + 4}px`;
        const lista = painel.querySelector('.cad-escolha__lista'); const busca = painel.querySelector('input');
        const item = (it) => `<button class="cad-escolha__item ${it.valor === atual ? 'cad-escolha__item--atual' : ''}" type="button" role="option"
            data-valor="${esc(it.valor)}" aria-selected="${it.valor === atual}" ${it.ligadoA ? `title="Já associado nesta importação (${esc(it.ligadoA)}). Escolher passa para cá."` : ''}>
            <span class="cad-escolha__nome">${esc(it.nome)}${it.semGeo ? '<span class="cad-imp__tag">Sem geometria</span>' : ''}</span>
            <span class="cad-escolha__area">${it.ligadoA ? `<span class="cad-escolha__ligado">${esc(it.ligadoA)}</span>` : ''}${n1(it.area)} ha</span></button>`;
        const pintarLista = () => {
          const q = Util.normalizar(busca.value).trim();
          const xs = itens().filter((it) => !q || Util.normalizar(it.nome).includes(q));
          const disp = xs.filter((it) => !it.ligadoA); const assoc = xs.filter((it) => it.ligadoA);
          lista.innerHTML = (atual !== '' && !q ? `<button class="cad-escolha__item cad-escolha__limpar" type="button" role="option" data-valor="">${nenhum}</button>` : '')
            + (disp.length ? `<div class="cad-escolha__grupo" role="presentation"><span>Disponíveis</span><span>Área</span></div>${disp.map(item).join('')}` : '')
            + (assoc.length ? `<div class="cad-escolha__grupo cad-escolha__grupo--sep" role="presentation"><span>Já associados nesta importação</span></div>${assoc.map(item).join('')}` : '')
            + (xs.length ? '' : `<p class="cad-escolha__vazio">Nada encontrado com "${esc(busca.value.trim())}".</p>`);
          lista.scrollTop = 0;
        };
        pintarLista();
        const marcado = lista.querySelector('.cad-escolha__item--atual'); if (marcado) marcado.scrollIntoView({ block: 'nearest' });
        busca.addEventListener('input', pintarLista);
        lista.addEventListener('click', (e) => { const b = e.target.closest('.cad-escolha__item'); if (b && !b.disabled) aoEscolher(b.dataset.valor); });
        const voltar = () => { if (ancora.focus) ancora.focus(); };
        painel.addEventListener('keydown', (e) => {
          const its = [...lista.querySelectorAll('.cad-escolha__item:not(:disabled)')];
          const pos = its.indexOf(document.activeElement);
          if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); fecharEscolha(); voltar(); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); (its[pos + 1] || its[0])?.focus(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); if (pos <= 0) busca.focus(); else its[pos - 1].focus(); }
          else if (e.key === 'Enter' && document.activeElement === busca && its.length === 1) { e.preventDefault(); aoEscolher(its[0].dataset.valor); }
          else if (e.key === 'Tab') fecharEscolha();
        });
        const btn = ancora.setAttribute ? ancora : null;
        if (btn) btn.setAttribute('aria-expanded', 'true');
        const fora = (e) => { if (!painel.contains(e.target) && !(btn && btn.contains(e.target))) fecharEscolha(); };
        escolhaAberta = { painel, btn, fora };
        setTimeout(() => document.addEventListener('mousedown', fora), 0);
        busca.focus();
      }

      // Pela tabela: na linha do talhão, escolher o polígono do arquivo
      function abrirEscolha(k, btn) {
        const t = talhoesFaz()[k]; const atual = doTalhao(t.nome);
        abrirLista({ ancora: btn, rotulo: 'Polígonos do arquivo', placeholder: 'Buscar talhão...', nenhum: 'Nenhum talhão',
          atual: atual ? String(feicoes.indexOf(atual)) : '',
          itens: () => feicoes.map((x, i) => ({ valor: String(i), nome: x.nome, area: x.area, ligadoA: x.alvo && x !== atual ? `no ${x.alvo}` : '' })),
          aoEscolher: (v) => escolher(k, v) });
      }
      // Pelo mapa (13/11/2026): clicar no polígono do arquivo abre ali a lista dos talhões do Compass
      // (16/11/2026: com a etiqueta Sem geometria nos talhões que ainda não têm polígono, como na tabela)
      function abrirEscolhaMapa(i, ponto) {
        const x = feicoes[i];
        const ligados = new Map(feicoes.filter((o) => o.alvo && o !== x).map((o) => [o.alvo, o]));
        abrirLista({ ancora: ponto, rotulo: 'Talhões do Compass', placeholder: 'Buscar talhão...', nenhum: 'Nenhum talhão', atual: x.alvo || '',
          itens: () => talhoesFaz().map((t) => ({ valor: t.nome, nome: t.nome, area: t.area, semGeo: !temPoligono(t.nome), ligadoA: ligados.has(t.nome) ? `polígono ${ligados.get(t.nome).nome}` : '' })),
          aoEscolher: (nome) => {
            // talhão já ligado a outro polígono: passa para este (um talhão recebe um polígono só)
            if (nome) feicoes.forEach((o) => { if (o !== x && o.alvo === nome) { o.alvo = ''; o.incluir = false; } });
            x.alvo = nome; x.incluir = !!nome;
            fecharEscolha(); erro.textContent = ''; pintar();
            const k = talhoesFaz().findIndex((t) => t.nome === nome);
            const linha = k >= 0 && linhas.querySelector(`.cad-escolha[data-k="${k}"]`)?.closest('tr');
            if (linha) { linha.scrollIntoView({ block: 'nearest' }); linha.classList.add('cad-imp__linha--nova'); setTimeout(() => linha.classList.remove('cad-imp__linha--nova'), 1400); }
          } });
      }
      // Liga o polígono i ao talhão da linha k (i vazio: desliga). Escolher já marca a linha
      function escolher(k, i) {
        const t = talhoesFaz()[k]; const antes = doTalhao(t.nome);
        if (antes) { antes.alvo = ''; antes.incluir = false; }
        const x = i === '' || i === undefined ? null : feicoes[Number(i)];
        if (x) { x.alvo = t.nome; x.incluir = true; }
        fecharEscolha(); erro.textContent = ''; pintar();
        const b = linhas.querySelector(`.cad-escolha[data-k="${k}"]`); if (b) b.focus();
      }
      todos.addEventListener('change', () => { feicoes.forEach((x) => { if (x.alvo) x.incluir = todos.checked; }); pintar(); });
      // Coluna com o nome dos talhões (17/11/2026): lista suspensa nossa, sempre visível, com busca, "Nenhum", uma linha
      // e as colunas do arquivo, cada uma com três valores de exemplo. Escolher já aplica (sem Cancelar nem Confirmar)
      const btnColuna = corpo.querySelector('#imp-coluna');
      const exemplos = (c) => {
        const vs = feicoes.map((x) => String(x.atributos[c] ?? '').trim()).filter(Boolean).slice(0, 3);
        return vs.join(vs.some((v) => v.includes(',')) ? '; ' : ', ') || '—';
      };
      const pintarColuna = () => {
        btnColuna.classList.toggle('cad-escolha--vazio', !coluna);
        btnColuna.innerHTML = `<span>${coluna ? esc(coluna) : 'Nenhum'}</span>${Icones.abaixo}`;
      };
      pintarColuna();
      function abrirColunas() {
        fecharEscolha();
        const painel = document.createElement('div');
        painel.className = 'cad-escolha__painel cad-colunas';
        painel.innerHTML = `
          <div class="cad-escolha__busca">${Icones.busca}<input type="text" placeholder="Buscar coluna..." aria-label="Buscar coluna" autocomplete="off"></div>
          <div class="cad-escolha__lista" role="listbox" aria-label="Colunas do arquivo"></div>`;
        raiz.appendChild(painel);
        const r = btnColuna.getBoundingClientRect(); const largura = Math.min(480, innerWidth - 16);
        painel.style.width = `${largura}px`;
        painel.style.left = `${Math.max(8, Math.min(r.left, innerWidth - largura - 8))}px`;
        painel.style.top = `${r.bottom + 4}px`;
        const lista = painel.querySelector('.cad-escolha__lista'); const busca = painel.querySelector('input');
        const item = (valor, nome, ex) => `<button class="cad-escolha__item ${valor === coluna ? 'cad-escolha__item--atual' : ''}" type="button" role="option"
            data-valor="${esc(valor)}" aria-selected="${valor === coluna}"><span class="cad-colunas__nome">${esc(nome)}</span><span class="cad-colunas__ex">${esc(ex)}</span></button>`;
        const pintarLista = () => {
          const q = Util.normalizar(busca.value).trim();
          const cs = colunas.filter((c) => !q || Util.normalizar(c).includes(q));
          lista.innerHTML = (q ? '' : `${item('', 'Nenhum', '')}<div class="cad-escolha__grupo cad-escolha__grupo--sep cad-colunas__cab" role="presentation"><span>Nome da coluna</span><span>Exemplos de valores</span></div>`)
            + (q && cs.length ? '<div class="cad-escolha__grupo cad-colunas__cab" role="presentation"><span>Nome da coluna</span><span>Exemplos de valores</span></div>' : '')
            + cs.map((c) => item(c, c, exemplos(c))).join('')
            + (cs.length ? '' : `<p class="cad-escolha__vazio">Nenhuma coluna com "${esc(busca.value.trim())}".</p>`);
          lista.scrollTop = 0;
        };
        pintarLista();
        const marcado = lista.querySelector('.cad-escolha__item--atual'); if (marcado) marcado.scrollIntoView({ block: 'nearest' });
        busca.addEventListener('input', pintarLista);
        lista.addEventListener('click', (e) => {
          const b = e.target.closest('.cad-escolha__item'); if (!b) return;
          coluna = b.dataset.valor;
          feicoes.forEach((x) => { x.alvo = ''; }); feicoes.forEach((x, i) => ligarPeloNome(x, i));
          fecharEscolha(); erro.textContent = ''; pintarColuna(); pintar(); btnColuna.focus();
        });
        painel.addEventListener('keydown', (e) => {
          const its = [...lista.querySelectorAll('.cad-escolha__item')];
          const pos = its.indexOf(document.activeElement);
          if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); fecharEscolha(); btnColuna.focus(); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); (its[pos + 1] || its[0])?.focus(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); if (pos <= 0) busca.focus(); else its[pos - 1].focus(); }
          else if (e.key === 'Enter' && document.activeElement === busca && its.length === 1) { e.preventDefault(); its[0].click(); }
          else if (e.key === 'Tab') fecharEscolha();
        });
        btnColuna.setAttribute('aria-expanded', 'true');
        const fora = (e) => { if (!painel.contains(e.target) && !btnColuna.contains(e.target)) fecharEscolha(); };
        escolhaAberta = { painel, btn: btnColuna, fora };
        setTimeout(() => document.addEventListener('mousedown', fora), 0);
        busca.focus();
      }
      btnColuna.addEventListener('click', () => { if (escolhaAberta && escolhaAberta.btn === btnColuna) fecharEscolha(); else abrirColunas(); });
      // Mapa da conferência: em cinza, os polígonos que os talhões já têm (com o nome), para comparar; por cima, os
      // polígonos do arquivo: amarelo = sem talhão (rótulo com o nome do arquivo), verde = ligado (rótulo com o nome do talhão)
      if (window.L) {
        mapaImp = L.map(corpo.querySelector('#imp-mapa'), { zoomControl: true });
        L.tileLayer(SATELITE, { maxZoom: 19, maxNativeZoom: 18, attribution: 'Imagens © Esri, Maxar, Earthstar Geographics' }).addTo(mapaImp);
        const pontos = [];
        Geo.poligonos(f).forEach((pg) => {
          // 16/11/2026: como em Um talhão, os já cadastrados em cinza com a etiqueta de nome preto
          L.polygon(pg.coords, { color: '#e3e6e8', weight: 1.5, fillColor: '#9ca3a8', fillOpacity: 0.6, interactive: false }).addTo(mapaImp);
          L.marker(pg.centro, { interactive: false, keyboard: false, icon: L.divIcon({ className: 'cad-imp__rotulo cad-imp__rotulo--cadastrado', html: esc(pg.talhao), iconSize: null }) }).addTo(mapaImp);
          pontos.push(...pg.coords);
        });
        camadasImp = feicoes.map((x, i) => {
          const c = L.polygon(x.coords, {}).addTo(mapaImp)
            .bindTooltip(() => `${esc(x.nome)} · ${n1(x.area)} ha${x.alvo ? ` → ${esc(x.alvo)}` : ''}<br><span class="cad-imp__dica-mapa">Clique para escolher o talhão</span>`, { sticky: true, className: 'mapa-detalhe' })
            .on('click', (e) => { L.DomEvent.stopPropagation(e); abrirEscolhaMapa(i, { x: e.originalEvent.clientX, y: e.originalEvent.clientY }); });
          const rotulo = L.marker(Geo.centro(x.coords), { interactive: false, keyboard: false, icon: L.divIcon({ className: 'cad-imp__rotulo', html: '', iconSize: null }) }).addTo(mapaImp);
          pontos.push(...x.coords);
          return { c, rotulo };
        });
        mapaImp.on('movestart', () => fecharEscolha());
        mapaImp.fitBounds(L.latLngBounds(pontos.length ? pontos : feicoes.flatMap((x) => x.coords)), { padding: [24, 24] });
        pintarMapaImp(); // depois do enquadramento: antes dele os rótulos ainda não existem
      } else corpo.querySelector('#imp-mapa').innerHTML = `<p class="mapa__sem">${Icones.info} Mapa indisponível: sem conexão com a internet.</p>`;
    }
    let camadasImp = [];
    function pintarMapaImp() {
      camadasImp.forEach(({ c, rotulo }, i) => {
        const x = feicoes[i]; const ok = !!x.alvo;
        c.setStyle(ok ? { color: '#ffffff', weight: 2, fillColor: '#1baf7a', fillOpacity: 0.55 } : { color: '#ffd400', weight: 2.5, fillColor: '#ffd400', fillOpacity: 0.3 });
        const el = rotulo.getElement();
        if (el) { el.textContent = ok ? x.alvo : x.nome; el.classList.toggle('cad-imp__rotulo--ok', ok); }
      });
    }

    botao.addEventListener('click', () => {
      if (modo === 'um') {
        if (!escolhidoUm || !alvoUm) return;
        const trocou = temPoligono(alvoUm);
        Geo.daFazenda(f)[alvoUm] = escolhidoUm.coords;
        if (mapaImp) mapaImp.remove();
        modal.fechar(); salvo();
        ui.selecionados.clear(); ui.selecionados.add(alvoUm); ui.talhao = alvoUm;
        redesenhar({ enquadrar: true });
        Aviso.mostrar(trocou ? `Polígono do ${alvoUm} substituído` : `Polígono do ${alvoUm} importado`);
        return;
      }
      const escolhidas = feicoes.filter((x) => x.incluir && x.alvo);
      const alvos = escolhidas.map((x) => x.alvo);
      if (new Set(alvos).size !== alvos.length) { erro.textContent = 'Há mais de um polígono ligado ao mesmo talhão. Deixe só um.'; return; }
      const g = Geo.daFazenda(f);
      escolhidas.forEach((x) => { g[x.alvo] = x.coords; });
      if (mapaImp) mapaImp.remove();
      fecharEscolha(); modal.fechar(); salvo(); redesenhar({ enquadrar: true });
      Aviso.mostrar(`${escolhidas.length} ${escolhidas.length === 1 ? 'polígono importado' : 'polígonos importados'}`);
    });

    // Trocar arquivo (16/11/2026): a prévia mostra o desenho antes de importar; se o arquivo for o errado, volta para a
    // escolha do arquivo, sem importar nada e mantendo a aba e o talhão
    corpo.addEventListener('click', (e) => {
      if (!e.target.closest('[data-trocar]')) return;
      fecharEscolha();
      if (mapaImp) { mapaImp.remove(); mapaImp = null; }
      camadasImp = []; feicoes = null; erro.textContent = '';
      caixa.classList.remove('modal--tela', 'modal--imp-um', 'modal--imp-lote');
      sub.textContent = 'Escolha como deseja importar as geometrias.';
      botao.disabled = true; botao.textContent = 'Importar';
      passoArquivo();
    });

    passoArquivo();
  }

  // ===== Safras (só consulta) =====
  function guiaSafras() {
    // 17/11/2026: quadro "Safras cadastradas" com a etiqueta Consulta · ERP Compass; colunas Safra · Data início ·
    // Data fim · Ano agrícola (o ano se repete em cada linha), todas com o mesmo texto; ordem de ordenarSafras
    const porNome = Object.fromEntries(DADOS.cadastroSafras.map((s) => [s.nome, s]));
    const data = (d) => (d ? Util.data(d) : '—');
    const linhas = Util.ordenarSafras(Object.keys(porNome)).map((n) => { const s = porNome[n]; return `<tr>
        <td>${esc(s.nome)}</td><td>${data(s.inicio)}</td><td>${data(s.fim)}</td><td>${esc(String(s.anoAgricola ?? '—'))}</td></tr>`; }).join('');
    return `
      <section class="cartao cad-safras">
        <div class="cad-safras__topo">
          <h2 class="cad-safras__titulo">Safras cadastradas</h2>
          <span class="cad-safras__etiqueta">Consulta · ${ERP}</span>
        </div>
        <div class="tabela-rolagem"><table class="tabela">
          <thead><tr><th>Safra</th><th>Data início</th><th>Data fim</th><th>Ano agrícola</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table></div>
      </section>`;
  }

  // ===== Culturas e variedades (atividade › cultura › variedades) =====
  // Lista de culturas à esquerda (16/11/2026), usada em Culturas e variedades e em Operações: como a lista de operações
  // do plano, título "Cultura" com o botão de recolher (recolhida, fica só o botão de mostrar); culturas por atividade.
  // opcoes: { atual, acao (data-acao do item), sub(cultura) (texto embaixo do nome), recolhida, alternar (data-acao do botão) }
  function listaCulturas({ atual, acao, sub, recolhida, alternar }) {
    // Recolhida (16/11/2026): a lista some e o quadro da direita ocupa a largura toda; o botão "» Culturas" fica no
    // cabeçalho do quadro, antes das setas (botaoMostrarCulturas)
    if (recolhida) return '';
    const itens = DADOS.atividades.map((a) => {
      const cs = DADOS.cadastroCulturas.filter((x) => x.atividade === a);
      return `<li class="cad-lista__grupo">${esc(a)}</li>${cs.map((x) => `<li><button class="cad-item ${x.nome === atual ? 'cad-item--ativo' : ''}" type="button" data-acao="${acao}" data-nome="${esc(x.nome)}">
          <span>${esc(x.nome)}<span class="cad-item__sub">${sub(x)}</span></span></button></li>`).join('') || '<li class="cad-lista__vazio">Nenhuma cultura cadastrada</li>'}`;
    }).join('');
    return `<aside class="cartao cad-culturas" aria-label="Culturas">
        <div class="ops-lista__topo cad-culturas__topo">
          <h2 class="rotulo-secao">Cultura</h2>
          <button class="botao-icone" type="button" data-acao="${alternar}" title="Recolher lista" aria-label="Recolher lista de culturas">${Icones.recolher}</button>
        </div>
        <ul class="cad-lista">${itens}</ul>
      </aside>`;
  }

  const botaoMostrarCulturas = (alternar) => `<button class="botao botao--secundario botao--p cad-mostrar-culturas" type="button" data-acao="${alternar}"
      title="Mostrar a lista de culturas" aria-label="Mostrar lista de culturas">${Icones.expandir} Culturas</button>`;

  function guiaCulturas() {
    const c = DADOS.cadastroCulturas.find((x) => x.nome === ui.cultura);
    const lista = listaCulturas({ atual: ui.cultura, acao: 'cultura', recolhida: ui.culturasRecolhida, alternar: 'alternar-culturas',
      sub: (x) => { const n = DADOS.variedades.filter((v) => v.cultura === x.nome).length; return `${n} ${n === 1 ? 'variedade' : 'variedades'}`; } });
    return `
      <div class="cad-duas ${ui.culturasRecolhida ? 'cad-duas--recolhida' : ''}">
        ${lista}
        <div class="cad-coluna">${c ? painelCultura(c) : '<section class="cartao cad-vazio"><h3>Nenhuma cultura cadastrada</h3></section>'}</div>
      </div>`;
  }


  function painelCultura(c) {
    const vs = DADOS.variedades.filter((v) => v.cultura === c.nome);
    return `
      <section class="cartao">
        <div class="cad-topo cad-topo--cultura">
          ${ui.culturasRecolhida ? botaoMostrarCulturas('alternar-culturas') : ''}${navegacaoCulturas(c)}<h2 class="cad-topo__titulo">${esc(c.nome)}</h2>
        </div>
        ${tabelaVariedades(c, vs)}
      </section>`;
  }

  // Variedades (11/11/2026): só a tabela Variedade · Ciclo (dias), para consulta (sem inserir nem editar)
  // Ciclo (dias) por fazenda (11/11/2026): o ciclo muda com a região da fazenda. Uma coluna por fazenda, com o nome
  // ("Faz. Boa Vista") e, embaixo, a etiqueta da região ("Região Norte"), como o produto e o grupo de insumo no plano
  const regiaoDe = (f) => (DADOS.regiaoFazenda || {})[f] || '';
  const cicloNaFazenda = (v, f) => Util.cicloVariedade(v, f);
  // Setas ‹ › antes do nome da cultura (16/11/2026), como as de operação no plano: anterior e próxima na ordem da
  // lista (Agricultura, Pecuária, Silvicultura); na primeira, ‹ fica apagada; na última, ›
  function navegacaoCulturas(c, acao = 'cultura') {
    const todas = DADOS.atividades.flatMap((a) => DADOS.cadastroCulturas.filter((x) => x.atividade === a));
    const i = todas.indexOf(c);
    if (todas.length < 2) return '';
    const botao = (destino, sentido) => {
      const rotulo = sentido === 'anterior' ? 'Cultura anterior' : 'Próxima cultura';
      const icone = sentido === 'anterior' ? Icones.anterior : Icones.proxima;
      if (!destino) return `<button class="botao-icone op-navegar" type="button" disabled title="${rotulo}" aria-label="${rotulo}">${icone}</button>`;
      const dica = `${rotulo}: ${esc(destino.nome)}`;
      return `<button class="botao-icone op-navegar" type="button" data-acao="${acao}" data-nome="${esc(destino.nome)}" title="${dica}" aria-label="${dica}">${icone}</button>`;
    };
    return `<div class="op-navegacao">${botao(todas[i - 1], 'anterior')}${botao(todas[i + 1], 'proxima')}</div>`;
  }

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
  // Operações (16/11/2026): à esquerda, a mesma lista de culturas; à direita, "‹ › Soja" e os grupos de operação da
  // cultura, um embaixo do outro, cada um com o Tipo (Plantio · Aplicação de insumos · Operação de campo · Colheita)
  // e as operações com o DAP padrão. Grupos e operações vêm do ERP Compass; aqui só se escolhem o Tipo e o DAP padrão,
  // que valem para os planos criados depois pelo "Usar operações cadastradas no ERP Compass" (planos já criados não mudam)
  const TIPOS_CADASTRO = ['Plantio', 'Aplicação de insumos', 'Operação de campo', 'Colheita'];
  // Tipo mostrado a partir do tipo do modelo: Sementes = Plantio; Defensivos e Fertilidade = Aplicação de insumos
  const tipoMostrado = (t) => ({ Sementes: 'Plantio', Defensivos: 'Aplicação de insumos', Fertilidade: 'Aplicação de insumos' }[t] || t);
  function guiaOperacoes() {
    if (!DADOS.cadastroCulturas.some((c) => c.nome === ui.culturaOp)) ui.culturaOp = (DADOS.cadastroCulturas[0] || {}).nome;
    const cultura = ui.culturaOp; const c = DADOS.cadastroCulturas.find((x) => x.nome === cultura); const grupos = modelo(cultura) || [];
    const lista = listaCulturas({ atual: cultura, acao: 'cultura-op', recolhida: ui.opsRecolhida, alternar: 'alternar-ops',
      sub: (x) => { const n = (modelo(x.nome) || []).length; return n ? `${n} ${n === 1 ? 'grupo de tarefa' : 'grupos de tarefa'}` : 'Nenhum grupo'; } });
    const corpo = !grupos.length
      ? `<div class="cad-vazio"><h3>Nenhum grupo de tarefa para ${esc(cultura || '')}</h3><p>Os grupos e as tarefas desta cultura são cadastrados no ${ERP}.</p></div>`
      : grupos.map((g, gi) => `
        <section class="cad-grupo cad-grupo--ops" aria-label="Grupo ${esc(g.nome)}">
          <div class="cad-grupo__topo">
            <strong class="cad-grupo__nome">${esc(g.nome)}</strong>
            <label class="cad-grupo__tipo">Tipo
              <select class="campo__controle" data-campo="op-tipo" data-g="${gi}" aria-label="Tipo do grupo ${esc(g.nome)}">
                ${TIPOS_CADASTRO.map((t) => `<option ${t === tipoMostrado(g.tipo) ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
            <div class="cad-grupo__fim">${g.operacoes.length} ${g.operacoes.length === 1 ? 'tarefa' : 'tarefas'}</div>
          </div>
          ${g.operacoes.length ? `<table class="tabela tabela--compacta cad-ops">
            <thead><tr><th>Tarefa</th><th class="tabela__numero"><span class="titulo-dica" title="Dias após o plantio. Negativo = antes do plantio">DAP padrão</span></th></tr></thead>
            <tbody>${g.operacoes.map((o, oi) => `<tr>
              <td>${esc(o.nome)}</td>
              <td class="tabela__numero"><input class="cad-campo cad-campo--num" data-campo="op-dap" data-g="${gi}" data-o="${oi}" inputmode="numeric" value="${o.dap ?? ''}"
                placeholder="${g.tipo === 'Colheita' ? 'pelo ciclo' : '—'}" aria-label="DAP padrão de ${esc(o.nome)}"></td>
            </tr>`).join('')}</tbody></table>` : '<p class="cad-nota">Nenhuma tarefa neste grupo.</p>'}
        </section>`).join('');
    return `
      <div class="cad-duas ${ui.opsRecolhida ? 'cad-duas--recolhida' : ''}">
        ${lista}
        <div class="cad-coluna"><section class="cartao cad-ops-quadro">
          <div class="cad-topo cad-topo--cultura">${ui.opsRecolhida ? botaoMostrarCulturas('alternar-ops') : ''}${c ? navegacaoCulturas(c, 'cultura-op') : ''}<h2 class="cad-topo__titulo">${esc(cultura || '')}</h2></div>
          ${grupos.length ? `<p class="cad-nota cad-nota--ops">Defina o tipo do grupo de tarefa e preencha o DAP de cada tarefa. As tarefas serão utilizadas no plano de safra da cultura.</p>` : ''}
          ${corpo}
        </section></div>
      </div>`;
  }


  // ===== Eventos =====
  function aoClicar(e) {
    const alvo = e.target.closest('[data-acao]'); if (!alvo || alvo.disabled) return;
    const acoes = {
      selecionar: () => selecionar(alvo.dataset.talhao, 'lista', modoDe(e)),
      'filtro-geo'() { ui.filtroGeo = ui.filtroGeo === 'sem' ? 'todos' : 'sem'; redesenhar(); },
      'alternar-lista': alternarLista,
      'busca-limpar': limparBusca,
      'limpar-selecao': () => selecionar(null, 'mapa'),
      'busca-ir': () => { const r = resultados[Number(alvo.dataset.i)]; if (r) irPara(r); },
      importar() { sairDaEdicao(); modalImportar(); },
      desenhar: () => iniciarDesenho(ui.selecionados.size === 1 ? [...ui.selecionados][0] : null),
      editar: () => iniciarEdicao(ui.selecionados.size === 1 ? [...ui.selecionados][0] : null),
      excluir: excluirPoligono,
      'desfazer-ponto': desfazerPonto,
      'edicao-cancelar': () => sairDaEdicao(),
      'fechar-aviso-mapa': fecharAvisoMapa,
      'edicao-salvar': salvarEdicao,
      'poligono-excluir': excluirPoligono,
      // Vassoura (17/11/2026): limpa Empresa · Filial · Aglomerado e o Talhão (volta a Todos, sem seleção, e enquadra a fazenda)
      'limpar-niveis'() { sairDaEdicao(); ui.filtro = { empresa: '', filial: '', aglomerado: '' }; ui.talhao = null; ui.selecionados.clear(); preparar(); redesenhar({ enquadrar: true }); },
      cultura() {
        ui.cultura = alvo.dataset.nome; const seta = alvo.classList.contains('op-navegar') && alvo.querySelector('path')?.getAttribute('d');
        redesenhar();
        // pelas setas, o foco continua na mesma seta (ou na outra, se esta ficou apagada)
        if (seta) { const bs = [...conteudo.querySelectorAll('.cad-topo--cultura .op-navegar')]; (bs.find((b) => !b.disabled && b.querySelector('path')?.getAttribute('d') === seta) || bs.find((b) => !b.disabled))?.focus(); }
      },
      'cultura-op'() {
        ui.culturaOp = alvo.dataset.nome; const seta = alvo.classList.contains('op-navegar') && alvo.querySelector('path')?.getAttribute('d');
        redesenhar();
        if (seta) { const bs = [...conteudo.querySelectorAll('.cad-topo--cultura .op-navegar')]; (bs.find((b) => !b.disabled && b.querySelector('path')?.getAttribute('d') === seta) || bs.find((b) => !b.disabled))?.focus(); }
      },
      'alternar-ops'() { ui.opsRecolhida = !ui.opsRecolhida; redesenhar(); conteudo.querySelector('[data-acao="alternar-ops"]')?.focus(); },
      'alternar-culturas'() { ui.culturasRecolhida = !ui.culturasRecolhida; redesenhar(); conteudo.querySelector('[data-acao="alternar-culturas"]')?.focus(); },
    };
    if (acoes[alvo.dataset.acao]) acoes[alvo.dataset.acao]();
  }

  function aoMudar(e) {
    const el = e.target; const c = el.dataset.campo; if (!c) return;
    const f = ui.fazenda;
    // Filtros em cascata: mudar um nível limpa os de baixo que deixarem de caber
    if (c === 'nivel') {
      ui.filtro[el.dataset.nivel] = el.value;
      NIVEIS.forEach(([n]) => { if (ui.filtro[n] && !fazendasFiltradas(n).some((x) => niveis(x)[n] === ui.filtro[n])) ui.filtro[n] = ''; });
      preparar(); redesenhar(); return;
    }
    // Fazenda: uma por vez; trocar enquadra os talhões da nova fazenda
    if (c === 'fazenda') {
      sairDaEdicao(); ui.fazenda = el.value || null; ui.talhao = null; ui.selecionados.clear(); ui.filtroGeo = 'todos';
      redesenhar({ enquadrar: true }); return;
    }
    if (c === 'talhao') { sairDaEdicao(); selecionar(el.value, 'filtro'); return; }
    if (c === 'cultura-op') { ui.culturaOp = el.value; redesenhar(); return; }
    // DAP padrão da operação: número inteiro (negativo = antes do plantio); vazio, sem DAP. Reordena o grupo pelo DAP
    // Tipo do grupo (16/11/2026): Plantio = Sementes; Aplicação de insumos mantém Defensivos/Fertilidade quando já era um deles
    if (c === 'op-tipo') {
      const g = (modelo(ui.culturaOp) || [])[el.dataset.g]; if (!g) return;
      const v = el.value; if (v === tipoMostrado(g.tipo)) return;
      g.tipo = v === 'Plantio' ? 'Sementes' : v;
      salvo('Tipo salvo'); return;
    }
    if (c === 'op-dap') {
      const g = (modelo(ui.culturaOp) || [])[el.dataset.g]; const o = g && g.operacoes[el.dataset.o]; if (!o) return;
      const v = el.value.trim(); const n = v === '' ? null : Number(v.replace(',', '.'));
      if (v !== '' && !Number.isFinite(n)) { el.value = o.dap ?? ''; Aviso.mostrar('Informe o DAP em dias (número inteiro).'); return; }
      o.dap = n === null ? undefined : Math.round(n);
      g.operacoes.sort((a, b) => (a.dap ?? Infinity) - (b.dap ?? Infinity));
      salvo('DAP salvo'); redesenhar();
    }
  }

  const guia = () => ui.guia;
  const titulo = () => (GUIAS.find(([g]) => g === ui.guia) || [])[1] || 'Cadastros';
  return { desenhar, aoMostrar, guia, titulo };
})();
