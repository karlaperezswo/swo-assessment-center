import { Router } from 'express';
import multer from 'multer';
import { DependencyController } from '../controllers/dependencyController';

const router = Router();
const controller = new DependencyController();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/dependencies/export  — export as PDF (HTML) or Word (.docx)
router.post('/export', controller.export);

// POST /api/dependencies/parse  — parse dependency data from Excel file (local fallback)
router.post('/parse', upload.single('file'), controller.parse);

export { router as dependencyRouter };
