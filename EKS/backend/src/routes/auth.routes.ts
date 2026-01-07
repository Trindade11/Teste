import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/AuthService';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const credentials = loginSchema.parse(req.body);
    const tokens = await authService.login(credentials);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    logger.error('Login route error:', error);
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokens = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    logger.error('Refresh token route error:', error);
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    });
  }
});

/**
 * POST /auth/logout
 * Logout (client-side token removal, no server-side action needed)
 */
router.post('/logout', authenticate, (req: Request, res: Response) => {
  // JWT is stateless, logout is handled client-side by removing token
  logger.info(`User logged out: ${req.user?.email}`);
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});


/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const email = req.user?.email?.trim().toLowerCase();
    if (!email) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {email: $email})
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       RETURN u.id AS userId, u.email AS email, u.name AS name, u.role AS role,
              u.company AS company, d.name AS department, u.jobTitle AS jobRole`,
      { email }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const record = result.records[0];

    res.json({
      success: true,
      data: {
        userId: record.get('userId'),
        email: record.get('email'),
        name: record.get('name') || '',
        role: record.get('role') || 'user',
        company: record.get('company') || '',
        department: record.get('department') || undefined,
        jobRole: record.get('jobRole') || undefined,
      },
    });
  } catch (error) {
    logger.error('Get current user route error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load current user',
    });
  } finally {
    await session.close();
  }
});

export default router;
