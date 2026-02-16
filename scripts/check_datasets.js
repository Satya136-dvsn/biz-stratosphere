// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.


import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const envPath = path.join(rootDir, '.env');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const matchUrl = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    const matchKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
    // Handle quotes strictly
    if (matchUrl) supabaseUrl = matchUrl[1].trim().replace(/^['"]|['"]$/g, '');
    if (matchKey) supabaseKey = matchKey[1].trim().replace(/^['"]|['"]$/g, '');
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase credentials not found in .env');
    // console.log('Parsed:', { supabaseUrl, supabaseKey }); // Debug
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Checking Datasets table...');
    const { data: datasets, error: dsError } = await supabase.from('datasets').select('*');
    if (dsError) {
        console.error('Error fetching datasets:', dsError);
    } else {
        console.log(`Found ${datasets.length} datasets in table.`);
        datasets.forEach(d => console.log(`- [${d.id}] ${d.name}`));
    }

    console.log('\nChecking Embeddings metadata...');
    // We can't do distinct on metadata field easily via API, so we fetch head 100 and check
    const { data: embeddings, error: embError } = await supabase.from('embeddings').select('metadata').limit(100);

    if (embError) {
        console.error('Error fetching embeddings:', embError);
    } else {
        console.log(`Fetched ${embeddings.length} sample embeddings.`);
        const datasetIds = new Set();
        embeddings.forEach(e => {
            if (e.metadata && e.metadata.dataset_id) {
                datasetIds.add(e.metadata.dataset_id);
            }
        });

        console.log(`Found ${datasetIds.size} distinct dataset IDs in sample metadata:`);
        datasetIds.forEach(id => console.log(`- ${id}`));

        // Check intersection
        if (datasets) {
            datasetIds.forEach(id => {
                const exists = datasets.find(d => d.id === id);
                if (!exists) {
                    console.log(`WARNING: Dataset ID ${id} exists in embeddings but NOT in datasets table (Orphaned).`);
                }
            });
        }
    }
}

checkData();
