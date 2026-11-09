# Tela 02 — Criar Plano de Safra

Imagem: `referencias/02-modal-criar-plano.png` (versão antiga; os documentos valem). Redesenhado em 09/11/2026: tela inteira, duas etapas, área planejada por talhão.

## Objetivo
Criar um plano: informações gerais, a fazenda com os talhões e a **área planejada** de cada um, e como o plano vai começar.

## Quando aparece
- Por cima da Tela 01 ou da Tela 03, ao clicar em "Criar Plano Safra".

## Conteúdo
- **Ocupa a tela inteira** (o modal todo; o conteúdo usa a largura toda e o modal rola quando a tabela não cabe). No topo, o indicador de etapas **1 Definir o plano ── 2 Como iniciar** (as duas próximas, ligadas por uma linha curta; a etapa atual em verde) e o X para fechar.
- **Etapa 1 · Definir o plano**: título "Criar Plano de Safra"; subtítulo "Defina as informações gerais e selecione as áreas que farão parte do plano."
  - **Informações gerais**, numa linha, todas obrigatórias: **Safra · Atividade · Cultura · Fazenda** (com o nível Empresa, ver DECISOES 3: Safra · Empresa · Atividade · Cultura · Fazenda).
    - Na lista de Safra, a última opção é "+ Criar nova safra".
    - Aberto pelo link do aviso sem plano da lista (Tela 03): a lista de Safra traz só as safras do Ano Agrícola do filtro, e Safra e Fazenda já vêm com o que os filtros dizem.
    - Atividade: Agricultura (já escolhida), Pecuária (Em breve), Silvicultura (Em breve).
    - Cultura: Soja e Milho (nenhuma vem escolhida).
    - **Fazenda: uma por vez** (um plano por criação). Com o nível Empresa, só as da empresa escolhida.
  - **Talhões** ("Selecione os talhões e ajuste a área planejada quando necessário."): tabela com **Talhão** (caixa de marcar; a do título marca ou desmarca todos) · **Área cadastrada** · **Área planejada** (com o lápis). Sem fazenda: "Escolha a fazenda para ver os talhões."
  - No pé da tabela: **Área planejada total**, "810 / 845 ha" e "95,9% da área cadastrada" (a área cadastrada da fazenda inteira).
  - Rodapé: **Cancelar** e **Próximo →**.
- **Etapa 2 · Como iniciar**: título "Como deseja iniciar o plano?", subtítulo com o plano ("Safra 27/27 · Fazenda Santa Clara · Soja") e as opções do modal abaixo. Rodapé: **‹ Voltar** e **Começar o planejamento**.

## Regras
- Ao escolher a fazenda, **todos os talhões vêm marcados**, com a área planejada igual à cadastrada; a pessoa desmarca os que não quer. Trocar a fazenda volta tudo ao começo.
- **Área planejada** (clique no valor ou no lápis): campo com o número; **Enter** ou sair do campo grava; **Esc** desfaz. Vale de **0,1 ha até a área cadastrada**; acima: "Máximo 95 ha (área cadastrada)."; vazio ou zero: "Informe a área, a partir de 0,1 ha." Área diferente da cadastrada fica em verde. Para tirar o talhão do plano, desmarca-se a caixa (área "—").
- A área planejada **vale em tudo dentro do plano**: área de cultivo, quantidades de semente e de produtos, Orçamento, Calendário, OS e planilha exportada. O cadastro da fazenda não muda.
- Talhões não são obrigatórios: sem nenhum, a área fica "Pendente" e o plano pode ser criado.
- "Criar nova safra": abre uma **janela pequena por cima do formulário**, "**Nova safra**" (subtítulo "A safra nova entra na lista e fica selecionada."), com o campo **Safra*** ("Nome da safra (ex.: 26/27)", já com o cursor) e os botões **Cancelar** e **Confirmar** (desabilitado com o campo vazio). A safra tem só o nome.
  - **Confirmar** ou **Enter**: a janela fecha, a safra nova entra na lista já selecionada e o cursor vai para o campo seguinte. Nome que já existe: só seleciona a safra existente.
  - **Cancelar** ou **Esc**: fecha sem criar; a Safra volta ao que estava.
  - **Clicar fora** não fecha: o cursor volta ao campo e aparece, em âmbar, "Confirme ou cancele a nova safra."
