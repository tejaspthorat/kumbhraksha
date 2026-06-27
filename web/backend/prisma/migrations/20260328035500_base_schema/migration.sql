-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'USER');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('danger', 'warning', 'info');

-- CreateEnum
CREATE TYPE "ZoneLevel" AS ENUM ('danger', 'warning', 'success');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('pending', 'accepted', 'ignored');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('online', 'offline', 'degraded');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('active', 'break', 'offline');

-- CreateEnum
CREATE TYPE "DensityStatus" AS ENUM ('danger', 'warning', 'success');

-- CreateEnum
CREATE TYPE "PredictionSeverity" AS ENUM ('danger', 'warning', 'info', 'success');

-- CreateEnum
CREATE TYPE "FloorPlanRoomType" AS ENUM ('GeneralArea', 'MeetingRoom', 'Restroom', 'KitchenPantry', 'Storage', 'EmergencyExit', 'ReceptionLobby', 'ServerRoom', 'OpenWorkspace', 'AuditoriumHall');

-- CreateEnum
CREATE TYPE "FloorPlanUserRole" AS ENUM ('Coordinator', 'Security', 'Staff', 'Medical', 'Technician', 'Volunteer');

-- CreateEnum
CREATE TYPE "FloorPlanUserStatus" AS ENUM ('available', 'assigned', 'checked_in');

