import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema from original file
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Content evaluation schema
export const contentEvaluations = pgTable("content_evaluations", {
  id: serial("id").primaryKey(),
  title: text("title"),
  content: text("content").notNull(),
  keyword: text("keyword"),
  keywordInTitle: integer("keyword_in_title").default(0),
  keywordAtBeginning: integer("keyword_at_beginning").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  overallScore: integer("overall_score").notNull(),
  experienceScore: integer("experience_score").notNull(),
  expertiseScore: integer("expertise_score").notNull(),
  authoritativenessScore: integer("authoritativeness_score").notNull(),
  trustworthinessScore: integer("trustworthiness_score").notNull(),
  userFirstScore: integer("user_first_score").notNull(),
  depthValueScore: integer("depth_value_score").notNull(),
  satisfactionScore: integer("satisfaction_score").notNull(),
  originalityScore: integer("originality_score").notNull(),
  experienceExplanation: text("experience_explanation"),
  expertiseExplanation: text("expertise_explanation"),
  authoritativenessExplanation: text("authoritativeness_explanation"),
  trustworthinessExplanation: text("trustworthiness_explanation"),
  userFirstExplanation: text("user_first_explanation"),
  depthValueExplanation: text("depth_value_explanation"),
  satisfactionExplanation: text("satisfaction_explanation"),
  originalityExplanation: text("originality_explanation"),
  strengths: json("strengths").notNull(),
  improvements: json("improvements").notNull(),
  recommendations: json("recommendations").notNull(),
  summary: text("summary").notNull(),
});

export const insertContentEvaluationSchema = createInsertSchema(contentEvaluations).omit({
  id: true,
  createdAt: true,
});

export type InsertContentEvaluation = z.infer<typeof insertContentEvaluationSchema>;
export type ContentEvaluation = typeof contentEvaluations.$inferSelect;

// Score thresholds for color coding
export const scoreThresholds = {
  low: 5, // Below this value is considered low (red)
  medium: 7, // Below this value is considered medium (yellow), above is high (green)
};

// Evaluation criteria explanations
export const eatExplanations = {
  experience: "First-hand experience with the topic, demonstrating real-world knowledge.",
  expertise: "Knowledge, skill and background in the subject matter.",
  authoritativeness: "Reputation for reliable information in the field.",
  trustworthiness: "Accuracy, transparency, and honesty of the content."
};

export const helpfulContentExplanations = {
  userFirst: "Content created primarily for people, not search engines.",
  depthValue: "Demonstrates first-hand expertise and depth of knowledge.",
  satisfaction: "Leaves readers feeling they've learned enough about a topic.",
  originality: "Adds value beyond simply summarizing what others have said."
};
