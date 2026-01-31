
export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT'
}

export enum AppTheme {
  PRO = 'pro',
  DARK = 'dark',
  MONO = 'mono',
  CYBER = 'cyber'
}

export interface UserProfile {
  preferredLanguage: string;
  experienceLevel: Difficulty;
  frameworks: string;
}

export interface DebugResponse {
  whatWentWrong: string;
  whyItHappened: string;
  howToFixIt: string;
  codeSnippet?: string;
  codeExplanation?: string;
  language?: string;
  proTip?: string;
  tags?: string[];
}

export interface PreventionPrediction {
  severity: 'Low' | 'Medium' | 'High';
  errorType: string;
  probability: number;
  trigger: string;
  because: string;
  fix: string;
}

export interface PreventionResponse {
  reasoning: string;
  predictions: PreventionPrediction[];
  autoPatch: string;
  language: string;
}

export interface ErrorChainLink {
  file: string;
  line: string;
  description: string;
  type: 'origin' | 'propagation' | 'manifestation';
}

export interface FileFix {
  file: string;
  description: string;
  originalSnippet: string;
  fixedSnippet: string;
}

export interface DetectiveResponse {
  chain: ErrorChainLink[];
  rootCause: { file: string; line: string; explanation: string };
  affectedFiles: string[];
  rippleEffects: string;
  strategy: string;
  fileFixes: FileFix[];
}

export interface MemoryEntry {
  id: string;
  errorSnippet: string;
  explanation: string;
  timestamp: number;
  tags?: string[];
}
