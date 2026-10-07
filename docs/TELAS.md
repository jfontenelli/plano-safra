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
| 01 | Primeiro uso | telas/01-primeiro-uso.md | referencias/01-primeiro-uso.png | Construída |
| 02 | Modal Criar Plano de Safra | telas/02-modal-criar-plano.md | referencias/02-modal-criar-plano.png | Construída |
| 03 | Lista de planos | telas/03-lista-planos.md | referencias/03-lista-planos.png | Construída |
| 04.1 | Operações (grupo Defensivo) | telas/04.1-operacoes-defensivos.md | referencias/04.1-operacao-defensivos.png | Construída |
| 04.2 | Operações (grupo Semente) | telas/04.2-operacoes-sementes.md | quadro de design (telas A e B) | Construída: passos Plantio (variedade, data e população; Tabela, Mapa e Previsão de colheita) e TSI |

Situação: A definir → Pronta para construir → Construída.

## Navegação

```
Menu "Plano de Safra"
 ├─ sem planos → 01 Primeiro uso ──[Criar Plano Safra]──┐
 └─ com planos → 03 Lista de planos ─[Criar Plano Safra]─┤
                     │                                   ▼
                     │                       02 Modal Criar Plano
                     │                        ├─[Cancelar / X]→ volta à tela de origem
                     │                        └─[Continuar para as operações]→ 04 Operações
                     └─[seta da linha]→ abre o plano em 04 Operações
```

## Próximas telas do plano (ainda não desenhadas)
Operações (demais grupos) → Calendário Agrícola → Suprimentos → Aprovação (etapas conforme docs/telas/04.1-operacoes-defensivos.md).
