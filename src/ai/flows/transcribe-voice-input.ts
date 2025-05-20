
'use server';

/**
 * @fileOverview This file defines a Genkit flow for transcribing voice input and influencing the AI discussion.
 *
 * - transcribeVoiceInput - A function that transcribes voice input and returns the text.
 * - TranscribeVoiceInputInput - The input type for the transcribeVoiceInput function.
 * - TranscribeVoiceInputOutput - The return type for the transcribeVoiceInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeVoiceInputInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeVoiceInputInput = z.infer<typeof TranscribeVoiceInputInputSchema>;

const TranscribeVoiceInputOutputSchema = z.object({
  transcription: z
    .string()
    .describe('The transcribed text from the audio data.'),
});
export type TranscribeVoiceInputOutput = z.infer<typeof TranscribeVoiceInputOutputSchema>;

export async function transcribeVoiceInput(
  input: TranscribeVoiceInputInput
): Promise<TranscribeVoiceInputOutput> {
  return transcribeVoiceInputFlow(input);
}

const transcribeVoiceInputPrompt = ai.definePrompt({
  name: 'transcribeVoiceInputPrompt',
  input: {schema: TranscribeVoiceInputInputSchema},
  output: {schema: TranscribeVoiceInputOutputSchema},
  prompt: `You are a highly skilled transcriptionist. Please transcribe the following audio data into text.\n\nAudio: {{media url=audioDataUri}}`,
});

const transcribeVoiceInputFlow = ai.defineFlow(
  {
    name: 'transcribeVoiceInputFlow',
    inputSchema: TranscribeVoiceInputInputSchema,
    outputSchema: TranscribeVoiceInputOutputSchema,
  },
  async input => {
    const {output} = await transcribeVoiceInputPrompt(input);
    return output!;
  }
);

    