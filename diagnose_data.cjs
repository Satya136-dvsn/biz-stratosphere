
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://kfkllxfwyvocmnkowbyw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtma2xseGZ3eXZvY21ua293Ynl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTg4NTUsImV4cCI6MjA3MTk3NDg1NX0.5X7Ak-3XfiNTzI2oQ58O3vJnwabN6KVyi3aLcBoDqVg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
    console.log('--- DIAGNOSTIC SCRIPT START ---');

    // 1. Check Datasets
    const { data: datasets, error: dsError } = await supabase
        .from('datasets')
        .select('id, name, created_at, status, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

    if (dsError) {
        console.error('Error fetching datasets:', dsError);
        return;
    }

    console.log(`Found ${datasets.length} recent datasets:`);

    for (const ds of datasets) {
        // 2. Count Data Points for each dataset
        const { count, error: dpError } = await supabase
            .from('data_points')
            .select('*', { count: 'exact', head: true })
            .eq('dataset_id', ds.id);

        if (dpError) {
            console.error(`Error counting points for ds ${ds.id}:`, dpError.message);
        } else {
            console.log(`- [${ds.created_at}] "${ds.name}" (Status: ${ds.status}) -> Points: ${count}`);
        }
    }

    // 3. Inspect Embeddings Table Schema
    const { data: embeddings, error: embError } = await supabase
        .from('embeddings')
        .select('*')
        .limit(1);

    if (embError) {
        console.error('Error fetching embeddings:', embError);
    } else if (embeddings.length > 0) {
        console.log('Embeddings table columns:', Object.keys(embeddings[0]).join(', '));
    } else {
        console.log('Embeddings table is empty, cannot inspect columns directly.');
    }

    console.log('--- DIAGNOSTIC SCRIPT END ---');
}

diagnose();
