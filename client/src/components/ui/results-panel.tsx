import { EvaluationState, LinkStatus, EvaluationResponse } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileDown, FileText, Save, RefreshCw } from "lucide-react";
import OverallScoreCard from "@/components/ui/overall-score-card";
import EEATScoreCard from "@/components/ui/eeat-score-card";
import HelpfulContentCard from "@/components/ui/helpful-content-card";
import DetailedAnalysisCard from "@/components/ui/detailed-analysis-card";
import ContentPreviewCard from "@/components/ui/content-preview-card";
import MetaTitleCard from "@/components/ui/meta-title-card";
import LinkCheckCard from "@/components/ui/link-check-card";
import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Type guard to check if strengths, improvements, and recommendations are arrays
function isValidArrays(obj: any): boolean {
  return (
    Array.isArray(obj.strengths) &&
    Array.isArray(obj.improvements) &&
    Array.isArray(obj.recommendations)
  );
}

interface ResultsPanelProps {
  evaluationState: EvaluationState;
  resetEvaluation: () => void;
}

const ResultsPanel = ({ evaluationState, resetEvaluation }: ResultsPanelProps) => {
  const { isLoading, result, error } = evaluationState;
  const resultsRef = useRef<HTMLDivElement>(null);
  
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
  
  // Function to export the evaluation as a PDF file
  const handleExportPDF = async () => {
    if (!result || !resultsRef.current) return;

    // Display loading state
    const loadingToast = document.createElement('div');
    loadingToast.className = 'fixed bottom-4 right-4 bg-primary text-white p-4 rounded-md shadow-lg z-50';
    loadingToast.innerHTML = 'Generating PDF... Please wait.';
    document.body.appendChild(loadingToast);
    
    try {
      // Create a new PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true, // Use compression to reduce file size
      });
      
      // Set PDF metadata
      pdf.setProperties({
        title: `Content Evaluation - ${result.title || 'Untitled'}`,
        subject: 'E-E-A-T and Helpful Content Evaluation',
        creator: 'Content Evaluation Tool',
        author: 'Content Evaluation Tool',
      });
      
      // First page - cover page with text-based content (no images)
      let yOffset = 20; // Starting position
      
      // PDF title
      pdf.setFontSize(24);
      pdf.setTextColor(33, 43, 54);
      pdf.text('Content Evaluation Report', 105, yOffset, { align: 'center' });
      yOffset += 15;
      
      // Content title
      if (result.title) {
        pdf.setFontSize(16);
        pdf.setTextColor(66, 84, 102);
        // Limit title to prevent overflow - split into multiple lines if needed
        const title = result.title;
        const titleLines = pdf.splitTextToSize(title, 150);
        pdf.text(titleLines, 105, yOffset, { align: 'center' });
        yOffset += 10 * titleLines.length;
      }
      
      // PDF subtitle with date
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128);
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(`Generated on ${currentDate}`, 105, yOffset, { align: 'center' });
      yOffset += 15;
      
      // Overall score display
      pdf.setFontSize(18);
      pdf.setTextColor(33, 43, 54);
      pdf.text(`Overall Score: ${result.overallScore.toFixed(1)}/10`, 105, yOffset, { align: 'center' });
      yOffset += 20;
      
      // Add a summary box
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(25, yOffset, 160, 40, 3, 3, 'F');
      
      pdf.setFontSize(12);
      pdf.setTextColor(33, 43, 54);
      pdf.text('Summary:', 30, yOffset + 10);
      
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      const summaryLines = pdf.splitTextToSize(result.summary, 150);
      pdf.text(summaryLines, 30, yOffset + 20);
      
      // Start a new page for the detailed text-based content
      pdf.addPage();
      
      // Define a function to add a section header
      const addSectionHeader = (title: string) => {
        pdf.setFontSize(14);
        pdf.setTextColor(33, 43, 54);
        pdf.text(title, 20, yOffset);
        yOffset += 10;
      };
      
      // Define a function to add a score with explanation
      const addScoreWithExplanation = (name: string, score: number, explanation?: string) => {
        pdf.setFontSize(12);
        pdf.setTextColor(66, 84, 102);
        pdf.text(`${name}: ${score.toFixed(1)}/10`, 20, yOffset);
        yOffset += 6;
        
        if (explanation) {
          pdf.setFontSize(9);
          pdf.setTextColor(107, 114, 128);
          const explanationLines = pdf.splitTextToSize(explanation, 170);
          pdf.text(explanationLines, 20, yOffset);
          yOffset += 4 + (explanationLines.length * 3.5);
        }
        
        yOffset += 4; // Add some space after each score
      };
      
      // Add E-E-A-T scores section using text
      yOffset = 15;
      addSectionHeader("E-E-A-T Evaluation");
      
      addScoreWithExplanation("Experience", result.experienceScore, result.experienceExplanation || undefined);
      addScoreWithExplanation("Expertise", result.expertiseScore, result.expertiseExplanation || undefined);
      addScoreWithExplanation("Authoritativeness", result.authoritativenessScore, result.authoritativenessExplanation || undefined);
      addScoreWithExplanation("Trustworthiness", result.trustworthinessScore, result.trustworthinessExplanation || undefined);
      
      // Check if we need a new page for Helpful Content
      if (yOffset > 230) {
        pdf.addPage();
        yOffset = 15;
      } else {
        yOffset += 10;
      }
      
      // Add Helpful Content scores section
      addSectionHeader("Helpful Content Evaluation");
      
      addScoreWithExplanation("User-First Content", result.userFirstScore, result.userFirstExplanation || undefined);
      addScoreWithExplanation("Depth & Value", result.depthValueScore, result.depthValueExplanation || undefined);
      addScoreWithExplanation("User Satisfaction", result.satisfactionScore, result.satisfactionExplanation || undefined);
      addScoreWithExplanation("Originality", result.originalityScore, result.originalityExplanation || undefined);
      
      // Check if we need a new page for detailed analysis
      if (yOffset > 220) {
        pdf.addPage();
        yOffset = 15;
      } else {
        yOffset += 10;
      }
      
      // Add detailed analysis section
      addSectionHeader("Detailed Analysis");
      
      // Add strengths
      pdf.setFontSize(11);
      pdf.setTextColor(66, 101, 64);
      pdf.text("Strengths:", 20, yOffset);
      yOffset += 6;
      
      pdf.setFontSize(9);
      pdf.setTextColor(33, 43, 54);
      
      // Ensure strengths is an array before proceeding
      const strengths = Array.isArray(result.strengths) ? result.strengths : [];
      for (let i = 0; i < strengths.length; i++) {
        const strength = String(strengths[i]); // Ensure item is a string
        const strengthLines = pdf.splitTextToSize(`- ${strength}`, 170);
        pdf.text(strengthLines, 20, yOffset);
        yOffset += (strengthLines.length * 4);
      }
      
      yOffset += 6;
      
      // Add improvements
      pdf.setFontSize(11);
      pdf.setTextColor(153, 102, 51);
      pdf.text("Areas for Improvement:", 20, yOffset);
      yOffset += 6;
      
      pdf.setFontSize(9);
      pdf.setTextColor(33, 43, 54);
      
      // Ensure improvements is an array before proceeding
      const improvements = Array.isArray(result.improvements) ? result.improvements : [];
      for (let i = 0; i < improvements.length; i++) {
        const improvement = String(improvements[i]); // Ensure item is a string
        const improvementLines = pdf.splitTextToSize(`- ${improvement}`, 170);
        pdf.text(improvementLines, 20, yOffset);
        yOffset += (improvementLines.length * 4);
        
        // Check if we need a new page within this section
        if (yOffset > 270 && i < improvements.length - 1) {
          pdf.addPage();
          yOffset = 15;
        }
      }
      
      yOffset += 6;
      
      // Check if we need a new page for recommendations
      if (yOffset > 250) {
        pdf.addPage();
        yOffset = 15;
      }
      
      // Add recommendations
      pdf.setFontSize(11);
      pdf.setTextColor(51, 102, 153);
      pdf.text("Specific Recommendations:", 20, yOffset);
      yOffset += 6;
      
      pdf.setFontSize(9);
      pdf.setTextColor(33, 43, 54);
      
      // Ensure recommendations is an array before proceeding
      const recommendations = Array.isArray(result.recommendations) ? result.recommendations : [];
      for (let i = 0; i < recommendations.length; i++) {
        const recommendation = String(recommendations[i]); // Ensure item is a string
        const recommendationLines = pdf.splitTextToSize(`- ${recommendation}`, 170);
        pdf.text(recommendationLines, 20, yOffset);
        yOffset += (recommendationLines.length * 4);
        
        // Check if we need a new page within this section
        if (yOffset > 270 && i < recommendations.length - 1) {
          pdf.addPage();
          yOffset = 15;
        }
      }
      
      // If keyword and title evaluation exist, add a new page for it
      if (result.keyword && result.title) {
        // Check if we need a new page
        if (yOffset > 200) {
          pdf.addPage();
          yOffset = 15;
        } else {
          yOffset += 10;
        }
        
        addSectionHeader("Meta Title Optimization");
        
        pdf.setFontSize(11);
        pdf.setTextColor(33, 43, 54);
        pdf.text(`Title: ${result.title}`, 20, yOffset);
        yOffset += 6;
        
        pdf.setFontSize(10);
        pdf.text(`Keyword: ${result.keyword}`, 20, yOffset);
        yOffset += 10;
        
        const keywordPresent = result.keywordInTitle === 1;
        const keywordAtBeginning = result.keywordAtBeginning === 1;
        
        pdf.setFontSize(9);
        if (keywordPresent) {
          pdf.setTextColor(0, 128, 0); // Green if present
        } else {
          pdf.setTextColor(200, 0, 0); // Red if not present
        }
        pdf.text(`✓ Keyword Present in Title: ${keywordPresent ? 'Yes' : 'No'}`, 20, yOffset);
        yOffset += 5;
        
        if (keywordAtBeginning) {
          pdf.setTextColor(0, 128, 0); // Green if at beginning
        } else {
          pdf.setTextColor(200, 0, 0); // Red if not at beginning
        }
        pdf.text(`✓ Keyword at Beginning: ${keywordAtBeginning ? 'Yes' : 'No'}`, 20, yOffset);
        yOffset += 10;
        
        pdf.setTextColor(33, 43, 54);
        pdf.text("Recommendations:", 20, yOffset);
        yOffset += 5;
        
        if (!keywordPresent) {
          pdf.text(`- Add the keyword "${result.keyword}" to your title`, 20, yOffset);
          yOffset += 5;
        }
        
        if (keywordPresent && !keywordAtBeginning) {
          pdf.text("- Move the keyword closer to the beginning of your title", 20, yOffset);
          yOffset += 5;
        }
        
        if (result.title.length < 50) {
          pdf.text("- Consider making your title longer (50-60 characters is ideal)", 20, yOffset);
          yOffset += 5;
        }
        
        if (result.title.length > 70) {
          pdf.text("- Your title might be too long for search results. Consider shortening it to under 70 characters", 20, yOffset);
          yOffset += 5;
        }
      }
      
      // If link analysis exists, add it
      if (result.totalLinks && result.totalLinks > 0) {
        // Check if we need a new page
        if (yOffset > 200) {
          pdf.addPage();
          yOffset = 15;
        } else {
          yOffset += 10;
        }
        
        addSectionHeader("Link Analysis");
        
        pdf.setFontSize(10);
        pdf.setTextColor(33, 43, 54);
        pdf.text(`Total Links: ${result.totalLinks}`, 20, yOffset);
        yOffset += 5;
        
        pdf.setTextColor(0, 128, 0);
        pdf.text(`Working Links: ${result.workingLinks || 0}`, 20, yOffset);
        yOffset += 5;
        
        pdf.setTextColor(200, 0, 0);
        pdf.text(`Broken Links: ${result.brokenLinks || 0}`, 20, yOffset);
        yOffset += 10;
        
        // Add tip
        pdf.setFontSize(9);
        pdf.setTextColor(33, 43, 54);
        pdf.text("Tip: Fix broken links to improve your content's trustworthiness and user experience.", 20, yOffset);
        yOffset += 4;
        pdf.text("Note: Some links may appear as errors but actually work - they just block automated checking.", 20, yOffset);
      }
      
      // Save the PDF with compression
      const pdfFileName = `content-evaluation-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(pdfFileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Remove loading toast
      document.body.removeChild(loadingToast);
    }
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
      <div ref={resultsRef}>
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
        
        {/* Link Check Analysis - only displayed if link check was performed */}
        {result.totalLinks && result.totalLinks > 0 && (
          <LinkCheckCard
            totalLinks={result.totalLinks}
            brokenLinks={result.brokenLinks || 0}
            workingLinks={result.workingLinks || 0}
            linkDetails={result.linkDetails as LinkStatus[] || []}
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
            Export JSON
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportPDF}
          >
            <FileText className="h-5 w-5" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={resetEvaluation}
          >
            <RefreshCw className="h-5 w-5" />
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