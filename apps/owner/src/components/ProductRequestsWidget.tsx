'use client';

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useProductRequests } from "@/hooks/useProductRequests";
// Removemos a contagem do useVisitProductRequests para evitar inflar os números com histórico antigo
import { Package, ChevronRight } from "lucide-react";

export function ProductRequestsWidget() {
  const router = useRouter();
  
  // Usamos apenas as solicitações estruturadas, que são as que aparecem nas abas da tela interna
  const { requests, isLoading } = useProductRequests();

  // Calcula exatamente o que as abas da sua página interna mostram
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  
  // Conta como finalizados os rejeitados ou concluídos (para bater com a aba "Finalizados (1)")
  const finishedCount = requests.filter(r => r.status === 'rejected' || r.status === 'completed').length;

  const totalRequests = pendingCount + approvedCount + finishedCount;

  return (
    <Card 
      onClick={() => router.push('/product-requests')}
      className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/50 cursor-pointer hover:shadow-md hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all group h-full flex flex-col"
    >
      <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full gap-4">
        
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-semibold text-orange-900 dark:text-orange-400 flex items-center gap-2">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-orange-700 dark:text-orange-300" />
              Solicitações de Produtos
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-400/80">
              Gerencie os pedidos feitos pelos técnicos.
            </p>
          </div>
          <div className="hidden sm:flex bg-orange-600 text-white px-3 py-1.5 rounded-md font-medium text-xs items-center gap-1 group-hover:bg-orange-700 transition-colors">
            Ver Pedidos <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* Informações Numéricas (Tags) */}
        {isLoading ? (
          <div className="animate-pulse h-12 bg-orange-200/50 dark:bg-orange-900/50 rounded-lg mt-2"></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            
            {/* Total */}
            <div className="bg-orange-100/80 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 px-3 py-2 rounded-lg text-xs font-semibold flex flex-col justify-center items-center text-center border border-orange-200/50 dark:border-orange-800/50">
              <span className="text-lg">{totalRequests}</span>
              <span className="font-medium opacity-80">Total</span>
            </div>
            
            {/* Aguardando */}
            <div className="bg-yellow-100/80 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 px-3 py-2 rounded-lg text-xs font-semibold flex flex-col justify-center items-center text-center border border-yellow-200/50 dark:border-yellow-800/50">
              <span className="text-lg">{pendingCount}</span>
              <span className="font-medium opacity-80">Aguardando</span>
            </div>
            
            {/* Aprovadas */}
            <div className="bg-green-100/80 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-3 py-2 rounded-lg text-xs font-semibold flex flex-col justify-center items-center text-center border border-green-200/50 dark:border-green-800/50">
              <span className="text-lg">{approvedCount}</span>
              <span className="font-medium opacity-80">Aprovadas</span>
            </div>
            
            {/* Finalizadas (Aba 3) */}
            <div className="bg-red-100/80 dark:bg-red-900/40 text-red-800 dark:text-red-300 px-3 py-2 rounded-lg text-xs font-semibold flex flex-col justify-center items-center text-center border border-red-200/50 dark:border-red-800/50">
              <span className="text-lg">{finishedCount}</span>
              <span className="font-medium opacity-80">Finalizadas</span>
            </div>

          </div>
        )}

      </CardContent>
    </Card>
  );
}