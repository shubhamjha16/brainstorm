
import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-voice-input.ts';
import '@/ai/flows/summarize-discussion.ts';
import '@/ai/flows/refine-idea-flow.ts'; // Add the new flow
