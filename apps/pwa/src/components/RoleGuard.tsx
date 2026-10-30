'use client';

import { useAuth } from '@/context/AuthContext';
import { AppRole } from '@piscineiro/shared';
import { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { role, authLoading } = useAuth();

  if (authLoading) {
    return null; 
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
