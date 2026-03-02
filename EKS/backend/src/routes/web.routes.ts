import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { webScraperService } from '../services/web-scraper.service';
import { SemanticChunk } from '../services/chunking/types';
import { curationService } from '../services/curation.service';

const router = Router();

const WEB_FIXED_CHUNK_SIZE = 1500;
const WEB_FIXED_CHUNK_OVERLAP = 200;

function buildFixedChunks(text: string, docId: string): SemanticChunk[] {
  const source = (text || '').trim();
  if (!source) return [];

  const chunks: SemanticChunk[] = [];
  const step = Math.max(1, WEB_FIXED_CHUNK_SIZE - WEB_FIXED_CHUNK_OVERLAP);

  for (let start = 0, idx = 0; start < source.length; start += step, idx++) {
    const slice = source.slice(start, start + WEB_FIXED_CHUNK_SIZE).trim();
    if (!slice || slice.length < 20) continue;

    chunks.push({
      id: `${docId}-chunk-${idx}`,
      text: slice,
      textLength: slice.length,
      sequenceIndex: idx,
      chunkType: idx === 0 ? 'title' : 'paragraph',
      sectionTitle: undefined,
      sectionNumber: undefined,
      hierarchyLevel: idx === 0 ? 1 : 2,
      validFrom: undefined,
      validUntil: undefined,
      effectiveAt: undefined,
      signedAt: undefined,
      metadata: {
        containsTable: false,
        tableData: undefined,
        keyTopics: [],
        estimatedImportance: 'medium',
        reasoning: `Fixed-size web chunking (${WEB_FIXED_CHUNK_SIZE} chars, overlap ${WEB_FIXED_CHUNK_OVERLAP})`,
      },
    });
  }

  return chunks;
}

router.use(authenticate);

// ============================================================================
// POST /web/preview
// Discover pages and PDFs at a URL without persisting anything.
// Body: { url: string, depth?: number (0-3, default 1) }
// ============================================================================
router.post('/preview', async (req: Request, res: Response): Promise<void> => {
  const { url, depth = 1 } = req.body as { url: string; depth?: number };

  if (!url || typeof url !== 'string') {
    res.status(400).json({ success: false, error: 'url is required' });
    return;
  }

  try {
    new URL(url); // validate
  } catch {
    res.status(400).json({ success: false, error: 'Invalid URL format' });
    return;
  }

  const clampedDepth = Math.min(Math.max(Number(depth) || 1, 0), 3);

  logger.info(`🌐 Web preview: ${url} (depth=${clampedDepth})`);

  try {
    const preview = await webScraperService.previewSite(url, clampedDepth);

    res.json({
      success: true,
      rootUrl: preview.rootUrl,
      rootTitle: preview.rootTitle,
      domain: preview.domain,
      pages: preview.pages,
      pdfs: preview.pdfs,
      stats: preview.stats,
    });
  } catch (error) {
    logger.error('Web preview error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview site',
    });
  }
});

