import { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import { buildMcpServer } from './server';

/**
 * Per-session transports. The MCP streamable HTTP spec wants the same
 * session id to route multiple requests to the same transport for the
 * duration of a conversation. We key by the `mcp-session-id` header.
 */
const transports = new Map<string, StreamableHTTPServerTransport>();

export async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const ctx = req.mcpCtx;
  if (!ctx) {
    res.status(401).json({ error: 'mcp not authenticated' });
    return;
  }

  const sessionIdHeader = req.header('mcp-session-id');
  let transport = sessionIdHeader ? transports.get(sessionIdHeader) : undefined;

  if (!transport) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id: string) => {
        transports.set(id, transport!);
      },
    } as unknown as ConstructorParameters<typeof StreamableHTTPServerTransport>[0]);

    transport.onclose = () => {
      if (transport?.sessionId) {
        transports.delete(transport.sessionId);
      }
    };

    const server = buildMcpServer(ctx);
    await server.connect(transport);
  }

  await transport.handleRequest(req, res, req.body);
}
