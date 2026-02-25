/**
 * Selector Module - TypeScript Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the Selector module.
 * These types are used across services, controllers, and frontend components.
 */

import { z } from 'zod';

// ============================================================================
// Question Types
// ============================================================================

export type QuestionType = 'boolean' | 'multiple';

export interface SelectorQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  helpText?: string;
}

export interface SelectorCategory {
  id: string;
  name: string;
  description: string;
  questions: SelectorQuestion[];
}

export interface SelectorQuestionsConfig {
  version: string;
  totalQuestions: number;
  categories: SelectorCategory[];
}

// ============================================================================
// Matrix Types
// ============================================================================

export interface ToolScore {
  tool: string;
  score: number;
}

export interface MatrixEntry {
  questionId: string;
  answer: string;
  scores: ToolScore[];
}

// Raw matrix format (as stored in matrix.json)
export interface RawMatrixConfig {
  version: string;
  tools: string[];
  scoring: {
    [questionId: string]: {
      [answer: string]: {
        [tool: string]: number;
      };
    };
  };
}

// Normalized matrix format (for internal use)
export interface SelectorMatrixConfig {
  version: string;
  tools: string[];
  matrix: MatrixEntry[];
}

// ============================================================================
// Session Types
// ============================================================================

export interface SelectorAnswer {
  questionId: string;
  answer: string;
  timestamp: string;
}

export interface SelectorSession {
  sessionId: string;
  clientName: string;
  answers: SelectorAnswer[];
  createdAt: string;
  updatedAt: string;
  completed: boolean;
}

// ============================================================================
// Result Types
// ============================================================================

export interface ToolResult {
  tool: string;
  absoluteScore: number;
  percentageScore: number;
  rank: number;
}

export interface DecisiveFactor {
  questionId: string;
  questionText: string;
  answer: string;
  impact: number; // Point difference between top 2 tools
  affectedTools: string[];
}

export interface SelectorResult {
  sessionId: string;
  clientName: string;
  recommendedTool: string;
  confidence: 'low' | 'medium' | 'high';
  confidencePercentage: number;
  results: ToolResult[];
  decisiveFactors: DecisiveFactor[];
  calculatedAt: string;
}

// ============================================================================
// History Types
// ============================================================================

export interface SelectorHistoryEntry {
  sessionId: string;
  clientName: string;
  recommendedTool: string;
  confidence: string;
  confidencePercentage: number;
  completedAt: string;
  results: ToolResult[];
}

export interface SelectorHistoryResponse {
  entries: SelectorHistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SelectorStatistics {
  totalAssessments: number;
  toolDistribution: {
    tool: string;
    count: number;
    percentage: number;
  }[];
  averageScores: {
    tool: string;
    averageScore: number;
  }[];
  confidenceDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.enum(['boolean', 'multiple']),
  options: z.array(z.string()),
  helpText: z.string().optional(),
});

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  questions: z.array(QuestionSchema),
});

export const QuestionsConfigSchema = z.object({
  version: z.string(),
  totalQuestions: z.number(),
  categories: z.array(CategorySchema),
});

export const ToolScoreSchema = z.object({
  tool: z.string(),
  score: z.number(),
});

export const MatrixEntrySchema = z.object({
  questionId: z.string(),
  answer: z.string(),
  scores: z.array(ToolScoreSchema),
});

// Raw matrix schema (as stored in matrix.json)
export const RawMatrixConfigSchema = z.object({
  version: z.string(),
  tools: z.array(z.string()),
  scoring: z.record(
    z.string(), // questionId
    z.record(
      z.string(), // answer
      z.record(z.string(), z.number()) // tool -> score
    )
  ),
});

// Normalized matrix schema (for internal use)
export const MatrixConfigSchema = z.object({
  version: z.string(),
  tools: z.array(z.string()),
  matrix: z.array(MatrixEntrySchema),
});

export const AnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
  timestamp: z.string(),
});

export const SessionSchema = z.object({
  sessionId: z.string(),
  clientName: z.string(),
  answers: z.array(AnswerSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  completed: z.boolean(),
});

// ============================================================================
// Export Types
// ============================================================================

export type ValidatedQuestionsConfig = z.infer<typeof QuestionsConfigSchema>;
export type ValidatedRawMatrixConfig = z.infer<typeof RawMatrixConfigSchema>;
export type ValidatedMatrixConfig = z.infer<typeof MatrixConfigSchema>;
export type ValidatedSession = z.infer<typeof SessionSchema>;
