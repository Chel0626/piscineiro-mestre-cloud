'use client';

import { useAuth } from '@/context/AuthContext';
import { useRoutines as useSharedRoutines } from '@piscineiro/shared';

export function useRoutines() {
  const { tenant, user, role } = useAuth();
  // Só passar workerId quando o usuário for realmente um worker
  const workerId = role === 'worker' ? user?.id : undefined;
  return useSharedRoutines(tenant?.id, workerId);
}
