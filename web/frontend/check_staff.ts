import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
  const staffs = await prisma.staff.findMany();
  fs.writeFileSync('staff_output.json', JSON.stringify(staffs, null, 2));
}

main().finally(() => prisma.$disconnect());
