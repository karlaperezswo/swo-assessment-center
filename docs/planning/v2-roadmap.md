# Plan — Transformación `swo-assessment-center` → plataforma segura con copiloto IA

> Roadmap aprobado. Rama integradora: `feat/swo-assessment-v2`.
> Cada fase vive en una sub-rama y se mergea vía PR. Estimación total: ~11-13 semanas con 1-2 devs.

## Contexto

`swo-assessment-center` es un centro de evaluación de migraciones AWS usado por consultores SoftwareOne. Flujo de 4 fases (Selector → Assess → Mobilize → Migrate), con frontend React/Vite/shadcn + backend Express sobre AWS Lambda, integrado con Bedrock (Claude 3.5 Sonnet) **solo en el módulo de Oportunidades**.

Problemas detectados en el análisis del repo:

- **UX**: `App.tsx` de 635 líneas sin routing, `SelectorPhase.tsx` (696L), `DependencyMap.tsx` (2102L), `WavePlannerTool.tsx` con HTML hardcodeado. 10+ tabs planos en `AssessPhase`. Demasiada data visible a la vez, sin lazy-loading, sin skeletons, sin animaciones fluidas.
- **Datos**: No hay base de datos real. Todo vive en S3 + memoria (`InMemoryOpportunityStorage`) — se pierde al reiniciar Lambda. Session IDs son UUIDs sin validación de ownership.
- **Seguridad**: Sin autenticación. CORS abierto (`origin: '*'` + credentials en Lambda). Sin Helmet, sin rate limiting, sin WAF, sin audit log. APIs públicas sobre internet.
- **Usuarios**: No existe modelo de usuario/organización/rol. No hay multi-tenancy.
- **IA limitada**: Bedrock solo para generar oportunidades en una sola pantalla. Las demás fases no tienen asistencia.
- **No interoperable**: La lógica (parsers MPA, análisis Bedrock, recomendaciones) está encerrada en el backend Express — no reutilizable desde Claude Desktop u otros clientes.

## Objetivo

Convertir el proyecto en una **plataforma robusta, segura y multi-tenant** con:

1. **Copiloto IA transversal** presente en todas las fases, context-aware, con tool-use sobre los servicios existentes.
2. **MCP server público** que exponga la misma lógica a cualquier cliente MCP (Claude Desktop, IDEs, scripts).
3. **Persistencia real en DynamoDB** con esquema single-table, reemplazando almacenamiento en memoria.
4. **Autenticación y perfilamiento** con Cognito: SuperAdmin, Consultor, ClienteReadOnly — multi-tenancy por Organización.
5. **Hardening de seguridad**: WAF, Helmet, rate limiting, audit log, encryption at rest con KMS, least-privilege IAM.
6. **UX fluida**: React Router, agente como drawer persistente, progressive disclosure, command palette (Cmd+K), TanStack Query, skeleton loaders.

## Decisiones arquitectónicas confirmadas

- **Ejecución**: por fases incrementales (cada una mergeable independiente y útil).
- **Base de datos**: DynamoDB single-table. Encaja con serverless, sin VPC, ya hay interfaz preparada.
- **Auth**: AWS Cognito User Pool + Hosted UI (MFA, SAML para SSO corporativo).
- **Stack LLM**: Claude Agent SDK sobre Bedrock (streaming + tool-use), manteniendo `BedrockService` existente como cimiento.

---

## Fase 0 — Fundación (2-3 semanas)

**Rama**: `feat/v2-phase-0-foundation`

**Objetivo**: Cimientos técnicos sin cambiar funcionalidad visible.

**Entregables**:

- Nueva tabla DynamoDB `swo-assessments` (single-table, on-demand) + GSI1 (orgId) + GSI2 (ownerId). Provisionada vía CDK/SAM en `/aws/`.
- `backend/src/db/DynamoRepository.ts` — capa base con `put`, `get`, `query`, `batchWrite`, `transactWrite`.
- Migración `InMemoryOpportunityStorage` → `DynamoOpportunityStorage` implementando la interfaz ya existente.
- React Router v6 en `App.tsx`; rutas `/selector`, `/sessions/:id/assess`, `/sessions/:id/mobilize`, `/sessions/:id/migrate`. Estado derivado de URL, no de `useState`.
- CORS allowlist desde SSM Parameter Store (no hardcoded).
- `helmet` con CSP, HSTS, X-Frame-Options.
- `express-rate-limit` con store DynamoDB (TTL 1h). 60 req/min general, 10 req/min Bedrock.
- GitHub Actions CI: lint, typecheck, tests, build frontend y backend.

