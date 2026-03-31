/**
 * AWS Error Handler Utility
 *
 * Detects AWS credential/permission errors and returns clear, actionable messages.
 * Helps developers quickly identify why AWS calls are failing when cloning the repo.
 */

const CREDENTIAL_ERROR_CODES = [
  'InvalidAccessKeyId',
  'InvalidClientTokenId',
  'ExpiredTokenException',
  'ExpiredToken',
  'CredentialsProviderError',
  'NoCredentialProviders',
  'TokenRefreshRequired',
];

const PERMISSION_ERROR_CODES = [
  'AccessDenied',
  'AccessDeniedException',
  'AuthorizationError',
  'UnauthorizedOperation',
  'NotAuthorized',
];

export interface AWSErrorInfo {
  isAWSError: boolean;
  isCredentialError: boolean;
  isPermissionError: boolean;
  userMessage: string;
  debugMessage: string;
}

export function classifyAWSError(error: any): AWSErrorInfo {
  const code = error?.Code || error?.code || error?.name || '';
  const message = error?.message || '';

  const isCredentialError =
    CREDENTIAL_ERROR_CODES.some(c => code.includes(c) || message.includes(c)) ||
    message.includes('does not exist in our records') ||
    message.includes('security token') ||
    message.includes('credentials');

  const isPermissionError =
    PERMISSION_ERROR_CODES.some(c => code.includes(c) || message.includes(c)) ||
    (error?.$metadata?.httpStatusCode === 403 && !isCredentialError);

  const isAWSError = isCredentialError || isPermissionError || !!error?.$metadata;

  let userMessage = message;
  let debugMessage = '';

  if (isCredentialError) {
    userMessage = 'AWS credentials error: No valid credentials found or credentials are expired.';
    debugMessage = [
      '❌ AWS CREDENTIALS ERROR',
      '   The server could not authenticate with AWS.',
      '   ',
      '   To fix this, choose one of the following:',
      '   1. LOCAL DEV: Run "aws configure" to set up your AWS CLI profile',
      '      Then set AWS_PROFILE=default (or your profile name) in backend/.env',
      '   2. LOCAL DEV: Set credentials directly in backend/.env:',
      '      AWS_ACCESS_KEY_ID=your-key',
      '      AWS_SECRET_ACCESS_KEY=your-secret',
      '   3. PRODUCTION (Lambda/EC2): Assign an IAM Role with the required permissions',
      '      Required permissions: s3:PutObject, s3:GetObject, bedrock:InvokeModel',
      `   Original error: ${code} - ${message}`,
    ].join('\n');
  } else if (isPermissionError) {
    userMessage = 'AWS permission error: The credentials are valid but lack required permissions.';
    debugMessage = [
      '❌ AWS PERMISSIONS ERROR',
      '   Credentials are valid but the IAM user/role lacks required permissions.',
      '   ',
      '   Required AWS permissions:',
      '   - s3:PutObject, s3:GetObject, s3:DeleteObject (on your S3 bucket)',
      '   - bedrock:InvokeModel (on us-east-1 Bedrock models)',
      '   ',
      '   To fix: Add these permissions to your IAM user or role in AWS Console.',
      `   Original error: ${code} - ${message}`,
    ].join('\n');
  }

  return { isAWSError, isCredentialError, isPermissionError, userMessage, debugMessage };
}

export function logAWSError(context: string, error: any): void {
  const info = classifyAWSError(error);
  if (info.isCredentialError || info.isPermissionError) {
    console.error(`\n${'='.repeat(60)}`);
    console.error(info.debugMessage);
    console.error('='.repeat(60) + '\n');
  } else {
    console.error(`[${context}] AWS Error:`, error?.message || error);
  }
}
