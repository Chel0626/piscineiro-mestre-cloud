'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, ArrowLeft, Eye, Download, ImageIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Report {
  id: string;
  client_id: string;
  worker_id: string;
  status: 'pendente' | 'enviado' | 'finalizado';
  visit_date: string;
  details: {
    ph?: number;
    chlorine?: number;
    alkalinity?: number;
    notes?: string;
    products_used?: string;
    water_condition?: string;
    checklist?: string;
    products_to_request?: string;
    description?: string;
    departure_time?: string;
    photo_url?: string;
  };
  clients: {
    name: string;
    address: string;
    phone: string;
    mobile: string;
  };
  profiles: {
    name: string;
  };
}

const DAYS_OF_WEEK = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
];

const ReportCard = ({ report, onOpenDetail, onApprove, onComplete }: { 
  report: Report; 
  onOpenDetail: (id: string) => void;
  onApprove: (id: string, e: React.MouseEvent) => void;
  onComplete: (id: string, e: React.MouseEvent) => void;
}) => (
  <Card 
    className={`overflow-hidden border-l-4 hover:shadow-md transition-shadow ${
      report.status === 'pendente' ? 'border-l-yellow-500' : 'border-l-green-500'
    }`}
  >
    {report.details?.photo_url && (
      <div 
        className="relative w-full h-48 overflow-hidden cursor-pointer bg-muted"
        onClick={() => onOpenDetail(report.id)}
      >
        <img 
          src={report.details.photo_url} 
          alt="Piscina" 
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] flex items-center gap-1 font-medium">
          <ImageIcon className="h-3 w-3" /> Foto da Visita
        </div>
      </div>
    )}
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-lg truncate">{report.clients?.name || 'Cliente'}</CardTitle>
          <CardDescription className="text-xs truncate">
            {report.clients?.address}
          </CardDescription>
        </div>
        <Badge 
          variant={report.status === 'pendente' ? "secondary" : "default"} 
          className={
            report.status === 'pendente' 
              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 whitespace-nowrap ml-2" 
              : "bg-green-100 text-green-800 hover:bg-green-100 whitespace-nowrap ml-2"
          }
        >
          {report.status === 'pendente' ? (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pendente</span>
          ) : (
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Enviado</span>
          )}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="text-sm space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 p-2 rounded text-center">
          <span className="text-xs text-muted-foreground block">pH</span>
          <span className="font-bold text-blue-700">{report.details?.ph || '-'}</span>
        </div>
        <div className="bg-cyan-50 p-2 rounded text-center">
          <span className="text-xs text-muted-foreground block">Cloro</span>
          <span className="font-bold text-cyan-700">{report.details?.chlorine || '-'}</span>
        </div>
        <div className="bg-purple-50 p-2 rounded text-center">
          <span className="text-xs text-muted-foreground block">Alcalinidade</span>
          <span className="font-bold text-purple-700">{report.details?.alkalinity || '-'}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <span className="text-xs text-muted-foreground block">Condição da água</span>
          <span className="font-medium text-xs truncate block">{report.details?.water_condition || '-'}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block">Saída</span>
          <span className="font-medium text-xs">{report.details?.departure_time || '-'}</span>
        </div>
      </div>

      {report.details?.checklist && (
        <div className="pt-2">
          <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider">Serviços Executados</span>
          <div className="text-xs mt-1 bg-muted/50 p-2 rounded whitespace-pre-wrap leading-relaxed max-h-[80px] overflow-y-auto">
            {report.details.checklist}
          </div>
        </div>
      )}

      {report.details?.products_used && (
        <div className="pt-2">
          <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider">Produtos Aplicados</span>
          <div className="text-xs mt-1 bg-blue-50/50 p-2 rounded text-blue-900 leading-relaxed max-h-[80px] overflow-y-auto">
            {report.details.products_used}
          </div>
        </div>
      )}

      {/* Exibição corrigida das Observações */}
      {report.details?.notes && (
        <div className="pt-2">
          <span className="text-xs text-muted-foreground block font-bold uppercase tracking-wider">Observações</span>
          <div className="text-xs mt-1 italic text-muted-foreground">
            "{report.details.notes}"
          </div>
        </div>
      )}

      <div className="pt-2 border-t flex justify-between items-center mt-2">
        <div className="min-w-0 flex-1">
          <span className="text-xs text-muted-foreground">Técnico: </span>
          <span className="text-xs font-medium truncate inline-block max-w-[100px] align-bottom">{report.profiles?.name || 'Técnico'}</span>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
          {new Date(report.visit_date).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </CardContent>
    <CardFooter className="flex flex-col gap-2 pt-0">
      <div className="flex gap-2 w-full">
        {report.details?.photo_url && (
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
            asChild
          >
            <a 
              href={report.details.photo_url} 
              download={`piscina-${report.clients?.name || 'cliente'}.jpg`}
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="mr-1 h-3 w-3" /> Baixar Foto
            </a>
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(report.id);
          }}
        >
          <Eye className="mr-1 h-3 w-3" /> Detalhes
        </Button>
      </div>

      {report.status === 'pendente' ? (
        <Button 
          size="sm" 
          className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm"
          onClick={(e) => onApprove(report.id, e)}
        >
          <CheckCircle2 className="mr-1 h-3 w-3" /> Aprovar & Enviar WhatsApp
        </Button>
      ) : report.status === 'enviado' ? (
        <Button 
          size="sm" 
          className="w-full bg-gray-600 hover:bg-gray-700 text-white"
          onClick={(e) => onComplete(report.id, e)}
        >
          <CheckCircle2 className="mr-1 h-3 w-3" /> Limpar (Marcar como Concluído)
        </Button>
      ) : null}
    </CardFooter>
  </Card>
);

