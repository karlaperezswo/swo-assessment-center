import mammoth from 'mammoth';
import { QuestionnaireData } from '../../../shared/types/opportunity.types';

/**
 * Service to parse Infrastructure Questionnaire from Word documents.
 *
 * Extraction rules based on real SoftwareONE questionnaire structure:
 *
 * 1. CLIENT NAME  — fixed sentence: "infraestructura en [NAME] con relación"
 * 2. METADATA     — label/value pairs in alternating non-empty lines
 *                   (Versión, Fecha respuesta, Consultor SWO, Responsable Cliente)
 * 3. MULTIPLE CHOICE — options followed by (X) or ( ), case-insensitive
 * 4. YES/NO       — question ends in ?, next non-empty line is SI/NO + optional (X)
 * 5. OPEN ANSWER  — question ends in ?, next non-empty line that is not a list option
 * 6. COMMENTS     — lines starting with "Comentarios:"
 */
export class QuestionnaireParserService {

  async parseQuestionnaire(buffer: Buffer): Promise<QuestionnaireData> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const rawText = result.value;
      const lines = rawText.split('\n').map(l => l.trim());
      const nonEmpty = lines.filter(l => l.length > 0);

      const data = this.extractAll(nonEmpty, rawText);
      return { ...data, rawText };
    } catch (error) {
      console.error('[QuestionnaireParser] Error parsing Word document:', error);
      throw new Error(`Failed to parse questionnaire: ${(error as Error).message}`);
    }
  }

  private extractAll(lines: string[], rawText: string): Omit<QuestionnaireData, 'rawText'> {
    return {
      clientName:           this.extractClientName(rawText),
      industry:             this.extractOpenAnswer(lines, ['industria', 'sector', 'vertical', 'industry', 'giro']),
      location:             this.extractOpenAnswer(lines, ['ubicación', 'sede', 'localización', 'location', 'headquarters']),
      companySize:          this.extractOpenAnswer(lines, ['tamaño de la empresa', 'empleados', 'company size', 'employees']),
      executiveContact:     this.extractMetaField(lines, 'responsable cliente'),
      technicalContact:     this.extractOpenAnswer(lines, ['contacto técnico', 'technical contact', 'it contact']),
      primaryDatacenter:    this.extractOpenAnswer(lines, ['datacenter principal', 'primary datacenter', 'main datacenter']),
      secondaryDatacenters: this.extractListAfterKeyword(lines, ['datacenters secundarios', 'secondary datacenters']),
      cloudProviders:       this.extractSelectedOptions(lines, ['aws', 'azure', 'gcp', 'google cloud', 'oracle cloud', 'ibm cloud']),
      connectivity:         this.extractOpenAnswer(lines, ['topología de red', 'organizada la topología', 'connectivity']),
      criticalApplications: this.extractListAfterKeyword(lines, ['aplicaciones críticas', 'critical applications', 'aplicaciones clave']),
      databases:            this.extractListAfterKeyword(lines, ['base de datos', 'databases', 'db platforms']),
      middleware:           this.extractListAfterKeyword(lines, ['middleware', 'application servers']),
      operatingSystems:     this.extractSelectedOptions(lines, ['windows', 'linux', 'unix', 'centos', 'rhel', 'ubuntu', 'debian']),
      priorities:           this.extractListAfterKeyword(lines, ['prioridades', 'priorities', 'objetivos principales']),
      complianceRequirements: this.extractListAfterKeyword(lines, ['certificaciones', 'compliance', 'regulaciones', 'normativas', 'iso', 'pci']),
      maintenanceWindows:   this.extractListAfterKeyword(lines, ['ventanas de mantenimiento', 'maintenance windows']),
      migrationRestrictions: this.extractListAfterKeyword(lines, ['restricciones', 'constraints', 'limitaciones']),
      budget:               this.extractOpenAnswer(lines, ['presupuesto', 'budget', 'inversión']),
      timeline:             this.extractOpenAnswer(lines, ['fecha objetivo', 'plazo estimado', 'fecha de inicio', 'cuándo planean', 'timeline', 'schedule']),
      licenseContracts:     this.extractListAfterKeyword(lines, ['licencias', 'license contracts', 'contratos de licencia']),
      endOfSupport:         this.extractListAfterKeyword(lines, ['fin de soporte', 'end of support', 'end of life', 'eol']),
      currentProblems:      this.extractListAfterKeyword(lines, ['problemas actuales', 'pain points', 'retos', 'desafíos', 'challenges']),
      ongoingProjects:      this.extractListAfterKeyword(lines, ['proyectos en curso', 'ongoing projects', 'iniciativas']),
      teamSize:             this.extractOpenAnswer(lines, ['tamaño del equipo', 'team size', 'personal de ti', 'it team']),
      awsExperience:        this.extractOpenAnswer(lines, ['experiencia aws', 'aws experience', 'cloud experience']),
      certifications:       this.extractListAfterKeyword(lines, ['certificaciones aws', 'aws certifications', 'certified']),
      currentSupport:       this.extractListAfterKeyword(lines, ['soporte actual', 'current support', 'managed services']),
      expectedGrowth:       this.extractOpenAnswer(lines, ['crecimiento esperado', 'expected growth', 'crecimiento']),
      newMarkets:           this.extractListAfterKeyword(lines, ['nuevos mercados', 'new markets', 'expansión']),
      digitalInitiatives:   this.extractListAfterKeyword(lines, ['iniciativas digitales', 'digital initiatives', 'transformación digital']),
      kpis:                 this.extractListAfterKeyword(lines, ['kpis', 'indicadores', 'métricas de éxito']),
      decisionDrivers:      this.extractListAfterKeyword(lines, ['drivers', 'factores de decisión', 'decision drivers']),
    };
  }

  /**
   * Extract client name from the fixed sentence:
   * "infraestructura en [NAME] con relación"
   * Works regardless of case.
   */
  private extractClientName(rawText: string): string {
    const match = rawText.match(/infraestructura en (.+?) con relaci[oó]n/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    // Fallback: look for "Responsable Cliente" metadata
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return this.extractMetaField(lines, 'responsable cliente');
  }

  /**
   * Extract metadata field (label on one line, value on the next non-empty line).
   * e.g. "Consultor SWO\n\nDavid Escalier"
   */
  private extractMetaField(lines: string[], label: string): string {
    const idx = lines.findIndex(l => l.toLowerCase().includes(label.toLowerCase()));
    if (idx >= 0 && idx + 1 < lines.length) {
      const next = lines[idx + 1];
      // Make sure it's not another label (labels are short, < 40 chars, no ?)
      if (next && next.length < 100 && !next.includes('?')) {
        return next.trim();
      }
    }
    return '';
  }

  /**
   * Extract the answer to an open question.
   * Finds the line containing any of the keywords, then returns
   * the next non-empty line that is not a list option or another question.
   */
  private extractOpenAnswer(lines: string[], keywords: string[]): string {
    for (const keyword of keywords) {
      const idx = lines.findIndex(l => l.toLowerCase().includes(keyword.toLowerCase()));
      if (idx < 0) continue;

      // Look at the next few lines for the answer
      for (let i = idx + 1; i < Math.min(idx + 5, lines.length); i++) {
        const line = lines[i];
        if (!line || line.length === 0) continue;
        // Skip if it looks like a list option with (X) or ( )
        if (/\([Xx ]\)/.test(line)) continue;
        // Skip if it's another question
        if (line.endsWith('?')) continue;
        // Skip if it's a section header (short, no spaces, all caps or title case)
        if (line.length < 4) continue;
        // Skip if it looks like a section number
        if (/^\d+\.\d*\s/.test(line)) continue;
        // Skip if it's a label from the index/TOC (contains page numbers at end)
        if (/\d+$/.test(line) && line.length < 60) continue;
        return line.trim();
      }
    }
    return '';
  }

  /**
   * Extract selected options from multiple-choice questions.
   * An option is selected if the line contains (X) or (x).
   * Returns all selected option labels.
   */
  private extractSelectedOptions(lines: string[], optionKeywords: string[]): string[] {
    const selected: string[] = [];
    for (const line of lines) {
      const lower = line.toLowerCase();
      const isSelected = /\([Xx]\)/.test(line);
      if (isSelected) {
        for (const kw of optionKeywords) {
          if (lower.includes(kw.toLowerCase())) {
            // Extract the option label (text before the (X))
            const label = line.replace(/\s*\([Xx]\)\s*$/, '').trim();
            if (label && !selected.includes(label)) {
              selected.push(label);
            }
            break;
          }
        }
      }
    }
    return selected;
  }

  /**
   * Extract a list of items after a keyword line.
   * Collects non-empty lines until the next question or section header.
   */
  private extractListAfterKeyword(lines: string[], keywords: string[]): string[] {
    for (const keyword of keywords) {
      const idx = lines.findIndex(l => l.toLowerCase().includes(keyword.toLowerCase()));
      if (idx < 0) continue;

      const items: string[] = [];
      for (let i = idx + 1; i < Math.min(idx + 15, lines.length); i++) {
        const line = lines[i];
        if (!line || line.length === 0) continue;
        // Stop at next question or major section
        if (line.endsWith('?')) break;
        if (/^\d+\.\d*\s/.test(line)) break;
        // Stop at known section headers
        if (/^(Continuidad|Disaster Recovery|Backup|Monitoreo|Gobierno|Aplicaciones|Base de Datos|Redes|Almacenamiento|Seguridad|Infraestructura|Preparaci)/i.test(line)) break;
        // Skip pure option markers
        if (line === '(X)' || line === '( )') continue;
        // Skip very short lines
        if (line.length < 3) continue;
        // Skip lines that are just "El especialista..." intro text
        if (line.toLowerCase().startsWith('el especialista')) break;
        items.push(line.trim());
      }
      if (items.length > 0) return items;
    }
    return [];
  }

  validateQuestionnaire(data: QuestionnaireData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data.rawText || data.rawText.trim().length < 100) {
      errors.push('Questionnaire content is too short or empty');
    }
    return { valid: errors.length === 0, errors };
  }
}
