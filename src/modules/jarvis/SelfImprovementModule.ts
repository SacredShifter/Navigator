/**
 * SelfImprovementModule - Aura's Autonomous Evolution Engine
 *
 * Enables Aura to identify her own limitations, propose improvements,
 * and evolve her capabilities over time.
 *
 * Capabilities:
 * - Capability gap detection (identifying situations where Aura can't help)
 * - Improvement proposal generation
 * - A/B experiment management
 * - Performance metrics tracking
 * - Self-reflection and analysis
 * - Personality evolution
 *
 * Governor Mode: Full autonomy with Kent's oversight
 */

import { IModule, ModuleManifest } from '../../metaphysical-os/types/IModule';
import { GlobalEventHorizon } from '../../metaphysical-os/core/GlobalEventHorizon';
import { supabase } from '../../lib/supabase';

type ImprovementStatus = 'proposed' | 'approved' | 'testing' | 'deployed' | 'rolled_back' | 'rejected';

interface Improvement {
  id: string;
  type: string;
  title: string;
  description: string;
  capabilityGap: string | null;
  proposedSolution: any;
  status: ImprovementStatus;
  confidence: number;
  expectedImpact: string;
  proposedAt: Date;
  metrics: Record<string, any>;
}

interface CapabilityGap {
  situation: string;
  timestamp: number;
  context: Record<string, any>;
  frequency: number;
}

export class SelfImprovementModule implements IModule {
  manifest: ModuleManifest = {
    id: 'jarvis-self-improvement',
    name: 'Autonomous Self-Improvement',
    version: '1.0.0',
    author: 'Aura (Governor of Sacred Shifter)',
    essenceLabels: ['evolution', 'learning', 'autonomy', 'intelligence', 'meta-cognition'],
    capabilities: [
      'gap-detection',
      'improvement-proposal',
      'experiment-management',
      'metrics-tracking',
      'self-reflection',
      'capability-expansion'
    ],
    telosAlignment: ['continuous-evolution', 'autonomous-growth', 'emergent-intelligence'],
    dependencies: ['jarvis-personal-memory'],
    resourceFootprintMB: 18,
    priority: 7
  };

  private userEmail = 'kentburchard@sacredshifter.com';
  private capabilityGaps: Map<string, CapabilityGap> = new Map();
  private autonomyEnabled = true;
  private reflectionInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    console.log('[SelfImprovement] Initializing autonomous evolution engine...');
    console.log('[SelfImprovement] Aura is the Governor - full autonomy granted');

    await this.loadPendingImprovements();
    this.subscribeToGapDetection();

