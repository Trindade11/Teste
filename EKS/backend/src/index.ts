import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './utils/logger';
import { neo4jConnection } from './config/neo4j';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    name: 'CVC Hub API',
    version: '0.1.0',
    docs: '/api-docs', // TODO: Add Swagger
    endpoints: {
      auth: '/auth',
      admin: '/admin',
      health: '/health',
    }
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
async function startServer() {
  try {
    // Try to connect to Neo4j (não fatal se falhar em dev)
    try {
      await neo4jConnection.connect();
      logger.info('✅ Neo4j connected');
    } catch (neo4jError) {
      if (env.NODE_ENV === 'production') {
        logger.error('❌ Neo4j connection required in production');
        throw neo4jError;
      }
      logger.warn('⚠️  Neo4j not connected (dev mode - continuing anyway)');
      logger.warn('   Configure .env with real Neo4j credentials to enable database');
    }

    // Start HTTP server
    app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
      logger.info(`📊 Environment: ${env.NODE_ENV}`);
      logger.info(`🌐 CORS origin: ${env.CORS_ORIGIN}`);
      logger.info(`📝 API: http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await neo4jConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await neo4jConnection.disconnect();
  process.exit(0);
});

// Start the server
startServer();
