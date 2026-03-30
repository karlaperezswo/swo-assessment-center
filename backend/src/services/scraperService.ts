import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
};

// ── AWS Service Scraper ───────────────────────────────────────────────────────
export async function scrapeAWSService(serviceName: string): Promise<{
  title: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  useCases: string[];
  docsUrl: string;
}> {
  const slug = serviceName.toLowerCase()
    .replace(/^amazon\s+/i, '')
    .replace(/^aws\s+/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const urlsToTry = [
    `https://aws.amazon.com/${slug}/`,
    `https://aws.amazon.com/es/${slug}/`,
    `https://docs.aws.amazon.com/${slug}/latest/userguide/what-is-${slug}.html`,
    `https://docs.aws.amazon.com/${slug}/latest/userguide/Welcome.html`,
    `https://aws.amazon.com/${slug}/features/`,
    `https://aws.amazon.com/${slug}/faqs/`,
  ];

  let html = '';
  let usedUrl = urlsToTry[0];

  for (const url of urlsToTry) {
    try {
      const res = await axios.get(url, { headers: HEADERS, timeout: 12000, maxRedirects: 5 });
      if (res.status === 200 && res.data.length > 500) {
        html = res.data; usedUrl = url; break;
      }
    } catch { continue; }
  }

  if (!html) {
    try {
      const searchUrl = `https://aws.amazon.com/search/?searchQuery=${encodeURIComponent(serviceName)}`;
      const res = await axios.get(searchUrl, { headers: HEADERS, timeout: 10000 });
      html = res.data; usedUrl = searchUrl;
    } catch {
      throw new Error(`No se pudo obtener información de AWS para: ${serviceName}`);
    }
  }

  return parseAWSHtml(html, serviceName, usedUrl);
}

// ── Generic URL Scraper (any AWS or external URL) ─────────────────────────────
export async function scrapeByUrl(url: string): Promise<{
  title: string;
  description: string;
  keyPoints: string[];
  advantages: string[];
  disadvantages: string[];
  docsUrl: string;
}> {
  let html = '';
  try {
    const res = await axios.get(url, { headers: HEADERS, timeout: 15000, maxRedirects: 5 });
    html = res.data;
  } catch (err: any) {
    throw new Error(`No se pudo acceder a la URL: ${err.message}`);
  }

  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, .cookie-banner, .nav, .footer, .header, .sidebar, .breadcrumb').remove();

  const title =
    $('h1').first().text().trim() ||
    $('title').text().replace(/[-|].*$/, '').trim() ||
    $('meta[property="og:title"]').attr('content') || url;

  let description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') || '';

  if (!description || description.length < 60) {
    const paras = $('main p, article p, .lb-txt-normal, section p, p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(t => t.length > 80 && t.length < 800);
    if (paras.length > 0) description = paras[0];
  }

  const keyPoints: string[] = [];
  $('h2, h3').each((_, el) => {
    const heading = $(el).text().trim();
    if (heading.length > 5 && heading.length < 120 && keyPoints.length < 8) {
      const next = $(el).next('p').text().trim();
      keyPoints.push(next ? `${heading}: ${next.slice(0, 200)}` : heading);
    }
  });

  const advantages: string[] = [];
  $('ul li, ol li').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20 && text.length < 300 && advantages.length < 6) advantages.push(text);
  });

  return {
    title: title.slice(0, 120),
    description: description || 'Descripción no disponible. Edite manualmente.',
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

// ── Shared HTML parser for AWS pages ─────────────────────────────────────────
function parseAWSHtml(html: string, serviceName: string, usedUrl: string): {
  title: string; description: string; advantages: string[];
  disadvantages: string[]; useCases: string[]; docsUrl: string;
} {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, .cookie-banner, .breadcrumb').remove();

  let title =
    $('h1').first().text().trim() ||
    $('title').text().replace(/\s*[-|]\s*(AWS|Amazon).*$/i, '').trim() ||
    $('meta[property="og:title"]').attr('content') ||
    serviceName;

  let description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') || '';

  if (!description || description.length < 60) {
    const paras = $('main p, .lb-txt-normal, article p, section p, p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(t => t.length > 80 && t.length < 800);
    if (paras.length > 0) description = paras[0];
  }

  const advantages: string[] = [];
  $('ul li, .lb-txt-normal li').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20 && text.length < 300 && advantages.length < 6) advantages.push(text);
  });

  const useCases: string[] = [];
  $('h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 100 && useCases.length < 5) useCases.push(text);
  });

  return {
    title: (title || serviceName).slice(0, 120),
    description: description || `${serviceName} es un servicio de Amazon Web Services que proporciona capacidades escalables y administradas en la nube.`,
    advantages: advantages.length > 0 ? advantages.slice(0, 6) : [
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
    useCases: useCases.length > 0 ? useCases.slice(0, 5) : ['Proyectos de migración a la nube', 'Arquitecturas serverless', 'Aplicaciones empresariales escalables'],
    docsUrl: usedUrl,
  };
}


