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
| — | Menu e contexto do plano | DECISOES 4.0 e 4.1.1 | rascunhos/navegacao-contexto.html | Construída: menu com Visão Geral · Planejamento · Calendário Agrícola · Suprimentos; cabeçalho fixo com versão, "✓ Salvamento automático", Publicar versão / Criar nova versão e Mais ações (Editar talhões, Exportar, Trocar versão); abas Operações · Planejamento · Resumo; talhões por versão |
| 01 | Primeiro uso | telas/01-primeiro-uso.md | referencias/01-primeiro-uso.png | Construída |
| 02 | Modal Criar Plano de Safra e modal "Como deseja iniciar o plano?" | telas/02-modal-criar-plano.md | referencias/02-modal-criar-plano.png (antiga) | Construída: informações gerais com Atividade, várias fazendas (um plano por fazenda) com talhões e área de cultivo; início em modal ao abrir o plano (modelo, XLSX, copiar plano publicado, do zero) |
| 03 | Visão Geral (lista de planos) | telas/03-lista-planos.md | referencias/03-lista-planos.png, rascunhos/navegacao-contexto.html | Construída: guias Visão Geral e Histórico de versões, filtros com Atividade e Status, Área de cultivo, status Não iniciado, clique na linha abre, menu ⋯ (comparação de versões: a detalhar) |
| 04.0 | Operações (estrutura do plano) | telas/04.0-operacoes.md | referencias/04.0-operacao.png, rascunhos/calendario-estados.html (etapa 1) | Construída: tabela na ordem da safra (sem faixa de fase), grupo escolhido na linha, grupo vazio continua; grupo Colheita; filtro por grupo de operação; "+" insere linha abaixo; modo Editar (mover para grupo com Aplicar e excluir em lote, sempre com confirmação) |
| 04.1 | Planejamento (grupo Defensivo) | telas/04.1-operacoes-defensivos.md | referencias/04.1-operacao-defensivos.png | Construída |
| 04.2 | Planejamento (grupo Semente) | telas/04.2-operacoes-sementes.md | quadro de design (telas A e B) | Construída: Plantio (variedade, data e população; Tabela, Mapa e Previsão de colheita) |
| 04.3 | Planejamento (grupo Fertilidade) | telas/04.3-operacoes-fertilidade.md | — (layout da Tela 04.1) | Construída: operações do modelo, matéria-prima e cadastro (produtos de cliente a conferir) |
| 04.4 | Planejamento (grupo Tratamento de semente) | telas/04.4-operacoes-tratamento-sementes.md | — (layout da Tela 04.1) | Construída: TSI (saiu do grupo Semente), DAP −5 sugerido |
| 05 | Calendário Agrícola (aba Resumo do plano) | telas/05-calendario-agricola.md | referencias/05-calendario-agricola.png | Construída: Infográfico por fase e Tabela com prazo para encerramento da OS |
| 06 | Suprimentos | telas/06-suprimentos.md | referencias/suprimentos.png | A definir: falta fechar o cálculo do TSI |

| — | Calendário Agrícola e Suprimentos do menu (vários planos somados) | DECISOES 4.0 | — | A definir |

Situação: A definir → Pronta para construir → Construída.

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
 │   └─ abas: 04.0 Operações → 04.1–04.4 Planejamento → 05 Calendário Agrícola
 ├─ Calendário Agrícola (vários planos, última versão publicada de cada)
 └─ Suprimentos (vários planos, última versão publicada de cada)
```

## Próximas telas do plano (ainda não desenhadas)
Reunião de 13/10 (docs/reunioes/reuniao_stakeholders_2026_10_13.md), parte a parte: (1) menu e versões, definido; (2) Visão Geral com histórico e comparação de versões; (3) modal Criar plano (atividade, cultura, talhões); (4) opções de início do Planejamento; (5) várias variedades por talhão e sementes; (6) Suprimentos; (7) Calendário. Aprovação: fora por enquanto.
