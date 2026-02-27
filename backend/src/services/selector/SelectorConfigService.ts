/**
 * SelectorConfigService
 * 
 * Service responsible for loading and caching configuration files (questions.json and matrix.json).
 * Supports both local file system (development) and S3 (production) storage.
 * 
 * Features:
 * - Load questions configuration with validation
 * - Load scoring matrix configuration with validation
 * - In-memory caching to reduce I/O operations
 * - Zod schema validation for data integrity
 * - Support for local and S3 storage
 */

import fs from 'fs/promises';
import path from 'path';
import { S3Service } from '../s3Service';
import {
  SelectorQuestionsConfig,
  SelectorMatrixConfig,
  QuestionsConfigSchema,
  RawMatrixConfigSchema,
  ValidatedQuestionsConfig,
  ValidatedMatrixConfig,
  MatrixEntry,
} from '../../types/selector';

export class SelectorConfigService {
  // Cache storage
  private static questionsCache: ValidatedQuestionsConfig | null = null;
  private static matrixCache: ValidatedMatrixConfig | null = null;
  
  // Configuration paths
  private static readonly LOCAL_QUESTIONS_PATH = path.join(__dirname, '../../config/selector/questions.json');
  private static readonly LOCAL_MATRIX_PATH = path.join(__dirname, '../../config/selector/matrix.json');
  private static readonly S3_QUESTIONS_KEY = 'selector/config/questions.json';
  private static readonly S3_MATRIX_KEY = 'selector/config/matrix.json';
  
  // Environment flag
  private static readonly USE_S3 = process.env.USE_S3 === 'true';

  /**
   * Load questions configuration
   * 
   * Loads questions.json from local file system or S3, validates the structure,
   * and caches the result in memory.
   * 
   * @returns Validated questions configuration
   * @throws Error if file cannot be loaded or validation fails
   */
  static async loadQuestions(): Promise<ValidatedQuestionsConfig> {
    // Return cached version if available
    if (this.questionsCache) {
      console.log('[SelectorConfigService] Returning cached questions');
      return this.questionsCache;
    }

    console.log('[SelectorConfigService] Loading questions from', this.USE_S3 ? 'S3' : 'local file system');

    try {
      let rawData: string;

      if (this.USE_S3) {
        // Load from S3
        const buffer = await S3Service.getFile(this.S3_QUESTIONS_KEY);
        rawData = buffer.toString('utf-8');
      } else {
        // Load from local file system
        rawData = await fs.readFile(this.LOCAL_QUESTIONS_PATH, 'utf-8');
      }

      // Parse JSON
      const parsedData = JSON.parse(rawData);

      // Validate with Zod schema
      const validatedData = QuestionsConfigSchema.parse(parsedData);

      // Cache the validated data
      this.questionsCache = validatedData;

      console.log(`[SelectorConfigService] Successfully loaded ${validatedData.totalQuestions} questions from ${validatedData.categories.length} categories`);

      return validatedData;
    } catch (error) {
      console.error('[SelectorConfigService] Error loading questions:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to load questions configuration: ${error.message}`);
      }
      
      throw new Error('Failed to load questions configuration: Unknown error');
    }
  }

