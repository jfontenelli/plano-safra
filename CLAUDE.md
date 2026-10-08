# Protótipo Plano de Safra — instruções para o Claude Code

## O que é
Protótipo navegável e preenchível do Plano de Safra (UniSystem), usado para validar a jornada com clientes (agrônomos, técnicos, compras). Não é o produto final nem o MVP.

## Onde está cada informação
- `docs/DECISOES.md` — fonte de verdade das regras de negócio.
- `docs/TELAS.md` — índice: lista das telas em ordem, situação de cada uma e mapa de navegação.
- `docs/telas/NN-nome.md` — detalhe de uma tela (objetivo, conteúdo, regras, navegação). Um arquivo por tela.
- `docs/telas/_MODELO.md` — modelo para novas telas.
- `referencias/NN-nome.png` — imagem de referência, com o mesmo número da tela (só consulta, não usar na página).
- `img/` — imagens usadas de verdade nas páginas (logo da empresa, ilustrações).

## Antes de qualquer tarefa
1. Leia `docs/DECISOES.md` e `docs/TELAS.md`.
2. Para construir uma tela, leia só o arquivo dela em `docs/telas/` e a imagem correspondente em `referencias/`.

## Forma de trabalho: tela a tela
- O protótipo é construído uma tela por vez. A usuária indica qual tela construir (ex.: "construa a tela docs/telas/01-primeiro-uso.md").
- Só construa a tela indicada. Não crie telas futuras por conta própria; onde houver link para uma tela ainda não construída, use uma página provisória "Em construção".
- Antes de codar cada tela: diga em poucas linhas o que entendeu e liste dúvidas (uma por vez). Só codifique depois da confirmação.
- Ao terminar: diga o que mudou, como testar no navegador e o que ficou como "Sugestão". Marque a tela como "Construída" na tabela de `docs/TELAS.md`. Depois aguarde a próxima tela.
- Não altere `docs/DECISOES.md` nem os arquivos de `docs/telas/` sem a usuária pedir.

## Regras de trabalho
- Não invente regra de negócio. Se algo não está em `docs/`, pergunte antes de implementar.
- Faça uma pergunta por vez.
- Quando precisar decidir algo de UX sem definição, implemente a opção mais simples e liste como "Sugestão" no resumo final da tarefa.
- Trabalhe em passos pequenos: uma tela ou um comportamento por vez. Ao final, diga o que mudou e como testar.
- Commits pequenos, com mensagem em português descrevendo a mudança.

## Tecnologia
- HTML, CSS e JavaScript puros. Sem framework (sem React, Vue etc.) e sem etapa de build.
- Abre direto no navegador (`index.html`) e publica no Netlify como site estático.
- Bibliotecas externas só por CDN e só se necessário (ex.: SheetJS para exportar/importar .xlsx).
- Dados ficam só na memória do navegador; ao fechar a página, se perdem (decisão da v1).
- Dados de exemplo em arquivo separado (`js/dados-exemplo.js`), fáceis de editar.

## Compartilhar (arquivo único)
- Para mandar o protótipo a alguém, a usuária compartilha só um HTML: `compartilhar/plano-safra.html`.
- Ele é gerado por `node ferramentas/gerar-compartilhar.js`, que junta CSS, JS e imagens de `img/` (em base64) num arquivo só. Única exceção à regra "sem etapa de build"; não muda como o protótipo funciona.
- Sempre regere o arquivo depois de mudar o protótipo (antes do commit).
- Imagens: referencie com o caminho completo e literal (ex.: `'img/fenologia/plantio.png'`), nunca montado com variáveis, senão o script não consegue embutir. Mantenha as imagens leves (< 100 KB).
- Mapa (Leaflet) e .xlsx (SheetJS) continuam vindo por CDN: precisam de internet.

## Estrutura sugerida
- `index.html` — casca única (menu lateral + área de conteúdo).
- `css/estilo.css` — variáveis de cor, tipografia e componentes.
- `js/app.js` — navegação entre telas e estado.
- `js/telas/*.js` — uma tela por arquivo.

## Visual
- Estilo próprio, clean e profissional. Menu lateral verde com o ícone reduzido da UniSystem.
- Logo da empresa em `img/`: use os arquivos de lá, nunca redesenhe nem recrie o logo.
  - `img/logo-unisystem.png` — logo completo, no topo do menu expandido.
  - `img/icone-unisystem.png` — só o ícone, no topo do menu recolhido.
  - Se só existir um dos arquivos, use o mesmo nos dois estados e me avise.
- Itens do menu: Plano de Safra, Ordens de Serviço, Cadastros. Usuário no rodapé do menu.
- Menu lateral começa expandido (ícone + nome) em todas as telas. O usuário pode recolher (só ícones) e expandir de novo com um botão de seta. O estado escolhido se mantém ao navegar entre telas.
- Não usar o nome UniGestor.
- Pensar na escala real: muitos talhões, operações e insumos (tabelas legíveis, filtros).

## Linguagem
- Interface em português do Brasil, com termos do dia a dia da fazenda (safra, talhão, DAP, OS).

## Referencias
Imagens em referencias/ são só referência visual. Quando divergirem dos documentos em docs/, os documentos valem.