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
        <button class="botao botao--primario" type="button" data-acao="criar-plano">
          ${Icones.mais} Criar Plano Safra
        </button>
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

        <section aria-labelledby="titulo-visao-geral">
          <h2 class="secao__titulo" id="titulo-visao-geral">Visão geral</h2>
          <div class="indicadores" id="lp-indicadores"></div>
        </section>

        <section aria-labelledby="titulo-planos">
          <h2 class="secao__titulo" id="titulo-planos">Planos de Safra</h2>
          <div class="cartao tabela-rolagem">
            <table class="tabela">
              <thead>
                <tr>
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
  }

  function planosFiltrados() {
    return DADOS.planos.filter((p) =>
      ['safra', 'empresa', 'fazenda', 'cultura'].every((campo) => !filtros[campo] || p[campo] === filtros[campo]));
  }

  function atualizar(conteudo) {
    const planos = planosFiltrados();
    conteudo.querySelector('#lp-indicadores').innerHTML = indicadores(planos);
    conteudo.querySelector('#lp-linhas').innerHTML = planos.length
      ? planos.map(linha).join('')
      : `<tr><td class="tabela__vazia" colspan="11">Nenhum plano encontrado com esses filtros.</td></tr>`;
  }

  // ----- Indicadores, sempre calculados sobre os planos filtrados -----
  function indicadores(planos) {
    const area = planos.reduce((soma, p) => soma + Util.areaPlano(p), 0);
    const comCusto = planos.filter((p) => p.custo !== null && p.custo !== undefined);
    const comReceita = planos.filter((p) => p.receita !== null && p.receita !== undefined);
    const soma = (lista, campo) => lista.reduce((s, p) => s + p[campo], 0);

    return `
      ${indicador('area', Icones.broto, 'Área planejada', Util.area(area),
        `${planos.length} ${planos.length === 1 ? 'plano cadastrado' : 'planos cadastrados'}`)}
      ${indicador('custo', Icones.moedas, 'Custo estimado',
        comCusto.length ? Util.reaisResumido(soma(comCusto, 'custo')) : '—',
        comCusto.length ? planosComValor(comCusto.length, planos.length) : 'Aguardando orçamento')}
      ${indicador('receita', Icones.grafico, 'Receita projetada',
        comReceita.length ? Util.reaisResumido(soma(comReceita, 'receita')) : '—',
        comReceita.length ? planosComValor(comReceita.length, planos.length) : 'Aguardando premissas de produção')}
    `;
  }

  // Quando só parte dos planos tem valor, avisa quantos entraram na soma
  function planosComValor(com, total) {
    return com === total ? `Soma de ${total} ${total === 1 ? 'plano' : 'planos'}` : `Soma de ${com} de ${total} planos`;
  }

  function indicador(tipo, icone, titulo, valor, dica) {
    return `
      <div class="cartao indicador indicador--${tipo}">
        <span class="indicador__icone">${icone}</span>
        <div>
          <p class="indicador__titulo">${titulo}</p>
          <p class="indicador__valor">${valor}</p>
          <p class="indicador__dica">${dica}</p>
        </div>
      </div>
    `;
  }

  // ----- Lista -----
  function linha(p) {
    const aprovado = p.status === 'Aprovado';
    return `
      <tr>
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
