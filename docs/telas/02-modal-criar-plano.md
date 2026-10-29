# Tela 02 — Modal Criar Plano de Safra

Imagem: `referencias/02-modal-criar-plano.png` (versão antiga, com "Como deseja iniciar"; os documentos valem).

## Objetivo
Identificar os novos planos: informações gerais (safra, empresa, atividade, cultura) e as fazendas, cada uma com os seus talhões. Como cada plano vai começar é escolhido depois, no modal "Como deseja iniciar o plano?" (ver abaixo e DECISOES 4.1.1).

## Quando aparece
- Por cima da Tela 01 ou da Tela 03, ao clicar em "Criar Plano Safra".

## Conteúdo
- Título: "Criar Plano de Safra"; subtítulo: "Defina as informações gerais do plano e selecione as fazendas que farão parte da criação."; botão X para fechar.
- **Informações gerais**, lado a lado, todas obrigatórias: Safra, Empresa, Atividade, Cultura.
  - Na lista de Safra, a última opção é "+ Criar nova safra".
  - Aberto pelo link do aviso sem plano da Visão Geral (Tela 03): a lista de Safra traz só as safras do Ano Agrícola do filtro, e Safra, Empresa e Fazenda já vêm com o que os filtros dizem.
  - Atividade: Agricultura (já escolhida), Pecuária (Em breve), Silvicultura (Em breve).
  - Cultura: Soja e Milho (nenhuma vem escolhida).
- **Fazendas**: um bloco por fazenda, com o título "Fazenda 1", "Fazenda 2"… e três campos:
  - **Fazenda** (obrigatória): só as fazendas da **empresa escolhida** (cada empresa tem as suas; nos dados de exemplo, `fazendasPorEmpresa`). Sem empresa, a lista fica desabilitada, com "Escolha a empresa". Trocar a empresa desmarca a fazenda que não é dela (e os talhões).
  - **Talhões** (opcional; o rótulo não diz "(opcional)", 29/10/2026): lista com caixas de marcar ("Todos" e cada talhão com a área). O campo mostra "Todos os talhões (12)", "9 de 10 talhões" ou "Selecionar talhões".
  - **Área de cultivo**: calculada (fundo cinza), soma dos talhões marcados; sem talhões, "Pendente".
  - Sem talhões marcados, embaixo: "A área de cultivo será calculada automaticamente quando houver talhões selecionados."
  - Com mais de um bloco, cada um tem a lixeira para remover.
- Botão "+ Adicionar fazenda" abaixo dos blocos.
- Rodapé: "Cancelar" e "Criar Plano de Safra".

## Regras
- "Criar nova safra": abre uma **janela pequena por cima do formulário**, "**Nova safra**" (subtítulo "A safra nova entra na lista e fica selecionada."), com o campo **Safra*** ("Nome da safra (ex.: 26/27)", já com o cursor) e os botões **Cancelar** e **Confirmar** (desabilitado com o campo vazio). A safra tem só o nome.
  - **Confirmar** ou **Enter**: a janela fecha, a safra nova entra na lista já selecionada e o cursor vai para Empresa. Nome que já existe: só seleciona a safra existente.
  - **Cancelar** ou **Esc**: fecha sem criar; a Safra volta ao que estava.
  - **Clicar fora** (no formulário de trás) não fecha nem deixa seguir para Empresa: o cursor volta ao campo e aparece, em âmbar, "Confirme ou cancele a nova safra."
  - Motivo: no teste com usuários, com o campo dentro do formulário e o botão Adicionar, as pessoas digitavam e seguiam sem adicionar, achando que estava salvo.
