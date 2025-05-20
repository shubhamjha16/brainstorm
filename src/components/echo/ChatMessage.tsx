
"use client";

import type { ChatMessageData } from "@/types";
import { AgentAvatar } from "./AgentAvatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mic, Loader2 } from "lucide-react"; // Added Loader2
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAgentMessage = !message.isUser && message.agent;

  return (
    <div
      className={cn(
        "flex items-start gap-3 mb-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-500",
        message.isUser ? "justify-end" : "justify-start"
      )}
    >
      {isAgentMessage && <AgentAvatar agent={message.agent!} />}
      <Card
        className={cn(
          "max-w-[75%] shadow-md",
          message.isUser ? "bg-accent text-accent-foreground" : "bg-card text-card-foreground",
          message.isVoiceInput && "border-primary border-2",
          message.isLoading && "opacity-70" // Style for loading messages
        )}
      >
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {message.sender}
            {message.isVoiceInput && <Mic className="h-4 w-4 text-primary" />}
          </CardTitle>
          <CardDescription className="text-xs">
            {message.isLoading ? "Thinking..." : format(new Date(message.timestamp), "HH:mm")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-sm whitespace-pre-wrap">
          {message.isLoading && message.agent ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{message.text || `${message.agent.name} is refining the idea...`}</span>
            </div>
          ) : (
            message.text
          )}
        </CardContent>
      </Card>
      {message.isUser && !isAgentMessage && (
         <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
         </div>
      )}
    </div>
  );
}
