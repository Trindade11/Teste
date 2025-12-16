import neo4j, { Driver, Session } from 'neo4j-driver';
import { env } from './env';
import { logger } from '../utils/logger';

class Neo4jConnection {
  private driver: Driver | null = null;

  async connect(): Promise<Driver> {
    if (this.driver) {
      return this.driver;
    }

    try {
      this.driver = neo4j.driver(
        env.NEO4J_URI,
        neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD),
        {
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 30000,
        }
      );

      // Verify connectivity
      await this.driver.verifyConnectivity();
      logger.info('✅ Neo4j connected successfully');

      return this.driver;
    } catch (error) {
      logger.error('❌ Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      logger.info('Neo4j connection closed');
    }
  }

  getDriver(): Driver {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized. Call connect() first.');
    }
    return this.driver;
  }

  getSession(): Session {
    return this.getDriver().session();
  }

  getSessionWithDatabase(): Session {
    return this.getDriver().session({ database: env.NEO4J_DATABASE });
  }
}

export const neo4jConnection = new Neo4jConnection();
