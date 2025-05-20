// SummarizeAIDiscussion story
'use server';

/**
 * @fileOverview Summarizes the final evolved idea after an AI discussion,
 * highlighting key contributions from each AI agent.
 *
 * - summarizeDiscussion - A function to summarize the discussion.
 * - SummarizeDiscussionInput - The input type for the summarizeDiscussion function.
 * - SummarizeDiscussionOutput - The return type for the summarizeDiscussion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDiscussionInputSchema = z.object({
  discussionText: z
    .string()
    .describe('The complete text of the AI discussion to be summarized.'),
});
export type SummarizeDiscussionInput = z.infer<typeof SummarizeDiscussionInputSchema>;

const SummarizeDiscussionOutputSchema = z.object({
  summary: z.string().describe('A summary of the final evolved idea.'),
  keyContributions: z
    .string()
    .describe('Key contributions from each AI agent in the discussion.'),
});
export type SummarizeDiscussionOutput = z.infer<typeof SummarizeDiscussionOutputSchema>;

export async function summarizeDiscussion(input: SummarizeDiscussionInput): Promise<SummarizeDiscussionOutput> {
  return summarizeDiscussionFlow(input);
}

const summarizeDiscussionPrompt = ai.definePrompt({
  name: 'summarizeDiscussionPrompt',
  input: {schema: SummarizeDiscussionInputSchema},
  output: {schema: SummarizeDiscussionOutputSchema},
  prompt: `Summarize the following AI discussion, highlighting the final evolved idea and the key contributions from each AI agent:

Discussion Text:
{{{discussionText}}}`, // Discussion text accessible through Handlebars.
});

const summarizeDiscussionFlow = ai.defineFlow(
  {
    name: 'summarizeDiscussionFlow',
    inputSchema: SummarizeDiscussionInputSchema,
    outputSchema: SummarizeDiscussionOutputSchema,
  },
  async input => {
    const {output} = await summarizeDiscussionPrompt(input);
    return output!;
  }
);
