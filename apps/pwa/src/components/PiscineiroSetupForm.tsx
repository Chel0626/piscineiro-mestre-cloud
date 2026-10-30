'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { piscineiroProfileSchema, type PiscineiroProfile } from '@/lib/schemas/piscineiroSchema';
import { toast } from 'sonner';

interface PiscineiroSetupFormProps {
  onComplete: (profile: PiscineiroProfile) => void;
  onSkip?: () => void;
  initialData?: PiscineiroProfile | null;
  isEditing?: boolean;
}

export function PiscineiroSetupForm({ onComplete, onSkip, initialData, isEditing = false }: PiscineiroSetupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<PiscineiroProfile>({
    resolver: zodResolver(piscineiroProfileSchema),
    defaultValues: {
      disponivel: true,
      aceitaEmergencia: false,
    }
  });

  // Atualizar form quando initialData mudar
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        disponivel: initialData.disponivel ?? true,
        aceitaEmergencia: initialData.aceitaEmergencia ?? false,
      });
    }
  }, [initialData, reset]);

  const watchedValues = watch();
  
  // Calcular progresso do formulário
  const calculateProgress = () => {
    const requiredFields = ['nome', 'sobrenome', 'email', 'telefone'];
    const filledFields = requiredFields.filter(field => {
      const value = watchedValues[field as keyof PiscineiroProfile];
      return value && value !== '';
    });
    return (filledFields.length / requiredFields.length) * 100;
  };

  const onSubmit = async (data: PiscineiroProfile) => {
    setIsSubmitting(true);
    try {
      // Adicionar timestamps
      const profileData = {
        ...data,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      // Aqui você salvaria no Firebase/Firestore
      console.log('Perfil do piscineiro:', profileData);
      
      toast.success('Perfil criado com sucesso!');
      onComplete(profileData);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao criar perfil. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = calculateProgress();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">
          {isEditing ? 'Editar seu perfil profissional' : 'Complete seu perfil profissional'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base break-words">
          {isEditing 
            ? 'Atualize suas informações profissionais' 
            : 'Vamos configurar seu perfil para que seus clientes possam te conhecer melhor'
          }
        </p>
        <div className="w-full max-w-md mx-auto">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{Math.round(progress)}% completo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg break-words">Informações Básicas</CardTitle>
                <CardDescription className="text-sm break-words">
                  Dados principais para identificação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome" className="text-sm font-medium break-words">Nome *</Label>
                    <Input
                      id="nome"
                      {...register('nome')}
                      placeholder="Seu nome"
                      className="w-full"
                    />
                    {errors.nome && (
                      <p className="text-sm text-red-600 dark:text-red-400 break-words">{errors.nome.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="sobrenome" className="text-sm font-medium break-words">Sobrenome *</Label>
                    <Input
                      id="sobrenome"
                      {...register('sobrenome')}
                      placeholder="Seu sobrenome"
                      className="w-full"
                    />
                    {errors.sobrenome && (
                      <p className="text-sm text-red-600 dark:text-red-400 break-words">{errors.sobrenome.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium break-words">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="seu@email.com"
                      className="w-full"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 dark:text-red-400 break-words">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="telefone" className="text-sm font-medium break-words">Telefone *</Label>
                    <Input
                      id="telefone"
                      {...register('telefone')}
                      placeholder="(11) 99999-9999"
                      className="w-full"
                    />
                    {errors.telefone && (
                      <p className="text-sm text-red-600 dark:text-red-400 break-words">{errors.telefone.message}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          {onSkip && (
            <Button type="button" variant="outline" onClick={onSkip}>
              Pular por agora
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            {/* 
            {currentTab !== 'basico' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ['basico', 'localizacao', 'profissional', 'sobre', 'configuracoes'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex > 0) {
                    setCurrentTab(tabs[currentIndex - 1]);
                  }
                }}
              >
                Anterior
              </Button>
            )}
            {currentTab !== 'configuracoes' ? (
              <Button
                type="button"
                onClick={() => {
                  const tabs = ['basico', 'localizacao', 'profissional', 'sobre', 'configuracoes'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex < tabs.length - 1) {
                    setCurrentTab(tabs[currentIndex + 1]);
                  }
                }}
              >
                Próximo
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Finalizar Cadastro')}
              </Button>
            )}
            */}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Finalizar Cadastro')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}