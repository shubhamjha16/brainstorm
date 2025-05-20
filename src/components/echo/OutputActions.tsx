
"use client";

import type { SummaryData } from "@/types";
import { Button } from "@/components/ui/button";
import { Download, FileText, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

interface OutputActionsProps {
  summary: SummaryData | null;
  isLoading: boolean;
}

export function OutputActions({ summary, isLoading }: OutputActionsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleSave = () => {
    if (!summary) return;
    setIsSaving(true);
    try {
      localStorage.setItem("evolvingEchoSummary", JSON.stringify(summary));
      toast({ title: "Saved!", description: "Summary saved to local storage." });
    } catch (error) {
      console.error("Failed to save summary:", error);
      toast({ title: "Save Failed", description: "Could not save summary to local storage.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!summary) return;
    setIsExporting(true);
    try {
      const exportData = `Evolving Echo Summary:\n\n--- IDEA SUMMARY ---\n${summary.summary}\n\n--- KEY CONTRIBUTIONS ---\n${summary.keyContributions}`;
      const blob = new Blob([exportData], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "evolving_echo_summary.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Exported!", description: "Summary downloaded as a text file." });
    } catch (error) {
      console.error("Failed to export summary:", error);
      toast({ title: "Export Failed", description: "Could not export summary.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Output</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading summary...</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Output</CardTitle>
          <CardDescription>Summary and actions will appear here once the simulation is stopped.</CardDescription>
        </CardHeader>
         <CardContent className="flex items-center justify-center p-8 text-muted-foreground">
          <FileText className="h-8 w-8 opacity-50 mr-2" />
          No summary yet.
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Final Evolved Idea</CardTitle>
        <CardDescription>Review, save, or export the summarized discussion.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" /> Review Summary
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Evolved Idea Summary</AlertDialogTitle>
              </AlertDialogHeader>
              <ScrollArea className="h-[60vh] max-h-[500px] p-1">
                <AlertDialogDescription asChild>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1 text-foreground">Summary of Idea:</h3>
                      <p className="text-sm whitespace-pre-wrap">{summary.summary}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-foreground">Key Contributions:</h3>
                       <p className="text-sm whitespace-pre-wrap">{summary.keyContributions}</p>
                    </div>
                  </div>
                </AlertDialogDescription>
              </ScrollArea>
              <AlertDialogFooter>
                <AlertDialogAction>Close</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Summary"}
        </Button>
        <Button onClick={handleExport} className="w-full" disabled={isExporting}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          {isExporting ? "Exporting..." : "Export Summary"}
        </Button>
      </CardContent>
    </Card>
  );
}

    