import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routers
import alertsRouter from './routes/alerts';
import camerasRouter from './routes/cameras';
import coordinatorTasksRouter from './routes/coordinatorTasks';
import dashboardRouter from './routes/dashboard';
import eventsRouter from './routes/events';
import floorPlanRouter from './routes/floorPlan';
import groqRouter from './routes/groq';
import heatmapRouter from './routes/heatmap';
import missingRouter from './routes/missing';
import mobileRouter from './routes/mobile';
import publicRouter from './routes/public';
import reportsRouter from './routes/reports';
import staffRouter from './routes/staff';
import staffTasksRouter from './routes/staffTasks';
import tasksRouter from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
app.use('/api/alerts', alertsRouter);
app.use('/api/cameras', camerasRouter);
app.use('/api/coordinator-tasks', coordinatorTasksRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/events', eventsRouter);
app.use('/api/floor-plan', floorPlanRouter);
app.use('/api/groq', groqRouter);
app.use('/api/heatmap', heatmapRouter);
app.use('/api/missing', missingRouter);
app.use('/api/mobile', mobileRouter);
app.use('/api/public', publicRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/staff-tasks', staffTasksRouter);
app.use('/api/tasks', tasksRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

export default app;
