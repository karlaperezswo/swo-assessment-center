/**
 * SelectorController
 * 
 * Handles HTTP requests for the Selector module
 */

import { Request, Response } from 'express';
import { SelectorConfigService } from '../../services/selector/SelectorConfigService';
import { SelectorSessionService } from '../../services/selector/SelectorSessionService';
import { SelectorCalculationService } from '../../services/selector/SelectorCalculationService';
import { SelectorExportService } from '../../services/selector/SelectorExportService';

export class SelectorController {
  /**
   * GET /api/selector/questions
   * Get all questions configuration
   */
  static async getQuestions(req: Request, res: Response) {
    try {
      const questions = await SelectorConfigService.loadQuestions();
      res.json({ success: true, data: questions });
    } catch (error) {
      console.error('[SelectorController] Error getting questions:', error);
      res.status(500).json({ success: false, error: 'Failed to load questions' });
    }
  }

  /**
   * POST /api/selector/session
   * Create a new session
   */
  static async createSession(req: Request, res: Response) {
    try {
      const { clientName } = req.body;
      if (!clientName) {
        return res.status(400).json({ success: false, error: 'clientName is required' });
      }

      const session = SelectorSessionService.createSession(clientName);
      res.json({ success: true, data: session });
    } catch (error) {
      console.error('[SelectorController] Error creating session:', error);
      res.status(500).json({ success: false, error: 'Failed to create session' });
    }
  }

  /**
   * POST /api/selector/session/:sessionId/calculate
   * Calculate scores and recommendation
   */
  static async calculate(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { session } = req.body;

      if (!session) {
        return res.status(400).json({ success: false, error: 'session data is required' });
      }

      const result = await SelectorCalculationService.calculateScores(session);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('[SelectorController] Error calculating scores:', error);
      res.status(500).json({ success: false, error: 'Failed to calculate scores' });
    }
  }

  /**
   * POST /api/selector/export/pdf
   * Export assessment as PDF
   */
  static async exportPDF(req: Request, res: Response) {
    try {
      console.log('[SelectorController] PDF export request received');
      const { session, result } = req.body;

      if (!session || !result) {
        console.log('[SelectorController] Missing session or result data');
        return res.status(400).json({ success: false, error: 'session and result data are required' });
      }

      console.log('[SelectorController] Loading questions for PDF generation');
      // Load questions for context
      const questionsData = await SelectorConfigService.loadQuestions();
      const allQuestions = questionsData.categories.flatMap(cat => cat.questions);

      console.log('[SelectorController] Generating PDF buffer');
      const pdfBuffer = await SelectorExportService.generatePDF(session, result, allQuestions);
      console.log('[SelectorController] PDF buffer generated, size:', pdfBuffer.length, 'bytes');

      // Set headers explicitly
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.setHeader('Content-Disposition', `attachment; filename="selector-${session.clientName}-${session.sessionId}.pdf"`);
      
      console.log('[SelectorController] Sending PDF buffer to client');
      res.end(pdfBuffer, 'binary');
      console.log('[SelectorController] PDF sent successfully');
    } catch (error) {
      console.error('[SelectorController] Error exporting PDF:', error);
      res.status(500).json({ success: false, error: 'Failed to export PDF' });
    }
  }

  /**
   * POST /api/selector/export/csv
   * Export assessment as CSV
   */
  static async exportCSV(req: Request, res: Response) {
    try {
      const { session, result } = req.body;

      if (!session || !result) {
        return res.status(400).json({ success: false, error: 'session and result data are required' });
      }

      // Load questions for context
      const questionsData = await SelectorConfigService.loadQuestions();
      const allQuestions = questionsData.categories.flatMap(cat => cat.questions);

      const csvContent = SelectorExportService.generateCSV(session, result, allQuestions);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="selector-${session.clientName}-${session.sessionId}.csv"`);
      res.send('\uFEFF' + csvContent); // Add BOM for Excel UTF-8 support
    } catch (error) {
      console.error('[SelectorController] Error exporting CSV:', error);
      res.status(500).json({ success: false, error: 'Failed to export CSV' });
    }
  }
}
