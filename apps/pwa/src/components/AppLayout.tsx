'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Menu, ShowerHead, LogOut } from 'lucide-react';
import { FillReminderProvider } from '@/context/FillReminderContext';
import { FillReminderButton } from './FillReminderButton';
import { AuthContextProvider, useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

import { useSubscription } from '@/hooks/useSubscription';
import { PlanSelection } from '@/components/PlanSelection';

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authLoading, role } = useAuth();
  const { hasActiveSubscription, isLoading: subscriptionLoading } = useSubscription();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const isProtectedRoute = pathname.startsWith('/dashboard');
  const isSetupRoute = pathname === '/setup-piscineiro';
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    if (profileChecked) return;
    
    const checkProfile = async () => {
      if (!user || authLoading || !isProtectedRoute || isSetupRoute) return;
      
      try {
        // Se for worker, não precisa de setup (já criado pelo owner)
        if (role === 'worker') {
          setProfileChecked(true);
          sessionStorage.setItem(`profile_checked_${user.id}`, 'true');
          return;
        }

        const cachedProfile = sessionStorage.getItem(`profile_checked_${user.id}`);
        if (cachedProfile) {
          setProfileChecked(true);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error || !data) {
          router.push('/setup-piscineiro');
        } else {
          setProfileChecked(true);
          sessionStorage.setItem(`profile_checked_${user.id}`, 'true');
        }
      } catch (error) {
        console.error('Erro ao verificar perfil:', error);
      }
    };

    checkProfile();
  }, [user, authLoading, isProtectedRoute, isSetupRoute, router, profileChecked]);

  if (isProtectedRoute) {
    if (!user && !authLoading) {
      router.push('/login');
      return null;
    }

    if (user && !user.email_confirmed_at) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Verifique seu E-mail</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Para acessar o sistema, é necessário verificar seu endereço de e-mail ({user.email}).
              Por favor, verifique sua caixa de entrada (e spam).
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={async () => {
                  try {
                    const { error } = await supabase.auth.resend({
                      type: 'signup',
                      email: user.email!,
                    });
                    if (error) throw error;
                    toast.success('E-mail de verificação reenviado!');
                  } catch (error: any) {
                    if (error.status === 429) {
                      toast.error('Muitas tentativas. Aguarde um pouco.');
                    } else {
                      toast.error('Erro ao reenviar e-mail.');
                    }
                  }
                }}
              >
                Reenviar E-mail de Verificação
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Já verifiquei, atualizar página
              </Button>
              <Button 
                variant="ghost" 
                onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (subscriptionLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-500 dark:text-gray-400">Verificando assinatura...</p>
          </div>
        </div>
      );
    }

    if (!hasActiveSubscription) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          <div className="flex justify-end p-4 relative z-50">
             <Button 
                variant="ghost" 
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    window.location.href = '/login';
                  } catch (error) {
                    console.error('Erro ao sair:', error);
                    toast.error('Erro ao sair. Tente novamente.');
                  }
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Sair
              </Button>
          </div>
          <PlanSelection />
        </div>
      );
    }

    return (
      <FillReminderProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          
          <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out md:ml-64 pb-20 md:pb-8 overflow-x-hidden w-full">
            {/* Header com logout */}
            <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-gray-200 dark:border-gray-800">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.href = '/login';
                  } catch (error) {
                    console.error('Erro ao sair:', error);
                    toast.error('Erro ao sair');
                  }
                }}
                title="Sair"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
              {children}
            </div>
          </main>
          
          <BottomTabBar />
        </div>
      </FillReminderProvider>
    );
  }

  return <>{children}</>;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthContextProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </AuthContextProvider>
  );
}
