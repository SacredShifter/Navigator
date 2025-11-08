/**
 * Generate Embeddings for Monad Archetypes
 *
 * This script fetches all monad_core entries and generates embeddings
 * using the EmbeddingService (OpenRouter API).
 *
 * Run with: npx tsx scripts/generate-monad-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const openRouterKey = process.env.VITE_OPENROUTER_API_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in environment');
  process.exit(1);
}

if (!openRouterKey || openRouterKey === 'your-openrouter-key-here') {
  console.error('Error: OpenRouter API key not configured');
  console.error('Please set VITE_OPENROUTER_API_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface MonadCore {
  id: string;
  name: string;
  description: string;
  archetypal_essence: string;
  pattern_embedding: number[] | null;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openRouterKey}`,
      'HTTP-Referer': 'https://sacredshifter.com',
      'X-Title': 'Sacred Shifter ROE - Monad Embedding Generation'
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const fullEmbedding = data.data[0].embedding;

  // Reduce from 1536D to 768D
  return fullEmbedding.slice(0, 768);
}

async function main() {
  console.log('🌟 Sacred Shifter ROE - Monad Embedding Generation\n');

  // Fetch all monad core entries
  const { data: monads, error: fetchError } = await supabase
    .from('monad_core')
    .select('*')
    .order('name');

  if (fetchError) {
    console.error('Error fetching monads:', fetchError);
    process.exit(1);
  }

  if (!monads || monads.length === 0) {
    console.error('No monad_core entries found in database');
    process.exit(1);
  }

  console.log(`Found ${monads.length} monad archetypes to process:\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const monad of monads as MonadCore[]) {
    try {
      // Check if embedding already exists
      if (monad.pattern_embedding && Array.isArray(monad.pattern_embedding)) {
        console.log(`⏭️  ${monad.name} - embedding already exists (${monad.pattern_embedding.length}D), skipping`);
        successCount++;
        continue;
      }

      console.log(`🔮 Generating embedding for: ${monad.name}`);

      // Create rich text for embedding
      const embeddingText = [
        `Archetypal Pattern: ${monad.name}`,
        `Essence: ${monad.archetypal_essence}`,
        `Description: ${monad.description}`,
        `Metaphysical Properties: ${JSON.stringify(monad.metaphysical_properties || {})}`
      ].join(' | ');

      console.log(`   Text: "${embeddingText.substring(0, 100)}..."`);

      // Generate embedding
      const embedding = await generateEmbedding(embeddingText);

      console.log(`   Generated ${embedding.length}D embedding`);

      // Update database
      const { error: updateError } = await supabase
        .from('monad_core')
        .update({ pattern_embedding: embedding })
        .eq('id', monad.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`   ✅ Stored in database\n`);
      successCount++;

      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`   ❌ Error processing ${monad.name}:`, error);
      console.error();
      errorCount++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Summary:');
  console.log(`  ✅ Success: ${successCount}/${monads.length}`);
  console.log(`  ❌ Errors:  ${errorCount}/${monads.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (successCount === monads.length) {
    console.log('🎉 All monad embeddings generated successfully!');
    console.log('   Vector similarity searches are now operational.\n');
  } else if (errorCount > 0) {
    console.log('⚠️  Some embeddings failed. Please review errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
