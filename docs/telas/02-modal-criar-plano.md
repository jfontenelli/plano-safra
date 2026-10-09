# Tela 02 — Modal Criar Plano de Safra

Imagem: `referencias/02-modal-criar-plano.png`

## Objetivo
Definir o contexto do novo plano (safra, empresa, fazenda, cultura) e como ele vai começar.

## Quando aparece
- Por cima da Tela 01 ou da Tela 03, ao clicar em "Criar Plano Safra".

## Conteúdo
- Título: "Criar Plano de Safra"; subtítulo: "Defina o contexto do novo planejamento."; botão X para fechar.
- Campos, nesta ordem, todos obrigatórios: Safra, Empresa, Fazenda, Cultura.
- Na lista de Safra, a última opção é "+ Criar nova safra".
- Pergunta "Como deseja iniciar o plano?" com três cards (um selecionado por vez):

| Card | Texto | Comportamento |
|---|---|---|
| Usar modelo (pré-selecionado) | Use uma estrutura pronta de operações e ajuste conforme necessário. | Carrega a lista de operações de exemplo. |
| Importar XLSX | Continue um plano exportado por este sistema (.xlsx). | Na v1 aceita só o arquivo exportado pelo próprio protótipo. Ver as regras abaixo. |
| Clonar safra anterior | Utilize o plano de uma safra anterior como base para o novo planejamento. | Desabilitado, com selo "Em breve". Sem ação. |

- Na v1 **não há "Plano em branco"**: o plano sempre nasce do modelo (ou do arquivo importado), e quem quiser outra estrutura exclui grupos ou operações e cria os seus na etapa Operações (Tela 04.0).
- Botões no rodapé: "Cancelar" e "Continuar para as operações".

## Regras
- "Criar nova safra": abre uma **janela pequena por cima do formulário**, "**Nova safra**" (subtítulo "A safra nova entra na lista e fica selecionada."), com o campo **Safra*** ("Nome da safra (ex.: 26/27)", já com o cursor) e os botões **Cancelar** e **Confirmar** (desabilitado com o campo vazio). A safra tem só o nome.
  - **Confirmar** ou **Enter**: a janela fecha, a safra nova entra na lista já selecionada e o cursor vai para Empresa. Nome que já existe: só seleciona a safra existente.
  - **Cancelar** ou **Esc**: fecha sem criar; a Safra volta ao que estava.
  - **Clicar fora** (no formulário de trás) não fecha nem deixa seguir para Empresa: o cursor volta ao campo e aparece, em âmbar, "Confirme ou cancele a nova safra."
  - Motivo: no teste com usuários, com o campo dentro do formulário e o botão Adicionar, as pessoas digitavam e seguiam sem adicionar, achando que estava salvo.
- Um único plano por safra e fazenda: se a combinação já existir, não deixar criar outro.
- "Continuar para as operações" fica desabilitado até os quatro campos estarem preenchidos.
- Ao continuar, o plano é criado com: status "Em construção", área 0 ha, custo e receita vazios, última atualização = hoje, atualizado por = usuário logado.
- Com uma opção só na lista (ex.: Cultura, por enquanto só Soja), ela já vem escolhida.
- **Importar XLSX** (só o arquivo exportado pelo Plano de Safra):
  - Ao escolher o card, aparece o campo "Arquivo exportado pelo Plano de Safra (.xlsx)" (obrigatório). Ao carregar, mostra de qual plano é ("Planejamento da safra 26/27 · Empresa A · Fazenda São José · Soja") e preenche os campos do modal que estiverem vazios.
  - **O sistema confere Safra, Empresa, Fazenda e Cultura do modal com as do arquivo.** Se algum for diferente, quadro amarelo "O arquivo é de outro plano" com as diferenças ("Safra: no modal 26/27 · no arquivo 25/26") e os botões **Usar os do arquivo** (troca os campos do modal) e **Manter os do modal** (importa para a safra e a fazenda escolhidas, ex.: começar a 26/27 a partir da 25/26). Mudar um campo depois volta a conferir.
  - Fazenda diferente: avisa quais talhões do arquivo não existem na fazenda e ficam de fora (o planejamento é por talhão; talhões com o mesmo nome recebem o que estava no arquivo).
  - Arquivo que não é do sistema (sem a aba "plano"): "Este arquivo não foi exportado pelo Plano de Safra. Na v1, só dá para importar um planejamento exportado por este sistema."
  - Continuar sem arquivo: "Escolha o arquivo exportado pelo Plano de Safra." Com diferença sem escolha, não continua.
  - O plano importado abre com grupos, operações, plantio, TSI e recomendações (com as doses de cada talhão) e começa "Em construção". Aviso "Planejamento importado", com os talhões que ficaram de fora, se houver. Produto ou variedade que não está no cadastro entra como pré-cadastro.

## Navegação
- "Cancelar" ou X → fecha o modal e volta à tela de origem, sem criar nada.
- "Continuar para as operações" → etapa Operações do plano (Tela 04.0).
