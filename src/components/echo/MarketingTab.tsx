
"use client";

import React, { useState, useEffect } from 'react';
import type { MarketingPostData, SummaryData } from '@/types';
import { generateInstagramPost } from '@/ai/flows/generate-instagram-post-flow';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface MarketingTabProps {
  summary: SummaryData | null;
  onPostGenerated: (post: MarketingPostData | null) => void;
}

export function MarketingTab({ summary, onPostGenerated }: MarketingTabProps) {
  const [marketingAngle, setMarketingAngle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (summary?.summary && !marketingAngle) {
      setMarketingAngle(summary.summary.substring(0, 250)); 
    }
  }, [summary, marketingAngle]);

  const handleGeneratePost = async () => {
    if (!marketingAngle.trim()) {
      toast({ title: 'Missing Theme', description: 'Please enter a marketing angle or theme.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    onPostGenerated(null); // Clear previous post from main display immediately

    try {
      const result = await generateInstagramPost({ theme: marketingAngle.trim() });
      onPostGenerated(result);
      toast({ title: 'Post Generated!', description: 'Instagram content is ready and displayed below the chat.' });
    } catch (error) {
      console.error('Marketing post generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error during post generation.";
      toast({ title: 'Generation Failed', description: errorMessage, variant: 'destructive' });
      onPostGenerated(null); 
    } finally {
      setIsLoading(false);
    }
  };
  
  const getPlaceholderHint = () => {
    if (marketingAngle) {
        return marketingAngle.toLowerCase().split(' ').filter(word => word.length > 2).slice(0, 2).join(' ') || 'marketing visual';
    }
    return 'idea showcase';
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Wand2 className="h-5 w-5 mr-2 text-primary" />
          Instagram Post Generator
        </CardTitle>
        <CardDescription>
          Generate an image and caption for your Instagram post. 
          The result will appear below the main chat interface.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="marketingAngle" className="mb-1 block text-sm font-medium">Marketing Angle / Theme</Label>
          <Textarea
            id="marketingAngle"
            placeholder="e.g., Launching our new eco-friendly gadget that helps you save the planet..."
            value={marketingAngle}
            onChange={(e) => setMarketingAngle(e.target.value)}
            rows={4}
            disabled={isLoading}
            maxLength={300}
          />
           <p className="text-xs text-muted-foreground mt-1">{marketingAngle.length}/300 characters</p>
        </div>

        <Button onClick={handleGeneratePost} disabled={isLoading || !marketingAngle.trim()} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Generating Post...' : 'Generate Instagram Post'}
        </Button>

        {isLoading && (
          <div className="text-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">AI is crafting your post... this might take a moment.</p>
          </div>
        )}
        
        {!isLoading && (
           <div className="text-center p-4 border-t mt-4">
             <div className="rounded-md overflow-hidden border bg-muted/50 aspect-square w-full max-w-[200px] mx-auto mb-2">
                 <Image
                    src={`https://placehold.co/200x200.png`} 
                    alt="Placeholder for Instagram image"
                    width={200}
                    height={200}
                    className="object-cover w-full h-full opacity-50"
                    data-ai-hint={getPlaceholderHint()}
                  />
            </div>
            <p className="text-sm text-muted-foreground">
              {summary ? "Enter a theme above and click generate." : "Generate a summary first to enable this feature."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
