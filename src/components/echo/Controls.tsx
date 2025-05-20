
"use client";

import { Button } from "@/components/ui/button";
import { VoiceInput } from "./VoiceInput";
import { Square, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ControlsProps {
  isSimulating: boolean;
  isLoadingSummary: boolean;
  onStopSimulation: () => void;
  onTranscription: (text: string) => void;
}

export function Controls({ isSimulating, isLoadingSummary, onStopSimulation, onTranscription }: ControlsProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <VoiceInput onTranscription={onTranscription} isSimulating={isSimulating} disabled={isLoadingSummary} />
        <Button
          onClick={onStopSimulation}
          variant="destructive"
          className="w-full"
          disabled={!isSimulating || isLoadingSummary}
          aria-label="Stop simulation"
        >
          {isLoadingSummary ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Square className="mr-2 h-4 w-4" />
          )}
          {isLoadingSummary ? "Generating Summary..." : "Stop Evolving & Summarize"}
        </Button>
      </CardContent>
    </Card>
  );
}

    