  /**
   * Load scoring matrix configuration
   * 
   * Loads matrix.json from local file system or S3, validates the structure,
   * normalizes it to a flat array format, and caches the result in memory.
   * 
   * @returns Validated and normalized matrix configuration
   * @throws Error if file cannot be loaded or validation fails
   */
  static async loadMatrix(): Promise<ValidatedMatrixConfig> {
    // Return cached version if available
    if (this.matrixCache) {
      console.log('[SelectorConfigService] Returning cached matrix');
      return this.matrixCache;
    }

    console.log('[SelectorConfigService] Loading matrix from', this.USE_S3 ? 'S3' : 'local file system');

    try {
      let rawData: string;

      if (this.USE_S3) {
        // Load from S3
        const buffer = await S3Service.getFile(this.S3_MATRIX_KEY);
        rawData = buffer.toString('utf-8');
      } else {
        // Load from local file system
        rawData = await fs.readFile(this.LOCAL_MATRIX_PATH, 'utf-8');
      }

      // Parse JSON
      const parsedData = JSON.parse(rawData);

      // Validate with Zod schema (raw format)
      const validatedRawData = RawMatrixConfigSchema.parse(parsedData);

      // Normalize to flat array format
      const matrix: MatrixEntry[] = [];
      
      for (const [questionId, answers] of Object.entries(validatedRawData.scoring)) {
        for (const [answer, toolScores] of Object.entries(answers)) {
          const scores = Object.entries(toolScores).map(([tool, score]) => ({
            tool,
            score,
          }));
          
          matrix.push({
            questionId,
            answer,
            scores,
          });
        }
      }

      // Create normalized config
      const normalizedData: ValidatedMatrixConfig = {
        version: validatedRawData.version,
        tools: validatedRawData.tools,
        matrix,
      };

      // Cache the normalized data
      this.matrixCache = normalizedData;

      console.log(`[SelectorConfigService] Successfully loaded matrix with ${normalizedData.tools.length} tools and ${normalizedData.matrix.length} entries`);

      return normalizedData;
    } catch (error) {
      console.error('[SelectorConfigService] Error loading matrix:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to load matrix configuration: ${error.message}`);
      }
      
      throw new Error('Failed to load matrix configuration: Unknown error');
    }
  }

  /**
   * Clear cache
   * 
   * Clears the in-memory cache for both questions and matrix.
   * Useful for testing or when configuration files are updated.
   */
  static clearCache(): void {
    console.log('[SelectorConfigService] Clearing cache');
    this.questionsCache = null;
    this.matrixCache = null;
  }

  /**
   * Reload configurations
   * 
   * Clears cache and reloads both questions and matrix configurations.
   * 
   * @returns Object containing both configurations
   */
  static async reload(): Promise<{
    questions: ValidatedQuestionsConfig;
    matrix: ValidatedMatrixConfig;
  }> {
    console.log('[SelectorConfigService] Reloading all configurations');
    this.clearCache();
    
    const [questions, matrix] = await Promise.all([
      this.loadQuestions(),
      this.loadMatrix(),
    ]);

    return { questions, matrix };
  }

  /**
   * Get question by ID
   * 
   * Searches for a specific question by its ID across all categories.
   * 
   * @param questionId - The ID of the question to find
   * @returns The question object or undefined if not found
   */
  static async getQuestionById(questionId: string) {
    const config = await this.loadQuestions();
    
    for (const category of config.categories) {
      const question = category.questions.find(q => q.id === questionId);
      if (question) {
        return question;
      }
    }
    
    return undefined;
  }

  /**
   * Get all question IDs
   * 
   * Returns a flat array of all question IDs from all categories.
   * 
   * @returns Array of question IDs
   */
  static async getAllQuestionIds(): Promise<string[]> {
    const config = await this.loadQuestions();
    
    return config.categories.flatMap(category => 
      category.questions.map(q => q.id)
    );
  }

  /**
   * Validate configuration integrity
   * 
   * Checks that all questions referenced in the matrix exist in the questions config.
   * 
   * @returns Object with validation result and any errors found
   */
  static async validateIntegrity(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const [questions, matrix] = await Promise.all([
        this.loadQuestions(),
        this.loadMatrix(),
      ]);

      // Get all question IDs
      const questionIds = new Set(
        questions.categories.flatMap(cat => cat.questions.map(q => q.id))
      );

      // Check that all matrix entries reference valid questions
      for (const entry of matrix.matrix) {
        if (!questionIds.has(entry.questionId)) {
          errors.push(`Matrix references non-existent question: ${entry.questionId}`);
        }
      }

      // Check that all tools in matrix entries match the tools list
      const toolsSet = new Set(matrix.tools);
      for (const entry of matrix.matrix) {
        for (const score of entry.scores) {
          if (!toolsSet.has(score.tool)) {
            errors.push(`Matrix entry for ${entry.questionId} references unknown tool: ${score.tool}`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      if (error instanceof Error) {
        errors.push(`Configuration validation failed: ${error.message}`);
      }
      
      return {
        valid: false,
        errors,
      };
    }
  }
}
