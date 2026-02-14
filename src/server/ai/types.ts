/**
 * AI subsystem types.
 * All properties use camelCase per project conventions.
 */

// ---------------------------------------------------------------------------
// Chat / Completion
// ---------------------------------------------------------------------------

export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiCompletionOptions {
  model: string;
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** If true, parse the response as JSON. */
  jsonMode?: boolean;
}

export interface AiCompletionResult {
  content: string;
  model: string;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  finishReason: string;
}

// ---------------------------------------------------------------------------
// Job Analysis
// ---------------------------------------------------------------------------

export interface JobAnalysisInput {
  jobId: string;
  title: string;
  description: string;
  jobType: string;
  experienceLevel: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  estimatedDuration: string | null;
  clientCountry: string | null;
  clientRating: number | null;
  clientTotalSpent: number | null;
  clientTotalHires: number | null;
  clientTotalPosted: number | null;
  clientHireRate: number | null;
  clientPaymentVerified: boolean;
  proposalsCount: number | null;
  connectsRequired: number | null;
  skillsRequired: string[];
  category: string | null;
  postedAt: Date | null;
}

export interface FreelancerContext {
  skills: string[];
  primarySkills: string[];
  yearsExperience: Record<string, number>;
}

export interface JobFitAnalysisResult {
  fitScore: number;
  winProbability: number;
  fakeProbability: number;
  recommendation: "BID" | "SKIP" | "CAUTIOUS";
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  suggestedRate: number | null;
  suggestedDuration: string | null;
  keyPoints: string[];
  redFlags: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

// ---------------------------------------------------------------------------
// Proposal Generation
// ---------------------------------------------------------------------------

/** Lightweight repo summary passed to the AI for matching. */
export interface GitHubRepoContext {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
}

export interface ProposalGenerationInput {
  jobTitle: string;
  jobDescription: string;
  jobType: string;
  skillsRequired: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  estimatedDuration: string | null;
  /** Latest AI analysis for context, if available. */
  analysisContext: {
    fitScore: number | null;
    strengths: string[];
    matchedSkills: string[];
    suggestedRate: number | null;
  } | null;
  /** GitHub repos available for showcasing to the client. */
  githubRepos: GitHubRepoContext[];
}

/** A matched GitHub repo recommended by AI to showcase in the proposal. */
export interface RelevantRepo {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  /** AI-generated one-liner explaining why this repo is relevant to the job. */
  relevanceReason: string;
  /** AI-generated brief summary of what the repo does based on available info. */
  briefSummary: string;
}

export interface ProposalGenerationResult {
  coverLetter: string;
  proposedRate: number | null;
  proposedDuration: string | null;
  keySellingPoints: string[];
  questionsForClient: string[];
  /** GitHub repos the AI recommends showcasing for this job (max 3). */
  relevantRepos: RelevantRepo[];
}

// ---------------------------------------------------------------------------
// Client Analysis
// ---------------------------------------------------------------------------

export interface ClientAnalysisInput {
  clientCountry: string | null;
  clientRating: number | null;
  clientTotalSpent: number | null;
  clientTotalHires: number | null;
  clientTotalPosted: number | null;
  clientHireRate: number | null;
  clientPaymentVerified: boolean;
  clientMemberSince: Date | null;
}

export interface ClientAnalysisResult {
  trustScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  insights: string[];
  redFlags: string[];
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Interview Prep
// ---------------------------------------------------------------------------

export interface InterviewPrepInput {
  jobTitle: string;
  jobDescription: string;
  jobType: string;
  skillsRequired: string[];
  experienceLevel: string | null;
}

export interface InterviewQuestion {
  question: string;
  category: "technical" | "behavioral" | "situational" | "client-specific";
  difficulty: "easy" | "medium" | "hard";
  suggestedAnswer: string;
  tips: string;
}

export interface InterviewPrepResult {
  questions: InterviewQuestion[];
  overallTips: string[];
  communicationAdvice: string;
}

// ---------------------------------------------------------------------------
// Bid Strategy
// ---------------------------------------------------------------------------

export interface BidStrategyInput {
  jobTitle: string;
  jobDescription: string;
  jobType: string;
  skillsRequired: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  estimatedDuration: string | null;
  clientCountry: string | null;
  clientTotalSpent: number | null;
  clientTotalHires: number | null;
  clientHireRate: number | null;
  clientPaymentVerified: boolean;
  proposalsCount: number | null;
  connectsRequired: number | null;
  experienceLevel: string | null;
  /** Latest AI analysis, if available. */
  analysisContext: {
    fitScore: number | null;
    winProbability: number | null;
    recommendation: string | null;
    suggestedRate: number | null;
  } | null;
}

export interface BidStrategyResult {
  recommendedRate: number;
  rateRangeMin: number;
  rateRangeMax: number;
  rateJustification: string;
  positioningStrategy: string;
  differentiators: string[];
  openingHook: string;
  competitiveAdvantages: string[];
  pricingTactics: string[];
  connectsWorth: boolean;
  connectsReasoning: string;
  urgencyLevel: "low" | "medium" | "high";
  urgencyReasoning: string;
  bestTimeToApply: string;
}

// ---------------------------------------------------------------------------
// Skill Gap Analysis
// ---------------------------------------------------------------------------

export interface SkillGapInput {
  jobTitle: string;
  jobDescription: string;
  skillsRequired: string[];
  experienceLevel: string | null;
}

export interface SkillGapItem {
  skill: string;
  currentLevel: "none" | "beginner" | "intermediate" | "advanced" | "expert";
  requiredLevel: "beginner" | "intermediate" | "advanced" | "expert";
  importance: "critical" | "important" | "nice-to-have";
  estimatedLearningTime: string;
  resources: { title: string; type: "course" | "docs" | "tutorial" | "practice"; url?: string }[];
  quickWin: string;
}

export interface SkillGapResult {
  overallReadiness: number; // 0-100
  readyToApply: boolean;
  summary: string;
  gaps: SkillGapItem[];
  strengthsToHighlight: string[];
  learningPlan: string;
}

// ---------------------------------------------------------------------------
// Project Scope Estimator
// ---------------------------------------------------------------------------

export interface ScopeEstimatorInput {
  jobTitle: string;
  jobDescription: string;
  jobType: string;
  skillsRequired: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  estimatedDuration: string | null;
  experienceLevel: string | null;
}

export interface ScopeTask {
  name: string;
  description: string;
  category: "setup" | "development" | "design" | "testing" | "deployment" | "communication" | "other";
  hoursMin: number;
  hoursMax: number;
  complexity: "low" | "medium" | "high";
  dependencies: string[];
  deliverable: string;
}

export interface ScopeMilestone {
  name: string;
  tasks: string[];
  hoursEstimate: number;
  suggestedPaymentPercent: number;
  deliverables: string[];
}

export interface ScopeEstimatorResult {
  tasks: ScopeTask[];
  milestones: ScopeMilestone[];
  totalHoursMin: number;
  totalHoursMax: number;
  riskBufferPercent: number;
  adjustedHoursMin: number;
  adjustedHoursMax: number;
  suggestedFixedPrice: number | null;
  suggestedHourlyRate: number | null;
  scopeRisks: string[];
  assumptions: string[];
  outOfScopeItems: string[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Client Discovery Questions
// ---------------------------------------------------------------------------

export interface DiscoveryQuestionsInput {
  jobTitle: string;
  jobDescription: string;
  jobType: string;
  skillsRequired: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  estimatedDuration: string | null;
  experienceLevel: string | null;
  clientCountry: string | null;
  clientTotalSpent: number | null;
  clientTotalHires: number | null;
  clientPaymentVerified: boolean;
}

export interface DiscoveryQuestion {
  question: string;
  category: "scope" | "timeline" | "budget" | "communication" | "technical" | "expectations" | "red-flag";
  priority: "must-ask" | "should-ask" | "nice-to-ask";
  whyItMatters: string;
  idealAnswer: string;
  redFlagAnswer: string;
}

export interface DiscoveryQuestionsResult {
  questions: DiscoveryQuestion[];
  messagingTips: string[];
  dealBreakers: string[];
  greenFlags: string[];
  suggestedMessageTemplate: string;
}

// ---------------------------------------------------------------------------
// Contract & Negotiation Advisor
// ---------------------------------------------------------------------------

export interface ContractAdvisorInput {
  jobTitle: string;
  jobDescription: string;
  jobType: string;
  skillsRequired: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  estimatedDuration: string | null;
  experienceLevel: string | null;
  clientCountry: string | null;
  clientTotalSpent: number | null;
  clientTotalHires: number | null;
  clientHireRate: number | null;
  clientPaymentVerified: boolean;
  proposalsCount: number | null;
}

export interface NegotiationPoint {
  topic: string;
  currentRisk: "low" | "medium" | "high";
  suggestion: string;
  scriptExample: string;
}

export interface PaymentMilestone {
  milestone: string;
  percent: number;
  trigger: string;
}

export interface ContractAdvisorResult {
  overallRiskLevel: "low" | "medium" | "high";
  riskSummary: string;
  negotiationPoints: NegotiationPoint[];
  paymentStructure: PaymentMilestone[];
  scopeProtectionTips: string[];
  revisionPolicy: string;
  communicationTerms: string[];
  walkAwaySignals: string[];
  contractChecklist: string[];
  upworkSpecificTips: string[];
}

// ---------------------------------------------------------------------------
// Follow-Up Message Generator
// ---------------------------------------------------------------------------

export interface FollowUpMessageInput {
  jobTitle: string;
  jobDescription: string;
  proposalCoverLetter: string;
  proposalSentAt: Date | string;
  proposalStatus: string;
  daysSinceSubmission: number;
}

export interface FollowUpMessageResult {
  message: string;
  tone: "friendly" | "professional" | "urgent";
  subject: string;
  bestTimeToSend: string;
  tips: string[];
  doNots: string[];
}

// ---------------------------------------------------------------------------
// Proposal Tone Variations
// ---------------------------------------------------------------------------

export interface ProposalVariationsInput {
  jobTitle: string;
  jobDescription: string;
  jobType: string;
  skillsRequired: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  estimatedDuration: string | null;
  analysisContext: {
    fitScore: number | null;
    strengths: string[];
    matchedSkills: string[];
    suggestedRate: number | null;
  } | null;
}

export interface ProposalVariation {
  tone: "professional" | "conversational" | "technical";
  toneDescription: string;
  coverLetter: string;
  proposedRate: number | null;
  keyAngle: string;
  bestFor: string;
}

export interface ProposalVariationsResult {
  variations: ProposalVariation[];
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Weekly Performance Digest
// ---------------------------------------------------------------------------

export interface WeeklyDigestInput {
  totalJobsCaptured: number;
  totalProposalsSent: number;
  totalProposalsWon: number;
  totalProposalsRejected: number;
  connectsSpent: number;
  topJobCategories: string[];
  avgFitScore: number | null;
  avgWinProbability: number | null;
  totalEarnings: number;
  activeProjects: number;
  skills: string[];
}

export interface WeeklyDigestResult {
  summary: string;
  winRate: number;
  connectsEfficiency: string;
  topPerformingArea: string;
  biggestOpportunity: string;
  actionItems: string[];
  weeklyGrade: "A" | "B" | "C" | "D" | "F";
  trendDirection: "improving" | "stable" | "declining";
  motivationalNote: string;
}

// ---------------------------------------------------------------------------
// Win Pattern Analyzer
// ---------------------------------------------------------------------------

export interface WinPatternInput {
  winningProposals: {
    jobTitle: string;
    jobType: string;
    skills: string[];
    rate: number | null;
    category: string | null;
    coverLetterLength: number;
  }[];
  losingProposals: {
    jobTitle: string;
    jobType: string;
    skills: string[];
    rate: number | null;
    category: string | null;
    coverLetterLength: number;
  }[];
  freelancerSkills: string[];
}

export interface WinPattern {
  pattern: string;
  confidence: "high" | "medium" | "low";
  impact: string;
  recommendation: string;
}

export interface WinPatternResult {
  overallWinRate: number;
  patterns: WinPattern[];
  bestJobTypes: string[];
  bestSkillCombinations: string[];
  optimalRateRange: { min: number; max: number } | null;
  optimalProposalLength: string;
  topRecommendations: string[];
}

// ---------------------------------------------------------------------------
// Profile Optimizer
// ---------------------------------------------------------------------------

export interface ProfileOptimizerInput {
  currentTitle: string | null;
  currentBio: string | null;
  skills: string[];
  primarySkills: string[];
  yearsExperience: Record<string, number>;
  winningJobTypes: string[];
  topLanguages: string[];
  totalProposals: number;
  winRate: number;
}

export interface ProfileImprovement {
  area: string;
  current: string;
  suggested: string;
  impact: "high" | "medium" | "low";
}

export interface ProfileOptimizerResult {
  overallScore: number;
  suggestedTitle: string;
  suggestedBio: string;
  skillsToAdd: string[];
  skillsToRemove: string[];
  skillsToReorder: string[];
  portfolioSuggestions: string[];
  keywordOptimizations: string[];
  nicheSuggestion: string;
  improvements: ProfileImprovement[];
}

// ---------------------------------------------------------------------------
// Client Relationship Intelligence
// ---------------------------------------------------------------------------

export interface ClientIntelligenceInput {
  clientName: string | null;
  clientCountry: string | null;
  clientRating: number | null;
  clientTotalSpent: number | null;
  clientTotalHires: number | null;
  clientHireRate: number | null;
  clientPaymentVerified: boolean;
  clientMemberSince: Date | string | null;
  jobs: {
    title: string;
    budget: number | null;
    status: string;
    skillsRequired: string[];
  }[];
}

export interface ClientIntelligenceResult {
  trustScore: number;
  communicationStyle: string;
  paymentBehavior: string;
  workPreferences: string[];
  strengths: string[];
  risks: string[];
  bestApproach: string;
  repeatWorkPotential: "high" | "medium" | "low";
  negotiationTips: string[];
  idealFreelancerProfile: string;
}

// ---------------------------------------------------------------------------
// Smart Alerts
// ---------------------------------------------------------------------------

export interface SmartAlertInput {
  recentJobs: {
    title: string;
    fitScore: number | null;
    winProbability: number | null;
    postedAt: string | null;
    skillsRequired: string[];
    budgetMax: number | null;
  }[];
  pendingProposals: {
    jobTitle: string;
    daysSinceSubmission: number;
    status: string;
  }[];
  freelancerSkills: string[];
  avgFitScore: number | null;
  avgWinRate: number;
  connectsBalance: number;
}

export interface SmartAlert {
  type: "opportunity" | "deadline" | "stale-proposal" | "market-shift" | "milestone" | "tip";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  actionLabel: string | null;
  actionUrl: string | null;
}

export interface SmartAlertResult {
  alerts: SmartAlert[];
  summary: string;
  nextCheckRecommendation: string;
}

// ---------------------------------------------------------------------------
// Style Trainer
// ---------------------------------------------------------------------------

export interface StyleTrainerInput {
  sampleProposals: {
    coverLetter: string;
    wasAccepted: boolean;
    jobType: string;
    jobTitle: string;
  }[];
  freelancerSkills: string[];
}

export interface StylePattern {
  pattern: string;
  frequency: "always" | "often" | "sometimes";
  effectiveness: "high" | "medium" | "low";
  example: string;
}

export interface StyleTrainerResult {
  overallStyle: string;
  toneProfile: string;
  sentenceStructure: string;
  vocabularyLevel: "simple" | "moderate" | "advanced";
  strengthPatterns: StylePattern[];
  weaknessPatterns: StylePattern[];
  signaturePhrases: string[];
  improvementSuggestions: string[];
  styleGuide: string;
}

// ---------------------------------------------------------------------------
// Scope Creep Detection
// ---------------------------------------------------------------------------

export interface ScopeCreepDetectionInput {
  projectTitle: string;
  originalScope: string;
  deliverables: string[];
  exclusions: string[];
  agreedBudget: number | null;
  agreedTimeline: string | null;
  revisionLimit: number | null;
  clientMessage: string;
}

export interface ScopeCreepDetectionResult {
  isOutOfScope: boolean;
  confidence: number; // 0-100
  verdict: "IN_SCOPE" | "OUT_OF_SCOPE" | "GRAY_AREA";
  reasoning: string;
  originalScopeItems: string[];
  requestedItems: string[];
  overlappingItems: string[];
  newItems: string[];
  riskLevel: "low" | "medium" | "high";
  impactAssessment: {
    timeImpact: string;
    costImpact: string;
    qualityImpact: string;
  };
  suggestedAction: "accept" | "negotiate" | "decline";
  quickSummary: string;
}

// ---------------------------------------------------------------------------
// Diplomatic Response Generator (for scope creep pushback)
// ---------------------------------------------------------------------------

export interface DiplomaticResponseInput {
  projectTitle: string;
  clientMessage: string;
  scopeAnalysis: ScopeCreepDetectionResult;
  originalDeliverables: string[];
  tone: "firm" | "friendly" | "neutral";
  freelancerName?: string;
}

export interface DiplomaticResponseResult {
  response: string;
  tone: "firm" | "friendly" | "neutral";
  keyPoints: string[];
  whatToAvoidSaying: string[];
  followUpSuggestions: string[];
  alternativeOffers: string[];
  escalationPath: string;
}

// ---------------------------------------------------------------------------
// Change Order Generator
// ---------------------------------------------------------------------------

export interface ChangeOrderInput {
  projectTitle: string;
  clientMessage: string;
  scopeAnalysis: ScopeCreepDetectionResult;
  originalBudget: number | null;
  originalTimeline: string | null;
  freelancerHourlyRate: number | null;
}

export interface ChangeOrderLineItem {
  description: string;
  hours: number;
  rate: number;
  total: number;
}

export interface ChangeOrderResult {
  summary: string;
  lineItems: ChangeOrderLineItem[];
  totalAdditionalCost: number;
  totalAdditionalHours: number;
  newTimeline: string;
  justification: string;
  termsAndConditions: string[];
  clientMessage: string; // Pre-written message to send to client
  paymentTerms: string;
  notes: string[];
}

