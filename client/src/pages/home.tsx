import { useState } from "react";
import ContentInputForm from "@/components/ui/content-input-form";
import ResultsPanel from "@/components/ui/results-panel";
import { EvaluationState } from "@/lib/types";

export default function Home() {
  const [evaluationState, setEvaluationState] = useState<EvaluationState>({
    isLoading: false,
    result: null,
    error: null,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Content E-E-A-T & Helpful Content Evaluator
        </h1>
        <p className="text-neutral-600 text-center max-w-3xl mx-auto">
          Analyze your content against Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) and
          Helpful Content guidelines using AI-powered evaluation.
        </p>
      </header>

      {/* Main content area */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-5 mb-8 lg:mb-0">
          <ContentInputForm 
            setEvaluationState={setEvaluationState} 
            isLoading={evaluationState.isLoading} 
          />
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7">
          <ResultsPanel 
            evaluationState={evaluationState} 
            resetEvaluation={() => setEvaluationState({
              isLoading: false, 
              result: null, 
              error: null
            })} 
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-neutral-500">
        <p>Content E-E-A-T Evaluator - Uses GPT-4 to analyze content against Google's guidelines.</p>
        <p className="mt-1">This tool does not guarantee search rankings but helps improve content quality.</p>
      </footer>
    </div>
  );
}