**Archivos críticos**:
- `backend/src/services/OpportunityStorageService.ts` — ya es una interfaz, swap directo a Dynamo.
- `backend/src/index.ts` — middleware chain: CORS → Helmet → rate limit → routes.
- `backend/src/lambda.ts` — mismo chain para Lambda.
- `frontend/src/App.tsx` — reemplazar máquina de estados por Router.
- `aws/cdk/dynamodb-stack.ts` (nuevo).

**Verificación**: `npm test`, `npm run build`. Deploy a `dev`, verificar flujo completo sigue operando, oportunidades persisten tras reinicio Lambda, rutas permiten deep-linking.

---

## Fase 1 — Autenticación, Multi-tenancy y Roles (2 semanas)

**Rama**: `feat/v2-phase-1-auth-tenancy`

**Objetivo**: Nadie accede sin loguearse. Cada consultor solo ve lo de su organización.

**Entregables**:

- Cognito User Pool `swo-assessment-users`:
  - MFA TOTP obligatorio para `Admin`/`Consultor`, opcional para `Cliente`.
  - Grupos: `superadmin`, `consultor`, `cliente-readonly` → claims en JWT.
  - Lambda trigger `PreTokenGeneration` inyecta `orgId` y `role` desde DynamoDB.
  - Hosted UI con branding mínimo SoftwareOne.
  - App client SPA con Authorization Code + PKCE.
  - SAML IdP preparado.
- API Gateway JWT Authorizer delante de todas las rutas (excepto `/healthz`).
- Middleware `requireRole(...roles)` + check a nivel dato (`session.orgId === user.orgId`) en cada controller.
- Entidades en DynamoDB: Organization, Membership, User, AuditLog (TTL 1 año).
- Pantallas: `/admin/users`, `/admin/orgs`, `/profile` (MFA setup).
- `AuthProvider` con token refresh silencioso; `ProtectedRoute` que redirige a Hosted UI.

**Matriz de permisos** (canónica en `shared/permissions.ts`):

| Módulo | SuperAdmin | Consultor | ClienteReadOnly |
|---|---|---|---|
| Gestionar orgs/usuarios | CRUD | — | — |
| Sesiones (todas) | ✓ | Solo su org | Solo compartidas |
| Crear/editar Session | ✓ | ✓ | — |
| Upload MPA/MRA, parsear | ✓ | ✓ | — |
| Ejecutar Bedrock | ✓ | ✓ (con cuota) | — |
| Aprobar oportunidades | ✓ | ✓ | — |
| Descargar reporte | ✓ | ✓ | ✓ |
| Ver audit log | ✓ | Solo propios | — |
| Administrar API keys MCP | ✓ | Solo propias | — |

**Archivos críticos**:
- `backend/src/middleware/auth.ts`, `backend/src/middleware/requireRole.ts` (nuevos).
- `backend/src/services/AuditLogService.ts` (nuevo).
- `frontend/src/auth/AuthProvider.tsx` (nuevo).
- `shared/permissions.ts` (nuevo).
- Todos los controllers existentes — añadir check de ownership.

**Verificación**: test e2e login; usuario A no puede leer `sessionId` creado por usuario B de otra org (403); MFA funciona; audit log se escribe.

---

## Fase 2 — Copiloto IA transversal (3 semanas)

**Rama**: `feat/v2-phase-2-ai-copilot`

**Objetivo**: un agente IA acompaña al consultor en toda la app. Explica, sugiere, redacta, calcula.

**Entregables**:

- **Drawer lateral persistente** (420px, colapsable) en todas las rutas autenticadas. No es bubble flotante — panel real con espacio para fuentes y tool calls.
- **Endpoint `/api/agent/chat`** con streaming SSE. Usa `InvokeModelWithResponseStream` de Bedrock.
- **Claude Agent SDK**:
  - System prompt cacheado (perfil consultor AWS, taxonomía 7Rs, glosario Well-Architected).
  - Memoria por sesión en DynamoDB (`SESSION#<id> / AGENT#<threadId>`).
  - Modelo routing: Haiku para clasificación barata, Sonnet para generación final.
- **Context provider** (`AgentContextProvider`): cada pantalla registra qué mira el usuario. El agente recibe el contexto en el system prompt.
- **Tools expuestos al agente**:
  - `get_session_summary(sessionId)`.
  - `analyze_mpa_gaps(sessionId)` → `OpportunityAnalyzerService`.
  - `explain_mra_score(sessionId, dimension)`.
  - `suggest_migration_waves(sessionId, criteria)` → dependency graph.
  - `generate_narrative(sessionId, section)` → Executive Summary.
  - `search_aws_docs(query)` → `scraperController`.
  - `compare_sessions(sessionIdA, sessionIdB)`.
  - `estimate_cost(resources[])` → `KnowledgeBaseService`.
