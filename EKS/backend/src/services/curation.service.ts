import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';

export class CurationService {
  /**
   * Resolves the appropriate curator for a given user and visibility level.
   * - individual: null (no curator needed)
   * - department: direct manager (u)-[:REPORTS_TO]->(manager)
   * - corporate: director (manager of manager) or CEO (no manager)
   * 
   * Returns the userId of the curator, or null if auto-approved or not found.
   */
  async resolveCurator(userId: string, visibility: string): Promise<string | null> {
    if (visibility === 'individual') return null;

    const session = neo4jConnection.getSession();
    try {
      if (visibility === 'department') {
        // Direct manager
        const result = await session.run(
          `MATCH (u:User {id: $userId})-[:REPORTS_TO]->(m:User)
           RETURN m.id AS managerId`,
          { userId }
        );
        if (result.records.length > 0) {
          return result.records[0].get('managerId');
        }
      } else if (visibility === 'corporate') {
        // Director: The manager of the manager, or the highest person in the chain
        const result = await session.run(
          `MATCH path = (u:User {id: $userId})-[:REPORTS_TO*1..3]->(m:User)
           WHERE NOT (m)-[:REPORTS_TO]->() OR length(path) >= 2
           RETURN m.id AS directorId
           ORDER BY length(path) DESC
           LIMIT 1`,
          { userId }
        );
        if (result.records.length > 0) {
          return result.records[0].get('directorId');
        } else {
          // Fallback to direct manager if no higher up is found
          const directManagerResult = await session.run(
            `MATCH (u:User {id: $userId})-[:REPORTS_TO]->(m:User)
             RETURN m.id AS managerId`,
            { userId }
          );
          if (directManagerResult.records.length > 0) {
            return directManagerResult.records[0].get('managerId');
          }
        }
      }
      
      // If no manager found, fallback to system admins
      const adminResult = await session.run(
        `MATCH (u:User)
         WHERE u.role IN ['admin', 'Administrador']
         RETURN u.id AS adminId
         LIMIT 1`
      );
      if (adminResult.records.length > 0) {
        return adminResult.records[0].get('adminId');
      }

      return null;
    } catch (error) {
      logger.error(`Error resolving curator for user ${userId} and visibility ${visibility}:`, error);
      return null;
    } finally {
      await session.close();
    }
  }

  /**
   * Links a newly created knowledge node (Document or WebSource) to its curator
   */
  async routeForCuration(nodeId: string, nodeType: 'Document' | 'WebSource', userId: string, visibility: string): Promise<boolean> {
    if (visibility === 'individual') return true; // Auto-approved

    const curatorId = await this.resolveCurator(userId, visibility);
    
    if (!curatorId) {
      logger.warn(`Could not resolve curator for ${nodeType} ${nodeId} (visibility: ${visibility}). Defaulting to approved.`);
      return false; // Leave as is, effectively auto-approved since no queue holds it
    }

    const session = neo4jConnection.getSession();
    try {
      await session.run(
        `MATCH (n:${nodeType} {id: $nodeId})
         MATCH (c:User {id: $curatorId})
         SET n.curationStatus = 'pending'
         MERGE (n)-[r:PENDING_REVIEW_BY]->(c)
         SET r.submittedAt = datetime()`,
        { nodeId, curatorId }
      );
      logger.info(`Routed ${nodeType} ${nodeId} to curator ${curatorId}`);
      return true;
    } catch (error) {
      logger.error(`Error routing ${nodeType} ${nodeId} for curation:`, error);
      return false;
    } finally {
      await session.close();
    }
  }
}

export const curationService = new CurationService();
