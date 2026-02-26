import { Router } from 'express';
import multer from 'multer';
import { OpportunityController } from '../controllers/OpportunityController';

const router = Router();
const controller = new OpportunityController();

// Use memory storage for file uploads
const storage = multer.memoryStorage();

// Configure multer for MPA Excel, MRA PDF, and optional Questionnaire Word files
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept Excel files or JSON for mpaFile
    if (file.fieldname === 'mpaFile') {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/json',
      ];
      if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.json')) {
        cb(null, true);
      } else {
        cb(new Error('MPA file must be an Excel file (.xlsx) or JSON file (.json)'));
      }
    }
    // Accept PDF files for mraFile
    else if (file.fieldname === 'mraFile') {
      if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
        cb(null, true);
      } else {
        cb(new Error('MRA file must be a PDF file (.pdf)'));
      }
    }
    // Accept Word files for questionnaireFile (optional)
    else if (file.fieldname === 'questionnaireFile') {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.docx') || file.originalname.endsWith('.doc')) {
        cb(null, true);
      } else {
        cb(new Error('Questionnaire file must be a Word file (.docx or .doc)'));
      }
    } else {
      cb(new Error('Unexpected field name'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
  },
});

/**
 * POST /api/opportunities/analyze
 * Analyze MPA Excel, MRA PDF, and optional Questionnaire Word files to generate opportunities
 * 
 * Request: multipart/form-data
 *   - mpaFile: Excel file (MPA data) - REQUIRED
 *   - mraFile: PDF file (MRA document) - REQUIRED
 *   - questionnaireFile: Word file (Infrastructure questionnaire) - OPTIONAL
 * 
 * Response: AnalyzeResponseBody
 *   - sessionId: string
 *   - opportunities: Opportunity[]
 *   - summary: { totalOpportunities, totalEstimatedARR, highPriorityCount }
 */
router.post(
  '/analyze',
  (req, res, next) => {
    upload.fields([
      { name: 'mpaFile', maxCount: 1 },
      { name: 'mraFile', maxCount: 1 },
      { name: 'questionnaireFile', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload error',
        });
      }
      next();
    });
  },
  controller.analyze
);

/**
 * GET /api/opportunities/list
 * Retrieve opportunities with optional filters
 * 
 * Query parameters:
 *   - sessionId: string (required)
 *   - priority: string (optional, comma-separated: High,Medium,Low)
 *   - minARR: string (optional, number as string)
 *   - maxARR: string (optional, number as string)
 *   - status: string (optional, comma-separated status values)
 *   - search: string (optional, search term)
 * 
 * Response: ListResponseBody
 *   - opportunities: Opportunity[]
 *   - total: number
 */
router.get('/list', controller.list);

/**
 * PATCH /api/opportunities/:id/status
 * Update opportunity status
 * 
 * Path parameters:
 *   - id: string (opportunity ID)
 * 
 * Request body:
 *   - status: OpportunityStatus
 * 
 * Response: UpdateStatusResponseBody
 *   - opportunity: Opportunity
 */
router.patch('/:id/status', controller.updateStatus);

/**
 * POST /api/opportunities/export
 * Export sales playbook in PDF or Word format
 * 
 * Request body:
 *   - sessionId: string (required)
 *   - format: 'pdf' | 'docx' (required)
 *   - opportunityIds: string[] (optional, export specific opportunities)
 * 
 * Response: ExportResponseBody
 *   - downloadUrl: string (signed URL valid for 1 hour)
 *   - expiresAt: Date
 *   - filename: string
 */
router.post('/export', controller.export);

export { router as opportunityRouter };
