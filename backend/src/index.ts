// Load .env FIRST, before any other imports that might use environment variables
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });
import { businessCaseRouter } from './routes/businessCaseRoutes';
import { dependencyRouter } from './routes/dependencyRoutes';

console.log('[ENV] Environment variables loaded');
console.log('[ENV] BEDROCK_MODEL_ID:', process.env.BEDROCK_MODEL_ID);
console.log('[ENV] BEDROCK_TIMEOUT_MS:', process.env.BEDROCK_TIMEOUT_MS);

import express from 'express';
import cors from 'cors';
import { reportRouter } from './routes/reportRoutes';
import { selectorRouter } from './routes/selectorRoutes';
import { opportunityRouter } from './routes/opportunityRoutes';
import { i18nRouter } from './routes/i18nRoutes';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for downloads
app.use('/downloads', express.static(path.join(__dirname, '../generated')));

// Routes
app.use('/api/report', reportRouter);
app.use('/api/opportunities', opportunityRouter);
app.use('/api/selector', selectorRouter);
app.use('/api/i18n', i18nRouter);
app.use('/api/business-case', businessCaseRouter);
app.use('/api/dependencies', dependencyRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    endpoints: {
      report: '/api/report',
      dependencies: '/api/dependencies',
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AWS Assessment Report Generator API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      report: '/api/report',
      dependencies: '/api/dependencies',
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║          AWS Assessment Report Generator               ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('📍 Endpoints:');
  console.log(`   Health:       http://localhost:${PORT}/health`);
  console.log(`   Report:       http://localhost:${PORT}/api/report`);
  console.log(`   Dependencies: http://localhost:${PORT}/api/dependencies`);
  console.log('');
  console.log('🔍 Para verificar: curl http://localhost:' + PORT + '/health');
  console.log('');
});


