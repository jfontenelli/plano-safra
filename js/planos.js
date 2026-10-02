/*
 * Estrutura de um plano e cálculos das operações.
 *
 * plano.grupos = [{ id, nome, tipo, operacoes: [operacao] }]
 * operacao     = { id, nome, dap, fenologia, produtos: [linha], talhoes: { 'T01': ajuste } }
 * linha        = { id, principioAtivo, produto, unidade, dose, preCadastro, recomendacao }
 *                recomendacao: true = linha da recomendação agronômica (vale para os talhões);
 *                false = produto adicionado só em alguns talhões (modo ajustar).
 * ajuste       = { dap?, doses: { linhaId: dose }, removidas: [linhaId], extras: [linhaId] }
 *                Talhão presente em "talhoes" = recebe a operação. Sem "dap" ou sem dose
 *                própria, o talhão segue o DAP padrão e as doses da recomendação.
 */
window.Planos = (function () {
  let sequencia = 0;
  const novoId = (prefixo) => `${prefixo}${++sequencia}`;
  const vazio = (v) => v === null || v === undefined || v === '';

  function produtoDoCadastro(nome) {
    return DADOS.defensivos.find((d) => d.produto === nome);
  }

  function novaLinha(dados = {}) {
    return { id: novoId('l'), principioAtivo: '', produto: '', unidade: 'g', dose: null,
             preCadastro: false, recomendacao: true, ...dados };
  }

  function linhaDoProduto(nome, dose, recomendacao = true) {
    const d = produtoDoCadastro(nome);
    return novaLinha({ principioAtivo: d.principioAtivo || '', produto: d.produto || '', unidade: d.unidade,
                       dose, recomendacao, preCadastro: !!d.preCadastro });
  }

  function novaOperacao(nome, dap = null) {
    return { id: novoId('o'), nome, dap, fenologia: '', produtos: [], talhoes: {} };
  }

  function novoAjuste() {
    return { doses: {}, removidas: [], extras: [] };
  }

  function novoGrupo(nome, tipo) {
    return { id: novoId('g'), nome, tipo, operacoes: [] };
  }

  // Grupos e operações do modelo, sem produtos e sem talhões
  function gruposModelo() {
    return DADOS.modeloOperacoes.map((g) => ({
      ...novoGrupo(g.nome, g.tipo),
      operacoes: g.operacoes.map((o) => novaOperacao(o.nome, o.dap))
    }));
  }

  // Modelo preenchido com o detalhe dos planos de exemplo (ver dados-exemplo.js)
  function montarExemplo(detalhes) {
    const grupos = gruposModelo();
    grupos.forEach((g) => g.operacoes.forEach((op) => {
      const d = detalhes[op.nome];
      if (!d) return;
      op.fenologia = d.fenologia || '';
      op.produtos = (d.produtos || []).map(([nome, dose]) => linhaDoProduto(nome, dose));
      (d.talhoes || []).forEach((t) => { op.talhoes[t] = novoAjuste(); });
      Object.entries(d.ajustes || {}).forEach(([talhao, aj]) => {
        const ajuste = op.talhoes[talhao];
        if ('dap' in aj) ajuste.dap = aj.dap;
        Object.entries(aj.doses || {}).forEach(([produto, dose]) => {
          ajuste.doses[op.produtos.find((l) => l.produto === produto).id] = dose;
        });
      });
    }));
    return grupos;
  }

  // ----- Valores de cada talhão (o que é dele ou o que vem da recomendação) -----
  function dapTalhao(op, ajuste) {
    return 'dap' in ajuste ? ajuste.dap : op.dap;
  }

  // Linha ainda sem princípio ativo e sem produto (recém-adicionada) não conta
  function linhaPreenchida(linha) {
    return !!(linha.produto || linha.principioAtivo);
  }

  function linhasTalhao(op, ajuste) {
    return op.produtos.filter(linhaPreenchida).filter((l) => l.recomendacao
      ? !ajuste.removidas.includes(l.id)
      : ajuste.extras.includes(l.id));
  }

  function doseTalhao(op, ajuste, linha) {
    if (linha.id in ajuste.doses) return ajuste.doses[linha.id];
    return linha.recomendacao ? linha.dose : null;
  }

  function temAjuste(ajuste) {
    return 'dap' in ajuste || Object.keys(ajuste.doses).length > 0 ||
           ajuste.removidas.length > 0 || ajuste.extras.length > 0;
  }

  // Completo: recebe a operação e tem DAP, produto e dose. Pendente: falta algum. Sem operação: não recebe.
  function statusTalhao(op, nomeTalhao) {
    const ajuste = op.talhoes[nomeTalhao];
    if (!ajuste) return 'Sem operação';
    const linhas = linhasTalhao(op, ajuste);
    const completo = !vazio(dapTalhao(op, ajuste)) && linhas.length > 0 &&
      linhas.every((l) => !vazio(doseTalhao(op, ajuste, l)));
    return completo ? 'Completo' : 'Pendente';
  }

  // Resumo da operação: área (ha) e número de talhões que recebem, e quantos estão pendentes
  function resumo(op, talhoesFazenda) {
    const recebem = talhoesFazenda.filter((t) => op.talhoes[t.nome]);
    return {
      area: recebem.reduce((s, t) => s + t.area, 0),
      talhoes: recebem.length,
      pendentes: recebem.filter((t) => statusTalhao(op, t.nome) === 'Pendente').length
    };
  }

  // Colunas de dose da tabela: linhas da recomendação + produtos adicionados em algum talhão
  function colunasDose(op) {
    return op.produtos.filter(linhaPreenchida).filter((l) => l.recomendacao ||
      Object.values(op.talhoes).some((a) => a.extras.includes(l.id)));
  }

  // Tira do plano produtos adicionados por talhão que nenhum talhão usa mais
  function limparExtras(op) {
    op.produtos = op.produtos.filter((l) => l.recomendacao ||
      Object.values(op.talhoes).some((a) => a.extras.includes(l.id)));
  }

  // "L/ha" para produto comercial; "g i.a./ha" quando a linha tem só princípio ativo
  function unidadeDose(linha) {
    if (!linha.unidade) return '';
    return linha.produto ? `${linha.unidade}/ha` : `${linha.unidade} i.a./ha`;
  }

  function nomeLinha(linha) {
    return linha.produto || linha.principioAtivo || 'Produto';
  }

  return {
    novoId, novaLinha, linhaDoProduto, novaOperacao, novoAjuste, novoGrupo,
    gruposModelo, montarExemplo, produtoDoCadastro,
    dapTalhao, linhasTalhao, doseTalhao, temAjuste, statusTalhao, resumo,
    colunasDose, limparExtras, unidadeDose, nomeLinha
  };
})();
