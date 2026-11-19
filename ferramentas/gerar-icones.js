/*
 * Gera a pasta icone/ com os ícones do Plano de Safra em SVG, um arquivo por ícone.
 * O nome diz onde o ícone aparece (ex.: icone_menu_plano_safra.svg).
 * Rodar de novo quando um ícone mudar: node ferramentas/gerar-icones.js
 */
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const destino = path.join(raiz, 'icone');
const ler = (f) => fs.readFileSync(path.join(raiz, f), 'utf8');

// Arquivo SVG avulso: traço na cor do texto (currentColor), como no produto
function salvar(nome, interno, { espessura = 1.8, caixa = '0 0 24 24' } = {}) {
  const limpo = interno.replace(/<!--[\s\S]*?-->/g, '').replace(/\s*\n\s*/g, '').trim()
    .replace(/class="icone-disquete__fundo"/g, 'fill="#E6F2EC"');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${caixa}" fill="none" ` +
    `stroke="currentColor" stroke-width="${espessura}" stroke-linecap="round" stroke-linejoin="round">${limpo}</svg>\n`;
  fs.writeFileSync(path.join(destino, `${nome}.svg`), svg);
}
const miolo = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino);

// 1. Menu lateral (index.html), na ordem em que aparecem
const MENU = [
  ['icone_menu_plano_safra', 1.7], ['icone_menu_grupo_minimizar', 2], ['icone_menu_plano_safra_planos', 1.7],
  ['icone_menu_plano_safra_cronograma', 1.7], ['icone_menu_gestao', 1.7], null,
  ['icone_menu_gestao_operacoes', 1.7], ['icone_menu_gestao_estoque', 1.7], ['icone_menu_cadastros', 1.7], null,
  ['icone_menu_cadastros_safras', 1.7], ['icone_menu_cadastros_talhoes', 1.7], ['icone_menu_cadastros_culturas', 1.7],
  ['icone_menu_cadastros_tarefas', 1.7], ['icone_menu_recolher_expandir', 2.2],
  ['icone_menu_usuario_configuracoes', 1.8], ['icone_menu_usuario_sair', 1.8]
];
const svgsMenu = ler('index.html').match(/<svg[\s\S]*?<\/svg>/g);
if (svgsMenu.length !== MENU.length) throw new Error(`O menu tem ${svgsMenu.length} ícones; a lista daqui tem ${MENU.length}. Confira a lista MENU.`);
MENU.forEach((item, i) => { if (item) salvar(item[0], miolo(svgsMenu[i]), { espessura: item[1] }); });

// 2. Ícones das telas (js/icones.js). Os que não aparecem em nenhuma tela do produto ficam de fora
global.window = {};
eval(ler('js/icones.js'));
const TELAS = {
  limpar: 'icone_filtros_limpar', ajustes: 'icone_filtros_mais_filtros', busca: 'icone_filtros_pesquisar',
  fechar: 'icone_geral_fechar', mais: 'icone_botao_criar', lista: 'icone_geral_lista', lapis: 'icone_acao_editar',
  lixeira: 'icone_acao_excluir', copiar: 'icone_acao_copiar', desfazer: 'icone_acao_desfazer',
  baixar: 'icone_botao_exportar', planilha: 'icone_inicio_plano_importar_planilha', disquete: 'icone_plano_alteracoes_salvas',
  carregando: 'icone_plano_salvando', voltar: 'icone_botao_voltar', seta: 'icone_geral_seta_direita',
  anterior: 'icone_geral_anterior', proxima: 'icone_geral_proxima', abaixo: 'icone_geral_abrir_abaixo', acima: 'icone_geral_fechar_acima',
  recolher: 'icone_geral_recolher', expandir: 'icone_geral_expandir', ampliar: 'icone_painel_ampliar', reduzir: 'icone_painel_reduzir',
  certo: 'icone_geral_confirmado', info: 'icone_aviso_informacao', alerta: 'icone_aviso_alerta',
  calendario: 'icone_geral_calendario', relogio: 'icone_geral_relogio', grafico: 'icone_geral_grafico',
  documento: 'icone_planos_lista_cadastrados', casa: 'icone_plano_trilha_inicio', inserir: 'icone_plano_inserir_operacao',
  broto: 'icone_plano_grupo_fertilidade', talhoes: 'icone_plano_talhoes', tabela: 'icone_plantio_visao_tabela',
  mapa: 'icone_plantio_visao_mapa', pizza: 'icone_plantio_visao_indicadores', colheita: 'icone_indicadores_colheita',
  caixa: 'icone_resumo_produtos', prancheta: 'icone_validacao_resumo', proibido: 'icone_validacao_ignorar',
  olhoFechado: 'icone_validacao_pendencia_ignorada', ordenar: 'icone_tabela_ordenar', alfinete: 'icone_tabela_fixar_coluna',
  mais_opcoes: 'icone_tabela_mais_acoes', pendente: 'icone_status_atrasada', executada: 'icone_status_executada',
  sincronizar: 'icone_operacoes_dados_atualizados', caixaOk: 'icone_estoque_suficiente', caixaX: 'icone_estoque_insuficiente',
  camadas: 'icone_estoque_quantidade_planejada', importar: 'icone_talhoes_importar_geometria',
  poligono: 'icone_talhoes_desenhar_poligono', desmarcar: 'icone_talhoes_limpar_selecao', enquadrar: 'icone_talhoes_enquadrar_fazenda'
};
Object.entries(TELAS).forEach(([chave, nome]) => salvar(nome, miolo(window.Icones[chave])));

// 3. Ícones escritos direto nas telas
const pegar = (arquivo, re) => miolo(ler(arquivo).match(re)[0].match(/<svg[\s\S]*?<\/svg>/)[0]);
salvar('icone_configuracoes_aparencia_claro', pegar('js/configuracoes.js', /const SOL = '[^']*'/));
salvar('icone_configuracoes_aparencia_escuro', pegar('js/configuracoes.js', /const LUA = '[^']*'/));
salvar('icone_plano_grupo_operacao_campo', pegar('js/telas/04.0-operacoes-plano.js', /const TRATOR = '[^']*'/));
salvar('icone_plano_grupo_plantio', pegar('js/telas/04.0-operacoes-plano.js', /'Sementes': \['sementes', '[^']*'/));
salvar('icone_plano_grupo_defensivo', pegar('js/telas/04.0-operacoes-plano.js', /'Defensivos': \['defensivos', '[^']*'/));
salvar('icone_plano_grupo_aplicacao_insumos', pegar('js/telas/04.0-operacoes-plano.js', /'Aplicação de insumos': \['insumos', '[^']*'/));

// 4. Logo: só existe em PNG (não redesenhar); vai copiado como está
fs.copyFileSync(path.join(raiz, 'img/icone-unisystem.png'), path.join(destino, 'logo_unisystem.png'));

console.log(`${fs.readdirSync(destino).length} arquivos em icone/`);
