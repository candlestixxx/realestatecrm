import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Folder Detection Service
 * Monitors network shares, MLS downloads, Downloads folder, and Desktop
 * for new property photos and documents. Auto-imports matching files.
 *
 * Supported sources:
 * - Network share (SMB/NFS path)
 * - MLS download folder
 * - User Downloads folder
 * - Desktop
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'all';

  // Return configured watch folders
  const watchFolders = [
    { id: 'network', label: 'Network Share', path: process.env.WATCH_NETWORK_SHARE || '\\\\fileserver\\listings', enabled: !!process.env.WATCH_NETWORK_SHARE },
    { id: 'mls', label: 'MLS Downloads', path: process.env.WATCH_MLS_FOLDER || 'C:\\Users\\Downloads\\MLS', enabled: !!process.env.WATCH_MLS_FOLDER },
    { id: 'downloads', label: 'Downloads', path: process.env.WATCH_DOWNLOADS || 'C:\\Users\\Downloads', enabled: true },
    { id: 'desktop', label: 'Desktop', path: process.env.WATCH_DESKTOP || 'C:\\Users\\Desktop', enabled: true },
  ];

  return NextResponse.json({
    watchFolders: source === 'all' ? watchFolders : watchFolders.filter(f => f.id === source),
    scanInterval: parseInt(process.env.FOLDER_SCAN_INTERVAL || '30000'),
  });
}

/**
 * POST: Trigger a folder scan for new files.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { source, workspaceId } = body;

  const fs = await import('fs/promises');
  const path = await import('path');

  const FOLDER_MAP: Record<string, string> = {
    network: process.env.WATCH_NETWORK_SHARE || '',
    mls: process.env.WATCH_MLS_FOLDER || '',
    downloads: process.env.WATCH_DOWNLOADS || 'C:\\Users\\Downloads',
    desktop: process.env.WATCH_DESKTOP || 'C:\\Users\\Desktop',
  };

  const folder = FOLDER_MAP[source];
  if (!folder) {
    return NextResponse.json({ error: 'Unknown source: ' + source }, { status: 400 });
  }

  try {
    const entries = await fs.readdir(folder, { withFileTypes: true });
    const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
    const docExts = ['.pdf', '.docx', '.doc', '.xlsx'];

    const newFiles = [];
    for (const entry of entries.slice(0, 50)) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      const isImage = imageExts.includes(ext);
      const isDoc = docExts.includes(ext);
      if (!isImage && !isDoc) continue;

      const filePath = path.join(folder, entry.name);
      const stats = await fs.stat(filePath);

      // Skip files older than 24h
      if (Date.now() - stats.mtimeMs > 86400000) continue;

      newFiles.push({
        fileName: entry.name,
        filePath,
        size: stats.size,
        modifiedAt: stats.mtime,
        type: isImage ? 'IMAGE' : 'DOCUMENT',
        source,
      });
    }

    // Log scan activity
    await prisma.activity.create({
      data: {
        type: 'FOLDER_SCAN',
        content: JSON.stringify({ source, folder, filesFound: newFiles.length, timestamp: new Date().toISOString() }),
        workspaceId: workspaceId || 'excel-legacy-team',
      },
    });

    return NextResponse.json({
      source,
      folder,
      filesFound: newFiles.length,
      files: newFiles,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to scan folder: ' + e.message, folder }, { status: 500 });
  }
}
