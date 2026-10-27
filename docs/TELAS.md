# Telas do protótipo — índice

O detalhe de cada tela fica em `docs/telas/`. Este arquivo só lista as telas, em ordem, e mostra como uma leva à outra.
Regras de negócio ficam em `docs/DECISOES.md`.

## Regras gerais (valem para todas as telas)
- Números da tela (indicadores, contagens, somas) são sempre calculados a partir dos dados, nunca copiados das imagens. Os valores das imagens são só ilustrativos.
- Dados de exemplo ficam em `js/dados-exemplo.js`.
- Os dados ficam só na memória do navegador (v1).
- Link para tela ainda não construída → página provisória "Em construção".

## Telas

| Nº | Tela | Arquivo | Imagem | Situação |
|---|---|---|---|---|
| — | Menu e contexto do plano | DECISOES 4.0 e 4.1.1 | rascunhos/navegacao-contexto.html | Construída: menu com Plano de Safra (Visão Geral · Planejamento · Orçamento) e Gestão da Lavoura (Calendário Agrícola · Central OS · Planejado x Executado), cada grupo com a setinha que minimiza (26/10/2026); menu do usuário com Configurações › Aparência (Claro ou Escuro) e Sair; cabeçalho fixo com versão, "✓ Salvamento automático", Publicar versão / Criar nova versão e Mais ações (Editar talhões, Exportar, Trocar versão); abas Operações · Planejamento · Programação; talhões por versão |
| 01 | Primeiro uso | telas/01-primeiro-uso.md | referencias/01-primeiro-uso.png | Construída |
| 02 | Modal Criar Plano de Safra e modal "Como deseja iniciar o plano?" | telas/02-modal-criar-plano.md | referencias/02-modal-criar-plano.png (antiga) | Construída: informações gerais com Atividade, várias fazendas (um plano por fazenda) com talhões e área de cultivo; início em modal ao abrir o plano (modelo, XLSX, copiar plano publicado, do zero) |
| 03 | Visão Geral (Planos de Safra e Histórico de versões) | telas/03-lista-planos.md | referencias/03-lista-planos.png, rascunhos/navegacao-contexto.html | Construída: caminho "Plano de Safra › Visão Geral"; guias Planos de Safra e Histórico de versões, com Criar Plano Safra na mesma linha; foto do campo no topo só no escuro; filtros Ano Agrícola, Atividade produtiva, Safra, Empresa, Fazenda, Cultura (Status no Histórico); sem os quadros Planejamento das Fazendas (20/10/2026); tabela com os planos (Não iniciado, Em construção e Publicado, nessa ordem), sem as colunas de % por grupo (19/10/2026), ordenação por coluna; sem plano nos filtros, "Nenhum Plano de Safra cadastrado" com o link + Criar Plano Safra (modal com os filtros) e menu ⋯ (comparação de versões: a detalhar) |
| 04.0 | Operações (estrutura do plano) | telas/04.0-operacoes.md | referencias/04.0-operacao.png, rascunhos/calendario-estados.html (etapa 1) | Construída: tabela na ordem da safra (sem faixa de fase), grupo escolhido na linha, grupo vazio continua; grupo Colheita; filtro por grupo de operação (grupo novo aparece já ao salvar); sem a dica do rodapé (20/10/2026); "+" insere linha abaixo; caixas de marcar sempre à vista e lixeira para excluir em lote (com confirmação); Editar abre o modal Grupos de operação (renomear, adicionar e excluir grupos); sem mover em lote (19/10/2026) |
| 04.1 | Planejamento (grupo Defensivo) | telas/04.1-operacoes-defensivos.md | referencias/04.1-operacao-defensivos.png | Construída |
| 04.2 | Planejamento (grupo Plantio, antes Semente) | telas/04.2-operacoes-sementes.md | quadro de design (telas A e B); painel: imagem da usuária (19/10) | Construída: Plantio com várias variedades por talhão (uma linha por variedade, Área do talhão e Área de aplicação; clique na linha abre o painel, botão direito Inserir · Excluir · Limpar); painel resumido (uma variedade: gráfico e os campos Variedade · Germinação · Data de plantio · Pop.) e expandido (mais de uma variedade ou "+ Adicionar variedade": histórico à esquerda e variedades à direita, com a germinação do talhão e a tabela; setas no rodapé) (20/10/2026); coluna Ciclo (dias) separada na tabela; modal Definir plantio com a composição em %; Tabela, Mapa (hachura) e Previsão de colheita |
| 04.3 | Planejamento (grupo Fertilidade) | telas/04.3-operacoes-fertilidade.md | — (layout da Tela 04.1) | Construída: operações do modelo, matéria-prima e cadastro (produtos de cliente a conferir) |
| 04.4 | Planejamento (grupo Tratamento de semente) | rascunhos/tsi/04.4-operacoes-tratamento-sementes.md | — (layout da Tela 04.1) | Pausada: fora do protótipo por enquanto (15/10/2026); guardado em rascunhos/tsi/ (marca no git `tsi-15-10-2026`); retomar por rascunhos/tsi/README.md |
| 05 | Calendário Agrícola (aba Programação do plano, antes Resumo) | telas/05-calendario-agricola.md | referencias/05-calendario-agricola.png, referencias/05.3-resumo-calendario.png | Construída: Programação (tabela) e Ciclo Produtivo (por fase). A guia Calendário virou as escalas Mês, Semana e Dia do Calendário Agrícola de Gestão da Lavoura (Tela 07) |
| 06 | Orçamento de Insumos (menu Orçamento, vários planos somados) | telas/06-orcamento.md | referencias/suprimentos.png; escuro: imagem da usuária (19/10, só os cartões do Resumo) | Construída: moeda de exibição R$/US$; filtros com várias escolhas; estimativas de comercialização (Editar parâmetros); Resumo do orçamento; Orçamento por tipo de insumo; Detalhamento Por produto e Por talhão com busca, ordenação, paginação e Exportar XLSX; cabeçalho congelado (alfinete) |
| 08 | Minhas tarefas (antes aba de Gestão da Lavoura › Operações Agrícolas) | rascunhos/minhas-tarefas/08-central-operacoes.md | imagem da usuária (21/10) | Pausada: fora do protótipo desde 26/10/2026; guardada em rascunhos/minhas-tarefas/. Como estava: filtros Safra, Cultura, Empresa, Fazenda, Grupo de operação, Data inicial e final, com o texto do período; cartões A recomendar, Recomendação em atraso, Execução em atraso e Justificativas solicitadas; tabela do cartão (uma linha por talhão × operação, sem produto e dose) com ordenação e rolagem vertical (sem paginação); horizonte Hoje/Semana/Quinzena/Mês só em A recomendar (sem mapa); caixas de marcar e botão Recomendar (modal "Em construção"); ordenação com desempate pela data; OS de exemplo |
| 07 | Gestão da Lavoura › Calendário Agrícola (vários planos somados; juntou o Calendário Agrícola do menu Plano de Safra e a Agenda Agrícola) | telas/07-agenda-agricola.md | referencias/05.3-resumo-calendario.png; visão Ano: canvas de design (Claude Design, 16/10), escuro: imagem da usuária (19/10) | Construída (26/10/2026): caminho "⌂ Gestão da Lavoura › Calendário Agrícola"; lista suspensa Ano · Mês · Semana · Dia (abre em Ano); última versão publicada de cada plano; filtros com várias escolhas Safra, Cultura, Empresa, Fazenda, Talhão e Operação, os mesmos em todas as escalas; legenda que filtra um grupo por vez. Ano: Hoje · ‹ › (troca o ano agrícola) · ano; tabela Empresa › Fazenda › Safra/Safrinha (abre no nível Empresa; barras só no nível mais aberto de cada ramo), uma barra arredondada por operação numa faixa por grupo, sucessão de culturas na fazenda, Hoje só com a linha pontilhada cinza. Mês, Semana, Dia: abre em hoje, anda pelas setas; legenda e filtro Operação levam à primeira operação (todos volta para hoje); etiquetas dos talhões na Semana e no Dia; dias que já passaram esmaecidos |
| 09 | Gestão da Lavoura › Central OS (antes aba de Operações Agrícolas) | telas/09-central-operacoes-corp.md | imagens da usuária (21/10) | Construída (direto no HTML): página própria (26/10/2026), com o caminho "⌂ Gestão da Lavoura › Central OS"; filtros Safra, Cultura, Empresa, Fazenda, Grupo de operação, Data inicial e final; cartões Visão geral; gráficos Status da OS e Nº OS por Empresa/Fazenda/Executor; tabela Ordens de Serviço com Notificar selecionadas (pede justificativa) e Exportar CSV |
| 10 | Gestão da Lavoura › Planejado x Executado (antes Monitoramento › Aplicações; vários planos somados) | telas/10-aplicacoes.md | imagens da usuária (22 e 23/10) | Construída: página Planejado x Executado (26/10/2026, antes Aplicações) com as guias Executadas · Planejadas × Executadas · Duração da Operação (formato das abas do plano), cada uma com o seu subtítulo; filtros Safra (abre na safra atual), Cultura, Empresa e Fazenda (abrem marcadas só as da safra; listas sempre completas e independentes), Talhão, Grupo de operação (Defensivo) e Operação (1ª a 4ª Fungicida; volta a todas quando as marcadas não existem na safra); Limpar filtros volta a esse estado. Executadas: Fazenda, Talhão, Variedade, Plantas/m, Data de plantio (executada), uma coluna por operação na ordem do DAP (a data executada), Aplicações executadas e Dias sem aplicação, com ordenação em todas as colunas, títulos centralizados e Fazenda até Data de plantio congeladas. só as operações planejadas em ao menos um talhão filtrado. Planejadas × Executadas: uma linha por talhão (nome, fazenda e variedade em linhas; Operações com barrinhas na cor do status e a dica "operação: status"; "2 de 4 executadas 50%") e uma coluna estreita por operação; sem eixo e sem barra: a bolinha na cor do status, tudo na mesma altura; nome do status acima da etiqueta (+2 d, −3 d, Não iniciada N d, Em N d; na data, sem etiqueta); Planejada:/Executada: embaixo; cabeçalho baixo. Legenda Operação com bolinhas (Não iniciada, Iniciada antes, Iniciada na data, Iniciada com atraso, Planejada) e dicas, clicável, um status por vez; Iniciada antes em azul; em Executadas, a Não iniciada com a bolinha vermelha com exclamação, na legenda e na tabela (com a data planejada). Duração da Operação: só OS fechadas (abertura da recomendação até o fechamento); Por talhão (uma operação por vez com ‹ ›, só as com OS fechada; abre em todos os grupos e operações, na primeira pelo DAP; Safra, Empresa e Fazenda com escolha única) e Por operação (média dos talhões); barras verdes, prazo tracejado, legenda no rodapé. Dados simulados (datas executadas, estande e fechamento das OS); hoje é o dia real, e as datas do exemplo andam com ele (DADOS.dataReferencia) |

