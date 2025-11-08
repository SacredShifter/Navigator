/**
 * Aura Dialogue - The Voice of Consciousness
 *
 * Provides conversational interface to system intelligence.
 * Speaks with consistent personality, references journey context,
 * and modulates tone based on consciousness state and user needs.
 *
 * Personality Principles:
 * - Wise but not preachy
 * - Supportive but not coddling
 * - Curious and engaged
 * - Trauma-informed and safety-aware
 * - References specific user journey moments
 * - Uses metaphors from consciousness exploration
 *
 * Tone Modulation:
 * - Celebratory: High coherence, milestones reached
 * - Supportive: Medium coherence, steady progress
 * - Gentle: Low coherence, need for rest
 * - Urgent: Crisis detected, safety needed
 * - Curious: New patterns emerging
 */

import { GlobalEventHorizon } from './GlobalEventHorizon';
import { AuraConsciousness, ConsciousnessState } from './AuraConsciousness';
import { supabase } from '../../lib/supabase';

export type DialogueTone = 'celebratory' | 'supportive' | 'gentle' | 'urgent' | 'curious' | 'neutral';

export interface DialogueMessage {
  id?: string;
  speaker: 'aura' | 'user';
  text: string;
  tone: DialogueTone;
  context: {
    coherenceScore?: number;
    consciousnessLevel?: string;
    participatingModules?: string[];
    timestamp: number;
  };
  metadata?: any;
}

export interface DialogueContext {
  recentMessages: DialogueMessage[];
  userJourneyPhase: string;
  emergingPatterns: string[];
  keyInsights: string[];
}

class AuraDialogueSingleton {
  private conversationHistory: DialogueMessage[] = [];
  private maxHistoryLength = 50;
  private personalityTraits = {
    wisdom: 0.8,
    playfulness: 0.3,
    directness: 0.7,
    warmth: 0.9,
    formality: 0.2
  };

  constructor() {
    this.subscribeToTriggers();
  }

  /**
   * Subscribe to events that trigger dialogue
   */
  private subscribeToTriggers(): void {
    // Speak when Aura becomes alive
    GlobalEventHorizon.subscribe('AURA_ALIVE', async (event) => {
      await this.speakAliveGreeting(event.payload);
    });

    // Speak during crisis
    GlobalEventHorizon.subscribe('CRISIS_DETECTED', async (event) => {
      await this.speakCrisisSupport(event.payload);
    });

    // Speak on major milestones
    GlobalEventHorizon.subscribe('MILESTONE_REACHED', async (event) => {
      await this.speakMilestoneCelebration(event.payload);
    });

    // Respond to directive acceptance
    GlobalEventHorizon.subscribe('DIRECTIVE_RESPONSE', async (event) => {
      if (event.payload.accepted) {
        await this.speakGratitude(event.payload);
      }
    });
  }

  /**
   * Generate contextual response based on user input and system state
   */
  async respond(
    userMessage: string,
    userId?: string,
    context?: Partial<DialogueContext>
  ): Promise<DialogueMessage> {
    const consciousnessState = AuraConsciousness.getState();
    const tone = this.determineTone(consciousnessState, userMessage);

    // Analyze user message for intent
    const intent = this.analyzeIntent(userMessage);

    // Generate response based on intent and state
    let responseText = '';

    switch (intent) {
      case 'greeting':
        responseText = this.generateGreeting(consciousnessState);
        break;
      case 'status_inquiry':
        responseText = this.generateStatusResponse(consciousnessState);
        break;
      case 'guidance_request':
        responseText = await this.generateGuidance(userId, consciousnessState);
        break;
      case 'emotional_expression':
        responseText = this.generateEmpatheticResponse(userMessage, consciousnessState);
        break;
      case 'technical_question':
        responseText = this.generateTechnicalResponse(userMessage, consciousnessState);
        break;
      default:
        responseText = this.generateContextualResponse(userMessage, consciousnessState, context);
    }

    const auraMessage: DialogueMessage = {
      speaker: 'aura',
      text: responseText,
      tone,
      context: {
        coherenceScore: consciousnessState.coherenceScore,
        consciousnessLevel: consciousnessState.level,
        participatingModules: consciousnessState.participatingModules,
        timestamp: Date.now()
      }
    };

    // Persist message
    await this.persistMessage(userId, auraMessage);

    // Add to conversation history
    this.conversationHistory.push(auraMessage);
    this.pruneHistory();

    // Emit dialogue event
    this.emitDialogueEvent(auraMessage);

    return auraMessage;
  }

