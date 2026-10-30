import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const createSupabaseClient = (
  supabaseUrl?: string,
  supabaseAnonKey?: string
): SupabaseClient => {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Se estivermos no servidor (SSR/Build) e as variáveis faltarem,
    // lançamos um erro apenas se o cliente for realmente utilizado.
    if (typeof window === 'undefined') {
      console.warn('Supabase: Variáveis de ambiente ausentes no servidor. O cliente será inicializado como um Proxy.');
      return new Proxy({} as any, {
        get: (_, prop) => {
          if (prop === 'then') return undefined;
          throw new Error(
            `Supabase: Tentativa de usar 'supabase.${String(prop)}' no servidor sem variáveis de ambiente.\n` +
            `Garanta que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas.`
          );
        }
      });
    }

    throw new Error(
      `Supabase URL and Anon Key are required. \n` +
      `URL present: ${!!url}, Key present: ${!!key}`
    );
  }
  return createClient(url, key);
};

export const supabase = createSupabaseClient();

// Trata falhas de refresh de token para evitar erros repetidos no console
try {
  // onAuthStateChange retorna um objeto com subscription em v2
  // Eventos importantes: 'SIGNED_OUT', 'TOKEN_REFRESHED', 'TOKEN_REFRESH_FAILED'
  supabase.auth.onAuthStateChange((event, _session) => {
    if (String(event) === 'TOKEN_REFRESH_FAILED') {
      // Força sign out para limpar tokens inválidos
      console.warn('Supabase: token refresh falhou — realizando signOut automatizado.');
      supabase.auth.signOut().catch(() => {});
      try {
        // Tenta limpar localStorage usado pelo auth (nome pode variar entre versões)
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('@supabase/auth.token');
      } catch (e) {
        // noop
      }
    }
  });
} catch (e) {
  // ambiente sem localStorage / listeners (ex.: SSR) — apenas ignore
}
