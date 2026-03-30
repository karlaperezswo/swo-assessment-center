import { TechMemoryData, AWSServiceEntry, DictionaryEntry, WellArchPillar } from './types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(s: string): string {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function paragraphs(text: string): string {
  if (!text) return '<p>—</p>';
  return text.split('\n').filter(l => l.trim()).map(l => `<p>${escHtml(l.trim())}</p>`).join('');
}

function replacePlaceholders(text: string, data: TechMemoryData): string {
  return text
    .replace(/\[NOMBRE_EMPRESA\]/g, data.clientName || '[NOMBRE_EMPRESA]')
    .replace(/\[CONSULTOR\]/g, data.consultorName || '[CONSULTOR]')
    .replace(/\[CORREO\]/g, data.consultorEmail || '[CORREO]')
    .replace(/\[FIRMA\]/g, data.consultorSignature || '[FIRMA]')
    .replace(/\[FECHA\]/g, new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }));
}

// ── APA Word Export ───────────────────────────────────────────────────────────
export function exportTechMemoryWord(data: TechMemoryData): void {
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const year = new Date().getFullYear();

  const servicesSections = data.services.map((svc, idx) => buildServiceSection(svc, idx + 1)).join('');
  const selectedTerms = (data.dictionary || []).filter(d => d.selected);
  const glossarySection = selectedTerms.length > 0 ? buildGlossarySection(selectedTerms) : '';
  const wellArchSection = (data.wellArch || []).length > 0 ? buildWellArchSection(data.wellArch) : '';

  const intro = replacePlaceholders(data.introduction || '', data);
  const infra = replacePlaceholders(data.infraSummary || '', data);
  const concl = replacePlaceholders(data.conclusions || '', data);

  // TOC numbering
  let secNum = 1;
  const toc: string[] = [
    `${secNum++}. Introducción`,
    `${secNum++}. Información de la Empresa`,
    `${secNum++}. Resumen de la Infraestructura`,
    `${secNum++}. Servicios AWS Implementados`,
    ...(wellArchSection ? [`${secNum++}. Recomendaciones Well-Architected`] : []),
    `${secNum++}. Conclusiones`,
    ...(glossarySection ? [`${secNum++}. Glosario`] : []),
    `${secNum++}. Referencias`,
    `${secNum++}. Carta de Agradecimiento`,
  ];

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>Memoria Técnica — ${escHtml(data.projectName)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
<style>
  @page { size: A4; margin: 2.54cm 3cm 2.54cm 3cm; }
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; color: #000; line-height: 2; margin: 0; }
  h1 { font-size: 16pt; font-weight: bold; text-align: center; margin: 24pt 0 6pt; }
  h2 { font-size: 14pt; font-weight: bold; margin: 18pt 0 6pt; }
  h3 { font-size: 12pt; font-weight: bold; margin: 12pt 0 4pt; }
  p  { margin: 0 0 12pt; text-align: justify; text-indent: 1.27cm; }
  p.no-indent { text-indent: 0; }
  .cover { text-align: center; page-break-after: always; }
  .cover img { max-width: 180px; margin: 20pt auto 10pt; display: block; }
  .cover .client-logo { max-width: 140px; margin: 10pt auto; display: block; }
  .cover h1 { font-size: 18pt; margin-top: 30pt; }
  .cover .meta { font-size: 11pt; margin-top: 8pt; }
  .section-title { font-size: 14pt; font-weight: bold; text-transform: uppercase;
    border-bottom: 2px solid #000; padding-bottom: 4pt; margin: 24pt 0 12pt; page-break-after: avoid; }
  .service-block { margin-bottom: 24pt; page-break-inside: avoid; }
  .service-title { font-size: 13pt; font-weight: bold; margin: 16pt 0 6pt; }
  ul { margin: 0 0 12pt 2cm; } li { margin-bottom: 4pt; }
  .apa-ref { font-size: 10pt; margin-left: 1.27cm; text-indent: -1.27cm; margin-bottom: 6pt; }
  .page-break { page-break-before: always; }
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
  table.info td { padding: 4pt 8pt; border: 1px solid #ccc; font-size: 11pt; }
  table.info td:first-child { font-weight: bold; width: 35%; background: #f5f5f5; }
  .pillar-block { margin-bottom: 18pt; page-break-inside: avoid; }
  .pillar-header { padding: 8pt 12pt; color: #fff; font-weight: bold; font-size: 12pt; border-radius: 4pt; margin-bottom: 6pt; }
</style>
</head>
<body>

<!-- PORTADA -->
<div class="cover">
  ${data.swoLogoBase64 ? `<img src="${data.swoLogoBase64}" alt="SoftwareOne" />` : '<p style="font-size:18pt;font-weight:bold;color:#E31837">SoftwareOne</p>'}
  ${data.clientLogoBase64 ? `<img class="client-logo" src="${data.clientLogoBase64}" alt="${escHtml(data.clientName)}" />` : ''}
  <h1>MEMORIA TÉCNICA</h1>
  <h2>${escHtml(data.projectName)}</h2>
  <p class="no-indent meta"><strong>Cliente:</strong> ${escHtml(data.clientName)}</p>
  <p class="no-indent meta"><strong>Fecha:</strong> ${date}</p>
  <p class="no-indent meta"><strong>Versión:</strong> ${escHtml(data.version || '1.0')}</p>
  <p class="no-indent meta"><strong>Elaborado por:</strong> ${escHtml(data.consultorName || data.authors)}</p>
  ${data.consultorEmail ? `<p class="no-indent meta"><strong>Correo:</strong> ${escHtml(data.consultorEmail)}</p>` : ''}
  <p class="no-indent meta" style="margin-top:30pt;font-size:10pt;color:#555">SoftwareOne — AWS Migration Assessment Platform<br/>${year}</p>
</div>

<!-- TABLA DE CONTENIDO -->
<div class="page-break">
  <div class="section-title">Tabla de Contenido</div>
  ${toc.map((t, i) => `<p class="no-indent">${t} ${''.padEnd(60 - t.length, '.')} ${i + 3}</p>`).join('')}
</div>

<!-- 1. INTRODUCCIÓN -->
<div class="page-break">
  <div class="section-title">1. Introducción</div>
  ${paragraphs(intro)}
</div>

<!-- 2. INFORMACIÓN DE LA EMPRESA -->
<div class="page-break">
  <div class="section-title">2. Información de la Empresa</div>
  <table class="info">
    <tr><td>Empresa</td><td>${escHtml(data.clientName)}</td></tr>
    <tr><td>Sitio Web</td><td>${escHtml(data.clientUrl)}</td></tr>
    ${data.consultorName ? `<tr><td>Consultor</td><td>${escHtml(data.consultorName)}</td></tr>` : ''}
    ${data.consultorEmail ? `<tr><td>Correo</td><td>${escHtml(data.consultorEmail)}</td></tr>` : ''}
  </table>
  ${data.clientMission ? `<h3>Misión</h3>${paragraphs(data.clientMission)}` : ''}
  ${data.clientVision  ? `<h3>Visión</h3>${paragraphs(data.clientVision)}`  : ''}
  ${data.clientAbout   ? `<h3>Acerca de la Empresa</h3>${paragraphs(data.clientAbout)}` : ''}
</div>

<!-- 3. RESUMEN DE LA INFRAESTRUCTURA -->
<div class="page-break">
  <div class="section-title">3. Resumen de la Infraestructura</div>
  ${paragraphs(infra)}
</div>

<!-- 4. SERVICIOS AWS -->
<div class="page-break">
  <div class="section-title">4. Servicios AWS Implementados</div>
  ${servicesSections || '<p>No se han agregado servicios AWS.</p>'}
</div>

<!-- 5. RECOMENDACIONES WELL-ARCHITECTED -->
${wellArchSection ? `<div class="page-break"><div class="section-title">5. Recomendaciones Well-Architected Framework</div>${wellArchSection}</div>` : ''}

<!-- CONCLUSIONES -->
<div class="page-break">
  <div class="section-title">${wellArchSection ? '6' : '5'}. Conclusiones</div>
  ${paragraphs(concl)}
</div>

<!-- GLOSARIO -->
${glossarySection ? `<div class="page-break">${glossarySection}</div>` : ''}

<!-- REFERENCIAS (APA) -->
<div class="page-break">
  <div class="section-title">Referencias</div>
  ${data.services.map(svc => `
  <p class="apa-ref no-indent">
    Amazon Web Services. (${year}). <em>${escHtml(svc.title)}</em>.
    Amazon Web Services, Inc. Recuperado de <a href="${escHtml(svc.docsUrl)}">${escHtml(svc.docsUrl)}</a>
  </p>`).join('')}
  <p class="apa-ref no-indent">Amazon Web Services. (${year}). <em>AWS Well-Architected Framework</em>. Amazon Web Services, Inc. Recuperado de <a href="https://aws.amazon.com/architecture/well-architected/">https://aws.amazon.com/architecture/well-architected/</a></p>
  <p class="apa-ref no-indent">SoftwareOne. (${year}). <em>AWS Migration Assessment Platform</em>. SoftwareOne AG. Recuperado de <a href="https://www.softwareone.com">https://www.softwareone.com</a></p>
</div>

<!-- CARTA DE AGRADECIMIENTO -->
<div class="page-break">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30pt">
    ${data.swoLogoBase64 ? `<img src="${data.swoLogoBase64}" alt="SoftwareOne" style="max-width:140px" />` : '<span style="font-size:16pt;font-weight:bold;color:#E31837">SoftwareOne</span>'}
    ${data.clientLogoBase64 ? `<img src="${data.clientLogoBase64}" alt="${escHtml(data.clientName)}" style="max-width:120px" />` : ''}
  </div>
  <div class="section-title">Carta de Agradecimiento</div>
  <p class="no-indent" style="text-align:right;font-size:11pt;margin-bottom:18pt">${escHtml(data.thankYouDate || date)}</p>
  ${data.itTeam ? `<p class="no-indent"><strong>Para:</strong> ${escHtml(data.itTeam)}</p>` : ''}
  ${paragraphs(replacePlaceholders(data.thankYouLetter || '', data))}
  <p class="no-indent" style="margin-top:30pt">Atentamente,</p>
  <p class="no-indent" style="margin-top:20pt"><strong>${escHtml(data.consultorName || 'Consultor')}</strong></p>
  ${data.consultorSignature ? `<p class="no-indent">${escHtml(data.consultorSignature)}</p>` : ''}
  ${data.consultorEmail ? `<p class="no-indent">${escHtml(data.consultorEmail)}</p>` : ''}
  <p class="no-indent">SoftwareOne</p>
  <!-- Logo SoftwareOne esquina inferior derecha -->
  <div style="position:fixed;bottom:1.5cm;right:2cm;text-align:right">
    ${data.swoLogoBase64
      ? `<img src="${data.swoLogoBase64}" alt="SoftwareOne" style="max-width:90px;opacity:0.85" />`
      : '<span style="font-size:10pt;font-weight:bold;color:#E31837">SoftwareOne</span>'}
  </div>
</div>

</body></html>`;

  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `memoria-tecnica-${(data.clientName || 'cliente').replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildServiceSection(svc: AWSServiceEntry, num: number): string {
  const advList = svc.advantages.map(a => `<li>${escHtml(a)}</li>`).join('');
  const disList = svc.disadvantages.map(d => `<li>${escHtml(d)}</li>`).join('');
  const ucList  = (svc.useCases || []).map(u => `<li>${escHtml(u)}</li>`).join('');
  return `
  <div class="service-block">
    <div class="service-title">4.${num} ${escHtml(svc.title)}</div>
    <h3>Descripción</h3><p>${escHtml(svc.description)}</p>
    ${svc.whyUsed ? `<h3>Justificación de Uso en el Proyecto</h3><p>${escHtml(svc.whyUsed)}</p>` : ''}
    <h3>Ventajas</h3><ul>${advList}</ul>
    <h3>Desventajas</h3><ul>${disList}</ul>
    ${ucList ? `<h3>Casos de Uso</h3><ul>${ucList}</ul>` : ''}
    <p class="no-indent" style="font-size:10pt;color:#555">
      Fuente: Amazon Web Services. (${new Date().getFullYear()}). <em>${escHtml(svc.title)}</em>.
      Recuperado de <a href="${escHtml(svc.docsUrl)}">${escHtml(svc.docsUrl)}</a>
    </p>
  </div>`;
}

function buildGlossarySection(terms: DictionaryEntry[]): string {
  const byCategory = new Map<string, DictionaryEntry[]>();
  terms.forEach(t => {
    const cat = t.category || 'General';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(t);
  });
  let rows = '';
  byCategory.forEach((entries, cat) => {
    rows += `<tr style="background:#f3e8ff"><td colspan="2" style="padding:6px 10px;font-weight:700;font-size:10pt;color:#7b2ff7;border:1px solid #e9d5ff">${escHtml(cat)}</td></tr>`;
    entries.forEach((e, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#fdf4ff';
      rows += `<tr style="background:${bg}">
        <td style="padding:6px 10px;border:1px solid #e9d5ff;font-weight:600;font-size:10pt;width:25%;vertical-align:top">${escHtml(e.term)}</td>
        <td style="padding:6px 10px;border:1px solid #e9d5ff;font-size:10pt">${escHtml(e.definition)}</td>
      </tr>`;
    });
  });
  return `
  <div class="section-title">Glosario</div>
  <table style="width:100%;border-collapse:collapse;margin-top:8pt">
    <thead><tr style="background:linear-gradient(90deg,#e91e8c,#9c27b0,#1565c0)">
      <th style="padding:7px 10px;color:#fff;font-size:10pt;text-align:left;border:1px solid rgba(255,255,255,0.2);width:25%">Término</th>
      <th style="padding:7px 10px;color:#fff;font-size:10pt;text-align:left;border:1px solid rgba(255,255,255,0.2)">Definición</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function buildWellArchSection(pillars: WellArchPillar[]): string {
  return pillars.map(p => {
    const recs = p.recommendations.map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}">
        <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:10pt">${escHtml(r)}</td>
      </tr>`).join('');
    return `
    <div class="pillar-block">
      <div class="pillar-header" style="background:${p.color}">${p.icon} ${escHtml(p.name)}</div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:${p.color}22">
          <th style="padding:6px 10px;text-align:left;font-size:10pt;border:1px solid #e5e7eb;color:#374151">Recomendación</th>
        </tr></thead>
        <tbody>${recs}</tbody>
      </table>
    </div>`;
  }).join('');
}
