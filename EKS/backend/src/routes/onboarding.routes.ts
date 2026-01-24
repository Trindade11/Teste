import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authenticate } from '../middleware/auth';
import { neo4jConnection } from '../config/neo4j';
import { logger } from '../utils/logger';
import { generateUserMetadataInsights, generatePersonaSummary } from '../services/llm.service';

const router = Router();

router.use(authenticate);

router.get('/draft', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[:HAS_ONBOARDING_DRAFT]->(d:OnboardingDraft)
       RETURN d.dataJson AS dataJson, d.updatedAt AS updatedAt`,
      { userId }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const record = result.records[0];
    const dataJson = record.get('dataJson') ?? null;
    const updatedAt = record.get('updatedAt') ?? null;

    res.json({
      success: true,
      data: dataJson
        ? {
            draft: JSON.parse(dataJson),
            updatedAt,
          }
        : null,
    });
  } catch (error) {
    logger.error('Onboarding draft get error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load onboarding draft',
    });
  } finally {
    await session.close();
  }
});

router.post('/draft', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const draft = req.body?.draft;

    if (!draft || typeof draft !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Invalid draft payload',
      });
      return;
    }

    const now = new Date().toISOString();
    const dataJson = JSON.stringify(draft);

    await session.run(
      `MATCH (u:User {id: $userId})
       MERGE (d:OnboardingDraft {userId: $userId})
       SET d.dataJson = $dataJson,
           d.updatedAt = $now
       MERGE (u)-[:HAS_ONBOARDING_DRAFT]->(d)`,
      { userId, dataJson, now }
    );

    res.json({
      success: true,
      data: {
        updatedAt: now,
      },
    });
  } catch (error) {
    logger.error('Onboarding draft save error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save onboarding draft',
    });
  } finally {
    await session.close();
  }
});

router.post('/complete', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const payload = req.body?.payload;

    if (!payload || typeof payload !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Invalid onboarding payload',
      });
      return;
    }

    const now = new Date().toISOString();
    const froId = randomUUID();
    const aiProfileId = randomUUID();
    const personaVersionId = randomUUID();

    const roleDescription = typeof payload.roleDescription === 'string' ? payload.roleDescription : '';
    const departmentDescription = typeof payload.departmentDescription === 'string' ? payload.departmentDescription : '';
    const profileDescription = typeof payload.profileDescription === 'string' ? payload.profileDescription : '';
    const competencies = Array.isArray(payload.competencies) ? payload.competencies : [];
    const primaryObjective = typeof payload.primaryObjective === 'string' ? payload.primaryObjective : '';
    const topChallenges = typeof payload.topChallenges === 'string' ? payload.topChallenges : '';
    const orgChartValidated = Boolean(payload.orgChartValidated);
    const defaultVisibility = payload.defaultVisibility === 'personal' ? 'personal' : 'corporate';
    const memoryLevel = ['short', 'medium', 'long'].includes(payload.memoryLevel) ? payload.memoryLevel : 'long';

    // Get user data for LLM enrichment
    const userResult = await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       RETURN u.name AS fullName, u.jobTitle AS jobTitle, u.company AS company, d.name AS department`,
      { userId }
    );

    const userData = userResult.records[0];
    const fullName = userData?.get('fullName') || 'Usuário';
    const jobTitle = userData?.get('jobTitle') || '';
    const company = userData?.get('company') || '';
    const department = userData?.get('department') || '';

    // Generate metadata insights via LLM (async, non-blocking)
    let metadataInsights = null;
    let personaSummary = null;

    try {
      const profileData = {
        fullName,
        jobTitle,
        company,
        department,
        profileDescription,
        roleDescription,
        departmentDescription,
        competencies,
        primaryObjective,
        topChallenges,
      };

      // Run LLM calls in parallel for speed
      const [insights, summary] = await Promise.all([
        generateUserMetadataInsights(profileData),
        generatePersonaSummary(profileData),
      ]);

      metadataInsights = insights;
      personaSummary = summary;

      logger.info(`LLM enrichment completed for user ${userId}`);
    } catch (llmError) {
      logger.warn(`LLM enrichment failed (non-critical): ${llmError}`);
    }

    // Prepare LLM-generated values with fallbacks
    const llmPersonaSummary = personaSummary || `${fullName} é ${jobTitle || 'profissional'}. ${profileDescription.substring(0, 100)}`;
    const llmWorkStyle = metadataInsights?.work_style || '';
    const llmCommunicationPref = metadataInsights?.communication_preference || 'direto';
    const llmExpertiseAreas = metadataInsights?.expertise_areas || [];
    const llmPotentialNeeds = metadataInsights?.potential_needs || [];
    const llmPersonalityTraits = metadataInsights?.personality_traits || [];
    const llmDecisionProfile = metadataInsights?.decision_making_profile || '';
    const llmCollaborationStyle = metadataInsights?.collaboration_style || '';

    // Create FirstRunOnboarding with full schema (spec 022) + name property on all nodes
    await session.run(
      `MATCH (u:User {id: $userId})
       
       // Step 1: Create FirstRunOnboarding node (with name for visualization)
       CREATE (fro:FirstRunOnboarding {
         id: $froId,
         name: 'Onboarding',
         user_email: u.email,
         
         // Profile data (redundant for easy retrieval)
         full_name: u.name,
         job_role: u.jobTitle,
         company: u.company,
         department: COALESCE($department, ''),
         
         // Onboarding content
         profile_description: $profileDescription,
         role_description: $roleDescription,
         department_description: $departmentDescription,
         competencies: $competencies,
         primary_objective: $primaryObjective,
         top_challenges: $topChallenges,
         
         // Validations
         org_chart_validated: $orgChartValidated,
         
         // LLM-generated metadata
         llm_persona_summary: $llmPersonaSummary,
         llm_work_style: $llmWorkStyle,
         llm_expertise_areas: $llmExpertiseAreas,
         llm_potential_needs: $llmPotentialNeeds,
         llm_personality_traits: $llmPersonalityTraits,
         llm_enriched: $hasLlmInsights,
         
         // Provenance metadata
         source_type: 'user_input',
         confidence: 1.0,
         
         // Temporal metadata
         created_at: datetime($now),
         completed_at: datetime($now),
         updated_at: datetime($now),
         
         // Versioning
         version: 'v1',
         status: 'active',
         
         // Memory settings
         memory_level: $memoryLevel,
         default_visibility: $defaultVisibility
       })
       
       // Step 2: Create relationship User -> FirstRunOnboarding
       CREATE (u)-[:COMPLETED_FIRST_RUN_ONBOARDING {
         completed_at: datetime($now),
         duration_seconds: 480,
         version: 'v1'
       }]->(fro)
       
       // Step 3: Create CONFIRMS_POSITION relationship
       CREATE (fro)-[:CONFIRMS_POSITION {
         validated: $orgChartValidated,
         validated_at: datetime($now)
       }]->(u)
       
       // Step 4: Create AIProfile - basic placeholder (will evolve via chat usage)
       CREATE (ai:AIProfile {
         id: $aiProfileId,
         name: 'Perfil',
         user_email: u.email,
         
         // Basic profile (to be enriched during chat usage)
         ai_experience_level: 'a_definir',
         technical_path: false,
         preferred_communication: $llmCommunicationPref,
         
         // LLM insights stored for future use
         llm_decision_profile: $llmDecisionProfile,
         llm_collaboration_style: $llmCollaborationStyle,
         
         status: 'placeholder',
         created_at: datetime($now),
         updated_at: datetime($now),
         source: 'first_run_onboarding',
         source_id: $froId,
         notes: 'Perfil básico criado no onboarding. Será enriquecido durante uso do chat.'
       })
       CREATE (u)-[:HAS_AI_PROFILE]->(ai)
       CREATE (fro)-[:INITIATES]->(ai)
       
       // Step 5: Create PersonaVersion (spec 022)
       CREATE (pv:PersonaVersion {
         id: $personaVersionId,
         name: 'Persona',
         user_email: u.email,
         version: 'v1',
         
         // LLM-enriched summary
         persona_summary: $llmPersonaSummary,
         
         // Core data
         core_competencies: $competencies,
         organizational_context: LEFT($roleDescription, 200),
         primary_goals: $primaryObjective,
         key_challenges: $topChallenges,
         
         // LLM metadata
         expertise_areas: $llmExpertiseAreas,
         potential_needs: $llmPotentialNeeds,
         work_style: $llmWorkStyle,
         
         status: 'active',
         confidence: 1.0,
         source: 'first_run_onboarding',
         source_id: $froId,
         created_at: datetime($now),
         updated_at: datetime($now)
       })
       CREATE (fro)-[:GENERATES]->(pv)
       CREATE (ai)-[:CURRENT_PERSONA]->(pv)
       CREATE (u)-[:HAS_PERSONA_VERSION]->(pv)
       
       // Step 6: Clean up draft
       WITH u, fro
       OPTIONAL MATCH (u)-[:HAS_ONBOARDING_DRAFT]->(d:OnboardingDraft)
       DETACH DELETE d
       
       // Step 7: Update user status
       SET u.onboardingStatus = 'completed',
           u.onboardingCompletedAt = $now,
           u.hasCompletedOnboarding = true,
           u.hasReceivedWelcome = false,
           u.gmailConnected = false,
           u.gmailSkipped = false`,
      {
        userId,
        froId,
        aiProfileId,
        personaVersionId,
        now,
        department,
        roleDescription,
        departmentDescription,
        profileDescription,
        competencies,
        primaryObjective,
        topChallenges,
        orgChartValidated,
        defaultVisibility,
        memoryLevel,
        llmPersonaSummary,
        llmWorkStyle,
        llmCommunicationPref,
        llmExpertiseAreas,
        llmPotentialNeeds,
        llmPersonalityTraits,
        llmDecisionProfile,
        llmCollaborationStyle,
        hasLlmInsights: metadataInsights !== null,
      }
    );

    // Create Competency nodes separately (UNWIND doesn't work well in same query)
    if (competencies.length > 0) {
      await session.run(
        `MATCH (u:User {id: $userId})
         MATCH (fro:FirstRunOnboarding {id: $froId})
         UNWIND $competencies AS competencyName
         MERGE (c:Competency {name: competencyName})
         ON CREATE SET c.id = randomUUID(), c.created_at = datetime($now)
         MERGE (u)-[:HAS_COMPETENCY {
           source: 'first_run_onboarding',
           source_id: $froId,
           confidence: 1.0,
           declared_at: datetime($now)
         }]->(c)`,
        { userId, froId, competencies, now }
      );
    }

    logger.info(`First-Run Onboarding completed for user ${userId}: FRO=${froId}, AIProfile=${aiProfileId}, PersonaVersion=${personaVersionId}, LLM=${metadataInsights !== null}`);

    res.json({
      success: true,
      data: {
        completedAt: now,
        firstRunOnboardingId: froId,
        aiProfileId,
        personaVersionId,
        competenciesCount: competencies.length,
        llmEnriched: metadataInsights !== null,
        requiresWelcome: true,
      },
    });
  } catch (error) {
    logger.error('Onboarding complete error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete onboarding',
    });
  } finally {
    await session.close();
  }
});

