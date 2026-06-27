# Deployment & Configuration

## Local Environment Setup
1. **Dependencies:** Install all dependencies utilizing the legacy peer deps flag to avoid \`@ai-sdk\` vs \`zod\` peer conflicts:
   \`\`\`bash
   npm ci --legacy-peer-deps
   \`\`\`
   *(If \`package-lock.json\` is out of sync, use \`npm install --legacy-peer-deps\` to resolve).*

2. **Database:**
   - Ensure the `.env` file maps `DATABASE_URL` to the local SQLite database for development (`file:./dev.db`).
   - Run the initial migrations to construct the schema baseline:
     \`\`\`bash
     npx prisma migrate dev
     npx prisma generate
     \`\`\`

3. **Required Environment Variables (`.env`):**
   - \`NEXTAUTH_SECRET\` (Use \`openssl rand -base64 32\` to generate)
   - \`NEXTAUTH_URL\` (e.g., \`http://localhost:3000\`)
   - \`DATABASE_URL\` (e.g., \`file:./dev.db\`)

4. **Hosted Integrations (Optional but Recommended):**
   - \`PINECONE_API_KEY\` / \`PINECONE_NAMESPACE\`: For hosted RAG Vector Db functionality.
   - \`OPENAI_API_KEY\`: For foundational AI Chat functions.
   - \`TWILIO_ACCOUNT_SID\`, \`TWILIO_AUTH_TOKEN\`, \`TWILIO_PHONE_NUMBER\`: For SMS Drip integrations.
   - \`SENDGRID_API_KEY\`, \`SENDGRID_FROM_EMAIL\`: For Email Drip integrations.

## Production Deployment Server
1. Clone the repository and execute `npm ci --legacy-peer-deps`.
2. Map your production `.env` securely.
3. Run \`npm run build\`.
4. Start the server using a process manager like PM2:
   \`\`\`bash
   pm2 start npm --name "crm" -- start
   \`\`\`

### Note on Migrations
Due to a previous migration history baselining (v0.47.0), **do not run \`npx prisma db push\`** to update databases. Always use:
\`\`\`bash
npx prisma migrate deploy
\`\`\`
This ensures production databases respect the initialized migration state without data loss.
