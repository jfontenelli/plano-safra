/*
 * Tela 04 — Operações, grupo Defensivo (docs/telas/04.1-operacoes-defensivos.md)
 * Plano aberto: cabeçalho com contexto e etapas, lista de operações à esquerda,
 * detalhe da operação à direita e guias de grupo no rodapé.
 * Versão publicada: somente leitura (docs/DECISOES.md, 4.1.1).
 */
window.Telas = window.Telas || {};

window.Telas.planoOperacoes = (function () {
  const esc = Util.escapar;
  const ETAPAS = [
    { id: 'planejamento', nome: 'Planejamento' }, // talhão a talhão, por grupo (esta tela)
    { id: 'calendario',  nome: 'Resumo' },    // Calendário Agrícola do plano (Tela 05), com o nome Resumo (antes Programação) dentro do plano
    { id: 'revisao',     nome: 'Validação' }  // estrutura do plano, com talhões e área de cada operação (Tela 04.0, antes Revisão)
  ];
  const UNIDADES = ['L', 'mL', 'kg', 'g', 't'];
  // TSI: a dose é por quantidade de semente (a unidade usada pelos clientes fica para os testes)
  const UNIDADES_TSI = ['mL/100 kg', 'g/100 kg', 'mL/ha', 'g/ha'];

  // Estado da tela por plano (grupo e operação abertos etc.), mantido ao navegar
  const estados = {};

  let plano, ui, raiz, etapa, somenteLeitura, talhoesFazenda;

  // ================= Entrada =================
  function desenhar() {
    return '<div class="plano" id="plano-raiz"></div>';
  }

  function aoMostrar(conteudo, p, etapaId) {
    plano = p;
    etapa = ETAPAS.some((e) => e.id === etapaId) ? etapaId : 'planejamento';
    somenteLeitura = Versoes.somenteLeitura(plano);
    talhoesFazenda = Util.talhoesPlano(plano); // só os talhões incluídos no plano (modal Criar Plano)
    ui = estados[plano.id] = estados[plano.id] || {
      // Abre no grupo Plantio; sem ele, no primeiro grupo das guias
      grupoId: (plano.grupos.find(ehSemente) || plano.grupos[0] || {}).id || null,
      opPorGrupo: {},          // operação aberta em cada grupo
      listaRecolhidaPorGrupo: {}, // lista de operações minimizada em cada grupo (Plantio começa minimizada)
      marcados: new Set(),     // talhões marcados na tabela
      filtroTalhoes: 'todos',  // todos | nao-planejados
      erroNome: null,          // modal: nome da recomendação repetido
      naoEncontrado: {},       // texto digitado sem escolher na lista e que não está no cadastro: { 'linhaId:pa|produto': texto }
      definindo: null,         // modal "Definir recomendação" aberto: { talhoes }
      novasOps: null,          // modal "Nova operação" (grupo Operação de campo): { linhas: [{ nome, dap, fenologia }], erros }
      campo: null,             // modal "Definir operação" (grupo Operação de campo): { grupoId, talhoes, linhas: [{ nome, dap, pct }], iniciais, erros }
      plantando: null,         // modal "Definir plantio" (grupo Plantio): { talhoes, linhas: [{ variedade, pct, data, populacao }], germinacao, datasTexto, erros }
      visaoSemente: 'talhoes', // passo Plantio, "Exibir": talhoes (tabela) | mapa (a Previsão de colheita está pausada)
      painelTalhao: null,      // talhão aberto no painel lateral (passo Variedade)
      prePainel: null,         // painel: nome da variedade em pré-cadastro
      erroPrePainel: null,
      painelExpandido: false,  // painel do talhão largo (gráficos maiores)
      ordemSemente: null,      // ordem da tabela do Plantio: { coluna, sentido: asc | desc }
      erroGerminacao: null,    // painel: germinação inválida digitada { talhao, texto }
      dataPainel: null,        // painel: data digitada inválida { talhao, texto }
      copiadoDe: null,         // modal: recomendação de onde os produtos foram copiados
      renomeandoOp: null,
      renomeandoGrupo: null,
      preCadastro: null,       // { linhaId, produto, principioAtivo, unidade, erro }
      validarOp: null,         // operação com o preenchimento mínimo em vermelho (DAP ou recomendação)
      renomeandoNaLista: null, // operação com o nome em edição na lista (duplo clique, F2 ou botão direito)
      receitaPorOp: {},        // receita aberta em cada operação
      rascunho: null,          // cópia da receita aberta, editada até "Aplicar em N talhões": { receitaId, nome, produtos }
      versoes: null,           // cabeçalho: lista do "Trocar versão" aberta ({ trocarPara: num } = aviso de alterações não salvas)
      jaExiste: false,         // cabeçalho: aviso "Já existe uma versão em construção" (Criar nova versão)
      maisAcoes: false,        // cabeçalho: menu "Mais ações" aberto
    };
    ui.versoes = null;
    ui.jaExiste = false;
    ui.maisAcoes = false;
    if (!somenteLeitura) limparReceitasVazias();
    raiz = conteudo.querySelector('#plano-raiz');
    raiz.addEventListener('click', aoClicarConsulta, true);
    raiz.addEventListener('click', aoClicar);
    // Botão "Aplicar germinação em todos os talhões": sem tirar o foco do campo (o clique não se perde no redesenho)
    raiz.addEventListener('mousedown', (e) => { if (e.target.closest('[data-acao="pt-germinacao-todos"]')) e.preventDefault(); });
    raiz.addEventListener('contextmenu', aoMenuContexto);
    raiz.addEventListener('dblclick', aoDuploClique);
    // Anotados antes dos tratadores (fase de captura): o campo que vai gravar ("✓ Salvo" ao lado dele)
    ['change', 'focusout', 'keydown', 'click'].forEach((tipo) => raiz.addEventListener(tipo, anotarCampo, true));
    raiz.addEventListener('change', aoMudar);
    raiz.addEventListener('input', aoDigitar);
    raiz.addEventListener('paste', aoColar);
    raiz.addEventListener('keydown', aoTeclar);
    raiz.addEventListener('focusin', aoFocar);
    raiz.addEventListener('focusout', aoDesfocar);
    raiz.addEventListener('dragstart', aoArrastar);
    raiz.addEventListener('dragover', aoArrastarSobre);
    raiz.addEventListener('drop', aoSoltar);
    raiz.addEventListener('dragend', () => raiz.querySelectorAll('.guia--alvo').forEach((g) => g.classList.remove('guia--alvo')));
    desenharTudo();
  }

  // ================= Estado atual =================
  // Lista de operações minimizada: escolha de cada grupo; sem escolha, o grupo Plantio (uma operação só) começa minimizado
  function listaRecolhida() {
    const g = grupoAtual();
    if (!g) return false;
    return ui.listaRecolhidaPorGrupo[g.id] ?? ehSemente(g);
  }

  // Guias do Planejamento: todos os grupos, menos o Colheita (vem do plantio; não há o que planejar talhão a talhão)
  // e sem o "Sem grupo" (operações de um grupo excluído, até o usuário escolher o grupo delas na aba Revisão)
  function gruposPlanejamento() {
    return plano.grupos.filter((g) => g.tipo !== 'Colheita' && !g.semGrupo);
  }

  function grupoAtual() {
    const grupos = gruposPlanejamento();
    return grupos.find((g) => g.id === ui.grupoId) || grupos[0] || null;
  }

  // Operações ordenadas pelo DAP padrão (sem DAP no fim)
  function operacoesOrdenadas(grupo) {
    return [...grupo.operacoes].sort((a, b) =>
      (a.dap ?? Infinity) - (b.dap ?? Infinity));
  }

  function opAtual() {
    const grupo = grupoAtual();
    if (!grupo) return null;
    const ops = operacoesOrdenadas(grupo);
    return ops.find((o) => o.id === ui.opPorGrupo[grupo.id]) || ops[0] || null;
  }

  // Grupos com o detalhe da recomendação agronômica (talhões, receitas e doses): Defensivos e Fertilidade
  function usaRecomendacao(grupo) {
    return grupo && ['Defensivos', 'Fertilidade', 'Aplicação de insumos'].includes(grupo.tipo);
  }
  // Aplicação de insumos (grupo criado pelo "+"): a tela de recomendação, com os produtos de todos os cadastros
  // (defensivos, corretivos e fertilizantes)
  const ehAplicacaoInsumos = (grupo) => grupo && grupo.tipo === 'Aplicação de insumos';
  // Operação de campo (grupo criado pelo "+"): uma tela como a do Plantio, só com a tabela dos talhões, sem produtos
  const ehOperacaoCampo = (grupo) => grupo && grupo.tipo === 'Operação de campo';
  // Grupos criados pelo "+" (Aplicação de insumos e Operação de campo): começam pelo "+ Nova operação" da lista, com o
  // modal de várias operações (Nome · DAP · Fenologia); depois, na Operação de campo cada operação define a área e na
  // Aplicação de insumos, os produtos (como em Defensivo e Fertilidade)
  const usaNovasOperacoes = (grupo) => ehOperacaoCampo(grupo) || ehAplicacaoInsumos(grupo);

  function ehFertilidade(grupo) {
    return grupo && grupo.tipo === 'Fertilidade';
  }

  // Dose: "0,40" (duas casas, como nos defensivos); na Fertilidade, sem casas fixas ("130", "1,5")
  function formatarDose(valor) {
    if (!ehFertilidade(grupoAtual()) || valor === null || valor === undefined) return Util.dose(valor);
    return valor.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
  }

  // Salvamento automático (como no Excel com o OneDrive): toda alteração grava na versão em construção
  // e atualiza "Última atualização" e "Atualizado por" do plano. Não há botão Salvar.
  function alterou() {
    plano.atualizadoEm = Util.hojeISO();
    plano.atualizadoPor = DADOS.usuario.nome;
    if (!somenteLeitura) Versoes.salvar(plano);
    avisarSalvamento();
    // Gravação vinda de um campo da tela: "✓ Salvo" ao lado dele, depois do redesenho
    if (campoGravando) { const seletor = campoGravando; campoGravando = null; setTimeout(() => mostrarSalvoCampo(seletor), 30); }
  }

  // ----- "✓ Salvo" ao lado do campo (campos que gravam sozinhos: nome, DAP e fenologia da operação, células das
  // tabelas, campos da aba Validação) -----
  // O evento do campo (sair dele, Enter, escolher na lista) fica anotado por um instante; se a gravação (alterou)
  // acontece nesse instante, o valor mudou e o "✓ Salvo" aparece ao lado do campo por 2,5 s. Fica por cima (posição
  // fixa, acompanha a rolagem), sem empurrar a tabela; o leitor de tela ouve "Salvo" pela região de status, sem
  // perder o foco. Campos do painel do talhão e dos modais não contam: eles têm o botão Salvar.
  let campoGravando = null;
  function anotarCampo(e) {
    let el = e.target;
    if (!el || !el.closest) return;
    if (e.type === 'click') {
      // Escolha numa lista de busca (variedade): vale o campo da lista
      if (!el.closest('.combo__lista')) return;
      el = el.closest('.combo').querySelector('input');
    }
    if (!el || !el.matches('input, select, textarea') || el.closest('[role="dialog"], .painel-talhao, .definir-fundo, .modal-fundo')) return;
    const seletor = seletorDoCampo(el);
    if (!seletor) return;
    campoGravando = seletor;
    setTimeout(() => { if (campoGravando === seletor) campoGravando = null; }, 0);
  }

  // Como achar o campo de novo depois do redesenho: pelo id ou pelos atributos data-*. Nome da operação: o campo
  // some depois de gravar, e o "✓ Salvo" fica ao lado do nome (no cabeçalho ou na lista)
  function seletorDoCampo(el) {
    if (el.dataset.campo === 'nome-op') return '.op-cabecalho__nome';
    if (el.dataset.campo === 'lista-nome') return `.ops-item__nome[data-op="${CSS.escape(el.dataset.op)}"]`;
    if (el.dataset.campo === 'est-nome-op') return `[data-est-renomear-op="${CSS.escape(el.dataset.op)}"]`;
    if (el.id) return `#${CSS.escape(el.id)}`;
    const dados = [...el.attributes].filter((a) => a.name.startsWith('data-') && a.name !== 'data-foco-inicial');
    if (!dados.length) return null;
    return el.tagName.toLowerCase() + dados.map((a) => `[${a.name}="${CSS.escape(a.value)}"]`).join('');
  }

  function mostrarSalvoCampo(seletor) {
    Aviso.anunciar('Salvo');
    const achar = () => raiz && raiz.isConnected && raiz.querySelector(seletor);
    const el = achar();
    if (!el || !el.getClientRects().length) return;
    document.querySelector('.salvo-campo')?.remove();
    const selo = document.createElement('span');
    selo.className = 'salvo-campo';
    selo.setAttribute('aria-hidden', 'true');
    selo.innerHTML = `${Icones.certo} Salvo`;
    document.body.appendChild(selo);
    // Logo à direita do campo; sem espaço na tela, por dentro dele, no canto direito
    const posicionar = () => {
      const alvo = achar();
      if (!alvo || !alvo.getClientRects().length) { tirar(); return; }
      const r = alvo.getBoundingClientRect();
      const largura = selo.offsetWidth;
      selo.style.left = `${r.right + 6 + largura <= window.innerWidth - 4 ? r.right + 6 : r.right - largura - 4}px`;
      selo.style.top = `${r.top + (r.height - selo.offsetHeight) / 2}px`;
    };
    const tirar = () => { selo.remove(); window.removeEventListener('scroll', posicionar, true); };
    posicionar();
    window.addEventListener('scroll', posicionar, true);
    setTimeout(() => { selo.classList.add('salvo-campo--sumindo'); setTimeout(tirar, 300); }, 2500);
  }

  // ----- Estado de salvamento (versão em construção): disquete e "Alterações salvas"; quando e por quem, ao passar
  // o mouse. A cada alteração: "Salvando alterações…" (círculo girando) e, logo depois, de volta a "Alterações salvas".
  // Guardado aqui (e não no elemento) porque a tela costuma ser redesenhada logo depois da alteração.
  let salvando = false;
  let relogioSalvo = null;
  function avisarSalvamento() {
    clearTimeout(relogioSalvo);
    salvando = true; atualizarEstadoSalvo();
    relogioSalvo = setTimeout(() => { salvando = false; atualizarEstadoSalvo(); }, 700);
  }

  // "Alterações salvas · 09:57" (horário da última gravação). Painel do talhão com alteração pendente:
  // "Alterações não salvas", em âmbar, até Salvar ou Cancelar.
  function estadoSalvo() {
    const v = Versoes.aberta(plano);
    if (somenteLeitura || !v) return '';
    const pendente = ui && ui.painelEdicao && ui.painelEdicao.alterado;
    const hora = v.salvaEm ? ` · ${new Date(v.salvaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '';
    const [icone, texto, classe] = pendente ? [Icones.alerta, 'Alterações não salvas', 'estado-salvo--pendente']
      : salvando ? [Icones.carregando, 'Salvando alterações…', 'estado-salvo--salvando']
        : [Icones.disquete, `Alterações salvas${hora}`, ''];
    return `<span class="estado-salvo ${classe}" data-salvo role="status" title="${esc(Versoes.detalhe(v))}">${icone} ${texto}</span>`;
  }

  // Troca só o texto (sem redesenhar a tela)
  function atualizarEstadoSalvo() {
    const el = raiz && raiz.querySelector('[data-salvo]');
    if (el) el.outerHTML = estadoSalvo();
  }

  // Ao trocar de operação, grupo ou status: limpa a seleção da tabela e fecha o modal
  function limparSelecao() {
    ui.marcados = new Set();
    ui.definindo = null;
    ui.plantando = null;
    ui.campo = null;
    ui.novasOps = null;
  }

  // ================= Desenho =================
  // Cabeçalho do plano fixo no topo e guias fixas embaixo; o que fica entre eles tem rolagem própria.
  // No grupo Defensivo, a lista de operações e o cartão da operação ocupam essa altura e só a
  // tabela de talhões rola.
  function desenharTudo() {
    desmontarMapa();
    const rolagemAntes = raiz.querySelector('.plano__rolagem')?.scrollTop || 0;
    const listaAntes = raiz.querySelector('.ops-lista__itens')?.scrollTop || 0;
    const modalAntes = raiz.querySelector('.definir-fundo')?.scrollTop || 0;
    const talhoesAntes = raiz.querySelector('.talhoes-rolagem')?.scrollTop || 0;
    const talhoesLadoAntes = raiz.querySelector('.talhoes-rolagem')?.scrollLeft || 0;
    // Painel do talhão: a rolagem fica onde estava enquanto for o mesmo talhão (senão, preencher a tabela dele pula)
    const painelAntes = { talhao: raiz.querySelector('.painel-talhao')?.getAttribute('aria-label'),
      topo: raiz.querySelector('.painel-talhao__rolagem')?.scrollTop || 0 };
    raiz.innerHTML = `
      ${cabecalho()}
      <div class="plano__rolagem">
        ${etapa === 'revisao' ? Telas.operacoesPlano.desenhar(ctxEstrutura())
          : etapa === 'planejamento' ? corpoOperacoes()
          : etapa === 'calendario' ? Telas.calendario.desenhar(ctxCalendario()) : etapaEmConstrucao()}
      </div>
      ${etapa === 'planejamento' ? rodapeGrupos() : ''}
      ${etapa === 'planejamento' && ui.definindo && opAtual() ? modalDefinir(opAtual()) : ''}
      ${etapa === 'planejamento' && ui.plantando && opAtual() ? modalPlantio(opAtual()) : ''}
      ${etapa === 'planejamento' && ui.campo && ehOperacaoCampo(grupoAtual()) ? modalCampo(grupoAtual()) : ''}
      ${etapa === 'planejamento' && ui.novasOps && usaNovasOperacoes(grupoAtual()) ? modalNovasOperacoes(grupoAtual()) : ''}
    `;
    // Redesenhar não pode jogar a página (nem a lista de operações ou o modal) de volta ao topo
    raiz.querySelector('.plano__rolagem').scrollTop = rolagemAntes;
    const lista = raiz.querySelector('.ops-lista__itens');
    if (lista) lista.scrollTop = listaAntes;
    const modal = raiz.querySelector('.definir-fundo');
    if (modal) modal.scrollTop = modalAntes;
    const talhoes = raiz.querySelector('.talhoes-rolagem');
    if (talhoes) { talhoes.scrollTop = talhoesAntes; talhoes.scrollLeft = talhoesLadoAntes; }
    const painel = raiz.querySelector('.painel-talhao');
    if (painel && painel.getAttribute('aria-label') === painelAntes.talhao) {
      const rolagemPainel = painel.querySelector('.painel-talhao__rolagem');
      if (rolagemPainel) rolagemPainel.scrollTop = painelAntes.topo;
    }
    const foco = raiz.querySelector('[data-foco-inicial]');
    if (foco) { foco.focus({ preventScroll: true }); foco.select?.(); }
    // Caixa "marcar todas" com só algumas marcadas: estado intermediário (só dá para ligar por script)
    raiz.querySelectorAll('[data-intermediario]').forEach((c) => { c.indeterminate = true; });
    montarMapa();
  }

  // Redesenha e devolve o foco ao controle equivalente (o anterior foi recriado)
  function desenharMantendoFoco(seletor) {
    desenharTudo();
    raiz.querySelector(seletor)?.focus({ preventScroll: true });
  }

  // Cabeçalho fixo: a trilha "‹ Planos de Safra › Safra 26/27 · Empresa C · Fazenda Primavera · Cultura Soja" (só o
  // primeiro item é link: volta à lista, com os filtros como estavam) | Versão 0.2 [status] e, embaixo, as abas e, à direita,
  // "Salvo às…", o botão da versão (Publicar versão ou Criar nova versão) e "Mais ações" (DECISOES 4.1.1)
  function cabecalho() {
    const contexto = [`Safra ${plano.safra}`, plano.empresa, `Fazenda ${plano.fazenda}`, `Cultura ${plano.cultura}`].join(' · ');
    const v = Versoes.aberta(plano);
    return `
      <header class="plano__cabecalho">
        <div class="plano__linha plano__linha--versao">
          <div class="plano__identificacao">
            <nav class="plano__trilha" aria-label="Caminho">
              <a class="plano__voltar" href="#/plano-safra" title="Voltar para a lista de planos">${Icones.anterior}Planos de Safra</a>
              <span class="plano__seta" aria-hidden="true">›</span>
              <p class="plano__contexto" title="${esc(contexto)}">${esc(contexto)}</p>
            </nav>
            <span class="plano__barra" aria-hidden="true">|</span>
            <span class="plano__versao">Versão ${esc(v.num)}
              <span class="status status--${{ construcao: 'construcao', publicada: 'aprovado', revisada: 'revisada' }[Versoes.statusExibido(plano, v)]}">${Versoes.rotuloStatus(plano, v)}</span></span>
          </div>
        </div>
        <div class="plano__linha-etapas">
          <nav class="etapas" aria-label="Abas do plano">
            ${ETAPAS.map((e) => `
              <a class="etapa ${e.id === etapa ? 'etapa--ativa' : ''}" href="#/plano/${plano.id}/${e.id}"
                 ${e.id === etapa ? 'aria-current="page"' : ''}>${e.nome}</a>`).join('')}
          </nav>
          <div class="plano__acoes-versao">
            ${acoesVersao()}
            ${maisAcoes()}
          </div>
        </div>
      </header>
    `;
  }

  // Botão da versão: em construção, "Salvo às…" e Publicar versão (só na aba Validação); publicada, Criar nova
  // versão, em todas as abas (com o aviso quando já existe outra em construção)
  function acoesVersao() {
    if (somenteLeitura) {
      const construcao = Versoes.emConstrucao(plano);
      return `
        <button class="botao botao--primario botao--p" type="button" data-acao="ver-nova">Criar nova versão</button>
        ${ui.jaExiste && construcao ? `
          <div class="versoes-alerta versoes-alerta--solto" role="alert">
            <strong>Já existe uma versão em construção (${esc(construcao.num)}).</strong> Só pode haver uma por plano.
            Abra a ${esc(construcao.num)} para continuar o trabalho em andamento.
            <div class="versoes-alerta__acoes">
              <button class="botao botao--secundario botao--p" type="button" data-acao="ver-fechar-aviso">Cancelar</button>
              <button class="botao botao--primario botao--p" type="button" data-acao="ver-abrir" data-versao="${esc(construcao.num)}">Abrir versão ${esc(construcao.num)}</button>
            </div>
          </div>` : ''}`;
    }
    return `
      ${estadoSalvo()}
      ${etapa === 'revisao' ? '<button class="botao botao--primario botao--p" type="button" data-acao="ver-publicar">Publicar versão</button>' : ''}`;
  }

  // "Mais ações ▾": Editar talhões (só na versão em construção) · Exportar (.xlsx) · Trocar versão
  // (a lista de versões abre no mesmo lugar)
  function maisAcoes() {
    return `
      <span class="versoes mais-acoes">
        <button class="botao botao--secundario botao--p" type="button" data-acao="ver-mais" aria-haspopup="menu"
                aria-expanded="${ui.maisAcoes}">Mais ações ${Icones.abaixo}</button>
        ${ui.maisAcoes ? `
          <div class="mais-acoes__menu" role="menu" aria-label="Mais ações">
            ${somenteLeitura ? '' : `<button class="menu-contexto__item" type="button" role="menuitem" data-acao="editar-talhoes">${Icones.talhoes} Editar talhões</button>`}
            <button class="menu-contexto__item" type="button" role="menuitem" data-acao="exportar-plano">${Icones.baixar} Exportar (.xlsx)</button>
            <button class="menu-contexto__item" type="button" role="menuitem" data-acao="ver-trocar">${Icones.relogio} Trocar versão</button>
          </div>` : ''}
        ${ui.versoes ? listaVersoes() : ''}
      </span>`;
  }

  // "Trocar versão": versões do plano, da mais recente para a mais antiga
  function listaVersoes() {
    return `
      <div class="versoes-lista" role="menu" aria-label="Versões deste plano">
        <p class="versoes-lista__titulo">Versões deste plano</p>
        ${[...Versoes.lista(plano)].reverse().map((v) => `
          <button class="versoes-item ${v.num === plano.versaoAberta ? 'versoes-item--atual' : ''}" type="button" role="menuitem"
                  data-acao="ver-abrir" data-versao="${esc(v.num)}">
            <span class="versoes-item__num">${esc(v.num)}</span>
            <span><strong>${Versoes.rotuloStatus(plano, v)}</strong>${v.num === plano.versaoAberta ? ' · aberta agora' : ''}</span>
            <span class="status ${v.status === 'publicada' ? 'status--aprovado' : 'status--construcao'}">${v.status === 'publicada' ? 'Consulta' : 'Editável'}</span>
            <span class="versoes-item__info">${esc(Versoes.detalhe(v))}</span>
          </button>`).join('')}
      </div>`;
  }

  // Versão publicada ou revisada (somente consulta): não há faixa fixa de aviso. Ao tentar editar (clicar num valor
  // de uma tabela ou no cabeçalho da operação, fora de botões, links e campos), abre o aviso com Criar nova versão.
  // Abas, guias, filtros, mapa e Exportar continuam funcionando. O Resumo é só de consulta e não avisa.
  function aoClicarConsulta(e) {
    if (!somenteLeitura || etapa === 'calendario') return;
    const t = e.target;
    if (t.closest('button, a, input, select, textarea, summary, label, [data-acao], [role="tab"], .plano__cabecalho, .mapa, .leaflet-container')) return;
    if (!t.closest('td, .op-cabecalho')) return;
    // Plantio: o clique na linha abre o painel do talhão (para consultar), sem o aviso
    if (t.closest('.tabela-variedade tbody tr[data-talhao]')) return;
    e.stopPropagation();
    avisoConsulta();
  }

  // "Versão 0.2 publicada" · Cancelar · Criar nova versão (com outra versão em construção: Abrir versão 0.3)
  function avisoConsulta() {
    const v = Versoes.aberta(plano);
    const construcao = Versoes.emConstrucao(plano);
    Modal.confirmar({
      titulo: `Versão ${esc(v.num)} ${Versoes.rotuloStatus(plano, v).toLowerCase()}`,
      texto: construcao
        ? `Somente consulta. As alterações são feitas na versão ${esc(construcao.num)}, que já está em construção.`
        : 'Somente consulta. Para alterar, crie uma nova versão a partir desta.',
      botoes: [{ rotulo: 'Cancelar' }, construcao
        ? { rotulo: `Abrir versão ${esc(construcao.num)}`, classe: 'primario', acao: () => abrirVersao(construcao.num) }
        : { rotulo: 'Criar nova versão', classe: 'primario', acao: () => acaoVersao('ver-nova') }]
    });
  }

  // Abre outra versão na área de trabalho e redesenha (seleções e rascunhos da versão anterior são descartados)
  function abrirVersao(num) {
    Versoes.abrir(plano, num);
    somenteLeitura = Versoes.somenteLeitura(plano);
    talhoesFazenda = Util.talhoesPlano(plano); // cada versão tem os seus talhões
    limparSelecao();
    Object.assign(ui, { versoes: null, jaExiste: false, maisAcoes: false, rascunho: null, receitaPorOp: {},
                        renomeandoOp: null, renomeandoGrupo: null, painelTalhao: null, preCadastro: null, validarOp: null });
    if (!somenteLeitura) limparReceitasVazias();
    desenharTudo();
  }

  // Ações do cabeçalho da versão (data-acao="ver-…")
  function acaoVersao(acao, alvo) {
    switch (acao) {
      case 'ver-mais':
        ui.maisAcoes = !ui.maisAcoes; ui.versoes = null; ui.jaExiste = false; desenharTudo(); break;
      case 'ver-trocar':
        ui.versoes = ui.versoes ? null : {}; ui.maisAcoes = false; ui.jaExiste = false; desenharTudo(); break;
      case 'ver-abrir': {
        const num = alvo.dataset.versao;
        if (num === plano.versaoAberta) { ui.versoes = null; ui.jaExiste = false; desenharTudo(); break; }
        abrirVersao(num); break;
      }
      case 'ver-fechar-aviso':
        ui.versoes = null; ui.jaExiste = false; desenharTudo(); break;
      case 'ver-publicar': {
        const num = plano.versaoAberta;
        Modal.confirmar({
          titulo: `Publicar versão ${esc(num)}?`,
          texto: 'A versão será registrada no histórico e não poderá mais ser editada. Para realizar novas alterações, será necessário criar uma nova versão.',
          botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Publicar versão', classe: 'primario', acao: () => {
            Versoes.publicar(plano);
            abrirVersao(num);
            Aviso.mostrar(`Versão ${esc(num)} publicada`);
          } }]
        });
        break;
      }
      case 'ver-nova': {
        const r = Versoes.criarNova(plano, plano.versaoAberta);
        if (r.jaExiste) { ui.jaExiste = true; ui.versoes = null; desenharTudo(); break; }
        abrirVersao(r.num);
        Aviso.mostrar(`Versão ${esc(r.num)} criada a partir da ${esc(r.origem)}`);
        break;
      }
    }
  }

  // ----- Editar talhões (Mais ações; só na versão em construção) -----
  // Modal com todos os talhões da fazenda (como no Criar Plano). Aplicar: os incluídos entram sem planejamento;
  // os removidos levam o planejamento deles (plantio, germinação, recomendações e doses). Com algum removido já
  // planejado, confirma antes. Depois, Desfazer (volta os talhões com o planejamento que tinham).
  function talhaoPlanejado(nome) {
    return plano.grupos.some((g) => g.operacoes.some((op) => (op.talhoes && op.talhoes[nome]) || (op.plantio && op.plantio[nome])));
  }

  function editarTalhoes() {
    const todos = DADOS.talhoes[plano.fazenda] || [];
    const antes = talhoesFazenda.map((t) => t.nome);
    let marcados = new Set(antes);
    const modal = Modal.abrir(`
      <form class="formulario" novalidate>
        <div class="modal__corpo">
          <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
          <h2 class="modal__titulo" id="modal-titulo">Editar talhões</h2>
          <p class="modal__subtitulo">Inclua ou remova talhões da Fazenda ${esc(plano.fazenda)} no plano de safra.</p>
          <div class="et-lista" data-et-lista></div>
          <p class="et-resumo" data-et-resumo aria-live="polite"></p>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
          <button class="botao botao--primario" type="submit">Aplicar</button>
        </div>
      </form>`, { classe: 'modal--pequeno' });
    const form = modal.elemento.querySelector('form');
    const desenharLista = () => {
      const tudo = todos.length && todos.every((t) => marcados.has(t.nome));
      form.querySelector('[data-et-lista]').innerHTML = `
        <label class="et-item et-item--todos"><input type="checkbox" data-talhao="__todos__" ${tudo ? 'checked' : ''}
          ${marcados.size && !tudo ? 'data-intermediario' : ''}> Todos</label>
        ${todos.map((t) => `
          <label class="et-item ${antes.includes(t.nome) && !marcados.has(t.nome) ? 'et-item--sai' : ''} ${!antes.includes(t.nome) && marcados.has(t.nome) ? 'et-item--entra' : ''}">
            <input type="checkbox" data-talhao="${esc(t.nome)}" ${marcados.has(t.nome) ? 'checked' : ''}>
            ${esc(t.nome)}
            ${antes.includes(t.nome) && talhaoPlanejado(t.nome) ? '<span class="et-item__planejado" title="Este talhão já tem planejamento">planejado</span>' : ''}
            <span class="et-item__area">${Util.area(t.area)}</span>
          </label>`).join('')}`;
      form.querySelectorAll('[data-intermediario]').forEach((c) => { c.indeterminate = true; });
      const area = todos.filter((t) => marcados.has(t.nome)).reduce((s, t) => s + t.area, 0);
      const entram = todos.filter((t) => marcados.has(t.nome) && !antes.includes(t.nome)).length;
      const saem = antes.filter((n) => !marcados.has(n)).length;
      form.querySelector('[data-et-resumo]').innerHTML = `
        <span><strong>${marcados.size} de ${todos.length} talhões</strong> · Área de cultivo: ${marcados.size ? Util.area(area) : 'Pendente'}</span>
        ${entram || saem ? `<span class="et-resumo__mudanca">${[entram ? `${entram} ${entram === 1 ? 'incluído' : 'incluídos'}` : '', saem ? `${saem} ${saem === 1 ? 'removido' : 'removidos'}` : ''].filter(Boolean).join(' · ')}</span>` : ''}`;
    };
    desenharLista();
    form.addEventListener('change', (e) => {
      const nome = e.target.dataset.talhao;
      if (!nome) return;
      if (nome === '__todos__') marcados = new Set(e.target.checked ? todos.map((t) => t.nome) : []);
      else if (e.target.checked) marcados.add(nome); else marcados.delete(nome);
      desenharLista();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const saem = antes.filter((n) => !marcados.has(n));
      const entram = todos.filter((t) => marcados.has(t.nome) && !antes.includes(t.nome)).map((t) => t.nome);
      modal.fechar();
      if (!saem.length && !entram.length) return;
      const planejados = saem.filter(talhaoPlanejado);
      const aplicar = () => aplicarTalhoes(todos.filter((t) => marcados.has(t.nome)).map((t) => t.nome), saem, entram);
      if (!planejados.length) { aplicar(); return; }
      const nomes = planejados.length === 1 ? planejados[0] : `${planejados.slice(0, -1).join(', ')} e ${planejados[planejados.length - 1]}`;
      Modal.confirmar({
        titulo: `Remover ${saem.length} ${saem.length === 1 ? 'talhão' : 'talhões'}?`,
        texto: `${esc(nomes)} já ${planejados.length === 1 ? 'tem' : 'têm'} planejamento (plantio, recomendações e doses). Esse planejamento será apagado.`,
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: saem.length === 1 ? 'Remover talhão' : 'Remover talhões', classe: 'perigo', acao: aplicar }]
      });
    });
  }

  function aplicarTalhoes(novos, saem, entram) {
    const voltar = { grupos: structuredClone(plano.grupos), talhoes: plano.talhoes ? [...plano.talhoes] : null };
    plano.talhoes = novos;
    plano.grupos.forEach((g) => g.operacoes.forEach((op) => saem.forEach((n) => {
      if (op.talhoes) delete op.talhoes[n];
      if (op.plantio) delete op.plantio[n];
      if (op.germinacoes) delete op.germinacoes[n];
    })));
    const atualizar = () => {
      talhoesFazenda = Util.talhoesPlano(plano);
      limparSelecao();
      ui.painelTalhao = null;
      ui.filtroTalhoes = 'todos';
      alterou(); desenharTudo();
    };
    atualizar();
    const partes = [entram.length ? `${entram.length} ${entram.length === 1 ? 'incluído' : 'incluídos'}` : '',
      saem.length ? `${saem.length} ${saem.length === 1 ? 'removido' : 'removidos'}` : ''].filter(Boolean).join(', ');
    Aviso.mostrar(`Talhões atualizados: ${partes}`, { acao: 'Desfazer', aoAgir: () => {
      plano.grupos = voltar.grupos; plano.talhoes = voltar.talhoes;
      if (raiz.isConnected) atualizar(); else { Versoes.salvar(plano); }
    } });
  }

  // Calendário Agrícola (Tela 05): desenhado aqui dentro, com o mesmo cabeçalho do plano
  function ctxCalendario() {
    ui.calendario = ui.calendario || { visao: 'tabela', talhao: 'todos' };
    return { plano, somenteLeitura, talhoes: talhoesFazenda, estado: ui.calendario, abrirOperacao: abrirNoPlanejamento,
      irParaPlanejamento };
  }

  // Resumo sem nada planejado: "Ir para o Planejamento" abre a aba na guia Plantio (sem ela, na primeira guia)
  function irParaPlanejamento() {
    const g = gruposPlanejamento().find(ehSemente) || gruposPlanejamento()[0];
    if (g) { ui.grupoId = g.id; ui.filtroTalhoes = 'todos'; limparSelecao(); }
    location.hash = `#/plano/${plano.id}/planejamento`;
  }

  // Resumo › Tabela: o nome da operação abre a aba Planejamento no grupo dela, com ela aberta
  function abrirNoPlanejamento(id) {
    const g = gruposPlanejamento().find((x) => x.operacoes.some((o) => o.id === id));
    if (!g) return;
    ui.grupoId = g.id; ui.opPorGrupo[g.id] = id; ui.renomeandoOp = null; ui.filtroTalhoes = 'todos';
    limparSelecao();
    location.hash = `#/plano/${plano.id}/planejamento`;
  }
  const acoesCalendario = { redesenhar: (foco) => (foco ? desenharMantendoFoco(foco) : desenharTudo()), alterou: () => alterou() };

  // Operações do plano (Tela 04.0, etapa 1): desenhada aqui dentro, com o mesmo cabeçalho do plano
  function ctxEstrutura() {
    ui.estrutura = ui.estrutura || { renomeandoOp: null };
    return { plano, somenteLeitura, talhoesFazenda, estado: ui.estrutura };
  }
  const acoesEstrutura = {
    redesenhar: (foco) => (foco ? desenharMantendoFoco(foco) : desenharTudo()),
    alterou: () => alterou(),
    nomeOperacaoRepetido: (nome, op) => nomeOperacaoRepetido(nome, op)
  };

  function etapaEmConstrucao() {
    const nome = ETAPAS.find((e) => e.id === etapa).nome;
    return `
      <section class="em-construcao">
        <div class="em-construcao__icone" aria-hidden="true">${Icones.casa}</div>
        <p class="em-construcao__subtitulo">${nome}</p>
        <h2 class="em-construcao__titulo">Em construção</h2>
        <p class="em-construcao__texto">Esta etapa ainda não foi construída no protótipo.</p>
      </section>
    `;
  }

  function corpoOperacoes() {
    const grupo = grupoAtual();
    if (!grupo) {
      return `
        <div class="ops ops--vazio">
          <div class="cartao vazio">
            <h2 class="vazio__titulo">Nenhum grupo de operações</h2>
            <p class="vazio__texto">${somenteLeitura ? 'Este plano não tem grupos de operações.'
              : 'Use o <strong>+</strong> no rodapé, em "Grupo de operações", para criar o primeiro grupo.'}</p>
          </div>
        </div>`;
    }
    // Grupos Semente e Tratamento de semente: a operação (DAP 0) ocupa a página toda, sem a lista de operações
    return `
      <div class="ops">
        ${(ehSemente(grupo) || ehGrupoTsi(grupo)) && opAtual() ? '' : listaOperacoes(grupo)}
        <section class="ops-detalhe" aria-live="polite">${detalhe(grupo)}</section>
      </div>
    `;
  }

  // ----- Lista lateral -----
  // Título: o nome do grupo aberto ("DEFENSIVO"), cortado com "…" quando é longo (o nome inteiro ao passar o mouse)
  function listaOperacoes(grupo) {
    const atual = opAtual();
    // Minimizada: só os DAPs; o nome da operação aparece ao passar o mouse
    if (listaRecolhida()) {
      return `
        <aside class="cartao ops-lista ops-lista--recolhida" aria-label="Operações do grupo ${esc(grupo.nome)} (só DAP)">
          <button class="botao-icone" type="button" data-acao="alternar-lista" title="Mostrar operações"
                  aria-label="Mostrar lista de operações">${Icones.expandir}</button>
          <span class="ops-lista__rotulo-dap">DAP</span>
          <ul class="ops-lista__itens">
            ${operacoesOrdenadas(grupo).map((op) => {
              const ativo = atual && op.id === atual.id;
              return `
                <li class="ops-item ops-item--dap ${ativo ? 'ops-item--ativo' : ''}">
                  <button class="ops-item__nome" type="button" data-acao="abrir-op" data-op="${op.id}"
                          ${ativo ? 'aria-current="true"' : ''} title="${esc(op.nome)}"
                          aria-label="${esc(op.nome)}, DAP ${op.dap ?? 'não informado'}">${op.dap ?? '—'}</button>
                </li>`;
            }).join('')}
          </ul>
          ${somenteLeitura ? '' : `
            <button class="botao-icone ops-lista__nova-min" type="button" data-acao="nova-op" title="Nova operação"
                    aria-label="Nova operação">${Icones.mais}</button>`}
        </aside>`;
    }
    const ops = operacoesOrdenadas(grupo);
    return `
      <aside class="cartao ops-lista" aria-label="Operações do grupo ${esc(grupo.nome)}">
        <div class="ops-lista__topo">
          <h2 class="rotulo-secao ops-lista__grupo" title="${esc(grupo.nome)}">${esc(grupo.nome)}</h2>
          <span class="ops-lista__rotulo-dap">DAP</span>
          <button class="botao-icone" type="button" data-acao="alternar-lista" title="Recolher lista"
                  aria-label="Recolher lista de operações">${Icones.recolher}</button>
        </div>
        <ul class="ops-lista__itens">
          ${ops.map((op) => itemOperacao(op, atual && op.id === atual.id)).join('')}
        </ul>
        ${somenteLeitura ? '' : `
          <button class="link-acao ops-lista__nova" type="button" data-acao="nova-op">${Icones.mais} Nova operação</button>`}
        ${grupo.operacoes.length === 0 && !usaNovasOperacoes(grupo) ? '<p class="ops-lista__vazia">Nenhuma operação neste grupo.</p>' : ''}
      </aside>
    `;
  }

  // Clique abre a operação; duplo clique (ou F2) renomeia; o ⋯ e o botão direito abrem o mesmo menu
  // (Renomear · Copiar para outras operações · Inserir operação · Excluir). O ⋯ fica sempre à vista na operação
  // aberta; nas outras, ao passar o mouse ou com o foco do teclado. Na versão publicada, não aparece.
  function itemOperacao(op, ativo) {
    const nome = ui.renomeandoNaLista === op.id
      // Área de texto que cresce com o nome, para mostrá-lo inteiro (sem truncar); Enter não quebra linha
      ? `<textarea class="campo__controle ops-item__nome-campo" data-campo="lista-nome" data-op="${op.id}" rows="2"
                   aria-label="Nome da operação" data-foco-inicial>${esc(op.nome)}</textarea>`
      : `<button class="ops-item__nome" type="button" data-acao="abrir-op" data-op="${op.id}"
                 ${ativo ? 'aria-current="true"' : ''}
                 title="${somenteLeitura ? esc(op.nome) : `${esc(op.nome)} · clique duas vezes para renomear`}">${esc(op.nome)}</button>`;
    return `
      <li class="ops-item ${ativo ? 'ops-item--ativo' : ''}">
        ${nome}
        <span class="ops-item__dap">${op.dap ?? '—'}</span>
        ${somenteLeitura || ui.renomeandoNaLista === op.id ? '' : `
          <button class="botao-icone ops-item__mais" type="button" data-acao="menu-op" data-op="${op.id}"
                  aria-haspopup="menu" aria-expanded="false" aria-label="Mais opções de ${esc(op.nome)}"
                  title="Mais opções">${Icones.mais_opcoes}</button>`}
      </li>`;
  }

  function renomearNaLista(id) {
    ui.renomeandoNaLista = id; ui.renomeandoOp = null;
    desenharTudo();
  }

  function pararRenomearNaLista() {
    ui.renomeandoNaLista = null;
  }

  // Nome da operação no card; abre em edição quando a operação acaba de ser criada
  // Nome da operação no cabeçalho: duplo clique (ou F2) renomeia, no mesmo padrão da lista.
  // Enter ou sair do campo salva; Esc desfaz; nome vazio volta ao anterior.
  function nomeOperacao(op) {
    if (ui.renomeandoOp === op.id) {
      return `<input class="campo__controle op-cabecalho__nome-campo" data-campo="nome-op" value="${esc(op.nome)}"
                     aria-label="Nome da operação" data-foco-inicial>`;
    }
    if (somenteLeitura) return `<h2 class="op-cabecalho__nome" title="${esc(op.nome)}">${esc(op.nome)}</h2>`;
    return `<h2 class="op-cabecalho__nome op-cabecalho__nome--editavel" tabindex="0" data-renomear-op="${op.id}"
                title="${esc(op.nome)} · clique duas vezes para renomear">${esc(op.nome)}</h2>`;
  }

  function aoDuploClique(e) {
    if (etapa === 'revisao' && Telas.operacoesPlano.aoDuploClique(e, ctxEstrutura(), acoesEstrutura)) return;
    const nome = e.target.closest('[data-renomear-op]');
    if (!nome || somenteLeitura) return;
    ui.renomeandoOp = nome.dataset.renomearOp; desenharTudo();
  }

  // Grupo criado pelo "+" (Aplicação de insumos ou Operação de campo) ainda sem operação: a ilustração (um broto entre
  // colinas), "Nenhuma operação neste grupo" e o convite com o link "+ Nova operação" (o mesmo da lista)
  const ILUSTRACAO_VAZIO = `<svg class="grupo-vazio__ilustracao" viewBox="0 0 240 120" aria-hidden="true">
      <ellipse cx="46" cy="28" rx="16" ry="7" fill="#e3e8ea"/><ellipse cx="58" cy="24" rx="11" ry="8" fill="#e3e8ea"/>
      <ellipse cx="190" cy="22" rx="17" ry="7" fill="#e3e8ea"/><ellipse cx="202" cy="18" rx="11" ry="8" fill="#e3e8ea"/>
      <path d="M0 120 C40 78 90 70 130 86 C170 100 205 88 240 76 V120 Z" fill="#cfe3d7"/>
      <path d="M0 120 C55 92 105 94 150 104 C190 112 215 104 240 98 V120 Z" fill="#b6d5c2"/>
      <path d="M20 112 C60 100 100 102 140 110 M60 118 C100 108 150 110 200 116" stroke="#e9f2ec" stroke-width="2" fill="none"/>
      <path d="M120 98 V62" stroke="#1f7a4d" stroke-width="3" stroke-linecap="round"/>
      <path d="M120 70 C104 70 96 58 98 46 C112 46 121 56 120 70 Z" fill="#2e9a62"/>
      <path d="M120 64 C136 64 146 52 144 40 C128 40 119 50 120 64 Z" fill="#1f7a4d"/>
    </svg>`;
  function grupoSemOperacao(grupo) {
    const oQue = ehAplicacaoInsumos(grupo) ? 'os produtos e as doses por talhão' : 'a área de aplicação por talhão';
    return `
      <section class="cartao grupo-vazio" aria-label="${esc(grupo.nome)}">
        ${ILUSTRACAO_VAZIO}
        <h2 class="grupo-vazio__titulo">Nenhuma operação neste grupo</h2>
        <p class="grupo-vazio__texto">${somenteLeitura ? 'Este grupo ainda não tem operações.' : `Para começar, clique em
          <button class="grupo-vazio__link" type="button" data-acao="nova-op">${Icones.mais} Nova operação</button> e defina o nome, o DAP e ${oQue}.`}</p>
      </section>`;
  }

  // ----- Detalhe -----
  function detalhe(grupo) {
    const op = opAtual();
    if (usaNovasOperacoes(grupo) && !op) return grupoSemOperacao(grupo);
    if (ehOperacaoCampo(grupo)) return detalheOperacaoCampo(grupo, op);
    if (!op) {
      return `<div class="cartao vazio"><p class="vazio__texto">${somenteLeitura
        ? 'Nenhuma operação neste grupo.' : 'Nenhuma operação neste grupo. Use "+ Nova operação" para criar.'}</p></div>`;
    }
    if (ehSemente(grupo)) return detalheSemente(op);
    if (ehGrupoTsi(grupo)) return detalheTsi(op);
    if (!usaRecomendacao(grupo)) {
      return `
        <div class="cartao op-cabecalho">
          <div class="op-cabecalho__linha">
            ${nomeOperacao(op)}
            <span class="op-cabecalho__dap-texto">DAP: <strong>${op.dap ?? '—'}</strong></span>
          </div>
        </div>
        <div class="cartao">
          <section class="em-construcao em-construcao--compacto">
            <div class="em-construcao__icone" aria-hidden="true">${Icones.casa}</div>
            <p class="em-construcao__subtitulo">Grupo ${esc(grupo.nome)}${grupo.tipo ? ` · tipo ${esc(grupo.tipo)}` : ' · sem tipo'}</p>
            <h2 class="em-construcao__titulo">Em construção</h2>
            <p class="em-construcao__texto">Neste protótipo, só os grupos dos tipos Defensivos e Fertilidade têm o detalhe da operação.</p>
          </section>
        </div>`;
    }
    // Primeiro os talhões, depois a recomendação: marca os talhões e "Definir recomendação" abre o modal
    return `
      <section class="cartao op-painel" aria-label="${esc(op.nome)}">
        ${cabecalhoOperacao(op)}
        ${painelTalhoes(op)}
      </section>`;
  }

  // semFenologia: grupo Tratamento de semente (só o DAP)
  function cabecalhoOperacao(op, { semFenologia = false } = {}) {
    const erroDap = errosVisiveis(op).dap;
    const dap = somenteLeitura
      ? `<span class="campo__valor">${op.dap ?? '—'}</span>`
      : `<input class="campo__controle op-cabecalho__dap ${erroDap ? 'campo__controle--erro' : ''}" id="op-dap" type="text" inputmode="numeric"
                data-campo="op-dap" value="${op.dap ?? ''}" placeholder="—" ${erroDap ? 'aria-invalid="true"' : ''}>
         ${erroDap ? '<p class="erro-campo">Informação obrigatória</p>' : ''}`;
    // Pré-plantio (DAP negativo) e Plantio (DAP 0) não têm fenologia: "—", sem escolha
    const temDap = op.dap !== null && op.dap !== undefined && op.dap !== '';
    const fixa = temDap && op.dap < 0 ? ['—', 'Pré-plantio (DAP negativo): sem fenologia']
      : temDap && op.dap === 0 ? ['—', 'Plantio (DAP 0): sem fenologia'] : null;
    const fenologia = somenteLeitura
      ? `<span class="campo__valor">${fixa ? fixa[0] : op.fenologia || '—'}</span>`
      : fixa
        ? `<select class="campo__controle op-cabecalho__fenologia" id="op-fenologia" disabled
                   title="${fixa[1]}"><option selected>${fixa[0]}</option></select>`
        : `<select class="campo__controle op-cabecalho__fenologia" id="op-fenologia" data-campo="op-fenologia">
             <option value="">—</option>
             ${DADOS.fenologia.map((f) => `<option ${f === op.fenologia ? 'selected' : ''}>${f}</option>`).join('')}
           </select>`;
    // Nome, DAP e fenologia. Renomear e excluir ficam na lista de operações.
    return `
      <div class="op-cabecalho__linha">
        <div class="op-cabecalho__titulo">${navegacaoOperacoes(op)}${nomeOperacao(op)}</div>
        <div class="op-cabecalho__campos">
          <div class="campo campo--inline"><label class="campo__rotulo" for="op-dap">DAP</label>${dap}</div>
          ${semFenologia ? '' : `<div class="campo campo--inline"><label class="campo__rotulo" for="op-fenologia">Fenologia</label>${fenologia}</div>`}
        </div>
      </div>`;
  }

  // Anterior e próxima operação do grupo, na ordem do DAP (a mesma da lista): as setas ‹ › antes do nome
  // ("‹ › 1ª Fungicida"), sempre no mesmo lugar. Na primeira, ‹ fica apagada; na última, ›. O nome e o DAP do destino aparecem ao passar o mouse.
  function navegacaoOperacoes(op) {
    const ops = operacoesOrdenadas(grupoAtual());
    const i = ops.indexOf(op);
    const botao = (destino, sentido) => {
      const rotulo = sentido === 'anterior' ? 'Operação anterior' : 'Próxima operação';
      const icone = sentido === 'anterior' ? Icones.anterior : Icones.proxima;
      if (!destino) return `<button class="botao-icone op-navegar" type="button" disabled title="${rotulo}" aria-label="${rotulo}">${icone}</button>`;
      const dap = destino.dap !== null && destino.dap !== undefined ? ` (DAP ${destino.dap})` : '';
      const dica = `${rotulo}: ${esc(destino.nome)}${dap}`;
      return `
        <button class="botao-icone op-navegar" type="button" data-acao="navegar-op" data-op="${destino.id}"
                title="${dica}" aria-label="${dica}">${icone}</button>`;
    };
    if (ops.length < 2) return '';
    return `<div class="op-navegacao">${botao(ops[i - 1], 'anterior')}${botao(ops[i + 1], 'proxima')}</div>`;
  }

  // ----- Preenchimento mínimo para aplicar -----
  // DAP, ao menos uma linha na receita e, em cada linha, produto comercial e dose padrão
  // (a dose é do produto; o princípio ativo só ajuda a encontrar o produto).
  function errosRecomendacao(op) {
    const vazio = (v) => v === null || v === undefined || v === '';
    const r = receitaAtual(op);
    const fonte = r && ui.rascunho && ui.rascunho.receitaId === r.id ? ui.rascunho.produtos : (r ? r.produtos : []);
    const linhas = fonte.filter(Planos.linhaPreenchida);
    const porLinha = {};
    linhas.forEach((l) => {
      const e = { produto: !l.produto, dose: vazio(l.dose), repetido: !!repetidoNaMesma(fonte, l) };
      if (e.produto || e.dose || e.repetido) porLinha[l.id] = e;
    });
    const erros = { dap: vazio(op.dap), semLinhas: linhas.length === 0, linhas: porLinha };
    erros.algum = erros.dap || erros.semLinhas || Object.keys(porLinha).length > 0;
    return erros;
  }

  // Erros só aparecem depois que o usuário clicou em "Definir recomendação" ou "Aplicar em N talhões"
  function errosVisiveis(op) {
    return ui.validarOp === op.id ? errosRecomendacao(op) : { linhas: {} };
  }

  // ----- Receitas da operação -----
  // Receita agronômica = conjunto de produtos + doses padrão. A composição de produtos determina
  // a identidade da receita; a dose pode variar por talhão sem alterar a identidade da receita.
  function receitaAtual(op) {
    if (!op || !op.receitas.length) return null;
    return op.receitas.find((r) => r.id === ui.receitaPorOp[op.id]) || op.receitas[0];
  }

  // A receita aberta é editada numa cópia (rascunho) até "Salvar receita"
  function rascunho(op) {
    const r = receitaAtual(op);
    if (!r) return null;
    if (!ui.rascunho || ui.rascunho.receitaId !== r.id) {
      ui.rascunho = { receitaId: r.id, nome: r.nome, produtos: r.produtos.map((l) => ({ ...l })) };
      if (!ui.rascunho.produtos.length) ui.rascunho.produtos.push(Planos.novaLinha());
    }
    return ui.rascunho;
  }

  function assinatura(linhas) {
    return JSON.stringify(linhas.filter(Planos.linhaPreenchida)
      .map((l) => [l.id, l.principioAtivo, l.produto, l.unidade, l.dose, l.preCadastro]));
  }

  function rascunhoAlterado(op) {
    const r = receitaAtual(op);
    return !!(r && ui.rascunho && ui.rascunho.receitaId === r.id &&
              (assinatura(ui.rascunho.produtos) !== assinatura(r.produtos) || ui.rascunho.nome.trim() !== r.nome));
  }

  // Receita sem nenhuma linha preenchida (nem produto, nem princípio ativo) e sem talhões
  function receitaVazia(op, r) {
    return !r.produtos.some(Planos.linhaPreenchida) && !Planos.talhoesDaReceita(op, r).length;
  }

  // Ao voltar para a tela (ex.: depois de outra etapa), exclui as receitas vazias que ficaram para trás,
  // menos a que está em edição com algum produto ainda não salvo
  function limparReceitasVazias() {
    const emEdicao = ui.rascunho && ui.rascunho.produtos.some(Planos.linhaPreenchida) ? ui.rascunho.receitaId : null;
    plano.grupos.forEach((g) => g.operacoes.forEach((op) => {
      op.receitas.filter((r) => r.id !== emEdicao && receitaVazia(op, r)).forEach((r) => {
        op.receitas.splice(op.receitas.indexOf(r), 1);
        if (ui.receitaPorOp[op.id] === r.id) delete ui.receitaPorOp[op.id];
        if (ui.rascunho && ui.rascunho.receitaId === r.id) ui.rascunho = null;
      });
    }));
  }

  // Antes de trocar de receita, operação ou grupo: confirma o descarte das alterações não salvas
  // e exclui a receita que ficou sem nenhum produto (receita vazia não fica no sistema).
  function sairDaReceita(depois, { removerVazia = true } = {}) {
    const op = opAtual();
    const r = receitaAtual(op);
    const seguir = () => {
      ui.rascunho = null; ui.preCadastro = null; ui.validarOp = null;
      if (removerVazia && r && receitaVazia(op, r)) {
        op.receitas.splice(op.receitas.indexOf(r), 1);
        delete ui.receitaPorOp[op.id];
      }
      depois();
    };
    if (!rascunhoAlterado(op)) { seguir(); return; }
    Modal.confirmar({
      titulo: `Descartar as alterações da ${T().nome}?`,
      texto: 'As alterações não salvas na recomendação serão perdidas.',
      botoes: [{ rotulo: 'Continuar editando' }, { rotulo: 'Descartar', classe: 'perigo', acao: seguir }]
    });
  }

  // ----- Recomendação agronômica (dentro do modal "Definir recomendação") -----
  // Tabela da receita aberta: Princípio ativo · Produto comercial · Dose padrão · Unid.
  function corpoReceita(op, r) {
    const leitura = somenteLeitura;
    const linhas = leitura ? r.produtos.filter(Planos.linhaPreenchida) : rascunho(op).produtos;
    const erros = errosVisiveis(op);
    // Só a linha em pré-cadastro na tabela: sem o cabeçalho (o pré-cadastro já tem os rótulos dele)
    const soPreCadastro = !leitura && ui.preCadastro && linhas.length === 1 && linhas[0].id === ui.preCadastro.linhaId;
    return `
      <div class="recomendacao__corpo">
        <div class="recomendacao__tabela">
          <table class="tabela tabela--compacta tabela-rec ${soPreCadastro ? 'tabela-rec--so-pre' : ''}">
            <thead ${soPreCadastro ? 'hidden' : ''}><tr>
              <th>${T().pa}</th><th>Produto comercial</th><th class="tabela__numero">Dose padrão</th><th>Unid.</th>
              ${leitura ? '' : '<th><span class="so-leitor">Remover</span></th>'}
            </tr></thead>
            <tbody>
              ${linhas.length ? linhas.map((l) => linhaRecomendacao(l, erros.linhas[l.id], leitura)).join('')
                : `<tr><td class="tabela__vazia" colspan="5">Nenhum produto na ${T().nome}.</td></tr>`}
            </tbody>
          </table>
          ${erros.semLinhas ? '<p class="erro-campo">Informe pelo menos um produto.</p>' : ''}
          ${leitura ? '' : acoesReceita(op)}
        </div>
      </div>`;
  }

  function acoesReceita() {
    return `
      <div class="recomendacao__acoes">
        <button class="link-acao" type="button" data-acao="adicionar-linha">${Icones.mais} Adicionar produto</button>
      </div>`;
  }

  function etiquetaPre(linha) {
    return linha.preCadastro ? '<span class="etiqueta-pre">Pré-cadastro</span>' : '';
  }

  // Tipo do insumo (classe do cadastro: Fungicida, Inseticida, Herbicida…) em selo pequeno abaixo do nome.
  // Produto de pré-cadastro fica sem selo.
  function seloTipo(linha) {
    const d = !linha.preCadastro && linha.produto ? Planos.produtoDoCadastro(linha.produto) : null;
    if (!d || !d.classe) return '';
    return `<span class="etiqueta-tipo etiqueta-tipo--${Util.normalizar(d.classe).replace(/\s+/g, '-')}">${esc(d.classe)}</span>`;
  }

  function linhaRecomendacao(l, erro = {}, leitura = somenteLeitura) {
    if (leitura) {
      return `
        <tr>
          <td>${esc(l.principioAtivo || '—')}</td>
          <td>${esc(l.produto || '—')} ${etiquetaPre(l)}${seloTipo(l)}</td>
          <td class="tabela__numero">${formatarDose(l.dose) || '—'}</td>
          <td>${Planos.unidadeDose(l)}</td>
        </tr>`;
    }
    if (ui.preCadastro && ui.preCadastro.linhaId === l.id) return linhaPreCadastro(l);

    // Sem produto comercial não há unidade nem dose: o princípio ativo só filtra os produtos
    const semProduto = !l.produto;
    return `
      <tr data-linha="${l.id}">
        <td>${celulaCombo(l, 'pa', l.principioAtivo, `Buscar ${T().pa.toLowerCase()}`, false)}${avisoRepetido(l, 'pa')}</td>
        <td>${celulaCombo(l, 'produto', l.produto, 'Buscar produto', erro.produto)} ${etiquetaPre(l)}${seloTipo(l)}
          ${erro.produto && !ui.naoEncontrado[`${l.id}:produto`] ? '<p class="erro-campo">Escolha o produto comercial</p>' : ''}${avisoRepetido(l, 'produto')}</td>
        <td class="tabela__numero" ${semProduto ? 'title="Escolha o produto comercial para informar a dose"' : ''}>
          <input class="campo__controle campo--compacto campo--dose ${erro.dose && !semProduto ? 'campo__controle--erro' : ''}" type="text" inputmode="decimal"
                 data-campo="linha-dose" value="${formatarDose(l.dose)}" placeholder="—" aria-label="Dose padrão"
                 ${semProduto ? 'disabled aria-describedby="dica-dose-produto"' : ''} ${erro.dose && !semProduto ? 'aria-invalid="true"' : ''}>
          ${erro.dose && !semProduto ? '<p class="erro-campo">Informação obrigatória</p>' : ''}
        </td>
        <td><span class="tabela-rec__unidade">${Planos.unidadeDose(l) || '—'}</span></td>
        <td class="tabela__acao">
          <button class="botao-icone botao-icone--p" type="button" data-acao="remover-linha" title="Remover produto"
                  aria-label="Remover ${esc(Planos.nomeLinha(l))}">${Icones.lixeira}</button>
          ${semProduto ? '<span class="so-leitor" id="dica-dose-produto">Escolha o produto comercial para informar a dose</span>' : ''}
        </td>
      </tr>`;
  }

  // Produto comercial ou princípio ativo repetido, em vermelho:
  //  - na mesma recomendação: "já está nesta recomendação" (bloqueia o aplicar);
  //  - em outra recomendação da operação: sem aviso (o "Também na Rec 1 · 2,00 L/ha" saiu em 29/10/2026).
  const mesmo = (campo) => (a, b) => a[campo] && b[campo] && Util.normalizar(a[campo]) === Util.normalizar(b[campo]);
  const mesmoProduto = mesmo('produto');
  const mesmoPA = mesmo('principioAtivo');

  // Linha anterior da mesma recomendação com o mesmo produto (ou o mesmo princípio ativo): 'produto' | 'pa' | null
  function repetidoNaMesma(linhas, l) {
    const antes = linhas.slice(0, linhas.indexOf(l)).filter(Planos.linhaPreenchida);
    if (antes.some((x) => mesmoProduto(x, l))) return 'produto';
    if (antes.some((x) => mesmoPA(x, l))) return 'pa';
    return null;
  }

  function avisoRepetido(l, coluna) {
    const op = opAtual();
    const atual = receitaAtual(op);
    const linhas = ui.rascunho && atual && ui.rascunho.receitaId === atual.id ? ui.rascunho.produtos : [];
    const naMesma = repetidoNaMesma(linhas, l);
    if (naMesma) {
      return naMesma === coluna
        ? `<p class="aviso-repetido">${Icones.alerta} ${coluna === 'produto' ? 'Produto' : T().pa} já está nesta ${T().nome}</p>`
        : '';
    }
    // Em outra recomendação da operação, o mesmo produto não avisa (29/10/2026): só dentro da mesma recomendação
    return '';
  }

  // Campo de busca com o texto digitado que não foi encontrado no cadastro (mantém o texto e mostra o erro)
  const MSG_NAO_ENCONTRADO = 'Não encontrado no cadastro. Escolha na lista ou use "+ Pré-cadastrar".';
  function celulaCombo(l, tipo, valor, placeholder, comErro) {
    const digitado = ui.naoEncontrado[`${l.id}:${tipo}`];
    if (digitado === undefined) return combo(l, tipo, valor, placeholder, comErro);
    return combo(l, tipo, digitado, placeholder, true) + `<p class="erro-campo erro-campo--digitado">${MSG_NAO_ENCONTRADO}</p>`;
  }

  // Texto digitado sem clicar numa opção: se for exatamente um item do cadastro, vale como escolhido.
  // Devolve 'ok' (aceito ou nada a fazer) ou 'nao-encontrado'.
  function aceitarDigitado(input) {
    const linha = linhaDoElemento(input);
    if (!linha) return 'ok';
    const tipo = input.dataset.combo;
    const texto = input.value.trim();
    const atual = tipo === 'pa' ? linha.principioAtivo : linha.produto;
    const chave = `${linha.id}:${tipo}`;
    if (!texto || texto === atual) { delete ui.naoEncontrado[chave]; return 'ok'; }
    const igual = (v) => v && Util.normalizar(v) === Util.normalizar(texto);
    if (tipo === 'pa') {
      const d = cadastroAtual().find((x) => igual(x.principioAtivo));
      if (!d) { ui.naoEncontrado[chave] = texto; return 'nao-encontrado'; }
      linha.principioAtivo = d.principioAtivo;
      const prod = Planos.produtoDoCadastro(linha.produto);
      if (prod && prod.principioAtivo !== d.principioAtivo) Object.assign(linha, { produto: '', unidade: '', dose: null, preCadastro: false });
    } else {
      const d = cadastroAtual().find((x) => igual(x.produto));
      if (!d) { ui.naoEncontrado[chave] = texto; return 'nao-encontrado'; }
      Object.assign(linha, { produto: d.produto, principioAtivo: d.principioAtivo || '', unidade: d.unidade, preCadastro: !!d.preCadastro });
    }
    delete ui.naoEncontrado[chave];
    return 'ok';
  }

  function combo(linha, tipo, valor, placeholder, comErro) {
    return `
      <div class="combo">
        <input class="campo__controle campo--compacto ${comErro ? 'campo__controle--erro' : ''}" type="text" data-combo="${tipo}" value="${esc(valor || '')}"
               placeholder="${placeholder}" autocomplete="off" role="combobox" aria-expanded="false"
               aria-label="${tipo === 'pa' ? T().pa : 'Produto comercial'}">
        <div class="combo__lista" role="listbox" hidden></div>
      </div>`;
  }

  // Guarda o que foi digitado no pré-cadastro; preenchido o campo, o erro dele some (sem redesenhar)
  function registrarPre(el) {
    const pc = ui.preCadastro;
    if (!pc) return;
    pc[el.dataset.pre] = el.value;
    if (pc.erros && pc.erros[el.dataset.pre] && el.value.trim()) {
      delete pc.erros[el.dataset.pre];
      el.classList.remove('campo__controle--erro');
      el.removeAttribute('aria-invalid');
      const msg = el.parentElement.querySelector('.pre-cadastro__msg');
      if (msg) msg.textContent = '';
    }
  }

  // A própria linha vira o pré-cadastro, com cada campo embaixo da sua coluna
  // (Princípio ativo · Produto comercial · Dose · Unid.). A dose é informada depois de salvar.
  function linhaPreCadastro(l) {
    const pc = ui.preCadastro;
    const erros = pc.erros || {};
    const id = (campo) => `pre-${campo}-${l.id}`;
    return `
      <tr data-linha="${l.id}" class="tabela-rec__pre tabela-rec__pre--titulo">
        <td colspan="5">
          <p class="pre-cadastro__titulo">Pré-cadastro de defensivo
            <span class="pre-cadastro__ajuda">· Informe o produto comercial e a unidade. ${T().paOpcional}.</span></p>
        </td>
      </tr>
      <tr data-linha="${l.id}" class="tabela-rec__pre">
        <td>
          <label class="pre-cadastro__rotulo" for="${id('pa')}">${T().pa} (opcional)</label>
          <input class="campo__controle campo--compacto" id="${id('pa')}" data-pre="principioAtivo" value="${esc(pc.principioAtivo)}"
                 placeholder="${T().pa}" autocomplete="off">
          <p class="pre-cadastro__msg"></p>
        </td>
        <td>
          <label class="pre-cadastro__rotulo" for="${id('produto')}">Produto comercial *</label>
          <input class="campo__controle campo--compacto ${erros.produto ? 'campo__controle--erro' : ''}" id="${id('produto')}" data-pre="produto"
                 value="${esc(pc.produto)}" placeholder="Produto comercial" autocomplete="off" ${erros.produto ? 'aria-invalid="true"' : ''}>
          <p class="pre-cadastro__msg erro-campo">${erros.produto || ''}</p>
        </td>
        <td></td>
        <td>
          <label class="pre-cadastro__rotulo" for="${id('unidade')}">Unidade do produto *</label>
          <select class="campo__controle campo--compacto ${erros.unidade ? 'campo__controle--erro' : ''}" id="${id('unidade')}" data-pre="unidade" required
                  ${erros.unidade ? 'aria-invalid="true"' : ''}>
            <option value="" ${pc.unidade ? '' : 'selected'} disabled>Unidade</option>
            ${(ehTsi() ? UNIDADES_TSI : UNIDADES).map((u) => `<option ${u === pc.unidade ? 'selected' : ''}>${u}</option>`).join('')}
          </select>
          <p class="pre-cadastro__msg erro-campo">${erros.unidade || ''}</p>
        </td>
        <td></td>
      </tr>
      <tr data-linha="${l.id}" class="tabela-rec__pre tabela-rec__pre--acoes">
        <td colspan="5">
          <div class="pre-cadastro__acoes">
            ${pc.aviso ? `<p class="erro-campo pre-cadastro__erro">${pc.aviso}</p>` : ''}
            <button class="botao botao--secundario botao--p" type="button" data-acao="cancelar-pre">Cancelar</button>
            <button class="botao botao--secundario botao--p pre-cadastro__salvar" type="button" data-acao="salvar-pre">Salvar pré-cadastro</button>
          </div>
        </td>
      </tr>`;
  }

  // ----- Talhões da operação -----
  // Filtros Todos · Não planejados; tabela Talhão · Área · produtos; marcar e "Definir recomendação"
  function talhoesVisiveis(op) {
    return ui.filtroTalhoes === 'nao-planejados' ? talhoesFazenda.filter((t) => naoPlanejado(op, t)) : talhoesFazenda;
  }

  // Não planejado = ainda sem recomendação. No TSI, só conta talhão com variedade (sem variedade não recebe TSI).
  function naoPlanejado(op, t) {
    return !op.talhoes[t.nome] && (!ehTsi() || temVariedade(t.nome));
  }

  // Talhão que pode ser marcado: no TSI, só com variedade
  function marcavel(op, t) {
    return !ehTsi() || temVariedade(t.nome);
  }

  // "Não planejados" só aparece quando filtra de fato: há talhão planejado e talhão que falta.
  // Antes de começar (nenhum planejado) seria igual a "Todos os talhões"; com tudo planejado, some.
  function etiquetaNaoPlanejados(planejaveis, naoPlanejados) {
    return naoPlanejados > 0 && naoPlanejados < planejaveis;
  }

  // A recomendação não mostra nome nem número na tela ("Rec 1" confundia os usuários): ela aparece pelo que
  // tem, os produtos e os talhões. O nome automático ("Recomendação 1") fica só no dado (Exportar e Importar).
  // Até 3 itens; o resto resumido: "Fox Xpro, Engeo Pleno S, Nimbus + 2"
  function resumoLista(itens) {
    return itens.slice(0, 3).join(', ') + (itens.length > 3 ? ` + ${itens.length - 3}` : '');
  }

  // "DMA 806 BR (L/ha)"; sem produto comercial, só o princípio ativo (não há unidade)
  function rotuloProduto(l) {
    const u = Planos.unidadeDose(l);
    return `${esc(Planos.nomeLinha(l))}${u ? ` (${u})` : ''}`;
  }

  // Filtros dos talhões (todos os grupos): etiquetas "Todos os talhões: 12" e "Não planejados: 8" (as etiquetas
  // "● Rec 1", "● Rec 2" e a bolinha da recomendação na tabela saíram em 29/10/2026).
  // Selecionada: fundo verde-claro e borda verde (não o verde sólido das abas, para não competir com elas).
  // Só aparecem com duas etiquetas ou mais: "Todos os talhões" sozinha não filtra nada (ex.: antes da 1ª definição)
  function filtrosTalhoes(itens) {
    if (itens.length < 2) return '';
    return `
      <div class="filtros-talhoes" role="group" aria-label="Filtrar talhões">
        ${itens.map(({ valor, rotulo }) => `
          <button class="filtro-talhoes ${ui.filtroTalhoes === valor ? 'filtro-talhoes--ativo' : ''}" type="button"
                  data-acao="filtro-talhoes" data-filtro="${esc(valor)}" aria-pressed="${ui.filtroTalhoes === valor}">${rotulo}</button>`).join('')}
      </div>`;
  }

  function painelTalhoes(op) {
    const naoPlanejados = talhoesFazenda.filter((t) => naoPlanejado(op, t)).length;
    const comNaoPlanejados = etiquetaNaoPlanejados(talhoesFazenda.filter((t) => marcavel(op, t)).length, naoPlanejados);
    const tsi = ehTsi();
    // Sem talhão não planejado, a etiqueta some (e quem estava nela volta para Todos os talhões)
    if (!comNaoPlanejados && ui.filtroTalhoes === 'nao-planejados') ui.filtroTalhoes = 'todos';
    const visiveis = talhoesVisiveis(op);
    const marcar = !somenteLeitura;
    const editar = !somenteLeitura;
    const marcaveis = visiveis.filter((t) => marcavel(op, t));
    const todos = marcaveis.length > 0 && marcaveis.every((t) => ui.marcados.has(t.nome));
    // Uma coluna por produto: os de todas as recomendações aplicadas na operação
    const colunas = Planos.colunasDose(op);
    const vazio = !talhoesFazenda.length ? `Nenhum talhão cadastrado na fazenda ${esc(plano.fazenda)}.`
      : !visiveis.length ? `Todos os talhões ${tsi ? 'com variedade ' : ''}já têm ${T().nome}.` : '';
    const nColunas = colunas.length + (marcar ? 3 : 2) + (tsi ? 1 : 2); // + Variedade (TSI) ou Produtividade histórica e Variedade planejada
    // TSI com talhão sem variedade: avisa por que a caixa dele está desabilitada e leva à guia do Plantio
    const semVariedade = tsi && marcar && talhoesFazenda.some((t) => !temVariedade(t.nome));
    const gSementes = grupoSementes();
    return `
      ${semVariedade ? `
        <div class="dica-plantio" role="note">${Icones.info}
          <p>Talhões sem variedade não recebem TSI. ${gSementes ? `Defina a variedade na guia
            <button class="dica-plantio__link" type="button" data-acao="ir-plantio">${esc(gSementes.nome)}</button>.`
            : 'Crie um grupo do tipo Plantio para definir a variedade.'}</p>
        </div>` : ''}
      ${filtrosTalhoes([
        { valor: 'todos', rotulo: `Todos os talhões: ${talhoesFazenda.length}` },
        ...(comNaoPlanejados ? [{ valor: 'nao-planejados', rotulo: `Não planejados: ${naoPlanejados}` }] : [])
      ])}
      <div class="talhoes-rolagem">
        <table class="tabela tabela--compacta tabela-talhoes tabela-doses">
          <thead><tr>
            ${marcar ? `<th class="tabela__marcar"><input type="checkbox" data-acao="marcar-todos" aria-label="Marcar todos"
                 ${todos ? 'checked' : ''} ${marcaveis.length ? '' : 'disabled'}></th>` : ''}
            <th>Talhão</th><th class="tabela__numero">Área (ha)</th>${tsi ? '<th>Variedade</th>' : `<th class="tabela__numero tabela__th-quebra" title="${esc(textoSafrasMedia())}">Produtividade histórica (${unidadeProdutividade()})</th><th>Variedade planejada</th>`}
            ${colunas.map((l) => `<th class="tabela__numero">${rotuloProduto(l)} ${etiquetaPre(l)}${seloTipo(l)}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${vazio ? `<tr><td class="tabela__vazia" colspan="${nColunas}">${vazio}</td></tr>` : visiveis.map((t) => {
              const ajuste = op.talhoes[t.nome];
              const r = ajuste ? Planos.receitaDoTalhao(op, ajuste) : null;
              const cinza = editar ? ' class="tabela__calculada" title="Vem do Plantio (guia Plantio)"' : '';
              // Em construção: a dose do talhão se edita na célula (fundo branco) e vira dose própria dele;
              // "—" (talhão sem a recomendação ou sem o produto) fica cinza, sem edição
              const doses = colunas.map((col) => {
                const l = ajuste ? Planos.linhaNoTalhao(op, ajuste, col) : null;
                if (!l) {
                  return editar
                    ? `<td class="tabela__numero tabela__nao-recebe tabela__calculada" title="Talhão sem este produto. Para incluir, use Planejar.">—</td>`
                    : '<td class="tabela__numero tabela__nao-recebe">—</td>';
                }
                const d = Planos.doseTalhao(op, ajuste, l);
                if (!editar) return `<td class="tabela__numero">${d === null || d === undefined ? '—' : formatarDose(d)}</td>`;
                return `<td class="tabela__numero tabela__editavel">${campoDose(op, t, ajuste, l, r)}</td>`;
              }).join('');
              // Em construção: clicar na linha abre o Planejar só com este talhão (com talhões marcados, marca ou desmarca)
              const abre = editar && marcavel(op, t);
              return `
                <tr data-talhao="${esc(t.nome)}" ${abre ? `class="linha--clicavel" title="${tituloLinha(esc(t.nome), t.nome, 'planejar')}"` : ''}>
                  ${marcar ? `<td class="tabela__marcar">${marcavel(op, t)
                      ? `<input type="checkbox" data-acao="marcar" data-talhao="${esc(t.nome)}" aria-label="Marcar ${esc(t.nome)}" ${ui.marcados.has(t.nome) ? 'checked' : ''}>`
                      : `<input type="checkbox" disabled aria-label="${esc(t.nome)} sem variedade: defina a variedade antes da TSI" title="Defina a variedade antes da TSI">`}</td>` : ''}
                  <th scope="row" class="tabela__talhao">${esc(t.nome)}</th>
                  <td class="tabela__numero${editar ? ' tabela__calculada' : ''}">${Util.area(t.area).replace(' ha', '')}</td>
                  ${tsi ? `<td${cinza}>${temVariedade(t.nome) ? esc(variedadesTexto(opPlantio(), t.nome)) : '<span class="tabela__nao-recebe">Sem variedade</span>'}</td>`
                    : `<td class="tabela__numero${editar ? ' tabela__calculada' : ''}">${historicoLeitura(t.nome)}</td>
                       <td${cinza}>${temVariedade(t.nome) ? esc(variedadesTexto(opPlantio(), t.nome)) : '<span class="tabela__nao-recebe">Não planejado</span>'}</td>`}
                  ${doses}
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${marcar ? barraDefinir(op) : ''}`;
  }

  // Dose do talhão na célula. Ao passar o mouse: dose própria ou a padrão da recomendação
  function campoDose(op, t, ajuste, l, r) {
    const d = Planos.doseTalhao(op, ajuste, l);
    const u = Planos.unidadeDose(l);
    const propria = l.id in ajuste.doses && d !== l.dose;
    const dica = r ? (propria ? `Dose deste talhão · padrão da ${T().nome}: ${formatarDose(l.dose)} ${u}` : `Dose padrão da ${T().nome}`) : '';
    return `<input class="celula celula--numero" data-campo="tb-dose" data-talhao="${esc(t.nome)}" data-linha="${esc(l.id)}" type="text"
                   inputmode="decimal" autocomplete="off" placeholder="—" value="${d === null || d === undefined ? '' : formatarDose(d)}"
                   title="${esc(dica)}" aria-label="Dose de ${esc(Planos.nomeLinha(l))} no ${esc(t.nome)}">`;
  }

  // Grava a dose de um talhão (dose própria; a recomendação não muda). Igual à padrão, ou vazia, volta a seguir
  // a padrão. Devolve { erro } ou { l, ajuste, vazia }.
  function gravarDose(op, talhao, linhaId, texto) {
    const ajuste = op.talhoes[talhao];
    const l = ajuste ? Planos.linhasTalhao(op, ajuste).find((x) => x.id === linhaId) : null;
    if (!l) return { erro: 'Talhão sem este produto.' };
    const n = Util.numero(texto);
    if (texto && !(n > 0)) return { erro: 'Dose: informe um número maior que zero.' };
    if (!texto || n === l.dose) delete ajuste.doses[l.id]; else ajuste.doses[l.id] = n;
    return { l, ajuste, vazia: !texto };
  }

  function salvarDoseCelula(op, el) {
    const g = gravarDose(op, el.dataset.talhao, el.dataset.linha, el.value.trim());
    if (g.erro) { el.value = el.defaultValue; Aviso.mostrar(g.erro); return; }
    alterou();
    const { l, ajuste } = g;
    const d = Planos.doseTalhao(op, ajuste, l);
    el.value = d === null || d === undefined ? '' : formatarDose(d);
    el.defaultValue = el.value;
    const r = Planos.receitaDoTalhao(op, ajuste);
    const propria = l.id in ajuste.doses;
    if (r) el.title = propria ? `Dose deste talhão · padrão da ${T().nome}: ${formatarDose(l.dose)} ${Planos.unidadeDose(l)}` : `Dose padrão da ${T().nome}`;
    if (g.vazia) Aviso.mostrar(`${esc(el.dataset.talhao)} volta à dose padrão da ${T().nome}`);
  }

  // ----- Colar várias linhas (e colunas) copiadas do Excel -----
  // Colado numa célula editável: preenche essa célula e as de baixo (um valor por talhão, na ordem da tabela);
  // com colunas (Tab), também as células editáveis ao lado. Valor inválido não entra; no fim, um aviso só.
  // Um valor só (sem quebra de linha nem Tab) cola normalmente no campo.
  function aoColar(e) {
    const el = e.target;
    if (somenteLeitura || !el.matches || !el.matches('.tabela-talhoes [data-variedade="tb"], .tabela-talhoes [data-campo^="tb-"]')) return;
    const texto = (e.clipboardData || window.clipboardData).getData('text') || '';
    const linhas = texto.replace(/\r/g, '').replace(/\n+$/, '').split('\n');
    if (linhas.length < 2 && !linhas[0].includes('\t')) return;
    e.preventDefault();
    const op = opAtual();
    const editaveis = (tr) => [...tr.querySelectorAll('[data-variedade="tb"], [data-campo^="tb-"]')];
    const trs = [...el.closest('tbody').rows];
    const inicio = trs.indexOf(el.closest('tr'));
    const coluna = editaveis(trs[inicio]).indexOf(el);
    let colados = 0; let sobraram = 0;
    const erros = [];
    linhas.forEach((linha, i) => {
      const tr = trs[inicio + i];
      if (!tr) { sobraram++; return; }
      linha.split('\t').forEach((valor, j) => {
        const alvo = editaveis(tr)[coluna + j];
        if (!alvo) return;
        const v = valor.trim();
        const talhao = alvo.dataset.talhao;
        let erro = null;
        if (alvo.dataset.variedade) {
          if (!v) return;
          const achada = acharVariedade(v);
          if (achada) mudarLinha(op, talhao, Number(alvo.dataset.var || 0), { variedade: achada.nome });
          else erro = 'variedade não encontrada';
        } else if (alvo.dataset.campo === 'tb-dose') {
          erro = gravarDose(op, talhao, alvo.dataset.linha, v).erro || null;
        } else {
          erro = gravarCampoPlantio(op, talhao, Number(alvo.dataset.var || 0), alvo.dataset.campo, v).erro || null;
        }
        if (erro) erros.push(talhao); else colados++;
      });
    });
    alterou();
    redesenharMantendoCelula();
    const partes = [`${colados} ${colados === 1 ? 'valor colado' : 'valores colados'}`];
    if (erros.length) partes.push(`${erros.length} não ${erros.length === 1 ? 'entrou' : 'entraram'} (valor inválido: ${[...new Set(erros)].map(esc).join(', ')})`);
    if (sobraram) partes.push(`${sobraram} ${sobraram === 1 ? 'linha sobrou' : 'linhas sobraram'} (não há mais talhões abaixo)`);
    Aviso.mostrar(partes.join(' · '));
  }

  // Sem talhão marcado: orientação em destaque e botão desabilitado.
  // Com talhão marcado: quantidade e área à esquerda; Limpar e "Definir recomendação" à direita.
  // "Excluir recomendação" aparece antes de Limpar e Definir recomendação quando algum talhão marcado tem recomendação.
  function barraDefinir(op) {
    const n = ui.marcados.size;
    const area = talhoesFazenda.filter((t) => ui.marcados.has(t.nome)).reduce((s, t) => s + t.area, 0);
    const comRec = [...ui.marcados].some((t) => op.talhoes[t]);
    return `
      <div class="barra-definir ${n ? '' : 'barra-definir--vazia'}">
        ${n ? `
          <span class="barra-definir__selecao"><strong>${n} ${n === 1 ? 'talhão' : 'talhões'}</strong> · ${Util.area(area)}</span>
          ${comRec ? `
            <button class="botao botao--perigo-leve barra-definir__excluir" type="button" data-acao="excluir-marcados">${Icones.lixeira} Excluir ${T().nome}</button>` : ''}
          <button class="botao botao--secundario barra-definir__limpar" type="button" data-acao="limpar-selecao"
                  title="Desmarcar todos os talhões" aria-label="Limpar seleção: desmarcar todos os talhões">Limpar</button>`
        : `<span class="barra-definir__texto">${Icones.info} Selecione vários talhões para planejar em lote</span>`}
        <button class="botao botao--primario" type="button" data-acao="definir-recomendacao" ${n ? '' : 'disabled'}>Planejar</button>
      </div>`;
  }

  // ----- Modal "Definir recomendação" -----
  // Fica dentro da tela (não no Modal genérico) para reaproveitar a busca de produto, o pré-cadastro,
  // as guias de recomendação e o rascunho, que dependem dos eventos da tela.
  function abrirDefinir(op) {
    const talhoes = talhoesFazenda.filter((t) => ui.marcados.has(t.nome) && marcavel(op, t)).map((t) => t.nome);
    if (!talhoes.length) return;
    if (semDap(op)) return;
    ui.rascunho = null; ui.preCadastro = null; ui.validarOp = null; ui.erroNome = null; ui.naoEncontrado = {}; ui.copiadoDe = null;
    // Talhões marcados que já estão todos na mesma recomendação: abre nela.
    // Senão, cria a próxima (Recomendação 2, Rec 2…), com produto e dose em branco e sem mostrar
    // as outras: o modal é só dessa recomendação. Se for cancelado, a nova vazia é descartada.
    const receitas = new Set(talhoes.map((t) => op.talhoes[t] && op.talhoes[t].receitaId));
    const comum = receitas.size === 1 ? [...receitas][0] : null;
    if (comum) {
      ui.receitaPorOp[op.id] = comum;
      // Talhões marcados com a mesma dose própria: o modal mostra a dose deles, não a padrão
      const r = op.receitas.find((x) => x.id === comum);
      rascunho(op).produtos.forEach((l) => {
        const base = r.produtos.find((x) => x.id === l.id);
        if (!base) return;
        const doses = talhoes.map((t) => Planos.doseTalhao(op, op.talhoes[t], base));
        if (doses.every((d) => d === doses[0])) l.dose = doses[0];
      });
    } else {
      const nova = Planos.novaReceita(op, [], T().base);
      op.receitas.push(nova);
      ui.receitaPorOp[op.id] = nova.id;
    }
    // Doses mostradas ao abrir: ao aplicar em parte dos talhões, só a dose que a pessoa mudar é gravada
    const dosesIniciais = Object.fromEntries(rascunho(op).produtos.map((l) => [l.id, l.dose]));
    ui.definindo = { talhoes, dosesIniciais };
    // Foco no próprio modal (focar a busca abriria a lista de produtos por cima de tudo)
    desenharMantendoFoco('.definir');
  }

  // Sem DAP não dá para aplicar: mostra o erro no cabeçalho e não abre o modal
  function semDap(op) {
    if (op.dap !== null && op.dap !== undefined && op.dap !== '') return false;
    ui.validarOp = op.id; desenharTudo(); raiz.querySelector('#op-dap')?.focus();
    return true;
  }

  // Cancelar, X ou Esc: descarta o que foi feito no modal (sem perguntar) e mantém os talhões marcados
  function fecharDefinir() {
    const op = opAtual();
    ui.rascunho = null; ui.preCadastro = null; ui.validarOp = null; ui.erroNome = null; ui.naoEncontrado = {}; ui.copiadoDe = null;
    ui.definindo = null;
    if (op) {
      op.receitas.filter((r) => receitaVazia(op, r)).forEach((r) => op.receitas.splice(op.receitas.indexOf(r), 1));
      if (!op.receitas.some((r) => r.id === ui.receitaPorOp[op.id])) delete ui.receitaPorOp[op.id];
    }
    desenharMantendoFoco('[data-acao="definir-recomendacao"]');
  }

  // Cabeçalho dos modais Definir recomendação e Definir plantio: um talhão, o nome dele ("T04 · 128 ha");
  // mais de um, a contagem ("3 talhões · 410 ha")
  function alvoDefinir(talhoes, area) {
    const n = talhoes.length;
    return `${n === 1 ? esc(talhoes[0]) : `${n} talhões`} · ${Util.area(area)}`;
  }

  function modalDefinir(op) {
    const { talhoes } = ui.definindo;
    const n = talhoes.length;
    const area = talhoesFazenda.filter((t) => talhoes.includes(t.nome)).reduce((s, t) => s + t.area, 0);
    const r = receitaAtual(op);
    return `
      <div class="definir-fundo">
        <div class="definir" role="dialog" aria-modal="true" aria-labelledby="definir-titulo" tabindex="-1">
          <div class="definir__topo">
            <div class="definir__titulos">
              <h2 class="definir__titulo" id="definir-titulo">Planejar ${T().nome}</h2>
              <p class="definir__op">${esc(op.nome)} · ${ehTsi() ? 'Tratamento de sementes industrial' : `DAP ${op.dap}`}</p>
              <p class="definir__alvo">${alvoDefinir(talhoes, area)}</p>
            </div>
            <button class="botao-icone" type="button" data-acao="fechar-definir" aria-label="Fechar">${Icones.fechar}</button>
          </div>
          <div class="definir__corpo">
            ${r && !somenteLeitura && !Planos.talhoesDaReceita(op, r).length && campoCopiar(op, r) ? `
              <div class="definir__linha-nome">${campoCopiar(op, r)}</div>` : ''}
            ${r ? corpoReceita(op, r) : `
              <p class="recomendacao__vazia">Nenhuma ${T().nome} nesta operação.</p>`}
          </div>
          <div class="definir__rodape">
            ${r && !somenteLeitura && Planos.talhoesDaReceita(op, r).length ? `
              <button class="botao botao--perigo-leve definir__excluir" type="button" data-acao="excluir-rec">${Icones.lixeira} Excluir ${T().nome}</button>` : ''}
            <button class="botao botao--secundario" type="button" data-acao="fechar-definir">Cancelar</button>
            <button class="botao botao--primario" type="button" data-acao="aplicar-definicao" ${r ? '' : 'disabled'}>Salvar</button>
          </div>
        </div>
      </div>`;
  }

  // O nome da recomendação é automático (Recomendação 1, 2…): o campo "Nome da recomendação" saiu do modal
  // (29/10/2026; confundia os usuários). O nome não aparece na tela (30/10/2026).


  // ================= Grupo Tratamento de semente (TSI) =================
  // docs/telas/04.4-operacoes-tratamento-sementes.md. A recomendação agronômica (receitas, talhões e doses)
  // da operação de TSI, só para talhão com variedade (a variedade vem do Plantio, no grupo do tipo Sementes).
  function ehGrupoTsi(grupo) {
    return grupo && grupo.tipo === 'Tratamento de sementes';
  }

  function ehTsi() {
    return ehGrupoTsi(grupoAtual());
  }

  function grupoSementes() {
    return plano.grupos.find(ehSemente) || null;
  }

  // Operação de plantio (a primeira do grupo Sementes): de onde vem a variedade de cada talhão
  function opPlantio() {
    const g = grupoSementes();
    return (g && g.operacoes[0]) || null;
  }

  function temVariedade(talhao) {
    const op = opPlantio();
    return !!(op && op.plantio && planejado(op, talhao));
  }

  function detalheTsi(op) {
    // Cabeçalho como no Defensivo (nome e DAP informado pelo agrônomo), sem a fenologia
    return `<section class="cartao op-painel" aria-label="${esc(op.nome)}">${cabecalhoOperacao(op, { semFenologia: true })}${painelTalhoes(op)}</section>`;
  }

  // Cabeçalho do Plantio: só o nome (o DAP é sempre 0)
  function cabecalhoPaginaInteira(op) {
    return `<div class="op-cabecalho__linha">${nomeOperacao(op)}</div>`;
  }

  // Produtos do cadastro: no TSI só os de tratamento de sementes; nos defensivos, sem eles.
  // Fertilidade: só corretivos e fertilizantes
  function cadastroAtual() {
    if (ehAplicacaoInsumos(grupoAtual())) return DADOS.defensivos.filter((d) => usoProduto(d) !== 'tsi');
    const uso = usoAtual();
    return DADOS.defensivos.filter((d) => usoProduto(d) === uso);
  }
  function usoProduto(d) {
    return d.tsi ? 'tsi' : d.fertilidade ? 'fertilidade' : 'defensivo';
  }
  function usoAtual() {
    return ehTsi() ? 'tsi' : ehFertilidade(grupoAtual()) ? 'fertilidade' : 'defensivo';
  }

  // Palavras da recomendação agronômica; no TSI, "TSI" ("Definir TSI", "TSI 1 aplicada")
  function T() {
    // pa: nome da coluna do princípio ativo (na Fertilidade, a matéria-prima: a fonte do nutriente)
    const fert = ehFertilidade(grupoAtual());
    const pa = fert ? 'Matéria-prima' : 'Princípio ativo';
    const paOpcional = fert ? 'A matéria-prima é opcional' : 'O princípio ativo é opcional';
    return ehTsi() ? { nome: 'TSI', Nome: 'TSI', base: 'TSI', pa, paOpcional }
      : { nome: 'recomendação', Nome: 'Recomendação', base: 'Recomendação', pa, paOpcional };
  }

  // ================= Grupo Plantio: plantio por talhão =================
  // docs/telas/04.2-operacoes-sementes.md. Plantio: variedade, data e população por talhão.
  // O TSI fica no grupo Tratamento de semente (ver ehGrupoTsi).
  function ehSemente(grupo) {
    return grupo && grupo.tipo === 'Sementes';
  }

  function variedadeDoCadastro(nome) {
    return DADOS.variedades.find((v) => v.nome === nome && v.cultura === plano.cultura) || null;
  }

  function variedadesDaCultura() {
    return DADOS.variedades.filter((v) => v.cultura === plano.cultura);
  }

  // "BRS 6981IPRO · ciclo 103 dias" (lista de variedades)
  function rotuloVariedade(v) {
    return `${v.nome} · ${v.ciclo ? `ciclo ${v.ciclo} dias` : 'ciclo não informado'}`;
  }

  // ----- Busca de variedade (célula da tabela, painel do talhão e modal Definir plantio) -----
  // Digitar filtra as variedades da cultura (sem diferenciar maiúscula nem acento); sem resultado, "+ Pré-cadastrar".
  // Sair do campo sem escolher volta ao valor anterior (não fica variedade digitada sem cadastro).
  // onde: 'tb' (célula), 'pt' (painel) ou 'pl' (modal). A lista abre por cima da tela (não fica cortada na tabela).
  function rotuloCurtoVariedade(v) {
    return v ? `${v.nome} (${v.ciclo ? `${v.ciclo} d` : 'ciclo não informado'})` : '';
  }

  // Nome sem o que vem entre parênteses no fim ("BMX Foco IPRO (104 d)" → "BMX Foco IPRO"), para achar o colado
  function nomeBusca(texto) {
    return String(texto || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  }

  // Variedade da cultura com esse nome (sem diferenciar maiúscula nem acento); senão, null
  function acharVariedade(texto) {
    const busca = Util.normalizar(nomeBusca(texto));
    return busca ? variedadesDaCultura().find((v) => Util.normalizar(v.nome) === busca) || null : null;
  }

  // vi: índice da variedade no talhão (várias variedades por talhão) ou da linha da composição no modal
  function campoVariedade(onde, { id = '', talhao = '', vi = null, nome = '', classe = 'campo__controle', rotulo = 'Variedade' } = {}) {
    const v = variedadeDoCadastro(nome);
    const texto = v ? v.nome : '';
    // Ciclo embaixo do campo (painel); na tabela e na composição do modal, não (desalinha a linha)
    const ciclo = v && onde === 'pt' && v.ciclo ? `<p class="campo__ajuda">Ciclo de ${v.ciclo} dias</p>` : '';
    return `${ciclo ? '<div>' : ''}
      <div class="combo combo--variedade">
        <input class="${classe}" ${id ? `id="${id}"` : ''} type="text" data-variedade="${onde}" ${talhao ? `data-talhao="${esc(talhao)}"` : ''} ${vi !== null ? `data-var="${vi}"` : ''}
               value="${esc(texto)}" data-rotulo="${esc(texto)}" placeholder="${onde === 'tb' ? 'Não planejado' : 'Buscar variedade'}"
               autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-label="${esc(rotulo)}">
        <div class="combo__lista" role="listbox" hidden></div>
      </div>${ciclo ? `${ciclo}</div>` : ''}`;
  }

  function opcoesVariedade(texto) {
    const busca = Util.normalizar(nomeBusca(texto));
    const lista = variedadesDaCultura().filter((v) => !busca || Util.normalizar(v.nome).includes(busca))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    const opcoes = lista.map((v) => ({ valor: v.nome,
      rotulo: `${esc(v.nome)}<span class="combo__sub">${v.ciclo ? `ciclo ${v.ciclo} dias` : 'ciclo não informado'}</span>`, pre: v.preCadastro }));
    const exata = lista.some((v) => Util.normalizar(v.nome) === busca);
    if (texto.trim() && !exata) opcoes.push({ preCadastrar: true, valor: texto.trim(), rotulo: `${Icones.mais} Pré-cadastrar "${esc(texto.trim())}"` });
    return { opcoes, nenhuma: !lista.length };
  }

  function abrirBuscaVariedade(input) {
    const lista = input.parentElement.querySelector('.combo__lista');
    // Sem mexer no texto (o que já estava), mostra todas
    const texto = input.value === input.dataset.rotulo ? '' : input.value;
    const { opcoes, nenhuma } = opcoesVariedade(texto);
    lista.innerHTML = (nenhuma ? '<div class="combo__nada">Nenhuma variedade encontrada</div>' : '') + opcoes.map((o, i) => `
      <div class="combo__opcao ${o.preCadastrar ? 'combo__opcao--pre' : ''} ${i === 0 && !o.preCadastrar ? 'combo__opcao--ativa' : ''}" role="option" data-indice="${i}"
           data-valor="${esc(o.valor)}" ${o.preCadastrar ? 'data-pre-cadastrar' : ''}>
        ${o.rotulo} ${o.pre ? '<span class="etiqueta-pre">Pré-cadastro</span>' : ''}
      </div>`).join('');
    // Por cima da tela, logo abaixo do campo (ou acima, se não couber embaixo)
    const r = input.getBoundingClientRect();
    lista.hidden = false;
    lista.style.position = 'fixed';
    lista.style.left = `${r.left}px`;
    lista.style.width = `${Math.max(r.width, 280)}px`;
    const altura = Math.min(lista.scrollHeight, 300);
    const embaixo = window.innerHeight - r.bottom - 8 >= altura || r.top < altura;
    lista.style.top = embaixo ? `${r.bottom + 4}px` : `${r.top - altura - 4}px`;
    input.setAttribute('aria-expanded', 'true');
  }

  function fecharBuscaVariedade(input, { voltar = true } = {}) {
    const lista = input.parentElement && input.parentElement.querySelector('.combo__lista');
    if (lista) lista.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    if (voltar) input.value = input.dataset.rotulo || '';
  }

  // Escolheu na lista (ou pré-cadastrou): grava no lugar certo
  function escolherVariedade(input, opcaoEl) {
    let nome = opcaoEl.dataset.valor;
    if (opcaoEl.hasAttribute('data-pre-cadastrar')) {
      const r = preCadastrarVariedade(nome);
      if (r.erro) { Aviso.mostrar(r.erro); return; }
      nome = r.nome;
    }
    aplicarVariedade(input, nome);
  }

  // Grava a variedade. Escolhida (clique ou Enter), o cursor vai para a data de plantio; ao sair do campo
  // (semFoco), o cursor fica onde a pessoa foi.
  function aplicarVariedade(input, nome, { semFoco = false } = {}) {
    fecharBuscaVariedade(input, { voltar: false });
    const op = opAtual();
    const onde = input.dataset.variedade;
    const vi = Number(input.dataset.var || 0);
    if (onde === 'pl') {
      const linha = ui.plantando.linhas[vi];
      if (linha) linha.variedade = nome;
      delete ui.plantando.erros[`variedade${vi}`]; delete ui.plantando.erros.composicao;
      if (semFoco) redesenharMantendoCelula(); else desenharMantendoFoco(`[data-campo="pl-pct"][data-var="${vi}"]`);
      return;
    }
    // Painel: vai para o rascunho (grava ao Salvar)
    if (onde === 'pt') {
      mudarRascunho(vi, { variedade: nome });
      if (semFoco) { redesenharMantendoCelula(); return; }
      desenharMantendoFoco(raiz.querySelector(`#pt-area-${vi}`) ? `#pt-area-${vi}` : `#pt-data-${vi}`);
      return;
    }
    const t = input.dataset.talhao;
    mudarLinha(op, t, vi, { variedade: nome });
    alterou();
    if (semFoco) { redesenharMantendoCelula(); return; }
    desenharMantendoFoco(`[data-campo="tb-data"][data-talhao="${CSS.escape(t)}"][data-var="${vi}"]`);
  }

  // Saiu do campo ou deu Enter sem opção escolhida: nome igual a uma variedade vale; senão, volta ao anterior
  function aceitarVariedadeDigitada(input, { semFoco = false } = {}) {
    const texto = input.value.trim();
    if (!texto || texto === input.dataset.rotulo) { fecharBuscaVariedade(input); return; }
    const v = acharVariedade(texto);
    if (v) { aplicarVariedade(input, v.nome, { semFoco }); return; }
    fecharBuscaVariedade(input);
    Aviso.mostrar('Variedade não encontrada: escolha na lista ou pré-cadastre.');
  }

  // Setas escolhem a opção ativa; Enter confirma; Esc desiste
  function teclaBuscaVariedade(e) {
    const el = e.target;
    const lista = el.parentElement.querySelector('.combo__lista');
    const opcoes = [...lista.querySelectorAll('.combo__opcao')];
    const ativa = lista.querySelector('.combo__opcao--ativa');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (lista.hidden) { abrirBuscaVariedade(el); return; }
      if (!opcoes.length) return;
      const i = opcoes.indexOf(ativa);
      const novo = opcoes[(i + (e.key === 'ArrowDown' ? 1 : -1) + opcoes.length) % opcoes.length];
      if (ativa) ativa.classList.remove('combo__opcao--ativa');
      novo.classList.add('combo__opcao--ativa');
      novo.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!lista.hidden && ativa) escolherVariedade(el, ativa); else aceitarVariedadeDigitada(el);
    } else if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      fecharBuscaVariedade(el);
    } else if (e.key === 'Tab') {
      fecharBuscaVariedade(el);
    }
  }

  // ----- Datas e decêndios (datas em 'AAAA-MM-DD', sem fuso) -----
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
    'setembro', 'outubro', 'novembro', 'dezembro'];

  function dataLocal(iso) {
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, m - 1, d);
  }

  function somarDias(iso, dias) {
    const dt = dataLocal(iso);
    dt.setDate(dt.getDate() + dias);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  function diaMes(iso) {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  }

  function dataCompleta(iso) {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }

  // Decêndio da data: 1º (dias 1 a 10), 2º (11 a 20), 3º (21 ao fim do mês)
  function decendio(iso) {
    const dt = dataLocal(iso);
    const n = dt.getDate() <= 10 ? 1 : dt.getDate() <= 20 ? 2 : 3;
    const mes = MESES[dt.getMonth()];
    const fim = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
    const dias = n === 1 ? '01–10' : n === 2 ? '11–20' : `21–${fim}`;
    return {
      chave: `${iso.slice(0, 7)}-${n}`,               // ordena os decêndios
      curto: `${n}º dec. ${mes}`,                       // eixo do gráfico
      texto: `${n}º dec. de ${mes}`,                    // painel do talhão
      longo: `${n}º decêndio de ${mes} (${dias}/${mes.slice(0, 3)})`
    };
  }

  // Data digitada "07/10/2026" (ou "07102026") → '2026-10-07'; inválida → null
  function dataDeTexto(texto) {
    const d = String(texto || '').replace(/\D/g, '');
    if (d.length !== 8) return null;
    const [dia, mes, ano] = [Number(d.slice(0, 2)), Number(d.slice(2, 4)), Number(d.slice(4))];
    const dt = new Date(ano, mes - 1, dia);
    if (ano < 1900 || dt.getFullYear() !== ano || dt.getMonth() !== mes - 1 || dt.getDate() !== dia) return null;
    return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  // Máscara enquanto digita: só números, com as barras no lugar (dd/mm/aaaa)
  function mascaraData(texto) {
    const d = String(texto || '').replace(/\D/g, '').slice(0, 8);
    return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('/');
  }

  // Campo de data de plantio (texto com máscara; grava ao sair do campo ou com Enter)
  // O botão ao lado abre o calendário do navegador (campo de data escondido atrás do botão)
  function campoData(id, campo, iso, texto, erro) {
    return `<div class="campo-data">
              <input class="campo__controle ${erro ? 'campo__controle--erro' : ''}" id="${id}" data-campo="${campo}" type="text"
                     inputmode="numeric" placeholder="dd/mm/aaaa" maxlength="10" autocomplete="off"
                     value="${esc(texto ?? (iso ? dataCompleta(iso) : ''))}" ${erro ? 'aria-invalid="true"' : ''}>
              <button class="botao-icone campo-data__botao" type="button" data-acao="abrir-calendario"
                      aria-label="Escolher a data no calendário" title="Escolher no calendário">${Icones.calendario}</button>
              <input class="campo-data__nativo" type="date" data-campo="${campo}-cal" value="${iso || ''}" tabindex="-1" aria-hidden="true">
            </div>
            ${erro ? `<p class="erro-campo">${erro}</p>` : ''}`;
  }

  // Ano do plantio pela safra do plano ("26/27" → 2026)
  function anoPlantio() {
    const ano = 2000 + Number(String(plano.safra).slice(0, 2));
    return Number.isFinite(ano) ? ano : new Date().getFullYear();
  }

  // Janela recomendada da variedade ('MM-DD' a 'MM-DD'): "1º dec. de outubro a 2º dec. de novembro"
  function janelaTexto(v) {
    if (!v || !v.janela) return '';
    const [ini, fim] = v.janela.map((md) => decendio(`${anoPlantio()}-${md}`).texto);
    return ini === fim ? ini : `${ini} a ${fim}`;
  }

  // Data fora da janela recomendada: só alerta, não bloqueia
  function foraDaJanela(v, data) {
    if (!v || !v.janela || !data) return false;
    const md = data.slice(5);
    return md < v.janela[0] || md > v.janela[1];
  }

  // Previsão de colheita = data de plantio + ciclo da variedade (sem ciclo ou sem data: null)
  function previsaoColheita(p) {
    const v = p && p.variedade ? variedadeDoCadastro(p.variedade) : null;
    return p && p.data && v && v.ciclo ? somarDias(p.data, v.ciclo) : null;
  }

  function semCiclo(p) {
    const v = p && p.variedade ? variedadeDoCadastro(p.variedade) : null;
    return !!(v && !v.ciclo);
  }

  // ----- Histórico do talhão: [safra, variedade, sc/ha, chuva mm] -----
  function historicoTalhao(talhao) {
    return ((DADOS.historico || {})[plano.fazenda] || {})[talhao] || [];
  }

  function mediaHistorica(h) {
    return h.length ? h.reduce((s, x) => s + x[2], 0) / h.length : null;
  }

  function umaCasa(v) {
    return v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  // Talhão "planejado" no passo Variedade = tem variedade (em qualquer das variedades dele)
  function planejado(op, talhao) {
    return Planos.temVariedadePlantio(op, talhao);
  }

  // Colunas da tabela do Plantio (uma linha por variedade): valor de cada linha (r = linhaInfo), para ordenar.
  // Área do talhão: a área inteira; Área de aplicação: a da variedade (em ha).
  const COLUNAS_PLANTIO = [
    { id: 'talhao', rotulo: 'Talhão', valor: (op, r) => r.t.nome },
    { id: 'area', rotulo: 'Área do talhão', sub: '(ha)', numero: true, valor: (op, r) => r.t.area },
    { id: 'aplicacao', rotulo: 'Área de aplicação', sub: '(ha)', numero: true, valor: (op, r) => r.area },
    { id: 'produtividade', rotulo: 'Produtividade histórica', sub: '(sc/ha)', dica: 'Média das últimas 3 safras', centro: true, valor: (op, r) => mediaHistorica(historicoTalhao(r.t.nome)) },
    { id: 'variedade', rotulo: 'Variedade', valor: (op, r) => r.l.variedade || null },
    { id: 'ciclo', rotulo: 'Ciclo', sub: '(dias)', numero: true, valor: (op, r) => { const v = r.l.variedade ? variedadeDoCadastro(r.l.variedade) : null; return v && v.ciclo ? v.ciclo : null; } },
    { id: 'plantio', rotulo: 'Data de plantio', valor: (op, r) => r.l.data || null },
    { id: 'colheita', rotulo: 'Previsão de colheita', valor: (op, r) => previsaoColheita(r.l) },
    { id: 'populacao', rotulo: 'População', sub: '(mil plantas/ha)', numero: true, valor: (op, r) => r.l.populacao || null },
    { id: 'germinacao', rotulo: 'Germinação', sub: '(%)', numero: true, valor: (op, r) => r.germ },
    { id: 'sementes', rotulo: 'Total de sementes', numero: true, valor: (op, r) => r.sementes },
    // Embalagem da cultura do plano: soja em bags, milho em sacos (quanto vale cada uma, ao passar o mouse no título)
    { id: 'embalagem', rotulo: 'Embalagem', valor: (op, r) => (r.sementes ? embalagem().descricao : null) },
    { id: 'qtdEmbalagens', rotulo: 'Qtd. de embalagens', numero: true, valor: (op, r) => r.sementes }
  ];
  const colunaPlantio = (id) => COLUNAS_PLANTIO.find((c) => c.id === id);
  // Colunas do tamanho do conteúdo; a Variedade fica com o espaço que sobra
  const classeColuna = (c) => (c.centro ? 'tabela__centro' : c.numero ? 'tabela__numero' : c.id === 'variedade' ? 'tabela__expandir' : '');


  // Talhões na ordem escolhida no título da coluna (sem ordem: a dos talhões).
  // Valor vazio (sem variedade, sem data) fica sempre no fim.
  // Etiquetas do Plantio (como no Defensivo): Todos os talhões · Não planejados (= sem variedade).
  // Só filtram a Tabela; quando "Não planejados" não filtra nada (ver etiquetaNaoPlanejados), some e volta para Todos.
  function naoPlanejadosPlantio(op) {
    return talhoesFazenda.filter((t) => !planejado(op, t.nome));
  }

  function filtroPlantio(op) {
    if (ui.filtroTalhoes !== 'nao-planejados' || !etiquetaNaoPlanejados(talhoesFazenda.length, naoPlanejadosPlantio(op).length)) ui.filtroTalhoes = 'todos';
    return ui.filtroTalhoes;
  }

  function filtrosPlantio(op) {
    filtroPlantio(op);
    const naoPlanejados = naoPlanejadosPlantio(op).length;
    return filtrosTalhoes([
      { valor: 'todos', rotulo: `Todos os talhões: ${talhoesFazenda.length}` },
      ...(etiquetaNaoPlanejados(talhoesFazenda.length, naoPlanejados) ? [{ valor: 'nao-planejados', rotulo: `Não planejados: ${naoPlanejados}` }] : [])
    ]);
  }

  // Linha da tabela (uma variedade do talhão; talhão sem plantio: uma linha vazia): área de aplicação, germinação
  // (a da linha, a do talhão, a geral do plano ou a padrão, 95%) e total de sementes (população × área de aplicação ÷ germinação)
  function linhaInfo(op, t, linhas, l, i) {
    const area = linhas.length ? Planos.areaLinhaPlantio(linhas, i, t.area) : null;
    const germ = Planos.germinacaoLinha(op, t.nome, l);
    const pop = l.populacao || null;
    return { t, i, l, linhas, area, germ, sementes: pop && germ && area ? pop * 1000 * area / (germ / 100) : null,
      ultima: i === Math.max(0, linhas.length - 1) };
  }

  // Linhas visíveis (filtro "Não planejados" e ordem escolhida no título da coluna; vazio sempre no fim).
  // Sem ordem, as variedades de cada talhão ficam juntas, na ordem dos talhões.
  function linhasVisiveisPlantio(op) {
    const filtrar = (ui.visaoSemente || 'talhoes') === 'talhoes' && filtroPlantio(op) === 'nao-planejados';
    const talhoes = filtrar ? naoPlanejadosPlantio(op) : [...talhoesFazenda];
    const linhas = talhoes.flatMap((t) => {
      const ls = Planos.linhasPlantio(op, t.nome);
      return (ls.length ? ls : [{}]).map((l, i) => linhaInfo(op, t, ls, l, i));
    });
    const ordem = ui.ordemSemente;
    const c = ordem && colunaPlantio(ordem.coluna);
    if (!c) return linhas;
    return linhas.sort((a, b) => {
      const va = c.valor(op, a); const vb = c.valor(op, b);
      if (va === null || va === undefined) return vb === null || vb === undefined ? 0 : 1;
      if (vb === null || vb === undefined) return -1;
      const x = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR', { numeric: true });
      return ordem.sentido === 'desc' ? -x : x;
    });
  }

  // Talhões na ordem das linhas da tabela (o painel passa de um para o outro nessa ordem)
  function talhoesVisiveisPlantio(op) {
    const vistos = [];
    linhasVisiveisPlantio(op).forEach((r) => { if (!vistos.includes(r.t)) vistos.push(r.t); });
    return vistos;
  }

  // Título de coluna: ordena só pelas setas (1º clique crescente, 2º decrescente).
  // O rótulo pode ter quebra de linha (<br>); "depois" entra ao lado da seta (ex.: o filtro de variedade).
  // dica: texto ao passar o mouse no nome da coluna (ex.: "1 bag = 5 milhões de sementes")
  function tituloOrdenavel(coluna, rotulo, classe = '', depois = '', dica = '') {
    const ordem = ui.ordemSemente;
    const texto = rotulo.replace(/<br>/g, ' ');
    const ativa = ordem && ordem.coluna === coluna;
    const sentido = ativa ? ordem.sentido : null;
    const nome = `<span${dica ? ` title="${esc(dica)}" class="titulo-dica"` : ''}>${rotulo}</span>`;
    return `
      <th class="${classe}" ${ativa ? `aria-sort="${sentido === 'asc' ? 'ascending' : 'descending'}"` : ''}>
        <span class="titulo-coluna">${nome}
          <button class="titulo-ordenar ${ativa ? 'titulo-ordenar--ativo' : ''} ${sentido === 'desc' ? 'titulo-ordenar--desc' : ''}" type="button"
                  data-acao="ordenar-semente" data-coluna="${coluna}" title="Ordenar por ${texto.toLowerCase()}"
                  aria-label="Ordenar por ${texto.toLowerCase()}${ativa ? (sentido === 'asc' ? ', crescente' : ', decrescente') : ''}">${ativa ? Icones.acima : Icones.ordenar}</button>${depois}
        </span>
      </th>`;
  }

  // ----- Cartão da operação de plantio -----
  function detalheSemente(op) {
    if (!op.plantio) op.plantio = {};
    const comPainel = ['talhoes', 'mapa'].includes(ui.visaoSemente || 'talhoes') &&
      ui.painelTalhao && talhoesFazenda.some((t) => t.nome === ui.painelTalhao);
    // Painel expandido: ocupa a área da tabela (o cartão da operação fica escondido até reduzir ou fechar)
    return `
      <div class="semente-layout ${comPainel && ui.painelExpandido ? 'semente-layout--painel-cheio' : ''}">
        <section class="cartao op-painel" aria-label="${esc(op.nome)}">
          <div class="semente-cabecalho">
            <div class="semente-cabecalho__titulos">
              ${cabecalhoPaginaInteira(op)}
              <p class="semente-cabecalho__sub">Selecione um talhão para definir a variedade de plantio.</p>
            </div>
            ${visoesVariedade()}
          </div>
          ${(ui.visaoSemente || 'talhoes') === 'talhoes' ? `<div class="semente-topo">${filtrosPlantio(op)}</div>` : ''}
          ${passoVariedade(op)}
        </section>
        ${comPainel ? painelTalhao(op, ui.painelTalhao) : ''}
      </div>`;
  }

  // ----- Operação de campo: a lista de operações à esquerda (nome e DAP), como na recomendação de insumos, e uma página
  // por operação, com as setas ‹ › no cabeçalho. Tabela Talhão · Produtividade histórica · Área do talhão (ha) · Área de
  // aplicação (ha), a da operação aberta (área do talhão × Área %; o mesmo nome de coluna em todas as operações; editável
  // na célula). Sem operação: a tabela sem a Área de aplicação. As operações se definem em lote: marcar os talhões e "Definir operação", ou clicar na
  // linha (abre só com o talhão clicado, como na recomendação). Guardado em op.talhoes[talhão] = { pct } -----
  const areaCampo = (op, t) => (op.talhoes[t.nome] ? Math.round(t.area * (op.talhoes[t.nome].pct ?? 100) / 100 * 100) / 100 : null);

  function detalheOperacaoCampo(grupo, aberta) {
    const u = unidadeProdutividade();
    const marcar = !somenteLeitura;
    const todos = talhoesFazenda.length > 0 && talhoesFazenda.every((t) => ui.marcados.has(t.nome));
    const ops = aberta ? [aberta] : [];
    const area = (n) => numeroTexto(n);
    const nCol = ops.length + (marcar ? 4 : 3);
    // Mesmo formato da recomendação de insumos: a lista de operações à esquerda e o cartão da operação
    return `
        <section class="cartao op-painel" aria-label="${esc(aberta ? aberta.nome : grupo.nome)}">
          ${aberta ? cabecalhoOperacao(aberta, { semFenologia: true }) : `
          <div class="semente-cabecalho">
            <div class="semente-cabecalho__titulos"><div class="op-cabecalho__linha"><h2 class="op-cabecalho__nome">${esc(grupo.nome)}</h2></div></div>
          </div>`}
          <div class="talhoes-rolagem">
            <table class="tabela tabela--compacta tabela-talhoes tabela-campo">
              <thead><tr>
                ${marcar ? `<th class="tabela__marcar"><input type="checkbox" data-acao="marcar-todos" aria-label="Marcar todos" ${todos ? 'checked' : ''}
                     ${talhoesFazenda.length ? '' : 'disabled'}></th>` : ''}
                <th>Talhão</th>
                <th class="tabela__centro" title="Média das últimas 3 safras">Produtividade histórica (${u})</th>
                <th class="tabela__numero">Área do talhão (ha)</th>
                ${ops.map((op) => `<th class="tabela__numero" title="${esc(op.nome)} · DAP ${op.dap ?? '—'}">Área de aplicação (ha)</th>`).join('')}
              </tr></thead>
              <tbody>
                ${talhoesFazenda.length ? talhoesFazenda.map((t) => `
                  <tr data-talhao="${esc(t.nome)}" ${marcar ? `class="linha--clicavel" title="${tituloLinha(esc(t.nome), t.nome, 'planejar')}"` : ''}>
                    ${marcar ? `<td class="tabela__marcar"><input type="checkbox" data-acao="marcar" data-talhao="${esc(t.nome)}"
                        aria-label="Marcar ${esc(t.nome)}" ${ui.marcados.has(t.nome) ? 'checked' : ''}></td>` : ''}
                    <th scope="row" class="tabela__talhao">${esc(t.nome)}</th>
                    <td class="tabela__centro">${historicoLeitura(t.nome)}</td>
                    <td class="tabela__numero">${area(t.area)}</td>
                    ${ops.map((op) => {
                      const a = areaCampo(op, t);
                      // Em construção: a área aplicada se edita na célula (em ha, até a área do talhão); vazio tira o talhão da operação
                      if (marcar) {
                        return `<td class="tabela__numero tabela__editavel"><input class="celula celula--numero" type="text" inputmode="decimal" autocomplete="off"
                          data-campo="campo-area" data-talhao="${esc(t.nome)}" data-op="${op.id}" placeholder="—" value="${a === null ? '' : area(a)}"
                          aria-label="Área de ${esc(op.nome)} no ${esc(t.nome)} (ha)"></td>`;
                      }
                      return `<td class="tabela__numero">${a === null ? '<span class="tabela__nao-recebe">—</span>' : area(a)}</td>`;
                    }).join('')}
                  </tr>`).join('')
                : `<tr><td class="tabela__vazia" colspan="${nCol}">Nenhum talhão cadastrado na fazenda ${esc(plano.fazenda)}.</td></tr>`}
              </tbody>
            </table>
          </div>
          ${marcar ? barraOperacaoCampo(aberta) : ''}
        </section>`;
  }

  // Rodapé, no padrão da recomendação: sem talhão marcado, a faixa amarela e o botão desabilitado; com talhão marcado,
  // "N talhões · X ha", Excluir operação (quando algum marcado tem a operação aberta), Limpar e Definir operação
  function barraOperacaoCampo(aberta) {
    const marcados = talhoesFazenda.filter((t) => ui.marcados.has(t.nome));
    const n = marcados.length;
    const area = marcados.reduce((s, t) => s + t.area, 0);
    const comOperacao = aberta && marcados.some((t) => aberta.talhoes[t.nome]);
    return `
      <div class="barra-definir ${n ? '' : 'barra-definir--vazia'}">
        ${n ? `
          <span class="barra-definir__selecao"><strong>${n} ${n === 1 ? 'talhão' : 'talhões'}</strong> · ${Util.area(area)}</span>
          ${comOperacao ? `<button class="botao botao--perigo-leve barra-definir__excluir" type="button" data-acao="campo-excluir">${Icones.lixeira} Excluir operação</button>` : ''}
          <button class="botao botao--secundario barra-definir__limpar" type="button" data-acao="limpar-selecao"
                  title="Desmarcar todos os talhões" aria-label="Limpar seleção: desmarcar todos os talhões">Limpar</button>`
        : `<span class="barra-definir__texto">${Icones.info} Selecione vários talhões para planejar em lote</span>`}
        <button class="botao botao--primario" type="button" data-acao="campo-definir" ${n ? '' : 'disabled'}>Planejar</button>
      </div>`;
  }

  // Modal "Definir operação" (talhões marcados), no modelo do Definir plantio: uma linha por operação (Nome da operação ·
  // DAP · Área (%) · lixeira), "+ Adicionar operação", Cancelar e Salvar. Abre com as operações que todos os talhões
  // marcados já têm (com a mesma área); sem nenhuma, uma linha em branco (Área 100%). Ao salvar, substitui as operações
  // desses talhões: as linhas valem para eles e as operações que saíram das linhas deixam de valer neles. Nome de uma
  // operação do grupo: ela recebe os talhões (e o DAP); nome novo: cria a operação (uma coluna nova). Fica dentro da tela,
  // como o Definir plantio: fecha só pelos botões.
  const linhaCampoVazia = () => ({ nome: '', dap: '', pct: '100' });
  function abrirDefinirCampo(grupo) {
    const talhoes = talhoesFazenda.filter((t) => ui.marcados.has(t.nome)).map((t) => t.nome);
    if (!talhoes.length) return;
    // O modal é da operação aberta na página (ex.: na Aração, "Planejar operação · Aração"): o nome e o DAP já vêm
    // preenchidos; a Área, a dos talhões marcados quando é a mesma em todos (senão 100%). Grupo sem operação: em branco.
    const aberta = opAtual();
    const daPagina = aberta && grupo.operacoes.includes(aberta) ? aberta : null;
    const pcts = daPagina ? [...new Set(talhoes.map((t) => (daPagina.talhoes[t] ? daPagina.talhoes[t].pct ?? 100 : null)))] : [];
    const pct = pcts.length === 1 && pcts[0] !== null ? numeroTexto(pcts[0]) : '100';
    ui.campo = { grupoId: grupo.id, talhoes, opId: daPagina ? daPagina.id : null, iniciais: [], erros: {},
      linhas: [daPagina ? { nome: daPagina.nome, dap: daPagina.dap ?? '', pct } : linhaCampoVazia()] };
    desenharMantendoFoco('.definir');
  }

  function modalCampo(grupo) {
    const dc = ui.campo;
    const area = talhoesFazenda.filter((t) => dc.talhoes.includes(t.nome)).reduce((s, t) => s + t.area, 0);
    const erro = (campo) => (dc.erros[campo] ? `<p class="erro-campo">${dc.erros[campo]}</p>` : '');
    const classeErro = (campo) => (dc.erros[campo] ? 'campo__controle--erro' : '');
    const ops = operacoesOrdenadas(grupo);
    const linhas = dc.linhas.map((l, vi) => `
        <div class="composicao__linha" data-var="${vi}">
          <div class="campo"><input class="campo__controle ${classeErro(`nome${vi}`)}" data-campo="dc-nome" data-var="${vi}" list="dc-ops"
                 autocomplete="off" placeholder="Nome da operação" value="${esc(l.nome)}" aria-label="Nome da operação ${vi + 1}"></div>
          <div class="campo"><input class="campo__controle ${classeErro(`dap${vi}`)}" data-campo="dc-dap" data-var="${vi}" inputmode="numeric"
                 autocomplete="off" placeholder="Ex.: -30" value="${esc(String(l.dap))}" aria-label="DAP da operação ${vi + 1}"></div>
          <div class="campo"><input class="campo__controle ${classeErro(`pct${vi}`)}" data-campo="dc-pct" data-var="${vi}" inputmode="decimal"
                 autocomplete="off" placeholder="%" value="${esc(String(l.pct))}" aria-label="Área da operação ${vi + 1} (% de cada talhão)"></div>
          ${dc.linhas.length > 1 ? `<button class="botao-icone composicao__remover" type="button" data-acao="dc-remover" data-var="${vi}"
                   title="Tirar esta operação" aria-label="Tirar a operação ${vi + 1}">${Icones.lixeira}</button>` : '<span class="composicao__remover"></span>'}
        </div>
        ${erro(`nome${vi}`)}${erro(`dap${vi}`)}${erro(`pct${vi}`)}`).join('');
    return `
      <div class="definir-fundo">
        <div class="definir definir--composicao definir--campo" role="dialog" aria-modal="true" aria-labelledby="campo-titulo" tabindex="-1">
          <div class="definir__topo">
            <div class="definir__titulos">
              <h2 class="definir__titulo" id="campo-titulo">Planejar operação${dc.opId ? ` · ${esc((grupo.operacoes.find((o) => o.id === dc.opId) || {}).nome || '')}` : ''}</h2>
              <p class="definir__op">${esc(grupo.nome)} · Cultura ${esc(plano.cultura)}</p>
              <p class="definir__alvo">${alvoDefinir(dc.talhoes, area)}</p>
            </div>
            <button class="botao-icone" type="button" data-acao="dc-fechar" aria-label="Fechar">${Icones.fechar}</button>
          </div>
          <div class="definir__corpo">
            <p class="campo__ajuda plantio__orientacao">Informe as operações, o DAP e a área de cada uma em cada talhão marcado. Ao salvar, substitui as operações desses talhões.</p>
            <datalist id="dc-ops">${ops.map((o) => `<option value="${esc(o.nome)}">`).join('')}</datalist>
            <div class="composicao composicao--campo">
              <div class="composicao__linha composicao__cab" aria-hidden="true">
                <span>Nome da operação</span><span>DAP</span><span>Área (%)</span><span></span>
              </div>
              ${linhas}
            </div>
            ${erro('geral')}
          </div>
          <div class="definir__rodape">
            <button class="botao botao--secundario" type="button" data-acao="dc-fechar">Cancelar</button>
            <button class="botao botao--primario" type="button" data-acao="dc-salvar">Salvar</button>
          </div>
        </div>
      </div>`;
  }

  // Valida e grava: cada linha com nome (sem repetir nas linhas nem em operação de outro grupo), DAP inteiro (ou vazio)
  // e Área de 1 a 100%
  function salvarCampo(grupo) {
    const dc = ui.campo;
    dc.erros = {};
    const vistos = new Set();
    const ops = grupo.operacoes;
    // Modal da operação da página: grava nela (mudar o nome no modal renomeia a operação)
    const daPagina = dc.opId ? ops.find((o) => o.id === dc.opId) : null;
    const achar = (nome) => daPagina || ops.find((o) => Util.normalizar(o.nome) === Util.normalizar(nome));
    const linhas = dc.linhas.filter((l) => String(l.nome).trim() || String(l.dap).trim() || (String(l.pct).trim() && String(l.pct).trim() !== '100'));
    if (!linhas.length) dc.erros.geral = 'Informe ao menos uma operação.';
    dc.linhas.forEach((l, vi) => {
      if (!linhas.includes(l)) return;
      const nome = String(l.nome).trim();
      const n = Util.normalizar(nome);
      if (!nome) dc.erros[`nome${vi}`] = `Operação ${vi + 1}: informe o nome.`;
      else if (vistos.has(n)) dc.erros[`nome${vi}`] = `Operação ${vi + 1}: a mesma operação aparece duas vezes.`;
      else if (daPagina ? nomeOperacaoRepetido(nome, daPagina) : !achar(nome) && nomeOperacaoRepetido(nome)) dc.erros[`nome${vi}`] = `Operação ${vi + 1}: ${NOME_OP_REPETIDO.toLowerCase()}.`;
      vistos.add(n);
      const t = String(l.dap).trim();
      if (t && !Number.isInteger(Number(t.replace(',', '.')))) dc.erros[`dap${vi}`] = `Operação ${vi + 1}: DAP é um número inteiro.`;
      const pct = Util.numero(String(l.pct));
      if (!(pct > 0 && pct <= 100)) dc.erros[`pct${vi}`] = `Operação ${vi + 1}: área de 1 a 100%.`;
    });
    if (Object.keys(dc.erros).length) { desenharTudo(); return; }
    const usadas = [];
    linhas.forEach((l) => {
      const nome = String(l.nome).trim();
      const t = String(l.dap).trim();
      const dap = t ? Number(t.replace(',', '.')) : null;
      let op = achar(nome);
      if (!op) { op = Planos.novaOperacao(nome, dap); grupo.operacoes.push(op); }
      else {
        if (dap !== null) op.dap = dap;
        if (op === daPagina && op.nome !== nome) op.nome = nome;
      }
      const pct = Util.numero(String(l.pct));
      dc.talhoes.forEach((tal) => { op.talhoes[tal] = { ...Planos.novoAjuste(null), pct }; });
      usadas.push(op.id);
    });
    // As operações que estavam nos talhões e saíram das linhas deixam de valer neles
    dc.iniciais.filter((id) => !usadas.includes(id)).forEach((id) => {
      const op = ops.find((o) => o.id === id);
      if (op) dc.talhoes.forEach((tal) => { delete op.talhoes[tal]; });
    });
    const n = dc.talhoes.length;
    ui.campo = null;
    // Abre a primeira operação salva (as outras ficam na lista, com as setas ‹ ›)
    if (usadas.length && !usadas.includes(ui.opPorGrupo[grupo.id])) ui.opPorGrupo[grupo.id] = usadas[0];
    limparSelecao(); alterou(); desenharTudo();
    Aviso.mostrar(`${usadas.length} ${usadas.length === 1 ? 'operação definida' : 'operações definidas'} em ${n} ${n === 1 ? 'talhão' : 'talhões'}`);
  }

  // Modal "Nova operação" (grupo Operação de campo), no modelo do Definir operação: uma linha por operação (Nome da operação ·
  // DAP · Fenologia · lixeira), "+ Adicionar operação", Cancelar e Salvar. No cabeçalho, só o grupo (sem talhões). Cria as
  // operações no grupo, sem talhões (eles se definem depois, pelo Definir operação ou na tabela). DAP 0 ou negativo:
  // sem fenologia (pré-plantio e plantio). O nome não se repete no plano nem nas linhas. Fecha só pelos botões.
  const linhaNovaOp = () => ({ nome: '', dap: '', fenologia: '' });
  function abrirNovasOperacoes() {
    ui.novasOps = { linhas: [linhaNovaOp()], erros: {} };
    desenharMantendoFoco('[data-campo="no-nome"][data-var="0"]');
  }

  function modalNovasOperacoes(grupo) {
    const no = ui.novasOps;
    const erro = (campo) => (no.erros[campo] ? `<p class="erro-campo">${no.erros[campo]}</p>` : '');
    const classeErro = (campo) => (no.erros[campo] ? 'campo__controle--erro' : '');
    const linhas = no.linhas.map((l, vi) => `
        <div class="composicao__linha" data-var="${vi}">
          <div class="campo"><input class="campo__controle ${classeErro(`nome${vi}`)}" data-campo="no-nome" data-var="${vi}" autocomplete="off"
                 placeholder="Nome da operação" value="${esc(l.nome)}" aria-label="Nome da operação ${vi + 1}"></div>
          <div class="campo"><input class="campo__controle ${classeErro(`dap${vi}`)}" data-campo="no-dap" data-var="${vi}" inputmode="numeric"
                 autocomplete="off" placeholder="Ex.: -30" value="${esc(String(l.dap))}" aria-label="DAP da operação ${vi + 1}"></div>
          <div class="campo"><select class="campo__controle" data-campo="no-fenologia" data-var="${vi}" aria-label="Fenologia da operação ${vi + 1}">
                 <option value="">—</option>
                 ${DADOS.fenologia.map((f) => `<option ${f === l.fenologia ? 'selected' : ''}>${esc(f)}</option>`).join('')}
               </select></div>
          ${no.linhas.length > 1 ? `<button class="botao-icone composicao__remover" type="button" data-acao="no-remover" data-var="${vi}"
                   title="Tirar esta operação" aria-label="Tirar a operação ${vi + 1}">${Icones.lixeira}</button>` : '<span class="composicao__remover"></span>'}
        </div>
        ${erro(`nome${vi}`)}${erro(`dap${vi}`)}`).join('');
    return `
      <div class="definir-fundo">
        <div class="definir definir--composicao definir--campo" role="dialog" aria-modal="true" aria-labelledby="novas-titulo" tabindex="-1">
          <div class="definir__topo">
            <div class="definir__titulos">
              <h2 class="definir__titulo" id="novas-titulo">Nova operação</h2>
              <p class="definir__op">${esc(grupo.nome)} · Cultura ${esc(plano.cultura)}</p>
            </div>
            <button class="botao-icone" type="button" data-acao="no-fechar" aria-label="Fechar">${Icones.fechar}</button>
          </div>
          <div class="definir__corpo">
            <p class="campo__ajuda plantio__orientacao">Informe as operações, o DAP e a fenologia de cada uma. ${ehAplicacaoInsumos(grupo)
              ? 'Os produtos e os talhões de cada operação se definem depois, no Planejar.' : 'Os talhões de cada operação se definem depois, na tabela.'}</p>
            <div class="composicao composicao--campo">
              <div class="composicao__linha composicao__cab" aria-hidden="true">
                <span>Nome da operação</span><span>DAP</span><span>Fenologia</span><span></span>
              </div>
              ${linhas}
            </div>
            <div class="composicao__rodape">
              <button class="link-acao composicao__adicionar" type="button" data-acao="no-adicionar">${Icones.mais} Adicionar operação</button>
            </div>
            ${erro('geral')}
          </div>
          <div class="definir__rodape">
            <button class="botao botao--secundario" type="button" data-acao="no-fechar">Cancelar</button>
            <button class="botao botao--primario" type="button" data-acao="no-salvar">Salvar</button>
          </div>
        </div>
      </div>`;
  }

  function salvarNovasOperacoes(grupo) {
    const no = ui.novasOps;
    no.erros = {};
    const linhas = no.linhas.filter((l) => String(l.nome).trim() || String(l.dap).trim() || l.fenologia);
    if (!linhas.length) no.erros.geral = 'Informe ao menos uma operação.';
    const vistos = new Set();
    no.linhas.forEach((l, vi) => {
      if (!linhas.includes(l)) return;
      const nome = String(l.nome).trim();
      const n = Util.normalizar(nome);
      if (!nome) no.erros[`nome${vi}`] = `Operação ${vi + 1}: informe o nome.`;
      else if (vistos.has(n)) no.erros[`nome${vi}`] = `Operação ${vi + 1}: a mesma operação aparece duas vezes.`;
      else if (nomeOperacaoRepetido(nome)) no.erros[`nome${vi}`] = `Operação ${vi + 1}: ${NOME_OP_REPETIDO.toLowerCase()}.`;
      vistos.add(n);
      const t = String(l.dap).trim();
      if (t && !Number.isInteger(Number(t.replace(',', '.')))) no.erros[`dap${vi}`] = `Operação ${vi + 1}: DAP é um número inteiro.`;
    });
    if (Object.keys(no.erros).length) { desenharTudo(); return; }
    const criadas = linhas.map((l) => {
      const t = String(l.dap).trim();
      const dap = t ? Number(t.replace(',', '.')) : null;
      const op = Planos.novaOperacao(String(l.nome).trim(), dap);
      op.fenologia = dap !== null && dap <= 0 ? '' : l.fenologia || '';
      grupo.operacoes.push(op);
      return op;
    });
    ui.novasOps = null;
    ui.opPorGrupo[grupo.id] = criadas[0].id;
    limparSelecao(); alterou(); desenharTudo();
    Aviso.mostrar(`${criadas.length} ${criadas.length === 1 ? 'operação criada' : 'operações criadas'} em ${esc(grupo.nome)}`);
  }

  // ----- Passo Plantio (variedade, data de plantio e população) -----
  // "Exibir" (à direita dos passos): Tabela · Mapa. A Previsão de colheita está pausada (29/10/2026): o código
  // (visaoColheita) continua aqui, só sem o botão
  function visoesVariedade() {
    const visao = ui.visaoSemente === 'mapa' ? 'mapa' : 'talhoes';
    // No mesmo estilo do "+ Criar Plano Safra": a escolhida é o botão principal (verde); a outra, o botão com borda
    const botao = (valor, rotulo, icone) => `
      <button class="botao ${visao === valor ? 'botao--primario' : 'botao--secundario'} semente-visao" type="button" data-acao="visao-semente"
              data-visao="${valor}" aria-pressed="${visao === valor}">${icone}${rotulo}</button>`;
    return `
      <div class="exibir">
        <div class="semente-visoes" role="group" aria-label="Visualização do plantio">
          ${botao('talhoes', 'Tabela', Icones.tabela)}${botao('mapa', 'Mapa', Icones.mapa)}
        </div>
      </div>`;
  }

  function passoVariedade(op) {
    return ui.visaoSemente === 'mapa' ? `${visaoMapa()}${legendaMapa(op)}` : tabelaVariedade(op);
  }

  // Unidade da produtividade conforme a cultura do plano (por enquanto só soja: sc/ha)
  function unidadeProdutividade() {
    return { Soja: 'sc/ha' }[plano.cultura] || 'sc/ha';
  }

  // Título da coluna ao passar o mouse: as safras que entram na média ("Média das safras 23/24, 24/25 e 25/26").
  // São as 3 últimas ocorrências da cultura em cada talhão; podem não ser seguidas (ex.: 20/21, 23/24 e 25/26).
  function textoSafrasMedia() {
    const safras = [...new Set(talhoesFazenda.flatMap((t) => historicoTalhao(t.nome).map(([safra]) => safra)))].sort();
    if (!safras.length) return 'Sem histórico de produtividade';
    const lista = safras.length > 1 ? `${safras.slice(0, -1).join(', ')} e ${safras[safras.length - 1]}` : safras[0];
    return `Média ${safras.length > 1 ? 'das safras' : 'da safra'} ${lista}`;
  }

  // Produtividade média das 3 últimas safras, só o número (Defensivo e Fertilidade; no TSI, por enquanto não).
  // Ao passar o mouse, safra a safra com a variedade de cada ano (deixa claro que o histórico é de outras variedades).
  function historicoLeitura(talhao) {
    const h = historicoTalhao(talhao);
    if (!h.length) return '<span class="tabela__nao-recebe">—</span>';
    const u = unidadeProdutividade();
    const safras = h.map(([safra, variedade, sc]) => `${safra} · ${variedade} · ${Math.round(sc)} ${u}`).join('\n');
    return `<span title="${esc(safras)}">${Math.round(mediaHistorica(h))}<span class="so-leitor"> (${esc(safras)})</span></span>`;
  }

  // Média das 3 safras, só o número (a unidade fica no nome da coluna), como link: abre o painel do talhão,
  // onde fica o gráfico safra a safra
  function linkHistorico(talhao) {
    const h = historicoTalhao(talhao);
    return h.length ? umaCasa(mediaHistorica(h)) : 'Sem histórico';
  }

  // Linha de uma variedade na tabela do Plantio (r = linhaInfo). Em construção, Área de aplicação, Variedade, Plantio e
  // População e Germinação (a da variedade; começa em 95%) se editam na própria célula (fundo branco); Área do talhão,
  // Previsão de colheita, Total de sementes e Bags são calculadas (fundo cinza).
  // Clique esquerdo na linha: abre o painel do talhão; botão direito: Inserir · Excluir · Limpar conteúdo.
  // A caixa de marcar é da linha (variedade).
  function linhaPlantio(op, r, marcar) {
    const { t, l, i } = r;
    const editar = !somenteLeitura;
    const vazio = '<span class="tabela__nao-recebe">—</span>';
    const nome = esc(t.nome);
    const v = l.variedade ? variedadeDoCadastro(l.variedade) : null;
    const prev = previsaoColheita(l);
    const aberto = ui.painelTalhao === t.nome;
    const pop = l.populacao || null;
    const s = r.sementes;
    const alertaData = foraDaJanela(v, l.data)
      ? `<span class="aviso-janela" title="Fora da janela recomendada (${esc(janelaTexto(v))})">${Icones.alerta}<span class="so-leitor">Fora da janela recomendada</span></span>` : '';
    const alertaPop = foraDaFaixa(v, pop)
      ? `<span class="aviso-janela" title="Fora da população recomendada (${faixaPopulacao(v)} mil plantas/ha)">${Icones.alerta}<span class="so-leitor">Fora da população recomendada</span></span>` : '';
    const variedade = editar
      ? `<span class="celula-linha">${campoVariedade('tb', { talhao: t.nome, vi: i, nome: v ? v.nome : '', classe: 'celula celula--lista', rotulo: `Variedade do ${t.nome}` })}${v && v.preCadastro ? '<span class="etiqueta-pre">Pré-cadastro</span>' : ''}</span>`
      : v ? `${esc(v.nome)}${v.preCadastro ? ' <span class="etiqueta-pre">Pré-cadastro</span>' : ''}`
        : '<span class="tabela__nao-recebe">Não planejado</span>';
    // Ciclo (dias): do cadastro da variedade; sem ciclo, "Não informado" (informa-se no painel do talhão)
    const ciclo = !v ? vazio : v.ciclo ? v.ciclo : '<span class="texto-alerta" title="Informe o ciclo no painel do talhão">Não informado</span>';
    const campo = (nomeCampo, valor, classe, rotulo, extra = '', exemplo = '—') => `<input class="celula ${classe}" data-campo="${nomeCampo}" data-talhao="${nome}" data-var="${i}" type="text"
             autocomplete="off" placeholder="${exemplo}" value="${esc(valor)}" aria-label="${rotulo} do ${nome}" ${extra}>`;
    const plantio = editar
      ? `<span class="celula-linha">${campo('tb-data', l.data ? dataCompleta(l.data) : '', 'celula--data', 'Data de plantio', 'inputmode="numeric" maxlength="10"', 'dd/mm/aaaa')}<span data-cel="alerta-data">${alertaData}</span></span>`
      : l.data ? `${dataCompleta(l.data)}${alertaData ? ` ${alertaData}` : ''}` : vazio;
    const colheita = prev ? dataCompleta(prev) : semCiclo(l) ? '<span class="texto-alerta">Informe o ciclo</span>' : vazio;
    const populacao = editar
      ? `<span class="celula-linha celula-linha--numero"><span data-cel="alerta-pop">${alertaPop}</span>${campo('tb-populacao', pop ? numeroTexto(pop) : '', 'celula--numero', 'População', 'inputmode="decimal"')}</span>`
      : pop ? `${alertaPop ? `${alertaPop} ` : ''}${numeroTexto(pop)}` : vazio;
    // Germinação: a da variedade da linha (começa em 95%)
    const germinacao = editar
      ? campo('tb-germinacao', r.germ ? numeroTexto(r.germ) : '', 'celula--numero', 'Germinação', 'inputmode="decimal"', String(Planos.GERMINACAO_PADRAO))
      : r.germ ? numeroTexto(r.germ) : vazio;
    // Área de aplicação: falta informar quando o talhão tem mais de uma variedade e esta está sem área
    const faltaArea = r.linhas.length > 1 && !(r.area > 0);
    const aplicacao = editar
      ? campo('tb-area', r.area !== null && r.area !== undefined ? numeroTexto(r.area) : '', `celula--numero ${faltaArea ? 'celula--erro' : ''}`, 'Área de aplicação', 'inputmode="decimal"', faltaArea ? 'Informe' : '—')
      : r.area !== null && r.area !== undefined ? numeroTexto(r.area) : vazio;
    // Inserir, excluir e limpar a linha: botão direito na linha (menu, como na aba Revisão)
    const acoes = '';
    const ed = editar ? ' tabela__editavel' : '';
    const calc = editar ? ' tabela__calculada' : '';
    // Ao passar o mouse na célula cinza: "Campo calculado"
    const dicaCalc = editar ? ' title="Campo calculado"' : '';
    return `
        <tr class="linha--clicavel ${aberto ? 'linha--aberta' : ''} ${i > 0 ? 'linha--variedade' : ''}" data-talhao="${nome}" data-var="${i}"
            title="${tituloLinha(nome, chaveLinha(t.nome, i), 'abrir')}">
          ${marcar ? `<td class="tabela__marcar"><input type="checkbox" data-acao="marcar" data-talhao="${nome}" data-chave="${esc(chaveLinha(t.nome, i))}"
              aria-label="Marcar ${nome}${l.variedade ? ` · ${esc(l.variedade)}` : ''}" ${ui.marcados.has(chaveLinha(t.nome, i)) ? 'checked' : ''}></td>` : ''}
          <th scope="row" class="tabela__talhao"><span class="tabela__talhao-nome">${nome}${acoes}</span></th>
          <td class="tabela__numero${calc}"${dicaCalc}>${Util.area(t.area).replace(' ha', '')}</td>
          <td class="tabela__numero${ed}">${aplicacao}</td>
          <td class="tabela__centro">${linkHistorico(t.nome)}</td>
          <td class="tabela__expandir${ed}">${variedade}</td>
          <td class="tabela__numero${calc}" title="Do cadastro da variedade">${ciclo}</td>
          <td class="${ed.trim()}">${plantio}</td>
          <td class="${calc.trim()}"${dicaCalc} data-cel="colheita">${colheita}</td>
          <td class="tabela__numero${ed}">${populacao}</td>
          <td class="tabela__numero${ed}">${germinacao}</td>
          <td class="tabela__numero${calc}"${dicaCalc} data-cel="sementes">${s ? milhoes(s) : vazio}</td>
          <td class="${calc.trim()}"${dicaCalc} data-cel="embalagem">${s ? esc(embalagem().descricao) : vazio}</td>
          <td class="tabela__numero tabela__forte${calc}"${dicaCalc} data-cel="bags">${s ? bags(s) : vazio}</td>
        </tr>`;
  }

  // Tabela única: uma linha por variedade (o talhão pode ter várias); todas as colunas ordenam (setas).
  function tabelaVariedade(op) {
    const linhasTabela = linhasVisiveisPlantio(op);
    const marcar = !somenteLeitura;
    const todos = linhasTabela.length > 0 && linhasTabela.every((r) => ui.marcados.has(chaveLinha(r.t.nome, r.i)));
    const linhas = linhasTabela.map((r) => linhaPlantio(op, r, marcar)).join('');
    const titulo = (id) => {
      const c = colunaPlantio(id);
      return tituloOrdenavel(id, c.sub ? `${c.rotulo} ${c.sub}` : c.rotulo, classeColuna(c), '', c.dica || '');
    };
    return `
      <div class="populacao-area">
        <div class="talhoes-rolagem">
          <table class="tabela tabela--compacta tabela-talhoes tabela-variedade tabela-populacao">
            <thead><tr>
              ${marcar ? `<th class="tabela__marcar"><input type="checkbox" data-acao="marcar-todos" aria-label="Marcar todos"
                   ${todos ? 'checked' : ''} ${linhasTabela.length ? '' : 'disabled'}></th>` : ''}
              ${COLUNAS_PLANTIO.map((c) => titulo(c.id)).join('')}
            </tr></thead>
            <tbody>
              ${linhas || `<tr><td class="tabela__vazia" colspan="${COLUNAS_PLANTIO.length + (marcar ? 1 : 0)}">Nenhum talhão com esses filtros.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      ${marcar ? barraPlantio(op) : ''}`;
  }

  // Barra de ação, sempre visível: sem talhão marcado, a orientação e o "Planejar" desabilitado;
  // com talhão marcado, quantos e área · Excluir plantio · Limpar · Planejar (o mesmo nome em todos os grupos)
  function barraPlantio(op) {
    const n = ui.marcados.size;
    if (!n) {
      return `
      <div class="barra-acao barra-acao--vazia" role="region" aria-label="Planejar plantio">
        <p class="barra-acao__selecao">${Icones.info} Selecione vários talhões para planejar em lote</p>
        <button class="botao botao--primario barra-acao__definir" type="button" disabled>Planejar</button>
      </div>`;
    }
    // Área das linhas marcadas: a de aplicação de cada variedade (linha vazia: o talhão inteiro)
    const marcadas = linhasMarcadas(op);
    const area = marcadas.reduce((s, m) => s + (m.existe ? (m.area || 0) : areaTalhaoDe(m.talhao)), 0);
    const comPlantio = marcadas.some((m) => m.existe);
    const talhoes = new Set(marcadas.map((m) => m.talhao)).size;
    return `
      <div class="barra-acao" role="region" aria-label="Linhas selecionadas">
        <p class="barra-acao__selecao"><strong>${n} ${n === 1 ? 'linha selecionada' : 'linhas selecionadas'}</strong> · ${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'} · ${Util.area(Math.round(area * 10) / 10)}</p>
        ${comPlantio ? `
          <button class="botao botao--perigo-leve barra-definir__excluir" type="button" data-acao="excluir-plantio">${Icones.lixeira} Excluir plantio</button>` : ''}
        <button class="botao botao--secundario barra-definir__limpar" type="button" data-acao="limpar-selecao"
                title="Desmarcar todos os talhões" aria-label="Limpar seleção: desmarcar todos os talhões">Limpar</button>
        <button class="botao botao--primario barra-acao__definir" type="button" data-acao="definir-plantio">Planejar</button>
      </div>`;
  }

  // ----- Painel do talhão (lateral) -----
  // Abre clicando em qualquer lugar da linha do talhão (menos na caixa de marcar, no "+" e nos campos).
  // Resumido (uma variedade): topo com Expandir, "T01 · 120 ha" e ✕; o gráfico do histórico; os campos
  // Variedade · Germinação (%) · Data de plantio · Pop. mil/ha; "+ Adicionar variedade" (que abre o expandido);
  // Cancelar e Salvar; embaixo, as setas ‹ Talhão 1 de 12 › (como no expandido). Talhão com mais de uma variedade abre (e fica) no expandido.
  // Expandido: o painel ocupa a área da tabela, com o Histórico à esquerda e as Variedades à direita.
  // Histórico de produtividade e chuva (abre expandido; a seta minimiza). Variedades planejadas: "84 ha planejados de
  // 120 ha totais", barra com o %; Germinação (%) do talhão (um valor para todas as variedades); uma linha por variedade
  // (variedade, ciclo, área, plantio e população), editável nas células; "+ Adicionar variedade"; Cancelar e Salvar;
  // embaixo, as setas ‹ Talhão 3 de 12 › (talhão anterior e próximo).
  // A edição fica num rascunho até Salvar (Salvar não fecha o painel; só o ✕ fecha, e pergunta se houver alterações).
  function edicaoPainel(op, talhao) {
    const ed = ui.painelEdicao;
    if (ed && ed.talhao === talhao && ed.alterado) return ed;
    // Sem alteração pendente: o rascunho acompanha o plano (ex.: mudanças feitas na tabela)
    // Cada variedade com a sua germinação (a dela, a do talhão, a geral do plano ou a padrão, 95%)
    const linhas = linhasDe(op, talhao).map((l) => ({ ...l, germinacao: Planos.germinacaoLinha(op, talhao, l) }));
    ui.painelEdicao = { talhao, linhas: linhas.length || somenteLeitura ? linhas : [linhaEmBranco(op, talhao)], erros: {}, datas: {}, alterado: false };
    return ui.painelEdicao;
  }

  const linhaEmBranco = (op, talhao) => ({ variedade: '', data: '', populacao: null, area: null, germinacao: Planos.germinacaoLinha(op, talhao, null) });
  // Linha do rascunho sem nada preenchido (não entra ao salvar)
  const linhaVazia = (l) => !l.variedade && !l.data && !l.populacao && !l.areaDigitada;

  function painelTalhao(op, talhao) {
    const t = talhoesFazenda.find((x) => x.nome === talhao);
    const total = t ? t.area : 0;
    const h = historicoTalhao(talhao);
    const ed = edicaoPainel(op, talhao);
    const linhas = ed.linhas;
    const planejada = linhas.reduce((soma, l, vi) => soma + (Planos.areaLinhaPlantio(linhas, vi, total) || 0), 0);
    const disponivel = Math.round((total - planejada) * 100) / 100;
    const pct = total ? Math.min(100, planejada / total * 100) : 0;
    const aberto = !ui.historicoMinimizado;
    // Setas (embaixo): talhão anterior e próximo, na ordem da tabela
    const lista = talhoesVisiveisPlantio(op);
    const i = lista.findIndex((x) => x.nome === talhao);
    const anterior = i > 0 ? lista[i - 1] : null;
    const proximo = i >= 0 && i < lista.length - 1 ? lista[i + 1] : null;
    const posicao = i >= 0 ? `Talhão ${i + 1} de ${lista.length}` : '';
    const seta = (alvo, acao, icone, rotulo) => `
      <button class="botao-icone painel-talhao__seta" type="button" data-acao="${acao}" ${alvo ? '' : 'disabled'}
              title="${alvo ? `${rotulo}: ${esc(alvo.nome)}` : rotulo}" aria-label="${rotulo}${alvo ? `: ${esc(alvo.nome)}` : ''}">${icone}</button>`;
    const dica = (texto) => `<span class="pt-dica" tabindex="0" title="${esc(texto)}" aria-label="${esc(texto)}">${Icones.info}</span>`;
    const titulo = (rotulo) => `<span role="columnheader" class="pt-var__titulo">${rotulo}</span>`;
    // Expandido: a tabela de variedades ganha Dt Plantio e Dt Colheita (previsão: plantio + ciclo da variedade)
    const largo = !!ui.painelExpandido;
    if (!largo) return painelResumido(op, t, ed, h, { anterior, proximo, seta, total, posicao });
    return `
      <aside class="cartao painel-talhao painel-talhao--expandido" aria-label="Talhão ${esc(talhao)}">
        <div class="painel-talhao__topo">
          <button class="botao-icone painel-talhao__tamanho" type="button" data-acao="expandir-painel" aria-pressed="true"
                  title="Reduzir o painel" aria-label="Reduzir o painel">${Icones.reduzir}</button>
          <h3 class="painel-talhao__titulo">${esc(talhao)} · ${Util.area(total)}</h3>
          <button class="botao-icone" type="button" data-acao="fechar-painel" aria-label="Fechar o painel" title="Fechar">${Icones.fechar}</button>
        </div>
        <div class="painel-talhao__rolagem">
          <section class="pt-secao pt-secao--historico" aria-label="Histórico de produtividade e chuva">
            <h4 class="pt-secao__titulo">Histórico de produtividade e chuva</h4>
            ${h.length ? graficoHistorico(h) : `<p class="painel-talhao__sem-historico">Sem histórico de ${esc(plano.cultura.toLowerCase())} neste talhão.</p>`}
          </section>
          <section class="pt-secao pt-secao--variedades" aria-label="Variedades planejadas">
            <div class="pt-variedades__cab">
              <h4 class="pt-secao__titulo">Variedades planejadas</h4>
              <span class="pt-variedades__total">${numeroTexto(planejada)} de ${numeroTexto(total)} ha</span>
            </div>
            <div class="pt-barra ${disponivel < -0.001 ? 'pt-barra--passou' : ''}" aria-hidden="true"><span style="width: ${pct.toFixed(1)}%"></span></div>
            <p class="pt-variedades__disp ${disponivel < -0.001 ? 'pt-variedades__disp--erro' : ''}">${disponivel < -0.001
              ? `Passa ${numeroTexto(-disponivel)} ha da área do talhão` : `${numeroTexto(Math.max(0, disponivel))} ha disponíveis para planejamento`}</p>
            <div class="pt-var" role="table" aria-label="Variedades planejadas">
              <div class="pt-var__cab" role="row">${titulo('Variedade')}${titulo('Área (%)')}${titulo('Data de plantio')}<span role="columnheader" class="pt-var__titulo" title="População de plantas (mil plantas/ha)">Pop. mil/ha</span>
                ${titulo('Germinação (%)')}
                <span role="columnheader"><span class="so-leitor">Ações</span></span></div>
              ${linhas.length ? linhas.map((l, vi) => linhaVariedadePainel(op, t, ed, l, vi, false)).join('')
                : '<p class="pt-var__vazio">Nenhuma variedade planejada neste talhão.</p>'}
            </div>
            ${somenteLeitura ? '' : `
              <button class="botao pt-var__adicionar" type="button" data-acao="pt-adicionar-variedade">${Icones.mais} Adicionar variedade</button>
              <div class="painel-talhao__botoes">
                ${estadoPainel(ed, talhao)}
                <button class="botao botao--texto" type="button" data-acao="pt-cancelar" ${ed.alterado ? '' : 'disabled'}
                        title="Descartar as alterações e voltar ao que está salvo">Cancelar</button>
                <button class="botao botao--primario pt-salvar" type="button" data-acao="pt-salvar" ${ed.alterado ? '' : 'disabled'}>Salvar</button>
              </div>`}
          </section>
        </div>
        <nav class="painel-talhao__navegar" aria-label="Navegar entre talhões">
          ${seta(anterior, 'painel-anterior', Icones.voltar, 'Talhão anterior')}
          <span>${posicao}</span>
          ${seta(proximo, 'painel-proximo', Icones.seta, 'Próximo talhão')}
        </nav>
      </aside>`;
  }

  // Painel resumido (uma variedade): o gráfico do histórico e os campos da variedade, dois a dois.
  // Sem área: a variedade ocupa o talhão inteiro. "+ Adicionar variedade" leva ao expandido (tabela com a área).
  function painelResumido(op, t, ed, h, { anterior, proximo, seta, total, posicao }) {
    const talhao = t.nome;
    const l = ed.linhas[0] || linhaEmBranco(op, talhao);
    const v = l.variedade ? variedadeDoCadastro(l.variedade) : null;
    const erro = ed.erros[0];
    const textoData = ed.datas[0];
    const germ = l.germinacao;
    const fora = foraDaJanela(v, l.data);
    const exemploPop = exemploPopulacao(v);
    // Área (%) do talhão: com uma variedade, 100% (o talhão inteiro) ou a parte informada
    const areaLinha = Planos.areaLinhaPlantio(ed.linhas.length ? ed.linhas : [l], 0, t.area);
    const pctTalhao = areaLinha && t.area ? Math.round(areaLinha / t.area * 1000) / 10 : 100;
    const leitura = (valor) => `<p class="pt-form__valor">${valor}</p>`;
    return `
      <aside class="cartao painel-talhao painel-talhao--resumido" aria-label="Talhão ${esc(talhao)}">
        <div class="painel-talhao__topo">
          <button class="botao-icone painel-talhao__tamanho" type="button" data-acao="expandir-painel" aria-pressed="false"
                  title="Expandir o painel" aria-label="Expandir o painel">${Icones.ampliar}</button>
          <h3 class="painel-talhao__titulo">${esc(talhao)} · ${Util.area(total)}</h3>
          <button class="botao-icone" type="button" data-acao="fechar-painel" aria-label="Fechar o painel" title="Fechar">${Icones.fechar}</button>
        </div>
        <div class="painel-talhao__rolagem">
          ${h.length ? graficoHistorico(h) : `<p class="painel-talhao__sem-historico">Sem histórico de ${esc(plano.cultura.toLowerCase())} neste talhão.</p>`}
          <div class="pt-form">
            <div class="campo pt-form__campo">
              <label class="campo__rotulo" for="pt-variedade-0">Variedade</label>
              ${somenteLeitura ? leitura(v ? `${esc(v.nome)}${v.ciclo ? ` <small>· ${v.ciclo} dias</small>` : ''}` : '—')
                : campoVariedade('pt', { id: 'pt-variedade-0', talhao, vi: 0, nome: l.variedade, rotulo: 'Variedade' })}
            </div>
            <div class="campo pt-form__campo">
              <label class="campo__rotulo" for="pt-area-0">Área (%)</label>
              ${somenteLeitura ? leitura(numeroTexto(pctTalhao)) : `
                <input class="campo__controle" id="pt-area-0" data-campo="pt-area" data-var="0" type="text" inputmode="decimal"
                       autocomplete="off" placeholder="100" value="${numeroTexto(pctTalhao)}" aria-label="Área (% do talhão)">`}
            </div>
            <div class="campo pt-form__campo">
              <label class="campo__rotulo" for="pt-data-0">Data de plantio</label>
              ${somenteLeitura ? leitura(l.data ? dataCompleta(l.data) : '—') : `
                <div class="campo-data">
                  <input class="campo__controle ${textoData ? 'campo__controle--erro' : ''}" id="pt-data-0" data-campo="pt-data" data-var="0" type="text"
                         inputmode="numeric" placeholder="dd/mm/aaaa" maxlength="10" autocomplete="off" value="${esc(textoData ?? (l.data ? dataCompleta(l.data) : ''))}">
                  <button class="botao-icone campo-data__botao" type="button" data-acao="abrir-calendario" aria-label="Escolher a data no calendário" title="Escolher no calendário">${Icones.calendario}</button>
                  <input class="campo-data__nativo" type="date" data-campo="pt-data-cal" data-var="0" value="${l.data || ''}" tabindex="-1" aria-hidden="true">
                </div>`}
              ${fora ? `<p class="campo__ajuda texto-alerta">${Icones.alerta} Fora da janela recomendada (${esc(janelaTexto(v))})</p>` : ''}
            </div>
            <div class="campo pt-form__campo">
              <label class="campo__rotulo" for="pt-populacao-0" title="População de plantas (mil plantas/ha)">Pop. mil/ha</label>
              ${somenteLeitura ? leitura(l.populacao ? numeroTexto(l.populacao) : '—') : `
                <input class="campo__controle" id="pt-populacao-0" data-campo="pt-populacao" data-var="0" type="text" inputmode="decimal"
                       autocomplete="off" placeholder="Ex.: ${exemploPop}" value="${l.populacao ? numeroTexto(l.populacao) : ''}">`}
            </div>
            <div class="campo pt-form__campo">
              <label class="campo__rotulo" for="pt-germinacao-0">Germinação (%)</label>
              ${somenteLeitura ? leitura(germ ? numeroTexto(germ) : '—') : `
                <input class="campo__controle ${erro && erro.startsWith('Germinação') ? 'campo__controle--erro' : ''}" id="pt-germinacao-0" data-campo="pt-germinacao" data-var="0" type="text"
                       inputmode="decimal" autocomplete="off" placeholder="Ex.: ${Planos.GERMINACAO_PADRAO}" value="${germ ? numeroTexto(germ) : ''}">`}
            </div>
          </div>
          ${!somenteLeitura && v && !v.ciclo ? `
            <div class="pt-var__extra pt-form__ciclo">
              <label class="campo__rotulo" for="pt-ciclo-0">Ciclo de ${esc(v.nome)} (dias)</label>
              <input class="campo__controle pt-var__ciclo" id="pt-ciclo-0" data-campo="pt-ciclo" data-var="0" type="text" inputmode="numeric" placeholder="Ex.: 115" autocomplete="off">
              <span class="campo__ajuda">Vale para todos os talhões com ela.</span>
            </div>` : ''}
          ${erro ? `<p class="erro-campo">${erro}</p>` : ''}
          ${somenteLeitura ? '' : `
            <button class="botao pt-var__adicionar" type="button" data-acao="pt-adicionar-variedade">${Icones.mais} Adicionar variedade</button>
            <div class="painel-talhao__botoes">
              ${estadoPainel(ed, talhao)}
              <button class="botao botao--secundario" type="button" data-acao="pt-cancelar" ${ed.alterado ? '' : 'disabled'}
                      title="Descartar as alterações e voltar ao que está salvo">Cancelar</button>
              <button class="botao botao--primario" type="button" data-acao="pt-salvar" ${ed.alterado ? '' : 'disabled'}>Salvar</button>
            </div>`}
          <nav class="painel-talhao__navegar" aria-label="Navegar entre talhões">
            ${seta(anterior, 'painel-anterior', Icones.voltar, 'Talhão anterior')}
            <span>${posicao}</span>
            ${seta(proximo, 'painel-proximo', Icones.seta, 'Próximo talhão')}
          </nav>
        </div>
      </aside>`;
  }

  // Linha de uma variedade na tabela do painel, editável direto nas células: Variedade (lista suspensa, com o ciclo
  // embaixo), Área (ha), Plantio (dd/mm/aaaa), Pop. mil/ha e a lixeira; expandido (largo), também a Dt Colheita
  // (previsão, calculada). Variedade sem ciclo: campo "Ciclo de … (dias)" embaixo da linha. A germinação é uma só para
  // o talhão (campo acima da tabela). Erro da linha (ao salvar): embaixo dela.
  function linhaVariedadePainel(op, t, ed, l, vi, largo) {
    const v = l.variedade ? variedadeDoCadastro(l.variedade) : null;
    const area = Planos.areaLinhaPlantio(ed.linhas, vi, t ? t.area : 0);
    const erro = ed.erros[vi];
    const textoData = ed.datas[vi];
    const ciclo = v ? `<small>${v.ciclo ? `Ciclo de ${v.ciclo} dias` : 'Ciclo não informado'}</small>` : '';
    // Área em % do talhão (guardada em ha)
    const pct = area !== null && area !== undefined && t && t.area ? Math.round(area / t.area * 1000) / 10 : null;
    const prev = previsaoColheita(l);
    const colheita = !largo ? '' : `<span role="cell"><span class="pt-var__calc" title="Calculada: data de plantio + ciclo da variedade">${prev ? dataCompleta(prev) : semCiclo(l) ? '<span class="texto-alerta">Informe o ciclo</span>' : '—'}</span></span>`;
    if (somenteLeitura) {
      return `
        <div class="pt-var__linha" role="row">
          <span class="pt-var__nome" role="cell"><strong>${esc(l.variedade || '—')}</strong>${ciclo}</span>
          <span role="cell">${pct !== null ? numeroTexto(pct) : '—'}</span>
          <span role="cell">${l.data ? dataCompleta(l.data) : '—'}</span>
          ${colheita}
          <span role="cell">${l.populacao ? numeroTexto(l.populacao) : '—'}</span>
          <span role="cell">${l.germinacao ? numeroTexto(l.germinacao) : '—'}</span><span></span>
        </div>`;
    }
    const opcoes = variedadesDaCultura().slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      .map((x) => `<option value="${esc(x.nome)}" ${x.nome === l.variedade ? 'selected' : ''}>${esc(x.nome)}${x.preCadastro ? ' (pré-cadastro)' : ''}</option>`).join('');
    const numero = (campo, valor, exemplo, rotulo) => `<input class="celula celula--numero" id="${campo}-${vi}" data-campo="${campo}" data-var="${vi}"
             type="text" inputmode="decimal" autocomplete="off" placeholder="${exemplo}" value="${valor}" aria-label="${rotulo} da variedade ${vi + 1}">`;
    const faltaArea = ed.linhas.length > 1 && (area === null || area === undefined);
    const fora = foraDaJanela(v, l.data);
    return `
      <div class="pt-var__linha pt-var__linha--edicao ${erro ? 'pt-var__linha--erro' : ''}" role="row">
        <span class="pt-var__nome" role="cell">
          <select class="celula pt-var__sel" id="pt-variedade-${vi}" data-campo="pt-variedade-sel" data-var="${vi}" aria-label="Variedade ${vi + 1}">
            <option value="" ${l.variedade ? '' : 'selected'}>Selecione</option>${opcoes}
          </select>
          ${ciclo}
        </span>
        <span role="cell">${numero('pt-area', pct !== null ? numeroTexto(pct) : '', faltaArea ? 'Informe' : '—', 'Área (% do talhão)')}</span>
        <span role="cell" class="pt-var__data">
          <span class="pt-var__campo-data">
            <input class="celula ${textoData ? 'celula--erro' : ''}" id="pt-data-${vi}" data-campo="pt-data" data-var="${vi}" type="text" inputmode="numeric"
                   maxlength="10" autocomplete="off" placeholder="dd/mm/aaaa" value="${esc(textoData ?? (l.data ? dataCompleta(l.data) : ''))}" aria-label="Data de plantio da variedade ${vi + 1}">
            <button class="botao-icone pt-var__calendario" type="button" data-acao="abrir-calendario" aria-label="Escolher a data de plantio da variedade ${vi + 1} no calendário" title="Escolher no calendário">${Icones.calendario}</button>
            <input class="campo-data__nativo" type="date" data-campo="pt-data-cal" data-var="${vi}" value="${l.data || ''}" tabindex="-1" aria-hidden="true">
          </span>
          ${fora ? `<span class="aviso-janela" title="Fora da janela recomendada (${esc(janelaTexto(v))})">${Icones.alerta}</span>` : ''}
        </span>
        ${colheita}
        <span role="cell">${numero('pt-populacao', l.populacao ? numeroTexto(l.populacao) : '', `Ex.: ${exemploPopulacao(v)}`, 'População de plantas (mil/ha)')}</span>
        <span role="cell">${numero('pt-germinacao', l.germinacao ? numeroTexto(l.germinacao) : '', `Ex.: ${Planos.GERMINACAO_PADRAO}`, 'Germinação (%)')}</span>
        <button class="botao-icone botao-icone--p" type="button" data-acao="pt-remover-variedade" data-var="${vi}"
                title="Tirar ${esc(l.variedade || 'esta linha')}" aria-label="Tirar ${esc(l.variedade || 'a linha')} ${vi + 1}">${Icones.lixeira}</button>
      </div>
      ${v && !v.ciclo ? `
        <div class="pt-var__extra">
          <label class="campo__rotulo" for="pt-ciclo-${vi}">Ciclo de ${esc(v.nome)} (dias)</label>
          <input class="campo__controle pt-var__ciclo" id="pt-ciclo-${vi}" data-campo="pt-ciclo" data-var="${vi}" type="text" inputmode="numeric" placeholder="Ex.: 115" autocomplete="off">
          <span class="campo__ajuda">Vale para todos os talhões com ela.</span>
        </div>` : ''}
      ${erro ? `<p class="erro-campo pt-var__erro">${erro}</p>` : ''}`;
  }

  // Grava o rascunho do painel no plano. Cada variedade precisa ter variedade; com mais de uma, cada uma com a área
  // dela e a soma sem passar da área do talhão. Salvar não fecha o painel.
  function salvarPainel(op) {
    const ed = ui.painelEdicao;
    if (!ed) return;
    const t = ed.talhao;
    // Linha em branco (nada preenchido) não entra; sobrando uma sem área digitada, ela ocupa o talhão inteiro
    ed.linhas = ed.linhas.filter((l) => !linhaVazia(l));
    if (ed.linhas.length === 1 && !ed.linhas[0].areaDigitada) ed.linhas[0].area = null;
    ed.datas = {};
    const total = areaTalhaoDe(t);
    ed.erros = {};
    ed.linhas.forEach((l, vi) => {
      if (!l.variedade) ed.erros[vi] = 'Escolha a variedade.';
      else if (ed.datas[vi]) ed.erros[vi] = 'Data inválida. Use dd/mm/aaaa.';
      else if (ed.linhas.length > 1 && !(Number(l.area) > 0)) ed.erros[vi] = 'Informe a área desta variedade (%).';
      else if (l.germinacao !== null && l.germinacao !== undefined && !(l.germinacao > 0 && l.germinacao <= 100)) ed.erros[vi] = 'Germinação: informe de 1 a 100.';
    });
    const soma = ed.linhas.reduce((x, l, vi) => x + (Planos.areaLinhaPlantio(ed.linhas, vi, total) || 0), 0);
    if (!Object.keys(ed.erros).length && soma > total + 0.001) ed.erros[ed.linhas.length - 1] = `A soma das variedades passa de 100% da área do ${t}.`;
    if (Object.keys(ed.erros).length) { desenharTudo(); return; }
    const linhas = ed.linhas.map((l) => ({ variedade: l.variedade, data: l.data || '', populacao: l.populacao || null,
      area: ed.linhas.length === 1 && (l.area === null || Number(l.area) === total) ? null : Number(l.area), germinacao: l.germinacao || Planos.germinacaoLinha(op, t, null),
      ...(l.areaDigitada ? { areaDigitada: true } : {}) }));
    if (linhas.length) op.plantio[t] = linhas; else delete op.plantio[t];
    ui.painelEdicao = null; // refeito a partir do plano (sem variedade, de novo uma linha em branco)
    alterou(); marcarSalvoPainel(); desenharMantendoFoco('[data-acao="pt-salvar"], [data-acao="pt-adicionar-variedade"]');
  }

  // Painel do talhão com alteração não salva: qualquer saída pergunta antes de descartar ("Continuar editando" ou
  // "Descartar"): trocar de talhão ou fechar o painel (nos próprios botões) e, pelos ouvintes abaixo, trocar de guia
  // de grupo, de operação, de aba do plano, de visão (Tabela/Mapa), marcar talhões, editar uma célula da tabela,
  // o "Voltar para Planos de Safra" e o menu lateral. Filtrar, ordenar e recolher a lista não saem do painel.
  const NAO_SAI_DO_PAINEL = new Set(['filtro-talhoes', 'ordenar-semente', 'alternar-lista']);
  function saidaDoPainel(alvo) {
    if (!ui || !ui.painelEdicao || !ui.painelEdicao.alterado || !raiz || !raiz.isConnected || !alvo || !alvo.closest) return null;
    if (alvo.closest('.painel-talhao, .modal-fundo, .definir-fundo, .menu-contexto, [role="dialog"]')) return null;
    const el = raiz.contains(alvo) ? alvo.closest('a[href], button, input, select, textarea, [data-acao], [tabindex]') : alvo.closest('a[href]');
    return el && !NAO_SAI_DO_PAINEL.has(el.dataset.acao) ? el : null;
  }
  const campoDeTexto = (el) => el.matches('input:not([type="checkbox"]):not([type="radio"]), select, textarea');
  // Respondido "Descartar", a ação segue: o campo recebe o foco; o resto, o clique
  const seguirSaida = (el) => () => { if (!el.isConnected) return; if (campoDeTexto(el)) el.focus(); else el.click(); };
  // Ligados uma vez só (o painel é redesenhado a cada mudança); valem só com o plano na tela e o painel pendente
  document.addEventListener('mousedown', (e) => {
    const el = e.button === 0 && saidaDoPainel(e.target);
    if (el && campoDeTexto(el)) e.preventDefault(); // o campo não pega o foco antes da resposta
  }, true);
  document.addEventListener('click', (e) => {
    const el = saidaDoPainel(e.target);
    if (!el) return;
    e.preventDefault(); e.stopPropagation();
    confirmarDescartePainel(seguirSaida(el));
  }, true);
  document.addEventListener('focusin', (e) => {
    const el = saidaDoPainel(e.target);
    if (!el || !campoDeTexto(el)) return;
    el.blur();
    confirmarDescartePainel(seguirSaida(el));
  }, true);

  function confirmarDescartePainel(seguir) {
    const ed = ui.painelEdicao;
    if (!ed || !ed.alterado) { seguir(); return; }
    Modal.confirmar({
      titulo: `Descartar as alterações do ${esc(ed.talhao)}?`,
      texto: 'As mudanças nas variedades deste talhão ainda não foram salvas.',
      botoes: [{ rotulo: 'Continuar editando' }, { rotulo: 'Descartar', classe: 'perigo', acao: () => { ui.painelEdicao = null; atualizarEstadoSalvo(); seguir(); } }]
    });
  }

  // Rascunho do painel: muda um campo de uma variedade (sem gravar no plano)
  function mudarRascunho(vi, mudanca) {
    const ed = ui.painelEdicao;
    if (!ed || !ed.linhas[vi]) return;
    Object.assign(ed.linhas[vi], mudanca);
    ed.alterado = true;
    delete ed.erros[vi];
    atualizarEstadoSalvo();
  }

  // Produtividade (linha, sc/ha) e chuva acumulada no ciclo (barras, mm) por safra.
  // O gráfico ocupa a altura livre do painel: as posições são em % da área (os textos não esticam).
  // Cada medida na sua faixa, sem se cruzar: a linha em cima (80 sc/ha a 14%, 40 sc/ha a 46%) e as barras
  // embaixo (até metade da altura), com o valor da chuva dentro da barra. Abaixo, variedade e safra.
  function graficoHistorico(h) {
    const n = h.length;
    const maxChuva = Math.max(1000, ...h.map((x) => x[3]));
    const x = (i) => ((i + 0.5) / n) * 100;
    const ySc = (sc) => 46 - (Math.min(80, Math.max(40, sc)) - 40) * 0.8;
    const descricao = h.map(([safra, variedade, sc, mm]) => `safra ${safra}, ${variedade}: ${sc} sc/ha e ${mm} mm`).join('; ');
    const segmentos = h.slice(1).map(([, , sc], i) =>
      `<line x1="${x(i)}%" y1="${ySc(h[i][2])}%" x2="${x(i + 1)}%" y2="${ySc(sc)}%" stroke="#13603f" stroke-width="2.5" class="grafico-historico__seg"></line>`).join('');
    return `
      <figure class="grafico-historico">
        <figcaption class="grafico-historico__titulo">Produtividade e chuva acumulada por safra</figcaption>
        <div class="grafico-historico__legenda" aria-hidden="true">
          <span><span class="grafico-historico__linha"></span>Produtividade (sc/ha)</span>
          <span><span class="grafico-historico__barra"></span>Chuva no ciclo (mm)</span>
        </div>
        <svg class="grafico-historico__area" role="img" aria-label="Produtividade e chuva por safra: ${esc(descricao)}">
          ${h.map(([safra, , , mm], i) => {
            const altura = (mm / maxChuva) * 50;
            return `
              <rect x="${x(i) - 7.5}%" y="${100 - altura}%" width="15%" height="${altura}%" rx="3" fill="#b9d7f0"><title>Safra ${safra}: ${mm} mm</title></rect>
              <text x="${x(i)}%" y="${100 - altura}%" dy="15" font-size="11" font-weight="600" fill="#1f4f86" text-anchor="middle">${mm} mm</text>`;
          }).join('')}
          ${segmentos}
          ${h.map(([safra, , sc], i) => `
            <circle cx="${x(i)}%" cy="${ySc(sc)}%" r="5" fill="#13603f" stroke="#fff" stroke-width="2" class="grafico-historico__ponto"><title>Safra ${safra}: ${sc} sc/ha</title></circle>
            <text x="${x(i)}%" y="${ySc(sc)}%" dy="-9" font-size="12" font-weight="700" fill="#13603f" text-anchor="middle" class="grafico-historico__valor">${sc} sc/ha</text>`).join('')}
        </svg>
        <div class="grafico-historico__eixo" style="grid-template-columns: repeat(${n}, minmax(0, 1fr))" aria-hidden="true">
          ${h.map(([safra, variedade]) => `<span><strong>${esc(variedade)}</strong>Safra ${safra}</span>`).join('')}
        </div>
      </figure>`;
  }

  // ----- Visão Colheita: hectares por decêndio da previsão de colheita -----
  function visaoColheita(op) {
    const comPrevisao = [];
    const semPrevisao = [];
    // Uma entrada por variedade (área de aplicação dela); talhão sem plantio: a área inteira, sem previsão
    talhoesFazenda.forEach((t) => {
      const linhas = Planos.linhasPlantio(op, t.nome);
      if (!linhas.length) { semPrevisao.push({ t, p: {}, area: t.area }); return; }
      linhas.forEach((p, vi) => {
        const area = Planos.areaLinhaPlantio(linhas, vi, t.area) || 0;
        const prev = previsaoColheita(p);
        if (prev) comPrevisao.push({ t, p, area, dec: decendio(prev) });
        else semPrevisao.push({ t, p, area });
      });
    });
    const soma = (lista) => lista.reduce((s, x) => s + x.area, 0);
    // Só os decêndios com pelo menos uma variedade planejada, em ordem de data
    const grupos = [];
    comPrevisao.sort((a, b) => a.dec.chave.localeCompare(b.dec.chave)).forEach((x) => {
      const g = grupos.find((y) => y.chave === x.dec.chave);
      if (g) g.itens.push(x); else grupos.push({ chave: x.dec.chave, dec: x.dec, itens: [x] });
    });
    const semData = semPrevisao.filter((x) => !semCiclo(x.p));
    const comSemCiclo = semPrevisao.filter((x) => semCiclo(x.p));
    const linhaSem = semPrevisao.length ? `
      <tr class="colheita__sem">
        <th scope="row">Sem previsão de colheita</th>
        <td class="tabela__numero">${Util.area(soma(semPrevisao)).replace(' ha', '')}</td>
        <td>${[comSemCiclo.length ? `${[...new Set(comSemCiclo.map((x) => x.t.nome))].map(esc).join(', ')} (ciclo não informado)` : '',
               semData.length ? `${[...new Set(semData.map((x) => x.t.nome))].map(esc).join(', ')} (sem variedade ou data de plantio)` : ''].filter(Boolean).join(' · ')}</td>
        <td>${[...new Set(comSemCiclo.map((x) => x.p.variedade))].map(esc).join(', ') || '—'}</td>
      </tr>` : '';
    return `
      ${grupos.length ? graficoColheita(grupos) : `
        <p class="colheita__vazia">${Icones.info} Nenhum talhão com previsão de colheita ainda. Escolha a variedade e a data de plantio na visão Tabela.</p>`}
      <div class="talhoes-rolagem">
        <table class="tabela tabela--compacta tabela-colheita">
          <thead><tr><th>Decêndio de colheita</th><th class="tabela__numero">Área (ha)</th><th>Talhões</th><th>Variedades</th></tr></thead>
          <tbody>
            ${grupos.map((g) => `
              <tr>
                <th scope="row">${esc(g.dec.longo)}</th>
                <td class="tabela__numero">${Util.area(soma(g.itens)).replace(' ha', '')}</td>
                <td>${[...new Set(g.itens.map((x) => x.t.nome))].map(esc).join(', ')}</td>
                <td>${[...new Set(g.itens.map((x) => x.p.variedade))].map(esc).join(', ')}</td>
              </tr>`).join('')}
            ${linhaSem}
          </tbody>
        </table>
      </div>`;
  }

  // Barras de uma cor só; eixo Y em hectares; valor em cima de cada barra; detalhe ao passar o mouse
  function graficoColheita(grupos) {
    const area = (g) => Math.round(g.itens.reduce((s, x) => s + x.area, 0));
    const maximo = Math.max(...grupos.map(area));
    const passo = maximo <= 400 ? 100 : maximo <= 1000 ? 200 : 500;
    const topo = Math.max(passo, Math.ceil(maximo / passo) * passo);
    const L = 900; const x0 = 52; const base = 196; const alturaUtil = 160;
    const y = (ha) => base - ha / topo * alturaUtil;
    const fatia = (L - x0) / grupos.length;
    const largura = Math.min(90, fatia * 0.5);
    const ticks = [];
    for (let v = 0; v <= topo; v += passo) ticks.push(v);
    const descricao = grupos.map((g) => `${g.dec.curto}: ${area(g)} ha`).join(', ');
    return `
      <figure class="colheita__grafico">
        <figcaption class="colheita__titulo">Previsão de colheita por decêndio</figcaption>
        <svg viewBox="0 0 ${L} 222" role="img" aria-label="Previsão de colheita por decêndio: ${esc(descricao)}">
          <text x="0" y="14" font-size="11" fill="#5f6b64" class="colheita__eixo-y">Hectares</text>
          ${ticks.map((v) => `
            <line x1="${x0}" y1="${y(v)}" x2="${L}" y2="${y(v)}" stroke="${v ? '#eef1ef' : '#cfd6d2'}"></line>
            <text x="${x0 - 8}" y="${y(v) + 4}" font-size="11" fill="#5f6b64" text-anchor="end" class="colheita__eixo-y">${v}</text>`).join('')}
          ${grupos.map((g, i) => {
            const centro = x0 + fatia * i + fatia / 2;
            const ha = area(g);
            const n = new Set(g.itens.map((x) => x.t.nome)).size;
            return `
              <rect x="${centro - largura / 2}" y="${y(ha)}" width="${largura}" height="${base - y(ha)}" rx="4" fill="#2f7d57">
                <title>${esc(g.dec.longo)}: ${n} ${n === 1 ? 'talhão' : 'talhões'} · ${ha} ha</title></rect>
              <text x="${centro}" y="${y(ha) - 7}" font-size="13" font-weight="600" fill="#1a1f1c" text-anchor="middle" class="colheita__valor">${ha} ha</text>
              <text x="${centro}" y="${base + 18}" font-size="12" fill="#1a1f1c" text-anchor="middle" class="colheita__eixo-x">${esc(g.dec.curto)}</text>`;
          }).join('')}
        </svg>
      </figure>`;
  }

  // ----- Visão Mapa: talhões coloridos pela variedade sobre imagem de satélite (Esri, sem chave) -----
  // O mapa abre centrado no centróide dos talhões unidos. Clicar num talhão da fazenda abre o painel dele.
  const SATELITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  // Cores das variedades: paleta categórica validada (ordem fixa; a cor segue a variedade, não a posição)
  const CORES_VARIEDADE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
  const COR_NAO_PLANEJADO = '#d9dedb';
  const M_POR_GRAU = 111320;
  const geometriaCache = {};
  let mapa = null; // instância do Leaflet (recriada a cada desenho da tela)
  let mexeuNoMapa = false; // a pessoa arrastou ou deu zoom

  function corVariedade(nome) {
    const i = variedadesDaCultura().findIndex((v) => v.nome === nome);
    return i >= 0 && i < CORES_VARIEDADE.length ? CORES_VARIEDADE[i] : '#6b7c8f';
  }

  // Polígonos dos talhões da fazenda, gerados a partir das áreas (DADOS.geometriaFazendas):
  // talhões em linhas, com carreadores entre eles, girados e levemente inclinados (a área não muda).
  function poligonosFazenda(fazenda) {
    if (geometriaCache[fazenda]) return geometriaCache[fazenda];
    const g = (DADOS.geometriaFazendas || {})[fazenda];
    const talhoes = DADOS.talhoes[fazenda] || [];
    if (!g) return (geometriaCache[fazenda] = []);
    const [lat0, lng0] = g.origem;
    const mPorGrauLng = M_POR_GRAU * Math.cos((lat0 * Math.PI) / 180);
    const giro = (g.giro * Math.PI) / 180;
    const D = g.profundidade; const carreador = 25;
    const latLng = (x, y) => {
      const xr = x * Math.cos(giro) - y * Math.sin(giro);
      const yr = x * Math.sin(giro) + y * Math.cos(giro);
      return [lat0 + yr / M_POR_GRAU, lng0 + xr / mPorGrauLng];
    };
    const lista = [];
    g.linhas.forEach((linha, i) => {
      let x = 0;
      const y = -i * (D + carreador);
      const desvio = (g.inclinacao || 0) * D;
      linha.forEach((nome) => {
        const t = talhoes.find((tt) => tt.nome === nome);
        if (!t) return;
        const largura = (t.area * 10000) / D;
        lista.push({
          talhao: nome, area: t.area,
          coords: [[x, y], [x + largura, y], [x + largura + desvio, y - D], [x + desvio, y - D]].map(([a, b]) => latLng(a, b)),
          centro: latLng(x + largura / 2 + desvio / 2, y - D / 2)
        });
        x += largura + carreador;
      });
    });
    return (geometriaCache[fazenda] = lista);
  }

  // O plano de safra é por fazenda: o mapa mostra os talhões da fazenda do plano
  function fazendasDoMapa(op) {
    return [{ fazenda: plano.fazenda, plantio: op.plantio, propria: true }];
  }

  // Legenda do mapa: variedades da fazenda com a área total de cada uma (maior primeiro) e os não planejados
  function legendaMapa(op) {
    // Área de cada variedade: a soma das áreas de aplicação; talhão com várias variedades aparece com hachura
    const totais = {};
    let naoPlanejado = 0;
    let multiplas = 0;
    talhoesFazenda.forEach((t) => {
      const linhas = Planos.linhasPlantio(op, t.nome).filter((l) => l.variedade);
      if (!linhas.length) { naoPlanejado += t.area; return; }
      if (linhas.length > 1) multiplas += t.area;
      const todas = Planos.linhasPlantio(op, t.nome);
      todas.forEach((l, vi) => { if (l.variedade) totais[l.variedade] = (totais[l.variedade] || 0) + (Planos.areaLinhaPlantio(todas, vi, t.area) || 0); });
    });
    const itens = Object.entries(totais).sort((a, b) => b[1] - a[1]).map(([v, ha]) => `
      <li><span class="mapa-legenda__cor" style="background: ${corVariedade(v)}"></span>${esc(v)} <strong>${Util.area(Math.round(ha))}</strong></li>`).join('')
      + (multiplas ? `<li><span class="mapa-legenda__cor mapa-legenda__cor--multiplas"></span>Múltiplas variedades <strong>${Util.area(multiplas)}</strong></li>` : '')
      + (naoPlanejado ? `<li><span class="mapa-legenda__cor" style="background: ${COR_NAO_PLANEJADO}"></span>Não planejado <strong>${Util.area(naoPlanejado)}</strong></li>` : '');
    return `<ul class="mapa-legenda" aria-label="Legenda: variedades e área total">${itens}</ul>`;
  }

  // Mapa ocupando o espaço livre do cartão
  function visaoMapa() {
    const semGeometria = !poligonosFazenda(plano.fazenda).length;
    return `
      <div class="mapa-area">
        ${semGeometria ? `<p class="mapa__sem">${Icones.info} A Fazenda ${esc(plano.fazenda)} ainda não tem o desenho dos talhões.</p>`
          : `<div id="mapa-variedades" class="mapa" role="region" aria-label="Mapa de variedades por talhão"></div>
             <p class="mapa__dica">${Icones.info} Selecione um talhão para definir a variedade.</p>`}
      </div>`;
  }

  // Hachura dos talhões com várias variedades: listras diagonais em dois tons do verde UniSystem, definidas uma vez
  // no desenho do mapa (SVG do Leaflet)
  function garantirHachura(m, poligono) {
    const svg = poligono._path && poligono._path.ownerSVGElement;
    if (!svg || svg.querySelector('#hachura-variedades')) return;
    const ns = 'http://www.w3.org/2000/svg';
    const defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(ns, 'defs'), svg.firstChild);
    defs.innerHTML += `<pattern id="hachura-variedades" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="10" height="10" fill="#9fd3b4"></rect><rect width="5" height="10" fill="#1f7a4d"></rect></pattern>`;
  }

  // Antes de redesenhar: guarda o enquadramento e desmonta o mapa (o HTML da tela é refeito)
  function desmontarMapa() {
    if (!mapa) return;
    ui.mapaVista = { plano: plano.id, centro: mapa.getCenter(), zoom: mapa.getZoom(), mexeu: mexeuNoMapa };
    mapa.remove();
    mapa = null;
  }

  // Depois de redesenhar: monta o mapa, se a visão Mapa estiver na tela
  function montarMapa() {
    const el = raiz.querySelector('#mapa-variedades');
    if (!el) return;
    if (!window.L) {
      el.innerHTML = `<p class="mapa__sem">${Icones.info} Mapa indisponível: sem conexão com a internet.</p>`;
      return;
    }
    const op = opAtual();
    mapa = L.map(el, { zoomControl: true });
    L.tileLayer(SATELITE, { maxZoom: 18, attribution: 'Imagens © Esri, Maxar, Earthstar Geographics' }).addTo(mapa);
    L.control.scale({ position: 'bottomright', imperial: false }).addTo(mapa); // escala em metros ("500 m")
    const pontos = [];
    const hachuras = [];
    let soma = 0; let sLat = 0; let sLng = 0;
    fazendasDoMapa(op).forEach(({ fazenda, plantio, propria }) => {
      // No plano aberto, só os talhões incluídos nele
      poligonosFazenda(fazenda).filter((pg) => !propria || talhoesFazenda.some((t) => t.nome === pg.talhao)).forEach((pg) => {
        const linhas = Planos.linhasPlantio({ plantio }, pg.talhao);
        const comVariedade = linhas.filter((l) => l.variedade);
        const v = comVariedade.length ? comVariedade[0].variedade : '';
        const varias = comVariedade.length > 1;
        const aberto = propria && ui.painelTalhao === pg.talhao;
        const poligono = L.polygon(pg.coords, {
          color: aberto ? '#ffd400' : '#ffffff', weight: aberto ? 4 : 1.5,
          fillColor: v ? corVariedade(v) : COR_NAO_PLANEJADO, fillOpacity: v ? 0.75 : 0.45
        }).addTo(mapa);
        // Várias variedades no talhão: hachura em tons de verde (sem dividir o talhão no mapa)
        // (aplicada depois de enquadrar o mapa, quando o desenho do polígono já existe)
        if (varias) hachuras.push(poligono);
        // Ao passar o mouse: talhão, variedades com a área de cada uma e área (a cor nunca é a única pista)
        const textoVar = varias
          ? linhas.map((l, vi) => (l.variedade ? `${esc(l.variedade)} ${Util.area(Planos.areaLinhaPlantio(linhas, vi, pg.area) || 0)}` : '')).filter(Boolean).join(' + ')
          : esc(v || 'Não planejado');
        poligono.bindTooltip(`<strong>${esc(propria ? pg.talhao : `${fazenda} · ${pg.talhao}`)}</strong> · ${textoVar} · ${Util.area(pg.area)}`,
          { sticky: true, direction: 'top', className: 'mapa-detalhe' });
        // Nome fixo no meio do talhão, pequeno
        L.marker(pg.centro, { interactive: false, keyboard: false,
          icon: L.divIcon({ className: 'mapa-rotulo', html: esc(pg.talhao), iconSize: null }) }).addTo(mapa);
        if (propria) poligono.on('click', () => abrirPainel(pg.talhao));
        pontos.push(...pg.coords);
        soma += pg.area; sLat += pg.centro[0] * pg.area; sLng += pg.centro[1] * pg.area;
      });
    });
    if (!soma) return;
    // Centro no centróide dos talhões unidos (média pela área), com o zoom que mostra todos
    const centro = [sLat / soma, sLng / soma];
    const v = ui.mapaVista;
    if (v && v.plano === plano.id && v.mexeu) mapa.setView(v.centro, v.zoom);
    else mapa.setView(centro, Math.min(16, mapa.getBoundsZoom(L.latLngBounds(pontos), false, L.point(30, 30))));
    // Hachura pelo style do desenho (o Leaflet repinta o atributo fill, não o style)
    hachuras.forEach((pg) => {
      if (!pg._path) return;
      garantirHachura(mapa, pg);
      pg._path.style.fill = 'url(#hachura-variedades)'; pg._path.style.fillOpacity = '0.9';
    });
    // A partir daqui, arrastar ou dar zoom conta como "a pessoa mexeu" (o enquadramento é mantido ao redesenhar)
    mexeuNoMapa = !!(v && v.plano === plano.id && v.mexeu);
    mapa.on('dragstart zoomstart', () => { mexeuNoMapa = true; });
  }

  // ----- Ações do painel do talhão -----
  // Talhão a talhão (painel) e em lote (talhões marcados + Definir plantio) não ficam abertos juntos:
  // abrir o painel desmarca a seleção (com aviso); marcar um talhão fecha o painel.
  function abrirPainel(talhao) {
    const desmarcados = ui.marcados.size;
    if (desmarcados) ui.marcados = new Set();
    ui.painelTalhao = talhao; ui.prePainel = null; ui.erroPrePainel = null; ui.dataPainel = null;
    ui.erroGerminacao = null; ui.painelEdicao = null;
    ui.painelExpandido = Planos.linhasPlantio(opAtual(), talhao).length > 1;
    desenharMantendoFoco('.painel-talhao__titulo');
    mostrarLinhaAberta();
    if (desmarcados) Aviso.mostrar(`Seleção desfeita: abrindo o histórico do ${esc(talhao)}`);
  }

  function fecharPainelPorSelecao() {
    if (!ui.painelTalhao) return;
    ui.painelTalhao = null; ui.prePainel = null; ui.erroPrePainel = null; ui.dataPainel = null;
    ui.erroGerminacao = null;
  }

  // A linha do talhão aberto no painel fica à vista na tabela (rola só o necessário)
  function mostrarLinhaAberta() {
    const linha = raiz.querySelector('.tabela-variedade tr.linha--aberta');
    const rolagem = raiz.querySelector('.tabela-variedade')?.closest('.talhoes-rolagem');
    if (!linha || !rolagem || !rolagem.getBoundingClientRect) return;
    const cabecalho = rolagem.querySelector('thead')?.getBoundingClientRect().height || 0;
    const r = rolagem.getBoundingClientRect();
    const l = linha.getBoundingClientRect();
    if (l.top < r.top + cabecalho) rolagem.scrollTop -= r.top + cabecalho - l.top;
    else if (l.bottom > r.bottom) rolagem.scrollTop += l.bottom - r.bottom;
  }

  function passarPainel(op, sentido) {
    const lista = talhoesVisiveisPlantio(op);
    const i = lista.findIndex((t) => t.nome === ui.painelTalhao);
    const alvo = lista[i + sentido];
    if (!alvo) return;
    ui.painelTalhao = alvo.nome; ui.prePainel = null; ui.erroPrePainel = null; ui.dataPainel = null;
    ui.erroGerminacao = null; ui.painelEdicao = null;
    if (Planos.linhasPlantio(op, alvo.nome).length > 1) ui.painelExpandido = true;
    desenharMantendoFoco(`[data-acao="${sentido < 0 ? 'painel-anterior' : 'painel-proximo'}"]:not([disabled]), [data-acao="fechar-painel"]`);
    mostrarLinhaAberta();
  }

  function fecharPainel() {
    const t = ui.painelTalhao;
    ui.painelTalhao = null; ui.prePainel = null; ui.erroPrePainel = null; ui.dataPainel = null; ui.painelEdicao = null;
    desenharMantendoFoco(`[data-acao="marcar"][data-talhao="${t}"]`);
  }

  // Painel do talhão: a edição fica no rascunho até Salvar. Ao lado dos botões, "Alterações não salvas" (âmbar)
  // enquanto houver mudança e, depois de Salvar, "✓ Salvo" (verde) por 2,5 s.
  function estadoPainel(ed, talhao) {
    const conteudo = ed.alterado ? `<span class="pt-estado__pendente">${Icones.alerta} Alterações não salvas</span>`
      : ui.painelSalvo === talhao ? `<span class="pt-estado__salvo">${Icones.certo} Salvo</span>` : '';
    return `<span class="pt-estado">${conteudo}</span>`;
  }

  let timerSalvoPainel = null;
  function marcarSalvoPainel() {
    ui.painelSalvo = ui.painelTalhao;
    Aviso.anunciar('Salvo');
    clearTimeout(timerSalvoPainel);
    timerSalvoPainel = setTimeout(() => {
      ui.painelSalvo = null;
      const aviso = raiz && raiz.querySelector('.pt-estado__salvo');
      if (!aviso) return;
      aviso.classList.add('pt-estado__salvo--sumindo');
      setTimeout(() => aviso.remove(), 300);
    }, 2500);
  }

  // Muda variedade, área, data ou população de uma variedade do talhão do painel (vale na hora)
  function alterarPlantioPainel(op, campo, valor, vi = 0) {
    const t = ui.painelTalhao;
    if (campo === 'area') {
      const erro = erroArea(op, t, vi, valor);
      if (erro) { Aviso.mostrar(erro); desenharMantendoFoco(`#pt-area-${vi}`); return; }
    }
    mudarLinha(op, t, vi, { [campo]: valor });
    alterou(); marcarSalvoPainel();
    // Escolhida a variedade, o cursor vai para a data de plantio
    desenharMantendoFoco(campo === 'populacao' ? `#pt-populacao-${vi}` : campo === 'area' ? `#pt-area-${vi}` : `#pt-data-${vi}`);
  }

  // Ciclo da variedade informado no painel: vai para o cadastro (pré-cadastro do ciclo) e vale para todos os talhões
  function salvarCiclo(valor, vi = 0) {
    const op = opAtual();
    // A variedade da linha do rascunho do painel (pode ainda não estar salva)
    const l = (ui.painelEdicao && ui.painelEdicao.linhas[vi]) || (op && Planos.linhasPlantio(op, ui.painelTalhao)[vi]);
    const v = l ? variedadeDoCadastro(l.variedade) : null;
    const n = Util.numero(valor);
    if (!v || !n || n <= 0) return;
    v.ciclo = Math.round(n);
    alterou(); marcarSalvoPainel(); desenharMantendoFoco(`#pt-data-${vi}`);
    Aviso.mostrar(`Ciclo de ${esc(v.nome)}: ${v.ciclo} dias`);
  }

  // ----- Área das variedades do talhão: sempre fecha o total (100% ou a área do talhão) -----
  // Mesma regra no modal Definir plantio (em %), no painel do talhão e na tabela do Plantio (em ha):
  // - incluir uma variedade: todas em partes iguais (120 ha → 60 + 60; 3 → 33,3% cada);
  // - mudar a área de uma: as outras se ajustam na proporção de cada uma (60 + 40, a 1ª vai a 80 → 80 + 20);
  // - tirar uma: as que ficam se ajustam na proporção (60 + 30 + 10, sai a de 10 → 66,7 + 33,3).
  // A última parte ajustada fica com o resto do arredondamento (casas: 1 para %, 2 para ha).
  function partesIguais(n, total, casas) {
    const f = 10 ** casas;
    const parte = Math.floor(total / n * f) / f;
    return Array.from({ length: n }, (x, i) => (i === n - 1 ? Math.round((total - parte * (n - 1)) * f) / f : parte));
  }
  // fixo: índice da parte que acabou de ser digitada (limitada ao total); -1: nenhuma (ao tirar uma variedade)
  function partesProporcionais(valores, total, casas, fixo = -1) {
    const f = 10 ** casas;
    const vs = valores.map((v) => Math.max(0, Number(v) || 0));
    if (fixo >= 0) vs[fixo] = Math.min(total, vs[fixo]);
    const outros = vs.map((v, i) => i).filter((i) => i !== fixo);
    if (!outros.length) return vs;
    const resto = Math.max(0, total - (fixo >= 0 ? vs[fixo] : 0));
    const soma = outros.reduce((s, i) => s + vs[i], 0);
    const novos = outros.map((i) => Math.round((soma > 0 ? vs[i] / soma : 1 / outros.length) * resto * f) / f);
    novos[novos.length - 1] = Math.round((resto - novos.slice(0, -1).reduce((s, v) => s + v, 0)) * f) / f;
    outros.forEach((i, k) => { vs[i] = novos[k]; });
    return vs;
  }
  // Variedades que ficaram sem área depois do ajuste (outra foi a 100%): aviso na hora, para ajustar ou excluir
  function avisarSemArea(nomes) {
    if (!nomes.length) return;
    const lista = nomes.map((n) => esc(n || 'Variedade sem nome')).join(', ');
    Aviso.mostrar(`${lista} ${nomes.length === 1 ? 'ficou' : 'ficaram'} com 0% da área. Ajuste a área ou exclua ${nomes.length === 1 ? 'a variedade' : 'as variedades'}.`);
  }
  // Nas variedades do talhão (área em ha): uma só fica com o talhão inteiro (area null)
  function aplicarAreas(linhas, areas) {
    linhas.forEach((l, i) => {
      l.area = linhas.length === 1 ? null : areas[i];
      if (linhas.length > 1) l.areaDigitada = true; else delete l.areaDigitada;
    });
  }
  const areasDe = (linhas, total) => linhas.map((l, i) => Planos.areaLinhaPlantio(linhas, i, total) || 0);
  const areasIguais = (linhas, total) => aplicarAreas(linhas, partesIguais(linhas.length, total, 2));
  const areasAoTirar = (linhas, total) => aplicarAreas(linhas, partesProporcionais(areasDe(linhas, total), total, 2));
  const areasAoMudar = (linhas, vi, area, total) => {
    const areas = areasDe(linhas, total); areas[vi] = area;
    aplicarAreas(linhas, partesProporcionais(areas, total, 2, vi));
  };

  // Inserir variedade no talhão (botão direito na linha): linha nova logo abaixo, com a área pela regra acima.
  // Na tabela, só redesenha (nenhum campo fica aberto); a pessoa clica na célula que quiser preencher.
  function adicionarVariedade(op, talhao, onde, depois = null) {
    const ls = linhasDe(op, talhao);
    // Talhão sem plantio: a linha vazia que já aparece na tabela vira a primeira, e a nova entra abaixo dela
    // (um Inserir já mostra duas linhas, com a área dividida)
    if (!ls.length) ls.push({ ...novaLinhaPlantio(op, talhao, ls), novo: true });
    const vi = depois === null ? ls.length : Math.min(ls.length, depois + 1);
    ls.splice(vi, 0, { ...novaLinhaPlantio(op, talhao, ls), novo: true });
    areasIguais(ls, areaTalhaoDe(talhao));
    op.plantio[talhao] = ls;
    alterou();
    desenharTudo();
  }

  // Limpar conteúdo da linha: variedade, data e população em branco (a área fica); com Desfazer
  function limparLinhaPlantio(op, talhao, vi) {
    const antes = Planos.linhasPlantio(op, talhao).map((l) => ({ ...l }));
    if (!antes[vi]) return;
    const ls = antes.map((l) => ({ ...l }));
    ls[vi] = { ...ls[vi], variedade: '', data: '', populacao: null, novo: true };
    op.plantio[talhao] = ls;
    alterou(); desenharTudo();
    Aviso.mostrar(`Linha do ${esc(talhao)} limpa`, { acao: 'Desfazer', aoAgir: () => { op.plantio[talhao] = antes; alterou(); desenharTudo(); } });
  }

  // Tirar uma variedade do talhão (com Desfazer)
  function removerVariedade(op, talhao, vi, onde) {
    const antes = Planos.linhasPlantio(op, talhao).map((l) => ({ ...l }));
    const tirada = antes[vi];
    if (!tirada) return;
    const ls = antes.filter((x, i) => i !== vi).map((l) => ({ ...l }));
    if (ls.length) areasAoTirar(ls, areaTalhaoDe(talhao));
    if (ls.length) op.plantio[talhao] = ls; else delete op.plantio[talhao];
    alterou();
    if (onde === 'pt') marcarSalvoPainel();
    desenharTudo();
    Aviso.mostrar(`${esc(tirada.variedade || 'Variedade')} saiu do ${esc(talhao)}`, { acao: 'Desfazer', aoAgir: () => {
      op.plantio[talhao] = antes; alterou(); desenharTudo();
    } });
  }

  // Pré-cadastro de variedade (nome; cultura do plano), no painel ou no modal
  function preCadastrarVariedade(nome) {
    const limpo = (nome || '').trim();
    if (!limpo) return { erro: 'Informe o nome da variedade.' };
    if (variedadesDaCultura().some((x) => Util.normalizar(x.nome) === Util.normalizar(limpo))) {
      return { erro: 'Essa variedade já está no cadastro. Escolha na lista.' };
    }
    DADOS.variedades.push({ cultura: plano.cultura, nome: limpo, gm: null, ciclo: null, populacao: null, janela: null, preCadastro: true });
    Aviso.mostrar(`Pré-cadastro da variedade "${esc(limpo)}" salvo`);
    return { nome: limpo };
  }

  function salvarPrePainel() {
    const r = preCadastrarVariedade(ui.prePainel);
    if (r.erro) { ui.erroPrePainel = r.erro; desenharMantendoFoco('[data-campo="pt-pre"]'); return; }
    ui.prePainel = null; ui.erroPrePainel = null;
    alterarPlantioPainel(opAtual(), 'variedade', r.nome);
  }

  // ----- Modal "Definir plantio" (edição em massa): a composição dos talhões marcados -----
  // Lista de variedades com a participação de cada uma em % da área de cada talhão, a data de plantio e a população;
  // e a germinação (%), uma para todas. Ao aplicar, substitui as variedades dos talhões marcados (confirma se algum já
  // tinha plantio). A soma das % vai até 100.
  function abrirPlantio(op) {
    const marcados = new Set(linhasMarcadas(op).map((m) => m.talhao));
    const talhoes = talhoesFazenda.filter((t) => marcados.has(t.nome)).map((t) => t.nome);
    if (!talhoes.length) return;
    // Talhões marcados com a mesma composição (mesmas variedades e % iguais): o modal já vem com ela
    const composicao = (t) => {
      const ls = Planos.linhasPlantio(op, t);
      return ls.map((l, i) => ({ variedade: l.variedade || '', pct: Math.round((Planos.areaLinhaPlantio(ls, i, areaTalhaoDe(t)) || 0) / areaTalhaoDe(t) * 1000) / 10,
        data: l.data || '', populacao: l.populacao ? numeroTexto(l.populacao) : '', germinacao: numeroTexto(Planos.germinacaoLinha(op, t, l)) }));
    };
    const primeira = composicao(talhoes[0]);
    const igual = primeira.length && talhoes.every((t) => JSON.stringify(composicao(t)) === JSON.stringify(primeira));
    ui.plantando = { talhoes, linhas: igual ? primeira.map((l) => ({ ...l, pct: numeroTexto(l.pct) }))
      : [{ ...linhaPlantioModal(op), pct: '100' }],
      datasTexto: {}, erros: {} };
    desenharMantendoFoco('.definir');
  }

  function fecharPlantio() {
    ui.plantando = null;
    desenharMantendoFoco('[data-acao="definir-plantio"]');
  }

  const somaPct = (pl) => pl.linhas.reduce((s, l) => s + (Util.numero(l.pct) || 0), 0);
  // % digitada numa variedade do modal: as outras se ajustam na proporção (sempre 100%). Devolve se mudou algo.
  function ajustarPctModal(vi) {
    const pl = ui.plantando;
    if (!pl || pl.linhas.length < 2 || !(pl.linhas[vi].pct || '').trim()) return false;
    partesProporcionais(pl.linhas.map((l) => Util.numero(l.pct) || 0), 100, 1, vi).forEach((p, i) => { pl.linhas[i].pct = numeroTexto(p); });
    delete pl.erros.composicao;
    // Sem área: a linha fica em vermelho, com a mensagem, e o aviso aparece na hora
    const zeradas = pl.linhas.map((l, i) => i).filter((i) => !(Util.numero(pl.linhas[i].pct) > 0));
    pl.linhas.forEach((l, i) => { delete pl.erros[`pct${i}`]; });
    zeradas.forEach((i) => { pl.erros[`pct${i}`] = `Variedade ${i + 1}: ficou com 0% da área. Ajuste a % ou exclua a variedade.`; });
    avisarSemArea(zeradas.map((i) => pl.linhas[i].variedade));
    return true;
  }
  // Variedade nova no modal: em branco, com a germinação já em 95% (a geral do plano ou a padrão)
  const linhaPlantioModal = (op) => ({ variedade: '', pct: '', data: '', populacao: '', germinacao: numeroTexto(Planos.germinacaoLinha(op, null, null)) });

  function modalPlantio(op) {
    const pl = ui.plantando;
    const n = pl.talhoes.length;
    const area = talhoesFazenda.filter((t) => pl.talhoes.includes(t.nome)).reduce((s, t) => s + t.area, 0);
    const erro = (campo) => (pl.erros[campo] ? `<p class="erro-campo">${pl.erros[campo]}</p>` : '');
    const classeErro = (campo) => (pl.erros[campo] ? 'campo__controle--erro' : '');
    const soma = somaPct(pl);
    const linhas = pl.linhas.map((l, vi) => {
      const v = variedadeDoCadastro(l.variedade);
      return `
        <div class="composicao__linha" data-var="${vi}">
          <div class="campo composicao__variedade">
            ${campoVariedade('pl', { id: `pl-variedade-${vi}`, vi, nome: l.variedade, classe: `campo__controle ${classeErro(`variedade${vi}`)}`, rotulo: `Variedade ${vi + 1}` })}
            ${v && v.ciclo ? `<small class="composicao__ciclo">Ciclo de ${v.ciclo} dias</small>` : ''}
          </div>
          <div class="campo composicao__pct">
            <input class="campo__controle ${classeErro(`pct${vi}`)}" data-campo="pl-pct" data-var="${vi}" type="text" inputmode="decimal"
                   autocomplete="off" placeholder="%" value="${esc(l.pct || '')}" aria-label="Participação da variedade ${vi + 1} (% da área de cada talhão)">
          </div>
          <div class="campo composicao__data">
            ${campoData(`pl-data-${vi}`, 'pl-data', l.data, pl.datasTexto[vi] ?? null, pl.erros[`data${vi}`] || '')
              .replace('data-campo="pl-data"', `data-campo="pl-data" data-var="${vi}"`).replace('data-campo="pl-data-cal"', `data-campo="pl-data-cal" data-var="${vi}"`)}
          </div>
          <div class="campo composicao__pop">
            <input class="campo__controle ${classeErro(`populacao${vi}`)}" data-campo="pl-populacao" data-var="${vi}" type="text" inputmode="decimal"
                   autocomplete="off" placeholder="Ex.: ${exemploPopulacao(v)}" value="${esc(l.populacao || '')}" aria-label="População da variedade ${vi + 1}">
          </div>
          <div class="campo composicao__germ">
            <input class="campo__controle ${classeErro(`germinacao${vi}`)}" data-campo="pl-germinacao" data-var="${vi}" type="text" inputmode="decimal"
                   autocomplete="off" placeholder="Ex.: ${Planos.GERMINACAO_PADRAO}" value="${esc(l.germinacao || '')}" aria-label="Germinação da variedade ${vi + 1} (%)">
          </div>
          ${pl.linhas.length > 1 ? `<button class="botao-icone composicao__remover" type="button" data-acao="pl-remover" data-var="${vi}"
                   title="Tirar esta variedade" aria-label="Tirar a variedade ${vi + 1}">${Icones.lixeira}</button>` : '<span class="composicao__remover"></span>'}
        </div>
        ${erro(`variedade${vi}`)}${erro(`pct${vi}`)}${erro(`populacao${vi}`)}${erro(`germinacao${vi}`)}`;
    }).join('');
    return `
      <div class="definir-fundo">
        <div class="definir definir--composicao" role="dialog" aria-modal="true" aria-labelledby="plantio-titulo" tabindex="-1">
          <div class="definir__topo">
            <div class="definir__titulos">
              <h2 class="definir__titulo" id="plantio-titulo">Planejar plantio</h2>
              <p class="definir__op">${esc(op.nome)} · DAP ${op.dap ?? '—'} · Cultura ${esc(plano.cultura)}</p>
              <p class="definir__alvo">${alvoDefinir(pl.talhoes, area)}</p>
            </div>
            <button class="botao-icone" type="button" data-acao="pl-fechar" aria-label="Fechar">${Icones.fechar}</button>
          </div>
          <div class="definir__corpo">
            <p class="campo__ajuda plantio__orientacao">Informe as variedades e a participação de cada uma na área de cada talhão marcado. Ao aplicar, substitui as variedades desses talhões.</p>
            <div class="composicao">
              <div class="composicao__linha composicao__cab" aria-hidden="true">
                <span>Variedade</span><span>Área (%)</span><span>Data de plantio</span><span title="População de plantas (mil plantas/ha)">Pop. mil/ha</span><span>Germinação (%)</span><span></span>
              </div>
              ${linhas}
            </div>
            <div class="composicao__rodape">
              <button class="link-acao composicao__adicionar" type="button" data-acao="pl-adicionar">${Icones.mais} Adicionar variedade</button>
              <span class="composicao__soma ${soma > 100.001 ? 'composicao__soma--erro' : ''}" data-pl-soma>Total: <strong>${numeroTexto(soma)}%</strong> da área</span>
            </div>
            ${erro('composicao')}
          </div>
          <div class="definir__rodape">
            <button class="botao botao--secundario" type="button" data-acao="pl-fechar">Cancelar</button>
            <button class="botao botao--primario" type="button" data-acao="pl-aplicar">Salvar</button>
          </div>
        </div>
      </div>`;
  }

  // Total das % acompanha o que se digita (sem redesenhar o modal)
  function atualizarRodapePlantio() {
    const pl = ui.plantando;
    const soma = somaPct(pl);
    const el = raiz.querySelector('[data-pl-soma]');
    if (!el) return;
    el.innerHTML = `Total: <strong>${numeroTexto(soma)}%</strong> da área`;
    el.classList.toggle('composicao__soma--erro', soma > 100.001);
  }

  // Valida e substitui as variedades dos talhões marcados (confirma quando algum já tinha plantio)
  function aplicarPlantio(op) {
    const pl = ui.plantando;
    pl.erros = {};
    pl.linhas.forEach((l, vi) => {
      if (!l.variedade) pl.erros[`variedade${vi}`] = `Variedade ${vi + 1}: escolha a variedade.`;
      const pct = Util.numero(l.pct);
      if (!(pct > 0)) pl.erros[`pct${vi}`] = `Variedade ${vi + 1}: informe a participação em % (maior que zero).`;
      if (pl.datasTexto[vi]) pl.erros[`data${vi}`] = 'Data inválida. Use dd/mm/aaaa.';
      if ((l.populacao || '').trim() && !(Util.numero(l.populacao) > 0)) pl.erros[`populacao${vi}`] = `Variedade ${vi + 1}: população maior que zero.`;
      const g = Util.numero(l.germinacao || '');
      if ((l.germinacao || '').trim() && !(g > 0 && g <= 100)) pl.erros[`germinacao${vi}`] = `Variedade ${vi + 1}: germinação de 1 a 100.`;
    });
    const nomes = pl.linhas.map((l) => l.variedade).filter(Boolean);
    if (new Set(nomes).size !== nomes.length) pl.erros.composicao = 'A mesma variedade aparece duas vezes.';
    if (somaPct(pl) > 100.001) pl.erros.composicao = 'A soma das participações passa de 100%.';
    if (Object.keys(pl.erros).length) { desenharTudo(); return; }
    const aplicar = () => {
      pl.talhoes.forEach((t) => {
        const area = areaTalhaoDe(t);
        op.plantio[t] = pl.linhas.map((l) => ({ variedade: l.variedade, data: l.data || '', populacao: Util.numero(l.populacao || '') || null,
          area: Math.round(area * Util.numero(l.pct) / 100 * 100) / 100, germinacao: Util.numero(l.germinacao || '') || Planos.germinacaoLinha(op, t, null),
          ...(pl.linhas.length > 1 ? { areaDigitada: true } : {}) }));
      });
      const n = pl.talhoes.length;
      const composicao = pl.linhas.map((l) => `${esc(l.variedade)} ${numeroTexto(Util.numero(l.pct))}%`).join(' + ');
      ui.plantando = null;
      ui.filtroTalhoes = 'todos';
      limparSelecao(); alterou(); desenharTudo();
      const rolagem = raiz.querySelector('.talhoes-rolagem');
      if (rolagem) rolagem.scrollTop = 0;
      Aviso.mostrar(`${composicao} em ${n} ${n === 1 ? 'talhão' : 'talhões'}`);
    };
    const comPlantio = pl.talhoes.filter((t) => temPlantio(op, t));
    if (!comPlantio.length) { aplicar(); return; }
    Modal.confirmar({
      titulo: `Substituir o plantio de ${comPlantio.length} ${comPlantio.length === 1 ? 'talhão' : 'talhões'}?`,
      texto: `${comPlantio.length <= 4 ? comPlantio.map(esc).join(', ') : `${comPlantio.length} talhões`} já ${comPlantio.length === 1 ? 'tem' : 'têm'} variedades planejadas. Elas serão trocadas pela composição deste modal.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Substituir plantio', classe: 'primario', acao: aplicar }]
    });
  }

  function temPlantio(op, talhao) {
    return Planos.linhasPlantio(op, talhao).length > 0;
  }

  // Excluir plantio: só as linhas (variedades) marcadas; o talhão que fica sem nenhuma, fica sem plantio
  function excluirPlantio(op) {
    const marcadas = linhasMarcadas(op).filter((m) => m.existe);
    const n = marcadas.length;
    if (!n) return;
    const porTalhao = {};
    marcadas.forEach((m) => { (porTalhao[m.talhao] = porTalhao[m.talhao] || []).push(m.vi); });
    Modal.confirmar({
      titulo: `Excluir ${n === 1 ? 'o plantio da linha marcada' : `o plantio de ${n} linhas`}?`,
      texto: `Variedade, área de aplicação, data de plantio e população ${n === 1 ? 'dessa linha serão apagadas' : 'dessas linhas serão apagadas'}. Essa ação não pode ser desfeita.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir plantio', classe: 'perigo', acao: () => {
        Object.entries(porTalhao).forEach(([t, vis]) => {
          const ficam = Planos.linhasPlantio(op, t).filter((l, vi) => !vis.includes(vi)).map((l) => ({ ...l }));
          if (ficam.length === 1) ficam[0].area = null; // sobrou uma: ela volta a ocupar o talhão inteiro
          if (ficam.length) op.plantio[t] = ficam; else { delete op.plantio[t]; if (op.germinacoes) delete op.germinacoes[t]; }
        });
        // Talhão sem nenhuma variedade sai também do TSI (grupo Tratamento de semente); TSI sem talhão deixa de existir
        const alvo = Object.keys(porTalhao).filter((t) => !temPlantio(op, t));
        // Sem variedade, o talhão sai também do TSI (grupo Tratamento de semente); TSI sem talhão deixa de existir
        plano.grupos.filter(ehGrupoTsi).forEach((g) => g.operacoes.forEach((o) => {
          alvo.forEach((t) => { delete o.talhoes[t]; });
          o.receitas = o.receitas.filter((r) => Planos.talhoesDaReceita(o, r).length);
        }));
        ui.filtroTalhoes = 'todos';
        limparSelecao(); alterou(); desenharTudo();
        Aviso.mostrar(`Plantio excluído de ${n} ${n === 1 ? 'linha' : 'linhas'}`);
      } }]
    });
  }

  // ----- População de plantas e sementes -----
  // Total de sementes = população planejada × área ÷ germinação; embalagens = sementes ÷ sementes da embalagem da cultura
  // (DADOS.embalagemSemente: soja em bag de 5 milhões de sementes; milho em saco de 20 kg, 60 mil sementes; sem cadastro, bag)
  function embalagem() {
    const e = DADOS.embalagemSemente[plano && plano.cultura] || DADOS.embalagemSemente.Soja;
    return { sementes: e.sementes, descricao: e.descricao };
  }

  // ----- Edição na célula da tabela do Plantio -----
  // Grava área de aplicação, data, população ou germinação de uma variedade do talhão (vi). Devolve { erro } (inválido) ou { mostrar }
  function gravarCampoPlantio(op, t, vi, campo, texto) {
    if (campo === 'tb-data') {
      const iso = texto ? dataDeTexto(texto) : ''; // só a data completa, dd/mm/aaaa
      if (iso === null) return { erro: 'Data inválida. Use dd/mm/aaaa.' };
      mudarLinha(op, t, vi, { data: iso });
      return { mostrar: iso ? dataCompleta(iso) : '' };
    }
    if (campo === 'tb-populacao') {
      const n = Util.numero(texto);
      if (texto && !(n > 0)) return { erro: 'População: informe um número maior que zero.' };
      mudarLinha(op, t, vi, { populacao: n || null });
      return { mostrar: n ? numeroTexto(n) : '' };
    }
    // Germinação: a da variedade da linha, de 1 a 100 (talhão ainda sem variedade: guardada no talhão, para a que vier).
    // Em branco: volta à geral do plano (ou à padrão, 95%)
    if (campo === 'tb-germinacao') {
      const n = texto ? Util.numero(texto) : null;
      if (texto && !(n > 0 && n <= 100)) return { erro: 'Germinação: informe de 1 a 100.' };
      const ls = Planos.linhasPlantio(op, t);
      if (ls[vi]) mudarLinha(op, t, vi, { germinacao: n || null });
      else { op.germinacoes = op.germinacoes || {}; if (n) op.germinacoes[t] = n; else delete op.germinacoes[t]; }
      return { mostrar: numeroTexto(Planos.germinacaoLinha(op, t, Planos.linhasPlantio(op, t)[vi])) };
    }
    // Área de aplicação: com mais de uma variedade, as outras se ajustam na proporção (o talhão fecha sempre a área toda)
    if (campo === 'tb-area') {
      const n = texto ? Util.numero(texto) : null;
      const erro = texto && n === null ? 'Área de aplicação: informe um número.' : erroArea(op, t, vi, n, true);
      if (erro) return { erro };
      const ls = linhasDe(op, t);
      if (ls.length > 1 && n !== null) {
        areasAoMudar(ls, vi, n, areaTalhaoDe(t));
        op.plantio[t] = ls;
        avisarSemArea(ls.filter((l) => !(Number(l.area) > 0)).map((l) => l.variedade));
        return { mostrar: numeroTexto(ls[vi].area) };
      }
      mudarLinha(op, t, vi, { area: n, areaDigitada: true });
      return { mostrar: n ? numeroTexto(n) : '' };
    }
    return {};
  }

  // Grava o que foi digitado na célula. Inválido: volta ao valor anterior, com aviso. Depois, redesenha a tabela
  // (a área, as sementes e as outras variedades do talhão podem mudar) e devolve o foco à célula para onde a pessoa foi.
  function salvarCelulaPlantio(op, el) {
    const t = el.dataset.talhao;
    const r = gravarCampoPlantio(op, t, Number(el.dataset.var || 0), el.dataset.campo, el.value.trim());
    if (r.erro) { el.value = el.defaultValue; Aviso.mostrar(r.erro); return; }
    alterou();
    el.value = r.mostrar; el.defaultValue = r.mostrar;
    redesenharMantendoCelula();
  }

  // Redesenha depois que o foco já foi para o próximo campo (Tab ou clique) e devolve o foco a ele
  function redesenharMantendoCelula() {
    setTimeout(() => {
      const a = document.activeElement;
      const d = (a && a.dataset) || {};
      const talhao = d.talhao ? `[data-talhao="${CSS.escape(d.talhao)}"]` : '';
      const vi = d.var !== undefined ? `[data-var="${CSS.escape(d.var)}"]` : '';
      const seletor = a && a.id ? `#${CSS.escape(a.id)}`
        : d.campo && d.talhao ? `[data-campo="${d.campo}"]${talhao}${d.linha ? `[data-linha="${CSS.escape(d.linha)}"]` : ''}${vi}`
        : d.variedade && d.talhao ? `[data-variedade="${d.variedade}"]${talhao}${vi}` : null;
      if (seletor) desenharMantendoFoco(seletor); else desenharTudo();
    }, 0);
  }

  // Enter: grava e desce para o mesmo campo do próximo talhão; Esc: desiste do que foi digitado
  function teclaCelulaPlantio(e) {
    const el = e.target;
    if (e.key === 'Escape' && el.tagName === 'INPUT') { e.preventDefault(); el.value = el.defaultValue; el.blur(); return true; }
    if (e.key !== 'Enter' || el.tagName === 'SELECT') return false;
    e.preventDefault();
    const coluna = el.dataset.linha ? `[data-campo="tb-dose"][data-linha="${CSS.escape(el.dataset.linha)}"]` : `[data-campo="${el.dataset.campo}"]`;
    const campos = [...raiz.querySelectorAll(`.tabela-talhoes ${coluna}`)];
    const proximo = campos[campos.indexOf(el) + 1];
    if (proximo) { proximo.focus(); proximo.select(); } else el.blur();
    return true;
  }

  // ----- Plantio: várias variedades no talhão (Planos.linhasPlantio) -----
  // Seleção da tabela por linha (variedade): chave "talhão|índice"
  const chaveLinha = (talhao, vi) => `${talhao}|${vi}`;
  function linhasMarcadas(op) {
    return [...ui.marcados].filter((k) => k.includes('|')).map((k) => {
      const i = k.lastIndexOf('|');
      const talhao = k.slice(0, i); const vi = Number(k.slice(i + 1));
      const ls = Planos.linhasPlantio(op, talhao);
      return { talhao, vi, existe: !!ls[vi], area: ls[vi] ? Planos.areaLinhaPlantio(ls, vi, areaTalhaoDe(talhao)) : null };
    }).filter((m) => talhoesFazenda.some((t) => t.nome === m.talhao));
  }

  // Cópia das variedades do talhão (para mudar sem mexer na versão anterior)
  const linhasDe = (op, talhao) => Planos.linhasPlantio(op, talhao).map((l) => ({ ...l }));
  const areaTalhaoDe = (talhao) => (talhoesFazenda.find((t) => t.nome === talhao) || { area: 0 }).area;
  const variedadesTexto = (op, talhao) => Planos.linhasPlantio(op, talhao).map((l) => l.variedade).filter(Boolean).join(' + ');
  const temArea = (a) => a !== null && a !== undefined && a !== '';

  // Variedade nova no talhão: a área que sobra (sem sobra, em branco para informar) e a germinação geral do plano
  function novaLinhaPlantio(op, talhao, linhas) {
    const usada = linhas.reduce((s, l, i) => s + (Planos.areaLinhaPlantio(linhas, i, areaTalhaoDe(talhao)) || 0), 0);
    const sobra = Math.round((areaTalhaoDe(talhao) - usada) * 100) / 100;
    return { variedade: '', data: '', populacao: null, area: linhas.length ? (sobra > 0 ? sobra : null) : null, germinacao: op.germinacao || null };
  }

  // Muda uma variedade do talhão (vi além da última: cria). Linha sem nada (nem variedade, data, população ou área)
  // sai; sem nenhuma, o talhão fica sem plantio.
  function mudarLinha(op, talhao, vi, mudanca) {
    const ls = linhasDe(op, talhao);
    const base = ls[vi] || novaLinhaPlantio(op, talhao, ls);
    ls[vi] = { ...base, ...mudanca };
    delete ls[vi].novo;
    if (!ls[vi].populacao) ls[vi].populacao = null;
    const ficam = ls.filter((l) => l && (l.novo || l.variedade || l.data || l.populacao || (ls.length > 1 && temArea(l.area))));
    if (ficam.length) op.plantio[talhao] = ficam; else delete op.plantio[talhao];
  }

  // Área de aplicação: maior que zero e, somada às outras variedades do talhão, sem passar da área dele
  // soEla: só confere a área da própria variedade (as outras se ajustam a ela)
  function erroArea(op, talhao, vi, area, soEla = false) {
    if (area === null) return '';
    if (!(area > 0)) return 'Área de aplicação: informe um número maior que zero.';
    if (soEla && Planos.linhasPlantio(op, talhao).length > 1) {
      const total = areaTalhaoDe(talhao);
      return area > total + 0.001 ? `A área passa da área do ${talhao} (${numeroTexto(total)} ha).` : '';
    }
    const ls = Planos.linhasPlantio(op, talhao);
    const outras = ls.reduce((s, l, i) => s + (i === vi ? 0 : (Planos.areaLinhaPlantio(ls, i, areaTalhaoDe(talhao)) || 0)), 0);
    const total = areaTalhaoDe(talhao);
    if (outras + area > total + 0.001) return `A soma das variedades passa da área do ${talhao} (${numeroTexto(total)} ha). Disponível: ${numeroTexto(Math.max(0, total - outras))} ha.`;
    return '';
  }

  function numeroTexto(n) {
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  }
  const milhoes = (sementes) => `${umaCasa(sementes / 1e6)} mi`;
  const bags = (sementes) => umaCasa(sementes / embalagem().sementes);

  // Exemplo de população no campo vazio ("Ex.: 63"): o meio da faixa recomendada da variedade
  const exemploPopulacao = (v) => (v && v.populacao ? Math.round((v.populacao[0] + v.populacao[1]) / 2) : 280);
  function faixaPopulacao(v) {
    return v && v.populacao ? `${v.populacao[0]} – ${v.populacao[1]}` : null;
  }
  function foraDaFaixa(v, pop) {
    return !!(v && v.populacao && pop && (pop < v.populacao[0] || pop > v.populacao[1]));
  }

  // Só números e uma vírgula decimal; o ponto digitado vira vírgula
  function soNumero(el) {
    let v = el.value.replace(/\./g, ',').replace(/[^\d,]/g, '');
    const virgula = v.indexOf(',');
    if (virgula >= 0) v = v.slice(0, virgula + 1) + v.slice(virgula + 1).replace(/,/g, '');
    if (v !== el.value) el.value = v;
    return v;
  }

  // Recomendação nova: "Copiar produtos de" traz os produtos e doses padrão de outra recomendação
  // da mesma operação, como ponto de partida (dá para adicionar, remover e mudar a dose antes de aplicar)
  function campoCopiar(op, r) {
    const origens = op.receitas.filter((x) => x !== r && x.produtos.some(Planos.linhaPreenchida));
    if (!origens.length) return '';
    return `
      <div class="campo definir__copiar">
        <label class="campo__rotulo" for="rec-copiar">Copiar produtos de</label>
        <select class="campo__controle" id="rec-copiar" data-campo="copiar-de">
          <option value="">Escolha uma ${T().nome}</option>
          ${origens.map((x) => {
            // "Fox Xpro, Engeo Pleno S, Nimbus + 2 · T01, T02, T05 + 4": os produtos e os talhões em que ela está
            const produtos = resumoLista(x.produtos.filter(Planos.linhaPreenchida).map(Planos.nomeLinha));
            const talhoes = Planos.talhoesDaReceita(op, x);
            const texto = talhoes.length ? `${produtos} · ${resumoLista(talhoes)}` : produtos;
            return `<option value="${x.id}" ${ui.copiadoDe === x.id ? 'selected' : ''}>${esc(texto)}</option>`;
          }).join('')}
        </select>
      </div>`;
  }

  // Troca os produtos da recomendação em edição pelos da recomendação escolhida (cópia, com ids novos)
  function copiarProdutos(op, id) {
    const origem = op.receitas.find((x) => x.id === id);
    if (!origem) return;
    ui.copiadoDe = id; ui.validarOp = null; ui.preCadastro = null; ui.naoEncontrado = {};
    rascunho(op).produtos = origem.produtos.filter(Planos.linhaPreenchida).map((l) => Planos.novaLinha({
      principioAtivo: l.principioAtivo, produto: l.produto, unidade: l.unidade, dose: l.dose, preCadastro: l.preCadastro }));
    desenharMantendoFoco('#rec-copiar');
    Aviso.mostrar('Produtos copiados');
  }

  // ----- Guias de grupo (rodapé) -----
  function rodapeGrupos() {
    const atual = grupoAtual();
    return `
      <footer class="grupos">
        <!-- O leitor de tela ouve o nome pelo aria-label das guias (o rótulo visual não é lido duas vezes) -->
        <span class="grupos__rotulo" aria-hidden="true">Grupo de operações</span>
        <div class="grupos__guias" role="tablist" aria-label="Grupo de operações">
          ${gruposPlanejamento().map((g) => {
            const ativo = atual && g.id === atual.id;
            if (ui.renomeandoGrupo === g.id) {
              return `<span class="guia guia--ativa guia--editando"><input class="guia__campo" data-campo="nome-grupo"
                        value="${esc(g.nome)}" aria-label="Nome do grupo" data-foco-inicial></span>`;
            }
            return `<button class="guia ${ativo ? 'guia--ativa' : ''}" type="button" role="tab" aria-selected="${!!ativo}"
                      data-acao="abrir-grupo" data-grupo="${g.id}" ${somenteLeitura ? '' : 'draggable="true"'}
                      title="${somenteLeitura ? esc(g.nome) : `${esc(g.nome)} · duplo clique para renomear, botão direito para mais opções, arraste para reordenar`}">${esc(g.nome)}</button>`;
          }).join('')}
          ${somenteLeitura ? '' : `<button class="guia guia--mais" type="button" data-acao="novo-grupo" title="Novo grupo"
                                     aria-label="Novo grupo de operações">${Icones.mais}</button>`}
        </div>
      </footer>`;
  }

  // ================= Combobox (princípio ativo / produto) =================
  function linhaDoElemento(el) {
    const tr = el.closest('[data-linha]');
    const op = opAtual();
    return tr && op && ui.rascunho ? ui.rascunho.produtos.find((l) => l.id === tr.dataset.linha) : null;
  }

  function opcoesCombo(linha, tipo, texto) {
    const busca = Util.normalizar(texto.trim());
    const bate = (v) => !busca || Util.normalizar(v).includes(busca);
    const cadastro = cadastroAtual();
    let opcoes;
    if (tipo === 'pa') {
      // Princípios ativos do cadastro (sem repetir)
      const pas = [...new Set(cadastro.map((d) => d.principioAtivo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      opcoes = pas.filter(bate).map((pa) => ({ valor: pa, rotulo: esc(pa),
        pre: cadastro.some((d) => d.principioAtivo === pa && d.preCadastro && !d.produto) }));
    } else {
      // Produtos do cadastro. Com princípio ativo escolhido e ainda sem produto, só os que têm ele.
      // Trocando um produto já escolhido (o princípio ativo veio dele), mostra todos, com os do mesmo
      // princípio ativo primeiro; escolher outro produto atualiza o princípio ativo.
      const trocando = !!linha.produto;
      const mesmoPA = (d) => !!linha.principioAtivo && d.principioAtivo === linha.principioAtivo;
      opcoes = cadastro
        .filter((d) => d.produto && (trocando || !linha.principioAtivo || mesmoPA(d)) && bate(d.produto))
        .sort((a, b) => (trocando ? Number(mesmoPA(b)) - Number(mesmoPA(a)) : 0))
        .map((d) => ({ valor: d.produto, rotulo: `${esc(d.produto)}<span class="combo__sub">${esc(d.garantia || d.principioAtivo || '—')} · ${d.unidade}</span>`, pre: d.preCadastro }));
    }
    opcoes = opcoes.slice(0, 8);
    // "+ Pré-cadastrar" sempre como última opção quando há texto digitado (princípio ativo e produto comercial)
    if (texto.trim()) opcoes.push({ preCadastrar: true, valor: texto.trim(), rotulo: `${Icones.mais} Pré-cadastrar "${esc(texto.trim())}"` });
    return opcoes;
  }

  function abrirCombo(input) {
    const linha = linhaDoElemento(input);
    if (!linha) return;
    const lista = input.parentElement.querySelector('.combo__lista');
    const tipo = input.dataset.combo;
    const opcoes = opcoesCombo(linha, tipo, input.value === (tipo === 'pa' ? linha.principioAtivo : linha.produto) ? '' : input.value);
    lista.innerHTML = opcoes.length ? opcoes.map((o, i) => `
      <div class="combo__opcao ${o.preCadastrar ? 'combo__opcao--pre' : ''}" role="option" data-indice="${i}"
           data-valor="${esc(o.valor)}" ${o.preCadastrar ? 'data-pre-cadastrar' : ''}>
        ${o.rotulo} ${o.pre ? '<span class="etiqueta-pre">Pré-cadastro</span>' : ''}
      </div>`).join('') : '<div class="combo__nada">Digite para buscar</div>';
    lista.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function fecharCombos() {
    raiz.querySelectorAll('.combo__lista').forEach((l) => { l.hidden = true; });
    raiz.querySelectorAll('[data-combo]').forEach((i) => i.setAttribute('aria-expanded', 'false'));
  }

  function escolherNoCombo(input, opcaoEl) {
    const linha = linhaDoElemento(input);
    const tipo = input.dataset.combo;
    delete ui.naoEncontrado[`${linha.id}:pa`]; delete ui.naoEncontrado[`${linha.id}:produto`];
    const valor = opcaoEl.dataset.valor;
    if (opcaoEl.hasAttribute('data-pre-cadastrar')) {
      // Pelo princípio ativo, o texto vai para o Princípio ativo; o produto comercial continua obrigatório
      ui.preCadastro = tipo === 'pa'
        ? { linhaId: linha.id, produto: '', principioAtivo: valor, unidade: '', erros: {}, aviso: '' }
        : { linhaId: linha.id, produto: valor, principioAtivo: linha.principioAtivo || '', unidade: '', erros: {}, aviso: '' };
    } else if (tipo === 'pa') {
      linha.principioAtivo = valor;
      // Produto de outro princípio ativo deixa de valer (e, sem produto, não há unidade nem dose)
      const prod = Planos.produtoDoCadastro(linha.produto);
      if (prod && prod.principioAtivo !== valor) {
        Object.assign(linha, { produto: '', unidade: '', dose: null, preCadastro: false });
      }
    } else {
      const d = Planos.produtoDoCadastro(valor);
      linha.produto = d.produto;
      linha.principioAtivo = d.principioAtivo || '';
      linha.unidade = d.unidade;
      linha.preCadastro = !!d.preCadastro;
    }
    desenharTudo();
  }

  // ================= Ações =================
  // Com talhões (ou linhas do Plantio) marcados, o clique na linha marca ou desmarca pela caixa dela (a mesma ação
  // da caixa: a barra de baixo se atualiza); caixa desabilitada não muda. Desmarcada a última, volta ao estado sem
  // seleção. Devolve true quando há seleção (o clique não abre o Planejar nem o painel).
  function alternarPelaLinha(linha) {
    if (!ui.marcados.size) return false;
    linha.querySelector('input[data-acao="marcar"]:not(:disabled)')?.click();
    return true;
  }

  // Título da linha: sem seleção, "Clique para planejar o T03" (Plantio: "abrir"); com seleção, marcar ou desmarcar
  function tituloLinha(nome, chave, semSelecao) {
    if (!ui.marcados.size) return `Clique para ${semSelecao} o ${nome}`;
    return `Clique para ${ui.marcados.has(chave) ? 'desmarcar' : 'marcar'} o ${nome}`;
  }

  function aoClicar(e) {
    if (etapa === 'revisao' && Telas.operacoesPlano.aoClicar(e, ctxEstrutura(), acoesEstrutura)) return;
    if (etapa === 'calendario' && Telas.calendario.aoClicar(e, ctxCalendario(), acoesCalendario)) return;
    // Tabelas de talhões: sem seleção, o clique na linha (fora da caixa de marcar e das células editáveis) abre o
    // Planejar só com o talhão clicado ou, no Plantio, o painel do talhão. Com talhões (ou linhas) marcados, o clique
    // na linha marca ou desmarca, sem abrir nada (alternarPelaLinha).
    const linhaPlantio = e.target.closest('.tabela-variedade tbody tr[data-talhao]');
    if (linhaPlantio && !e.target.closest('input, button, select, label, a, .combo')) {
      if (alternarPelaLinha(linhaPlantio)) return;
      const t = linhaPlantio.dataset.talhao;
      if (ui.painelTalhao !== t) confirmarDescartePainel(() => abrirPainel(t));
      return;
    }
    const linhaCampo = e.target.closest('.tabela-campo tbody tr.linha--clicavel[data-talhao]');
    if (linhaCampo && !e.target.closest('input, button, select, label, a, .tabela__editavel')) {
      if (alternarPelaLinha(linhaCampo)) return;
      ui.marcados = new Set([linhaCampo.dataset.talhao]);
      abrirDefinirCampo(grupoAtual());
      return;
    }
    const linhaDose = e.target.closest('.tabela-doses tbody tr.linha--clicavel[data-talhao]');
    // A célula da caixa de marcar não abre o modal: clicar em volta da caixa marca ou desmarca o talhão
    const celulaMarcar = e.target.closest('.tabela-doses td.tabela__marcar, .tabela-campo td.tabela__marcar');
    if (celulaMarcar && e.target.tagName !== 'INPUT') { celulaMarcar.querySelector('input:not(:disabled)')?.click(); return; }
    if (linhaDose && !e.target.closest('input, button, select, label, a, .combo, .tabela__editavel')) {
      if (alternarPelaLinha(linhaDose)) return;
      ui.marcados = new Set([linhaDose.dataset.talhao]);
      abrirDefinir(opAtual());
      return;
    }
    const alvo = e.target.closest('[data-acao]');
    if (!alvo) return;
    const acao = alvo.dataset.acao;
    if (acao.startsWith('ver-')) { acaoVersao(acao, alvo); return; }
    const op = opAtual();
    const grupo = grupoAtual();

    switch (acao) {
      case 'alternar-lista':
        ui.listaRecolhidaPorGrupo[grupo.id] = !listaRecolhida(); desenharTudo(); break;

      case 'menu-op': {
        const grupo = grupoAtual();
        const op = grupo.operacoes.find((o) => o.id === alvo.dataset.op);
        if (!op) break;
        const caixa = alvo.getBoundingClientRect();
        abrirMenuContexto(alvo, caixa.left, caixa.bottom + 4, op.nome, itensMenuOperacao(grupo, op), caixa.top - 4);
        break;
      }
      case 'abrir-op': {
        const id = alvo.dataset.op;
        // Dois cliques seguidos no nome = renomear (como nas guias). Feito à mão porque
        // o primeiro clique redesenha a lista e o dblclick do navegador se perderia.
        const agora = Date.now();
        const duplo = ultimoCliqueOp.id === id && agora - ultimoCliqueOp.quando < 450;
        ultimoCliqueOp = { id, quando: agora };
        if (duplo && !somenteLeitura && !listaRecolhida()) { renomearNaLista(id); break; }
        if (op && op.id === id) break;
        sairDaReceita(() => {
          ui.opPorGrupo[grupo.id] = id; ui.renomeandoOp = null;
          limparSelecao(); desenharTudo();
        });
        break;
      }

      // Botões anterior/próxima do cabeçalho: abre a operação (sem o duplo clique de renomear da lista)
      case 'navegar-op':
        sairDaReceita(() => {
          ui.opPorGrupo[grupo.id] = alvo.dataset.op; ui.renomeandoOp = null;
          limparSelecao(); desenharMantendoFoco('.op-navegar');
        });
        break;

      // Operação de campo e Aplicação de insumos: o modal de várias operações de uma vez (Nome · DAP · Fenologia);
      // nos outros grupos, o de antes
      case 'nova-op': if (usaNovasOperacoes(grupo)) abrirNovasOperacoes(grupo); else sairDaReceita(() => criarOperacao(grupo)); break;
      case 'no-adicionar': ui.novasOps.linhas.push(linhaNovaOp()); desenharMantendoFoco(`[data-campo="no-nome"][data-var="${ui.novasOps.linhas.length - 1}"]`); break;
      case 'no-remover': ui.novasOps.linhas.splice(Number(alvo.dataset.var), 1); ui.novasOps.erros = {}; desenharMantendoFoco('[data-acao="no-adicionar"]'); break;
      case 'no-fechar': ui.novasOps = null; desenharMantendoFoco('[data-acao="nova-op"]'); break;
      case 'no-salvar': salvarNovasOperacoes(grupo); break;

      case 'exportar-plano': ui.maisAcoes = false; desenharTudo(); ArquivoPlano.exportar(plano); break;

      case 'editar-talhoes': ui.maisAcoes = false; desenharTudo(); editarTalhoes(); break;

      case 'adicionar-linha':
        rascunho(op).produtos.push(Planos.novaLinha()); desenharTudo();
        raiz.querySelector('.tabela-rec tbody tr:last-child [data-combo="pa"]')?.focus();
        break;

      case 'remover-linha': {
        const linha = linhaDoElemento(alvo);
        ui.rascunho.produtos = ui.rascunho.produtos.filter((l) => l !== linha);
        desenharTudo(); break;
      }

      case 'cancelar-pre': ui.preCadastro = null; desenharTudo(); break;
      case 'salvar-pre': salvarPreCadastro(op); break;

      case 'filtro-talhoes':
        ui.filtroTalhoes = alvo.dataset.filtro; ui.marcados = new Set();
        desenharMantendoFoco(`[data-filtro="${alvo.dataset.filtro}"]`); break;

      // Plantio: marcar talhão (trabalho em lote) fecha o painel do talhão (trabalho talhão a talhão)
      // No Plantio, a caixa é da linha (variedade): data-chave "talhão|índice"
      case 'marcar': {
        const chave = alvo.dataset.chave || alvo.dataset.talhao;
        if (alvo.checked) ui.marcados.add(chave); else ui.marcados.delete(chave);
        if (alvo.checked) fecharPainelPorSelecao();
        desenharMantendoFoco(alvo.dataset.chave ? `[data-acao="marcar"][data-chave="${CSS.escape(chave)}"]` : `[data-acao="marcar"][data-talhao="${alvo.dataset.talhao}"]`); break;
      }

      case 'marcar-todos':
        (ehSemente(grupo) ? linhasVisiveisPlantio(op).map((r) => chaveLinha(r.t.nome, r.i))
          : talhoesVisiveis(op).filter((t) => marcavel(op, t)).map((t) => t.nome))
          .forEach((k) => { if (alvo.checked) ui.marcados.add(k); else ui.marcados.delete(k); });
        if (alvo.checked) fecharPainelPorSelecao();
        desenharMantendoFoco('[data-acao="marcar-todos"]'); break;

      case 'excluir-marcados': excluirDosMarcados(op); break;

      case 'definir-plantio': abrirPlantio(op); break;
      case 'pl-fechar': fecharPlantio(); break;
      case 'pl-aplicar': aplicarPlantio(op); break;
      // Composição do modal: + Adicionar variedade. Enquanto ninguém digitou uma %, divide 100% igualmente entre
      // todas (50 + 50; 33,3 + 33,3 + 33,4). Depois de digitada, não mexe nas outras: a nova fica com o que falta
      // para 100% (70 → a nova 30) ou, sem sobra, em branco.
      case 'pl-adicionar': {
        const pl = ui.plantando;
        pl.linhas.push(linhaPlantioModal(op));
        partesIguais(pl.linhas.length, 100, 1).forEach((p, i) => { pl.linhas[i].pct = numeroTexto(p); });
        delete pl.erros.composicao;
        desenharMantendoFoco(`#pl-variedade-${pl.linhas.length - 1}`); break;
      }
      case 'pl-remover': {
        const pl = ui.plantando;
        const vi = Number(alvo.dataset.var);
        pl.linhas.splice(vi, 1);
        partesProporcionais(pl.linhas.map((l) => Util.numero(l.pct) || 0), 100, 1).forEach((p, i) => { pl.linhas[i].pct = numeroTexto(p); });
        const datas = {};
        Object.entries(pl.datasTexto).forEach(([k, v]) => { const i = Number(k); if (i < vi) datas[i] = v; else if (i > vi) datas[i - 1] = v; });
        pl.datasTexto = datas; pl.erros = {};
        desenharMantendoFoco('[data-acao="pl-adicionar"]'); break;
      }
      // Tabela e painel: adicionar ou tirar uma variedade do talhão
      case 'adicionar-variedade': adicionarVariedade(op, alvo.dataset.talhao, 'tb'); break;
      case 'remover-variedade': removerVariedade(op, alvo.dataset.talhao, Number(alvo.dataset.var), 'tb'); break;
      // Painel: rascunho (grava ao Salvar)
      case 'pt-adicionar-variedade': {
        const ed = ui.painelEdicao;
        ed.linhas.push(linhaEmBranco(op, ed.talhao));
        areasIguais(ed.linhas, areaTalhaoDe(ed.talhao));
        ed.alterado = true;
        ui.painelExpandido = true; // mais de uma variedade: a tabela do expandido (com a área de cada uma)
        // Como no Inserir da tabela: nenhum campo da linha nova fica aberto (o foco fica no botão)
        desenharMantendoFoco('[data-acao="pt-adicionar-variedade"]'); break;
      }
      case 'pt-remover-variedade': {
        const ed = ui.painelEdicao;
        const vi = Number(alvo.dataset.var);
        ed.linhas.splice(vi, 1);
        ed.erros = {}; ed.datas = {};
        if (ed.linhas.length) areasAoTirar(ed.linhas, areaTalhaoDe(ed.talhao)); // sobrou uma: o talhão inteiro
        if (!ed.linhas.length) ed.linhas.push(linhaEmBranco(op, ed.talhao)); // sem nenhuma: uma linha em branco para preencher
        ed.alterado = true;
        desenharMantendoFoco('[data-acao="pt-adicionar-variedade"]'); break;
      }
      case 'pt-historico':
        ui.historicoMinimizado = !ui.historicoMinimizado; desenharMantendoFoco('[data-acao="pt-historico"]'); break;
      case 'pt-salvar': salvarPainel(op); break;
      // Cancelar: descarta o rascunho e volta ao que está salvo (o painel continua aberto)
      case 'pt-cancelar': ui.painelEdicao = null; desenharMantendoFoco('[data-acao="pt-adicionar-variedade"]'); break;
      case 'excluir-plantio': excluirPlantio(op); break;

      // Link do aviso do TSI: abre a guia do grupo Sementes (Plantio)
      case 'ir-plantio': {
        const g = grupoSementes();
        if (!g) break;
        sairDaReceita(() => {
          ui.grupoId = g.id; ui.renomeandoOp = null; ui.filtroTalhoes = 'todos';
          limparSelecao(); pararRenomearNaLista(); desenharTudo();
        });
        break;
      }
      case 'visao-semente':
        ui.visaoSemente = alvo.dataset.visao; ui.marcados = new Set();
        desenharMantendoFoco(`[data-visao="${alvo.dataset.visao}"]`); break;
      case 'abrir-painel': confirmarDescartePainel(() => abrirPainel(alvo.dataset.talhao)); break;
      case 'abrir-calendario': {
        const nativo = alvo.parentElement.querySelector('.campo-data__nativo');
        try { nativo.showPicker(); } catch (erro) { nativo.focus(); nativo.click(); }
        break;
      }
      // Trocar de talhão com alterações não salvas no painel: pergunta antes de descartar
      case 'painel-anterior': confirmarDescartePainel(() => passarPainel(op, -1)); break;
      case 'painel-proximo': confirmarDescartePainel(() => passarPainel(op, 1)); break;
      case 'fechar-painel': confirmarDescartePainel(fecharPainel); break;
      case 'expandir-painel':
        if (ui.painelExpandido && ui.painelEdicao && ui.painelEdicao.linhas.length > 1) {
          Aviso.mostrar('Com mais de uma variedade, o painel fica expandido'); break;
        }
        ui.painelExpandido = !ui.painelExpandido; desenharMantendoFoco('[data-acao="expandir-painel"]'); break;
      case 'pt-pre-cancelar': ui.prePainel = null; ui.erroPrePainel = null; desenharMantendoFoco('#pt-variedade'); break;
      case 'pt-pre-salvar': salvarPrePainel(); break;
      case 'ordenar-semente': {
        const c = alvo.dataset.coluna;
        const atual = ui.ordemSemente;
        ui.ordemSemente = { coluna: c, sentido: atual && atual.coluna === c && atual.sentido === 'asc' ? 'desc' : 'asc' };
        desenharMantendoFoco(`[data-coluna="${c}"]`); break;
      }

      case 'limpar-selecao':
        ui.marcados = new Set(); desenharMantendoFoco('[data-acao="marcar-todos"]'); break;

      case 'definir-recomendacao': abrirDefinir(op); break;
      case 'campo-definir': abrirDefinirCampo(grupo); break;
      // Excluir operação: a operação aberta deixa de valer nos talhões marcados (a operação continua no grupo), com confirmação
      case 'campo-excluir': {
        const opCampo = opAtual();
        const nomes = talhoesFazenda.filter((t) => ui.marcados.has(t.nome) && opCampo && opCampo.talhoes[t.nome]).map((t) => t.nome);
        if (!nomes.length) break;
        Modal.confirmar({
          titulo: `Excluir ${esc(opCampo.nome)} de ${nomes.length} ${nomes.length === 1 ? 'talhão' : 'talhões'}?`,
          texto: `${nomes.length <= 4 ? nomes.map(esc).join(', ') : `${nomes.length} talhões`} ${nomes.length === 1 ? 'deixa' : 'deixam'} de receber ${esc(opCampo.nome)}. A operação continua no grupo.`,
          botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir operação', classe: 'perigo', acao: () => {
            nomes.forEach((t) => { delete opCampo.talhoes[t]; });
            limparSelecao(); alterou(); desenharTudo();
            Aviso.mostrar(`${esc(opCampo.nome)} excluída de ${nomes.length} ${nomes.length === 1 ? 'talhão' : 'talhões'}`);
          } }]
        });
        break;
      }
      // Modal Definir operação (Operação de campo)
      case 'dc-adicionar': ui.campo.linhas.push(linhaCampoVazia()); desenharMantendoFoco(`[data-campo="dc-nome"][data-var="${ui.campo.linhas.length - 1}"]`); break;
      case 'dc-remover': ui.campo.linhas.splice(Number(alvo.dataset.var), 1); ui.campo.erros = {}; desenharMantendoFoco('[data-acao="dc-adicionar"]'); break;
      case 'dc-fechar': ui.campo = null; desenharMantendoFoco('[data-acao="campo-definir"]'); break;
      case 'dc-salvar': salvarCampo(grupo); break;
      // Pelo "Planejar" (talhões marcados): tira a recomendação só desses talhões
      case 'excluir-rec':
        excluirDosTalhoes(op, receitaAtual(op), ui.definindo ? ui.definindo.talhoes : []);
        break;
      case 'fechar-definir': fecharDefinir(); break;
      case 'aplicar-definicao': aplicarDefinicao(op); break;

      case 'abrir-grupo': {
        if (ui.renomeandoGrupo) return;
        // Dois cliques seguidos na mesma guia = renomear (como no Excel). Feito à mão porque
        // o primeiro clique redesenha a guia e o dblclick do navegador se perderia.
        const id = alvo.dataset.grupo;
        const agora = Date.now();
        const duplo = ultimoCliqueGuia.id === id && agora - ultimoCliqueGuia.quando < 450;
        ultimoCliqueGuia = { id, quando: agora };
        if (duplo && !somenteLeitura) { ui.renomeandoGrupo = id; desenharTudo(); break; }
        if (ui.grupoId === id) break;
        sairDaReceita(() => {
          // Cada guia abre em Todos os talhões ("Não planejados" muda de sentido entre os grupos)
          ui.grupoId = id; ui.renomeandoOp = null; ui.filtroTalhoes = 'todos';
          limparSelecao(); pararRenomearNaLista(); desenharTudo();
        });
        break;
      }

      case 'novo-grupo': sairDaReceita(novoGrupo); break;
    }
  }

  function aoMudar(e) {
    if (etapa === 'revisao' && Telas.operacoesPlano.aoMudar(e, ctxEstrutura(), acoesEstrutura)) return;
    if (etapa === 'calendario' && Telas.calendario.aoMudar(e, ctxCalendario(), acoesCalendario)) return;
    const campo = e.target.dataset.campo;
    // Nova operação (Operação de campo): a fenologia escolhida na linha
    if (campo === 'no-fenologia' && ui.novasOps) { ui.novasOps.linhas[Number(e.target.dataset.var)].fenologia = e.target.value; return; }
    // Operação de campo: área aplicada digitada na célula (ha); guardada como % do talhão
    if (campo === 'campo-area') {
      const g = grupoAtual();
      const opCampo = g && g.operacoes.find((o) => o.id === e.target.dataset.op);
      const t = talhoesFazenda.find((x) => x.nome === e.target.dataset.talhao);
      if (!opCampo || !t) return;
      const texto = e.target.value.trim();
      const ha = texto ? Util.numero(texto) : null;
      if (texto && !(ha > 0 && ha <= t.area + 0.001)) {
        e.target.value = e.target.defaultValue;
        Aviso.mostrar(`Área: informe um valor maior que zero e até a área do ${esc(t.nome)} (${numeroTexto(t.area)} ha).`);
        return;
      }
      if (ha === null) delete opCampo.talhoes[t.nome];
      else opCampo.talhoes[t.nome] = { ...(opCampo.talhoes[t.nome] || Planos.novoAjuste(null)), pct: Math.min(100, ha / t.area * 100) };
      alterou();
      redesenharMantendoCelula();
      return;
    }
    const op = opAtual();
    if (campo === 'tb-dose' && e.target.dataset.talhao) { salvarDoseCelula(op, e.target); return; }
    if (campo && campo.startsWith('tb-') && e.target.dataset.talhao) { salvarCelulaPlantio(op, e.target); return; }
    // Índice da variedade (no talhão do painel ou na composição do modal)
    const vi = Number(e.target.dataset.var || 0);
    // Data escolhida no calendário (já vem como AAAA-MM-DD)
    if (campo === 'pl-data-cal') {
      const pl = ui.plantando;
      pl.linhas[vi].data = e.target.value; delete pl.datasTexto[vi]; delete pl.erros[`data${vi}`];
      desenharMantendoFoco(`#pl-data-${vi}`); return;
    }
    // Modal Definir plantio: ao sair do campo da %, as outras variedades se ajustam na proporção (sempre 100%)
    if (campo === 'pl-pct') { if (ajustarPctModal(vi)) redesenharMantendoCelula(); return; }
    if (campo === 'pt-data-cal') { delete ui.painelEdicao.datas[vi]; mudarRascunho(vi, { data: e.target.value }); desenharMantendoFoco(`#pt-data-${vi}`); return; }
    if (campo === 'pl-data') {
      const pl = ui.plantando;
      const iso = dataDeTexto(e.target.value);
      delete pl.datasTexto[vi]; delete pl.erros[`data${vi}`];
      if (e.target.value.trim() && !iso) { pl.datasTexto[vi] = e.target.value; pl.erros[`data${vi}`] = 'Data inválida. Use dd/mm/aaaa.'; }
      pl.linhas[vi].data = iso || '';
      desenharMantendoFoco(`#pl-data-${vi}`); return;
    }
    if (campo === 'pt-data') {
      const ed = ui.painelEdicao;
      const iso = dataDeTexto(e.target.value);
      if (e.target.value.trim() && !iso) { ed.datas[vi] = e.target.value; ed.alterado = true; redesenharMantendoCelula(); return; }
      delete ed.datas[vi];
      mudarRascunho(vi, { data: iso || '' }); redesenharMantendoCelula(); return;
    }
    if (campo === 'pt-germinacao') {
      const texto = e.target.value.trim();
      mudarRascunho(vi, { germinacao: texto ? Util.numero(texto) : null });
      redesenharMantendoCelula(); return;
    }
    if (campo === 'pt-variedade-sel') { mudarRascunho(vi, { variedade: e.target.value }); desenharMantendoFoco(`#pt-area-${vi}`); return; }
    if (campo === 'pt-ciclo') { salvarCiclo(e.target.value, vi); return; }
    if (campo === 'pt-populacao') {
      const n = Util.numero(e.target.value);
      mudarRascunho(vi, { populacao: n && n > 0 ? n : null }); redesenharMantendoCelula(); return;
    }
    if (campo === 'pt-area') {
      const texto = e.target.value.trim();
      // Digitada em % do talhão; guardada em ha
      // Com mais de uma variedade, as outras se ajustam na proporção (sempre 100%)
      const n = texto ? Util.numero(texto) : null;
      const ed = ui.painelEdicao;
      const total = areaTalhaoDe(ed.talhao);
      const area = n && n > 0 ? Math.round(total * Math.min(n, 100) / 100 * 100) / 100 : null;
      if (ed.linhas.length > 1 && area !== null) {
        areasAoMudar(ed.linhas, vi, area, total); ed.alterado = true;
        // Sem área: a linha fica em vermelho, com a mensagem, e o aviso aparece na hora
        const zeradas = ed.linhas.map((l, i) => i).filter((i) => !(Number(ed.linhas[i].area) > 0));
        ed.linhas.forEach((l, i) => { if (!zeradas.includes(i)) delete ed.erros[i]; });
        zeradas.forEach((i) => { ed.erros[i] = 'Ficou com 0% da área. Ajuste a % ou exclua a variedade.'; });
        avisarSemArea(zeradas.map((i) => ed.linhas[i].variedade));
      }
      else mudarRascunho(vi, { area, areaDigitada: true });
      redesenharMantendoCelula(); return;
    }
    if (campo === 'op-dap') {
      const n = Util.numero(e.target.value);
      // DAP é obrigatório: apagar não vale, o campo volta ao valor anterior
      if (n === null && op.dap !== null && op.dap !== undefined) {
        e.target.value = op.dap; Aviso.mostrar('Toda operação precisa de DAP'); return;
      }
      op.dap = n === null ? null : Math.round(n);
      if (op.dap !== null && op.dap <= 0) op.fenologia = ''; // pré-plantio e plantio: fenologia fixa (não se escolhe)
      // A lista se reordena pelo DAP: a operação continua aberta (sem isso, abriria a nova primeira da lista)
      ui.opPorGrupo[grupoAtual().id] = op.id;
      alterou(); desenharTudo();
    } else if (campo === 'copiar-de') {
      if (e.target.value) copiarProdutos(op, e.target.value);
    } else if (campo === 'op-fenologia') {
      op.fenologia = e.target.value; alterou(); desenharTudo();
    } else if (campo === 'linha-dose') {
      // Já registrada ao digitar; sem redesenhar, para o clique em "Aplicar" valer de primeira
      e.target.value = formatarDose(Util.numero(e.target.value));
    } else if (e.target.dataset.pre) {
      registrarPre(e.target);
    }
  }

  function aoDigitar(e) {
    if (etapa === 'calendario' && Telas.calendario.aoDigitar(e, ctxCalendario())) return;
    // Definir operação (Operação de campo): guarda o que se digita na linha, sem redesenhar
    const dcCampo = { 'dc-nome': 'nome', 'dc-dap': 'dap', 'dc-pct': 'pct' }[e.target.dataset.campo];
    if (dcCampo && ui.campo) { ui.campo.linhas[Number(e.target.dataset.var)][dcCampo] = e.target.value; return; }
    // Nova operação (Operação de campo): idem
    const noCampo = { 'no-nome': 'nome', 'no-dap': 'dap' }[e.target.dataset.campo];
    if (noCampo && ui.novasOps) { ui.novasOps.linhas[Number(e.target.dataset.var)][noCampo] = e.target.value; return; }
    if (etapa === 'revisao' && Telas.operacoesPlano.aoDigitar(e, ctxEstrutura())) return;
    // Doses: registradas enquanto se digita, sem redesenhar
    if (e.target.dataset.campo === 'linha-dose') {
      // Só números e uma vírgula decimal; o ponto digitado vira vírgula
      let v = e.target.value.replace(/\./g, ',').replace(/[^\d,]/g, '');
      const virgula = v.indexOf(',');
      if (virgula >= 0) v = v.slice(0, virgula + 1) + v.slice(virgula + 1).replace(/,/g, '');
      if (v !== e.target.value) e.target.value = v;
      linhaDoElemento(e.target).dose = Util.numero(e.target.value);
      return;
    }
    if (e.target.dataset.campo === 'nome-rec') { rascunho(opAtual()).nome = e.target.value; return; }
    // Plantio: nome do pré-cadastro de variedade (modal e painel); ciclo só com números
    if (e.target.dataset.campo === 'pt-pre') { ui.prePainel = e.target.value; return; }
    if (e.target.dataset.campo === 'tb-data') { const v = mascaraData(e.target.value); if (v !== e.target.value) e.target.value = v; return; }
    if (['tb-populacao', 'tb-area', 'tb-germinacao', 'tb-dose', 'campo-area'].includes(e.target.dataset.campo)) { soNumero(e.target); return; }
    if (e.target.dataset.campo === 'pt-data' || e.target.dataset.campo === 'pl-data') {
      const v = mascaraData(e.target.value);
      if (v !== e.target.value) e.target.value = v;
      return;
    }
    if (e.target.dataset.campo === 'pt-ciclo') {
      const v = e.target.value.replace(/[^\d]/g, '');
      if (v !== e.target.value) e.target.value = v;
      return;
    }
    // Área, população, % e germinação só com números e uma vírgula
    if (['pt-area', 'pt-populacao', 'pt-germinacao'].includes(e.target.dataset.campo)) { soNumero(e.target); return; }
    if (e.target.dataset.campo === 'pl-germinacao') { ui.plantando.linhas[Number(e.target.dataset.var)].germinacao = soNumero(e.target); return; }
    if (e.target.dataset.campo === 'pl-populacao') { ui.plantando.linhas[Number(e.target.dataset.var)].populacao = soNumero(e.target); return; }
    if (e.target.dataset.campo === 'pl-pct') {
      ui.plantando.linhas[Number(e.target.dataset.var)].pct = soNumero(e.target);
      atualizarRodapePlantio(); return;
    }
    if (e.target.dataset.variedade) { abrirBuscaVariedade(e.target); return; }
    if (e.target.dataset.combo) {
      const linha = linhaDoElemento(e.target);
      if (linha) delete ui.naoEncontrado[`${linha.id}:${e.target.dataset.combo}`];
      abrirCombo(e.target); return;
    }
    if (e.target.dataset.pre) { registrarPre(e.target); return; }
  }

  function aoFocar(e) {
    if (e.target.dataset.variedade) { e.target.select(); abrirBuscaVariedade(e.target); return; }
    if (e.target.dataset.combo) { e.target.select(); abrirCombo(e.target); }
  }

  function aoDesfocar(e) {
    if (etapa === 'revisao' && Telas.operacoesPlano.aoDesfocar(e, ctxEstrutura(), acoesEstrutura)) return;
    const el = e.target;
    if (el.dataset.variedade) {
      // Sem escolher uma opção: nome igual a uma variedade vale (ex.: colado); senão, volta ao que estava
      setTimeout(() => { if (raiz.contains(el) && el !== document.activeElement) aceitarVariedadeDigitada(el, { semFoco: true }); }, 150);
      return;
    }
    if (el.dataset.combo) {
      // Sem escolher uma opção: texto igual a um item do cadastro vale como escolhido;
      // texto que não existe fica no campo, com o erro embaixo
      setTimeout(() => {
        if (!raiz.contains(el) || el === document.activeElement) return;
        el.parentElement.querySelector('.combo__lista').hidden = true;
        el.setAttribute('aria-expanded', 'false');
        const linha = linhaDoElemento(el);
        if (!linha) return;
        const td = el.closest('td');
        td.querySelectorAll('.erro-campo--digitado').forEach((p) => p.remove());
        if (aceitarDigitado(el) === 'nao-encontrado') {
          el.classList.add('campo__controle--erro');
          el.closest('.combo').insertAdjacentHTML('afterend', `<p class="erro-campo erro-campo--digitado">${MSG_NAO_ENCONTRADO}</p>`);
          return;
        }
        el.classList.remove('campo__controle--erro');
        // Com erros na tela (já tentou aplicar), redesenha para limpá-los, mantendo o foco onde a pessoa foi
        if (ui.validarOp) {
          const ativo = document.activeElement;
          const linhaAtiva = ativo && ativo.closest && ativo.closest('[data-linha]');
          const campo = ativo && (ativo.dataset.campo ? `[data-campo="${ativo.dataset.campo}"]` : ativo.dataset.combo ? `[data-combo="${ativo.dataset.combo}"]` : null);
          if (linhaAtiva && campo) desenharMantendoFoco(`[data-linha="${linhaAtiva.dataset.linha}"] ${campo}`); else desenharTudo();
          return;
        }
        // Atualiza a linha sem redesenhar: princípio ativo, produto, unidade e dose
        const tr = el.closest('tr');
        tr.querySelector('[data-combo="pa"]').value = linha.principioAtivo;
        tr.querySelector('[data-combo="produto"]').value = linha.produto;
        tr.querySelector('.tabela-rec__unidade').textContent = Planos.unidadeDose(linha) || '—';
        const dose = tr.querySelector('[data-campo="linha-dose"]');
        if (dose) dose.disabled = !linha.produto;
      }, 150);
    }
    if (el.dataset.campo === 'nome-op') salvarNomeOperacao(el.value);
    if (el.dataset.campo === 'nome-grupo') salvarNomeGrupo(el.value);
    if (el.dataset.campo === 'lista-nome') {
      // Sair do campo salva o nome. Se o foco foi para um botão da tela, o clique dele redesenha;
      // redesenhar aqui o faria se perder.
      salvarNomeNaLista(el.value, { redesenhar: !e.relatedTarget?.closest?.('[data-acao]') });
    }
  }

  function aoTeclar(e) {
    if (etapa === 'revisao' && Telas.operacoesPlano.aoTeclar(e, ctxEstrutura(), acoesEstrutura)) return;
    const el = e.target;
    if (el.dataset.variedade) { teclaBuscaVariedade(e); return; }
    if (el.dataset.campo && el.dataset.campo.startsWith('tb-') && el.dataset.talhao && teclaCelulaPlantio(e)) return;
    // Cabeçalho da operação: F2 no nome abre o campo
    if (el.dataset.renomearOp && e.key === 'F2' && !somenteLeitura) {
      e.preventDefault(); ui.renomeandoOp = el.dataset.renomearOp; desenharTudo(); return;
    }
    // Lista de operações: F2 no nome abre o campo; no campo, Enter confirma e Esc desfaz
    if (el.dataset.acao === 'abrir-op' && e.key === 'F2' && !somenteLeitura && !listaRecolhida()) {
      e.preventDefault(); renomearNaLista(el.dataset.op); return;
    }
    if (el.dataset.campo === 'lista-nome') {
      const id = el.dataset.op;
      if (e.key === 'Enter') {
        e.preventDefault();
        salvarNomeNaLista(el.value, { redesenhar: false });
        desenharMantendoFoco(`[data-acao="abrir-op"][data-op="${id}"]`);
      } else if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        pararRenomearNaLista();
        desenharMantendoFoco(`[data-acao="abrir-op"][data-op="${id}"]`);
      }
      return;
    }
    if (el.dataset.combo) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const primeira = el.parentElement.querySelector('.combo__opcao');
        if (primeira) escolherNoCombo(el, primeira);
      } else if (e.key === 'Escape') {
        e.stopPropagation(); fecharCombos(); el.blur();
      }
      return;
    }
    if (el.dataset.campo === 'nome-op' || el.dataset.campo === 'nome-grupo') {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        ui.renomeandoOp = null; ui.renomeandoGrupo = null; desenharTudo();
      }
      return;
    }
    if (el.dataset.pre && e.key === 'Enter') { e.preventDefault(); salvarPreCadastro(opAtual()); }
    if ((el.dataset.campo === 'op-dap' || el.dataset.campo === 'linha-dose') && e.key === 'Enter') {
      e.preventDefault(); el.blur();
    }
    // Esc fecha o modal "Definir recomendação" (os campos acima já tratam o próprio Esc). O "Definir plantio" e o painel
    // do talhão só fecham pelos botões (Definir plantio, Salvar, Cancelar ou ✕), para nada se perder sem querer
    if (e.key === 'Escape' && ui.definindo && el.closest('.definir')) { e.preventDefault(); fecharDefinir(); }
    // Enter nos campos do modal só confirma o campo (na %, as outras se ajustam); quem aplica é o botão Definir plantio
    if (e.key === 'Enter' && ['pl-populacao', 'pl-germinacao', 'pl-pct'].includes(el.dataset.campo)) {
      e.preventDefault();
      if (el.dataset.campo === 'pl-pct' && ajustarPctModal(Number(el.dataset.var))) {
        desenharMantendoFoco(`[data-campo="pl-pct"][data-var="${el.dataset.var}"]`);
      }
      return;
    }
    if (e.key === 'Enter' && ['pt-area', 'pt-populacao', 'pt-germinacao', 'pt-data'].includes(el.dataset.campo)) { e.preventDefault(); el.blur(); return; }
    if (el.dataset.campo === 'campo-area' && (e.key === 'Enter' || e.key === 'Escape')) { e.preventDefault(); if (e.key === 'Escape') el.value = el.defaultValue; el.blur(); return; }
    // Painel do talhão: Enter no ciclo ou no pré-cadastro salva
    if (e.key === 'Enter' && el.dataset.campo === 'pt-ciclo') { e.preventDefault(); salvarCiclo(el.value); return; }
    if (e.key === 'Enter' && el.dataset.campo === 'pt-pre') { e.preventDefault(); salvarPrePainel(); return; }
    if (e.key === 'Enter' && (el.dataset.campo === 'pt-data' || el.dataset.campo === 'pl-data')) { e.preventDefault(); el.blur(); return; }
  }

  // Clique fora de "Mais ações", da lista "Trocar versão" ou do aviso de versão em construção: fecha
  document.addEventListener('mousedown', (e) => {
    if (!raiz || !raiz.isConnected || !(ui && (ui.versoes || ui.jaExiste || ui.maisAcoes))) return;
    if (e.target.closest('.versoes, .versoes-alerta, [data-acao="ver-nova"]')) return;
    ui.versoes = null; ui.jaExiste = false; ui.maisAcoes = false; desenharTudo();
  });

  // Clique na opção do combobox: mousedown para escolher antes do campo perder o foco
  document.addEventListener('mousedown', (e) => {
    const opcao = e.target.closest('.combo__opcao');
    if (!opcao || !raiz || !raiz.contains(opcao)) return;
    e.preventDefault();
    const variedade = opcao.closest('.combo--variedade');
    if (variedade) { escolherVariedade(variedade.querySelector('[data-variedade]'), opcao); return; }
    escolherNoCombo(opcao.closest('.combo').querySelector('[data-combo]'), opcao);
  });

  // ----- Operação -----
  function salvarNomeOperacao(valor) {
    if (!ui.renomeandoOp) return;
    const op = grupoAtual().operacoes.find((o) => o.id === ui.renomeandoOp);
    ui.renomeandoOp = null;
    if (op && valor.trim() && valor.trim() !== op.nome) {
      if (nomeOperacaoRepetido(valor, op)) Aviso.mostrar(NOME_OP_REPETIDO);
      else { op.nome = valor.trim(); alterou(); }
    }
    desenharTudo();
  }

  // Nome de operação não se repete no plano (sem diferenciar maiúsculas e acentos)
  const NOME_OP_REPETIDO = 'Já existe uma operação com esse nome';
  function nomeOperacaoRepetido(nome, exceto = null) {
    const n = Util.normalizar(nome.trim());
    return plano.grupos.some((g) => g.operacoes.some((o) => o !== exceto && Util.normalizar(o.nome) === n));
  }

  // Nome vazio ou repetido volta ao anterior
  function salvarNomeNaLista(valor, { redesenhar = true } = {}) {
    if (!ui.renomeandoNaLista) return;
    const op = grupoAtual().operacoes.find((o) => o.id === ui.renomeandoNaLista);
    pararRenomearNaLista();
    const v = valor.trim();
    if (op && v && v !== op.nome) {
      if (nomeOperacaoRepetido(v, op)) Aviso.mostrar(NOME_OP_REPETIDO);
      else { op.nome = v; alterou(); }
    }
    if (redesenhar) desenharTudo();
  }

  // Nova operação: nome e DAP obrigatórios (modal; "Criar operação" só habilita com os dois preenchidos)
  function criarOperacao(grupo) {
    const modal = Modal.abrir(`
      <form class="formulario" novalidate>
        <div class="modal__corpo">
          <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
          <h2 class="modal__titulo" id="modal-titulo">Nova operação</h2>
          <p class="modal__subtitulo">Grupo ${esc(grupo.nome)}. Toda operação precisa de nome e DAP.</p>
          <div class="campo">
            <label class="campo__rotulo" for="no-nome">Nome *</label>
            <input class="campo__controle" id="no-nome" name="nome" autocomplete="off" required aria-describedby="no-nome-erro">
            <p class="erro-campo" id="no-nome-erro" hidden>${NOME_OP_REPETIDO}</p>
          </div>
          <div class="campo">
            <label class="campo__rotulo" for="no-dap">DAP *</label>
            <input class="campo__controle no-dap" id="no-dap" name="dap" type="text" inputmode="numeric" autocomplete="off"
                   placeholder="Ex.: -15, 0, 40" required>
            <p class="campo__ajuda">Dias após o plantio. Negativo = antes do plantio.</p>
          </div>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
          <button class="botao botao--primario" type="submit" disabled>Criar operação</button>
        </div>
      </form>`, { classe: 'modal--pequeno' });
    const form = modal.elemento.querySelector('form');
    // DAP: só números inteiros, com sinal de menos opcional no início
    const dap = () => (/^-?\d+$/.test(form.elements.dap.value.trim()) ? Number(form.elements.dap.value.trim()) : null);
    form.elements.dap.addEventListener('input', (e) => {
      const v = e.target.value.replace(/[^\d-]/g, '').replace(/(?!^)-/g, '');
      if (v !== e.target.value) e.target.value = v;
    });
    const atualizar = () => {
      const nome = form.elements.nome.value.trim();
      const repetido = !!nome && nomeOperacaoRepetido(nome);
      form.elements.nome.classList.toggle('campo__controle--erro', repetido);
      form.elements.nome.setAttribute('aria-invalid', repetido);
      form.querySelector('#no-nome-erro').hidden = !repetido;
      form.querySelector('[type=submit]').disabled = !(nome && !repetido && dap() !== null);
    };
    form.addEventListener('input', atualizar);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (form.querySelector('[type=submit]').disabled) return;
      const nova = Planos.novaOperacao(form.elements.nome.value.trim(), dap());
      grupo.operacoes.push(nova);
      ui.opPorGrupo[grupo.id] = nova.id;
      modal.fechar(); limparSelecao(); alterou(); desenharTudo();
      Aviso.mostrar(`Operação ${esc(nova.nome)} criada`);
    });
    form.elements.nome.focus();
  }

  // "Copiar" (botão direito na lista): leva recomendações, talhões e doses para uma ou mais operações que já existem
  // (ex.: a 1ª Fungicida para a 2ª, a 3ª e a 4ª), que mantêm nome, DAP e fenologia. Destinos com recomendações: uma
  // confirmação só, com os nomes deles. Depois de colar, abre o primeiro destino (na ordem do DAP).
  // "Nova operação" (a primeira opção): cria uma operação com a cópia, o mesmo DAP, fenologia e prazo, e o nome
  // "Cópia de 1ª Fungicida"; depois de colar, ela abre com o nome em edição na lista, para a pessoa dar o nome.
  function copiarParaOperacao(grupo, origem) {
    const outras = operacoesOrdenadas(grupo).filter((o) => o !== origem);
    const resumo = (o) => {
      const recs = o.receitas.filter((r) => Planos.talhoesDaReceita(o, r).length).length;
      const talhoes = Object.keys(o.talhoes).length;
      return recs ? `${recs} ${recs === 1 ? 'recomendação' : 'recomendações'} · ${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'}` : 'Sem recomendação';
    };
    const modal = Modal.abrir(`
      <form class="formulario" novalidate>
        <div class="modal__corpo">
          <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
          <h2 class="modal__titulo" id="modal-titulo">Copiar ${esc(origem.nome)}</h2>
          <p class="modal__subtitulo">Escolha as operações que vão receber as recomendações agronômicas.</p>
          <fieldset class="copiar-para">
            <legend class="so-leitor">Operações de destino</legend>
            <label class="copiar-para__item copiar-para__item--nova">
              <input type="checkbox" name="destino" value="nova">
              <span class="copiar-para__nome">${Icones.mais} Nova operação</span>
              <span class="copiar-para__dap">DAP ${origem.dap ?? '—'}</span>
              <span class="copiar-para__resumo">Você dá o nome depois de colar</span>
            </label>
            ${outras.map((o) => `
              <label class="copiar-para__item">
                <input type="checkbox" name="destino" value="${o.id}">
                <span class="copiar-para__nome">${esc(o.nome)}</span>
                <span class="copiar-para__dap">DAP ${o.dap ?? '—'}</span>
                <span class="copiar-para__resumo">${resumo(o)}</span>
              </label>`).join('')}
          </fieldset>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
          <button class="botao botao--primario" type="submit" disabled>Colar</button>
        </div>
      </form>`, { classe: 'modal--pequeno' });
    const form = modal.elemento.querySelector('form');
    const marcados = () => [...form.querySelectorAll('input[name="destino"]:checked')].map((x) => (x.value === 'nova' ? 'nova' : outras.find((o) => o.id === x.value)));
    // "Colar" habilitado com ao menos uma operação marcada; com várias, "Colar em 3 operações"
    form.addEventListener('change', () => {
      const n = marcados().length;
      const botao = form.querySelector('[type=submit]');
      botao.disabled = !n;
      botao.textContent = n > 1 ? `Colar em ${n} operações` : 'Colar';
    });
    const nomes = (ops) => {
      const ns = ops.map((o) => esc(o.nome));
      return ns.length > 1 ? `${ns.slice(0, -1).join(', ')} e ${ns[ns.length - 1]}` : ns[0];
    };
    const comRecs = (o) => o.receitas.filter((r) => Planos.talhoesDaReceita(o, r).length).length;
    // Nome da operação nova: "Cópia de 1ª Fungicida" (com número, se já existir: "Cópia de 1ª Fungicida (2)")
    const nomeNova = () => {
      const base = `Cópia de ${origem.nome}`;
      let nome = base; let n = 2;
      while (nomeOperacaoRepetido(nome)) nome = `${base} (${n++})`;
      return nome;
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const escolhidos = marcados();
      if (!escolhidos.length) return;
      const comNova = escolhidos.includes('nova');
      const destinos = escolhidos.filter((x) => x !== 'nova');
      const copiar = () => {
        let nova = null;
        if (comNova) {
          nova = Planos.novaOperacao(nomeNova(), origem.dap, origem.prazo ?? null);
          nova.fenologia = origem.fenologia || '';
          grupo.operacoes.push(nova);
        }
        [...destinos, ...(nova ? [nova] : [])].forEach((destino) => {
          destino.receitas = []; destino.talhoes = {};
          copiarRecomendacoes(origem, destino);
          delete ui.receitaPorOp[destino.id];
        });
        // Com a nova, abre nela, com o nome em edição na lista; senão, no primeiro destino
        ui.opPorGrupo[grupo.id] = nova ? nova.id : destinos[0].id;
        ui.filtroTalhoes = 'todos';
        limparSelecao(); alterou();
        if (nova) renomearNaLista(nova.id); else desenharTudo();
        const todos = [...destinos, ...(nova ? [{ nome: 'uma operação nova' }] : [])];
        Aviso.mostrar(`${esc(origem.nome)} copiada para ${todos.length > 3 ? `${todos.length} operações` : nomes(todos)}${nova ? '. Dê o nome à operação nova' : ''}`);
      };
      modal.fechar();
      const substituir = destinos.filter(comRecs);
      if (!substituir.length) { copiar(); return; }
      const um = substituir.length === 1;
      const d = substituir[0];
      const recs = comRecs(d);
      const talhoes = Object.keys(d.talhoes).length;
      Modal.confirmar({
        titulo: um ? `Substituir o que está em ${esc(d.nome)}?` : `Substituir o que está em ${substituir.length} operações?`,
        texto: um
          ? `${esc(d.nome)} já tem ${recs} ${recs === 1 ? 'recomendação' : 'recomendações'} em ${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'}. ${recs === 1 ? 'Ela será substituída' : 'Elas serão substituídas'} pelas de ${esc(origem.nome)}. Essa ação não pode ser desfeita.`
          : `${nomes(substituir)} já têm recomendações. Elas serão substituídas pelas de ${esc(origem.nome)}. Essa ação não pode ser desfeita.`,
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Substituir', classe: 'perigo', acao: copiar }]
      });
    });
    form.querySelector('input[name="destino"]').focus();
  }

  // Copia recomendações (nome, produtos e doses padrão), talhões e doses próprias, com ids novos
  function copiarRecomendacoes(origem, destino) {
    const idsLinha = {};
    const idsRec = {};
    destino.receitas = origem.receitas.map((r) => {
      const copia = { ...r, id: Planos.novoId('r'), produtos: r.produtos.map((l) => {
        const { id, ...dados } = l;
        const nova = Planos.novaLinha(dados);
        idsLinha[id] = nova.id;
        return nova;
      }) };
      idsRec[r.id] = copia.id;
      return copia;
    });
    Object.entries(origem.talhoes).forEach(([talhao, ajuste]) => {
      if (!idsRec[ajuste.receitaId]) return;
      const novo = Planos.novoAjuste(idsRec[ajuste.receitaId]);
      Object.entries(ajuste.doses).forEach(([linha, dose]) => { if (idsLinha[linha]) novo.doses[idsLinha[linha]] = dose; });
      destino.talhoes[talhao] = novo;
    });
  }

  // Exclui a operação pelo botão direito (hipótese a validar com clientes).
  // Com talhões: confirmação com o impacto. Sem talhões: exclui na hora, com Desfazer.
  function excluirOperacao(grupo, op) {
    const talhoes = Object.keys(op.talhoes).length;
    const produtos = new Set(op.receitas.flatMap((r) => r.produtos)
      .filter(Planos.linhaPreenchida).map(Planos.chaveLinha)).size;
    const ultima = grupo.operacoes.length === 1;
    const nome = esc(op.nome);
    const remover = () => {
      const indice = grupo.operacoes.indexOf(op);
      grupo.operacoes.splice(indice, 1);
      // Se a operação aberta saiu, abre a primeira restante (opAtual cai nela)
      if (ui.opPorGrupo[grupo.id] === op.id) delete ui.opPorGrupo[grupo.id];
      limparSelecao(); alterou(); desenharTudo();
      return indice;
    };
    if (talhoes) {
      Modal.confirmar({
        titulo: `Excluir ${nome}?`,
        texto: `Ela está aplicada em ${talhoes} ${talhoes === 1 ? 'talhão' : 'talhões'}`
          + `${produtos ? `, com ${produtos} ${produtos === 1 ? 'produto' : 'produtos'}` : ''}.`
          + `${ultima ? ` O grupo ${esc(grupo.nome)} ficará sem operações.` : ''}`
          + ' Essa ação não pode ser desfeita.',
        botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir operação', classe: 'perigo', acao: () => {
          remover(); Aviso.mostrar(`${nome} excluída`);
        } }]
      });
    } else {
      const indice = remover();
      Aviso.mostrar(`${nome} excluída${ultima ? `. O grupo ${esc(grupo.nome)} ficou sem operações` : ''}`, { acao: 'Desfazer', aoAgir: () => {
        grupo.operacoes.splice(Math.min(indice, grupo.operacoes.length), 0, op);
        if (ui.grupoId === grupo.id && raiz.isConnected) desenharTudo();
      } });
    }
  }

  // ----- Pré-cadastro -----
  function salvarPreCadastro(op) {
    const pc = ui.preCadastro;
    raiz.querySelectorAll('[data-pre]').forEach((el) => { pc[el.dataset.pre] = el.value; });
    const produto = pc.produto.trim();
    const pa = pc.principioAtivo.trim();
    pc.erros = {};
    if (!produto) pc.erros.produto = 'Informe o produto comercial.';
    if (!pc.unidade) pc.erros.unidade = 'Escolha a unidade.';
    pc.aviso = '';
    if (pc.erros.produto || pc.erros.unidade) { desenharTudo(); return; }

    const uso = usoAtual();
    DADOS.defensivos.push({ classe: '', produto, principioAtivo: pa, unidade: pc.unidade, preCadastro: true,
                            ...(uso === 'tsi' ? { tsi: true } : uso === 'fertilidade' ? { fertilidade: true } : {}) });
    const linha = ui.rascunho.produtos.find((l) => l.id === pc.linhaId);
    Object.assign(linha, { produto, principioAtivo: pa, unidade: pc.unidade, preCadastro: true });
    ui.preCadastro = null;
    desenharTudo();
    Aviso.mostrar(`Pré-cadastro de "${esc(produto)}" salvo`);
  }

  // ----- Excluir receita -----
  // Tira a recomendação só dos talhões marcados; ela continua nos outros.
  // Se não sobrar nenhum talhão, a recomendação deixa de existir.
  function excluirDosTalhoes(op, r, marcados) {
    if (!r) return;
    const alvo = marcados.filter((t) => op.talhoes[t] && op.talhoes[t].receitaId === r.id);
    const n = alvo.length;
    if (!n) return;
    const restam = Planos.talhoesDaReceita(op, r).length - n;
    Modal.confirmar({
      titulo: `Excluir a ${T().nome} de ${n} ${n === 1 ? 'talhão' : 'talhões'}?`,
      texto: textoRestam(restam) + ' Essa ação não pode ser desfeita.',
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: `Excluir ${T().nome}`, classe: 'perigo', acao: () => {
        alvo.forEach((t) => { delete op.talhoes[t]; });
        if (!restam) { op.receitas.splice(op.receitas.indexOf(r), 1); delete ui.receitaPorOp[op.id]; }
        ui.rascunho = null; ui.validarOp = null; ui.preCadastro = null; ui.erroNome = null;
        // Depois de excluir, a tabela volta para Todos os talhões
        ui.filtroTalhoes = 'todos';
        limparSelecao(); alterou(); desenharTudo();
        const rolagem = raiz.querySelector('.talhoes-rolagem');
        if (rolagem) rolagem.scrollTop = 0;
        Aviso.mostrar(restam ? `${T().Nome} excluída de ${n} ${n === 1 ? 'talhão' : 'talhões'}` : `${T().Nome} excluída`);
      } }]
    });
  }

  // "A recomendação continua nos outros 11 talhões." / "A recomendação deixa de existir."
  function textoRestam(restam) {
    if (!restam) return `A ${T().nome} deixa de existir.`;
    return `A ${T().nome} continua ${restam === 1 ? 'no outro talhão' : `nos outros ${restam} talhões`}.`;
  }

  // "Excluir recomendação" no rodapé da tabela: tira a recomendação dos talhões marcados (podem ser de
  // recomendações diferentes); talhão marcado sem recomendação é ignorado. Recomendação sem talhão deixa de existir.
  function excluirDosMarcados(op) {
    const alvo = talhoesFazenda.map((t) => t.nome).filter((t) => ui.marcados.has(t) && op.talhoes[t]);
    const n = alvo.length;
    if (!n) return;
    const ignorados = ui.marcados.size - n;
    const recs = op.receitas.map((r) => ({ r, n: alvo.filter((t) => op.talhoes[t].receitaId === r.id).length }))
      .filter((x) => x.n);
    const plural = (q) => `${q} ${q === 1 ? 'talhão' : 'talhões'}`;
    // Uma recomendação só: diz se ela continua em outros talhões; mais de uma: só que os talhões ficam sem
    const titulo = `Excluir a ${T().nome} de ${plural(n)}?`;
    const detalhe = recs.length === 1 ? textoRestam(Planos.talhoesDaReceita(op, recs[0].r).length - n)
      : `Os ${n} talhões ficarão sem ${T().nome}.`;
    const aviso = ignorados ? ` ${ignorados === 1 ? '1 talhão marcado já não tem' : `${ignorados} talhões marcados já não têm`} ${T().nome}.` : '';
    Modal.confirmar({
      titulo,
      texto: `${detalhe}${aviso} Essa ação não pode ser desfeita.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: `Excluir ${T().nome}`, classe: 'perigo', acao: () => {
        alvo.forEach((t) => { delete op.talhoes[t]; });
        recs.filter((x) => !Planos.talhoesDaReceita(op, x.r).length)
          .forEach((x) => op.receitas.splice(op.receitas.indexOf(x.r), 1));
        ui.filtroTalhoes = 'todos';
        limparSelecao(); alterou(); desenharTudo();
        const rolagem = raiz.querySelector('.talhoes-rolagem');
        if (rolagem) rolagem.scrollTop = 0;
        Aviso.mostrar(`${T().Nome} excluída de ${plural(n)}`);
      } }]
    });
  }

  // ----- Aplicar a recomendação nos talhões marcados -----
  // Grava o rascunho na recomendação e liga os talhões marcados a ela (um talhão fica em uma recomendação só
  // na operação: o que estava em outra muda para esta). Os talhões que já usavam a recomendação recebem
  // as alterações: dose padrão nova chega a quem segue o padrão; produto removido ou trocado sai de todos.
  // Exceção: marcando só parte dos talhões de uma recomendação, a mudança vale só para eles (ver aplicarEmParte).
  function aplicarDefinicao(op) {
    const r = receitaAtual(op);
    if (!r) return;
    // Pré-cadastro aberto: não aplica; avisa no próprio bloco
    if (ui.preCadastro) {
      const pc = ui.preCadastro;
      raiz.querySelectorAll('[data-pre]').forEach((el) => { pc[el.dataset.pre] = el.value; });
      pc.aviso = `${Icones.alerta} <span><strong>Pré-cadastro não finalizado.</strong> Salve ou cancele o pré-cadastro antes de aplicar.</span>`;
      desenharTudo();
      return;
    }
    // Campos digitados sem escolher na lista: aceita o que é do cadastro; o que não é fica com erro
    let naoEncontrado = false;
    raiz.querySelectorAll('.definir [data-combo]').forEach((el) => {
      if (aceitarDigitado(el) === 'nao-encontrado') naoEncontrado = true;
    });
    if (naoEncontrado || errosRecomendacao(op).algum) { ui.validarOp = op.id; desenharTudo(); return; }
    // Nome vazio volta ao anterior; nome repetido na operação não é aceito
    const nome = rascunho(op).nome.trim() || r.nome;
    if (op.receitas.some((x) => x !== r && Util.normalizar(x.nome) === Util.normalizar(nome))) {
      ui.erroNome = `Já existe uma ${T().nome} com esse nome`; desenharMantendoFoco('#rec-nome'); return;
    }
    const novas = rascunho(op).produtos.filter(Planos.linhaPreenchida).map((l) => ({ ...l }));
    const { talhoes } = ui.definindo;
    const daRec = Planos.talhoesDaReceita(op, r);
    if (daRec.some((t) => !talhoes.includes(t))) { aplicarEmParte(op, r, talhoes, novas, nome); return; }
    // Recomendação nova com os mesmos produtos de outra (ex.: copiados dela pelo "Copiar produtos de"):
    // a composição é a identidade, então os talhões entram na que já existe e a dose diferente
    // da padrão dela fica como dose própria do talhão
    const igual = !daRec.length &&
      op.receitas.find((x) => x !== r && Planos.composicao(x.produtos) === Planos.composicao(novas));
    if (igual) {
      op.receitas.splice(op.receitas.indexOf(r), 1);
      ui.receitaPorOp[op.id] = igual.id;
      talhoes.forEach((t) => {
        const ajuste = op.talhoes[t] = Planos.novoAjuste(igual.id);
        novas.forEach((l) => {
          const base = igual.produtos.find((x) => Planos.chaveLinha(x) === Planos.chaveLinha(l));
          if (base && l.dose !== base.dose) ajuste.doses[base.id] = l.dose;
        });
      });
      const n = talhoes.length;
      concluirAplicacao(op, igual, `${T().Nome} aplicada em ${n} ${n === 1 ? 'talhão' : 'talhões'}`);
      return;
    }
    r.nome = nome;
    Planos.talhoesDaReceita(op, r).forEach((t) => {
      const doses = op.talhoes[t].doses;
      Object.keys(doses).forEach((id) => {
        const antes = r.produtos.find((l) => l.id === id);
        const depois = novas.find((l) => l.id === id);
        if (!depois || !antes || Planos.chaveLinha(antes) !== Planos.chaveLinha(depois)) delete doses[id];
      });
    });
    r.produtos = novas;
    talhoes.forEach((t) => {
      const a = op.talhoes[t];
      if (!a || a.receitaId !== r.id) op.talhoes[t] = Planos.novoAjuste(r.id);
    });
    const n = talhoes.length;
    concluirAplicacao(op, r, `${T().Nome} aplicada em ${n} ${n === 1 ? 'talhão' : 'talhões'}`);
  }

  // Depois de aplicar, a tela volta para "Todos os talhões" (a pessoa escolhe a etiqueta, se quiser)
  function concluirAplicacao(op, destino, mensagem) {
    ui.rascunho = null; ui.validarOp = null; ui.preCadastro = null; ui.erroNome = null;
    ui.filtroTalhoes = 'todos';
    limparSelecao(); alterou(); desenharTudo();
    const rolagem = raiz.querySelector('.talhoes-rolagem');
    if (rolagem) rolagem.scrollTop = 0;
    Aviso.mostrar(mensagem);
  }

  // Só parte dos talhões de uma recomendação foi marcada: a mudança vale só para eles
  // (regra do docs/DECISOES: a composição de produtos é a identidade da recomendação).
  //  - Mesmos produtos, dose diferente: fica como dose própria dos talhões marcados; a recomendação não muda.
  //  - Produtos diferentes: os talhões marcados saem da recomendação e vão para a que já tem essa
  //    composição; se nenhuma tem, nasce a próxima (Recomendação 2…). A original continua nos outros.
  function aplicarEmParte(op, r, talhoes, novas, nome) {
    const n = talhoes.length;
    const plural = `${n} ${n === 1 ? 'talhão' : 'talhões'}`;
    const restam = Planos.talhoesDaReceita(op, r).filter((t) => !talhoes.includes(t)).length;
    // Dose diferente da padrão de "receita" vira dose própria do talhão.
    // soAlteradas: na mesma recomendação, dose não mexida no modal fica como estava em cada talhão.
    const dosesProprias = (receita, ajuste, soAlteradas) => {
      novas.forEach((l) => {
        const base = receita.produtos.find((x) => Planos.chaveLinha(x) === Planos.chaveLinha(l));
        if (!base || (soAlteradas && ui.definindo.dosesIniciais[l.id] === l.dose)) return;
        if (l.dose === base.dose) delete ajuste.doses[base.id]; else ajuste.doses[base.id] = l.dose;
      });
    };
    const composicao = Planos.composicao(novas);

    if (composicao === Planos.composicao(r.produtos)) {
      if (nome !== r.nome) r.nome = nome; // o nome é da recomendação: vale para todos os talhões dela
      talhoes.forEach((t) => dosesProprias(r, op.talhoes[t], true));
      concluirAplicacao(op, r, `${T().Nome} aplicada em ${plural} · doses só desses talhões`);
      return;
    }

    let destino = op.receitas.find((x) => x !== r && Planos.composicao(x.produtos) === composicao);
    const criada = !destino;
    if (criada) {
      destino = Planos.novaReceita(op, novas.map((l) => Planos.novaLinha({
        principioAtivo: l.principioAtivo, produto: l.produto, unidade: l.unidade, dose: l.dose, preCadastro: l.preCadastro })), T().base);
      // Nome digitado diferente do original vai para a nova; senão, ela fica com o nome padrão
      if (nome !== r.nome) destino.nome = nome;
      op.receitas.push(destino);
    }
    talhoes.forEach((t) => {
      op.talhoes[t] = Planos.novoAjuste(destino.id);
      if (!criada) dosesProprias(destino, op.talhoes[t], false);
    });
    concluirAplicacao(op, destino, criada
      ? `Nova ${T().nome} criada para ${plural} · a anterior continua em ${restam} ${restam === 1 ? 'talhão' : 'talhões'}`
      : `${plural} ${n === 1 ? 'passou' : 'passaram'} para a ${T().nome} que já tinha esses produtos`);
  }

  // ----- Grupos -----
  // Tipos de planejamento do "+": [tipo, nome, o que pede]. Plantio é o tipo Sementes; Aplicação de insumos abre a tela
  // de recomendação (como Defensivo e Fertilidade), sem operação; Operação de campo, a tela da tabela dos talhões
  const TIPOS_NOVO_GRUPO = [
    ['Sementes', 'Plantio', 'Variedade, população e janela de plantio'],
    ['Aplicação de insumos', 'Aplicação de insumos', 'Recomendação de produtos e doses'],
    ['Operação de campo', 'Operação de campo', 'Operação sem recomendação de produto']
  ];
  // aoCriar(grupo): chamado com o grupo criado (ex.: a aba Revisão move a operação para ele)
  function novoGrupo(aoCriar) {
    const modal = Modal.abrir(`
      <form class="formulario" novalidate>
        <div class="modal__corpo">
          <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
          <h2 class="modal__titulo" id="modal-titulo">Novo grupo de operações</h2>
          <p class="modal__subtitulo">O tipo define as informações mínimas pedidas no grupo.</p>
          <div class="campo">
            <label class="campo__rotulo" for="ng-nome">Nome</label>
            <input class="campo__controle" id="ng-nome" name="nome" autocomplete="off" required aria-describedby="ng-nome-erro">
            <p class="erro-campo" id="ng-nome-erro" data-ng-erro hidden></p>
          </div>
          <div class="campo ng-tipo">
            <span class="campo__rotulo" id="ng-tipo-rotulo">Tipo de planejamento</span>
            <input type="hidden" name="tipo" value="">
            <button class="campo__controle ng-tipo__botao" type="button" id="ng-tipo" aria-haspopup="listbox" aria-expanded="false"
                    aria-labelledby="ng-tipo-rotulo ng-tipo">
              <span class="ng-tipo__texto ng-tipo__texto--vazio" data-ng-escolhido>Selecione o tipo</span>${Icones.abaixo}
            </button>
            <ul class="ng-tipo__lista" role="listbox" aria-labelledby="ng-tipo-rotulo" hidden>
              ${TIPOS_NOVO_GRUPO.map(([valor, nome, texto]) => `
                <li class="ng-tipo__opcao" role="option" tabindex="-1" data-valor="${valor}" aria-selected="false">
                  <span class="ng-tipo__nome">${nome}</span><span class="ng-tipo__desc">${texto}</span>
                </li>`).join('')}
            </ul>
          </div>
        </div>
        <div class="modal__rodape">
          <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
          <button class="botao botao--primario" type="submit" disabled>Criar grupo</button>
        </div>
      </form>`, { classe: 'modal--pequeno' });
    const form = modal.elemento.querySelector('form');
    const atualizar = () => {
      form.querySelector('[type=submit]').disabled = !(form.elements.nome.value.trim() && form.elements.tipo.value);
    };
    form.addEventListener('input', atualizar);
    form.addEventListener('change', atualizar);
    // Lista do Tipo de planejamento: cada opção com o nome e, embaixo, o que ela pede (a lista nativa não mostra duas
    // linhas). Abre pelo botão; setas ↑ ↓ andam, Enter ou clique escolhe, Esc fecha.
    const botaoTipo = form.querySelector('.ng-tipo__botao');
    const lista = form.querySelector('.ng-tipo__lista');
    const opcoes = [...lista.querySelectorAll('.ng-tipo__opcao')];
    const abrirLista = (abrir) => {
      lista.hidden = !abrir;
      botaoTipo.setAttribute('aria-expanded', String(abrir));
      botaoTipo.classList.toggle('ng-tipo__botao--aberto', abrir);
      if (abrir) (opcoes.find((o) => o.getAttribute('aria-selected') === 'true') || opcoes[0]).focus();
    };
    const escolher = (opcao) => {
      form.elements.tipo.value = opcao.dataset.valor;
      opcoes.forEach((o) => o.setAttribute('aria-selected', String(o === opcao)));
      const texto = form.querySelector('[data-ng-escolhido]');
      texto.textContent = opcao.querySelector('.ng-tipo__nome').textContent;
      texto.classList.remove('ng-tipo__texto--vazio');
      abrirLista(false); botaoTipo.focus(); atualizar();
    };
    botaoTipo.addEventListener('click', () => abrirLista(lista.hidden));
    lista.addEventListener('click', (e) => { const o = e.target.closest('.ng-tipo__opcao'); if (o) escolher(o); });
    lista.addEventListener('keydown', (e) => {
      const i = opcoes.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); opcoes[Math.min(opcoes.length - 1, i + 1)].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); opcoes[Math.max(0, i - 1)].focus(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) escolher(opcoes[i]); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); abrirLista(false); botaoTipo.focus(); }
      else if (e.key === 'Tab') abrirLista(false);
    });
    botaoTipo.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); abrirLista(true); } });
    // Nome de grupo não se repete no plano (sem diferenciar maiúsculas e acentos): ao criar, avisa e não cria
    const erroNome = form.querySelector('[data-ng-erro]');
    form.elements.nome.addEventListener('input', () => { erroNome.hidden = true; form.elements.nome.classList.remove('campo__controle--erro'); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (form.querySelector('[type=submit]').disabled) return;
      const nomeGrupo = form.elements.nome.value.trim();
      if (plano.grupos.some((g) => Util.normalizar(g.nome) === Util.normalizar(nomeGrupo))) {
        erroNome.textContent = 'Já existe um grupo de operações com esse nome.';
        erroNome.hidden = false;
        form.elements.nome.classList.add('campo__controle--erro');
        form.elements.nome.focus();
        return;
      }
      const grupo = Planos.novoGrupo(nomeGrupo, form.elements.tipo.value);
      // Entra antes do grupo Colheita, que fica sempre por último
      const iColheita = plano.grupos.findIndex((g) => g.tipo === 'Colheita');
      plano.grupos.splice(iColheita >= 0 ? iColheita : plano.grupos.length, 0, grupo);
      ui.grupoId = grupo.id;
      if (typeof aoCriar === 'function') aoCriar(grupo);
      modal.fechar(); limparSelecao(); pararRenomearNaLista(); alterou(); desenharTudo();
    });
    form.elements.nome.focus();
  }

  // Excluir grupo (botão direito na guia): a mesma regra da aba Revisão — as operações continuam no plano,
  // "Sem grupo", até o usuário escolher o grupo de cada uma (na aba Revisão). Se era a guia aberta, abre a vizinha.
  function excluirGrupo(grupo) {
    const indice = gruposPlanejamento().indexOf(grupo);
    const acoes = {
      ...acoesEstrutura,
      redesenhar: () => {
        if (!plano.grupos.includes(grupo) && ui.grupoId === grupo.id) {
          const vizinhos = gruposPlanejamento();
          ui.grupoId = (vizinhos[indice] || vizinhos[indice - 1] || {}).id || null;
        }
        pararRenomearNaLista(); limparSelecao();
        if (raiz.isConnected) desenharTudo();
      }
    };
    Telas.operacoesPlano.excluirGrupo(grupo, ctxEstrutura(), acoes);
  }

  let ultimoCliqueGuia = { id: null, quando: 0 };

  let ultimoCliqueOp = { id: null, quando: 0 };

  // Botão direito (ou tecla de menu / Shift+F10) na guia de grupo ou no nome da operação:
  // Inserir · Excluir · Renomear, como no Excel. Na operação, o mesmo menu do ⋯ (itensMenuOperacao).
  let menuContexto = null;

  // Menu da operação na lista (⋯ e botão direito), nesta ordem, com ícones; Excluir separado, em vermelho
  function itensMenuOperacao(grupo, op) {
    return [
      { id: 'renomear', rotulo: 'Renomear', icone: Icones.lapis, acao: () => sairDaReceita(() => {
        ui.opPorGrupo[grupo.id] = op.id;
        limparSelecao(); renomearNaLista(op.id);
      }) },
      { id: 'copiar', rotulo: 'Copiar para outras operações', icone: Icones.copiar, acao: () => sairDaReceita(() => copiarParaOperacao(grupo, op)) },
      { id: 'inserir', rotulo: 'Inserir operação', icone: Icones.inserir, acao: () => sairDaReceita(() => criarOperacao(grupo)) },
      { id: 'excluir', rotulo: 'Excluir', icone: Icones.lixeira, perigo: true, separar: true, acao: () => sairDaReceita(() => excluirOperacao(grupo, op)) }
    ];
  }

  function aoMenuContexto(e) {
    if (somenteLeitura) return;
    // Plantio: botão direito na linha (variedade) → Inserir (variedade logo abaixo) · Excluir · Limpar conteúdo
    const linhaPl = e.target.closest('.tabela-variedade tbody tr[data-talhao]');
    if (linhaPl && !e.target.closest('input')) {
      e.preventDefault();
      const t = linhaPl.dataset.talhao;
      const vi = Number(linhaPl.dataset.var || 0);
      const op = opAtual();
      const existe = !!Planos.linhasPlantio(op, t)[vi];
      const caixaLinha = linhaPl.getBoundingClientRect();
      const itens = [{ id: 'inserir', rotulo: 'Inserir', acao: () => adicionarVariedade(op, t, 'tb', existe ? vi : null) }];
      if (existe) {
        itens.push({ id: 'excluir', rotulo: 'Excluir', acao: () => removerVariedade(op, t, vi, 'tb') },
          { id: 'limpar', rotulo: 'Limpar conteúdo', acao: () => limparLinhaPlantio(op, t, vi) });
      }
      abrirMenuContexto(linhaPl, e.clientX || caixaLinha.left + 24, e.clientY || caixaLinha.bottom, `Linha do ${t}`, itens);
      return;
    }
    const guia = e.target.closest('.guia[data-grupo]');
    const nomeOp = !listaRecolhida() && e.target.closest('.ops-item__nome[data-op]');
    const ancora = guia || nomeOp;
    if (!ancora) return;
    e.preventDefault();
    // Pelo teclado o evento vem sem coordenadas: abre junto do elemento
    const caixa = ancora.getBoundingClientRect();
    const x = e.clientX || caixa.left;
    const y = e.clientY || (guia ? caixa.top : caixa.bottom);

    if (guia) {
      const grupo = plano.grupos.find((g) => g.id === guia.dataset.grupo);
      if (!grupo) return;
      abrirMenuContexto(ancora, x, y, `Grupo ${grupo.nome}`, [
        { id: 'inserir', rotulo: 'Inserir', acao: () => sairDaReceita(novoGrupo) },
        { id: 'excluir', rotulo: 'Excluir', acao: () => sairDaReceita(() => excluirGrupo(grupo)) },
        { id: 'renomear', rotulo: 'Renomear', acao: () => sairDaReceita(() => {
          ui.grupoId = grupo.id; ui.renomeandoOp = null;
          limparSelecao(); pararRenomearNaLista();
          ui.renomeandoGrupo = grupo.id;
          desenharTudo();
        }) }
      ]);
    } else {
      const grupo = grupoAtual();
      const op = grupo.operacoes.find((o) => o.id === nomeOp.dataset.op);
      if (!op) return;
      abrirMenuContexto(ancora, x, y, op.nome, itensMenuOperacao(grupo, op));
    }
  }

  // itens: [{ id, rotulo, icone, perigo, separar, acao }], na ordem do menu. yAcima: onde o menu termina quando
  // sobe (o ⋯ passa o topo dele; no botão direito, o ponto do clique)
  function abrirMenuContexto(ancora, x, y, rotulo, itensMenu, yAcima = y) {
    fecharMenuContexto();
    const menu = document.createElement('div');
    menu.className = 'menu-contexto';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', rotulo);
    menu.innerHTML = itensMenu.map((i) => `
      ${i.separar ? '<hr class="menu-contexto__separador" role="separator">' : ''}
      <button class="menu-contexto__item ${i.perigo ? 'menu-contexto__item--perigo' : ''}" type="button" role="menuitem"
              data-item="${i.id}">${i.icone || ''}${i.rotulo}</button>`).join('');
    document.body.appendChild(menu);

    // Abre no ponto do clique (ou logo abaixo do ⋯); sobe quando não cabe embaixo (caso das guias, no rodapé)
    const { width, height } = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - width - 8))}px`;
    menu.style.top = `${y + height + 8 > window.innerHeight ? Math.max(8, yAcima - height) : y}px`;
    if (ancora.hasAttribute('aria-haspopup')) ancora.setAttribute('aria-expanded', 'true');

    const itens = [...menu.querySelectorAll('.menu-contexto__item')];
    const fecharFora = (ev) => { if (!menu.contains(ev.target)) fecharMenuContexto(); };
    const fecharSemFoco = () => fecharMenuContexto();

    menu.addEventListener('click', (ev) => {
      const item = ev.target.closest('[data-item]');
      if (!item) return;
      fecharMenuContexto();
      itensMenu.find((i) => i.id === item.dataset.item).acao();
    });
    menu.addEventListener('keydown', (ev) => {
      const i = itens.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); itens[(i + 1) % itens.length].focus(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); itens[(i - 1 + itens.length) % itens.length].focus(); }
      else if (ev.key === 'Escape' || ev.key === 'Tab') {
        ev.preventDefault(); fecharMenuContexto();
        if (ancora.isConnected) ancora.focus();
      }
    });
    document.addEventListener('mousedown', fecharFora, true);
    window.addEventListener('resize', fecharSemFoco);
    window.addEventListener('scroll', fecharSemFoco, true);

    menuContexto = { menu, ancora, fecharFora, fecharSemFoco };
    itens[0].focus();
  }

  function fecharMenuContexto() {
    if (!menuContexto) return;
    document.removeEventListener('mousedown', menuContexto.fecharFora, true);
    window.removeEventListener('resize', menuContexto.fecharSemFoco);
    window.removeEventListener('scroll', menuContexto.fecharSemFoco, true);
    menuContexto.menu.remove();
    if (menuContexto.ancora.hasAttribute('aria-haspopup')) menuContexto.ancora.setAttribute('aria-expanded', 'false');
    menuContexto = null;
  }

  function salvarNomeGrupo(valor) {
    if (!ui.renomeandoGrupo) return;
    const grupo = plano.grupos.find((g) => g.id === ui.renomeandoGrupo);
    ui.renomeandoGrupo = null;
    // Nome repetido (outro grupo com o mesmo nome) volta ao anterior, com aviso
    const repetido = grupo && plano.grupos.some((g) => g !== grupo && Util.normalizar(g.nome) === Util.normalizar(valor.trim()));
    if (repetido) Aviso.mostrar('Já existe um grupo de operações com esse nome.');
    else if (grupo && valor.trim() && valor.trim() !== grupo.nome) { grupo.nome = valor.trim(); alterou(); }
    desenharTudo();
  }

  // Arrastar guia reordena os grupos
  let arrastando = null;
  function aoArrastar(e) {
    const guia = e.target.closest('[data-grupo]');
    if (!guia) return;
    arrastando = guia.dataset.grupo;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', arrastando);
  }
  function aoArrastarSobre(e) {
    const guia = e.target.closest('[data-grupo]');
    if (!guia || !arrastando) return;
    e.preventDefault();
    raiz.querySelectorAll('.guia--alvo').forEach((g) => g.classList.remove('guia--alvo'));
    if (guia.dataset.grupo !== arrastando) guia.classList.add('guia--alvo');
  }
  function aoSoltar(e) {
    const guia = e.target.closest('[data-grupo]');
    if (!guia || !arrastando) return;
    e.preventDefault();
    const de = plano.grupos.findIndex((g) => g.id === arrastando);
    const para = plano.grupos.findIndex((g) => g.id === guia.dataset.grupo);
    arrastando = null;
    if (de < 0 || para < 0 || de === para) { desenharTudo(); return; }
    const [movido] = plano.grupos.splice(de, 1);
    plano.grupos.splice(para, 0, movido);
    alterou(); desenharTudo();
  }

  // Voltar e Avançar do navegador (a troca de endereço não dá para impedir): a casca pergunta antes de sair
  const temAlteracaoPendente = () => !!(ui && ui.painelEdicao && ui.painelEdicao.alterado && raiz && raiz.isConnected);

  return { desenhar, aoMostrar, temAlteracaoPendente, confirmarSaida: (seguir) => confirmarDescartePainel(seguir) };
})();
