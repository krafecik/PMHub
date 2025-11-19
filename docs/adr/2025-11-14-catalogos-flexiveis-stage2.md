# ADR: Modelagem dos Catálogos Flexíveis — Etapa 2

- **Data:** 14/11/2025  
- **Status:** Proposta implementada  
- **Contexto:** A etapa 1 definiu o escopo dos catálogos flexíveis. Nesta fase, precisamos refletir essas decisões na modelagem de dados e deixar o sistema preparado para CRUD e governança futura.

## Decisões

1. **Reutilização de `CatalogCategory` / `CatalogItem`**  
   Mantemos o modelo genérico criado anteriormente, apenas adicionando novas categorias e itens seeds para cobrir todos os contextos (captura, triagem, discovery e governança).

2. **Novos relacionamentos opcionais**  
   - `User` agora referencia catálogos para `tipo_usuario` e `cargo_usuario`.  
   - `Anexo` passa a registrar `tipo_anexo`.  
   - `Discovery` tornou a severidade obrigatória (`severidade_problema`) e adicionou `decisao_parcial`.  
   - `Entrevista` referencia `persona_participante`.  
   - `Experimento` registra `metrica_sucesso_discovery`.

3. **Seeds padronizados**  
   Expandimos `prisma/seed.ts` para incluir itens mínimos por slug, garantindo onboarding idempotente por tenant.

4. **Migração idempotente**  
   Criada `20251114163000_catalogos_flex_stage2` contendo:
   - novas colunas/FKs;  
   - índices auxiliares;  
   - bloco `DO $$` que garante severidade padrão antes de aplicar `NOT NULL`.

## Consequências

- Camada de domínio poderá substituir enums hardcoded pelos IDs configuráveis.
- Admin UI terá dados suficientes para CRUD e fallback (etapas futuras).
- Necessário rodar `prisma migrate deploy` + `prisma db seed` após merge.

