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
}

const EEATScoreCard = ({
  experienceScore,
  expertiseScore,
  authoritativenessScore,
  trustworthinessScore,
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
          <p className="text-xs text-neutral-500">
            {eatExplanations.experience}
          </p>
        </div>
        
        {/* Expertise Score */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Expertise</span>
            <span className="text-sm font-medium">{expertiseScore.toFixed(1)}/10</span>
          </div>
          <ScoreGauge score={expertiseScore} />
          <p className="text-xs text-neutral-500">
            {eatExplanations.expertise}
          </p>
        </div>
        
        {/* Authoritativeness Score */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Authoritativeness</span>
            <span className="text-sm font-medium">{authoritativenessScore.toFixed(1)}/10</span>
          </div>
          <ScoreGauge score={authoritativenessScore} />
          <p className="text-xs text-neutral-500">
            {eatExplanations.authoritativeness}
          </p>
        </div>
        
        {/* Trustworthiness Score */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Trustworthiness</span>
            <span className="text-sm font-medium">{trustworthinessScore.toFixed(1)}/10</span>
          </div>
          <ScoreGauge score={trustworthinessScore} />
          <p className="text-xs text-neutral-500">
            {eatExplanations.trustworthiness}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EEATScoreCard;
