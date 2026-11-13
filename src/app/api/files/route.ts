import { NextRequest, NextResponse } from 'next/server';
import { getFileFromS3 } from '@/lib/s3';

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Missing file key' }, { status: 400 });
    }

    const s3Object = await getFileFromS3(key);
    if (!s3Object.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Convert S3 stream to web stream or byte array
    const byteArray = await s3Object.Body.transformToByteArray();
    const contentType = s3Object.ContentType || 'application/octet-stream';

    return new NextResponse(byteArray, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Content-Disposition': `inline; filename="${key.split('/').pop()}"`,
      },
    });
  } catch (err: any) {
    console.error('File retrieval error from S3:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
