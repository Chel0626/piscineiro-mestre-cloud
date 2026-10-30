export * from './supabase';
export * from './src/hooks/useProductCatalog';
export * from './src/hooks/useRoutines';
export * from './src/hooks/useTemporaryReschedule';
export * from './src/hooks/useClientsData';
export * from './src/hooks/useInvitations';
export * from './src/validators/clientSchema';
export * from './src/utils/mappers';
export * from './src/auth/authService';

export const SHARED_CONSTANT = "Shared Value";

export type AppRole = 'superadmin' | 'owner' | 'worker' | 'solo';

export interface Tenant {
  id: string;
  name: string;
  slug?: string;
  type: 'personal' | 'business';
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}
