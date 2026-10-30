'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PiscineiroSetupForm } from '@/components/PiscineiroSetupForm';
import { type PiscineiroProfile } from '@/lib/schemas/piscineiroSchema';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PerfilPage() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<PiscineiroProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
        
        if (data) {
          // Map DB columns to PiscineiroProfile
          const profile: PiscineiroProfile = {
              nome: data.name?.split(' ')[0] || '',
              sobrenome: data.name?.split(' ').slice(1).join(' ') || '',
              email: data.email,
              empresa: data.company_name,
              avatarUrl: data.avatar_url,
              criadoEm: new Date(data.created_at || Date.now()),
              atualizadoEm: new Date(data.updated_at || Date.now())
          } as PiscineiroProfile;
          setCurrentProfile(profile);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      loadProfile();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleProfileUpdate = async (profile: PiscineiroProfile) => {
    if (!user) return;

    try {
      const dbProfile = {
          id: user.id,
          name: `${profile.nome} ${profile.sobrenome}`.trim(),
          email: user.email,
          company_name: profile.empresa || null,
          avatar_url: profile.avatarUrl || null,
          updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(dbProfile);

      if (error) throw error;

      router.push('/dashboard');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        

        <PiscineiroSetupForm 
          onComplete={handleProfileUpdate}
          initialData={currentProfile}
          isEditing={true}
        />
      </div>
    </div>
  );
}