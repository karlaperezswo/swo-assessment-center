import { Router } from 'express';
import multer from 'multer';
import { ReportController } from '../controllers/reportController';
import { UploadController } from '../controllers/uploadController';

const router = Router();
const controller = new ReportController();
const uploadController = new UploadController();

// Use memory storage instead of disk storage
// Files will be stored in req.file.buffer instead of saved to disk
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

// Get pre-signed URL for direct S3 upload
router.post('/get-upload-url', uploadController.getUploadUrl);

// Process Excel file from S3 (after direct upload)
router.post('/upload-from-s3', controller.uploadExcelFromS3);

// Upload and parse Excel file (legacy method - will timeout on large files)
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      // Handle multer errors
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload error'
      });
    }
    next();
  });
}, controller.uploadExcel);

// Generate Word report
router.post('/generate', controller.generateReport);

// Download generated report
router.get('/download/:filename', controller.downloadReport);

export { router as reportRouter };
