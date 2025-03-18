import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { evaluateContent } from "./lib/openai";
import { checkLinks as checkContentLinks } from "./lib/linkChecker";
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
        keyword: z.string().optional(),
        apiKey: z.string().min(1, "OpenAI API key is required"),
        checkLinks: z.boolean().optional()
      });

      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: validationResult.error.errors 
        });
      }

      const { content, title, keyword, apiKey, checkLinks } = validationResult.data;

      // Check for broken links if requested
      let linkCheckResult = null;
      if (checkLinks === true) {
        try {
          console.log("Checking links in content...");
          linkCheckResult = await checkLinks(content);
          console.log(`Link check complete: Found ${linkCheckResult.totalLinks} links, ${linkCheckResult.brokenLinks} broken`);
        } catch (error) {
          console.error("Error checking links:", error);
          // We'll continue with the evaluation even if link checking fails
        }
      }

      // Evaluate content using OpenAI
      const evaluation = await evaluateContent({ 
        content, 
        title, 
        keyword, 
        apiKey, 
        checkLinks,
        linkCheckResult 
      });
      
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
