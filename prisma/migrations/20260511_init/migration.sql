-- CreateEnum
CREATE TYPE "CrmRecordType" AS ENUM ('CONTACT', 'LEAD', 'LISTING', 'DEAL');

-- CreateEnum
CREATE TYPE "WorkflowType" AS ENUM ('OFFER_DRAFT', 'LISTING_ENTRY');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BROKER_TEAM_LEAD', 'AGENT', 'ADMIN', 'CLIENT', 'PARTNER');

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmRecord" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recordType" "CrmRecordType" NOT NULL,
    "workflowType" "WorkflowType",
    "displayName" TEXT NOT NULL,
    "subtitle" TEXT,
    "primaryAddress" TEXT,
    "status" TEXT NOT NULL,
    "sourceSystem" TEXT,
    "sourceRecordId" TEXT,
    "ownerId" TEXT,
    "assignedUserId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDraft" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "workflowType" "WorkflowType" NOT NULL,
    "ownerId" TEXT,
    "snapshot" JSONB NOT NULL,
    "lastSavedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE INDEX "CrmRecord_workspaceId_recordType_idx" ON "CrmRecord"("workspaceId", "recordType");

-- CreateIndex
CREATE INDEX "CrmRecord_workspaceId_workflowType_idx" ON "CrmRecord"("workspaceId", "workflowType");

-- CreateIndex
CREATE INDEX "CrmRecord_ownerId_idx" ON "CrmRecord"("ownerId");

-- CreateIndex
CREATE INDEX "CrmRecord_assignedUserId_idx" ON "CrmRecord"("assignedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowDraft_recordId_workflowType_key" ON "WorkflowDraft"("recordId", "workflowType");

-- CreateIndex
CREATE INDEX "WorkflowDraft_workspaceId_workflowType_idx" ON "WorkflowDraft"("workspaceId", "workflowType");

-- CreateIndex
CREATE INDEX "WorkflowDraft_ownerId_idx" ON "WorkflowDraft"("ownerId");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmRecord" ADD CONSTRAINT "CrmRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmRecord" ADD CONSTRAINT "CrmRecord_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmRecord" ADD CONSTRAINT "CrmRecord_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowDraft" ADD CONSTRAINT "WorkflowDraft_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowDraft" ADD CONSTRAINT "WorkflowDraft_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "CrmRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowDraft" ADD CONSTRAINT "WorkflowDraft_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
