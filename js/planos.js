/*
 * Estrutura de um plano e cálculos das operações.
 *
 * plano.grupos = [{ id, nome, tipo, operacoes: [operacao] }]
 * operacao     = { id, nome, dap, fenologia, receitas: [receita], talhoes: { 'T01': ajuste } }
 * receita      = { id, numero, nome, produtos: [linha] }
 *                Receita agronômica = conjunto de produtos + doses padrão. A composição de produtos
 *                determina a identidade da receita; a dose pode variar por talhão sem mudar a receita.
 * linha        = { id, principioAtivo, produto, unidade, dose, preCadastro }
 *                dose = dose padrão, sempre do produto comercial (princípio ativo só filtra o produto).
 * ajuste       = { receitaId, doses: { linhaId: dose } }
 *                Talhão presente em "talhoes" = recebe a operação, por uma receita só.
 *                Sem dose própria, o talhão segue a dose padrão da receita.
 *                O DAP é um só por operação (outro DAP = outra operação).
 */
window.Planos = (function () {
  let sequencia = 0;
  const novoId = (prefixo) => `${prefixo}${++sequencia}`;
  const vazio = (v) => v === null || v === undefined || v === '';

  function produtoDoCadastro(nome) {
    return DADOS.defensivos.find((d) => d.produto === nome);
  }

  function novaLinha(dados = {}) {
    return { id: novoId('l'), principioAtivo: '', produto: '', unidade: '', dose: null,
             preCadastro: false, ...dados };
  }

  function linhaDoProduto(nome, dose) {
    const d = produtoDoCadastro(nome);
    return novaLinha({ principioAtivo: d.principioAtivo || '', produto: d.produto || '', unidade: d.unidade,
                       dose, preCadastro: !!d.preCadastro });
  }

  function novaOperacao(nome, dap = null) {
    // plantio: só no grupo Semente — { 'T01': { variedade, data ('AAAA-MM-DD') } }
    return { id: novoId('o'), nome, dap, fenologia: '', receitas: [], talhoes: {}, plantio: {} };
  }

  // ----- Receitas -----
  // Numeração automática: maior número já usado + 1 (renomear ou excluir não renumera)
  function proximoNumero(op) {
    return op.receitas.reduce((m, r) => Math.max(m, r.numero), 0) + 1;
  }

  function novaReceita(op, produtos = []) {
    const numero = proximoNumero(op);
    return { id: novoId('r'), numero, nome: `Recomendação ${numero}`, produtos };
  }

  function novoAjuste(receitaId) {
    return { receitaId, doses: {} };
  }

  function novoGrupo(nome, tipo) {
    return { id: novoId('g'), nome, tipo, operacoes: [] };
  }

  // Grupos e operações do modelo, sem receitas e sem talhões
  function gruposModelo() {
    return DADOS.modeloOperacoes.map((g) => ({
      ...novoGrupo(g.nome, g.tipo),
      operacoes: g.operacoes.map((o) => novaOperacao(o.nome, o.dap))
    }));
  }

  // Modelo preenchido com o detalhe dos planos de exemplo (ver dados-exemplo.js).
  // Os produtos de cada operação viram a Receita 1, aplicada nos talhões listados.
  function montarExemplo(detalhes) {
    const grupos = gruposModelo();
    grupos.forEach((g) => g.operacoes.forEach((op) => {
      const d = detalhes[op.nome];
      if (!d) return;
      op.fenologia = d.fenologia || '';
      (d.plantio || []).forEach(({ talhao, variedade, data }) => { op.plantio[talhao] = { variedade, data }; });
      if (!d.produtos || !d.produtos.length) return;
      const receita = novaReceita(op, d.produtos.map(([nome, dose]) => linhaDoProduto(nome, dose)));
      op.receitas.push(receita);
      (d.talhoes || []).forEach((t) => { op.talhoes[t] = novoAjuste(receita.id); });
      Object.entries(d.ajustes || {}).forEach(([talhao, aj]) => {
        const ajuste = op.talhoes[talhao];
        Object.entries(aj.doses || {}).forEach(([produto, dose]) => {
          ajuste.doses[receita.produtos.find((l) => l.produto === produto).id] = dose;
        });
      });
    }));
    return grupos;
  }

  // ----- Identidade: a composição de produtos -----
  // Linha ainda sem princípio ativo e sem produto (recém-adicionada) não conta
  function linhaPreenchida(linha) {
    return !!(linha.produto || linha.principioAtivo);
  }

  function chaveLinha(linha) {
    return Util.normalizar(linha.produto || linha.principioAtivo);
  }

  function composicao(produtos) {
    return [...new Set(produtos.filter(linhaPreenchida).map(chaveLinha))].sort().join('|');
  }

  function receitaDoTalhao(op, ajuste) {
    return ajuste ? op.receitas.find((r) => r.id === ajuste.receitaId) || null : null;
  }

  function talhoesDaReceita(op, receita) {
    return Object.keys(op.talhoes).filter((t) => op.talhoes[t].receitaId === receita.id);
  }

  // ----- Valores de cada talhão (o que é dele ou o que vem da receita) -----
  function linhasTalhao(op, ajuste) {
    const receita = receitaDoTalhao(op, ajuste);
    return receita ? receita.produtos.filter(linhaPreenchida) : [];
  }

  function doseTalhao(op, ajuste, linha) {
    return linha.id in ajuste.doses ? ajuste.doses[linha.id] : linha.dose;
  }

  function temAjuste(ajuste) {
    return Object.keys(ajuste.doses).length > 0;
  }

  // Completo: recebe a operação e cada produto tem dose. Sem dose: recebe, mas falta produto ou dose.
  // Sem operação: não recebe. Todo talhão da fazenda que não recebe a operação fica "Sem operação".
  function statusTalhao(op, nomeTalhao) {
    const ajuste = op.talhoes[nomeTalhao];
    if (!ajuste) return 'Sem operação';
    const linhas = linhasTalhao(op, ajuste);
    const completo = linhas.length > 0 &&
      linhas.every((l) => l.produto && !vazio(doseTalhao(op, ajuste, l)));
    return completo ? 'Completo' : 'Sem dose';
  }

  // Resumo da operação: área (ha) e número de talhões que recebem; quantos estão sem operação e sem dose
  function resumo(op, talhoesFazenda) {
    const recebem = talhoesFazenda.filter((t) => op.talhoes[t.nome]);
    return {
      area: recebem.reduce((s, t) => s + t.area, 0),
      talhoes: recebem.length,
      semOperacao: talhoesFazenda.length - recebem.length,
      semDose: recebem.filter((t) => statusTalhao(op, t.nome) === 'Sem dose').length
    };
  }

  // Colunas de dose da tabela de talhões: um produto por coluna, juntando as receitas já aplicadas
  // (receita sem talhões não aparece na tabela até ser aplicada)
  function colunasDose(op) {
    const vistas = new Set();
    const aplicadas = op.receitas.filter((r) => talhoesDaReceita(op, r).length);
    return aplicadas.flatMap((r) => r.produtos.filter(linhaPreenchida)).filter((l) => {
      const chave = chaveLinha(l);
      if (vistas.has(chave)) return false;
      vistas.add(chave);
      return true;
    });
  }

  // Linha da receita do talhão com o mesmo produto da coluna (ou null: o talhão não recebe)
  function linhaNoTalhao(op, ajuste, coluna) {
    return linhasTalhao(op, ajuste).find((l) => chaveLinha(l) === chaveLinha(coluna)) || null;
  }

  // "L/ha"; sem produto comercial não há unidade (a dose é do produto)
  function unidadeDose(linha) {
    return linha.produto && linha.unidade ? `${linha.unidade}/ha` : '';
  }

  function nomeLinha(linha) {
    return linha.produto || linha.principioAtivo || 'Produto';
  }

  return {
    novoId, novaLinha, linhaDoProduto, novaOperacao, novaReceita, novoAjuste, novoGrupo,
    gruposModelo, montarExemplo, produtoDoCadastro,
    linhaPreenchida, chaveLinha, composicao, receitaDoTalhao, talhoesDaReceita,
    linhasTalhao, doseTalhao, temAjuste, statusTalhao, resumo,
    colunasDose, linhaNoTalhao, unidadeDose, nomeLinha
  };
})();
