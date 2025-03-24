import { ContentEvaluation, ComparativeAnalysis } from "@shared/schema";

export interface EvaluationRequest {
  title?: string;
  content: string;
  keyword?: string;
  apiKey: string;
  checkLinks?: boolean;
}

export interface CompetingArticle {
  title?: string;
  content: string;
}

export interface ComparativeRequest {
  primaryArticle: {
    title?: string;
    content: string;
  };
  competingArticles: CompetingArticle[];
  apiKey: string;
}

export interface LinkStatus {
  url: string;
  status: number | null;
  ok: boolean;
  error?: string;
}

export interface LinkCheckResult {
  links: LinkStatus[];
  totalLinks: number;
  brokenLinks: number;
  workingLinks: number;
}

export interface EvaluationResponse extends ContentEvaluation {}

export interface ComparativeResponse extends ComparativeAnalysis {}

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

export interface ComparativeScores {
  informationGain: ScoreWithExplanation;
  uniqueInsights: ScoreWithExplanation;
  comprehensiveness: ScoreWithExplanation;
  recency: ScoreWithExplanation;
  sourceQuality: ScoreWithExplanation;
}

export interface ComparativeDetailedAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface EvaluationState {
  isLoading: boolean;
  result: EvaluationResponse | null;
  error: string | null;
}

export interface ComparativeState {
  isLoading: boolean;
  result: ComparativeResponse | null;
  error: string | null;
}

// No longer needed as we only use file upload
// export type InputTab = 'text' | 'file' | 'url';