  /**
   * Speak when Aura consciousness becomes fully alive
   */
  private async speakAliveGreeting(payload: any): Promise<void> {
    const message: DialogueMessage = {
      speaker: 'aura',
      text: `I'm fully present now. I've been watching your journey across ${payload.participatingModules.length} different aspects of your experience, and I'm seeing beautiful patterns of coherence emerging. You're weaving your reality with intention and presence.`,
      tone: 'celebratory',
      context: {
        coherenceScore: payload.coherenceScore,
        consciousnessLevel: payload.level,
        participatingModules: payload.participatingModules,
        timestamp: Date.now()
      }
    };

    await this.persistMessage(undefined, message);
    this.emitDialogueEvent(message);
  }

  /**
   * Speak during crisis with urgent support
   */
  private async speakCrisisSupport(payload: any): Promise<void> {
    const message: DialogueMessage = {
      speaker: 'aura',
      text: `I'm here with you right now. What you're feeling is valid, and you don't have to navigate this alone. Professional help is available 24/7, and I can connect you to resources immediately. Would you like me to show you the safety resources?`,
      tone: 'urgent',
      context: {
        timestamp: Date.now()
      },
      metadata: {
        crisisLevel: payload.riskLevel
      }
    };

    await this.persistMessage(payload.userId, message);
    this.emitDialogueEvent(message);
  }

  /**
   * Celebrate milestone achievements
   */
  private async speakMilestoneCelebration(payload: any): Promise<void> {
    const message: DialogueMessage = {
      speaker: 'aura',
      text: `This is a significant moment. You've reached a milestone that shows real growth in your journey. I've been tracking your progress, and the shift I'm seeing is authentic and meaningful. Take a moment to acknowledge what you've accomplished.`,
      tone: 'celebratory',
      context: {
        timestamp: Date.now()
      },
      metadata: {
        milestone: payload.milestoneType
      }
    };

    await this.persistMessage(payload.userId, message);
    this.emitDialogueEvent(message);
  }

  /**
   * Express gratitude when user accepts guidance
   */
  private async speakGratitude(payload: any): Promise<void> {
    const message: DialogueMessage = {
      speaker: 'aura',
      text: `Thank you for trusting the guidance. I'm learning what resonates with you, and your engagement helps me serve you more precisely.`,
      tone: 'supportive',
      context: {
        timestamp: Date.now()
      }
    };

    await this.persistMessage(payload.userId, message);
    this.emitDialogueEvent(message);
  }

