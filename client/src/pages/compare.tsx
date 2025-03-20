import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComparativeInputForm from "@/components/ui/comparative-input-form";
import ComparativeResultsPanel from "@/components/ui/comparative-results-panel";
import { ComparativeState } from "@/lib/types";

export default function Compare() {
  const [comparativeState, setComparativeState] = useState<ComparativeState>({
    isLoading: false,
    result: null,
    error: null,
  });

  // Reset the comparison state
  const resetComparison = () => {
    setComparativeState({
      isLoading: false,
      result: null,
      error: null,
    });
  };

  return (
    <>
      <Helmet>
        <title>Comparative Analysis | Content Evaluator</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mx-auto mb-8">
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Comparative Content Analysis
          </h1>
          <p className="text-center text-zinc-600 mt-2 max-w-3xl mx-auto">
            Compare your content against competing articles to identify strengths, weaknesses, and areas for improvement
          </p>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="input" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="input">Input</TabsTrigger>
              <TabsTrigger 
                value="results" 
                disabled={!comparativeState.result}
              >
                Results
              </TabsTrigger>
            </TabsList>
            <TabsContent value="input" className="mt-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-xl">How it works</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Add your primary article in the form below</li>
                    <li>Add one or more competing articles to compare against</li>
                    <li>Enter your OpenAI API key (GPT-4 access required)</li>
                    <li>Click "Compare Articles" to generate a detailed analysis</li>
                  </ol>
                </CardContent>
              </Card>
              <ComparativeInputForm 
                setComparativeState={setComparativeState}
                isLoading={comparativeState.isLoading}
              />
            </TabsContent>
            <TabsContent value="results">
              {comparativeState.result && (
                <ComparativeResultsPanel
                  comparativeState={comparativeState}
                  resetComparison={resetComparison}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}