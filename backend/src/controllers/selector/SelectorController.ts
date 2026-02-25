/**
 * SelectorController
 * 
 * Handles HTTP requests for the Selector module
 */

import { Request, Response } from 'express';
import { SelectorConfigService } from '../../services/selector/SelectorConfigService';
import { SelectorSessionService } from '../../services/selector/SelectorSessionService';
import { SelectorCalculationService } from '../../services/selector/SelectorCalculationService';

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
      const { questionId, answer } = req.body;

      if (!questionId || !answer) {
        return res.status(400).json({ success: false, error: 'questionId and answer are required' });
      }

      // In a real implementation, load session, update, and save
      // For now, just return success
      res.json({ success: true, message: 'Answer updated' });
    } catch (error) {
      console.error('[SelectorController] Error updating answer:', error);
      res.status(500).json({ success: false, error: 'Failed to update answer' });
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
}
