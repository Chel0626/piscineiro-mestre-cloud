// src/lib/userRoles.ts
export type UserRole = 'admin' | 'user' | 'tester';

export interface UserPermissions {
  canCreateUsers: boolean;
  canDeleteUsers: boolean;
  canViewAllData: boolean;
  canExportData: boolean;
  canModifySettings: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canCreateUsers: true,
    canDeleteUsers: true,
    canViewAllData: true,
    canExportData: true,
    canModifySettings: true,
  },
  user: {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewAllData: false,
    canExportData: false,
    canModifySettings: false,
  },
  tester: {
    canCreateUsers: false,
    canDeleteUsers: false,
    canViewAllData: false,
    canExportData: false,
    canModifySettings: false,
  },
};

// Lista de emails autorizados para teste
export const AUTHORIZED_TEST_EMAILS = [
  'michelhm91@gmail.com', // Você como admin
  'testador1@gmail.com',
  'testador2@gmail.com', 
  'testador3@gmail.com',
  'testador4@gmail.com',
  'testador5@gmail.com',
];

export const USER_ROLES: Record<string, UserRole> = {
  'michelhm91@gmail.com': 'admin',
  'testador1@gmail.com': 'tester',
  'testador2@gmail.com': 'tester',
  'testador3@gmail.com': 'tester', 
  'testador4@gmail.com': 'tester',
  'testador5@gmail.com': 'tester',
};

export function getUserRole(email: string, uid?: string): UserRole {
  if (uid && isSuperAdmin(uid)) return 'admin';
  return USER_ROLES[email] || 'user';
}

export function getUserPermissions(email: string, uid?: string): UserPermissions {
  const role = getUserRole(email, uid);
  return ROLE_PERMISSIONS[role];
}

export function isAuthorizedUser(email: string): boolean {
  return AUTHORIZED_TEST_EMAILS.includes(email);
}

export function isSuperAdmin(uid: string): boolean {
  return uid === process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
}
