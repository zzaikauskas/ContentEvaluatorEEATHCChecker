import { ContentEvaluation } from "@shared/schema";

export interface EvaluationRequest {
  title?: string;
  content: string;
  apiKey: string;
}

export interface EvaluationResponse extends ContentEvaluation {}

export interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
}

export interface ExpandableContentProps {
  title: string;
  children: React.ReactNode;
  isInfoSection?: boolean;
}

export interface ScoreWithExplanation {
  score: number;
  explanation: string;
}

export interface EEATScores {
  experience: ScoreWithExplanation;
  expertise: ScoreWithExplanation;
  authoritativeness: ScoreWithExplanation;
  trustworthiness: ScoreWithExplanation;
}

export interface HelpfulContentScores {
  userFirst: ScoreWithExplanation;
  depthValue: ScoreWithExplanation;
  satisfaction: ScoreWithExplanation;
  originality: ScoreWithExplanation;
}

export interface DetailedAnalysis {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export interface EvaluationState {
  isLoading: boolean;
  result: EvaluationResponse | null;
  error: string | null;
}

export type InputTab = 'text' | 'file' | 'url';
