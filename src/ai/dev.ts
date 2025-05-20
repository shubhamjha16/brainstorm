
import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-voice-input.ts';
import '@/ai/flows/summarize-discussion.ts';
import '@/ai/flows/refine-idea-flow.ts';
import '@/ai/flows/generate-implementation-plan.ts'; // Add the new flow
