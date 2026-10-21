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
| — | Menu e contexto do plano | DECISOES 4.0 e 4.1.1 | rascunhos/navegacao-contexto.html | Construída: menu com Visão Geral · Planejamento · Calendário Agrícola · Orçamento (setinha minimiza o grupo Plano de Safra); menu do usuário com Configurações › Aparência (Claro ou Escuro) e Sair; cabeçalho fixo com versão, "✓ Salvamento automático", Publicar versão / Criar nova versão e Mais ações (Editar talhões, Exportar, Trocar versão); abas Operações · Planejamento · Programação; talhões por versão |
| 01 | Primeiro uso | telas/01-primeiro-uso.md | referencias/01-primeiro-uso.png | Construída |
| 02 | Modal Criar Plano de Safra e modal "Como deseja iniciar o plano?" | telas/02-modal-criar-plano.md | referencias/02-modal-criar-plano.png (antiga) | Construída: informações gerais com Atividade, várias fazendas (um plano por fazenda) com talhões e área de cultivo; início em modal ao abrir o plano (modelo, XLSX, copiar plano publicado, do zero) |
| 03 | Visão Geral (Planos de Safra e Histórico de versões) | telas/03-lista-planos.md | referencias/03-lista-planos.png, rascunhos/navegacao-contexto.html | Construída: caminho "Plano de Safra › Visão Geral"; guias Planos de Safra e Histórico de versões, com Criar Plano Safra na mesma linha; foto do campo no topo só no escuro; filtros Ano Agrícola, Atividade produtiva, Safra, Empresa, Fazenda, Cultura (Status no Histórico); sem os quadros Planejamento das Fazendas (20/10/2026); tabela com os planos (Não iniciado, Em construção e Publicado, nessa ordem), sem as colunas de % por grupo (19/10/2026), ordenação por coluna; sem plano nos filtros, "Nenhum Plano de Safra cadastrado" com o link + Criar Plano Safra (modal com os filtros) e menu ⋯ (comparação de versões: a detalhar) |
| 04.0 | Operações (estrutura do plano) | telas/04.0-operacoes.md | referencias/04.0-operacao.png, rascunhos/calendario-estados.html (etapa 1) | Construída: tabela na ordem da safra (sem faixa de fase), grupo escolhido na linha, grupo vazio continua; grupo Colheita; filtro por grupo de operação (grupo novo aparece já ao salvar); sem a dica do rodapé (20/10/2026); "+" insere linha abaixo; caixas de marcar sempre à vista e lixeira para excluir em lote (com confirmação); Editar abre o modal Grupos de operação (renomear, adicionar e excluir grupos); sem mover em lote (19/10/2026) |
| 04.1 | Planejamento (grupo Defensivo) | telas/04.1-operacoes-defensivos.md | referencias/04.1-operacao-defensivos.png | Construída |
| 04.2 | Planejamento (grupo Plantio, antes Semente) | telas/04.2-operacoes-sementes.md | quadro de design (telas A e B); painel: imagem da usuária (19/10) | Construída: Plantio com várias variedades por talhão (uma linha por variedade, Área do talhão e Área de aplicação; clique na linha abre o painel, botão direito Inserir · Excluir · Limpar); painel resumido (uma variedade: gráfico e os campos Variedade · Germinação · Data de plantio · Pop.) e expandido (mais de uma variedade ou "+ Adicionar variedade": histórico à esquerda e variedades à direita, com a germinação do talhão e a tabela; setas no rodapé) (20/10/2026); coluna Ciclo (dias) separada na tabela; modal Definir plantio com a composição em %; Tabela, Mapa (hachura) e Previsão de colheita |
| 04.3 | Planejamento (grupo Fertilidade) | telas/04.3-operacoes-fertilidade.md | — (layout da Tela 04.1) | Construída: operações do modelo, matéria-prima e cadastro (produtos de cliente a conferir) |
| 04.4 | Planejamento (grupo Tratamento de semente) | rascunhos/tsi/04.4-operacoes-tratamento-sementes.md | — (layout da Tela 04.1) | Pausada: fora do protótipo por enquanto (15/10/2026); guardado em rascunhos/tsi/ (marca no git `tsi-15-10-2026`); retomar por rascunhos/tsi/README.md |
| 05 | Calendário Agrícola (aba Programação do plano, antes Resumo) | telas/05-calendario-agricola.md | referencias/05-calendario-agricola.png, referencias/05.3-resumo-calendario.png | Construída: Programação (tabela) e Ciclo Produtivo (por fase). A guia Calendário foi para Ordens de Serviço (Tela 07, 19/10/2026) |
| 06 | Orçamento de Insumos (menu Orçamento, vários planos somados) | telas/06-orcamento.md | referencias/suprimentos.png; escuro: imagem da usuária (19/10, só os cartões do Resumo) | Construída: moeda de exibição R$/US$; filtros com várias escolhas; estimativas de comercialização (Editar parâmetros); Resumo do orçamento; Orçamento por tipo de insumo; Detalhamento Por produto e Por talhão com busca, ordenação, paginação e Exportar XLSX; cabeçalho congelado (alfinete) |

| 07 | Ordens de Serviço: Calendário das operações (vários planos somados) | telas/07-ordens-servico-calendario.md | referencias/05.3-resumo-calendario.png | Construída (19/10/2026, só migrada do Resumo): Mês, Semana, Dia; última versão publicada de cada plano; filtros com várias escolhas Safra, Empresa, Fazenda, Cultura e Talhão; sem Ano Agrícola (abre em hoje, anda pelas setas); legenda que filtra; etiquetas dos talhões na Semana e no Dia; dias que já passaram esmaecidos |
| — | Calendário Agrícola do menu (vários planos somados) | DECISOES 4.0 | canvas de design (Claude Design, 16/10); escuro: imagem da usuária (19/10) | Construída: Empresa › Fazenda › Safra/Safrinha (abre no nível Empresa; as barras ficam só no nível mais aberto de cada ramo); cada operação é uma barra arredondada numa faixa por grupo de operação; sucessão de culturas na fazenda; filtros Empresa, Fazenda e Cultura; ‹ › · período · lista suspensa Período (Ano, Semestre, Trimestre, Mês) acima da tabela; sem filtro Ano Agrícola: no período Ano, as setas trocam o ano (só "2026"); Hoje só com a linha pontilhada cinza; última versão publicada de cada plano |

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
 ├─ Calendário Agrícola (vários planos, última versão publicada de cada)
 └─ Orçamento (vários planos, última versão publicada de cada)
Menu "Ordens de Serviço"
 └─ 07 Calendário das operações (vários planos, última versão publicada de cada)
```

## Próximas telas do plano (ainda não desenhadas)
Reunião de 13/10 (docs/reunioes/reuniao_stakeholders_2026_10_13.md), parte a parte: (1) menu e versões, definido; (2) Visão Geral com histórico e comparação de versões; (3) modal Criar plano (atividade, cultura, talhões); (4) opções de início do Planejamento; (5) várias variedades por talhão e sementes; (6) Suprimentos; (7) Calendário. Aprovação: fora por enquanto.
