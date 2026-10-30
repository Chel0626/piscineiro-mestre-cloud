'use client';

import { useState } from 'react';
import { X, Users, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import { ProductCalculatorDialog } from './ProductCalculatorDialog';
import { BillingWidget } from './BillingWidget';
import { PiscineiroProfileWidget } from './PiscineiroProfileWidget';
import { ClienteAvulsoModal } from './ClienteAvulsoModal';
import { Separator } from './ui/separator';
import { ThemeToggle } from './ui/theme-toggle';
import { RoleGuard } from '@/components/RoleGuard';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isClienteAvulsoModalOpen, setIsClienteAvulsoModalOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Limpa o cookie de autenticação para um logout completo
    await fetch('/api/logout', { method: 'POST' });
    // Redireciona para a página de login
    window.location.href = '/login';
  };

  const handleLinkClick = () => {
    // Fecha a sidebar em telas pequenas ao clicar em um link
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/60 z-30 transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-background border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          <PiscineiroProfileWidget />
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-2">Ferramentas</h3>
            {/* Calculadora disponível para todos as funções na sidebar */}
            <ProductCalculatorDialog />
            <RoleGuard allowedRoles={['solo', 'owner']}>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => setIsClienteAvulsoModalOpen(true)}
              >
                <Users className="mr-2 h-4 w-4" />
                Cliente Avulso
              </Button>
            </RoleGuard>
          </div>

          <RoleGuard allowedRoles={['solo', 'owner']}>
            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-2">Financeiro</h3>
              <BillingWidget />
            </div>
          </RoleGuard>

          <RoleGuard allowedRoles={['owner']}>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-2">Administração</h3>
              <Button 
                variant="outline" 
                className="w-full justify-start border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                onClick={() => window.location.href = process.env.NEXT_PUBLIC_OWNER_URL || 'http://localhost:3000'}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Voltar para ADM
              </Button>
            </div>
          </RoleGuard>

          <Separator />

          <div className="space-y-2">
             <div className="px-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Configurações</h3>
                <ThemeToggle />
             </div>
             <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
               Sair
             </Button>
          </div>
        </div>
      </aside>

      <ClienteAvulsoModal 
        isOpen={isClienteAvulsoModalOpen}
        onClose={() => setIsClienteAvulsoModalOpen(false)}
      />
    </>
  );
}
