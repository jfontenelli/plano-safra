# Especificação Funcional do Plano de Safra (para os devs)

Texto-fonte da Especificação Funcional, no modelo da empresa (`crm/CH 00000.doc`).
Cada arquivo é uma seção do documento; um comando junta tudo e gera o .docx em `crm/`.

**Regras:**
- Só o que o protótipo faz hoje: sem histórico ("antes, em…") e sem tecnologia.
- Escopo desta versão: Cadastros (e o fluxo geral). Plano de Safra depois da validação com os stakeholders; Gestão da Lavoura na próxima entrega. Orçamento, pré-cadastro e TSI não entram.
- Correções sempre aqui, nos .md (o .docx é gerado de novo e perde o que for mexido nele).

**Arquivos, na ordem do documento:**

| Arquivo | Seção do documento |
|---|---|
| `00-cabecalho.md` | Cabeçalho, participantes |
| `01-objetivo.md` | 1 Objetivo |
| `02-atores.md` | 2 Atores envolvidos |
| `03-escopo.md` | 3 Escopo (introdução e macrofluxo) |
| `04-analise-de-impacto/` | 4 Análise de impacto: regras de negócio e prints, um arquivo por tela |
| `05-observacoes-tecnicas.md` | 5 Observações técnicas |
| `06-plano-de-testes.md` | 6 Plano de testes |
| `99-historico.md` | Histórico de revisão |

**Outras pastas:**
- `img/` — prints do protótipo e imagem do macrofluxo.
- `revisoes/` — relatórios do agente Revisor.

**Marcação de print** (onde falta uma imagem):

> 📷 **Print do ERP Compass:** tela Cadastro de Safra. De lá vêm: Safra, Descrição, Início, Fim e Ano Agrícola.
