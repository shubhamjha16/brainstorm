
import { MessageCircleCode, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto flex items-center gap-3">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="mr-1 h-8 w-8" // Adjusted size and margin
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        )}
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

    