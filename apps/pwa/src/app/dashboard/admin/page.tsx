'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { getUserRole, AUTHORIZED_TEST_EMAILS } from '@/lib/userRoles';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Users, Shield, Settings, Database } from 'lucide-react';

export default function AdminPage() {
  const { user, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !user.email || getUserRole(user.email) !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user || !user.email || getUserRole(user.email) !== 'admin') {
    return null;
  }

  const adminUsers = AUTHORIZED_TEST_EMAILS.filter(email => 
    getUserRole(email) === 'admin'
  );

  const testerUsers = AUTHORIZED_TEST_EMAILS.filter(email => 
    getUserRole(email) === 'tester'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Administrador
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{AUTHORIZED_TEST_EMAILS.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuários autorizados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuários com privilégios admin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testadores</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testerUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Usuários de teste autorizado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Administradores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Administradores
            </CardTitle>
            <CardDescription>
              Usuários com acesso total ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {adminUsers.map((email) => (
              <div key={email} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{email}</p>
                  <Badge variant="destructive" className="text-xs">Admin</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Testadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Testadores
            </CardTitle>
            <CardDescription>
              Usuários autorizados para testes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {testerUsers.map((email) => (
              <div key={email} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{email}</p>
                  <Badge variant="secondary" className="text-xs">Tester</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Firebase Capacity Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Capacidade Firebase (Plano Spark)
          </CardTitle>
          <CardDescription>
            Limites do plano gratuito para 6 usuários de teste
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600">1GB</p>
              <p className="text-sm text-muted-foreground">Armazenamento</p>
              <p className="text-xs text-green-600">✓ Suficiente</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600">50K</p>
              <p className="text-sm text-muted-foreground">Leituras/dia</p>
              <p className="text-xs text-green-600">✓ Suficiente</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600">20K</p>
              <p className="text-sm text-muted-foreground">Escritas/dia</p>
              <p className="text-xs text-green-600">✓ Suficiente</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            O plano Spark do Firebase suporta facilmente 6 usuários simultâneos com margem de segurança.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}