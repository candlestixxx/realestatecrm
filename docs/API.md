# Excel Legacy Real Estate CRM - API Documentation

## Property Listings API

The Property Listings API allows retrieving synchronized MLS/RESO data endpoints. These routes are protected and require NextAuth session cookies tied to the active Workspace.

### `GET /api/listings`

Retrieves a paginated list of property listings for the active workspace.

**Query Parameters:**
* `status` (optional): Filter properties by their MLS standard status (e.g., `ACTIVE`, `PENDING`, `CLOSED`).

**Response (`200 OK`):**
```json
{
  "listings": [
    {
      "id": "cuid...",
      "workspaceId": "...",
      "mlsNumber": "12345678",
      "source": "RESO",
      "address": "123 Elm St",
      "city": "Detroit",
      "state": "MI",
      "zip": "48201",
      "price": 350000,
      "bedrooms": 4,
      "bathroomsFull": 2,
      "bathroomsHalf": 1,
      "squareFeet": 2400,
      "yearBuilt": 1995,
      "propertyType": "Residential",
      "status": "ACTIVE",
      "description": "Beautiful brick colonial...",
      "images": "[\"https://s3...\", \"https://s3...\"]",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### `GET /api/listings/[id]`

Retrieves a single property listing by its internal CUID.

**Response (`200 OK`):**
```json
{
  "listing": {
    "id": "cuid...",
    "mlsNumber": "12345678",
    // ... remaining listing fields
  }
}
```

**Error Responses:**
* `401 Unauthorized`: No active session or missing Workspace access.
* `404 Not Found`: Listing does not exist or does not belong to the user's workspace.
