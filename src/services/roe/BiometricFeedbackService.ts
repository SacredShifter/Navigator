/**
 * Biometric Feedback Service
 *
 * Provides hooks for integrating physiological signals into VFS calculation.
 * Supports multiple signal types with normalization and fusion strategies.
 *
 * Signal Types:
 * - Heart Rate Variability (HRV)
 * - Breath rate and coherence
 * - Galvanic skin response (GSR)
 * - Device motion/orientation
 * - Interaction patterns (implicit feedback)
 */

export interface BiometricSignal {
  type: 'hrv' | 'breath' | 'gsr' | 'motion' | 'interaction';
  value: number;
  timestamp: number;
  confidence: number;
}

export interface InteractionMetrics {
  dwellTime: number;
  scrollDepth: number;
  pauseCount: number;
  revisitCount: number;
  completionRate: number;
  focusTime: number;
}

export interface MultimodalVFS {
  selfReport: number;
  behavioral: number;
  biometric: number;
  composite: number;
  confidence: number;
}

interface FusionWeights {
  selfReport: number;
  behavioral: number;
  biometric: number;
}

export class BiometricFeedbackService {
  private readonly defaultWeights: FusionWeights = {
    selfReport: 0.5,
    behavioral: 0.3,
    biometric: 0.2
  };

  /**
   * Calculate multimodal VFS from all available signals
   */
  calculateMultimodalVFS(
    selfReport: number,
    interactionMetrics: InteractionMetrics,
    biometricSignals: BiometricSignal[] = [],
    customWeights?: Partial<FusionWeights>
  ): MultimodalVFS {
    const weights = { ...this.defaultWeights, ...customWeights };

    const behavioral = this.calculateBehavioralScore(interactionMetrics);
    const biometric = biometricSignals.length > 0
      ? this.calculateBiometricScore(biometricSignals)
      : 0;

    const hasBiometric = biometricSignals.length > 0;
    const actualWeights = hasBiometric
      ? weights
      : {
          selfReport: weights.selfReport / (weights.selfReport + weights.behavioral),
          behavioral: weights.behavioral / (weights.selfReport + weights.behavioral),
          biometric: 0
        };

    const composite =
      actualWeights.selfReport * selfReport +
      actualWeights.behavioral * behavioral +
      actualWeights.biometric * biometric;

    const confidence = this.calculateConfidence(
      selfReport,
      behavioral,
      biometric,
      biometricSignals.length
    );

    return {
      selfReport,
      behavioral,
      biometric,
      composite,
      confidence
    };
  }

  /**
   * Calculate behavioral score from interaction patterns
   */
  private calculateBehavioralScore(metrics: InteractionMetrics): number {
    const dwellScore = this.normalizeDwellTime(metrics.dwellTime);
    const scrollScore = Math.min(metrics.scrollDepth / 100, 1);
    const engagementScore = this.calculateEngagementScore(
      metrics.pauseCount,
      metrics.focusTime,
      metrics.dwellTime
    );
    const revisitScore = Math.min(metrics.revisitCount / 3, 1);

    return (
      0.3 * metrics.completionRate +
      0.25 * dwellScore +
      0.2 * engagementScore +
      0.15 * scrollScore +
      0.1 * revisitScore
    );
  }

