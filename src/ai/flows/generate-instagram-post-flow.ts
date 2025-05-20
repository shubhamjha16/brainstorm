
'use server';
/**
 * @fileOverview Defines a Genkit flow for generating Instagram post content (image and caption).
 *
 * - generateInstagramPost - A function that takes a theme and returns an image URI, caption, and keywords.
 * - GenerateInstagramPostInput - The input type.
 * - GenerateInstagramPostOutput - The return type (matches MarketingPostData).
 */

import {ai} from '@/ai/genkit';
import type { MarketingPostData } from '@/types';
import {z} from 'genkit';

const GenerateInstagramPostInputSchema = z.object({
  theme: z.string().describe('The core theme or summarized idea for the Instagram post.'),
});
export type GenerateInstagramPostInput = z.infer<typeof GenerateInstagramPostInputSchema>;

const GenerateInstagramPostOutputSchema = z.object({
  imageUri: z.string().describe("Data URI of the generated image. Expected format: 'data:image/png;base64,<encoded_data>'."),
  caption: z.string().describe('Generated Instagram caption text with hashtags.'),
  imageKeywords: z.string().describe("One or two keywords used for generating the image or as a hint. E.g., 'tech startup'"),
});
export type GenerateInstagramPostOutput = z.infer<typeof GenerateInstagramPostOutputSchema>;

export async function generateInstagramPost(input: GenerateInstagramPostInput): Promise<MarketingPostData> {
  return generateInstagramPostFlow(input);
}

const generateInstagramPostFlow = ai.defineFlow(
  {
    name: 'generateInstagramPostFlow',
    inputSchema: GenerateInstagramPostInputSchema,
    outputSchema: GenerateInstagramPostOutputSchema,
  },
  async (input) => {
    // Step 1: Generate 1-2 keywords from the theme for image generation focus
    const keywordPrompt = ai.definePrompt({
        name: 'instagramImageKeywordPrompt',
        input: { schema: z.object({ theme: z.string() }) },
        output: { schema: z.object({ keywords: z.string().max(30).describe("Extract 1 or 2 main keywords from the theme, space-separated. E.g., 'tech startup' or 'eco friendly'. Max 30 chars.") }) },
        prompt: `From the theme "{{theme}}", extract one or two primary keywords. These keywords will guide AI image generation. Respond with only the keywords, space-separated. For example, if theme is "a new app for sustainable travel", keywords could be "sustainable travel" or "eco app".`,
    });
    const keywordResponse = await keywordPrompt({ theme: input.theme });
    // Fallback for keywords if generation is not ideal
    const imageKeywords = keywordResponse.output?.keywords || input.theme.split(' ').slice(0,2).join(' ');
    if (!imageKeywords || imageKeywords.trim() === '') {
        throw new Error('Keyword generation for image failed or returned empty.');
    }


    // Step 2: Generate Image using the theme, focused by the keywords
    const imageGenResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // MUST use this model for images
      prompt: `Generate a visually appealing and high-quality Instagram image suitable for a post about the theme: "${input.theme}". The key focus for the image should be: "${imageKeywords}". Ensure the image is engaging and modern.`,
      config: {
        responseModalities: ['IMAGE', 'TEXT'], // TEXT is required, even if primarily for image
      },
    });

    const imageUri = imageGenResponse.media?.url;
    // The text part from imageGenResponse can provide context for the caption
    const imageContextText = imageGenResponse.text || `Visually stunning image related to ${input.theme} focusing on ${imageKeywords}.`;

    if (!imageUri) {
      throw new Error('Image generation failed or did not return an image URI.');
    }

    // Step 3: Generate Caption using the theme, keywords, and image context
    const captionPrompt = ai.definePrompt({
        name: 'instagramCaptionGenPrompt',
        input: { schema: z.object({ theme: z.string(), imageContext: z.string(), keywords: z.string() }) },
        output: { schema: z.object({ caption: z.string() }) },
        prompt: `You are an expert Instagram marketer.
        Craft a short, engaging, and upbeat Instagram caption for a post.
        Theme: "{{theme}}"
        Key visual elements or focus of the image: "{{keywords}}"
        Additional context from image generation: "{{imageContext}}"
        The caption should be concise (2-4 sentences), benefit-driven if applicable, and include 2-3 relevant, popular hashtags. End with a call to action or engaging question if appropriate.`,
    });

    const captionResponse = await captionPrompt({ theme: input.theme, imageContext: imageContextText, keywords: imageKeywords });
    const caption = captionResponse.output?.caption;

    if (!caption) {
        throw new Error('Caption generation failed.');
    }

    return {
      imageUri,
      caption,
      imageKeywords, // Return the keywords used for focusing the image
    };
  }
);
