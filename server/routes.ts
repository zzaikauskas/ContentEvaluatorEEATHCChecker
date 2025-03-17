import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { evaluateContent } from "./lib/openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Content evaluation endpoint
  app.post("/api/evaluate", async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        content: z.string().min(1, "Content is required"),
        title: z.string().optional(),
        apiKey: z.string().min(1, "OpenAI API key is required")
      });

      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: validationResult.error.errors 
        });
      }

      const { content, title, apiKey } = validationResult.data;

      // Evaluate content using OpenAI
      const evaluation = await evaluateContent({ content, title, apiKey });
      
      // Return evaluation result
      return res.status(200).json(evaluation);
    } catch (error) {
      console.error("Error evaluating content:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "An unexpected error occurred" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
