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
}

export interface DictionaryEntry {
  id: string;
  term: string;
  definition: string;
  category: string;
  selected: boolean; // si está seleccionado se incluye en el Word
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

  // Company info (scraped)
  clientMission: string;
  clientVision: string;
  clientAbout: string;

  // Document sections
  introduction: string;
  challenges: string;
  conclusions: string;

  // AWS Services
  services: AWSServiceEntry[];

  // Dictionary / Knowledge base
  dictionary: DictionaryEntry[];

  // Thank you letter
  thankYouLetter: string;
  itTeam: string;
}
