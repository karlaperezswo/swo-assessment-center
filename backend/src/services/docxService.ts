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
  BorderStyle,
  TableOfContents,
  PageBreak,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip
} from 'docx';
import { ReportGenerationInput } from '../types';

// SoftwareOne brand colors
const COLORS = {
  primary: '0066CC',
  secondary: '333333',
  accent: 'FF6600',
  lightGray: 'F5F5F5',
  white: 'FFFFFF',
  black: '000000'
};

export class DocxService {
  async generateReport(input: ReportGenerationInput): Promise<Buffer> {
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Arial', size: 22 }
          }
        },
        paragraphStyles: [
          {
            id: 'Title',
            name: 'Title',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 56, bold: true, color: COLORS.primary, font: 'Arial' },
            paragraph: { spacing: { before: 240, after: 240 }, alignment: AlignmentType.CENTER }
          },
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 32, bold: true, color: COLORS.primary, font: 'Arial' },
            paragraph: { spacing: { before: 360, after: 120 } }
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 28, bold: true, color: COLORS.secondary, font: 'Arial' },
            paragraph: { spacing: { before: 240, after: 120 } }
          },
          {
            id: 'Heading3',
            name: 'Heading 3',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 24, bold: true, color: COLORS.secondary, font: 'Arial' },
            paragraph: { spacing: { before: 200, after: 100 } }
          }
        ]
      },
      sections: [
        this.createCoverPage(input),
        this.createTableOfContents(),
        this.createMainContent(input)
      ]
    });

    return await Packer.toBuffer(doc);
  }

  private createCoverPage(input: ReportGenerationInput) {
    return {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Reporte de Análisis de Evaluación',
              bold: true,
              size: 72,
              color: COLORS.primary,
              font: 'Arial'
            })
          ]
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: input.clientName,
              size: 48,
              color: COLORS.secondary,
              font: 'Arial'
            })
          ]
        }),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'SoftwareOne',
              size: 36,
              color: COLORS.accent,
              font: 'Arial',
              bold: true
            })
          ]
        }),
        new Paragraph({ spacing: { before: 800 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: input.reportDate,
              size: 28,
              color: COLORS.secondary,
              font: 'Arial'
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: 'Versión 1.0',
              size: 24,
              color: COLORS.secondary,
              font: 'Arial'
            })
          ]
        })
      ]
    };
  }

  private createTableOfContents() {
    return {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: 'Tabla de Contenidos', bold: true })]
        }),
        new TableOfContents('Tabla de Contenidos', {
          hyperlink: true,
          headingStyleRange: '1-3'
        }),
        new Paragraph({ children: [new PageBreak()] })
      ]
    };
  }

  private createMainContent(input: ReportGenerationInput) {
    const sections: (Paragraph | Table)[] = [];

    // Section 1: Multi-Year Cost Projection
    sections.push(...this.createSection1(input));

    // Section 2: Cost Analysis
    sections.push(...this.createSection2(input));

    // Section 3: Cost Breakdown
    sections.push(...this.createSection3(input));

    // Section 4: Annual Recurring Revenue
    sections.push(...this.createSection4(input));

    // Section 5: Business Requirements
    sections.push(...this.createSection5(input));

    // Section 6: Customer Readiness
    sections.push(...this.createSection6(input));

    // Section 7: Supporting Links
    sections.push(...this.createSection7(input));

    return {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: sections
    };
  }

  private createSection1(input: ReportGenerationInput): (Paragraph | Table)[] {
    const priorityLabels: Record<string, string> = {
      reduced_costs: 'Reducción de costos de infraestructura',
      operational_resilience: 'Mejorar la resiliencia operativa',
      business_agility: 'Agilidad empresarial',
      environment_updated: 'Entorno siempre actualizado',
      modernize_databases: 'Modernizar cargas de trabajo de bases de datos',
      security_compliance: 'Cumplimiento de seguridad'
    };

    const prioritiesList = input.priorities.map(p => priorityLabels[p] || p);

    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: '1. PROYECCIÓN DE COSTOS MULTI-AÑOS' })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '1.1 Descripción General del Proyecto' })]
      }),
      this.createInfoTable([
        ['Vertical/Industria', input.vertical],
        ['Región AWS', input.awsRegion],
        ['Total de Servidores en Alcance', input.totalServers.toString()],
        ['Fecha del Reporte', input.reportDate]
      ]),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '1.2 Descripción de la Empresa' })]
      }),
      new Paragraph({
        children: [new TextRun({ text: input.companyDescription || 'No description provided.' })]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '1.3 Prioridades del Cliente' })]
      }),
      ...prioritiesList.map(
        p =>
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: p })]
          })
      ),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '1.4 Alcance del Proyecto' })]
      }),
      this.createInfoTable([
        ['Total de Servidores', input.excelData.servers.length.toString()],
        ['Total de Bases de Datos', input.excelData.databases.length.toString()],
        ['Total de Aplicaciones', input.excelData.applications.length.toString()],
        [
          'Almacenamiento Total (GB)',
          input.excelData.servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0).toFixed(0)
        ]
      ]),
      new Paragraph({ children: [new PageBreak()] })
    ];
  }

  private createSection2(input: ReportGenerationInput): (Paragraph | Table)[] {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: '2. ANÁLISIS DE COSTOS' })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '2.1 Costos Actuales On-Premises' })]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Costo estimado actual on-premises anual: $${input.onPremisesCost.toLocaleString()}`
          })
        ]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: 'Los Costos On-Premises Incluyen:' })]
      }),
      new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: 'Costos de hardware' })] }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Licencias de software' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Mantenimiento y soporte' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Instalaciones de centros de datos' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Energía y refrigeración' })]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: 'Los Costos On-Premises Excluyen:' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Costos de personal' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Infraestructura de red' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Sistemas de seguridad' })]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '2.2 Cost Modeling Summary' })]
      }),
      this.createCostComparisonTable(input),
      new Paragraph({ children: [new PageBreak()] })
    ];
  }

  private createSection3(input: ReportGenerationInput): (Paragraph | Table)[] {
    const elements: (Paragraph | Table)[] = [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: '3. DESGLOSE DE COSTOS PARA SERVICIOS AWS INICIALES' })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '3.1 Instancias Amazon EC2' })]
      }),
      this.createEC2Table(input),
      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '3.2 Almacenamiento Amazon EBS' })]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Almacenamiento Total: ${input.excelData.servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0).toFixed(0)} GB`
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Tipo de Almacenamiento: gp3 (SSD de Propósito General)`
          })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Costo Mensual Estimado: $${(input.excelData.servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0) * 0.08).toFixed(2)}`
          })
        ]
      })
    ];

    // Add RDS section if databases exist
    if (input.excelData.databases.length > 0) {
      elements.push(
        new Paragraph({ spacing: { before: 300 } }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: '3.3 Amazon RDS Databases' })]
        }),
        this.createRDSTable(input)
      );
    }

    // Cost summary
    elements.push(
      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '3.4 AWS Cost Summary' })]
      }),
      this.createAWSCostSummaryTable(input),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: 'AWS Calculator Links' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: `On-Demand: ${input.calculatorLinks.onDemand}` })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: `1-Year NURI: ${input.calculatorLinks.oneYearNuri}` })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: `3-Year NURI: ${input.calculatorLinks.threeYearNuri}` })]
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    return elements;
  }

  private createSection4(input: ReportGenerationInput): (Paragraph | Table)[] {
    const costs = input.costs;

    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: '4. INGRESOS RECURRENTES ANUALES (ARR)' })]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'The following table shows the projected costs over a 3-year period for different pricing models:'
          })
        ]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      this.createARRTable(costs),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Potential 3-Year Savings with Reserved Instances: $${(costs.onDemand.threeYear - costs.threeYearNuri.threeYear).toLocaleString()}`,
            bold: true,
            color: COLORS.primary
          })
        ]
      }),
      new Paragraph({ children: [new PageBreak()] })
    ];
  }

  private createSection5(input: ReportGenerationInput): (Paragraph | Table)[] {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: '5. REQUISITOS COMERCIALES Y CONTRACTUALES' })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '5.1 Uptime SLA Requirements' })]
      }),
      this.createSLATable(),
      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '5.2 Security and Compliance Requirements' })]
      }),
      this.createSecurityTable(),
      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '5.3 Disaster Recovery and Business Continuity' })]
      }),
      this.createDRTable(),
      new Paragraph({ children: [new PageBreak()] })
    ];
  }

  private createSection6(input: ReportGenerationInput): (Paragraph | Table)[] {
    const readinessLabels: Record<string, string> = {
      ready: 'Listo para Migrar',
      evaluating: 'Evaluando Actualmente',
      not_ready: 'Aún No Está Listo'
    };

    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: '6. PREPARACIÓN DEL CLIENTE PARA MIGRAR' })]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Current Status: ${readinessLabels[input.migrationReadiness] || input.migrationReadiness}`,
            bold: true,
            size: 28
          })
        ]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Based on the assessment findings and client discussions, the following readiness factors have been identified:'
          })
        ]
      }),
      new Paragraph({ spacing: { before: 100 } }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Technical readiness assessment completed' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Application dependencies mapped' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Infrastructure inventory documented' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Cost analysis provided' })]
      }),
      new Paragraph({ children: [new PageBreak()] })
    ];
  }

  private createSection7(input: ReportGenerationInput): (Paragraph | Table)[] {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: '7. ENLACES DE SOPORTE Y DOCUMENTOS' })]
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '7.1 High Level Target Architecture' })]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: '[Architecture diagram to be inserted]',
            italics: true,
            color: '666666'
          })
        ]
      }),
      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '7.2 7Rs Analysis' })]
      }),
      this.create7RsTable(input),
      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '7.3 Migration Effort - Mobilize and Migrate' })]
      }),
      this.createMigrationEffortTable(input),
      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: '7.4 Cómo Usar la Calculadora AWS' })]
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Las tablas detalladas en las secciones 3.1, 3.2 y 3.3 de este documento contienen todas las especificaciones necesarias para crear una estimación personalizada en la Calculadora de Precios de AWS.',
          })
        ]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: 'Instrucciones:' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Visite la Calculadora AWS en el siguiente enlace' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Seleccione la región: ' + input.awsRegion })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Agregue servicios EC2, EBS y RDS según las tablas de la Sección 3' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Para cada servidor, ingrese el tipo de instancia recomendada de la tabla EC2' })]
      }),
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: 'Seleccione el modelo de precios: On-Demand, 1-Year NURI o 3-Year NURI' })]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: 'Enlace a la Calculadora:' })]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: input.calculatorLinks.onDemand, color: COLORS.primary })
        ]
      }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Nota: Los costos estimados en este documento se calcularon usando los tipos de instancia recomendados y precios vigentes en ' + input.awsRegion + '. Para estimaciones precisas y actualizadas, use la Calculadora AWS con las especificaciones proporcionadas.',
            italics: true,
            size: 20,
            color: '666666'
          })
        ]
      })
    ];
  }

  // Helper methods for creating tables
  private createInfoTable(data: [string, string][]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: data.map(
        ([label, value]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })]
              }),
              new TableCell({
                width: { size: 60, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: value })] })]
              })
            ]
          })
      )
    });
  }

  private createEC2Table(input: ReportGenerationInput): Table {
    const headers = ['Hostname', 'OS', 'vCPUs', 'RAM (GB)', 'Storage (GB)', 'Recommended Instance', 'Monthly Cost'];
    const recommendations = input.ec2Recommendations;

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map(
            header =>
              new TableCell({
                shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true, color: COLORS.white })]
                  })
                ]
              })
          )
        }),
        ...recommendations.slice(0, 50).map(
          rec =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: rec.hostname })] })]
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text:
                            input.excelData.servers.find(s => s.hostname === rec.hostname)?.osName ||
                            ''
                        })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: rec.originalSpecs.vcpus.toString() })]
                    })
                  ]
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: rec.originalSpecs.ram.toString() })]
                    })
                  ]
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: rec.originalSpecs.storage.toString() })]
                    })
                  ]
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: rec.recommendedInstance })] })
                  ]
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: `$${rec.monthlyEstimate.toFixed(2)}` })]
                    })
                  ]
                })
              ]
            })
        )
      ]
    });
  }

  private createRDSTable(input: ReportGenerationInput): Table {
    const headers = ['DB Name', 'Source Engine', 'Target Service', 'Instance Class', 'Size (GB)', 'Monthly Cost'];

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map(
            header =>
              new TableCell({
                shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true, color: COLORS.white })]
                  })
                ]
              })
          )
        }),
        ...input.dbRecommendations.slice(0, 30).map(
          rec =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: rec.dbName })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: rec.sourceEngine })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: rec.targetEngine })] })]
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: rec.instanceClass })] })]
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: rec.storageGB.toString() })]
                    })
                  ]
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: `$${rec.monthlyEstimate.toFixed(2)}` })]
                    })
                  ]
                })
              ]
            })
        )
      ]
    });
  }

  private createCostComparisonTable(input: ReportGenerationInput): Table {
    const costs = input.costs;

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['Pricing Model', 'Monthly Cost', 'Annual Cost', '3-Year Cost'].map(
            header =>
              new TableCell({
                shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true, color: COLORS.white })]
                  })
                ]
              })
          )
        }),
        this.createCostRow('On-Demand', costs.onDemand),
        this.createCostRow('1-Year Reserved (NURI)', costs.oneYearNuri),
        this.createCostRow('3-Year Reserved (NURI)', costs.threeYearNuri)
      ]
    });
  }

  private createCostRow(label: string, cost: { monthly: number; annual: number; threeYear: number }): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })]
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: `$${cost.monthly.toLocaleString()}` })] })
          ]
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: `$${cost.annual.toLocaleString()}` })] })
          ]
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: `$${cost.threeYear.toLocaleString()}` })]
            })
          ]
        })
      ]
    });
  }

  private createAWSCostSummaryTable(input: ReportGenerationInput): Table {
    const ec2Total = input.ec2Recommendations.reduce((sum, r) => sum + r.monthlyEstimate, 0);
    const rdsTotal = input.dbRecommendations.reduce((sum, r) => sum + r.monthlyEstimate, 0);
    const storageTotal = input.excelData.servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0) * 0.08;
    const networkingTotal = (ec2Total + rdsTotal) * 0.1;

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['Service', 'Monthly Cost (On-Demand)'].map(
            header =>
              new TableCell({
                shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true, color: COLORS.white })]
                  })
                ]
              })
          )
        }),
        this.createServiceRow('Amazon EC2', ec2Total),
        this.createServiceRow('Amazon EBS', storageTotal),
        this.createServiceRow('Amazon RDS', rdsTotal),
        this.createServiceRow('Networking (VPC, NAT)', networkingTotal),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true })] })]
            }),
            new TableCell({
              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${(ec2Total + rdsTotal + storageTotal + networkingTotal).toLocaleString()}`,
                      bold: true
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private createServiceRow(service: string, cost: number): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: service })] })]
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: `$${cost.toFixed(2)}` })] })
          ]
        })
      ]
    });
  }

  private createARRTable(costs: any): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['Pricing Model', 'Year 1', 'Year 2', 'Year 3', 'Total'].map(
            header =>
              new TableCell({
                shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true, color: COLORS.white })]
                  })
                ]
              })
          )
        }),
        this.createARRRow('On-Demand', costs.onDemand.annual),
        this.createARRRow('1-Year NURI', costs.oneYearNuri.annual),
        this.createARRRow('3-Year NURI', costs.threeYearNuri.annual)
      ]
    });
  }

  private createARRRow(label: string, annualCost: number): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })]
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: `$${annualCost.toLocaleString()}` })] })
          ]
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: `$${annualCost.toLocaleString()}` })] })
          ]
        }),
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: `$${annualCost.toLocaleString()}` })] })
          ]
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: `$${(annualCost * 3).toLocaleString()}`, bold: true })]
            })
          ]
        })
      ]
    });
  }

  private createSLATable(): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['SLA Tier', 'Uptime', 'Downtime/Year', 'AWS Services'].map(
            header =>
              new TableCell({
                shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true, color: COLORS.white })]
                  })
                ]
              })
          )
        }),
        this.createSLARow('Standard', '99.9%', '8.76 hours', 'EC2, RDS Single-AZ'),
        this.createSLARow('High Availability', '99.99%', '52.6 minutes', 'Multi-AZ RDS, ALB'),
        this.createSLARow('Mission Critical', '99.999%', '5.26 minutes', 'Multi-Region, Route 53')
      ]
    });
  }

  private createSLARow(tier: string, uptime: string, downtime: string, services: string): TableRow {
    return new TableRow({
      children: [tier, uptime, downtime, services].map(
        text =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text })] })]
          })
      )
    });
  }

  private createSecurityTable(): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['Requirement', 'AWS Solution', 'Status'].map(
            header =>
              new TableCell({
                shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true, color: COLORS.white })]
                  })
                ]
              })
          )
        }),
        this.createSecurityRow('Data Encryption at Rest', 'AWS KMS, EBS Encryption', 'Available'),
        this.createSecurityRow('Data Encryption in Transit', 'TLS 1.2+, ACM', 'Available'),
        this.createSecurityRow('Identity Management', 'AWS IAM, SSO', 'Available'),
        this.createSecurityRow('Network Security', 'VPC, Security Groups, NACLs', 'Available'),
        this.createSecurityRow('Compliance Certifications', 'SOC 2, ISO 27001, HIPAA', 'Available')
      ]
    });
  }

  private createSecurityRow(requirement: string, solution: string, status: string): TableRow {
    return new TableRow({
      children: [requirement, solution, status].map(
        text =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text })] })]
          })
      )
    });
  }

  private createDRTable(): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['DR Strategy', 'RPO', 'RTO', 'Cost Impact'].map(
            header =>
              new TableCell({
                shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true, color: COLORS.white })]
                  })
                ]
              })
          )
        }),
        this.createDRRow('Backup & Restore', '24 hours', '24 hours', 'Low'),
        this.createDRRow('Pilot Light', '1 hour', '4 hours', 'Medium'),
        this.createDRRow('Warm Standby', '15 minutes', '1 hour', 'Medium-High'),
        this.createDRRow('Multi-Site Active-Active', 'Near zero', 'Near zero', 'High')
      ]
    });
  }

  private createDRRow(strategy: string, rpo: string, rto: string, cost: string): TableRow {
    return new TableRow({
      children: [strategy, rpo, rto, cost].map(
        text =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text })] })]
          })
      )
    });
  }

  private create7RsTable(input: ReportGenerationInput): Table {
    const serverCount = input.excelData.servers.length;
    // Simplified 7Rs distribution
    const distribution = {
      'Rehost (Lift & Shift)': Math.round(serverCount * 0.6),
      'Replatform': Math.round(serverCount * 0.2),
      'Refactor': Math.round(serverCount * 0.1),
      'Repurchase': Math.round(serverCount * 0.05),
      'Retire': Math.round(serverCount * 0.03),
      'Retain': Math.round(serverCount * 0.02)
    };

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['Migration Strategy', 'Server Count', 'Percentage'].map(
            header =>
              new TableCell({
                shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true, color: COLORS.white })]
                  })
                ]
              })
          )
        }),
        ...Object.entries(distribution).map(
          ([strategy, count]) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: strategy })] })]
                }),
                new TableCell({
                  children: [
                    new Paragraph({ children: [new TextRun({ text: count.toString() })] })
                  ]
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `${((count / serverCount) * 100).toFixed(1)}%`
                        })
                      ]
                    })
                  ]
                })
              ]
            })
        )
      ]
    });
  }

  private createMigrationEffortTable(input: ReportGenerationInput): Table {
    const serverCount = input.excelData.servers.length;
    const dbCount = input.excelData.databases.length;

    // Estimated hours per server/db
    const hoursPerServer = 8;
    const hoursPerDb = 16;

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['Phase', 'Activities', 'Estimated Hours'].map(
            header =>
              new TableCell({
                shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: header, bold: true, color: COLORS.white })]
                  })
                ]
              })
          )
        }),
        this.createEffortRow('Mobilize', 'Planning, Architecture, Landing Zone', 80),
        this.createEffortRow(
          'Migrate - Servers',
          'Server migration and validation',
          serverCount * hoursPerServer
        ),
        this.createEffortRow(
          'Migrate - Databases',
          'Database migration and validation',
          dbCount * hoursPerDb
        ),
        this.createEffortRow('Optimize', 'Performance tuning, cost optimization', 40),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL', bold: true })] })]
            }),
            new TableCell({
              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: '' })] })]
            }),
            new TableCell({
              shading: { fill: COLORS.lightGray, type: ShadingType.CLEAR },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: (
                        80 +
                        serverCount * hoursPerServer +
                        dbCount * hoursPerDb +
                        40
                      ).toString(),
                      bold: true
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    });
  }

  private createEffortRow(phase: string, activities: string, hours: number): TableRow {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: phase, bold: true })] })]
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: activities })] })]
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: hours.toString() })] })]
        })
      ]
    });
  }
}
