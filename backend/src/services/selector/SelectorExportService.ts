/**
 * SelectorExportService
 * 
 * Handles PDF and CSV export generation for Selector results
 */

import PDFDocument from 'pdfkit';
import { SelectorSession, SelectorResult } from '../../types/selector';

export class SelectorExportService {
  /**
   * Generate PDF report
   */
  static async generatePDF(
    session: SelectorSession,
    result: SelectorResult,
    questions: any[]
  ): Promise<Buffer> {
    console.log('[PDF Export] Starting PDF generation');
    console.log('[PDF Export] Session:', session.sessionId, 'Client:', session.clientName);
    console.log('[PDF Export] Result tool:', result.recommendedTool);
    console.log('[PDF Export] Number of results:', result.results.length);
    
    return new Promise((resolve, reject) => {
      try {
        console.log('[PDF Export] Creating PDFDocument');
        const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
        const chunks: Buffer[] = [];

        // Collect PDF data
        doc.on('data', (chunk) => {
          chunks.push(chunk);
          console.log('[PDF Export] Data chunk received:', chunk.length, 'bytes');
        });
        
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log('[PDF Export] PDF generation complete. Total size:', buffer.length, 'bytes');
          resolve(buffer);
        });
        
        doc.on('error', (err) => {
          console.error('[PDF Export] PDF generation error:', err);
          reject(err);
        });

        console.log('[PDF Export] Writing header');
        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Selector de Herramienta MAP', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').fillColor('#666666')
          .text('Reporte de Assessment', { align: 'center' });
        doc.moveDown(2);

        console.log('[PDF Export] Writing client info');
        // Client Info
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Información del Cliente');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica')
          .text(`Cliente: ${session.clientName}`)
          .text(`Fecha: ${new Date(session.createdAt).toLocaleDateString('es-ES')}`)
          .text(`Session ID: ${session.sessionId}`);
        doc.moveDown(1.5);

        console.log('[PDF Export] Writing recommendation');
        // Recommendation
        doc.fontSize(14).font('Helvetica-Bold').text('Herramienta Recomendada');
        doc.moveDown(0.5);
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#2563eb')
          .text(result.recommendedTool);
        doc.fontSize(11).font('Helvetica').fillColor('#000000')
          .text(`Confianza: ${result.confidence} (${result.confidencePercentage.toFixed(1)}%)`);
        doc.moveDown(2);

        console.log('[PDF Export] Writing visual chart');
        // Visual Bar Chart
        doc.fontSize(14).font('Helvetica-Bold').text('Comparación Visual de Scores');
        doc.moveDown(1);

        result.results.forEach((tool) => {
          const barY = doc.y;
          const barX = 150;
          const barWidth = 350;
          const barHeight = 18;
          const fillWidth = (tool.percentageScore / 100) * barWidth;
          
          // Tool name (left aligned)
          doc.fontSize(9).font('Helvetica').fillColor('#000000')
            .text(tool.tool, 50, barY + 4, { width: 95, align: 'left' });
          
          // Background bar (light gray)
          doc.rect(barX, barY, barWidth, barHeight)
            .fillAndStroke('#e5e7eb', '#d1d5db');
          
          // Progress bar (blue)
          if (fillWidth > 0) {
            doc.rect(barX, barY, fillWidth, barHeight)
              .fillAndStroke('#2563eb', '#1d4ed8');
          }
          
          // Percentage text (right of bar)
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
            .text(`${tool.percentageScore.toFixed(1)}%`, barX + barWidth + 10, barY + 4);
          
          doc.moveDown(1.3);
        });

        doc.moveDown(1);

        // Scores Table
        doc.fontSize(14).font('Helvetica-Bold').text('Scores de Herramientas');
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 200;
        const col3X = 350;
        const col4X = 480;

        // Table header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Rank', col1X, tableTop);
        doc.text('Herramienta', col2X, tableTop);
        doc.text('Score Absoluto', col3X, tableTop);
        doc.text('Score %', col4X, tableTop);

        // Table rows
        doc.font('Helvetica');
        let currentY = tableTop + 20;

