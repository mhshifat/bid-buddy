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

