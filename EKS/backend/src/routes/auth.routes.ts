import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authService } from '../services/AuthService';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { env } from '../config/env';
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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(4, 'New password must be at least 4 characters'),
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

    // Bootstrap admin (local, no Neo4j)
    if (
      env.BOOTSTRAP_ADMIN_ENABLED &&
      email === env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase() &&
      req.user?.userId === 'bootstrap-admin'
    ) {
      res.json({
        success: true,
        data: {
          userId: 'bootstrap-admin',
          email,
          name: 'Bootstrap Admin',
          role: 'admin',
          company: 'Local',
          department: undefined,
          jobRole: 'Bootstrap',
          forcePasswordChange: false,
        },
      });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {email: $email})
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       RETURN u.id AS userId, u.email AS email, u.name AS name, u.role AS role,
              u.company AS company, d.name AS department, u.jobTitle AS jobRole,
              u.forcePasswordChange AS forcePasswordChange`,
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
        forcePasswordChange: record.get('forcePasswordChange') || false,
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

/**
 * POST /auth/gmail/initiate
 * Initiate Gmail OAuth flow
 */
router.post('/gmail/initiate', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Gmail OAuth configuration
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/gmail/callback';
    
    if (!clientId) {
      res.status(500).json({
        success: false,
        error: 'Gmail OAuth not configured',
      });
      return;
    }

    // Build OAuth URL
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.metadata',
    ];

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', userId); // Pass userId for callback

    res.json({
      success: true,
      data: {
        authUrl: authUrl.toString(),
      },
    });
  } catch (error) {
    logger.error('Gmail OAuth initiate error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate Gmail OAuth',
    });
  }
});

/**
 * GET /auth/gmail/callback
 * Handle Gmail OAuth callback
 */
router.get('/gmail/callback', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      res.status(400).json({
        success: false,
        error: 'Missing code or state parameter',
      });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/gmail/callback';

    if (!clientId || !clientSecret) {
      res.status(500).json({
        success: false,
        error: 'Gmail OAuth not configured',
      });
      return;
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      logger.error('Gmail token exchange error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to exchange code for token',
      });
      return;
    }

    const tokensUnknown: unknown = await tokenResponse.json();
    const tokens = tokensUnknown as {
      access_token?: string;
      refresh_token?: string;
    };
    const now = new Date().toISOString();

    // Save tokens to user in Neo4j
    await session.run(
      `MATCH (u:User {id: $userId})
       SET u.gmailConnected = true,
           u.gmailConnectedAt = $now,
           u.gmailAccessToken = $accessToken,
           u.gmailRefreshToken = $refreshToken,
           u.gmailSkipped = false`,
      {
        userId: userId as string,
        now,
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
      }
    );

    logger.info(`Gmail connected for user: ${userId}`);

    // Close window with success message
    res.send(`
      <html>
        <body>
          <h2>Gmail conectado com sucesso!</h2>
          <p>Você pode fechar esta janela.</p>
          <script>
            window.opener?.postMessage({ type: 'GMAIL_AUTH_SUCCESS' }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error('Gmail OAuth callback error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h2>Erro ao conectar Gmail</h2>
          <p>Por favor, tente novamente.</p>
          <script>
            window.opener?.postMessage({ type: 'GMAIL_AUTH_ERROR' }, '*');
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  } finally {
    await session.close();
  }
});

/**
 * POST /auth/change-password
 * Change user password
 */
router.post('/change-password', authenticate, async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();
  
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const email = req.user?.email?.trim().toLowerCase();
    
    if (!email) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Bootstrap admin (local, no Neo4j)
    if (
      env.BOOTSTRAP_ADMIN_ENABLED &&
      email === env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase() &&
      req.user?.userId === 'bootstrap-admin'
    ) {
      res.status(400).json({
        success: false,
        error: 'Bootstrap admin password cannot be changed',
      });
      return;
    }

    // Get current user with password hash
    const userResult = await session.run(
      'MATCH (u:User {email: $email}) RETURN u.passwordHash AS passwordHash, u.forcePasswordChange AS forcePasswordChange',
      { email }
    );

    if (userResult.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const record = userResult.records[0];
    const currentHash = record.get('passwordHash');

    // Verify current password
    if (!currentHash || !(await bcrypt.compare(currentPassword, currentHash))) {
      res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
      return;
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and remove forcePasswordChange flag
    await session.run(
      `MATCH (u:User {email: $email})
       SET u.passwordHash = $newPasswordHash,
           u.forcePasswordChange = false,
           u.updatedAt = datetime()`,
      { email, newPasswordHash }
    );

    logger.info(`Password changed for user: ${email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
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

    logger.error('Change password route error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change password',
    });
  } finally {
    await session.close();
  }
});

export default router;
