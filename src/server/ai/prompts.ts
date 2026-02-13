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

## Instructions
Write a compelling, personalised cover letter. It should:
1. Open with a hook that shows you understand the client's problem
2. Briefly mention relevant experience/skills (2-3 sentences max)
3. Outline a brief approach or plan of action
4. End with a confident close and call to action
5. Be 150-250 words maximum
6. Sound natural and human, not template-like
7. Never use phrases like "I am writing to express my interest"

Respond with a JSON object using this exact schema:
{
  "coverLetter": <string, the full proposal text>,
  "proposedRate": <number | null, suggested rate in USD>,
  "proposedDuration": <string | null, estimated timeline>,
  "keySellingPoints": [<string, top 3-4 selling points used>],
  "questionsForClient": [<string, 2-3 smart clarifying questions to include>]
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

