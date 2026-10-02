# Tela 02 — Modal Criar Plano de Safra

Imagem: `referencias/02-modal-criar-plano.png`

## Objetivo
Definir o contexto do novo plano (safra, empresa, fazenda, cultura) e como ele vai começar.

## Quando aparece
- Por cima da Tela 01 ou da Tela 03, ao clicar em "Criar Plano Safra".

## Conteúdo
- Título: "Criar Plano de Safra"; subtítulo: "Defina o contexto do novo planejamento."; botão X para fechar.
- Campos, nesta ordem, todos obrigatórios: Safra, Empresa, Fazenda, Cultura.
- Abaixo de Safra, link "+ Criar nova safra".
- Pergunta "Como deseja iniciar o plano?" com quatro cards (um selecionado por vez):

| Card | Texto | Comportamento |
|---|---|---|
| Usar modelo (pré-selecionado) | Use uma estrutura pronta de operações e ajuste conforme necessário. | Carrega a lista de operações de exemplo. |
| Plano em branco | Monte a lista de operações conforme a realidade da fazenda. | Lista de operações vazia. |
| Importar XLSX | Importe um planejamento existente a partir de uma planilha. | Na v1 aceita só o arquivo exportado pelo próprio protótipo. Implementar depois; por enquanto pode ser escolhido, mas "Continuar para as operações" mostra o aviso "Em construção" por cima do modal e não cria o plano (o que foi preenchido continua no modal). |
| Clonar safra anterior | Utilize o plano de uma safra anterior como base para o novo planejamento. | Desabilitado, com selo "Em breve". Sem ação. |

- Botões no rodapé: "Cancelar" e "Continuar para as operações".

## Regras
- "Criar nova safra": abre um campo para digitar o nome; a safra nova entra na lista já selecionada. A safra tem só o nome.
- Um único plano por safra e fazenda: se a combinação já existir, não deixar criar outro.
- "Continuar para as operações" fica desabilitado até os quatro campos estarem preenchidos.
- Ao continuar, o plano é criado com: status "Em construção", área 0 ha, custo e receita vazios, última atualização = hoje, atualizado por = usuário logado.

## Navegação
- "Cancelar" ou X → fecha o modal e volta à tela de origem, sem criar nada.
- "Continuar para as operações" → Tela 04 · Operações do plano, no primeiro grupo de operações.
