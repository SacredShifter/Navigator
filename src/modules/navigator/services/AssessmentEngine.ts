import { supabase } from '../../../lib/supabase';
import type {
  NavigatorQuestion,
  NavigatorProfile,
  ProfileScore,
  ChemicalState,
  RegulationLevel
} from '../../../types/navigator';

export class AssessmentEngine {
  private questions: NavigatorQuestion[] = [];
  private profiles: NavigatorProfile[] = [];
  private responses: Map<string, any> = new Map();
  private sessionId: string = '';

  async initialize(): Promise<void> {
    await this.loadQuestions();
    await this.loadProfiles();
  }

  private async loadQuestions(): Promise<void> {
    const { data, error } = await supabase
      .from('navigator_questions')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error loading questions:', error);
      throw error;
    }

    this.questions = data || [];
  }

  private async loadProfiles(): Promise<void> {
    const { data, error } = await supabase
      .from('navigator_profiles')
      .select('*');

    if (error) {
      console.error('Error loading profiles:', error);
      throw error;
    }

    this.profiles = data || [];
  }

  startAssessment(): { sessionId: string; questions: NavigatorQuestion[] } {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.responses.clear();

    return {
      sessionId: this.sessionId,
      questions: this.questions
    };
  }

  submitResponse(questionId: string, answer: any): void {
    this.responses.set(questionId, answer);
  }

  getProgress(): { completed: number; total: number; percentage: number } {
    const completed = this.responses.size;
    const total = this.questions.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }

  calculateProfile(): {
    profile: NavigatorProfile;
    scores: ProfileScore[];
    chemicalState: ChemicalState;
    regulationLevel: RegulationLevel;
  } {
    const profileScores = new Map<string, number>();

    this.profiles.forEach(profile => {
      profileScores.set(profile.name, 0);
    });

    let chemicalState: ChemicalState = 'sober';

    this.questions.forEach(question => {
      const response = this.responses.get(question.id);
      if (response === undefined) return;

      if (question.input_type === 'scale') {
        const answerIndex = response as number;
        const weights = question.weight_map;

        Object.entries(weights).forEach(([profileName, profileWeights]) => {
          if (Array.isArray(profileWeights) && profileWeights[answerIndex] !== undefined) {
            const currentScore = profileScores.get(profileName) || 0;
            profileScores.set(profileName, currentScore + profileWeights[answerIndex]);
          }
        });
      } else if (question.input_type === 'multi') {
        const answer = response as string;
        const mapping = (question.weight_map as any).mapping;
        if (mapping && mapping[answer]) {
          chemicalState = mapping[answer] as ChemicalState;
        }
      }
    });

    const regulationLevel = this.calculateRegulationLevel();

    const sortedScores: ProfileScore[] = Array.from(profileScores.entries())
      .map(([profileName, score]) => ({
        profileName,
        score,
        percentage: 0
      }))
      .sort((a, b) => b.score - a.score);

    const totalScore = sortedScores.reduce((sum, s) => sum + Math.max(0, s.score), 0);
    sortedScores.forEach(score => {
      score.percentage = totalScore > 0 ? Math.round((Math.max(0, score.score) / totalScore) * 100) : 0;
    });

    // Enhanced profile detection for Numb and Seeker
    let finalProfileName = sortedScores[0].profileName;

    // Get key question responses (Q1: safety, Q2: emotional_clarity, Q5: curiosity)
    const safetyScore = this.responses.get(this.questions[0]?.id) as number;
    const emotionalClarity = this.responses.get(this.questions[1]?.id) as number;
    const curiosityScore = this.responses.get(this.questions[4]?.id) as number;

    // Detect Numb: Low emotional clarity (≤3)
    if (emotionalClarity !== undefined && emotionalClarity <= 3) {
      const numbProfile = this.profiles.find(p => p.name === 'Numb');
      if (numbProfile) {
        finalProfileName = 'Numb';
      }
    }
    // Detect Seeker: High curiosity (≥5) AND safe enough (≥5)
    else if (curiosityScore !== undefined && curiosityScore >= 5 &&
             safetyScore !== undefined && safetyScore >= 5) {
      const seekerProfile = this.profiles.find(p => p.name === 'Seeker');
      if (seekerProfile) {
        finalProfileName = 'Seeker';
      }
    }

    const profile = this.profiles.find(p => p.name === finalProfileName)!;

    return {
      profile,
      scores: sortedScores,
      chemicalState,
      regulationLevel
    };
  }

  private calculateRegulationLevel(): RegulationLevel {
    const safetyResponse = this.responses.get(this.questions[0]?.id);
    const emotionResponse = this.responses.get(this.questions[2]?.id);

    if (safetyResponse === 0 || emotionResponse === 0) {
      return 'low';
    } else if (safetyResponse === 3 && emotionResponse === 3) {
      return 'high';
    }

    return 'medium';
  }

  async saveAssessment(
    userId: string,
    profile: NavigatorProfile,
    scores: ProfileScore[],
    chemicalState: ChemicalState,
    regulationLevel: RegulationLevel
  ): Promise<void> {
    const responsesObj: Record<string, any> = {};
    this.responses.forEach((value, key) => {
      responsesObj[key] = value;
    });

    const scoresObj: Record<string, number> = {};
    scores.forEach(score => {
      scoresObj[score.profileName] = score.score;
    });

    const { error } = await supabase.from('navigator_assessments').insert({
      user_id: userId,
      session_id: this.sessionId,
      responses: responsesObj,
      calculated_profile: profile.id,
      profile_scores: scoresObj,
      chemical_state: chemicalState,
      regulation_level: regulationLevel,
      metadata: {
        completed_at: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Error saving assessment:', error);
      throw error;
    }

    const { error: stateError } = await supabase
      .from('user_state_profiles')
      .upsert({
        user_id: userId,
        profile_id: profile.id,
        chemical_state: chemicalState,
        regulation_level: regulationLevel,
        last_updated: new Date().toISOString()
      });

    if (stateError) {
      console.error('Error updating user state:', stateError);
      throw stateError;
    }
  }
}
