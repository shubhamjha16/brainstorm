
"use client";

import { Button } from "@/components/ui/button";
import { VoiceInput } from "./VoiceInput";
import { Square, Loader2, Pause, Play, History } from "lucide-react"; // Added Pause, Play, History
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ControlsProps {
  isSimulating: boolean;
  isPaused: boolean; // Added prop
  simulationHasStarted: boolean;
  isLoadingSummary: boolean; // For final summary
  isLoadingSummaryForContinue: boolean; // For interim summary
  isLoadingAgentResponse: boolean;
  onStopSimulation: () => void;
  onPauseResumeSimulation: () => void; // Added prop
  onSummarizeAndContinue: () => void; // Added prop
  onTranscription: (text: string) => void;
  hasMessages: boolean; // To disable summarize buttons if no messages
}

export function Controls({
  isSimulating,
  isPaused,
  simulationHasStarted,
  isLoadingSummary,
  isLoadingSummaryForContinue,
  isLoadingAgentResponse,
  onStopSimulation,
  onPauseResumeSimulation,
  onSummarizeAndContinue,
  onTranscription,
  hasMessages
}: ControlsProps) {
  const anyLoading = isLoadingSummary || isLoadingSummaryForContinue || isLoadingAgentResponse;

  const pauseResumeButtonDisabled = !simulationHasStarted || anyLoading;
  const summarizeAndContinueButtonDisabled = !isSimulating || isPaused || anyLoading || !hasMessages;
  const stopButtonDisabled = !isSimulating || anyLoading || !hasMessages;
  const voiceInputDisabled = anyLoading || (!isSimulating && !isPaused); // Allow voice if paused to unpause

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <VoiceInput
          onTranscription={onTranscription}
          isSimulating={isSimulating}
          isPaused={isPaused}
          simulationHasStarted={simulationHasStarted}
          disabled={voiceInputDisabled}
        />
        <Button
          onClick={onPauseResumeSimulation}
          variant="outline"
          className="w-full"
          disabled={pauseResumeButtonDisabled}
          aria-label={isPaused ? "Resume simulation" : "Pause simulation"}
        >
          {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
          {isPaused ? "Resume Evolution" : "Pause Evolution"}
        </Button>
        <Button
          onClick={onSummarizeAndContinue}
          variant="outline"
          className="w-full"
          disabled={summarizeAndContinueButtonDisabled}
          aria-label="Summarize and continue evolving"
        >
          {isLoadingSummaryForContinue ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <History className="mr-2 h-4 w-4" />
          )}
          {isLoadingSummaryForContinue ? "Summarizing..." : "Summarize & Continue"}
        </Button>
        <Button
          onClick={onStopSimulation}
          variant="destructive"
          className="w-full"
          disabled={stopButtonDisabled}
          aria-label="Stop simulation and summarize"
        >
          {isLoadingSummary ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Square className="mr-2 h-4 w-4" />
          )}
          {isLoadingSummary ? "Generating Final Summary..." : "Stop & Finalize Summary"}
        </Button>

        {(isLoadingAgentResponse || isLoadingSummaryForContinue) && (
          <div className="flex items-center justify-center text-sm text-muted-foreground pt-2">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>{isLoadingAgentResponse ? "AI is thinking..." : "Summarizing..."}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    