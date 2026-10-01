const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activities = await prisma.activity.findMany({
    where: {
      type: 'NOTE',
      lead: {
        source: 'MyPlusLeads'
      }
    },
    include: {
      lead: {
        include: {
          contact: true
        }
      }
    }
  });

  console.log(`Reformatting ${activities.length} MyPlusLeads activity notes...`);

  for (const act of activities) {
    const contact = act.lead.contact;
    const content = act.content;
    
    // Check if it already has 'Detailed Summary:' to avoid double formatting
    if (content.includes('Detailed Summary:')) continue;

    // Parse existing lines
    const lines = content.split('\n');
    let listPrice = '';
    const phones = [];
    let remarks = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('Listing Price:')) {
        listPrice = trimmed.replace('Listing Price: $', '').replace('Listing Price:', '').trim();
      } else if (trimmed.startsWith('Contact 1 Phone 1:')) {
        phones.push({ label: 'Contact 1 Phone 1', value: trimmed.split(':')[1].split('(')[0].trim(), type: 'Cell' });
      } else if (trimmed.startsWith('Contact 1 Phone 2:')) {
        phones.push({ label: 'Contact 1 Phone 2', value: trimmed.split(':')[1].split('(')[0].trim(), type: 'Landline' });
      } else if (trimmed.startsWith('Contact 2 Phone 1:')) {
        phones.push({ label: 'Contact 2 Phone 1', value: trimmed.split(':')[1].split('(')[0].trim(), type: 'Cell' });
      } else if (trimmed.startsWith('Remarks:')) {
        remarks = trimmed.replace('Remarks:', '').trim();
      }
    }

    let newContent = `Detailed Summary: ${contact.firstName} ${contact.lastName || ''} is a new lead from MyPlusLeads.\n`;
    if (contact.address) {
      newContent += `Property Address: ${contact.address}\n`;
    }
    if (listPrice) {
      newContent += `Listing Price: ${listPrice}\n`;
    }
    
    newContent += `Contact 1 Name: ${contact.firstName} ${contact.lastName || ''}\n`;
    
    for (const phone of phones) {
      newContent += `${phone.label}: ${phone.value}\n`;
      newContent += `${phone.label} Line Type: ${phone.type}\n`;
    }

    if (remarks) {
      newContent += `Remarks: ${remarks}\n`;
    }

    await prisma.activity.update({
      where: { id: act.id },
      data: {
        content: newContent.trim()
      }
    });
  }

  console.log('Reformat complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
