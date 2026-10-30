'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Tenant, AppRole } from '@/types/tenant';

// Definimos o tipo do valor que nosso contexto irá fornecer
interface AuthContextType {
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  tenant: Tenant | null;
  role: AppRole | null;
}

// Criamos o contexto com um valor padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  authLoading: true,
  tenant: null,
  role: null,
});

// Criamos o Provedor do Contexto
export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);

  const fetchTenant = async (userId: string) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('tenant_members')
        .select('role, tenant_id, tenants(*)')
        .eq('user_id', userId)
        .single();

      if (memberData) {
        setRole(memberData.role as AppRole);
        setTenant(memberData.tenants as unknown as Tenant);
      } else {
        // Fallback: se não tiver tenant (ex: erro no trigger), tenta ver pelo account_type no profile
        console.log('Usuário sem tenant associado, tentando fallback do profile...');
        const { data: profileData } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', userId)
          .single();
        
        if (profileData?.account_type) {
           console.log('Fallback role encontrado:', profileData.account_type);
           setRole(profileData.account_type as AppRole);
        } else {
           setRole(null);
        }
        setTenant(null);
      }
    } catch (error) {
      console.error('Erro ao buscar tenant:', error);
    }
  };

  useEffect(() => {
    console.log('AuthContext: Iniciando listener de autenticação Supabase');
    
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchTenant(session.user.id).then(() => setAuthLoading(false));
      } else {
        setAuthLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        console.log('AuthContext: Usuário logado:', session.user.id, session.user.email);
        fetchTenant(session.user.id).then(() => setAuthLoading(false));
        
        // Define o cookie de autenticação para o middleware (opcional, dependendo de como o middleware está configurado)
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=2592000; SameSite=Lax`; // 30 dias
      } else {
        console.log('AuthContext: Usuário não logado');
        setTenant(null);
        setRole(null);
        setAuthLoading(false);
        
        // Remove cookies
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, authLoading, tenant, role }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export const useAuth = () => useContext(AuthContext);