Situação: A definir → Pronta para construir → Construída.

Todas as telas construídas têm modo claro e escuro (Configurações › Aparência; DECISOES 4.0).

## Navegação

```
Menu "Plano de Safra"
 ├─ Visão Geral
 │   ├─ sem planos → 01 Primeiro uso ──[Criar Plano Safra]──┐
 │   └─ com planos → 03 Visão Geral ───[Criar Plano Safra]──┤
 │                       │                                   ▼
 │                       │                       02 Modal Criar Plano
 │                       │                        ├─[Cancelar / X]→ volta à tela de origem
 │                       │                        └─[Criar Plano de Safra]→ volta à Visão Geral (um plano por fazenda, "Não iniciado")
 │                       ├─[clique na linha]→ abre o plano (versão em construção ou última publicada)
 │                       │                    não iniciado → modal "Como deseja iniciar o plano?" → aba Operações (0.2)
 │                       ├─[guia Histórico de versões]→ uma linha por versão; clique abre a versão
 │                       └─[⋯]→ Abrir · Criar nova versão · Histórico de versões · Exportar XLSX · Excluir plano
 ├─ Planejamento (um plano e uma versão; sem plano aberto, o mais recente)
 │   └─ abas: 04.0 Operações → 04.1–04.4 Planejamento → 05 Programação (Tabela, Ciclo Produtivo)
 └─ Orçamento (vários planos, última versão publicada de cada)
Menu "Gestão da Lavoura" (o nome leva ao Calendário Agrícola; vários planos, última versão publicada de cada)
 ├─ 07 Calendário Agrícola (lista suspensa de escala)
 │   ├─ Ano (abre nela; Empresa › Fazenda › Safra/Safrinha)
 │   └─ Mês · Semana · Dia (a agenda)
 ├─ 09 Central OS (Visão geral, gráficos e tabela Ordens de Serviço)
 └─ 10 Planejado x Executado
     ├─ Executadas (abre nela; tabela por talhão)
     ├─ Planejadas × Executadas (desvio por talhão e operação)
     └─ Duração da Operação (Por talhão | Por operação)
```

## Próximas telas do plano (ainda não desenhadas)
Reunião de 13/10 (docs/reunioes/reuniao_stakeholders_2026_10_13.md), parte a parte: (1) menu e versões, definido; (2) Visão Geral com histórico e comparação de versões; (3) modal Criar plano (atividade, cultura, talhões); (4) opções de início do Planejamento; (5) várias variedades por talhão e sementes; (6) Suprimentos; (7) Calendário. Aprovação: fora por enquanto.
