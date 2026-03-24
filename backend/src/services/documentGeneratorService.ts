import { Document, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, HeadingLevel, ShadingType, Packer } from 'docx';
import * as fs from 'fs';
import * as path from 'path';

export interface DependencyReportData {
  server: string;
  dependencies: {
    incoming: Array<{
      source?: string;
      destination?: string;
      port?: number | null;
      protocol?: string;
      serviceName?: string;
      sourceApp?: string;
      destinationApp?: string;
    }>;
    outgoing: Array<{
      source?: string;
      destination?: string;
      port?: number | null;
      protocol?: string;
      serviceName?: string;
      sourceApp?: string;
      destinationApp?: string;
    }>;
  };
  relatedServers: string[];
  relatedApplications: string[];
  summary: {
    totalDependencies: number;
    uniqueServers: number;
    uniqueApplications: number;
    uniquePorts: number;
  };
}

export class DocumentGeneratorService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(__dirname, '../../generated');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateWordDocument(data: DependencyReportData): Promise<string> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Reporte de Dependencias de Red', bold: true, size: 36, color: '1e3a8a' })],
          }),

          // Subtitle bar (server name)
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            shading: { type: ShadingType.SOLID, fill: 'dbeafe' },
            children: [
              new TextRun({ text: 'Servidor: ', bold: true, color: '1e40af', size: 24 }),
              new TextRun({ text: data.server, bold: true, color: '1e40af', size: 24 }),
            ],
          }),

          // Date
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: `Generado: ${new Date().toLocaleString('es-ES')}`, color: '6b7280', size: 18 }),
            ],
          }),

          // Summary heading
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
            children: [new TextRun({ text: 'Resumen Ejecutivo', bold: true, color: '1e3a8a' })],
          }),

          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: 'Total de dependencias: ', bold: true, color: '374151' }),
              new TextRun({ text: data.summary.totalDependencies.toString(), color: '374151' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: 'Servidores únicos: ', bold: true, color: '374151' }),
              new TextRun({ text: data.summary.uniqueServers.toString(), color: '374151' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: 'Aplicaciones únicas: ', bold: true, color: '374151' }),
              new TextRun({ text: data.summary.uniqueApplications.toString(), color: '374151' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 400 },
            children: [
              new TextRun({ text: 'Puertos únicos: ', bold: true, color: '374151' }),
              new TextRun({ text: data.summary.uniquePorts.toString(), color: '374151' }),
            ],
          }),

          // Incoming
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
            children: [new TextRun({ text: `Conexiones Entrantes (${data.dependencies.incoming.length})`, bold: true, color: '1e3a8a' })],
          }),
          this.createDependencyTable(data.dependencies.incoming, 'incoming'),

          // Outgoing
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
            children: [new TextRun({ text: `Conexiones Salientes (${data.dependencies.outgoing.length})`, bold: true, color: '1e3a8a' })],
          }),
          this.createDependencyTable(data.dependencies.outgoing, 'outgoing'),

          // Related servers
          ...(data.relatedServers.length > 0 ? [
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
              children: [new TextRun({ text: `Servidores Relacionados (${data.relatedServers.length})`, bold: true, color: '1e3a8a' })],
            }),
            new Paragraph({
              spacing: { after: 400 },
              children: [new TextRun({ text: data.relatedServers.join(', '), color: '374151' })],
            }),
          ] : []),

          // Related applications
          ...(data.relatedApplications.length > 0 ? [
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
              children: [new TextRun({ text: `Aplicaciones Relacionadas (${data.relatedApplications.length})`, bold: true, color: '1e3a8a' })],
            }),
            new Paragraph({
              spacing: { after: 400 },
              children: [new TextRun({ text: data.relatedApplications.join(', '), color: '374151' })],
            }),
          ] : []),

          // Footer
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 800 },
            children: [new TextRun({ text: `© ${new Date().getFullYear()} SoftwareOne – AWS Migration Assessment Platform`, color: '9ca3af', size: 16 })],
          }),
        ],
      }],
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const serverName = data.server.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `dependencias_${serverName}_${timestamp}.docx`;
    const filepath = path.join(this.outputDir, filename);

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filepath, buffer);

    return filename;
  }

  private createDependencyTable(dependencies: any[], type: 'incoming' | 'outgoing'): Table {
    const headerLabel = type === 'incoming' ? 'Servidor Origen' : 'Servidor Destino';

    // Column widths in DXA (1440 DXA = 1 inch). Page ~9360 DXA usable.
    const colWidths = [2808, 749, 936, 2434, 2434];
    const colHeaders = [headerLabel, 'Puerto', 'Protocolo', 'Servicio / Proceso', 'Aplicación'];

    // Header: fondo azul claro (#dbeafe), texto azul oscuro (#1e3a8a) — profesional, sin negro
    const headerRow = new TableRow({
      tableHeader: true,
      children: colHeaders.map((text, i) =>
        new TableCell({
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { type: ShadingType.SOLID, fill: 'dbeafe' },
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text, bold: true, color: '1e3a8a', size: 18 })],
          })],
        })
      ),
    });

    const dataRows = dependencies.length > 0
      ? dependencies.map((dep: any, idx: number) => {
          const serverName = type === 'incoming' ? (dep.source || '-') : (dep.destination || '-');
          const app = type === 'incoming' ? (dep.sourceApp || '-') : (dep.destinationApp || '-');
          // Filas alternas: blanco y gris muy suave
          const fillColor = idx % 2 === 0 ? 'ffffff' : 'f8fafc';

          const makeCell = (text: string, width: number) =>
            new TableCell({
              width: { size: width, type: WidthType.DXA },
              shading: { type: ShadingType.SOLID, fill: fillColor },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({
                children: [new TextRun({ text: text || '-', size: 18, color: '374151' })],
                spacing: { line: 276 },
              })],
            });

          return new TableRow({
            cantSplit: false,
            children: [
              makeCell(serverName, colWidths[0]),
              makeCell(dep.port != null ? String(dep.port) : '-', colWidths[1]),
              makeCell(dep.protocol || '-', colWidths[2]),
              makeCell(dep.serviceName || '-', colWidths[3]),
              makeCell(app, colWidths[4]),
            ],
          });
        })
      : [new TableRow({
          children: [new TableCell({
            columnSpan: 5,
            shading: { type: ShadingType.SOLID, fill: 'f9fafb' },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'Sin conexiones', color: '9ca3af', italics: true, size: 18 })],
            })],
          })],
        })];

    return new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: colWidths,
    });
  }

  getFilePath(filename: string): string {
    return path.join(this.outputDir, filename);
  }
}
