import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { evaluateContent, compareContent } from "./lib/openai";
import { checkLinks as checkContentLinks } from "./lib/linkChecker";
import { parseDocument } from "./lib/documentParser";
import { z } from "zod";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({ 
    dest: os.tmpdir(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit to match Express body parser limit
    fileFilter: (req, file, cb) => {
      // Accept PDF, DOCX, and HTML files
      const allowedMimes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/html',
        'application/html',
        'application/xhtml+xml'
      ];
      const allowedExtensions = ['.pdf', '.docx', '.doc', '.html', '.htm'];
      
      const fileExt = path.extname(file.originalname).toLowerCase();
      
      if (allowedExtensions.includes(fileExt) || allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, DOCX, and HTML files are allowed.'));
      }
    }
  });
  
  // Document parsing endpoint
  app.post('/api/parse-document', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const { path: filePath, originalname } = req.file;
      
      // Read the file buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      // Parse the document
      const parseResult = await parseDocument(fileBuffer, originalname);
      
      // Clean up temporary file
      fs.unlinkSync(filePath);
      
      // Return the parsed content
      return res.status(200).json(parseResult);
    } catch (error) {
      console.error('Document parsing error:', error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to parse document' 
      });
    }
  });
  
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
          linkCheckResult = await checkContentLinks(content);
          const workingWithConditions = linkCheckResult.links.filter(l => 
            l.ok && (l.status === 403 || l.status === 405)).length;
          
          console.log(`Link check complete: Found ${linkCheckResult.totalLinks} links, ${linkCheckResult.brokenLinks} broken, ${workingWithConditions} working with security restrictions`);
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

  // Comparative analysis endpoint
  app.post("/api/compare", async (req, res) => {
    try {
      // Validate request body
      const competingArticleSchema = z.object({
        title: z.string().optional(),
        content: z.string().min(1, "Content is required")
      });

      const schema = z.object({
        primaryArticle: z.object({
          title: z.string().optional(),
          content: z.string().min(1, "Primary article content is required")
        }),
        competingArticles: z.array(competingArticleSchema).min(1, "At least one competing article is required"),
        apiKey: z.string().min(1, "OpenAI API key is required")
      });

      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: validationResult.error.errors 
        });
      }

      const { primaryArticle, competingArticles, apiKey } = validationResult.data;

      // Compare content using OpenAI
      const comparison = await compareContent({ 
        primaryArticle, 
        competingArticles, 
        apiKey
      });
      
      // Return comparison result
      return res.status(200).json(comparison);
    } catch (error) {
      console.error("Error comparing content:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "An unexpected error occurred" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
