/*
 * Exportar e importar o plano em .xlsx (SheetJS, por CDN).
 * Na v1, o importar aceita só o arquivo exportado por este protótipo (aba "plano" com o formato abaixo).
 * Abas e colunas seguem a planilha de rascunho do cliente (plano_safra_piccini_rascunho.xlsx), sem custos:
 *   plano · operacoes · cultura_variedade · tratamento_sementes · corretivo_fertilizante · aplicacao_defensivo
 * Uma linha por talhão × operação × produto. A coluna "recomendacao" (Rec 1, TSI 2…) remonta as receitas.
 */
window.ArquivoPlano = (function () {
  const FORMATO = 'plano-safra-prototipo';
  const VERSAO = 1;
  const ABAS_REC = ['tratamento_sementes', 'corretivo_fertilizante', 'aplicacao_defensivo'];

  // ----- Exportar -----
  function nomeArquivo(plano) {
    const limpo = (t) => Util.normalizar(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `plano-safra_${limpo(plano.safra)}_${limpo(plano.fazenda)}.xlsx`;
  }

  function abaDoGrupo(grupo) {
    if (grupo.tipo === 'Sementes') return 'tratamento_sementes';
    if (grupo.tipo === 'Fertilidade') return 'corretivo_fertilizante';
    return 'aplicacao_defensivo';
  }

  function exportar(plano) {
    if (!window.XLSX) {
      Aviso.mostrar('Não foi possível exportar: sem conexão com a internet para carregar o gerador de planilhas.');
      return;
    }
    const talhoes = DADOS.talhoes[plano.fazenda] || [];
    const area = (nome) => (talhoes.find((t) => t.nome === nome) || {}).area ?? null;
    const sementes = plano.grupos.find((g) => g.tipo === 'Sementes');
    const plantio = sementes && sementes.operacoes[0];

    const abaPlano = [
      ['campo', 'valor'],
      ['formato', FORMATO], ['versao', VERSAO],
      ['safra', plano.safra], ['empresa', plano.empresa], ['fazenda', plano.fazenda], ['cultura', plano.cultura],
      ['status', plano.status], ['germinacao_media', plantio && plantio.germinacao ? plantio.germinacao : ''],
      ['exportado_em', Util.hojeISO()], ['exportado_por', DADOS.usuario.nome]
    ];

    const abaOperacoes = [['grupo_operacao', 'tipo_grupo', 'operacao', 'dap', 'fenologia']];
    plano.grupos.forEach((g) => {
      if (!g.operacoes.length) abaOperacoes.push([g.nome, g.tipo || '', '', '', '']);
      g.operacoes.forEach((op) => abaOperacoes.push([g.nome, g.tipo || '', op.nome, op.dap ?? '', op.fenologia || '']));
    });

    const abaVariedade = [['fazenda', 'talhao', 'area_talhao', 'cultura', 'grupo_operacao', 'operacao', 'variedade',
      'data_plantio', 'pop_plantas_planejada', 'pop_plantas_recomendada', 'perc_germinacao', 'quantidade_total_sementes', 'bags']];
    if (sementes) {
      sementes.operacoes.forEach((op) => {
        talhoes.forEach((t) => {
          const p = (op.plantio || {})[t.nome];
          if (!p) return;
          const v = p.variedade ? DADOS.variedades.find((x) => x.nome === p.variedade) : null;
          const sem = p.populacao && op.germinacao ? p.populacao * 1000 * t.area / (op.germinacao / 100) : null;
          abaVariedade.push([plano.fazenda, t.nome, t.area, plano.cultura, sementes.nome, op.nome, p.variedade || '',
            p.data || '', p.populacao || '', v && v.populacao ? `${v.populacao[0]}-${v.populacao[1]}` : '',
            op.germinacao || '', sem ? Math.round(sem) : '', sem ? Math.round(sem / 5e5) / 10 : '']);
        });
      });
    }

    const abasRec = {};
    ABAS_REC.forEach((nome) => {
      abasRec[nome] = [['fazenda', 'talhao', 'area_talhao', 'area_aplicacao', 'unidade_area', 'cultura', 'variedade',
        'grupo_operacao', 'operacao', 'fenologia', 'dap', 'recomendacao',
        nome === 'corretivo_fertilizante' ? 'materia_prima' : 'principio_ativo', 'nome_produto_comercial',
        'unidade_produto', 'dose_padrao', 'dose_ha', 'volume']];
    });
    plano.grupos.forEach((g) => {
      const aba = abasRec[abaDoGrupo(g)];
      g.operacoes.forEach((op) => {
        talhoes.forEach((t) => {
          const ajuste = op.talhoes[t.nome];
          if (!ajuste) return;
          const r = Planos.receitaDoTalhao(op, ajuste);
          if (!r) return;
          const variedade = ((op.plantio || {})[t.nome] || (plantio && plantio.plantio[t.nome]) || {}).variedade || '';
          r.produtos.filter(Planos.linhaPreenchida).forEach((l) => {
            const dose = Planos.doseTalhao(op, ajuste, l);
            aba.push([plano.fazenda, t.nome, t.area, t.area, 'ha', plano.cultura, variedade, g.nome, op.nome,
              op.fenologia || '', op.dap ?? '', r.nome, l.principioAtivo || '', l.produto || '', l.unidade || '',
              l.dose ?? '', dose ?? '', dose !== null && dose !== undefined ? Math.round(dose * t.area * 100) / 100 : '']);
          });
        });
      });
    });

    const livro = XLSX.utils.book_new();
    const anexar = (nome, linhas) => XLSX.utils.book_append_sheet(livro, XLSX.utils.aoa_to_sheet(linhas), nome);
    anexar('plano', abaPlano);
    anexar('operacoes', abaOperacoes);
    anexar('cultura_variedade', abaVariedade);
    ABAS_REC.forEach((nome) => anexar(nome, abasRec[nome]));
    XLSX.writeFile(livro, nomeArquivo(plano));
    Aviso.mostrar(`Plano exportado: ${nomeArquivo(plano)}`);
  }

  // ----- Importar -----
  // Lê o arquivo e devolve { contexto: { safra, empresa, fazenda, cultura }, abas } ou { erro }
  function ler(arquivo) {
    return new Promise((resolver) => {
      if (!window.XLSX) { resolver({ erro: 'Não foi possível ler o arquivo: sem conexão com a internet.' }); return; }
      const leitor = new FileReader();
      leitor.onerror = () => resolver({ erro: 'Não foi possível ler o arquivo.' });
      leitor.onload = () => {
        let livro;
        try { livro = XLSX.read(leitor.result, { type: 'array' }); } catch (e) { livro = null; }
        const naoEhDoSistema = { erro: 'Este arquivo não foi exportado pelo Plano de Safra. Na v1, só dá para importar um planejamento exportado por este sistema.' };
        if (!livro || !livro.Sheets.plano) { resolver(naoEhDoSistema); return; }
        const linhas = (nome) => (livro.Sheets[nome] ? XLSX.utils.sheet_to_json(livro.Sheets[nome], { defval: '' }) : []);
        const campos = Object.fromEntries(linhas('plano').map((x) => [x.campo, x.valor]));
        if (campos.formato !== FORMATO) { resolver(naoEhDoSistema); return; }
        resolver({
          contexto: { safra: String(campos.safra), empresa: String(campos.empresa), fazenda: String(campos.fazenda), cultura: String(campos.cultura) },
          germinacao: campos.germinacao_media === '' ? null : Number(campos.germinacao_media),
          abas: Object.fromEntries(['operacoes', 'cultura_variedade', ...ABAS_REC].map((n) => [n, linhas(n)]))
        });
      };
      leitor.readAsArrayBuffer(arquivo);
    });
  }

  // Talhões do arquivo que não existem na fazenda escolhida (ficam de fora)
  function talhoesFora(dados, fazenda) {
    const daFazenda = new Set((DADOS.talhoes[fazenda] || []).map((t) => t.nome));
    const doArquivo = new Set();
    ['cultura_variedade', ...ABAS_REC].forEach((n) => dados.abas[n].forEach((x) => x.talhao && doArquivo.add(String(x.talhao))));
    return [...doArquivo].filter((t) => !daFazenda.has(t)).sort();
  }

  // Monta os grupos do plano a partir do arquivo lido, para a fazenda escolhida
  function montarGrupos(dados, fazenda) {
    const daFazenda = new Set((DADOS.talhoes[fazenda] || []).map((t) => t.nome));
    const grupos = [];
    const acharOp = (grupo, operacao) => {
      const g = grupos.find((x) => x.nome === grupo);
      return g ? g.operacoes.find((o) => o.nome === operacao) : null;
    };
    dados.abas.operacoes.forEach((x) => {
      let g = grupos.find((y) => y.nome === x.grupo_operacao);
      if (!g) { g = Planos.novoGrupo(String(x.grupo_operacao), String(x.tipo_grupo || '')); grupos.push(g); }
      if (x.operacao === '') return;
      const op = Planos.novaOperacao(String(x.operacao), x.dap === '' ? null : Number(x.dap));
      op.fenologia = String(x.fenologia || '');
      if (g.tipo === 'Sementes' && dados.germinacao) op.germinacao = dados.germinacao;
      g.operacoes.push(op);
    });

    dados.abas.cultura_variedade.forEach((x) => {
      const op = acharOp(x.grupo_operacao, x.operacao);
      const talhao = String(x.talhao);
      if (!op || !daFazenda.has(talhao)) return;
      const variedade = String(x.variedade || '');
      if (variedade && !DADOS.variedades.some((v) => v.nome === variedade)) {
        DADOS.variedades.push({ cultura: String(x.cultura), nome: variedade, gm: null, ciclo: null, populacao: null, janela: null, preCadastro: true });
      }
      op.plantio[talhao] = { variedade, data: String(x.data_plantio || ''), ...(x.pop_plantas_planejada !== '' ? { populacao: Number(x.pop_plantas_planejada) } : {}) };
    });

    ABAS_REC.forEach((aba) => {
      dados.abas[aba].forEach((x) => {
        const op = acharOp(x.grupo_operacao, x.operacao);
        const talhao = String(x.talhao);
        if (!op || !daFazenda.has(talhao) || !x.nome_produto_comercial) return;
        const nome = String(x.recomendacao || 'Recomendação 1');
        let r = op.receitas.find((y) => y.nome === nome);
        if (!r) {
          const numero = Number((/(\d+)$/.exec(nome) || [])[1]) || op.receitas.length + 1;
          r = { id: Planos.novoId('r'), numero, nome, produtos: [] };
          op.receitas.push(r);
        }
        const produto = String(x.nome_produto_comercial);
        const pa = String(x.materia_prima ?? x.principio_ativo ?? '');
        let l = r.produtos.find((y) => y.produto === produto);
        if (!l) {
          const doCadastro = Planos.produtoDoCadastro(produto);
          if (!doCadastro) {
            DADOS.defensivos.push({ classe: '', produto, principioAtivo: pa, unidade: String(x.unidade_produto), preCadastro: true,
              ...(aba === 'tratamento_sementes' ? { tsi: true } : aba === 'corretivo_fertilizante' ? { fertilidade: true } : {}) });
          }
          l = Planos.novaLinha({ principioAtivo: pa, produto, unidade: String(x.unidade_produto),
            dose: x.dose_padrao === '' ? null : Number(x.dose_padrao), preCadastro: !doCadastro });
          r.produtos.push(l);
        }
        if (!op.talhoes[talhao]) op.talhoes[talhao] = Planos.novoAjuste(r.id);
        const dose = x.dose_ha === '' ? null : Number(x.dose_ha);
        if (dose !== l.dose) op.talhoes[talhao].doses[l.id] = dose;
      });
    });
    return grupos;
  }

  return { exportar, ler, talhoesFora, montarGrupos, nomeArquivo };
})();
