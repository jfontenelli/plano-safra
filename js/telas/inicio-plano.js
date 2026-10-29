/*
 * Modal "Como deseja iniciar o plano?"
 * Abre por cima da Visão Geral ao abrir um plano ainda não iniciado (só a versão 0.1, vazia: Versoes.aIniciar).
 * Opções: Usar modelo de operações · Importar planilha Excel · Copiar outro plano de safra (uma embaixo da outra).
 * "Começar o planejamento" cria a 0.2 em construção com esse conteúdo (Versoes.comecar) e abre o plano no Planejamento.
 * Cancelar ou X: fecha sem iniciar (o plano continua não iniciado).
 */
window.Telas = window.Telas || {};

window.Telas.inicioPlano = (function () {
  const esc = Util.escapar;

  const OPCOES = [
    { valor: 'modelo', titulo: 'Usar modelo de operações', icone: Icones.lista,
      texto: 'Use uma lista de operações e ajuste conforme necessário.' },
    { valor: 'importar', titulo: 'Importar planilha Excel', icone: Icones.planilha,
      texto: 'Continue um plano exportado por este sistema.' },
    { valor: 'copiar', titulo: 'Copiar outro plano de safra', icone: Icones.copiar,
      texto: 'Copie um plano de safra da mesma cultura.' }
  ];
  const CAMPOS = [['safra', 'Safra'], ['empresa', 'Empresa'], ['fazenda', 'Fazenda'], ['cultura', 'Cultura']];

  // Estado da escolha, por plano (só enquanto a página está aberta)
  const estados = {};
  function estadoDe(plano) {
    return estados[plano.id] = estados[plano.id] || { opcao: 'modelo', importado: null, erroArquivo: '', aceitou: false, copiarDe: '', tentou: false };
  }

  // Planos que podem ser copiados: mesma cultura, qualquer fazenda e safra, só os que têm versão publicada
  // com operações. Usa sempre a última versão publicada.
  function copiaveis(plano) {
    return DADOS.planos.filter((p) => p !== plano && p.cultura === plano.cultura)
      .map((p) => ({ p, v: Versoes.ultimaPublicada(p) }))
      .filter(({ v }) => v && v.grupos.length);
  }

  function diferencas(plano, e) {
    return e.importado ? CAMPOS.filter(([c]) => plano[c] !== e.importado.contexto[c]) : [];
  }

  // Conteúdo do corpo do modal (redesenhado a cada escolha)
  function desenhar(plano) {
    const e = estadoDe(plano);
    return `
        <fieldset class="inicios">
          <legend class="so-leitor">Como deseja iniciar o plano?</legend>
          <div class="inicios__grade inicios__grade--lista">
            ${OPCOES.map((o) => `
              <label class="card-inicio">
                <input class="card-inicio__radio" type="radio" name="ini-opcao" value="${o.valor}" ${o.valor === e.opcao ? 'checked' : ''}>
                <span class="card-inicio__icone">${o.icone}</span>
                <span class="card-inicio__textos">
                  <span class="card-inicio__titulo">${o.titulo}</span>
                  <span class="card-inicio__texto">${o.texto}</span>
                </span>
              </label>`).join('')}
          </div>
        </fieldset>
        ${e.opcao === 'importar' ? detalheImportar(plano, e) : ''}
        ${e.opcao === 'copiar' ? detalheCopiar(plano, e) : ''}`;
  }

  // Abre o modal. aoComecar(grupos, aviso): chamado com o conteúdo escolhido.
  function abrir(plano, { aoComecar }) {
    delete estados[plano.id]; // cada abertura começa do zero (Usar modelo marcado)
    const modal = Modal.abrir(`
      <div class="modal__corpo">
        <button class="modal__fechar" type="button" aria-label="Fechar" data-fechar>${Icones.fechar}</button>
        <h2 class="modal__titulo" id="modal-titulo">Como deseja iniciar o plano?</h2>
        <p class="modal__subtitulo">Safra ${esc(plano.safra)} · ${esc(plano.empresa)} · Fazenda ${esc(plano.fazenda)} · ${esc(plano.cultura)}</p>
        <div data-ini-corpo></div>
      </div>
      <div class="modal__rodape">
        <button class="botao botao--secundario" type="button" data-fechar>Cancelar</button>
        <button class="botao botao--primario" type="button" data-ini="comecar">Começar o planejamento</button>
      </div>
    `, { classe: 'modal--formulario modal--largo' });
    const corpo = modal.elemento.querySelector('[data-ini-corpo]');
    const redesenhar = () => { corpo.innerHTML = desenhar(plano); };
    redesenhar();
    ligar(modal.elemento, plano, {
      redesenhar,
      aoComecar: (grupos, aviso) => { modal.fechar(); aoComecar(grupos, aviso); }
    });
    corpo.querySelector('[name="ini-opcao"]:checked')?.focus();
  }

  // Importar: o arquivo é conferido com Safra, Empresa, Fazenda e Cultura do plano
  function detalheImportar(plano, e) {
    const dif = diferencas(plano, e);
    const fora = e.importado ? ArquivoPlano.talhoesFora(e.importado, plano) : [];
    const c = e.importado && e.importado.contexto;
    return `
      <div class="importar">
        <label class="campo__rotulo" for="ini-arquivo">Arquivo exportado pelo Plano de Safra (.xlsx) <span class="obrigatorio" aria-hidden="true">*</span></label>
        <input class="importar__arquivo" id="ini-arquivo" type="file" accept=".xlsx" data-ini="arquivo">
        ${e.erroArquivo ? `<p class="erro-campo" role="alert">${esc(e.erroArquivo)}</p>` : ''}
        ${c ? `<p class="importar__ok">Planejamento da safra ${esc(c.safra)} · ${esc(c.empresa)} · Fazenda ${esc(c.fazenda)} · ${esc(c.cultura)}</p>` : ''}
        ${dif.length && !e.aceitou ? `
          <div class="importar__diferencas" role="alert">
            <p class="importar__titulo">${Icones.alerta} O arquivo é de outro plano</p>
            <ul class="importar__lista">
              ${dif.map(([campo, rotulo]) => `<li>${rotulo}: no plano <strong>${esc(plano[campo])}</strong> · no arquivo <strong>${esc(c[campo])}</strong></li>`).join('')}
            </ul>
            <div class="importar__botoes">
              <button class="botao botao--secundario botao--p" type="button" data-ini="aceitar">Importar mesmo assim</button>
            </div>
          </div>` : ''}
        ${c && fora.length ? `<p class="importar__aviso">${fora.length} ${fora.length === 1 ? 'talhão do arquivo não está' : 'talhões do arquivo não estão'} neste plano e ${fora.length === 1 ? 'fica' : 'ficam'} de fora (${fora.map(esc).join(', ')}).</p>` : ''}
      </div>`;
  }

  function detalheCopiar(plano, e) {
    const lista = copiaveis(plano);
    return `
      <div class="importar">
        <label class="campo__rotulo" for="ini-copiar">Plano para copiar <span class="obrigatorio" aria-hidden="true">*</span></label>
        ${lista.length ? `
          <select class="campo__controle inicio-plano__copiar" id="ini-copiar" data-ini="copiar-de">
            <option value="" disabled ${e.copiarDe ? '' : 'selected'}>Selecione um plano de ${esc(plano.cultura)}</option>
            ${lista.map(({ p, v }) => `
              <option value="${p.id}" ${String(p.id) === e.copiarDe ? 'selected' : ''}>
                Safra ${esc(p.safra)} · ${esc(p.empresa)} · Fazenda ${esc(p.fazenda)} · versão ${esc(v.num)}
              </option>`).join('')}
          </select>
          <p class="inicio-plano__nota">Copia a última versão publicada do plano escolhido: grupos de operação, operações, recomendações com produtos e doses padrão.</p>
          ${e.tentou && !e.copiarDe ? '<p class="erro-campo" role="alert">Escolha o plano para copiar.</p>' : ''}`
          : `<p class="inicio-plano__nota">Ainda não há plano de ${esc(plano.cultura)} publicado para copiar.</p>`}
      </div>`;
  }

  // Liga os eventos. aoComecar(grupos, aviso) cria a versão; redesenhar() desenha a tela de novo.
  function ligar(el, plano, { aoComecar, redesenhar }) {
    const e = estadoDe(plano);
    el.addEventListener('change', async (ev) => {
      if (ev.target.name === 'ini-opcao') {
        e.opcao = ev.target.value; e.tentou = false; redesenhar();
        el.querySelector(`[name="ini-opcao"][value="${e.opcao}"]`)?.focus();
      } else if (ev.target.dataset.ini === 'copiar-de') {
        e.copiarDe = ev.target.value; redesenhar();
      } else if (ev.target.dataset.ini === 'arquivo') {
        const arquivo = ev.target.files[0];
        Object.assign(e, { importado: null, erroArquivo: '', aceitou: false });
        if (arquivo) {
          const lido = await ArquivoPlano.ler(arquivo);
          if (lido.erro) e.erroArquivo = lido.erro; else e.importado = lido;
        }
        redesenhar();
      }
    });
    el.addEventListener('click', (ev) => {
      const acao = ev.target.closest('[data-ini]')?.dataset.ini;
      if (acao === 'aceitar') { e.aceitou = true; redesenhar(); }
      if (acao === 'comecar') comecar(plano, e, el, { aoComecar, redesenhar });
    });
  }

  function comecar(plano, e, el, { aoComecar, redesenhar }) {
    e.tentou = true;
    // Usar modelo: pelo modelo da cultura do plano (milho tem o seu)
    if (e.opcao === 'modelo') return fim(Planos.gruposModelo(Planos.modeloDaCultura(plano.cultura)), '');
    if (e.opcao === 'importar') {
      if (!e.importado) {
        if (!e.erroArquivo) e.erroArquivo = 'Escolha o arquivo exportado pelo Plano de Safra.';
        redesenhar(); el.querySelector('#ini-arquivo')?.focus(); return;
      }
      if (diferencas(plano, e).length && !e.aceitou) { el.querySelector('[data-ini="aceitar"]')?.focus(); return; }
      const fora = ArquivoPlano.talhoesFora(e.importado, plano);
      return fim(ArquivoPlano.montarGrupos(e.importado, plano),
        `Planejamento importado${fora.length ? ` · ${fora.length} ${fora.length === 1 ? 'talhão ficou' : 'talhões ficaram'} de fora` : ''}`);
    }
    // Copiar plano existente
    const origem = DADOS.planos.find((p) => String(p.id) === e.copiarDe);
    if (!origem) { redesenhar(); el.querySelector('#ini-copiar')?.focus(); return; }
    const v = Versoes.ultimaPublicada(origem);
    fim(Planos.copiarSemTalhoes(v.grupos), `Copiado do plano da Fazenda ${esc(origem.fazenda)} (safra ${esc(origem.safra)}, versão ${esc(v.num)})`);

    function fim(grupos, aviso) {
      delete estados[plano.id];
      aoComecar(grupos, aviso);
    }
  }

  return { abrir };
})();
