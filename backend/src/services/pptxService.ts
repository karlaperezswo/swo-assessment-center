import PptxGenJS from 'pptxgenjs';
import {
  BusinessCaseData,
  TCO1YearData,
  CarbonReportData,
  SQLLicensingData,
} from '../../../shared/types/businessCase.types';

// ─── Colors ──────────────────────────────────────────────────────────────────
const C = {
  primary:   '3E00FF',
  blue:      '2563EB',
  green:     '16A34A',
  red:       'DC2626',
  orange:    'EA580C',
  yellow:    'CA8A04',
  cyan:      '0891B2',
  purple:    '7C3AED',
  white:     'FFFFFF',
  black:     '000000',
  gray50:    'F9FAFB',
  gray100:   'F3F4F6',
  gray200:   'E5E7EB',
  gray300:   'D1D5DB',
  gray600:   '4B5563',
  gray700:   '374151',
  gray900:   '111827',
  blue50:    'EFF6FF',
  blue100:   'DBEAFE',
  blue600:   '2563EB',
  blue900:   '1E3A8A',
  green50:   'F0FDF4',
  green100:  'DCFCE7',
  green600:  '16A34A',
  orange50:  'FFF7ED',
  orange100: 'FFEDD5',
  orange600: 'EA580C',
  red50:     'FEF2F2',
  red100:    'FEE2E2',
  red600:    'DC2626',
  purple50:  'FAF5FF',
  purple100: 'F3E8FF',
  purple600: '7C3AED',
};

const W = 13.33;
const H = 7.5;

export interface PPTXExportInput {
  clientName: string;
  reportDate: string;
  assessmentTool: string;
  vertical: string;
  awsRegion: string;
  onPremisesCost: number;
  businessCaseData?: BusinessCaseData;
  tco1YearData?: TCO1YearData;
  carbonData?: CarbonReportData;
  onDemandAsIs?: number;
  oneYearOptimized?: number;
  threeYearOptimized?: number;
  // RDS scenario
  onDemandAsIsRDS?: number;
  oneYearOptimizedRDS?: number;
  threeYearOptimizedRDS?: number;
  enableRDSScenario?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function n(v: number, dec = 0) {
  return v.toLocaleString('es-CL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function usd(v: number) { return `$${n(v, 2)}`; }
function pct(v: number) { return `${v.toFixed(2).replace('.', ',')}%`; }

function hdr(slide: PptxGenJS.Slide, title: string, subtitle?: string) {
  // Top bar
  slide.addShape('rect', { x: 0, y: 0, w: W, h: 0.6, fill: { color: C.primary }, line: { color: C.primary } });
  slide.addText(title, { x: 0.3, y: 0.08, w: W - 0.6, h: 0.44, fontSize: 18, bold: true, color: C.white, fontFace: 'Arial' });
  if (subtitle) {
    slide.addText(subtitle, { x: 0.3, y: 0.52, w: W - 0.6, h: 0.22, fontSize: 9, color: 'CCCCFF', fontFace: 'Arial' });
  }
}

function ftr(slide: PptxGenJS.Slide, client: string, num: number) {
  slide.addShape('rect', { x: 0, y: H - 0.25, w: W, h: 0.25, fill: { color: C.gray100 }, line: { color: C.gray200 } });
  slide.addText(`SoftwareOne  |  ${client}`, { x: 0.2, y: H - 0.23, w: 8, h: 0.2, fontSize: 7, color: C.gray600, fontFace: 'Arial' });
  slide.addText(String(num), { x: W - 0.5, y: H - 0.23, w: 0.35, h: 0.2, fontSize: 7, color: C.gray600, fontFace: 'Arial', align: 'right' });
}

function card(slide: PptxGenJS.Slide, x: number, y: number, w: number, h: number, label: string, value: string, barColor: string, labelColor = C.gray600, valueColor = C.gray900) {
  slide.addShape('rect', { x, y, w, h, fill: { color: C.white }, line: { color: C.gray200, pt: 1 } });
  slide.addShape('rect', { x, y, w, h: 0.05, fill: { color: barColor }, line: { color: barColor } });
  slide.addText(label, { x: x + 0.1, y: y + 0.1, w: w - 0.2, h: 0.28, fontSize: 9, color: labelColor, fontFace: 'Arial', align: 'center' });
  slide.addText(value, { x: x + 0.05, y: y + 0.38, w: w - 0.1, h: h - 0.5, fontSize: 20, bold: true, color: valueColor, fontFace: 'Arial', align: 'center' });
}

function tblHdr(cols: string[], widths: number[]): PptxGenJS.TableRow {
  return cols.map((text, i) => ({
    text,
    options: {
      bold: true, color: C.white, fill: { color: C.primary },
      fontSize: 9, fontFace: 'Arial',
      align: i === 0 ? 'left' as const : 'center' as const,
    },
  }));
}

// ─── Slide 1: Cover ───────────────────────────────────────────────────────────
function addCover(pptx: PptxGenJS, input: PPTXExportInput) {
  const slide = pptx.addSlide();
  slide.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.primary }, line: { color: C.primary } });
  slide.addShape('rect', { x: 0, y: 0, w: 0.15, h: H, fill: { color: '00ECD4' }, line: { color: '00ECD4' } });
  slide.addShape('rect', { x: 0, y: H - 0.15, w: W, h: 0.15, fill: { color: 'E3EE14' }, line: { color: 'E3EE14' } });
  slide.addText('Caso de Negocio\nMigración AWS', {
    x: 1.0, y: 1.8, w: W - 2.0, h: 1.8,
    fontSize: 40, bold: true, color: C.white, fontFace: 'Arial', align: 'center',
  });
  slide.addText('(MAP Assess)', {
    x: 1.0, y: 3.65, w: W - 2.0, h: 0.5,
    fontSize: 22, color: '00ECD4', fontFace: 'Arial', align: 'center',
  });
  slide.addShape('rect', { x: W / 2 - 1.5, y: 4.3, w: 3.0, h: 0.05, fill: { color: 'E3EE14' }, line: { color: 'E3EE14' } });
  slide.addText(input.clientName || 'Cliente', {
    x: 1.0, y: 4.45, w: W - 2.0, h: 0.55,
    fontSize: 22, bold: true, color: 'E3EE14', fontFace: 'Arial', align: 'center',
  });
  slide.addText(`${input.reportDate}  |  ${input.assessmentTool}  |  ${input.awsRegion}`, {
    x: 1.0, y: 5.1, w: W - 2.0, h: 0.35,
    fontSize: 12, color: '81A5FF', fontFace: 'Arial', align: 'center',
  });
}

