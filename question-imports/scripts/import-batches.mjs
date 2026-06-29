import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no dotenv dep required)
{
  const envPath = resolve(__dirname, '../../.env.local');
  try {
    const text = readFileSync(envPath, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) process.env[m[1]] ??= m[2].trim();
    }
  } catch { /* ignore if missing */ }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
}

function statementHash(stmt) {
  return createHash('sha256').update(stmt.trim().toLowerCase()).digest('hex');
}

const SUBJECT_IDS = {
  'SAT Math':             '10000000-0000-0000-0000-000000000001',
  'SAT Reading & Writing':'10000000-0000-0000-0000-000000000015',
};

async function main() {
  const batchDir = resolve(__dirname, '..');
  const files = ['batch_sat1.json', 'batch_sat2.json', 'batch_sat3.json']
    .map(f => resolve(batchDir, f));

  const all = files.flatMap(f => {
    const qs = readJson(f);
    console.log(`  ${f.split(/[\\/]/).pop()}: ${qs.length} questions`);
    return qs;
  });
  console.log(`Total loaded: ${all.length}\n`);

  // Fetch topic map from DB
  const { data: topics, error: topicsErr } = await supabase
    .from('topics').select('id,name,subject_id');
  if (topicsErr) { console.error('Failed to fetch topics:', topicsErr.message); process.exit(1); }

  const topicMap = {};
  for (const t of topics) topicMap[`${t.subject_id}::${t.name}`] = t.id;

  // Fetch existing sat-import question statements for dedup
  const { data: existing, error: existErr } = await supabase
    .from('questions')
    .select('statement')
    .contains('tags', ['sat-import']);
  if (existErr) { console.error('Failed to fetch existing:', existErr.message); process.exit(1); }

  const seen = new Set((existing || []).map(q => statementHash(q.statement)));
  console.log(`Existing sat-import questions: ${seen.size}`);

  const toInsert = [];
  let skippedDedup = 0;
  let skippedMapping = 0;

  for (const q of all) {
    const hash = statementHash(q.statement);
    if (seen.has(hash)) { skippedDedup++; continue; }
    seen.add(hash);

    let subjectId = SUBJECT_IDS[q.subject];
    if (!subjectId) {
      console.warn(`Unknown subject: "${q.subject}"`);
      skippedMapping++;
      continue;
    }

    let topicId = topicMap[`${subjectId}::${q.topic}`];
    if (!topicId) {
      // Try the other subject (mismatched label in source data)
      const altSubjectId = Object.values(SUBJECT_IDS).find(
        id => id !== subjectId && topicMap[`${id}::${q.topic}`]
      );
      if (altSubjectId) {
        topicId = topicMap[`${altSubjectId}::${q.topic}`];
        subjectId = altSubjectId;
      } else {
        console.warn(`Unknown topic: "${q.topic}" under "${q.subject}"`);
        skippedMapping++;
        continue;
      }
    }

    const hasMath = q.subject === 'SAT Math'
      || /[=+\-×÷√∫∑∏^²³]/.test(q.statement);

    toInsert.push({
      owner_id: null,
      is_public: true,
      statement: q.statement,
      statement_format: 'plain',
      type: q.type,
      options: q.options ?? null,
      answer: q.answer ?? null,
      subject_id: subjectId,
      topic_id: topicId,
      difficulty: q.difficulty,
      has_math: hasMath,
      tags: ['sat-import'],
    });
  }

  console.log(`\nTo insert: ${toInsert.length}`);
  console.log(`Skipped (duplicate): ${skippedDedup}`);
  console.log(`Skipped (unknown subject/topic): ${skippedMapping}\n`);

  if (toInsert.length === 0) {
    console.log('Nothing new to insert.');
    return;
  }

  const CHUNK = 100;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const { error } = await supabase.from('questions').insert(chunk);
    if (error) {
      console.error(`Insert error at offset ${i}:`, error.message);
      process.exit(1);
    }
    inserted += chunk.length;
    process.stdout.write(`\rInserted ${inserted}/${toInsert.length}`);
  }

  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
