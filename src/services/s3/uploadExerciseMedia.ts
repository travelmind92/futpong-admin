import {
  DeleteObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';

export type ExerciseMediaKind = 'video' | 'thumbnail';

function fileExtension(file: File, kind: ExerciseMediaKind): string {
  const name = file.name;
  const idx = name.lastIndexOf('.');
  if (idx >= 0) {
    const ext = name.slice(idx).toLowerCase();
    if (/^\.[a-z0-9]{1,12}$/.test(ext)) {
      return ext;
    }
  }
  const mime = file.type.toLowerCase();
  if (kind === 'thumbnail') {
    if (mime === 'image/png') return '.png';
    if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
    if (mime === 'image/webp') return '.webp';
    if (mime === 'image/gif') return '.gif';
    if (mime === 'image/svg+xml') return '.svg';
    if (mime === 'image/bmp') return '.bmp';
    if (mime === 'image/tiff') return '.tiff';
    return '.bin';
  }
  if (mime === 'video/mp4') return '.mp4';
  if (mime === 'video/webm') return '.webm';
  if (mime === 'video/quicktime') return '.mov';
  return '.bin';
}

export async function uploadExerciseMediaToS3(
  client: S3Client,
  options: {
    bucket: string;
    exerciseId: string;
    kind: ExerciseMediaKind;
    file: File;
  }
): Promise<string> {
  const ext = fileExtension(options.file, options.kind);
  const key = `videos/${options.exerciseId}${ext}`;
  const contentType =
    options.file.type.trim() !== ''
      ? options.file.type
      : 'application/octet-stream';
  const bytes = new Uint8Array(await options.file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: options.bucket,
      Key: key,
      Body: bytes,
      ContentLength: bytes.byteLength,
      ContentType: contentType,
    })
  );

  return key;
}

export function toS3ObjectKey(rawPath: string | undefined): string | undefined {
  const v = rawPath?.trim();
  if (!v) {
    return undefined;
  }
  if (v.startsWith('http://') || v.startsWith('https://')) {
    try {
      const url = new URL(v);
      const p = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      return p || undefined;
    } catch {
      return undefined;
    }
  }
  return v.replace(/^\/+/, '') || undefined;
}

export async function deleteExerciseMediaFromS3(
  client: S3Client,
  options: { bucket: string; key: string }
): Promise<void> {
  await client.send(
    new DeleteObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
    })
  );
}
