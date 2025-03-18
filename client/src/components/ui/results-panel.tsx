import { EvaluationState } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileDown, Save, Plus } from "lucide-react";
import OverallScoreCard from "@/components/ui/overall-score-card";
import EEATScoreCard from "@/components/ui/eeat-score-card";
import HelpfulContentCard from "@/components/ui/helpful-content-card";
import DetailedAnalysisCard from "@/components/ui/detailed-analysis-card";
import ContentPreviewCard from "@/components/ui/content-preview-card";
import MetaTitleCard from "@/components/ui/meta-title-card";

interface ResultsPanelProps {
  evaluationState: EvaluationState;
  resetEvaluation: () => void;
}

const ResultsPanel = ({ evaluationState, resetEvaluation }: ResultsPanelProps) => {
  const { isLoading, result, error } = evaluationState;

  // Function to export the evaluation as a JSON file
  const handleExport = () => {
    if (!result) return;
    
    const dataStr = JSON.stringify(result, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `content-evaluation-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // EmptyState component
  const EmptyState = () => (
    <Card className="text-center py-16 px-6">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-16 w-16 mx-auto text-neutral-300 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="text-xl font-medium text-neutral-700 mb-2">No Content Evaluated Yet</h3>
      <p className="text-neutral-600 max-w-md mx-auto mb-6">
        Enter your content in the form and click "Evaluate Content" to receive a detailed analysis based on 
        Google's E-E-A-T and Helpful Content guidelines.
      </p>
      <div className="flex flex-col gap-3 max-w-sm mx-auto text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary shrink-0">1</div>
          <p className="text-sm text-neutral-600">Input your content using one of the available methods</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary shrink-0">2</div>
          <p className="text-sm text-neutral-600">Enter your OpenAI API key (required for GPT-4 analysis)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary shrink-0">3</div>
          <p className="text-sm text-neutral-600">Click "Evaluate Content" and wait for the AI analysis</p>
        </div>
      </div>
    </Card>
  );

  // LoadingState component
  const LoadingState = () => (
    <Card className="text-center py-16 px-6">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
      <h3 className="text-xl font-medium text-neutral-700 mb-2">Analyzing Your Content</h3>
      <p className="text-neutral-600 max-w-md mx-auto">
        We're using GPT-4 to evaluate your content against Google's E-E-A-T and Helpful Content guidelines. 
        This may take a minute...
      </p>
    </Card>
  );

  // ErrorState component
  const ErrorState = ({ message }: { message: string }) => (
    <Card className="text-center py-12 px-6">
      <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
      <h3 className="text-xl font-medium text-neutral-700 mb-2">Evaluation Failed</h3>
      <p className="text-neutral-600 max-w-md mx-auto mb-6">
        {message}
      </p>
      <Button onClick={resetEvaluation}>Try Again</Button>
    </Card>
  );

  // ResultsState component
  const ResultsState = () => {
    if (!result) return null;

    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <div>
        {/* Overall Score Card */}
        <OverallScoreCard 
          score={result.overallScore} 
          summary={result.summary} 
          date={formatDate(result.createdAt)} 
        />
        
        {/* Detailed Scores Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* E-E-A-T Scores */}
          <EEATScoreCard 
            experienceScore={result.experienceScore}
            expertiseScore={result.expertiseScore}
            authoritativenessScore={result.authoritativenessScore}
            trustworthinessScore={result.trustworthinessScore}
            experienceExplanation={result.experienceExplanation || undefined}
            expertiseExplanation={result.expertiseExplanation || undefined}
            authoritativenessExplanation={result.authoritativenessExplanation || undefined}
            trustworthinessExplanation={result.trustworthinessExplanation || undefined}
          />
          
          {/* Helpful Content Scores */}
          <HelpfulContentCard 
            userFirstScore={result.userFirstScore}
            depthValueScore={result.depthValueScore}
            satisfactionScore={result.satisfactionScore}
            originalityScore={result.originalityScore}
            userFirstExplanation={result.userFirstExplanation || undefined}
            depthValueExplanation={result.depthValueExplanation || undefined}
            satisfactionExplanation={result.satisfactionExplanation || undefined}
            originalityExplanation={result.originalityExplanation || undefined}
          />
        </div>
        
        {/* Meta Title Optimization Check - only displayed if keyword is present */}
        {result.keyword && result.title && (
          <MetaTitleCard
            title={result.title}
            keyword={result.keyword}
            keywordInTitle={result.keywordInTitle || 0}
            keywordAtBeginning={result.keywordAtBeginning || 0}
          />
        )}
        
        {/* Detailed Analysis */}
        <DetailedAnalysisCard 
          strengths={result.strengths as string[]}
          improvements={result.improvements as string[]}
          recommendations={result.recommendations as string[]}
        />
        
        {/* Content Preview */}
        <ContentPreviewCard 
          title={result.title} 
          content={result.content} 
        />
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExport}
          >
            <FileDown className="h-5 w-5" />
            Export Report
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            Save Analysis
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={resetEvaluation}
          >
            <Plus className="h-5 w-5" />
            New Evaluation
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (result) {
    return <ResultsState />;
  }

  return <EmptyState />;
};

export default ResultsPanel;
