
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
  sender: 'User' | Agent['name'];
  text: string;
  timestamp: Date;
  isUser: boolean;
  agent?: Agent;
  isVoiceInput?: boolean;
}

export interface SummaryData {
  summary: string;
  keyContributions: string;
}

    