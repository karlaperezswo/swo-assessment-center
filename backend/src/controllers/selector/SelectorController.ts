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
   * PUT /api/selector/session/:sessionId/answer
   * Update an answer in the session
   */
  static async updateAnswer(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const { questionId, answer, clientName } = req.body;

      if (!questionId || !answer || !clientName) {
        return res.status(400).json({ success: false, error: 'questionId, answer, and clientName are required' });
      }

      // Load existing session or create new one
      let session = await SelectorSessionService.loadSession(clientName, sessionId);
      
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      // Update answer
      session = SelectorSessionService.updateAnswer(session, questionId, answer);

      // Save session
      await SelectorSessionService.saveSession(session);

      res.json({ success: true, data: session });
    } catch (error) {
      console.error('[SelectorController] Error updating answer:', error);
      res.status(500).json({ success: false, error: 'Failed to update answer' });
    }
  }

  /**
   * POST /api/selector/session/save
   * Save session to storage
   */
  static async saveSession(req: Request, res: Response) {
    try {
      const { session } = req.body;

      if (!session) {
        return res.status(400).json({ success: false, error: 'session data is required' });
      }

      await SelectorSessionService.saveSession(session);
      res.json({ success: true, message: 'Session saved successfully' });
    } catch (error) {
      console.error('[SelectorController] Error saving session:', error);
      res.status(500).json({ success: false, error: 'Failed to save session' });
    }
  }

  /**
   * GET /api/selector/session/:clientName/:sessionId
   * Load a specific session
   */
  static async loadSession(req: Request, res: Response) {
    try {
      const { clientName, sessionId } = req.params;

      const session = await SelectorSessionService.loadSession(clientName, sessionId);
      
      if (!session) {
        return res.status(404).json({ success: false, error: 'Session not found' });
      }

      res.json({ success: true, data: session });
    } catch (error) {
      console.error('[SelectorController] Error loading session:', error);
      res.status(500).json({ success: false, error: 'Failed to load session' });
    }
  }

  /**
   * GET /api/selector/sessions/:clientName
   * List sessions for a client
   */
  static async listSessions(req: Request, res: Response) {
    try {
      const { clientName } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      const sessions = await SelectorSessionService.listSessions(clientName, limit);
      res.json({ success: true, data: sessions });
    } catch (error) {
      console.error('[SelectorController] Error listing sessions:', error);
      res.status(500).json({ success: false, error: 'Failed to list sessions' });
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
      const { session, result } = req.body;

      if (!session || !result) {
        return res.status(400).json({ success: false, error: 'session and result data are required' });
      }

      // Load questions for context
      const questionsData = await SelectorConfigService.loadQuestions();
      const allQuestions = questionsData.categories.flatMap(cat => cat.questions);

      const pdfBuffer = await SelectorExportService.generatePDF(session, result, allQuestions);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="selector-${session.clientName}-${session.sessionId}.pdf"`);
      res.send(pdfBuffer);
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