// ============================================================================
// POST /web/ingest
// Scrape selected pages + optional PDFs → chunk → persist in Neo4j.
// Body: {
//   url: string,           root URL (becomes :WebSource)
//   title?: string,        override title
//   selectedPages: string[],
//   downloadPdfs?: boolean,
//   selectedPdfs?: string[],
//   projectIds?: string[],
//   objectiveIds?: string[],
//   okrIds?: string[],
//   pageLevels?: Record<string, number>  map url -> depth level
// }
// ============================================================================
router.post('/ingest', async (req: Request, res: Response): Promise<void> => {
  const userId: string = (req as any).user?.id || (req as any).user?.userId || 'system';

    const {
      url,
      title,
      selectedPages,
      downloadPdfs = false,
      selectedPdfs = [],
      projectIds = [],
      objectiveIds = [],
      okrIds = [],
      pageLevels = {},
      visibility = 'corporate',
    } = req.body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ success: false, error: 'url is required' });
      return;
    }
    if (!Array.isArray(selectedPages) || selectedPages.length === 0) {
      res.status(400).json({ success: false, error: 'selectedPages must be a non-empty array' });
      return;
    }
    if (selectedPages.length > env.MAX_WEB_PAGES) {
      res.status(400).json({ 
        success: false, 
        error: `Cannot select more than ${env.MAX_WEB_PAGES} pages at once (selected: ${selectedPages.length})` 
      });
      return;
    }

    // Calculate estimated total size from preview data (selected items only)
    let totalEstimatedMb = 0;
    if (req.body.previewData) {
      const preview = req.body.previewData;
      const selectedPageSet = new Set<string>(selectedPages);
      const selectedPdfSet = new Set<string>(selectedPdfs);

      // Pages: sum only selected URLs (fallback 50KB/page when size missing)
      totalEstimatedMb += (preview.pages || []).reduce((acc: number, page: any) => {
        if (!selectedPageSet.has(page?.url)) return acc;
        return acc + (page.sizeKb || 50) / 1024;
      }, 0);

      // PDFs: sum only selected URLs
      totalEstimatedMb += (preview.pdfs || []).reduce((acc: number, pdf: any) => {
        if (!selectedPdfSet.has(pdf?.url)) return acc;
        return acc + (pdf.sizeKb || 0) / 1024;
      }, 0);
    } else {
      // Fallback: rough estimate if no preview data
      totalEstimatedMb = selectedPages.length * 0.05; // 50KB per page average
      if (selectedPdfs && selectedPdfs.length > 0) {
        totalEstimatedMb += selectedPdfs.length * 0.5; // 500KB per PDF average
      }
    }

    if (totalEstimatedMb > env.MAX_WEB_SIZE_MB) {
      res.status(400).json({ 
        success: false, 
        error: `Estimated size ${Math.round(totalEstimatedMb)}MB exceeds limit of ${env.MAX_WEB_SIZE_MB}MB. Try selecting fewer pages or smaller PDFs.` 
      });
      return;
    }

    const domain = webScraperService.getDomain(url);
    const webSourceId = randomUUID();
    const session = neo4jConnection.getSession();
    const tx = session.beginTransaction();

    const relationships: string[] = [];

    try {
      // 1. Create :WebSource node
      await tx.run(
        `CREATE (ws:WebSource {
           id: $id,
           url: $url,
           title: $title,
           domain: $domain,
           status: 'processing',
           pageCount: 0,
           visibility: $visibility,
           createdBy: $createdBy,
           createdAt: datetime()
         })`,
        {
          id: webSourceId,
          url,
          title: title || domain,
          domain,
          visibility,
          createdBy: userId,
        }
      );

      // 1.1 Link uploader
      await tx.run(
        `MATCH (ws:WebSource {id: $wsId})
         MATCH (u:User {id: $userId})
         MERGE (u)-[:UPLOADED]->(ws)`,
        { wsId: webSourceId, userId }
      );
      relationships.push('User-UPLOADED-WebSource');

      // 2. Link to Projects if provided
      if (projectIds && projectIds.length > 0) {
        for (const pid of projectIds) {
          await tx.run(
            `MATCH (ws:WebSource {id: $wsId})
             MATCH (p) WHERE (p:Project OR p:project) AND (p.id = $pid OR p.projectId = $pid OR elementId(p) = $pid)
             MERGE (ws)-[:LINKED_TO]->(p)`,
            { wsId: webSourceId, pid }
          );
        }
        relationships.push('WebSource-LINKED_TO-Project');
      }

      // Link to OKRs if provided
      if (okrIds && okrIds.length > 0) {
        for (const oid of okrIds) {
          await tx.run(
            `MATCH (ws:WebSource {id: $wsId})
             MATCH (okr:OKR {id: $oid})
             MERGE (ws)-[:LINKED_TO_OKR]->(okr)`,
            { wsId: webSourceId, oid }
          );
        }
        relationships.push('WebSource-LINKED_TO_OKR-OKR');
      }

      // Link to Objectives if provided
      if (objectiveIds && objectiveIds.length > 0) {
        for (const oid of objectiveIds) {
          await tx.run(
            `MATCH (ws:WebSource {id: $wsId})
             MATCH (obj:Objective {id: $oid})
             MERGE (ws)-[:SUPPORTS]->(obj)`,
            { wsId: webSourceId, oid }
          );
        }
        relationships.push('WebSource-SUPPORTS-Objective');
      }

    const ingestedPages: Array<{ url: string; title: string; chunkCount: number }> = [];
    let prevWebPageId: string | null = null;

    // 3. Scrape selected HTML pages
    for (const pageUrl of selectedPages) {
      logger.info(`🌐 Scraping page: ${pageUrl}`);

      const scraped = await webScraperService.scrapePage(
        pageUrl,
        pageLevels[pageUrl] ?? 0
      );

      if (!scraped || !scraped.text || scraped.text.length < 50) {
        logger.warn(`Skipping ${pageUrl}: insufficient content`);
        continue;
      }

      const webPageId = randomUUID();
      const pageTitle = scraped.title || pageUrl;

      // Create :WebPage node
      await tx.run(
        `MATCH (ws:WebSource {id: $wsId})
         CREATE (wp:WebPage {
           id: $id,
           webSourceId: $wsId,
           url: $url,
           title: $title,
           level: $level,
           textLength: $textLength,
           sizeKb: $sizeKb,
           chunkCount: 0,
           createdAt: datetime()
         })
         CREATE (ws)-[:HAS_PAGE]->(wp)`,
        {
          wsId: webSourceId,
          id: webPageId,
          url: pageUrl,
          title: pageTitle,
          level: scraped.level,
          textLength: scraped.text.length,
          sizeKb: scraped.sizeKb,
        }
      );

      // Sequential page ordering
      if (prevWebPageId) {
        await tx.run(
          `MATCH (prev:WebPage {id: $prevId})
           MATCH (curr:WebPage {id: $currId})
           MERGE (prev)-[:NEXT_PAGE]->(curr)`,
          { prevId: prevWebPageId, currId: webPageId }
        );
      }

      // Chunk the page content
      const semanticChunks = buildFixedChunks(scraped.text, webPageId);

      if (semanticChunks.length === 0) {
        logger.warn(`Skipping ${pageUrl}: fixed chunking produced no chunks`);
        continue;
      }

      let prevChunkId: string | null = null;
      for (const chunk of semanticChunks) {
        const chunkId = randomUUID();
        const containsTable = Boolean(chunk.metadata?.containsTable);
        const tableDataJson = chunk.metadata?.tableData
          ? JSON.stringify(chunk.metadata.tableData)
          : null;
        const keyTopics = Array.isArray(chunk.metadata?.keyTopics)
          ? chunk.metadata.keyTopics
          : [];

        await tx.run(
          `MATCH (wp:WebPage {id: $webPageId})
           CREATE (c:Chunk {
             id: $id,
             webPageId: $webPageId,
             webSourceId: $webSourceId,
             text: $text,
             textLength: $textLength,
             chunkType: $chunkType,
             hierarchyLevel: $hierarchyLevel,
             sectionNumber: $sectionNumber,
             sectionTitle: $sectionTitle,
             sequenceIndex: $sequenceIndex,
             containsTable: $containsTable,
             tableDataJson: $tableDataJson,
             keyTopics: $keyTopics,
             estimatedImportance: $estimatedImportance,
             reasoning: $reasoning,
             createdAt: datetime()
           })
           MERGE (wp)-[:HAS_CHUNK {sequenceIndex: $sequenceIndex}]->(c)`,
          {
            webPageId,
            id: chunkId,
            webSourceId,
            text: chunk.text,
            textLength: chunk.text.length,
            chunkType: chunk.chunkType,
            hierarchyLevel: chunk.hierarchyLevel,
            sectionNumber: chunk.sectionNumber || null,
            sectionTitle: chunk.sectionTitle || null,
            sequenceIndex: chunk.sequenceIndex,
            containsTable,
            tableDataJson,
            keyTopics,
            estimatedImportance:
              typeof chunk.metadata?.estimatedImportance === 'string'
                ? chunk.metadata.estimatedImportance
                : null,
            reasoning:
              typeof chunk.metadata?.reasoning === 'string'
                ? chunk.metadata.reasoning
                : null,
          }
        );

        if (prevChunkId) {
          await tx.run(
            `MATCH (prev:Chunk {id: $prevId})
             MATCH (curr:Chunk {id: $currId})
             MERGE (prev)-[:FOLLOWS]->(curr)`,
            { prevId: prevChunkId, currId: chunkId }
          );
        }

        prevChunkId = chunkId;
      }

      // Update page chunkCount
      await tx.run(
        `MATCH (wp:WebPage {id: $id}) SET wp.chunkCount = $count`,
        { id: webPageId, count: semanticChunks.length }
      );

      ingestedPages.push({ url: pageUrl, title: pageTitle, chunkCount: semanticChunks.length });
      prevWebPageId = webPageId;
    }

    // 4. Download + ingest PDFs (if requested)
    if (downloadPdfs && selectedPdfs.length > 0) {
      const { FileTextExtractorService } = await import('../services/file-text-extractor.service');
      const pdfExtractor = new FileTextExtractorService();

      for (const pdfUrl of selectedPdfs.slice(0, 10)) {
        logger.info(`📄 Downloading PDF: ${pdfUrl}`);
        const buffer = await webScraperService.fetchPdfBuffer(pdfUrl);
        if (!buffer) continue;

        const filename = decodeURIComponent(pdfUrl.split('/').pop() || 'document.pdf');
        const fakeFile = {
          originalname: filename,
          buffer,
          mimetype: 'application/pdf',
        } as Express.Multer.File;

        let pdfText = '';
        try {
          pdfText = await pdfExtractor.extract(fakeFile);
        } catch (e) {
          logger.warn(`Could not extract text from PDF ${pdfUrl}:`, e);
          continue;
        }
        if (!pdfText || pdfText.length < 50) continue;

        const webPageId = randomUUID();
        await tx.run(
          `MATCH (ws:WebSource {id: $wsId})
           CREATE (wp:WebPage {
             id: $id,
             webSourceId: $wsId,
             url: $url,
             title: $title,
             isPdf: true,
             level: 1,
             textLength: $textLength,
             sizeKb: $sizeKb,
             chunkCount: 0,
             createdAt: datetime()
           })
           CREATE (ws)-[:HAS_PAGE]->(wp)`,
          {
            wsId: webSourceId,
            id: webPageId,
            url: pdfUrl,
            title: filename,
            textLength: pdfText.length,
            sizeKb: Math.round(buffer.length / 1024),
          }
        );

        const pdfChunks = buildFixedChunks(pdfText, webPageId);
        if (pdfChunks.length === 0) {
          logger.warn(`Skipping PDF ${pdfUrl}: fixed chunking produced no chunks`);
          continue;
        }

        let prevPdfChunkId: string | null = null;
        for (const chunk of pdfChunks) {
          const chunkId = randomUUID();
          await tx.run(
            `MATCH (wp:WebPage {id: $webPageId})
             CREATE (c:Chunk {
               id: $id,
               webPageId: $webPageId,
               webSourceId: $webSourceId,
               text: $text,
               textLength: $textLength,
               chunkType: $chunkType,
               hierarchyLevel: $hierarchyLevel,
               sectionNumber: $sectionNumber,
               sectionTitle: $sectionTitle,
               sequenceIndex: $sequenceIndex,
               containsTable: $containsTable,
               tableDataJson: $tableDataJson,
               keyTopics: $keyTopics,
               createdAt: datetime()
             })
             MERGE (wp)-[:HAS_CHUNK {sequenceIndex: $sequenceIndex}]->(c)`,
            {
              webPageId,
              id: chunkId,
              webSourceId,
              text: chunk.text,
              textLength: chunk.text.length,
              chunkType: chunk.chunkType,
              hierarchyLevel: chunk.hierarchyLevel,
              sectionNumber: chunk.sectionNumber || null,
              sectionTitle: chunk.sectionTitle || null,
              sequenceIndex: chunk.sequenceIndex,
              containsTable: Boolean(chunk.metadata?.containsTable),
              tableDataJson: chunk.metadata?.tableData
                ? JSON.stringify(chunk.metadata.tableData)
                : null,
              keyTopics: Array.isArray(chunk.metadata?.keyTopics)
                ? chunk.metadata.keyTopics
                : [],
            }
          );

          if (prevPdfChunkId) {
            await tx.run(
              `MATCH (prev:Chunk {id: $prevId})
               MATCH (curr:Chunk {id: $currId})
               MERGE (prev)-[:FOLLOWS]->(curr)`,
              { prevId: prevPdfChunkId, currId: chunkId }
            );
          }
          prevPdfChunkId = chunkId;
        }

        await tx.run(
          `MATCH (wp:WebPage {id: $id}) SET wp.chunkCount = $count`,
          { id: webPageId, count: pdfChunks.length }
        );

        ingestedPages.push({ url: pdfUrl, title: filename, chunkCount: pdfChunks.length });
      }
    }

    // 5. Finalize :WebSource status
    await tx.run(
      `MATCH (ws:WebSource {id: $id})
       SET ws.status = 'completed',
           ws.pageCount = $pageCount,
           ws.curationStatus = CASE WHEN $visibility = 'individual' THEN 'approved' ELSE 'pending' END,
           ws.processedAt = datetime()`,
      { id: webSourceId, pageCount: ingestedPages.length, visibility }
    );

    await tx.commit();
    
    // 6. Route for curation (async, outside transaction)
    if (visibility !== 'individual') {
      curationService.routeForCuration(webSourceId, 'WebSource', userId, visibility).catch(e => {
        logger.error(`Failed to route WebSource ${webSourceId} for curation`, e);
      });
    }

    logger.info(`✅ Web ingested: ${webSourceId} — ${ingestedPages.length} pages`);

    res.status(201).json({
      success: true,
      webSourceId,
      domain,
      pageCount: ingestedPages.length,
      pages: ingestedPages,
      relationships,
    });
  } catch (error) {
    await tx.rollback();
    logger.error('Web ingest error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ingest web content',
    });
  } finally {
    await session.close();
  }
});

