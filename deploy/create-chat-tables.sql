-- Create missing chat tables in deployed SQLite
CREATE TABLE IF NOT EXISTS "ChatRoom" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "type" TEXT NOT NULL DEFAULT 'DIRECT',
  "workspaceId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE,
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ChatRoom_workspaceId_type_idx" ON "ChatRoom"("workspaceId", "type");

CREATE TABLE IF NOT EXISTS "ChatParticipant" (
  "id" TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ChatParticipant_roomId_userId_key" ON "ChatParticipant"("roomId", "userId");

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT PRIMARY KEY,
  "roomId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE,
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");
