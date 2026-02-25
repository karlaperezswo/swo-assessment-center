/**
 * SelectorCalculationService
 * 
 * Service responsible for calculating scores and recommendations based on answers.
 * Implements the scoring algorithm from the matrix.json configuration.
 */

import { SelectorConfigService } from './SelectorConfigService';
import { SelectorSession, SelectorResult, ToolResult, DecisiveFactor } from '../../types/selector';

export class SelectorCalculationService {
  /**
   * Calculate scores for all tools based on session answers
   */
  static async calculateScores(session: SelectorSession): Promise<SelectorResult> {
    console.log(`[SelectorCalculationService] Calculating scores for session ${session.sessionId}`);

    // Load matrix configuration
    const matrix = await SelectorConfigService.loadMatrix();
    
    // Initialize scores for all tools
    const scores: { [tool: string]: number } = {};
    matrix.tools.forEach(tool => scores[tool] = 0);

    // Calculate scores based on answers
    for (const answer of session.answers) {
      const matrixEntry = matrix.matrix.find(
        entry => entry.questionId === answer.questionId && entry.answer === answer.answer
      );
      
      if (matrixEntry) {
        matrixEntry.scores.forEach(toolScore => {
          scores[toolScore.tool] += toolScore.score;
        });
      }
    }

    // Calculate max possible score (sum of max scores per question answered)
    const answeredQuestionIds = new Set(session.answers.map(a => a.questionId));
    let maxPossible = 0;
    
    for (const questionId of answeredQuestionIds) {
      const entriesForQuestion = matrix.matrix.filter(e => e.questionId === questionId);
      const maxForQuestion = Math.max(...entriesForQuestion.flatMap(e => e.scores.map(s => s.score)));
      maxPossible += maxForQuestion;
    }

    // Calculate percentages
    const results: ToolResult[] = matrix.tools.map(tool => ({
      tool,
      absoluteScore: scores[tool],
      percentageScore: maxPossible > 0 ? (scores[tool] / maxPossible) * 100 : 0,
      rank: 0
    }));

    // Sort by score and assign ranks
    results.sort((a, b) => b.absoluteScore - a.absoluteScore);
    results.forEach((result, index) => result.rank = index + 1);

    // Get recommended tool (highest score)
    const recommendedTool = results[0].tool;

    // Calculate confidence
    const confidence = this.calculateConfidence(results);
    const confidencePercentage = results[0].percentageScore - results[1].percentageScore;

    // Find decisive factors
    const decisiveFactors = await this.findDecisiveFactors(session, matrix.matrix, results[0].tool, results[1].tool);

    return {
      sessionId: session.sessionId,
      clientName: session.clientName,
      recommendedTool,
      confidence,
      confidencePercentage,
      results,
      decisiveFactors,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate confidence level based on score differences
   */
  static calculateConfidence(results: ToolResult[]): 'low' | 'medium' | 'high' {
    if (results.length < 2) return 'high';

    const diff = results[0].percentageScore - results[1].percentageScore;

    if (diff >= 15) return 'high';
    if (diff >= 8) return 'medium';
    return 'low';
  }

  /**
   * Find decisive factors (questions that made the biggest difference)
   */
  static async findDecisiveFactors(
    session: SelectorSession,
    matrixEntries: any[],
    topTool: string,
    secondTool: string
  ): Promise<DecisiveFactor[]> {
    const questions = await SelectorConfigService.loadQuestions();
    const factors: DecisiveFactor[] = [];

    for (const answer of session.answers) {
      const matrixEntry = matrixEntries.find(
        e => e.questionId === answer.questionId && e.answer === answer.answer
      );

      if (matrixEntry) {
        const topScore = matrixEntry.scores.find((s: any) => s.tool === topTool)?.score || 0;
        const secondScore = matrixEntry.scores.find((s: any) => s.tool === secondTool)?.score || 0;
        const impact = Math.abs(topScore - secondScore);

        if (impact > 0) {
          // Find question text
          let questionText = answer.questionId;
          for (const category of questions.categories) {
            const q = category.questions.find(q => q.id === answer.questionId);
            if (q) {
              questionText = q.text;
              break;
            }
          }

          factors.push({
            questionId: answer.questionId,
            questionText,
            answer: answer.answer,
            impact,
            affectedTools: [topTool, secondTool]
          });
        }
      }
    }

    // Sort by impact and return top 5
    factors.sort((a, b) => b.impact - a.impact);
    return factors.slice(0, 5);
  }

  /**
   * Validate that all required questions are answered
   */
  static validateComplete(session: SelectorSession, totalQuestions: number): boolean {
    return session.answers.length === totalQuestions;
  }
}
