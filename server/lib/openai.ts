import OpenAI from "openai";
import { EvaluationRequest, LinkCheckResult, ComparativeRequest } from "@/lib/types";
import { ContentEvaluation, ComparativeAnalysis } from "@shared/schema";

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
      // Link check results
      totalLinks: linkCheckResult?.totalLinks || null,
      brokenLinks: linkCheckResult?.brokenLinks || null,
      workingLinks: linkCheckResult?.workingLinks || null,
      linkDetails: linkCheckResult?.links || null,
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

interface OpenAIComparativeResponse {
  overallComparison: string;
  summary: string;
  informationGainScore: number;
  informationGainExplanation: string;
  uniqueInsightsScore: number;
  uniqueInsightsExplanation: string;
  comprehensivenessScore: number;
  comprehensivenessExplanation: string;
  recencyScore: number;
  recencyExplanation: string;
  sourceQualityScore: number;
  sourceQualityExplanation: string;
  analysisDetails: {
    [key: string]: string; // Detailed comparison points for specific aspects
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export async function compareContent(
  data: ComparativeRequest
): Promise<ComparativeAnalysis> {
  const { primaryArticle, competingArticles, apiKey } = data;

  if (!apiKey) {
    throw new Error("OpenAI API key is required");
  }

  if (competingArticles.length === 0) {
    throw new Error("At least one competing article is required");
  }

  const openai = new OpenAI({ apiKey });

  // Format competing articles for the prompt
  const competingArticlesText = competingArticles.map((article, index) => {
    return `COMPETING ARTICLE ${index + 1}${article.title ? ` (${article.title})` : ''}:
${article.content.substring(0, 5000)}${article.content.length > 5000 ? '... [truncated]' : ''}`;
  }).join('\n\n');

  const prompt = `
You are an expert content analyst specializing in comparative content evaluation.
Analyze the following primary article against competing articles and provide a detailed comparison.

PRIMARY ARTICLE${primaryArticle.title ? ` (${primaryArticle.title})` : ''}:
${primaryArticle.content.substring(0, 7500)}${primaryArticle.content.length > 7500 ? '... [truncated]' : ''}

COMPETING ARTICLES:
${competingArticlesText}

Compare the primary article against the competing articles based on the following criteria:
1. Information Gain - How much unique or valuable information does the primary article provide compared to competitors?
2. Unique Insights - Does the primary article offer perspectives, data, or analysis not found in competing articles?
3. Comprehensiveness - How thoroughly does the primary article cover the topic compared to competitors?
4. Recency - How up-to-date is the information in the primary article compared to competing content?
5. Source Quality - How credible and authoritative are the sources used in the primary article compared to competitors?

For EACH criterion, provide:
1. A score from 1-10 (10 being the highest)
2. A brief explanation for the score

Also provide:
- A brief overall comparison summary (200-300 words)
- Detailed analysis of primary vs. competing content
- 3-5 specific strengths of the primary article compared to competitors
- 3-5 specific weaknesses of the primary article compared to competitors
- 3-5 specific, actionable recommendations to improve the primary article

Respond in the following JSON format:
{
  "overallComparison": "string",
  "summary": "string",
  "informationGainScore": number,
  "informationGainExplanation": "string",
  "uniqueInsightsScore": number,
  "uniqueInsightsExplanation": "string",
  "comprehensivenessScore": number,
  "comprehensivenessExplanation": "string",
  "recencyScore": number,
  "recencyExplanation": "string",
  "sourceQualityScore": number,
  "sourceQualityExplanation": "string",
  "analysisDetails": {
    "topic1": "comparison explanation",
    "topic2": "comparison explanation",
    "topic3": "comparison explanation"
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    });

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    const comparison = JSON.parse(responseContent) as OpenAIComparativeResponse;
    
    // Transform to match our database schema
    return {
      id: 0, // Will be assigned by database
      primaryArticleTitle: primaryArticle.title || "Untitled content",
      primaryArticleContent: primaryArticle.content,
      competingArticles: competingArticles,
      createdAt: new Date(),
      overallComparison: comparison.overallComparison,
      informationGainScore: comparison.informationGainScore,
      uniqueInsightsScore: comparison.uniqueInsightsScore,
      comprehensivenessScore: comparison.comprehensivenessScore,
      recencyScore: comparison.recencyScore,
      sourceQualityScore: comparison.sourceQualityScore,
      analysisDetails: comparison.analysisDetails,
      strengths: comparison.strengths,
      weaknesses: comparison.weaknesses,
      recommendations: comparison.recommendations,
      summary: comparison.summary
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to compare content with OpenAI"
    );
  }
}