router.get('/status', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {id: $userId})
       RETURN u.onboardingStatus AS status, u.onboardingCompletedAt AS completedAt`,
      { userId }
    );

    if (result.records.length === 0) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const record = result.records[0];
    const status = record.get('status') || 'not_started';
    const completedAt = record.get('completedAt') || null;

    res.json({
      success: true,
      data: {
        status,
        completedAt,
      },
    });
  } catch (error) {
    logger.error('Onboarding status get error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load onboarding status',
    });
  } finally {
    await session.close();
  }
});

router.get('/welcome-status', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[:HAS_CONVERSATION]->(c:Conversation {type: 'inaugural'})
       RETURN 
         u.hasCompletedOnboarding AS hasCompletedOnboarding,
         u.hasReceivedWelcome AS hasReceivedWelcome,
         u.gmailConnected AS gmailConnected,
         u.gmailSkipped AS gmailSkipped,
         c.id AS inauguralConversationId`,
      { userId }
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
        hasCompletedOnboarding: record.get('hasCompletedOnboarding') ?? false,
        hasReceivedWelcome: record.get('hasReceivedWelcome') ?? false,
        gmailConnected: record.get('gmailConnected') ?? false,
        gmailSkipped: record.get('gmailSkipped') ?? false,
        inauguralConversationId: record.get('inauguralConversationId') ?? null,
        requiresWelcome: record.get('hasCompletedOnboarding') === true && record.get('hasReceivedWelcome') === false,
        requiresGmailAuth: record.get('hasReceivedWelcome') === true && 
                           record.get('gmailConnected') === false && 
                           record.get('gmailSkipped') === false,
      },
    });
  } catch (error) {
    logger.error('Welcome status error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get welcome status',
    });
  } finally {
    await session.close();
  }
});

