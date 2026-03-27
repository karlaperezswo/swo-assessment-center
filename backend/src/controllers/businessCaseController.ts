import { Request, Response } from 'express';
import { BusinessCaseFormatDetector } from '../services/parsers/BusinessCaseFormatDetector';
import { getCacheStatus, refreshProduct, PRODUCT_SLUGS } from '../services/eolApiService';
import { getSQLPricingStatus } from '../services/sqlPricingService';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as XLSX from 'xlsx';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'assessment-center-files-assessment-dashboard';

async function getBufferFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  const response = await s3Client.send(command);
  if (!response.Body) throw new Error('No file content received from S3');
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
}

/**
 * Business Case Controller
 * Handles upload and analysis of Business Case files (Cloudamize, Concierto, Matilda)
 * Created: 2026-02-26 - Business Case Module
 */
export class BusinessCaseController {
  /**
   * Upload and parse Business Case Excel file
   */
  uploadBusinessCase = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      console.log('[BUSINESS-CASE] Start - Request received');

      if (!req.file) {
        console.log('[BUSINESS-CASE] Error - No file in request');
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      console.log(`[BUSINESS-CASE] File received - Size: ${req.file.buffer.length} bytes, Name: ${req.file.originalname}`);

      // Extract client data from request body
      const clientName = req.body.clientName || '';
      const assessmentTool = req.body.assessmentTool || 'Unknown';
      const otherToolName = req.body.otherToolName || undefined;
      const vertical = req.body.vertical || 'Technology';
      const reportDate = req.body.reportDate || new Date().toISOString().split('T')[0];
      const awsRegion = req.body.awsRegion || 'us-east-1';
      const totalServers = parseInt(req.body.totalServers) || 0;
      const onPremisesCost = parseFloat(req.body.onPremisesCost) || 0;
      const companyDescription = req.body.companyDescription || '';
      const priorities = req.body.priorities ? JSON.parse(req.body.priorities) : [];
      const migrationReadiness = req.body.migrationReadiness || 'evaluating';

      console.log(`[BUSINESS-CASE] Client: ${clientName}, Tool: ${assessmentTool}`);

      // Use buffer from memory storage
      const fileBuffer = req.file.buffer;

      // Parse Excel file
      console.log('[BUSINESS-CASE] Starting Excel parse...');
      const parseStart = Date.now();
      
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      // Detect format automatically
      const detector = new BusinessCaseFormatDetector(workbook);
      const { parser, dataSource } = detector.detectBusinessCaseFormat();
      
      console.log(`[BUSINESS-CASE] Detected format: ${dataSource}`);
      
      if (!parser.canParse()) {
        console.log('[BUSINESS-CASE] Warning - File format not recognized');
      }
      
      const businessCaseData = parser.parse();
      console.log(`[BUSINESS-CASE] Excel parsed in ${Date.now() - parseStart}ms`);

      // Calculate summary
      const summary = {
        totalServers: businessCaseData.servers.length,
        prodServers: businessCaseData.summary.prodServers,
        devServers: businessCaseData.summary.devServers,
        qaServers: businessCaseData.summary.qaServers,
        osDistributionCount: businessCaseData.osDistribution.length,
        dataSource: businessCaseData.dataSource
      };

      // Prepare client data for response
      const clientData = {
        clientName,
        assessmentTool,
        otherToolName,
        vertical,
        reportDate,
        awsRegion,
        totalServers,
        onPremisesCost,
        companyDescription,
        priorities,
        migrationReadiness
      };

      console.log(`[BUSINESS-CASE] Success - Total time: ${Date.now() - startTime}ms`);
      console.log(`[BUSINESS-CASE] Summary:`, summary);
      console.log(`[BUSINESS-CASE] Client:`, clientData);
      
      res.json({
        success: true,
        data: {
          businessCaseData,
          summary,
          clientData
        }
      });
    } catch (error) {
      console.error(`[BUSINESS-CASE] Error after ${Date.now() - startTime}ms:`, error);
      const errMsg = error instanceof Error ? error.message : 'Failed to parse Business Case file';
      const errStack = error instanceof Error ? error.stack : '';
      console.error('[BUSINESS-CASE] Stack:', errStack);
      res.status(500).json({
        success: false,
        error: errMsg,
        detail: errStack?.split('\n').slice(0, 5).join(' | ')
      });
    }
  };

  /**
   * Upload and parse TCO 1 Year Excel file
   */
  uploadTCO1Year = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      console.log('[TCO-1-YEAR] Start - Request received');

      if (!req.file) {
        console.log('[TCO-1-YEAR] Error - No file in request');
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      console.log(`[TCO-1-YEAR] File received - Size: ${req.file.buffer.length} bytes, Name: ${req.file.originalname}`);

      // Get storage increment percentage from request body (default 0%)
      const storageIncrement = parseFloat(req.body.storageIncrement) || 0;
      console.log(`[TCO-1-YEAR] Storage increment: ${storageIncrement}%`);

      // Use buffer from memory storage
      const fileBuffer = req.file.buffer;

      // Parse Excel file
      console.log('[TCO-1-YEAR] Starting Excel parse...');
      const parseStart = Date.now();
      
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      // Detect format automatically
      const detector = new BusinessCaseFormatDetector(workbook);
      const { parser, dataSource } = detector.detectTCO1YearFormat(storageIncrement);
      
      console.log(`[TCO-1-YEAR] Detected format: ${dataSource}`);
      
      if (!parser.canParse()) {
        console.log('[TCO-1-YEAR] Warning - File format not recognized as TCO 1 Year');
        res.status(400).json({ 
          success: false, 
          error: 'File does not contain required sheets. Supported formats: Cloudamize (Compute, Storage, Network) or Matilda (Host Details, Instance TCO Right Sizing)' 
        });
        return;
      }
      
      const tco1YearData = await parser.parse();
      console.log(`[TCO-1-YEAR] Excel parsed in ${Date.now() - parseStart}ms`);

      // Calculate summary
      const summary = {
        totalResources: tco1YearData.resourceOptimization.length,
        dataSource: tco1YearData.dataSource
      };

      console.log(`[TCO-1-YEAR] Success - Total time: ${Date.now() - startTime}ms`);
      console.log(`[TCO-1-YEAR] Summary:`, summary);
      console.log(`[TCO-1-YEAR] Resources:`, tco1YearData.resourceOptimization.map(r => r.resource));
      
      res.json({
        success: true,
        data: {
          tco1YearData,
          summary
        }
      });
    } catch (error) {
      console.error(`[TCO-1-YEAR] Error after ${Date.now() - startTime}ms:`, error);
      const errMsg = error instanceof Error ? error.message : 'Failed to parse TCO 1 Year file';
      const errStack = error instanceof Error ? error.stack : '';
      console.error('[TCO-1-YEAR] Stack:', errStack);
      res.status(500).json({
        success: false,
        error: errMsg,
        detail: errStack?.split('\n').slice(0, 5).join(' | ')
      });
    }
  };

  /**
   * Upload and parse Carbon Report Excel file
   */
  uploadCarbonReport = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      console.log('[CARBON-REPORT] Start - Request received');

      if (!req.file) {
        console.log('[CARBON-REPORT] Error - No file in request');
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      console.log(`[CARBON-REPORT] File received - Size: ${req.file.buffer.length} bytes, Name: ${req.file.originalname}`);

      // Use buffer from memory storage
      const fileBuffer = req.file.buffer;

      // Parse Excel file
      console.log('[CARBON-REPORT] Starting Excel parse...');
      const parseStart = Date.now();
      
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      console.log(`[CARBON-REPORT] Excel parsed in ${Date.now() - parseStart}ms`);

      // Import parser
      const { CarbonReportParser } = await import('../services/parsers/CarbonReportParser');
      
      // Parse carbon data
      const parser = new CarbonReportParser(workbook);
      
      if (!parser.canParse()) {
        console.log('[CARBON-REPORT] Error - Cannot parse file');
        res.status(400).json({ 
          success: false, 
          error: 'Invalid Carbon Report format' 
        });
        return;
      }

      const carbonData = parser.parse();

      // Create response
      const response = {
        carbonData,
        summary: {
          totalCurrentUsage: carbonData.currentUsage,
          totalAWSUsage: carbonData.awsUsage,
          totalSavings: carbonData.savings,
          savingsPercent: carbonData.savingsPercent
        }
      };

      const totalTime = Date.now() - startTime;
      console.log(`[CARBON-REPORT] Success - Total time: ${totalTime}ms`);

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error('[CARBON-REPORT] Error:', error);
      console.log(`[CARBON-REPORT] Failed after ${totalTime}ms`);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  /**
   * POST /api/business-case/upload-from-s3
   * Process Business Case Excel file already uploaded to S3
   */
  uploadBusinessCaseFromS3 = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const { key, clientName = '', assessmentTool = 'Unknown', otherToolName, vertical = 'Technology',
        reportDate, awsRegion = 'us-east-1', totalServers = 0, onPremisesCost = 0,
        companyDescription = '', priorities = [], migrationReadiness = 'evaluating' } = req.body;

      if (!key) { res.status(400).json({ success: false, error: 'S3 key is required' }); return; }

      console.log(`[BUSINESS-CASE-S3] Fetching from S3: ${key}`);
      const fileBuffer = await getBufferFromS3(key);
      await deleteFromS3(key);
      console.log(`[BUSINESS-CASE-S3] File downloaded (${fileBuffer.length} bytes), S3 cleaned`);

      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const detector = new BusinessCaseFormatDetector(workbook);
      const { parser, dataSource } = detector.detectBusinessCaseFormat();
      console.log(`[BUSINESS-CASE-S3] Detected format: ${dataSource}`);
      const businessCaseData = parser.parse();

      const summary = {
        totalServers: businessCaseData.servers.length,
        prodServers: businessCaseData.summary.prodServers,
        devServers: businessCaseData.summary.devServers,
        qaServers: businessCaseData.summary.qaServers,
        osDistributionCount: businessCaseData.osDistribution.length,
        dataSource: businessCaseData.dataSource
      };

      console.log(`[BUSINESS-CASE-S3] Success - ${Date.now() - startTime}ms`);
      res.json({ success: true, data: { businessCaseData, summary,
        clientData: { clientName, assessmentTool, otherToolName, vertical,
          reportDate: reportDate || new Date().toISOString().split('T')[0],
          awsRegion, totalServers, onPremisesCost, companyDescription, priorities, migrationReadiness }
      }});
    } catch (error) {
      console.error(`[BUSINESS-CASE-S3] Error:`, error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to process file from S3' });
    }
  };

  /**
   * POST /api/business-case/upload-tco-1year-from-s3
   * Process TCO 1 Year Excel file already uploaded to S3
   */
  uploadTCO1YearFromS3 = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const { key, storageIncrement = 0 } = req.body;
      if (!key) { res.status(400).json({ success: false, error: 'S3 key is required' }); return; }

      console.log(`[TCO-1-YEAR-S3] Fetching from S3: ${key}`);
      const fileBuffer = await getBufferFromS3(key);
      await deleteFromS3(key);
      console.log(`[TCO-1-YEAR-S3] File downloaded (${fileBuffer.length} bytes), S3 cleaned`);

      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const detector = new BusinessCaseFormatDetector(workbook);
      const { parser, dataSource } = detector.detectTCO1YearFormat(parseFloat(storageIncrement) || 0);
      console.log(`[TCO-1-YEAR-S3] Detected format: ${dataSource}`);

      if (!parser.canParse()) {
        res.status(400).json({ success: false, error: 'File does not contain required sheets for TCO 1 Year' });
        return;
      }

      const tco1YearData = await parser.parse();
      const summary = { totalResources: tco1YearData.resourceOptimization.length, dataSource: tco1YearData.dataSource };

      console.log(`[TCO-1-YEAR-S3] Success - ${Date.now() - startTime}ms`);
      res.json({ success: true, data: { tco1YearData, summary } });
    } catch (error) {
      console.error(`[TCO-1-YEAR-S3] Error:`, error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to process file from S3' });
    }
  };

  /**
   * POST /api/business-case/upload-carbon-report-from-s3
   * Process Carbon Report Excel file already uploaded to S3
   */
  uploadCarbonReportFromS3 = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const { key } = req.body;
      if (!key) { res.status(400).json({ success: false, error: 'S3 key is required' }); return; }

      console.log(`[CARBON-REPORT-S3] Fetching from S3: ${key}`);
      const fileBuffer = await getBufferFromS3(key);
      await deleteFromS3(key);
      console.log(`[CARBON-REPORT-S3] File downloaded (${fileBuffer.length} bytes), S3 cleaned`);

      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const { CarbonReportParser } = await import('../services/parsers/CarbonReportParser');
      const parser = new CarbonReportParser(workbook);

      if (!parser.canParse()) {
        res.status(400).json({ success: false, error: 'Invalid Carbon Report format' });
        return;
      }

      const carbonData = parser.parse();
      console.log(`[CARBON-REPORT-S3] Success - ${Date.now() - startTime}ms`);
      res.json({ success: true, data: { carbonData, summary: {
        totalCurrentUsage: carbonData.currentUsage, totalAWSUsage: carbonData.awsUsage,
        totalSavings: carbonData.savings, savingsPercent: carbonData.savingsPercent
      }}});
    } catch (error) {
      console.error(`[CARBON-REPORT-S3] Error:`, error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Failed to process file from S3' });
    }
  };

  /**
   * POST /api/business-case/inspect-columns
   * Dev diagnostic: returns sheet names and column headers from an uploaded Excel file.
   */
  inspectColumns = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) { res.status(400).json({ error: 'No file' }); return; }
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const result: Record<string, { columns: string[]; rowCount: number; sampleRow?: any }> = {};

      for (const sheetName of workbook.SheetNames) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { range: 0 });
        const columns = data.length > 0 ? Object.keys(data[0] as object) : [];
        result[sheetName] = {
          columns,
          rowCount: data.length,
          sampleRow: data[0] ?? null
        };
      }

      res.json({ success: true, sheets: workbook.SheetNames, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  };

  /**
   * GET /api/business-case/eol-status
   * Returns cache status for EOL data and SQL pricing — shows data freshness in the UI.
   */
  getEolStatus = async (_req: Request, res: Response): Promise<void> => {
    const eolCache = getCacheStatus();
    const sqlPricing = getSQLPricingStatus();
    res.json({
      success: true,
      data: {
        eolData: eolCache,
        sqlPricing,
        note: 'EOL data fetched from endoflife.date (cached 24h). SQL pricing scraped from Microsoft (cached 24h).'
      }
    });
  };

  /**
   * POST /api/business-case/eol-refresh
   * Force-refreshes all EOL caches (bypasses 24h TTL).
   */
  refreshEolData = async (_req: Request, res: Response): Promise<void> => {
    try {
      await Promise.all(PRODUCT_SLUGS.map(slug => refreshProduct(slug)));
      res.json({ success: true, message: 'EOL data refreshed from endoflife.date' });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  };
}
