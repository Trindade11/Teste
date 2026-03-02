import express, { Request, Response } from 'express';
import { PLAOrchestrator } from '../services/pla/PLAOrchestrator';
import { AgentContextInitializer } from '../services/pla/AgentContextInitializer';

const router = express.Router();
const plaOrchestrator = new PLAOrchestrator();

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { userId, conversationId, message, activeContext, sessionId } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId and message are required',
      });
    }

    const response = await plaOrchestrator.orchestrate({
      userId,
      conversationId: conversationId || `conv-${Date.now()}`,
      message,
      activeContext,
      sessionId,
    });

    return res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('PLA chat error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

router.get('/capabilities', async (req: Request, res: Response) => {
  try {
    const capabilities = await plaOrchestrator.getAgentCapabilities();

    return res.json({
      success: true,
      data: capabilities,
    });
  } catch (error) {
    console.error('PLA capabilities error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const profile = await plaOrchestrator.getUserProfile(userId);

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('PLA profile error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

router.get('/ontology-metadata', async (_req: Request, res: Response) => {
  try {
    const metadata = await AgentContextInitializer.getOntologyMetadata();

    return res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('PLA ontology metadata error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load ontology metadata',
    });
  }
});

router.post('/ontology-metadata/invalidate', async (_req: Request, res: Response) => {
  try {
    AgentContextInitializer.invalidateCache();

    return res.json({
      success: true,
      message: 'Ontology cache invalidated',
    });
  } catch (error) {
    console.error('PLA cache invalidation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to invalidate cache',
    });
  }
});

export default router;
