/**
 * Cohort Matching Service - Social Synchronicity Engine
 *
 * Intelligently matches users to supportive cohorts based on:
 * - Current RI level
 * - Emotional/belief state clusters
 * - Growth trajectory
 * - Privacy preferences
 *
 * CRITICAL: Anonymity and safety are prioritized above all else.
 */

import { supabase } from '../../lib/supabase';

interface CohortMatch {
  cohortId: string;
  cohortName: string;
  description: string;
  matchScore: number;
  matchReasons: string[];
  memberCount: number;
  privacyLevel: string;
}

interface UserProfile {
  currentRI: number;
  recentEmotionStates: string[];
  trajectoryTrend: 'improving' | 'stable' | 'declining';
  dominantThemes: string[];
}

export class CohortMatchingService {
  /**
   * Find best cohort matches for user
   */
  async findMatches(userId: string, limit: number = 5): Promise<CohortMatch[]> {
    try {
      const profile = await this.buildUserProfile(userId);
      const availableCohorts = await this.getAvailableCohorts();

      const matches: CohortMatch[] = [];

      for (const cohort of availableCohorts) {
        const matchScore = this.calculateMatchScore(profile, cohort);
        const matchReasons = this.generateMatchReasons(profile, cohort, matchScore);

        if (matchScore > 0.3) {
          matches.push({
            cohortId: cohort.id,
            cohortName: cohort.name,
            description: cohort.description,
            matchScore,
            matchReasons,
            memberCount: cohort.member_count,
            privacyLevel: cohort.privacy_level
          });
        }
      }

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      return matches.slice(0, limit);
    } catch (error) {
      console.error('Cohort matching failed:', error);
      return [];
    }
  }

  /**
   * Join a cohort with anonymized identity
   */
  async joinCohort(
    userId: string,
    cohortId: string,
    shareLevel: 'minimal' | 'moderate' | 'full' = 'minimal'
  ): Promise<boolean> {
    try {
      const anonymizedName = this.generateAnonymizedName();

      const { error } = await supabase.from('cohort_members').insert({
        cohort_id: cohortId,
        user_id: userId,
        anonymized_name: anonymizedName,
        share_level: shareLevel,
        is_active: true
      });

      if (error) throw error;

      // Update member count
      await supabase.rpc('increment_cohort_members', { cohort_id: cohortId });

      return true;
    } catch (error) {
      console.error('Failed to join cohort:', error);
      return false;
    }
  }

