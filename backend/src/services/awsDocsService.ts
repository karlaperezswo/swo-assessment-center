import axios from 'axios';

const PYTHON_API = process.env.AWS_DOCS_API_URL || 'http://localhost:8001';

// ── AWS Documentation via Python FastAPI + MCP ────────────────────────────────

async function isPythonApiAvailable(): Promise<boolean> {
  try {
    await axios.get(`${PYTHON_API}/health`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export async function searchAWSDocumentation(serviceName: string): Promise<{
  title: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  useCases: string[];
  docsUrl: string;
  summary?: string;
  features?: string[];
  security?: string[];
  cost?: string[];
  quotas?: string[];
}> {
  const available = await isPythonApiAvailable();
  if (!available) throw new Error('Python AWS Docs API no disponible en puerto 8001');

  const res = await axios.get(`${PYTHON_API}/servicio`, {
    params: { nombre: serviceName },
    timeout: 40000,
  });

  const d = res.data;

  // Si el protocolo retornó error
  if (d.error) throw new Error(d.error);

  return {
    title:        d.title        || serviceName,
    description:  d.summary      || d.description || '',
    advantages:   d.features     || d.advantages  || [],
    disadvantages: d.disadvantages || [],
    useCases:     d.useCases     || [],
    docsUrl:      d.docsUrl      || `https://docs.aws.amazon.com/`,
    // Campos extendidos del protocolo
    summary:   d.summary,
    features:  d.features,
    security:  d.security,
    cost:      d.cost,
    quotas:    d.quotas,
  };
}

export async function searchAWSByUrl(url: string): Promise<{
  title: string;
  description: string;
  keyPoints: string[];
  advantages: string[];
  disadvantages: string[];
  docsUrl: string;
}> {
  const available = await isPythonApiAvailable();

  if (!available) {
    throw new Error('Python AWS Docs API no disponible en puerto 8001');
  }

  const res = await axios.get(`${PYTHON_API}/leer`, {
    params: { url },
    timeout: 35000,
  });

  const d = res.data;
  const sections = d.sections || [];

  const title = sections[0]?.heading || url;
  const description = sections[0]?.content?.slice(0, 400) || '';
  const keyPoints = sections.slice(1, 6).map((s: any) => s.heading).filter(Boolean);
  const advantages: string[] = [];

  // Extraer bullets del raw content
  const raw: string = d.raw || '';
  raw.split('\n').forEach((line: string) => {
    const l = line.trim();
    if ((l.startsWith('- ') || l.startsWith('* ')) && l.length > 20 && advantages.length < 6) {
      advantages.push(l.slice(2).trim());
    }
  });

  return {
    title,
    description,
    keyPoints: keyPoints.length > 0 ? keyPoints : ['Consulte la documentación oficial para más detalles.'],
    advantages: advantages.length > 0 ? advantages : ['Consulte la documentación oficial para ventajas detalladas.'],
    disadvantages: [
      'Requiere planificación y configuración inicial adecuada.',
      'Puede generar costos adicionales si no se gestiona correctamente.',
      'Dependencia del proveedor (vendor lock-in) a considerar.',
    ],
    docsUrl: url,
  };
}
