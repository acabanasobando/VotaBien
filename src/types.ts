export type PillarType = 
  | 'Economía'
  | 'Educación'
  | 'Salud'
  | 'Seguridad'
  | 'Gobierno'
  | 'Infraestructura'
  | 'Medio Ambiente';

export interface SubIndicator {
  name: string;
  score: number;
  description: string;
}

export interface PillarEvaluation {
  pillar: PillarType;
  score: number;
  justification: string;
  userRating?: number; // User's own rating
  subIndicators?: SubIndicator[]; // For Economy
}

export interface GovernmentEvaluation {
  country: string;
  state: string;
  administration: string;
  periodDuration?: number;
  pillars: PillarEvaluation[];
  averageScore: number;
  finalEvaluation: string;
  classification: 'Malo' | 'Regular' | 'Bueno';
}
