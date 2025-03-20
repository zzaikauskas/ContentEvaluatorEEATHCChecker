import { Card, CardContent } from "@/components/ui/card";
import { scoreThresholds } from "@shared/schema";

interface OverallScoreCardProps {
  score: number;
  summary: string;
  date: string;
}

const OverallScoreCard = ({ score, summary, date }: OverallScoreCardProps) => {
  // Get score color based on thresholds
  const getScoreColor = (score: number) => {
    if (score < scoreThresholds.low) return "text-red-500";
    if (score < scoreThresholds.medium) return "text-yellow-500";
    return "text-green-500";
  };

  // Get score text description
  const getScoreDescription = (score: number) => {
    if (score < scoreThresholds.low) return "Needs improvement";
    if (score < scoreThresholds.medium) return "Good - Room for improvement";
    return "Excellent";
  };

  // Calculate stroke dash array for circular progress
  const circumference = 2 * Math.PI * 15.9155;
  // Ensure score is capped at 10 for display calculations
  const normalizedScore = Math.min(10, score);
  const strokeDasharray = `${(normalizedScore / 10) * circumference}, ${circumference}`;

  // Get color for stroke based on score
  const getStrokeColor = (score: number) => {
    if (score < scoreThresholds.low) return "text-red-500";
    if (score < scoreThresholds.medium) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Overall Evaluation</h2>
          <span className="text-sm text-neutral-500">Analyzed {date}</span>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Overall Score */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <path
                  className="stroke-current text-slate-200"
                  strokeWidth="3.8"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`stroke-current ${getStrokeColor(score)}`}
                  strokeWidth="3.8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text
                  x="18"
                  y="21"
                  className={`fill-neutral-700 text-4xl font-bold ${getScoreColor(score)}`}
                  textAnchor="middle"
                >
                  {score.toFixed(1)}
                </text>
              </svg>
            </div>
            <div className="text-center mt-2">
              <p className="text-lg font-medium">Overall Score</p>
              <p className="text-sm text-neutral-500">{getScoreDescription(score)}</p>
            </div>
          </div>
          
          {/* Summary */}
          <div>
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-neutral-600 mb-4">{summary}</p>
            <div className="flex flex-wrap gap-2">
              {score >= scoreThresholds.medium && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Strong Content
                </span>
              )}
              {score < scoreThresholds.low && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Needs Work
                </span>
              )}
              {score >= scoreThresholds.low && score < scoreThresholds.medium && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Improve: Quality
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverallScoreCard;
