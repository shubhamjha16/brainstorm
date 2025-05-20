
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
  resourceAllocation: z.string().describe('Details on workflow and resource allocation, defining team roles (e.g., AI Engineers, Frontend Developers, Backend Developers, QA, DevOps) and specifying their responsibilities across the timeline.'),
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

Please provide the following sections for the implementation plan:

1.  **Timeframe**: A detailed timeframe for project phases (e.g., Research & Discovery: 2 weeks, Prototyping: 3 weeks, MVP Development: 8 weeks, Testing & QA: 3 weeks, Deployment & Launch: 1 week, Post-launch Monitoring: ongoing). Be specific.
2.  **Project Phases (Text-based Flowchart)**: Create a text-based flowchart outlining the sequence and key activities within major project phases: Research, Design, Development, Testing, and Deployment. Use indentation and simple connectors like '->' or '-->'.
    Example:
    Research
      -> Market Analysis
      -> User Persona Definition
    Design
      --> Wireframing
      --> UI/UX Design
      --> Prototyping
    Development
      ---> Backend Setup
      ---> Frontend Implementation
      ---> AI Model Integration
    Testing
      ----> Unit Tests
      ----> Integration Tests
      ----> User Acceptance Testing (UAT)
    Deployment
      -----> Staging Environment
      -----> Production Release

3.  **Cost Estimation (Text-based Flowchart)**: Create a text-based flowchart estimating potential costs. Categorize expenses such as AI API Usage (per provider if applicable), Cloud Services (hosting, database), Development Tools/Software, Team Salaries/Contractors (if relevant to project scale), and Marketing/Launch.
    Example:
    Estimated Costs
      -> AI API Usage
        - OpenAI GPT-4: $X/month (based on estimated tokens)
        - Gemini API: $Y/month
      -> Cloud Services
        - Hosting (Next.js): $A/month
        - Database: $B/month
      -> Development Resources (Example: 3 month project)
        - 1 AI Engineer: $C
        - 1 Full-stack Developer: $D
      -> Other
        - Contingency (15%): $E

4.  **Workflow and Resource Allocation**: Define key team roles needed (e.g., Project Manager, AI Engineer, Frontend Developer, Backend Developer, UX/UI Designer, QA Tester, DevOps Engineer). Briefly describe their main responsibilities and how they fit into the project timeline/phases.
5.  **Feasibility Assessment**: Provide a brief evaluation of the project's technical feasibility (can it be built with current tech?), business viability (is there a market, potential for monetization?), and operational viability (can it be maintained and scaled?).
6.  **Refined Actionable Strategy**: Summarize the key strategic actions to take based on this plan. This should be a concise guide for moving forward or for refining the initial concept if major roadblocks were identified.

Ensure each section is clearly delineated.
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
