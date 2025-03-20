import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, FileText, Download } from "lucide-react";
import { ComparativeState, ComparativeResponse } from "@/lib/types";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { comparativeExplanations, scoreThresholds } from "@shared/schema";

interface ComparativeResultsPanelProps {
  comparativeState: ComparativeState;
  resetComparison: () => void;
}

// Format date to a readable string
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

// Get score color based on thresholds
const getScoreColor = (score: number): string => {
  if (score < scoreThresholds.low) return "text-red-500";
  if (score < scoreThresholds.medium) return "text-yellow-500";
  return "text-green-500";
};

// Create a score gauge component
const ScoreGauge = ({ score, maxScore = 10 }: { score: number, maxScore?: number }) => {
  const percentage = (score / maxScore) * 100;
  const color = getScoreColor(score);

  return (
    <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`absolute left-0 top-0 h-full rounded-full ${
          score < scoreThresholds.low
            ? "bg-red-500"
            : score < scoreThresholds.medium
            ? "bg-yellow-500"
            : "bg-green-500"
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const ComparativeResultsPanel = ({ comparativeState, resetComparison }: ComparativeResultsPanelProps) => {
  const { result, error } = comparativeState;

  // Type assertions for the arrays
  const strengths = result?.strengths as string[] | undefined;
  const weaknesses = result?.weaknesses as string[] | undefined;
  const recommendations = result?.recommendations as string[] | undefined;
  const analysisDetails = result?.analysisDetails as Record<string, string> | undefined;

  // Reference for the PDF export
  const resultsPanelRef = React.useRef<HTMLDivElement>(null);

  // Handle export to PDF
  const handleExportPdf = async () => {
    if (!resultsPanelRef.current || !result) return;

    try {
      // Create a new jsPDF instance
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Set fonts and colors for better PDF appearance
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      // Add title
      pdf.setFontSize(24);
      pdf.text("Comparative Content Analysis", 20, 20);

      // Add date
      pdf.setFontSize(12);
      pdf.text(`Generated: ${formatDate(new Date())}`, 20, 30);
      pdf.text(`Primary Article: ${result.primaryArticleTitle || "Untitled"}`, 20, 35);

      // Add summary
      pdf.setFontSize(14);
      pdf.text("Summary", 20, 45);
      pdf.setFontSize(10);
      
      // Split summary text to fit on page
      const splitSummary = pdf.splitTextToSize(result.summary, 170);
      pdf.text(splitSummary, 20, 50);

      // Add scores section
      let yPos = 50 + splitSummary.length * 5;
      if (yPos > 260) { // Check if we need a page break
        pdf.addPage();
        yPos = 20;
      }

      // Add scores
      pdf.setFontSize(14);
      pdf.text("Comparison Scores", 20, yPos);
      yPos += 10;

      // Information gain score
      pdf.setFontSize(12);
      pdf.text(`Information Gain: ${result.informationGainScore}/10`, 20, yPos);
      pdf.setFontSize(10);
      const splitInfoGain = pdf.splitTextToSize(
        comparativeExplanations.informationGain, 
        170
      );
      pdf.text(splitInfoGain, 30, yPos + 5);
      yPos += 15;

      // Unique insights score
      pdf.setFontSize(12);
      pdf.text(`Unique Insights: ${result.uniqueInsightsScore}/10`, 20, yPos);
      pdf.setFontSize(10);
      const splitUnique = pdf.splitTextToSize(
        comparativeExplanations.uniqueInsights, 
        170
      );
      pdf.text(splitUnique, 30, yPos + 5);
      yPos += 15;

      // Comprehensiveness score
      pdf.setFontSize(12);
      pdf.text(`Comprehensiveness: ${result.comprehensivenessScore}/10`, 20, yPos);
      pdf.setFontSize(10);
      const splitComp = pdf.splitTextToSize(
        comparativeExplanations.comprehensiveness, 
        170
      );
      pdf.text(splitComp, 30, yPos + 5);
      yPos += 15;

      // Recency score
      pdf.setFontSize(12);
      pdf.text(`Recency: ${result.recencyScore}/10`, 20, yPos);
      pdf.setFontSize(10);
      const splitRecency = pdf.splitTextToSize(
        comparativeExplanations.recency, 
        170
      );
      pdf.text(splitRecency, 30, yPos + 5);
      yPos += 15;

      // Source quality score
      pdf.setFontSize(12);
      pdf.text(`Source Quality: ${result.sourceQualityScore}/10`, 20, yPos);
      pdf.setFontSize(10);
      const splitSourceQuality = pdf.splitTextToSize(
        comparativeExplanations.sourceQuality, 
        170
      );
      pdf.text(splitSourceQuality, 30, yPos + 5);
      yPos += 20;

      // Check if we need a page break for strengths
      if (yPos > 220) {
        pdf.addPage();
        yPos = 20;
      }

      // Add strengths section
      pdf.setFontSize(14);
      pdf.text("Strengths", 20, yPos);
      yPos += 10;
      pdf.setFontSize(10);

      // Add each strength bullet point
      if (strengths && strengths.length > 0) {
        strengths.forEach((strength, index) => {
          const splitStrength = pdf.splitTextToSize(`• ${strength}`, 170);
          pdf.text(splitStrength, 25, yPos);
          yPos += splitStrength.length * 5 + 5;
          
          // Add a page break if needed
          if (yPos > 270 && index < strengths.length - 1) {
            pdf.addPage();
            yPos = 20;
          }
        });
      }

      // Check if we need a page break for weaknesses
      if (yPos > 220) {
        pdf.addPage();
        yPos = 20;
      }

      // Add weaknesses section
      pdf.setFontSize(14);
      pdf.text("Areas for Improvement", 20, yPos);
      yPos += 10;
      pdf.setFontSize(10);

      // Add each weakness bullet point
      if (weaknesses && weaknesses.length > 0) {
        weaknesses.forEach((weakness, index) => {
          const splitWeakness = pdf.splitTextToSize(`• ${weakness}`, 170);
          pdf.text(splitWeakness, 25, yPos);
          yPos += splitWeakness.length * 5 + 5;
          
          // Add a page break if needed
          if (yPos > 270 && index < weaknesses.length - 1) {
            pdf.addPage();
            yPos = 20;
          }
        });
      }

      // Check if we need a page break for recommendations
      if (yPos > 220) {
        pdf.addPage();
        yPos = 20;
      }

      // Add recommendations section
      pdf.setFontSize(14);
      pdf.text("Recommendations", 20, yPos);
      yPos += 10;
      pdf.setFontSize(10);

      // Add each recommendation bullet point
      if (recommendations && recommendations.length > 0) {
        recommendations.forEach((recommendation, index) => {
          const splitRecommendation = pdf.splitTextToSize(`• ${recommendation}`, 170);
          pdf.text(splitRecommendation, 25, yPos);
          yPos += splitRecommendation.length * 5 + 5;
          
          // Add a page break if needed
          if (yPos > 270 && index < recommendations.length - 1) {
            pdf.addPage();
            yPos = 20;
          }
        });
      }

      // Save the PDF
      pdf.save(`comparative-analysis-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  // Handle export to JSON
  const handleExportJson = () => {
    if (!result) return;

    try {
      // Create a Blob with the JSON data
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: "application/json",
      });

      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `comparative-analysis-${new Date().toISOString().slice(0, 10)}.json`;

      // Append the link to the document
      document.body.appendChild(link);

      // Click the link to start the download
      link.click();

      // Remove the link
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting JSON:", error);
    }
  };

  // If there's an error, display it
  if (error) {
    return (
      <Card className="mt-8 border-red-300">
        <CardHeader className="bg-red-50">
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-red-700">{error}</p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={resetComparison} variant="outline">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // If there's no result yet, return null
  if (!result) return null;

  return (
    <div className="mt-8 space-y-6" ref={resultsPanelRef}>
      {/* Overall Results Card */}
      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Comparative Analysis</CardTitle>
              <CardDescription>
                {formatDate(new Date(result.createdAt))}
              </CardDescription>
            </div>
            <Badge 
              className="text-lg font-semibold px-3 py-1"
              variant="outline"
            >
              Comparative
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Primary Article</h3>
              <p className="text-zinc-700">{result.primaryArticleTitle || "Untitled content"}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Overall Comparison</h3>
              <p className="text-zinc-700">{result.overallComparison}</p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Summary</h3>
              <p className="text-zinc-700">{result.summary}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              className="flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetComparison}
          >
            New Analysis
          </Button>
        </CardFooter>
      </Card>

      {/* Comparative Scores Card */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Comparison Scores</CardTitle>
          <CardDescription>
            How your article compares to competitors across key metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Information Gain Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Information Gain</h3>
              <span className={`font-bold ${getScoreColor(result.informationGainScore)}`}>
                {result.informationGainScore}/10
              </span>
            </div>
            <ScoreGauge score={result.informationGainScore} />
            <p className="text-sm text-zinc-600">
              {comparativeExplanations.informationGain}
            </p>
          </div>

          {/* Unique Insights Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Unique Insights</h3>
              <span className={`font-bold ${getScoreColor(result.uniqueInsightsScore)}`}>
                {result.uniqueInsightsScore}/10
              </span>
            </div>
            <ScoreGauge score={result.uniqueInsightsScore} />
            <p className="text-sm text-zinc-600">
              {comparativeExplanations.uniqueInsights}
            </p>
          </div>

          {/* Comprehensiveness Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Comprehensiveness</h3>
              <span className={`font-bold ${getScoreColor(result.comprehensivenessScore)}`}>
                {result.comprehensivenessScore}/10
              </span>
            </div>
            <ScoreGauge score={result.comprehensivenessScore} />
            <p className="text-sm text-zinc-600">
              {comparativeExplanations.comprehensiveness}
            </p>
          </div>

          {/* Recency Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Recency</h3>
              <span className={`font-bold ${getScoreColor(result.recencyScore)}`}>
                {result.recencyScore}/10
              </span>
            </div>
            <ScoreGauge score={result.recencyScore} />
            <p className="text-sm text-zinc-600">
              {comparativeExplanations.recency}
            </p>
          </div>

          {/* Source Quality Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Source Quality</h3>
              <span className={`font-bold ${getScoreColor(result.sourceQualityScore)}`}>
                {result.sourceQualityScore}/10
              </span>
            </div>
            <ScoreGauge score={result.sourceQualityScore} />
            <p className="text-sm text-zinc-600">
              {comparativeExplanations.sourceQuality}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Card */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Detailed Analysis</CardTitle>
          <CardDescription>
            Strengths, weaknesses, and recommendations compared to competitors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Accordion type="single" collapsible className="w-full">
            {/* Strengths */}
            <AccordionItem value="strengths">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Strengths vs. Competitors</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <ul className="space-y-2 pl-7 list-disc">
                  {strengths && strengths.map((strength, index) => (
                    <li key={index} className="text-zinc-700">{strength}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Weaknesses */}
            <AccordionItem value="weaknesses">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Areas for Improvement</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <ul className="space-y-2 pl-7 list-disc">
                  {weaknesses && weaknesses.map((weakness, index) => (
                    <li key={index} className="text-zinc-700">{weakness}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            {/* Recommendations */}
            <AccordionItem value="recommendations">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 text-blue-700">
                  <FileText className="h-5 w-5" />
                  <span className="font-semibold">Recommendations</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <ul className="space-y-2 pl-7 list-disc">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-zinc-700">{recommendation}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Analysis Details Card */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Analysis Details</CardTitle>
          <CardDescription>
            Detailed breakdown of the comparative analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(result.analysisDetails).map(([topic, details], index) => (
              <AccordionItem key={index} value={`details-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-medium">{topic}</span>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <p className="text-zinc-700">{details}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparativeResultsPanel;