'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, Loader2, RefreshCw } from "lucide-react";
import { toast } from 'sonner';

// Definição do tipo para a equipe
interface WorkerInfo {
  id: string;
  name: string;
}

export function TimeAttendanceWidget() {
  const { tenant } = useAuth();
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Busca os funcionários da empresa
  const fetchWorkers = async () => {
    if (!tenant?.id) return;
    setRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('tenant_members')
        .select(`
          user_id,
          profiles ( name )
        `)
        .eq('tenant_id', tenant.id)
        .eq('role', 'worker');

      if (error) throw error;

      if (data) {
        const workersInfo = data.map((member: any) => ({
          id: member.user_id,
          name: member.profiles?.name || 'Técnico sem nome'
        }));
        setWorkers(workersInfo);
      }
    } catch (error) {
      console.error("Erro ao carregar equipe:", error);
      toast.error("Não foi possível carregar a equipe.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [tenant?.id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-indigo-100 dark:border-indigo-900/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <CardTitle className="text-lg font-bold">Equipe de Técnicos</CardTitle>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchWorkers} 
          disabled={refreshing}
          className="h-8 px-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Colaborador</TableHead>
                <TableHead className="font-bold">Função</TableHead>
                <TableHead className="font-bold text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {workers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic">
                    Nenhum técnico cadastrado na equipe.
                  </TableCell>
                </TableRow>
              ) : (
                workers.map((worker) => (
                  <TableRow key={worker.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      {worker.name}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">Técnico de Piscina</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300 dark:border-emerald-500 dark:text-emerald-400 bg-emerald-50/50">
                        Ativo
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}