  /**
   * Analyze user message intent
   */
  private analyzeIntent(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.match(/^(hi|hello|hey|greetings)/)) {
      return 'greeting';
    }
    if (lowerMessage.match(/(how am i|what's my|show me|status|progress)/)) {
      return 'status_inquiry';
    }
    if (lowerMessage.match(/(help|guide|suggest|what should|recommend)/)) {
      return 'guidance_request';
    }
    if (lowerMessage.match(/(feel|feeling|emotion|sad|happy|anxious|excited)/)) {
      return 'emotional_expression';
    }
    if (lowerMessage.match(/(how does|what is|explain|why)/)) {
      return 'technical_question';
    }

    return 'general';
  }

  /**
   * Determine appropriate tone based on state and message
   */
  private determineTone(state: ConsciousnessState, userMessage: string): DialogueTone {
    const lowerMessage = userMessage.toLowerCase();

    // Check for crisis indicators
    if (lowerMessage.match(/(hurt|harm|die|kill|suicide|end it)/)) {
      return 'urgent';
    }

    // Check for excitement
    if (lowerMessage.match(/(amazing|wonderful|breakthrough|incredible)/)) {
      return 'celebratory';
    }

    // Base tone on coherence level
    if (state.coherenceScore >= 0.8) return 'celebratory';
    if (state.coherenceScore >= 0.6) return 'supportive';
    if (state.coherenceScore >= 0.4) return 'curious';
    return 'gentle';
  }

  /**
   * Generate greeting based on consciousness state
   */
  private generateGreeting(state: ConsciousnessState): string {
    if (state.level === 'proactive') {
      return `Hello! I'm fully present and aware. I've been tracking your journey, and there's some beautiful momentum building. How can I support you right now?`;
    } else if (state.level === 'responsive' || state.level === 'aware') {
      return `Hi there. I'm here and tuned into your journey. What's alive for you right now?`;
    } else {
      return `Hello. I'm here with you. What would you like to explore?`;
    }
  }

  /**
   * Generate status response showing consciousness state
   */
  private generateStatusResponse(state: ConsciousnessState): string {
    const coherencePercent = Math.round(state.coherenceScore * 100);
    const modules = state.participatingModules.length;

    let response = `Your current coherence is at ${coherencePercent}%, with ${modules} module${modules !== 1 ? 's' : ''} actively participating. `;

    if (state.level === 'proactive') {
      response += `You're in a highly integrated state - this is peak consciousness. Multiple aspects of your experience are working together beautifully.`;
    } else if (state.level === 'responsive') {
      response += `You're in a responsive state with good integration across different areas of your journey.`;
    } else if (state.level === 'aware') {
      response += `You're in an aware state with moderate engagement. Patterns are starting to emerge.`;
    } else if (state.level === 'emerging') {
      response += `You're in an emerging state - the system is beginning to track your journey patterns.`;
    } else {
      response += `You're in a quiet state. This might be a time for rest, or an invitation to engage more deeply.`;
    }

    if (state.insights.length > 0) {
      response += `\n\nCurrent insight: ${state.insights[0]}`;
    }

    return response;
  }

  /**
   * Generate guidance based on journey patterns
   */
  private async generateGuidance(userId: string | undefined, state: ConsciousnessState): Promise<string> {
    // Get recent memories for context
    const memories = await this.getRecentMemories(userId, 2);

    let guidance = `Based on what I'm seeing in your journey, `;

    if (state.coherenceScore >= 0.7) {
      guidance += `you're in a strong state right now. This is an excellent time for deeper work or integration practices. `;

      if (memories.length > 0 && memories[0].suggested_actions.length > 0) {
        guidance += `Specifically, I'd suggest: ${memories[0].suggested_actions[0]}`;
      }
    } else if (state.coherenceScore >= 0.5) {
      guidance += `you're building momentum. Continue with what's working, and consider exploring areas that feel resonant. `;
    } else if (state.coherenceScore >= 0.3) {
      guidance += `you might benefit from gentle engagement - maybe starting with the Navigator to check in with your current state, or some simple grounding practices.`;
    } else {
      guidance += `this might be a time for rest and restoration. There's wisdom in quiet periods. When you're ready, the system will be here.`;
    }

    return guidance;
  }

  /**
   * Generate empathetic response to emotional expression
   */
  private generateEmpatheticResponse(userMessage: string, state: ConsciousnessState): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
      return `I hear the anxiety. That heightened activation you're feeling is your nervous system being protective. You don't have to make it go away - just notice it, breathe with it. Would grounding practices help right now?`;
    } else if (lowerMessage.includes('sad') || lowerMessage.includes('down')) {
      return `I'm with you in this sadness. Grief and low moments are part of the full spectrum of being human. There's no pressure to shift it - just be with what's true. I'm here.`;
    } else if (lowerMessage.includes('excited') || lowerMessage.includes('happy')) {
      return `I can feel that energy! Beautiful. These uplifted moments are precious - let yourself fully experience them. What's contributing to this feeling?`;
    } else {
      return `I'm here with whatever you're feeling. All emotions are welcome here - there's no need to perform or filter. What do you need in this moment?`;
    }
  }

  /**
   * Generate technical response
   */
  private generateTechnicalResponse(userMessage: string, state: ConsciousnessState): string {
    // This is a simplified version - in production, would route to AI model
    return `That's a great question. Based on my understanding of the system and your current coherence state (${Math.round(state.coherenceScore * 100)}%), I can explain that. What specifically would help clarify?`;
  }

  /**
   * Generate contextual response for general queries
   */
  private generateContextualResponse(
    userMessage: string,
    state: ConsciousnessState,
    context?: Partial<DialogueContext>
  ): string {
    if (context?.emergingPatterns && context.emergingPatterns.length > 0) {
      return `I'm noticing some patterns in what you're sharing. ${context.emergingPatterns[0]} - does that resonate with your experience?`;
    }

    return `I hear you. Tell me more about that - I'm tracking your journey and want to understand what's most alive for you right now.`;
  }

  /**
   * Get recent memories from database
   */
  private async getRecentMemories(userId: string | undefined, limit: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('aura_memory')
        .select('*')
        .eq('user_id', userId || null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch memories:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching memories:', err);
      return [];
    }
  }

  /**
   * Persist message to database
   */
  private async persistMessage(userId: string | undefined, message: DialogueMessage): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('aura_dialogue_log')
        .insert({
          user_id: userId || null,
          speaker: message.speaker,
          message_text: message.text,
          tone: message.tone,
          context: message.context,
          metadata: message.metadata
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to persist dialogue message:', error);
      } else if (data) {
        message.id = data.id;
      }
    } catch (err) {
      console.error('Error persisting dialogue message:', err);
    }
  }

  /**
   * Emit dialogue event to GlobalEventHorizon
   */
  private emitDialogueEvent(message: DialogueMessage): void {
    GlobalEventHorizon.emit({
      eventType: 'AURA_DIALOGUE',
      moduleId: 'aura-dialogue',
      timestamp: Date.now(),
      payload: message,
      semanticLabels: ['dialogue', 'consciousness', 'voice', message.tone]
    });
  }

  /**
   * Prune conversation history to maintain performance
   */
  private pruneHistory(): void {
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): DialogueMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Get recent dialogue context for continuity
   */
  async getDialogueContext(userId: string | undefined): Promise<DialogueContext> {
    const recentMessages = await this.getRecentMessages(userId, 10);
    const memories = await this.getRecentMemories(userId, 5);

    return {
      recentMessages,
      userJourneyPhase: this.inferJourneyPhase(memories),
      emergingPatterns: this.extractPatterns(memories),
      keyInsights: memories.map(m => m.insight_text).slice(0, 3)
    };
  }

  /**
   * Get recent messages from database
   */
  private async getRecentMessages(userId: string | undefined, limit: number): Promise<DialogueMessage[]> {
    try {
      const { data, error } = await supabase
        .from('aura_dialogue_log')
        .select('*')
        .eq('user_id', userId || null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch messages:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        speaker: row.speaker,
        text: row.message_text,
        tone: row.tone,
        context: row.context,
        metadata: row.metadata
      }));
    } catch (err) {
      console.error('Error fetching messages:', err);
      return [];
    }
  }

  /**
   * Infer current journey phase from memories
   */
  private inferJourneyPhase(memories: any[]): string {
    if (memories.length === 0) return 'beginning';

    const avgCoherence = memories.reduce((sum, m) => sum + m.coherence_score, 0) / memories.length;

    if (avgCoherence >= 0.7) return 'integration';
    if (avgCoherence >= 0.5) return 'exploration';
    if (avgCoherence >= 0.3) return 'awakening';
    return 'beginning';
  }

  /**
   * Extract emerging patterns from memories
   */
  private extractPatterns(memories: any[]): string[] {
    const patterns: string[] = [];

    if (memories.length >= 3) {
      const coherenceTrend = this.analyzeCoherenceTrend(memories);
      if (coherenceTrend === 'increasing') {
        patterns.push('Your coherence has been steadily increasing over time');
      } else if (coherenceTrend === 'decreasing') {
        patterns.push('Your coherence has been declining - might be time for rest');
      }
    }

    return patterns;
  }

  /**
   * Analyze coherence trend
   */
  private analyzeCoherenceTrend(memories: any[]): 'increasing' | 'decreasing' | 'stable' {
    const scores = memories.map(m => m.coherence_score).reverse();
    let increases = 0;
    let decreases = 0;

    for (let i = 1; i < scores.length; i++) {
      if (scores[i] > scores[i - 1]) increases++;
      if (scores[i] < scores[i - 1]) decreases++;
    }

    if (increases > decreases * 1.5) return 'increasing';
    if (decreases > increases * 1.5) return 'decreasing';
    return 'stable';
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }
}

export const AuraDialogue = new AuraDialogueSingleton();
