
"use client";

import type { ImplementationPlanData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Loader2, GanttChartSquare, DollarSign, Users, CheckCircle, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";

interface ImplementationPlanProps {
  plan: ImplementationPlanData | null;
  isLoading: boolean;
}

export function ImplementationPlan({ plan, isLoading }: ImplementationPlanProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportPlan = () => {
    if (!plan) return;
    setIsExporting(true);
    try {
      let exportData = `Brainstorm - Implementation Plan:\n\n`;
      exportData += `--- TIMEFRAME ---\n${plan.timeframe}\n\n`;
      exportData += `--- PROJECT PHASES FLOWCHART ---\n${plan.projectPhasesFlowchart}\n\n`;
      exportData += `--- COST ESTIMATION FLOWCHART ---\n${plan.costEstimationFlowchart}\n\n`;
      exportData += `--- RESOURCE ALLOCATION ---\n${plan.resourceAllocation}\n\n`;
      exportData += `--- FEASIBILITY ASSESSMENT ---\n${plan.feasibilityAssessment}\n\n`;
      exportData += `--- REFINED STRATEGY ---\n${plan.refinedStrategy}\n\n`;

      const blob = new Blob([exportData], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "brainstorm_implementation_plan.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Exported!", description: "Implementation Plan downloaded as a text file." });
    } catch (error) {
      console.error("Failed to export plan:", error);
      toast({ title: "Export Failed", description: "Could not export implementation plan.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Loader2 className="h-5 w-5 mr-2 animate-spin text-primary" />
            Generating Implementation Plan
          </CardTitle>
          <CardDescription>The AI is preparing the detailed plan...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8 border-t">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading plan details...</p>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Implementation Plan</CardTitle>
          <CardDescription>Generate a plan from the summarized idea in the 'Controls &amp; Summary' tab.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-muted-foreground border-t">
          <FileText className="h-10 w-10 opacity-50 mb-2" />
          No implementation plan generated yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Implementation Plan</CardTitle>
        <CardDescription>A detailed plan for bringing the evolved idea to life.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="h-[calc(100vh-450px)] max-h-[550px] pr-3 border rounded-md p-1">
          <div className="space-y-4 p-3">
            <SectionCard icon={GanttChartSquare} title="Timeframe" content={plan.timeframe} />
            <SectionCard icon={FileText} title="Project Phases (Flowchart)" content={plan.projectPhasesFlowchart} />
            <SectionCard icon={DollarSign} title="Cost Estimation (Flowchart)" content={plan.costEstimationFlowchart} />
            <SectionCard icon={Users} title="Resource Allocation" content={plan.resourceAllocation} />
            <SectionCard icon={CheckCircle} title="Feasibility Assessment" content={plan.feasibilityAssessment} />
            <SectionCard icon={Lightbulb} title="Refined Actionable Strategy" content={plan.refinedStrategy} />
          </div>
        </ScrollArea>
        <Button onClick={handleExportPlan} className="w-full mt-2" disabled={isExporting}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {isExporting ? "Exporting Plan..." : "Export Implementation Plan"}
        </Button>
      </CardContent>
    </Card>
  );
}

interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  content: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ icon: Icon, title, content }) => (
  <Card className="bg-card/80 shadow-sm">
    <CardHeader className="pb-2 pt-3 px-4">
      <CardTitle className="text-md flex items-center font-semibold">
        <Icon className="h-5 w-5 mr-2 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="text-sm whitespace-pre-wrap px-4 pb-3">
      {content}
    </CardContent>
  </Card>
);

    