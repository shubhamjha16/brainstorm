
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
  isPaused: boolean; // Added prop
  simulationHasStarted: boolean;
  disabled?: boolean;
}

export function VoiceInput({ onTranscription, isSimulating, isPaused, simulationHasStarted, disabled }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    if (!simulationHasStarted) {
       toast({ title: "Not Active", description: "Start a simulation before using voice input.", variant: "default"});
      return;
    }
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
        stream.getTracks().forEach(track => track.stop());
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

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (mediaRecorderRef.current?.stream) {
         mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  useEffect(() => {
    // If simulation stops or is paused (and not currently recording, to allow stopping), stop recording.
    if ((!isSimulating && !isPaused && isRecording) || (isPaused && isRecording && !disabled)) { // disabled check to see if parent wants to allow stopping
        // Let's simplify: if not simulating (and not paused for resume), or if explicitly disabled by parent while recording, stop.
    }
     if (isRecording && ((!isSimulating && !isPaused) || disabled)) {
      handleStopRecording();
    }

  }, [isSimulating, isPaused, isRecording, disabled]);

  const effectiveDisabled = disabled || 
                           isTranscribing || 
                           (!simulationHasStarted && !isRecording) || // Can't start recording if sim hasn't started
                           (!isSimulating && !isPaused && !isRecording); // If stopped & not recording, disable. If paused, enable.

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        variant={isRecording ? "destructive" : "outline"}
        size="lg"
        className={cn("w-full transition-all duration-300", isRecording && "ring-2 ring-destructive ring-offset-2")}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        disabled={effectiveDisabled && !isRecording } // Allow stopping recording even if other conditions make starting disabled
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
      {!isSimulating && simulationHasStarted && !isRecording && !isPaused && (
         <p className="text-xs text-muted-foreground text-center">Simulation stopped. Start a new simulation or resume if paused.</p>
      )}
       {isPaused && !isRecording && (
         <p className="text-xs text-muted-foreground text-center">Simulation paused. Press Resume or use Voice Input.</p>
      )}
    </div>
  );
}

    