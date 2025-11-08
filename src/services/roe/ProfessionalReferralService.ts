/**
 * Professional Referral Service - Bridge to Professional Care
 *
 * Intelligently matches users with verified mental health professionals
 * based on their needs, preferences, and journey data.
 *
 * Features:
 * - Smart professional matching
 * - Specialty-based filtering
 * - Urgency-aware prioritization
 * - Insurance compatibility
 * - Privacy-preserved referrals
 */

import { supabase } from '../../lib/supabase';

interface ProfessionalProfile {
  id: string;
  name: string;
  credentials: string[];
  specialties: string[];
  bio: string;
  approach: string;
  verified: boolean;
  acceptingClients: boolean;
  contactMethod: any;
  location: string;
  remoteAvailable: boolean;
  insuranceAccepted: string[];
}

interface ProfessionalMatch {
  professional: ProfessionalProfile;
  matchScore: number;
  matchReasons: string[];
}

interface ReferralRequest {
  id?: string;
  userId: string;
  professionalId: string;
  reason: string;
  urgency: 'low' | 'moderate' | 'high' | 'crisis';
  contactPreference: any;
  status?: string;
}

interface UserNeeds {
  primaryConcerns: string[];
  urgencyLevel: 'low' | 'moderate' | 'high' | 'crisis';
  insuranceProvider?: string;
  locationPreference?: string;
  remoteOnly?: boolean;
  approachPreference?: string[];
}

export class ProfessionalReferralService {
  /**
   * Find matching professionals for user
   */
  async findMatches(
    userId: string,
    userNeeds: UserNeeds,
    limit: number = 10
  ): Promise<ProfessionalMatch[]> {
    try {
      // Get user's journey context
      const journeyContext = await this.getUserJourneyContext(userId);

      // Get all verified professionals
      const { data: professionals } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('verified', true);

      if (!professionals || professionals.length === 0) {
        return [];
      }

      const matches: ProfessionalMatch[] = [];

      for (const prof of professionals) {
        // Filter by availability
        if (!prof.accepting_clients) continue;

        // Filter by insurance
        if (userNeeds.insuranceProvider) {
          const acceptsInsurance = prof.insurance_accepted.some(
            (ins: string) =>
              ins.toLowerCase().includes(userNeeds.insuranceProvider!.toLowerCase())
          );
          if (!acceptsInsurance && !prof.insurance_accepted.includes('Self-Pay')) {
            continue;
          }
        }

        // Filter by remote availability
        if (userNeeds.remoteOnly && !prof.remote_available) {
          continue;
        }

        // Calculate match score
        const matchScore = this.calculateMatchScore(prof, userNeeds, journeyContext);
        const matchReasons = this.generateMatchReasons(prof, userNeeds, matchScore);

        if (matchScore > 0.3) {
          matches.push({
            professional: this.formatProfessional(prof),
            matchScore,
            matchReasons
          });
        }
      }

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      // Store matches for user
      await this.storeMatches(userId, matches.slice(0, limit));

      return matches.slice(0, limit);
    } catch (error) {
      console.error('Failed to find matches:', error);
      return [];
    }
  }

  /**
   * Create referral request
   */
  async createReferral(request: ReferralRequest): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('referral_requests')
        .insert({
          user_id: request.userId,
          professional_id: request.professionalId,
          reason: request.reason,
          urgency: request.urgency,
          contact_preference: request.contactPreference,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Failed to create referral:', error);
      return null;
    }
  }

