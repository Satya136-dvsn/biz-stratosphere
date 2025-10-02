import { createClient } from '@supabase/supabase-js';

// Load environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
      console.error('Error querying profiles:', error.message);
    } else {
      console.log('Profiles table data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}
