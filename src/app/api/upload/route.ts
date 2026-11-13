import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToS3 } from '@/lib/s3';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || 'application/octet-stream';
    const fileName = file.name;

    const fileUrl = await uploadFileToS3(buffer, fileName, contentType);

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
      size: file.size,
      contentType,
    });
  } catch (err: any) {
    console.error('File upload error to RustFS S3:', err);
    return NextResponse.json(
      { success: false, error: `Failed to upload to S3: ${err.message}` },
      { status: 500 }
    );
  }
}
