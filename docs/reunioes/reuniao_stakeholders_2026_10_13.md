# Reunião com stakeholders — 13/10/2026

**Periodicidade:** semanal
**Participantes:** _(preencher)_
**Situação:** decisões em discussão. Ainda não entraram em `docs/DECISOES.md`; cada tema será discutido e levado tela a tela.

## Pauta

1. Arquitetura do Plano de Safra
2. Visão Geral e histórico de versões
3. Planejamento Agronômico
4. Suprimentos vinculado às versões
5. Múltiplas culturas e variedades
6. Planejamento de sementes
7. Calendário Agrícola
8. Identidade visual e UX/UI

---

## 1. Arquitetura do Plano de Safra

**Decisões**
- O menu **Plano de Safra** passa a ter: Visão Geral · Planejamento Agronômico · Calendário Agrícola · Suprimentos.
- **Planejamento Agronômico** substitui o nome anterior da área de operações e planejamento.
- **Suprimentos** sai das abas internas do planejamento e vai para a navegação do Plano de Safra, continuando ligado aos dados e às versões do planejamento.
- Cada plano é identificado por **Safra + Empresa + Fazenda + Cultura**. Uma fazenda pode ter planos para culturas diferentes.
- Usar os nomes dos clientes: **Safra** e **Safrinha**.
- Os planos da fazenda não precisam ser criados todos de uma vez: o planejamento pode ser feito aos poucos.
- Grupos de operações e operações são definidos no contexto da fazenda e da cultura escolhidas.

## 2. Visão Geral e histórico de versões

**Decisões**
- O histórico de versões fica na **Visão Geral**.
- O usuário escolhe a versão que quer consultar, ou usar como ponto de partida para editar, antes de entrar no Planejamento Agronômico.
- Ação **Ver versões** em cada plano.
- O histórico mostra, da versão mais recente para a mais antiga:
  - número da versão (0.1, 0.2, 0.3…);
  - data e hora de criação;
  - responsável pelo salvamento;
  - valor total estimado de suprimentos;
  - indicação da versão mais recente;
  - ação para abrir a versão.
- Todas as versões ficam guardadas. Nenhuma é sobrescrita.

**Salvar rascunho**
- Guarda as alterações da área de trabalho.
- Não cria versão nova e não altera nenhuma versão já registrada.
- Permite continuar a edição depois.
- Mostra uma confirmação discreta.

**Criar versão**
- Registra uma versão nova com o conteúdo atual da área de trabalho.
- Guarda as versões anteriores sem nenhuma alteração.
- Dá o próximo número da sequência automaticamente.
- Registra data, hora e responsável.
- A versão nova passa a ser a mais recente. O usuário pode continuar trabalhando e criar outras versões.

**Exemplos**
- O usuário abre a 0.1, altera, clica em Salvar rascunho (não cria versão) e depois em Criar versão. O sistema registra a 0.2, e a 0.1 continua igual.
- Já existe a 0.3 e o usuário abre a 0.1 para alterar: a próxima versão criada é a **0.4**, com vínculo à versão de origem (0.1).
- O rascunho fica ligado ao plano e à versão de origem. Salvar o rascunho nunca muda os dados de uma versão registrada.

**Ordens de Serviço**
- A **versão registrada mais recente** é a referência para gerar as OS.
- Alterações que estão só no rascunho não afetam as OS.
- Cada OS guarda a versão do plano que a gerou.
- **Sem aprovação** neste momento.

**No protótipo:** os dados devem continuar consistentes entre as telas e ficar salvos. Se não houver outro mecanismo, usar o localStorage.

## 3. Planejamento Agronômico

**Decisões**
- Manter a estrutura de grupos de operações e operações (ex.: Corretivos, Sementes, Fertilizantes, Defensivos, Colheita).
- Manter criar, editar, excluir e reorganizar grupos, criar receitas agronômicas e aplicá-las nos talhões.
- Não mudar as regras atuais de recomendação agronômica sem necessidade.
- Manter a identificação no cabeçalho: *Plano de Safra › Safra 26/27 · Empresa A · Fazenda Santa Maria · Soja*.
- Acrescentar no cabeçalho qual versão ou rascunho está sendo editado.
- Botões **Salvar rascunho** e **Criar versão** em lugar visível, sem atrapalhar a hierarquia da tela. "Criar versão" com mais destaque.

## 4. Suprimentos vinculado às versões

**Decisões**
- Cada versão guarda uma fotografia do orçamento de suprimentos daquele momento:
  - produtos e insumos;
  - quantidades previstas e unidades;
  - preços unitários usados e a data de referência dos preços (quando houver);
  - custos por grupo de operações;
  - valor total estimado.
- O histórico financeiro **não é recalculado** quando os preços atuais mudam.

**Comparativo financeiro (na Visão Geral)**
- O usuário escolhe a **Versão A** e a **Versão B**.
- A comparação é por grupo de insumos e mostra o valor da A, o valor da B, a diferença em reais e a variação percentual.
- Quando a base é zero, não mostrar variação percentual.
- Só duas versões por vez. Não comparar todas, porque o histórico pode ter muitas.
- Valores de exemplo só quando o protótipo não tiver dados reais, e sempre identificados como exemplo.

