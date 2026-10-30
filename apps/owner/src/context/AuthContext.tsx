'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Tenant, AppRole } from '@piscineiro/shared';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  tenant: Tenant | null;
  role: AppRole | null;
  refreshTenant: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  authLoading: true,
  tenant: null,
  role: null,
  refreshTenant: async () => {},
  signOut: async () => {},
});

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setTenant(null);
      setRole(null);
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
    }
  };

  const fetchTenant = async (userId: string) => {
    try {
      // Primeira tentativa: Buscar apenas os dados do membro (sem join complexo)
      // Usamos limit(1) em vez de single() para evitar erro 406 se houver duplicatas
      const { data: membersData, error: memberError } = await supabase
        .from('tenant_members')
        .select('role, tenant_id')
        .eq('user_id', userId)
        .limit(1);

      if (memberError) {
        console.error('Erro ao buscar membro do tenant:', memberError);
        setRole(null);
        setTenant(null);
        return;
      }

      const memberData = membersData?.[0];

      if (memberData) {
        setRole(memberData.role as AppRole);
        
        // Segunda etapa: Buscar os dados do tenant separadamente
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', memberData.tenant_id)
          .single();
          
        if (tenantError) {
           console.error('Erro ao buscar dados do tenant:', tenantError);
           // Mesmo sem dados do tenant, definimos o role para permitir redirecionamento
           setTenant(null);
        } else {
           setTenant(tenantData as unknown as Tenant);
        }
      } else {
        console.log('Usuário sem tenant associado (memberData vazio).');
        setRole(null);
        setTenant(null);
      }
    } catch (error) {
      console.error('Exceção ao buscar tenant:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchTenant(session.user.id);
      }
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchTenant(session.user.id);
      } else {
        setTenant(null);
        setRole(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshTenant = async () => {
    if (user) {
      await fetchTenant(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, authLoading, tenant, role, refreshTenant, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
