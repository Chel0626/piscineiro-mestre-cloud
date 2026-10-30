require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking profiles table...');
  const { data, error } = await supabase
    .from('profiles')
    .select('count', { count: 'exact', head: true });

  if (error) {
    console.error('Error accessing table:', error);
  } else {
    console.log('Table exists. Count:', data);
  }

  console.log('Trying to insert with invalid user id...');
  const { error: insertError } = await supabase
    .from('profiles')
    .upsert({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Test'
    });
  
  if (insertError) {
    console.log('Insert error:', insertError);
    console.log('Insert error stringified:', JSON.stringify(insertError));
  }
}

check();
