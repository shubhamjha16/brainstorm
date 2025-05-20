
"use client";

import React, { useState, useEffect } from 'react';
import type { MarketingPostData, SummaryData } from '@/types';
import { generateInstagramPost } from '@/ai/flows/generate-instagram-post-flow';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2, Image as ImageIcon, FileText, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image'; // Using next/image

interface MarketingTabProps {
  summary: SummaryData | null; // To prefill marketing angle
  onGenerationStart?: () => void;
  onGenerationComplete?: () => void;
}

export function MarketingTab({ summary, onGenerationStart, onGenerationComplete }: MarketingTabProps) {
  const [marketingAngle, setMarketingAngle] = useState('');
  const [generatedPost, setGeneratedPost] = useState<MarketingPostData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (summary?.summary && !marketingAngle) {
      setMarketingAngle(summary.summary.substring(0, 200)); // Prefill with summary, truncated
    }
  }, [summary, marketingAngle]);

  const handleGeneratePost = async () => {
    if (!marketingAngle.trim()) {
      toast({ title: 'Missing Theme', description: 'Please enter a marketing angle or theme.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setGeneratedPost(null); // Clear previous post
    if (onGenerationStart) onGenerationStart();

    try {
      const result = await generateInstagramPost({ theme: marketingAngle.trim() });
      setGeneratedPost(result);
      toast({ title: 'Post Generated!', description: 'Instagram image and caption are ready.' });
    } catch (error) {
      console.error('Marketing post generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error during post generation.";
      toast({ title: 'Generation Failed', description: errorMessage, variant: 'destructive' });
      setGeneratedPost(null);
    } finally {
      setIsLoading(false);
      if (onGenerationComplete) onGenerationComplete();
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
        <CardDescription>Generate an image and caption for your Instagram post based on a theme.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="marketingAngle" className="mb-1 block text-sm font-medium">Marketing Angle / Theme</Label>
          <Textarea
            id="marketingAngle"
            placeholder="e.g., Launching our new eco-friendly gadget..."
            value={marketingAngle}
            onChange={(e) => setMarketingAngle(e.target.value)}
            rows={3}
            disabled={isLoading}
          />
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

        {generatedPost && !isLoading && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h3 className="text-md font-semibold flex items-center mb-2">
                <ImageIcon className="h-5 w-5 mr-2 text-primary" /> Generated Image
              </h3>
              <div className="rounded-md overflow-hidden border bg-muted aspect-square w-full max-w-sm mx-auto">
                <Image
                  src={generatedPost.imageUri}
                  alt={`AI-generated image for ${generatedPost.imageKeywords}`}
                  width={400}
                  height={400}
                  className="object-cover w-full h-full"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">Keywords: {generatedPost.imageKeywords}</p>
            </div>
            <div>
              <h3 className="text-md font-semibold flex items-center mb-2">
                <FileText className="h-5 w-5 mr-2 text-primary" /> Generated Caption
              </h3>
              <div className="p-3 bg-muted rounded-md border text-sm whitespace-pre-wrap">
                {generatedPost.caption}
              </div>
            </div>
             <Button onClick={handleGeneratePost} variant="outline" size="sm" disabled={isLoading || !marketingAngle.trim()} className="w-full mt-2">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Regenerate Post
            </Button>
          </div>
        )}

        {!generatedPost && !isLoading && (
          <div className="text-center p-4 border-t mt-4">
            <div className="rounded-md overflow-hidden border bg-muted/50 aspect-square w-full max-w-xs mx-auto mb-2">
                 <Image
                    src={`https://placehold.co/400x400.png`}
                    alt="Placeholder for Instagram image"
                    width={400}
                    height={400}
                    className="object-cover w-full h-full opacity-50"
                    data-ai-hint={getPlaceholderHint()}
                  />
            </div>
            <p className="text-sm text-muted-foreground">Your generated post will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
