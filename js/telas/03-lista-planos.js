/*
 * Tela 03 — Lista de planos (docs/telas/03-lista-planos.md)
 * Aparece no menu "Plano de Safra" quando existe ao menos um plano.
 */
window.Telas = window.Telas || {};

window.Telas.listaPlanos = (function () {
  const esc = Util.escapar;

  // Filtros: Safra começa na mais recente cadastrada; os demais em "Todas" ('')
  let filtros = {};

  function desenhar() {
    filtros = { safra: Util.safraMaisRecente(DADOS.safras), empresa: '', fazenda: '', cultura: '' };

    return `
      <header class="cabecalho">
        <h1 class="cabecalho__titulo">Plano de Safra</h1>
      </header>

      <div class="pagina">
        <section class="cartao filtros" aria-labelledby="titulo-filtros">
          <h2 class="secao__titulo" id="titulo-filtros">Filtrar planos</h2>
          <div class="filtros__grade">
            ${filtro('safra', 'Safra', DADOS.safras)}
            ${filtro('empresa', 'Empresa', DADOS.empresas)}
            ${filtro('fazenda', 'Fazenda', DADOS.fazendas)}
            ${filtro('cultura', 'Cultura', DADOS.culturas)}
          </div>
        </section>

        <section aria-labelledby="titulo-planos">
          <div class="secao__topo">
            <h2 class="secao__titulo" id="titulo-planos">Planos de Safra</h2>
            <button class="botao botao--primario" type="button" data-acao="criar-plano">
              ${Icones.mais} Criar Plano Safra
            </button>
          </div>
          <div class="cartao tabela-rolagem">
            <table class="tabela">
              <thead>
                <tr>
                  <th class="lista-planos__menu"><span class="so-leitor">Mais ações</span></th>
                  <th>Safra</th><th>Empresa</th><th>Fazenda</th><th>Cultura</th>
                  <th class="tabela__numero">Área</th>
                  <th class="tabela__numero">Custo estimado</th>
                  <th class="tabela__numero">Receita projetada</th>
                  <th>Status</th><th>Última atualização</th><th>Atualizado por</th>
                  <th><span class="so-leitor">Abrir</span></th>
                </tr>
              </thead>
              <tbody id="lp-linhas"></tbody>
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
    atualizar(conteudo);
    // Menu do plano: botão direito na linha ou o botão ⋯ no começo da linha (Excluir · Exportar · Abrir)
    conteudo.addEventListener('contextmenu', (e) => {
      const tr = e.target.closest('tr[data-plano]');
      if (!tr || e.target.closest('a, button')) return;
      e.preventDefault();
      abrirMenuPlano(Number(tr.dataset.plano), e.target, e.clientX, e.clientY);
    });
    conteudo.addEventListener('click', (e) => {
      const botao = e.target.closest('[data-menu-plano]');
      if (!botao) return;
      const caixa = botao.getBoundingClientRect();
      abrirMenuPlano(Number(botao.dataset.menuPlano), botao, caixa.left, caixa.bottom + 4);
    });
  }

  // ----- Menu do plano -----
  let menuAberto = null;
  function abrirMenuPlano(id, ancora, x, y) {
    fecharMenuPlano();
    const p = DADOS.planos.find((x) => x.id === id);
    if (!p) return;
    const menu = document.createElement('div');
    menu.className = 'menu-contexto';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', `Plano ${p.safra} · ${p.fazenda}`);
    // Excluir só para plano em construção; no aprovado aparece desabilitado, com o motivo
    const aprovado = p.status === 'Aprovado';
    menu.innerHTML = [['excluir', 'Excluir'], ['exportar', 'Exportar (.xlsx)'], ['abrir', 'Abrir']]
      .map(([item, rotulo]) => {
        const bloqueado = item === 'excluir' && aprovado;
        return `<button class="menu-contexto__item ${item === 'excluir' ? 'menu-contexto__item--perigo' : ''}" type="button" role="menuitem" data-item="${item}"
                  ${bloqueado ? 'aria-disabled="true" title="Plano aprovado não pode ser excluído"' : ''}>${rotulo}${bloqueado
                  ? '<span class="menu-contexto__motivo">Plano aprovado não pode ser excluído</span>' : ''}</button>`;
      }).join('');
    document.body.appendChild(menu);
    const { width, height } = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - width - 8))}px`;
    menu.style.top = `${y + height + 8 > window.innerHeight ? Math.max(8, y - height) : y}px`;
    const itens = [...menu.querySelectorAll('[data-item]')];
    const fora = (ev) => { if (!menu.contains(ev.target)) fecharMenuPlano(); };
    menu.addEventListener('click', (ev) => {
      const item = ev.target.closest('[data-item]');
      if (!item || item.getAttribute('aria-disabled') === 'true') return;
      fecharMenuPlano();
      if (item.dataset.item === 'abrir') location.hash = `#/plano/${p.id}`;
      else if (item.dataset.item === 'exportar') ArquivoPlano.exportar(p);
      else excluirPlano(p);
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

  // Excluir plano (só em construção): confirmação; sem nenhum plano, volta ao primeiro uso (Tela 01)
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

  function planosFiltrados() {
    return DADOS.planos.filter((p) =>
      ['safra', 'empresa', 'fazenda', 'cultura'].every((campo) => !filtros[campo] || p[campo] === filtros[campo]));
  }

  function atualizar(conteudo) {
    const planos = planosFiltrados();
    conteudo.querySelector('#lp-linhas').innerHTML = planos.length
      ? planos.map(linha).join('')
      : `<tr><td class="tabela__vazia" colspan="12">Nenhum plano encontrado com esses filtros.</td></tr>`;
  }

  // ----- Lista -----
  function linha(p) {
    const aprovado = p.status === 'Aprovado';
    return `
      <tr data-plano="${p.id}">
        <td class="lista-planos__menu">
          <button class="botao-icone" type="button" data-menu-plano="${p.id}" title="Mais ações"
                  aria-haspopup="menu" aria-label="Mais ações do plano ${esc(p.safra)} · ${esc(p.fazenda)}">${Icones.mais_opcoes}</button>
        </td>
        <td>${esc(p.safra)}</td>
        <td>${esc(p.empresa)}</td>
        <td>${esc(p.fazenda)}</td>
        <td>${esc(p.cultura)}</td>
        <td class="tabela__numero">${Util.area(Util.areaPlano(p))}</td>
        <td class="tabela__numero">${Util.reaisResumido(p.custo)}</td>
        <td class="tabela__numero">${Util.reaisResumido(p.receita)}</td>
        <td><span class="status ${aprovado ? 'status--aprovado' : 'status--construcao'}">${p.status}</span></td>
        <td>${Util.data(p.atualizadoEm)}</td>
        <td>${esc(p.atualizadoPor)}</td>
        <td class="tabela__acao">
          <a class="botao-icone" href="#/plano/${p.id}" title="Abrir plano"
             aria-label="Abrir plano ${esc(p.safra)} · ${esc(p.fazenda)}">${Icones.seta}</a>
        </td>
      </tr>
    `;
  }

  function filtro(nome, rotulo, itens) {
    return `
      <div class="campo">
        <label class="campo__rotulo" for="lp-${nome}">${rotulo}</label>
        <select class="campo__controle" id="lp-${nome}" data-filtro="${nome}">
          <option value="">Todas</option>
          ${itens.map((item) => `<option value="${esc(item)}" ${item === filtros[nome] ? 'selected' : ''}>${esc(item)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  return { desenhar, aoMostrar };
})();
