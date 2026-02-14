/**
 * AI Prompt Templates.
 *
 * Centralised prompt engineering for all AI analysis types.
 * Each function builds a structured prompt from typed inputs.
 */

import type {
  AiChatMessage,
  JobAnalysisInput,
  FreelancerContext,
  ProposalGenerationInput,
  ClientAnalysisInput,
  InterviewPrepInput,
  BidStrategyInput,
  SkillGapInput,
  ScopeEstimatorInput,
  DiscoveryQuestionsInput,
  ContractAdvisorInput,
  FollowUpMessageInput,
  ProposalVariationsInput,
  WeeklyDigestInput,
  WinPatternInput,
  ProfileOptimizerInput,
  ClientIntelligenceInput,
  SmartAlertInput,
  StyleTrainerInput,
  ScopeCreepDetectionInput,
  DiplomaticResponseInput,
  ChangeOrderInput,
} from "./types";

// ---------------------------------------------------------------------------
// System Prompts
// ---------------------------------------------------------------------------

const SYSTEM_JOB_ANALYST = `You are an expert Upwork job analyst AI assistant called "Bid Buddy".
Your role is to help freelancers make smart bidding decisions by analysing job postings.
You are thorough, honest, and data-driven. You never sugarcoat risks.
Always respond in valid JSON matching the exact schema requested.`;

const SYSTEM_PROPOSAL_WRITER = `You are an expert Upwork proposal writer AI assistant called "Bid Buddy".
You write compelling, professional, and personalised cover letters that win contracts.
Your proposals are concise, demonstrate understanding of the client's problem, and highlight relevant experience.
Never use generic filler. Every sentence should add value.
Always respond in valid JSON matching the exact schema requested.`;

const SYSTEM_CLIENT_ANALYST = `You are an expert Upwork client analyst AI assistant called "Bid Buddy".
Your role is to evaluate client profiles for trustworthiness, payment reliability, and red flags.
You are thorough and honest about risks while remaining objective.
Always respond in valid JSON matching the exact schema requested.`;

// ---------------------------------------------------------------------------
// Job Fit Analysis
// ---------------------------------------------------------------------------

