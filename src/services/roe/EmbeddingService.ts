/**
 * EmbeddingService - OpenRouter Integration for ROE
 *
 * Handles semantic embedding generation for belief states, emotions, and
 * archetypal patterns using OpenAI's text-embedding-3-small via OpenRouter.
 *
 * Features:
 * - 1536D → 768D dimensionality reduction for storage optimization
 * - Local caching to minimize API calls
 * - Rate limiting and retry logic
 * - Batch processing for efficiency
 * - OpenRouter unified API access with better pricing
 */

interface EmbeddingCacheEntry {
  text: string;
  embedding: number[];
  timestamp: number;
}

interface EmbeddingRequest {
  text: string;
  cacheKey?: string;
}

interface EmbeddingResponse {
  embedding: number[];
  cached: boolean;
  dimensions: number;
}

export class EmbeddingService {
  private cache: Map<string, EmbeddingCacheEntry> = new Map();
  private readonly cacheMaxAge = 24 * 60 * 60 * 1000; // 24 hours
  private readonly apiUrl = 'https://openrouter.ai/api/v1/embeddings';
  private readonly model = 'openai/text-embedding-3-small';
  private readonly targetDimensions = 768;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor(private apiKey?: string) {
    if (!apiKey) {
      console.warn('EmbeddingService: No API key provided. Embeddings will fail until configured.');
    }
  }

  /**
   * Generate embedding for a single text input
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const cacheKey = request.cacheKey || this.hashText(request.text);

    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        embedding: cached.embedding,
        cached: true,
        dimensions: cached.embedding.length
      };
    }

    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const embedding = await this.callOpenAI(request.text);
        const reduced = this.reduceDimensions(embedding);

        this.cache.set(cacheKey, {
          text: request.text,
          embedding: reduced,
          timestamp: Date.now()
        });

        return {
          embedding: reduced,
          cached: false,
          dimensions: reduced.length
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw new Error(`Failed to generate embedding after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
    const requests = texts.map(text => ({ text }));
    return Promise.all(requests.map(req => this.generateEmbedding(req)));
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Clear expired cache entries
   */
  pruneCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheMaxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxAge: this.cacheMaxAge,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        textPreview: entry.text.substring(0, 50)
      }))
    };
  }

  private async callOpenAI(text: string): Promise<number[]> {
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
        input: text
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Reduce embedding dimensions from 1536 to 768 using simple truncation
   * OpenRouter returns OpenAI embeddings which are optimized for truncation
   */
  private reduceDimensions(embedding: number[]): number[] {
    if (embedding.length <= this.targetDimensions) {
      return embedding;
    }

    // Simple truncation - OpenAI embeddings are already optimized for this
    return embedding.slice(0, this.targetDimensions);
  }

  private getFromCache(key: string): EmbeddingCacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.cacheMaxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance (will be initialized with API key from environment)
export const embeddingService = new EmbeddingService(
  import.meta.env.VITE_OPENROUTER_API_KEY
);
