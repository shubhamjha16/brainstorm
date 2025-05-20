
export interface Agent {
  id: string;
  name: string;
  provider: string;
  role: string;
  avatarColor: string; // Tailwind background color class e.g. bg-purple-500
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ChatMessageData {
  id: string;
  sender: 'User' | Agent['name'] | 'System'; // System can be used for general messages if needed
  text: string;
  timestamp: Date;
  isUser: boolean;
  agent?: Agent;
  isVoiceInput?: boolean;
  isLoading?: boolean; // To indicate if this is a temporary loading message for an agent
}

export interface SummaryData {
  summary: string;
  keyContributions: string;
}

export interface ImplementationPlanData {
  timeframe: string;
  projectPhasesFlowchart: string;
  costEstimationFlowchart: string;
  resourceAllocation: string;
  feasibilityAssessment: string;
  refinedStrategy: string;
}

export interface MarketingPostData {
  imageUri: string;
  caption: string;
  imageKeywords: string; // Keywords used for image generation or as a hint
}
