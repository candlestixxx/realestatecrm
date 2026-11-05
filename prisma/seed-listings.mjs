import { PrismaClient } from "@prisma/client";

// Idempotent demo-home seeder: homes ARE the inventory, inventory IS money.
// Upserts Listings by mlsNumber + ensures a matching Deal (value = price)
// so the deals pipeline reflects live listing dollars.
// Safe to run repeatedly; never wipes anything.

const prisma = new PrismaClient();

const HOMES = [
  { mlsNumber: "EXL-1001", status: "ACTIVE", listPrice: 425000, address: "123 Elm St", city: "Sterling Heights", state: "MI", zip: "48313", bedrooms: 4, bathrooms: 2.5, squareFeet: 2400, lotSize: 0.32, yearBuilt: 1998, propertyType: "SINGLE_FAMILY", description: "Brick colonial on a quiet cul-de-sac. Updated kitchen, finished basement, 2-car garage.", seller: { firstName: "Robert", lastName: "Smith", email: "rsmith@example.com", phone: "555-0101" } },
  { mlsNumber: "EXL-1002", status: "ACTIVE", listPrice: 289000, address: "456 Oak Ave", city: "Warren", state: "MI", zip: "48089", bedrooms: 3, bathrooms: 2, squareFeet: 1650, lotSize: 0.25, yearBuilt: 1975, propertyType: "SINGLE_FAMILY", description: "Charming ranch with new roof (2023), hardwood floors, big fenced yard.", seller: { firstName: "Linda", lastName: "Garcia", email: "lgarcia@example.com", phone: "555-0102" } },
  { mlsNumber: "EXL-1003", status: "PENDING", listPrice: 510000, address: "789 Pine Rd", city: "Troy", state: "MI", zip: "48083", bedrooms: 4, bathrooms: 3, squareFeet: 2900, lotSize: 0.41, yearBuilt: 2005, propertyType: "SINGLE_FAMILY", description: "Two-story with open floor plan, granite kitchen, primary suite with walk-in closet.", seller: { firstName: "James", lastName: "Wong", email: "jwong@example.com", phone: "555-0103" } },
  { mlsNumber: "EXL-1004", status: "ACTIVE", listPrice: 235000, address: "321 Maple Dr #4B", city: "Royal Oak", state: "MI", zip: "48067", bedrooms: 2, bathrooms: 2, squareFeet: 1150, lotSize: null, yearBuilt: 1988, propertyType: "CONDO", description: "Top-floor condo near downtown. In-unit laundry, covered parking, low HOA.", seller: { firstName: "Priya", lastName: "Patel", email: "ppatel@example.com", phone: "555-0104" } },
  { mlsNumber: "EXL-1005", status: "PENDING", listPrice: 675000, address: "654 Birch Ln", city: "Shelby Township", state: "MI", zip: "48316", bedrooms: 5, bathrooms: 3.5, squareFeet: 3600, lotSize: 0.55, yearBuilt: 2015, propertyType: "SINGLE_FAMILY", description: "Newer build with 3-car garage, home office, deck overlooking woods.", seller: { firstName: "Thomas", lastName: "Novak", email: "tnovak@example.com", phone: "555-0105" } },
  { mlsNumber: "EXL-1006", status: "SOLD", listPrice: 389000, soldPrice: 395000, address: "987 Cedar Ct", city: "Sterling Heights", state: "MI", zip: "48314", bedrooms: 3, bathrooms: 2.5, squareFeet: 2100, lotSize: 0.3, yearBuilt: 2001, propertyType: "SINGLE_FAMILY", description: "Sold over asking. Colonial with sunroom, finished basement, pool.", seller: { firstName: "Karen", lastName: "Brown", email: "kbrown@example.com", phone: "555-0106" } }
];

const STAGE = { ACTIVE: "ACTIVE", PENDING: "UNDER_CONTRACT", SOLD: "CLOSED" };

async function main() {
  let workspace = await prisma.workspace.findFirst({ orderBy: { createdAt: "asc" } });
  if (!workspace) {
    workspace = await prisma.workspace.create({ data: { id: "excel-legacy-team", name: "Excel Legacy Realty Group" } });
  }
  console.log("Workspace: " + workspace.id);
  let dealsMade = 0;
  for (const h of HOMES) {
    const seller = h.seller;
    const data = Object.assign({}, h);
    delete data.seller;
    delete data.soldPrice;
    let contact = await prisma.contact.findFirst({ where: { email: seller.email, workspaceId: workspace.id } });
    if (!contact) {
      contact = await prisma.contact.create({ data: { firstName: seller.firstName, lastName: seller.lastName, email: seller.email, phone: seller.phone, workspaceId: workspace.id } });
    }
    const listing = await prisma.listing.upsert({
      where: { mlsNumber: h.mlsNumber },
      update: { status: h.status, listPrice: h.listPrice, soldPrice: h.soldPrice || null, sellerContactId: contact.id, workspaceId: workspace.id },
      create: Object.assign({}, data, { soldPrice: h.soldPrice || null, sellerContactId: contact.id, workspaceId: workspace.id, listDate: new Date() })
    });
    const title = h.address + " Listing";
    const existing = await prisma.deal.findFirst({ where: { title: title, workspaceId: workspace.id } });
    if (!existing) {
      await prisma.deal.create({ data: { title: title, value: h.soldPrice || h.listPrice, stage: STAGE[h.status], workspaceId: workspace.id, contactId: contact.id } });
      dealsMade++;
    }
    console.log(" - " + listing.mlsNumber + " " + listing.address + " [" + listing.status + "] $" + (listing.soldPrice || listing.listPrice || 0).toLocaleString());
  }
  console.log("Done. listings upserted: " + HOMES.length + ", deals created: " + dealsMade);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());