# Gestão da Lavoura › Calendário (Tela 07) — guardado para retomar

Em 05/11/2026 a usuária pediu para **colocar a página Calendário de Gestão da Lavoura em rascunho**, porque ela vai ser refeita. Se precisar, recupera-se como estava.

## Onde está o Calendário completo, como estava

- **Marca no git: `calendario-05-11-2026`** (commit 689357e, o último com o Calendário funcionando).
  Para ver um arquivo como estava: `git show calendario-05-11-2026:js/telas/os-calendario.js`.
  Para abrir o protótipo inteiro como estava (sem mexer na branch atual): `git worktree add ../plano-safra-calendario calendario-05-11-2026` e abrir o `index.html` dessa pasta.
- **Detalhe da tela:** `docs/telas/07-agenda-agricola.md` (continua em `docs/`, sem alteração).

## O que mudou no protótipo

| Onde | O que mudou | Como recolocar |
|---|---|---|
| `js/app.js` · rota `calendario-agricola` | mostra "Em construção" (`Telas.emConstrucao('Calendário')`) | voltar `desenhar: () => temPlanos() ? Telas.osCalendario.desenhar() : Telas.semPlanos('calendario')` e `aoMostrar: (conteudo) => { if (temPlanos()) Telas.osCalendario.aoMostrar(conteudo); }` |

O item **Calendário** continua no menu (e o nome do grupo Gestão da Lavoura continua levando a ele), agora com a página "Em construção".

**O código da tela continua no protótipo, adormecido** (nada mais o chama): `js/telas/os-calendario.js` (filtros, legenda, escalas Ano · Mês · Semana · Dia), `js/telas/calendario-agricola.js` (visão Ano por Empresa › Fazenda › Safra/Safrinha) e os estilos `.calendario` e `.cal-*` em `css/estilo.css`. A grade Mês · Semana · Dia é desenhada por `js/telas/05-calendario.js`, que também serve a aba Resumo do plano (Tela 05) e por isso fica como está.

## Atualização (05/11/2026)

No mesmo dia, a página voltou para o menu (a rota `calendario-agricola` voltou a abrir `Telas.osCalendario`) para ser refeita: o **Mês** passou a ser a tabela **Fazenda · Talhão · Área (ha) × semanas do mês**, com barras que atravessam as semanas. A versão anterior (Mês com uma linha por operação) continua na marca `calendario-05-11-2026`.
