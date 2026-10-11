import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './routes/auth.routes';
import challengeRoutes from './routes/challenge.routes';
import submissionRoutes from './routes/submission.routes';
import portfolioRoutes from './routes/portfolio.routes';
import mentorRoutes from './routes/mentor.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const PORT = process.env.PORT || 5000;
// Read bound FRONTEND_URL injected by Vercel services binding or fallback to CLIENT_ORIGIN
const CLIENT_ORIGIN = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:3000';

const allowedOrigins = [
  CLIENT_ORIGIN,
  process.env.FRONTEND_URL,
  process.env.CLIENT_ORIGIN,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean) as string[];

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.some(o => origin.startsWith(o)) ||
      origin.endsWith('.vercel.app') ||
      Boolean(process.env.VERCEL)
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists and serve statically
// In Vercel serverless environment root fs is read-only, default to /tmp/uploads
const defaultStorageDir = process.env.VERCEL ? '/tmp/uploads' : './uploads';
const storageDir = path.resolve(process.env.STORAGE_DIR || defaultStorageDir);
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}
app.use('/uploads', express.static(storageDir));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'SkillBridge Backend API',
    timestamp: new Date().toISOString(),
    frontendBound: Boolean(process.env.FRONTEND_URL),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

// Start Server locally (skip in Vercel serverless environment or automated tests)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` SkillBridge API Server running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Storage dir: ${storageDir}`);
    console.log(` Client URL:  ${CLIENT_ORIGIN}`);
    console.log(`===============================================`);
  });
}

// Support both ESM default and CommonJS module.exports for Vercel functions
export default app;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
  module.exports.default = app;
}
