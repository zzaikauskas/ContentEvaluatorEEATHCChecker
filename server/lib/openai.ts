import OpenAI from "openai";
import { EvaluationRequest, LinkCheckResult } from "@/lib/types";
import { ContentEvaluation } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

interface OpenAIEvaluationResponse {
  overallScore: number;
  summary: string;
  experienceScore: number;
  experienceExplanation: string;
  expertiseScore: number;
  expertiseExplanation: string;
  authoritativenessScore: number;
  authoritativenessExplanation: string;
  trustworthinessScore: number;
  trustworthinessExplanation: string;
  userFirstScore: number;
  userFirstExplanation: string;
  depthValueScore: number;
  depthValueExplanation: string;
  satisfactionScore: number;
  satisfactionExplanation: string;
  originalityScore: number;
  originalityExplanation: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

// Extended version of EvaluationRequest to include link check results
interface EvaluationRequestWithLinks extends EvaluationRequest {
  linkCheckResult?: LinkCheckResult | null;
}

export async function evaluateContent(
  data: EvaluationRequestWithLinks
): Promise<ContentEvaluation> {
  const { content, title, keyword, apiKey, linkCheckResult } = data;

  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }

  const openai = new OpenAI({ apiKey });

  const prompt = `
You are an expert content evaluator specializing in Google's E-E-A-T and Helpful Content guidelines.
Analyze the following content and provide a detailed evaluation.

CONTENT TITLE: ${title || "Untitled content"}

CONTENT: 
${content}

Evaluate this content based on Google's E-E-A-T criteria (Experience, Expertise, Authoritativeness, Trustworthiness) and Helpful Content guidelines.

For EACH criterion, provide:
1. A score from 1-10 (10 being the highest)
2. A brief explanation for the score

Also provide:
- An overall score from 1-10
- A brief summary of the content quality
- 3-5 specific strengths of the content
- 3-5 specific areas for improvement
- 3-5 specific, actionable recommendations

Respond in the following JSON format:
{
  "overallScore": number,
  "summary": "string",
  "experienceScore": number,
  "experienceExplanation": "string",
  "expertiseScore": number,
  "expertiseExplanation": "string",
  "authoritativenessScore": number,
  "authoritativenessExplanation": "string",
  "trustworthinessScore": number,
  "trustworthinessExplanation": "string",
  "userFirstScore": number,
  "userFirstExplanation": "string",
  "depthValueScore": number,
  "depthValueExplanation": "string",
  "satisfactionScore": number,
  "satisfactionExplanation": "string",
  "originalityScore": number,
  "originalityExplanation": "string",
  "strengths": ["string"],
  "improvements": ["string"],
  "recommendations": ["string"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    const evaluation = JSON.parse(responseContent) as OpenAIEvaluationResponse;

    // Process meta title keyword analysis if both title and keyword are provided
    let keywordInTitle = 0;
    let keywordAtBeginning = 0;
    
    if (title && keyword && keyword.trim() !== '') {
      const titleLower = title.toLowerCase();
      const keywordLower = keyword.toLowerCase();
      
      // Check if keyword is in the title
      if (titleLower.includes(keywordLower)) {
        keywordInTitle = 1;
        
        // Check if keyword is at the beginning (first 10 characters)
        const keywordPosition = titleLower.indexOf(keywordLower);
        if (keywordPosition <= 10) {
          keywordAtBeginning = 1;
        }
      }
    }
    
    // Transform to match our database schema
    return {
      id: 0, // Will be assigned by database
      title: title || "Untitled content",
      content,
      keyword: keyword || null,
      keywordInTitle,
      keywordAtBeginning,
      createdAt: new Date(),
      overallScore: evaluation.overallScore,
      experienceScore: evaluation.experienceScore,
      expertiseScore: evaluation.expertiseScore,
      authoritativenessScore: evaluation.authoritativenessScore,
      trustworthinessScore: evaluation.trustworthinessScore,
      userFirstScore: evaluation.userFirstScore,
      depthValueScore: evaluation.depthValueScore,
      satisfactionScore: evaluation.satisfactionScore,
      originalityScore: evaluation.originalityScore,
      experienceExplanation: evaluation.experienceExplanation,
      expertiseExplanation: evaluation.expertiseExplanation,
      authoritativenessExplanation: evaluation.authoritativenessExplanation,
      trustworthinessExplanation: evaluation.trustworthinessExplanation,
      userFirstExplanation: evaluation.userFirstExplanation,
      depthValueExplanation: evaluation.depthValueExplanation,
      satisfactionExplanation: evaluation.satisfactionExplanation,
      originalityExplanation: evaluation.originalityExplanation,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      recommendations: evaluation.recommendations,
      summary: evaluation.summary,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to evaluate content with OpenAI"
    );
  }
}
