
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const filename = `${Date.now()}-${originalName}`;
    
    // Save to private_uploads directory (outside public)
    const uploadDir = path.join(process.cwd(), 'private_uploads');
    
    // Create dir if not exists
    await mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return URL that points to the secure file handler
    return NextResponse.json({ 
      success: true, 
      url: `/api/secure-file/${filename}`, 
      filename: filename 
    });

  } catch (error) {
    console.error('Secure upload error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
