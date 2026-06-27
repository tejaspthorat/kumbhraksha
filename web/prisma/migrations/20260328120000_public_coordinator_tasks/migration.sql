-- CreateEnum
CREATE TYPE "TaskCreationSource" AS ENUM ('INTERNAL', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TaskAuditActorType" AS ENUM ('STAFF', 'PROFILE', 'PUBLIC_TOKEN', 'SYSTEM');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "allowPublicTasks" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Event_allowPublicTasks_idx" ON "Event"("allowPublicTasks");

-- AlterTable (allow anonymous-created tasks without a Profile assigner)
ALTER TABLE "CoordinatorTask" ALTER COLUMN "assignedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CoordinatorTask" ADD COLUMN "creationSource" "TaskCreationSource" NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE "CoordinatorTask" ADD COLUMN "publicCreatorName" TEXT;
ALTER TABLE "CoordinatorTask" ADD COLUMN "publicCreatorEmail" TEXT;
ALTER TABLE "CoordinatorTask" ADD COLUMN "creatorEditTokenHash" TEXT;
ALTER TABLE "CoordinatorTask" ADD COLUMN "creatorEditTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "CoordinatorTask" ADD COLUMN "notifyCreatorOnUpdates" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "CoordinatorTask_creationSource_idx" ON "CoordinatorTask"("creationSource");

-- CreateTable
CREATE TABLE "CoordinatorTaskAuditLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorType" "TaskAuditActorType" NOT NULL,
    "actorStaffId" INTEGER,
    "actorProfileId" TEXT,
    "metadata" JSONB,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoordinatorTaskAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoordinatorTaskAuditLog_taskId_idx" ON "CoordinatorTaskAuditLog"("taskId");

-- CreateIndex
CREATE INDEX "CoordinatorTaskAuditLog_createdAt_idx" ON "CoordinatorTaskAuditLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "CoordinatorTaskAuditLog_actorType_idx" ON "CoordinatorTaskAuditLog"("actorType");

-- AddForeignKey
ALTER TABLE "CoordinatorTaskAuditLog" ADD CONSTRAINT "CoordinatorTaskAuditLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CoordinatorTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
