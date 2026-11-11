# Tela 11 — Cadastros

Atualizado em 11/11/2026 (trazido de plano-safra-versionamento/plano-safra-cadastro.html, construído em 10/11/2026, sem a guia Produtos e com as regras do ERP Compass). Este doc mostra só o estado atual da tela.
**Situação no protótipo:** construída.

## Objetivo
Consultar os cadastros que vêm do ERP Compass e completar o que só o produto preenche: a geometria das fazendas e dos talhões e o DAP padrão das operações.

## Quando aparece
- Menu **Cadastros**. Endereço #/cadastros/<guia> (fazendas, safras, culturas, operacoes). Abre em Fazendas e talhões.

## Conteúdo
- Título **Cadastros** e as guias **Fazendas e talhões · Safras · Culturas e variedades · Operações**; à direita, "✓ Salvo às 16:20" depois de cada alteração.
- **Fazendas e talhões:**
  - À esquerda, a lista das fazendas (com "Organizar as fazendas por empresa"; com o nível Empresa, por empresa), com o número de talhões e a área; um alerta na fazenda que ainda não tem a sede ou o polígono de algum talhão. Nota: "As fazendas e os talhões (nome e área) são criados no ERP Compass."
  - À direita, a fazenda: nome e área (só consulta) e a **sede**: com a sede já preenchida, latitude e longitude só para consulta ("O ponto da sede já está preenchido e não muda aqui."); sem a sede, os campos Latitude e Longitude (graus decimais) ou o clique no mapa (satélite) marcam o ponto, que depois pode ser arrastado.
  - **Talhões:** tabela **Talhão · Área do talhão (ha) · Área geométrica (ha) · Geometria** (Polígono ou "Sem geometria · Importar"), só consulta. **Importar polígonos** (só quando algum talhão ainda não tem polígono): arquivo shapefile (.zip ou .shp + .dbf + .prj), KML, KMZ ou GeoJSON; conferência com o mapa e a tabela (coluna com o nome do talhão, nome editável para ligar ao talhão); só recebe o desenho o talhão do cadastro **sem polígono**; talhão que já tem polígono não muda e talhão que não está no cadastro não é criado (ele é criado no ERP Compass). Sem sede, a sede é sugerida no centro dos polígonos importados. "Baixar um arquivo de exemplo (.kml)" com os talhões da fazenda.
  - No exemplo, a fazenda **São José** começa sem sede e sem polígonos, para mostrar o preenchimento; as outras já vêm com a geometria.
- **Safras:** só consulta, com a nota de que as safras são cadastradas no ERP Compass. Tabela **Safra · Descrição · Início · Fim · Ano Agrícola** (sem a coluna Planos e sem ações).
- **Culturas e variedades:** à esquerda, as culturas por atividade (com o número de variedades) e "+ Nova cultura"; à direita, a cultura (atividade e unidade de produtividade, com o lápis para editar) e a tabela das variedades **Variedade · Ciclo (dias)**, só consulta (sem inserir nem editar variedade). Sem a guia Fenologia.
- **Operações:** a Cultura (lista) e a nota: os grupos de operação e as operações são cadastrados no ERP Compass; aqui só se altera o **DAP padrão**, que vem preenchido ao criar um plano pelo "Usar operações cadastradas no ERP Compass" (planos já criados não mudam). Um cartão por grupo (nome, tipo e o número de operações) com a tabela **Operação · DAP padrão**: o DAP padrão é o único campo editável (número inteiro; negativo = antes do plantio; a Colheita vazia, "pelo ciclo"); ao mudar, o grupo se reordena pelo DAP. Sem Fenologia, Prazo de conclusão e lixeiras.

## Regras
- O que vem do ERP Compass (grupos de operação, operações, safras, fazendas e talhões: nome e área) não se cria, não se renomeia nem se exclui aqui (DECISOES 3).
- A geometria (sede e polígono) só se preenche quando ainda não está preenchida.
- Tudo fica só na memória do navegador.

## Navegação
- As guias trocam o endereço (#/cadastros/<guia>). Clicar num polígono do mapa leva à linha do talhão na tabela.

## Em aberto
- Culturas: "+ Nova cultura" e "Editar cultura" continuam; confirmar se as culturas também vêm do ERP Compass.
