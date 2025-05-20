
'use server';
/**
 * @fileOverview Defines a Genkit flow for generating a detailed implementation plan
 * for a given idea.
 *
 * - generateImplementationPlan - A function that takes a summarized idea and returns a structured implementation plan.
 * - GenerateImplementationPlanInput - The input type for the generateImplementationPlan function.
 * - GenerateImplementationPlanOutput - The return type for the generateImplementationPlan function (which is ImplementationPlanData).
 */

import {ai} from '@/ai/genkit';
import type { ImplementationPlanData } from '@/types';
import {z} from 'genkit';

const GenerateImplementationPlanInputSchema = z.object({
  summarizedIdea: z.string().describe('The finalized and summarized idea for which to generate an implementation plan.'),
});
export type GenerateImplementationPlanInput = z.infer<typeof GenerateImplementationPlanInputSchema>;

// Output schema matches the ImplementationPlanData interface from @/types
const GenerateImplementationPlanOutputSchema = z.object({
  timeframe: z.string().describe('A detailed timeframe outlining project phases (e.g., Research: 2 weeks, Design: 3 weeks).'),
  projectPhasesFlowchart: z.string().describe('A text-based flowchart outlining project phases like research, design, development, testing, and deployment. Use simple text and indentation to represent the flow.'),
  costEstimationFlowchart: z.string().describe('A text-based flowchart estimating expenses for AI API usage, cloud services, development tools, and other resources. Use simple text and indentation.'),
  resourceAllocation: z.string().describe('A text-based flowchart detailing how key team roles are allocated across project phases, indicating their primary responsibilities or involvement per phase.'),
  feasibilityAssessment: z.string().describe('A feasibility check evaluating technical, business, and operational viability of the project.'),
  refinedStrategy: z.string().describe('A refined, actionable strategy based on the feasibility and planning, which can be used to guide the project or restart the development cycle with improvements.'),
});
export type GenerateImplementationPlanOutput = z.infer<typeof GenerateImplementationPlanOutputSchema>;


export async function generateImplementationPlan(input: GenerateImplementationPlanInput): Promise<ImplementationPlanData> {
  return generateImplementationPlanFlow(input);
}

const implementationPlanPrompt = ai.definePrompt({
  name: 'implementationPlanPrompt',
  input: {schema: GenerateImplementationPlanInputSchema},
  output: {schema: GenerateImplementationPlanOutputSchema},
  prompt: `You are an expert project planner and strategist.
Based on the following summarized idea, generate a comprehensive implementation plan.

Summarized Idea:
"{{{summarizedIdea}}}"

Please provide the following sections for the implementation plan. Each flowchart should be distinct:

1.  **Timeframe**: A detailed timeframe for project phases (e.g., Research & Discovery: 2 weeks, Prototyping: 3 weeks, MVP Development: 8 weeks, Testing & QA: 3 weeks, Deployment & Launch: 1 week, Post-launch Monitoring: ongoing). Be specific.

2.  **Project Phases (Text-based Flowchart)**: Create a text-based flowchart outlining the sequence and key activities within major project phases: Research, Design, Development, Testing, and Deployment. This represents the overall project workflow. Use indentation and simple connectors like '->' or '-->'.
    Example:
    Research & Discovery
      -> Market Analysis
      -> User Persona Definition
      -> Competitor Analysis
    Design
      --> Wireframing & Prototyping
      --> UI/UX Design (High-fidelity mockups)
      --> Design System Setup
    Development
      ---> Backend Setup (API, Database)
      ---> Frontend Implementation (Component library, State management)
      ---> AI Model Integration (API calls, Data processing)
    Testing
      ----> Unit Tests (Frontend & Backend)
      ----> Integration Tests (API endpoints, Component interactions)
      ----> User Acceptance Testing (UAT) (Key user flows)
    Deployment
      -----> Staging Environment Setup & Testing
      -----> Production Release (Phased rollout if applicable)
      -----> Post-launch Monitoring & Hotfixes

3.  **Cost Estimation (Text-based Flowchart)**: Create a separate text-based flowchart estimating potential costs. Categorize expenses such as AI API Usage (per provider if applicable, estimate token/usage costs), Cloud Services (hosting, database, serverless functions), Development Tools/Software Subscriptions, Team Salaries/Contractor Fees (if relevant to project scale, consider duration from timeframe), and Marketing/Launch budget.
    Example:
    Estimated Costs
      -> AI API Usage
        - OpenAI GPT-4 (Refinement): $X/month (based on estimated refinement cycles & token usage)
        - Google Gemini (Summarization/Planning): $Y/month
      -> Cloud Services
        - Hosting (e.g., Next.js on Vercel/Firebase): $A/month
        - Database (e.g., Firestore): $B/month
      -> Development Resources (Example: for a 3-month MVP)
        - 1 AI Engineer (Part-time for model flow): $C_total
        - 1 Full-stack Developer (Full-time): $D_total
      -> Other
        - Domain & SSL: $F/year
        - Contingency (15-20% of total): $E

4.  **Resource Allocation (Text-based Flowchart)**: Create a separate text-based flowchart detailing how key team roles (e.g., Project Manager, AI Engineer, Frontend Developer, Backend Developer, UX/UI Designer, QA Tester, DevOps Engineer) are allocated across the project phases identified in section 2. Indicate primary responsibilities or key involvement per phase for each role.
    Example:
    Resource Allocation
      -> Project Manager
        - Research: Oversight, Requirement Gathering
        - Design: Stakeholder Communication, Feedback Collection
        - Development: Sprint Planning, Progress Monitoring, Blocker Removal
        - Testing: UAT Coordination, Bug Triage
        - Deployment: Go-live Coordination, Release Notes
      -> AI Engineer
        - Research: AI Feasibility, Model Selection, Prompt Engineering
        - Development: AI Flow Implementation, Integration with Backend
        - Testing: Model Performance Testing, Accuracy Checks
      -> UX/UI Designer
        - Research: User Interviews, Persona Refinement
        - Design: Wireframes, Mockups, Prototypes, Style Guides
        - Development: Design Handoff, UI Review
        - Testing: Usability Testing Support
      -> Full-stack Developer (Frontend & Backend)
        - Design: Technical Feasibility input on Designs
        - Development: UI components, State management, API development, Database schema
        - Testing: Unit tests, Integration tests
        - Deployment: Build pipelines, Environment setup
      -> QA Tester
        - Development: Test Case Creation (during sprints)
        - Testing: Test Execution (Functional, Regression, Performance), Bug Reporting
        - Deployment: Post-deployment Sanity Checks

5.  **Feasibility Assessment**: Provide a brief evaluation of the project's technical feasibility (can it be built with current tech, any major technical hurdles?), business viability (is there a market need, potential for monetization/adoption, competitive landscape?), and operational viability (can it be maintained, scaled, what are ongoing operational needs?).
6.  **Refined Actionable Strategy**: Summarize the key strategic actions to take based on this plan. This should be a concise guide for moving forward or for refining the initial concept if major roadblocks were identified. This could include next steps for a pilot, MVP, or further research.

Ensure each section is clearly delineated and each flowchart is distinct.
`,
});

const generateImplementationPlanFlow = ai.defineFlow(
  {
    name: 'generateImplementationPlanFlow',
    inputSchema: GenerateImplementationPlanInputSchema,
    outputSchema: GenerateImplementationPlanOutputSchema,
  },
  async (input) => {
    const {output} = await implementationPlanPrompt(input);
    if (!output) {
      throw new Error("Failed to generate implementation plan. The AI model did not return structured output.");
    }
    return output;
  }
);

