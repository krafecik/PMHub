# Guia de Testes

Este documento descreve a estratégia de testes do CPOPM, ferramentas utilizadas e como executar, criar e manter as suítes de testes em cada camada (backend, frontend e E2E).

## Visão Geral

- Monorepo com workspaces `backend/` (NestJS) e `frontend/` (Next.js).
- Base de testes construída com Jest (backend), Vitest + Testing Library (frontend) e Playwright (E2E).
- Cobertura mínima configurada em **80%** para branches, functions, lines e statements nas suítes unitárias.
- Ajuda contextual obrigatória em telas é validada via testes (Vitest e Playwright).
- CI (`.github/workflows/ci.yml`) executa lint, testes unitários e Playwright, publicando o relatório HTML.

## Requisitos

- Node.js >= 20, npm >= 9.
- Banco PostgreSQL local apenas se desejar rodar testes que dependam do Prisma real (os testes atuais usam mocks).
- Para Playwright, é necessário instalar os browsers uma vez: `npx playwright install --with-deps`.

## Estrutura de Pastas

```
backend/
  src/
    domain/…               # Entidades, Value Objects, serviços de domínio
    application/…          # Commands, Queries, Services
    infrastructure/…       # Repositórios, controllers
  test/
    setup.ts               # Inicialização global (telemetria)
    fixtures/              # Builders e mocks compartilhados
frontend/
  src/
    components/…           # Componentes UI (testados com Vitest/RTL)
    hooks/…                # Hooks com React Query + mocks
    __tests__/utils/       # renderWithProviders, mock router, query client
  tests/e2e/               # Playwright specs
playwright.config.ts       # Configuração compartilhada dos testes E2E
```

## Execução de Testes

### Do monorepo (todos os testes unitários)

```bash
npm install          # instala todas as dependências
npm run test         # roda backend + frontend
```

### Backend (Jest)

```bash
npm run test -w backend        # todas as suítes (unit + e2e)
npm run test:unit -w backend   # somente unitários
npm run test:e2e -w backend    # e2e com Supertest
npm run test:cov -w backend    # exige cobertura >= 80%
```

Detalhes:
- Configuração em `backend/jest.config.ts` com aliases (`@domain`, `@application` etc.).
- Fixtures compartilhados em `backend/test/fixtures`.
- Telemetria fica desativada em `NODE_ENV=test` via guardas em `initializeTelemetry()`.

### Frontend (Vitest + Testing Library)

```bash
npm run test -w frontend        # execução padrão (headless)
npm run test:watch -w frontend  # modo watcher
npm run test:cov -w frontend    # cobertura via V8 (80% mínimo)
```

Detalhes:
- Ambiente `jsdom`; `vitest.setup.ts` registra `@testing-library/jest-dom` e importa React.
- `renderWithProviders` injeta `QueryClientProvider`, `ThemeProvider` e mocka `next/navigation`.
- Mocks para libs externas (`framer-motion`, Radix) ficam nos testes que necessitam.

### E2E (Playwright)

```bash
# Instala os browsers (apenas uma vez)
npx playwright install --with-deps

# Executa (usa config para levantar o Next automaticamente)
npm run test:e2e -w frontend

# Interface interativa
npm run test:e2e:ui -w frontend

# Abrir relatório
npm run test:e2e:report -w frontend
```

Detalhes:
- `playwright.config.ts` inicia o Next (`npm run dev`) na porta 3056, usa `http://127.0.0.1:3056` como base.
- `tests/e2e/utils.ts` provê helpers para mockar `/auth/refresh`, interceptar rotas com respostas JSON e lidar com requisições `OPTIONS`.
- Testes atuais cobrem:
  - Autenticação (`login.spec.ts`): fluxo de login e redirecionamento para o dashboard.
  - Demandas (`demandas.spec.ts`): listagem, filtros e botão de ajuda.
  - Documentação (`documentacao.spec.ts`): biblioteca com filtros e CTA.
  - Planejamento (`planejamento.spec.ts`): visão trimestral com métricas, timeline e cenários.

## Integração Contínua

- Workflow: `.github/workflows/ci.yml`.
- Passos principais:
  1. Instala dependências com cache multilock (`package-lock.json`, workspaces).
  2. Instala browsers do Playwright (`npx playwright install --with-deps`).
  3. Executa `npm run lint`, `npm run test` e `npm run test:e2e` (`frontend`).
  4. Publica relatório `frontend/playwright-report/`.
  5. Roda `npm run build` (garantindo que o monorepo compila).
- Variáveis de ambiente no CI:
  - `NODE_ENV=test`
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cpopm_ci`
  - `NEXT_PUBLIC_API_URL=http://127.0.0.1:3055/v1`
  - `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3056`

## Escrevendo Novos Testes

### Backend
- Use os builders em `test/fixtures/` para criar instâncias válidas de Value Objects e entidades.
- Para services/repositorios, prefira mocks de dependências via `jest.fn()`.
- Ao adicionar novos agregados/VOs, crie testes em `src/domain/.../__tests__`.
- Garanta que invariantes de domínio e eventos sejam cobertos.

### Frontend
- Utilize `renderWithProviders` (provedores padrão, mock router e React Query).
- Em componentes com animações Radix/Framer, mocke comportamentos que exigem Web APIs não disponíveis no jsdom.
- Hooks com React Query devem usar `createTestQueryClient` e `renderHook`.
- Para componentes dinâmicos com dados, utilize mocks da camada `lib/*-api.ts`.

### E2E
- Prefira interceptar requisões para depender apenas do frontend (`page.route` + helpers do util).
- Assegure-se de marcar os botões/títulos com seletores acessíveis (`role`, `aria-label`).
- Verifique requisitos funcionais chave (ex.: presença do botão de ajuda em cada tela).
- Sempre adicione cenários positivos e, quando relevante, validações de erro.

## Boas Práticas

- Respeitar as diretrizes de acessibilidade e internacionalização nos asserts (mesmos textos exibidos ao usuário final).
- Manter mocks e fixtures próximos da realidade (campos obrigatórios, formatos de IDs numéricos/UUID conforme domínio).
- Atualizar cobertura: se adicionar novas pastas/arquivos relevantes, inclua-os em `collectCoverageFrom`.
- Ao criar novos fluxos E2E, registrar também na documentação de produto para manter rastreabilidade.
- Executar `npm run lint` antes de abrir PRs para garantir consistência com ESLint/Prettier.

## Dúvidas Frequentes

- **Preciso subir o backend para rodar Playwright?** Não. As rotas são interceptadas e as respostas, mockadas.
- **Como rodar apenas uma suite Playwright?** `npx playwright test tests/e2e/<arquivo>.spec.ts`.
- **Onde ficam os relatórios de cobertura?** `backend/coverage/` (Jest) e `frontend/coverage/` (Vitest, gerado via `test:cov`).
- **Como reinicializar o estado do React Query em testes?** Use `queryClient.clear()` no tearDown, conforme exemplos em `src/hooks/__tests__`.

---

Para contribuições futuras, mantenha este documento atualizado ao alterar ferramentas, comandos ou convenções de testes.