        result.results.forEach((tool, index) => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          doc.text(`#${tool.rank}`, col1X, currentY);
          doc.text(tool.tool, col2X, currentY);
          doc.text(`${tool.absoluteScore} pts`, col3X, currentY);
          doc.text(`${tool.percentageScore.toFixed(1)}%`, col4X, currentY);
          currentY += 20;
        });

        doc.moveDown(2);

        // Decisive Factors
        if (result.decisiveFactors && result.decisiveFactors.length > 0) {
          if (doc.y > 600) doc.addPage();
          
          doc.fontSize(14).font('Helvetica-Bold').text('Factores Decisivos', 50, doc.y, { width: 500, align: 'left' });
          doc.moveDown(0.5);
          doc.fontSize(10).font('Helvetica')
            .text('Las siguientes preguntas tuvieron mayor impacto en la recomendación:', 50, doc.y, { width: 500, align: 'left' });
          doc.moveDown(1.5);

          result.decisiveFactors.slice(0, 5).forEach((factor, index) => {
            if (doc.y > 700) doc.addPage();
            
            // Número y pregunta
            doc.fontSize(10).font('Helvetica-Bold')
              .text(`${index + 1}. ${factor.questionText || factor.questionId}`, 50, doc.y, { width: 500, align: 'left' });
            doc.moveDown(0.5);
            
            // Respuesta con indentación (70 puntos desde el borde izquierdo)
            doc.font('Helvetica').fontSize(9)
              .text(`Respuesta: ${factor.answer}`, 70, doc.y, { width: 480, align: 'left' });
            doc.moveDown(0.3);
            
            // Impacto con indentación (70 puntos desde el borde izquierdo)
            doc.text(`Impacto: ${factor.impact.toFixed(1)} puntos`, 70, doc.y, { width: 480, align: 'left' });
            doc.moveDown(1.2);
          });
        }

        // Footer
        doc.fontSize(8).fillColor('#999999')
          .text(
            `Generado el ${new Date().toLocaleString('es-ES')} | SWO Assessment Center`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate CSV export
   */
  static generateCSV(
    session: SelectorSession,
    result: SelectorResult,
    questions: any[]
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('Selector de Herramienta MAP - Reporte de Assessment');
    lines.push('');

    // Client Info
    lines.push('INFORMACIÓN DEL CLIENTE');
    lines.push(`Cliente,${session.clientName}`);
    lines.push(`Fecha,${new Date(session.createdAt).toLocaleDateString('es-ES')}`);
    lines.push(`Session ID,${session.sessionId}`);
    lines.push('');

    // Recommendation
    lines.push('RECOMENDACIÓN');
    lines.push(`Herramienta Recomendada,${result.recommendedTool}`);
    lines.push(`Confianza,${result.confidence}`);
    lines.push(`Porcentaje de Confianza,${result.confidencePercentage.toFixed(1)}%`);
    lines.push('');

    // Scores
    lines.push('SCORES DE HERRAMIENTAS');
    lines.push('Rank,Herramienta,Score Absoluto,Score Porcentaje');
    result.results.forEach(tool => {
      lines.push(`${tool.rank},${tool.tool},${tool.absoluteScore},${tool.percentageScore.toFixed(1)}%`);
    });
    lines.push('');

    // Answers
    lines.push('RESPUESTAS DEL ASSESSMENT');
    lines.push('Pregunta ID,Respuesta,Timestamp');
    session.answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      const questionText = question ? question.text.replace(/,/g, ';') : answer.questionId;
      lines.push(`"${questionText}",${answer.answer},${answer.timestamp}`);
    });
    lines.push('');

    // Decisive Factors
    if (result.decisiveFactors && result.decisiveFactors.length > 0) {
      lines.push('FACTORES DECISIVOS');
      lines.push('Pregunta,Respuesta,Impacto');
      result.decisiveFactors.slice(0, 5).forEach(factor => {
        const questionText = (factor.questionText || factor.questionId).replace(/,/g, ';');
        lines.push(`"${questionText}",${factor.answer},${factor.impact.toFixed(1)}`);
      });
    }

    return lines.join('\n');
  }
}
