
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Agent, ChatMessageData, SummaryData, ImplementationPlanData } from "@/types";
import { Header } from "@/components/echo/Header";
import { InitialIdeaForm } from "@/components/echo/InitialIdeaForm";
import { ChatInterface } from "@/components/echo/ChatInterface";
import { Controls } from "@/components/echo/Controls";
import { OutputActions } from "@/components/echo/OutputActions";
import { ImplementationPlan } from "@/components/echo/ImplementationPlan";
import { summarizeDiscussion } from "@/ai/flows/summarize-discussion";
import { refineIdea } from "@/ai/flows/refine-idea-flow";
import { generateImplementationPlan } from "@/ai/flows/generate-implementation-plan";
import { useToast } from "@/hooks/use-toast";
import { Bot, Brain, Users, BrainCircuit, MessageSquareHeart, Scale, PanelLeftClose, PanelRightOpen } from "lucide-react";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AI_AGENTS: Agent[] = [
  { id: "gpt4", name: "GPT-4", provider: "OpenAI", role: "The Pragmatist", avatarColor: "bg-green-500", icon: Bot },
  { id: "claude", name: "Claude", provider: "Anthropic", role: "The Ethicist", avatarColor: "bg-yellow-500", icon: Scale },
  { id: "gemini", name: "Gemini", provider: "Google", role: "The Visionary", avatarColor: "bg-blue-500", icon: BrainCircuit },
  { id: "mistral", name: "Mistral", provider: "Mistral AI", role: "The Challenger", avatarColor: "bg-red-500", icon: MessageSquareHeart },
  { id: "cohere", name: "Cohere", provider: "Cohere", role: "The Synthesizer", avatarColor: "bg-purple-500", icon: Users },
  { id: "jurassic", name: "Jurassic", provider: "AI21 Labs", role: "The Historian", avatarColor: "bg-orange-500", icon: Brain },
];

const SIMULATION_DELAY_MS = 1500;