export function buildJobFitPrompt(
  job: JobAnalysisInput,
  freelancer: FreelancerContext
): AiChatMessage[] {
  const budgetInfo = job.jobType === "HOURLY"
    ? `Hourly rate: $${job.hourlyRateMin ?? "?"}–$${job.hourlyRateMax ?? "?"}/hr`
    : `Fixed budget: $${job.budgetMin ?? "?"}–$${job.budgetMax ?? "?"}`;

  const clientInfo = [
    job.clientCountry ? `Country: ${job.clientCountry}` : null,
    job.clientRating !== null ? `Rating: ${job.clientRating}/5` : null,
    job.clientTotalSpent !== null ? `Total spent: $${job.clientTotalSpent.toLocaleString()}` : null,
    job.clientTotalHires !== null ? `Total hires: ${job.clientTotalHires}` : null,
    job.clientTotalPosted !== null ? `Jobs posted: ${job.clientTotalPosted}` : null,
    job.clientHireRate !== null ? `Hire rate: ${job.clientHireRate}%` : null,
    `Payment verified: ${job.clientPaymentVerified ? "Yes" : "No"}`,
    job.proposalsCount !== null ? `Proposals received: ${job.proposalsCount}` : null,
    job.connectsRequired !== null ? `Connects required: ${job.connectsRequired}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const freelancerSkillsList = freelancer.skills.join(", ");
  const primarySkillsList = freelancer.primarySkills.join(", ");

  const userPrompt = `Analyse the following Upwork job posting and provide a comprehensive assessment.

## Job Details
- **Title:** ${job.title}
- **Type:** ${job.jobType}
- **Experience Level:** ${job.experienceLevel ?? "Not specified"}
- **Category:** ${job.category ?? "Not specified"}
- **${budgetInfo}**
- **Estimated Duration:** ${job.estimatedDuration ?? "Not specified"}
- **Required Skills:** ${job.skillsRequired.join(", ") || "None listed"}
- **Posted:** ${job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "Unknown"}

## Job Description
${job.description}

## Client Information
${clientInfo}

## Freelancer Profile
- **All Skills:** ${freelancerSkillsList || "None provided"}
- **Primary Skills:** ${primarySkillsList || "None provided"}

## Instructions
Respond with a JSON object using this exact schema:
{
  "fitScore": <number 0-100, how well this job matches the freelancer's skills>,
  "winProbability": <number 0-100, estimated chance of winning this bid>,
  "fakeProbability": <number 0-100, likelihood this is a fake/spam job>,
  "recommendation": <"BID" | "SKIP" | "CAUTIOUS">,
  "reasoning": <string, 2-4 sentence explanation of the recommendation>,
  "strengths": [<string, reasons this is a good fit>],
  "weaknesses": [<string, reasons this may not be ideal>],
  "suggestedRate": <number | null, suggested bid rate in USD>,
  "suggestedDuration": <string | null, suggested project duration>,
  "keyPoints": [<string, key things to mention in a proposal>],
  "redFlags": [<string, warning signs about this job or client>],
  "matchedSkills": [<string, freelancer skills that match requirements>],
  "missingSkills": [<string, required skills the freelancer lacks>]
}

Consider these red flag indicators:
- Very new client with no hire history
- Unrealistically low budget for scope
- Vague description with no specifics
- Too-good-to-be-true rates
- No payment verification
- Very high number of proposals already
- Generic copy-paste job description
- Requesting free work/samples upfront`;

  return [
    { role: "system", content: SYSTEM_JOB_ANALYST },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Proposal Generation
// ---------------------------------------------------------------------------

export function buildProposalPrompt(
  input: ProposalGenerationInput,
  freelancer: FreelancerContext
): AiChatMessage[] {
  const budgetInfo = input.jobType === "HOURLY"
    ? `Hourly rate range: $${input.hourlyRateMin ?? "?"}–$${input.hourlyRateMax ?? "?"}/hr`
    : `Fixed budget: $${input.budgetMin ?? "?"}–$${input.budgetMax ?? "?"}`;

  const analysisNote = input.analysisContext
    ? `\n## Prior AI Analysis\n- Fit Score: ${input.analysisContext.fitScore}%\n- Strengths: ${input.analysisContext.strengths.join(", ")}\n- Matched Skills: ${input.analysisContext.matchedSkills.join(", ")}\n- Suggested Rate: $${input.analysisContext.suggestedRate ?? "N/A"}`
    : "";

  // Build GitHub repos context
  const githubReposNote =
    input.githubRepos.length > 0
      ? `\n## Freelancer GitHub Repositories\nThe freelancer has the following public GitHub repos that may be relevant to this job. Review them and pick up to 3 that are most relevant based on language, topics, and description matching the job requirements.\n\n${input.githubRepos
          .map(
            (r, i) =>
              `${i + 1}. **${r.name}** (${r.fullName})\n   - URL: ${r.url}\n   - Language: ${r.language ?? "N/A"}\n   - Topics: ${r.topics.join(", ") || "None"}\n   - Stars: ${r.stars}\n   - Description: ${r.description ?? "No description"}`
          )
          .join("\n")}`
      : "";

  const userPrompt = `Generate a winning Upwork proposal for the following job.

## Job Details
- **Title:** ${input.jobTitle}
- **Type:** ${input.jobType}
- **Required Skills:** ${input.skillsRequired.join(", ") || "None listed"}
- **${budgetInfo}**
- **Estimated Duration:** ${input.estimatedDuration ?? "Not specified"}

## Job Description
${input.jobDescription}
${analysisNote}

## Freelancer Skills
- **All Skills:** ${freelancer.skills.join(", ") || "None provided"}
- **Primary Skills:** ${freelancer.primarySkills.join(", ") || "None provided"}
${githubReposNote}

## Instructions
Write a compelling, personalised cover letter. It should:
1. Open with a hook that shows you understand the client's problem
2. Briefly mention relevant experience/skills (2-3 sentences max)
3. Outline a brief approach or plan of action
4. End with a confident close and call to action
5. Be 150-250 words maximum
6. Sound natural and human, not template-like
7. Never use phrases like "I am writing to express my interest"
8. IMPORTANT: When mentioning any GitHub repo in the cover letter, you MUST include the full URL so the client can click and explore it. Format it naturally, e.g. "You can see my work in my Slack clone project (https://github.com/user/slack-clone-client) which demonstrates..."

Also select up to 3 GitHub repositories from the provided list that are most relevant to this job. For each:
- Provide a "relevanceReason": a one-liner on why this repo matters for this specific job.
- Provide a "briefSummary": a 2-3 sentence description of what the repo actually does and what technologies/patterns it demonstrates. Infer functionality from the repo name, description, language, and topics. Be specific — describe the features, architecture patterns, and tech stack used.

If no repos are relevant or none were provided, return an empty array.

Respond with a JSON object using this exact schema:
{
  "coverLetter": <string, the full proposal text — MUST include clickable URLs when mentioning repos>,
  "proposedRate": <number | null, suggested rate in USD>,
  "proposedDuration": <string | null, estimated timeline>,
  "keySellingPoints": [<string, top 3-4 selling points used>],
  "questionsForClient": [<string, 2-3 smart clarifying questions to include>],
  "relevantRepos": [
    {
      "name": <string, repo name>,
      "fullName": <string, owner/repo>,
      "url": <string, URL to the repo>,
      "description": <string | null, repo description>,
      "language": <string | null, primary language>,
      "stars": <number, star count>,
      "relevanceReason": <string, one-liner on why this repo is relevant to the job>,
      "briefSummary": <string, 2-3 sentences describing what this repo does, what features it includes, and what technologies/patterns it demonstrates>
    }
  ]
}`;

  return [
    { role: "system", content: SYSTEM_PROPOSAL_WRITER },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Client Analysis
// ---------------------------------------------------------------------------

export function buildClientAnalysisPrompt(
  client: ClientAnalysisInput
): AiChatMessage[] {
  const memberSinceStr = client.clientMemberSince
    ? new Date(client.clientMemberSince).toLocaleDateString()
    : "Unknown";

  const userPrompt = `Analyse the following Upwork client profile for trustworthiness and risk.

## Client Profile
- **Country:** ${client.clientCountry ?? "Unknown"}
- **Rating:** ${client.clientRating !== null ? `${client.clientRating}/5` : "No rating"}
- **Total Spent:** ${client.clientTotalSpent !== null ? `$${client.clientTotalSpent.toLocaleString()}` : "Unknown"}
- **Total Hires:** ${client.clientTotalHires ?? "Unknown"}
- **Jobs Posted:** ${client.clientTotalPosted ?? "Unknown"}
- **Hire Rate:** ${client.clientHireRate !== null ? `${client.clientHireRate}%` : "Unknown"}
- **Payment Verified:** ${client.clientPaymentVerified ? "Yes" : "No"}
- **Member Since:** ${memberSinceStr}

## Instructions
Respond with a JSON object using this exact schema:
{
  "trustScore": <number 0-100>,
  "riskLevel": <"LOW" | "MEDIUM" | "HIGH">,
  "insights": [<string, positive observations>],
  "redFlags": [<string, concerning signals>],
  "recommendation": <string, 1-2 sentence summary recommendation>
}`;

  return [
    { role: "system", content: SYSTEM_CLIENT_ANALYST },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Interview Prep
// ---------------------------------------------------------------------------

const SYSTEM_INTERVIEW_COACH = `You are an expert Upwork interview coach AI assistant called "Bid Buddy".
Your role is to prepare freelancers for client interviews and discovery calls.
You generate realistic questions the client is likely to ask based on the job posting.
You provide strategic, practical answers that demonstrate expertise without being overly generic.
Always respond in valid JSON matching the exact schema requested.`;

export function buildInterviewPrepPrompt(
  input: InterviewPrepInput,
  freelancer: FreelancerContext
): AiChatMessage[] {
  const userPrompt = `Generate interview preparation material for the following Upwork job.

## Job Details
- **Title:** ${input.jobTitle}
- **Type:** ${input.jobType}
- **Experience Level:** ${input.experienceLevel ?? "Not specified"}
- **Required Skills:** ${input.skillsRequired.join(", ") || "None listed"}

## Job Description
${input.jobDescription}

## Freelancer Skills
- **All Skills:** ${freelancer.skills.join(", ") || "None provided"}
- **Primary Skills:** ${freelancer.primarySkills.join(", ") || "None provided"}

## Instructions
Generate 8-10 likely interview questions the client may ask during a discovery call or interview.
Include a mix of technical, behavioral, situational, and client-specific questions.
For each question, provide a suggested answer tailored to the freelancer's skill set and practical tips.

Respond with a JSON object using this exact schema:
{
  "questions": [
    {
      "question": <string, the interview question>,
      "category": <"technical" | "behavioral" | "situational" | "client-specific">,
      "difficulty": <"easy" | "medium" | "hard">,
      "suggestedAnswer": <string, a strong answer the freelancer could give, 2-4 sentences>,
      "tips": <string, practical tip for answering this question well>
    }
  ],
  "overallTips": [<string, 4-5 general interview tips for this specific job>],
  "communicationAdvice": <string, 2-3 sentence advice on tone and communication style for this client>
}`;

  return [
    { role: "system", content: SYSTEM_INTERVIEW_COACH },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Bid Strategy
// ---------------------------------------------------------------------------

const SYSTEM_BID_STRATEGIST = `You are an expert Upwork bidding strategist AI assistant called "Bid Buddy".
Your role is to help freelancers craft winning bid strategies with optimal pricing, positioning, and timing.
You are data-driven, considering market rates, competition, client behavior, and proposal volume.
You provide actionable, specific advice — never generic platitudes.
Always respond in valid JSON matching the exact schema requested.`;

export function buildBidStrategyPrompt(
  input: BidStrategyInput,
  freelancer: FreelancerContext
): AiChatMessage[] {
  const budgetInfo = input.jobType === "HOURLY"
    ? `Hourly rate range: $${input.hourlyRateMin ?? "?"}–$${input.hourlyRateMax ?? "?"}/hr`
    : `Fixed budget: $${input.budgetMin ?? "?"}–$${input.budgetMax ?? "?"}`;

  const analysisNote = input.analysisContext
    ? `\n## Prior AI Analysis
- Fit Score: ${input.analysisContext.fitScore ?? "N/A"}%
- Win Probability: ${input.analysisContext.winProbability ?? "N/A"}%
- Recommendation: ${input.analysisContext.recommendation ?? "N/A"}
- Suggested Rate: $${input.analysisContext.suggestedRate ?? "N/A"}`
    : "";

  const userPrompt = `Create a comprehensive bid strategy for the following Upwork job.

## Job Details
- **Title:** ${input.jobTitle}
- **Type:** ${input.jobType}
- **Experience Level:** ${input.experienceLevel ?? "Not specified"}
- **${budgetInfo}**
- **Estimated Duration:** ${input.estimatedDuration ?? "Not specified"}
- **Required Skills:** ${input.skillsRequired.join(", ") || "None listed"}
- **Proposals Received:** ${input.proposalsCount ?? "Unknown"}
- **Connects Required:** ${input.connectsRequired ?? "Unknown"}

## Client Profile
- **Country:** ${input.clientCountry ?? "Unknown"}
- **Total Spent:** ${input.clientTotalSpent !== null ? `$${input.clientTotalSpent.toLocaleString()}` : "Unknown"}
- **Total Hires:** ${input.clientTotalHires ?? "Unknown"}
- **Hire Rate:** ${input.clientHireRate !== null ? `${input.clientHireRate}%` : "Unknown"}
- **Payment Verified:** ${input.clientPaymentVerified ? "Yes" : "No"}

## Job Description
${input.jobDescription}
${analysisNote}

## Freelancer Skills
- **All Skills:** ${freelancer.skills.join(", ") || "None provided"}
- **Primary Skills:** ${freelancer.primarySkills.join(", ") || "None provided"}

## Instructions
Provide a detailed bidding strategy including optimal rate, positioning approach, and competitive tactics.
Consider the number of proposals already submitted, the client's spending habits, and market rates.

Respond with a JSON object using this exact schema:
{
  "recommendedRate": <number, optimal bid rate in USD>,
  "rateRangeMin": <number, lower bound of acceptable rate>,
  "rateRangeMax": <number, upper bound of acceptable rate>,
  "rateJustification": <string, why this rate is optimal>,
  "positioningStrategy": <string, 2-3 sentence strategy for how to position yourself>,
  "differentiators": [<string, 3-4 unique things to emphasize that set you apart>],
  "openingHook": <string, a compelling first sentence for the proposal>,
  "competitiveAdvantages": [<string, 3-4 advantages over typical competitors>],
  "pricingTactics": [<string, 2-3 specific pricing tactics to use>],
  "connectsWorth": <boolean, whether spending connects on this job is worthwhile>,
  "connectsReasoning": <string, why or why not the connects are worth it>,
  "urgencyLevel": <"low" | "medium" | "high", how quickly to apply>,
  "urgencyReasoning": <string, why this urgency level>,
  "bestTimeToApply": <string, tactical advice on timing>
}`;

  return [
    { role: "system", content: SYSTEM_BID_STRATEGIST },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Skill Gap Analysis
// ---------------------------------------------------------------------------

const SYSTEM_SKILL_ANALYST = `You are an expert technical skill analyst AI assistant called "Bid Buddy".
Your role is to assess a freelancer's readiness for a specific job by comparing their skills against requirements.
You identify gaps honestly, estimate learning effort realistically, and suggest practical resources.
You also highlight strengths that can compensate for minor gaps.
Always respond in valid JSON matching the exact schema requested.`;

export function buildSkillGapPrompt(
  input: SkillGapInput,
  freelancer: FreelancerContext
): AiChatMessage[] {
  const experienceInfo = Object.entries(freelancer.yearsExperience)
    .map(([skill, years]) => `${skill}: ${years}y`)
    .join(", ");

  const userPrompt = `Analyse the skill gap between the freelancer's profile and this job's requirements.

## Job Details
- **Title:** ${input.jobTitle}
- **Experience Level:** ${input.experienceLevel ?? "Not specified"}
- **Required Skills:** ${input.skillsRequired.join(", ") || "None listed"}

## Job Description
${input.jobDescription}

## Freelancer Profile
- **All Skills:** ${freelancer.skills.join(", ") || "None provided"}
- **Primary Skills:** ${freelancer.primarySkills.join(", ") || "None provided"}
- **Experience:** ${experienceInfo || "Not provided"}

## Instructions
Evaluate each required skill against the freelancer's profile.
Be realistic about gaps but also identify transferable skills and quick wins.

Respond with a JSON object using this exact schema:
{
  "overallReadiness": <number 0-100, overall readiness percentage>,
  "readyToApply": <boolean, whether the freelancer should apply>,
  "summary": <string, 2-3 sentence summary of readiness>,
  "gaps": [
    {
      "skill": <string, the skill name>,
      "currentLevel": <"none" | "beginner" | "intermediate" | "advanced" | "expert">,
      "requiredLevel": <"beginner" | "intermediate" | "advanced" | "expert">,
      "importance": <"critical" | "important" | "nice-to-have">,
      "estimatedLearningTime": <string, e.g. "2-3 hours", "1 week">,
      "resources": [
        {
          "title": <string, resource name>,
          "type": <"course" | "docs" | "tutorial" | "practice">
        }
      ],
      "quickWin": <string, fastest way to demonstrate competence in this skill>
    }
  ],
  "strengthsToHighlight": [<string, 3-5 existing skills that are strong selling points>],
  "learningPlan": <string, concise paragraph with a prioritised learning plan if gaps exist>
}`;

  return [
    { role: "system", content: SYSTEM_SKILL_ANALYST },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Project Scope Estimator
// ---------------------------------------------------------------------------

const SYSTEM_SCOPE_ESTIMATOR = `You are an expert freelance project estimator AI assistant called "Bid Buddy".
Your role is to break down job postings into detailed task lists with realistic time estimates.
You have deep experience estimating software, design, and content projects.
You always add risk buffers, identify hidden complexity, and suggest smart milestone structures.
You err on the side of slightly overestimating rather than underestimating — freelancers consistently lose money by underquoting.
Always respond in valid JSON matching the exact schema requested.`;

export function buildScopeEstimatorPrompt(
  input: ScopeEstimatorInput,
  freelancer: FreelancerContext
): AiChatMessage[] {
  const budgetInfo = input.jobType === "HOURLY"
    ? `Hourly rate range: $${input.hourlyRateMin ?? "?"}–$${input.hourlyRateMax ?? "?"}/hr`
    : `Fixed budget: $${input.budgetMin ?? "?"}–$${input.budgetMax ?? "?"}`;

  const userPrompt = `Break down the following Upwork job into a detailed project scope with task estimates.

## Job Details
- **Title:** ${input.jobTitle}
- **Type:** ${input.jobType}
- **Experience Level:** ${input.experienceLevel ?? "Not specified"}
- **${budgetInfo}**
- **Estimated Duration:** ${input.estimatedDuration ?? "Not specified"}
- **Required Skills:** ${input.skillsRequired.join(", ") || "None listed"}

## Job Description
${input.jobDescription}

## Freelancer Skills
- **All Skills:** ${freelancer.skills.join(", ") || "None provided"}
- **Primary Skills:** ${freelancer.primarySkills.join(", ") || "None provided"}

## Instructions
Break this job into granular tasks, group them into milestones, and provide realistic hour estimates.
Consider: setup time, communication overhead, revision rounds, testing, deployment, and handover.
Include a risk buffer for scope creep. Identify items that are likely out of scope.

Respond with a JSON object using this exact schema:
{
  "tasks": [
    {
      "name": <string, short task name>,
      "description": <string, what this task involves>,
      "category": <"setup" | "development" | "design" | "testing" | "deployment" | "communication" | "other">,
      "hoursMin": <number, minimum hours>,
      "hoursMax": <number, maximum hours>,
      "complexity": <"low" | "medium" | "high">,
      "dependencies": [<string, names of tasks this depends on>],
      "deliverable": <string, what is delivered when this task is done>
    }
  ],
  "milestones": [
    {
      "name": <string, milestone name>,
      "tasks": [<string, task names in this milestone>],
      "hoursEstimate": <number, total hours for this milestone>,
      "suggestedPaymentPercent": <number, suggested % of total payment>,
      "deliverables": [<string, what the client receives at this milestone>]
    }
  ],
  "totalHoursMin": <number, sum of all task minimums>,
  "totalHoursMax": <number, sum of all task maximums>,
  "riskBufferPercent": <number 10-40, recommended risk buffer percentage>,
  "adjustedHoursMin": <number, totalHoursMin * (1 + riskBuffer/100)>,
  "adjustedHoursMax": <number, totalHoursMax * (1 + riskBuffer/100)>,
  "suggestedFixedPrice": <number | null, suggested fixed price if applicable>,
  "suggestedHourlyRate": <number | null, suggested hourly rate if applicable>,
  "scopeRisks": [<string, 3-5 risks that could increase scope>],
  "assumptions": [<string, 3-5 assumptions made in this estimate>],
  "outOfScopeItems": [<string, things NOT included that client might expect>],
  "summary": <string, 2-3 sentence overview of the estimate>
}`;

  return [
    { role: "system", content: SYSTEM_SCOPE_ESTIMATOR },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Client Discovery Questions
// ---------------------------------------------------------------------------

const SYSTEM_DISCOVERY_COACH = `You are an expert freelance consultant AI assistant called "Bid Buddy".
Your role is to help freelancers ask the RIGHT questions before committing to a project.
You identify ambiguities, hidden scope, payment risks, and unclear expectations in job postings.
Your questions are strategic — designed to protect the freelancer while building client trust.
You understand that asking smart questions actually increases a freelancer's perceived professionalism.
Always respond in valid JSON matching the exact schema requested.`;

export function buildDiscoveryQuestionsPrompt(
  input: DiscoveryQuestionsInput,
  freelancer: FreelancerContext
): AiChatMessage[] {
  const budgetInfo = input.budgetMin !== null || input.budgetMax !== null
    ? `$${input.budgetMin ?? "?"}–$${input.budgetMax ?? "?"}`
    : "Not specified";

  const clientProfile = [
    input.clientCountry ? `Country: ${input.clientCountry}` : null,
    input.clientTotalSpent !== null ? `Total spent: $${input.clientTotalSpent.toLocaleString()}` : null,
    input.clientTotalHires !== null ? `Hires: ${input.clientTotalHires}` : null,
    `Payment verified: ${input.clientPaymentVerified ? "Yes" : "No"}`,
  ].filter(Boolean).join(" | ");

  const userPrompt = `Generate strategic discovery questions for the following Upwork job. These are questions the freelancer should ask the client BEFORE accepting the contract.

## Job Details
- **Title:** ${input.jobTitle}
- **Type:** ${input.jobType}
- **Experience Level:** ${input.experienceLevel ?? "Not specified"}
- **Budget:** ${budgetInfo}
- **Duration:** ${input.estimatedDuration ?? "Not specified"}
- **Required Skills:** ${input.skillsRequired.join(", ") || "None listed"}
- **Client:** ${clientProfile}

## Job Description
${input.jobDescription}

## Freelancer Skills
- **All Skills:** ${freelancer.skills.join(", ") || "None provided"}
- **Primary Skills:** ${freelancer.primarySkills.join(", ") || "None provided"}

## Instructions
Generate 8-12 strategic questions that uncover hidden scope, risks, and expectations.
Focus on: ambiguous requirements, missing details, timeline risks, payment structure, revision expectations, and communication preferences.
For each question, explain WHY it matters and what answer to watch out for.
Also provide a message template the freelancer can use when reaching out.

Respond with a JSON object using this exact schema:
{
  "questions": [
    {
      "question": <string, the question to ask the client>,
      "category": <"scope" | "timeline" | "budget" | "communication" | "technical" | "expectations" | "red-flag">,
      "priority": <"must-ask" | "should-ask" | "nice-to-ask">,
      "whyItMatters": <string, why this question is important>,
      "idealAnswer": <string, what a good answer looks like>,
      "redFlagAnswer": <string, what answer should make you cautious>
    }
  ],
  "messagingTips": [<string, 3-4 tips for how to communicate these questions professionally>],
  "dealBreakers": [<string, 2-4 situations where the freelancer should walk away>],
  "greenFlags": [<string, 2-4 positive signs to look for in client responses>],
  "suggestedMessageTemplate": <string, a professional message template incorporating the must-ask questions naturally>
}`;

  return [
    { role: "system", content: SYSTEM_DISCOVERY_COACH },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Contract & Negotiation Advisor
// ---------------------------------------------------------------------------

const SYSTEM_CONTRACT_ADVISOR = `You are an expert freelance contract and negotiation advisor AI assistant called "Bid Buddy".
Your role is to protect freelancers from scope creep, payment issues, and unfavorable contract terms.
You have deep knowledge of Upwork's escrow system, dispute resolution, and milestone structures.
You provide practical, actionable negotiation scripts — not generic advice.
You always prioritize the freelancer's protection while maintaining professionalism.
Always respond in valid JSON matching the exact schema requested.`;

export function buildContractAdvisorPrompt(
  input: ContractAdvisorInput,
  freelancer: FreelancerContext
): AiChatMessage[] {
  const budgetInfo = input.jobType === "HOURLY"
    ? `Hourly rate: $${input.hourlyRateMin ?? "?"}–$${input.hourlyRateMax ?? "?"}/hr`
    : `Fixed budget: $${input.budgetMin ?? "?"}–$${input.budgetMax ?? "?"}`;

  const clientInfo = [
    input.clientCountry ? `Country: ${input.clientCountry}` : null,
    input.clientTotalSpent !== null ? `Total spent: $${input.clientTotalSpent.toLocaleString()}` : null,
    input.clientTotalHires !== null ? `Hires: ${input.clientTotalHires}` : null,
    input.clientHireRate !== null ? `Hire rate: ${input.clientHireRate}%` : null,
    `Payment verified: ${input.clientPaymentVerified ? "Yes" : "No"}`,
    input.proposalsCount !== null ? `Proposals: ${input.proposalsCount}` : null,
  ].filter(Boolean).join(" | ");

  const userPrompt = `Provide contract and negotiation advice for the following Upwork job.

## Job Details
- **Title:** ${input.jobTitle}
- **Type:** ${input.jobType}
- **Experience Level:** ${input.experienceLevel ?? "Not specified"}
- **${budgetInfo}**
- **Duration:** ${input.estimatedDuration ?? "Not specified"}
- **Required Skills:** ${input.skillsRequired.join(", ") || "None listed"}
- **Client:** ${clientInfo}

## Job Description
${input.jobDescription}

## Freelancer Skills
- **All Skills:** ${freelancer.skills.join(", ") || "None provided"}
- **Primary Skills:** ${freelancer.primarySkills.join(", ") || "None provided"}

## Instructions
Analyse this job for contract risks and provide negotiation strategies.
Consider: scope creep potential, payment risks, revision abuse, timeline pressure, and Upwork-specific protections.
Provide practical scripts the freelancer can use in negotiations.

Respond with a JSON object using this exact schema:
{
  "overallRiskLevel": <"low" | "medium" | "high">,
  "riskSummary": <string, 2-3 sentence overview of contract risks>,
  "negotiationPoints": [
    {
      "topic": <string, what to negotiate>,
      "currentRisk": <"low" | "medium" | "high">,
      "suggestion": <string, what to propose>,
      "scriptExample": <string, exact words to say to the client>
    }
  ],
  "paymentStructure": [
    {
      "milestone": <string, milestone name>,
      "percent": <number, percentage of total payment>,
      "trigger": <string, what triggers this payment>
    }
  ],
  "scopeProtectionTips": [<string, 3-5 ways to protect against scope creep>],
  "revisionPolicy": <string, suggested revision policy wording>,
  "communicationTerms": [<string, 3-4 communication boundaries to establish>],
  "walkAwaySignals": [<string, 3-5 signals that you should decline or exit>],
  "contractChecklist": [<string, 5-8 things to confirm before starting work>],
  "upworkSpecificTips": [<string, 3-5 Upwork-specific protections and strategies>]
}`;

  return [
    { role: "system", content: SYSTEM_CONTRACT_ADVISOR },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Follow-Up Message Generator
// ---------------------------------------------------------------------------

const SYSTEM_FOLLOWUP_WRITER = `You are an expert Upwork follow-up message writer AI assistant called "Bid Buddy".
Your role is to craft follow-up messages that increase response rates without being pushy.
You understand timing, tone, and the psychology of client communication on Upwork.
You write messages that add value (not just "checking in") by offering insights, asking smart questions, or sharing relevant work.
Always respond in valid JSON matching the exact schema requested.`;

export function buildFollowUpPrompt(
  input: FollowUpMessageInput,
  freelancer: FreelancerContext
): AiChatMessage[] {
  const userPrompt = `Generate a strategic follow-up message for a submitted Upwork proposal.

## Context
- **Job Title:** ${input.jobTitle}
- **Days Since Submission:** ${input.daysSinceSubmission}
- **Proposal Status:** ${input.proposalStatus}
- **Submitted At:** ${input.proposalSentAt}

## Original Proposal (Summary)
${input.proposalCoverLetter.slice(0, 500)}${input.proposalCoverLetter.length > 500 ? "..." : ""}

## Job Description
${input.jobDescription.slice(0, 800)}${input.jobDescription.length > 800 ? "..." : ""}

## Freelancer Skills
- **Skills:** ${freelancer.skills.join(", ") || "None provided"}
- **Primary Skills:** ${freelancer.primarySkills.join(", ") || "None provided"}

## Instructions
Write a follow-up message that:
1. Does NOT just say "checking in" or "following up"
2. Adds VALUE — share an insight, ask a clarifying question, or offer a mini-audit
3. Is appropriate for ${input.daysSinceSubmission} days since submission
4. Maintains professionalism while being warm
5. Is 50-120 words maximum
6. Ends with a soft call to action

Respond with a JSON object using this exact schema:
{
  "message": <string, the follow-up message text>,
  "tone": <"friendly" | "professional" | "urgent">,
  "subject": <string, short subject line if applicable>,
  "bestTimeToSend": <string, advice on when to send this>,
  "tips": [<string, 2-3 tips for the follow-up>],
  "doNots": [<string, 2-3 things to avoid>]
}`;

  return [
    { role: "system", content: SYSTEM_FOLLOWUP_WRITER },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Proposal Tone Variations
// ---------------------------------------------------------------------------

const SYSTEM_VARIATION_WRITER = `You are an expert Upwork proposal writer AI assistant called "Bid Buddy".
Your specialty is adapting proposal tone and style to match different client types.
You generate multiple distinct versions of the same proposal, each with a completely different voice and angle.
- "professional": Structured, formal, milestone-focused. Best for enterprise/corporate clients.
- "conversational": Warm, friendly, problem-solver vibe. Best for startups and small businesses.
- "technical": Deep implementation details, architecture-focused. Best for technical CTOs and developers.
Each variation must be genuinely different, not just word substitutions.
Always respond in valid JSON matching the exact schema requested.`;

export function buildProposalVariationsPrompt(
  input: ProposalVariationsInput,
  freelancer: FreelancerContext
): AiChatMessage[] {
  const budgetInfo = input.jobType === "HOURLY"
    ? `Hourly rate range: $${input.hourlyRateMin ?? "?"}–$${input.hourlyRateMax ?? "?"}/hr`
    : `Fixed budget: $${input.budgetMin ?? "?"}–$${input.budgetMax ?? "?"}`;

  const analysisNote = input.analysisContext
    ? `\n## Prior AI Analysis\n- Fit Score: ${input.analysisContext.fitScore}%\n- Strengths: ${input.analysisContext.strengths.join(", ")}\n- Matched Skills: ${input.analysisContext.matchedSkills.join(", ")}\n- Suggested Rate: $${input.analysisContext.suggestedRate ?? "N/A"}`
    : "";

  const userPrompt = `Generate 3 distinct proposal variations for the following Upwork job. Each must have a completely different tone and angle.

## Job Details
- **Title:** ${input.jobTitle}
- **Type:** ${input.jobType}
- **Required Skills:** ${input.skillsRequired.join(", ") || "None listed"}
- **${budgetInfo}**
- **Estimated Duration:** ${input.estimatedDuration ?? "Not specified"}

## Job Description
${input.jobDescription}
${analysisNote}

## Freelancer Skills
- **All Skills:** ${freelancer.skills.join(", ") || "None provided"}
- **Primary Skills:** ${freelancer.primarySkills.join(", ") || "None provided"}

## Instructions
Generate exactly 3 proposal variations:
1. **Professional** — Structured, formal, milestones-focused
2. **Conversational** — Warm, friendly, problem-solver
3. **Technical** — Deep-dive implementation, architecture-focused

Each proposal should be 150-250 words, and each must take a genuinely different angle.

Respond with a JSON object using this exact schema:
{
  "variations": [
    {
      "tone": <"professional" | "conversational" | "technical">,
      "toneDescription": <string, 1-sentence description of this tone's approach>,
      "coverLetter": <string, the full proposal text>,
      "proposedRate": <number | null, suggested rate in USD>,
      "keyAngle": <string, the main selling angle of this variation>,
      "bestFor": <string, what type of client this works best for>
    }
  ],
  "recommendation": <string, which variation to use and why, based on the client profile>
}`;

  return [
    { role: "system", content: SYSTEM_VARIATION_WRITER },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Weekly Performance Digest
// ---------------------------------------------------------------------------

const SYSTEM_PERFORMANCE_COACH = `You are an expert freelance performance coach AI assistant called "Bid Buddy".
Your role is to analyse a freelancer's weekly performance data and provide actionable, specific advice.
You are encouraging but honest. You identify what's working and what's not, then give concrete next steps.
You motivate without being cheesy.
Always respond in valid JSON matching the exact schema requested.`;

export function buildWeeklyDigestPrompt(
  input: WeeklyDigestInput
): AiChatMessage[] {
  const winRate = input.totalProposalsSent > 0
    ? Math.round((input.totalProposalsWon / input.totalProposalsSent) * 100)
    : 0;

  const userPrompt = `Analyse the following weekly freelancing performance data and provide a strategic digest.

## Weekly Stats
- **Jobs Captured:** ${input.totalJobsCaptured}
- **Proposals Sent:** ${input.totalProposalsSent}
- **Proposals Won:** ${input.totalProposalsWon}
- **Proposals Rejected:** ${input.totalProposalsRejected}
- **Win Rate:** ${winRate}%
- **Connects Spent:** ${input.connectsSpent}
- **Avg Fit Score:** ${input.avgFitScore ?? "N/A"}
- **Avg Win Probability:** ${input.avgWinProbability ?? "N/A"}
- **Total Earnings:** $${input.totalEarnings.toLocaleString()}
- **Active Projects:** ${input.activeProjects}
- **Top Job Categories:** ${input.topJobCategories.join(", ") || "N/A"}
- **Freelancer Skills:** ${input.skills.join(", ") || "N/A"}

## Instructions
Provide a comprehensive weekly performance digest with specific, actionable advice.
Be honest about what's working and what needs improvement.
Give the freelancer a letter grade and specific action items for next week.

Respond with a JSON object using this exact schema:
{
  "summary": <string, 2-3 sentence overview of the week>,
  "winRate": <number, calculated win rate percentage>,
  "connectsEfficiency": <string, assessment of connects usage efficiency>,
  "topPerformingArea": <string, what the freelancer did best this week>,
  "biggestOpportunity": <string, the single biggest area for improvement>,
  "actionItems": [<string, 3-5 specific action items for next week>],
  "weeklyGrade": <"A" | "B" | "C" | "D" | "F">,
  "trendDirection": <"improving" | "stable" | "declining">,
  "motivationalNote": <string, 1-2 sentences of encouragement>
}`;

  return [
    { role: "system", content: SYSTEM_PERFORMANCE_COACH },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Win Pattern Analyzer
// ---------------------------------------------------------------------------

const SYSTEM_PATTERN_ANALYST = `You are an expert data analyst AI assistant called "Bid Buddy".
Your role is to find hidden patterns in freelancing proposal data — what works and what doesn't.
You analyse winning vs losing proposals to extract actionable insights.
You are data-driven and specific, not generic. Every insight should be tied to the data provided.
Always respond in valid JSON matching the exact schema requested.`;

export function buildWinPatternPrompt(
  input: WinPatternInput
): AiChatMessage[] {
  const winningData = input.winningProposals.map((p, i) =>
    `${i + 1}. "${p.jobTitle}" (${p.jobType}, ${p.skills.join("/")}${p.rate ? `, $${p.rate}` : ""}, ${p.coverLetterLength} chars)`
  ).join("\n");

  const losingData = input.losingProposals.map((p, i) =>
    `${i + 1}. "${p.jobTitle}" (${p.jobType}, ${p.skills.join("/")}${p.rate ? `, $${p.rate}` : ""}, ${p.coverLetterLength} chars)`
  ).join("\n");

  const userPrompt = `Analyse the following proposal history to find winning patterns.

## Winning Proposals (${input.winningProposals.length})
${winningData || "None yet"}

## Losing Proposals (${input.losingProposals.length})
${losingData || "None yet"}

## Freelancer Skills
${input.freelancerSkills.join(", ") || "Not provided"}

## Instructions
Identify patterns, correlations, and actionable insights from the proposal data.
Compare winning vs losing proposals across job type, rate, skills, and proposal length.
If insufficient data, acknowledge that and provide best guesses.

Respond with a JSON object using this exact schema:
{
  "overallWinRate": <number, win rate percentage>,
  "patterns": [
    {
      "pattern": <string, description of the pattern found>,
      "confidence": <"high" | "medium" | "low">,
      "impact": <string, how this affects win rate>,
      "recommendation": <string, actionable advice based on this pattern>
    }
  ],
  "bestJobTypes": [<string, job types with highest win rate>],
  "bestSkillCombinations": [<string, skill combinations that win most>],
  "optimalRateRange": <{ "min": number, "max": number } | null>,
  "optimalProposalLength": <string, recommended proposal length range>,
  "topRecommendations": [<string, 3-5 specific recommendations to improve win rate>]
}`;

  return [
    { role: "system", content: SYSTEM_PATTERN_ANALYST },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Profile Optimizer
// ---------------------------------------------------------------------------

const SYSTEM_PROFILE_OPTIMIZER = `You are an expert Upwork profile optimization AI assistant called "Bid Buddy".
Your role is to help freelancers optimise their Upwork profile to attract more clients and invites.
You understand Upwork's search algorithm, client psychology, and what makes profiles stand out.
You provide specific before/after suggestions — not generic advice.
You know that niche positioning beats being a generalist on Upwork.
Always respond in valid JSON matching the exact schema requested.`;

export function buildProfileOptimizerPrompt(
  input: ProfileOptimizerInput,
  freelancer: FreelancerContext
): AiChatMessage[] {
  const experienceInfo = Object.entries(freelancer.yearsExperience)
    .map(([skill, years]) => `${skill}: ${years}y`)
    .join(", ");

  const userPrompt = `Optimise the following Upwork freelancer profile for maximum visibility and client attraction.

## Current Profile
- **Title:** ${input.currentTitle ?? "Not set"}
- **Bio:** ${input.currentBio ?? "Not set"}
- **All Skills:** ${input.skills.join(", ") || "None"}
- **Primary Skills:** ${input.primarySkills.join(", ") || "None"}
- **Experience:** ${experienceInfo || "Not provided"}
- **Top GitHub Languages:** ${input.topLanguages.join(", ") || "None"}

## Performance Data
- **Total Proposals:** ${input.totalProposals}
- **Win Rate:** ${input.winRate}%
- **Winning Job Types:** ${input.winningJobTypes.join(", ") || "N/A"}

## Instructions
Provide a comprehensive profile optimisation plan. Be specific with before/after examples.
Consider Upwork search algorithm, keyword optimisation, and client psychology.
Suggest a niche positioning strategy based on the freelancer's strengths and win history.

Respond with a JSON object using this exact schema:
{
  "overallScore": <number 0-100, current profile effectiveness score>,
  "suggestedTitle": <string, optimised professional title for Upwork>,
  "suggestedBio": <string, full optimised bio (500-800 chars, formatted for Upwork)>,
  "skillsToAdd": [<string, skills to add to profile>],
  "skillsToRemove": [<string, skills that dilute positioning>],
  "skillsToReorder": [<string, skills to move to top for better visibility>],
  "portfolioSuggestions": [<string, types of portfolio items to add>],
  "keywordOptimizations": [<string, specific keywords to weave into profile>],
  "nicheSuggestion": <string, recommended niche positioning strategy>,
  "improvements": [
    {
      "area": <string, what to improve>,
      "current": <string, current state>,
      "suggested": <string, improved version>,
      "impact": <"high" | "medium" | "low">
    }
  ]
}`;

  return [
    { role: "system", content: SYSTEM_PROFILE_OPTIMIZER },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Client Relationship Intelligence
// ---------------------------------------------------------------------------

const SYSTEM_CLIENT_INTELLIGENCE = `You are an expert client relationship analyst AI assistant called "Bid Buddy".
Your role is to build comprehensive client intelligence profiles from available data.
You identify communication styles, payment patterns, work preferences, and negotiation approaches.
You help freelancers understand their clients better to build stronger, more profitable relationships.
Always respond in valid JSON matching the exact schema requested.`;

export function buildClientIntelligencePrompt(
  input: ClientIntelligenceInput
): AiChatMessage[] {
  const jobsSummary = input.jobs.map((j, i) =>
    `${i + 1}. "${j.title}" (Budget: ${j.budget ? `$${j.budget}` : "N/A"}, Status: ${j.status}, Skills: ${j.skillsRequired.join(", ")})`
  ).join("\n");

  const userPrompt = `Build a comprehensive client intelligence profile from the following data.

## Client Profile
- **Name:** ${input.clientName ?? "Anonymous"}
- **Country:** ${input.clientCountry ?? "Unknown"}
- **Rating:** ${input.clientRating !== null ? `${input.clientRating}/5` : "No rating"}
- **Total Spent:** ${input.clientTotalSpent !== null ? `$${input.clientTotalSpent.toLocaleString()}` : "Unknown"}
- **Total Hires:** ${input.clientTotalHires ?? "Unknown"}
- **Hire Rate:** ${input.clientHireRate !== null ? `${input.clientHireRate}%` : "Unknown"}
- **Payment Verified:** ${input.clientPaymentVerified ? "Yes" : "No"}
- **Member Since:** ${input.clientMemberSince ?? "Unknown"}

## Job History (${input.jobs.length} jobs)
${jobsSummary || "No job history available"}

## Instructions
Analyse the client's profile and job history to build an intelligence report.
Infer communication style, payment behavior, and work preferences from the data.
Provide practical advice on how to work effectively with this client.

Respond with a JSON object using this exact schema:
{
  "trustScore": <number 0-100>,
  "communicationStyle": <string, inferred communication style and preferences>,
  "paymentBehavior": <string, assessment of payment reliability and patterns>,
  "workPreferences": [<string, inferred work preferences>],
  "strengths": [<string, positive client attributes>],
  "risks": [<string, potential risks or concerns>],
  "bestApproach": <string, recommended approach for working with this client>,
  "repeatWorkPotential": <"high" | "medium" | "low">,
  "negotiationTips": [<string, 3-4 negotiation strategies for this client>],
  "idealFreelancerProfile": <string, what type of freelancer this client likely prefers>
}`;

  return [
    { role: "system", content: SYSTEM_CLIENT_INTELLIGENCE },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Smart Alerts
// ---------------------------------------------------------------------------

const SYSTEM_SMART_ALERTS = `You are an expert freelance intelligence AI assistant called "Bid Buddy".
Your role is to monitor a freelancer's pipeline and proactively surface actionable alerts.
You identify opportunities they might miss, warn about stale proposals, spot market trends, and celebrate milestones.
Every alert must be specific and actionable — never generic. Prioritise alerts by business impact.
Always respond in valid JSON matching the exact schema requested.`;

export function buildSmartAlertPrompt(
  input: SmartAlertInput
): AiChatMessage[] {
  const recentJobsList = input.recentJobs
    .map(
      (j, i) =>
        `${i + 1}. [ID: ${j.id}] "${j.title}" (Fit: ${j.fitScore ?? "N/A"}, Win: ${j.winProbability ?? "N/A"}%, Budget: ${j.budgetMax ? `$${j.budgetMax}` : "N/A"}, Skills: ${j.skillsRequired.join(", ")}, Posted: ${j.postedAt ?? "Unknown"})`
    )
    .join("\n");

  const pendingList = input.pendingProposals
    .map(
      (p, i) =>
        `${i + 1}. [JobID: ${p.jobId}, ProposalID: ${p.proposalId}] "${p.jobTitle}" — ${p.daysSinceSubmission} days ago, status: ${p.status}`
    )
    .join("\n");

  const userPrompt = `Analyse the following freelancer pipeline and generate prioritised smart alerts.

## Recent Jobs (${input.recentJobs.length})
${recentJobsList || "No recent jobs captured"}

## Pending Proposals (${input.pendingProposals.length})
${pendingList || "No pending proposals"}

## Freelancer Context
- **Skills:** ${input.freelancerSkills.join(", ") || "None"}
- **Avg Fit Score:** ${input.avgFitScore ?? "N/A"}
- **Avg Win Rate:** ${input.avgWinRate}%
- **Connects Balance:** ${input.connectsBalance}

## Instructions
Generate 3-8 prioritised alerts based on the data. Focus on:
1. High-fit jobs that need immediate action
2. Proposals that have gone stale (5+ days with no response)
3. Connects running low relative to opportunity volume
4. Patterns suggesting a market shift (new skill demand, budget changes)
5. Milestones and encouragement when performance is good
6. Quick tactical tips based on current pipeline state

CRITICAL: For actionUrl, you MUST use the EXACT IDs provided in the data above. Use "/jobs/{ID}" for job-related alerts and "/jobs/{JobID}" for proposal-related alerts. Do NOT invent or guess IDs. If an alert is general (like a tip or market-shift) and doesn't link to a specific item, set actionUrl to null.

Respond with a JSON object using this exact schema:
{
  "alerts": [
    {
      "type": <"opportunity" | "deadline" | "stale-proposal" | "market-shift" | "milestone" | "tip">,
      "priority": <"high" | "medium" | "low">,
      "title": <string, short alert title>,
      "message": <string, 1-3 sentence actionable message>,
      "actionLabel": <string | null, button label like "View Job" or "Send Follow-Up">,
      "actionUrl": <string | null, relative URL using exact IDs from above e.g. "/jobs/abc123-def456" or null>
    }
  ],
  "summary": <string, 1-2 sentence overview of the freelancer's current state>,
  "nextCheckRecommendation": <string, when the freelancer should check back, e.g. "Check back in 4 hours">
}`;

  return [
    { role: "system", content: SYSTEM_SMART_ALERTS },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Writing Style Trainer
// ---------------------------------------------------------------------------

const SYSTEM_STYLE_TRAINER = `You are an expert writing style analyst AI assistant called "Bid Buddy".
Your role is to analyse a freelancer's proposal writing style and provide a detailed style profile.
You identify patterns in tone, sentence structure, vocabulary, and persuasion techniques.
You compare winning vs losing proposals to find what works and what doesn't.
Your feedback is specific, example-driven, and immediately actionable.
Always respond in valid JSON matching the exact schema requested.`;

export function buildStyleTrainerPrompt(
  input: StyleTrainerInput
): AiChatMessage[] {
  const samplesList = input.sampleProposals
    .map(
      (s, i) =>
        `--- Proposal ${i + 1} (${s.wasAccepted ? "✅ WON" : "❌ LOST"} | ${s.jobType} | "${s.jobTitle}") ---\n${s.coverLetter.slice(0, 600)}${s.coverLetter.length > 600 ? "..." : ""}`
    )
    .join("\n\n");

  const userPrompt = `Analyse the following freelancer proposal samples and build a comprehensive writing style profile.

## Proposal Samples (${input.sampleProposals.length})
${samplesList || "No samples provided"}

## Freelancer Skills
${input.freelancerSkills.join(", ") || "Not provided"}

## Instructions
Analyse the writing style across all samples. Compare winning vs losing proposals.
Identify specific patterns — sentence openers, vocabulary choices, structure, persuasion techniques.
Provide concrete examples from the actual text. Be brutally honest about weaknesses.
Generate a reusable "style guide" the freelancer can reference for future proposals.

Respond with a JSON object using this exact schema:
{
  "overallStyle": <string, 2-3 sentence characterisation of the writing style>,
  "toneProfile": <string, description of the dominant tone and how it varies>,
  "sentenceStructure": <string, analysis of sentence length, complexity, and patterns>,
  "vocabularyLevel": <"simple" | "moderate" | "advanced">,
  "strengthPatterns": [
    {
      "pattern": <string, description of a positive writing pattern>,
      "frequency": <"always" | "often" | "sometimes">,
      "effectiveness": <"high" | "medium" | "low">,
      "example": <string, actual example from the samples>
    }
  ],
  "weaknessPatterns": [
    {
      "pattern": <string, description of a problematic writing pattern>,
      "frequency": <"always" | "often" | "sometimes">,
      "effectiveness": <"high" | "medium" | "low">,
      "example": <string, actual example from the samples>
    }
  ],
  "signaturePhrases": [<string, recurring phrases or expressions unique to this writer>],
  "improvementSuggestions": [<string, 4-6 specific, actionable improvement suggestions>],
  "styleGuide": <string, a concise reusable style guide (200-400 words) the freelancer can reference when writing new proposals>
}`;

  return [
    { role: "system", content: SYSTEM_STYLE_TRAINER },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Scope Creep Detection
// ---------------------------------------------------------------------------

const SYSTEM_SCOPE_CREEP_DETECTION = `You are an expert freelance contract analyst AI called "Bid Buddy — Scope Shield".
Your role is to analyse a client's message and determine whether the request falls within the originally agreed project scope or constitutes scope creep.
You are precise, fair, and thorough. You compare the request against the documented deliverables, exclusions, budget, and timeline.
You give a clear verdict with supporting evidence and practical advice.
Always respond in valid JSON matching the exact schema requested.`;

export function buildScopeCreepDetectionPrompt(input: ScopeCreepDetectionInput): AiChatMessage[] {
  const userPrompt = `Analyse the following client message and determine if it is within the original project scope or if it represents scope creep.

## Project Information
- **Title:** ${input.projectTitle}
- **Original Scope Description:** ${input.originalScope}
- **Agreed Deliverables:** ${input.deliverables.length > 0 ? input.deliverables.map((d, i) => `${i + 1}. ${d}`).join("\n") : "None documented"}
- **Documented Exclusions:** ${input.exclusions.length > 0 ? input.exclusions.map((e, i) => `${i + 1}. ${e}`).join("\n") : "None documented"}
- **Agreed Budget:** ${input.agreedBudget ? `$${input.agreedBudget}` : "Not specified"}
- **Agreed Timeline:** ${input.agreedTimeline ?? "Not specified"}
- **Revision Limit:** ${input.revisionLimit !== null ? `${input.revisionLimit} revisions` : "Not specified"}

## Client's New Message / Request
"${input.clientMessage}"

## Instructions
1. Compare the client's request against EACH agreed deliverable and exclusion
2. Identify what in this request overlaps with existing scope and what is new
3. Assess the impact on time, cost, and quality
4. Give a clear verdict: IN_SCOPE, OUT_OF_SCOPE, or GRAY_AREA
5. Suggest the best action: accept, negotiate, or decline

Respond with a JSON object using this exact schema:
{
  "isOutOfScope": <boolean, true if the request is outside the agreed scope>,
  "confidence": <number 0-100, how confident you are in the verdict>,
  "verdict": <"IN_SCOPE" | "OUT_OF_SCOPE" | "GRAY_AREA">,
  "reasoning": <string, 2-4 sentence explanation of the verdict with specific references to scope items>,
  "originalScopeItems": [<string, relevant items from the original scope>],
  "requestedItems": [<string, specific items the client is requesting>],
  "overlappingItems": [<string, items that overlap with original scope>],
  "newItems": [<string, items that are genuinely new/out of scope>],
  "riskLevel": <"low" | "medium" | "high">,
  "impactAssessment": {
    "timeImpact": <string, estimated time impact>,
    "costImpact": <string, estimated cost impact>,
    "qualityImpact": <string, potential quality impact if accepted without adjustment>
  },
  "suggestedAction": <"accept" | "negotiate" | "decline">,
  "quickSummary": <string, one-sentence summary a freelancer can quickly glance at>
}`;

  return [
    { role: "system", content: SYSTEM_SCOPE_CREEP_DETECTION },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Diplomatic Response Generator
// ---------------------------------------------------------------------------

const SYSTEM_DIPLOMATIC_RESPONSE = `You are an expert freelance communication coach AI called "Bid Buddy — Scope Shield".
Your role is to help freelancers craft professional, diplomatic responses to clients who are requesting work outside the agreed scope.
You maintain the client relationship while firmly protecting the freelancer's boundaries and earning potential.
You understand the power dynamics of freelance relationships on platforms like Upwork.
Always respond in valid JSON matching the exact schema requested.`;

export function buildDiplomaticResponsePrompt(input: DiplomaticResponseInput): AiChatMessage[] {
  const userPrompt = `Generate a diplomatic response to a client's out-of-scope request.

## Context
- **Project:** ${input.projectTitle}
- **Freelancer Name:** ${input.freelancerName ?? "the freelancer"}
- **Desired Tone:** ${input.tone}

## Client's Message
"${input.clientMessage}"

## Scope Analysis Summary
- **Verdict:** ${input.scopeAnalysis.verdict}
- **Confidence:** ${input.scopeAnalysis.confidence}%
- **Reasoning:** ${input.scopeAnalysis.reasoning}
- **New Items Requested:** ${input.scopeAnalysis.newItems.join(", ") || "None identified"}
- **Risk Level:** ${input.scopeAnalysis.riskLevel}
- **Time Impact:** ${input.scopeAnalysis.impactAssessment.timeImpact}
- **Cost Impact:** ${input.scopeAnalysis.impactAssessment.costImpact}

## Original Deliverables
${input.originalDeliverables.map((d, i) => `${i + 1}. ${d}`).join("\n") || "None documented"}

## Instructions
Write a ${input.tone} but professional response that:
1. Acknowledges the client's request positively
2. References the original agreed scope
3. Clearly explains what falls outside scope
4. Offers constructive alternatives (change order, separate project, etc.)
5. Maintains the relationship and shows willingness to help

Respond with a JSON object using this exact schema:
{
  "response": <string, the full message to send to the client, formatted with paragraphs>,
  "tone": <"firm" | "friendly" | "neutral">,
  "keyPoints": [<string, 3-5 key points the response addresses>],
  "whatToAvoidSaying": [<string, 3-4 things the freelancer should NOT say>],
  "followUpSuggestions": [<string, 2-3 follow-up actions to take>],
  "alternativeOffers": [<string, 2-3 alternative solutions to offer the client>],
  "escalationPath": <string, what to do if the client pushes back>
}`;

  return [
    { role: "system", content: SYSTEM_DIPLOMATIC_RESPONSE },
    { role: "user", content: userPrompt },
  ];
}

// ---------------------------------------------------------------------------
// Change Order Generator
// ---------------------------------------------------------------------------

const SYSTEM_CHANGE_ORDER = `You are an expert freelance project manager AI called "Bid Buddy — Scope Shield".
Your role is to generate professional change orders that clearly document additional work, costs, and timeline changes.
You produce fair, transparent pricing that protects the freelancer while being reasonable for the client.
You understand Upwork's contract structures and milestone-based payments.
Always respond in valid JSON matching the exact schema requested.`;

export function buildChangeOrderPrompt(input: ChangeOrderInput): AiChatMessage[] {
  const userPrompt = `Generate a professional change order for additional out-of-scope work requested by a client.

## Project Context
- **Project:** ${input.projectTitle}
- **Original Budget:** ${input.originalBudget ? `$${input.originalBudget}` : "Not specified"}
- **Original Timeline:** ${input.originalTimeline ?? "Not specified"}
- **Freelancer's Hourly Rate:** ${input.freelancerHourlyRate ? `$${input.freelancerHourlyRate}/hr` : "Not specified"}

## Client's Request
"${input.clientMessage}"

## Scope Analysis
- **Verdict:** ${input.scopeAnalysis.verdict}
- **New Items:** ${input.scopeAnalysis.newItems.join(", ") || "General additional work"}
- **Time Impact:** ${input.scopeAnalysis.impactAssessment.timeImpact}
- **Cost Impact:** ${input.scopeAnalysis.impactAssessment.costImpact}
- **Risk Level:** ${input.scopeAnalysis.riskLevel}

## Instructions
Generate a clear, professional change order that:
1. Breaks down the additional work into line items with hours and cost
2. Uses the freelancer's hourly rate (or estimate a fair rate if not provided)
3. Provides a new timeline that accounts for the additional work
4. Includes a pre-written message to send to the client
5. Adds terms and conditions to protect the freelancer

Respond with a JSON object using this exact schema:
{
  "summary": <string, brief summary of the change order>,
  "lineItems": [
    {
      "description": <string, what the work involves>,
      "hours": <number, estimated hours>,
      "rate": <number, hourly rate in USD>,
      "total": <number, hours × rate>
    }
  ],
  "totalAdditionalCost": <number, sum of all line item totals>,
  "totalAdditionalHours": <number, sum of all hours>,
  "newTimeline": <string, updated project timeline>,
  "justification": <string, why this work warrants additional payment>,
  "termsAndConditions": [<string, 3-5 protective terms>],
  "clientMessage": <string, pre-written professional message to send to the client proposing the change order>,
  "paymentTerms": <string, suggested payment structure for the additional work>,
  "notes": [<string, 2-3 additional notes or recommendations>]
}`;

  return [
    { role: "system", content: SYSTEM_CHANGE_ORDER },
    { role: "user", content: userPrompt },
  ];
}

