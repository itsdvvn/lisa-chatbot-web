export interface Message {
  text: string;
  sender: 'user' | 'bot';
  time: string;
  date: string;
  files?: Array<{ name: string; type: string; dataUrl: string }>;
}

export interface QuickReplyOption {
  label: string;
  value: string;
}

export interface ChatSession {
  sessionId: string;
  history: Message[];
  lastActive: number;
}
