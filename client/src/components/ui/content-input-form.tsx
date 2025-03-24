import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { InputTabs } from "@/components/ui/input-tabs";
import { EvaluationState, InputTab, EvaluationResponse } from "@/lib/types";
import { eatExplanations, helpfulContentExplanations } from "@shared/schema";

interface ContentInputFormProps {
  setEvaluationState: React.Dispatch<React.SetStateAction<EvaluationState>>;
  isLoading: boolean;
}

const ContentInputForm = ({ setEvaluationState, isLoading }: ContentInputFormProps) => {
  const [activeTab, setActiveTab] = useState<InputTab>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [keyword, setKeyword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [url, setUrl] = useState("");
  const [checkLinks, setCheckLinks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [eatInfoExpanded, setEatInfoExpanded] = useState(false);
  const [helpfulInfoExpanded, setHelpfulInfoExpanded] = useState(false);
  
  const { toast } = useToast();

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    setCharCount(text.length);
    
    // Check if we're working with HTML content
    const isHtmlContent = text.trim().toLowerCase().startsWith('<!doctype html>') || 
                          text.trim().toLowerCase().startsWith('<html') ||
                          (text.includes('<head>') && text.includes('<body>'));
    
    // For HTML content, we'll prioritize title tag extraction
    if (isHtmlContent) {
      const titleTagMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleTagMatch && titleTagMatch[1]) {
        const extractedTitle = titleTagMatch[1].trim().replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ');
        if (extractedTitle && !title.trim()) {
          setTitle(extractedTitle);
          toast({
            title: "Title extracted",
            description: "Title has been automatically extracted from HTML content.",
            duration: 3000,
          });
          console.log('HTML title extracted from pasted content:', extractedTitle);
          return;
        }
      }
    }
    
    // For non-HTML content or if no HTML title found, try to extract title from content
    if (!title.trim()) {
      const extractedTitle = extractTitleFromContent(text);
      if (extractedTitle) {
        setTitle(extractedTitle);
        toast({
          title: "Title extracted",
          description: "A potential title has been identified from your content.",
          duration: 3000,
        });
      }
    }
  };
  
  // Helper function to extract potential title from content
  const extractTitleFromContent = (text: string): string | null => {
    if (!text.trim()) return null;

    // Try to find meta title in various formats
    console.log('Attempting to extract title from content...');
    
    // Look for text between "Meta Title:" and "Meta Description:" - prioritize this pattern
    // Using manual string search instead of regex with /s flag
    const titlePos = text.search(/Meta\s+[tT]itle\s*:/i);
    let metaTitleDescExtracted: string | null = null;
    
    if (titlePos !== -1) {
      // Find the position of "Meta Description:" after the title position
      const afterTitleText = text.substring(titlePos);
      const descPos = afterTitleText.search(/Meta\s+[dD]escription\s*:/i);
      
      // If description is found, extract the text between title and description
      if (descPos !== -1) {
        // Find position after the colon in Meta Title:
        const titleColonPos = afterTitleText.search(/:/i);
        if (titleColonPos !== -1) {
          // Extract the text between the title's colon and the description
          metaTitleDescExtracted = afterTitleText.substring(titleColonPos + 1, descPos).trim();
        }
      }
    }
    
    // Use the manually extracted text between Meta Title and Meta Description
    if (metaTitleDescExtracted) {
      const title = metaTitleDescExtracted.replace(/["'\r\n]+$/, '').trim();
      if (title.length > 5 && title.length < 200) {
        console.log('Title extracted from "Meta Title-Description" pattern:', title);
        return title;
      }
    }
    
    // Special pattern for "Meta title:" followed by the actual title if the above fails
    const metaTitleColonPattern = /Meta\s+[tT]itle\s*:([^.!?\r\n]+)/i;
    const metaTitleColonMatch = text.match(metaTitleColonPattern);
    
    if (metaTitleColonMatch && metaTitleColonMatch[1]) {
      const title = metaTitleColonMatch[1].trim().replace(/["'\r\n]+$/, '').trim();
      if (title.length > 5 && title.length < 200) {
        console.log('Title extracted from "Meta title:" pattern:', title);
        return title;
      }
    }
    
    // Try the exact pattern format from the sample HTML
    // This targets cases where "Meta title" is in a span, followed by ":" and then the title
    const htmlMetaTitlePattern = /Meta\s+title[\s\S]*?:[\s\S]*?(?:&nbsp;|\s+)([^<\r\n.!?]+)/i;
    const htmlMetaTitleMatch = text.match(htmlMetaTitlePattern);
    
    if (htmlMetaTitleMatch && htmlMetaTitleMatch[1]) {
      const title = htmlMetaTitleMatch[1].trim().replace(/["'\r\n]+$/, '').trim();
      if (title.length > 5 && title.length < 200) {
        console.log('Title extracted from HTML-specific Meta title pattern:', title);
        return title;
      }
    }
    
    // Look for Meta title followed by description (common SEO pattern)
    const metaDescriptionPattern = /(?:meta|page|post)\s+title\s*:?\s*["']?(.*?)(?=(?:meta|page|post)\s+description\s*:|\r|\n\r|\n\n|$)/i;
    const metaDescriptionMatch = text.match(metaDescriptionPattern);
    
    if (metaDescriptionMatch && metaDescriptionMatch[1]) {
      const title = metaDescriptionMatch[1].trim().replace(/["'\r\n]+$/, '').trim();
      if (title.length > 5 && title.length < 200) {
        console.log('Title extracted from Meta Title/Description pattern:', title);
        return title;
      }
    }
    
    // Look for standalone Meta title pattern (with or without colon)
    const metaTitleMatch = text.match(/(?:meta|page|post)\s+title\s*:?\s*["']?(.*?)(?:[.!?]|\r|\n|$)/i);
    if (metaTitleMatch && metaTitleMatch[1]) {
      const title = metaTitleMatch[1].trim().replace(/["'\r\n]+$/, '').trim();
      if (title.length > 5 && title.length < 200) {
        console.log('Title extracted from Meta title pattern:', title);
        return title;
      }
    }
    
    // Try a more general title pattern as fallback
    const titleMatch = text.match(/title\s*:?\s*["']?(.*?)(?:[.!?]|\r|\n|$)/i);
    if (titleMatch && titleMatch[1]) {
      const title = titleMatch[1].trim().replace(/["'\r\n]+$/, '').trim();
      if (title.length > 5 && title.length < 200) {
        console.log('Title extracted from general title pattern:', title);
        return title;
      }
    }
    
    // Look for heading-like structures
    const headingMatch = text.match(/^\s*#+\s*(.*?)(?:[.!?]|\r|\n|$)/m) || 
                         text.match(/^\s*==+\s*(.*?)(?:[.!?]|\r|\n|$)\s*==+/m);
    if (headingMatch && headingMatch[1]) {
      const title = headingMatch[1].trim();
      if (title.length > 5 && title.length < 200) {
        return title;
      }
    }
    
    // If nothing else, use the first non-empty line if it's reasonably short (likely a title)
    const firstLineMatch = text.match(/^\s*([^\r\n]{10,100})/);
    if (firstLineMatch && firstLineMatch[1]) {
      // Only use first line if it appears to be a title (not too long, not too short)
      return firstLineMatch[1].trim();
    }
    
    return null;
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

    // Handle PDF, DOCX, and HTML files with server-side processing
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isDocx = file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc');
    const isHtml = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');
    
    if (isPdf || isDocx || isHtml) {
      // Set loading state
      toast({
        title: `Processing ${isPdf ? 'PDF' : isDocx ? 'DOCX' : 'HTML'} file`,
        description: "Extracting content and links...",
        duration: 5000,
      });
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Send file to the server for processing
      fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to process document');
          }
          return response.json();
        })
        .then(data => {
          // Set the extracted content and title
          setContent(data.text);
          setCharCount(data.text.length);
          
          if (data.title && !title.trim()) {
            setTitle(data.title);
            toast({
              title: "Title extracted",
              description: `A title has been extracted from your ${isPdf ? 'PDF' : isDocx ? 'DOCX' : 'HTML'} file.`,
              duration: 3000,
            });
          } else {
            // Try to extract title from text content
            const extractedTitle = extractTitleFromContent(data.text);
            if (extractedTitle && !title.trim()) {
              setTitle(extractedTitle);
              toast({
                title: "Title extracted",
                description: "A potential title has been identified from your document content.",
                duration: 3000,
              });
            }
          }
          
          toast({
            title: `${isPdf ? 'PDF' : isDocx ? 'DOCX' : 'HTML'} processed successfully`,
            description: `${data.links.length} links were found in your document.`,
            duration: 3000,
          });
        })
        .catch(error => {
          console.error('Document processing error:', error);
          toast({
            title: "Document processing failed",
            description: error.message || "Could not process the document file.",
            variant: "destructive",
          });
        });
      
      return;
    }

    // Handle text-based files (HTML, TXT)
    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target?.result as string;
      
      // If it's an HTML file, extract the text content
      if (file.name.toLowerCase().endsWith('.html')) {
        try {
          // Create a DOM parser - we'll need this in any case
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          
          // Track if we found a title to prevent later extraction from overriding it
          let titleFound = false;
          
          // First check if there's a <title> tag directly in the HTML code - using non-greedy match
          const titleTagMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          
          if (titleTagMatch && titleTagMatch[1]) {
            // Clean up any whitespace or special characters
            const extractedTitle = titleTagMatch[1].trim().replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ');
            
            if (extractedTitle) {
              setTitle(extractedTitle);
              titleFound = true;
              
              // Show a toast notification about the extracted title
              toast({
                title: "Title extracted",
                description: "The title has been automatically extracted from the HTML file.",
                duration: 3000,
              });
              
              console.log('Title extracted from HTML tag:', extractedTitle);
            }
          } else {
            // If regex-based extraction fails, try with DOM parser as backup
            const docTitle = doc.querySelector('title');
            if (docTitle && docTitle.textContent) {
              const parsedTitle = docTitle.textContent.trim();
              setTitle(parsedTitle);
              titleFound = true;
              
              // Show a toast notification about the extracted title
              toast({
                title: "Title extracted",
                description: "The title has been automatically extracted from the HTML file.",
                duration: 3000,
              });
              
              console.log('Title extracted via DOM parser:', parsedTitle);
            } else {
              console.log('No title tag found in HTML');
            }
          }
          
          // Extract text from the body, remove script and style tags first
          const scripts = doc.querySelectorAll('script, style');
          scripts.forEach((script: Element) => script.remove());
          
          // Get text from body or main content areas
          const mainContent = doc.querySelector('main, article, #content, .content');
          text = mainContent 
            ? mainContent.textContent || '' 
            : doc.body.textContent || '';
          
          // Clean up the text
          text = text.trim().replace(/\s+/g, ' ');
          
          // Store the title found flag in state
          if (titleFound) {
            // Set a flag in local storage to prevent content-based extraction
            localStorage.setItem('html_title_extracted', 'true');
          }
          
        } catch (error) {
          console.error('Error parsing HTML:', error);
          // If HTML parsing fails, just use the raw text
          toast({
            title: "HTML parsing error",
            description: "Could not parse the HTML file properly. Using raw text instead.",
            variant: "destructive",
          });
        }
      }
      
      // Check if we already extracted a title from HTML
      const htmlTitleExtracted = localStorage.getItem('html_title_extracted') === 'true';
      
      // Only try content extraction if we didn't find a title in HTML
      if (!htmlTitleExtracted && !title.trim()) {
        const extractedTitle = extractTitleFromContent(text);
        if (extractedTitle) {
          setTitle(extractedTitle);
          toast({
            title: "Title extracted",
            description: "A potential title has been identified from your file content.",
            duration: 3000,
          });
        }
      }
      
      // Clear the flag for next time
      localStorage.removeItem('html_title_extracted');
      
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
    
    // If URL tab is active, fetch the title from the URL
    if (activeTab === "url" && url.trim() && !title.trim()) {
      try {
        setEvaluationState((prev) => ({ ...prev, isLoading: true }));
        
        // We'll set a placeholder title for now
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const pathname = urlObj.pathname;
        
        // Create a title from the URL (we'll use just the domain and path for now)
        // In a production app, we would make a server request to fetch and parse the HTML
        const extractedTitle = `${domain}${pathname}`;
        setTitle(extractedTitle);
        
        toast({
          title: "URL processed",
          description: "Title has been extracted from URL. For better results, consider editing it manually.",
          duration: 4000,
        });
        
        setEvaluationState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error("Error processing URL:", error);
        toast({
          title: "URL processing error",
          description: "Could not extract title from the URL. Please enter a title manually.",
          variant: "destructive",
        });
        setEvaluationState((prev) => ({ ...prev, isLoading: false }));
      }
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
        keyword: keyword || undefined,
        apiKey,
        checkLinks: checkLinks || undefined,
      };

      const result = await apiRequest<EvaluationResponse>("/api/evaluate", {
        method: "POST",
        body: JSON.stringify(requestData)
      });

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
  
  // Function to reset all form fields
  const handleReset = () => {
    setTitle("");
    setContent("");
    setKeyword("");
    setUrl("");
    setCharCount(0);
    setCheckLinks(false);
    // Don't clear API key as it's likely to be reused
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    toast({
      title: "Form reset",
      description: "All form fields have been cleared. You can now start a new evaluation.",
      duration: 3000,
    });
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
            <p className="text-xs text-neutral-500 mt-1">
              This will be used as the meta title for title tag optimization analysis. The app will automatically extract titles from HTML files, URLs, and content with SEO formatting (e.g., content between "Meta title:" and "Meta description:").
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="main-keyword" className="block text-sm font-medium text-neutral-600 mb-1">
              Main Keyword (Optional)
            </label>
            <Input
              id="main-keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full"
              placeholder="Enter the main keyword for SEO analysis"
            />
            <p className="text-xs text-neutral-500 mt-1">
              We'll check if this keyword appears in your title and its position
            </p>
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
                  accept=".txt,.docx,.pdf,.html"
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
                  Supported formats: .txt, .docx, .pdf, .html (Max 5MB)
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  <strong>Link checking is supported in all file formats</strong> - PDF and DOCX files will be processed server-side to extract links.
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
          
          {/* Link Checking Option */}
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="check-links"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={checkLinks}
                onChange={(e) => setCheckLinks(e.target.checked)}
              />
              <label htmlFor="check-links" className="ml-2 text-sm font-medium text-neutral-600">
                Check for broken links
              </label>
            </div>
            <p className="text-xs text-neutral-500 mt-1 ml-6">
              This will scan your content for hyperlinks and verify if they are working
            </p>
          </div>

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
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Evaluating..." : "Evaluate Content"}
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
          </div>
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