function EvolvingEchoPageContent() {
  const [initialIdea, setInitialIdea] = useState<string | null>(null);
  const [currentIdea, setCurrentIdea] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationHasStarted, setSimulationHasStarted] = useState<boolean>(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [implementationPlan, setImplementationPlan] = useState<ImplementationPlanData | null>(null);
  const [isStartingSimulation, setIsStartingSimulation] = useState<boolean>(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false); // For final summary
  const [isLoadingAgentResponse, setIsLoadingAgentResponse] = useState<boolean>(false);
  const [isLoadingImplementationPlan, setIsLoadingImplementationPlan] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("controlsOutput");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLoadingSummaryForContinue, setIsLoadingSummaryForContinue] = useState<boolean>(false); // For interim summary

  const currentAgentIndexRef = useRef<number>(0);
  const simulationLoopRef = useRef<NodeJS.Timeout | null>(null);
  const isNextTurnVoiceSteeredRef = useRef<boolean>(false);

  const { toast } = useToast();
  const { open: sidebarOpen, toggleSidebar, state: sidebarState } = useSidebar();

  const addMessage = useCallback((text: string, sender: 'User' | Agent['name'] | 'System', agent?: Agent, isVoiceInput: boolean = false, isLoading: boolean = false) => {
    setMessages((prevMessages) => {
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
              isLoading: false,
            },
          ];
        }
      }
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
    setIsStartingSimulation(true);
    setInitialIdea(idea);
    setCurrentIdea(idea);
    setMessages([]);
    addMessage(idea, "User");
    setIsSimulating(true);
    setSimulationHasStarted(true);
    setIsPaused(false);
    setSummary(null);
    setImplementationPlan(null);
    currentAgentIndexRef.current = 0;
    isNextTurnVoiceSteeredRef.current = false;
    setIsStartingSimulation(false);
    setActiveTab("controlsOutput");
  };

  const handlePauseResumeSimulation = () => {
    setIsPaused((prevPaused) => !prevPaused);
  };

  const handleSummarizeAndContinue = async () => {
    if (!isSimulating || messages.length === 0 || !initialIdea) {
      toast({ title: "Not Ready", description: "Simulation not active or no messages to summarize.", variant: "default"});
      return;
    }
    setIsLoadingSummaryForContinue(true);
    try {
      const discussionText = messages.filter(msg => !msg.isLoading).map(msg => `${msg.sender}: ${msg.text}`).join("\n\n");
      const result = await summarizeDiscussion({ discussionText });
      setSummary(result); // Update the main summary state
      toast({ title: "Interim Summary Generated", description: "The discussion has been summarized. Evolution continues." });
    } catch (error) {
      console.error("Interim summarization error:", error);
      toast({ title: "Summarization Error", description: "Could not generate interim summary.", variant: "destructive" });
      setSummary({summary: "Error generating interim summary.", keyContributions: "Could not process contributions."});
    } finally {
      setIsLoadingSummaryForContinue(false);
    }
  };

  const handleStopSimulation = useCallback(async () => {
    setIsSimulating(false);
    setIsPaused(false); // Ensure simulation is not paused when stopped
    if (simulationLoopRef.current) {
      clearTimeout(simulationLoopRef.current);
    }
    if (messages.length === 0 || !initialIdea) {
      toast({ title: "Nothing to Summarize", description: "Start a simulation first.", variant: "default" });
      return;
    }
    setIsLoadingSummary(true);
    setImplementationPlan(null);
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
    if (!isSimulating || isLoadingAgentResponse || isPaused || isLoadingSummary || isLoadingSummaryForContinue) return;

    const agent = AI_AGENTS[currentAgentIndexRef.current];
    setIsLoadingAgentResponse(true);
    addMessage(`${agent.name} is thinking...`, agent.name, agent, false, true);

    const isUserDirected = isNextTurnVoiceSteeredRef.current;
    if (isUserDirected) {
      isNextTurnVoiceSteeredRef.current = false; // Reset for subsequent turns
    }

    try {
      const { refinedIdea } = await refineIdea({ currentIdea, agentName: agent.name, agentRole: agent.role, isUserDirected });
      addMessage(refinedIdea, agent.name, agent);
      setCurrentIdea(refinedIdea);
    } catch (error) {
      console.error(`Error with ${agent.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addMessage(`Sorry, I encountered an issue: ${errorMessage}`, agent.name, agent);
      toast({ title: `Error with ${agent.name}`, description: `Could not get refinement: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoadingAgentResponse(false);
    }

    currentAgentIndexRef.current = (currentAgentIndexRef.current + 1) % AI_AGENTS.length;

  }, [isSimulating, currentIdea, addMessage, toast, isLoadingAgentResponse, isPaused, isLoadingSummary, isLoadingSummaryForContinue]);

  useEffect(() => {
    if (isSimulating && simulationHasStarted && initialIdea &&
        !isLoadingAgentResponse && !isPaused && !isLoadingSummary && !isLoadingSummaryForContinue
    ) {
      if(simulationLoopRef.current) clearTimeout(simulationLoopRef.current);
      simulationLoopRef.current = setTimeout(processAgentTurn, SIMULATION_DELAY_MS);
    } else if (simulationLoopRef.current) {
      clearTimeout(simulationLoopRef.current);
    }
    return () => {
      if (simulationLoopRef.current) {
        clearTimeout(simulationLoopRef.current);
      }
    };
  }, [
      isSimulating, simulationHasStarted, initialIdea, processAgentTurn,
      isLoadingAgentResponse, isPaused, isLoadingSummary, isLoadingSummaryForContinue
    ]);


  const handleTranscription = (text: string) => {
     if (!simulationHasStarted) {
      toast({ title: "Not Active", description: "Start a simulation to use voice input.", variant: "default" });
      return;
    }
    if (isLoadingAgentResponse || isLoadingSummary || isLoadingSummaryForContinue) {
      toast({ title: "Busy", description: "Please wait for the current AI/Summary task to complete.", variant: "default" });
      return;
    }

    if (simulationLoopRef.current) { 
      clearTimeout(simulationLoopRef.current);
    }

    addMessage(`Voice Input: ${text}`, "User", undefined, true);
    setCurrentIdea(text);
    isNextTurnVoiceSteeredRef.current = true; // Mark that the next agent turn is voice-steered

    if (isPaused) {
      setIsPaused(false); 
    } else if (isSimulating) {
       // Handled by useEffect
    }
  };

  const handleGenerateImplementationPlan = useCallback(async (summarizedIdea: string) => {
    if (!summarizedIdea) {
      toast({ title: "Error", description: "Cannot generate plan without a summarized idea.", variant: "destructive"});
      return;
    }
    setIsLoadingImplementationPlan(true);
    setImplementationPlan(null);
    try {
      const planResult = await generateImplementationPlan({ summarizedIdea });
      setImplementationPlan(planResult);
      toast({ title: "Implementation Plan Generated", description: "The detailed plan is now available."});
      setActiveTab("plan");
    } catch (error) {
      console.error("Implementation plan generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Plan Generation Error", description: `Could not generate implementation plan: ${errorMessage}`, variant: "destructive" });
      setImplementationPlan(null);
    } finally {
      setIsLoadingImplementationPlan(false);
    }
  }, [toast]);


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r">
          {/* Removed SidebarRail */}
          <SidebarHeader className="p-4 flex items-center justify-between group-data-[state=collapsed]:group-data-[collapsible=icon]:p-2 group-data-[state=collapsed]:group-data-[collapsible=icon]:justify-center">
             <h2 className={cn(
                "text-xl font-semibold text-primary",
                sidebarState === 'collapsed' && sidebarOpen === false && 'hidden' // Hide "Tools" when truly collapsed
             )}>
               Tools
             </h2>
             <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
             >
                {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </SidebarHeader>
          <SidebarContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b sticky top-0 bg-sidebar z-10 group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden">
                <TabsTrigger value="controlsOutput">Controls &amp; Summary</TabsTrigger>
                <TabsTrigger value="plan" disabled={!implementationPlan && !isLoadingImplementationPlan && !summary}>Plan</TabsTrigger>
              </TabsList>
              <TabsContent value="controlsOutput" className="flex-1 overflow-y-auto p-4 space-y-6 group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden">
                {simulationHasStarted && (
                  <Controls
                    isSimulating={isSimulating}
                    isPaused={isPaused}
                    simulationHasStarted={simulationHasStarted}
                    isLoadingSummary={isLoadingSummary}
                    isLoadingSummaryForContinue={isLoadingSummaryForContinue}
                    isLoadingAgentResponse={isLoadingAgentResponse}
                    onStopSimulation={handleStopSimulation}
                    onPauseResumeSimulation={handlePauseResumeSimulation}
                    onSummarizeAndContinue={handleSummarizeAndContinue}
                    onTranscription={handleTranscription}
                    hasMessages={messages.length > 0}
                  />
                )}
                <OutputActions
                  summary={summary}
                  isLoading={isLoadingSummary || isLoadingSummaryForContinue}
                  onGeneratePlan={handleGenerateImplementationPlan}
                  isGeneratingPlan={isLoadingImplementationPlan}
                  planIsAvailable={!!implementationPlan || isLoadingImplementationPlan}
                />
              </TabsContent>
              <TabsContent value="plan" className="flex-1 overflow-y-auto p-4 group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden">
                <ImplementationPlan
                  plan={implementationPlan}
                  isLoading={isLoadingImplementationPlan && !implementationPlan}
                />
              </TabsContent>
            </Tabs>
          </SidebarContent>
          <SidebarFooter className="p-4 mt-auto border-t group-data-[state=collapsed]:group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-muted-foreground text-center">Brainstorm v1.6</p>
          </SidebarFooter>
           <SidebarFooter className="p-2 mt-auto border-t hidden group-data-[state=collapsed]:group-data-[collapsible=icon]:block">
            <p className="text-xs text-muted-foreground text-center">v1.6</p>
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
  );
}

export default function EvolvingEchoPage() {
  return (
    <SidebarProvider defaultOpen={true}> {/* Set defaultOpen to false if you want it initially collapsed */}
      <EvolvingEchoPageContent />
    </SidebarProvider>
  );
}

    