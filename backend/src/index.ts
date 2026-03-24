// Load .env FIRST, before any other imports that might use environment variables
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });
import { businessCaseRouter } from './routes/businessCaseRoutes';

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
    // Allow requests with no origin (Lambda, curl, server-to-server)
    // and any localhost port for local dev
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in prod (API Gateway handles auth)
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