- **Cuota por usuario** (middleware): N tokens/día; bloquea con mensaje claro.
- **UI del drawer**: markdown streaming, bloques de tool-call plegables, botones "Insertar en reporte" y "Copiar".

**Archivos críticos**:
- `backend/src/services/BedrockService.ts` — extender para streaming + tool loop.
- `backend/src/agent/AgentOrchestrator.ts` (nuevo).
- `backend/src/agent/tools/*.ts` (nuevos, uno por tool).
- `frontend/src/components/agent/AgentDrawer.tsx` (nuevo).
- `frontend/src/components/agent/AgentContextProvider.tsx` (nuevo).
- Cada `*Phase.tsx` registra contexto vía `useAgentContext()`.

**Verificación**: desde Mobilize con sesión cargada, pedir "¿qué waves propones?" debe responder con datos reales, mostrando tool calls. Latencia primer token <2s.

---

## Fase 3 — MCP Server público (2 semanas)

**Rama**: `feat/v2-phase-3-mcp-server`

**Objetivo**: exponer la lógica como MCP server consumible desde Claude Desktop y otros clientes.

**Entregables**:

- **Lambda separada** `mcp-server` con transporte HTTP + SSE.
- **OAuth 2.1** con Cognito como IdP (spec MCP 2025-03).
- **API keys de larga duración** como fallback: firmadas con KMS, scope-limited, revocables, hasheadas en DynamoDB (`USER#<id> / MCPKEY#<keyId>`).
- **Tools MCP**:
  - `list_sessions(orgId?)`, `get_session(id)`, `create_session(input)`.
  - `upload_mpa(sessionId, fileContent | presignedUrl)`.
  - `analyze_opportunities(sessionId)`.
  - `get_opportunities(sessionId, filters)`.
  - `get_ec2_recommendations(sessionId)`, `get_rds_recommendations(sessionId)`.
  - `suggest_waves(sessionId)`.
  - `generate_report(sessionId, format: "docx"|"pdf")` → URL firmada.
- **Resources MCP**:
  - `aws://knowledge/7rs-taxonomy`, `aws://knowledge/well-architected-pillars`.
  - `session://<id>/executive-summary`, `session://<id>/opportunities`.
  - `template://business-case-v2`.
- **Prompts MCP**: `migration-wave-planning`, `client-briefing-prep`, `executive-summary-draft`.
- Página `/settings/mcp`: generar/rotar/revocar API keys, copiar snippet para Claude Desktop.
- `docs/mcp/README.md` con ejemplos.

**Archivos críticos**:
- `backend/src/mcp/server.ts`, `backend/src/mcp/tools/*.ts`, `backend/src/mcp/resources/*.ts`, `backend/src/mcp/oauth.ts` (nuevos).
- `aws/cdk/mcp-stack.ts` (nuevo).
- `frontend/src/pages/McpSettings.tsx` (nuevo).

**Verificación**: configurar Claude Desktop con URL + API key, ejecutar `list_sessions` y `get_opportunities` desde una conversación; audit log registra cada llamada MCP con `keyId`.

---

## Fase 4 — UX deep-dive y hardening final (2-3 semanas)

**Rama**: `feat/v2-phase-4-ux-hardening`

**Objetivo**: la app se siente fluida, moderna y contenida.

**Entregables UX**:

- Descomponer monstruos:
  - `App.tsx` (635L) → split en sub-componentes <150L.
  - `SelectorPhase.tsx` (696L) → lazy + partir en `SelectorQuestionnaire`, `SelectorMatrix`, `SelectorResults`.
  - `DependencyMap.tsx` (2102L) → lazy + extraer hooks D3 a `useDependencyGraph.ts`.
  - `WavePlannerTool.tsx` → eliminar HTML hardcodeado, reescribir con shadcn.
- **TanStack Query** reemplaza `useState+axios` crudo: cache, refetch, optimistic UI.
- **Progressive disclosure** en `AssessPhase`: de 10+ tabs a 3 secciones (`Inputs`, `Análisis`, `Entregables`) con accordions.
- **Command palette (Cmd+K)** con `cmdk`: navegar sesiones, crear sesión, disparar tools del agente, cambiar tema, logout.
- **Skeleton loaders** en todo fetch.
- **Animaciones** con `framer-motion` solo donde aporte (transición fase, drawer agente, expansión cards).
- **Dark mode**.
- **Toast system** unificado (`sonner` ya instalado).
- **Design tokens**: densidad `compact | comfortable`.
- **Responsive**: tabs con labels en móvil (corregir `hidden sm:inline`).

**Entregables seguridad (cierre)**:

- **AWS WAF** delante de API Gateway: managed rules (Core, Known Bad Inputs, SQLi) + rate rule 2000 req/5min por IP.
- **Secrets Manager** con rotación 90 días. Retirar `.env` de Lambda.
- **KMS CMK** para cifrar DynamoDB + S3 (SSE-KMS).
- **IAM least-privilege**: auditar `bedrock-policy.json` y `lambda-s3-policy.json`.
- **Lambda AV scanning** (ClamAV layer) sobre uploads. Macie para DLP.
- **API Gateway request validators** con schemas Zod.
- Pentest interno + OWASP Top 10 checklist en `docs/security/README.md`.

**Archivos críticos**:
- Todos los `*Phase.tsx`, `DependencyMap.tsx`, `WavePlannerTool.tsx` — refactor.
- `frontend/src/lib/queryClient.ts`, `frontend/src/components/CommandPalette.tsx`, `frontend/src/theme/ThemeProvider.tsx` (nuevos).
- `aws/cdk/waf-stack.ts`, `aws/cdk/secrets-stack.ts`, `aws/cdk/kms-stack.ts` (nuevos).

**Verificación**: Lighthouse >90 en performance/accessibility, Playwright e2e cubriendo los 4 flujos + login + agente + MCP, pentest OWASP Top 10 documentado.

---

## Esquema DynamoDB single-table

Tabla `swo-assessments`, PK + SK, on-demand billing, encryption KMS.

| PK | SK | Entidad |
|---|---|---|
| `ORG#<orgId>` | `META` | Organization |
| `ORG#<orgId>` | `USER#<userId>` | Membership (role, joinedAt) |
| `USER#<userId>` | `PROFILE` | User (GSI1PK=`EMAIL#<email>`) |
| `USER#<userId>` | `MCPKEY#<keyId>` | API Key (hash, scopes) |
| `SESSION#<id>` | `META` | Session (clientName, phase, ownerId, orgId — GSI1=orgId, GSI2=ownerId) |
| `SESSION#<id>` | `ASSESSMENT#MPA` | MPA parsed data |
| `SESSION#<id>` | `ASSESSMENT#MRA` | MRA parsed data |
| `SESSION#<id>` | `OPP#<oppId>` | Opportunity |
| `SESSION#<id>` | `DOC#<docId>` | Document metadata + `s3Key` |
| `SESSION#<id>` | `AGENT#<threadId>` | Agent thread (messages) |
| `AUDIT#<yyyy-mm-dd>` | `<ts>#<userId>` | Audit log entry (TTL 1 año) |

S3 sigue albergando los binarios (xlsx/docx/pdf/reports). DynamoDB solo metadata + punteros.

## Riesgos y mitigaciones

1. **Costo del agente omnipresente en Bedrock**: prompt caching + Haiku para routing. Mitigación: cuota mensual por usuario, dashboard de consumo en `/admin`.
2. **DynamoDB limita queries analíticas ad-hoc**: exportar a S3 + Athena para BI. App operacional no hace esas queries.
3. **Cognito Hosted UI es genérico**: aceptado como trade-off. Branding mínimo; UI custom post-MVP.
4. **MCP expone lógica sensible**: cada API key MCP atada a `orgId`, tools validan ownership, rate limit agresivo, audit de cada invocación.
5. **Refactor rompe flujos**: mitigar con tests Playwright antes (Fase 0) y regresión después.

## Verificación end-to-end del proyecto completo

1. Crear organización y 2 usuarios (1 consultor, 1 cliente readonly).
2. Login con MFA, crear sesión, subir MPA + MRA.
3. Ejecutar análisis — verificar persistencia tras restart Lambda.
4. Abrir drawer del agente, pedir "resume los hallazgos críticos" — validar streaming + tool calls.
5. En `/settings/mcp` generar API key, conectar Claude Desktop, ejecutar `get_opportunities` desde ahí.
6. Como cliente readonly intentar modificar la sesión → 403.
7. Como consultor de otra org intentar leer la sesión → 403.
8. Revisar CloudWatch audit log: todas las acciones con `userId`, `orgId`, `resource`, `ip`, `correlationId`.
9. WAF bloquea payload XSS conocido.
10. Playwright e2e verde en CI.

## Operativa de ramas

```
main
 └── feat/swo-assessment-v2                          (integradora)
      ├── feat/v2-phase-0-foundation                 → PR a feat/swo-assessment-v2
      ├── feat/v2-phase-1-auth-tenancy               → PR a feat/swo-assessment-v2
      ├── feat/v2-phase-2-ai-copilot                 → PR a feat/swo-assessment-v2
      ├── feat/v2-phase-3-mcp-server                 → PR a feat/swo-assessment-v2
      └── feat/v2-phase-4-ux-hardening               → PR a feat/swo-assessment-v2
```

Al completar Fase 4, `feat/swo-assessment-v2` → `main` con PR final que incluye checklist global.
