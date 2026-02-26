import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  ShadingType,
  PageBreak,
  TableOfContents,
} from 'docx';
import { Opportunity } from '../../../shared/types/opportunity.types';
import { StorageService } from './storageService';

// Brand colors for sales playbook
const COLORS = {
  primary: '0066CC',
  secondary: '333333',
  accent: 'FF6600',
  lightGray: 'F5F5F5',
  white: 'FFFFFF',
  success: '28A745',
  warning: 'FFC107',
  danger: 'DC3545',
};

/**
 * Export Service for generating sales playbook documents
 * Supports PDF and Word formats
 */
export class ExportService {
  /**
   * Generate sales playbook document
   * @param opportunities - Opportunities to include
   * @param format - Output format (pdf or docx)
   * @returns S3 key or local path for generated document
   */
  async generatePlaybook(
    opportunities: Opportunity[],
    format: 'pdf' | 'docx'
  ): Promise<string> {
    // Generate Word document
    const documentBuffer = await this.generateDocx(opportunities);

    // Generate filename
    const timestamp = Date.now();
    const filename = `playbook-${timestamp}.${format}`;

    // For MVP, we only support docx format
    // PDF conversion can be added later using libraries like pdf-lib or docx-pdf
    if (format === 'pdf') {
      // TODO: Implement PDF conversion
      // For now, save as docx and return
      console.warn('[ExportService] PDF format requested but not yet implemented, returning docx');
    }

    // Save document to storage (S3 in production, local in development)
    const fileKey = await StorageService.saveFile(
      filename,
      documentBuffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'generated'
    );

    // Schedule deletion after 1 hour
    StorageService.scheduleFileDeletion(fileKey, 'generated', 60 * 60 * 1000);

    return fileKey;
  }

  /**
   * Get download URL for generated playbook
   * @param s3Key - S3 object key or local path
   * @returns Signed URL valid for 1 hour
   */
  async getDownloadUrl(s3Key: string): Promise<string> {
    return await StorageService.getDownloadUrl(s3Key, 'generated');
  }

