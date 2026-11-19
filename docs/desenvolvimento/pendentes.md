# Pendentes para as próximas seções

Itens já decididos que vão para a seção de uma tela ainda não documentada. Ao escrever a seção, levar o item e apagar daqui.

## Regras

| Vai para a seção | Regra | Origem |
|---|---|---|
| Plano de Safra › Criar plano de safra | A escolha da safra oferece todas as safras do cadastro (Cadastros › Safras); senão, não daria para criar o primeiro plano de uma safra. | 4.1 Safras |
| Telas com filtros Ano agrícola e Safra | Os filtros mostram só as safras e os anos agrícolas que têm plano de safra cadastrado, para não trazer opção sem resultado. Ordem: a da regra "Ordem da tabela" da 4.1. | 4.1 Safras |
| Telas com filtro Safra | Safra atual: a safra cujo período (Data início a Data fim) contém a data de hoje; as telas abrem filtradas nela. Se nenhuma safra com plano contém a data de hoje, abrem na safra mais recente que tem plano, ordenadas pelo Ano Agrícola. | 4.1 Safras |
| Plano de Safra › Planejamento › Plantio (visão Mapa) e Gestão da Lavoura › Acompanhamento (Visão Atual das Operações e Progresso da Operação) | Os mapas mostram os talhões pelo polígono preenchido em Cadastros › Talhões. | 4.2 Talhões |
| As mesmas telas com mapa | Talhão sem polígono fora dos mapas: o talhão sem polígono não aparece nos mapas; continua nas tabelas e no planejamento normalmente e passa a aparecer no mapa quando o polígono for preenchido. (No protótipo, esses mapas usam um desenho de exemplo feito pela área do talhão.) | 4.2 Talhões |
| Plano de Safra › Plano aberto | **Plano aberto recolhe o menu.** Ao abrir um plano, o menu recolhe sozinho, para dar mais espaço às tabelas. Ao sair do plano, o menu volta como estava antes de abri-lo. Se o usuário expandir o menu dentro do plano, a escolha vale só até sair dele. | 4.0 Menu e navegação |

## Cenários de teste

| Vai para a seção | Cenário | Origem |
|---|---|---|
| Plano de Safra › Criar plano de safra | A escolha da safra mostra todas as safras do cadastro (Cadastros › Safras). | 4.1 Safras |
| Telas com filtros Ano agrícola e Safra | Os filtros mostram só as safras com plano de safra cadastrado. | 4.1 Safras |
| Telas com filtro Safra | A tela abre filtrada na safra atual; sem plano na safra atual, abre na safra mais recente que tem plano. | 4.1 Safras |
| Telas com mapa (Plantio e Acompanhamento) | Talhão sem polígono não aparece no mapa, mas continua na tabela; depois de desenhar o polígono em Cadastros › Talhões, passa a aparecer. | 4.2 Talhões |
| Plano de Safra › Plano aberto | Com o menu expandido, abrir um plano: o menu recolhe sozinho. Voltar à lista de planos: o menu volta expandido. | 4.0 Menu e navegação |
| Plano de Safra › Plano aberto | Com o menu recolhido, abrir um plano e voltar à lista: o menu continua recolhido. | 4.0 Menu e navegação |
| Plano de Safra › Plano aberto | Dentro do plano, expandir o menu e voltar à lista: o menu volta como estava antes de abrir o plano. | 4.0 Menu e navegação |
