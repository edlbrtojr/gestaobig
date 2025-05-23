import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data containing the file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp', 'image/x-icon'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate a unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write the file to disk
    fs.writeFileSync(filePath, buffer);

    // Return the public URL path
    const publicPath = `/uploads/${uniqueFilename}`;
    
    return NextResponse.json({ 
      success: true, 
      filePath: publicPath 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 