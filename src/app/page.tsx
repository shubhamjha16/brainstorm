
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Agent, ChatMessageData, SummaryData } from "@/types";
import { Header } from "@/components/echo/Header";
import { InitialIdeaForm } from "@/components/echo/InitialIdeaForm";
import { ChatInterface } from "@/components/echo/ChatInterface";
import { Controls } from "@/components/echo/Controls";
import { OutputActions } from "@/components/echo/OutputActions";
import { summarizeDiscussion } from "@/ai/flows/summarize-discussion";
import { refineIdea } from "@/ai/flows/refine-idea-flow"; // Import the new flow
import { useToast } from "@/hooks/use-toast";
import { Bot, Brain, Users, BrainCircuit, MessageSquareHeart, Scale, Loader2 } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger } from "@/components/ui/sidebar";

const AI_AGENTS: Agent[] = [
  { id: "gpt4", name: "GPT-4", provider: "OpenAI", role: "The Pragmatist", avatarColor: "bg-green-500", icon: Bot },
  { id: "claude", name: "Claude", provider: "Anthropic", role: "The Ethicist", avatarColor: "bg-yellow-500", icon: Scale },
  { id: "gemini", name: "Gemini", provider: "Google", role: "The Visionary", avatarColor: "bg-blue-500", icon: BrainCircuit },
  { id: "mistral", name: "Mistral", provider: "Mistral AI", role: "The Challenger", avatarColor: "bg-red-500", icon: MessageSquareHeart },
  { id: "cohere", name: "Cohere", provider: "Cohere", role: "The Synthesizer", avatarColor: "bg-purple-500", icon: Users },
  { id: "jurassic", name: "Jurassic", provider: "AI21 Labs", role: "The Historian", avatarColor: "bg-orange-500", icon: Brain },
];

const SIMULATION_DELAY_MS = 1500; // Delay between AI agent messages, reduced for quicker flow with real AI calls

