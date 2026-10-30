import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: Variáveis de ambiente SUPABASE não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeColumns() {
  console.log('🔍 Analisando estrutura das colunas do Supabase...\n');

  const tablesToCheck = ['profiles', 'clients', 'invoices', 'workers', 'services'];

  for (const tableName of tablesToCheck) {
    try {
      console.log(`\n📋 Tabela: ${tableName}`);
      console.log('─'.repeat(60));

      // Estratégia: fazer um select com todas as colunas e limit 0
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)
        .throwOnError();

      // Se chegou aqui sem erro, a tabela existe
      // Agora vamos tentar descobrir as colunas tentando selecionar campos específicos
      console.log(`✓ Tabela existe!`);

      // Tenta select vazio para descobrir schema
      const res = await fetch(`${supabaseUrl}/rest/v1/${tableName}?limit=0&select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      const contentRange = res.headers.get('content-range');
      console.log(`  Total de registros: ${contentRange || 'desconhecido'}`);

      // Tenta fazer um select específico para descobrir tipos
      const testSelect = await supabase.from(tableName).select('*').limit(1);
      
      if (testSelect.data && testSelect.data.length > 0) {
        const sample = testSelect.data[0];
        const columns = Object.entries(sample).map(([k, v]) => ({
          name: k,
          type: typeof v,
          sample: String(v).substring(0, 30)
        }));
        
        console.log(`\n  Colunas (${columns.length}):`);
        columns.forEach(col => {
          console.log(`    • ${col.name}: ${col.type}`);
        });
      } else if (testSelect.data) {
        // Tabela vazia, tenta descobrir schema de outra forma
        console.log('  Tabela vazia - não foi possível descobrir colunas');
      }

    } catch (error: any) {
      if (error.message?.includes('Could not find the table')) {
        console.log(`❌ Tabela não encontrada`);
      } else {
        console.log(`⚠️  Erro: ${error.message}`);
      }
    }
  }

  // Agora vamos analisar o código para ver quais colunas estão sendo usadas
  console.log('\n\n📊 Análise do código fonte...\n');
  console.log('Locais onde as tabelas são consultadas:');
}

analyzeColumns().catch(console.error);
