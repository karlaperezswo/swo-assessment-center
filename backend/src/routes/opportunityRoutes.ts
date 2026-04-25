import { Router } from 'express';
import { OpportunityController } from '../controllers/OpportunityController';
import { requirePermission } from '../middleware/requireRole';
import { buildBedrockRateLimiter } from '../middleware/security';

const router = Router();
const controller = new OpportunityController();

// Heavy / Bedrock-hitting endpoints share a tighter limiter on top of the
// global per-IP base limiter applied in index.ts.
const heavyLimiter = buildBedrockRateLimiter();

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
router.post(
  '/get-upload-urls',
  heavyLimiter,
  requirePermission('assessments:upload'),
  controller.getUploadUrls
);

/**
 * POST /api/opportunities/analyze
 * Start asynchronous analysis of MPA Excel, MRA PDF, and optional Questionnaire Word files
 * Files must be uploaded to S3 first using /get-upload-urls
 * Returns immediately with a jobId for polling
 * 
 * Request body (JSON):
 *   - mpaKey: string (S3 key from get-upload-urls) - REQUIRED
 *   - mraKey: string (S3 key from get-upload-urls) - REQUIRED
 *   - questionnaireKey: string (S3 key from get-upload-urls) - OPTIONAL
 * 
 * Response: CreateJobResponse (202 Accepted)
 *   - jobId: string
 *   - message: string
 *   - statusUrl: string
 *   - resultUrl: string
 */
router.post('/analyze', heavyLimiter, requirePermission('bedrock:invoke'), controller.analyze);

/**
 * GET /api/opportunities/status/:jobId
 * Get the status of an analysis job
 * 
 * Path parameters:
 *   - jobId: string (job ID from /analyze)
 * 
 * Response: JobStatusResponse
 *   - jobId: string
 *   - status: 'pending' | 'processing' | 'completed' | 'failed'
 *   - createdAt: string
 *   - updatedAt: string
 *   - progress: number (0-100)
 *   - error?: string (if failed)
 */
router.get(
  '/status/:jobId',
  requirePermission('sessions:read:own'),
  controller.getJobStatus
);

/**
 * GET /api/opportunities/result/:jobId
 * Get the result of a completed analysis job
 * 
 * Path parameters:
 *   - jobId: string (job ID from /analyze)
 * 
 * Response: JobResultResponse
 *   - result: { sessionId, opportunities, summary }
 */
router.get(
  '/result/:jobId',
  requirePermission('sessions:read:own'),
  controller.getJobResult
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
router.get('/list', requirePermission('sessions:read:own'), controller.list);

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
router.patch(
  '/:id/status',
  requirePermission('opportunities:approve'),
  controller.updateStatus
);

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
router.post('/export', heavyLimiter, requirePermission('report:download'), controller.export);

export { router as opportunityRouter };
