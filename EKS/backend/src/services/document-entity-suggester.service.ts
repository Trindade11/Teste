/**
 * Document Entity Suggester Service
 * Suggests entity relationships based on document content and existing graph entities
 */

import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import { MentionedEntity } from './document-metadata-extractor.service';

export interface EntitySuggestion {
  entityType: 'person' | 'project' | 'department' | 'okr' | 'objective';
  entityId: string;
  entityName: string;
  confidence: number;
  context: string;
  matchType: 'exact' | 'fuzzy' | 'semantic';
  metadata?: Record<string, any>;
}

export class DocumentEntitySuggester {
  /**
   * Suggest entity relationships based on mentioned entities and document metadata
   */
  async suggest(
    mentionedEntities: MentionedEntity[],
    documentTitle: string,
    documentSummary: string,
    documentTags: string[]
  ): Promise<EntitySuggestion[]> {
    const suggestions: EntitySuggestion[] = [];
    const session = neo4jConnection.getSession();

    try {
      // 1. Match mentioned people with :User nodes
      const peopleEntities = mentionedEntities.filter(e => e.type === 'person');
      for (const person of peopleEntities) {
        const personSuggestions = await this.matchPerson(person, session);
        suggestions.push(...personSuggestions);
      }

      // 2. Match mentioned projects with :Project nodes
      const projectEntities = mentionedEntities.filter(e => e.type === 'project');
      for (const project of projectEntities) {
        const projectSuggestions = await this.matchProject(project, session);
        suggestions.push(...projectSuggestions);
      }

      // 3. Match mentioned departments with :Department nodes
      const deptEntities = mentionedEntities.filter(e => e.type === 'department');
      for (const dept of deptEntities) {
        const deptSuggestions = await this.matchDepartment(dept, session);
        suggestions.push(...deptSuggestions);
      }

      // 4. Semantic matching: find projects/OKRs/objectives by keywords in title/summary/tags
      const semanticSuggestions = await this.semanticMatch(
        documentTitle,
        documentSummary,
        documentTags,
        session
      );
      suggestions.push(...semanticSuggestions);

      // 5. Sort by confidence and remove duplicates
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
      const sortedSuggestions = uniqueSuggestions.sort((a, b) => b.confidence - a.confidence);

      logger.info(`Generated ${sortedSuggestions.length} entity suggestions`);
      return sortedSuggestions;
    } catch (error) {
      logger.error('Error suggesting entities:', error);
      return [];
    } finally {
      await session.close();
    }
  }

  private async matchPerson(person: MentionedEntity, session: any): Promise<EntitySuggestion[]> {
    const suggestions: EntitySuggestion[] = [];

    try {
      // Exact match by name
      const exactResult = await session.run(
        `MATCH (u:User)
         WHERE toLower(u.name) = toLower($name)
         OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
         RETURN u.id AS id, u.name AS name, u.email AS email, 
                u.jobTitle AS jobTitle, d.name AS department
         LIMIT 5`,
        { name: person.name }
      );

      for (const record of exactResult.records) {
        suggestions.push({
          entityType: 'person',
          entityId: record.get('id'),
          entityName: record.get('name'),
          confidence: person.confidence * 0.95, // High confidence for exact match
          context: person.context,
          matchType: 'exact',
          metadata: {
            email: record.get('email'),
            jobTitle: record.get('jobTitle'),
            department: record.get('department'),
          },
        });
      }

      // Fuzzy match if no exact match
      if (suggestions.length === 0) {
        const fuzzyResult = await session.run(
          `MATCH (u:User)
           WHERE toLower(u.name) CONTAINS toLower($namePart)
              OR toLower($namePart) CONTAINS toLower(u.name)
           OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
           RETURN u.id AS id, u.name AS name, u.email AS email,
                  u.jobTitle AS jobTitle, d.name AS department
           LIMIT 3`,
          { namePart: person.name }
        );

        for (const record of fuzzyResult.records) {
          suggestions.push({
            entityType: 'person',
            entityId: record.get('id'),
            entityName: record.get('name'),
            confidence: person.confidence * 0.7, // Lower confidence for fuzzy match
            context: person.context,
            matchType: 'fuzzy',
            metadata: {
              email: record.get('email'),
              jobTitle: record.get('jobTitle'),
              department: record.get('department'),
            },
          });
        }
      }
    } catch (error) {
      logger.error(`Error matching person "${person.name}":`, error);
    }

    return suggestions;
  }

