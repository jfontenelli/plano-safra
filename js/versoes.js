/*
 * Versões do plano (docs/DECISOES.md, 4.1.1).
 *
 * plano.versoes = [versao], da mais antiga para a mais nova
 * versao        = { num: '0.1', status: 'construcao' | 'publicada', grupos (cópia do planejamento),
 *                   criadaEm, criadaPor, origem ('0.1' | null),
 *                   salvaEm, salvaPor (em construção), publicadaEm, publicadaPor }
 * plano.versaoAberta = número da versão na tela.
 * plano.grupos       = área de trabalho: o planejamento da versão aberta, que as telas leem e alteram.
 *                      Na versão em construção, as mudanças só vão para a versão no "Salvar alterações".
 * plano.pendente     = true quando há alterações não salvas na versão em construção.
 *
 * Versão publicada é imutável. Só pode haver uma versão em construção por plano.
 */
window.Versoes = (function () {
  const copiar = (grupos) => structuredClone(grupos || []);

  function agora() { return new Date(); }
  function usuario() { return DADOS.usuario.nome; }

  function lista(plano) { return plano.versoes || []; }
  function buscar(plano, num) { return lista(plano).find((v) => v.num === num) || null; }
  function aberta(plano) { return buscar(plano, plano.versaoAberta); }
  function emConstrucao(plano) { return lista(plano).find((v) => v.status === 'construcao') || null; }
  function ultimaPublicada(plano) {
    return [...lista(plano)].reverse().find((v) => v.status === 'publicada') || null;
  }
  // A versão que a seta da Visão Geral abre: a em construção ou, se não houver, a última publicada
  function deTrabalho(plano) { return emConstrucao(plano) || ultimaPublicada(plano); }
  function somenteLeitura(plano) { const v = aberta(plano); return !v || v.status === 'publicada'; }

  // Próximo número da sequência: 0.1, 0.2… (nunca reutiliza)
  function proximoNumero(plano) {
    const maior = lista(plano).reduce((m, v) => Math.max(m, Number(v.num.split('.')[1])), 0);
    return `0.${maior + 1}`;
  }

  /*
   * Ao criar o plano nasce a 0.1, publicada (registro inicial, sem operações).
   * grupos: o conteúdo escolhido para começar (modelo ou arquivo); com conteúdo, nasce também a 0.2 em construção.
   * datas: { criadaEm, publicadaEm, por } para os planos de exemplo.
   */
  function iniciar(plano, grupos, { quando = agora(), por = usuario() } = {}) {
    plano.versoes = [{ num: '0.1', status: 'publicada', grupos: [], criadaEm: quando, criadaPor: por,
                       origem: null, publicadaEm: quando, publicadaPor: por }];
    plano.versaoAberta = '0.1';
    plano.grupos = [];
    plano.pendente = false;
    if (grupos && grupos.length) {
      plano.versoes.push({ num: '0.2', status: 'construcao', grupos: copiar(grupos), criadaEm: quando, criadaPor: por,
                           origem: '0.1', salvaEm: quando, salvaPor: por });
      abrir(plano, '0.2');
    }
  }

  // Plano recém-criado: só a 0.1, vazia. O Planejamento mostra as opções de início (Telas.inicioPlano).
  function aIniciar(plano) {
    const l = lista(plano);
    return l.length === 1 && !l[0].grupos.length;
  }

  // Opção de início escolhida: nasce a 0.2 em construção com esse conteúdo (pode ser vazio) e abre
  function comecar(plano, grupos) {
    const num = proximoNumero(plano);
    plano.versoes.push({ num, status: 'construcao', grupos: copiar(grupos), criadaEm: agora(), criadaPor: usuario(),
                         origem: '0.1', salvaEm: agora(), salvaPor: usuario() });
    abrir(plano, num);
    return num;
  }

  // Abre a versão na área de trabalho (descarta alterações não salvas: quem chama confirma antes)
  function abrir(plano, num) {
    const v = buscar(plano, num);
    if (!v) return;
    plano.versaoAberta = num;
    plano.grupos = copiar(v.grupos);
    plano.pendente = false;
  }

  function salvar(plano) {
    const v = aberta(plano);
    if (!v || v.status !== 'construcao') return;
    v.grupos = copiar(plano.grupos);
    v.salvaEm = agora();
    v.salvaPor = usuario();
    plano.pendente = false;
  }

  function publicar(plano) {
    const v = aberta(plano);
    if (!v || v.status !== 'construcao') return;
    salvar(plano);
    v.status = 'publicada';
    v.publicadaEm = agora();
    v.publicadaPor = usuario();
  }

  // Cria a próxima versão a partir de uma publicada e já abre. Com outra em construção, não cria nada.
  function criarNova(plano, origemNum) {
    const existente = emConstrucao(plano);
    if (existente) return { jaExiste: existente.num };
    const origem = buscar(plano, origemNum) || ultimaPublicada(plano);
    const num = proximoNumero(plano);
    plano.versoes.push({ num, status: 'construcao', grupos: copiar(origem.grupos), criadaEm: agora(), criadaPor: usuario(),
                         origem: origem.num, salvaEm: agora(), salvaPor: usuario() });
    abrir(plano, num);
    return { num, origem: origem.num };
  }

  // Planejamento da versão (a aberta usa a área de trabalho)
  function grupos(plano, v) {
    return v.num === plano.versaoAberta ? plano.grupos : v.grupos;
  }

  // "13/10 às 14:20"
  function quando(data) {
    if (!data) return '';
    const d = new Date(data);
    return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function rotuloStatus(v) { return v.status === 'construcao' ? 'Em construção' : 'Publicada'; }

  // Linha de detalhe: "Publicada em 12/10 às 17:05 por Maria Gonçalves"
  function detalhe(v) {
    return v.status === 'publicada'
      ? `Publicada em ${quando(v.publicadaEm)} por ${v.publicadaPor}`
      : `Salva em ${quando(v.salvaEm)} por ${v.salvaPor}${v.origem ? ` · origem ${v.origem}` : ''}`;
  }

  return {
    lista, buscar, aberta, emConstrucao, ultimaPublicada, deTrabalho, somenteLeitura, proximoNumero,
    iniciar, aIniciar, comecar, abrir, salvar, publicar, criarNova, grupos, quando, rotuloStatus, detalhe
  };
})();
