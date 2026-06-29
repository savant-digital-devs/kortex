# Kortex

Plataforma SaaS de gestão avançada de equipes, projetos e portfólio de clientes. Construída com Clean Architecture, DDD, RBAC granular e isolamento multi-tenant rígido.

## Visão Geral

O Kortex resolve o problema de falta de transparência entre equipes de desenvolvimento e clientes finais — eliminando reuniões de alinhamento desnecessárias através de links públicos automatizados e rastreabilidade absoluta de entregas.

**Público-alvo:**
- Desenvolvedores autônomos e freelancers high-ticket
- Agências de software boutique e fábricas lean
- Consultorias de tecnologia e squads sob demanda

## Stack

| Camada | Tecnologias |
|--------|------------|
| Backend | Node.js 20, TypeScript, Fastify |
| Frontend | React 18, TypeScript, Redux Toolkit, Tailwind CSS |
| Banco de dados | PostgreSQL 16 + Prisma ORM |
| Cache / Filas | Redis 7, BullMQ |
| Infra | Docker, pnpm Workspaces, Turborepo |
| CI/CD | GitHub Actions, Railway, Vercel |

## Arquitetura

Monorepo estruturado com separação clara de responsabilidades:

```
kortex/
├── apps/
│   ├── api/          # Fastify — Clean Arch em camadas
│   └── web/          # React — Redux Toolkit + RTK Query
├── packages/
│   ├── domain/       # Entidades e use-cases puros (sem framework)
│   └── shared/       # Tipos TypeScript e schemas Zod compartilhados
```

A camada `domain` não depende de nenhum framework — é TypeScript puro. Isso garante que as regras de negócio são testáveis de forma isolada e substituíveis sem reescrever o core.

## Funcionalidades Principais

**Multi-tenant & RBAC**
Isolamento rígido por organização. Controle granular de permissões por bitmask: `CREATE | EDIT | DELETE` em tasks, configurável por membro via Command Bus.

**Planos**
- **Padrão** — 1 usuário individual
- **Autônomo** — 1 usuário principal + seats adicionais pagos
- **Empresarial** — 1 Admin + 1 Gestor + 5 Funcionários com remanejamento interno

**Tipos de Projeto**
- **Software/Engenharia** — Kanban avançado integrado ao GitHub (Issues, PRs, Reviews). Métricas: Lead Time, Cycle Time, frequência de commits
- **Suporte/Operações** — Lista ordenada por SLA. Métricas: tempo de resposta, volume de chamados
- **Cronograma/Gantt** — Linha do tempo interativa com caminho crítico, dependências e marcos

**Integração GitHub**
- Vinculação de repositório existente ou criação de novo via API
- Setup automático de webhooks
- Sync em tempo real de commits, PRs e Issues via BullMQ

**Time Tracking**
Registro milisegundado por task via play/pause. Integração nativa com commits e abertura de PRs no GitHub.

**Audit Log Imutável**
Tabela append-only registrando `[Timestamp, Actor_ID, Resource_ID, Action, Old_State, New_State]`. Toda mutação de estado gera rastro histórico automático via Domain Events.

**Link Público para Clientes**
Token UUID v4 criptografado com expiração configurável gera URL pública independente de autenticação. Interface read-only minimalista com % de conclusão, esteira de entregas e validação de marcos.

## Roteiro de Desenvolvimento

### F1 — Foundation & Infraestrutura ✅
Monorepo pnpm + Turborepo, Fastify + TypeScript, Docker Compose (Postgres + Redis + pgAdmin), Zod env validation, ESLint + Prettier + Husky, graceful shutdown.

### F2 — Auth, Multi-tenant & RBAC
Entidades de domínio, Prisma schema multi-tenant, JWT com refresh token rotativo via Redis, middleware de tenant, sistema de planos, RBAC por bitmask via Command Bus.

### F3 — Core Domain: Projetos, Tasks & Audit
CRUD de projetos por tipo, Command Bus para mutations de tasks, Soft Delete, Time Tracking milisegundado, Audit Log imutável via Domain Events, link público para clientes.

### F4 — Integração GitHub
OAuth GitHub App, listagem e criação de repositórios, webhooks, sync em tempo real via BullMQ, métricas de engenharia.

### F5 — Frontend: App & Views
Design System Tailwind, auth flow, Kanban com drag-and-drop, Lista SLA, Gantt interativo, Time Tracking em tempo real via WebSocket, view pública do cliente.

### F6 — CI/CD
GitHub Actions (lint + tests + build em todo PR), branch protection rules, Dockerfile multi-stage, deploy automático Railway (API) + Vercel (Web).

### F7 — Qualidade & Testes
Testes unitários dos use-cases (Vitest), integração das rotas (Supertest), isolamento multi-tenant, E2E com Playwright.

## Como Rodar Localmente

**Pré-requisitos:** Node.js 20+, pnpm, Docker Desktop

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/kortex.git
cd kortex

# Instalar dependências
pnpm install

# Subir banco de dados e Redis
docker compose up -d

# Configurar variáveis de ambiente
cp apps/api/.env.example apps/api/.env
# editar .env com suas credenciais

# Rodar a API
pnpm dev
```

A API estará disponível em `http://localhost:3000`. Health check: `GET /health`.