-- CreateEnum
CREATE TYPE "CorridorType" AS ENUM ('primary', 'emergency', 'general');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryPoint" (
    "id" SERIAL NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntryPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" SERIAL NOT NULL,
    "condition" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "zone" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "people" INTEGER NOT NULL DEFAULT 0,
    "area" INTEGER NOT NULL,
    "density" DOUBLE PRECISION NOT NULL,
    "level" "ZoneLevel" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "level" "AlertLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "zoneId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertSummary" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" SERIAL NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camera" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'online',
    "fps" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'online',
    "fps" INTEGER NOT NULL,
    "latency" INTEGER NOT NULL,
    "temp" INTEGER NOT NULL,
    "power" INTEGER NOT NULL,
    "aiModel" TEXT NOT NULL,
    "memUsage" INTEGER NOT NULL,
    "cpuUsage" INTEGER NOT NULL,
    "uptime" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "zoneId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'active',
    "avatar" TEXT NOT NULL,
    "tasks" INTEGER NOT NULL DEFAULT 0,
    "lastSeen" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "userId" TEXT,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTask" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "assignee" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoneDensity" (
    "id" SERIAL NOT NULL,
    "density" DOUBLE PRECISION NOT NULL,
    "status" "DensityStatus" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "zoneId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZoneDensity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DensityThreshold" (
    "id" SERIAL NOT NULL,
    "level" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "bg" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DensityThreshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" SERIAL NOT NULL,
    "prediction" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "trend" TEXT NOT NULL,
    "severity" "PredictionSeverity" NOT NULL,
    "eta" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "speed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zoneId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowData" (
    "id" SERIAL NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "flow" INTEGER NOT NULL,
    "trend" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrowdData" (
    "id" SERIAL NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL,
    "density" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrowdData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeakData" (
    "id" SERIAL NOT NULL,
    "time" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeakData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoneRanking" (
    "id" SERIAL NOT NULL,
    "zone" TEXT NOT NULL,
    "avgDensity" DOUBLE PRECISION NOT NULL,
    "peakCount" INTEGER NOT NULL,
    "alerts" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoneRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Floor Plan',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "backgroundImage" TEXT,
    "floorPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorPlanRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FloorPlanRoomType" NOT NULL DEFAULT 'GeneralArea',
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,
    "notes" TEXT,
    "alertThreshold" INTEGER NOT NULL DEFAULT 85,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "assignedUserIds" TEXT[],
    "floorLevelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlanRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorPlanEntryPoint" (
    "id" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "label" TEXT,
    "floorLevelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlanEntryPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorPlanCorridor" (
    "id" TEXT NOT NULL,
    "fromRoomId" TEXT NOT NULL,
    "toRoomId" TEXT NOT NULL,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "type" "CorridorType" NOT NULL DEFAULT 'general',
    "fromX" DOUBLE PRECISION NOT NULL,
    "fromY" DOUBLE PRECISION NOT NULL,
    "toX" DOUBLE PRECISION NOT NULL,
    "toY" DOUBLE PRECISION NOT NULL,
    "floorLevelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlanCorridor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorPlanEvacuationRoute" (
    "id" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "floorLevelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlanEvacuationRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorPlanUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "FloorPlanUserRole" NOT NULL DEFAULT 'Staff',
    "email" TEXT,
    "status" "FloorPlanUserStatus" NOT NULL DEFAULT 'available',
    "assignedRoomId" TEXT,
    "assignedFloorId" TEXT,
    "floorPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlanUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorPlanAsset" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roomId" TEXT NOT NULL,
    "reducesArea" BOOLEAN NOT NULL DEFAULT false,
    "areaReduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "floorPlanId" TEXT NOT NULL,
    "floorLevelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlanAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloorPlanSnapshot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "floorPlanId" TEXT NOT NULL,

    CONSTRAINT "FloorPlanSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "Profile_email_idx" ON "Profile"("email");

-- CreateIndex
CREATE INDEX "Profile_role_idx" ON "Profile"("role");

-- CreateIndex
CREATE INDEX "Room_name_idx" ON "Room"("name");

-- CreateIndex
CREATE INDEX "Suggestion_status_idx" ON "Suggestion"("status");

-- CreateIndex
CREATE INDEX "Suggestion_zone_idx" ON "Suggestion"("zone");

-- CreateIndex
CREATE INDEX "Suggestion_priority_idx" ON "Suggestion"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_name_key" ON "Zone"("name");

-- CreateIndex
CREATE INDEX "Zone_name_idx" ON "Zone"("name");

-- CreateIndex
CREATE INDEX "Zone_level_idx" ON "Zone"("level");

-- CreateIndex
CREATE INDEX "Zone_density_idx" ON "Zone"("density");

-- CreateIndex
CREATE INDEX "Alert_zoneId_idx" ON "Alert"("zoneId");

-- CreateIndex
CREATE INDEX "Alert_resolved_idx" ON "Alert"("resolved");

-- CreateIndex
CREATE INDEX "Alert_level_idx" ON "Alert"("level");

-- CreateIndex
CREATE INDEX "Alert_zoneId_resolved_idx" ON "Alert"("zoneId", "resolved");

-- CreateIndex
CREATE INDEX "Alert_zoneId_level_idx" ON "Alert"("zoneId", "level");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AlertSummary_name_idx" ON "AlertSummary"("name");

-- CreateIndex
CREATE INDEX "AlertLog_zoneId_idx" ON "AlertLog"("zoneId");

-- CreateIndex
CREATE INDEX "AlertLog_severity_idx" ON "AlertLog"("severity");

-- CreateIndex
CREATE INDEX "AlertLog_resolved_idx" ON "AlertLog"("resolved");

-- CreateIndex
CREATE INDEX "AlertLog_zoneId_severity_idx" ON "AlertLog"("zoneId", "severity");

-- CreateIndex
CREATE INDEX "AlertLog_createdAt_idx" ON "AlertLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Camera_zoneId_idx" ON "Camera"("zoneId");

-- CreateIndex
CREATE INDEX "Camera_status_idx" ON "Camera"("status");

-- CreateIndex
CREATE INDEX "Camera_zoneId_status_idx" ON "Camera"("zoneId", "status");

-- CreateIndex
CREATE INDEX "Device_status_idx" ON "Device"("status");

-- CreateIndex
CREATE INDEX "Device_zoneId_idx" ON "Device"("zoneId");

-- CreateIndex
CREATE INDEX "Device_location_idx" ON "Device"("location");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_zoneId_idx" ON "Staff"("zoneId");

-- CreateIndex
CREATE INDEX "Staff_status_idx" ON "Staff"("status");

-- CreateIndex
CREATE INDEX "Staff_zoneId_status_idx" ON "Staff"("zoneId", "status");

-- CreateIndex
CREATE INDEX "StaffTask_priority_idx" ON "StaffTask"("priority");

-- CreateIndex
CREATE INDEX "StaffTask_assignee_idx" ON "StaffTask"("assignee");

-- CreateIndex
CREATE INDEX "ZoneDensity_zoneId_idx" ON "ZoneDensity"("zoneId");

-- CreateIndex
CREATE INDEX "ZoneDensity_status_idx" ON "ZoneDensity"("status");

-- CreateIndex
CREATE INDEX "ZoneDensity_zoneId_status_idx" ON "ZoneDensity"("zoneId", "status");

-- CreateIndex
CREATE INDEX "DensityThreshold_level_idx" ON "DensityThreshold"("level");

-- CreateIndex
CREATE INDEX "Prediction_zoneId_idx" ON "Prediction"("zoneId");

-- CreateIndex
CREATE INDEX "Prediction_severity_idx" ON "Prediction"("severity");

-- CreateIndex
CREATE INDEX "Prediction_zoneId_severity_idx" ON "Prediction"("zoneId", "severity");

-- CreateIndex
CREATE INDEX "Prediction_createdAt_idx" ON "Prediction"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "FlowData_from_idx" ON "FlowData"("from");

-- CreateIndex
CREATE INDEX "FlowData_to_idx" ON "FlowData"("to");

-- CreateIndex
CREATE INDEX "FlowData_from_to_idx" ON "FlowData"("from", "to");

-- CreateIndex
CREATE INDEX "CrowdData_createdAt_idx" ON "CrowdData"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "PeakData_createdAt_idx" ON "PeakData"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ZoneRanking_zone_idx" ON "ZoneRanking"("zone");

-- CreateIndex
CREATE INDEX "ZoneRanking_avgDensity_idx" ON "ZoneRanking"("avgDensity" DESC);

-- CreateIndex
CREATE INDEX "ZoneRanking_alerts_idx" ON "ZoneRanking"("alerts" DESC);

-- CreateIndex
CREATE INDEX "FloorPlan_createdAt_idx" ON "FloorPlan"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "FloorLevel_floorPlanId_idx" ON "FloorLevel"("floorPlanId");

-- CreateIndex
CREATE INDEX "FloorLevel_order_idx" ON "FloorLevel"("order");

-- CreateIndex
CREATE INDEX "FloorPlanRoom_floorLevelId_idx" ON "FloorPlanRoom"("floorLevelId");

-- CreateIndex
CREATE INDEX "FloorPlanRoom_name_idx" ON "FloorPlanRoom"("name");

-- CreateIndex
CREATE INDEX "FloorPlanEntryPoint_floorLevelId_idx" ON "FloorPlanEntryPoint"("floorLevelId");

-- CreateIndex
CREATE INDEX "FloorPlanCorridor_floorLevelId_idx" ON "FloorPlanCorridor"("floorLevelId");

-- CreateIndex
CREATE INDEX "FloorPlanEvacuationRoute_floorLevelId_idx" ON "FloorPlanEvacuationRoute"("floorLevelId");

-- CreateIndex
CREATE INDEX "FloorPlanUser_floorPlanId_idx" ON "FloorPlanUser"("floorPlanId");

-- CreateIndex
CREATE INDEX "FloorPlanUser_status_idx" ON "FloorPlanUser"("status");

-- CreateIndex
CREATE INDEX "FloorPlanUser_name_idx" ON "FloorPlanUser"("name");

-- CreateIndex
CREATE INDEX "FloorPlanAsset_floorPlanId_idx" ON "FloorPlanAsset"("floorPlanId");

-- CreateIndex
CREATE INDEX "FloorPlanAsset_floorLevelId_idx" ON "FloorPlanAsset"("floorLevelId");

-- CreateIndex
CREATE INDEX "FloorPlanSnapshot_floorPlanId_idx" ON "FloorPlanSnapshot"("floorPlanId");

-- CreateIndex
CREATE INDEX "FloorPlanSnapshot_createdAt_idx" ON "FloorPlanSnapshot"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneDensity" ADD CONSTRAINT "ZoneDensity_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorLevel" ADD CONSTRAINT "FloorLevel_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlanRoom" ADD CONSTRAINT "FloorPlanRoom_floorLevelId_fkey" FOREIGN KEY ("floorLevelId") REFERENCES "FloorLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlanEntryPoint" ADD CONSTRAINT "FloorPlanEntryPoint_floorLevelId_fkey" FOREIGN KEY ("floorLevelId") REFERENCES "FloorLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlanCorridor" ADD CONSTRAINT "FloorPlanCorridor_floorLevelId_fkey" FOREIGN KEY ("floorLevelId") REFERENCES "FloorLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlanEvacuationRoute" ADD CONSTRAINT "FloorPlanEvacuationRoute_floorLevelId_fkey" FOREIGN KEY ("floorLevelId") REFERENCES "FloorLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlanUser" ADD CONSTRAINT "FloorPlanUser_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlanAsset" ADD CONSTRAINT "FloorPlanAsset_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlanSnapshot" ADD CONSTRAINT "FloorPlanSnapshot_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
