/**
 * Centralised getters for AWS resource identifiers.
 *
 * We deliberately refuse to fall back to hardcoded names here so that a
 * misconfigured deployment fails loudly instead of silently writing to a bucket
 * the operator didn't intend.
 */

export function getS3BucketName(): string {
  const name = process.env.S3_BUCKET_NAME;
  if (!name) {
    throw new Error(
      'S3_BUCKET_NAME env var is required. Refusing to fall back to a hardcoded bucket name.'
    );
  }
  return name;
}
