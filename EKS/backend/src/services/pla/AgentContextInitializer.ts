/**
 * Agent Context Initializer
 * Fornece metadados da ontologia para o agente conhecer o banco desde o início
 */

import { neo4jConnection } from '../../config/neo4j';
import { logger } from '../../utils/logger';

export interface OntologyMetadata {
  labels: Array<{
    name: string;
    category: string;
    count: number;
    properties: Array<{ name: string; types: string[] }>;
  }>;
  relationships: Array<{
    type: string;
    count: number;
  }>;
  totalNodes: number;
  totalRelationships: number;
  categories: {
    organization: string[];
    person: string[];
    content: string[];
    strategy: string[];
    process: string[];
    memory: string[];
  };
}

export class AgentContextInitializer {
  private static cachedMetadata: OntologyMetadata | null = null;
  private static lastCacheTime: number = 0;
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtém metadados completos da ontologia
   * Cache de 5 minutos para performance
   */
  static async getOntologyMetadata(): Promise<OntologyMetadata> {
    const now = Date.now();
    
    // Retorna cache se ainda válido
    if (this.cachedMetadata && (now - this.lastCacheTime) < this.CACHE_TTL) {
      logger.info('📦 Using cached ontology metadata');
      return this.cachedMetadata;
    }

    logger.info('🔄 Loading fresh ontology metadata...');
    const session = neo4jConnection.getSession();

    try {
      // 1. Buscar labels com contagem
      const labelsResult = await session.run(`
        CALL db.labels() YIELD label
        WITH label
        WHERE NOT label IN ['SchemaLabel', 'SchemaRel', 'SchemaProp', 'QueryProfile', 'AccessPolicy', 'CypherTemplate', 'SchemaVersion']
        CALL apoc.cypher.run('MATCH (n:\`' + label + '\`) RETURN count(n) AS cnt', {}) YIELD value
        RETURN label, value.cnt AS count
        ORDER BY label
      `);

      // 2. Buscar propriedades de cada label
      const propsResult = await session.run(`
        CALL db.schema.nodeTypeProperties() 
        YIELD nodeLabels, propertyName, propertyTypes
        RETURN nodeLabels, propertyName, propertyTypes
      `);

      // 3. Buscar SchemaLabels do Meta-Grafo (categoria)
      const schemaLabelsResult = await session.run(`
        MATCH (sl:SchemaLabel)
        RETURN sl.name AS name, sl.category AS category, sl.description AS description
      `);

      // 4. Buscar tipos de relacionamento
      const relsResult = await session.run(`
        CALL db.relationshipTypes() YIELD relationshipType
        WITH relationshipType
        CALL apoc.cypher.run('MATCH ()-[r:\`' + relationshipType + '\`]->() RETURN count(r) AS cnt', {}) YIELD value
        RETURN relationshipType, value.cnt AS count
        ORDER BY relationshipType
      `);

      // 5. Estatísticas gerais
      const statsResult = await session.run(`
        MATCH (n)
        WITH count(n) AS nodeCount
        MATCH ()-[r]->()
        RETURN nodeCount, count(r) AS relCount
      `);

      // Processar resultados
      const schemaMap = new Map<string, { category: string; description: string }>();
      schemaLabelsResult.records.forEach(r => {
        schemaMap.set(r.get('name'), {
          category: r.get('category') || 'unknown',
          description: r.get('description') || '',
        });
      });

      const propsMap = new Map<string, Array<{ name: string; types: string[] }>>();
      propsResult.records.forEach(r => {
        const labels = r.get('nodeLabels') as string[];
        const propName = r.get('propertyName');
        const propTypes = r.get('propertyTypes');

        labels.forEach(label => {
          if (!propsMap.has(label)) {
            propsMap.set(label, []);
          }
          propsMap.get(label)!.push({
            name: propName,
            types: propTypes,
          });
        });
      });

      const labels = labelsResult.records.map(r => {
        const labelName = r.get('label');
        const schema = schemaMap.get(labelName);
        
        return {
          name: labelName,
          category: schema?.category || 'unknown',
          count: r.get('count')?.toNumber?.() || (r.get('count') as number),
          properties: propsMap.get(labelName) || [],
        };
      });

      const relationships = relsResult.records.map(r => ({
        type: r.get('relationshipType'),
        count: r.get('count')?.toNumber?.() || (r.get('count') as number),
      }));

      const stats = statsResult.records[0];
      const totalNodes = stats?.get('nodeCount')?.toNumber?.() || 0;
      const totalRelationships = stats?.get('relCount')?.toNumber?.() || 0;

      // Agrupar por categoria
      const categories = {
        organization: [] as string[],
        person: [] as string[],
        content: [] as string[],
        strategy: [] as string[],
        process: [] as string[],
        memory: [] as string[],
      };

      labels.forEach(label => {
        const cat = label.category as keyof typeof categories;
        if (categories[cat]) {
          categories[cat].push(label.name);
        }
      });

      const metadata: OntologyMetadata = {
        labels,
        relationships,
        totalNodes,
        totalRelationships,
        categories,
      };

      // Atualizar cache
      this.cachedMetadata = metadata;
      this.lastCacheTime = now;

      logger.info(`✅ Ontology metadata loaded: ${labels.length} labels, ${relationships.length} relationship types, ${totalNodes} nodes`);

      return metadata;
    } catch (error) {
      logger.error('Failed to load ontology metadata:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Formata metadados em texto para prompt do agente
   */
  static formatForAgentPrompt(metadata: OntologyMetadata): string {
    const labelsByCategory = Object.entries(metadata.categories)
      .filter(([_, labels]) => labels.length > 0)
      .map(([cat, labels]) => `  - ${cat}: ${labels.join(', ')}`)
      .join('\n');

    const topRelationships = metadata.relationships
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map(r => `  - ${r.type} (${r.count} instâncias)`)
      .join('\n');

    return `
# Ontologia Neo4j (Conhecimento Estruturado)

## Estatísticas
- **Total de nós**: ${metadata.totalNodes}
- **Total de relacionamentos**: ${metadata.totalRelationships}
- **Tipos de nós (labels)**: ${metadata.labels.length}
- **Tipos de relacionamento**: ${metadata.relationships.length}

## Labels por Categoria
${labelsByCategory}

## Principais Relacionamentos
${topRelationships}

## Como Usar
- Para busca determinística: Use @NomeLabel (ex: @Projeto, @Pessoa)
- Para busca semântica: Busque por conceitos e o sistema encontrará via embeddings
- Relações: Use padrões como "pessoa TRABALHA_EM departamento"
    `.trim();
  }

  /**
   * Invalida cache (chamar após inserções massivas)
   */
  static invalidateCache(): void {
    this.cachedMetadata = null;
    this.lastCacheTime = 0;
    logger.info('♻️  Ontology cache invalidated');
  }
}
