import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from './middleware/rateLimit.js';
import { autoSetupDb } from './db/index.js';
import authRoutes from './routes/auth.routes.js';
import laundriesRoutes from './routes/laundries.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import partnerRoutes from './routes/partner.routes.js';
import adminRoutes from './routes/admin.routes.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Only the listed website addresses may call the API from a browser.
// Set CLIENT_URL in .env (comma-separated for several), e.g. https://mylaundry.com
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, cb) {
    // no Origin header = same-origin / server-to-server / curl
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Slow down password guessing and fake-signup spam
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 30 });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Kano Laundry Marketplace Platform',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/laundries', laundriesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found.` });
});

// Centralized error handler
app.use(errorHandler);

// Bootstrapping
async function startServer() {
  try {
    console.log('Initializing database...');
    await autoSetupDb();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🧺 Kano Laundry Platform API Server running on port ${PORT}`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

startServer();

export default app;
