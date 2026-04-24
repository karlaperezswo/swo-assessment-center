# MCP Server — swo-assessment-center

El Assessment Center expone su lógica como un **Model Context Protocol server**
consumible desde Claude Desktop, Claude Code, o cualquier cliente MCP. Así un
consultor puede preguntar "¿qué oportunidades tengo en la sesión X?" desde su
editor sin abrir el SPA.

## Endpoint

```
POST/GET/DELETE  https://<api-host>/mcp
```

Transporte: **Streamable HTTP** (spec MCP 2025-03). Una misma sesión MCP puede
enviar múltiples requests, identificadas por el header `mcp-session-id` que
devuelve el servidor tras la negociación inicial.

## Autenticación

Dos mecanismos aceptados:

1. **API key de larga duración** (recomendado):
   ```
   Authorization: Bearer swoak_XXXXXXXXXXXXXXX
   ```
   Las keys se generan en `/settings/mcp` del SPA y son hasheadas con
   SHA-256 antes de persistirse — sólo se muestran una vez.

2. **Cognito JWT** (dev / testing):
   ```
   Authorization: Bearer eyJra...<cognito-access-token>
   ```

## Configuración en Claude Desktop

Edita `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) o `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "swo-assessment": {
      "url": "https://<api-host>/mcp",
      "headers": {
        "Authorization": "Bearer swoak_XXXXXXXXXXXXXXX"
      }
    }
  }
}
```

Reinicia Claude Desktop. Deberías ver el server "swo-assessment" en la paleta
de conexiones MCP.

## Capacidades expuestas

### Tools

| Nombre | Qué hace |
|---|---|
| `get_session_summary` | Resumen de la sesión: oportunidades, ARR, prioridades. |
| `list_opportunities` | Detalle filtrable (priority, limit). |
| `search_aws_docs` | URLs candidatas de documentación AWS. |
| `estimate_cost` | TCO heurístico de recursos EC2/RDS/Storage. |

Las tools son las mismas que usa el copiloto in-app — añadir una tool allí la
publica automáticamente aquí.

### Resources

- `aws://knowledge/7rs-taxonomy` — taxonomía canónica de las 7R.
- `aws://knowledge/well-architected-pillars` — 6 pilares Well-Architected.
- `template://business-case-v2` — esqueleto para un Business Case.

### Prompts

- `migration-wave-planning(sessionId)` — planea waves para una sesión.
- `client-briefing-prep(sessionId)` — briefing de 10 minutos para reunión.
- `executive-summary-draft(sessionId)` — resumen ejecutivo 200-300 palabras.

## Seguridad

- Cada llamada se audita (`mcp:authenticate`, tool invocations vía Dynamo).
- Las keys son scope-limited: la escopa por defecto es `mcp:read` +
  `mcp:tools:call`. Escopos adicionales requieren asignación manual.
- Revocar una key es inmediato desde `/settings/mcp`.
- El rate limit global (60 req/min) aplica; el hit a Bedrock (10 req/min)
  aplica indirecto cuando la tool lo usa.

## Arquitectura

```
Cliente MCP (Claude Desktop)
        │  HTTPS  Authorization: Bearer swoak_...
        ▼
API Gateway ──► Lambda (Express)
                │  /mcp router
                │     ├─ authenticateMcp()  (API key o JWT)
                │     └─ handleMcpRequest()
                │           └─ StreamableHTTPServerTransport
                │                 └─ McpServer (tools/resources/prompts)
                │                        │
                │                        ├─ AGENT_TOOLS registry
                │                        │   └─ reutiliza los servicios
                │                        │      del in-app copilot
                │                        ▼
                │                 DynamoDB single-table
                ▼
         CloudWatch audit log
```
