import crypto from 'crypto';

const API_BASE = 'https://api.myplusleads.com';

/**
 * Hashes the password using SHA-1 and returns it as a Base64 string,
 * exactly as required by the MyPlusLeads API documentation.
 */
function encodePassword(password: string): string {
  return crypto.createHash('sha1').update(password).digest('base64');
}

/**
 * Exchanges the email and raw password for a single-use authentication token.
 */
export async function authenticate(email: string, passwordRaw: string): Promise<string> {
  const password = encodePassword(passwordRaw);

  const res = await fetch(`${API_BASE}/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`MyPlusLeads authentication failed: ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.authenticatedToken) {
    throw new Error('No authenticatedToken returned from MyPlusLeads');
  }

  return data.authenticatedToken;
}

export type MPLListing = {
  listingId: number;
  processedDate: string;
  propertyAddress: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
  };
  propertyDetails?: {
    status?: string;
    normalizedStatus?: string;
    price?: string;
    bedrooms?: string;
    bathrooms?: string;
    square_footage?: string;
    yearBuilt?: string;
    mlsNumber?: string;
  };
  owner?: {
    name?: string;
    firstName?: string;
    lastName?: string;
  };
  contact1?: {
    name?: string;
    phone1?: string;
    email?: string;
  };
};

export type MPLResponse = {
  result: {
    success: string;
    minID: string;
    maxID: string;
    lastID: string;
  };
  listings: MPLListing[];
};

/**
 * Fetches listings starting from a specific startID.
 */
export async function fetchListings(token: string, startID?: string | null): Promise<MPLResponse> {
  let url = `${API_BASE}/listings?isForUser=true`;
  if (startID) {
    url += `&startID=${startID}`;
  } else {
    // If no startID, we might want to default to today so we don't pull their entire history
    const today = new Date().toISOString().split('T')[0] + ' 00:00:00';
    url += `&dateFrom=${encodeURIComponent(today)}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: token,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch MyPlusLeads listings: ${res.statusText}`);
  }

  return await res.json();
}
