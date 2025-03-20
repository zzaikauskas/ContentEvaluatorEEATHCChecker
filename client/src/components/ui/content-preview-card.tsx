import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ContentPreviewCardProps {
  title: string | null;
  content: string;
}

const ContentPreviewCard = ({ title, content }: ContentPreviewCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleContent = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="card mb-6">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Content Preview</h2>
          <button
            type="button"
            className="text-primary text-sm font-medium hover:text-blue-600 focus:outline-none"
            onClick={toggleContent}
          >
            {isExpanded ? "Hide content" : "Show content"}
          </button>
        </div>
        
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? "max-h-96" : "max-h-0"
          }`}
        >
          <div className="p-4 bg-slate-50 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-medium mb-2">{title}</h3>
            <div className="font-serif text-neutral-700 space-y-3 whitespace-pre-wrap">
              {content.split('\n').map((paragraph, i) => 
                paragraph.trim() ? <p key={i}>{paragraph}</p> : null
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentPreviewCard;
