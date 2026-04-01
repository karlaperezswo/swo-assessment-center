import mammoth from 'mammoth';
import { QuestionnaireData } from '../../../shared/types/opportunity.types';

/**
 * Service to parse Infrastructure Questionnaire.
 * Supports two formats:
 *
 * 1. DOCX (.docx / .doc) — SoftwareONE Word questionnaire
 *    Rules based on real document structure (label/value pairs, (X) options, open answers)
 *
 * 2. CSV (.csv) — New structured export format
 *    METADATA section: Owner, Enterprise (= clientName), Date Submitted, Id-Session
 *    RESPONSES section: Question ID, Original Question, Response, Comment, File URLs
 */
export class QuestionnaireParserService {

  /**
   * Auto-detect format from filename or content and parse accordingly.
   * @param buffer   - File buffer
   * @param filename - Optional filename to help detect format (e.g. "questionnaire.csv")
   */
  async parseQuestionnaire(buffer: Buffer, filename?: string): Promise<QuestionnaireData> {
    const isCsv = this.isCsvFormat(buffer, filename);
    if (isCsv) {
      return this.parseCsv(buffer);
    }
    return this.parseDocx(buffer);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FORMAT DETECTION
  // ─────────────────────────────────────────────────────────────────────────

  private isCsvFormat(buffer: Buffer, filename?: string): boolean {
    // Check by filename extension first
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase();
      if (ext === 'csv') return true;
      if (ext === 'docx' || ext === 'doc') return false;
    }
    // Fallback: check if content starts with "METADATA" (CSV signature)
    const start = buffer.slice(0, 100).toString('utf8').trimStart();
    return start.startsWith('METADATA');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CSV PARSER
  // ─────────────────────────────────────────────────────────────────────────

  private parseCsv(buffer: Buffer): QuestionnaireData {
    const text = buffer.toString('utf8');
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // ── Parse METADATA section ──────────────────────────────────────────────
    const meta: Record<string, string> = {};
    let inResponses = false;
    const responses: Array<{ id: string; question: string; response: string; comment: string }> = [];

    for (const line of lines) {
      if (line === 'METADATA') continue;
      if (line.startsWith('RESPONSES')) { inResponses = true; continue; }
      if (line.startsWith('Question ID,')) continue; // header row

      if (!inResponses) {
        // METADATA rows: Key,Value
        const [key, ...rest] = this.parseCsvRow(line);
        if (key) meta[key.trim().toLowerCase()] = rest.join(',').trim();
      } else {
        // RESPONSES rows: Question ID, Original Question, Response, Comment, File URLs
        const cols = this.parseCsvRow(line);
        if (cols.length >= 3) {
          responses.push({
            id:       cols[0]?.trim() ?? '',
            question: cols[1]?.trim() ?? '',
            response: cols[2]?.trim() ?? '',
            comment:  cols[3]?.trim() ?? '',
          });
        }
      }
    }

    // ── Build QuestionnaireData from CSV ────────────────────────────────────
    const getResponse = (id: string) => responses.find(r => r.id === id)?.response ?? '';
    const getComment  = (id: string) => responses.find(r => r.id === id)?.comment ?? '';

    // Helper: find response by partial question text match
    const findByQuestion = (keywords: string[]): string => {
      for (const kw of keywords) {
        const found = responses.find(r => r.question.toLowerCase().includes(kw.toLowerCase()));
        if (found?.response) return found.response;
      }
      return '';
    };

    const findListByQuestion = (keywords: string[]): string[] => {
      const val = findByQuestion(keywords);
      if (!val) return [];
      // Responses can be semicolon or comma separated
      return val.split(/[;,]/).map(s => s.trim()).filter(s => s.length > 0);
    };

    const rawText = text;

    return {
      clientName:           meta['enterprise'] || meta['owner'] || '',
      industry:             findByQuestion(['industria', 'sector', 'vertical', 'industry']),
      location:             findByQuestion(['ubicación', 'sede', 'location', 'headquarters']),
      companySize:          findByQuestion(['tamaño', 'empleados', 'company size', 'employees']),
      executiveContact:     meta['owner'] || findByQuestion(['contacto ejecutivo', 'executive contact']),
      technicalContact:     findByQuestion(['contacto técnico', 'technical contact']),
      primaryDatacenter:    findByQuestion(['datacenter principal', 'primary datacenter']),
      secondaryDatacenters: findListByQuestion(['datacenters secundarios', 'secondary datacenters']),
      cloudProviders:       findListByQuestion(['proveedores de nube', 'cloud providers', 'cloud']),
      connectivity:         findByQuestion(['topología de red', 'connectivity', 'red']),
      criticalApplications: findListByQuestion(['aplicaciones críticas', 'critical applications']),
      databases:            findListByQuestion(['base de datos', 'databases']),
      middleware:           findListByQuestion(['middleware']),
      operatingSystems:     findListByQuestion(['sistemas operativos', 'operating systems']),
      priorities:           findListByQuestion(['prioridades', 'priorities']),
      complianceRequirements: findListByQuestion(['certificaciones', 'compliance', 'normativas', 'iso', 'pci']),
      maintenanceWindows:   findListByQuestion(['ventanas de mantenimiento', 'maintenance windows']),
      migrationRestrictions: findListByQuestion(['restricciones', 'constraints']),
      budget:               findByQuestion(['presupuesto', 'budget', 'inversión']),
      timeline:             findByQuestion(['fecha objetivo', 'plazo', 'timeline', 'schedule']),
      licenseContracts:     findListByQuestion(['licencias', 'license contracts']),
      endOfSupport:         findListByQuestion(['fin de soporte', 'end of support', 'eol']),
      currentProblems:      findListByQuestion(['problemas actuales', 'pain points', 'retos', 'challenges']),
      ongoingProjects:      findListByQuestion(['proyectos en curso', 'ongoing projects']),
      teamSize:             findByQuestion(['tamaño del equipo', 'team size']),
      awsExperience:        findByQuestion(['experiencia aws', 'aws experience']),
      certifications:       findListByQuestion(['certificaciones aws', 'certifications']),
      currentSupport:       findListByQuestion(['soporte actual', 'current support']),
      expectedGrowth:       findByQuestion(['crecimiento', 'growth']),
      newMarkets:           findListByQuestion(['nuevos mercados', 'new markets']),
      digitalInitiatives:   findListByQuestion(['iniciativas digitales', 'digital initiatives']),
      kpis:                 findListByQuestion(['kpis', 'indicadores']),
      decisionDrivers:      findListByQuestion(['drivers', 'factores de decisión']),
      rawText,
    };
  }

  /**
   * Parse a single CSV row respecting quoted fields.
   */
  private parseCsvRow(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DOCX PARSER
  // ─────────────────────────────────────────────────────────────────────────

  private async parseDocx(buffer: Buffer): Promise<QuestionnaireData> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const rawText = result.value;
      const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const data = this.extractAll(lines, rawText);
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

  private extractClientName(rawText: string): string {
    const match = rawText.match(/infraestructura en (.+?) con relaci[oó]n/i);
    if (match && match[1]) return match[1].trim();
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    return this.extractMetaField(lines, 'responsable cliente');
  }

  private extractMetaField(lines: string[], label: string): string {
    const idx = lines.findIndex(l => l.toLowerCase().includes(label.toLowerCase()));
    if (idx >= 0 && idx + 1 < lines.length) {
      const next = lines[idx + 1];
      if (next && next.length < 100 && !next.includes('?')) return next.trim();
    }
    return '';
  }

  private extractOpenAnswer(lines: string[], keywords: string[]): string {
    for (const keyword of keywords) {
      const idx = lines.findIndex(l => l.toLowerCase().includes(keyword.toLowerCase()));
      if (idx < 0) continue;
      for (let i = idx + 1; i < Math.min(idx + 5, lines.length); i++) {
        const line = lines[i];
        if (!line || line.length === 0) continue;
        if (/\([Xx ]\)/.test(line)) continue;
        if (line.endsWith('?')) continue;
        if (line.length < 4) continue;
        if (/^\d+\.\d*\s/.test(line)) continue;
        if (/\d+$/.test(line) && line.length < 60) continue;
        return line.trim();
      }
    }
    return '';
  }

  private extractSelectedOptions(lines: string[], optionKeywords: string[]): string[] {
    const selected: string[] = [];
    for (const line of lines) {
      const lower = line.toLowerCase();
      const isSelected = /\([Xx]\)/.test(line);
      if (isSelected) {
        for (const kw of optionKeywords) {
          if (lower.includes(kw.toLowerCase())) {
            const label = line.replace(/\s*\([Xx]\)\s*$/, '').trim();
            if (label && !selected.includes(label)) selected.push(label);
            break;
          }
        }
      }
    }
    return selected;
  }

  private extractListAfterKeyword(lines: string[], keywords: string[]): string[] {
    for (const keyword of keywords) {
      const idx = lines.findIndex(l => l.toLowerCase().includes(keyword.toLowerCase()));
      if (idx < 0) continue;
      const items: string[] = [];
      for (let i = idx + 1; i < Math.min(idx + 15, lines.length); i++) {
        const line = lines[i];
        if (!line || line.length === 0) continue;
        if (line.endsWith('?')) break;
        if (/^\d+\.\d*\s/.test(line)) break;
        if (/^(Continuidad|Disaster Recovery|Backup|Monitoreo|Gobierno|Aplicaciones|Base de Datos|Redes|Almacenamiento|Seguridad|Infraestructura|Preparaci)/i.test(line)) break;
        if (line === '(X)' || line === '( )') continue;
        if (line.length < 3) continue;
        if (line.toLowerCase().startsWith('el especialista')) break;
        items.push(line.trim());
      }
      if (items.length > 0) return items;
    }
    return [];
  }

  validateQuestionnaire(data: QuestionnaireData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data.rawText || data.rawText.trim().length < 50) {
      errors.push('Questionnaire content is too short or empty');
    }
    return { valid: errors.length === 0, errors };
  }
}
