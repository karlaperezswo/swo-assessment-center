import axios from 'axios';

const PYTHON_API = process.env.AWS_DOCS_API_URL || 'http://localhost:8001';

async function isPythonApiAvailable(): Promise<boolean> {
  try {
    await axios.get(`${PYTHON_API}/health`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export async function searchAWSDocumentation(serviceName: string): Promise<{
  title: string; description: string; advantages: string[]; disadvantages: string[];
  useCases: string[]; docsUrl: string;
  summary?: string; features?: string[]; security?: string[]; cost?: string[]; quotas?: string[];
}> {
  const available = await isPythonApiAvailable();
  if (!available) throw new Error('Python AWS Docs API no disponible en puerto 8001');

  const res = await axios.get(`${PYTHON_API}/servicio`, { params: { nombre: serviceName }, timeout: 40000 });
  const d = res.data;
  if (d.error) throw new Error(d.error);

  return {
    title:         d.title         || serviceName,
    description:   d.summary       || d.description || '',
    advantages:    d.features      || d.advantages  || [],
    disadvantages: d.disadvantages || [],
    useCases:      d.useCases      || [],
    docsUrl:       d.docsUrl       || 'https://docs.aws.amazon.com/',
    summary:  d.summary,
    features: d.features,
    security: d.security,
    cost:     d.cost,
    quotas:   d.quotas,
  };
}

export async function searchAWSByUrl(url: string): Promise<{
  title: string; description: string; keyPoints: string[];
  advantages: string[]; disadvantages: string[]; docsUrl: string;
  keyTerms?: { term: string; context: string }[];
  sections?: { heading: string; content: string }[];
  rawText?: string; fromCache?: boolean;
}> {
  const available = await isPythonApiAvailable();
  if (!available) throw new Error('Python AWS Docs API no disponible en puerto 8001');

  const res = await axios.get(`${PYTHON_API}/extraer`, { params: { url }, timeout: 40000 });
  const d = res.data;

  return {
    title:       d.title       || url,
    description: d.description || '',
    keyPoints:   d.keyPoints   || [],
    advantages:  d.keyPoints   || [],
    disadvantages: [
      'Requiere planificación y configuración inicial adecuada.',
      'Puede generar costos adicionales si no se gestiona correctamente.',
    ],
    docsUrl:   d.docsUrl   || url,
    keyTerms:  d.keyTerms  || [],
    sections:  d.sections  || [],
    rawText:   d.rawText   || '',
    fromCache: d.fromCache || false,
  };
}
