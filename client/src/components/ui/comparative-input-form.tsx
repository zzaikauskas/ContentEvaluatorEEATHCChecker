import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { InputTabs } from "./input-tabs";
import { ComparativeState, CompetingArticle, InputTab } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { X, Plus } from "lucide-react";

interface ComparativeInputFormProps {
  setComparativeState: React.Dispatch<React.SetStateAction<ComparativeState>>;
  isLoading: boolean;
}

const ComparativeInputForm = ({ setComparativeState, isLoading }: ComparativeInputFormProps) => {
  const [primaryActiveTab, setPrimaryActiveTab] = useState<InputTab>("text");
  const [primaryTitle, setPrimaryTitle] = useState<string>("");
  const [primaryContent, setPrimaryContent] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [competingArticles, setCompetingArticles] = useState<CompetingArticle[]>([
    { title: "", content: "" } // Start with one empty competing article
  ]);

  // Handle file upload for primary article
  const handlePrimaryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Create FormData object to send file
      const formData = new FormData();
      formData.append("file", file);

      // Set loading state
      setComparativeState(prev => ({ ...prev, isLoading: true, error: null }));

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
      if (data.title) {
        setPrimaryTitle(data.title);
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

    try {
      // Create FormData object to send file
      const formData = new FormData();
      formData.append("file", file);

      // Set loading state
      setComparativeState(prev => ({ ...prev, isLoading: true, error: null }));

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
      
      // Update competing article with parsed content
      const updatedArticles = [...competingArticles];
      updatedArticles[index] = {
        title: data.title || updatedArticles[index].title || "",
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

  // Handle URL input for the primary article
  const handlePrimaryUrlFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const urlInput = form.elements.namedItem("primaryUrl") as HTMLInputElement;
    const url = urlInput.value.trim();

    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setComparativeState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch URL content");
      }

      const data = await response.json();
      setPrimaryContent(data.text || "");
      if (data.title) {
        setPrimaryTitle(data.title);
      }

      toast({
        title: "URL content fetched successfully",
        description: `Content from ${url} has been fetched (${Math.round(data.text.length / 1000)}K characters)`,
      });
    } catch (error) {
      toast({
        title: "Error fetching URL",
        description: error instanceof Error ? error.message : "Failed to fetch URL content",
        variant: "destructive",
      });
    } finally {
      setComparativeState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle URL input for competing articles
  const handleCompetingUrlFetch = async (e: React.FormEvent, index: number) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const urlInput = form.elements.namedItem(`competingUrl${index}`) as HTMLInputElement;
    const url = urlInput.value.trim();

    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setComparativeState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch URL content");
      }

      const data = await response.json();
      
      // Update competing article with fetched content
      const updatedArticles = [...competingArticles];
      updatedArticles[index] = {
        title: data.title || updatedArticles[index].title || "",
        content: data.text || ""
      };
      setCompetingArticles(updatedArticles);

      toast({
        title: "URL content fetched successfully",
        description: `Content from ${url} has been fetched (${Math.round(data.text.length / 1000)}K characters)`,
      });
    } catch (error) {
      toast({
        title: "Error fetching URL",
        description: error instanceof Error ? error.message : "Failed to fetch URL content",
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
        description: "Primary article content is required",
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
      const result = await apiRequest("/api/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
  };

  // Remove a competing article
  const removeCompetingArticle = (index: number) => {
    // Ensure we always have at least one competing article
    if (competingArticles.length <= 1) return;
    
    const updatedArticles = competingArticles.filter((_, i) => i !== index);
    setCompetingArticles(updatedArticles);
  };

  // Update a competing article's title or content
  const updateCompetingArticle = (index: number, field: "title" | "content", value: string) => {
    const updatedArticles = [...competingArticles];
    updatedArticles[index] = { ...updatedArticles[index], [field]: value };
    setCompetingArticles(updatedArticles);
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
          </div>

          <div>
            <Label>Content</Label>
            <Tabs value={primaryActiveTab} onValueChange={(val) => setPrimaryActiveTab(val as InputTab)}>
              <TabsList className="mb-2">
                <InputTabs activeTab={primaryActiveTab} setActiveTab={setPrimaryActiveTab} />
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <Textarea
                  value={primaryContent}
                  onChange={(e) => setPrimaryContent(e.target.value)}
                  placeholder="Enter or paste the article content here"
                  className="min-h-[300px]"
                />
              </TabsContent>

              <TabsContent value="file" className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="primary-article-file">Upload Document (PDF, DOCX, HTML)</Label>
                  <Input 
                    id="primary-article-file" 
                    type="file"
                    accept=".pdf,.docx,.doc,.html,.htm"
                    onChange={handlePrimaryFileUpload}
                  />
                </div>
                {primaryContent && (
                  <div className="mt-4">
                    <Label>Extracted Content Preview</Label>
                    <div className="max-h-[200px] overflow-auto border rounded p-2 mt-1 text-sm">
                      {primaryContent.slice(0, 1000)}
                      {primaryContent.length > 1000 ? "..." : ""}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="primaryUrl">URL</Label>
                  <form onSubmit={handlePrimaryUrlFetch} className="flex gap-2">
                    <Input
                      id="primaryUrl"
                      name="primaryUrl"
                      type="url"
                      placeholder="https://example.com/article"
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" disabled={isLoading}>
                      Fetch
                    </Button>
                  </form>
                </div>
                {primaryContent && (
                  <div className="mt-4">
                    <Label>Extracted Content Preview</Label>
                    <div className="max-h-[200px] overflow-auto border rounded p-2 mt-1 text-sm">
                      {primaryContent.slice(0, 1000)}
                      {primaryContent.length > 1000 ? "..." : ""}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
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

                    <Tabs defaultValue="text" className="w-full">
                      <TabsList className="mb-2">
                        <TabsTrigger value="text">Text</TabsTrigger>
                        <TabsTrigger value="file">File</TabsTrigger>
                        <TabsTrigger value="url">URL</TabsTrigger>
                      </TabsList>

                      <TabsContent value="text" className="space-y-4">
                        <Textarea
                          value={article.content}
                          onChange={(e) => updateCompetingArticle(index, "content", e.target.value)}
                          placeholder="Enter or paste the competing article content here"
                          className="min-h-[200px]"
                        />
                      </TabsContent>

                      <TabsContent value="file" className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                          <Label htmlFor={`competing-file-${index}`}>Upload Document</Label>
                          <Input 
                            id={`competing-file-${index}`} 
                            type="file" 
                            accept=".pdf,.docx,.doc,.html,.htm"
                            onChange={(e) => handleCompetingFileUpload(e, index)}
                          />
                        </div>
                        {article.content && (
                          <div className="mt-4">
                            <Label>Extracted Content Preview</Label>
                            <div className="max-h-[150px] overflow-auto border rounded p-2 mt-1 text-sm">
                              {article.content.slice(0, 500)}
                              {article.content.length > 500 ? "..." : ""}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="url" className="space-y-4">
                        <div className="flex flex-col space-y-2">
                          <Label htmlFor={`competingUrl${index}`}>URL</Label>
                          <form onSubmit={(e) => handleCompetingUrlFetch(e, index)} className="flex gap-2">
                            <Input
                              id={`competingUrl${index}`}
                              name={`competingUrl${index}`}
                              type="url"
                              placeholder="https://example.com/article"
                              className="flex-1"
                            />
                            <Button type="submit" size="sm" disabled={isLoading}>
                              Fetch
                            </Button>
                          </form>
                        </div>
                        {article.content && (
                          <div className="mt-4">
                            <Label>Extracted Content Preview</Label>
                            <div className="max-h-[150px] overflow-auto border rounded p-2 mt-1 text-sm">
                              {article.content.slice(0, 500)}
                              {article.content.length > 500 ? "..." : ""}
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* API Key section */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Your API key is used only for this request and is not stored on our servers.
              Consider using a rate-limited key.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPrimaryTitle("");
              setPrimaryContent("");
              setCompetingArticles([{ title: "", content: "" }]);
              setApiKey("");
              setComparativeState({
                isLoading: false,
                result: null,
                error: null,
              });
            }}
          >
            Reset Form
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Compare Articles"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ComparativeInputForm;