- Ao escolher a fazenda, **todos os talhões vêm marcados** e a área aparece na hora; a pessoa desmarca os que não quer. Trocar a fazenda marca de novo todos os talhões da nova.
- Talhões não são obrigatórios: sem nenhum, a área fica "Pendente" e o plano pode ser criado.
- **O plano mostra só os talhões incluídos** (Planejamento, mapa, Calendário, importação). Incluir ou remover talhões depois, dentro do plano: **Mais ações ▾ → Editar talhões** (só na versão em construção; ver DECISOES 4.2).
- **Um plano por fazenda**: com duas fazendas, nascem dois planos.
- Um único plano por safra e fazenda: não deixa repetir a fazenda em dois blocos ("A Fazenda X já está em outro bloco.") nem criar um plano que já existe ("Já existe um plano da safra 26/27 para a Fazenda X."), avisos abaixo do campo Fazenda.
- "Criar Plano de Safra" parece desabilitado até tudo estar certo; clicado, mostra "Preenchimento obrigatório" nos campos vazios e, ao lado dos botões, "Preencha os campos obrigatórios." ou "Confira as fazendas.".
- Cada plano nasce só com a **versão 0.1, publicada e vazia** (DECISOES 4.1.1), área de cultivo dos talhões incluídos, última atualização = hoje, atualizado por = usuário logado. Na lista, aparece como **"Não iniciado"**.
- Esc com a lista de talhões aberta fecha só a lista.

## Navegação
- "Cancelar" ou X → fecha o modal e volta à tela de origem, sem criar nada.
- A lista de talhões abre por cima do modal (abaixo do campo ou, sem espaço, acima) e não é cortada pela rolagem do formulário.
- "Criar Plano de Safra" → **volta para a Visão Geral** (Tela 03, guia Planos de Safra), com o filtro Ano Agrícola no da safra dos planos criados e o aviso "Plano criado: Fazenda X. Clique na linha para começar." (ou "2 planos criados (…). Clique na linha de cada um para começar.").

---

# Modal "Como deseja iniciar o plano?"

## Quando aparece
- Por cima da Visão Geral, ao abrir um plano **não iniciado** (só a 0.1, vazia): clique na linha, "Abrir" no ⋯ ou menu Planejamento.

## Conteúdo
- Título "Como deseja iniciar o plano?"; subtítulo só com o plano: "Safra 26/27 · Empresa A · Fazenda São José · Soja" (19/10/2026). Ao começar, o plano passa para a versão 0.2, em construção, e abre na aba Planejamento.
- Três cards (um escolhido por vez; Usar modelo de operações já vem marcado), um embaixo do outro, na largura do modal, nesta ordem (29/10/2026: nomes e textos novos; saiu Começar do zero):

| Card | Texto | Comportamento |
|---|---|---|
| Usar modelo de operações | Use uma lista de operações e ajuste conforme necessário. | Grupos e operações do modelo da cultura do plano (Soja ou Milho). |
| Importar planilha Excel | Continue um plano exportado por este sistema. | Campo do arquivo (obrigatório). Ver as regras abaixo. |
| Copiar outro plano de safra | Copie um plano de safra da mesma cultura. | Lista "Plano para copiar" (obrigatória). Ver as regras abaixo. |

- Rodapé: "Cancelar" e "Começar o planejamento".

## Regras
- **Importar planilha Excel** (só o .xlsx exportado pelo Plano de Safra): ao carregar, mostra de qual plano é ("Planejamento da safra 26/27 · Empresa A · Fazenda São José · Soja"). Safra, Empresa, Fazenda e Cultura do plano são conferidas com as do arquivo; se forem diferentes, quadro amarelo "O arquivo é de outro plano" com as diferenças e o botão **Importar mesmo assim**. Talhões do arquivo que não estão no plano ficam de fora, com aviso. Arquivo que não é do sistema: "Este arquivo não foi exportado pelo Plano de Safra…". Sem arquivo: "Escolha o arquivo exportado pelo Plano de Safra."
- **Copiar outro plano de safra**: a lista mostra só os planos **da mesma cultura** (qualquer fazenda e safra) **já publicados**, como "Safra 26/27 · Empresa A · Fazenda Santa Clara · versão 0.2". Copia sempre a **última versão publicada**: grupos de operação, operações e recomendações com produtos e doses padrão. **Não copia** talhões, áreas, plantio, germinação nem doses próprias de talhão. Sem plano publicado: "Ainda não há plano de Soja publicado para copiar."
- "Começar o planejamento" cria a **0.2 em construção** com o conteúdo escolhido e abre o plano na aba Planejamento, com aviso quando importado ou copiado ("Copiado do plano da Fazenda Santa Clara (safra 26/27, versão 0.2)").
- Cancelar ou X: fecha; o plano continua não iniciado. Cada vez que o modal abre, começa em "Usar modelo de operações".
