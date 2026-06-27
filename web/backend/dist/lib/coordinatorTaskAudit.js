"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCoordinatorTaskAudit = logCoordinatorTaskAudit;
const prisma_1 = __importDefault(require("./prisma"));
async function logCoordinatorTaskAudit(params) {
    await prisma_1.default.coordinatorTaskAuditLog.create({
        data: {
            taskId: params.taskId,
            action: params.action,
            actorType: params.actorType,
            actorStaffId: params.actorStaffId ?? undefined,
            actorProfileId: params.actorProfileId ?? undefined,
            metadata: params.metadata,
            ipHash: params.ipHash ?? undefined,
            userAgent: params.userAgent ?? undefined,
        },
    });
}
