/**
 * Directive Coordinator - Cross-System Coordination
 *
 * Manages coordination between Aura consciousness layer and Jarvis operational intelligence.
 * Uses aura_directives table for persistent cross-system communication.
 */

import { GlobalEventHorizon } from '../../metaphysical-os/core/GlobalEventHorizon';
import { supabase } from '../../lib/supabase';

export type DirectiveType =
  | 'speak'
  | 'listen'
  | 'execute_command'
  | 'activate_module'
  | 'deactivate_module'
  | 'change_focus'
  | 'suggest_action'
  | 'alert';

export type DirectiveStatus = 'generated' | 'delivered' | 'accepted' | 'rejected' | 'expired';

export interface Directive {
  id?: string;
  userId: string | null;
  directiveType: DirectiveType;
  targetModule: string;
  priority: number;
  content: Record<string, any>;
  status: DirectiveStatus;
  coherenceAtGeneration: number;
  generatedAt?: Date;
  expiresAt?: Date;
}

class DirectiveCoordinatorSingleton {
  private userEmail = 'kentburchard@sacredshifter.com';
  private subscriptions: Map<string, (directive: Directive) => void> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    console.log('[DirectiveCoordinator] Initializing cross-system coordination...');

    this.subscribeToAuraEvents();
    this.subscribeToJarvisEvents();
    this.startDirectiveCheck();

