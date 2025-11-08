/**
 * Narrative Synthesis Service - AI-Powered Journey Insights
 *
 * Uses AI to generate natural language summaries of user's consciousness journey.
 * Analyzes reality branches, RI trajectories, and field selections to create
 * meaningful narrative insights.
 */

interface JourneySummary {
  narrative: string;
  keyInsights: string[];
  growthAreas: string[];
  patterns: string[];
  recommendations: string[];
}

interface RealityBranchData {
  timestamp: string;
  resonance_index: number;
  belief_state: any;
  emotion_state: any;
  probability_field_id: string | null;
}

export class NarrativeSynthesisService {
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly model = 'anthropic/claude-3-haiku';

  constructor(private apiKey?: string) {
    if (!apiKey) {
      console.warn('NarrativeSynthesisService: No API key. AI summaries will not be available.');
    }
  }

  /**
   * Generate narrative summary from reality branch data
   */
  async generateJourneySummary(
    branches: RealityBranchData[],
    fieldNames: Map<string, string>,
    timeRange: string = '7 days'
  ): Promise<JourneySummary> {
    if (!this.apiKey) {
      return this.generateFallbackSummary(branches, fieldNames, timeRange);
    }

    try {
      const context = this.prepareContext(branches, fieldNames, timeRange);
      const response = await this.callAI(context);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('AI narrative generation failed:', error);
      return this.generateFallbackSummary(branches, fieldNames, timeRange);
    }
  }

  /**
   * Generate RI interpretation in natural language
   */
  async interpretRI(
    currentRI: number,
    recentHistory: number[],
    context?: string
  ): Promise<string> {
    if (!this.apiKey) {
      return this.generateFallbackRIInterpretation(currentRI, recentHistory);
    }

    try {
      const prompt = this.buildRIPrompt(currentRI, recentHistory, context);
      const response = await this.callAI(prompt);
      return response.trim();
    } catch (error) {
      console.error('RI interpretation failed:', error);
      return this.generateFallbackRIInterpretation(currentRI, recentHistory);
    }
  }

  /**
   * Synthesize pattern recognition across branches
   */
  async detectPatterns(
    branches: RealityBranchData[]
  ): Promise<string[]> {
    if (!this.apiKey || branches.length < 3) {
      return this.generateFallbackPatterns(branches);
    }

    try {
      const prompt = this.buildPatternPrompt(branches);
      const response = await this.callAI(prompt);
      return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    } catch (error) {
      console.error('Pattern detection failed:', error);
      return this.generateFallbackPatterns(branches);
    }
  }

  private prepareContext(
    branches: RealityBranchData[],
    fieldNames: Map<string, string>,
    timeRange: string
  ): string {
    const startRI = branches[0]?.resonance_index || 0;
    const endRI = branches[branches.length - 1]?.resonance_index || 0;
    const riDelta = endRI - startRI;

    const emotionStates = branches
      .map(b => b.emotion_state?.chemical_state)
      .filter(Boolean);
    const uniqueEmotions = [...new Set(emotionStates)];

    const fieldSelections = branches
      .map(b => b.probability_field_id ? fieldNames.get(b.probability_field_id) : null)
      .filter(Boolean);

    return `You are a compassionate consciousness guide analyzing a user's ${timeRange} journey through their reality branches.

Journey Data:
- Time period: ${timeRange}
- Starting RI: ${startRI.toFixed(3)}
- Ending RI: ${endRI.toFixed(3)}
- Change: ${riDelta > 0 ? '+' : ''}${riDelta.toFixed(3)}
- Total branches: ${branches.length}
- Emotional states explored: ${uniqueEmotions.join(', ')}
- Fields experienced: ${fieldSelections.join(', ')}

Generate a warm, insightful 2-paragraph narrative summary that:
1. Describes their journey with empathy and specificity
2. Highlights meaningful patterns or shifts
3. Celebrates growth while acknowledging challenges
4. Offers 3 key insights
5. Suggests 2 growth areas
6. Identifies 2-3 patterns
7. Provides 2 actionable recommendations

Format as JSON:
{
  "narrative": "2-paragraph summary",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "growthAreas": ["area 1", "area 2"],
  "patterns": ["pattern 1", "pattern 2"],
  "recommendations": ["rec 1", "rec 2"]
}`;
  }

  private buildRIPrompt(
    currentRI: number,
    recentHistory: number[],
    context?: string
  ): string {
    const trend = this.calculateTrend(recentHistory);
    const stability = this.calculateStability(recentHistory);

    return `Interpret this Resonance Index (RI) reading with warmth and insight:

Current RI: ${currentRI.toFixed(3)}
Recent history: ${recentHistory.map(ri => ri.toFixed(2)).join(', ')}
Trend: ${trend}
Stability: ${stability}
${context ? `Context: ${context}` : ''}

Provide a 1-2 sentence interpretation that:
- Explains what this RI level means for the user's current state
- Acknowledges the trend (improving/declining/stable)
- Offers encouraging guidance
- Uses accessible, non-technical language

Be direct, warm, and specific.`;
  }

