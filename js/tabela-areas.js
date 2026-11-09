/*
 * Tabela de talhões com a área planejada (09/11/2026): Criar Plano de Safra (etapa Definir o plano) e Editar talhões.
 * Colunas: Talhão (caixa de marcar; no cabeçalho, marca ou desmarca todos) · Área cadastrada · Área planejada (lápis).
 * A área planejada começa igual à cadastrada; vale de 0,1 ha até a área cadastrada (DECISOES 4.2). Talhão desmarcado
 * fica fora do plano ("—"). No pé, a Área planejada total: "275 / 300 ha · 91,7% da área cadastrada".
 *
 * est = { todos: [{ nome, area }] (cadastro da fazenda), marcados: Set, areas: { nome: ha } (só as diferentes da
 *         cadastrada), editando: nome | null, erro: '' }
 * opcoes (Editar talhões): antes (talhões que já estavam no plano), areasAntes, planejado(nome) (já tem planejamento)
 *
 * TabelaAreas.html(est, opcoes) desenha; TabelaAreas.ligar(caixa, est, redesenhar) trata cliques, teclas e caixas.
 */
window.TabelaAreas = (function () {
  const esc = Util.escapar;
  // Área com até uma casa decimal: "120 ha", "58,6 ha"
  const fmt = (ha) => `${Number(ha).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha`;
  const numero = (ha) => Number(ha).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  const areaDe = (est, t) => (est.areas[t.nome] ?? t.area);
  const total = (est) => est.todos.filter((t) => est.marcados.has(t.nome)).reduce((s, t) => s + areaDe(est, t), 0);
  const cadastrada = (est) => est.todos.reduce((s, t) => s + t.area, 0);

  function html(est, opcoes = {}) {
    const antes = opcoes.antes || null;
    const tudo = est.todos.length && est.todos.every((t) => est.marcados.has(t.nome));
    const parte = est.marcados.size && !tudo;
    const soma = total(est);
    const cad = cadastrada(est);
    return `
      <div class="ta">
        <div class="ta__rolagem">
          <table class="ta__tabela">
            <thead><tr>
              <th><label class="ta__marcar"><input type="checkbox" data-ta-todos ${tudo ? 'checked' : ''} ${parte ? 'data-ta-parte' : ''}
                aria-label="Marcar todos os talhões"> Talhão</label></th>
              <th class="ta__num">Área cadastrada</th>
              <th class="ta__num">Área planejada</th>
            </tr></thead>
            <tbody>${est.todos.map((t) => linha(est, t, antes, opcoes)).join('')}</tbody>
          </table>
        </div>
        <div class="ta__total">
          <span>Área planejada total</span>
          <span class="ta__total-valor"><strong>${numero(soma)} / ${fmt(cad)}</strong>
            <small>${cad ? `${(soma / cad * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da área cadastrada` : ''}</small></span>
        </div>
      </div>`;
  }

  function linha(est, t, antes, opcoes) {
    const marcado = est.marcados.has(t.nome);
    const estava = antes ? antes.includes(t.nome) : null;
    const sai = antes && estava && !marcado;
    const entra = antes && !estava && marcado;
    const planejado = antes && estava && opcoes.planejado && opcoes.planejado(t.nome);
    const area = areaDe(est, t);
    const alterada = marcado && area !== t.area;
    // Editar talhões: área diferente da que o plano tinha (a de antes, planejada ou cadastrada)
    const antesArea = opcoes.areasAntes && estava ? (opcoes.areasAntes[t.nome] ?? t.area) : null;
    const mudou = antesArea !== null && marcado && area !== antesArea;
    let celula = '<span class="ta__fora">—</span>';
    if (marcado && est.editando === t.nome) {
      celula = `
        <span class="ta__edicao">
          <input class="campo__controle ta__entrada ${est.erro ? 'campo__controle--erro' : ''}" type="text" inputmode="decimal"
            value="${numero(area)}" data-ta-entrada="${esc(t.nome)}" aria-label="Área planejada do ${esc(t.nome)} (ha)"
            ${est.erro ? `aria-describedby="ta-erro" aria-invalid="true"` : ''}> ha
        </span>
        ${est.erro ? `<span class="ta__erro" id="ta-erro" role="alert">${esc(est.erro)}</span>` : ''}`;
    } else if (marcado) {
      celula = `
        <button class="ta__editar ${alterada ? 'ta__editar--alterada' : ''}" type="button" data-ta-editar="${esc(t.nome)}"
          title="Editar a área planejada" aria-label="Área planejada do ${esc(t.nome)}: ${fmt(area)}. Editar">
          <strong>${fmt(area)}</strong>${Icones.lapis || '✎'}
        </button>
        ${mudou ? `<span class="ta__antes">antes ${fmt(antesArea)}</span>` : ''}`;
    }
    return `
      <tr class="ta__linha ${sai ? 'ta__linha--sai' : ''} ${entra ? 'ta__linha--entra' : ''} ${marcado ? '' : 'ta__linha--fora'}">
        <td><label class="ta__marcar"><input type="checkbox" data-ta-talhao="${esc(t.nome)}" ${marcado ? 'checked' : ''}>
          ${esc(t.nome)}${planejado ? ' <span class="ta__planejado" title="Este talhão já tem planejamento">planejado</span>' : ''}</label></td>
        <td class="ta__num">${fmt(t.area)}</td>
        <td class="ta__num">${celula}</td>
      </tr>`;
  }

  // Confere e grava o valor digitado. Devolve true se gravou.
  function aplicar(est, nome, texto) {
    const t = est.todos.find((x) => x.nome === nome);
    const n = Util.numero(texto);
    if (n === null || n < 0.1) { est.erro = 'Informe a área, a partir de 0,1 ha.'; return false; }
    if (n > t.area + 1e-9) { est.erro = `Máximo ${fmt(t.area)} (área cadastrada).`; return false; }
    const valor = Math.round(n * 10) / 10;
    if (valor === t.area) delete est.areas[nome]; else est.areas[nome] = valor;
    est.editando = null; est.erro = '';
    return true;
  }

  // redesenhar(seletor para o foco)
  function ligar(caixa, est, redesenharFora) {
    // Enquanto redesenha, o campo que sai da tela não conta como "sair do campo"
    let ocupado = false;
    const redesenhar = (sel) => { ocupado = true; try { redesenharFora(sel); } finally { ocupado = false; } };
    caixa.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ta-editar]');
      if (!b) return;
      est.editando = b.dataset.taEditar; est.erro = '';
      redesenhar(`[data-ta-entrada="${CSS.escape(est.editando)}"]`);
      const entrada = caixa.querySelector('[data-ta-entrada]');
      if (entrada) entrada.select();
    });
    caixa.addEventListener('keydown', (e) => {
      const entrada = e.target.closest('[data-ta-entrada]');
      if (!entrada) return;
      const nome = entrada.dataset.taEntrada;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (aplicar(est, nome, entrada.value)) redesenhar(`[data-ta-editar="${CSS.escape(nome)}"]`);
        else { redesenhar(`[data-ta-entrada="${CSS.escape(nome)}"]`); }
      } else if (e.key === 'Escape') {
        // Esc desfaz a edição (não fecha o modal)
        e.preventDefault(); e.stopPropagation();
        est.editando = null; est.erro = '';
        redesenhar(`[data-ta-editar="${CSS.escape(nome)}"]`);
      }
    });
    // Sair do campo grava; valor inválido volta ao que estava
    caixa.addEventListener('focusout', (e) => {
      const entrada = e.target.closest && e.target.closest('[data-ta-entrada]');
      if (ocupado || !entrada || !entrada.isConnected) return;
      const nome = entrada.dataset.taEntrada;
      if (est.editando !== nome) return;
      // Grava já (o clique seguinte, ex.: no lápis de outro talhão, vê o valor gravado); redesenha depois do clique
      if (!aplicar(est, nome, entrada.value)) { est.editando = null; est.erro = ''; }
      setTimeout(() => { if (!est.editando && entrada.isConnected) redesenhar(null); }, 0);
    });
    caixa.addEventListener('change', (e) => {
      if (e.target.matches('[data-ta-todos]')) {
        est.marcados = new Set(e.target.checked ? est.todos.map((t) => t.nome) : []);
        if (!e.target.checked) est.areas = {};
        est.editando = null; est.erro = '';
        redesenhar('[data-ta-todos]');
      } else if (e.target.dataset.taTalhao) {
        const nome = e.target.dataset.taTalhao;
        if (e.target.checked) est.marcados.add(nome);
        else { est.marcados.delete(nome); delete est.areas[nome]; if (est.editando === nome) { est.editando = null; est.erro = ''; } }
        redesenhar(`[data-ta-talhao="${CSS.escape(nome)}"]`);
      }
    });
  }

  // Depois de desenhar: a caixa "todos" fica parcial quando só parte está marcada
  function depois(caixa) {
    caixa.querySelectorAll('[data-ta-parte]').forEach((c) => { c.indeterminate = true; });
  }

  return { html, ligar, depois, total, fmt };
})();