  private async matchProject(project: MentionedEntity, session: any): Promise<EntitySuggestion[]> {
    const suggestions: EntitySuggestion[] = [];

    try {
      // Exact match by name
      const exactResult = await session.run(
        `MATCH (p:Project)
         WHERE toLower(p.name) = toLower($name)
         OPTIONAL MATCH (p)-[:OWNED_BY]->(owner:User)
         OPTIONAL MATCH (p)-[:BELONGS_TO]->(d:Department)
         RETURN p.id AS id, p.name AS name, p.status AS status,
                owner.name AS ownerName, d.name AS department
         LIMIT 5`,
        { name: project.name }
      );

      for (const record of exactResult.records) {
        suggestions.push({
          entityType: 'project',
          entityId: record.get('id'),
          entityName: record.get('name'),
          confidence: project.confidence * 0.95,
          context: project.context,
          matchType: 'exact',
          metadata: {
            status: record.get('status'),
            owner: record.get('ownerName'),
            department: record.get('department'),
          },
        });
      }

      // Fuzzy match if no exact match
      if (suggestions.length === 0) {
        const fuzzyResult = await session.run(
          `MATCH (p:Project)
           WHERE toLower(p.name) CONTAINS toLower($namePart)
              OR toLower(p.description) CONTAINS toLower($namePart)
           OPTIONAL MATCH (p)-[:OWNED_BY]->(owner:User)
           RETURN p.id AS id, p.name AS name, p.status AS status,
                  owner.name AS ownerName
           LIMIT 3`,
          { namePart: project.name }
        );

        for (const record of fuzzyResult.records) {
          suggestions.push({
            entityType: 'project',
            entityId: record.get('id'),
            entityName: record.get('name'),
            confidence: project.confidence * 0.7,
            context: project.context,
            matchType: 'fuzzy',
            metadata: {
              status: record.get('status'),
              owner: record.get('ownerName'),
            },
          });
        }
      }
    } catch (error) {
      logger.error(`Error matching project "${project.name}":`, error);
    }

    return suggestions;
  }

  private async matchDepartment(dept: MentionedEntity, session: any): Promise<EntitySuggestion[]> {
    const suggestions: EntitySuggestion[] = [];

    try {
      const result = await session.run(
        `MATCH (d:Department)
         WHERE toLower(d.name) = toLower($name)
            OR toLower(d.name) CONTAINS toLower($name)
         OPTIONAL MATCH (d)<-[:MEMBER_OF]-(manager:User {isManager: true})
         RETURN d.id AS id, d.name AS name, manager.name AS managerName
         LIMIT 3`,
        { name: dept.name }
      );

      for (const record of result.records) {
        const isExact = record.get('name').toLowerCase() === dept.name.toLowerCase();
        suggestions.push({
          entityType: 'department',
          entityId: record.get('id'),
          entityName: record.get('name'),
          confidence: dept.confidence * (isExact ? 0.95 : 0.7),
          context: dept.context,
          matchType: isExact ? 'exact' : 'fuzzy',
          metadata: {
            manager: record.get('managerName'),
          },
        });
      }
    } catch (error) {
      logger.error(`Error matching department "${dept.name}":`, error);
    }

    return suggestions;
  }

