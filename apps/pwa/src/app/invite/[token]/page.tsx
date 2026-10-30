'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const token = params.token as string;

  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data, error } = await supabase.rpc('get_invitation_details', { token_param: token });
        if (error) throw error;
        
        if (!data.valid) {
          setError('Convite inválido ou expirado.');
        } else {
          setDetails(data);
        }
      } catch (err: any) {
        console.error(err);
        setError('Erro ao carregar convite.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      // Redirect to login with return url
      router.push(`/login?returnUrl=/invite/${token}`);
      return;
    }

    setAccepting(true);
    try {
      const { data, error } = await supabase.rpc('accept_invitation', { token_param: token });
      if (error) throw error;

      if (data.success) {
        toast.success('Convite aceito com sucesso!');
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Erro ao aceitar convite');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao processar convite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Erro no Convite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push('/')}>Voltar ao Início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>Convite para Equipe</CardTitle>
          <CardDescription>
            Você foi convidado por <strong>{details.inviter_name}</strong> para participar da equipe <strong>{details.tenant_name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">Você precisa estar logado para aceitar.</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push(`/login?returnUrl=/invite/${token}`)}>Entrar</Button>
                <Button variant="outline" onClick={() => router.push(`/signup?returnUrl=/invite/${token}`)}>Criar Conta</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-sm text-gray-600">
                Logado como: <strong>{user.email}</strong>
              </p>
              <Button className="w-full" onClick={handleAccept} disabled={accepting}>
                {accepting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Aceitar Convite
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
