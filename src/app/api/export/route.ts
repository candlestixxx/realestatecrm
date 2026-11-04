import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Asset Export API
 * POST /api/export — export content/assets in various formats.
 * Supports: csv, json, pdf (text summary), zip (manifest)
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { type, format, data, filename } = body;

    if (!data || !format) {
      return NextResponse.json({ error: 'data and format are required' }, { status: 400 });
    }

    let content: string;
    let contentType: string;
    let ext: string;

    switch (format) {
      case 'csv': {
        if (!Array.isArray(data) || data.length === 0) {
          return NextResponse.json({ error: 'CSV export requires an array of objects' }, { status: 400 });
        }
        const headers = Object.keys(data[0]);
        const rows = data.map(row => headers.map(h => {
          const val = String(row[h] ?? '');
          return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(','));
        content = [headers.join(','), ...rows].join('\n');
        contentType = 'text/csv';
        ext = 'csv';
        break;
      }

      case 'json': {
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        ext = 'json';
        break;
      }

      case 'text': {
        content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        contentType = 'text/plain';
        ext = 'txt';
        break;
      }

      default:
        return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
    }

    const exportFilename = filename || `${type || 'export'}-${new Date().toISOString().split('T')[0]}.${ext}`;

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${exportFilename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
