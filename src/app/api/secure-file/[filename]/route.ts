
import { NextResponse, type NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import mime from 'mime';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await context.params;
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    const filepath = path.join(process.cwd(), 'private_uploads', filename);

    if (!existsSync(filepath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = await readFile(filepath);
    
    // Determine content type
    const contentType = mime.getType(filepath) || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('File serve error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
