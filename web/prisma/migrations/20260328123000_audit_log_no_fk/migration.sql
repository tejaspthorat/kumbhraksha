-- Preserve audit rows when a coordinator task is deleted (immutable task id only).
ALTER TABLE "CoordinatorTaskAuditLog" DROP CONSTRAINT IF EXISTS "CoordinatorTaskAuditLog_taskId_fkey";
