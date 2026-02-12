
import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json({ success: false, message: 'Filename required' }, { status: 400 });
    }

    // Security check: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
       return NextResponse.json({ success: false, message: 'Invalid filename' }, { status: 400 });
    }

    const filepath = path.join(process.cwd(), 'public/uploads', filename);
    
    try {
        await unlink(filepath);
    } catch (e: unknown) {
        const err = e as NodeJS.ErrnoException;
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
  }
}
