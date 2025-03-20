import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

interface MetaTitleCardProps {
  title?: string;
  keyword?: string;
  keywordInTitle: number | null;
  keywordAtBeginning: number | null;
}

const MetaTitleCard = ({ 
  title, 
  keyword, 
  keywordInTitle,
  keywordAtBeginning 
}: MetaTitleCardProps) => {
  
  // Don't render the card if no title or keyword
  if (!title || !keyword) {
    return null;
  }
  
  // Calculate the position of the keyword in the title (if present)
  const keywordPosition = title.toLowerCase().indexOf(keyword.toLowerCase());
  const isAtBeginning = keywordPosition <= 10; // Consider "at beginning" if within first 10 chars
  
  return (
    <Card className="card mb-6">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">Meta Title Optimization</h2>
        
        <div className="mb-4 p-3 bg-slate-50 rounded-md">
          <h3 className="text-sm font-medium text-slate-700 mb-1">Title Preview</h3>
          <p className="text-base font-medium text-primary">{title}</p>
          <p className="text-xs text-slate-500 mt-1">Length: {title.length} characters {title.length > 60 ? '(optimal)' : '(consider making longer)'}</p>
        </div>
        
        <div className="mb-4 p-3 bg-slate-50 rounded-md">
          <h3 className="text-sm font-medium text-slate-700 mb-1">Keyword</h3>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {keyword}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            {keywordInTitle === 1 ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="text-sm font-medium">Keyword Present in Title</h3>
              {keywordInTitle === 1 ? (
                <p className="text-xs text-slate-600">Great! Your title contains the main keyword, which helps with SEO.</p>
              ) : (
                <p className="text-xs text-slate-600">Your title does not contain the exact keyword. Consider adding it to improve SEO.</p>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            {keywordAtBeginning === 1 ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="text-sm font-medium">Keyword at Beginning</h3>
              {keywordAtBeginning === 1 ? (
                <p className="text-xs text-slate-600">Perfect! Your keyword appears near the beginning of the title, which gives it more weight.</p>
              ) : (
                <p className="text-xs text-slate-600">Your keyword isn't at the beginning of the title. Keywords placed early have more SEO impact.</p>
              )}
            </div>
          </div>
          
          {keywordInTitle === 1 && (
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 flex-shrink-0 mt-0.5" /> {/* Spacer to align with other items */}
              <div>
                <h3 className="text-sm font-medium">Keyword Position</h3>
                <p className="text-xs text-slate-600">
                  Found at position {keywordPosition + 1}
                  {isAtBeginning 
                    ? ' (optimal position near the beginning)' 
                    : ' (consider moving closer to the beginning of the title)'}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-5 border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Recommendations</h3>
          <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
            {keywordInTitle !== 1 && (
              <li>Add the keyword "{keyword}" to your title</li>
            )}
            {keywordInTitle === 1 && !isAtBeginning && (
              <li>Move the keyword closer to the beginning of your title</li>
            )}
            {title.length < 50 && (
              <li>Consider making your title longer (50-60 characters is ideal)</li>
            )}
            {title.length > 70 && (
              <li>Your title might be too long for search results. Consider shortening it to under 70 characters</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetaTitleCard;