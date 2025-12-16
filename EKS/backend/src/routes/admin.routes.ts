import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/AuthService';
import { authenticate, requireAdmin } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

const router = Router();

// Apply auth middleware to all admin routes
router.use(authenticate);
router.use(requireAdmin);

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'user']),
  organizationType: z.enum(['cocreate', 'cvc', 'startup']),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user']).optional(),
  organizationType: z.enum(['cocreate', 'cvc', 'startup']).optional(),
  company: z.string().min(2).optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * GET /admin/users
 * List all users
 */
router.get('/users', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const result = await session.run(
      `MATCH (u:User)
       RETURN u.id as id, u.name as name, u.email as email, u.role as role,
              u.organizationType as organizationType, u.company as company,
              u.createdAt as createdAt
       ORDER BY u.createdAt DESC`
    );

    const users = result.records.map(record => record.toObject());

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    logger.error('List users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list users',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /admin/users
 * Create new user
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    const input = createUserSchema.parse(req.body);
    const user = await authService.createUser(input);

    // Remove passwordHash from response
    const { passwordHash, ...userResponse } = user as any;

    res.status(201).json({
      success: true,
      data: userResponse,
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

    logger.error('Create user error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    });
  }
});

/**
 * GET /admin/users/:id
 * Get user by ID
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const result = await session.run(
      `MATCH (u:User {id: $id})
       RETURN u.id as id, u.name as name, u.email as email, u.role as role,
              u.organizationType as organizationType, u.company as company,
              u.createdAt as createdAt, u.updatedAt as updatedAt`,
      { id: req.params.id }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const user = result.records[0].toObject();

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
    });
  } finally {
    await session.close();
  }
});

/**
 * PATCH /admin/users/:id
 * Update user
 */
router.patch('/users/:id', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const updates = updateUserSchema.parse(req.body);

    // Build SET clause dynamically
    const setFields = Object.entries(updates)
      .map(([key, _]) => `u.${key} = $${key}`)
      .join(', ');

    if (setFields.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {id: $id})
       SET ${setFields}, u.updatedAt = datetime()
       RETURN u.id as id, u.name as name, u.email as email, u.role as role,
              u.organizationType as organizationType, u.company as company`,
      { id: req.params.id, ...updates }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const user = result.records[0].toObject();

    res.json({
      success: true,
      data: user,
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

    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    });
  } finally {
    await session.close();
  }
});

/**
 * POST /admin/users/:id/reset-password
 * Reset user password
 */
router.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const { newPassword } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(req.params.id, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully',
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

    logger.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password',
    });
  }
});

/**
 * DELETE /admin/users/:id
 * Delete user
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const result = await session.run(
      `MATCH (u:User {id: $id})
       DELETE u
       RETURN count(u) as deleted`,
      { id: req.params.id }
    );

    const deleted = result.records[0]?.get('deleted').toNumber();

    if (deleted === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    logger.info(`User deleted: ${req.params.id}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  } finally {
    await session.close();
  }
});

export default router;
