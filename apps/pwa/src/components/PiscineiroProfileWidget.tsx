'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, MapPin, Briefcase, Star, ExternalLink, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { type PiscineiroProfile } from '@/lib/schemas/piscineiroSchema';
import Link from 'next/link';

export function PiscineiroProfileWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<PiscineiroProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false);
        setProfile(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (data) {
          setProfile({
            nome: data.name?.split(' ')[0] || '',
            sobrenome: data.name?.split(' ').slice(1).join(' ') || '',
            email: data.email,
            empresa: data.company_name,
            avatarUrl: data.avatar_url,
            criadoEm: new Date(data.created_at),
            atualizadoEm: new Date(data.updated_at)
          } as PiscineiroProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        setError('Erro ao carregar perfil');
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-blue-600 rounded animate-pulse mb-1" />
              <div className="h-3 bg-blue-600 rounded animate-pulse w-2/3" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Carregando perfil...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">Faça login para ver seu perfil</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="text-center text-red-500 dark:text-red-400">
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 border-red-200 dark:border-red-600 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-600 hover:text-red-600 dark:hover:text-white"
              onClick={() => window.location.reload()}
            >
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">Perfil não encontrado</p>
            <Link href="/dashboard/perfil">
              <Button variant="outline" size="sm" className="mt-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600">
                Criar Perfil
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getExperienceColor = (experiencia: string | undefined) => {
    if (!experiencia) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    switch (experiencia) {
      case 'iniciante': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediario': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'avancado': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'expert': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getExperienceLabel = (experiencia: string | undefined) => {
    if (!experiencia) return 'Não informado';
    switch (experiencia) {
      case 'iniciante': return 'Iniciante';
      case 'intermediario': return 'Intermediário';
      case 'avancado': return 'Avançado';
      case 'expert': return 'Expert';
      default: return experiencia;
    }
  };

  const getInitials = (nome: string, sobrenome: string) => {
    return `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full p-4 h-auto hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3 w-full">
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile.avatarUrl || undefined} alt={`${profile.nome} ${profile.sobrenome}`} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials(profile.nome, profile.sobrenome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {profile.nome} {profile.sobrenome}
                </p>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-4 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <Link href="/dashboard/perfil">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white"
                >
                  <Edit className="w-3 h-3 mr-2" />
                  Editar Perfil
                </Button>
              </Link>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
