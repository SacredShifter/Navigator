/**
 * Aura Bridge: Branding Service
 *
 * Fetches Sacred Shifter branding guide from Supabase Storage.
 * Provides type-safe access to colors, profiles, sigils, and aesthetic guidelines.
 *
 * Usage:
 *   import { getBrandingGuide, getProfileColors } from '@/services/aura-bridges/branding';
 *   const guide = await getBrandingGuide();
 *   const colors = getProfileColors('seeker');
 */

import { supabase } from '@/lib/supabase';

export interface BrandColor {
  name: string;
  hex: string;
  rgb: string;
  hsl: string;
  function: string;
  usage: string;
}

export interface ProfileBranding {
  primary_color: string;
  secondary_color: string;
  visual_treatment: string;
  fps_limit: number;
  contrast: string;
  sigil_density: string;
  audio_frequency: string;
  description: string;
}

export interface BrandingGuide {
  version: string;
  name: string;
  description: string;
  colors: Record<string, BrandColor>;
  profiles: Record<string, ProfileBranding>;
  typography: {
    primary_font: {
      family: string;
      weights: number[];
      usage: string;
      line_height: string;
    };
    display_font: {
      family: string;
      weights: number[];
      usage: string;
      line_height: string;
    };
    script_font: {
      family: string;
      weights: number[];
      usage: string;
      line_height: string;
      letter_spacing: string;
    };
  };
  spacing: {
    system: string;
    scale: number[];
    usage: string;
  };
  motion: {
    principles: string[];
    easing: Record<string, string>;
    duration: Record<string, string>;
  };
  sigils: {
    philosophy: string;
    placement: string[];
    types: Record<string, string>;
  };
  audio: {
    principles: string[];
    volume_limits: Record<string, number>;
  };
  safety_gating: Record<string, any>;
  metaphysical_mapping: Record<string, string>;
}

let cachedGuide: BrandingGuide | null = null;

/**
 * Fetch the Sacred Shifter branding guide from Supabase Storage
 * Results are cached for performance
 */
export async function getBrandingGuide(): Promise<BrandingGuide> {
  if (cachedGuide) {
    return cachedGuide;
  }

  const { data, error } = await supabase.storage
    .from('brand-guides')
    .download('branding/sacred-shifter-aesthetics.v1.json');

  if (error) {
    console.error('Failed to fetch branding guide:', error);
    throw new Error(`Branding guide unavailable: ${error.message}`);
  }

  const text = await data.text();
  cachedGuide = JSON.parse(text);

  return cachedGuide!;
}

/**
 * Get colors for a specific profile
 * Returns primary and secondary color objects
 */
export async function getProfileColors(profileName: string): Promise<{
  primary: BrandColor;
  secondary: BrandColor;
}> {
  const guide = await getBrandingGuide();
  const profileKey = profileName.toLowerCase();
  const profile = guide.profiles[profileKey];

  if (!profile) {
    throw new Error(`Profile "${profileName}" not found in branding guide`);
  }

  const primary = guide.colors[profile.primary_color];
  const secondary = guide.colors[profile.secondary_color];

  if (!primary || !secondary) {
    throw new Error(`Colors not found for profile "${profileName}"`);
  }

  return { primary, secondary };
}

/**
 * Get complete branding configuration for a profile
 */
export async function getProfileBranding(profileName: string): Promise<ProfileBranding> {
  const guide = await getBrandingGuide();
  const profileKey = profileName.toLowerCase();
  const profile = guide.profiles[profileKey];

  if (!profile) {
    throw new Error(`Profile "${profileName}" not found in branding guide`);
  }

  return profile;
}

/**
 * Get color by resonance function (e.g., 'resonance', 'alignment', 'pulse')
 */
export async function getColorByFunction(functionKey: string): Promise<BrandColor> {
  const guide = await getBrandingGuide();
  const color = guide.colors[functionKey];

  if (!color) {
    throw new Error(`Color function "${functionKey}" not found`);
  }

  return color;
}

/**
 * Get safety gating parameters for a profile or state
 */
export async function getSafetyGating(stateKey: string): Promise<any> {
  const guide = await getBrandingGuide();
  return guide.safety_gating[stateKey] || null;
}

/**
 * Clear the branding guide cache (useful for development/testing)
 */
export function clearBrandingCache(): void {
  cachedGuide = null;
}