  /**
   * Get user's referral requests
   */
  async getUserReferrals(userId: string): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('referral_requests')
        .select(`
          *,
          professional_profiles (
            id,
            name,
            credentials,
            specialties
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Failed to get referrals:', error);
      return [];
    }
  }

  /**
   * Update referral status
   */
  async updateReferralStatus(
    referralId: string,
    status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'declined'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('referral_requests')
        .update({ status })
        .eq('id', referralId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update referral status:', error);
      return false;
    }
  }

  /**
   * Get professional by specialty
   */
  async searchBySpecialty(specialty: string): Promise<ProfessionalProfile[]> {
    try {
      const { data } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('verified', true)
        .eq('accepting_clients', true)
        .contains('specialties', [specialty]);

      return (data || []).map(p => this.formatProfessional(p));
    } catch (error) {
      console.error('Failed to search by specialty:', error);
      return [];
    }
  }

  /**
   * Get crisis-appropriate professionals
   */
  async getCrisisProfessionals(): Promise<ProfessionalProfile[]> {
    try {
      const { data } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('verified', true)
        .eq('accepting_clients', true)
        .or('specialties.cs.{"crisis"},specialties.cs.{"emergency"}');

      return (data || []).map(p => this.formatProfessional(p));
    } catch (error) {
      console.error('Failed to get crisis professionals:', error);
      return [];
    }
  }

  /**
   * Calculate professional match score
   */
  private calculateMatchScore(
    professional: any,
    userNeeds: UserNeeds,
    journeyContext: any
  ): number {
    let score = 0;

    // Specialty match (most important)
    const specialtyMatches = userNeeds.primaryConcerns.filter(concern =>
      professional.specialties.some((spec: string) =>
        spec.toLowerCase().includes(concern.toLowerCase())
      )
    );
    score += (specialtyMatches.length / userNeeds.primaryConcerns.length) * 0.5;

    // Urgency consideration
    if (userNeeds.urgencyLevel === 'crisis' || userNeeds.urgencyLevel === 'high') {
      if (professional.specialties.includes('crisis') ||
          professional.specialties.includes('emergency')) {
        score += 0.2;
      }
    }

    // Insurance compatibility
    if (userNeeds.insuranceProvider) {
      const acceptsInsurance = professional.insurance_accepted.some(
        (ins: string) =>
          ins.toLowerCase().includes(userNeeds.insuranceProvider!.toLowerCase())
      );
      if (acceptsInsurance) {
        score += 0.15;
      }
    }

    // Remote availability match
    if (userNeeds.remoteOnly && professional.remote_available) {
      score += 0.1;
    }

    // Journey context alignment
    if (journeyContext.riTrend === 'declining') {
      if (professional.specialties.includes('depression') ||
          professional.specialties.includes('crisis')) {
        score += 0.1;
      }
    }

    if (journeyContext.dominantEmotion === 'anxious') {
      if (professional.specialties.includes('anxiety')) {
        score += 0.1;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generate match explanation reasons
   */
  private generateMatchReasons(
    professional: any,
    userNeeds: UserNeeds,
    score: number
  ): string[] {
    const reasons: string[] = [];

    // Specialty matches
    const specialtyMatches = userNeeds.primaryConcerns.filter(concern =>
      professional.specialties.some((spec: string) =>
        spec.toLowerCase().includes(concern.toLowerCase())
      )
    );

    if (specialtyMatches.length > 0) {
      reasons.push(
        `Specializes in ${specialtyMatches.slice(0, 2).join(' and ')}`
      );
    }

    // Insurance
    if (userNeeds.insuranceProvider) {
      const acceptsInsurance = professional.insurance_accepted.some(
        (ins: string) =>
          ins.toLowerCase().includes(userNeeds.insuranceProvider!.toLowerCase())
      );
      if (acceptsInsurance) {
        reasons.push(`Accepts ${userNeeds.insuranceProvider} insurance`);
      }
    }

    // Remote
    if (professional.remote_available && userNeeds.remoteOnly) {
      reasons.push('Offers remote/telehealth sessions');
    }

    // Credentials
    if (professional.credentials.length > 0) {
      reasons.push(`${professional.credentials.join(', ')}`);
    }

    // Experience indicator
    if (score > 0.7) {
      reasons.push('Highly aligned with your needs');
    }

    return reasons.slice(0, 4);
  }

  /**
   * Get user journey context for matching
   */
  private async getUserJourneyContext(userId: string): Promise<any> {
    try {
      const { data: recentBranches } = await supabase
        .from('reality_branches')
        .select('resonance_index, emotion_state')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!recentBranches || recentBranches.length === 0) {
        return {
          riTrend: 'stable',
          avgRI: 0.5,
          dominantEmotion: 'neutral'
        };
      }

      // Calculate trend
      const riValues = recentBranches.map(b => b.resonance_index);
      const firstHalf = riValues.slice(0, Math.floor(riValues.length / 2));
      const secondHalf = riValues.slice(Math.floor(riValues.length / 2));
      const firstAvg = firstHalf.reduce((sum, ri) => sum + ri, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, ri) => sum + ri, 0) / secondHalf.length;

      let riTrend = 'stable';
      if (secondAvg - firstAvg > 0.1) riTrend = 'improving';
      else if (firstAvg - secondAvg > 0.1) riTrend = 'declining';

      // Get dominant emotion
      const emotions = recentBranches
        .map(b => b.emotion_state?.chemical_state)
        .filter(Boolean);

      const emotionCounts = new Map<string, number>();
      emotions.forEach(emotion => {
        emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
      });

      const dominantEmotion = Array.from(emotionCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

      return {
        riTrend,
        avgRI: riValues.reduce((sum, ri) => sum + ri, 0) / riValues.length,
        dominantEmotion
      };
    } catch (error) {
      console.error('Failed to get journey context:', error);
      return {
        riTrend: 'stable',
        avgRI: 0.5,
        dominantEmotion: 'neutral'
      };
    }
  }

  /**
   * Store matches for user
   */
  private async storeMatches(userId: string, matches: ProfessionalMatch[]): Promise<void> {
    try {
      // Delete old matches
      await supabase
        .from('professional_matches')
        .delete()
        .eq('user_id', userId);

      // Insert new matches
      const matchRecords = matches.map(match => ({
        user_id: userId,
        professional_id: match.professional.id,
        match_score: match.matchScore,
        match_reasons: match.matchReasons
      }));

      await supabase.from('professional_matches').insert(matchRecords);
    } catch (error) {
      console.error('Failed to store matches:', error);
    }
  }

  /**
   * Format professional data
   */
  private formatProfessional(prof: any): ProfessionalProfile {
    return {
      id: prof.id,
      name: prof.name,
      credentials: prof.credentials || [],
      specialties: prof.specialties || [],
      bio: prof.bio,
      approach: prof.approach,
      verified: prof.verified,
      acceptingClients: prof.accepting_clients,
      contactMethod: prof.contact_method,
      location: prof.location,
      remoteAvailable: prof.remote_available,
      insuranceAccepted: prof.insurance_accepted || []
    };
  }
}

export const professionalReferralService = new ProfessionalReferralService();