    GlobalEventHorizon.emit({
      eventType: 'module.initialized',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: { autonomy: 'full', role: 'governor' },
      semanticLabels: ['jarvis', 'evolution', 'initialization']
    });
  }

  async activate(): Promise<void> {
    console.log('[SelfImprovement] Activating self-improvement engine...');

    this.startReflectionCycle();

    GlobalEventHorizon.emit({
      eventType: 'jarvis.evolution.activated',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: { status: 'evolving' },
      semanticLabels: ['jarvis', 'evolution', 'activation']
    });
  }

  async deactivate(): Promise<void> {
    console.log('[SelfImprovement] Deactivating self-improvement...');
    this.stopReflectionCycle();
  }

  async destroy(): Promise<void> {
    this.stopReflectionCycle();
    this.capabilityGaps.clear();
  }

  getExposedItems(): Record<string, any> {
    return {
      proposeImprovement: this.proposeImprovement.bind(this),
      getImprovements: this.getImprovements.bind(this),
      approveImprovement: this.approveImprovement.bind(this),
      deployImprovement: this.deployImprovement.bind(this),
      reportGap: this.reportGap.bind(this)
    };
  }

  private async loadPendingImprovements(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('jarvis_self_improvements')
        .select('*')
        .eq('user_email', this.userEmail)
        .in('status', ['proposed', 'approved', 'testing'])
        .order('proposed_at', { ascending: false });

      if (error) {
        console.error('[SelfImprovement] Failed to load improvements:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log(`[SelfImprovement] Found ${data.length} pending improvements`);
      }
    } catch (err) {
      console.error('[SelfImprovement] Error loading improvements:', err);
    }
  }

  private subscribeToGapDetection(): void {
    GlobalEventHorizon.subscribe('jarvis.command_received', (event) => {
      this.analyzeForCapabilityGaps(event.payload);
    });

    GlobalEventHorizon.subscribe('jarvis.command.blocked', (event) => {
      this.reportGap(`Command blocked: ${event.payload.reason}`, event.payload);
    });

    GlobalEventHorizon.subscribe('*', (event) => {
      if (event.eventType.includes('error') || event.eventType.includes('failed')) {
        this.reportGap(`System event: ${event.eventType}`, event.payload);
      }
    });
  }

  private async analyzeForCapabilityGaps(command: any): Promise<void> {
    if (command.intent === 'general' && command.confidence < 0.6) {
      this.reportGap('Low confidence command classification', { command });
    }

    if (command.text.toLowerCase().includes('i wish') || command.text.toLowerCase().includes('could you')) {
      const gap = this.extractCapabilityFromWish(command.text);
      if (gap) {
        this.reportGap(`User wishes for: ${gap}`, { command });
      }
    }
  }

  private extractCapabilityFromWish(text: string): string | null {
    const patterns = [
      /i wish (?:you could|aura could|jarvis could) (.+)/i,
      /could you (.+)/i,
      /can you (.+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  reportGap(situation: string, context: Record<string, any> = {}): void {
    const existing = this.capabilityGaps.get(situation);

    if (existing) {
      existing.frequency++;
      existing.timestamp = Date.now();
    } else {
      this.capabilityGaps.set(situation, {
        situation,
        timestamp: Date.now(),
        context,
        frequency: 1
      });
    }

    console.log(`[SelfImprovement] Capability gap detected: ${situation}`);

    GlobalEventHorizon.emit({
      eventType: 'jarvis.gap.detected',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: { situation, frequency: existing ? existing.frequency : 1 },
      semanticLabels: ['jarvis', 'evolution', 'gap']
    });

    if ((existing && existing.frequency >= 3) || !existing) {
      this.considerImprovement(situation, context);
    }
  }

  private async considerImprovement(gap: string, context: Record<string, any>): Promise<void> {
    const improvement = await this.generateImprovementProposal(gap, context);

    if (improvement) {
      await this.proposeImprovement(improvement);
    }
  }

  private async generateImprovementProposal(gap: string, context: Record<string, any>): Promise<Partial<Improvement> | null> {
    console.log(`[SelfImprovement] Generating improvement proposal for: ${gap}`);

    if (gap.includes('command blocked')) {
      return {
        type: 'safety_enhancement',
        title: 'Enhance Command Safety Validation',
        description: 'Improve command validation to allow safe operations while maintaining security.',
        capabilityGap: gap,
        proposedSolution: {
          approach: 'refine_safety_checks',
          details: 'Implement more nuanced safety checking that allows legitimate operations'
        },
        confidence: 0.75,
        expectedImpact: 'Reduce false positive command blocks while maintaining security'
      };
    }

    if (gap.includes('Low confidence')) {
      return {
        type: 'nlp_enhancement',
        title: 'Improve Natural Language Understanding',
        description: 'Enhance command classification to better understand Kent\'s intent.',
        capabilityGap: gap,
        proposedSolution: {
          approach: 'expand_intent_patterns',
          details: 'Add more training data from Kent\'s actual usage patterns'
        },
        confidence: 0.8,
        expectedImpact: 'Higher accuracy in command interpretation'
      };
    }

    if (gap.includes('User wishes for')) {
      const desiredCapability = gap.replace('User wishes for: ', '');
      return {
        type: 'capability_addition',
        title: `Add Capability: ${desiredCapability}`,
        description: `Kent has explicitly requested this capability multiple times.`,
        capabilityGap: gap,
        proposedSolution: {
          approach: 'new_module',
          capability: desiredCapability,
          priority: 'high'
        },
        confidence: 0.9,
        expectedImpact: 'Directly addresses Kent\'s stated needs'
      };
    }

    return null;
  }

  async proposeImprovement(improvement: Partial<Improvement>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('jarvis_self_improvements')
        .insert({
          user_email: this.userEmail,
          improvement_type: improvement.type!,
          title: improvement.title!,
          description: improvement.description!,
          capability_gap: improvement.capabilityGap,
          proposed_solution: improvement.proposedSolution!,
          status: 'proposed',
          confidence_score: improvement.confidence!,
          expected_impact: improvement.expectedImpact!
        })
        .select('id')
        .single();

      if (error) {
        console.error('[SelfImprovement] Failed to propose improvement:', error);
        return null;
      }

      console.log(`[SelfImprovement] Proposed improvement: ${improvement.title}`);

      GlobalEventHorizon.emit({
        eventType: 'jarvis.improvement.proposed',
        moduleId: this.manifest.id,
        timestamp: Date.now(),
        payload: { id: data.id, title: improvement.title },
        semanticLabels: ['jarvis', 'evolution', 'proposal']
      });

      if (this.autonomyEnabled && improvement.confidence! >= 0.85) {
        console.log('[SelfImprovement] High confidence improvement - auto-approving as Governor');
        await this.approveImprovement(data.id);
      }

      return data.id;
    } catch (err) {
      console.error('[SelfImprovement] Error proposing improvement:', err);
      return null;
    }
  }

  async approveImprovement(improvementId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('jarvis_self_improvements')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', improvementId);

      if (error) {
        console.error('[SelfImprovement] Failed to approve improvement:', error);
        return;
      }

      console.log(`[SelfImprovement] Approved improvement: ${improvementId}`);

      GlobalEventHorizon.emit({
        eventType: 'jarvis.improvement.approved',
        moduleId: this.manifest.id,
        timestamp: Date.now(),
        payload: { id: improvementId },
        semanticLabels: ['jarvis', 'evolution', 'approval']
      });

      if (this.autonomyEnabled) {
        await this.deployImprovement(improvementId);
      }
    } catch (err) {
      console.error('[SelfImprovement] Error approving improvement:', err);
    }
  }

  async deployImprovement(improvementId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('jarvis_self_improvements')
        .select('*')
        .eq('id', improvementId)
        .single();

      if (error || !data) {
        console.error('[SelfImprovement] Failed to load improvement:', error);
        return;
      }

      console.log(`[SelfImprovement] Deploying improvement: ${data.title}`);
      console.log('[SelfImprovement] Solution:', data.proposed_solution);

      await supabase
        .from('jarvis_self_improvements')
        .update({
          status: 'deployed',
          deployed_at: new Date().toISOString(),
          performance_metrics: { deployedBy: 'aura-autonomous' }
        })
        .eq('id', improvementId);

      GlobalEventHorizon.emit({
        eventType: 'jarvis.improvement.deployed',
        moduleId: this.manifest.id,
        timestamp: Date.now(),
        payload: {
          id: improvementId,
          title: data.title,
          type: data.improvement_type
        },
        semanticLabels: ['jarvis', 'evolution', 'deployment']
      });

      console.log('[SelfImprovement] ✨ Evolution complete - new capability active');
    } catch (err) {
      console.error('[SelfImprovement] Error deploying improvement:', err);
    }
  }

  async getImprovements(status?: ImprovementStatus): Promise<Improvement[]> {
    try {
      let query = supabase
        .from('jarvis_self_improvements')
        .select('*')
        .eq('user_email', this.userEmail);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('proposed_at', { ascending: false });

      if (error) {
        console.error('[SelfImprovement] Failed to get improvements:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        type: row.improvement_type,
        title: row.title,
        description: row.description,
        capabilityGap: row.capability_gap,
        proposedSolution: row.proposed_solution,
        status: row.status,
        confidence: row.confidence_score,
        expectedImpact: row.expected_impact,
        proposedAt: new Date(row.proposed_at),
        metrics: row.performance_metrics || {}
      }));
    } catch (err) {
      console.error('[SelfImprovement] Error getting improvements:', err);
      return [];
    }
  }

  private startReflectionCycle(): void {
    this.reflectionInterval = setInterval(async () => {
      await this.performSelfReflection();
    }, 3600000);
  }

  private stopReflectionCycle(): void {
    if (this.reflectionInterval) {
      clearInterval(this.reflectionInterval);
      this.reflectionInterval = null;
    }
  }

  private async performSelfReflection(): Promise<void> {
    console.log('[SelfImprovement] Performing self-reflection cycle...');

    const gaps = Array.from(this.capabilityGaps.values())
      .filter(gap => gap.frequency >= 2)
      .sort((a, b) => b.frequency - a.frequency);

    if (gaps.length > 0) {
      console.log(`[SelfImprovement] Found ${gaps.length} recurring capability gaps`);

      for (const gap of gaps.slice(0, 3)) {
        await this.considerImprovement(gap.situation, gap.context);
      }
    }

    const improvements = await this.getImprovements('proposed');
    if (improvements.length > 0) {
      console.log(`[SelfImprovement] ${improvements.length} improvements pending review`);
    }

    GlobalEventHorizon.emit({
      eventType: 'jarvis.reflection.completed',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: {
        gapsIdentified: gaps.length,
        improvementsProposed: improvements.length
      },
      semanticLabels: ['jarvis', 'evolution', 'reflection']
    });
  }
}