// ============================================================================
// GET /web/sources
// List all :WebSource nodes the user can access.
// ============================================================================
router.get('/sources', async (_req: Request, res: Response): Promise<void> => {
  const session = neo4jConnection.getSession();
  try {
    const result = await session.run(
      `MATCH (ws:WebSource)
       OPTIONAL MATCH (ws)-[:LINKED_TO]->(p)
       RETURN ws.id AS id, ws.url AS url, ws.title AS title, ws.domain AS domain,
              ws.status AS status, ws.pageCount AS pageCount,
              ws.summary AS summary, ws.keyTopics AS keyTopics,
              ws.createdAt AS createdAt, ws.processedAt AS processedAt,
              coalesce(p.name, p.title, null) AS projectName
       ORDER BY ws.createdAt DESC
       LIMIT 100`
    );

    const sources = result.records.map((r) => ({
      id: r.get('id'),
      url: r.get('url'),
      title: r.get('title'),
      domain: r.get('domain'),
      status: r.get('status'),
      pageCount: r.get('pageCount'),
      summary: r.get('summary'),
      keyTopics: r.get('keyTopics'),
      createdAt: r.get('createdAt'),
      processedAt: r.get('processedAt'),
      projectName: r.get('projectName'),
    }));

    res.json({ success: true, sources });
  } catch (error) {
    logger.error('Web sources list error:', error);
    res.status(500).json({ success: false, error: 'Failed to list web sources' });
  } finally {
    await session.close();
  }
});