export default function ReportsPage() {
  const router = useRouter();
  const { tenant } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');

  const fetchReports = async () => {
    if (!tenant?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          date,
          status,
          water_condition,
          ph,
          chlorine,
          alkalinity,
          products_used,
          checklist,
          products_to_request,
          description,
          departure_time,
          photo_url,
          client_id,
          user_id,
          clients:client_id(name, address, phone),
          profiles:user_id(name)
        `)
        .eq('tenant_id', tenant.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedReports = data?.map((item: any) => {
        const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        const clientData = Array.isArray(item.clients) ? item.clients[0] : item.clients;

        return {
          id: item.id,
          visit_date: item.date,
          status: (item.status === 'pending_review' || !item.status) ? 'pendente' : (item.status === 'approved' ? 'enviado' : (item.status === 'finalized' ? 'finalizado' : item.status)), 
          details: {
            water_condition: item.water_condition,
            ph: item.ph,
            chlorine: item.chlorine,
            alkalinity: item.alkalinity,
            products_used: item.products_used,
            checklist: item.checklist,
            products_to_request: item.products_to_request,
            description: item.description,
            departure_time: item.departure_time,
            photo_url: item.photo_url,
            notes: item.description, // Mapeamento corrigido: 'description' do DB preenche 'notes' no visual
          },
          client_id: item.client_id,
          worker_id: item.user_id,
          clients: {
            name: clientData?.name || 'Cliente',
            address: clientData?.address || '',
            phone: clientData?.phone || '',
            mobile: clientData?.phone || '',
          },
          profiles: {
            name: profileData?.name || 'Técnico',
          },
        };
      }) || [];

      setReports(formattedReports);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAll = async () => {
    if (!tenant?.id) return;
    
    try {
      setLoading(true);
      const { data: pendingData } = await supabase
        .from('visits')
        .select('id')
        .eq('tenant_id', tenant.id)
        .or('status.eq.pending_review,status.is.null');

      const pendingIds = pendingData?.map(r => r.id) || [];
      
      if (pendingIds.length === 0) {
        toast.info('Não há relatórios pendentes para aprovar');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('visits')
        .update({ status: 'approved' })
        .in('id', pendingIds)
        .eq('tenant_id', tenant.id);
        
      if (error) throw error;
      
      toast.success('Todos os relatórios pendentes foram aprovados!');
      await fetchReports();
    } catch (error) {
      console.error('Erro ao aprovar todos os relatórios:', error);
      toast.error('Erro ao aprovar todos os relatórios pendentes');
      setLoading(false);
    }
  };

  const handleCompleteAll = async () => {
    const sentReportsToArchive = reports.filter(r => r.status === 'enviado');
    const sentIds = sentReportsToArchive.map(r => r.id);
    
    if (sentIds.length === 0 || !tenant?.id) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('visits')
        .update({ status: 'finalized' })
        .in('id', sentIds);
        
      if (error) throw error;

      setReports(prev => prev.filter(r => !sentIds.includes(r.id)));
      toast.success(`${sentIds.length} relatórios foram arquivados com sucesso!`);
      await fetchReports();
    } catch (error) {
      console.error('Erro ao arquivar todos os relatórios:', error);
      toast.error('Erro ao limpar os relatórios.');
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tenant?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('visits')
        .update({ status: 'approved' })
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .select(`
          id, 
          date, 
          ph, 
          chlorine, 
          alkalinity, 
          description,
          water_condition,
          checklist,
          products_used,
          products_to_request,
          departure_time,
          photo_url,
          clients:client_id(name, phone)
        `)
        .single();

      if (error || !data) throw error;

      const fullData = data as any;
      const client = Array.isArray(fullData.clients) ? fullData.clients[0] : fullData.clients;
      const phone = client?.phone;

      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        
        let message = `🏊 Relatório da Manutenção - ${client?.name || 'Cliente'}\n`;
        message += `\n📅 Data: ${new Date(fullData.date).toLocaleDateString('pt-BR')}\n`;
        if (fullData.departure_time) message += `⏰ *Saída:* ${fullData.departure_time}\n`;
        
        message += `\n💧 Parâmetros da Água:\n`;
        if (fullData.ph) message += `• pH: ${fullData.ph} (Ideal: 7,2 - 7,6)\n`;
        if (fullData.chlorine) message += `• Cloro: ${fullData.chlorine} ppm (Ideal: 1 - 3 ppm)\n`;
        if (fullData.alkalinity) message += `• Alcalinidade: ${fullData.alkalinity} ppm (Ideal: 80 - 120 ppm)\n`;
        if (fullData.water_condition) message += `• Condição: ${fullData.water_condition}\n`;
        
        if (fullData.checklist) message += `\n🔄 Processos Realizados:\n${fullData.checklist}\n`;
        if (fullData.products_used) message += `\n🧪 Produtos Utilizados:\n${fullData.products_used}\n`;
        if (fullData.products_to_request) message += `\n📦 Solicitação de Produtos:\n${fullData.products_to_request}\n`;
        if (fullData.description) message += `\n📝 Obs:\n${fullData.description}\n`; // Envia o texto da observação correto
        if (fullData.photo_url) message += `\n📸 Foto da Piscina:\n${fullData.photo_url}\n`;
        
        message += `\n✅ Visita concluída!\n`;
        message += `\n🏊 _Relatório enviado via Piscineiro Mestre_\n`;

        window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`, '_blank');
      } else {
        toast.error('Relatório aprovado, mas cliente não possui telefone cadastrado.');
      }
      toast.success('Relatório aprovado e WhatsApp aberto!');
      await fetchReports();
    } catch (error) {
      console.error('Erro ao aprovar relatório:', error);
      toast.error('Erro ao aprovar relatório');
      setLoading(false);
    }
  };

  const handleComplete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tenant?.id) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('visits')
        .update({ status: 'finalized' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Relatório arquivado com sucesso!');
      setReports(prev => prev.filter(r => r.id !== id));
      await fetchReports();
    } catch (error) {
      console.error('Erro ao finalizar relatório:', error);
      toast.error('Erro ao finalizar relatório');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [tenant?.id]);

  const pendingReports = reports.filter(r => r.status === 'pendente');
  const sentReports = reports.filter(r => r.status === 'enviado');

  const filterReports = (reportsList: Report[]) => {
    return reportsList.filter(report => {
      const matchesWorker = workerFilter === 'all' || report.worker_id === workerFilter;
      let matchesDay = true;
      if (dayFilter !== 'all') {
        const reportDate = new Date(report.visit_date);
        const dayOfWeek = reportDate.getUTCDay();
        matchesDay = dayOfWeek.toString() === dayFilter;
      }
      return matchesWorker && matchesDay;
    });
  };

  const filteredPendingReports = filterReports(pendingReports);
  const filteredSentReports = filterReports(sentReports);

  const workers = Array.from(new Map(reports.map(r => [r.worker_id, r.profiles.name])).entries())
    .map(([id, name]) => ({ id, name }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 space-y-6 container mx-auto max-w-7xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Relatórios de Visitas</h1>
            <p className="text-sm text-muted-foreground">
              {pendingReports.length} pendente(s) • {sentReports.length} enviado(s)
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-muted ring-1 ring-black/5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Funcionário
            </label>
            <Select value={workerFilter} onValueChange={setWorkerFilter}>
              <SelectTrigger className="bg-background border-2 h-11">
                <SelectValue placeholder="Todos os funcionários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os funcionários</SelectItem>
                {workers.map(worker => (
                  <SelectItem key={worker.id} value={worker.id}>{worker.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              Dia da Visita
            </label>
            <Select value={dayFilter} onValueChange={setDayFilter}>
              <SelectTrigger className="bg-background border-2 h-11">
                <SelectValue placeholder="Todos os dias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os dias</SelectItem>
                {DAYS_OF_WEEK.map(day => (
                  <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendentes ({filteredPendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Enviados ({filteredSentReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="flex flex-col gap-4">
              {filteredPendingReports.length > 0 && (
                <div className="flex justify-end mb-2">
                  <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white" onClick={handleApproveAll}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Aprovar Todos
                  </Button>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                  <p className="col-span-full text-center py-8">Carregando relatórios...</p>
                ) : filteredPendingReports.length === 0 ? (
                  <Card className="col-span-full p-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>Nenhum relatório encontrado com estes filtros.</p>
                  </Card>
                ) : (
                  filteredPendingReports.map((report) => (
                    <ReportCard 
                      key={report.id} 
                      report={report} 
                      onOpenDetail={(id) => router.push(`/reports/${id}`)}
                      onApprove={handleApprove}
                      onComplete={handleComplete}
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sent">
            <div className="flex flex-col gap-4">
              {filteredSentReports.length > 0 && (
                <div className="flex justify-end mb-2">
                  <Button size="sm" className="bg-gray-700 hover:bg-gray-800 text-white" onClick={handleCompleteAll}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Limpar Todos
                  </Button>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                  <p className="col-span-full text-center py-8">Carregando relatórios...</p>
                ) : filteredSentReports.length === 0 ? (
                  <Card className="col-span-full p-8 text-center text-muted-foreground border-dashed">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhum relatório enviado encontrado com estes filtros.</p>
                  </Card>
                ) : (
                  filteredSentReports.map((report) => (
                    <ReportCard 
                      key={report.id} 
                      report={report} 
                      onOpenDetail={(id) => router.push(`/reports/${id}`)}
                      onApprove={handleApprove}
                      onComplete={handleComplete}
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}