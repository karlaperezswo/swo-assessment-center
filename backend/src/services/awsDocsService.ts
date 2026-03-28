import { spawn } from 'child_process';

// ── AWS Documentation MCP Service ─────────────────────────────────────────────
// Usa awslabs.aws-documentation-mcp-server via uvx para obtener documentación
// oficial de AWS directamente desde la fuente.

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: Record<string, any>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: { code: number; message: string };
}

async function callMCPTool(toolName: string, args: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('uvx', ['awslabs.aws-documentation-mcp-server@latest'], {
      env: {
        ...process.env,
        AWS_DOCUMENTATION_PARTITION: 'aws',
        FASTMCP_LOG_LEVEL: 'ERROR',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let initialized = false;

    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
    proc.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error('MCP server timeout'));
    }, 30000);

    proc.on('close', () => {
      clearTimeout(timeout);
      try {
        // Parse JSONRPC responses from stdout
        const lines = stdout.split('\n').filter(l => l.trim().startsWith('{'));
        for (const line of lines) {
          try {
            const msg: MCPResponse = JSON.parse(line);
            if (msg.id === 2 && msg.result) {
              resolve(msg.result);
              return;
            }
          } catch { continue; }
        }
        reject(new Error('No valid response from MCP server'));
      } catch (e) {
        reject(e);
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    // MCP initialization sequence
    const initMsg: MCPRequest = {
      jsonrpc: '2.0', id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'swo-assessment', version: '1.0.0' },
      },
    };

    const toolMsg: MCPRequest = {
      jsonrpc: '2.0', id: 2,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    };

    // Send init then tool call
    proc.stdin.write(JSON.stringify(initMsg) + '\n');
    setTimeout(() => {
      if (!initialized) {
        initialized = true;
        proc.stdin.write(JSON.stringify(toolMsg) + '\n');
        proc.stdin.end();
      }
    }, 1000);
  });
}

export async function searchAWSDocumentation(serviceName: string): Promise<{
  title: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  useCases: string[];
  docsUrl: string;
}> {
  try {
    // Try search_documentation first
    const searchResult = await callMCPTool('search_documentation', {
      query: serviceName,
      limit: 3,
    });

    let title = serviceName;
    let description = '';
    let docsUrl = `https://docs.aws.amazon.com/`;
    const advantages: string[] = [];
    const useCases: string[] = [];

    if (searchResult?.content) {
      const content = Array.isArray(searchResult.content)
        ? searchResult.content.map((c: any) => c.text || '').join('\n')
        : String(searchResult.content);

      // Extract title from first result
      const titleMatch = content.match(/^#+\s+(.+)/m);
      if (titleMatch) title = titleMatch[1].trim();

      // Extract description (first paragraph)
      const paras = content.split('\n\n').filter((p: string) => p.trim().length > 50);
      if (paras.length > 0) description = paras[0].replace(/^#+\s+.+\n/, '').trim().slice(0, 500);

      // Extract URL
      const urlMatch = content.match(/https?:\/\/docs\.aws\.amazon\.com[^\s)]+/);
      if (urlMatch) docsUrl = urlMatch[0];

      // Extract bullet points as advantages
      const bullets = content.match(/^[-*]\s+(.+)/gm) || [];
      bullets.slice(0, 6).forEach((b: string) => advantages.push(b.replace(/^[-*]\s+/, '').trim()));

      // Extract headings as use cases
      const headings = content.match(/^#{2,3}\s+(.+)/gm) || [];
      headings.slice(0, 5).forEach((h: string) => useCases.push(h.replace(/^#+\s+/, '').trim()));
    }

    return {
      title: title || serviceName,
      description: description || `${serviceName} es un servicio de Amazon Web Services.`,
      advantages: advantages.length > 0 ? advantages : [
        'Alta disponibilidad y escalabilidad automática.',
        'Integración nativa con otros servicios de AWS.',
        'Modelo de pago por uso sin costos iniciales.',
        'Seguridad gestionada por AWS con certificaciones globales.',
      ],
      disadvantages: [
        'Requiere conocimiento previo de la plataforma AWS para configuración óptima.',
        'Los costos pueden incrementarse con el uso intensivo sin una política de optimización.',
        'La dependencia del proveedor (vendor lock-in) puede ser un factor a considerar.',
      ],
      useCases: useCases.length > 0 ? useCases : ['Proyectos de migración a la nube', 'Arquitecturas serverless'],
      docsUrl,
    };
  } catch (err: any) {
    console.warn('[AWS Docs MCP] Error, falling back to scraper:', err.message);
    throw err; // Let caller handle fallback
  }
}
