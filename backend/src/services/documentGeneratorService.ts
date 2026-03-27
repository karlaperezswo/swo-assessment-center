import { Document, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, BorderStyle } from 'docx';
import * as fs from 'fs';
import * as path from 'path';

export interface DependencyReportData {
  server: string;
  dependencies: {
    incoming: Array<{
      source: string;
      port: number;
      protocol: string;
      serviceName?: string;
      sourceApp?: string;
      destinationApp?: string;
    }>;
    outgoing: Array<{
      destination: string;
      port: number;
      protocol: string;
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
            text: 'Reporte de Dependencias de Red',
            heading: 'Heading1',
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Server name
          new Paragraph({
            children: [
              new TextRun({
                text: `Servidor Analizado: `,
                bold: true,
              }),
              new TextRun({
                text: data.server,
                color: '2563eb',
                bold: true,
                size: 28,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Date
          new Paragraph({
            children: [
              new TextRun({
                text: `Fecha de generación: `,
                bold: true,
              }),
              new TextRun({
                text: new Date().toLocaleString('es-ES'),
              }),
            ],
            spacing: { after: 400 },
          }),

          // Summary
          new Paragraph({
            text: 'Resumen Ejecutivo',
            heading: 'Heading2',
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: `Total de dependencias: `, bold: true }),
              new TextRun({ text: data.summary.totalDependencies.toString() }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Servidores únicos: `, bold: true }),
              new TextRun({ text: data.summary.uniqueServers.toString() }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Aplicaciones únicas: `, bold: true }),
              new TextRun({ text: data.summary.uniqueApplications.toString() }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Puertos únicos: `, bold: true }),
              new TextRun({ text: data.summary.uniquePorts.toString() }),
            ],
            spacing: { after: 400 },
          }),

          // Incoming connections
          new Paragraph({
            text: `Conexiones Entrantes (${data.dependencies.incoming.length})`,
            heading: 'Heading2',
            spacing: { before: 400, after: 200 },
          }),

          this.createDependencyTable(data.dependencies.incoming, 'incoming'),

          // Outgoing connections
          new Paragraph({
            text: `Conexiones Salientes (${data.dependencies.outgoing.length})`,
            heading: 'Heading2',
            spacing: { before: 400, after: 200 },
          }),

          this.createDependencyTable(data.dependencies.outgoing, 'outgoing'),

          // Related servers
          new Paragraph({
            text: `Servidores Relacionados (${data.relatedServers.length})`,
            heading: 'Heading2',
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            text: data.relatedServers.join(', '),
            spacing: { after: 400 },
          }),

          // Related applications
          new Paragraph({
            text: `Aplicaciones Relacionadas (${data.relatedApplications.length})`,
            heading: 'Heading2',
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            text: data.relatedApplications.join(', '),
            spacing: { after: 400 },
          }),

          // Footer
          new Paragraph({
            text: '© 2024 SoftwareOne - AWS Migration Assessment Platform',
            alignment: AlignmentType.CENTER,
            spacing: { before: 800 },
          }),
        ],
      }],
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const serverName = data.server.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `dependencias_${serverName}_${timestamp}.docx`;
    const filepath = path.join(this.outputDir, filename);

    const buffer = await doc.toBuffer();
    fs.writeFileSync(filepath, buffer);

    return filename;
  }

  private createDependencyTable(dependencies: any[], type: 'incoming' | 'outgoing'): Table {
    const headerCells = [
      new TableCell({
        children: [new Paragraph({ text: type === 'incoming' ? 'Servidor Origen' : 'Servidor Destino', bold: true })],
        shading: { fill: '2563eb' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Puerto', bold: true })],
        shading: { fill: '2563eb' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Protocolo', bold: true })],
        shading: { fill: '2563eb' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Servicio', bold: true })],
        shading: { fill: '2563eb' },
      }),
      new TableCell({
        children: [new Paragraph({ text: 'Aplicación', bold: true })],
        shading: { fill: '2563eb' },
      }),
    ];

    const rows = [new TableRow({ children: headerCells })];

    dependencies.forEach((dep, index) => {
      const serverName = type === 'incoming' ? dep.source : dep.destination;
      const app = type === 'incoming' ? dep.sourceApp : dep.destinationApp;
      
      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(serverName)] }),
            new TableCell({ children: [new Paragraph(dep.port.toString())] }),
            new TableCell({ children: [new Paragraph(dep.protocol)] }),
            new TableCell({ children: [new Paragraph(dep.serviceName || '-')] }),
            new TableCell({ children: [new Paragraph(app || '-')] }),
          ],
        })
      );
    });

    if (dependencies.length === 0) {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: 'No hay conexiones', alignment: AlignmentType.CENTER })],
              columnSpan: 5,
            }),
          ],
        })
      );
    }

    return new Table({
      rows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  }

  async generatePDFFromHTML(htmlContent: string, filename: string): Promise<string> {
    // For now, we'll save as HTML and let the browser convert to PDF
    // In production, you could use puppeteer or similar
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, htmlContent);
    return filename;
  }

  getFilePath(filename: string): string {
    return path.join(this.outputDir, filename);
  }
}
