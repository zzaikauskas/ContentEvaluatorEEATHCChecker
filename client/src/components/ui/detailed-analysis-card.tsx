import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface DetailedAnalysisCardProps {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

const DetailedAnalysisCard = ({
  strengths,
  improvements,
  recommendations,
}: DetailedAnalysisCardProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Detailed Analysis</h2>
        
        {/* Strengths */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-green-700 mb-3 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Strengths
          </h3>
          <ul className="space-y-2 pl-7 list-disc text-neutral-600">
            {strengths.map((strength, index) => (
              <li key={`strength-${index}`}>{strength}</li>
            ))}
          </ul>
        </div>
        
        {/* Areas for Improvement */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-yellow-700 mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Areas for Improvement
          </h3>
          <ul className="space-y-2 pl-7 list-disc text-neutral-600">
            {improvements.map((improvement, index) => (
              <li key={`improvement-${index}`}>{improvement}</li>
            ))}
          </ul>
        </div>
        
        {/* Specific Recommendations */}
        <div>
          <h3 className="text-md font-medium text-blue-700 mb-3 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Specific Recommendations
          </h3>
          <ul className="space-y-2 pl-7 list-disc text-neutral-600">
            {recommendations.map((recommendation, index) => (
              <li key={`recommendation-${index}`}>{recommendation}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailedAnalysisCard;
