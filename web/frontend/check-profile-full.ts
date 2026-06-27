import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const allProfiles = await prisma.profile.findMany()
  console.log('All Profiles in Prisma:', JSON.stringify(allProfiles, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
