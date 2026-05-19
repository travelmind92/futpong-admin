export const COGNITO_IDENTITY_POOL_ID =
  'us-east-1:6c7336a7-d962-4951-836b-fd367c508ed7';

/** S3 bucket for exercise videos and thumbnails (CRA: set in `.env`). */
export function getS3MediaBucket(): string | undefined {
  const b = process.env.REACT_APP_S3_MEDIA_BUCKET?.trim();
  return b || undefined;
}