export default function EvolvingEchoPage() {
  const [initialIdea, setInitialIdea] = useState<string | null>(null);
  const [currentIdea, setCurrentIdea] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationHasStarted, setSimulationHasStarted] = useState<boolean>(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isStartingSimulation, setIsStartingSimulation] = useState<boolean>(false); 
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isLoadingAgentResponse, setIsLoadingAgentResponse] = useState<boolean>(false);
  
  const currentAgentIndexRef = useRef<number>(0);
  const simulationLoopRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const addMessage = useCallback((text: string, sender: 'User' | Agent['name'] | 'System', agent?: Agent, isVoiceInput: boolean = false, isLoading: boolean = false) => {
    setMessages((prevMessages) => {
      // If the last message was a loading message from the same agent, replace it
      if (isLoading && prevMessages.length > 0) {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage.isLoading && lastMessage.sender === sender) {
          const updatedMessages = [...prevMessages.slice(0, -1)];
          return [
            ...updatedMessages,
            {
              id: Date.now().toString() + Math.random().toString(),
              sender,
              text,
              timestamp: new Date(),
              isUser: sender === 'User',
              agent,
              isVoiceInput,
              isLoading: false, // The actual message is not a loading message
            },
          ];
        }
      }
      // If it's a new loading message or a regular message
      return [
        ...prevMessages,
        {
          id: Date.now().toString() + Math.random().toString(),
          sender,
          text,
          timestamp: new Date(),
          isUser: sender === 'User',
          agent,
          isVoiceInput,
          isLoading,
        },
      ];
    });
  }, []);

  const handleStartSimulation = (idea: string) => {
    setIsStartingSimulation(true); // Keep this for initial idea submission if needed for other UI elements
    setInitialIdea(idea);
    setCurrentIdea(idea);
    setMessages([]); // Clear previous messages
    addMessage(idea, "User");
    setIsSimulating(true);
    setSimulationHasStarted(true);
    setSummary(null);
    currentAgentIndexRef.current = 0;
    setIsStartingSimulation(false); // Reset after setup
  };

  const handleStopSimulation = useCallback(async () => {
    setIsSimulating(false);
    if (simulationLoopRef.current) {
      clearTimeout(simulationLoopRef.current);
    }
    if (messages.length === 0 || !initialIdea) {
      toast({ title: "Nothing to Summarize", description: "Start a simulation first.", variant: "default" });
      return;
    }
    setIsLoadingSummary(true);
    try {
      const discussionText = messages.filter(msg => !msg.isLoading).map(msg => `${msg.sender}: ${msg.text}`).join("\n\n");
      const result = await summarizeDiscussion({ discussionText });
      setSummary(result);
      toast({ title: "Simulation Stopped", description: "Summary has been generated." });
    } catch (error) {
      console.error("Summarization error:", error);
      toast({ title: "Summarization Error", description: "Could not generate summary.", variant: "destructive" });
      setSummary({summary: "Error generating summary.", keyContributions: "Could not process contributions."});
    } finally {
      setIsLoadingSummary(false);
    }
  }, [messages, toast, initialIdea]);


  const processAgentTurn = useCallback(async () => {
    if (!isSimulating || isLoadingAgentResponse) return;

    const agent = AI_AGENTS[currentAgentIndexRef.current];
    setIsLoadingAgentResponse(true);
    addMessage(`${agent.name} is thinking...`, agent.name, agent, false, true); // Add loading message

    try {
      const { refinedIdea } = await refineIdea({ currentIdea, agentName: agent.name, agentRole: agent.role });
      addMessage(refinedIdea, agent.name, agent); // Replace loading message with actual response
      setCurrentIdea(refinedIdea);
    } catch (error) {
      console.error(`Error with ${agent.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addMessage(`Sorry, I encountered an issue: ${errorMessage}`, agent.name, agent);
      toast({ title: `Error with ${agent.name}`, description: `Could not get refinement: ${errorMessage}`, variant: "destructive" });
      // Optionally, keep currentIdea as is, or revert to a previous state
    } finally {
      setIsLoadingAgentResponse(false);
    }

    currentAgentIndexRef.current = (currentAgentIndexRef.current + 1) % AI_AGENTS.length;
    
    if (isSimulating) { // Check isSimulating again in case it was stopped during the async call
      simulationLoopRef.current = setTimeout(processAgentTurn, SIMULATION_DELAY_MS);
    }

  }, [isSimulating, currentIdea, addMessage, toast, isLoadingAgentResponse]);


  useEffect(() => {
    if (isSimulating && simulationHasStarted && initialIdea && !isLoadingAgentResponse) {
      if(simulationLoopRef.current) clearTimeout(simulationLoopRef.current); 
      // Start the first agent turn or continue simulation
      simulationLoopRef.current = setTimeout(processAgentTurn, SIMULATION_DELAY_MS / 2); 
    } else if (!isSimulating && simulationLoopRef.current) {
      clearTimeout(simulationLoopRef.current);
    }
    return () => {
      if (simulationLoopRef.current) {
        clearTimeout(simulationLoopRef.current);
      }
    };
  }, [isSimulating, simulationHasStarted, initialIdea, processAgentTurn, isLoadingAgentResponse]);


  const handleTranscription = (text: string) => {
    if (!isSimulating || isLoadingAgentResponse) return; 

    if (simulationLoopRef.current) {
      clearTimeout(simulationLoopRef.current); 
    }
    
    addMessage(`Voice Input: ${text}`, "User", undefined, true);
    setCurrentIdea(text); 
    
    if (isSimulating) { 
       simulationLoopRef.current = setTimeout(processAgentTurn, SIMULATION_DELAY_MS / 2); 
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
                  isLoadingAgentResponse={isLoadingAgentResponse}
                  onStopSimulation={handleStopSimulation}
                  onTranscription={handleTranscription}
                />
              )}
              <OutputActions summary={summary} isLoading={isLoadingSummary && !summary} />
            </SidebarContent>
            <SidebarFooter className="p-4 mt-auto">
              <p className="text-xs text-muted-foreground text-center">Evolving Echo v1.1</p>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex-1 flex flex-col overflow-y-auto">
            <main className="container mx-auto p-4 flex-1 flex flex-col">
              {!simulationHasStarted ? (
                <div className="flex-1 flex items-center justify-center">
                  <InitialIdeaForm onStartSimulation={handleStartSimulation} isLoading={isStartingSimulation} />
                </div>
              ) : (
                <ChatInterface messages={messages} agents={AI_AGENTS} />
              )}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