## 5. Múltiplas culturas e variedades

**Decisões**
- Uma fazenda pode ter culturas diferentes, em planos separados.
- Um talhão pode ter **mais de uma variedade** da mesma cultura, cada uma com a sua área planejada.
  - Ex.: Talhão 01, 120 ha → Variedade A 70 ha + Variedade B 50 ha.
- A soma das áreas das variedades, no mesmo talhão e ciclo, não pode passar da área disponível (salvo regras de sobreposição que o sistema já preveja).

**Mapa**
- Talhão com uma variedade: continua como hoje.
- Talhão com várias variedades: **preenchimento com hachura** (opção B), em tons do verde UniSystem, com a legenda "Múltiplas variedades".
- Ao selecionar o talhão, mostrar as variedades e as áreas planejadas.
- **Sem delimitar as variedades no mapa** durante o planejamento e sem polígonos artificiais. A delimitação é feita no plantio de cada variedade.

## 6. Planejamento de sementes

**Campos**
- Cultura · Talhão · Variedade · Área planejada (ha)
- População planejada (plantas/ha) · Germinação (%) · Peso de mil sementes, PMS (g)
- Quantidade calculada de sementes · Peso necessário (kg)
- Condição de compra: Semente branca ou Semente tratada
- Capacidade comercial do bag (nº de sementes) · Quantidade de bags · Custo de sementes

**Decisões**
- Bags comerciais de soja: **2,5 · 5 · 5,5 · 10 milhões de sementes**. Deixar aberto para cadastrar outras capacidades no futuro.
- O cálculo guarda o número de sementes e o peso em kg.
- Quantidade de bags arredondada para cima quando a compra é de bags inteiros.
- Germinação e PMS podem ser associados ao lote quando houver mais de um lote.
- Manter o que já existe de tratamento de sementes.

## 7. Calendário Agrícola

**Decisões**
- Sem Gantt e sem cálculo de capacidade operacional (equipamentos e equipes) nesta etapa.
- Manter a estrutura atual. Sem redesenho profundo: a experiência será refinada depois.
- No futuro, a visualização deve mostrar: data programada, grupo de operações, operação, talhão, área operacional prevista (ha) e área total programada na data.
- No MVP, priorizar a **programação diária**: quais operações estão previstas e com que área.
- Não somar áreas de operações diferentes como se fossem a área física da fazenda. Quando houver soma, chamar de **área total de execução programada**.

## 8. Identidade visual e UX/UI

**Decisões**
- Manter a identidade UniSystem: verde como cor principal, azul-escuro e cinza como complementares.
- Manter o menu lateral minimizável, o cabeçalho atual, as abas de grupos de operações e a estrutura de receitas (edição e aplicação nos talhões).
- Interfaces simples, informação aos poucos e pouco esforço para entender.
- Evitar modais, painéis e botões novos sem necessidade.
- Não mudar campos ou fluxos que não estejam nesta pauta.

---

## Critérios de aceite combinados

1. Ver planos por safra, empresa, fazenda e cultura.
2. Abrir o histórico de versões de um plano na Visão Geral.
3. Selecionar uma versão histórica.
4. Editar uma cópia de trabalho sem alterar a versão registrada.
5. Salvar um rascunho e retomar a edição.
6. Criar uma nova versão na sequência.
7. Consultar data, hora e responsável de cada versão.
8. Ver o custo histórico de suprimentos de cada versão.
9. Comparar financeiramente duas versões.
10. Usar a última versão registrada como referência para gerar as OS.
11. Planejar mais de uma variedade no mesmo talhão.
12. Identificar pela hachura os talhões com várias variedades.
13. Calcular a necessidade de sementes com germinação, PMS e bags comerciais.
14. Suprimentos na navegação do Plano de Safra, separado das abas do Planejamento Agronômico.

---

## Pontos que mudam decisões anteriores (a discutir)

| Tema | Hoje em `docs/DECISOES.md` | Decisão desta reunião |
|---|---|---|
| Salvar | Salvamento automático, sem botão | Salvar rascunho e Criar versão |
| Aprovação | Aprovação gera as OS e trava o plano (Em construção / Aprovado) | Sem aprovação; a OS sai da última versão registrada |
| Etapas do plano | Operações → Planejamento → Calendário → Suprimentos → Aprovação | Visão Geral · Planejamento Agronômico · Calendário · Suprimentos |
| Safrinha | Fora do escopo | Safra e Safrinha |
| Culturas | Só soja no protótipo | Várias culturas por fazenda |
| Variedade no talhão | Uma por talhão | Várias, cada uma com a sua área |
| Bag de soja | 5 milhões de sementes, fixo | 2,5 · 5 · 5,5 · 10 milhões |
| PMS | Em aberto | Campo do planejamento, com peso em kg |
| Dados do protótipo | Só na memória do navegador | Salvos (localStorage) |

## Próximos passos

- Discutir cada tema e levar tela a tela, nesta ordem: (1) navegação e Visão Geral; (2) Salvar rascunho e Criar versão; (3) planejamento de sementes; (4) Suprimentos; (5) Calendário.
- Para cada tela: fechar as regras, atualizar `docs/DECISOES.md` e `docs/telas/`, fazer o design no Claude Design e implementar no protótipo.
