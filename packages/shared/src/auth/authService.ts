import { supabase } from '../../supabase';
import { AppRole } from '../../index';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  accountType: 'solo' | 'company';
  companyName?: string;
  redirectTo?: string;
}

export const authService = {
  async login({ email, password }: LoginCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    let role: AppRole | null = null;

    if (data.user) {
      const { data: memberData } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('user_id', data.user.id)
        .single();
      
      if (memberData) {
        role = memberData.role as AppRole;
      }
    }

    return {
      user: data.user,
      session: data.session,
      role,
    };
  },

  async signup({ email, password, accountType, companyName, redirectTo }: SignupData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          account_type: accountType,
          company_name: accountType === 'company' ? companyName : null,
        }
      },
    });

    if (error) throw error;

    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  async getCurrentUserRole(userId: string): Promise<AppRole | null> {
      const { data: memberData } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      return memberData?.role as AppRole || null;
  }
};
