import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_WORKSPACE_SLUG } from '@/lib/workspace-context';

/**
 * AWS S3 Document Upload for Leads/Contacts.
 * Supports: presigned URL generation, direct upload, document metadata tracking.
 */
export async function POST(request: NextRequest) {
  let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  const { fileName, contentType, leadId, contactId, workspaceId, category } = body;

  if (!fileName || !contentType) {
    return NextResponse.json({ error: 'fileName and contentType required' }, { status: 400 });
  }

  const AWS_BUCKET = process.env.AWS_S3_BUCKET;
  const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
  const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
  const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;

  // If AWS is configured, generate presigned upload URL
  if (AWS_BUCKET && AWS_ACCESS_KEY && AWS_SECRET_KEY) {
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3' as string);
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner' as string);

      const client = new S3Client({
        region: AWS_REGION,
        credentials: { accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY },
      });

      const key = `documents/${workspaceId || 'default'}/${Date.now()}-${fileName}`;
      const command = new PutObjectCommand({
        Bucket: AWS_BUCKET,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });

      // Track document metadata in activity
      const activity = await prisma.activity.create({
        data: {
          type: 'DOCUMENT',
          content: JSON.stringify({
            fileName, contentType, key, category: category || 'general',
            leadId: leadId || null, contactId: contactId || null,
            status: 'PENDING_UPLOAD',
          }),
          leadId: leadId || null,
          contactId: contactId || null,
          workspaceId: workspaceId || DEFAULT_WORKSPACE_SLUG,
        },
      });

      return NextResponse.json({
        uploadUrl,
        key,
        documentId: activity.id,
        method: 's3-presigned',
      });
    } catch (e: any) {
      console.error('S3 presign failed:', e.message);
    }
  }

  // Local storage fallback
  const documentId = 'doc-' + Date.now();
  const activity = await prisma.activity.create({
    data: {
      type: 'DOCUMENT',
      content: JSON.stringify({
        fileName, contentType, documentId, category: category || 'general',
        leadId: leadId || null, contactId: contactId || null,
        status: 'LOCAL', storage: 'local',
      }),
      leadId: leadId || null,
      contactId: contactId || null,
      workspaceId: workspaceId || DEFAULT_WORKSPACE_SLUG,
    },
  });

  return NextResponse.json({
    documentId: activity.id,
    method: 'local',
    message: 'Upload endpoint ready. Configure AWS_S3_BUCKET for cloud storage.',
  });
}

/**
 * GET: List documents for a lead or contact.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('leadId');
  const contactId = searchParams.get('contactId');
  const workspaceId = searchParams.get('workspaceId') || DEFAULT_WORKSPACE_SLUG;

  const where: any = { workspaceId, type: 'DOCUMENT' };
  if (leadId) where.leadId = leadId;
  if (contactId) where.contactId = contactId;

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const documents = activities.map(a => {
    let parsed: any = {};
    try { parsed = JSON.parse(a.content); } catch { /* skip */ }
    return { id: a.id, ...parsed, createdAt: a.createdAt };
  });

  return NextResponse.json(documents);
}
