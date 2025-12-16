import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { neo4jConnection } from '../config/neo4j';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { User, LoginCredentials, AuthTokens, JWTPayload, UserCreateInput } from '../models/User';

export class AuthService {
  private readonly SALT_ROUNDS = 10;

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const session = neo4jConnection.getSession();
    
    try {
      // Find user by email
      const result = await session.run(
        `MATCH (u:User {email: $email})
         RETURN u.id as id, u.email as email, u.passwordHash as passwordHash, 
                u.role as role, u.organizationType as organizationType`,
        { email: credentials.email }
      );

      if (result.records.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.records[0].toObject();

      // Verify password
      const isValidPassword = await bcrypt.compare(
        credentials.password,
        user.passwordHash
      );

      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const tokens = this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationType: user.organizationType,
      });

      logger.info(`User logged in: ${user.email}`);

      return tokens;
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create new user (admin only)
   */
  async createUser(input: UserCreateInput): Promise<User> {
    const session = neo4jConnection.getSession();

    try {
      // Check if user already exists
      const existingUser = await session.run(
        'MATCH (u:User {email: $email}) RETURN u',
        { email: input.email }
      );

      if (existingUser.records.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, this.SALT_ROUNDS);

      // Create user node and ensure it is connected to an Organization node
      const userId = uuidv4();
      const now = new Date().toISOString();

      const result = await session.run(
        `CREATE (u:User {
          id: $id,
          name: $name,
          email: $email,
          passwordHash: $passwordHash,
          role: $role,
          organizationType: $organizationType,
          company: $company,
          createdAt: datetime($createdAt)
        })
        WITH u
        MERGE (o:Organization { name: $company })
        ON CREATE SET
          o.organizationType = $organizationType,
          o.createdAt = datetime($createdAt)
        MERGE (u)-[:BELONGS_TO]->(o)
        RETURN u.id as id, u.name as name, u.email as email, u.role as role,
               u.organizationType as organizationType, u.company as company,
               u.createdAt as createdAt`,
        {
          id: userId,
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
          organizationType: input.organizationType,
          company: input.company,
          createdAt: now,
        }
      );

      const user = result.records[0].toObject() as User;
      logger.info(`User created: ${user.email} (${user.role})`);

      return user;
    } catch (error) {
      logger.error('Create user error:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Reset user password (admin only)
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const session = neo4jConnection.getSession();

    try {
      const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      const result = await session.run(
        `MATCH (u:User {id: $userId})
         SET u.passwordHash = $passwordHash, u.updatedAt = datetime()
         RETURN u.email as email`,
        { userId, passwordHash }
      );

      if (result.records.length === 0) {
        throw new Error('User not found');
      }

      const email = result.records[0].get('email');
      logger.info(`Password reset for user: ${email}`);
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      return payload;
    } catch (error) {
      logger.error('Token verification error:', error);
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(payload: JWTPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.verifyToken(refreshToken);
      return this.generateTokens(payload);
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new Error('Invalid refresh token');
    }
  }
}

export const authService = new AuthService();
