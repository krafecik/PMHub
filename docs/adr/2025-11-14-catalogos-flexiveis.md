# ADR: Introdução de Catálogos Flexíveis para Demandas, Triagem e Discovery

- **Data:** 2025-11-14
- **Status:** Aceito
- **Contexto:** Os módulos de captura, triagem e discovery utilizavam enums fixos para definir tipos, origens, status e classificações. Isso limitava a personalização por tenant, impedia extensões rápidas e dificultava integrações com processos específicos de cada produto.
- **Decisão:** Criar uma estrutura de catálogos configuráveis composta por `CatalogCategory` e `CatalogItem`, referenciados por FK nas entidades críticas (`Demanda`, `TriagemDemanda`, `Discovery`, `Hipotese`, `Pesquisa`, `Evidencia`, `Insight`, `Experimento`, `DecisaoDiscovery`). Foram adicionadas tabelas auxiliares para multi-seleção (`DiscoveryIdentificacao`, `DiscoveryPublico`) e seeds idempotentes que garantem valores padrão. Os enums legados foram removidos.
- **Consequências:** Os fluxos passam a aceitar valores personalizados por tenant e, opcionalmente, por produto. A migração converte os dados existentes e mapeia os valores antigos para os novos itens. O domínio precisa validar o slug da categoria ao usar um item. Interfaces e APIs devem carregar opções dinamicamente. Observabilidade e regras automatizadas podem usar metadados dos itens. Em contrapartida, aumenta a complexidade da camada de domínio, exigindo value objects que conheçam a categoria de catálogo apropriada.*** End Patch***}***

