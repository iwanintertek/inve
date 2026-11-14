import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToS3 } from '@/lib/s3';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const materialId = formData.get('materialId') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || 'application/octet-stream';
    const fileName = file.name;

    // Create Base64 Data URL for "Versi Paksa" (Robust Fallback)
    const base64DataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;

    let finalFileUrl = base64DataUrl;
    let uploadMethod = 'base64_fallback';

    // Attempt upload to RustFS S3 first
    try {
      const s3Url = await uploadFileToS3(buffer, fileName, contentType);
      if (s3Url) {
        finalFileUrl = s3Url;
        uploadMethod = 's3';
      }
    } catch (s3Error: any) {
      console.warn('S3 upload encountered issue, activating "Versi Paksa" Base64 fallback:', s3Error?.message);
      // "Versi Paksa": directly use Base64 data URL to guarantee 100% anti-gagal upload!
      finalFileUrl = base64DataUrl;
      uploadMethod = 'versi_paksa_base64';
    }

    // If materialId is provided, automatically persist file_url to database
    if (materialId) {
      try {
        await query(
          'UPDATE materials SET file_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [finalFileUrl, materialId]
        );
      } catch (dbErr) {
        console.error('Failed to auto-update material file_url:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      url: finalFileUrl,
      fileName,
      size: file.size,
      contentType,
      uploadMethod,
      message: uploadMethod === 's3' ? 'File uploaded to S3' : 'File uploaded via Versi Paksa (100% Anti-Gagal)',
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json(
      { success: false, error: `Upload error: ${err.message}` },
      { status: 500 }
    );
  }
}
