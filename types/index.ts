export interface PersonalityTraits {
  tone: string[];
  values: string[];
  communication: string;
  profession?: string;
  location?: string;
  humor?: string;
  signaturePhrases?: string[];
  avoids?: string[];
  lifeContext?: string;
}

export interface WritingStyle {
  formality: "casual" | "professional" | "mixed";
  sentenceLength: "short" | "medium" | "long";
  messageLength?: "short" | "medium" | "long";
  usesEmoji: boolean;
  vocabulary: string[];
  patterns: string[];
}

export interface TwinProfile {
  id: string;
  userId: string;
  name?: string | null;
  personality?: PersonalityTraits | null;
  writingStyle?: WritingStyle | null;
  systemPrompt?: string | null;
}

export interface Memory {
  id: string;
  twinId: string;
  title: string;
  content: string;
  category?: string | null;
  visibility?: string | null;
  importance?: string | null;
  createdAt: Date;
}

export type Platform = "whatsapp" | "email" | "instagram" | "twitter" | "sms" | "other";

export interface ReplyRequest {
  incomingMessage: string;
  platform: Platform;
  context?: string;
  tweak?: string;
  currentReply?: string;
}
