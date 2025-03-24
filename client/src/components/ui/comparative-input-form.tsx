import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ComparativeState, CompetingArticle, ComparativeResponse } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ComparativeInputFormProps {
  setComparativeState: React.Dispatch<React.SetStateAction<ComparativeState>>;
  isLoading: boolean;
}

const ComparativeInputForm = ({ setComparativeState, isLoading }: ComparativeInputFormProps) => {
  const [primaryTitle, setPrimaryTitle] = useState<string>("");
  const [primaryContent, setPrimaryContent] = useState<string>("");
  const [primaryCharCount, setPrimaryCharCount] = useState<number>(0);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const primaryFileInputRef = useRef<HTMLInputElement>(null);
  
  const [competingArticles, setCompetingArticles] = useState<CompetingArticle[]>([
    { title: "", content: "" } // Start with one empty competing article
  ]);
  
  // Array of competing file input refs
  const competingFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { toast } = useToast();

  // Function to extract title from content
  const extractTitleFromContent = (text: string): string | null => {
    if (!text.trim()) return null;

    // Look for text between "Meta Title:" and "Meta Description:" - prioritize this pattern
    const titlePos = text.search(/Meta\s+[tT]itle\s*:/i);
    let metaTitleDescExtracted: string | null = null;
    
    if (titlePos !== -1) {
      // Get text after "Meta Title:"
      const afterTitleText = text.substring(titlePos);
      const titleColonPos = afterTitleText.search(/:/i);
      
      if (titleColonPos !== -1) {
        // Find where the description starts
        const descPos = afterTitleText.search(/Meta\s+[dD]escription\s*:/i);
        
        // If description is found, extract the text between title and description
        if (descPos !== -1) {
          // Look for a line break before Meta Description to better isolate just the title
          let titleEndMarker = descPos;
          const lineBreakBeforeDesc = afterTitleText.substring(titleColonPos + 1, descPos).search(/[\r\n]/);
          
          if (lineBreakBeforeDesc !== -1) {
            // Use the line break as the end of the title
            titleEndMarker = titleColonPos + 1 + lineBreakBeforeDesc;
          }
          
          // Extract the title text
          metaTitleDescExtracted = afterTitleText
            .substring(titleColonPos + 1, titleEndMarker)
            .trim();
        }
      }
    }
    
    // Use the manually extracted text between Meta Title and Meta Description
    if (metaTitleDescExtracted) {
      const title = metaTitleDescExtracted.replace(/["'\r\n]+$/, '').trim();
      if (title.length > 5 && title.length < 200) {
        return title;
      }
    }
    
    // Other fallback title detection methods
    const metaTitleColonPattern = /Meta\s+[tT]itle\s*:([^.!?\r\n]+)/i;
    const metaTitleColonMatch = text.match(metaTitleColonPattern);
    
    if (metaTitleColonMatch && metaTitleColonMatch[1]) {
      const title = metaTitleColonMatch[1].trim().replace(/["'\r\n]+$/, '').trim();
      if (title.length > 5 && title.length < 200) {
        return title;
      }
    }
    
    // Try the first line if it's a reasonable title length
    const firstLineMatch = text.match(/^\s*([^\r\n]{10,100})/);
    if (firstLineMatch && firstLineMatch[1]) {
      return firstLineMatch[1].trim();
    }
    
    return null;
  };

  // Handle primary file selection
  const handlePrimaryFileSelection = () => {
    primaryFileInputRef.current?.click();
  };

  // Handle competing file selection
  const handleCompetingFileSelection = (index: number) => {
    if (competingFileInputRefs.current[index]) {
      competingFileInputRefs.current[index]?.click();
    }
  };

  // Handle file upload for primary article
  const handlePrimaryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      // Create FormData object to send file
      const formData = new FormData();
      formData.append("file", file);

      // Set loading state
      setComparativeState(prev => ({ ...prev, isLoading: true, error: null }));

      // Show processing toast
      toast({
        title: `Processing ${file.name}`,
        description: "Extracting content and metadata...",
        duration: 5000,
      });

      // Upload file for parsing
      const result = await fetch("/api/parse-document", {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.message || "Error parsing document");
      }

      const data = await result.json();
      
      // Update form with parsed content
      setPrimaryContent(data.text || "");
      setPrimaryCharCount(data.text.length);
      
      // Try to extract title if not provided by server
      if (data.title) {
        setPrimaryTitle(data.title);
      } else {
        const extractedTitle = extractTitleFromContent(data.text);
        if (extractedTitle) {
          setPrimaryTitle(extractedTitle);
          toast({
            title: "Title extracted",
            description: "A potential title has been identified from your document content.",
            duration: 3000,
          });
        }
      }

      toast({
        title: "Document processed successfully",
        description: `${file.name} has been processed (${Math.round(data.text.length / 1000)}K characters)`,
      });
    } catch (error) {
      toast({
        title: "Error processing document",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setComparativeState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle competing article file upload
  const handleCompetingFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
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

    try {
      // Create FormData object to send file
      const formData = new FormData();
      formData.append("file", file);

      // Set loading state
      setComparativeState(prev => ({ ...prev, isLoading: true, error: null }));

      // Show processing toast
      toast({
        title: `Processing ${file.name}`,
        description: "Extracting content and metadata...",
        duration: 5000,
      });

      // Upload file for parsing
      const result = await fetch("/api/parse-document", {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.message || "Error parsing document");
      }

      const data = await result.json();
      
      // Extract title if not provided
      let title = data.title || "";
      if (!title) {
        const extractedTitle = extractTitleFromContent(data.text);
        if (extractedTitle) {
          title = extractedTitle;
          toast({
            title: "Title extracted",
            description: "A potential title has been identified from your document content.",
            duration: 3000,
          });
        }
      }
      
      // Update competing article with parsed content
      const updatedArticles = [...competingArticles];
      updatedArticles[index] = {
        title: title || updatedArticles[index].title || "",
        content: data.text || ""
      };
      setCompetingArticles(updatedArticles);

      toast({
        title: "Document processed successfully",
        description: `${file.name} has been processed (${Math.round(data.text.length / 1000)}K characters)`,
      });
    } catch (error) {
      toast({
        title: "Error processing document",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setComparativeState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!primaryContent) {
      toast({
        title: "Error",
        description: "Primary article content is required. Please upload a file.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "Error",
        description: "OpenAI API key is required",
        variant: "destructive",
      });
      return;
    }

    // Validate competing articles
    const validCompetingArticles = competingArticles.filter(article => article.content.trim() !== "");
    if (validCompetingArticles.length === 0) {
      toast({
        title: "Error",
        description: "At least one competing article with content is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Set loading state
      setComparativeState({
        isLoading: true,
        result: null,
        error: null,
      });

      // Prepare request data
      const requestData = {
        primaryArticle: {
          title: primaryTitle,
          content: primaryContent,
        },
        competingArticles: validCompetingArticles,
        apiKey,
      };

      // Send request to the server
      const result = await apiRequest<ComparativeResponse>("/api/compare", {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      // Update state with results
      setComparativeState({
        isLoading: false,
        result,
        error: null,
      });

      toast({
        title: "Analysis complete",
        description: "The comparative analysis has been completed successfully",
      });
    } catch (error) {
      setComparativeState({
        isLoading: false,
        result: null,
        error: error instanceof Error ? error.message : "Failed to complete analysis",
      });

      toast({
        title: "Analysis error",
        description: error instanceof Error ? error.message : "Failed to complete analysis",
        variant: "destructive",
      });
    }
  };

  // Add a new competing article
  const addCompetingArticle = () => {
    setCompetingArticles([...competingArticles, { title: "", content: "" }]);
    // Ensure we have a ref for the new article
    competingFileInputRefs.current = [
      ...competingFileInputRefs.current,
      null
    ];
  };

  // Remove a competing article
  const removeCompetingArticle = (index: number) => {
    // Ensure we always have at least one competing article
    if (competingArticles.length <= 1) return;
    
    const updatedArticles = competingArticles.filter((_, i) => i !== index);
    setCompetingArticles(updatedArticles);
    
    // Update refs array
    competingFileInputRefs.current = competingFileInputRefs.current.filter((_, i) => i !== index);
  };

  // Update a competing article's title or content
  const updateCompetingArticle = (index: number, field: "title" | "content", value: string) => {
    const updatedArticles = [...competingArticles];
    updatedArticles[index] = { ...updatedArticles[index], [field]: value };
    setCompetingArticles(updatedArticles);
  };

  // Reset form
  const handleReset = () => {
    setPrimaryTitle("");
    setPrimaryContent("");
    setPrimaryCharCount(0);
    setCompetingArticles([{ title: "", content: "" }]);
    // Don't reset API key as user will likely reuse it
    
    // Reset file inputs
    if (primaryFileInputRef.current) {
      primaryFileInputRef.current.value = "";
    }
    
    competingFileInputRefs.current.forEach(ref => {
      if (ref) ref.value = "";
    });
    
    toast({
      title: "Form reset",
      description: "All form fields have been cleared. You can now start a new comparison.",
      duration: 3000,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Primary article section */}
      <Card>
        <CardHeader>
          <CardTitle>Primary Article</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={primaryTitle}
              onChange={(e) => setPrimaryTitle(e.target.value)}
              placeholder="Enter article title"
            />
            <p className="text-xs text-neutral-500 mt-1">
              This will be extracted automatically from your file when possible
            </p>
          </div>

          <div>
            <Label>Content</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center mt-2">
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
              <p className="text-neutral-600 mb-2">Drop your primary article file here or</p>
              <input
                type="file"
                ref={primaryFileInputRef}
                className="hidden"
                accept=".txt,.docx,.pdf,.html"
                onChange={handlePrimaryFileUpload}
              />
              <Button
                type="button"
                onClick={handlePrimaryFileSelection}
                className="inline-flex items-center"
              >
                Browse files
              </Button>
              <p className="text-xs text-neutral-500 mt-2">
                Supported formats: .txt, .docx, .pdf, .html (Max 5MB)
              </p>
            </div>
            
            {primaryContent && (
              <div className="mt-4">
                <Label>Content Preview</Label>
                <div className="max-h-[200px] overflow-auto border rounded p-2 mt-1 text-sm">
                  {primaryContent.slice(0, 500)}
                  {primaryContent.length > 500 ? "..." : ""}
                </div>
                <p className="text-xs text-neutral-500 mt-1">{primaryCharCount} characters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Competing articles section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Competing Articles</CardTitle>
          <Button 
            type="button" 
            onClick={addCompetingArticle} 
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add Article
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <Accordion type="multiple" className="w-full">
            {competingArticles.map((article, index) => (
              <AccordionItem key={index} value={`article-${index}`}>
                <div className="flex items-center justify-between">
                  <AccordionTrigger>
                    {article.title || `Competing Article ${index + 1}`}
                  </AccordionTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCompetingArticle(index)}
                    disabled={competingArticles.length <= 1}
                    className="mr-4"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <AccordionContent>
                  <div className="space-y-4 p-2">
                    <div>
                      <Label htmlFor={`competing-title-${index}`}>Title (optional)</Label>
                      <Input
                        id={`competing-title-${index}`}
                        value={article.title}
                        onChange={(e) => updateCompetingArticle(index, "title", e.target.value)}
                        placeholder="Enter article title"
                      />
                    </div>

                    <div>
                      <Label>Content</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center mt-2">
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
                        <p className="text-neutral-600 mb-2">Drop competing article file here or</p>
                        <input
                          type="file"
                          className="hidden"
                          accept=".txt,.docx,.pdf,.html"
                          ref={(el) => {
                            competingFileInputRefs.current[index] = el;
                          }}
                          onChange={(e) => handleCompetingFileUpload(e, index)}
                        />
                        <Button
                          type="button"
                          onClick={() => handleCompetingFileSelection(index)}
                          className="inline-flex items-center"
                        >
                          Browse files
                        </Button>
                        <p className="text-xs text-neutral-500 mt-2">
                          Supported formats: .txt, .docx, .pdf, .html (Max 5MB)
                        </p>
                      </div>

                      {article.content && (
                        <div className="mt-4">
                          <Label>Content Preview</Label>
                          <div className="max-h-[200px] overflow-auto border rounded p-2 mt-1 text-sm">
                            {article.content.slice(0, 500)}
                            {article.content.length > 500 ? "..." : ""}
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">{article.content.length} characters</p>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* API Key Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <Label htmlFor="api-key">OpenAI API Key <span className="text-red-500">*</span></Label>
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Analyzing..." : "Run Comparative Analysis"}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleReset}
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset Form
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ComparativeInputForm;