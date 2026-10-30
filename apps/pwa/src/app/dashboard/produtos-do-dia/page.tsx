'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductRequests } from '@/hooks/useProductRequests';
import { CheckSquare, XSquare, Package, User, Phone, Clock, Filter } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_OF_WEEK = [
  { value: 'all', label: 'Todos os dias' },
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
];

export default function ProdutosDoDiaPage() {
  const { 
    pendingRequests, 
    approvedProducts, 
    approveRequest, 
    rejectRequest, 
    isLoading 
  } = useProductRequests();

  const [dayFilter, setDayFilter] = useState<string>('all');

  const handleApprove = async (requestId: string) => {
    const success = await approveRequest(requestId);
    if (success) {
      toast.success('Solicitação aprovada!');
    }
  };

  const handleReject = async (requestId: string) => {
    const success = await rejectRequest(requestId);
    if (success) {
      toast.success('Solicitação rejeitada');
    }
  };

  // Função para filtrar as listas baseado no dia selecionado
  const filterByDay = (requests: any[]) => {
    if (dayFilter === 'all') return requests;
    
    return requests.filter(req => {
      // Pega a data da solicitação (tenta request_date ou created_at)
      const dateString = req.request_date || req.created_at;
      if (!dateString) return false;
      
      const requestDate = new Date(dateString);
      // Pega o dia da semana (0 para Domingo, 6 para Sábado)
      const dayOfWeek = requestDate.getDay().toString();
      
      return dayOfWeek === dayFilter;
    });
  };

  const filteredPending = filterByDay(pendingRequests);
  const filteredApproved = filterByDay(approvedProducts);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground font-medium">Buscando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-20">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Package className="h-7 w-7 text-blue-600" />
          Produtos Solicitados
        </h1>

        {/* Novo Filtro Otimizado para Mobile */}
        <div className="bg-muted/30 p-4 rounded-xl border border-muted ring-1 ring-black/5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">
            <Filter className="h-4 w-4" />
            Filtrar por Dia
          </div>
          <Select value={dayFilter} onValueChange={setDayFilter}>
            <SelectTrigger className="bg-background border-2 h-12 w-full sm:w-[220px] rounded-xl font-medium">
              <SelectValue placeholder="Selecione o dia" />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map(day => (
                <SelectItem key={day.value} value={day.value} className="font-medium h-11">
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Solicitações Pendentes */}
      {filteredPending.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardHeader className="bg-yellow-50/50 dark:bg-yellow-900/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-500">
              <Clock className="h-5 w-5" />
              Pendentes ({filteredPending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {filteredPending.map((request) => (
                <div key={request.id} className="border-2 rounded-xl p-4 transition-all hover:border-yellow-200 bg-card">
                  <div className="flex items-center justify-between mb-3 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{request.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                      <Phone className="h-3 w-3" />
                      <span className="text-xs font-medium">{request.clientPhone}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 block">
                      Itens Solicitados
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {request.products.map((product: any, index: number) => {
                        const name = typeof product === 'object' ? product.name : product;
                        const qty = typeof product === 'object' ? product.quantity : '';
                        return (
                          <Badge key={index} variant="outline" className="border-yellow-200 bg-yellow-50/30 text-yellow-900 dark:text-yellow-100 px-3 py-1">
                            {name} <span className="font-black ml-1 text-yellow-600">x{qty}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 h-11 bg-green-600 hover:bg-green-700 font-bold"
                      onClick={() => handleApprove(request.id)}
                      disabled={isLoading}
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                      onClick={() => handleReject(request.id)}
                      disabled={isLoading}
                    >
                      <XSquare className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Produtos Aprovados */}
      {filteredApproved.length > 0 && (
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="bg-green-50/50 dark:bg-green-900/10 pb-4">
            <CardTitle className="text-green-800 dark:text-green-500">
              Aprovados ({filteredApproved.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {filteredApproved.map((request) => (
                <div key={request.id} className="border-2 border-green-100 dark:border-green-900/50 rounded-xl p-4 bg-green-50/30 dark:bg-green-900/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-green-500" />
                      {request.clientName}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground bg-white dark:bg-slate-800 px-2 py-1 rounded-md border shadow-sm">
                      {request.clientPhone}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {request.products.map((product: any, index: number) => {
                      const name = typeof product === 'object' ? product.name : product;
                      const qty = typeof product === 'object' ? product.quantity : '';
                      return (
                        <Badge key={index} className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300">
                          {name} <span className="font-black ml-1 opacity-70">x{qty}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {filteredPending.length === 0 && filteredApproved.length === 0 && (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="p-10 text-center flex flex-col items-center">
            <div className="h-16 w-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nenhuma solicitação encontrada
            </h3>
            <p className="text-sm text-slate-500 font-medium max-w-[250px]">
              Não há produtos pendentes ou aprovados para o filtro selecionado.
            </p>
            {dayFilter !== 'all' && (
              <Button 
                variant="link" 
                onClick={() => setDayFilter('all')}
                className="mt-4 text-blue-600"
              >
                Limpar filtros e ver todos
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}