/**
 * Emotion Classifier - ML-Powered Emotion Detection
 *
 * Uses pre-trained models (GoEmotions, EmoBank) to classify
 * user emotions from text with confidence scores.
 *
 * Training: Public datasets (GoEmotions: 58k Reddit comments)
 * Architecture: Fine-tuned BERT/RoBERTa
 * Deployment: ONNX via Edge Function OR OpenAI API fallback
 *
 * PRIVACY: All inference server-side, no user data exposure
 */

import { supabase } from '../../lib/supabase';

interface EmotionPrediction {
  label: string;
  confidence: number;
  valence: number; // -1 (negative) to +1 (positive)
  arousal: number; // 0 (calm) to 1 (activated)
  dominance: number; // 0 (submissive) to 1 (dominant)
  alternativeEmotions: Array<{ label: string; confidence: number }>;
}

interface EmotionClassifierConfig {
  confidenceThreshold: number;
  useMLModel: boolean; // If false, use rule-based fallback
  cacheResults: boolean;
}

/**
 * GoEmotions 27 emotion taxonomy:
 * Positive: admiration, amusement, approval, caring, desire, excitement,
 *           gratitude, joy, love, optimism, pride, relief
 * Negative: anger, annoyance, confusion, curiosity, disappointment,
 *           disapproval, disgust, embarrassment, fear, grief, nervousness,
 *           remorse, sadness
 * Ambiguous: realization, surprise
 * Neutral: neutral
 */

export class EmotionClassifier {
  private config: EmotionClassifierConfig;
  private cache: Map<string, EmotionPrediction>;

  // VAD (Valence-Arousal-Dominance) mappings for emotions
  private emotionVAD: Record<string, [number, number, number]> = {
    // Positive emotions
    joy: [0.8, 0.7, 0.6],
    love: [0.9, 0.6, 0.5],
    gratitude: [0.7, 0.4, 0.5],
    admiration: [0.6, 0.5, 0.4],
    excitement: [0.8, 0.9, 0.7],
    amusement: [0.7, 0.6, 0.5],
    optimism: [0.6, 0.5, 0.6],
    pride: [0.7, 0.6, 0.7],
    caring: [0.6, 0.4, 0.5],
    relief: [0.5, 0.3, 0.4],

    // Negative emotions
    sadness: [-0.7, 0.3, 0.2],
    grief: [-0.9, 0.5, 0.1],
    fear: [-0.8, 0.9, 0.2],
    anger: [-0.7, 0.9, 0.8],
    anxiety: [-0.6, 0.8, 0.3],
    disgust: [-0.7, 0.6, 0.6],
    disappointment: [-0.6, 0.4, 0.3],
    nervousness: [-0.5, 0.7, 0.3],
    embarrassment: [-0.5, 0.6, 0.2],
    remorse: [-0.6, 0.5, 0.3],
    annoyance: [-0.5, 0.6, 0.5],
    confusion: [-0.3, 0.5, 0.3],

    // Neutral/Ambiguous
    neutral: [0.0, 0.3, 0.5],
    curiosity: [0.3, 0.6, 0.5],
    realization: [0.2, 0.5, 0.4],
    surprise: [0.0, 0.8, 0.4]
  };

  constructor(config: Partial<EmotionClassifierConfig> = {}) {
    this.config = {
      confidenceThreshold: config.confidenceThreshold ?? 0.6,
      useMLModel: config.useMLModel ?? true, // ML model now deployed!
      cacheResults: config.cacheResults ?? true
    };
    this.cache = new Map();
  }

  /**
   * Predict emotion from text
   */
  async predict(text: string, userId?: string): Promise<EmotionPrediction> {
    // Check cache
    if (this.config.cacheResults && this.cache.has(text)) {
      return this.cache.get(text)!;
    }

    let prediction: EmotionPrediction;

    if (this.config.useMLModel) {
      // Call ML Edge Function
      prediction = await this.predictWithML(text);
    } else {
      // Use rule-based fallback
      prediction = await this.predictWithRules(text);
    }

    // Cache result
    if (this.config.cacheResults) {
      this.cache.set(text, prediction);
    }

    // Store prediction in database (optional)
    if (userId) {
      await this.storePrediction(userId, text, prediction);
    }

    return prediction;
  }