  /**
   * Calculate biometric score from physiological signals
   */
  private calculateBiometricScore(signals: BiometricSignal[]): number {
    if (signals.length === 0) return 0;

    const weightedScores: number[] = [];
    const weights: number[] = [];

    signals.forEach(signal => {
      const normalizedValue = this.normalizeSignal(signal);
      weightedScores.push(normalizedValue * signal.confidence);
      weights.push(signal.confidence);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = weightedScores.reduce((sum, score) => sum + score, 0);
    return weightedSum / totalWeight;
  }

  /**
   * Normalize biometric signal to 0-1 scale
   */
  private normalizeSignal(signal: BiometricSignal): number {
    switch (signal.type) {
      case 'hrv':
        return this.normalizeHRV(signal.value);
      case 'breath':
        return this.normalizeBreath(signal.value);
      case 'gsr':
        return this.normalizeGSR(signal.value);
      case 'motion':
        return this.normalizeMotion(signal.value);
      case 'interaction':
        return Math.max(0, Math.min(1, signal.value));
      default:
        return signal.value;
    }
  }

  /**
   * Normalize HRV (RMSSD in milliseconds)
   */
  private normalizeHRV(rmssd: number): number {
    const minHRV = 20;
    const maxHRV = 100;
    const normalized = (rmssd - minHRV) / (maxHRV - minHRV);
    return Math.max(0, Math.min(1, normalized));
  }

  /**
   * Normalize breath rate (breaths per minute)
   */
  private normalizeBreath(bpm: number): number {
    const optimalBPM = 6;
    const deviation = Math.abs(bpm - optimalBPM);
    const maxDeviation = 10;
    return Math.max(0, 1 - deviation / maxDeviation);
  }

  /**
   * Normalize GSR (microsiemens)
   */
  private normalizeGSR(microsiemens: number): number {
    const minGSR = 1;
    const maxGSR = 20;
    const inverted = 1 - (microsiemens - minGSR) / (maxGSR - minGSR);
    return Math.max(0, Math.min(1, inverted));
  }

  /**
   * Normalize motion/stability
   */
  private normalizeMotion(acceleration: number): number {
    const maxAccel = 2.0;
    const stability = 1 - Math.min(acceleration / maxAccel, 1);
    return stability;
  }

  /**
   * Normalize dwell time to engagement score
   */
  private normalizeDwellTime(seconds: number): number {
    const optimalDwell = 300;
    const minDwell = 60;
    const maxDwell = 600;

    if (seconds < minDwell) return seconds / minDwell;
    if (seconds > maxDwell) return 1 - (seconds - maxDwell) / maxDwell;

    const distanceFromOptimal = Math.abs(seconds - optimalDwell);
    return 1 - distanceFromOptimal / optimalDwell;
  }

  /**
   * Calculate engagement from pause patterns and focus
   */
  private calculateEngagementScore(
    pauseCount: number,
    focusTime: number,
    totalTime: number
  ): number {
    if (totalTime === 0) return 0;

    const focusRatio = focusTime / totalTime;
    const pauseScore = Math.min(pauseCount / 5, 1);

    return 0.7 * focusRatio + 0.3 * pauseScore;
  }

  /**
   * Calculate overall confidence in VFS estimate
   */
  private calculateConfidence(
    selfReport: number,
    behavioral: number,
    biometric: number,
    signalCount: number
  ): number {
    const hasSelfReport = selfReport > 0;
    const hasBehavioral = behavioral > 0;
    const hasBiometric = biometric > 0;

    let confidence = 0;
    if (hasSelfReport) confidence += 0.5;
    if (hasBehavioral) confidence += 0.3;
    if (hasBiometric) confidence += 0.2;

    const signalBonus = Math.min(signalCount / 5, 1) * 0.1;
    confidence += signalBonus;

    const agreement = this.calculateAgreement([
      hasSelfReport ? selfReport : null,
      hasBehavioral ? behavioral : null,
      hasBiometric ? biometric : null
    ].filter((v): v is number => v !== null));

    confidence *= agreement;

    return Math.min(confidence, 1);
  }

  /**
   * Calculate agreement between different signal modalities
   */
  private calculateAgreement(values: number[]): number {
    if (values.length < 2) return 1;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const agreementScore = 1 - Math.min(stdDev / 0.5, 1);
    return agreementScore;
  }

  /**
   * Detect anomalies in biometric signals
   */
  detectAnomaly(signal: BiometricSignal, history: BiometricSignal[]): boolean {
    if (history.length < 5) return false;

    const recentHistory = history.slice(-10).filter(s => s.type === signal.type);
    if (recentHistory.length < 3) return false;

    const mean = recentHistory.reduce((sum, s) => sum + s.value, 0) / recentHistory.length;
    const variance = recentHistory.reduce(
      (sum, s) => sum + Math.pow(s.value - mean, 2),
      0
    ) / recentHistory.length;
    const stdDev = Math.sqrt(variance);

    const zScore = Math.abs((signal.value - mean) / (stdDev || 1));

    return zScore > 3;
  }

  /**
   * Generate adaptive learning rate based on signal confidence
   */
  calculateAdaptiveLearningRate(
    baseRate: number,
    confidence: number,
    recentVFSHistory: number[]
  ): number {
    const confidenceModifier = 0.5 + confidence * 0.5;

    let stabilityModifier = 1;
    if (recentVFSHistory.length >= 3) {
      const variance = this.calculateVariance(recentVFSHistory);
      stabilityModifier = variance < 0.1 ? 1.2 : variance > 0.3 ? 0.8 : 1;
    }

    const adaptiveRate = baseRate * confidenceModifier * stabilityModifier;

    return Math.max(0.01, Math.min(0.2, adaptiveRate));
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

export const biometricFeedbackService = new BiometricFeedbackService();
