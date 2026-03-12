/**
 * Job Types for Asynchronous Processing
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface OpportunityJob {
  jobId: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  input: {
    files: Array<{
      filename: string;
      s3Key: string;
      contentType: string;
    }>;
    clientInfo?: any;
  };
  result?: any;
  error?: string;
  progress?: number; // 0-100
}

export interface JobStatusResponse {
  success: boolean;
  jobId: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  error?: string;
}

export interface JobResultResponse {
  success: boolean;
  result: any;
}

export interface CreateJobResponse {
  success: boolean;
  jobId: string;
  message: string;
  statusUrl: string;
  resultUrl: string;
}
