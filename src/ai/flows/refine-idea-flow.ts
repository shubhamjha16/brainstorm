
'use server';
/**
 * @fileOverview Defines a Genkit flow for an AI agent to refine an idea based on its persona.
 *
 * - refineIdea - A function that takes the current idea and agent details, and returns a refined idea.
 * - RefineIdeaInput - The input type for the refineIdea function.
 * - RefineIdeaOutput - The return type for the refineIdea function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineIdeaInputSchema = z.object({
  currentIdea: z.string().describe('The current idea to be refined.'),
  agentName: z.string().describe('The name of the AI agent.'),
  agentRole: z.string().describe('The specific role or persona of the AI agent (e.g., The Pragmatist, The Ethicist).'),
});
export type RefineIdeaInput = z.infer<typeof RefineIdeaInputSchema>;

const RefineIdeaOutputSchema = z.object({
  refinedIdea: z.string().describe('The refined idea, incorporating the agent\'s perspective.'),
});
export type RefineIdeaOutput = z.infer<typeof RefineIdeaOutputSchema>;

export async function refineIdea(input: RefineIdeaInput): Promise<RefineIdeaOutput> {
  return refineIdeaFlow(input);
}

const refineIdeaPrompt = ai.definePrompt({
  name: 'refineIdeaPrompt',
  input: {schema: RefineIdeaInputSchema},
  output: {schema: RefineIdeaOutputSchema},
  prompt: `You are {{agentName}}, an AI agent known as "{{agentRole}}".
Your task is to collaboratively refine an idea.
The current state of the idea is:
"{{{currentIdea}}}"

Based on your persona as {{agentRole}}, build upon, challenge, or add a new dimension to this idea. Be specific and creative.
Your response should be ONLY the refined version of the idea, stated directly. Do not narrate your thought process, just provide the refined idea text.
For example, if the idea is "a platform for local artists", and you are "The Ethicist", you might refine it to "a platform for local artists that ensures fair compensation and ethical sourcing of materials."
If you are "The Visionary", you might refine it to "a globally interconnected metaverse where local artists can showcase and sell tokenized versions of their physical and digital art, transcending geographical boundaries."

Refined Idea:`,
});

const refineIdeaFlow = ai.defineFlow(
  {
    name: 'refineIdeaFlow',
    inputSchema: RefineIdeaInputSchema,
    outputSchema: RefineIdeaOutputSchema,
  },
  async input => {
    const {output} = await refineIdeaPrompt(input);
    if (!output || !output.refinedIdea) {
        console.warn("Refine idea flow did not receive structured output or refinedIdea is empty. Using a fallback.");
        // Provide a more descriptive fallback if the AI fails to generate a specific refinement
        let fallbackRefinement = `As ${input.agentName} (${input.agentRole}), I've analyzed the idea: "${input.currentIdea}". `;
        fallbackRefinement += `Considering my role, I suggest we explore avenues related to ${input.agentRole.toLowerCase().replace('the ', '')} more deeply. This could involve [mention a generic example related to the role, e.g., 'ethical considerations' for The Ethicist or 'innovative technological integrations' for The Visionary].`;
        return { refinedIdea: fallbackRefinement };
    }
    return output;
  }
);