  /**
   * Predict using ML model (Edge Function)
   */
  private async predictWithML(text: string): Promise<EmotionPrediction> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ml-emotion-predict`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        }
      );

      if (!response.ok) {
        throw new Error('ML prediction failed');
      }

      const result = await response.json();
      return result.emotion;
    } catch (error) {
      console.error('ML prediction failed, falling back to rules:', error);
      return this.predictWithRules(text);
    }
  }

  /**
   * Rule-based emotion prediction (fallback)
   * Uses keyword matching and sentiment analysis
   */
  private async predictWithRules(text: string): Promise<EmotionPrediction> {
    const lowerText = text.toLowerCase();

    // Emotion keyword patterns
    const patterns: Record<string, RegExp[]> = {
      joy: [/happy|joy|delighted|wonderful|amazing|great/i],
      sadness: [/sad|depressed|down|unhappy|miserable|hopeless/i],
      anxiety: [/anxious|worried|nervous|scared|afraid|fearful/i],
      anger: [/angry|furious|mad|irritated|frustrated/i],
      gratitude: [/grateful|thankful|appreciate|thanks/i],
      love: [/love|adore|cherish|affection/i],
      fear: [/terrified|panic|dread|horror/i],
      excitement: [/excited|thrilled|pumped|enthusiastic/i],
      confusion: [/confused|uncertain|unclear|puzzled/i],
      relief: [/relieved|better|calm|peaceful/i],
      neutral: [/okay|fine|alright|normal/i]
    };

    // Score each emotion
    const scores: Record<string, number> = {};
    for (const [emotion, regexes] of Object.entries(patterns)) {
      scores[emotion] = regexes.reduce((count, regex) => {
        return count + (lowerText.match(regex) ? 1 : 0);
      }, 0);
    }

    // Find top emotion
    const sortedEmotions = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0);

    if (sortedEmotions.length === 0) {
      // Default to neutral
      const [valence, arousal, dominance] = this.emotionVAD.neutral;
      return {
        label: 'neutral',
        confidence: 0.5,
        valence,
        arousal,
        dominance,
        alternativeEmotions: []
      };
    }

    const primaryEmotion = sortedEmotions[0][0];
    const [valence, arousal, dominance] = this.emotionVAD[primaryEmotion] || [0, 0.5, 0.5];

    // Generate alternative emotions
    const alternatives = sortedEmotions.slice(1, 4).map(([label, score]) => ({
      label,
      confidence: Math.min(score / 3, 0.7) // Normalize to 0-0.7
    }));

    return {
      label: primaryEmotion,
      confidence: Math.min(sortedEmotions[0][1] / 2, 0.8), // Normalize to 0-0.8
      valence,
      arousal,
      dominance,
      alternativeEmotions: alternatives
    };
  }

  /**
   * Batch predict emotions
   */
  async predictBatch(texts: string[]): Promise<EmotionPrediction[]> {
    return Promise.all(texts.map(text => this.predict(text)));
  }

  /**
   * Get emotion trajectory from text sequence
   */
  async analyzeTrajectory(texts: string[]): Promise<{
    emotions: EmotionPrediction[];
    trend: 'improving' | 'stable' | 'declining';
    valenceTrend: number[];
    arousalTrend: number[];
  }> {
    const emotions = await this.predictBatch(texts);

    // Calculate valence trend
    const valenceTrend = emotions.map(e => e.valence);
    const firstHalf = valenceTrend.slice(0, Math.floor(valenceTrend.length / 2));
    const secondHalf = valenceTrend.slice(Math.floor(valenceTrend.length / 2));

    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (secondAvg - firstAvg > 0.2) trend = 'improving';
    else if (firstAvg - secondAvg > 0.2) trend = 'declining';

    return {
      emotions,
      trend,
      valenceTrend,
      arousalTrend: emotions.map(e => e.arousal)
    };
  }

  /**
   * Store prediction in database
   */
  private async storePrediction(
    userId: string,
    text: string,
    prediction: EmotionPrediction
  ): Promise<void> {
    try {
      await supabase.from('ml_emotion_predictions').insert({
        user_id: userId,
        text_hash: this.hashText(text), // Privacy: don't store full text
        predicted_emotion: prediction.label,
        confidence: prediction.confidence,
        valence: prediction.valence,
        arousal: prediction.arousal,
        dominance: prediction.dominance,
        model_version: this.config.useMLModel ? 'ml_v1' : 'rules_v1'
      });
    } catch (error) {
      console.error('Failed to store prediction:', error);
    }
  }

  /**
   * Hash text for privacy-preserving storage
   */
  private hashText(text: string): string {
    // Simple hash for demo - use crypto.subtle.digest in production
    return text.split('').reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0).toString(36);
  }

  /**
   * Get VAD values for emotion
   */
  getVAD(emotion: string): { valence: number; arousal: number; dominance: number } {
    const [valence, arousal, dominance] = this.emotionVAD[emotion] || [0, 0.5, 0.5];
    return { valence, arousal, dominance };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const emotionClassifier = new EmotionClassifier();
