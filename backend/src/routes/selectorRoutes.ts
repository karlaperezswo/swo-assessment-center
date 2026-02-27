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

// Calculation
router.post('/session/:sessionId/calculate', SelectorController.calculate);

// Export
router.post('/export/pdf', SelectorController.exportPDF);
router.post('/export/csv', SelectorController.exportCSV);

export { router as selectorRouter };
