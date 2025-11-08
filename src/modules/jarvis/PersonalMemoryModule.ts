/**
 * PersonalMemoryModule - Kent's Personal Knowledge Graph
 *
 * Builds and maintains a comprehensive knowledge graph about Kent's:
 * - Preferences and patterns
 * - Skills and expertise areas
 * - Relationships and connections
 * - Projects and their context
 * - Decisions and their rationales
 * - Goals and aspirations
 *
 * Uses semantic embeddings for intelligent retrieval and connection discovery.
 */

import { IModule, ModuleManifest } from '../../metaphysical-os/types/IModule';
import { GlobalEventHorizon } from '../../metaphysical-os/core/GlobalEventHorizon';
import { supabase } from '../../lib/supabase';

type MemoryCategory = 'preference' | 'skill' | 'relationship' | 'project' | 'decision' | 'pattern' | 'goal';

interface Memory {
  id: string;
  category: MemoryCategory;
  key: string;
  value: any;
  confidence: number;
  context: Record<string, any>;
  lastAccessed: Date;
  accessCount: number;
}

interface KnowledgeNode {
  id: string;
  type: string;
  data: any;
  relationships: Array<{
    targetId: string;
    relationshipType: string;
    strength: number;
  }>;
  importance: number;
}

export class PersonalMemoryModule implements IModule {
  manifest: ModuleManifest = {
    id: 'jarvis-personal-memory',
    name: 'Personal Memory & Knowledge Graph',
    version: '1.0.0',
    author: 'Kent Burchard',
    essenceLabels: ['memory', 'knowledge', 'learning', 'personalization', 'intelligence'],
    capabilities: [
      'preference-learning',
      'pattern-recognition',
      'knowledge-storage',
      'semantic-search',
      'relationship-mapping',
      'decision-tracking'
    ],
    telosAlignment: ['deep-personalization', 'continuous-learning', 'contextual-awareness'],
    dependencies: [],
    resourceFootprintMB: 25,
    priority: 8
  };

  private userEmail = 'kentburchard@sacredshifter.com';
  private memoryCache: Map<string, Memory> = new Map();
  private learningEnabled = true;

  async initialize(): Promise<void> {
    console.log('[PersonalMemory] Initializing personal memory system...');

    await this.loadInitialMemories();
    this.subscribeToLearningEvents();

    GlobalEventHorizon.emit({
      eventType: 'module.initialized',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: { memoriesLoaded: this.memoryCache.size },
      semanticLabels: ['jarvis', 'memory', 'initialization']
    });
  }

  async activate(): Promise<void> {
    console.log('[PersonalMemory] Activating memory system...');
    this.learningEnabled = true;

    GlobalEventHorizon.emit({
      eventType: 'jarvis.memory.activated',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: { status: 'learning' },
      semanticLabels: ['jarvis', 'memory', 'activation']
    });
  }

  async deactivate(): Promise<void> {
    console.log('[PersonalMemory] Deactivating memory system...');
    this.learningEnabled = false;
    await this.syncMemoriesToDatabase();
  }

  async destroy(): Promise<void> {
    await this.syncMemoriesToDatabase();
    this.memoryCache.clear();
  }

  getExposedItems(): Record<string, any> {
    return {
      remember: this.remember.bind(this),
      recall: this.recall.bind(this),
      forget: this.forget.bind(this),
      search: this.search.bind(this),
      getPattern: this.getPattern.bind(this),
      addKnowledge: this.addKnowledge.bind(this)
    };
  }

