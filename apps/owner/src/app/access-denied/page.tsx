'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AccessDeniedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const goToPWA = () => {
    const pwaUrl = process.env.NEXT_PUBLIC_PWA_URL || 'http://localhost:3001';
    window.location.href = pwaUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Acesso Negado</CardTitle>
          <CardDescription className="text-base">
            Você não tem permissão para acessar o Painel Administrativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este painel é exclusivo para proprietários e administradores.
            Se você é um funcionário, acesse o aplicativo operacional.
          </p>
          
          <div className="flex flex-col gap-2">
            <Button onClick={goToPWA} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ir para o App Operacional
            </Button>
            
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sair da Conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
