/**
 * Selector Routes
 * 
 * API routes for the Selector module
 */

import { Router } from 'express';
import { SelectorController } from '../controllers/selector/SelectorController';

const router = Router();

// Configuration
router.get('/questions', SelectorController.getQuestions);

// Session management
router.post('/session', SelectorController.createSession);
router.post('/session/save', SelectorController.saveSession);
router.get('/session/:clientName/:sessionId', SelectorController.loadSession);
router.get('/sessions/:clientName', SelectorController.listSessions);
router.put('/session/:sessionId/answer', SelectorController.updateAnswer);

// Calculation
router.post('/session/:sessionId/calculate', SelectorController.calculate);

// Export
router.post('/export/pdf', SelectorController.exportPDF);
router.post('/export/csv', SelectorController.exportCSV);

export { router as selectorRouter };
