'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MessageSquare, User, Search, Filter } from "lucide-react";
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

export default function ReportsPage() {
  const { role, tenant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientsReports, setClientsReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState('all');

  useEffect(() => {
    async function fetchLatestReports() {
      if (!tenant?.id) return;
      
      try {
        setLoading(true);
        
        // REQUISIÇÃO ÚNICA (O N+1 morre aqui)
        const { data: clientsData, error } = await supabase
          .from('clients')
          .select(`
            id,
            name,
            phone,
            reports:visits (
              id,
              date,
              water_condition, 
              ph,
              chlorine,
              alkalinity,
              checklist,
              products_used,
              products_to_request, 
              description,
              photo_url,
              departure_time
            )
          `)
          .eq('tenant_id', tenant.id)
          .order('name')
          .order('date', { foreignTable: 'visits', ascending: false })
          .limit(10, { foreignTable: 'visits' });

        if (error) throw error;

        // Moldar os dados para o formato que a interface já espera
        const results = (clientsData || []).map(client => ({
          client_id: client.id,
          client_name: client.name,
          client_phone: client.phone,
          reports: client.reports || []
        }));

        // Salvar apenas clientes que possuem pelo menos 1 relatório
        setClientsReports(results.filter(c => c.reports.length > 0));
      } catch (error) {
        console.error('Erro ao buscar relatórios:', error);
        toast.error('Erro ao carregar relatórios');
      } finally {
        setLoading(false);
      }
    }

    fetchLatestReports();
  }, [tenant?.id]);

  const handleSendWhatsApp = async (report: any, clientName: string, clientPhone: string) => {
    try {
      let targetPhone = '';
      let isToOwner = false;

      if (role === 'worker') {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('phone')
          .eq('id', tenant?.id)
          .single();
        
        targetPhone = tenantData?.phone || '';
        isToOwner = true;
      } else {
        targetPhone = clientPhone || '';
      }

      if (!targetPhone) {
        toast.error(isToOwner ? 'Telefone da empresa não configurado' : 'Telefone do cliente não cadastrado');
        return;
      }

      const cleanPhone = targetPhone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      
      const reportDate = new Date(report.date).toLocaleDateString('pt-BR');
      
      let message = `🏊 Relatório da Manutenção - ${clientName}\n`;
      message += `\n📅 Data: ${reportDate}\n`;
      if (report.departure_time) message += `⏰ *Saída:* ${report.departure_time}\n`;
      
      message += `\n💧 Parâmetros da Água:\n`;
      if (report.ph) message += `• pH: ${report.ph} (Ideal: 7,2 - 7,6)\n`;
      if (report.chlorine) message += `• Cloro: ${report.chlorine} ppm (Ideal: 1 - 3 ppm)\n`;
      if (report.alkalinity) message += `• Alcalinidade: ${report.alkalinity} ppm (Ideal: 80 - 120 ppm)\n`;
      if (report.water_condition) message += `• Condição: ${report.water_condition}\n`;
      
      if (report.checklist) message += `\n🔄 Processos Realizados:\n${report.checklist}\n`;
      if (report.products_used) message += `\n🧪 Produtos Utilizados:\n${report.products_used}\n`;
      
      if (report.products_to_request) {
        message += `\n📦 Solicitação de Produtos:\n${report.products_to_request}\n`;
      }
      
      if (report.description) message += `\n📝 Obs Geral:\n${report.description}\n`;
      
      if (report.photo_url) message += `\n📸 Foto da Piscina:\n${report.photo_url}\n`;
      
      message += `\n✅ Visita concluída!\n`;
      message += `\n🏊 _Relatório enviado automaticamente via Piscineiro Mestre_\n`;
      
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      toast.error('Erro ao preparar mensagem');
    }
  };

  // Filtrar clientes e seus relatórios
  const filteredClients = clientsReports
    .filter(client => 
      client.client_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .map(client => {
      // Filtrar relatórios pelo dia da semana se o filtro não for 'all'
      const filteredReports = dayFilter === 'all' 
        ? client.reports.slice(0, 4) 
        : client.reports
            .filter((r: any) => new Date(r.date).getUTCDay().toString() === dayFilter)
            .slice(0, 4); 
            
      return { ...client, reports: filteredReports };
    })
    .filter(client => client.reports.length > 0);

  return (
    <div className="p-4 pb-20 space-y-6 max-w-lg mx-auto">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios Recentes</h1>
          <p className="text-sm text-muted-foreground">Clique na data para enviar via WhatsApp</p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente pelo nome..."
              className="pl-9 h-11 bg-muted/30 border-none ring-1 ring-black/5"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger className="pl-9 h-11 bg-muted/30 border-none ring-1 ring-black/5">
                  <SelectValue placeholder="Filtrar por dia" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Clock className="animate-spin h-8 w-8 text-muted-foreground" />
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground bg-muted/10 border-dashed">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p>Nenhum relatório encontrado para esta busca.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <Card key={client.client_id} className="overflow-hidden shadow-sm border-l-4 border-l-blue-500">
              <CardHeader className="p-4 pb-2 bg-muted/20">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    {client.client_name}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {client.reports.map((report: any) => (
                    <Button
                      key={report.id}
                      variant="outline"
                      size="sm"
                      className="h-10 text-[11px] justify-between font-medium border-blue-100 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                      onClick={() => handleSendWhatsApp(report, client.client_name, client.client_phone)}
                    >
                      {new Date(report.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      <MessageSquare className="h-3 w-3 text-green-600" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}