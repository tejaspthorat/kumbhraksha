"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Import routers
const alerts_1 = __importDefault(require("./routes/alerts"));
const cameras_1 = __importDefault(require("./routes/cameras"));
const coordinatorTasks_1 = __importDefault(require("./routes/coordinatorTasks"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const events_1 = __importDefault(require("./routes/events"));
const floorPlan_1 = __importDefault(require("./routes/floorPlan"));
const groq_1 = __importDefault(require("./routes/groq"));
const missing_1 = __importDefault(require("./routes/missing"));
const mobile_1 = __importDefault(require("./routes/mobile"));
const public_1 = __importDefault(require("./routes/public"));
const reports_1 = __importDefault(require("./routes/reports"));
const staff_1 = __importDefault(require("./routes/staff"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Middlewares
app.use((0, cors_1.default)({
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging middleware
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});
// Mount modular API routers
app.use('/api/alerts', alerts_1.default);
app.use('/api/cameras', cameras_1.default);
app.use('/api/coordinator-tasks', coordinatorTasks_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/events', events_1.default);
app.use('/api/floor-plan', floorPlan_1.default);
app.use('/api/groq', groq_1.default);
app.use('/api/missing', missing_1.default);
app.use('/api/mobile', mobile_1.default);
app.use('/api/public', public_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/staff', staff_1.default);
app.use('/api/tasks', tasks_1.default);
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('[Express Global Error]:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});
// Start Express server
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  Kumbhraksha Express API Backend Running`);
    console.log(`  Port: ${PORT}`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Missing'}`);
    console.log(`===============================================`);
});
exports.default = app;
