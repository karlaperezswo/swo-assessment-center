import { TechMemoryData, AWSServiceEntry } from './types';

// ── APA Word Export ───────────────────────────────────────────────────────────
export function exportTechMemoryWord(data: TechMemoryData): void {
  const date = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const year = new Date().getFullYear();

  const servicesSections = data.services.map((svc, idx) => buildServiceSection(svc, idx + 1)).join('');

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>Memoria Técnica — ${escHtml(data.projectName)}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument>
  <w:View>Print</w:View><w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
</w:WordDocument></xml><![endif]-->
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
  ul { margin: 0 0 12pt 2cm; }
  li { margin-bottom: 4pt; }
  .apa-ref { font-size: 10pt; margin-left: 1.27cm; text-indent: -1.27cm; margin-bottom: 6pt; }
  .page-break { page-break-before: always; }
  .thank-you { page-break-before: always; }
  .thank-you-header { display: flex; align-items: center; gap: 20pt; margin-bottom: 24pt; }
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
  table.info td { padding: 4pt 8pt; border: 1px solid #ccc; font-size: 11pt; }
  table.info td:first-child { font-weight: bold; width: 35%; background: #f5f5f5; }
</style>
</head>
<body>

<!-- ══ PORTADA ══════════════════════════════════════════════════════════════ -->
<div class="cover">
  ${data.swoLogoBase64 ? `<img src="${data.swoLogoBase64}" alt="SoftwareOne" />` : '<p style="font-size:18pt;font-weight:bold;color:#E31837">SoftwareOne</p>'}
  ${data.clientLogoBase64 ? `<img class="client-logo" src="${data.clientLogoBase64}" alt="${escHtml(data.clientName)}" />` : ''}
  <h1>MEMORIA TÉCNICA</h1>
  <h2>${escHtml(data.projectName)}</h2>
  <p class="no-indent meta"><strong>Cliente:</strong> ${escHtml(data.clientName)}</p>
  <p class="no-indent meta"><strong>Fecha:</strong> ${date}</p>
  <p class="no-indent meta"><strong>Versión:</strong> ${escHtml(data.version || '1.0')}</p>
  <p class="no-indent meta"><strong>Elaborado por:</strong> ${escHtml(data.authors)}</p>
  <p class="no-indent meta" style="margin-top:30pt;font-size:10pt;color:#555">
    SoftwareOne — AWS Migration Assessment Platform<br/>
    ${year}
  </p>
</div>

<!-- ══ TABLA DE CONTENIDO (placeholder) ════════════════════════════════════ -->
<div class="page-break">
  <div class="section-title">Tabla de Contenido</div>
  <p class="no-indent">1. Introducción ............................................................. 3</p>
  <p class="no-indent">2. Información de la Empresa ................................................ 4</p>
  <p class="no-indent">3. Servicios AWS Implementados .............................................. 5</p>
  <p class="no-indent">4. Retos del Proyecto ....................................................... ${4 + data.services.length}</p>
  <p class="no-indent">5. Conclusiones ............................................................. ${5 + data.services.length}</p>
  <p class="no-indent">6. Referencias .............................................................. ${6 + data.services.length}</p>
  <p class="no-indent">7. Carta de Agradecimiento .................................................. ${7 + data.services.length}</p>
</div>

<!-- ══ 1. INTRODUCCIÓN ══════════════════════════════════════════════════════ -->
<div class="page-break">
  <div class="section-title">1. Introducción</div>
  ${paragraphs(data.introduction)}
</div>

<!-- ══ 2. INFORMACIÓN DE LA EMPRESA ════════════════════════════════════════ -->
<div class="page-break">
  <div class="section-title">2. Información de la Empresa</div>
  <table class="info">
    <tr><td>Empresa</td><td>${escHtml(data.clientName)}</td></tr>
    <tr><td>Sitio Web</td><td>${escHtml(data.clientUrl)}</td></tr>
  </table>
  ${data.clientMission ? `<h3>Misión</h3>${paragraphs(data.clientMission)}` : ''}
  ${data.clientVision  ? `<h3>Visión</h3>${paragraphs(data.clientVision)}`  : ''}
  ${data.clientAbout   ? `<h3>Acerca de la Empresa</h3>${paragraphs(data.clientAbout)}` : ''}
</div>

<!-- ══ 3. SERVICIOS AWS ══════════════════════════════════════════════════════ -->
<div class="page-break">
  <div class="section-title">3. Servicios AWS Implementados</div>
  ${servicesSections || '<p>No se han agregado servicios AWS.</p>'}
</div>

<!-- ══ 4. RETOS ══════════════════════════════════════════════════════════════ -->
<div class="page-break">
  <div class="section-title">4. Retos del Proyecto</div>
  ${paragraphs(data.challenges)}
</div>

<!-- ══ 5. CONCLUSIONES ══════════════════════════════════════════════════════ -->
<div class="page-break">
  <div class="section-title">5. Conclusiones</div>
  ${paragraphs(data.conclusions)}
</div>

<!-- ══ 6. REFERENCIAS (APA) ═════════════════════════════════════════════════ -->
<div class="page-break">
  <div class="section-title">6. Referencias</div>
  ${data.services.map(svc => `
  <p class="apa-ref no-indent">
    Amazon Web Services. (${year}). <em>${escHtml(svc.title)}</em>.
    Amazon Web Services, Inc. Recuperado de <a href="${escHtml(svc.docsUrl)}">${escHtml(svc.docsUrl)}</a>
  </p>`).join('')}
  <p class="apa-ref no-indent">
    Amazon Web Services. (${year}). <em>AWS Documentation</em>.
    Amazon Web Services, Inc. Recuperado de <a href="https://docs.aws.amazon.com">https://docs.aws.amazon.com</a>
  </p>
  <p class="apa-ref no-indent">
    SoftwareOne. (${year}). <em>AWS Migration Assessment Platform</em>.
    SoftwareOne AG. Recuperado de <a href="https://www.softwareone.com">https://www.softwareone.com</a>
  </p>
</div>

<!-- ══ 7. CARTA DE AGRADECIMIENTO ═══════════════════════════════════════════ -->
<div class="thank-you">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30pt">
    ${data.swoLogoBase64 ? `<img src="${data.swoLogoBase64}" alt="SoftwareOne" style="max-width:140px" />` : '<span style="font-size:16pt;font-weight:bold;color:#E31837">SoftwareOne</span>'}
    ${data.clientLogoBase64 ? `<img src="${data.clientLogoBase64}" alt="${escHtml(data.clientName)}" style="max-width:120px" />` : ''}
  </div>
  <div class="section-title">Carta de Agradecimiento</div>
  ${paragraphs(data.thankYouLetter)}
  <p class="no-indent" style="margin-top:30pt">Atentamente,</p>
  <p class="no-indent" style="margin-top:20pt"><strong>Equipo de TI</strong></p>
  <p class="no-indent">${escHtml(data.itTeam)}</p>
  <p class="no-indent">SoftwareOne</p>
  <p class="no-indent">${date}</p>
</div>

</body>
</html>`;

  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `memoria-tecnica-${data.clientName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(s: string): string {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function paragraphs(text: string): string {
  if (!text) return '<p>—</p>';
  return text.split('\n').filter(l => l.trim()).map(l => `<p>${escHtml(l.trim())}</p>`).join('');
}

function buildServiceSection(svc: AWSServiceEntry, num: number): string {
  const advList = svc.advantages.map(a => `<li>${escHtml(a)}</li>`).join('');
  const disList = svc.disadvantages.map(d => `<li>${escHtml(d)}</li>`).join('');
  const ucList  = svc.useCases.map(u => `<li>${escHtml(u)}</li>`).join('');

  return `
  <div class="service-block">
    <div class="service-title">3.${num} ${escHtml(svc.title)}</div>
    <h3>Descripción</h3>
    <p>${escHtml(svc.description)}</p>
    ${svc.whyUsed ? `<h3>Justificación de Uso en el Proyecto</h3><p>${escHtml(svc.whyUsed)}</p>` : ''}
    <h3>Ventajas</h3>
    <ul>${advList}</ul>
    <h3>Desventajas</h3>
    <ul>${disList}</ul>
    ${ucList ? `<h3>Casos de Uso</h3><ul>${ucList}</ul>` : ''}
    <p class="no-indent" style="font-size:10pt;color:#555">
      Fuente: Amazon Web Services. (${new Date().getFullYear()}). <em>${escHtml(svc.title)}</em>.
      Recuperado de <a href="${escHtml(svc.docsUrl)}">${escHtml(svc.docsUrl)}</a>
    </p>
  </div>`;
}
