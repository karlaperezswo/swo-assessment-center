export interface AWSServiceEntry {
  id: string;
  serviceName: string;
  title: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  useCases: string[];
  whyUsed: string; // editable by user
  docsUrl: string;
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

  // Thank you letter
  thankYouLetter: string;
  itTeam: string;
}
