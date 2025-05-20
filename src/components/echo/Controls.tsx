
"use client";

import { Button } from "@/components/ui/button";
import { VoiceInput } from "./VoiceInput";
import { Square, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ControlsProps {
  isSimulating: boolean;
  simulationHasStarted: boolean; // Added prop
  isLoadingSummary: boolean;
  isLoadingAgentResponse: boolean;
  onStopSimulation: () => void;
  onTranscription: (text: string) => void;
}

export function Controls({ 
  isSimulating, 
  simulationHasStarted,
  isLoadingSummary, 
  isLoadingAgentResponse, 
  onStopSimulation, 
  onTranscription 
}: ControlsProps) {
  const stopButtonDisabled = !isSimulating || isLoadingSummary || isLoadingAgentResponse;
  const voiceInputDisabled = isLoadingSummary || isLoadingAgentResponse;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <VoiceInput 
          onTranscription={onTranscription} 
          isSimulating={isSimulating}
          simulationHasStarted={simulationHasStarted} 
          disabled={voiceInputDisabled} 
        />
        <Button
          onClick={onStopSimulation}
          variant="destructive"
          className="w-full"
          disabled={stopButtonDisabled}
          aria-label="Stop simulation"
        >
          {isLoadingSummary ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Square className="mr-2 h-4 w-4" />
          )}
          {isLoadingSummary ? "Generating Summary..." : "Stop Evolving & Summarize"}
        </Button>
        {isLoadingAgentResponse && (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>AI is thinking...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
