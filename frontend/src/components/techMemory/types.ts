export interface AWSServiceEntry {
  id: string;
  serviceName: string;
  title: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  useCases: string[];
  keyPoints: string[];
  whyUsed: string;
  docsUrl: string;
  // Campos extendidos del protocolo Well-Architected
  summary?: string;
  features?: string[];
  security?: string[];
  cost?: string[];
  quotas?: string[];
}

export interface DictionaryEntry {
  id: string;
  term: string;
  definition: string;
  category: string;
  selected: boolean;
  imageBase64?: string;
}

export interface DictionaryCategory {
  name: string;
  imageBase64?: string; // imagen de portada de la categoría
}

export interface WellArchPillar {
  id: string;
  name: string;
  icon: string;
  color: string;
  recommendations: string[];
}

export interface TechMemoryData {
  // Project info
  projectName: string;
  clientName: string;
  clientUrl: string;
  clientLogoBase64: string;
  swoLogoBase64: string;
  date: string;
  authors: string;
  version: string;
  consultorName: string;
  consultorEmail: string;
  consultorSignature: string;

  // Company info (scraped)
  clientMission: string;
  clientVision: string;
  clientAbout: string;

  // Document sections
  introduction: string;
  infraSummary: string;
  conclusions: string;

  // AWS Services
  services: AWSServiceEntry[];

  // Dictionary / Knowledge base
  dictionary: DictionaryEntry[];
  dictCategories: DictionaryCategory[]; // imágenes por categoría

  // Well-Architected recommendations
  wellArch: WellArchPillar[];

  // Thank you letter
  thankYouLetter: string;
  thankYouDate: string;
  itTeam: string;
}
