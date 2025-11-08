/**
 * Shared Journey Service - Privacy-Preserving Trajectory Visualization
 *
 * Enables cohort members to share their growth journeys with each other
 * while maintaining privacy controls and anonymity options.
 *
 * Features:
 * - User-controlled sharing permissions
 * - Privacy levels (trajectory_only / with_insights / full)
 * - Anonymized or named display
 * - Snapshot generation for performance
 * - Trend analysis across cohort
 */

import { supabase } from '../../lib/supabase';

interface TrajectoryPoint {
  timestamp: string;
  ri: number;
  emotionState?: string;
  insight?: string;
}

interface SharedJourney {
  userId: string;
  displayName: string;
  trajectoryPoints: TrajectoryPoint[];
  riTrend: 'improving' | 'stable' | 'declining';
  shareLevel: 'trajectory_only' | 'with_insights' | 'full';
  anonymized: boolean;
}

interface JourneySnapshot {
  id: string;
  userId: string;
  snapshotData: any;
  riTrend: 'improving' | 'stable' | 'declining';
  createdAt: string;
}

export class SharedJourneyService {
  /**
   * Enable journey sharing for a cohort
   */
  async enableSharing(
    userId: string,
    cohortId: string,
    shareLevel: 'trajectory_only' | 'with_insights' | 'full' = 'trajectory_only',
    anonymized: boolean = true
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shared_journey_permissions')
        .insert({
          user_id: userId,
          cohort_id: cohortId,
          share_level: shareLevel,
          anonymized
        });

      if (error) throw error;

      // Generate initial snapshot
      await this.generateSnapshot(userId, cohortId);

      return true;
    } catch (error) {
      console.error('Failed to enable sharing:', error);
      return false;
    }
  }

  /**
   * Update sharing settings
   */
  async updateSharing(
    userId: string,
    cohortId: string,
    shareLevel?: 'trajectory_only' | 'with_insights' | 'full',
    anonymized?: boolean
  ): Promise<boolean> {
    try {
      const updates: any = {};
      if (shareLevel !== undefined) updates.share_level = shareLevel;
      if (anonymized !== undefined) updates.anonymized = anonymized;

      const { error } = await supabase
        .from('shared_journey_permissions')
        .update(updates)
        .eq('user_id', userId)
        .eq('cohort_id', cohortId);

      if (error) throw error;

      // Regenerate snapshot with new settings
      await this.generateSnapshot(userId, cohortId);

      return true;
    } catch (error) {
      console.error('Failed to update sharing:', error);
      return false;
    }
  }

  /**
   * Disable journey sharing
   */
  async disableSharing(userId: string, cohortId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shared_journey_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('cohort_id', cohortId);

      if (error) throw error;

      // Remove snapshots
      await supabase
        .from('journey_snapshots')
        .delete()
        .eq('user_id', userId)
        .eq('cohort_id', cohortId);

      return true;
    } catch (error) {
      console.error('Failed to disable sharing:', error);
      return false;
    }
  }

  /**
   * Get all shared journeys for a cohort
   */
  async getCohortJourneys(cohortId: string): Promise<SharedJourney[]> {
    try {
      // Get sharing permissions
      const { data: permissions } = await supabase
        .from('shared_journey_permissions')
        .select('user_id, share_level, anonymized')
        .eq('cohort_id', cohortId);

      if (!permissions || permissions.length === 0) {
        return [];
      }

      const journeys: SharedJourney[] = [];

      for (const perm of permissions) {
        const journey = await this.buildSharedJourney(
          perm.user_id,
          cohortId,
          perm.share_level,
          perm.anonymized
        );

        if (journey) {
          journeys.push(journey);
        }
      }

      return journeys;
    } catch (error) {
      console.error('Failed to get cohort journeys:', error);
      return [];
    }
  }

  /**
   * Get user's sharing status
   */
  async getSharingStatus(userId: string, cohortId: string): Promise<any | null> {
    try {
      const { data } = await supabase
        .from('shared_journey_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('cohort_id', cohortId)
        .maybeSingle();

      return data;
    } catch (error) {
      console.error('Failed to get sharing status:', error);
      return null;
    }
  }

  /**
   * Generate journey snapshot for performance
   */
  async generateSnapshot(userId: string, cohortId: string): Promise<void> {
    try {
      // Get recent branches (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: branches } = await supabase
        .from('reality_branches')
        .select('resonance_index, emotion_state, created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      if (!branches || branches.length === 0) {
        return;
      }

      // Calculate trend
      const riTrend = this.calculateTrend(branches.map(b => b.resonance_index));

      // Build snapshot data
      const snapshotData = {
        points: branches.map(b => ({
          timestamp: b.created_at,
          ri: b.resonance_index,
          emotionState: b.emotion_state?.chemical_state
        })),
        summary: {
          currentRI: branches[branches.length - 1].resonance_index,
          avgRI: branches.reduce((sum, b) => sum + b.resonance_index, 0) / branches.length,
          minRI: Math.min(...branches.map(b => b.resonance_index)),
          maxRI: Math.max(...branches.map(b => b.resonance_index)),
          dataPoints: branches.length
        }
      };

      // Delete old snapshot
      await supabase
        .from('journey_snapshots')
        .delete()
        .eq('user_id', userId)
        .eq('cohort_id', cohortId);

      // Insert new snapshot
      await supabase.from('journey_snapshots').insert({
        user_id: userId,
        cohort_id: cohortId,
        snapshot_data: snapshotData,
        ri_trend: riTrend
      });
    } catch (error) {
      console.error('Failed to generate snapshot:', error);
    }
  }

  /**
   * Build shared journey with privacy controls
   */
  private async buildSharedJourney(
    userId: string,
    cohortId: string,
    shareLevel: string,
    anonymized: boolean
  ): Promise<SharedJourney | null> {
    try {
      // Get display name
      let displayName = 'Anonymous';
      if (!anonymized) {
        const { data: member } = await supabase
          .from('cohort_members')
          .select('anonymized_name')
          .eq('user_id', userId)
          .eq('cohort_id', cohortId)
          .maybeSingle();

        displayName = member?.anonymized_name || 'Anonymous';
      }

      // Get snapshot
      const { data: snapshot } = await supabase
        .from('journey_snapshots')
        .select('*')
        .eq('user_id', userId)
        .eq('cohort_id', cohortId)
        .maybeSingle();

      if (!snapshot) {
        return null;
      }

      const snapshotData = snapshot.snapshot_data;

      // Build trajectory points based on share level
      const trajectoryPoints: TrajectoryPoint[] = snapshotData.points.map((point: any) => {
        const basePoint: TrajectoryPoint = {
          timestamp: point.timestamp,
          ri: point.ri
        };

        // Add more data based on share level
        if (shareLevel === 'with_insights' || shareLevel === 'full') {
          basePoint.emotionState = point.emotionState;
        }

        if (shareLevel === 'full') {
          basePoint.insight = point.insight;
        }

        return basePoint;
      });

      return {
        userId: anonymized ? 'anonymous' : userId,
        displayName,
        trajectoryPoints,
        riTrend: snapshot.ri_trend,
        shareLevel: shareLevel as any,
        anonymized
      };
    } catch (error) {
      console.error('Failed to build shared journey:', error);
      return null;
    }
  }

  /**
   * Calculate RI trend
   */
  private calculateTrend(riValues: number[]): 'improving' | 'stable' | 'declining' {
    if (riValues.length < 2) return 'stable';

    const firstHalf = riValues.slice(0, Math.floor(riValues.length / 2));
    const secondHalf = riValues.slice(Math.floor(riValues.length / 2));

    const firstAvg = firstHalf.reduce((sum, ri) => sum + ri, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, ri) => sum + ri, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Get cohort-wide statistics
   */
  async getCohortStats(cohortId: string): Promise<any> {
    try {
      const { data: snapshots } = await supabase
        .from('journey_snapshots')
        .select('snapshot_data, ri_trend')
        .eq('cohort_id', cohortId);

      if (!snapshots || snapshots.length === 0) {
        return null;
      }

      const allRIValues = snapshots
        .flatMap(s => s.snapshot_data.points.map((p: any) => p.ri));

      const trends = {
        improving: snapshots.filter(s => s.ri_trend === 'improving').length,
        stable: snapshots.filter(s => s.ri_trend === 'stable').length,
        declining: snapshots.filter(s => s.ri_trend === 'declining').length
      };

      return {
        memberCount: snapshots.length,
        avgRI: allRIValues.reduce((sum, ri) => sum + ri, 0) / allRIValues.length,
        minRI: Math.min(...allRIValues),
        maxRI: Math.max(...allRIValues),
        trends,
        totalDataPoints: allRIValues.length
      };
    } catch (error) {
      console.error('Failed to get cohort stats:', error);
      return null;
    }
  }
}

export const sharedJourneyService = new SharedJourneyService();