router.post('/welcome-received', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const now = new Date().toISOString();

    await session.run(
      `MATCH (u:User {id: $userId})
       SET u.hasReceivedWelcome = true,
           u.welcomeReceivedAt = $now`,
      { userId, now }
    );

    res.json({
      success: true,
      data: {
        welcomeReceivedAt: now,
      },
    });
  } catch (error) {
    logger.error('Welcome received error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark welcome as received',
    });
  } finally {
    await session.close();
  }
});

router.post('/gmail-skip', async (req: Request, res: Response) => {
  const session = neo4jConnection.getSession();

  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const now = new Date().toISOString();

    await session.run(
      `MATCH (u:User {id: $userId})
       SET u.gmailSkipped = true,
           u.gmailSkippedAt = $now`,
      { userId, now }
    );

    res.json({
      success: true,
      data: {
        gmailSkippedAt: now,
      },
    });
  } catch (error) {
    logger.error('Gmail skip error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to skip Gmail',
    });
  } finally {
    await session.close();
  }
});

router.get('/prefill', async (req: Request, res: Response) => {
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
       OPTIONAL MATCH (u)-[:WORKS_AT]->(l:Location)
       RETURN
         u.id AS id,
         u.email AS email,
         u.name AS name,
         u.company AS company,
         u.jobTitle AS jobTitle,
         u.organizationType AS organizationType,
         u.status AS status,
         u.relationshipType AS relationshipType,
         u.accessTypes AS accessTypes,
         d.name AS department,
         l.name AS location`,
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

    const prefill = {
      name: record.get('name') ?? null,
      email: record.get('email') ?? null,
      company: record.get('company') ?? null,
      jobTitle: record.get('jobTitle') ?? null,
      department: record.get('department') ?? null,
      location: record.get('location') ?? null,
      organizationType: record.get('organizationType') ?? null,
      status: record.get('status') ?? null,
      relationshipType: record.get('relationshipType') ?? null,
      accessTypes: record.get('accessTypes') ?? [],
    };

    res.json({
      success: true,
      data: {
        userId: record.get('id'),
        prefill,
      },
    });
  } catch (error) {
    logger.error('Onboarding prefill error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load onboarding prefill',
    });
  } finally {
    await session.close();
  }
});

export default router;