  private buildPatternPrompt(branches: RealityBranchData[]): string {
    const riValues = branches.map(b => b.resonance_index);
    const emotions = branches.map(b => b.emotion_state?.chemical_state).filter(Boolean);

    return `Identify meaningful patterns in this consciousness journey data:

RI values: ${riValues.map(ri => ri.toFixed(2)).join(', ')}
Emotional states: ${emotions.join(', ')}
Total branches: ${branches.length}

List 3-5 significant patterns you observe. Each pattern should be:
- One line
- Specific and actionable
- Evidence-based from the data
- Written in accessible language

Examples:
- "RI tends to increase after grounding practices"
- "Anxiety states cluster in morning branches"
- "Higher coherence follows intentional reflection"

List patterns, one per line:`;
  }

  private async callAI(prompt: string): Promise<string> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://sacredshifter.com',
        'X-Title': 'Sacred Shifter ROE'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseAIResponse(response: string): JourneySummary {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      // Fallback parsing
      return {
        narrative: response.substring(0, 500),
        keyInsights: ['Growth observed in recent branches'],
        growthAreas: ['Continue exploring diverse fields'],
        patterns: ['Patterns emerging in your journey'],
        recommendations: ['Keep engaging with the system']
      };
    }
  }

  private generateFallbackSummary(
    branches: RealityBranchData[],
    fieldNames: Map<string, string>,
    timeRange: string
  ): JourneySummary {
    const startRI = branches[0]?.resonance_index || 0;
    const endRI = branches[branches.length - 1]?.resonance_index || 0;
    const riDelta = endRI - startRI;

    const narrative = `Over the past ${timeRange}, you've created ${branches.length} reality branches. Your Resonance Index ${
      riDelta > 0.05 ? 'increased' : riDelta < -0.05 ? 'decreased' : 'remained stable'
    }, moving from ${startRI.toFixed(2)} to ${endRI.toFixed(2)}. ${
      riDelta > 0 ? 'This suggests growing coherence between your beliefs, emotions, and values.' :
      'This period involved navigating complexity and integration work.'
    }

Your journey shows engagement with diverse experiences and a willingness to explore different pathways. The system has been learning from your feedback, adapting to better serve your growth process.`;

    return {
      narrative,
      keyInsights: [
        `Created ${branches.length} reality branches in ${timeRange}`,
        `RI ${riDelta > 0 ? 'increased' : 'changed'} by ${Math.abs(riDelta).toFixed(3)}`,
        'System is learning from your engagement patterns'
      ],
      growthAreas: [
        'Continue providing feedback on experiences',
        'Explore diverse fields to build comprehensive data'
      ],
      patterns: [
        'Regular engagement with consciousness navigation',
        'Building personalized optimization patterns'
      ],
      recommendations: [
        'Review your Memory Mirror to spot trends',
        'Check Field Effectiveness to see what works best'
      ]
    };
  }

  private generateFallbackRIInterpretation(currentRI: number, recentHistory: number[]): string {
    const trend = this.calculateTrend(recentHistory);

    if (currentRI >= 0.75) {
      return `Your RI of ${currentRI.toFixed(2)} indicates strong coherence across belief, emotion, and value dimensions. ${
        trend === 'up' ? 'The upward trend suggests you\'re building momentum.' : ''
      } You're in a highly resonant state.`;
    } else if (currentRI >= 0.5) {
      return `Your RI of ${currentRI.toFixed(2)} shows moderate coherence. ${
        trend === 'up' ? 'The positive trend is encouraging—you\'re moving in a supportive direction.' :
        trend === 'down' ? 'The dip may indicate integration work happening.' :
        'This stable state suggests consistent engagement.'
      }`;
    } else if (currentRI >= 0.3) {
      return `Your RI of ${currentRI.toFixed(2)} indicates you're navigating complexity. ${
        trend === 'up' ? 'The upward movement shows resilience and adaptive capacity.' :
        'This is a natural part of consciousness exploration—integration takes time.'
      }`;
    } else {
      return `Your RI of ${currentRI.toFixed(2)} suggests significant discord between different aspects of your experience. ${
        trend === 'up' ? 'The improving trend shows you\'re finding your way through.' :
        'Consider grounding practices and gentle self-compassion as you navigate this terrain.'
      }`;
    }
  }

  private generateFallbackPatterns(branches: RealityBranchData[]): string[] {
    if (branches.length < 3) {
      return ['Building foundation for pattern detection', 'Continue creating branches to reveal patterns'];
    }

    const riValues = branches.map(b => b.resonance_index);
    const avgRI = riValues.reduce((sum, ri) => sum + ri, 0) / riValues.length;
    const trend = this.calculateTrend(riValues);

    return [
      `Average RI over period: ${avgRI.toFixed(2)}`,
      `Overall trend: ${trend}`,
      `Created ${branches.length} branches—building rich data`
    ];
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    if (diff > 0.05) return 'up';
    if (diff < -0.05) return 'down';
    return 'stable';
  }

  private calculateStability(values: number[]): 'stable' | 'volatile' {
    if (values.length < 3) return 'stable';

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return stdDev < 0.15 ? 'stable' : 'volatile';
  }
}

export const narrativeSynthesisService = new NarrativeSynthesisService(
  import.meta.env.VITE_OPENROUTER_API_KEY
);
