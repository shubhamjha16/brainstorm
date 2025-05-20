"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Agent, ChatMessageData, SummaryData } from "@/types";
import { Header } from "@/components/echo/Header";
import { InitialIdeaForm } from "@/components/echo/InitialIdeaForm";
import { ChatInterface } from "@/components/echo/ChatInterface";
import { Controls } from "@/components/echo/Controls";
import { OutputActions } from "@/components/echo/OutputActions";
import { summarizeDiscussion } from "@/ai/flows/summarize-discussion";
import { useToast } from "@/hooks/use-toast";
import { Bot, Brain, Users, BrainCircuit, MessageSquareHeart, Scale } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const AI_AGENTS: Agent[] = [
  { id: "gpt4", name: "GPT-4", provider: "OpenAI", role: "The Pragmatist", avatarColor: "bg-green-500", icon: Bot },
  { id: "claude", name: "Claude", provider: "Anthropic", role: "The Ethicist", avatarColor: "bg-yellow-500", icon: Scale },
  { id: "gemini", name: "Gemini", provider: "Google", role: "The Visionary", avatarColor: "bg-blue-500", icon: BrainCircuit },
  { id: "mistral", name: "Mistral", provider: "Mistral AI", role: "The Challenger", avatarColor: "bg-red-500", icon: MessageSquareHeart },
  { id: "cohere", name: "Cohere", provider: "Cohere", role: "The Synthesizer", avatarColor: "bg-purple-500", icon: Users },
  { id: "jurassic", name: "Jurassic", provider: "AI21 Labs", role: "The Historian", avatarColor: "bg-orange-500", icon: Brain },
];

const SIMULATION_DELAY_MS = 3000; // Delay between AI agent messages

export default function EvolvingEchoPage() {
  const [initialIdea, setInitialIdea] = useState<string | null>(null);
  const [currentIdea, setCurrentIdea] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationHasStarted, setSimulationHasStarted] = useState<boolean>(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // General loading for AI calls
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  
  const currentAgentIndexRef = useRef<number>(0);
  const simulationLoopRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const addMessage = useCallback((text: string, sender: 'User' | Agent['name'], agent?: Agent, isVoiceInput: boolean = false) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: Date.now().toString() + Math.random().toString(),
        sender,
        text,
        timestamp: new Date(),
        isUser: sender === 'User',
        agent,
        isVoiceInput,
      },
    ]);
  }, []);

  const handleStartSimulation = (idea: string) => {
    setInitialIdea(idea);
    setCurrentIdea(idea);
    addMessage(idea, "User");
    setIsSimulating(true);
    setSimulationHasStarted(true);
    setSummary(null);
    currentAgentIndexRef.current = 0;
  };

  const handleStopSimulation = useCallback(async () => {
    setIsSimulating(false);
    if (simulationLoopRef.current) {
      clearTimeout(simulationLoopRef.current);
    }
    setIsLoadingSummary(true);
    try {
      const discussionText = messages.map(msg => `${msg.sender}: ${msg.text}`).join("\n\n");
      const result = await summarizeDiscussion({ discussionText });
      setSummary(result);
      toast({ title: "Simulation Stopped", description: "Summary has been generated." });
    } catch (error) {
      console.error("Summarization error:", error);
      toast({ title: "Summarization Error", description: "Could not generate summary.", variant: "destructive" });
    } finally {
      setIsLoadingSummary(false);
    }
  }, [messages, toast, addMessage]);


  const processAgentTurn = useCallback(async () => {
    if (!isSimulating) return;

    const agent = AI_AGENTS[currentAgentIndexRef.current];
    
    // Mock AI "thinking" and response
    // In a real scenario, this would call an AI model
    const refinedText = `As ${agent.name} (${agent.role}), I've considered the idea: "${currentIdea}". My refinement is to focus on integrating ${agent.role.toLowerCase().replace('the ', '')} aspects more deeply. For example, we could explore... [${agent.name} adds novel perspective based on its role].`;
    
    addMessage(refinedText, agent.name, agent);
    setCurrentIdea(refinedText); // Idea evolves with each agent's input

    currentAgentIndexRef.current = (currentAgentIndexRef.current + 1) % AI_AGENTS.length;
    
    // Continue the loop
    simulationLoopRef.current = setTimeout(processAgentTurn, SIMULATION_DELAY_MS);

  }, [isSimulating, currentIdea, addMessage]);


  useEffect(() => {
    if (isSimulating && simulationHasStarted && initialIdea) {
       // Start the first agent turn if simulation is on and hasn't been paused by voice input processing.
      if(simulationLoopRef.current) clearTimeout(simulationLoopRef.current); // Clear previous timeout if any
      simulationLoopRef.current = setTimeout(processAgentTurn, SIMULATION_DELAY_MS / 2); // Start quicker for first turn
    } else if (!isSimulating && simulationLoopRef.current) {
      clearTimeout(simulationLoopRef.current);
    }
    return () => {
      if (simulationLoopRef.current) {
        clearTimeout(simulationLoopRef.current);
      }
    };
  }, [isSimulating, simulationHasStarted, initialIdea, processAgentTurn]);


  const handleTranscription = (text: string) => {
    if (!isSimulating) return; // Don't process if simulation is stopped

    if (simulationLoopRef.current) {
      clearTimeout(simulationLoopRef.current); // Pause AI simulation
    }
    
    addMessage(`Voice Input: ${text}`, "User", undefined, true);
    setCurrentIdea(text); // User's voice input gets higher influence by becoming the current idea
    
    // Resume AI simulation with the next agent, considering the new user input
    // The currentAgentIndexRef is already set for the next agent
    if (isSimulating) { // Check again if simulation is still active
       simulationLoopRef.current = setTimeout(processAgentTurn, SIMULATION_DELAY_MS / 2); // Quicker resume
    }
  };


  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar side="right" variant="sidebar" collapsible="icon" className="border-l">
            <SidebarHeader className="p-4">
               <h2 className="text-xl font-semibold text-primary">Controls & Output</h2>
            </SidebarHeader>
            <SidebarContent className="p-4 space-y-6">
              {simulationHasStarted && (
                <Controls
                  isSimulating={isSimulating}
                  isLoadingSummary={isLoadingSummary}
                  onStopSimulation={handleStopSimulation}
                  onTranscription={handleTranscription}
                />
              )}
              <OutputActions summary={summary} isLoading={isLoadingSummary && !summary} />
            </SidebarContent>
            <SidebarFooter className="p-4 mt-auto">
              <p className="text-xs text-muted-foreground text-center">Evolving Echo v1.0</p>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex-1 flex flex-col overflow-y-auto">
            <main className="container mx-auto p-4 flex-1 flex flex-col">
              {!simulationHasStarted ? (
                <div className="flex-1 flex items-center justify-center">
                  <InitialIdeaForm onStartSimulation={handleStartSimulation} isLoading={isLoading} />
                </div>
              ) : (
                <ChatInterface messages={messages} />
              )}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
