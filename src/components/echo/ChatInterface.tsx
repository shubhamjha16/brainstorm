
"use client";

import type { Agent, ChatMessageData } from "@/types";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { AgentAvatar } from "./AgentAvatar";

interface ChatInterfaceProps {
  messages: ChatMessageData[];
  agents: Agent[]; // Pass agents to find the current one for loading state
}

export function ChatInterface({ messages, agents }: ChatInterfaceProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const currentLoadingAgent = messages.find(msg => msg.isLoading)?.agent;

  return (
    <ScrollArea className="h-[calc(100vh-200px)] p-4 rounded-md border shadow-inner bg-background/50" ref={scrollAreaRef} aria-live="polite">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 mb-4"><path d="M12 22a10 10 0 0 0-8.69-5h.01c.03-.02.05-.04.08-.06C4.53 16.12 4 14.63 4 13A8 8 0 0 1 12 5a8.1 8.1 0 0 1 7.6 6.33"/><path d="M12 22a10 10 0 0 1-8.69-5h.01c-.03-.02-.05-.04-.08-.06C2.27 16.12 2.5 14.63 2.5 13A8 8 0 0 1 10.5 5c.29 0 .58.01.86.04"/><path d="M20 17h.01"/></svg>
          <p className="text-lg font-medium">Conversation starts here.</p>
          <p className="text-sm">Enter an idea below to begin the Evolving Echo.</p>
        </div>
      )}
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {/* Optional: Show a persistent loader if the last message is a loading message from an agent */}
      {/* This part is handled by ChatMessage now if msg.isLoading is true */}
    </ScrollArea>
  );
}
