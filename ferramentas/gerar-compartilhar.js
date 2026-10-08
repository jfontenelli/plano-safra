// Gera compartilhar/plano-safra.html: um único arquivo com todo o protótipo,
// para mandar a alguém sem a pasta do projeto.
// - CSS e JS locais vão para dentro do HTML.
// - Imagens de img/ viram texto (base64) dentro do arquivo.
// - Bibliotecas de CDN (mapa e .xlsx) continuam vindo da internet.
// Uso (na pasta do projeto): node ferramentas/gerar-compartilhar.js

const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const destino = path.join(raiz, 'compartilhar', 'plano-safra.html');

const ler = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
const ehLocal = (src) => !/^(https?:)?\/\//.test(src);

const TIPOS = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', webp: 'image/webp', gif: 'image/gif' };

let html = ler('index.html');

// <link rel="stylesheet" href="css/..."> → <style>
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (tag, href) =>
  ehLocal(href) ? `<style>\n${ler(href)}\n</style>` : tag);

// <script src="js/..."></script> → <script>conteúdo</script>
html = html.replace(/<script src="([^"]+)"><\/script>/g, (tag, src) =>
  ehLocal(src) ? `<script>\n${ler(src).replace(/<\/script/gi, '<\\/script')}\n</script>` : tag);

// Caminhos img/... (no HTML, CSS e JS) → data URI
const faltando = new Set();
html = html.replace(/img\/[\w\-\/.]+\.(png|jpe?g|svg|webp|gif)/gi, (caminho, ext) => {
  const arquivo = path.join(raiz, caminho);
  if (!fs.existsSync(arquivo)) { faltando.add(caminho); return caminho; }
  const base64 = fs.readFileSync(arquivo).toString('base64');
  return `data:${TIPOS[ext.toLowerCase()]};base64,${base64}`;
});

fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, html);

const kb = Math.round(fs.statSync(destino).size / 1024);
console.log(`Gerado: compartilhar/plano-safra.html (${kb} KB)`);
if (faltando.size) console.log('Atenção, imagens não encontradas:', [...faltando].join(', '));
