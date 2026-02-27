import { PDFParse } from 'pdf-parse';
import { MraData, ValidationResult } from '../../../shared/types/opportunity.types';

export class PdfParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfParseError';
  }
}

export class PdfParserService {
  /**
   * Parse PDF from buffer and extract structured content
   * @param buffer - PDF file buffer
   * @returns Structured MRA data
   * @throws PdfParseError if parsing fails
   */
  async parsePdf(buffer: Buffer): Promise<MraData> {
    try {
      // Parse PDF to extract text
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const rawText = textResult.text;

      // Validate minimum content length
      if (rawText.length < 100) {
        throw new PdfParseError('PDF content is too short. Minimum 100 characters required.');
      }

      // Extract structured data using heuristics
      const mraData: MraData = {
        maturityLevel: this.extractMaturityLevel(rawText),
        securityGaps: this.extractSecurityGaps(rawText),
        drStrategy: this.extractDRStrategy(rawText),
        backupStrategy: this.extractBackupStrategy(rawText),
        complianceRequirements: this.extractComplianceRequirements(rawText),
        technicalDebt: this.extractTechnicalDebt(rawText),
        recommendations: this.extractRecommendations(rawText),
        rawText: rawText
      };

      return mraData;
    } catch (error) {
      if (error instanceof PdfParseError) {
        throw error;
      }
      throw new PdfParseError(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate PDF structure and content
   * @param buffer - PDF file buffer
   * @returns Validation result with errors if any
   */
  async validatePdf(buffer: Buffer): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if buffer is valid
      if (!buffer || buffer.length === 0) {
        errors.push('PDF buffer is empty');
        return { valid: false, errors, warnings };
      }

      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (buffer.length > maxSize) {
        errors.push(`PDF file size exceeds maximum allowed size of 50MB`);
        return { valid: false, errors, warnings };
      }

      // Try to parse the PDF
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      
      // Check if text was extracted
      if (!textResult.text || textResult.text.length === 0) {
        errors.push('No text content could be extracted from PDF');
        return { valid: false, errors, warnings };
      }

      // Check minimum content length
      if (textResult.text.length < 100) {
        warnings.push('PDF content is very short (less than 100 characters)');
      }

      // Check for common MRA sections (warnings only)
      const hasMaturitySection = /maturity|madurez/i.test(textResult.text);
      const hasSecuritySection = /security|seguridad|gap|brecha/i.test(textResult.text);
      
      if (!hasMaturitySection) {
        warnings.push('No maturity level section detected');
      }
      
      if (!hasSecuritySection) {
        warnings.push('No security gaps section detected');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`PDF validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Extract maturity level from text (1-5 scale)
   */
  private extractMaturityLevel(text: string): number {
    // Look for patterns like "Maturity Level: 3", "Nivel de Madurez: 3", "Level 3", etc.
    const patterns = [
      /maturity\s+level[:\s]+(\d)/i,
      /nivel\s+de\s+madurez[:\s]+(\d)/i,
      /level[:\s]+(\d)/i,
      /nivel[:\s]+(\d)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const level = parseInt(match[1], 10);
        if (level >= 1 && level <= 5) {
          return level;
        }
      }
    }

    // Default to level 2 if not found
    return 2;
  }

  /**
   * Extract security gaps from text
   */
  private extractSecurityGaps(text: string): string[] {
    const gaps: string[] = [];
    
    // Look for security gaps section
    const securitySection = this.extractSection(text, [
      'security gaps',
      'brechas de seguridad',
      'security findings',
      'hallazgos de seguridad'
    ]);

    if (securitySection) {
      // Extract bullet points or numbered items
      const items = this.extractListItems(securitySection);
      gaps.push(...items);
    }

    // If no gaps found, add a default message
    if (gaps.length === 0) {
      gaps.push('No specific security gaps identified in document');
    }

    return gaps;
  }

  /**
   * Extract DR strategy from text
   */
  private extractDRStrategy(text: string): string {
    const drSection = this.extractSection(text, [
      'disaster recovery',
      'recuperación ante desastres',
      'dr strategy',
      'estrategia de dr',
      'business continuity',
      'continuidad del negocio'
    ]);

    if (drSection) {
      // Return first paragraph or up to 500 characters
      return drSection.substring(0, 500).trim();
    }

    return 'No disaster recovery strategy documented';
  }

  /**
   * Extract backup strategy from text
   */
  private extractBackupStrategy(text: string): string {
    const backupSection = this.extractSection(text, [
      'backup strategy',
      'estrategia de respaldo',
      'backup',
      'respaldo',
      'data protection',
      'protección de datos'
    ]);

    if (backupSection) {
      return backupSection.substring(0, 500).trim();
    }

    return 'No backup strategy documented';
  }

  /**
   * Extract compliance requirements from text
   */
  private extractComplianceRequirements(text: string): string[] {
    const requirements: string[] = [];
    
    const complianceSection = this.extractSection(text, [
      'compliance',
      'cumplimiento',
      'regulatory',
      'regulatorio',
      'standards',
      'estándares'
    ]);

    if (complianceSection) {
      const items = this.extractListItems(complianceSection);
      requirements.push(...items);
    }

    if (requirements.length === 0) {
      requirements.push('No specific compliance requirements identified');
    }

    return requirements;
  }

  /**
   * Extract technical debt from text
   */
  private extractTechnicalDebt(text: string): string[] {
    const debt: string[] = [];
    
    const debtSection = this.extractSection(text, [
      'technical debt',
      'deuda técnica',
      'legacy',
      'obsolete',
      'obsoleto',
      'end of life',
      'fin de vida'
    ]);

    if (debtSection) {
      const items = this.extractListItems(debtSection);
      debt.push(...items);
    }

    if (debt.length === 0) {
      debt.push('No specific technical debt identified');
    }

    return debt;
  }

  /**
   * Extract recommendations from text
   */
  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = [];
    
    const recSection = this.extractSection(text, [
      'recommendations',
      'recomendaciones',
      'next steps',
      'próximos pasos',
      'action items',
      'elementos de acción'
    ]);

    if (recSection) {
      const items = this.extractListItems(recSection);
      recommendations.push(...items);
    }

    if (recommendations.length === 0) {
      recommendations.push('No specific recommendations provided');
    }

    return recommendations;
  }

  /**
   * Extract a section of text based on header keywords
   */
  private extractSection(text: string, keywords: string[]): string | null {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[:\\s]*([\\s\\S]{0,2000})`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        // Extract until next major section or 2000 chars
        const section = match[1];
        const nextSectionMatch = section.match(/\n\n[A-Z][^a-z]{10,}|^\d+\.\s+[A-Z]/m);
        if (nextSectionMatch && nextSectionMatch.index) {
          return section.substring(0, nextSectionMatch.index);
        }
        return section;
      }
    }
    return null;
  }

  /**
   * Extract list items from text (bullet points, numbered lists)
   */
  private extractListItems(text: string): string[] {
    const items: string[] = [];
    
    // Match bullet points (-, *, •) or numbered lists (1., 2., etc.)
    const patterns = [
      /^[\s]*[-*•]\s+(.+)$/gm,
      /^[\s]*\d+\.\s+(.+)$/gm
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const item = match[1].trim();
          if (item.length > 10 && item.length < 500) {
            items.push(item);
          }
        }
      }
    }

    // If no list items found, try to extract sentences
    if (items.length === 0) {
      const sentences = text.split(/[.!?]\s+/);
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && trimmed.length < 500) {
          items.push(trimmed);
          if (items.length >= 5) break; // Limit to 5 items
        }
      }
    }

    return items;
  }
}
