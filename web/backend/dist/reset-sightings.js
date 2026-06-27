"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./lib/prisma"));
async function main() {
    console.log('Resetting sightings status to PENDING...');
    try {
        const result = await prisma_1.default.sighting.updateMany({
            where: {
                status: {
                    not: 'PENDING'
                }
            },
            data: {
                status: 'PENDING',
                missingReportId: null
            }
        });
        console.log(`Success! Reset ${result.count} database sightings back to PENDING.`);
    }
    catch (error) {
        console.warn('Prisma update failed, probably because database is down or not migrated yet:', error);
    }
}
main()
    .catch(err => {
    console.error('Error resetting sightings:', err);
    process.exit(1);
})
    .finally(() => {
    prisma_1.default.$disconnect();
});