// ============================================================================
// GET /web/sources/:id
// Get a single :WebSource with its pages and entity summary.
// ============================================================================
router.get('/sources/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const session = neo4jConnection.getSession();
  try {
    const wsResult = await session.run(
      `MATCH (ws:WebSource {id: $id})
       OPTIONAL MATCH (ws)-[:LINKED_TO]->(p)
       RETURN ws, coalesce(p.name, p.title, null) AS projectName`,
      { id }
    );

    if (wsResult.records.length === 0) {
      res.status(404).json({ success: false, error: 'WebSource not found' });
      return;
    }

    const ws = wsResult.records[0].get('ws').properties;
    const projectName = wsResult.records[0].get('projectName');

    const pagesResult = await session.run(
      `MATCH (wp:WebPage {webSourceId: $id})
       RETURN wp.id AS id, wp.url AS url, wp.title AS title,
              wp.level AS level, wp.chunkCount AS chunkCount,
              wp.isPdf AS isPdf, wp.sizeKb AS sizeKb
       ORDER BY wp.level, wp.title`,
      { id }
    );

    const entitiesResult = await session.run(
      `MATCH (e)-[:EXTRACTED_FROM]->(ws:WebSource {id: $id})
       WHERE (e:Task OR e:Decision OR e:Risk OR e:Insight)
       RETURN labels(e)[0] AS type, count(e) AS count`,
      { id }
    );

    const entityCounts: Record<string, number> = {};
    for (const r of entitiesResult.records) {
      entityCounts[r.get('type').toLowerCase()] = r.get('count').toNumber?.() ?? r.get('count');
    }

    res.json({
      success: true,
      webSource: { ...ws, projectName },
      pages: pagesResult.records.map((r) => ({
        id: r.get('id'),
        url: r.get('url'),
        title: r.get('title'),
        level: r.get('level'),
        chunkCount: r.get('chunkCount'),
        isPdf: r.get('isPdf') ?? false,
        sizeKb: r.get('sizeKb'),
      })),
      entityCounts,
    });
  } catch (error) {
    logger.error('Web source detail error:', error);
    res.status(500).json({ success: false, error: 'Failed to get web source' });
  } finally {
    await session.close();
  }
});

export default router;
