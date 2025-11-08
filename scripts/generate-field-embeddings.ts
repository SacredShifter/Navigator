/**
 * Generate Pattern Signature Embeddings for Probability Fields
 *
 * This script fetches all probability_fields and generates pattern_signature
 * embeddings based on the profile's essence labels and outcome data.
 *
 * Run with: npx tsx scripts/generate-field-embeddings.ts
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

interface ProbabilityField {
  id: string;
  name: string;
  outcome_data: {
    profile_name?: string;
    profile_description?: string;
    essence_labels?: string[];
    track_id?: string;
  };
  pattern_signature: number[] | null;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openRouterKey}`,
      'HTTP-Referer': 'https://sacredshifter.com',
      'X-Title': 'Sacred Shifter ROE - Field Embedding Generation'
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
  console.log('🌟 Sacred Shifter ROE - Probability Field Embedding Generation\n');

  // Fetch all probability fields
  const { data: fields, error: fetchError } = await supabase
    .from('probability_fields')
    .select('*')
    .order('name');

  if (fetchError) {
    console.error('Error fetching fields:', fetchError);
    process.exit(1);
  }

  if (!fields || fields.length === 0) {
    console.error('No probability_fields entries found in database');
    console.error('Run populate_probability_fields_from_navigator_paths migration first');
    process.exit(1);
  }

  console.log(`Found ${fields.length} probability fields to process:\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const field of fields as ProbabilityField[]) {
    try {
      // Check if embedding already exists
      if (field.pattern_signature && Array.isArray(field.pattern_signature)) {
        console.log(`⏭️  ${field.name} - signature exists (${field.pattern_signature.length}D), skipping`);
        skippedCount++;
        continue;
      }

      console.log(`🔮 Generating pattern signature for: ${field.name}`);

      // Extract meaningful text from outcome_data
      const outcomeData = field.outcome_data;
      const essenceText = (outcomeData.essence_labels || []).join(', ');

      // Create rich text for embedding
      const embeddingText = [
        `Profile: ${outcomeData.profile_name || 'Unknown'}`,
        `Essence: ${essenceText}`,
        `Description: ${outcomeData.profile_description || ''}`,
        `Track: ${outcomeData.track_id || ''}`,
        `Path: ${field.name}`
      ]
        .filter(s => s && !s.endsWith(': '))
        .join(' | ');

      console.log(`   Text: "${embeddingText.substring(0, 100)}..."`);

      // Generate embedding
      const embedding = await generateEmbedding(embeddingText);

      console.log(`   Generated ${embedding.length}D pattern signature`);

      // Update database
      const { error: updateError } = await supabase
        .from('probability_fields')
        .update({ pattern_signature: embedding })
        .eq('id', field.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`   ✅ Stored in database\n`);
      successCount++;

      // Rate limit: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`   ❌ Error processing ${field.name}:`, error);
      console.error();
      errorCount++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Summary:');
  console.log(`  ✅ Success:  ${successCount}/${fields.length}`);
  console.log(`  ⏭️  Skipped:  ${skippedCount}/${fields.length}`);
  console.log(`  ❌ Errors:   ${errorCount}/${fields.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (successCount + skippedCount === fields.length) {
    console.log('🎉 All probability field signatures generated!');
    console.log('   Reality Selection Matrix is now operational.\n');
  } else if (errorCount > 0) {
    console.log('⚠️  Some embeddings failed. Please review errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
