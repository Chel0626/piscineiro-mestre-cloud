import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Variáveis de ambiente SUPABASE não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Analisando schema do Supabase...\n');

  // Tabelas importantes para o sistema
  const tablesToCheck = ['profiles', 'clients', 'workers', 'services', 'tenants', 'auth.users'];

  for (const tableName of tablesToCheck) {
    try {
      console.log(`\n📋 Tabela: ${tableName}`);
      console.log('─'.repeat(60));

      // Tenta fazer um select vazio para descobrir as colunas
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Erro ao acessar: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`✓ Colunas encontradas (${columns.length}):`);
        columns.forEach((col) => console.log(`  - ${col}`));
      } else {
        console.log(`⚠️  Tabela vazia ou sem permissão de leitura`);
      }
    } catch (error) {
      console.log(`⚠️  Tabela não encontrada ou erro de acesso`);
    }
  }

  // Tenta fazer um SELECT direto nas system views do PostgreSQL
  console.log('\n\n📊 Análise completa via information_schema...\n');
  
  try {
    const { data: tableInfo } = await supabase.rpc('get_table_schema' as any, {
      schema_name: 'public'
    }).catch(() => ({ data: null }));

    if (tableInfo) {
      console.log('Tabelas encontradas:', tableInfo);
    } else {
      console.log('⚠️  RPC get_table_schema não disponível');
    }
  } catch (error) {
    console.log('⚠️  Não foi possível usar RPC');
  }

  // Tenta acessar todas as tabelas publicas
  console.log('\n\n🗂️ Tentando listar todas as tabelas públicas...\n');
  
  try {
    // Esta é uma abordagem alternativa - tenta acessar as tabelas que sabemos que existem
    const commonTables = ['profiles', 'clients', 'workers', 'services', 'invoices', 'contractor', 'tenant', 'users'];
    
    for (const table of commonTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(0);

      if (!error) {
        console.log(`✓ ${table}: ${count} registros`);
      }
    }
  } catch (error) {
    console.log('Erro ao contar tabelas');
  }
}

checkSchema().catch(console.error);
