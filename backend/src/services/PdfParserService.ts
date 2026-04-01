import { extractText, getDocumentProxy } from 'unpdf';
import { MraData, ValidationResult } from '../../../shared/types/opportunity.types';

export class PdfParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfParseError';
  }
}

/**
 * Parser for AWS Migration Readiness Assessment (MRA) PDF reports.
 *
 * The AWS MRA report has this structure in the "Ratings Responses" section:
 *   [Category] [Sub-category] Question Response Comments
 *   [question text] [score] [score] - [description]
 *
 * Scores are 1-5 per question. We calculate the overall maturity level
 * as the average of all scores found.
 *
 * Security gaps are extracted from questions in the "Security & Compliance" section
 * that have scores of 1 or 2 (low maturity).
 *
 * DR strategy is extracted from the BCP/DR section response.
 *
 * Recommendations are extracted from "Text Responses" section (open-ended answers).
 */
export class PdfParserService {

  async parsePdf(buffer: Buffer): Promise<MraData> {
    try {
      const rawText = await this.extractTextFromPdf(buffer);

      if (rawText.length < 100) {
        throw new PdfParseError('PDF content is too short. Minimum 100 characters required.');
      }

      const mraData: MraData = {
        maturityLevel:          this.extractMaturityLevel(rawText),
        securityGaps:           this.extractSecurityGaps(rawText),
        drStrategy:             this.extractDRStrategy(rawText),
        backupStrategy:         this.extractBackupStrategy(rawText),
        complianceRequirements: this.extractComplianceRequirements(rawText),
        technicalDebt:          this.extractTechnicalDebt(rawText),
        recommendations:        this.extractRecommendations(rawText),
        rawText,
      };

      return mraData;
    } catch (error) {
      if (error instanceof PdfParseError) throw error;
      throw new PdfParseError(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { totalPages, text } = await extractText(pdf, { mergePages: true });
      console.log(`[PDF Parser] Extracted text from ${totalPages} pages`);
      return text;
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MATURITY LEVEL
  // Extracts all "N N - description" score patterns and averages them.
  // AWS MRA scores are 1-5 per question.
  // ─────────────────────────────────────────────────────────────────────────
  private extractMaturityLevel(text: string): number {
    // Pattern: "N N - description" where N is 1-5
    // The score appears twice (response + confirmation) before the dash
    const scorePattern = /\b([1-5])\s+\1\s*-\s+[A-Z]/g;
    const scores: number[] = [];
    let match;
    while ((match = scorePattern.exec(text)) !== null) {
      scores.push(parseInt(match[1], 10));
    }

    if (scores.length === 0) {
      // Fallback: look for single score pattern
      const singlePattern = /\b([1-5])\s*-\s+[A-Z][a-z]/g;
      while ((match = singlePattern.exec(text)) !== null) {
        scores.push(parseInt(match[1], 10));
      }
    }

    if (scores.length === 0) return 2; // default

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(avg);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SECURITY GAPS
  // Finds questions in Security & Compliance section with score 1 or 2.
  // ─────────────────────────────────────────────────────────────────────────
  private extractSecurityGaps(text: string): string[] {
    const gaps: string[] = [];

    // Find the Security & Compliance section
    const secStart = text.search(/Security\s*&\s*Compliance\s+Security\s+Strategy/i);
    if (secStart < 0) {
      return ['No security section found in document'];
    }

    // Find end of security section (next major section or end)
    const secEnd = text.search(/Text\s+Responses|Optional\s+Question/i);
    const secText = text.substring(secStart, secEnd > secStart ? secEnd : secStart + 5000);

    // Extract low-score items (1 or 2) with their context
    // Pattern: question text followed by "1 1 -" or "2 2 -" + description
    const lowScorePattern = /([^.?]+\?[^1-5]*?)([12])\s+\2\s*-\s*([^\n.]{20,200})/g;
    let match;
    while ((match = lowScorePattern.exec(secText)) !== null) {
      const description = match[3].trim();
      if (description.length > 10 && !gaps.includes(description)) {
        gaps.push(description);
      }
    }

    // Also extract section names with low scores as gap indicators
    const sectionGaps = [
      { pattern: /3rd Party Risk[^1-5]*?1\s+1\s*-/i, label: '3rd Party Risk: assessment not started' },
      { pattern: /DevSecOps[^1-5]*?[12]\s+[12]\s*-/i, label: 'DevSecOps: security automation not implemented' },
      { pattern: /Security Operations[^1-5]*?[12]\s+[12]\s*-/i, label: 'Security Operations: playbook not tested' },
    ];

    for (const { pattern, label } of sectionGaps) {
      if (pattern.test(secText) && !gaps.some(g => g.toLowerCase().includes(label.split(':')[0].toLowerCase()))) {
        gaps.push(label);
      }
    }

    return gaps.length > 0 ? gaps.slice(0, 8) : ['No critical security gaps identified'];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DR STRATEGY
  // Extracts the BCP/DR section response.
  // ─────────────────────────────────────────────────────────────────────────
  private extractDRStrategy(text: string): string {
    // Look for BCP/DR question response pattern
    const drMatch = text.match(/BCP\/DR\s+(?:Question\s+Response\s+Comments\s+)?[^1-5]*?([1-5])\s+\1\s*-\s*([^.]{20,400})/i);
    if (drMatch) {
      return `Score ${drMatch[1]}/5 - ${drMatch[2].trim()}`;
    }

    // Fallback: look for disaster recovery text response
    const drTextMatch = text.match(/disaster\s+recovery[^.]*\.\s*([^.]{30,300})/i);
    if (drTextMatch) return drTextMatch[1].trim();

    return 'No disaster recovery strategy documented';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BACKUP STRATEGY
  // ─────────────────────────────────────────────────────────────────────────
  private extractBackupStrategy(text: string): string {
    // Try the standard pattern first
    const backupMatch = text.match(/Backup\s+(?:Question\s+Response\s+Comments\s+)?[^1-5]*?([1-5])\s+\1\s*-\s*([^.]{20,400})/i);
    if (backupMatch) {
      return `Score ${backupMatch[1]}/5 - ${backupMatch[2].trim()}`;
    }
    // Fallback: find "Backup" section and grab the score description nearby
    const backupIdx = text.search(/\bBackup\b[^a-z]/);
    if (backupIdx >= 0) {
      const nearby = text.substring(backupIdx, backupIdx + 600);
      const scoreMatch = nearby.match(/([1-5])\s+\1\s*-\s*([^.]{20,300})/);
      if (scoreMatch) return `Score ${scoreMatch[1]}/5 - ${scoreMatch[2].trim()}`;
    }
    return 'No backup strategy documented';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMPLIANCE REQUIREMENTS
  // Extracts from text responses (open-ended question about PCI, SOC2, etc.)
  // ─────────────────────────────────────────────────────────────────────────
  private extractComplianceRequirements(text: string): string[] {
    const requirements: string[] = [];

    // Look for compliance question in Text Responses section
    const complianceMatch = text.match(/workloads that require specific security architecture[^?]+\?\s*([^\n\d]{5,200})/i);
    if (complianceMatch) {
      const answer = complianceMatch[1].trim();
      if (answer.toLowerCase() !== 'no' && answer.length > 2) {
        requirements.push(answer);
      }
    }

    // Look for explicit compliance mentions
    const complianceKeywords = ['PCI', 'SOC2', 'NIST', 'HITRUST', 'FedRAMP', 'GDPR', 'HIPAA', 'ISO 27001'];
    for (const kw of complianceKeywords) {
      if (new RegExp(kw, 'i').test(text)) {
        requirements.push(kw);
      }
    }

    return requirements.length > 0 ? [...new Set(requirements)] : ['No specific compliance requirements identified'];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TECHNICAL DEBT
  // Low scores (1-2) in non-security sections indicate technical debt.
  // ─────────────────────────────────────────────────────────────────────────
  private extractTechnicalDebt(text: string): string[] {
    const debt: string[] = [];

    // Find Ratings Responses section
    const ratingsStart = text.search(/Ratings\s+Responses/i);
    const secStart = text.search(/Security\s*&\s*Compliance/i);
    if (ratingsStart < 0) return ['No ratings section found'];

    // Only look before Security section for non-security technical debt
    const ratingsText = text.substring(ratingsStart, secStart > ratingsStart ? secStart : ratingsStart + 8000);

    // Extract low-score items
    const lowScorePattern = /([1-2])\s+\1\s*-\s*([^.]{20,200})/g;
    let match;
    while ((match = lowScorePattern.exec(ratingsText)) !== null) {
      const description = match[2].trim();
      if (description.length > 10 && !debt.includes(description)) {
        debt.push(`Score ${match[1]}/5: ${description}`);
      }
    }

    return debt.length > 0 ? debt.slice(0, 6) : ['No significant technical debt identified'];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RECOMMENDATIONS
  // Extracts from "Text Responses" open-ended section.
  // ─────────────────────────────────────────────────────────────────────────
  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];

    // Find Text Responses section
    const textRespStart = text.search(/Text\s+Responses/i);
    if (textRespStart < 0) return ['No text responses found'];

    const textRespSection = text.substring(textRespStart, textRespStart + 6000);

    // Extract numbered responses: "N [question] [answer]"
    // Pattern: number, question text, then the answer (in Spanish or English)
    const responsePattern = /\b(\d+)\s+[A-Z][^?]+\?\s*([^0-9\n]{30,500}?)(?=\s*\d+\s+[A-Z]|$)/g;
    let match;
    while ((match = responsePattern.exec(textRespSection)) !== null) {
      const answer = match[2].trim();
      if (answer.length > 20 && !answer.toLowerCase().startsWith('no ') && answer.toLowerCase() !== 'no') {
        recommendations.push(answer.substring(0, 300));
      }
    }

    return recommendations.length > 0 ? recommendations.slice(0, 5) : ['No specific recommendations provided'];
  }

  async validatePdf(buffer: Buffer): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!buffer || buffer.length === 0) {
        errors.push('PDF buffer is empty');
        return { valid: false, errors, warnings };
      }

      if (buffer.length > 50 * 1024 * 1024) {
        errors.push('PDF file size exceeds maximum allowed size of 50MB');
        return { valid: false, errors, warnings };
      }

      const text = await this.extractTextFromPdf(buffer);

      if (!text || text.length === 0) {
        errors.push('No text content could be extracted from PDF');
        return { valid: false, errors, warnings };
      }

      if (text.length < 100) {
        warnings.push('PDF content is very short (less than 100 characters)');
      }

      if (!/migration readiness|MRA|assessment/i.test(text)) {
        warnings.push('Document does not appear to be an AWS MRA report');
      }

      return { valid: errors.length === 0, errors, warnings };
    } catch (error) {
      errors.push(`PDF validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors, warnings };
    }
  }
}
