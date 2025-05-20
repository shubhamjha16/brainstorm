"use client";

import type { Agent } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  agent: Agent;
  className?: string;
}

export function AgentAvatar({ agent, className }: AgentAvatarProps) {
  const IconComponent = agent.icon;
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {IconComponent ? (
         <AvatarFallback className={cn("text-white", agent.avatarColor)}>
          <IconComponent className="h-4 w-4" />
        </AvatarFallback>
      ) : (
        <AvatarFallback className={cn("text-white", agent.avatarColor)}>
          {agent.name.substring(0, 1).toUpperCase()}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
