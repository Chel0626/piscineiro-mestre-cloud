'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PiscineiroSetupForm } from '@/components/PiscineiroSetupForm';
import { type PiscineiroProfile } from '@/lib/schemas/piscineiroSchema';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PiscineiroSetupPage() {
  const router = useRouter();
  const { user, authLoading, role } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;

      // Se for worker, redireciona para o dashboard - Workers não configuram perfil individual
      if (role === 'worker') {
        router.push('/dashboard');
        return;
      }
      
      try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
        
        if (data) {
          setHasProfile(true);
          // Se já tem perfil, redireciona para o dashboard
          router.push('/dashboard');
        } else {
          setHasProfile(false);
        }
      } catch (error) {
        console.error('Erro ao verificar perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      checkProfile();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router, role]);

  const handleProfileComplete = async (profile: PiscineiroProfile) => {
    if (!user) return;

    try {
      const dbProfile = {
          id: user.id,
          name: `${profile.nome} ${profile.sobrenome}`.trim(),
          email: user.email,
          account_type: user.user_metadata?.account_type || 'owner',
          company_name: profile.empresa || null,
          updated_at: new Date().toISOString()
      };

      console.log('Tentando salvar perfil:', dbProfile);
      console.log('User ID:', user.id);

      const { error } = await supabase
        .from('profiles')
        .upsert(dbProfile);

      if (error) throw error;

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Erro ao salvar perfil (RAW):', error);
      console.error('Erro ao salvar perfil (JSON):', JSON.stringify(error, null, 2));
      
      // Tenta extrair mensagem de erro de várias formas
      const msg = error?.message || error?.error_description || error?.statusText || 'Erro desconhecido';
      
      toast.error(`Erro ao salvar perfil: ${msg}`);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (hasProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-gray-600">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <PiscineiroSetupForm 
        onComplete={handleProfileComplete}
        onSkip={handleSkip}
      />
    </div>
  );
}