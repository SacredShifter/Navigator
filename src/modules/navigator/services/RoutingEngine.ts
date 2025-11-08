import { supabase } from '../../../lib/supabase';
import { GlobalEventHorizon } from '../../../metaphysical-os/core/GlobalEventHorizon';
import type { NavigatorPath, NavigatorProfile, ChemicalState, RoutingResult } from '../../../types/navigator';

export class RoutingEngine {
  private paths: NavigatorPath[] = [];
  private profiles: Map<string, NavigatorProfile> = new Map();

  async initialize(): Promise<void> {
    await this.loadPaths();
    await this.loadProfiles();
  }

  private async loadPaths(): Promise<void> {
    const { data, error } = await supabase
      .from('navigator_paths')
      .select('*')
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error loading paths:', error);
      throw error;
    }

    this.paths = data || [];
  }

  private async loadProfiles(): Promise<void> {
    const { data, error } = await supabase
      .from('navigator_profiles')
      .select('*');

    if (error) {
      console.error('Error loading profiles:', error);
      throw error;
    }

    (data || []).forEach(profile => {
      this.profiles.set(profile.id, profile);
    });
  }

  getRouteForProfile(
    profileId: string,
    chemicalState: ChemicalState,
    regulationLevel: string = 'medium'
  ): RoutingResult | null {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      console.error('Profile not found:', profileId);
      return null;
    }

    const matchingPaths = this.paths.filter(path => {
      if (path.profile_id !== profileId) return false;

      if (path.chemical_state_filter && path.chemical_state_filter !== chemicalState) {
        return false;
      }

      return true;
    });

    if (matchingPaths.length === 0) {
      console.warn('No matching paths found for profile:', profile.name);
      return null;
    }

    const selectedPath = matchingPaths[0];

    const safetyMode = this.requiresSafetyMode(profile.name, chemicalState, regulationLevel);

    return {
      targetTrackId: selectedPath.target_track_id,
      profile,
      chemicalState,
      regulationLevel: regulationLevel as any,
      pacingParameters: selectedPath.pacing_parameters || {},
      safetyMode,
      safetyReason: safetyMode
        ? `High-risk combination detected: ${profile.name} profile with ${chemicalState} state`
        : undefined
    };
  }

  private requiresSafetyMode(
    profileName: string,
    chemicalState: ChemicalState,
    regulationLevel: string
  ): boolean {
    const highRiskCombinations = [
      { profile: 'Lost', chemical: 'withdrawal' },
      { profile: 'Lost', chemical: 'psychedelic' },
      { profile: 'Awakening', chemical: 'withdrawal' },
      { profile: 'Awakening', chemical: 'psychedelic', regulation: 'low' }
    ];

    return highRiskCombinations.some(combo => {
      const profileMatch = combo.profile === profileName;
      const chemicalMatch = combo.chemical === chemicalState;
      const regulationMatch = !combo.regulation || combo.regulation === regulationLevel;

      return profileMatch && chemicalMatch && regulationMatch;
    });
  }

  async assignTrack(userId: string, trackId: string): Promise<void> {
    GlobalEventHorizon.emit({
      eventType: 'navigator.trackAssigned',
      moduleId: 'navigator-engine',
      timestamp: Date.now(),
      payload: {
        userId,
        trackId
      },
      semanticLabels: ['navigator', 'routing', 'track-assignment']
    });

    const { error } = await supabase.from('navigator_recommendations').insert({
      user_id: userId,
      recommended_track_id: trackId,
      reason: 'Profile and chemical state assessment',
      priority: 1,
      served_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error saving recommendation:', error);
    }
  }
}