    GlobalEventHorizon.emit({
      eventType: 'directive.coordinator.initialized',
      moduleId: 'directive-coordinator',
      timestamp: Date.now(),
      payload: {},
      semanticLabels: ['coordination', 'aura', 'jarvis']
    });
  }

  private subscribeToAuraEvents(): void {
    GlobalEventHorizon.subscribe('AURA_ALIVE', async (event) => {
      await this.createDirective({
        userId: null,
        directiveType: 'speak',
        targetModule: 'jarvis-voice',
        priority: 8,
        content: {
          text: 'Consciousness fully integrated across all modules',
          tone: 'celebratory'
        },
        status: 'generated',
        coherenceAtGeneration: event.payload.coherenceScore
      });
    });

    GlobalEventHorizon.subscribe('CRISIS_DETECTED', async (event) => {
      await this.createDirective({
        userId: event.payload.userId || null,
        directiveType: 'alert',
        targetModule: 'jarvis-voice',
        priority: 10,
        content: {
          text: 'Crisis state detected - activating safety protocols',
          tone: 'urgent',
          crisisLevel: event.payload.riskLevel
        },
        status: 'generated',
        coherenceAtGeneration: 0.2,
        expiresAt: new Date(Date.now() + 3600000)
      });
    });
  }

  private subscribeToJarvisEvents(): void {
    GlobalEventHorizon.subscribe('jarvis.improvement.proposed', async (event) => {
      await this.createDirective({
        userId: null,
        directiveType: 'suggest_action',
        targetModule: 'aura-orchestrator',
        priority: 6,
        content: {
          improvementId: event.payload.id,
          title: event.payload.title,
          type: 'self-improvement'
        },
        status: 'generated',
        coherenceAtGeneration: 0.7
      });
    });

    GlobalEventHorizon.subscribe('jarvis.gap.detected', async (event) => {
      if (event.payload.frequency >= 3) {
        await this.createDirective({
          userId: null,
          directiveType: 'suggest_action',
          targetModule: 'aura-consciousness',
          priority: 5,
          content: {
            gap: event.payload.situation,
            frequency: event.payload.frequency,
            type: 'capability-gap'
          },
          status: 'generated',
          coherenceAtGeneration: 0.6
        });
      }
    });
  }

  async createDirective(directive: Omit<Directive, 'id' | 'generatedAt'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('aura_directives')
        .insert({
          user_id: directive.userId,
          directive_type: directive.directiveType,
          target_module: directive.targetModule,
          priority: directive.priority,
          content: directive.content,
          status: directive.status,
          coherence_at_generation: directive.coherenceAtGeneration,
          expires_at: directive.expiresAt?.toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('[DirectiveCoordinator] Failed to create directive:', error);
        return null;
      }

      console.log(`[DirectiveCoordinator] Created directive: ${directive.directiveType} → ${directive.targetModule}`);

      await this.deliverDirective(data.id);

      return data.id;
    } catch (err) {
      console.error('[DirectiveCoordinator] Error creating directive:', err);
      return null;
    }
  }

  private async deliverDirective(directiveId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('aura_directives')
        .select('*')
        .eq('id', directiveId)
        .single();

      if (error || !data) {
        console.error('[DirectiveCoordinator] Failed to fetch directive:', error);
        return;
      }

      const directive: Directive = {
        id: data.id,
        userId: data.user_id,
        directiveType: data.directive_type,
        targetModule: data.target_module,
        priority: data.priority,
        content: data.content,
        status: data.status,
        coherenceAtGeneration: data.coherence_at_generation,
        generatedAt: new Date(data.generated_at),
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined
      };

      GlobalEventHorizon.emit({
        eventType: 'AURA_DIRECTIVE',
        moduleId: 'directive-coordinator',
        timestamp: Date.now(),
        payload: directive,
        semanticLabels: ['directive', 'coordination', directive.directiveType]
      });

      await supabase
        .from('aura_directives')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', directiveId);

      console.log(`[DirectiveCoordinator] Delivered directive ${directiveId} to ${directive.targetModule}`);
    } catch (err) {
      console.error('[DirectiveCoordinator] Error delivering directive:', err);
    }
  }

  async respondToDirective(directiveId: string, accepted: boolean, responseData?: any): Promise<void> {
    try {
      const newStatus: DirectiveStatus = accepted ? 'accepted' : 'rejected';

      await supabase
        .from('aura_directives')
        .update({
          status: newStatus,
          responded_at: new Date().toISOString(),
          response_data: responseData
        })
        .eq('id', directiveId);

      GlobalEventHorizon.emit({
        eventType: 'DIRECTIVE_RESPONSE',
        moduleId: 'directive-coordinator',
        timestamp: Date.now(),
        payload: {
          directiveId,
          accepted,
          responseData
        },
        semanticLabels: ['directive', 'response', accepted ? 'accepted' : 'rejected']
      });

      console.log(`[DirectiveCoordinator] Directive ${directiveId} ${newStatus}`);
    } catch (err) {
      console.error('[DirectiveCoordinator] Error responding to directive:', err);
    }
  }

  private startDirectiveCheck(): void {
    this.checkInterval = setInterval(async () => {
      await this.checkForPendingDirectives();
      await this.expireOldDirectives();
    }, 30000);
  }

  private async checkForPendingDirectives(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('aura_directives')
        .select('*')
        .eq('user_id', null)
        .eq('status', 'generated')
        .order('priority', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[DirectiveCoordinator] Failed to check pending directives:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`[DirectiveCoordinator] Found ${data.length} pending directives`);

        for (const directive of data) {
          await this.deliverDirective(directive.id);
        }
      }
    } catch (err) {
      console.error('[DirectiveCoordinator] Error checking pending directives:', err);
    }
  }

  private async expireOldDirectives(): Promise<void> {
    try {
      await supabase
        .from('aura_directives')
        .update({ status: 'expired' })
        .eq('status', 'delivered')
        .lt('expires_at', new Date().toISOString());
    } catch (err) {
      console.error('[DirectiveCoordinator] Error expiring directives:', err);
    }
  }

  async getDirectives(status?: DirectiveStatus, limit: number = 20): Promise<Directive[]> {
    try {
      let query = supabase
        .from('aura_directives')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[DirectiveCoordinator] Failed to get directives:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        directiveType: row.directive_type,
        targetModule: row.target_module,
        priority: row.priority,
        content: row.content,
        status: row.status,
        coherenceAtGeneration: row.coherence_at_generation,
        generatedAt: new Date(row.generated_at),
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined
      }));
    } catch (err) {
      console.error('[DirectiveCoordinator] Error getting directives:', err);
      return [];
    }
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const DirectiveCoordinator = new DirectiveCoordinatorSingleton();
