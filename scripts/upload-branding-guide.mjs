#!/usr/bin/env node

/**
 * Upload Sacred Shifter branding guide to Supabase Storage
 *
 * Usage:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/upload-branding-guide.mjs
 *
 * Uploads docs/branding/sacred-shifter-aesthetics.v1.json to:
 *   brand-guides/branding/sacred-shifter-aesthetics.v1.json
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL (or VITE_SUPABASE_URL)');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function uploadBrandingGuide() {
  console.log('📦 Sacred Shifter Branding Guide Uploader\n');

  const guidePath = join(__dirname, '../docs/branding/sacred-shifter-aesthetics.v1.json');
  const storagePath = 'branding/sacred-shifter-aesthetics.v1.json';

  console.log(`📄 Reading: ${guidePath}`);

  let guideContent;
  try {
    guideContent = readFileSync(guidePath, 'utf8');
    const parsed = JSON.parse(guideContent);
    console.log(`✅ Valid JSON (${parsed.name} v${parsed.version})\n`);
  } catch (error) {
    console.error(`❌ Error reading or parsing guide: ${error.message}`);
    process.exit(1);
  }

  console.log(`☁️  Uploading to: brand-guides/${storagePath}`);

  const { data, error } = await supabase.storage
    .from('brand-guides')
    .upload(storagePath, guideContent, {
      contentType: 'application/json',
      upsert: true
    });

  if (error) {
    console.error(`❌ Upload failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`✅ Upload successful!\n`);

  const { data: publicUrlData } = supabase.storage
    .from('brand-guides')
    .getPublicUrl(storagePath);

  console.log(`🌐 Public URL:`);
  console.log(`   ${publicUrlData.publicUrl}\n`);

  console.log(`📋 Usage in code:`);
  console.log(`   import { getBrandingGuide } from './services/aura-bridges/branding';`);
  console.log(`   const guide = await getBrandingGuide();\n`);

  console.log(`🎨 Colors available:`);
  const parsed = JSON.parse(guideContent);
  Object.entries(parsed.colors).forEach(([key, color]) => {
    console.log(`   ${key.padEnd(12)} → ${color.hex} (${color.name})`);
  });

  console.log(`\n✨ Done!`);
}

uploadBrandingGuide().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
