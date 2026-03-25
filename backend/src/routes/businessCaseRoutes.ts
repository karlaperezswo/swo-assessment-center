import { Router } from 'express';
import multer from 'multer';
import { BusinessCaseController } from '../controllers/businessCaseController';

/**
 * Business Case Routes
 * Created: 2026-02-26 - Business Case Module
 */
const router = Router();
const controller = new BusinessCaseController();

// Use memory storage (same as report routes)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx) are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Upload and parse Business Case Excel file
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'File upload error' });
    }
    next();
  });
}, controller.uploadBusinessCase);

// Upload and parse TCO 1 Year Excel file
router.post('/upload-tco-1year', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'File upload error' });
    }
    next();
  });
}, controller.uploadTCO1Year);

// Upload and parse Carbon Report Excel file
router.post('/upload-carbon-report', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message || 'File upload error' });
    }
    next();
  });
}, controller.uploadCarbonReport);

// Export Business Case to PowerPoint
// router.post('/export-pptx', controller.exportPPTX); // REMOVED: PPTX export functionality removed

// Process files from S3 (production mode)
router.post('/upload-from-s3', controller.uploadBusinessCaseFromS3);
router.post('/upload-tco-1year-from-s3', controller.uploadTCO1YearFromS3);
router.post('/upload-carbon-report-from-s3', controller.uploadCarbonReportFromS3);

// EOL & pricing data status + manual refresh
router.get('/eol-status', controller.getEolStatus);
router.post('/eol-refresh', controller.refreshEolData);

// Diagnostic: inspect Excel file columns (dev only)
router.post('/inspect-columns', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    next();
  });
}, controller.inspectColumns);

export { router as businessCaseRouter };
