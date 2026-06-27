import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function pruneDatabase() {
  console.log('🧹 Starting database prune...')

  try {
    // We execute deletes in reverse order of relationships to prevent Foreign Key constraint failures.
    // We wrap this in a transaction so if one fails, none of them execute.
    await prisma.$transaction([
      // 1. Delete dependent child tables first (things that rely on Zones)
      prisma.alertLog.deleteMany(),
      prisma.alert.deleteMany(),
      prisma.camera.deleteMany(),
      prisma.device.deleteMany(),
      prisma.staff.deleteMany(),
      prisma.zoneDensity.deleteMany(),
      prisma.prediction.deleteMany(),

      // 2. Delete the parent table
      prisma.zone.deleteMany(),

      // 3. Delete independent tables
      prisma.profile.deleteMany(),
      prisma.room.deleteMany(),
      prisma.entryPoint.deleteMany(),
      prisma.suggestion.deleteMany(),
      prisma.alertSummary.deleteMany(),
      prisma.staffTask.deleteMany(),
      prisma.densityThreshold.deleteMany(),
      prisma.flowData.deleteMany(),
      prisma.crowdData.deleteMany(),
      prisma.peakData.deleteMany(),
      prisma.zoneRanking.deleteMany(),
    ])

    console.log('✅ Database successfully pruned. Schema remains intact.')
  } catch (error) {
    console.error('❌ Failed to prune database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

pruneDatabase()