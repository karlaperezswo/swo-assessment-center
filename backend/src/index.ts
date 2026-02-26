// Load .env FIRST, before any other imports that might use environment variables
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('[ENV] Environment variables loaded');
console.log('[ENV] BEDROCK_MODEL_ID:', process.env.BEDROCK_MODEL_ID);
console.log('[ENV] BEDROCK_TIMEOUT_MS:', process.env.BEDROCK_TIMEOUT_MS);

import express from 'express';
import cors from 'cors';
import { reportRouter } from './routes/reportRoutes';
import { opportunityRouter } from './routes/opportunityRoutes';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for downloads
app.use('/downloads', express.static(path.join(__dirname, '../generated')));

// Routes
app.use('/api/report', reportRouter);
app.use('/api/opportunities', opportunityRouter);

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

