import { Router } from 'express';
import { OpportunityController } from '../controllers/OpportunityController';

const router = Router();
const controller = new OpportunityController();

/**
 * POST /api/opportunities/get-upload-urls
 * Generate presigned URLs for direct S3 upload
 * 
 * Request body:
 *   - files: Array<{ filename: string, contentType: string }> (required, min 2 files)
 * 
 * Response:
 *   - sessionId: string
 *   - mpaUrl: string (presigned URL)
 *   - mpaKey: string (S3 key)
 *   - mraUrl: string (presigned URL)
 *   - mraKey: string (S3 key)
 *   - questionnaireUrl?: string (presigned URL, optional)
 *   - questionnaireKey?: string (S3 key, optional)
 */
router.post('/get-upload-urls', controller.getUploadUrls);

/**
 * POST /api/opportunities/analyze
 * Analyze MPA Excel, MRA PDF, and optional Questionnaire Word files to generate opportunities
 * Files must be uploaded to S3 first using /get-upload-urls
 * 
 * Request body (JSON):
 *   - mpaKey: string (S3 key from get-upload-urls) - REQUIRED
 *   - mraKey: string (S3 key from get-upload-urls) - REQUIRED
 *   - questionnaireKey: string (S3 key from get-upload-urls) - OPTIONAL
 * 
 * Response: AnalyzeResponseBody
 *   - sessionId: string
 *   - opportunities: Opportunity[]
 *   - summary: { totalOpportunities, totalEstimatedARR, highPriorityCount }
 */
router.post('/analyze', controller.analyze);

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
