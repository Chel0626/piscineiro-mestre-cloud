import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('--- Inspecionando tabela PROFILES ---');
  const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1);
  if (pError) console.error('Erro profiles:', pError);
  else console.log('Colunas de profiles:', Object.keys(pData[0] || {}));

  console.log('\n--- Inspecionando tabela CLIENTS ---');
  const { data: cData, error: cError } = await supabase.from('clients').select('*').limit(1);
  if (cError) console.error('Erro clients:', cError);
  else console.log('Colunas de clients:', Object.keys(cData[0] || {}));
}

inspect();
