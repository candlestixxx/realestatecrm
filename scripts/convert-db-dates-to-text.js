const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // We can query all records raw, parse their dates, and write them back raw to ensure type affinity is TEXT.
  const leads = await prisma.$queryRawUnsafe(`SELECT id, createdAt, updatedAt FROM Lead`);
  console.log(`Processing ${leads.length} leads...`);

  for (const lead of leads) {
    let dateVal = lead.createdAt;
    if (typeof dateVal === 'number') {
      dateVal = new Date(dateVal);
    } else if (typeof dateVal === 'string' && !isNaN(Number(dateVal))) {
      dateVal = new Date(Number(dateVal));
    } else {
      dateVal = new Date(dateVal);
    }
    
    let updatedDateVal = lead.updatedAt;
    if (typeof updatedDateVal === 'number') {
      updatedDateVal = new Date(updatedDateVal);
    } else if (typeof updatedDateVal === 'string' && !isNaN(Number(updatedDateVal))) {
      updatedDateVal = new Date(Number(updatedDateVal));
    } else {
      updatedDateVal = new Date(updatedDateVal);
    }

    const isoStr = dateVal.toISOString();
    const updatedIsoStr = updatedDateVal.toISOString();

    await prisma.$executeRawUnsafe(
      `UPDATE Lead SET createdAt = ?, updatedAt = ? WHERE id = ?`,
      isoStr,
      updatedIsoStr,
      lead.id
    );
  }

  // Do the same for Contact table
  const contacts = await prisma.$queryRawUnsafe(`SELECT id, createdAt, updatedAt FROM Contact`);
  console.log(`Processing ${contacts.length} contacts...`);

  for (const contact of contacts) {
    let dateVal = contact.createdAt;
    if (typeof dateVal === 'number') {
      dateVal = new Date(dateVal);
    } else if (typeof dateVal === 'string' && !isNaN(Number(dateVal))) {
      dateVal = new Date(Number(dateVal));
    } else {
      dateVal = new Date(dateVal);
    }
    
    let updatedDateVal = contact.updatedAt;
    if (typeof updatedDateVal === 'number') {
      updatedDateVal = new Date(updatedDateVal);
    } else if (typeof updatedDateVal === 'string' && !isNaN(Number(updatedDateVal))) {
      updatedDateVal = new Date(Number(updatedDateVal));
    } else {
      updatedDateVal = new Date(updatedDateVal);
    }

    const isoStr = dateVal.toISOString();
    const updatedIsoStr = updatedDateVal.toISOString();

    await prisma.$executeRawUnsafe(
      `UPDATE Contact SET createdAt = ?, updatedAt = ? WHERE id = ?`,
      isoStr,
      updatedIsoStr,
      contact.id
    );
  }

  console.log('Conversion complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