  /**
   * Leave a cohort
   */
  async leaveCohort(userId: string, cohortId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cohort_members')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('cohort_id', cohortId);

      if (error) throw error;

      // Decrement member count
      await supabase.rpc('decrement_cohort_members', { cohort_id: cohortId });

      return true;
    } catch (error) {
      console.error('Failed to leave cohort:', error);
      return false;
    }
  }

  /**
   * Get user's current cohorts
   */
  async getUserCohorts(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('cohort_members')
      .select(`
        cohort_id,
        anonymized_name,
        share_level,
        joined_at,
        cohorts (
          id,
          name,
          description,
          member_count,
          privacy_level
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    return data || [];
  }

  /**
   * Detect synchronicity patterns across cohort
   */
  async detectSynchronicity(cohortId: string): Promise<any[]> {
    try {
      // Get recent branches from cohort members
      const { data: members } = await supabase
        .from('cohort_members')
        .select('user_id')
        .eq('cohort_id', cohortId)
        .eq('is_active', true);

      if (!members || members.length < 3) {
        return []; // Need at least 3 members for patterns
      }

      const userIds = members.map(m => m.user_id);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: recentBranches } = await supabase
        .from('reality_branches')
        .select('user_id, resonance_index, emotion_state, created_at')
        .in('user_id', userIds)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      if (!recentBranches || recentBranches.length === 0) {
        return [];
      }

      // Detect patterns
      const synchronicities = [];

      // 1. Collective RI shifts
      const avgRIByHour = this.groupByHour(recentBranches);
      const riTrend = this.detectTrend(avgRIByHour);
      if (riTrend !== 'stable') {
        synchronicities.push({
          type: 'collective_shift',
          description: `Cohort experiencing collective ${riTrend} shift in resonance`,
          confidence: 0.7,
          member_count: userIds.length
        });
      }

      // 2. Shared emotional states
      const commonEmotions = this.findCommonEmotions(recentBranches);
      if (commonEmotions.length > 0) {
        synchronicities.push({
          type: 'synchronicity',
          description: `${commonEmotions.length} members sharing similar emotional states`,
          confidence: 0.6,
          member_count: commonEmotions.length
        });
      }

      // Save insights
      for (const sync of synchronicities) {
        await supabase.from('cohort_insights').insert({
          cohort_id: cohortId,
          insight_type: sync.type,
          description: sync.description,
          confidence: sync.confidence,
          member_count: sync.member_count
        });
      }

      return synchronicities;
    } catch (error) {
      console.error('Synchronicity detection failed:', error);
      return [];
    }
  }

  private async buildUserProfile(userId: string): Promise<UserProfile> {
    // Get recent branches
    const { data: branches } = await supabase
      .from('reality_branches')
      .select('resonance_index, emotion_state, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!branches || branches.length === 0) {
      return {
        currentRI: 0.5,
        recentEmotionStates: [],
        trajectoryTrend: 'stable',
        dominantThemes: []
      };
    }

    const currentRI = branches[0].resonance_index;
    const recentEmotionStates = branches
      .map(b => b.emotion_state?.chemical_state)
      .filter(Boolean);

    // Calculate trajectory
    const firstHalf = branches.slice(0, Math.floor(branches.length / 2));
    const secondHalf = branches.slice(Math.floor(branches.length / 2));
    const firstAvg = firstHalf.reduce((sum, b) => sum + b.resonance_index, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, b) => sum + b.resonance_index, 0) / secondHalf.length;

    let trajectoryTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondAvg - firstAvg > 0.1) trajectoryTrend = 'improving';
    else if (firstAvg - secondAvg > 0.1) trajectoryTrend = 'declining';

    return {
      currentRI,
      recentEmotionStates,
      trajectoryTrend,
      dominantThemes: []
    };
  }

  private async getAvailableCohorts(): Promise<any[]> {
    const { data } = await supabase
      .from('cohorts')
      .select('*')
      .in('privacy_level', ['public', 'anonymous']);

    return data || [];
  }

  private calculateMatchScore(profile: UserProfile, cohort: any): number {
    let score = 0;

    // RI range match
    const riInRange = profile.currentRI >= cohort.resonance_range[0] &&
                      profile.currentRI <= cohort.resonance_range[1];
    if (riInRange) score += 0.5;

    // State cluster match
    if (cohort.state_cluster === 'general') {
      score += 0.2;
    } else {
      const stateMatch = profile.recentEmotionStates.some(state =>
        state.toLowerCase().includes(cohort.state_cluster)
      );
      if (stateMatch) score += 0.3;
    }

    // Trajectory bonus
    if (profile.trajectoryTrend === 'improving' && cohort.state_cluster === 'high_coherence') {
      score += 0.2;
    }
    if (profile.trajectoryTrend === 'declining' && cohort.state_cluster === 'support') {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  private generateMatchReasons(profile: UserProfile, cohort: any, score: number): string[] {
    const reasons: string[] = [];

    const riInRange = profile.currentRI >= cohort.resonance_range[0] &&
                      profile.currentRI <= cohort.resonance_range[1];

    if (riInRange) {
      reasons.push(`Your current RI (${profile.currentRI.toFixed(2)}) aligns with this cohort's focus`);
    }

    if (profile.trajectoryTrend === 'improving') {
      reasons.push('Your positive growth trajectory matches well');
    }

    if (cohort.member_count > 10) {
      reasons.push(`Active community with ${cohort.member_count} members`);
    }

    if (score > 0.7) {
      reasons.push('Strong overall alignment with cohort purpose');
    }

    return reasons.slice(0, 3);
  }

  private generateAnonymizedName(): string {
    const adjectives = [
      'Brave', 'Curious', 'Gentle', 'Wise', 'Bright', 'Calm', 'Steady',
      'Warm', 'Kind', 'Bold', 'Clear', 'Still', 'Open', 'Free'
    ];
    const nouns = [
      'Explorer', 'Seeker', 'Wanderer', 'Traveler', 'Navigator', 'Guide',
      'Observer', 'Learner', 'Builder', 'Shifter', 'Walker', 'Dreamer'
    ];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 999) + 1;

    return `${adj}${noun}${num}`;
  }

  private groupByHour(branches: any[]): Map<number, number[]> {
    const hourMap = new Map<number, number[]>();

    for (const branch of branches) {
      const hour = new Date(branch.created_at).getHours();
      if (!hourMap.has(hour)) {
        hourMap.set(hour, []);
      }
      hourMap.get(hour)!.push(branch.resonance_index);
    }

    return hourMap;
  }

  private detectTrend(hourlyData: Map<number, number[]>): 'improving' | 'declining' | 'stable' {
    const hours = Array.from(hourlyData.keys()).sort((a, b) => a - b);
    if (hours.length < 2) return 'stable';

    const firstHourAvg = hourlyData.get(hours[0])!.reduce((a, b) => a + b, 0) / hourlyData.get(hours[0])!.length;
    const lastHourAvg = hourlyData.get(hours[hours.length - 1])!.reduce((a, b) => a + b, 0) / hourlyData.get(hours[hours.length - 1])!.length;

    const diff = lastHourAvg - firstHourAvg;
    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  private findCommonEmotions(branches: any[]): any[] {
    const emotionCounts = new Map<string, number>();

    for (const branch of branches) {
      const emotion = branch.emotion_state?.chemical_state;
      if (emotion) {
        emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
      }
    }

    return Array.from(emotionCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([emotion, count]) => ({ emotion, count }));
  }
}

export const cohortMatchingService = new CohortMatchingService();