- **Um único plano por safra, fazenda e cultura** (09/11/2026; antes, safra e fazenda): não deixa criar um plano que já existe ("Já existe um plano de Milho da safra 27/27 para a Fazenda Boa Vista.", abaixo do campo Fazenda). Ex.: com a soja 27/27 da Boa Vista, o milho 27/27 da Boa Vista pode.
- "Próximo" parece desabilitado até tudo estar certo; clicado, mostra "Preenchimento obrigatório" nos campos vazios e, ao lado dos botões, "Preencha os campos obrigatórios." ou "Confira a fazenda.".
- **O plano só passa a existir em "Começar o planejamento"**: nasce com a versão 0.1 publicada (registro inicial) e a **0.2 em construção** com o conteúdo escolhido (DECISOES 4.1.1), e abre no Planejamento com o aviso "Plano criado". Até lá não existe nada: **‹ Voltar** volta à etapa 1 sem perder o que foi preenchido; Cancelar, X ou Esc descartam tudo.
- **O plano mostra só os talhões incluídos**. Incluir, remover ou mudar a área depois, dentro do plano: **Mais ações ▾ → Editar talhões** (só na versão em construção; ver DECISOES 4.2).

## Navegação
- "Cancelar", X ou Esc → fecha e volta à tela de origem, sem criar nada.
- "Próximo" → etapa 2. "‹ Voltar" → etapa 1.
- "Começar o planejamento" → o plano novo, na aba Planejamento.

---

# Modal "Como deseja iniciar o plano?"

## Quando aparece
- Como **etapa 2 do Criar Plano de Safra** (09/11/2026; acima).
- Por cima da lista de planos, ao abrir um plano **não iniciado** (só a 0.1, vazia; planos criados antes de 09/11/2026): clique na linha ou "Abrir" no ⋯.

## Conteúdo
- Título "Como deseja iniciar o plano?"; subtítulo só com o plano: "Safra 26/27 · Fazenda São José · Soja" (a Empresa só com o nível Empresa; DECISOES 3). Ao começar, o plano passa para a versão 0.2, em construção, e abre na aba Planejamento.
- Três cards (um escolhido por vez; Usar modelo de operações já vem marcado), um embaixo do outro, na largura do modal, nesta ordem (09/11/2026: Copiar antes de Importar; 29/10/2026: nomes e textos novos; saiu Começar do zero):

| Card | Texto | Comportamento |
|---|---|---|
| Usar modelo de operações | Use uma lista de operações e ajuste conforme necessário. | Grupos e operações do modelo da cultura do plano (Soja ou Milho). |
| Copiar outro plano de safra | Copie um plano de safra da mesma cultura. | Lista "Plano para copiar" (obrigatória). Ver as regras abaixo. |
| Importar planilha Excel | Continue um plano exportado por este sistema. | Campo do arquivo (obrigatório). Ver as regras abaixo. |

- Rodapé: "Cancelar" e "Começar o planejamento".

## Regras
- **Importar planilha Excel** (só o .xlsx exportado pelo Plano de Safra): ao carregar, mostra de qual plano é ("Planejamento da safra 26/27 · Empresa A · Fazenda São José · Soja"). Safra, Empresa, Fazenda e Cultura do plano são conferidas com as do arquivo; se forem diferentes, quadro amarelo "O arquivo é de outro plano" com as diferenças e o botão **Importar mesmo assim**. Talhões do arquivo que não estão no plano ficam de fora, com aviso. Arquivo que não é do sistema: "Este arquivo não foi exportado pelo Plano de Safra…". Sem arquivo: "Escolha o arquivo exportado pelo Plano de Safra."
- **Copiar outro plano de safra**: a lista mostra só os planos **da mesma cultura** (qualquer fazenda e safra) **já publicados**, como "Safra 26/27 · Empresa A · Fazenda Santa Clara · versão 0.2". Copia sempre a **última versão publicada**: grupos de operação, operações e recomendações com produtos e doses padrão. **Não copia** talhões, áreas, plantio, germinação nem doses próprias de talhão. Sem plano publicado: "Ainda não há plano de Soja publicado para copiar."
- "Começar o planejamento" cria a **0.2 em construção** com o conteúdo escolhido e abre o plano na aba Planejamento, com aviso quando importado ou copiado ("Copiado do plano da Fazenda Santa Clara (safra 26/27, versão 0.2)").
- Cancelar ou X: fecha; o plano continua não iniciado. Cada vez que o modal abre, começa em "Usar modelo de operações".
