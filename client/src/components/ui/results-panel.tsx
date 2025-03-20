import { EvaluationState, LinkStatus } from "@/lib/types";
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
      });
      
      // Set PDF metadata
      pdf.setProperties({
        title: `Content Evaluation - ${result.title || 'Untitled'}`,
        subject: 'E-E-A-T and Helpful Content Evaluation',
        creator: 'Content Evaluation Tool',
        author: 'Content Evaluation Tool',
      });
      
      let yOffset = 15; // Starting position
      
      // ===== COVER PAGE =====
      // PDF title
      pdf.setFontSize(20);
      pdf.setTextColor(33, 43, 54);
      pdf.text('Content Evaluation Report', 105, yOffset, { align: 'center' });
      yOffset += 12;
      
      // Content title
      if (result.title) {
        pdf.setFontSize(14);
        pdf.setTextColor(66, 84, 102);
        const title = result.title.length > 50 ? result.title.substring(0, 47) + '...' : result.title;
        const titleLines = pdf.splitTextToSize(title, 150);
        pdf.text(titleLines, 105, yOffset, { align: 'center' });
        yOffset += 8 * titleLines.length;
      }
      
      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(`Generated on ${currentDate}`, 105, yOffset, { align: 'center' });
      yOffset += 10;
      
      // ===== SUMMARY SECTION =====
      // Add a score table
      yOffset += 5;
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(25, yOffset, 160, 22, 3, 3, 'F');
      
      pdf.setFontSize(14);
      pdf.setTextColor(33, 43, 54);
      pdf.text(`Overall Score: ${result.overallScore.toFixed(1)}/10`, 105, yOffset + 8, { align: 'center' });
      
      pdf.setFontSize(10);
      let scoreText;
      if (result.overallScore >= 8) {
        scoreText = "Excellent - Meets all E-E-A-T & Helpful Content guidelines";
      } else if (result.overallScore >= 6) {
        scoreText = "Good - Room for some improvements";
      } else {
        scoreText = "Needs significant improvement";
      }
      pdf.text(scoreText, 105, yOffset + 16, { align: 'center' });
      yOffset += 32;
      
      // ===== DETAILED SCORES =====
      // Create a compact score display table
      const tableX = 20;
      const tableWidth = 170;
      const colWidth = tableWidth / 4;
      
      // Table headers
      pdf.setFillColor(240, 242, 245);
      pdf.rect(tableX, yOffset, tableWidth, 8, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(66, 84, 102);
      pdf.text("E-E-A-T & Helpful Content Scores", tableX + 2, yOffset + 5);
      yOffset += 8;
      
      // Table rows
      const drawScoreRow = (label: string, score: number, color: string, y: number) => {
        pdf.setFontSize(9);
        pdf.setTextColor(66, 84, 102);
        pdf.text(label, tableX + 2, y + 5);
        
        // Score display
        pdf.setFontSize(9);
        pdf.setTextColor(33, 43, 54);
        pdf.text(score.toFixed(1), tableX + 80, y + 5, { align: 'center' });
      };
      
      // Draw score rows
      pdf.setDrawColor(220, 223, 228);
      pdf.line(tableX, yOffset, tableX + tableWidth, yOffset);
      
      // E-E-A-T Scores row
      const rowHeight = 7;
      drawScoreRow("Experience", result.experienceScore, "#4CAF50", yOffset);
      drawScoreRow("Expertise", result.expertiseScore, "#4CAF50", yOffset);
      pdf.line(tableX + 85, yOffset, tableX + 85, yOffset + rowHeight);
      drawScoreRow("Authoritativeness", result.authoritativenessScore, "#4CAF50", yOffset);
      drawScoreRow("Trustworthiness", result.trustworthinessScore, "#4CAF50", yOffset);
      yOffset += rowHeight;
      pdf.line(tableX, yOffset, tableX + tableWidth, yOffset);
      
      // Helpful Content Scores row
      drawScoreRow("User-First", result.userFirstScore, "#2196F3", yOffset);
      drawScoreRow("Depth/Value", result.depthValueScore, "#2196F3", yOffset);
      pdf.line(tableX + 85, yOffset, tableX + 85, yOffset + rowHeight);
      drawScoreRow("Satisfaction", result.satisfactionScore, "#2196F3", yOffset);
      drawScoreRow("Originality", result.originalityScore, "#2196F3", yOffset);
      yOffset += rowHeight;
      pdf.line(tableX, yOffset, tableX + tableWidth, yOffset);
      
      // Add border around table
      pdf.setLineWidth(0.1);
      pdf.rect(tableX, yOffset - rowHeight * 2, tableWidth, rowHeight * 2);
      pdf.line(tableX + 42.5, yOffset - rowHeight * 2, tableX + 42.5, yOffset);
      pdf.line(tableX + 127.5, yOffset - rowHeight * 2, tableX + 127.5, yOffset);
      
      yOffset += 15;
      
      // Add summary
      pdf.setFontSize(12);
      pdf.setTextColor(33, 43, 54);
      pdf.text("Content Summary", tableX, yOffset);
      yOffset += 8;
      
      pdf.setFontSize(9);
      pdf.setTextColor(66, 84, 102);
      const summaryLines = pdf.splitTextToSize(result.summary, 170);
      pdf.text(summaryLines, tableX, yOffset);
      yOffset += summaryLines.length * 4.5 + 10;
      
      // ===== STRENGTHS & IMPROVEMENTS =====
      // Section heading
      pdf.setFontSize(12);
      pdf.setTextColor(33, 43, 54);
      pdf.text("Key Strengths & Areas for Improvement", tableX, yOffset);
      yOffset += 8;
      
      // Strengths
      pdf.setFontSize(10);
      pdf.setTextColor(23, 118, 56); // Green
      pdf.text("Strengths:", tableX, yOffset);
      yOffset += 5;
      
      pdf.setFontSize(9);
      pdf.setTextColor(66, 84, 102);
      
      // Get top 3 strengths to save space
      const topStrengths = result.strengths?.slice(0, 3) || [];
      for (let i = 0; i < topStrengths.length; i++) {
        const strength = `• ${topStrengths[i]}`;
        const lines = pdf.splitTextToSize(strength, 160);
        pdf.text(lines, tableX, yOffset);
        yOffset += lines.length * 4;
      }
      
      yOffset += 5;
      
      // Areas for improvement
      pdf.setFontSize(10);
      pdf.setTextColor(198, 60, 43); // Red
      pdf.text("Areas for Improvement:", tableX, yOffset);
      yOffset += 5;
      
      pdf.setFontSize(9);
      pdf.setTextColor(66, 84, 102);
      
      // Get top 3 improvements to save space
      const topImprovements = result.improvements?.slice(0, 3) || [];
      for (let i = 0; i < topImprovements.length; i++) {
        const improvement = `• ${topImprovements[i]}`;
        const lines = pdf.splitTextToSize(improvement, 160);
        pdf.text(lines, tableX, yOffset);
        yOffset += lines.length * 4;
      }
      
      // If we're getting to the end of the page, start a new page
      if (yOffset > 270) {
        pdf.addPage();
        yOffset = 15;
      }
      
      // ===== RECOMMENDATIONS =====
      yOffset += 10;
      pdf.setFontSize(12);
      pdf.setTextColor(33, 43, 54);
      pdf.text("Specific Recommendations", tableX, yOffset);
      yOffset += 8;
      
      pdf.setFontSize(9);
      pdf.setTextColor(66, 84, 102);
      
      // Get top 3-4 recommendations to save space
      const topRecommendations = result.recommendations?.slice(0, 4) || [];
      for (let i = 0; i < topRecommendations.length; i++) {
        const recommendation = `${i+1}. ${topRecommendations[i]}`;
        const lines = pdf.splitTextToSize(recommendation, 160);
        pdf.text(lines, tableX, yOffset);
        yOffset += lines.length * 4;
      }
      
      yOffset += 10;
      
      // ===== ADDITIONAL DETAILS =====
      // Add meta title and link information if available
      if (result.keyword && result.title && result.keywordInTitle !== null) {
        if (yOffset > 240) {
          pdf.addPage();
          yOffset = 15;
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(33, 43, 54);
        pdf.text("Meta Title Analysis", tableX, yOffset);
        yOffset += 8;
        
        pdf.setFontSize(9);
        pdf.setDrawColor(220, 223, 228);
        pdf.setFillColor(245, 247, 250);
        pdf.roundedRect(tableX, yOffset, tableWidth, 25, 2, 2, 'F');
        
        pdf.setTextColor(66, 84, 102);
        pdf.text(`Title: ${result.title}`, tableX + 4, yOffset + 5);
        pdf.text(`Keyword: ${result.keyword}`, tableX + 4, yOffset + 10);
        
        const keywordStatus = result.keywordInTitle === 1 ? "Keyword present in title ✓" : "Keyword missing in title ✗";
        const keywordPosition = result.keywordAtBeginning === 1 ? "Keyword at beginning of title ✓" : "Keyword not at beginning ✗";
        
        pdf.text(keywordStatus, tableX + 4, yOffset + 15);
        pdf.text(keywordPosition, tableX + 4, yOffset + 20);
        
        yOffset += 35;
      }
      
      // ===== LINK ANALYSIS =====
      if (result.totalLinks && result.totalLinks > 0) {
        if (yOffset > 240) {
          pdf.addPage();
          yOffset = 15;
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(33, 43, 54);
        pdf.text("Link Analysis", tableX, yOffset);
        yOffset += 8;
        
        pdf.setFontSize(9);
        pdf.setDrawColor(220, 223, 228);
        pdf.setFillColor(245, 247, 250);
        pdf.roundedRect(tableX, yOffset, tableWidth, 20, 2, 2, 'F');
        
        pdf.setTextColor(66, 84, 102);
        pdf.text(`Total Links: ${result.totalLinks}`, tableX + 4, yOffset + 5);
        pdf.text(`Working Links: ${result.workingLinks || 0}`, tableX + 4, yOffset + 10);
        pdf.text(`Broken Links: ${result.brokenLinks || 0}`, tableX + 4, yOffset + 15);
        
        yOffset += 30;
      }
      
      // Footer with page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${totalPages}`, 105, 290, { align: 'center' });
        pdf.text('Generated by Content Evaluation Tool', 105, 295, { align: 'center' });
      }
      
      // Save the PDF
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