  private async semanticMatch(
    title: string,
    summary: string,
    tags: string[],
    session: any
  ): Promise<EntitySuggestion[]> {
    const suggestions: EntitySuggestion[] = [];

    try {
      // Combine title, summary, and tags into search terms
      const searchTerms = [
        ...title.toLowerCase().split(/\s+/),
        ...summary.toLowerCase().split(/\s+/),
        ...tags.map(t => t.toLowerCase()),
      ].filter(term => term.length > 3); // Only meaningful terms

      const uniqueTerms = [...new Set(searchTerms)].slice(0, 20); // Limit to top 20 terms

      if (uniqueTerms.length === 0) return suggestions;

      // Search for projects matching keywords
      const projectResult = await session.run(
        `MATCH (p:Project)
         WHERE ANY(term IN $terms WHERE 
           toLower(p.name) CONTAINS term OR 
           toLower(p.description) CONTAINS term
         )
         OPTIONAL MATCH (p)-[:OWNED_BY]->(owner:User)
         RETURN p.id AS id, p.name AS name, p.status AS status,
                owner.name AS ownerName
         LIMIT 5`,
        { terms: uniqueTerms }
      );

      for (const record of projectResult.records) {
        suggestions.push({
          entityType: 'project',
          entityId: record.get('id'),
          entityName: record.get('name'),
          confidence: 0.6, // Medium confidence for semantic match
          context: 'Matched by keywords in document',
          matchType: 'semantic',
          metadata: {
            status: record.get('status'),
            owner: record.get('ownerName'),
          },
        });
      }

      // Search for OKRs matching keywords
      const okrResult = await session.run(
        `MATCH (okr:OKR)
         WHERE ANY(term IN $terms WHERE 
           toLower(okr.title) CONTAINS term OR 
           toLower(okr.description) CONTAINS term
         )
         OPTIONAL MATCH (okr)-[:BELONGS_TO_OBJECTIVE]->(obj:Objective)
         RETURN okr.id AS id, okr.title AS title, obj.title AS objective
         LIMIT 5`,
        { terms: uniqueTerms }
      );

      for (const record of okrResult.records) {
        suggestions.push({
          entityType: 'okr',
          entityId: record.get('id'),
          entityName: record.get('title'),
          confidence: 0.6,
          context: 'Matched by keywords in document',
          matchType: 'semantic',
          metadata: {
            objective: record.get('objective'),
          },
        });
      }

      // Search for Objectives matching keywords
      const objResult = await session.run(
        `MATCH (obj:Objective)
         WHERE ANY(term IN $terms WHERE 
           toLower(obj.title) CONTAINS term OR 
           toLower(obj.description) CONTAINS term
         )
         OPTIONAL MATCH (obj)-[:OWNED_BY]->(owner:User)
         RETURN obj.id AS id, obj.title AS title, owner.name AS ownerName
         LIMIT 5`,
        { terms: uniqueTerms }
      );

      for (const record of objResult.records) {
        suggestions.push({
          entityType: 'objective',
          entityId: record.get('id'),
          entityName: record.get('title'),
          confidence: 0.6,
          context: 'Matched by keywords in document',
          matchType: 'semantic',
          metadata: {
            owner: record.get('ownerName'),
          },
        });
      }
    } catch (error) {
      logger.error('Error in semantic matching:', error);
    }

    return suggestions;
  }

  private deduplicateSuggestions(suggestions: EntitySuggestion[]): EntitySuggestion[] {
    const seen = new Set<string>();
    const unique: EntitySuggestion[] = [];

    for (const suggestion of suggestions) {
      const key = `${suggestion.entityType}:${suggestion.entityId}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(suggestion);
      } else {
        // If duplicate, keep the one with higher confidence
        const existingIndex = unique.findIndex(
          s => s.entityType === suggestion.entityType && s.entityId === suggestion.entityId
        );
        if (existingIndex >= 0 && suggestion.confidence > unique[existingIndex].confidence) {
          unique[existingIndex] = suggestion;
        }
      }
    }

    return unique;
  }
}