// ─── Slide 2: Executive Summary ───────────────────────────────────────────────
function addSummary(pptx: PptxGenJS, input: PPTXExportInput, num: number) {
  const slide = pptx.addSlide();
  hdr(slide, 'Resumen Ejecutivo', `${input.clientName}  |  ${input.assessmentTool}  |  ${input.awsRegion}`);
  ftr(slide, input.clientName, num);

  const bc = input.businessCaseData;
  const Y = 0.75;
  const cw = 2.9;

  // Server count cards
  const serverCards = [
    { label: 'Total Servidores', value: n(bc?.summary.totalServers ?? 0), color: C.blue },
    { label: 'Producción',       value: n(bc?.summary.prodServers ?? 0),  color: C.green },
    { label: 'Desarrollo',       value: n(bc?.summary.devServers ?? 0),   color: C.yellow },
    { label: 'QA',               value: n(bc?.summary.qaServers ?? 0),    color: C.purple },
  ];
  serverCards.forEach((c2, i) => card(slide, 0.3 + i * (cw + 0.15), Y, cw, 1.1, c2.label, c2.value, c2.color, C.gray600, c2.color));

  // TCO comparison
  const hasTC = input.onPremisesCost > 0 || (input.onDemandAsIs ?? 0) > 0;
  if (hasTC) {
    slide.addText('Comparativa de Costos Anuales (USD)', {
      x: 0.3, y: Y + 1.25, w: W - 0.6, h: 0.3,
      fontSize: 12, bold: true, color: C.blue, fontFace: 'Arial',
    });
    const tcoCards = [
      { label: 'On-Premises (AS-IS)',  value: usd(input.onPremisesCost ?? 0),    color: C.red },
      { label: 'AWS On-Demand',        value: usd(input.onDemandAsIs ?? 0),       color: C.orange },
      { label: '1 Año Optimizado',     value: usd(input.oneYearOptimized ?? 0),   color: C.blue },
      { label: '3 Años Optimizado',    value: usd(input.threeYearOptimized ?? 0), color: C.green },
    ];
    tcoCards.forEach((c2, i) => card(slide, 0.3 + i * (cw + 0.15), Y + 1.6, cw, 1.0, c2.label, c2.value, c2.color, C.gray600, c2.color));

    const savings = (input.onPremisesCost ?? 0) - (input.threeYearOptimized ?? 0);
    const savPct = input.onPremisesCost > 0 ? (savings / input.onPremisesCost) * 100 : 0;
    if (savings > 0) {
      slide.addShape('rect', { x: 0.3, y: Y + 2.75, w: W - 0.6, h: 0.5, fill: { color: C.green }, line: { color: C.green } });
      slide.addText(`Ahorro estimado (3 años): ${usd(savings)}  —  ${pct(savPct)} menos que On-Premises`, {
        x: 0.3, y: Y + 2.78, w: W - 0.6, h: 0.44,
        fontSize: 13, bold: true, color: C.white, fontFace: 'Arial', align: 'center',
      });
    }
  }

  // OS info
  if (bc?.osDistribution?.length) {
    slide.addText(`Sistemas Operativos detectados: ${bc.osDistribution.length}`, {
      x: 0.3, y: H - 0.55, w: W - 0.6, h: 0.25,
      fontSize: 9, color: C.gray600, fontFace: 'Arial',
    });
  }
}

