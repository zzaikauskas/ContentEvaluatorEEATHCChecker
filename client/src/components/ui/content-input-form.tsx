import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { InputTabs } from "@/components/ui/input-tabs";
import { EvaluationState, InputTab } from "@/lib/types";
import { eatExplanations, helpfulContentExplanations } from "@shared/schema";

interface ContentInputFormProps {
  setEvaluationState: React.Dispatch<React.SetStateAction<EvaluationState>>;
  isLoading: boolean;
}

const ContentInputForm = ({ setEvaluationState, isLoading }: ContentInputFormProps) => {
  const [activeTab, setActiveTab] = useState<InputTab>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [url, setUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [eatInfoExpanded, setEatInfoExpanded] = useState(false);
  const [helpfulInfoExpanded, setHelpfulInfoExpanded] = useState(false);
  
  const { toast } = useToast();

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    setCharCount(text.length);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size should be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setCharCount(text.length);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (activeTab === "text" && !content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter some content to evaluate.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "file" && !content.trim()) {
      toast({
        title: "File required",
        description: "Please upload a file to evaluate.",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === "url" && !url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a URL to evaluate.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter your OpenAI API key.",
        variant: "destructive",
      });
      return;
    }

    // Set loading state
    setEvaluationState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Currently only supporting direct text input
      // URL and file handling would require additional server-side processing
      const requestData = {
        content,
        title: title || undefined,
        apiKey,
      };

      const response = await apiRequest("POST", "/api/evaluate", requestData);
      const result = await response.json();

      setEvaluationState({
        isLoading: false,
        result,
        error: null,
      });
    } catch (error) {
      console.error("Error evaluating content:", error);
      setEvaluationState({
        isLoading: false,
        result: null,
        error: error instanceof Error ? error.message : "Failed to evaluate content",
      });

      toast({
        title: "Evaluation failed",
        description: error instanceof Error ? error.message : "Failed to evaluate content",
        variant: "destructive",
      });
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Content Input</h2>
        
        {/* Input Tabs */}
        <InputTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Input Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="content-title" className="block text-sm font-medium text-neutral-600 mb-1">
              Content Title (Optional)
            </label>
            <Input
              id="content-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
              placeholder="Enter content title"
            />
          </div>
          
          {/* Text Input Tab Content */}
          {activeTab === "text" && (
            <div className="mb-4">
              <label htmlFor="content-text" className="block text-sm font-medium text-neutral-600 mb-1">
                Content Text <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="content-text"
                rows={12}
                className="w-full resize-none"
                placeholder="Paste your content here for evaluation..."
                value={content}
                onChange={handleContentChange}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-neutral-500">{charCount} characters</span>
                <span className="text-xs text-neutral-500">Recommended: 300+ characters</span>
              </div>
            </div>
          )}
          
          {/* File Upload Tab Content */}
          {activeTab === "file" && (
            <div className="mb-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mx-auto text-neutral-400 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-neutral-600 mb-2">Drop your file here or</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".txt,.docx,.pdf"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  onClick={handleBrowseFiles}
                  className="inline-flex items-center"
                >
                  Browse files
                </Button>
                <p className="text-xs text-neutral-500 mt-2">
                  Supported formats: .txt, .docx, .pdf (Max 5MB)
                </p>
              </div>
            </div>
          )}
          
          {/* URL Tab Content */}
          {activeTab === "url" && (
            <div className="mb-4">
              <label htmlFor="content-url" className="block text-sm font-medium text-neutral-600 mb-1">
                Content URL <span className="text-red-500">*</span>
              </label>
              <Input
                type="url"
                id="content-url"
                className="w-full"
                placeholder="https://example.com/your-content"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-neutral-500 mt-1">
                We'll extract and evaluate the main content from this URL
              </p>
            </div>
          )}
          
          {/* OpenAI API Key */}
          <div className="mb-6">
            <label htmlFor="api-key" className="block text-sm font-medium text-neutral-600 mb-1">
              OpenAI API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                id="api-key"
                className="w-full pr-10"
                placeholder="Enter your OpenAI API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 text-neutral-500 hover:text-neutral-700"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Your API key is never stored on our servers
            </p>
          </div>
          
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Evaluating..." : "Evaluate Content"}
          </Button>
        </form>
        
        {/* Info Section */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-sm text-neutral-700 mb-2">What is E-E-A-T?</h3>
          <p className="text-sm text-neutral-600 mb-2">
            E-E-A-T stands for Experience, Expertise, Authoritativeness, and Trustworthiness. 
            It's a framework Google uses to evaluate content quality.
          </p>
          <button
            type="button"
            className="text-primary text-sm font-medium hover:text-blue-600 focus:outline-none"
            onClick={() => setEatInfoExpanded(!eatInfoExpanded)}
          >
            {eatInfoExpanded ? "Less about E-E-A-T" : "Learn more about E-E-A-T"}
          </button>
          <div className={`mt-2 overflow-hidden transition-all duration-300 ${eatInfoExpanded ? "max-h-96" : "max-h-0"}`}>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-sm text-neutral-600">
              <p className="mb-2"><strong>Experience:</strong> {eatExplanations.experience}</p>
              <p className="mb-2"><strong>Expertise:</strong> {eatExplanations.expertise}</p>
              <p className="mb-2"><strong>Authoritativeness:</strong> {eatExplanations.authoritativeness}</p>
              <p><strong>Trustworthiness:</strong> {eatExplanations.trustworthiness}</p>
            </div>
          </div>
          
          <h3 className="font-medium text-sm text-neutral-700 mt-4 mb-2">What is Helpful Content?</h3>
          <p className="text-sm text-neutral-600 mb-2">
            Google's Helpful Content system aims to reward content that provides a satisfying experience 
            and demonstrates real value to users.
          </p>
          <button
            type="button"
            className="text-primary text-sm font-medium hover:text-blue-600 focus:outline-none"
            onClick={() => setHelpfulInfoExpanded(!helpfulInfoExpanded)}
          >
            {helpfulInfoExpanded ? "Less about Helpful Content" : "Learn more about Helpful Content"}
          </button>
          <div className={`mt-2 overflow-hidden transition-all duration-300 ${helpfulInfoExpanded ? "max-h-96" : "max-h-0"}`}>
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-sm text-neutral-600">
              <p className="mb-2">Helpful content should:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Be created primarily for people, not search engines</li>
                <li>Demonstrate first-hand expertise and depth of knowledge</li>
                <li>Have a clear purpose or focus</li>
                <li>Leave readers feeling they've learned enough about a topic</li>
                <li>Avoid simply summarizing what others have said without adding value</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentInputForm;
