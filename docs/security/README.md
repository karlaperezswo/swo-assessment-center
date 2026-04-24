# Seguridad — swo-assessment-center v2

Checklist vigente de controles de seguridad implementados y pendientes.
Este documento es la referencia del equipo para auditorías internas y
revisiones OWASP Top 10.

## Arquitectura de defensa en profundidad

```
 Cliente  ──► CloudFront ──► AWS WAF ──► API Gateway ──► Lambda ──► DynamoDB/S3
                                │            │               │            │
                                │            │               │            └─ KMS (SSE)
                                │            │               ├─ Secrets Manager
                                │            │               └─ IAM role least-privilege
                                │            └─ JWT authorizer (Cognito)
                                └─ managed rules (CRS, SQLi, BadInputs)
                                   + rate-limit 2000/5min/IP
```

## Controles implementados (v2)

### Identidad y acceso

| Control | Implementado | Ubicación |
|---|---|---|
| Cognito User Pool con MFA obligatorio (TOTP) | ✅ | [aws/cognito-stack.yaml](../../aws/cognito-stack.yaml) |
| Advanced Security Mode (riesgos de login) | ✅ | idem |
| Authorization Code + PKCE (sin client secret en SPA) | ✅ | idem |
| Grupos/roles (`superadmin`, `consultor`, `cliente-readonly`) | ✅ | idem |
| Federación SAML preparada (SSO enterprise) | ✅ (shell) | idem |
| Matriz canónica de permisos | ✅ | [shared/permissions.ts](../../shared/permissions.ts) |
| Middleware backend de JWT (authenticate) | ✅ | [backend/src/middleware/auth.ts](../../backend/src/middleware/auth.ts) |
| Guards por rol y permiso | ✅ | [backend/src/middleware/requireRole.ts](../../backend/src/middleware/requireRole.ts) |
| API keys MCP hasheadas (SHA-256), revocables | ✅ | [backend/src/db/ApiKeyRepository.ts](../../backend/src/db/ApiKeyRepository.ts) |

### Red / perímetro

| Control | Implementado | Ubicación |
|---|---|---|
| CORS allowlist env-driven (no `origin: '*'`) | ✅ | [backend/src/middleware/security.ts](../../backend/src/middleware/security.ts) |
| Helmet (CSP, HSTS, X-Frame-Options, Referrer-Policy, CORP) | ✅ | idem |
| Rate limit global 60 req/min/IP | ✅ | idem |
| Rate limit Bedrock 10 req/min/IP | ✅ | idem |
| AWS WAFv2 (Core, BadInputs, SQLi, 2000/5min) | ✅ (template) | [aws/waf-stack.yaml](../../aws/waf-stack.yaml) |
| Asociar WAF al stage de API Gateway | ⏳ manual | ver aws/waf-stack.yaml |

### Datos

| Control | Implementado | Ubicación |
|---|---|---|
| DynamoDB SSE con CMK KMS | ✅ (template) | [aws/kms-stack.yaml](../../aws/kms-stack.yaml), [aws/dynamodb-stack.yaml](../../aws/dynamodb-stack.yaml) |
| S3 SSE-KMS (reemplaza SSE-S3) | ⏳ pendiente | reconfigurar bucket con KMS |
| Point-in-time recovery en DynamoDB | ✅ | aws/dynamodb-stack.yaml |
| Deletion protection en tabla prod | ✅ | idem |
| Rotación de claves KMS (1 año) | ✅ | aws/kms-stack.yaml |
| Secrets Manager con rotación 90d | ✅ (template) | [aws/secrets-stack.yaml](../../aws/secrets-stack.yaml) |
| Migrar .env de Lambda a Secrets Manager | ⏳ pendiente | actualizar lambda.ts para leer en cold-start |
| Anonimización de datos sensibles antes de Bedrock | ✅ | `backend/src/services/AnonymizationService.ts` |

### Aplicación

| Control | Implementado | Ubicación |
|---|---|---|
| Validación Zod de inputs en endpoints nuevos | ✅ | AgentController, ApiKeyController |
| Ownership check por `orgId` en rutas sensibles | ⏳ por endpoint | seguir con los controllers heredados |
| Escape de output HTML en generadores | parcial | `dependencyController` |
| Audit log estructurado con TTL 1 año | ✅ | [backend/src/services/AuditLogService.ts](../../backend/src/services/AuditLogService.ts) |
| File upload restringido por mimetype + 50MB | ✅ | existente, conservado |
| Antivirus scanning en uploads | ⏳ pendiente | añadir Lambda + ClamAV layer |
| CSP enforce (no solo report-only) | ⏳ pendiente | flag CSP_ENFORCE cuando esté auditado |

## Checklist OWASP Top 10 (2021)

| # | Riesgo | Estado | Notas |
|---|---|---|---|
| A01 | Broken Access Control | ✅ mitigado | Cognito + `requirePermission` + ownership check parcial. Pendiente: barrer los controllers heredados. |
| A02 | Cryptographic Failures | ✅ mitigado | KMS CMK, HTTPS enforced por API Gateway, passwords Cognito ≥12 chars. |
| A03 | Injection | ✅ mitigado | Zod en endpoints nuevos, WAF SQLi rule, no SQL on-premises (Dynamo). |
| A04 | Insecure Design | ✅ | Defensa en profundidad (WAF→Helmet→RateLimit→JWT→Permiso). |
| A05 | Security Misconfiguration | ✅ | CORS allowlist, Helmet defaults, hostname restringido a API Gateway. |
| A06 | Vulnerable Components | ⚠️ | Pendiente `npm audit` en CI — añadir step en `.github/workflows/ci.yml`. |
| A07 | ID&A Failures | ✅ | MFA TOTP + Advanced Security Cognito + rate limit login (Cognito built-in). |
| A08 | Software & Data Integrity Failures | ⚠️ | Pendiente: subresource integrity y firma de artefactos Lambda. |
| A09 | Security Logging & Monitoring | ✅ | Audit log estructurado + CloudWatch métricas WAF. Pendiente: alertas. |
| A10 | SSRF | ✅ | Scraper stub no hace fetch arbitrario; tools del agente validan entradas. |

## Próximas iteraciones (post-v2)

1. Ejecutar pentest externo (tercero) y registrar findings en este documento.
2. Implementar antivirus (ClamAV Lambda layer) en uploads.
3. `npm audit --audit-level=high` como step obligatorio en CI.
4. Alertas CloudWatch + SNS para WAF blocks > threshold y fallos de auth > threshold.
5. Security Headers score externo (securityheaders.com) ≥ A.
6. Auditar y aplicar CSP_ENFORCE=true.
7. Cerrar los checks de ownership en los controllers heredados (Selector, BusinessCase, Dependency, Scraper, Report).