  private async loadInitialMemories(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('jarvis_personal_memory')
        .select('*')
        .eq('user_email', this.userEmail)
        .order('confidence_score', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[PersonalMemory] Failed to load memories:', error);
        return;
      }

      if (data) {
        data.forEach(row => {
          const memory: Memory = {
            id: row.id,
            category: row.category,
            key: row.memory_key,
            value: row.memory_value,
            confidence: row.confidence_score,
            context: row.context || {},
            lastAccessed: new Date(row.last_accessed),
            accessCount: row.access_count
          };

          this.memoryCache.set(memory.key, memory);
        });

        console.log(`[PersonalMemory] Loaded ${data.length} memories`);
      }
    } catch (err) {
      console.error('[PersonalMemory] Error loading memories:', err);
    }
  }

  private subscribeToLearningEvents(): void {
    GlobalEventHorizon.subscribe('jarvis.command_received', (event) => {
      if (this.learningEnabled) {
        this.learnFromCommand(event.payload);
      }
    });

    GlobalEventHorizon.subscribe('jarvis.wake_word_detected', (event) => {
      this.rememberPattern('wake_word_time', {
        hour: new Date().getHours(),
        day: new Date().getDay(),
        wakeWord: event.payload.wakeWord
      });
    });

    GlobalEventHorizon.subscribe('AURA_ALIVE', (event) => {
      this.rememberPattern('high_coherence_context', {
        timestamp: Date.now(),
        modules: event.payload.participatingModules,
        coherence: event.payload.coherenceScore
      });
    });
  }

  private async learnFromCommand(command: any): void {
    if (command.intent === 'preference') {
      await this.remember('preference', command.text, command, 0.8);
    }

    await this.trackCommandPattern(command);
  }

  private async trackCommandPattern(command: any): Promise<void> {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const intent = command.intent;

    const patternKey = `command_pattern_${intent}`;
    const existing = await this.recall('pattern', patternKey);

    const patterns = existing || { hourDistribution: {}, dayDistribution: {} };

    patterns.hourDistribution[hour] = (patterns.hourDistribution[hour] || 0) + 1;
    patterns.dayDistribution[dayOfWeek] = (patterns.dayDistribution[dayOfWeek] || 0) + 1;

    await this.remember('pattern', patternKey, patterns, 0.9);
  }

  async remember(
    category: MemoryCategory,
    key: string,
    value: any,
    confidence: number = 0.7,
    context: Record<string, any> = {}
  ): Promise<void> {
    const memory: Memory = {
      id: crypto.randomUUID(),
      category,
      key,
      value,
      confidence,
      context,
      lastAccessed: new Date(),
      accessCount: 0
    };

    this.memoryCache.set(key, memory);

    try {
      const { error } = await supabase
        .from('jarvis_personal_memory')
        .upsert({
          user_email: this.userEmail,
          category,
          memory_key: key,
          memory_value: value,
          confidence_score: confidence,
          context,
          last_accessed: new Date().toISOString()
        }, {
          onConflict: 'user_email,category,memory_key'
        });

      if (error) {
        console.error('[PersonalMemory] Failed to persist memory:', error);
      }

      GlobalEventHorizon.emit({
        eventType: 'jarvis.memory.created',
        moduleId: this.manifest.id,
        timestamp: Date.now(),
        payload: { category, key, confidence },
        semanticLabels: ['jarvis', 'memory', 'learning']
      });
    } catch (err) {
      console.error('[PersonalMemory] Error persisting memory:', err);
    }
  }

  async recall(category: MemoryCategory, key: string): Promise<any | null> {
    const cached = this.memoryCache.get(key);

    if (cached) {
      cached.lastAccessed = new Date();
      cached.accessCount++;
      return cached.value;
    }

    try {
      const { data, error } = await supabase
        .from('jarvis_personal_memory')
        .select('*')
        .eq('user_email', this.userEmail)
        .eq('category', category)
        .eq('memory_key', key)
        .single();

      if (error || !data) {
        return null;
      }

      await supabase
        .from('jarvis_personal_memory')
        .update({
          last_accessed: new Date().toISOString(),
          access_count: data.access_count + 1
        })
        .eq('id', data.id);

      return data.memory_value;
    } catch (err) {
      console.error('[PersonalMemory] Error recalling memory:', err);
      return null;
    }
  }

  async forget(category: MemoryCategory, key: string): Promise<void> {
    this.memoryCache.delete(key);

    try {
      await supabase
        .from('jarvis_personal_memory')
        .delete()
        .eq('user_email', this.userEmail)
        .eq('category', category)
        .eq('memory_key', key);

      console.log(`[PersonalMemory] Forgot: ${key}`);
    } catch (err) {
      console.error('[PersonalMemory] Error forgetting memory:', err);
    }
  }

  async search(query: string, category?: MemoryCategory, limit: number = 10): Promise<Memory[]> {
    try {
      let queryBuilder = supabase
        .from('jarvis_personal_memory')
        .select('*')
        .eq('user_email', this.userEmail);

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      queryBuilder = queryBuilder
        .order('confidence_score', { ascending: false })
        .limit(limit);

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('[PersonalMemory] Search error:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        category: row.category,
        key: row.memory_key,
        value: row.memory_value,
        confidence: row.confidence_score,
        context: row.context || {},
        lastAccessed: new Date(row.last_accessed),
        accessCount: row.access_count
      }));
    } catch (err) {
      console.error('[PersonalMemory] Error searching memories:', err);
      return [];
    }
  }

  async getPattern(patternType: string): Promise<any | null> {
    return await this.recall('pattern', `${patternType}_pattern`);
  }

  private async rememberPattern(patternType: string, data: any): Promise<void> {
    const existing = await this.recall('pattern', patternType);

    const updated = existing ? { ...existing, ...data, count: (existing.count || 0) + 1 } : { ...data, count: 1 };

    await this.remember('pattern', patternType, updated, 0.9);
  }

  async addKnowledge(
    nodeType: string,
    nodeId: string,
    nodeData: any,
    relationships: Array<{
      targetId: string;
      relationshipType: string;
      strength: number;
    }> = []
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('jarvis_knowledge_graph')
        .upsert({
          user_email: this.userEmail,
          node_type: nodeType,
          node_id: nodeId,
          node_data: nodeData,
          relationships: relationships,
          importance_score: 0.7,
          last_accessed: new Date().toISOString()
        }, {
          onConflict: 'user_email,node_type,node_id'
        });

      if (error) {
        console.error('[PersonalMemory] Failed to add knowledge:', error);
        return;
      }

      GlobalEventHorizon.emit({
        eventType: 'jarvis.knowledge.added',
        moduleId: this.manifest.id,
        timestamp: Date.now(),
        payload: { nodeType, nodeId },
        semanticLabels: ['jarvis', 'knowledge', 'graph']
      });
    } catch (err) {
      console.error('[PersonalMemory] Error adding knowledge:', err);
    }
  }

  private async syncMemoriesToDatabase(): Promise<void> {
    console.log('[PersonalMemory] Syncing memories to database...');

    const memories = Array.from(this.memoryCache.values());

    for (const memory of memories) {
      try {
        await supabase
          .from('jarvis_personal_memory')
          .upsert({
            user_email: this.userEmail,
            category: memory.category,
            memory_key: memory.key,
            memory_value: memory.value,
            confidence_score: memory.confidence,
            context: memory.context,
            last_accessed: memory.lastAccessed.toISOString(),
            access_count: memory.accessCount
          }, {
            onConflict: 'user_email,category,memory_key'
          });
      } catch (err) {
        console.error('[PersonalMemory] Error syncing memory:', memory.key, err);
      }
    }

    console.log('[PersonalMemory] Sync complete');
  }
}
