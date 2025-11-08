export type ChemicalState =
  | 'sober'
  | 'psychedelic'
  | 'prescription'
  | 'stimulant'
  | 'depressant'
  | 'withdrawal'
  | 'unknown';

export type RegulationLevel = 'low' | 'medium' | 'high';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface NavigatorProfile {
  id: string;
  name: string;
  description: string;
  color_theme: string;
  essence_labels: string[];
  entry_message: string;
  safety_parameters: {
    visual_intensity?: string;
    pacing?: string;
    safety_checks?: string;
    grounding_emphasis?: string;
    reflection_prompts?: string;
    challenge_level?: string;
    play_emphasis?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface NavigatorQuestion {
  id: string;
  question_text: string;
  input_type: 'scale' | 'multi' | 'boolean';
  options: string[];
  weight_map: Record<string, number[] | { mapping: Record<string, string> }>;
  semantic_tags: string[];
  order_index: number;
}

export interface NavigatorPath {
  id: string;
  profile_id: string;
  target_track_id: string;
  chemical_state_filter: ChemicalState | null;
  priority: number;
  prerequisites: Record<string, any>;
  pacing_parameters: Record<string, any>;
}

export interface UserStateProfile {
  user_id: string;
  profile_id: string;
  chemical_state: ChemicalState;
  regulation_level: RegulationLevel;
  last_updated: string;
  custom_notes?: string;
  integrity_score: number;
}

export interface NavigatorAssessment {
  id: string;
  user_id: string;
  session_id: string;
  responses: Record<string, any>;
  calculated_profile: string;
  profile_scores: Record<string, number>;
  chemical_state: ChemicalState;
  regulation_level: RegulationLevel;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AssessmentResponse {
  questionId: string;
  answer: number | string;
}

export interface ProfileScore {
  profileName: string;
  score: number;
  percentage: number;
}

export interface RoutingResult {
  targetTrackId: string;
  profile: NavigatorProfile;
  chemicalState: ChemicalState;
  regulationLevel: RegulationLevel;
  pacingParameters: Record<string, any>;
  safetyMode: boolean;
  safetyReason?: string;
}
