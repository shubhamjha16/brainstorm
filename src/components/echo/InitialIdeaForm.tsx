
"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Play } from "lucide-react";

interface InitialIdeaFormProps {
  onStartSimulation: (idea: string) => void;
  isLoading: boolean;
}

export function InitialIdeaForm({ onStartSimulation, isLoading }: InitialIdeaFormProps) {
  const [idea, setIdea] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim()) {
      onStartSimulation(idea.trim());
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto my-8 shadow-xl">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Start Your Evolving Echo</CardTitle>
          </div>
          <CardDescription>
            Enter your initial idea below. AI agents will then collaboratively refine and evolve it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., A platform for connecting local artists with community projects..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={5}
            className="resize-none"
            aria-label="Initial idea"
            disabled={isLoading}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={!idea.trim() || isLoading}>
            <Play className="mr-2 h-4 w-4" />
            {isLoading ? "Starting..." : "Start Evolving Idea"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

    