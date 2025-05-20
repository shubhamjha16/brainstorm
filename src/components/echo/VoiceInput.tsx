
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { transcribeVoiceInput, type TranscribeVoiceInputInput } from "@/ai/flows/transcribe-voice-input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  isSimulating: boolean;
  simulationHasStarted: boolean; // Added prop
  disabled?: boolean; // General disabled prop from parent (e.g., while agent is thinking or summary is loading)
}

export function VoiceInput({ onTranscription, isSimulating, simulationHasStarted, disabled }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({ title: "Error", description: "Voice recording is not supported by your browser.", variant: "destructive" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // Convert Blob to Data URI
        const reader = new FileReader();
        reader.onloadend = async () => {
          const audioDataUri = reader.result as string;
          if (audioDataUri) {
            try {
              setIsTranscribing(true);
              const input: TranscribeVoiceInputInput = { audioDataUri };
              const result = await transcribeVoiceInput(input);
              onTranscription(result.transcription);
              toast({ title: "Voice Input Added", description: "Your input has been added to the discussion." });
            } catch (error) {
              console.error("Transcription error:", error);
              toast({ title: "Transcription Error", description: "Could not transcribe audio. Please try again.", variant: "destructive" });
            } finally {
              setIsTranscribing(false);
            }
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({ title: "Microphone Error", description: "Could not access microphone. Please check permissions.", variant: "destructive" });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Cleanup: stop recording and microphone if component unmounts or simulation stops
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      // Ensure microphone stream is released
      if (mediaRecorderRef.current?.stream) {
         mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  useEffect(() => {
    if (!isSimulating && isRecording) {
      handleStopRecording();
    }
  }, [isSimulating, isRecording]);

  // Button should be disabled if:
  // 1. Parent explicitly disables it (e.g. agent thinking, summary loading)
  // 2. Simulation is not active (unless currently recording, to allow stopping)
  // 3. Currently transcribing audio
  const effectiveDisabled = disabled || (!isSimulating && !isRecording) || isTranscribing;

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        variant={isRecording ? "destructive" : "outline"}
        size="lg"
        className={cn("w-full transition-all duration-300", isRecording && "ring-2 ring-destructive ring-offset-2")}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        disabled={effectiveDisabled}
      >
        {isTranscribing ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="mr-2 h-5 w-5" />
        ) : (
          <Mic className="mr-2 h-5 w-5" />
        )}
        {isTranscribing ? "Transcribing..." : isRecording ? "Stop Recording" : "Add Voice Input"}
      </Button>
      {isRecording && <p className="text-sm text-muted-foreground animate-pulse">Recording in progress...</p>}
      {!isSimulating && simulationHasStarted && !isRecording && (
         <p className="text-xs text-muted-foreground">Simulation paused. Resume by stopping or through other controls.</p>
      )}
    </div>
  );
}
