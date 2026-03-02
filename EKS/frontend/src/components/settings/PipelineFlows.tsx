"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { MermaidDiagram } from "@/components/ui/mermaid-diagram"
import { Button } from "@/components/ui/button"
import { GitBranch, Users, FileText, Database, Info, ZoomIn, ZoomOut, Maximize2, ArrowLeft, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

const ONBOARDING_FLOW = `flowchart TD
    Start([Usuário faz login pela primeira vez]) --> CheckStatus{Status do<br/>Onboarding?}
    CheckStatus -->|not_started| Welcome[Tela de Boas-vindas]
    CheckStatus -->|in_progress| Resume[Retomar do passo atual]
    CheckStatus -->|completed| Skip[Pular para aplicação]
    
    Welcome --> Profile[1. Perfil Pessoal]
    Profile -->|Prefill do Auth| ProfileData[Nome, Email, Cargo<br/>pré-preenchidos]
    ProfileData --> Org[2. Organização]
    
    Org --> OrgInput[Empresa e Departamento]
    OrgInput --> OrgChart[3. Validação do Organograma]
    
    OrgChart --> LoadGraph[Carregar grafo Neo4j]
    LoadGraph --> FindUser{Usuário<br/>existe?}
    FindUser -->|Sim| ShowOrgChart[Mostrar: Gestor, Pares, Subordinados]
    FindUser -->|Não| CreateUser[Criar nó :User no grafo]
    CreateUser --> ShowOrgChart
    
    ShowOrgChart --> ValidateOrg[Usuário valida estrutura]
    ValidateOrg --> Competencies[4. Competências]
    
    Competencies --> CompInput[Lista de habilidades e conhecimentos]
    CompInput --> Goals[5. Objetivos]
    
    Goals --> GoalInput[Objetivo principal e desafios]
    GoalInput --> Review[6. Revisão]
    
    Review --> ShowSummary[Resumo de todos os dados]
    ShowSummary --> Confirm{Confirmar?}
    Confirm -->|Não| Back[Voltar e editar]
    Back --> Profile
    Confirm -->|Sim| Persist[7. Persistir no Neo4j]
    
    Persist --> CreateNodes[Criar/Atualizar nós]
    CreateNodes --> UserNode[:User]
    CreateNodes --> PersonaNode[:PersonaVersion]
    CreateNodes --> PrefNode[:Preferences]
    CreateNodes --> OnboardNode[:OnboardingResponses]
    
    CreateNodes --> CreateRels[Criar relacionamentos]
    CreateRels --> MemberOf[:User -MEMBER_OF-> :Department]
    CreateRels --> ReportsTo[:User -REPORTS_TO-> :User gestor]
    CreateRels --> ContribKnow[:User -CONTRIBUTED_KNOWLEDGE-> :Knowledge]
    
    CreateRels --> Complete[Status = completed]
    Complete --> UnlockApp[Liberar acesso à aplicação]
    UnlockApp --> End([Onboarding concluído])
    
    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style Persist fill:#fff4e6
    style CreateNodes fill:#e3f2fd
    style CreateRels fill:#e3f2fd
    style Complete fill:#c8e6c9`

const INITIAL_INGESTION_FLOW = `flowchart TD
    Start([Admin acessa Settings > Ingestão]) --> Upload[Upload de arquivo CSV]
    Upload --> Validate{Validar<br/>formato}
    Validate -->|Erro| ShowError[Mostrar erro de formato]
    ShowError --> Upload
    
    Validate -->|OK| Parse[Parser CSV]
    Parse --> Extract[Extrair colunas]
    Extract --> Required{Campos<br/>obrigatórios?}
    Required -->|Faltando| ShowMissing[Indicar campos ausentes]
    ShowMissing --> Upload
    
    Required -->|OK| Preview[Preview dos dados]
    Preview --> UserReview{Admin<br/>confirma?}
    UserReview -->|Não| Cancel[Cancelar ingestão]
    Cancel --> End([Fim])
    
    UserReview -->|Sim| StartIngestion[Iniciar ingestão transacional]
    StartIngestion --> CreateCompany[1. Criar :Company se não existir]
    
    CreateCompany --> CreateDepts[2. Criar :Department nodes]
    CreateDepts --> DeptLoop[Para cada departamento único]
    DeptLoop --> DeptNode[:Department com name, description]
    DeptNode --> CompanyRel[:Company -HAS_DEPARTMENT-> :Department]
    
    CompanyRel --> CreateUsers[3. Criar :User nodes]
    CreateUsers --> UserLoop[Para cada linha do CSV]
    UserLoop --> UserNode[:User com name, email, role, etc]
    UserNode --> UserRels[Criar relacionamentos do usuário]
    
    UserRels --> MemberOf[:User -MEMBER_OF-> :Department]
    UserRels --> WorksIn[:User -WORKS_IN-> :Company]
    UserRels --> ReportsTo[:User -REPORTS_TO-> :User gestor]
    
    UserRels --> NextUser{Mais<br/>usuários?}
    NextUser -->|Sim| UserLoop
    NextUser -->|Não| CreateMeta[4. Criar metadados de ingestão]
    
    CreateMeta --> IngestionNode[:IngestionItem]
    IngestionNode --> IngestionProps[sourceType: 'csv_orgchart'<br/>sourceRef: filename<br/>processedAt: timestamp]
    
    IngestionProps --> Provenance[5. Proveniência]
    Provenance --> SourceRel[:User -SOURCED_FROM-> :IngestionItem]
    
    SourceRel --> Stats[6. Calcular estatísticas]
    Stats --> CountUsers[Total de usuários criados]
    Stats --> CountDepts[Total de departamentos]
    Stats --> CountRels[Total de relacionamentos]
    
    Stats --> Success[Mostrar resumo de sucesso]
    Success --> RefreshUI[Atualizar UI com novos dados]
    RefreshUI --> End
    
    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style StartIngestion fill:#fff4e6
    style CreateCompany fill:#e3f2fd
    style CreateDepts fill:#e3f2fd
    style CreateUsers fill:#e3f2fd
    style CreateMeta fill:#f3e5f5
    style Success fill:#c8e6c9`

const MEETING_INGESTION_FLOW = `flowchart TD
    Start([Curador acessa Settings > Reuniões]) --> PreLoad[Carregar contexto]
    PreLoad --> LoadOrg[Carregar :User nodes do grafo]
    PreLoad --> LoadProj[Carregar :Project nodes]
    PreLoad --> LoadExt[Carregar :ExternalParticipant nodes]
    PreLoad --> LoadThes[Carregar Thesaurus ontológico]
    
    LoadThes --> Ready[Interface pronta]
    Ready --> SelectFile[Selecionar arquivo .vtt]
    SelectFile --> SelectMeta[Configurar metadados]
    
    SelectMeta --> MetaInputs[Data, Hora, Título, Tipo, Confidencialidade]
    MetaInputs --> SelectOrg[Selecionar organizador interno]
    SelectOrg --> SelectProj[Selecionar projeto relacionado opcional]
    
    SelectProj --> Process[Processar arquivo]
    Process --> Phase1[FASE 1: Parser VTT]
    
    Phase1 --> ParseVTT[Ler conteúdo do arquivo]
    ParseVTT --> ExtractSpeakers[Extrair speakers e timestamps]
    ExtractSpeakers --> BuildTranscript[Montar transcrição consolidada]
    
    BuildTranscript --> MatchSpeakers[Matching de speakers]
    MatchSpeakers --> ThesaurusMatch{Match no<br/>Thesaurus?}
    ThesaurusMatch -->|Sim conf>=0.9| AutoLink[Auto-vincular a :User]
    ThesaurusMatch -->|Não| ExternalMatch{Match em<br/>:ExternalParticipant?}
    ExternalMatch -->|Sim conf>=0.9| AutoLinkExt[Auto-vincular a :ExternalParticipant]
    ExternalMatch -->|Não| MarkNew[Marcar como 'Novo' para curadoria]
    
    AutoLink --> Phase2[FASE 2: Extração LLM]
    AutoLinkExt --> Phase2
    MarkNew --> Phase2
    
    Phase2 --> CallAzure[Chamar Azure OpenAI GPT-4o]
    CallAzure --> InjectContext[Injetar contexto organizacional]
    InjectContext --> OrgContext[Lista de :User e :Department reais]
    
    OrgContext --> ExtractEntities[Extrair entidades estruturadas]
    ExtractEntities --> Tasks[Tasks com assignee, deadline, priority]
    ExtractEntities --> Decisions[Decisions com relatedPerson, impact]
    ExtractEntities --> Risks[Risks com impact, mitigation]
    ExtractEntities --> Insights[Insights com description]
    ExtractEntities --> Mentioned[MentionedEntities organizações, ferramentas]
    
    Mentioned --> GenSummary[Gerar summary da reunião]
    GenSummary --> GenTopics[Gerar keyTopics para retrieval]
    
    GenTopics --> Phase3[FASE 3: Entity Matching Agent]
    Phase3 --> CallAgent[Chamar entity_matching_agent.py]
    CallAgent --> FuzzyMatch[Matching fuzzy contra grafo]
    FuzzyMatch --> LinkHigh{Score >= 0.9?}
    LinkHigh -->|Sim| AutoLinkEntity[Auto-vincular a node existente]
    LinkHigh -->|Não| MediumMatch{Score >= 0.6?}
    MediumMatch -->|Sim| SuggestMatch[Sugerir match para curador]
    MediumMatch -->|Não| KeepNew[Manter como nova entidade]
    
    AutoLinkEntity --> FilterDupes[Filtrar duplicatas]
    SuggestMatch --> FilterDupes
    KeepNew --> FilterDupes
    
    FilterDupes --> RemoveOwner[Remover organização dona]
    RemoveOwner --> RemoveProject[Remover duplicata do projeto]
    
    RemoveProject --> ShowUI[Mostrar UI de validação]
    ShowUI --> CuratorReview[Curador revisa entidades]
    
    CuratorReview --> ValidateEnt[Validar/rejeitar cada entidade]
    ValidateEnt --> LinkManual[Vincular manualmente se necessário]
    LinkManual --> CreateExt[Criar :ExternalParticipant se novo]
    
    CreateExt --> EditMeta[Editar metadados finais]
    EditMeta --> EditTopics[Editar keyTopics]
    
    EditTopics --> Confirm{Confirmar<br/>ingestão?}
    Confirm -->|Não| Cancel[Cancelar]
    Cancel --> End([Fim])
    
    Confirm -->|Sim| Persist[Persistir no Neo4j]
    Persist --> CreateMeeting[:Meeting node]
    CreateMeeting --> MeetingProps[title, date, time, duration, etc]
    
    MeetingProps --> CreateEntities[Criar entidades validadas]
    CreateEntities --> TaskNodes[:Task nodes]
    CreateEntities --> DecisionNodes[:Decision nodes]
    CreateEntities --> RiskNodes[:Risk nodes]
    CreateEntities --> InsightNodes[:Insight nodes]
    
    CreateEntities --> CreateRels[Criar relacionamentos]
    CreateRels --> ExtractedFrom[:Entity -EXTRACTED_FROM-> :Meeting]
    CreateRels --> RelatedTo[:Meeting -RELATED_TO_PROJECT-> :Project]
    CreateRels --> Participated[:User -PARTICIPATED_IN-> :Meeting]
    
    CreateRels --> CreateIngestion[:IngestionItem]
    CreateIngestion --> CreateCuration[:CurationJob status=approved]
    
    CreateCuration --> Success[Ingestão concluída]
    Success --> ShowStats[Mostrar estatísticas]
    ShowStats --> StatsData[Meeting ID, entidades vinculadas, etc]
    
    StatsData --> End
    
    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style Phase1 fill:#fff4e6
    style Phase2 fill:#ffe0b2
    style Phase3 fill:#f3e5f5
    style Persist fill:#e3f2fd
    style Success fill:#c8e6c9`

const DOCUMENT_INGESTION_FLOW = `flowchart TD
    Start["Usuário acessa Conhecimento > Nova Ingestão"] --> LoadProjects["Carregar projetos disponíveis"]
    LoadProjects --> LoadOrg["Carregar organograma"]
    LoadOrg --> Ready["Interface pronta"]
    
    Ready --> EnterTitle["1. Digitar título"]
    EnterTitle --> PrelinkProject["2. Pré-vincular projeto"]
    PrelinkProject --> SelectType["3. Selecionar tipo visual"]
    
    SelectType --> TypeCards["Cards visuais: Contrato, Relatório, Ata, Espec, Política, Manual, Proposta, Análise, Outro"]
    TypeCards --> UploadFile["4. Upload do arquivo"]
    
    UploadFile --> ValidateFile{"Validar formato?"}
    ValidateFile -->|Inválido| ShowError["Mostrar erro"]
    ShowError --> UploadFile
    
    ValidateFile -->|OK| Analyze["Análise automática disparada"]
    Analyze --> SetStates["setIsAnalyzing + setIsExtractingEntities"]
    SetStates --> ResetStates["Limpar estados anteriores"]
    
    ResetStates --> Preprocess["FASE 1: Preprocessamento"]
    Preprocess --> CallPreprocess["Chamar api.preprocessDocument"]
    CallPreprocess --> SendParams["preferredType + prelinkedProjectIds"]
    
    SendParams --> GetResponse{"Response.success?"}
    GetResponse -->|OK| ExtractData["Extrair response.data"]
    ExtractData --> SuggestedMetadata["suggestedMetadata"]
    ExtractData --> SuggestedEntities["suggestedEntities"]
    ExtractData --> MentionedEntities["mentionedEntities"]
    ExtractData --> SuggestedRels["suggestedRelationships"]
    
    SuggestedMetadata --> AutoFill["Auto-preencher metadados"]
    AutoFill --> UpdateTitle["Atualizar título extraído"]
    AutoFill --> UpdateType["Atualizar tipo se other"]
    AutoFill --> UpdateTags["Atualizar tags"]
    AutoFill --> UpdateSummary["Atualizar resumo"]
    
    SuggestedEntities --> FilterHighConf["Filtrar confiança >0.85"]
    FilterHighConf --> AutoAccept["Auto-aceitar sugestões"]
    AutoAccept --> UpdateMetadata["Atualizar metadata com entidades"]
    
    UpdateMetadata --> Extract["FASE 2: Extração de Entidades"]
    Extract --> CallExtract["Chamar api.extractDocumentEntities"]
    CallExtract --> SendFileParams["file + title + type"]
    
    SendFileParams --> GetExtractResponse{"Response.success?"}
    GetExtractResponse -->|OK| ParsePayload["Parsear payload.data"]
    ParsePayload --> RawEntities["Array de entidades brutas"]
    
    RawEntities --> FilterTypes["Filtrar tipos válidos"]
    FilterTypes --> MapToPreview["Mapear para PreviewEntity"]
    MapToPreview --> SetExtracted["setExtractedEntities"]
    
    SetExtracted --> Validate["FASE 3: Validação UI"]
    Validate --> FilterEntities["Filtrar por activeEntityTab"]
    FilterEntities --> ShowCards["Cards coloridos por tipo"]
    ShowCards --> EntityCounts["Contador por tipo"]
    
    EntityCounts --> UserValidate["Usuário valida/rejeita"]
    UserValidate --> UpdateEntity["updateExtractedEntity"]
    UserValidate --> LinkEntities["Vincular a colaboradores"]
    
    LinkEntities --> CheckRequired{"Validar relacionamentos obrigatórios"}
    CheckRequired -->|Faltando| ShowErrors["Mostrar erros de validação"]
    ShowErrors --> UserValidate
    
    CheckRequired -->|OK| Ingestion["FASE 4: Ingestão Final"]
    Ingestion --> FilterValid["Filtrar entidades validated=true"]
    FilterValid --> MapApproved["Mapear approvedEntities"]
    
    MapApproved --> CallUpload["Chamar api.uploadDocument"]
    CallUpload --> SendMetadata["metadata + approvedEntities"]
    
    SendMetadata --> CreateDoc["Criar :Document node"]
    CreateDoc --> DocProps["title, type, confidentiality, visibility, tags, validFrom, validUntil, effectiveAt, signedAt"]
    CreateDoc --> LinkProjects["Document-RELATED_TO->Project"]
    CreateDoc --> LinkObjectives["Document-SUPPORTS->Objective"]
    CreateDoc --> LinkOkrs["Document-LINKED_TO_OKR->OKR"]
    CreateDoc --> LinkDepartment["Document-BELONGS_TO->Department"]
    CreateDoc --> LinkOwner["Document-OWNED_BY->User"]
    
    DocProps --> ExtractText["FileTextExtractorService.extract"]
    ExtractText --> Chunking["SemanticChunkingService.chunk"]
    Chunking --> CreateChunks["Criar :Chunk nodes"]
    
    CreateChunks --> ChunkProps["id, documentId, text, textLength, chunkType, hierarchyLevel, sequenceIndex, sectionTitle, containsTable, keyTopics, estimatedImportance, reasoning"]
    ChunkProps --> LinkChunks["Document-HAS_CHUNK->Chunk"]
    ChunkProps --> ChunkSequence["Chunk-FOLLOWS->Chunk"]
    
    LinkChunks --> ProcessApproved["Processar approvedEntities"]
    ProcessApproved --> CheckApproved{"approvedEntities existe?"}
    
    CheckApproved -->|Sim| CreateEntities["Criar nós de entidades"]
    CheckApproved -->|Não| CheckLLM{"llmExtractionService.isConfigured()?"}
    
    CreateEntities --> ForEachEntity["Para cada approvedEntity"]
    ForEachEntity --> EntityType{"Tipo da entidade?"}
    
    EntityType -->|task| CreateTask["Criar :Task node"]
    EntityType -->|decision| CreateDecision["Criar :Decision node"]
    EntityType -->|risk| CreateRisk["Criar :Risk node"]
    EntityType -->|insight| CreateInsight["Criar :Insight node"]
    
    CreateTask --> TaskProps["id, title, description, status: 'pending', priority, assignee, dueDate, impact, confidence, sourceRef, validated: true, validatedAt, visibility: 'corporate', memoryLevel: 'medium'"]
    CreateTask --> LinkTask["Task-EXTRACTED_FROM->Document"]
    CreateTask --> LinkAssignee["Task-ASSIGNED_TO->User"]
    
    CreateDecision --> DecisionProps["id, value, description, rationale, impact, relatedPerson, confidence, sourceRef, validated: true"]
    CreateDecision --> LinkDecision["Decision-EXTRACTED_FROM->Document"]
    CreateDecision --> LinkDecider["Decision-DECIDED_BY->User"]
    
    CreateRisk --> RiskProps["id, value, description, impact, probability, priority, relatedPerson, mitigation, confidence, sourceRef, validated: true"]
    CreateRisk --> LinkRisk["Risk-EXTRACTED_FROM->Document"]
    CreateRisk --> LinkRaiser["Risk-RAISED_BY->User"]
    
    CreateInsight --> InsightProps["id, value, description, impact, relatedPerson, confidence, sourceRef, validated: true"]
    CreateInsight --> LinkInsight["Insight-EXTRACTED_FROM->Document"]
    CreateInsight --> LinkContributor["Insight-CONTRIBUTED_BY->User"]
    
    CheckLLM -->|Sim| Enrichment[" Enriquecimento semântico"]
    CheckLLM -->|Não| SkipEnrichment["Pular enriquecimento"]
    
    Enrichment --> LLMExtract["llmExtractionService.extractFromDocument"]
    LLMExtract --> UpdateDocSummary["Atualizar summary + keyTopics"]
    LLMExtract --> CreateAutoEntities["Criar entidades com validated: null"]
    
    CreateAutoEntities --> AutoTask["Task com validated: null"]
    CreateAutoEntities --> AutoDecision["Decision com validated: null"]
    CreateAutoEntities --> AutoRisk["Risk com validated: null"]
    CreateAutoEntities --> AutoInsight["Insight com validated: null"]
    
    AutoTask --> LinkAutoTask["Task-EXTRACTED_FROM->Document"]
    AutoDecision --> LinkAutoDecision["Decision-EXTRACTED_FROM->Document"]
    AutoRisk --> LinkAutoRisk["Risk-EXTRACTED_FROM->Document"]
    AutoInsight --> LinkAutoInsight["Insight-EXTRACTED_FROM->Document"]
    
    SkipEnrichment --> UpdateStatus["Atualizar status do documento"]
    CreateEntities --> UpdateStatus
    AutoEntities --> UpdateStatus
    
    UpdateStatus --> CheckPending{"Tem entidades pendentes?"}
    CheckPending -->|Sim| SetPending["status: 'pending_validation'"]
    CheckPending -->|Não| SetCompleted["status: 'completed'"]
    
    SetPending --> SetProcessedAt["processedAt: datetime()"]
    SetCompleted --> SetProcessedAt
    
    SetProcessedAt --> CommitTransaction["Fazer commit"]
    CommitTransaction --> Success["Ingestão concluída"]
    Success --> ReturnResponse["Retornar documentId, chunkCount, extractedEntities, relationships"]
    ReturnResponse --> End(["Fim"])
    
    ShowErrors --> End
    
    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style Preprocess fill:#fff4e6
    style Extract fill:#ffe0b2
    style Validate fill:#f3e5f5
    style Ingestion fill:#e3f2fd
    style Success fill:#c8e6c9`

const DOCUMENT_MANAGEMENT_FLOW = `flowchart TD
    Start([Usuário acessa Base de Conhecimento]) --> View[Visualizar documentos existentes]
    View --> Action{Ação do<br/>usuário?}
    
    Action -->|Upload novo| Upload[Selecionar arquivo]
    Action -->|Buscar| Search[Interface de busca]
    Action -->|Visualizar| ViewDoc[Abrir documento]
    
    Upload --> ValidateFile{Validar<br/>arquivo}
    ValidateFile -->|Formato inválido| ShowError[Mostrar erro de formato]
    ShowError --> Upload
    
    ValidateFile -->|OK| ExtractText[Extrair texto do documento]
    ExtractText --> DetectType{Tipo de<br/>documento?}
    
    DetectType -->|PDF| ParsePDF[Parser PDF]
    DetectType -->|DOCX| ParseDOCX[Parser DOCX]
    DetectType -->|TXT/MD| ParseText[Parser Texto]
    
    ParsePDF --> Chunking[FASE 1: Chunking Semântico]
    ParseDOCX --> Chunking
    ParseText --> Chunking
    
    Chunking --> SplitChunks[Dividir em chunks de ~500 tokens]
    SplitChunks --> PreserveContext[Preservar contexto entre chunks]
    PreserveContext --> CreateChunks[Criar :Chunk nodes]
    
    CreateChunks --> Embedding[FASE 2: Embedding]
    Embedding --> CallEmbedding[Chamar Azure OpenAI Embeddings]
    CallEmbedding --> GenerateVectors[Gerar vetores 1536-dim]
    GenerateVectors --> StoreVectors[Armazenar em Neo4j Vector Index]
    
    StoreVectors --> Extraction[FASE 3: Extração de Metadados]
    Extraction --> CallLLM[Chamar Azure OpenAI GPT-4o]
    CallLLM --> ExtractMeta[Extrair metadados estruturados]
    
    ExtractMeta --> ExtractTitle[Título do documento]
    ExtractMeta --> ExtractSummary[Resumo executivo]
    ExtractMeta --> ExtractTopics[Tópicos principais]
    ExtractMeta --> ExtractEntities[Entidades mencionadas]
    ExtractMeta --> ExtractClearance[Nível de confidencialidade]
    
    ExtractClearance --> Tagging[FASE 4: Tagging Semântico]
    Tagging --> AutoTag[Tags automáticas por conteúdo]
    AutoTag --> DeptTag[Tag de departamento]
    AutoTag --> ProjectTag[Tag de projeto]
    AutoTag --> TopicTag[Tags de tópicos]
    
    TopicTag --> Linking[FASE 5: Linking Ontológico]
    Linking --> FindRelated[Buscar entidades relacionadas no grafo]
    FindRelated --> LinkProjects[:Document -RELATED_TO-> :Project]
    FindRelated --> LinkDepts[:Document -BELONGS_TO-> :Department]
    FindRelated --> LinkUsers[:Document -OWNED_BY-> :User]
    FindRelated --> LinkKnowledge[:Document -SUPPORTS-> :Knowledge]
    
    LinkKnowledge --> Persist[Persistir no Neo4j]
    Persist --> CreateDoc[:Document node]
    CreateDoc --> DocProps[title, summary, uploadedAt, etc]
    
    DocProps --> CreateChunkRels[Criar relacionamentos de chunks]
    CreateChunkRels --> HasChunk[:Document -HAS_CHUNK-> :Chunk]
    
    HasChunk --> CreateIngestion[:IngestionItem]
    CreateIngestion --> IngestionProps[sourceType: 'document_upload'<br/>sourceRef: filename]
    
    IngestionProps --> Index[Indexar para busca]
    Index --> FullTextIndex[Índice full-text]
    Index --> VectorIndex[Índice vetorial]
    Index --> MetadataIndex[Índice de metadados]
    
    MetadataIndex --> Success[Upload concluído]
    Success --> ShowSuccess[Mostrar confirmação]
    ShowSuccess --> UpdateUI[Atualizar lista de documentos]
    
    Search --> SearchType{Tipo de<br/>busca?}
    SearchType -->|Texto| FullText[Busca full-text]
    SearchType -->|Semântica| VectorSearch[Busca vetorial]
    SearchType -->|Filtros| MetaSearch[Busca por metadados]
    
    FullText --> Results[Retornar resultados]
    VectorSearch --> Results
    MetaSearch --> Results
    
    Results --> Rank[Ranking por relevância]
    Rank --> ApplySecurity[Aplicar filtro de clearance]
    ApplySecurity --> ShowResults[Mostrar resultados ao usuário]
    
    ViewDoc --> LoadDoc[Carregar :Document do grafo]
    LoadDoc --> LoadChunks[Carregar :Chunk nodes]
    LoadChunks --> CheckClearance{Usuário tem<br/>permissão?}
    CheckClearance -->|Não| AccessDenied[Acesso negado]
    CheckClearance -->|Sim| RenderDoc[Renderizar documento]
    
    RenderDoc --> ShowMeta[Mostrar metadados]
    ShowMeta --> ShowContent[Mostrar conteúdo]
    ShowContent --> ShowRelated[Mostrar documentos relacionados]
    
    ShowResults --> End([Fim])
    UpdateUI --> End
    ShowRelated --> End
    AccessDenied --> End
    
    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style Chunking fill:#fff4e6
    style Embedding fill:#ffe0b2
    style Extraction fill:#f3e5f5
    style Tagging fill:#e1f0ff
    style Linking fill:#e3f2fd
    style Success fill:#c8e6c9`

const WEBSITE_INGESTION_FLOW = `flowchart TD
    Start["Usuário acessa Conhecimento > Ingestão de Site"] --> LoadEntities["Carregar projetos/OKRs/objetivos"]
    LoadEntities --> Ready["Interface pronta"]
    
    Ready --> EnterUrl["1. Digitar URL"]
    EnterUrl --> SelectDepth["2. Selecionar profundidade"]
    
    SelectDepth --> DepthOptions["0: Só raiz, 1: Links diretos, 2-3: Navegação profunda"]
    DepthOptions --> Preview["FASE 1: Preview do Site"]
    
    Preview --> ValidateURL{"Validar URL?"}
    ValidateURL -->|Inválida| ShowUrlError["Mostrar erro de URL"]
    ShowUrlError --> EnterUrl
    
    ValidateURL -->|OK| SetPreviewStates["setIsPreviewing + limpar estados"]
    SetPreviewStates --> CallPreview["Chamar api.previewWebSite"]
    CallPreview --> SendUrlParams["url + depth"]
    
    SendUrlParams --> WebScraper["webScraperService.previewSite"]
    WebScraper --> CrawlSite["Crawler explora site"]
    CrawlSite --> DiscoverPages["Descobrir páginas"]
    CrawlSite --> DiscoverPdfs["Descobrir PDFs"]
    
    DiscoverPages --> BuildTree["Construir árvore por nível"]
    DiscoverPdfs --> ListPdfs["Listar PDFs disponíveis"]
    
    BuildTree --> CalcStats["Calcular estatísticas"]
    CalcStats --> TotalPages["totalPages"]
    CalcStats --> TotalPdfs["totalPdfs"]
    CalcStats --> EstimatedKb["estimatedKb"]
    
    EstimatedKb --> ShowStats["Mostrar estatísticas"]
    ShowStats --> AutoSelect["Auto-selecionar página raiz"]
    AutoSelect --> SetInitial["initialSelection Set"]
    
    SetInitial --> SelectPages["FASE 2: Seleção de Páginas"]
    SelectPages --> GroupedPages["Agrupar páginas por nível"]
    GroupedPages --> PageTree["Árvore expansível"]
    
    PageTree --> ToggleLevels["Expandir/colapsar níveis"]
    PageTree --> TogglePages["Marcar/desmarcar páginas"]
    PageTree --> TogglePdfs["Marcar/desmarcar PDFs"]
    
    TogglePages --> CalcSelected["Calcular seleção"]
    CalcSelected --> SelectedPagesList["Lista de páginas"]
    CalcSelected --> SelectedPdfsList["Lista de PDFs"]
    
    SelectedPagesList --> TotalSelectedKb["Calcular KB total"]
    SelectedPdfsList --> TotalSelectedKb
    TotalSelectedKb --> CheckSize{"Verificar tamanho total"}
    
    CheckSize -->|>30MB| ShowWarning["Aviso: volume alto"]
    ShowWarning --> EstTime["Calcular tempo estimado"]
    EstTime --> ShowTime["Mostrar ~X min/seg"]
    ShowTime --> TogglePages
    
    CheckSize -->|OK| LinkStrategic["FASE 3: Vínculos Estratégicos"]
    LinkStrategic --> MultiProjects["Múltiplos projetos"]
    LinkStrategic --> MultiObjectives["Múltiplos objetivos"]
    LinkStrategic --> FilterOkrs["OKRs filtrados por objetivos"]
    
    FilterOkrs --> SelectVisibility["FASE 4: Visibilidade"]
    SelectVisibility --> VisOptions["Individual, Departamento, Corporativo"]
    VisOptions --> CuratorFlow["Identificar fluxo de curadoria"]
    
    CuratorFlow --> Ingestion["FASE 5: Ingestão"]
    Ingestion --> ValidateIngest{"Validar pré-condições"}
    ValidateIngest -->|Inválido| ShowIngestError["Mostrar erro"]
    ShowIngestError --> SelectPages
    
    ValidateIngest -->|OK| SetIngestStates["setIsIngesting + limpar erros"]
    SetIngestStates --> BuildPageLevels["Mapear pageLevels"]
    BuildPageLevels --> PageLevels["Record<string, number>"]
    
    PageLevels --> CallIngest["Chamar api.ingestWebSite"]
    CallIngest --> SendIngestParams["Complex payload"]
    
    SendIngestParams --> SendUrl["url"]
    SendIngestParams --> SendTitle["title"]
    SendIngestParams --> SendPages["selectedPages"]
    SendIngestParams --> SendPdfs["selectedPdfs + downloadPdfs"]
    SendIngestParams --> SendProjectIds["projectIds"]
    SendIngestParams --> SendObjectiveIds["objectiveIds"]
    SendIngestParams --> SendOkrIds["okrIds"]
    SendIngestParams --> SendPageLevels["pageLevels"]
    SendIngestParams --> SendVisibility["visibility"]
    
    SendIngestParams --> CreateWebSource["Criar :WebSource node"]
    CreateWebSource --> WebSourceProps["id, url, title, domain, visibility, createdBy"]
    
    WebSourceProps --> LinkUploader["User-UPLOADED->WebSource"]
    LinkUploader --> LinkProjects["WebSource-LINKED_TO->Project"]
    LinkProjects --> LinkOkrs["WebSource-LINKED_TO_OKR->OKR"]
    LinkOkrs --> LinkObjectives["WebSource-SUPPORTS->Objective"]
    
    LinkObjectives --> ProcessPages["Processar páginas HTML"]
    ProcessPages --> ForEachPage["Para cada selectedPage"]
    
    ForEachPage --> ScrapePage["webScraperService.scrapePage"]
    ScrapePage --> ValidateContent{"text.length >= 50"}
    ValidateContent -->|< 50| SkipPage["Pular página"]
    
    ValidateContent -->|OK| CreateWebPage["Criar :WebPage node"]
    CreateWebPage --> WebPageProps["id, webSourceId, url, title, level, textLength, sizeKb"]
    
    WebPageProps --> LinkWebSource["WebSource-HAS_PAGE->WebPage"]
    LinkWebSource --> SequentialOrder["WebPage-NEXT_PAGE->WebPage"]
    
    SequentialOrder --> FixedChunks["buildFixedChunks(text, webPageId)"]
    FixedChunks --> ChunkStep["1500 chars + 200 overlap"]
    
    ChunkStep --> CreateChunks["Criar :Chunk nodes"]
    CreateChunks --> ChunkProps["id, webPageId, webSourceId, text, textLength, chunkType, hierarchyLevel, sequenceIndex, containsTable, keyTopics, estimatedImportance, reasoning"]
    
    ChunkProps --> LinkWebPage["WebPage-HAS_CHUNK->Chunk"]
    LinkWebPage --> ChunkSequence["Chunk-FOLLOWS->Chunk"]
    
    ChunkSequence --> UpdatePageCount["Atualizar WebPage.chunkCount"]
    UpdatePageCount --> NextPage["Próxima página"]
    
    ProcessPages --> DownloadPdfs["Download + ingest PDFs"]
    DownloadPdfs --> CheckDownloadPdfs{"downloadPdfs && selectedPdfs > 0"}
    
    CheckDownloadPdfs -->|Não| SkipPdfs["Pular PDFs"]
    CheckDownloadPdfs -->|Sim| LimitPdfs["Limitar a 10 PDFs"]
    
    LimitPdfs --> ForEachPdf["Para cada selectedPdf"]
    ForEachPdf --> FetchPdf["webScraperService.fetchPdfBuffer"]
    FetchPdf --> ValidatePdf{"buffer existe?"}
    
    ValidatePdf -->|Não| SkipPdf["Pular PDF"]
    ValidatePdf -->|OK| ExtractPdfText["FileTextExtractorService.extract"]
    
    ExtractPdfText --> ValidatePdfText{"text.length >= 50"}
    ValidatePdfText -->|< 50| SkipPdf
    
    ValidatePdfText -->|OK| CreatePdfWebPage["Criar WebPage com isPdf: true"]
    CreatePdfWebPage --> PdfWebPageProps["id, webSourceId, url, title, isPdf, level, textLength, sizeKb"]
    
    PdfWebPageProps --> PdfFixedChunks["buildFixedChunks(pdfText, webPageId)"]
    PdfFixedChunks --> CreatePdfChunks["Criar :Chunk nodes"]
    
    CreatePdfChunks --> PdfChunkProps["Sem estimatedImportance/reasoning"]
    CreatePdfChunks --> LinkPdfWebPage["WebPage-HAS_CHUNK->Chunk"]
    LinkPdfWebPage --> PdfChunkSequence["Chunk-FOLLOWS->Chunk"]
    
    PdfChunkSequence --> UpdatePdfPageCount["Atualizar WebPage.chunkCount"]
    UpdatePdfPageCount --> NextPdf["Próximo PDF"]
    
    NextPdf --> FinalizeWebSource["Atualizar WebSource status"]
    FinalizeWebSource --> SetStatus["status: 'completed'"]
    SetStatus --> SetPageCount["pageCount: ingestedPages.length"]
    SetStatus --> SetCurationStatus["curationStatus: 'approved' se individual senão 'pending'"]
    SetStatus --> SetProcessedAt["processedAt: datetime()"]
    
    SetProcessedAt --> CommitTransaction["Fazer commit"]
    CommitTransaction --> CheckCuration{"visibility !== 'individual'"}
    
    CheckCuration -->|Sim| RouteForCuration["curationService.routeForCuration"]
    CheckCuration -->|Não| SkipCuration["Pular curadoria"]
    
    RouteForCuration --> Success["Ingestão concluída"]
    SkipCuration --> Success
    Success --> ReturnResponse["Retornar webSourceId, domain, pageCount, pages, relationships"]
    ReturnResponse --> End(["Fim"])
    
    SkipPage --> NextPage
    SkipPdf --> NextPdf
    ShowUrlError --> End
    ShowIngestError --> End
    
    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style Preview fill:#fff4e6
    style SelectPages fill:#ffe0b2
    style LinkStrategic fill:#f3e5f5
    style Ingestion fill:#e3f2fd
    style Success fill:#c8e6c9`

type FlowType = "onboarding" | "initial-ingestion" | "meeting-ingestion" | "document-management" | "document-ingestion" | "website-ingestion"

export function PipelineFlows() {
  const [selectedFlow, setSelectedFlow] = useState<FlowType | null>(null)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // CORRIGIDO: + aumenta (zoom in), - diminui (zoom out)
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 20, 400))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 20, 60))
  const handleZoomReset = () => {
    setZoomLevel(100)
    setPanPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const flows = [
    {
      id: "onboarding" as FlowType,
      title: "Onboarding (First-Run)",
      icon: Users,
      description: "Processo completo de primeira configuração do usuário",
      color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20",
      diagram: ONBOARDING_FLOW,
      details: {
        characteristics: [
          "Prefill automático de dados do sistema de autenticação",
          "Validação do organograma contra o grafo existente",
          "Coleta de conhecimento da área (seed para Knowledge nodes)",
          "Persistência transacional com múltiplos tipos de nós",
          "Criação de relacionamentos hierárquicos (REPORTS_TO, MEMBER_OF)"
        ],
        nodes: [
          { code: ":User", desc: "Dados do usuário" },
          { code: ":PersonaVersion", desc: "Perfil profissional" },
          { code: ":Preferences", desc: "Preferências do usuário" },
          { code: ":OnboardingResponses", desc: "Respostas completas" },
          { code: ":Knowledge", desc: "Conhecimento contribuído" }
        ],
        relationships: [
          { code: "MEMBER_OF", desc: "Usuário → Departamento" },
          { code: "REPORTS_TO", desc: "Usuário → Gestor" },
          { code: "WORKS_IN", desc: "Usuário → Empresa" },
          { code: "CONTRIBUTED_KNOWLEDGE", desc: "Usuário → Knowledge" }
        ]
      }
    },
    {
      id: "initial-ingestion" as FlowType,
      title: "Ingestão Inicial (CSV)",
      icon: Database,
      description: "Importação em massa do organograma via CSV",
      color: "from-green-500/10 to-emerald-500/10 border-green-500/20",
      diagram: INITIAL_INGESTION_FLOW,
      details: {
        characteristics: [
          "Validação de formato e campos obrigatórios antes da ingestão",
          "Preview dos dados para confirmação do admin",
          "Ingestão transacional (tudo ou nada)",
          "Criação automática de hierarquia (Company → Department → User)",
          "Metadados de proveniência (IngestionItem) para auditoria"
        ],
        order: [
          "Criar/verificar :Company",
          "Criar :Department nodes únicos",
          "Criar :User nodes",
          "Criar relacionamentos hierárquicos",
          "Criar :IngestionItem para proveniência"
        ],
        csvFields: [
          { field: "name", desc: "Nome completo (obrigatório)" },
          { field: "email", desc: "Email corporativo (obrigatório)" },
          { field: "role", desc: "Cargo/função" },
          { field: "department", desc: "Departamento" },
          { field: "manager_email", desc: "Email do gestor" },
          { field: "company", desc: "Nome da empresa" }
        ]
      }
    },
    {
      id: "meeting-ingestion" as FlowType,
      title: "Ingestão de Reuniões",
      icon: FileText,
      description: "Pipeline híbrido de extração inteligente",
      color: "from-purple-500/10 to-pink-500/10 border-purple-500/20",
      diagram: MEETING_INGESTION_FLOW,
      details: {
        characteristics: [
          "Fase 1 - Parser VTT: Extração de speakers, timestamps e transcrição consolidada. Matching automático contra Thesaurus ontológico.",
          "Fase 2 - LLM Extraction: Azure OpenAI GPT-4o extrai Tasks, Decisions, Risks, Insights e entidades mencionadas com contexto organizacional.",
          "Fase 3 - Entity Matching: Agente Python faz matching fuzzy contra o grafo para vincular entidades existentes ou sugerir matches.",
          "Curadoria Humana: Curador valida, edita e aprova antes da persistência final no grafo."
        ],
        entities: [
          { code: ":Task", desc: "Ações e tarefas" },
          { code: ":Decision", desc: "Decisões tomadas" },
          { code: ":Risk", desc: "Riscos identificados" },
          { code: ":Insight", desc: "Insights estratégicos" },
          { code: ":ExternalParticipant", desc: "Pessoas externas" }
        ],
        matching: [
          "Thesaurus: Colaboradores internos",
          "ExternalParticipants: Parceiros conhecidos",
          "Fuzzy matching: Score ≥ 0.9 = auto-link",
          "Sugestões: Score ≥ 0.6 = sugerir ao curador",
          "Novos: Score < 0.6 = marcar como novo"
        ],
        metadata: [
          "Temporais: date, time, duration",
          "Classificação: meetingType, confidentiality",
          "Contexto: organizer, project, recurrence",
          "Retrieval: summary, keyTopics",
          "Proveniência: sourceFile, processedAt"
        ]
      }
    },
    {
      id: "document-management" as FlowType,
      title: "Gestão de Documentos",
      icon: Database,
      description: "Upload, chunking, embedding e busca semântica",
      color: "from-orange-500/10 to-amber-500/10 border-orange-500/20",
      diagram: DOCUMENT_MANAGEMENT_FLOW,
      details: {
        characteristics: [
          "Fase 1 - Chunking Semântico: Divisão em chunks de ~500 tokens preservando contexto.",
          "Fase 2 - Embedding: Geração de vetores 1536-dim via Azure OpenAI e armazenamento em Neo4j Vector Index.",
          "Fase 3 - Extração de Metadados: LLM extrai título, resumo, tópicos, entidades e nível de confidencialidade.",
          "Fase 4 - Tagging Semântico: Tags automáticas por departamento, projeto e tópicos.",
          "Fase 5 - Linking Ontológico: Vinculação automática a Projects, Departments, Users e Knowledge nodes."
        ],
        phases: [
          "Upload e validação de formato",
          "Parsing (PDF, DOCX, TXT/MD)",
          "Chunking semântico",
          "Embedding vetorial",
          "Extração de metadados via LLM",
          "Tagging e linking ontológico",
          "Indexação (full-text, vetorial, metadados)"
        ],
        nodes: [
          { code: ":Document", desc: "Documento principal" },
          { code: ":Chunk", desc: "Fragmentos semânticos" },
          { code: ":IngestionItem", desc: "Metadados de proveniência" }
        ],
        relationships: [
          { code: "HAS_CHUNK", desc: "Document → Chunk" },
          { code: "RELATED_TO", desc: "Document → Project" },
          { code: "BELONGS_TO", desc: "Document → Department" },
          { code: "OWNED_BY", desc: "Document → User" },
          { code: "SUPPORTS", desc: "Document → Knowledge" }
        ],
        searchTypes: [
          "Busca full-text: Termos exatos no conteúdo",
          "Busca semântica: Similaridade vetorial",
          "Busca por metadados: Filtros estruturados",
          "Segurança: Filtro por clearance level do usuário"
        ]
      }
    },
    {
      id: "document-ingestion" as FlowType,
      title: "Ingestão de Documento",
      icon: FileText,
      description: "Upload com chunking semântico e extração de entidades",
      color: "from-teal-500/10 to-cyan-500/10 border-teal-500/20",
      diagram: DOCUMENT_INGESTION_FLOW,
      details: {
        characteristics: [
          "Layout otimizado: Título → Projeto → Tipo visual → Upload",
          "Cards visuais para seleção de tipo (Contrato, Relatório, Ata, etc)",
          "Pré-processamento automático com extração de metadados",
          "Validação de entidades em cards coloridos (Tasks, Decisions, Risks, Insights)",
          "Fluxo de curadoria: preview → validação → persistência",
          "Chunking semântico com metadata rica"
        ],
        phases: [
          "Carregar projetos e organograma",
          "Entrada de título e pré-vínculo de projeto",
          "Seleção visual de tipo (cards)",
          "Upload e validação de formato",
          "Preprocessamento (/documents/preprocess)",
          "Extração de entidades (/documents/extract-entities)",
          "Validação UI com cards coloridos",
          "Ingestão final (/documents/upload)"
        ],
        nodes: [
          { code: ":Document", desc: "Documento principal" },
          { code: ":Chunk", desc: "Fragmentos semânticos" },
          { code: ":Task", desc: "Tarefas extraídas" },
          { code: ":Decision", desc: "Decisões extraídas" },
          { code: ":Risk", desc: "Riscos extraídos" },
          { code: ":Insight", desc: "Insights extraídos" },
          { code: ":Project", desc: "Projetos vinculados" },
          { code: ":Objective", desc: "Objetivos vinculados" },
          { code: ":OKR", desc: "OKRs vinculados" },
          { code: ":Department", desc: "Departamento" },
          { code: ":User", desc: "Usuário/colaborador" }
        ],
        relationships: [
          { code: "HAS_CHUNK", desc: "Document → Chunk" },
          { code: "FOLLOWS", desc: "Chunk → Chunk (sequencial)" },
          { code: "RELATED_TO", desc: "Document → Project" },
          { code: "SUPPORTS", desc: "Document → Objective" },
          { code: "LINKED_TO_OKR", desc: "Document → OKR" },
          { code: "BELONGS_TO", desc: "Document → Department" },
          { code: "OWNED_BY", desc: "Document → User" },
          { code: "EXTRACTED_FROM", desc: "Task/Decision/Risk/Insight → Document" },
          { code: "ASSIGNED_TO", desc: "Task → User" },
          { code: "DECIDED_BY", desc: "Decision → User" },
          { code: "RAISED_BY", desc: "Risk → User" },
          { code: "CONTRIBUTED_BY", desc: "Insight → User" }
        ],
        technical: [
          "Chunking: SemanticChunkingService.chunk",
          "Extração: FileTextExtractorService.extract",
          "Entidades: llmExtractionService.extractFromDocument",
          "Validação: approvedEntities (validated: true) vs auto-entidades (validated: null)",
          "Status: 'pending_validation' se há entidades não validadas",
          "Metadados temporais: validFrom, validUntil, effectiveAt, signedAt",
          "Transação: Neo4j com commit/rollback"
        ],
        processing: [
          "Se approvedEntities: cria entidades com validated: true",
          "Se não approvedEntities mas LLM disponível: cria entidades com validated: null",
          "Chunks com metadata: containsTable, keyTopics, estimatedImportance, reasoning",
          "Tasks: status='pending', memoryLevel='medium', visibility='corporate'",
          "Vinculação automática: assignee→User, relatedPerson→User",
          "Resposta: documentId, chunkCount, extractedEntities, relationships"
        ]
      }
    },
    {
      id: "website-ingestion" as FlowType,
      title: "Ingestão de Site/URL",
      icon: Globe,
      description: "Crawler com chunks fixos e processamento estruturado",
      color: "from-indigo-500/10 to-purple-500/10 border-indigo-500/20",
      diagram: WEBSITE_INGESTION_FLOW,
      details: {
        characteristics: [
          "Crawler com profundidade configurável (0-3 níveis)",
          "Chunks fixos determinísticos: 1500 chars + 200 overlap",
          "Descoberta automática de páginas e PDFs",
          "Seleção granular com árvore expansível por nível",
          "Vínculos estratégicos múltiplos (projetos, objetivos, OKRs)",
          "Controle de visibilidade com fluxo de curadoria",
          "NÃO há extração de entidades de sites"
        ],
        phases: [
          "Carregar entidades estratégicas (projetos/OKRs/objetivos)",
          "Entrada de URL e profundidade",
          "Preview do site (/web/preview)",
          "Seleção de páginas/PDFs",
          "Vínculos estratégicos múltiplos",
          "Seleção de visibilidade",
          "Ingestão com chunks fixos (/web/ingest)"
        ],
        nodes: [
          { code: ":WebSource", desc: "Fonte do site (raiz)" },
          { code: ":WebPage", desc: "Páginas HTML e PDFs" },
          { code: ":Chunk", desc: "Chunks fixos de 1500 chars" },
          { code: ":User", desc: "Usuário que fez upload" },
          { code: ":Project", desc: "Projetos vinculados" },
          { code: ":OKR", desc: "OKRs vinculados" },
          { code: ":Objective", desc: "Objetivos vinculados" }
        ],
        relationships: [
          { code: "UPLOADED", desc: "User → WebSource" },
          { code: "HAS_PAGE", desc: "WebSource → WebPage" },
          { code: "NEXT_PAGE", desc: "WebPage → WebPage (sequencial)" },
          { code: "HAS_CHUNK", desc: "WebPage → Chunk" },
          { code: "FOLLOWS", desc: "Chunk → Chunk (sequencial)" },
          { code: "LINKED_TO", desc: "WebSource → Project" },
          { code: "LINKED_TO_OKR", desc: "WebSource → OKR" },
          { code: "SUPPORTS", desc: "WebSource → Objective" }
        ],
        technical: [
          "Chunks fixos: buildFixedChunks(1500, 200)",
          "Validação: text.length >= 50 caracteres",
          "Limite de PDFs: máximo 10 por ingestão",
          "Download: webScraperService.fetchPdfBuffer",
          "Extração: FileTextExtractorService para PDFs",
          "Transação: Neo4j com commit/rollback",
          "Curadoria: curationService.routeForCuration",
          "Response: webSourceId, domain, pageCount, pages, relationships"
        ],
        processing: [
          "Para cada página: scrapePage → validate → createWebPage → chunk → link",
          "Para cada PDF: fetchPdfBuffer → extract → createWebPage(isPdf=true) → chunk",
          "Chunks com metadata: containsTable, keyTopics, estimatedImportance, reasoning",
          "Atualização: WebPage.chunkCount, WebSource.status='completed'",
          "Curadoria: curationStatus='approved' se individual senão 'pending'"
        ]
      }
    }
  ]

  const currentFlow = flows.find(f => f.id === selectedFlow)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Fluxos de Pipeline do Projeto</h2>
          <p className="text-sm text-muted-foreground">
            Documentação visual dos principais fluxos de dados e processos do EKS
          </p>
        </div>
        {selectedFlow && (
          <Button variant="outline" onClick={() => setSelectedFlow(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        )}
      </div>

      {/* Cards de seleção */}
      {!selectedFlow && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map((flow) => {
            const Icon = flow.icon
            return (
              <Card
                key={flow.id}
                className={cn(
                  "p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 bg-gradient-to-br border-2",
                  flow.color
                )}
                onClick={() => setSelectedFlow(flow.id)}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-background/50">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">{flow.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {flow.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <GitBranch className="h-3 w-3" />
                    <span>Clique para visualizar o fluxo completo</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Visualização do fluxo selecionado */}
      {currentFlow && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {(() => {
                  const Icon = currentFlow.icon
                  return <Icon className="h-5 w-5 text-primary" />
                })()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{currentFlow.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {currentFlow.description}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-2 mb-3">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-sm space-y-2">
                  <p className="font-medium">Características principais:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {currentFlow.details.characteristics.map((char, idx) => (
                      <li key={idx}>{char}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Diagrama com Zoom e Pan */}
            <div className="relative border border-border rounded-lg bg-card overflow-hidden">
              {/* Controles de Zoom - Dentro do frame */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg border border-border p-1 shadow-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 60}
                  className="gap-1 h-8 w-8 p-0"
                  title="Diminuir zoom (-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomReset}
                  className="gap-1 min-w-[60px] h-8 px-2"
                  title="Resetar zoom e posição"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span className="text-xs">{zoomLevel}%</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 400}
                  className="gap-1 h-8 w-8 p-0"
                  title="Aumentar zoom (+)"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              {/* Container com Pan */}
              <div 
                className="overflow-auto p-4 cursor-grab active:cursor-grabbing"
                style={{ 
                  minHeight: '500px',
                  maxHeight: '800px'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div
                  style={{ 
                    transform: `scale(${zoomLevel / 100}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                    transformOrigin: 'top left',
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                  }}
                >
                  <MermaidDiagram chart={currentFlow.diagram} />
                </div>
              </div>
            </div>

            {/* Detalhes específicos por fluxo */}
            {currentFlow.id === "onboarding" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    Nós Criados
                  </h4>
                  <ul className="space-y-1 text-muted-foreground">
                    {currentFlow.details.nodes?.map((node: any, idx: number) => (
                      <li key={idx}>
                        • <code className="text-xs bg-muted px-1 py-0.5 rounded">{node.code}</code> - {node.desc}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    Relacionamentos
                  </h4>
                  <ul className="space-y-1 text-muted-foreground">
                    {currentFlow.details.relationships?.map((rel: any, idx: number) => (
                      <li key={idx}>
                        • <code className="text-xs bg-muted px-1 py-0.5 rounded">{rel.code}</code> - {rel.desc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {currentFlow.id === "initial-ingestion" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    Ordem de Criação
                  </h4>
                  <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                    {currentFlow.details.order?.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    Campos CSV Esperados
                  </h4>
                  <ul className="space-y-1 text-muted-foreground">
                    {currentFlow.details.csvFields?.map((field, idx) => (
                      <li key={idx}>
                        • <strong>{field.field}</strong> - {field.desc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {currentFlow.id === "meeting-ingestion" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Entidades Extraídas
                    </h4>
                    <ul className="space-y-1 text-muted-foreground">
                      {currentFlow.details.entities?.map((entity, idx) => (
                        <li key={idx}>
                          • <code className="text-xs bg-muted px-1 py-0.5 rounded">{entity.code}</code> - {entity.desc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Matching Automático
                    </h4>
                    <ul className="space-y-1 text-muted-foreground text-xs">
                      {currentFlow.details.matching?.map((match, idx) => (
                        <li key={idx}>• {match}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Metadados
                    </h4>
                    <ul className="space-y-1 text-muted-foreground text-xs">
                      {currentFlow.details.metadata?.map((meta, idx) => (
                        <li key={idx}>• {meta}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-400 mb-1">Princípio Ontology-First</p>
                      <p className="text-muted-foreground">
                        O sistema sempre tenta vincular entidades extraídas a nós existentes no grafo antes de criar novos nós. 
                        Isso mantém a consistência semântica e evita duplicação de conhecimento.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {currentFlow.id === "document-management" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Fases do Pipeline
                    </h4>
                    <ol className="space-y-1 text-muted-foreground list-decimal list-inside text-xs">
                      {currentFlow.details.phases?.map((phase: string, idx: number) => (
                        <li key={idx}>{phase}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Tipos de Busca
                    </h4>
                    <ul className="space-y-1 text-muted-foreground text-xs">
                      {currentFlow.details.searchTypes?.map((type: string, idx: number) => (
                        <li key={idx}>• {type}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Nós Criados
                    </h4>
                    <ul className="space-y-1 text-muted-foreground">
                      {currentFlow.details.nodes?.map((node: any, idx: number) => (
                        <li key={idx}>
                          • <code className="text-xs bg-muted px-1 py-0.5 rounded">{node.code}</code> - {node.desc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Relacionamentos
                    </h4>
                    <ul className="space-y-1 text-muted-foreground">
                      {currentFlow.details.relationships?.map((rel: any, idx: number) => (
                        <li key={idx}>
                          • <code className="text-xs bg-muted px-1 py-0.5 rounded">{rel.code}</code> - {rel.desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">RAG (Retrieval-Augmented Generation)</p>
                      <p className="text-muted-foreground">
                        O sistema combina busca vetorial semântica com busca full-text tradicional para recuperação híbrida. 
                        Chunks são embedados com Azure OpenAI e armazenados no Neo4j Vector Index para busca por similaridade.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {currentFlow.id === "document-ingestion" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Fases do Pipeline
                    </h4>
                    <ol className="space-y-1 text-muted-foreground list-decimal list-inside text-xs">
                      {currentFlow.details.phases?.map((phase: string, idx: number) => (
                        <li key={idx}>{phase}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Validação de Entidades
                    </h4>
                    <ul className="space-y-1 text-muted-foreground text-xs">
                      {'validation' in currentFlow.details && Array.isArray(currentFlow.details.validation) && currentFlow.details.validation.map((val: string, idx: number) => (
                        <li key={idx}>• {val}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Nós Criados
                    </h4>
                    <ul className="space-y-1 text-muted-foreground">
                      {currentFlow.details.nodes?.map((node: any, idx: number) => (
                        <li key={idx}>
                          • <code className="text-xs bg-muted px-1 py-0.5 rounded">{node.code}</code> - {node.desc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Relacionamentos
                    </h4>
                    <ul className="space-y-1 text-muted-foreground">
                      {currentFlow.details.relationships?.map((rel: any, idx: number) => (
                        <li key={idx}>
                          • <code className="text-xs bg-muted px-1 py-0.5 rounded">{rel.code}</code> - {rel.desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-teal-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-teal-700 dark:text-teal-400 mb-1">UX Otimizada</p>
                      <p className="text-muted-foreground">
                        Layout otimizado: Título → Projeto → Tipo visual → Upload. 
                        Cards visuais para seleção de tipo e validação com cards coloridos por entidade.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {currentFlow.id === "website-ingestion" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Fases do Pipeline
                    </h4>
                    <ol className="space-y-1 text-muted-foreground list-decimal list-inside text-xs">
                      {currentFlow.details.phases?.map((phase: string, idx: number) => (
                        <li key={idx}>{phase}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Detalhes Técnicos
                    </h4>
                    <ul className="space-y-1 text-muted-foreground text-xs">
                      {currentFlow.details.technical?.map((tech: string, idx: number) => (
                        <li key={idx}>• {tech}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Nós Criados
                    </h4>
                    <ul className="space-y-1 text-muted-foreground">
                      {currentFlow.details.nodes?.map((node: any, idx: number) => (
                        <li key={idx}>
                          • <code className="text-xs bg-muted px-1 py-0.5 rounded">{node.code}</code> - {node.desc}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Relacionamentos
                    </h4>
                    <ul className="space-y-1 text-muted-foreground">
                      {currentFlow.details.relationships?.map((rel: any, idx: number) => (
                        <li key={idx}>
                          • <code className="text-xs bg-muted px-1 py-0.5 rounded">{rel.code}</code> - {rel.desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    Processamento
                  </h4>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    {currentFlow.details.processing?.map((proc: string, idx: number) => (
                      <li key={idx}>• {proc}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-indigo-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-indigo-700 dark:text-indigo-400 mb-1">Processamento Estruturado</p>
                      <p className="text-muted-foreground">
                        <strong>NÃO há extração de entidades de sites</strong>. Apenas chunking fixo e armazenamento estruturado.
                        Processamento de páginas HTML e PDFs com validação de conteúdo (mínimo 50 caracteres).
                        Limite de 10 PDFs por ingestão e curadoria automática baseada na visibilidade.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