  /**
   * Generate Word document with opportunities
   */
  private async generateDocx(opportunities: Opportunity[]): Promise<Buffer> {
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Arial', size: 22 },
          },
        },
        paragraphStyles: [
          {
            id: 'Title',
            name: 'Title',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 56, bold: true, color: COLORS.primary, font: 'Arial' },
            paragraph: { spacing: { before: 240, after: 240 }, alignment: AlignmentType.CENTER },
          },
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 32, bold: true, color: COLORS.primary, font: 'Arial' },
            paragraph: { spacing: { before: 360, after: 120 } },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 28, bold: true, color: COLORS.secondary, font: 'Arial' },
            paragraph: { spacing: { before: 240, after: 120 } },
          },
          {
            id: 'Heading3',
            name: 'Heading 3',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 24, bold: true, color: COLORS.secondary, font: 'Arial' },
            paragraph: { spacing: { before: 200, after: 100 } },
          },
        ],
      },
      sections: [
        this.createCoverPage(opportunities),
        this.createTableOfContents(),
        this.createExecutiveSummary(opportunities),
        ...this.createOpportunitySections(opportunities),
      ],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Create cover page
   */
  private createCoverPage(opportunities: Opportunity[]) {
    const totalARR = opportunities.reduce((sum, opp) => sum + opp.estimatedARR, 0);

    return {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Playbook de Oportunidades de Venta',
              bold: true,
              size: 72,
              color: COLORS.primary,
              font: 'Arial',
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Análisis de Oportunidades AWS',
              size: 48,
              color: COLORS.secondary,
              font: 'Arial',
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 800 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `${opportunities.length} Oportunidades Identificadas`,
              size: 36,
              color: COLORS.accent,
              font: 'Arial',
              bold: true,
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `ARR Total Estimado: $${totalARR.toLocaleString()}`,
              size: 32,
              color: COLORS.success,
              font: 'Arial',
              bold: true,
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 800 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              size: 28,
              color: COLORS.secondary,
              font: 'Arial',
            }),
          ],
        }),
      ],
    };
  }

  /**
   * Create table of contents
   */
  private createTableOfContents() {
    return {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: 'Tabla de Contenidos', bold: true })],
        }),
        new TableOfContents('Tabla de Contenidos', {
          hyperlink: true,
          headingStyleRange: '1-3',
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    };
  }

  /**
   * Create executive summary section
   */
  private createExecutiveSummary(opportunities: Opportunity[]) {
    const totalARR = opportunities.reduce((sum, opp) => sum + opp.estimatedARR, 0);
    const highPriorityCount = opportunities.filter(opp => opp.priority === 'High').length;
    const mediumPriorityCount = opportunities.filter(opp => opp.priority === 'Medium').length;
    const lowPriorityCount = opportunities.filter(opp => opp.priority === 'Low').length;

    return {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: 'Resumen Ejecutivo', bold: true })],
        }),
        new Paragraph({ spacing: { before: 200 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Este playbook presenta las oportunidades de venta identificadas a través del análisis de la evaluación de migración del cliente. Cada oportunidad incluye prioridad, valor estimado, razonamiento, puntos de conversación y próximos pasos.',
            }),
          ],
        }),
        new Paragraph({ spacing: { before: 300 } }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: 'Resumen de Oportunidades', bold: true })],
        }),
        this.createSummaryTable(opportunities, totalARR, highPriorityCount, mediumPriorityCount, lowPriorityCount),
        new Paragraph({ spacing: { before: 300 } }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: 'Distribución por Prioridad', bold: true })],
        }),
        new Paragraph({ spacing: { before: 100 } }),
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: `Alta Prioridad: ${highPriorityCount} oportunidades`,
              bold: true,
              color: COLORS.danger,
            }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: `Prioridad Media: ${mediumPriorityCount} oportunidades`,
              bold: true,
              color: COLORS.warning,
            }),
          ],
        }),
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: `Baja Prioridad: ${lowPriorityCount} oportunidades`,
              bold: true,
              color: COLORS.success,
            }),
          ],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    };
  }

  /**
   * Create summary table
   */
  private createSummaryTable(
    opportunities: Opportunity[],
    totalARR: number,
    highPriorityCount: number,
    mediumPriorityCount: number,
    lowPriorityCount: number
  ): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['Métrica', 'Valor'].map(
            header =>
              new TableCell({
                shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true, color: COLORS.white })],
                  }),
                ],
              })
          ),
        }),
        this.createSummaryRow('Total de Oportunidades', opportunities.length.toString()),
        this.createSummaryRow('ARR Total Estimado', `$${totalARR.toLocaleString()}`),
        this.createSummaryRow('Oportunidades de Alta Prioridad', highPriorityCount.toString()),
        this.createSummaryRow('Oportunidades de Prioridad Media', mediumPriorityCount.toString()),
        this.createSummaryRow('Oportunidades de Baja Prioridad', lowPriorityCount.toString()),
      ],
    });
  }

  /**
   * Create summary row
   */
  private createSummaryRow(label: string, value: string): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: value })] })],
        }),
      ],
    });
  }

  /**
   * Create opportunity sections grouped by priority
   */
  private createOpportunitySections(opportunities: Opportunity[]) {
    // Group opportunities by priority
    const highPriority = opportunities.filter(opp => opp.priority === 'High');
    const mediumPriority = opportunities.filter(opp => opp.priority === 'Medium');
    const lowPriority = opportunities.filter(opp => opp.priority === 'Low');

    const sections = [];

    // High priority section
    if (highPriority.length > 0) {
      sections.push(this.createPrioritySection('Alta Prioridad', highPriority, COLORS.danger));
    }

    // Medium priority section
    if (mediumPriority.length > 0) {
      sections.push(this.createPrioritySection('Prioridad Media', mediumPriority, COLORS.warning));
    }

    // Low priority section
    if (lowPriority.length > 0) {
      sections.push(this.createPrioritySection('Baja Prioridad', lowPriority, COLORS.success));
    }

    return sections;
  }

  /**
   * Create section for a priority level
   */
  private createPrioritySection(title: string, opportunities: Opportunity[], color: string) {
    const children: (Paragraph | Table)[] = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: `Oportunidades de ${title}`, bold: true, color })],
      }),
      new Paragraph({ spacing: { before: 200 } }),
    ];

    // Add each opportunity
    opportunities.forEach((opp, index) => {
      children.push(...this.createOpportunityContent(opp, index + 1));
    });

    return {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    };
  }

  /**
   * Create content for a single opportunity
   */
  private createOpportunityContent(opp: Opportunity, index: number): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [];

    // Opportunity title
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: `${index}. ${opp.title}`, bold: true })],
      })
    );

    // Opportunity details table
    elements.push(this.createOpportunityDetailsTable(opp));

    elements.push(new Paragraph({ spacing: { before: 200 } }));

    // Reasoning
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: 'Razonamiento', bold: true })],
      })
    );

    elements.push(
      new Paragraph({
        children: [new TextRun({ text: opp.reasoning })],
      })
    );

    elements.push(new Paragraph({ spacing: { before: 200 } }));

    // Evidence section - NEW
    if (opp.evidence && opp.evidence.length > 0) {
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: 'Evidencia del Análisis', bold: true })],
        })
      );

      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Esta oportunidad está respaldada por los siguientes datos extraídos del análisis de MPA y MRA:',
              italics: true,
            }),
          ],
        })
      );

      elements.push(new Paragraph({ spacing: { before: 100 } }));

      opp.evidence.forEach((evidenceItem, idx) => {
        elements.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: `${evidenceItem}`,
                color: COLORS.secondary,
              }),
            ],
          })
        );
      });

      elements.push(new Paragraph({ spacing: { before: 100 } }));

      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Esta evidencia proporciona una justificación irrefutable basada en datos reales del entorno del cliente, lo que fortalece la propuesta de valor y facilita la conversación de ventas.',
              italics: true,
              color: COLORS.secondary,
            }),
          ],
        })
      );

      elements.push(new Paragraph({ spacing: { before: 200 } }));
    }

    // Talking points
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: 'Puntos de Conversación', bold: true })],
      })
    );

    opp.talkingPoints.forEach(point => {
      elements.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: point })],
        })
      );
    });

    elements.push(new Paragraph({ spacing: { before: 200 } }));

    // Next steps
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: 'Próximos Pasos', bold: true })],
      })
    );

    opp.nextSteps.forEach((step, idx) => {
      elements.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: `${idx + 1}. ${step}` })],
        })
      );
    });

    elements.push(new Paragraph({ spacing: { before: 200 } }));

    // Related AWS services
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: 'Servicios AWS Relacionados', bold: true })],
      })
    );

    elements.push(
      new Paragraph({
        children: [new TextRun({ text: opp.relatedServices.join(', ') })],
      })
    );

    // Page break after each opportunity
    elements.push(new Paragraph({ children: [new PageBreak()] }));

    return elements;
  }

  /**
   * Create opportunity details table
   */
  private createOpportunityDetailsTable(opp: Opportunity): Table {
      const priorityColor =
        opp.priority === 'High'
          ? COLORS.danger
          : opp.priority === 'Medium'
          ? COLORS.warning
          : COLORS.success;

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: 'Categoría', bold: true })] })],
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: opp.category, bold: true, color: COLORS.primary })],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: 'Prioridad', bold: true })] })],
              }),
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: opp.priority, bold: true, color: priorityColor })],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: 'ARR Estimado', bold: true })] })],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: `$${opp.estimatedARR.toLocaleString()}`, bold: true })],
                  }),
                ],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: 'Estado', bold: true })] })],
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: opp.status })] })],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: 'Fecha de Creación', bold: true })] })],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: new Date(opp.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    }

}
