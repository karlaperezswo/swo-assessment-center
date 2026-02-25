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
router.get('/sessions', SelectorController.listAllSessions); // List ALL sessions (must be before /:clientName)
router.get('/sessions/:clientName', SelectorController.listSessions); // List by client
router.get('/session/:clientName/:sessionId', SelectorController.loadSession);
router.put('/session/:sessionId/answer', SelectorController.updateAnswer);

// Calculation
router.post('/session/:sessionId/calculate', SelectorController.calculate);

// Export
router.post('/export/pdf', SelectorController.exportPDF);
router.post('/export/csv', SelectorController.exportCSV);

export { router as selectorRouter };
