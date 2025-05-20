
import { MessageCircleCode } from "lucide-react";

export function Header() {
  return (
    <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto flex items-center gap-3">
        <MessageCircleCode className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-primary">Brainstorm</h1>
          <p className="text-sm text-muted-foreground">
            Collaborative AI Idea Evolution & Brainstorming
          </p>
        </div>
      </div>
    </header>
  );
}

    