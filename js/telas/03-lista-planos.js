/*
 * Tela 03 — Visão Geral, lista de planos (docs/telas/03-lista-planos.md)
 * Aparece no menu Plano de Safra › Visão Geral quando existe ao menos um plano.
 * Duas guias com os mesmos filtros: Planos de Safra (o Painel: Telas.painelPlanos, uma linha por fazenda e safra)
 * e Histórico de versões (uma linha por versão de cada plano).
 */
window.Telas = window.Telas || {};

window.Telas.listaPlanos = (function () {
  const esc = Util.escapar;

  // Filtros, os mesmos nas duas guias (Status só no Histórico). Ano Agrícola (junta as safras e
  // safrinhas do ano) começa no de hoje, ou no mais recente com planos; os demais em "Todas"/"Todos" ('').
  // ciclo: Safra ou Safrinha (o filtro "Safra")
  const CAMPOS_FILTRO = ['anoAgricola', 'atividade', 'ciclo', 'empresa', 'fazenda', 'cultura', 'status'];
  const CICLOS = ['Safra', 'Safrinha'];
  const STATUS = [['nao-iniciado', 'Não iniciado'], ['construcao', 'Em construção'], ['publicada', 'Publicada']];
  let filtros = {};
  const filtrosIniciais = () => ({ anoAgricola: Util.anoAgricolaInicial(Telas.painelPlanos.anos()), atividade: '', ciclo: '', empresa: '', fazenda: '', cultura: '', status: '' });

  // Opções de cada filtro: só os valores que aparecem nos planos da lista (na ordem do cadastro)
  const valorDe = (p, campo) => (campo === 'anoAgricola' ? String(Util.anoAgricola(p.safra))
    : campo === 'ciclo' ? Telas.painelPlanos.cicloDe(p)
    : campo !== 'status' ? p[campo] : Versoes.aIniciar(p) ? 'nao-iniciado' : Versoes.deTrabalho(p).status);
  function presentes(campo, cadastro) {
    const naLista = new Set(DADOS.planos.map((p) => valorDe(p, campo)));
    // Empresa e Fazenda: também as fazendas de cada empresa, que aparecem no Painel ainda sem plano
    const extras = Telas.painelPlanos.empresasEFazendas();
    if (campo === 'empresa') extras.empresas.forEach((e) => naLista.add(e));
    if (campo === 'fazenda') extras.fazendas.forEach((f) => naLista.add(f));
    // Status: também os das versões antigas (aparecem na guia Histórico de versões)
    if (campo === 'status') DADOS.planos.forEach((p) => Versoes.lista(p).forEach((v) => naLista.add(statusVersao(p, v))));
    return cadastro.filter((item) => naLista.has(Array.isArray(item) ? item[0] : item));
  }

  // Safra que a lista deve mostrar na próxima vez que for desenhada (ex.: a dos planos recém-criados): o filtro
  // vai para o ano agrícola dela, na guia Planos de Safra
  let safraPedida = null;
  function mostrarSafra(safra) { safraPedida = safra; guia = 'painel'; }

  // Guia aberta: 'painel' (Planos de Safra) ou 'historico' (Histórico de versões).
  // Abre em Planos de Safra; a guia escolhida se mantém ao navegar.
  const GUIAS = [['painel', 'Planos de Safra'], ['historico', 'Histórico de versões']];
  let guia = 'painel';
  // Status de uma versão: a 0.1 de um plano ainda não iniciado aparece como "Não iniciado"
  const statusVersao = (p, v) => (Versoes.aIniciar(p) ? 'nao-iniciado' : v.status);

  function desenhar() {
    filtros = filtrosIniciais();
    if (safraPedida) { filtros.anoAgricola = String(Util.anoAgricola(safraPedida)); safraPedida = null; }

    return `
      <header class="cabecalho cabecalho--guias">
        <h1 class="cabecalho__titulo">Visão Geral</h1>
        <nav class="etapas" aria-label="Guias da Visão Geral">
          ${GUIAS.map(([id, nome]) => `
            <button class="etapa ${id === guia ? 'etapa--ativa' : ''}" type="button" data-guia="${id}"
                    ${id === guia ? 'aria-current="page"' : ''}>${nome}</button>`).join('')}
        </nav>
      </header>

      <div class="pagina">
        <section class="cartao filtros" aria-label="Filtrar planos">
          ${filtro('anoAgricola', 'Ano Agrícola', Telas.painelPlanos.anos())}
          ${filtro('atividade', 'Atividade produtiva', presentes('atividade', DADOS.atividades))}
          ${filtro('ciclo', 'Safra', presentes('ciclo', CICLOS))}
          ${filtro('empresa', 'Empresa', presentes('empresa', DADOS.empresas))}
          ${filtro('fazenda', 'Fazenda', presentes('fazenda', DADOS.fazendas))}
          ${filtro('cultura', 'Cultura', presentes('cultura', DADOS.culturasPlanos))}
          ${filtro('status', 'Status', presentes('status', STATUS), 'Todos')}
          <button class="link-acao filtros__limpar" type="button" data-acao="lp-limpar">${Icones.limpar} Limpar filtros</button>
        </section>

        ${Telas.painelPlanos.desenhar()}

        <section class="cartao lista-planos" aria-labelledby="titulo-historico" data-guia-painel="historico" ${guia === 'historico' ? '' : 'hidden'}>
          <div class="secao__topo lista-planos__topo">
            <h2 class="secao__titulo" id="titulo-historico">Histórico de versões</h2>
          </div>
          <div class="tabela-rolagem">
            <table class="tabela">
              <thead>
                <tr>
                  <th>Safra</th><th>Empresa</th><th>Atividade</th><th>Cultura</th><th>Fazenda</th>
                  <th>Versão</th><th>Status</th><th>Última atualização</th><th>Atualizado por</th>
                </tr>
              </thead>
              <tbody id="lp-historico"></tbody>
            </table>
          </div>
        </section>
      </div>
    `;
  }

  // Depois que o HTML está na página: liga os filtros e desenha números e lista
  function aoMostrar(conteudo) {
    conteudo.querySelectorAll('[data-filtro]').forEach((select) => {
      select.addEventListener('change', () => {
        filtros[select.dataset.filtro] = select.value;
        atualizar(conteudo);
      });
    });
    // Limpar filtros: volta ao começo (Ano Agrícola de hoje; os demais em Todas/Todos)
    conteudo.querySelector('[data-acao="lp-limpar"]').addEventListener('click', () => {
      filtros = filtrosIniciais();
      conteudo.querySelectorAll('[data-filtro]').forEach((select) => { select.value = filtros[select.dataset.filtro]; });
      atualizar(conteudo);
    });
    atualizar(conteudo);
    trocarGuia(conteudo, guia);
    Telas.painelPlanos.ligar(conteudo, { abrirPlano, abrirMenuPlano, abrirMenuSemPlano });
    // Guias: troca o painel sem desenhar a tela de novo (os filtros continuam)
    conteudo.querySelector('.cabecalho--guias').addEventListener('click', (e) => {
      const botao = e.target.closest('[data-guia]');
      if (botao) trocarGuia(conteudo, botao.dataset.guia);
    });
    // Histórico: clicar na linha (ou Enter) abre aquela versão
    const historico = conteudo.querySelector('[data-guia-painel="historico"]');
    const abrirDaLinha = (tr) => abrirVersao(DADOS.planos.find((x) => x.id === Number(tr.dataset.plano)), tr.dataset.versao);
    historico.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-versao]');
      if (tr) abrirDaLinha(tr);
    });
    historico.addEventListener('keydown', (e) => {
      const tr = e.target.closest('tr[data-versao]');
      if (tr && e.target === tr && e.key === 'Enter') abrirDaLinha(tr);
    });
  }

  // ----- Menu do plano -----
  let menuAberto = null;

  // Painel, fazenda sem plano: o ⋯ tem só "Criar plano", que abre o modal com safra, empresa e fazenda preenchidas
  function abrirMenuSemPlano({ safra, empresa, fazenda }, ancora, x, y) {
    fecharMenuPlano();
    const menu = document.createElement('div');
    menu.className = 'menu-contexto';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', `Fazenda ${fazenda} sem plano`);
    menu.innerHTML = '<button class="menu-contexto__item" type="button" role="menuitem" data-item="criar">Criar plano</button>';
    mostrarMenu(menu, ancora, x, y, true, () => Telas.criarPlano({ safra, empresa, fazenda }));
  }

  // alinharDireita: o menu termina em x (usado pelo ⋯, que fica no fim da linha)
  function abrirMenuPlano(id, ancora, x, y, alinharDireita = false) {
    fecharMenuPlano();
    const p = DADOS.planos.find((x) => x.id === id);
    if (!p) return;
    const menu = document.createElement('div');
    menu.className = 'menu-contexto';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', `Plano ${p.safra} · ${p.fazenda}`);
    // Abrir · Criar nova versão · Histórico de versões · Exportar XLSX · (separador) · Excluir plano
    // Criar nova versão: a partir da última publicada; desabilitado quando já há uma versão em construção.
    // Excluir plano: permitido enquanto o plano não gerou OS (no protótipo ainda não há OS).
    const construcao = Versoes.emConstrucao(p);
    const publicada = Versoes.ultimaPublicada(p);
    const item = (id, rotulo, { motivo = '', bloqueado = false, perigo = false } = {}) => `
      <button class="menu-contexto__item ${perigo ? 'menu-contexto__item--perigo' : ''}" type="button" role="menuitem" data-item="${id}"
              ${bloqueado ? `aria-disabled="true" title="${esc(motivo)}"` : ''}>${rotulo}${motivo
              ? `<span class="menu-contexto__motivo">${esc(motivo)}</span>` : ''}</button>`;
    menu.innerHTML = [
      item('abrir', 'Abrir'),
      item('nova-versao', 'Criar nova versão', Versoes.aIniciar(p)
        ? { motivo: 'O plano ainda não foi iniciado', bloqueado: true }
        : construcao ? { motivo: `A versão ${construcao.num} já está em construção`, bloqueado: true }
        : { motivo: `A partir da versão ${publicada.num}, publicada` }),
      item('historico', 'Histórico de versões'),
      item('exportar', 'Exportar XLSX'),
      '<hr class="menu-contexto__separador">',
      item('excluir', 'Excluir plano', { perigo: true })
    ].join('');
    mostrarMenu(menu, ancora, x, y, alinharDireita, (acao) => {
      if (acao === 'abrir') abrirPlano(p);
      else if (acao === 'nova-versao') criarNovaVersao(p);
      else if (acao === 'historico') verHistorico(p);
      else if (acao === 'exportar') ArquivoPlano.exportar(p);
      else excluirPlano(p);
    });
  }

  // Põe o menu na tela (perto de x, y), com teclado e clique fora; aoEscolher recebe o data-item escolhido
  function mostrarMenu(menu, ancora, x, y, alinharDireita, aoEscolher) {
    document.body.appendChild(menu);
    const { width, height } = menu.getBoundingClientRect();
    if (alinharDireita) x -= width;
    menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - width - 8))}px`;
    menu.style.top = `${y + height + 8 > window.innerHeight ? Math.max(8, y - height) : y}px`;
    const itens = [...menu.querySelectorAll('[data-item]')];
    const fora = (ev) => { if (!menu.contains(ev.target)) fecharMenuPlano(); };
    menu.addEventListener('click', (ev) => {
      const item = ev.target.closest('[data-item]');
      if (!item || item.getAttribute('aria-disabled') === 'true') return;
      fecharMenuPlano();
      aoEscolher(item.dataset.item);
    });
    menu.addEventListener('keydown', (ev) => {
      const i = itens.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); itens[(i + 1) % itens.length].focus(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); itens[(i - 1 + itens.length) % itens.length].focus(); }
      else if (ev.key === 'Escape' || ev.key === 'Tab') { ev.preventDefault(); fecharMenuPlano(); if (ancora.isConnected) ancora.focus(); }
    });
    document.addEventListener('mousedown', fora, true);
    menuAberto = { menu, fora };
    itens[0].focus();
  }

  function trocarGuia(conteudo, nova) {
    guia = nova;
    conteudo.querySelectorAll('[data-guia]').forEach((b) => {
      const ativa = b.dataset.guia === guia;
      b.classList.toggle('etapa--ativa', ativa);
      if (ativa) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    conteudo.querySelectorAll('[data-guia-painel]').forEach((painel) => { painel.hidden = painel.dataset.guiaPainel !== guia; });
    // Status não vale para o Painel (os números já separam por status)
    const status = conteudo.querySelector('[data-filtro="status"]');
    if (status) status.closest('.campo').hidden = guia === 'painel';
  }

  // "Histórico de versões" do menu ⋯: a guia Histórico, com os filtros naquele plano
  function verHistorico(p) {
    const conteudo = document.getElementById('conteudo');
    filtros = { anoAgricola: valorDe(p, 'anoAgricola'), atividade: p.atividade || '', ciclo: valorDe(p, 'ciclo'), empresa: p.empresa, fazenda: p.fazenda, cultura: p.cultura, status: '' };
    conteudo.querySelectorAll('[data-filtro]').forEach((select) => { select.value = filtros[select.dataset.filtro]; });
    atualizar(conteudo);
    trocarGuia(conteudo, 'historico');
  }

  // Abrir uma versão pelo Histórico. Plano não iniciado: o modal de início.
  function abrirVersao(p, num) {
    if (Versoes.aIniciar(p)) { abrirPlano(p); return; }
    if (num !== p.versaoAberta) Versoes.abrir(p, num);
    location.hash = `#/plano/${p.id}`;
  }

  // Abrir um plano. Ainda não iniciado (só a 0.1, vazia): primeiro o modal "Como deseja iniciar o plano?";
  // ao começar, nasce a 0.2 em construção e o plano abre na aba Operações.
  function abrirPlano(p) {
    if (!Versoes.aIniciar(p)) {
      prepararAbrir(p);
      location.hash = `#/plano/${p.id}`;
      return;
    }
    Telas.inicioPlano.abrir(p, {
      aoComecar: (grupos, aviso) => {
        Versoes.comecar(p, grupos);
        // O aviso entra depois da troca de tela (a troca apaga o aviso anterior)
        if (aviso) window.addEventListener('hashchange', () => Aviso.mostrar(aviso), { once: true });
        location.hash = `#/plano/${p.id}/operacoes`;
      }
    });
  }

  // Abrir pela lista: vai para a versão de trabalho. Se ela já está aberta, nada muda
  // (alterações não salvas da versão em construção continuam na área de trabalho).
  function prepararAbrir(p) {
    const trabalho = Versoes.deTrabalho(p);
    if (trabalho && trabalho.num !== p.versaoAberta) Versoes.abrir(p, trabalho.num);
  }

  // Criar nova versão pela lista: a partir da última publicada, já aberta no Planejamento
  function criarNovaVersao(p) {
    const r = Versoes.criarNova(p, Versoes.ultimaPublicada(p).num);
    if (r.jaExiste) return;
    location.hash = `#/plano/${p.id}`;
    Aviso.mostrar(`Versão ${r.num} criada a partir da ${r.origem}`);
  }

  // Excluir plano: confirmação; sem nenhum plano, volta ao primeiro uso (Tela 01)
  function excluirPlano(p) {
    Modal.confirmar({
      titulo: 'Excluir plano?',
      texto: `<strong>${esc(p.cultura)} · Safra ${esc(p.safra)} · Fazenda ${esc(p.fazenda)}</strong><br>
              As operações, recomendações e talhões planejados desse plano serão apagados. Essa ação não pode ser desfeita.`,
      botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Excluir plano', classe: 'perigo', acao: () => {
        DADOS.planos.splice(DADOS.planos.indexOf(p), 1);
        window.dispatchEvent(new HashChangeEvent('hashchange')); // redesenha a tela (lista ou primeiro uso)
        Aviso.mostrar('Plano excluído');
      } }]
    });
  }

  function fecharMenuPlano() {
    if (!menuAberto) return;
    document.removeEventListener('mousedown', menuAberto.fora, true);
    menuAberto.menu.remove();
    menuAberto = null;
  }

  const porTexto = (a, b) => a.localeCompare(b, 'pt-BR');

  function atualizar(conteudo) {
    const versoes = versoesFiltradas();
    conteudo.querySelector('#lp-historico').innerHTML = versoes.length
      ? versoes.map(linhaVersao).join('')
      : `<tr><td class="tabela__vazia" colspan="9">Nenhuma versão encontrada com esses filtros.</td></tr>`;
    Telas.painelPlanos.atualizar(conteudo, filtros);
  }

  // ----- Histórico de versões -----
  // Uma linha por versão. Planos na ordem Safra (mais recente primeiro), Fazenda e Cultura; versões da mais nova
  // para a mais antiga. O filtro Status vale para o status de cada versão.
  function versoesFiltradas() {
    const campos = CAMPOS_FILTRO.filter((c) => c !== 'status');
    return DADOS.planos
      .filter((p) => campos.every((campo) => !filtros[campo] || valorDe(p, campo) === filtros[campo]))
      .sort((a, b) => porTexto(b.safra, a.safra) || porTexto(a.fazenda, b.fazenda) || porTexto(a.cultura, b.cultura))
      .flatMap((p) => [...Versoes.lista(p)].reverse().map((v) => ({ p, v })))
      .filter(({ p, v }) => !filtros.status || statusVersao(p, v) === filtros.status);
  }

  // Última atualização da versão: em construção, o último "Salvar alterações"; publicada, a publicação
  function linhaVersao({ p, v }) {
    const status = statusVersao(p, v);
    const quando = status === 'construcao' ? v.salvaEm : v.publicadaEm;
    const quem = status === 'construcao' ? v.salvaPor : v.publicadaPor;
    const rotulo = { 'nao-iniciado': 'Não iniciado', construcao: 'Em construção', publicada: 'Publicada' }[status];
    const classe = { 'nao-iniciado': 'status--nao-iniciado', construcao: 'status--construcao', publicada: 'status--aprovado' }[status];
    return `
      <tr class="lista-planos__linha" data-plano="${p.id}" data-versao="${esc(v.num)}" tabindex="0"
          title="Abrir a versão ${esc(v.num)}${status === 'publicada' ? ' (publicada, em consulta)' : ''}"
          aria-label="Abrir plano ${esc(p.safra)} · ${esc(p.fazenda)}, versão ${esc(v.num)}">
        <td>${esc(p.safra)}</td>
        <td>${esc(p.empresa)}</td>
        <td>${esc(p.atividade || '—')}</td>
        <td>${esc(p.cultura)}</td>
        <td>${esc(p.fazenda)}</td>
        <td>${esc(v.num)}</td>
        <td><span class="status ${classe}">${rotulo}</span></td>
        <td>${quando ? new Date(quando).toLocaleDateString('pt-BR') : '—'}</td>
        <td>${esc(quem || '—')}</td>
      </tr>`;
  }

  // itens: textos ou pares [valor, rótulo]
  function filtro(nome, rotulo, itens, todos = 'Todas') {
    return `
      <div class="campo">
        <label class="campo__rotulo" for="lp-${nome}">${rotulo}</label>
        <select class="campo__controle" id="lp-${nome}" data-filtro="${nome}">
          <option value="">${todos}</option>
          ${itens.map((item) => {
            const [valor, texto] = Array.isArray(item) ? item : [item, item];
            return `<option value="${esc(valor)}" ${valor === filtros[nome] ? 'selected' : ''}>${esc(texto)}</option>`;
          }).join('')}
        </select>
      </div>
    `;
  }

  return { desenhar, aoMostrar, mostrarSafra, abrirPlano };
})();
