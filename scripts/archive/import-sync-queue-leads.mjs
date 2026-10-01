import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting sync-queue leads import...');

  // 1. Get workspace
  const workspace = await prisma.workspace.findFirst({
    where: { id: 'excel-legacy-team' }
  });
  if (!workspace) {
    console.error('Workspace "excel-legacy-team" not found. Please run prisma db seed first.');
    process.exit(1);
  }
  const workspaceId = workspace.id;

  // 2. Load users to map names
  const users = await prisma.user.findMany();
  const userMap = new Map(); // name -> id
  users.forEach(u => {
    if (u.name) {
      userMap.set(u.name.toLowerCase(), u.id);
    }
  });

  // Default agent if not matched
  const defaultAgentId = userMap.get('universal admin') || users[0]?.id || null;

  // 3. Read sync-queue.json
  const filePath = path.join(process.cwd(), 'data', 'sync-queue.json');
  let fileContent;
  try {
    fileContent = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    console.error('Failed to read sync-queue.json:', err.message);
    process.exit(1);
  }

  const parsed = JSON.parse(fileContent);
  const items = parsed.items || [];
  console.log(`Found ${items.length} items in sync-queue.json`);

  let contactCreatedCount = 0;
  let leadCreatedCount = 0;
  let skippedCount = 0;

  for (const item of items) {
    // Check if the lead or contact already exists in database
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [
          { id: item.leadId },
          { contact: { phone: item.phone, firstName: item.firstName, lastName: item.lastName } }
        ]
      }
    });

    if (existingLead) {
      skippedCount++;
      continue;
    }

    // Map agent
    let userId = defaultAgentId;
    if (item.assignedAgent) {
      const matchedId = userMap.get(item.assignedAgent.toLowerCase());
      if (matchedId) {
        userId = matchedId;
      }
    }

    // Determine contact fields
    const contactId = item.contactId || `ct_${Math.random().toString(36).substr(2, 9)}`;
    const leadId = item.leadId || `ld_${Math.random().toString(36).substr(2, 9)}`;
    const phone = item.phone || item.phones?.[0] || null;
    const additionalPhones = item.phones && item.phones.length > 1
      ? JSON.stringify(item.phones.slice(1))
      : null;

    try {
      // Create contact
      await prisma.contact.create({
        data: {
          id: contactId,
          firstName: item.firstName || 'Unknown',
          lastName: item.lastName || '',
          email: item.email || null,
          phone: phone,
          address: item.address || item.propertyAddress || null,
          additionalPhones,
          workspaceId,
          userId,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        }
      });
      contactCreatedCount++;

      // Create lead
      await prisma.lead.create({
        data: {
          id: leadId,
          type: 'SELLER',
          source: item.source || 'MyPlusLeads',
          status: 'NEW', // Default status in CRM
          score: 70,
          workspaceId,
          contactId,
          userId,
          tags: item.status === 'SYNCED' ? 'synced-import' : 'sync-queued',
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        }
      });
      leadCreatedCount++;

      // Create activity note
      await prisma.activity.create({
        data: {
          type: 'NOTE',
          content: `📥 Imported from sync-queue.json\nOriginal Status: ${item.status}\nLofty Contact ID: ${item.loftyContactId || 'None'}`,
          workspaceId,
          leadId,
          contactId,
          userId,
        }
      });
    } catch (dbErr) {
      console.error(`Failed to import ${item.firstName} ${item.lastName}:`, dbErr.message);
    }
  }

  console.log('\n--- IMPORT COMPLETED ---');
  console.log(`Contacts Created: ${contactCreatedCount}`);
  console.log(`Leads Created: ${leadCreatedCount}`);
  console.log(`Skipped (already exist): ${skippedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
