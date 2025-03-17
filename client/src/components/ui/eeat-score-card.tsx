import { Card, CardContent } from "@/components/ui/card";
import { scoreThresholds, eatExplanations } from "@shared/schema";

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

interface EEATScoreCardProps {
  experienceScore: number;
  expertiseScore: number;
  authoritativenessScore: number;
  trustworthinessScore: number;
  experienceExplanation?: string;
  expertiseExplanation?: string;
  authoritativenessExplanation?: string;
  trustworthinessExplanation?: string;
}

const EEATScoreCard = ({
  experienceScore,
  expertiseScore,
  authoritativenessScore,
  trustworthinessScore,
  experienceExplanation,
  expertiseExplanation,
  authoritativenessExplanation,
  trustworthinessExplanation,
}: EEATScoreCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">E-E-A-T Evaluation</h2>
        
        {/* Experience Score */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Experience</span>
            <span className="text-sm font-medium">{experienceScore.toFixed(1)}/10</span>
          </div>
          <ScoreGauge score={experienceScore} />
          <div className="mt-2">
            <p className="text-xs text-neutral-500 mb-1">
              <span className="font-medium text-neutral-600">Definition:</span> {eatExplanations.experience}
            </p>
            {experienceExplanation && (
              <div className="bg-slate-50 p-2 rounded-md mt-1">
                <p className="text-xs text-neutral-700">
                  <span className="font-medium">Analysis:</span> {experienceExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Expertise Score */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Expertise</span>
            <span className="text-sm font-medium">{expertiseScore.toFixed(1)}/10</span>
          </div>
          <ScoreGauge score={expertiseScore} />
          <div className="mt-2">
            <p className="text-xs text-neutral-500 mb-1">
              <span className="font-medium text-neutral-600">Definition:</span> {eatExplanations.expertise}
            </p>
            {expertiseExplanation && (
              <div className="bg-slate-50 p-2 rounded-md mt-1">
                <p className="text-xs text-neutral-700">
                  <span className="font-medium">Analysis:</span> {expertiseExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Authoritativeness Score */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Authoritativeness</span>
            <span className="text-sm font-medium">{authoritativenessScore.toFixed(1)}/10</span>
          </div>
          <ScoreGauge score={authoritativenessScore} />
          <div className="mt-2">
            <p className="text-xs text-neutral-500 mb-1">
              <span className="font-medium text-neutral-600">Definition:</span> {eatExplanations.authoritativeness}
            </p>
            {authoritativenessExplanation && (
              <div className="bg-slate-50 p-2 rounded-md mt-1">
                <p className="text-xs text-neutral-700">
                  <span className="font-medium">Analysis:</span> {authoritativenessExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Trustworthiness Score */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Trustworthiness</span>
            <span className="text-sm font-medium">{trustworthinessScore.toFixed(1)}/10</span>
          </div>
          <ScoreGauge score={trustworthinessScore} />
          <div className="mt-2">
            <p className="text-xs text-neutral-500 mb-1">
              <span className="font-medium text-neutral-600">Definition:</span> {eatExplanations.trustworthiness}
            </p>
            {trustworthinessExplanation && (
              <div className="bg-slate-50 p-2 rounded-md mt-1">
                <p className="text-xs text-neutral-700">
                  <span className="font-medium">Analysis:</span> {trustworthinessExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EEATScoreCard;
