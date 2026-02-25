import { Router } from 'express';
import { uploadDependencyFile, searchDependencies, exportDependencies } from '../controllers/dependencyController';

const router = Router();

// Upload and parse dependency file
router.post('/upload', uploadDependencyFile);

// Search dependencies by server name
router.post('/search', searchDependencies);

// Export dependencies to PDF/Word
router.post('/export', exportDependencies);

export { router as dependencyRouter };
