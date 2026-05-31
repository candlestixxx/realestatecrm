# 01 — Lofty API Setup & Authentication Guide

## Critical: Auth Prefix

Lofty API keys are **JWS/JWT tokens** (not static strings). This is normal.

```
Authorization: token <YOUR_API_KEY>
```

**DO NOT use `Bearer`.** Using `Bearer` returns:
```json
{ "code": 200058, "message": "User in token does not exist." }
```

This is documented at: https://developer.lofty.com/authentication/api-keys

## Where to Get Your API Key

1. Log into **Lofty** (https://app.lofty.com)
2. Go to **Settings** (scroll to the bottom of the left sidebar)
3. Click **Integrations → API Keys**
4. Click **Create API Key**
   - **Name:** e.g. "RealEstateCRM"
   - **Description:** Optional
   - **Expiration:** Optional (set to 1 year recommended)
   - Check the **API Usage Acknowledgment** box
5. Click **Save**
6. **Copy the key immediately** — it is shown ONCE and requires 2FA to view again

## Key Properties

| Property | Value |
|----------|-------|
| Format | JWS/JWT token |
| Auth header | `Authorization: token <KEY>` |
| Scope | THIRD_PARTY_OPERATION |
| Max active keys | 10 |
| Expiration | Configurable at creation |
| Revocation | Immediate, permanent, via Settings |

## Testing Your Key

### Option A: Run the test script

```bash
cd /mnt/c/Users/jakeg/workspace/realestatecrm
python3 scripts/test-lofty-key.py
```

Expected output when working:
```
Key length: 160+
Key prefix: eyJhbG...
Lofty API response:
  HTTP Status: 200
  Code: 0
  Message: success
  Leads found: 0
```

### Option B: curl test

```bash
curl -s https://api.lofty.com/v1.0/leads?keyword=test \
  -H "Authorization: token YOUR_KEY_HERE" \
  -H "Content-Type: application/json" | python3 -m json.tool
```

Expected:
```json
{
  "code": 0,
  "message": "success",
  "data": { "leads": [] }
}
```

### Option C: Node.js test

```javascript
const res = await fetch('https://api.lofty.com/v1.0/leads?keyword=test', {
  headers: {
    'Authorization': 'token YOUR_KEY_HERE',
    'Content-Type': 'application/json'
  }
});
const body = await res.json();
console.log(body); // { code: 0, message: "success", data: { leads: [] } }
```

## Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| 0 | Success | — |
| 20004 | Bad credentials | Key is invalid or expired. Create a new one. |
| 200058 | User in token does not exist | Wrong auth prefix (`Bearer` instead of `token`) OR key is for a different account |
| 403 Forbidden | Wrong API version | Use `/v1.0/` not `/v1/` |

## Adding the Key to the App

Edit `.env.local` in the project root:

```
LOFTY_API_KEY=paste-your-full-key-here
LOFTY_API_BASE=https://api.lofty.com/v1.0
```

**IMPORTANT:** The key must be pasted manually — security redactors in automated tools will truncate it.

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1.0/leads?keyword=<name>` | GET | Search leads by name/email |
| `/v1.0/leads/<id>` | GET | Get specific lead |
| `/v1.0/contacts/<id>/tags` | POST | Add tags to contact |

## Response Envelope

All Lofty API responses follow this format:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "leads": [
      {
        "id": "12345",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "555-1234",
        "tags": ["PREFORECLOSURE"],
        "source": "MyPlus"
      }
    ]
  }
}
```

Check `body.code !== 0` for errors even when HTTP status is 200.

## Code Reference

- Service: `src/lib/integrations/lofty.ts`
- Auth header: `getHeaders(apiKey)` → `Authorization: token ${apiKey}`
- Search: `searchLoftyContactStrict(apiKey, query)`
- Verify: `verifyLeadInLofty(apiKey, firstName, lastName)`
- Tags: `addTagsToLoftyContact(apiKey, contactId, tags)`
