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
      console.log('[SelectorController] ========== PDF EXPORT REQUEST ==========');
      console.log('[SelectorController] Request body keys:', Object.keys(req.body));
      
      const { session, result } = req.body;
      
      console.log('[SelectorController] Session data present:', !!session);
      console.log('[SelectorController] Result data present:', !!result);

      if (!session || !result) {
        console.error('[SelectorController] ERROR: Missing required data');
        console.error('[SelectorController] Session:', !!session);
        console.error('[SelectorController] Result:', !!result);
        return res.status(400).json({ success: false, error: 'session and result data are required' });
      }

      console.log('[SelectorController] Session ID:', session.sessionId);
      console.log('[SelectorController] Client name:', session.clientName);
      console.log('[SelectorController] Number of answers:', session.answers?.length || 0);
      console.log('[SelectorController] Recommended tool:', result.recommendedTool);
      console.log('[SelectorController] Confidence:', result.confidence);
      console.log('[SelectorController] Number of results:', result.results?.length || 0);

      console.log('[SelectorController] Loading questions configuration...');
      const questionsData = await SelectorConfigService.loadQuestions();
      const allQuestions = questionsData.categories.flatMap(cat => cat.questions);
      console.log('[SelectorController] Questions loaded:', questionsData.categories.length, 'categories,', allQuestions.length, 'total questions');

      console.log('[SelectorController] Calling SelectorExportService.generatePDF()...');
      const pdfBuffer = await SelectorExportService.generatePDF(session, result, allQuestions);
      console.log('[SelectorController] PDF generation returned');
      
      console.log('[SelectorController] PDF buffer size:', pdfBuffer.length, 'bytes');
      console.log('[SelectorController] PDF buffer is empty:', pdfBuffer.length === 0);
      
      if (pdfBuffer.length === 0) {
        console.error('[SelectorController] ERROR: PDF buffer is empty!');
        throw new Error('Generated PDF buffer is empty');
      }

      // Validate PDF header
      const pdfHeader = pdfBuffer.subarray(0, 5).toString('ascii');
      console.log('[SelectorController] PDF header validation:', pdfHeader);
      if (pdfHeader !== '%PDF-') {
        console.error('[SelectorController] ERROR: Invalid PDF header! Expected "%PDF-", got:', pdfHeader);
        throw new Error('Generated buffer is not a valid PDF');
      }

      console.log('[SelectorController] Converting PDF to Base64 for JSON response...');
      const filename = `selector-${session.clientName}-${session.sessionId}.pdf`;
      const base64Pdf = pdfBuffer.toString('base64');
      console.log('[SelectorController] Base64 length:', base64Pdf.length, 'characters');
      
      console.log('[SelectorController] Sending JSON response with Base64 PDF...');
      res.json({
        success: true,
        pdf: base64Pdf,
        filename: filename,
        size: pdfBuffer.length
      });
      console.log('[SelectorController] ========== PDF EXPORT COMPLETE ==========');
    } catch (error) {
      console.error('[SelectorController] ========== PDF EXPORT ERROR ==========');
      console.error('[SelectorController] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[SelectorController] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[SelectorController] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('[SelectorController] ========== ERROR END ==========');
      res.status(500).json({ 
        success: false, 
        error: 'Failed to export PDF',
        details: error instanceof Error ? error.message : String(error)
      });
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
