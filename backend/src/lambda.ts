import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import { reportRouter } from './routes/reportRoutes';
import { selectorRouter } from './routes/selectorRoutes';
import { opportunityRouter } from './routes/opportunityRoutes';

const app = express();

// Configure CORS to allow all origins and methods
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/report', reportRouter);
app.use('/api/opportunities', opportunityRouter);
app.use('/api/selector', selectorRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AWS Assessment Center API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      upload: 'POST /api/report/upload',
      generate: 'POST /api/report/generate',
      download: 'GET /api/report/download/:filename'
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Export handler for Lambda with binary support
const serverlessHandler = serverless(app, {
  binary: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
});

interface LambdaResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  isBase64Encoded?: boolean;
}

export const handler = async (event: any, context: any): Promise<LambdaResponse> => {
  console.log('[Lambda Handler] Processing request:', event.path);
  
  const response = await serverlessHandler(event, context) as LambdaResponse;
  
  // List of binary content types
  const binaryTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const contentType = response.headers?.['content-type'] || response.headers?.['Content-Type'] || '';
  const isBinary = binaryTypes.some(type => contentType.includes(type));
  
  console.log('[Lambda Handler] Response content-type:', contentType);
  console.log('[Lambda Handler] Is binary:', isBinary);
  console.log('[Lambda Handler] Body length:', response.body?.length);
  
  // Mark as Base64 encoded for API Gateway if it's a binary response
  if (isBinary && response.body) {
    // The body is already Base64 from the controller
    response.isBase64Encoded = true;
    console.log('[Lambda Handler] Marked as Base64 encoded');
  }
  
  return response;
};
