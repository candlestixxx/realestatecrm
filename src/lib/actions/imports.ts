'use server';

import { getServerSession } from 'next-auth/next';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import { AppRole, isAtLeastRole } from '@/lib/permissions';

export type ImportResult = {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  total: number;
};

type CsvRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  source: string;
  status: string;
  listType: string;
};

/**
 * Parse a CSV text into structured rows.
 * Handles quoted fields and common MyPlus CSV formats.
 */
function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Detect header row and map columns
  const headerLine = lines[0].toLowerCase();
  const headers = parseCsvLine(lines[0]);

  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = h.toLowerCase().replace(/[^a-z]/g, '');
    if (['name', 'fullname', 'leadname', 'borrowername', 'mortgagorname'].includes(key)) colMap['name'] = i;
    else if (['firstname', 'first', 'fname'].includes(key)) colMap['firstName'] = i;
    else if (['lastname', 'last', 'lname'].includes(key)) colMap['lastName'] = i;
    else if (['email', 'emailaddress', 'e-mail'].includes(key)) colMap['email'] = i;
    else if (['phone', 'phonenumber', 'phone number', 'cell', 'homephone'].includes(key)) colMap['phone'] = i;
    else if (['address', 'propertyaddress', 'property address', 'street', 'siteaddress'].includes(key)) colMap['address'] = i;
    else if (['city'].includes(key)) colMap['city'] = i;
    else if (['state'].includes(key)) colMap['state'] = i;
    else if (['zip', 'zipcode', 'postalcode'].includes(key)) colMap['zip'] = i;
    else if (['source', 'sourceinfo', 'leadsource'].includes(key)) colMap['source'] = i;
    else if (['status', 'leadstatus'].includes(key)) colMap['status'] = i;
    else if (['listtype', 'type', 'category'].includes(key)) colMap['listType'] = i;
  });

  if (Object.keys(colMap).length === 0) {
    // No recognizable headers — assume raw data lines
    // Try to parse simple format: name,address,city,state,zip
    headers.forEach((h, i) => {
      if (i === 0) colMap['name'] = i;
      if (i === 1) colMap['address'] = i;
      if (i === 2) colMap['city'] = i;
      if (i === 3) colMap['state'] = i;
      if (i === 4) colMap['zip'] = i;
    });
  }

  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);

    const row: Partial<CsvRow> = {};
    let hasData = false;

    for (const [field, idx] of Object.entries(colMap)) {
      const val = (values[idx] || '').trim();
      if (val) hasData = true;
      (row as any)[field] = val;
    }

    if (!hasData) continue;

    // Parse name field into first/last if needed
    if (row.name && !row.firstName && !row.lastName) {
      const parts = row.name.split(/\s+/);
      row.firstName = parts[0] || '';
      row.lastName = parts.slice(1).join(' ') || '';
    }

    // Build full address
    const addrParts = [row.address, row.city, row.state, row.zip].filter(Boolean);
    const fullAddress = addrParts.length > 0 ? addrParts.join(', ') : '';

    // Determine lead status from list type
    let status = row.status || 'NEW';
    const listType = (row.listType || row.source || '').toLowerCase();
    if (listType.includes('expired') || listType.includes('exp')) status = 'EXPIRED';
    else if (listType.includes('fsbo') || listType.includes('forsalebyowner')) status = 'FSBO';
    else if (listType.includes('preforeclosure') || listType.includes('pre') || listType.includes('foreclosure')) status = 'PREFORECLOSURE';

    rows.push({
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      email: row.email || '',
      phone: row.phone || '',
      address: fullAddress,
      city: row.city || '',
      state: row.state || '',
      zip: row.zip || '',
      source: row.source || `MyPlus ${listType || 'Import'}`,
      status,
      listType: row.listType || listType || '',
    });
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export async function importCsvAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  const file = formData.get('file') as File | null;
  const listType = (formData.get('listType') as string) || 'Expired';

  if (!file) {
    return { error: 'No CSV file provided.' };
  }

  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length === 0) {
    return { error: 'No valid rows found in CSV. Check the file format.' };
  }

  const result: ImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
    total: rows.length,
  };

  const workspaceId = access.workspaceId;

  for (const row of rows) {
    try {
      if (!row.firstName && !row.lastName && !row.email && !row.phone) {
        result.skipped++;
        continue;
      }

      // Check for existing contact by email or phone to avoid duplicates
      const existingContact = await prisma.contact.findFirst({
        where: {
          workspaceId,
          OR: [
            row.email ? { email: row.email } : {},
            row.phone ? { phone: row.phone } : {},
          ].filter(o => Object.keys(o).length > 0),
        },
      });

      if (existingContact) {
        // Lead already exists — update source/tags if needed
        const existingLead = await prisma.lead.findFirst({
          where: { contactId: existingContact.id, workspaceId },
        });
        if (existingLead) {
          result.skipped++;
          continue;
        }
        // Contact exists but no lead — create lead for existing contact
        await prisma.lead.create({
          data: {
            type: row.source?.toLowerCase().includes('seller') ? 'SELLER' : 'BUYER',
            source: row.source || `MyPlus ${listType}`,
            status: row.status || 'NEW',
            score: 50,
            tags: listType.toLowerCase(),
            workspaceId,
            contactId: existingContact.id,
          },
        });
        result.imported++;
        continue;
      }

      // Create contact
      const contact = await prisma.contact.create({
        data: {
          firstName: row.firstName || 'Unknown',
          lastName: row.lastName || '',
          email: row.email || null,
          phone: row.phone || null,
          address: row.address || null,
          workspaceId,
        },
      });

      // Create lead
      await prisma.lead.create({
        data: {
          type: row.source?.toLowerCase().includes('seller') ? 'SELLER' : 'BUYER',
          source: row.source || `MyPlus ${listType}`,
          status: row.status || 'NEW',
          score: 50,
          tags: listType.toLowerCase(),
          workspaceId,
          contactId: contact.id,
        },
      });

      result.imported++;
    } catch (err) {
      console.error('CSV import row error:', err);
      result.errors.push(`Row ${result.imported + result.skipped + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // Auto-create/update segment for this list type
  try {
    const segmentName = `MyPlus ${listType}`;
    const existingSegment = await prisma.segment.findFirst({
      where: { name: segmentName, workspaceId },
    });

    if (!existingSegment) {
      await prisma.segment.create({
        data: {
          name: segmentName,
          description: `Auto-created from MyPlus ${listType} CSV import`,
          filters: JSON.stringify({ tags: { contains: listType.toLowerCase() } }),
          isPinned: true,
          workspaceId,
        },
      });
    }
  } catch (err) {
    console.error('Segment creation error:', err);
  }

  revalidatePath('/dashboard/leads');
  revalidatePath('/dashboard/segments');

  return result;
}

export async function quickAddLeadAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);

  if (!isAtLeastRole(access.workspaceRole, AppRole.REALTOR_AGENT)) {
    return { error: 'Insufficient permissions.' };
  }

  const firstName = (formData.get('firstName') as string)?.trim() || '';
  const lastName = (formData.get('lastName') as string)?.trim() || '';
  const email = (formData.get('email') as string)?.trim() || '';
  const phone = (formData.get('phone') as string)?.trim() || '';
  const address = (formData.get('address') as string)?.trim() || '';
  const source = (formData.get('source') as string)?.trim() || 'MyPlus Quick Add';
  const notes = (formData.get('notes') as string)?.trim() || '';
  const listType = (formData.get('listType') as string)?.trim() || '';

  if (!firstName && !lastName && !email && !phone) {
    return { error: 'At least a name, email, or phone is required.' };
  }

  try {
    // Check for existing contact
    const existingContact = await prisma.contact.findFirst({
      where: {
        workspaceId: access.workspaceId,
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
        ].filter(o => Object.keys(o).length > 0),
      },
    });

    let contactId: string;

    if (existingContact) {
      contactId = existingContact.id;
    } else {
      const contact = await prisma.contact.create({
        data: {
          firstName: firstName || 'Unknown',
          lastName: lastName || '',
          email: email || null,
          phone: phone || null,
          address: address || null,
          workspaceId: access.workspaceId,
        },
      });
      contactId = contact.id;
    }

    // Check if lead already exists for this contact
    const existingLead = await prisma.lead.findFirst({
      where: { contactId, workspaceId: access.workspaceId },
    });

    if (existingLead) {
      return { error: 'A lead for this contact already exists.' };
    }

    let status = 'NEW';
    const listLower = listType.toLowerCase();
    if (listLower.includes('expired')) status = 'EXPIRED';
    else if (listLower.includes('fsbo')) status = 'FSBO';
    else if (listLower.includes('preforeclosure') || listLower.includes('foreclosure')) status = 'PREFORECLOSURE';

    const lead = await prisma.lead.create({
      data: {
        type: 'SELLER',
        source: `${source}`,
        status,
        score: 50,
        tags: listType.toLowerCase() || null,
        workspaceId: access.workspaceId,
        contactId,
      },
    });

    // Add note if provided
    if (notes) {
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          content: notes,
          workspaceId: access.workspaceId,
          leadId: lead.id,
        },
      });
    }

    revalidatePath('/dashboard/leads');
    return { success: true, leadId: lead.id };
  } catch (err) {
    console.error('Quick add lead error:', err);
    return { error: 'Failed to add lead.' };
  }
}

export type ImportHistoryEntry = {
  timestamp: string;
  listType: string;
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  fileName: string;
};