export async function scrapeCompanyInfo(companyUrl: string): Promise<{
  mission: string;
  vision: string;
  about: string;
  name: string;
}> {
  // Normalize URL
  let url = companyUrl.trim();
  if (!url.startsWith('http')) url = `https://${url}`;

  // Pages to try for mission/vision
  const pagesToTry = [
    url,
    `${url}/about`,
    `${url}/about-us`,
    `${url}/nosotros`,
    `${url}/quienes-somos`,
    `${url}/empresa`,
    `${url}/mision-vision`,
    `${url}/about/mission`,
  ];

  let mission = '';
  let vision = '';
  let about = '';
  let companyName = '';

  for (const pageUrl of pagesToTry) {
    try {
      const res = await axios.get(pageUrl, {
        headers: HEADERS,
        timeout: 12000,
        maxRedirects: 5,
      });

      if (res.status !== 200) continue;

      const $ = cheerio.load(res.data);

      // Extract company name
      if (!companyName) {
        companyName = $('title').text().split(/[-|]/)[0].trim() ||
          $('meta[property="og:site_name"]').attr('content') || '';
      }

      const bodyText = $('body').text();

      // Search for mission keywords
      if (!mission) {
        const missionPatterns = [
          /misi[oó]n[:\s]+([^.!?]{40,400}[.!?])/i,
          /nuestra misi[oó]n[:\s]+([^.!?]{40,400}[.!?])/i,
          /our mission[:\s]+([^.!?]{40,400}[.!?])/i,
          /mission statement[:\s]+([^.!?]{40,400}[.!?])/i,
        ];
        for (const pattern of missionPatterns) {
          const match = bodyText.match(pattern);
          if (match) { mission = match[1].trim(); break; }
        }

        // Try heading-based extraction
        if (!mission) {
          $('h1, h2, h3, h4').each((_, el) => {
            const heading = $(el).text().toLowerCase();
            if (/misi[oó]n|mission/.test(heading)) {
              const next = $(el).next('p, div').text().trim();
              if (next.length > 30) { mission = next; return false; }
            }
          });
        }
      }

      // Search for vision keywords
      if (!vision) {
        const visionPatterns = [
          /visi[oó]n[:\s]+([^.!?]{40,400}[.!?])/i,
          /nuestra visi[oó]n[:\s]+([^.!?]{40,400}[.!?])/i,
          /our vision[:\s]+([^.!?]{40,400}[.!?])/i,
        ];
        for (const pattern of visionPatterns) {
          const match = bodyText.match(pattern);
          if (match) { vision = match[1].trim(); break; }
        }

        if (!vision) {
          $('h1, h2, h3, h4').each((_, el) => {
            const heading = $(el).text().toLowerCase();
            if (/visi[oó]n|vision/.test(heading)) {
              const next = $(el).next('p, div').text().trim();
              if (next.length > 30) { vision = next; return false; }
            }
          });
        }
      }

      // Extract about/description
      if (!about) {
        about = $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') || '';
        if (!about) {
          const firstP = $('main p, article p, section p').first().text().trim();
          if (firstP.length > 50) about = firstP;
        }
      }

      if (mission && vision) break;

    } catch {
      continue;
    }
  }

  return {
    name: companyName,
    mission: mission || 'No se encontró la misión en el sitio web. Por favor, ingrese manualmente.',
    vision: vision || 'No se encontró la visión en el sitio web. Por favor, ingrese manualmente.',
    about: about || '',
  };
}

// ── SoftwareOne Logo Fetcher ──────────────────────────────────────────────────
export async function getSoftwareOneLogo(): Promise<string> {
  // Known SoftwareOne logo URLs (CDN / official)
  const logoUrls = [
    'https://www.softwareone.com/-/media/global/logos/softwareone-logo.svg',
    'https://www.softwareone.com/-/media/global/logos/swo-logo-white.svg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/SoftwareONE_logo.svg/1200px-SoftwareONE_logo.svg',
  ];

  for (const url of logoUrls) {
    try {
      const res = await axios.get(url, {
        headers: HEADERS,
        timeout: 8000,
        responseType: 'arraybuffer',
      });
      if (res.status === 200) {
        const base64 = Buffer.from(res.data).toString('base64');
        const mimeType = url.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
        return `data:${mimeType};base64,${base64}`;
      }
    } catch {
      continue;
    }
  }

  // Fallback: return embedded minimal SoftwareOne SVG logo
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50">
    <rect width="200" height="50" fill="#E31837"/>
    <text x="10" y="35" font-family="Arial" font-size="20" font-weight="bold" fill="white">SoftwareOne</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(fallbackSvg).toString('base64')}`;
}
