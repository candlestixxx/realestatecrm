# Deployment

## Setup Instructions

1. Install dependencies:
   `npm install`

2. Generate Prisma client:
   `npx prisma generate`

3. Setup environment variables (copy `.env.example` to `.env`).

### Environment Setup
If you are planning to deploy with Pinecone as your hosted vector provider, be sure to set the following in your deployment environment variables:
- `PINECONE_API_KEY`
- `PINECONE_NAMESPACE` (optional)

### Environment Setup
If you are planning to deploy with Pinecone as your hosted vector provider, be sure to set the following in your deployment environment variables:
- `PINECONE_API_KEY`
- `PINECONE_NAMESPACE` (optional)

_Note: Detailed deployment steps will be fleshed out once the TypeScript scaffold is fully implemented._
