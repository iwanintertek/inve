import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const endpoint = process.env.S3_ENDPOINT || 'http://149.41.198.83:9000';
const accessKeyId = process.env.S3_ACCESS_KEY || 'inve_rustfs_admin';
const secretAccessKey = process.env.S3_SECRET_KEY || 'InveRustfs2026SecureKey';
const bucket = process.env.S3_BUCKET || 'inve-storage';
const region = process.env.S3_REGION || 'us-east-1';

export const s3 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export async function uploadFileToS3(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `uploads/${timestamp}-${safeName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  // Return download/proxy URL or direct S3 URL
  return `/api/files?key=${encodeURIComponent(key)}`;
}

export async function getFileFromS3(key: string) {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
  return response;
}
