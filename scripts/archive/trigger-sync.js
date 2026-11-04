const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

function encodePassword(password) {
  return crypto.createHash('sha1').update(password).digest('base64');
}

async function main() {
  const integration = await prisma.myPlusLeadsIntegration.findFirst({
    where: { isActive: true }
  });

  if (!integration) {
    console.log('No active integration found.');
    return;
  }

  console.log(`Testing sync for: ${integration.email}, Last ID: ${integration.lastID}`);

  try {
    // 1. Authenticate
    const password = encodePassword(integration.password);
    console.log('Authenticating...');
    const authRes = await fetch('https://api.myplusleads.com/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: integration.email, password })
    });

    if (!authRes.ok) {
      console.error(`Auth failed: ${authRes.statusText}`);
      return;
    }

    const authData = await authRes.json();
    const token = authData.authenticatedToken;
    console.log('Auth success. Token retrieved.');

    // 2. Fetch
    let url = `https://api.myplusleads.com/listings?isForUser=true`;
    if (integration.lastID) {
      url += `&startID=${integration.lastID}`;
    }
    console.log(`Fetching url: ${url}`);

    const listRes = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: token,
        Accept: 'application/json'
      }
    });

    if (!listRes.ok) {
      console.error(`Fetch failed: ${listRes.status} ${listRes.statusText}`);
      try {
        console.log(await listRes.text());
      } catch {}
      return;
    }

    const listData = await listRes.json();
    console.log('Fetch listings response:');
    console.log(`Success: ${listData.result?.success}`);
    console.log(`Listings count: ${listData.listings?.length || 0}`);
    console.log(`Min ID: ${listData.result?.minID}, Max ID: ${listData.result?.maxID}, Last ID: ${listData.result?.lastID}`);

  } catch (err) {
    console.error('Error during sync:', err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