// ─── Slide 3: OS Distribution ─────────────────────────────────────────────────
function addOSDistribution(pptx: PptxGenJS, input: PPTXExportInput, num: number) {
  const osData = input.businessCaseData?.osDistribution ?? [];
  if (!osData.length) return;
  const slide = pptx.addSlide();
  hdr(slide, 'Distribución de Sistemas Operativos');
  ftr(slide, input.clientName, num);

  const totP = osData.reduce((s, o) => s + o.prod, 0);
  const totD = osData.reduce((s, o) => s + o.dev, 0);
  const totQ = osData.reduce((s, o) => s + o.qa, 0);
  const totT = osData.reduce((s, o) => s + o.total, 0);

  const rows: PptxGenJS.TableRow[] = [
    tblHdr(['SO', 'Prod', 'Dev', 'QA', 'Total'], []),
    ...osData.map((os, i) => {
      const isSQL = os.osVersion.includes(' with SQL ');
      const bg = isSQL ? 'FFF7ED' : (i % 2 === 0 ? C.white : C.gray50);
      const textColor = isSQL ? C.orange : C.gray900;
      return [
        { text: os.osVersion, options: { fontSize: 9, color: textColor, fill: { color: bg }, fontFace: 'Arial', italic: isSQL } },
        { text: String(os.prod),  options: { fontSize: 9, align: 'center' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
        { text: String(os.dev),   options: { fontSize: 9, align: 'center' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
        { text: String(os.qa),    options: { fontSize: 9, align: 'center' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
        { text: String(os.total), options: { fontSize: 9, align: 'center' as const, bold: true, color: C.gray900, fill: { color: bg }, fontFace: 'Arial' } },
      ] as PptxGenJS.TableRow;
    }),
    // Total row
    [
      { text: 'Total', options: { bold: true, fontSize: 9, fill: { color: C.blue100 }, color: C.blue900, fontFace: 'Arial' } },
      { text: String(totP), options: { bold: true, fontSize: 9, align: 'center' as const, fill: { color: C.blue100 }, color: C.blue900, fontFace: 'Arial' } },
      { text: String(totD), options: { bold: true, fontSize: 9, align: 'center' as const, fill: { color: C.blue100 }, color: C.blue900, fontFace: 'Arial' } },
      { text: String(totQ), options: { bold: true, fontSize: 9, align: 'center' as const, fill: { color: C.blue100 }, color: C.blue900, fontFace: 'Arial' } },
      { text: String(totT), options: { bold: true, fontSize: 9, align: 'center' as const, fill: { color: C.blue100 }, color: C.blue900, fontFace: 'Arial' } },
    ] as PptxGenJS.TableRow,
  ];

  slide.addTable(rows, {
    x: 0.3, y: 0.7, w: W - 0.6,
    colW: [W - 0.6 - 4 * 1.2, 1.2, 1.2, 1.2, 1.2],
    border: { type: 'solid', color: C.gray200, pt: 0.5 },
    autoPage: true, autoPageRepeatHeader: true,
  });
}

// ─── Slide 4: Resource Optimization ──────────────────────────────────────────
function addResourceOptimization(pptx: PptxGenJS, input: PPTXExportInput, num: number) {
  const res = input.tco1YearData?.resourceOptimization ?? [];
  if (!res.length) return;
  const slide = pptx.addSlide();

  // Average optimization
  const valid = res.filter(r => r.optimizationPercent !== 'NA').map(r => parseFloat(r.optimizationPercent.replace(',', '.')));
  const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;

  hdr(slide, 'Optimización de Recursos', `Promedio de Optimización: ${avg.toFixed(2).replace('.', ',')}%`);
  ftr(slide, input.clientName, num);

  const rows: PptxGenJS.TableRow[] = [
    tblHdr(['Recurso', 'Observado', 'Rec. Prod', 'Rec. Dev', 'Rec. QA', 'Rec. Total', '% Optimización'], []),
    ...res.map((r, i) => {
      const bg = i % 2 === 0 ? C.white : C.gray50;
      const isNeg = r.optimizationPercent !== 'NA' && parseFloat(r.optimizationPercent) < 0;
      const optColor = r.optimizationPercent === 'NA' ? C.gray600 : isNeg ? C.red : C.green;
      return [
        { text: r.resource,                    options: { fontSize: 10, bold: true, color: C.gray900, fill: { color: bg }, fontFace: 'Arial' } },
        { text: n(r.observed),                 options: { fontSize: 10, align: 'right' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
        { text: n(r.recommendedProd),          options: { fontSize: 10, align: 'right' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
        { text: n(r.recommendedDev),           options: { fontSize: 10, align: 'right' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
        { text: n(r.recommendedQA),            options: { fontSize: 10, align: 'right' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
        { text: n(r.recommendedTotal),         options: { fontSize: 10, align: 'right' as const, bold: true, color: C.gray900, fill: { color: bg }, fontFace: 'Arial' } },
        { text: r.optimizationPercent,         options: { fontSize: 10, align: 'right' as const, bold: true, color: optColor, fill: { color: bg }, fontFace: 'Arial' } },
      ] as PptxGenJS.TableRow;
    }),
  ];

  slide.addTable(rows, {
    x: 0.3, y: 0.75, w: W - 0.6,
    colW: [2.2, 1.5, 1.3, 1.3, 1.3, 1.5, 1.8],
    border: { type: 'solid', color: C.gray200, pt: 0.5 },
    rowH: 0.45,
  });

  // Observations box
  slide.addShape('rect', { x: 0.3, y: H - 1.3, w: W - 0.6, h: 1.0, fill: { color: C.blue50 }, line: { color: C.blue100, pt: 1 } });
  slide.addText('Observaciones:', { x: 0.5, y: H - 1.28, w: W - 1.0, h: 0.22, fontSize: 9, bold: true, color: C.blue900, fontFace: 'Arial' });
  slide.addText(
    '• Los recursos de RAM, Storage y Network se muestran en GB.\n• Las recomendaciones están en base a 1 año optimizado.\n• La información de red considera el total de datos transferidos durante el Assessment.',
    { x: 0.5, y: H - 1.06, w: W - 1.0, h: 0.72, fontSize: 8, color: C.blue900, fontFace: 'Arial' }
  );
}

// ─── Slide 5: TCO (EC2) ───────────────────────────────────────────────────────
function addTCO(pptx: PptxGenJS, input: PPTXExportInput, num: number, isRDS = false) {
  const onPrem = input.onPremisesCost ?? 0;
  const onDem  = isRDS ? (input.onDemandAsIsRDS ?? 0)       : (input.onDemandAsIs ?? 0);
  const one    = isRDS ? (input.oneYearOptimizedRDS ?? 0)    : (input.oneYearOptimized ?? 0);
  const three  = isRDS ? (input.threeYearOptimizedRDS ?? 0)  : (input.threeYearOptimized ?? 0);
  if (!onPrem && !onDem) return;

  const title = isRDS ? 'TCO — Costo Anual RDS en USD (ARR)' : 'TCO — Costo Anual EC2 en USD (ARR)';
  const slide = pptx.addSlide();
  hdr(slide, title);
  ftr(slide, input.clientName, num);

  // Rank AWS options by cost for color assignment
  const awsOpts = [
    { key: 'onDem', val: onDem },
    { key: 'one',   val: one },
    { key: 'three', val: three },
  ].sort((a, b) => a.val - b.val);
  const colorMap: Record<string, string> = {
    [awsOpts[0].key]: C.green,
    [awsOpts[1].key]: C.cyan,
    [awsOpts[2].key]: C.yellow,
  };
  const bestKey = awsOpts[0].key;

  const bars = [
    { label: 'On-Premises',                value: onPrem, color: C.blue,              key: 'onPrem',  isBase: true },
    { label: 'Ondemand (As-Is Optimizado)', value: onDem,  color: colorMap['onDem'],   key: 'onDem',   isBase: false },
    { label: '1 Año Optimizado',            value: one,    color: colorMap['one'],     key: 'one',     isBase: false },
    { label: '3 Años Optimizado',           value: three,  color: colorMap['three'],   key: 'three',   isBase: false },
  ];

  const maxVal = Math.max(...bars.map(b => b.value), 1);
  const barAreaW = W - 0.6;
  const barH = 0.55;
  const barGap = 0.18;
  const labelW = 3.2;
  const valueW = 1.8;
  const barMaxW = barAreaW - labelW - valueW - 0.2;
  let yPos = 0.75;

  // On-Premises label
  slide.addText(`On-Premises: ${usd(onPrem)}`, {
    x: 0.3, y: yPos - 0.02, w: barAreaW, h: 0.22,
    fontSize: 9, color: C.gray600, fontFace: 'Arial',
  });
  yPos += 0.2;

  bars.forEach(bar => {
    const barW2 = maxVal > 0 ? (bar.value / maxVal) * barMaxW : 0;
    const savPct = !bar.isBase && onPrem > 0 ? ((onPrem - bar.value) / onPrem) * 100 : 0;
    const isBest = !bar.isBase && bar.key === bestKey;

    // Label
    slide.addText(bar.label + (isBest ? '  ★ BEST' : '') + ':', {
      x: 0.3, y: yPos, w: labelW, h: barH,
      fontSize: 9, bold: isBest, color: isBest ? C.orange : C.gray700, fontFace: 'Arial', valign: 'middle',
    });
    // Value
    slide.addText(usd(bar.value), {
      x: 0.3 + labelW + barMaxW + 0.1, y: yPos, w: valueW, h: barH,
      fontSize: 9, bold: true, color: C.gray900, fontFace: 'Arial', valign: 'middle', align: 'right',
    });
    // Bar background
    slide.addShape('rect', { x: 0.3 + labelW, y: yPos + 0.05, w: barMaxW, h: barH - 0.1, fill: { color: C.gray100 }, line: { color: C.gray200 } });
    // Bar fill
    if (barW2 > 0) {
      slide.addShape('rect', { x: 0.3 + labelW, y: yPos + 0.05, w: barW2, h: barH - 0.1, fill: { color: bar.color }, line: { color: bar.color } });
      // Compact value inside bar
      const compact = bar.value >= 1000000 ? `${(bar.value / 1000000).toFixed(1)}M` : bar.value >= 1000 ? `${Math.round(bar.value / 1000)}K` : usd(bar.value);
      if (barW2 > 0.8) {
        slide.addText(compact, {
          x: 0.3 + labelW, y: yPos + 0.05, w: barW2, h: barH - 0.1,
          fontSize: 9, bold: true, color: C.white, fontFace: 'Arial', align: 'center', valign: 'middle',
        });
      }
      // Savings badge
      if (!bar.isBase && savPct > 0) {
        slide.addShape('rect', { x: 0.3 + labelW + barW2 + 0.05, y: yPos + 0.12, w: 0.75, h: 0.3, fill: { color: bar.color }, line: { color: bar.color } });
        slide.addText(`↓ ${pct(savPct)}`, {
          x: 0.3 + labelW + barW2 + 0.05, y: yPos + 0.12, w: 0.75, h: 0.3,
          fontSize: 7, bold: true, color: C.white, fontFace: 'Arial', align: 'center', valign: 'middle',
        });
      }
    }
    yPos += barH + barGap;
  });

  // Legend
  yPos += 0.1;
  const legend = [
    { color: C.blue,   label: 'COSTO ANUAL' },
    { color: C.green,  label: 'MEJOR AHORRO' },
    { color: C.cyan,   label: '2° AHORRO' },
    { color: C.yellow, label: '3° AHORRO' },
  ];
  legend.forEach((l, i) => {
    const lx = 0.3 + i * 3.0;
    slide.addShape('rect', { x: lx, y: yPos, w: 0.25, h: 0.25, fill: { color: l.color }, line: { color: l.color } });
    slide.addText(l.label, { x: lx + 0.3, y: yPos, w: 2.5, h: 0.25, fontSize: 8, color: C.gray700, fontFace: 'Arial', valign: 'middle' });
  });

  // Notes
  slide.addShape('rect', { x: 0.3, y: H - 0.85, w: W - 0.6, h: 0.55, fill: { color: C.gray50 }, line: { color: C.gray200 } });
  slide.addText('• Todos los precios están en USD  •  NUSP = No Upfront Saving Plan  •  Todos los consumos proyectados son anuales', {
    x: 0.4, y: H - 0.83, w: W - 0.8, h: 0.5,
    fontSize: 8, color: C.gray600, fontFace: 'Arial',
  });
}

// ─── Slide 6: Migration Strategy ─────────────────────────────────────────────
function addMigrationStrategy(pptx: PptxGenJS, input: PPTXExportInput, num: number) {
  const bc = input.businessCaseData;
  const tco = input.tco1YearData;
  const strategies = tco?.migrationStrategies ?? [];
  const summary = tco?.migrationSummary;
  if (!strategies.length) return;

  const slide = pptx.addSlide();
  hdr(slide, 'Estrategia de Migración por Sistema Operativo');
  ftr(slide, input.clientName, num);

  // Summary cards: Migrate / Purchase / Total
  const cardW = 3.8;
  const cardY = 0.72;
  card(slide, 0.3,           cardY, cardW, 0.9, 'Migrate',          String(summary?.byCategory?.migrate ?? 0),  C.green,  C.green,  C.green);
  card(slide, 0.3 + cardW + 0.2, cardY, cardW, 0.9, 'Purchase',     String(summary?.byCategory?.purchase ?? 0), C.orange, C.orange, C.orange);
  card(slide, 0.3 + (cardW + 0.2) * 2, cardY, cardW, 0.9, 'Total Servidores', String(summary?.totalServers ?? 0), C.blue, C.blue, C.blue);

  // Semaphore legend
  const legY = cardY + 1.0;
  const dots = [
    { color: C.red,    label: 'Replatform / Refactor — requiere atención' },
    { color: C.yellow, label: 'Retire / Retain / Repurchase' },
    { color: C.green,  label: 'Rehost / Relocate' },
  ];
  dots.forEach((d, i) => {
    slide.addShape('ellipse', { x: 0.3 + i * 4.2, y: legY + 0.04, w: 0.18, h: 0.18, fill: { color: d.color }, line: { color: d.color } });
    slide.addText(d.label, { x: 0.55 + i * 4.2, y: legY, w: 3.8, h: 0.26, fontSize: 8, color: C.gray600, fontFace: 'Arial', valign: 'middle' });
  });

  // Group + sort rows (mirror UI logic)
  function stratPriority(s: string) {
    if (s === 'Replatform' || s === 'Refactor') return 2;
    if (s === 'Rehost' || s === 'Relocate') return 0;
    return 1;
  }
  const grouped = new Map<string, typeof strategies[0]>();
  for (const item of strategies) {
    const key = item.osVersion;
    const ex = grouped.get(key);
    if (!ex) { grouped.set(key, { ...item }); }
    else {
      const merged = { ...ex, count: ex.count + item.count };
      if (stratPriority(item.strategy) > stratPriority(ex.strategy)) {
        merged.strategy = item.strategy; merged.category = item.category;
        merged.supported = item.supported; merged.notes = item.notes;
      }
      grouped.set(key, merged);
    }
  }
  const rows2 = Array.from(grouped.values()).sort((a, b) => {
    const pd = stratPriority(b.strategy) - stratPriority(a.strategy);
    return pd !== 0 ? pd : b.count - a.count;
  });

  function rowBg(s: string) {
    const p = stratPriority(s);
    if (p === 2) return C.red50;
    if (p === 1) return 'FEFCE8';
    return C.white;
  }
  function stratColor(s: string) {
    const p = stratPriority(s);
    if (p === 2) return C.red;
    if (p === 1) return C.yellow;
    return C.green;
  }
  function catColor(c: string) {
    if (c === 'Migrate') return C.green;
    if (c === 'Purchase') return C.orange;
    if (c === 'Modernize') return C.blue;
    return C.gray600;
  }

  const tblRows: PptxGenJS.TableRow[] = [
    tblHdr(['Sistema Operativo', 'Cantidad', 'Soportado', 'Categoría', 'Estrategia', 'Notas'], []),
    ...rows2.map(item => {
      const bg = rowBg(item.strategy);
      return [
        { text: item.osVersion,                    options: { fontSize: 8, bold: true, color: C.gray900, fill: { color: bg }, fontFace: 'Arial' } },
        { text: String(item.count),                options: { fontSize: 8, align: 'center' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
        { text: item.supported ? '✓' : '✗',       options: { fontSize: 9, align: 'center' as const, bold: true, color: item.supported ? C.green : C.red, fill: { color: bg }, fontFace: 'Arial' } },
        { text: item.category,                     options: { fontSize: 8, align: 'center' as const, bold: true, color: catColor(item.category), fill: { color: bg }, fontFace: 'Arial' } },
        { text: item.strategy,                     options: { fontSize: 8, align: 'center' as const, bold: true, color: stratColor(item.strategy), fill: { color: bg }, fontFace: 'Arial' } },
        { text: item.notes || '-',                 options: { fontSize: 7, color: C.gray600, fill: { color: bg }, fontFace: 'Arial' } },
      ] as PptxGenJS.TableRow;
    }),
  ];

  slide.addTable(tblRows, {
    x: 0.3, y: legY + 0.32, w: W - 0.6,
    colW: [3.2, 0.9, 0.9, 1.1, 1.2, 5.6 - 3.2 - 0.9 - 0.9 - 1.1 - 1.2],
    border: { type: 'solid', color: C.gray200, pt: 0.5 },
    autoPage: true, autoPageRepeatHeader: true,
  });
}

// ─── Slide 7: SQL Licensing ───────────────────────────────────────────────────
function addSQLLicensing(pptx: PptxGenJS, input: PPTXExportInput, num: number) {
  const tco = input.tco1YearData;
  const sql = tco?.sqlLicensing ?? [];
  const sum = tco?.sqlLicensingSummary;
  if (!sql.length) return;

  const slide = pptx.addSlide();
  hdr(slide, 'Optimización de Licenciamiento SQL Server');
  ftr(slide, input.clientName, num);

  // Summary cards
  const cardW = 2.9;
  const cardY = 0.72;
  card(slide, 0.3,                   cardY, cardW, 0.9, 'Total SQL Servers',  String(sum?.totalSQLServers ?? 0),                    C.blue,   C.blue,   C.blue);
  card(slide, 0.3 + cardW + 0.15,    cardY, cardW, 0.9, 'Costo Observado',    `$${usd(sum?.totalObservedCost ?? 0)}`,               C.blue,   C.blue,   C.blue);
  card(slide, 0.3 + (cardW + 0.15)*2, cardY, cardW, 0.9, 'Costo Optimizado',  `$${usd(sum?.totalRecommendedCost ?? 0)}`,            C.green,  C.green,  C.green);
  card(slide, 0.3 + (cardW + 0.15)*3, cardY, cardW, 0.9, 'Ahorro Total',      `$${usd(sum?.totalSavings ?? 0)}`,                    C.purple, C.purple, C.purple);

  const tblRows: PptxGenJS.TableRow[] = [
    tblHdr(['Edición SQL', 'vCPUs Obs.', 'vCPUs Rec.', '% Optim.', 'Precio Lista', 'Costo Obs.', 'Costo Rec.', 'Ahorro', '% Ahorro'], []),
    ...sql.map((item: SQLLicensingData, i: number) => {
      const bg = item.isOutOfSupport ? C.red50 : (i % 2 === 0 ? C.white : C.gray50);
      const savColor = item.savings > 0 ? C.green : C.gray600;
      return [
        { text: item.edition + (item.isOutOfSupport ? ' ⚠' : ''), options: { fontSize: 8, bold: true, color: item.isOutOfSupport ? C.red : C.gray900, fill: { color: bg }, fontFace: 'Arial' } },
        { text: n(item.observedVCPUs),     options: { fontSize: 8, align: 'right' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
        { text: n(item.recommendedVCPUs),  options: { fontSize: 8, align: 'right' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
        { text: pct(item.optimizationPercent), options: { fontSize: 8, align: 'right' as const, bold: true, color: C.green, fill: { color: bg }, fontFace: 'Arial' } },
        { text: `$${usd(item.listPrice)}`, options: { fontSize: 8, align: 'right' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
        { text: `$${usd(item.observedCost)}`,    options: { fontSize: 8, align: 'right' as const, bold: true, color: C.gray900, fill: { color: bg }, fontFace: 'Arial' } },
        { text: `$${usd(item.recommendedCost)}`, options: { fontSize: 8, align: 'right' as const, bold: true, color: C.gray900, fill: { color: bg }, fontFace: 'Arial' } },
        { text: `$${usd(item.savings)}`,         options: { fontSize: 8, align: 'right' as const, bold: true, color: savColor, fill: { color: bg }, fontFace: 'Arial' } },
        { text: pct(item.savingsPercent),        options: { fontSize: 8, align: 'right' as const, bold: true, color: savColor, fill: { color: bg }, fontFace: 'Arial' } },
      ] as PptxGenJS.TableRow;
    }),
    // Totals row
    [
      { text: 'TOTAL', options: { bold: true, fontSize: 8, fill: { color: C.blue100 }, color: C.blue900, fontFace: 'Arial' } },
      { text: n(sum?.totalObservedVCPUs ?? 0),    options: { bold: true, fontSize: 8, align: 'right' as const, fill: { color: C.blue100 }, color: C.blue900, fontFace: 'Arial' } },
      { text: n(sum?.totalRecommendedVCPUs ?? 0), options: { bold: true, fontSize: 8, align: 'right' as const, fill: { color: C.blue100 }, color: C.blue900, fontFace: 'Arial' } },
      { text: pct(sum?.totalOptimizationPercent ?? 0), options: { bold: true, fontSize: 8, align: 'right' as const, fill: { color: C.blue100 }, color: C.green, fontFace: 'Arial' } },
      { text: '', options: { fill: { color: C.blue100 }, fontFace: 'Arial' } },
      { text: `$${usd(sum?.totalObservedCost ?? 0)}`,    options: { bold: true, fontSize: 8, align: 'right' as const, fill: { color: C.blue100 }, color: C.blue900, fontFace: 'Arial' } },
      { text: `$${usd(sum?.totalRecommendedCost ?? 0)}`, options: { bold: true, fontSize: 8, align: 'right' as const, fill: { color: C.blue100 }, color: C.blue900, fontFace: 'Arial' } },
      { text: `$${usd(sum?.totalSavings ?? 0)}`,         options: { bold: true, fontSize: 8, align: 'right' as const, fill: { color: C.blue100 }, color: C.green, fontFace: 'Arial' } },
      { text: pct(sum?.totalSavingsPercent ?? 0),        options: { bold: true, fontSize: 8, align: 'right' as const, fill: { color: C.blue100 }, color: C.green, fontFace: 'Arial' } },
    ] as PptxGenJS.TableRow,
  ];

  slide.addTable(tblRows, {
    x: 0.3, y: cardY + 1.0, w: W - 0.6,
    colW: [2.0, 0.9, 0.9, 0.85, 1.1, 1.1, 1.1, 1.1, 0.85],
    border: { type: 'solid', color: C.gray200, pt: 0.5 },
    autoPage: true, autoPageRepeatHeader: true,
  });
}

// ─── Slide 8: Support Risk ────────────────────────────────────────────────────
function addSupportRisk(pptx: PptxGenJS, input: PPTXExportInput, num: number) {
  const sr = input.tco1YearData?.supportRisk;
  if (!sr) return;

  const TODAY = new Date('2026-03-23');
  const ONE_YEAR = new Date(TODAY); ONE_YEAR.setFullYear(ONE_YEAR.getFullYear() + 1);

  function rowBg(item: { supportCycle: string; endOfSupport: string }) {
    if (item.supportCycle === 'Unsupported') return C.red50;
    if (item.supportCycle === 'Extended Support') return C.orange50;
    if (item.endOfSupport !== '---') {
      const end = new Date(item.endOfSupport);
      if (end <= ONE_YEAR) return 'FEFCE8';
    }
    return C.white;
  }
  function riskColor(risk: string) {
    if (risk === 'High') return C.red;
    if (risk === 'Med')  return C.yellow;
    return C.green;
  }
  function action(item: { supportCycle: string; endOfSupport: string }) {
    if (item.supportCycle === 'Unsupported') return 'No migrar sin actualizar';
    if (item.supportCycle === 'Extended Support') return 'Planificar actualización';
    if (item.endOfSupport !== '---' && new Date(item.endOfSupport) <= ONE_YEAR) return 'Actualizar antes de migrar';
    return 'Listo para migrar';
  }
  function actionColor(item: { supportCycle: string; endOfSupport: string }) {
    if (item.supportCycle === 'Unsupported') return C.red;
    if (item.supportCycle === 'Extended Support') return C.orange;
    if (item.endOfSupport !== '---' && new Date(item.endOfSupport) <= ONE_YEAR) return C.yellow;
    return C.green;
  }

  const sections = [
    { title: 'Windows Server', data: sr.windowsServers ?? [], color: C.blue },
    { title: 'SQL Server',     data: sr.sqlServers ?? [],     color: C.purple },
    { title: 'Linux',          data: sr.linuxServers ?? [],   color: C.green },
  ].filter(s => s.data.length > 0);

  if (!sections.length) return;

  const slide = pptx.addSlide();
  hdr(slide, 'Análisis de Riesgo de Soporte');
  ftr(slide, input.clientName, num);

  let yPos = 0.72;

  sections.forEach(sec => {
    const total = sec.data.reduce((s: number, d: any) => s + d.count, 0);
    // Section header bar
    slide.addShape('rect', { x: 0.3, y: yPos, w: W - 0.6, h: 0.28, fill: { color: sec.color }, line: { color: sec.color } });
    slide.addText(`${sec.title}  —  Total: ${n(total)} servidores`, {
      x: 0.4, y: yPos + 0.02, w: W - 0.8, h: 0.24,
      fontSize: 10, bold: true, color: C.white, fontFace: 'Arial',
    });
    yPos += 0.32;

    const tblRows: PptxGenJS.TableRow[] = [
      tblHdr(['Versión', 'Cantidad', 'Ciclo de Soporte', 'Fin de Soporte', 'Riesgo', 'Acción Requerida'], []),
      ...sec.data.map((item: any) => {
        const bg = rowBg(item);
        const endStr = item.endOfSupport === '---' ? '---' : new Date(item.endOfSupport).toLocaleDateString('es-ES');
        return [
          { text: item.version,       options: { fontSize: 8, bold: true, color: C.gray900, fill: { color: bg }, fontFace: 'Arial' } },
          { text: n(item.count),      options: { fontSize: 8, align: 'right' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
          { text: item.supportCycle,  options: { fontSize: 8, align: 'center' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
          { text: endStr,             options: { fontSize: 8, align: 'center' as const, color: C.gray700, fill: { color: bg }, fontFace: 'Arial' } },
          { text: item.risk,          options: { fontSize: 8, align: 'center' as const, bold: true, color: riskColor(item.risk), fill: { color: bg }, fontFace: 'Arial' } },
          { text: action(item),       options: { fontSize: 8, color: actionColor(item), fill: { color: bg }, fontFace: 'Arial' } },
        ] as PptxGenJS.TableRow;
      }),
    ];

    slide.addTable(tblRows, {
      x: 0.3, y: yPos, w: W - 0.6,
      colW: [2.8, 0.9, 1.8, 1.4, 0.8, 5.0],
      border: { type: 'solid', color: C.gray200, pt: 0.5 },
      autoPage: true, autoPageRepeatHeader: true,
    });
    yPos += 0.3 + sec.data.length * 0.32 + 0.2;
  });

  // Risk legend
  const legY = Math.min(yPos, H - 0.65);
  slide.addShape('rect', { x: 0.3, y: legY, w: W - 0.6, h: 0.38, fill: { color: C.blue50 }, line: { color: C.blue100 } });
  slide.addText(
    '🔴 Sin soporte — no migrar sin actualizar   🟠 Soporte extendido — planificar actualización   🟡 Vence < 1 año — actualizar antes de migrar   🟢 Activo — listo para migrar',
    { x: 0.4, y: legY + 0.04, w: W - 0.8, h: 0.3, fontSize: 7.5, color: C.blue900, fontFace: 'Arial' }
  );
}

// ─── Slide 9: Instance Types ──────────────────────────────────────────────────
function addInstanceTypes(pptx: PptxGenJS, input: PPTXExportInput, num: number) {
  const instances = input.tco1YearData?.instanceTypes ?? [];
  if (!instances.length) return;

  const slide = pptx.addSlide();
  hdr(slide, 'Top 10 Tipos de Instancias Recomendadas');
  ftr(slide, input.clientName, num);

  const total = instances.reduce((s: number, i: any) => s + i.count, 0);

  // Summary banner
  slide.addShape('rect', { x: 0.3, y: 0.72, w: W - 0.6, h: 0.38, fill: { color: 'EEF2FF' }, line: { color: 'C7D2FE' } });
  slide.addText(`Total de instancias analizadas: ${n(total)}  —  Mostrando las 10 instancias más recomendadas`, {
    x: 0.5, y: 0.74, w: W - 1.0, h: 0.34, fontSize: 9, color: '3730A3', fontFace: 'Arial', valign: 'middle',
  });

  const maxCount = Math.max(...instances.map((i: any) => i.count), 1);
  const barAreaX = 0.3;
  const labelW = 1.8;
  const rankW = 0.4;
  const countW = 1.4;
  const pctW = 0.9;
  const barMaxW = W - 0.6 - rankW - labelW - countW - pctW - 0.2;
  let yPos = 1.18;
  const rowH = 0.48;

  instances.slice(0, 10).forEach((inst: any, i: number) => {
    const barW2 = (inst.count / maxCount) * barMaxW;
    const bg = i % 2 === 0 ? C.white : C.gray50;

    // Row bg
    slide.addShape('rect', { x: barAreaX, y: yPos, w: W - 0.6, h: rowH, fill: { color: bg }, line: { color: C.gray200 } });
    // Rank
    slide.addText(`#${i + 1}`, { x: barAreaX + 0.05, y: yPos, w: rankW, h: rowH, fontSize: 9, bold: true, color: C.gray600, fontFace: 'Arial', valign: 'middle' });
    // Instance type label
    slide.addText(inst.instanceType, { x: barAreaX + rankW, y: yPos, w: labelW, h: rowH, fontSize: 9, bold: true, color: C.gray900, fontFace: 'Arial', valign: 'middle' });
    // Bar background
    const barX = barAreaX + rankW + labelW;
    slide.addShape('rect', { x: barX, y: yPos + 0.08, w: barMaxW, h: rowH - 0.16, fill: { color: C.gray100 }, line: { color: C.gray200 } });
    // Bar fill
    if (barW2 > 0) {
      slide.addShape('rect', { x: barX, y: yPos + 0.08, w: barW2, h: rowH - 0.16, fill: { color: '6366F1' }, line: { color: '6366F1' } });
      if (inst.percentage > 5) {
        slide.addText(pct(inst.percentage), {
          x: barX, y: yPos + 0.08, w: barW2, h: rowH - 0.16,
          fontSize: 8, bold: true, color: C.white, fontFace: 'Arial', align: 'center', valign: 'middle',
        });
      }
    }
    // Count
    slide.addText(`${n(inst.count)} servidores`, {
      x: barX + barMaxW + 0.05, y: yPos, w: countW, h: rowH,
      fontSize: 8, bold: true, color: '4338CA', fontFace: 'Arial', valign: 'middle',
    });
    // Pct
    slide.addText(pct(inst.percentage), {
      x: barX + barMaxW + 0.05 + countW, y: yPos, w: pctW, h: rowH,
      fontSize: 8, color: C.gray600, fontFace: 'Arial', valign: 'middle', align: 'right',
    });

    yPos += rowH;
  });

  // Note
  slide.addShape('rect', { x: 0.3, y: H - 0.65, w: W - 0.6, h: 0.38, fill: { color: C.gray50 }, line: { color: C.gray200 } });
  slide.addText('Nota: Las instancias recomendadas se basan en el análisis considerando los recursos observados (vCPU, RAM, Storage) y las características de carga de trabajo.', {
    x: 0.4, y: H - 0.63, w: W - 0.8, h: 0.34, fontSize: 7.5, color: C.gray600, fontFace: 'Arial',
  });
}

// ─── Slide 10: Network Transfer ───────────────────────────────────────────────
function addNetworkTransfer(pptx: PptxGenJS, input: PPTXExportInput, num: number) {
  const network = input.tco1YearData?.networkTransfer ?? [];
  if (!network.length) return;

  const slide = pptx.addSlide();
  hdr(slide, 'Top 10 Transferencia de Datos de Red');
  ftr(slide, input.clientName, num);

  const totalGB = network.reduce((s: number, n2: any) => s + n2.transferGB, 0);
  const totalLabel = totalGB >= 1000
    ? `${n(totalGB)} GB/mes  (${n(parseFloat((totalGB / 1024).toFixed(2)))} TB)`
    : `${n(totalGB)} GB/mes`;

  // Summary banner
  slide.addShape('rect', { x: 0.3, y: 0.72, w: W - 0.6, h: 0.38, fill: { color: 'ECFEFF' }, line: { color: 'A5F3FC' } });
  slide.addText(`Transferencia total mensual: ${totalLabel}  —  Top 10 servidores con mayor transferencia saliente`, {
    x: 0.5, y: 0.74, w: W - 1.0, h: 0.34, fontSize: 9, color: '164E63', fontFace: 'Arial', valign: 'middle',
  });

  const maxGB = Math.max(...network.map((n2: any) => n2.transferGB), 1);
  const barAreaX = 0.3;
  const rankW = 0.4;
  const labelW = 2.8;
  const gbW = 1.8;
  const pctW2 = 0.9;
  const barMaxW = W - 0.6 - rankW - labelW - gbW - pctW2 - 0.2;
  let yPos = 1.18;
  const rowH = 0.48;

  network.slice(0, 10).forEach((srv: any, i: number) => {
    const barW2 = (srv.transferGB / maxGB) * barMaxW;
    const bg = i % 2 === 0 ? C.white : C.gray50;
    const gbLabel = srv.transferGB >= 1000
      ? `${n(srv.transferGB)} GB  (${n(parseFloat((srv.transferGB / 1024).toFixed(2)))} TB)`
      : `${n(srv.transferGB)} GB/mes`;

    slide.addShape('rect', { x: barAreaX, y: yPos, w: W - 0.6, h: rowH, fill: { color: bg }, line: { color: C.gray200 } });
    slide.addText(`#${i + 1}`, { x: barAreaX + 0.05, y: yPos, w: rankW, h: rowH, fontSize: 9, bold: true, color: C.gray600, fontFace: 'Arial', valign: 'middle' });
    slide.addText(srv.serverName, { x: barAreaX + rankW, y: yPos, w: labelW, h: rowH, fontSize: 8, bold: true, color: C.gray900, fontFace: 'Arial', valign: 'middle' });

    const barX = barAreaX + rankW + labelW;
    slide.addShape('rect', { x: barX, y: yPos + 0.08, w: barMaxW, h: rowH - 0.16, fill: { color: C.gray100 }, line: { color: C.gray200 } });
    if (barW2 > 0) {
      slide.addShape('rect', { x: barX, y: yPos + 0.08, w: barW2, h: rowH - 0.16, fill: { color: C.cyan }, line: { color: C.cyan } });
      if (srv.percentage > 5) {
        slide.addText(pct(srv.percentage), {
          x: barX, y: yPos + 0.08, w: barW2, h: rowH - 0.16,
          fontSize: 8, bold: true, color: C.white, fontFace: 'Arial', align: 'center', valign: 'middle',
        });
      }
    }
    slide.addText(gbLabel, {
      x: barX + barMaxW + 0.05, y: yPos, w: gbW, h: rowH,
      fontSize: 8, bold: true, color: C.cyan, fontFace: 'Arial', valign: 'middle',
    });
    slide.addText(pct(srv.percentage), {
      x: barX + barMaxW + 0.05 + gbW, y: yPos, w: pctW2, h: rowH,
      fontSize: 8, color: C.gray600, fontFace: 'Arial', valign: 'middle', align: 'right',
    });

    yPos += rowH;
  });

  slide.addShape('rect', { x: 0.3, y: H - 0.65, w: W - 0.6, h: 0.38, fill: { color: C.gray50 }, line: { color: C.gray200 } });
  slide.addText('Nota: Los datos representan el tráfico de red saliente (egress) de cada servidor en GB/mes durante el período de assessment. Útil para estimar costos de transferencia en AWS.', {
    x: 0.4, y: H - 0.63, w: W - 0.8, h: 0.34, fontSize: 7.5, color: C.gray600, fontFace: 'Arial',
  });
}

// ─── Slide 11: Carbon Report (optional) ──────────────────────────────────────
function addCarbonReport(pptx: PptxGenJS, input: PPTXExportInput, num: number) {
  const carbon = input.carbonData;
  if (!carbon) return;

  const slide = pptx.addSlide();
  hdr(slide, 'Reporte de Carbonización');
  ftr(slide, input.clientName, num);

  // 3 summary cards
  const cardW = 3.8;
  const cardY = 0.72;
  card(slide, 0.3,                   cardY, cardW, 1.0, 'Uso Actual (On-Premises)', `${n(carbon.currentUsage)} kgCO2eq`, C.gray600, C.gray600, C.gray700);
  card(slide, 0.3 + cardW + 0.2,     cardY, cardW, 1.0, 'Uso en AWS',               `${n(carbon.awsUsage)} kgCO2eq`,    C.blue,    C.blue,    C.blue);
  card(slide, 0.3 + (cardW + 0.2)*2, cardY, cardW, 1.0, 'Ahorro de Carbono',        `${n(carbon.savings)} kgCO2eq`,     C.green,   C.green,   C.green);

  // Savings callout
  const savPct2 = carbon.savingsPercent ?? 0;
  slide.addShape('rect', { x: 0.3, y: cardY + 1.1, w: W - 0.6, h: 0.5, fill: { color: C.green }, line: { color: C.green } });
  slide.addText(`Reducción de emisiones: ${n(carbon.savings)} kgCO2eq  —  ${pct(savPct2)} menos que On-Premises`, {
    x: 0.4, y: cardY + 1.13, w: W - 0.8, h: 0.44,
    fontSize: 13, bold: true, color: C.white, fontFace: 'Arial', align: 'center',
  });

  // Table
  const tblRows: PptxGenJS.TableRow[] = [
    tblHdr(['Métrica', 'Valor (kgCO2eq)'], []),
    [
      { text: 'Uso Actual (On-Premises)', options: { fontSize: 10, bold: true, color: C.gray900, fill: { color: C.white }, fontFace: 'Arial' } },
      { text: `${n(carbon.currentUsage)} (100,00%)`, options: { fontSize: 10, align: 'right' as const, bold: true, color: C.gray900, fill: { color: C.white }, fontFace: 'Arial' } },
    ] as PptxGenJS.TableRow,
    [
      { text: 'Uso en AWS', options: { fontSize: 10, bold: true, color: C.blue, fill: { color: C.blue50 }, fontFace: 'Arial' } },
      { text: `${n(carbon.awsUsage)} (${pct(carbon.currentUsage > 0 ? (carbon.awsUsage / carbon.currentUsage) * 100 : 0)})`, options: { fontSize: 10, align: 'right' as const, bold: true, color: C.blue, fill: { color: C.blue50 }, fontFace: 'Arial' } },
    ] as PptxGenJS.TableRow,
    [
      { text: 'Ahorro de Carbono', options: { fontSize: 10, bold: true, color: C.green, fill: { color: C.green50 }, fontFace: 'Arial' } },
      { text: `${n(carbon.savings)} (${pct(savPct2)})`, options: { fontSize: 10, align: 'right' as const, bold: true, color: C.green, fill: { color: C.green50 }, fontFace: 'Arial' } },
    ] as PptxGenJS.TableRow,
  ];

  slide.addTable(tblRows, {
    x: 0.3, y: cardY + 1.7, w: W - 0.6,
    colW: [W - 0.6 - 3.5, 3.5],
    border: { type: 'solid', color: C.gray200, pt: 0.5 },
    rowH: 0.5,
  });

  // Notes
  slide.addShape('rect', { x: 0.3, y: H - 1.1, w: W - 0.6, h: 0.82, fill: { color: C.green50 }, line: { color: C.green100 } });
  slide.addText('Impacto Ambiental:', { x: 0.5, y: H - 1.08, w: W - 1.0, h: 0.22, fontSize: 9, bold: true, color: C.green, fontFace: 'Arial' });
  slide.addText(
    `La migración a AWS reduce las emisiones de carbono en ${n(carbon.savings)} kgCO2eq, lo que representa una reducción del ${pct(savPct2)} en comparación con la infraestructura actual.\n* kgCO2eq = Kilogramos de dióxido de carbono equivalente`,
    { x: 0.5, y: H - 0.86, w: W - 1.0, h: 0.6, fontSize: 8, color: '166534', fontFace: 'Arial' }
  );
}

// ─── Main Export Function ─────────────────────────────────────────────────────
export async function generateBusinessCasePPTX(input: PPTXExportInput): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches

  let slideNum = 1;

  // 1. Cover
  addCover(pptx, input);
  slideNum++;

  // 2. Executive Summary
  addSummary(pptx, input, slideNum);
  slideNum++;

  // 3. OS Distribution
  if (input.businessCaseData?.osDistribution?.length) {
    addOSDistribution(pptx, input, slideNum);
    slideNum++;
  }

  // 4. Resource Optimization
  if (input.tco1YearData?.resourceOptimization?.length) {
    addResourceOptimization(pptx, input, slideNum);
    slideNum++;
  }

  // 5. TCO EC2
  if (input.onDemandAsIs || input.oneYearOptimized || input.threeYearOptimized) {
    addTCO(pptx, input, slideNum, false);
    slideNum++;
  }

  // 6. TCO RDS (optional)
  if (input.enableRDSScenario && (input.onDemandAsIsRDS || input.oneYearOptimizedRDS || input.threeYearOptimizedRDS)) {
    addTCO(pptx, input, slideNum, true);
    slideNum++;
  }

  // 7. Migration Strategy
  if (input.tco1YearData?.migrationStrategies?.length) {
    addMigrationStrategy(pptx, input, slideNum);
    slideNum++;
  }

  // 8. SQL Licensing
  if (input.tco1YearData?.sqlLicensing?.length) {
    addSQLLicensing(pptx, input, slideNum);
    slideNum++;
  }

  // 9. Support Risk
  if (input.tco1YearData?.supportRisk) {
    addSupportRisk(pptx, input, slideNum);
    slideNum++;
  }

  // 10. Instance Types
  if (input.tco1YearData?.instanceTypes?.length) {
    addInstanceTypes(pptx, input, slideNum);
    slideNum++;
  }

  // 11. Network Transfer
  if (input.tco1YearData?.networkTransfer?.length) {
    addNetworkTransfer(pptx, input, slideNum);
    slideNum++;
  }

  // 12. Carbon Report (optional)
  if (input.carbonData) {
    addCarbonReport(pptx, input, slideNum);
    slideNum++;
  }

  // Write to buffer
  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
  return buffer;
}
