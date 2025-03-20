import { Card, CardContent } from "@/components/ui/card";
import { scoreThresholds, helpfulContentExplanations } from "@shared/schema";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
}

const ScoreGauge = ({ score, maxScore = 10 }: ScoreGaugeProps) => {
  const percentage = (score / maxScore) * 100;
  
  // Get color based on score
  const getColor = (score: number) => {
    if (score < scoreThresholds.low) return "bg-red-500";
    if (score < scoreThresholds.medium) return "bg-yellow-400";
    return "bg-green-500";
  };
  
  return (
    <div className="score-gauge mb-1 relative h-2.5 rounded-full bg-slate-200 overflow-hidden">
      <div 
        className={`absolute h-full rounded-full transition-width duration-500 ease-in-out ${getColor(score)}`} 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

interface HelpfulContentCardProps {
  userFirstScore: number;
  depthValueScore: number;
  satisfactionScore: number;
  originalityScore: number;
  userFirstExplanation?: string;
  depthValueExplanation?: string;
  satisfactionExplanation?: string;
  originalityExplanation?: string;
}

const HelpfulContentCard = ({
  userFirstScore,
  depthValueScore,
  satisfactionScore,
  originalityScore,
  userFirstExplanation,
  depthValueExplanation,
  satisfactionExplanation,
  originalityExplanation,
}: HelpfulContentCardProps) => {
  return (
    <Card className="card">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Helpful Content Evaluation</h2>
        
        {/* User-First Content Score */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">User-First Content</span>
            <span className="text-sm font-medium">{userFirstScore.toFixed(1)}/10</span>
          </div>
          <ScoreGauge score={userFirstScore} />
          <div className="mt-2">
            <p className="text-xs text-neutral-500 mb-1">
              <span className="font-medium text-neutral-600">Definition:</span> {helpfulContentExplanations.userFirst}
            </p>
            {userFirstExplanation && (
              <div className="bg-slate-50 p-2 rounded-md mt-1">
                <p className="text-xs text-neutral-700">
                  <span className="font-medium">Analysis:</span> {userFirstExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Depth & Value Score */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Depth & Value</span>
            <span className="text-sm font-medium">{depthValueScore.toFixed(1)}/10</span>
          </div>
          <ScoreGauge score={depthValueScore} />
          <div className="mt-2">
            <p className="text-xs text-neutral-500 mb-1">
              <span className="font-medium text-neutral-600">Definition:</span> {helpfulContentExplanations.depthValue}
            </p>
            {depthValueExplanation && (
              <div className="bg-slate-50 p-2 rounded-md mt-1">
                <p className="text-xs text-neutral-700">
                  <span className="font-medium">Analysis:</span> {depthValueExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Satisfaction Score */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">User Satisfaction</span>
            <span className="text-sm font-medium">{satisfactionScore.toFixed(1)}/10</span>
          </div>
          <ScoreGauge score={satisfactionScore} />
          <div className="mt-2">
            <p className="text-xs text-neutral-500 mb-1">
              <span className="font-medium text-neutral-600">Definition:</span> {helpfulContentExplanations.satisfaction}
            </p>
            {satisfactionExplanation && (
              <div className="bg-slate-50 p-2 rounded-md mt-1">
                <p className="text-xs text-neutral-700">
                  <span className="font-medium">Analysis:</span> {satisfactionExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Originality Score */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Originality</span>
            <span className="text-sm font-medium">{originalityScore.toFixed(1)}/10</span>
          </div>
          <ScoreGauge score={originalityScore} />
          <div className="mt-2">
            <p className="text-xs text-neutral-500 mb-1">
              <span className="font-medium text-neutral-600">Definition:</span> {helpfulContentExplanations.originality}
            </p>
            {originalityExplanation && (
              <div className="bg-slate-50 p-2 rounded-md mt-1">
                <p className="text-xs text-neutral-700">
                  <span className="font-medium">Analysis:</span> {originalityExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelpfulContentCard;
