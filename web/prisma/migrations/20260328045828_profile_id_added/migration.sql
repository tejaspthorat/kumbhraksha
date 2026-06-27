/*
  Warnings:

  - A unique constraint covering the columns `[profileId,name]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[profileId,name]` on the table `Zone` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileId` to the `AlertSummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `Camera` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `CrowdData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `DensityThreshold` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `EntryPoint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `FloorPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `FlowData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `PeakData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `StaffTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `Suggestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `Zone` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profileId` to the `ZoneRanking` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Room_name_idx";

-- DropIndex
DROP INDEX "Zone_name_idx";

-- DropIndex
DROP INDEX "Zone_name_key";

-- AlterTable
ALTER TABLE "AlertSummary" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Camera" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CrowdData" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DensityThreshold" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EntryPoint" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FloorPlan" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FlowData" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PeakData" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StaffTask" ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "staffId" INTEGER;

-- AlterTable
ALTER TABLE "Suggestion" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Zone" ADD COLUMN     "profileId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ZoneRanking" ADD COLUMN     "profileId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "AlertSummary_profileId_idx" ON "AlertSummary"("profileId");

-- CreateIndex
CREATE INDEX "Camera_profileId_idx" ON "Camera"("profileId");

-- CreateIndex
CREATE INDEX "CrowdData_profileId_idx" ON "CrowdData"("profileId");

-- CreateIndex
CREATE INDEX "DensityThreshold_profileId_idx" ON "DensityThreshold"("profileId");

-- CreateIndex
CREATE INDEX "Device_profileId_idx" ON "Device"("profileId");

-- CreateIndex
CREATE INDEX "EntryPoint_profileId_idx" ON "EntryPoint"("profileId");

-- CreateIndex
CREATE INDEX "FloorPlan_profileId_idx" ON "FloorPlan"("profileId");

-- CreateIndex
CREATE INDEX "FlowData_profileId_idx" ON "FlowData"("profileId");

-- CreateIndex
CREATE INDEX "PeakData_profileId_idx" ON "PeakData"("profileId");

-- CreateIndex
CREATE INDEX "Room_profileId_idx" ON "Room"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_profileId_name_key" ON "Room"("profileId", "name");

-- CreateIndex
CREATE INDEX "Staff_profileId_idx" ON "Staff"("profileId");

-- CreateIndex
CREATE INDEX "StaffTask_profileId_idx" ON "StaffTask"("profileId");

-- CreateIndex
CREATE INDEX "StaffTask_staffId_idx" ON "StaffTask"("staffId");

-- CreateIndex
CREATE INDEX "Suggestion_profileId_idx" ON "Suggestion"("profileId");

-- CreateIndex
CREATE INDEX "Zone_profileId_idx" ON "Zone"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_profileId_name_key" ON "Zone"("profileId", "name");

-- CreateIndex
CREATE INDEX "ZoneRanking_profileId_idx" ON "ZoneRanking"("profileId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryPoint" ADD CONSTRAINT "EntryPoint_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertSummary" ADD CONSTRAINT "AlertSummary_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTask" ADD CONSTRAINT "StaffTask_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTask" ADD CONSTRAINT "StaffTask_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DensityThreshold" ADD CONSTRAINT "DensityThreshold_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlowData" ADD CONSTRAINT "FlowData_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrowdData" ADD CONSTRAINT "CrowdData_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeakData" ADD CONSTRAINT "PeakData_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneRanking" ADD CONSTRAINT "ZoneRanking_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlan" ADD CONSTRAINT "FloorPlan_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
