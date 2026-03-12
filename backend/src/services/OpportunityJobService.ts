/**
 * OpportunityJobService
 * 
 * Manages asynchronous job processing for opportunity analysis
 */

import { v4 as uuidv4 } from 'uuid';
import { OpportunityJob, JobStatus } from '../types/job';
import { S3Service } from './s3Service';
import { OpportunityAnalyzerService } from './OpportunityAnalyzerService';

export class OpportunityJobService {
  private static readonly JOBS_PREFIX = 'jobs/';

  /**
   * Create a new job
   */
  static async createJob(input: any): Promise<string> {
    const jobId = uuidv4();
    const job: OpportunityJob = {
      jobId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      input,
      progress: 0
    };

    console.log('[OpportunityJobService] Creating job:', jobId);
    
    // Save job to S3
    const s3Key = `${this.JOBS_PREFIX}${jobId}/status.json`;
    await S3Service.uploadJSON(s3Key, job);
    
    console.log('[OpportunityJobService] Job created successfully:', jobId);
    
    return jobId;
  }

  /**
   * Update job status
   */
  static async updateJobStatus(
    jobId: string,
    status: JobStatus,
    data?: any,
    progress?: number
  ): Promise<void> {
    console.log('[OpportunityJobService] Updating job status:', jobId, 'to', status);
    
    const job = await this.getJob(jobId);
    job.status = status;
    job.updatedAt = new Date().toISOString();
    
    if (progress !== undefined) {
      job.progress = progress;
    }
    
    if (data) {
      if (status === 'completed') {
        job.result = data;
        job.progress = 100;
      }
      if (status === 'failed') {
        job.error = typeof data === 'string' ? data : data.message || 'Unknown error';
      }
    }
    
    const s3Key = `${this.JOBS_PREFIX}${jobId}/status.json`;
    await S3Service.uploadJSON(s3Key, job);
    
    console.log('[OpportunityJobService] Job status updated:', jobId, status);
  }

  /**
   * Get job by ID
   */
  static async getJob(jobId: string): Promise<OpportunityJob> {
    console.log('[OpportunityJobService] Getting job:', jobId);
    
    const s3Key = `${this.JOBS_PREFIX}${jobId}/status.json`;
    
    try {
      const data = await S3Service.downloadJSON(s3Key);
      return data as OpportunityJob;
    } catch (error) {
      console.error('[OpportunityJobService] Job not found:', jobId, error);
      throw new Error(`Job not found: ${jobId}`);
    }
  }

  /**
   * Process job in background
   */
  static async processJob(jobId: string): Promise<void> {
    console.log('[OpportunityJobService] ========== STARTING JOB PROCESSING ==========');
    console.log('[OpportunityJobService] Job ID:', jobId);
    
    try {
      // Update status to processing
      await this.updateJobStatus(jobId, 'processing', undefined, 10);
      
      // Get job details
      const job = await this.getJob(jobId);
      console.log('[OpportunityJobService] Job input:', JSON.stringify(job.input, null, 2));
      
      // Update progress
      await this.updateJobStatus(jobId, 'processing', undefined, 30);
      
      // Create analyzer service instance
      const analyzerService = new OpportunityAnalyzerService();
      
      // Call OpportunityAnalyzerService
      console.log('[OpportunityJobService] Calling OpportunityAnalyzerService.analyzeOpportunities...');
      const result = await analyzerService.analyzeOpportunities(
        job.input.files,
        job.input.clientInfo
      );
      
      console.log('[OpportunityJobService] Analysis completed successfully');
      console.log('[OpportunityJobService] Result:', JSON.stringify(result, null, 2));
      
      // Update status to completed
      await this.updateJobStatus(jobId, 'completed', result);
      
      console.log('[OpportunityJobService] ========== JOB PROCESSING COMPLETE ==========');
    } catch (error) {
      console.error('[OpportunityJobService] ========== JOB PROCESSING ERROR ==========');
      console.error('[OpportunityJobService] Job ID:', jobId);
      console.error('[OpportunityJobService] Error:', error);
      console.error('[OpportunityJobService] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Update status to failed
      await this.updateJobStatus(jobId, 'failed', error);
      
      console.error('[OpportunityJobService] ========== ERROR END ==========');
    }
  }

  /**
   * Check if job exists
   */
  static async jobExists(jobId: string): Promise<boolean> {
    try {
      await this.getJob(jobId);
      return true;
    } catch (error) {
      return false;
    }
  }
}
