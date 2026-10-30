'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  Droplets, 
  Thermometer, 
  FlaskConical, 
  User,
  MapPin,
  MessageCircle,
  Edit,
  Package,
  Camera,
  Image as ImageIcon,
  Download
} from "lucide-react";
import { Header } from "@/components/Header";
import { toast } from 'sonner';

interface ReportDetails {
  id: string;
  client_id: string;
  worker_id: string;
  status: 'pendente' | 'enviado' | 'finalizado';
  visit_date: string;
  photo_url?: string;
  details: {
    ph?: number;
    chlorine?: number;
    alkalinity?: number;
    notes?: string;
    products_used?: string;
    checklist?: string;
    photo_url?: string;
    water_condition?: string;
    products_to_request?: string;
    departure_time?: string;
  };
  clients: {
    name: string;
    address: string;
    neighborhood: string;
    phone: string;
    mobile: string;
  };
  profiles: {
    name: string;
  };
}

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params?.id as string;
  
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          status,
          date,
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
          clients:clients(name, address, neighborhood, phone),
          profiles:profiles(name)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;

      // Tratar dados do join
      const clientData = Array.isArray(data.clients) ? data.clients[0] : data.clients;
      const profileData = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

      setReport({
        id: data.id,
        client_id: data.client_id,
        worker_id: data.user_id || '',
        status: data.status === 'pending_review' ? 'pendente' : (data.status === 'approved' ? 'enviado' : (data.status === 'finalized' ? 'finalizado' : data.status)),
        visit_date: data.date,
        photo_url: data.photo_url,
        details: {
          water_condition: data.water_condition,
          ph: data.ph,
          chlorine: data.chlorine,
          alkalinity: data.alkalinity,
          products_used: data.products_used,
          checklist: data.checklist,
          products_to_request: data.products_to_request,
          departure_time: data.departure_time,
          photo_url: data.photo_url,
          notes: data.description, // Correção: Mapeando 'description' do banco para 'notes'
        },
        clients: {
          name: clientData?.name || 'Cliente',
          address: clientData?.address || '',
          neighborhood: clientData?.neighborhood || '',
          phone: clientData?.phone || '',
          mobile: clientData?.phone || '',
        },
        profiles: {
          name: profileData?.name || 'Técnico Responsável',
        },
      });
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      toast.error('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('visits')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', reportId);

      if (error) throw error;
      toast.success('Relatório aprovado e enviado!');
      await fetchReport();
    } catch (error) {
      console.error('Erro ao aprovar relatório:', error);
      toast.error('Erro ao aprovar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('visits')
        .update({ status: 'finalized', updated_at: new Date().toISOString() })
        .eq('id', reportId);

      if (error) throw error;
      toast.success('Relatório arquivado com sucesso!');
      await fetchReport();
    } catch (error) {
      console.error('Erro ao finalizar visita:', error);
      toast.error('Erro ao arquivar o relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!report) return;
    
    const phone = report.clients?.mobile || report.clients?.phone;
    if (!phone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    // Formatar número de telefone
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // Montar mensagem consistente com o restante da plataforma
    let message = `\u{1F3CA} Relatório da Manutenção - ${report.clients?.name}\n`;
    message += `\n\u{1F4C5} Data: ${new Date(report.visit_date).toLocaleDateString('pt-BR')}\n`;
    if (report.details?.departure_time) message += `\u{23F0} *Saída:* ${report.details.departure_time}\n`;

    message += `\n\u{1F4A7} Parâmetros da Água:\n`;
    if (report.details?.ph) message += `• pH: ${report.details.ph} (Ideal: 7,2 - 7,6)\n`;
    if (report.details?.chlorine) message += `• Cloro: ${report.details.chlorine} ppm (Ideal: 1 - 3 ppm)\n`;
    if (report.details?.alkalinity) message += `• Alcalinidade: ${report.details.alkalinity} ppm (Ideal: 80 - 120 ppm)\n`;
    if (report.details?.water_condition) message += `• Condição: ${report.details.water_condition}\n`;
    
    if (report.details?.checklist) message += `\n\u{1F504} Processos Realizados:\n${report.details.checklist}\n`;
    if (report.details?.products_used) message += `\n\u{1F9EA} Produtos Utilizados:\n${report.details.products_used}\n`;
    if (report.details?.products_to_request) message += `\n\u{1F4E6} Solicitação de Produtos:\n${report.details.products_to_request}\n`;
    if (report.details?.notes) message += `\n\u{1F4DD} Obs:\n${report.details.notes}\n`; // Correção: Apenas 'notes'
    
    const finalPhotoUrl = report.photo_url || report.details?.photo_url;
    if (finalPhotoUrl) {
      message += `\n\u{1F4F8} Foto da Piscina:\n${finalPhotoUrl}\n`;
    }

    message += `\n\u{2705} Visita concluída!\n`;
    message += `\n\u{1F3CA} _Relatório enviado automaticamente via Piscineiro Mestre_\n`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // Enviar apenas a foto da piscina via WhatsApp
  const handleSendPhotoOnly = () => {
    if (!report) return;
    
    const photoUrl = report.photo_url || report.details?.photo_url;
    if (!photoUrl) {
      toast.error('Este relatório não possui foto');
      return;
    }

    const phone = report.clients?.mobile || report.clients?.phone;
    if (!phone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    let message = `\u{1F3CA} *Foto da sua piscina!*\n\n`;
    message += `Olá! Segue a foto da piscina após a manutenção de hoje (${new Date(report.visit_date).toLocaleDateString('pt-BR')}):\n\n`;
    message += `\u{1F4F8} ${photoUrl}\n\n`;
    message += `_Piscineiro Mestre_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  // Baixar foto para compartilhar manualmente
  const handleDownloadPhoto = async () => {
    if (!report) return;
    
    const photoUrl = report.photo_url || report.details?.photo_url;
    if (!photoUrl) {
      toast.error('Este relatório não possui foto');
      return;
    }

    try {
      toast.info('Baixando foto...');
      
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const clientName = report.clients?.name?.replace(/\s+/g, '_') || 'cliente';
      const date = new Date(report.visit_date).toLocaleDateString('pt-BR').replace(/\//g, '-');
      link.download = `piscina_${clientName}_${date}.jpg`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Foto baixada! Agora você pode compartilhar pelo WhatsApp.');
    } catch (error) {
      console.error('Erro ao baixar foto:', error);
      toast.error('Erro ao baixar foto');
    }
  };

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 p-6 container mx-auto max-w-4xl">
          <p>Carregando relatório...</p>
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 p-6 container mx-auto max-w-4xl">
          <p>Relatório não encontrado.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 space-y-6 container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/reports')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Detalhes do Relatório</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(report.visit_date).toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          {/* Correção de Sintaxe na ClassName da Badge */}
          <Badge 
            variant={report.status === 'pendente' ? "secondary" : "default"} 
            className={`${
              report.status === 'pendente' 
                ? "bg-yellow-100 text-yellow-800" 
                : "bg-green-100 text-green-800"
            } text-sm px-3 py-1`}
          >
            {report.status === 'pendente' ? (
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Pendente</span>
            ) : (
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Enviado</span>
            )}
          </Badge>
        </div>

        {/* Client Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
              <User className="h-5 w-5" />
              {report.clients?.name || 'Informações do Cliente'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {report.clients?.address}, {report.clients?.neighborhood}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{report.clients?.mobile || report.clients?.phone || 'Não informado'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Water Analysis Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Droplets className="h-5 w-5 text-cyan-600" />
              Análise da Água
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
                <Thermometer className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                <p className="text-xs text-muted-foreground">pH</p>
                <p className="text-2xl font-bold text-blue-700">{report.details?.ph || '-'}</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg text-center">
                <FlaskConical className="h-6 w-6 mx-auto text-cyan-600 mb-2" />
                <p className="text-xs text-muted-foreground">Cloro</p>
                <p className="text-2xl font-bold text-cyan-700">{report.details?.chlorine || '-'}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center">
                <Droplets className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                <p className="text-xs text-muted-foreground">Alcalinidade</p>
                <p className="text-2xl font-bold text-purple-700">{report.details?.alkalinity || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Used */}
        {report.details?.products_used && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Produtos Aplicados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800 whitespace-pre-wrap">{report.details.products_used}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Checklist */}
        {report.details?.checklist && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                Serviços Realizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-teal-50 p-4 rounded-lg">
                <p className="text-sm text-teal-800 whitespace-pre-wrap">{report.details.checklist}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {report.details?.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Edit className="h-5 w-5 text-orange-600" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-800 italic">"{report.details.notes}"</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pool Photo */}
        {(report.photo_url || report.details?.photo_url) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Foto da Piscina
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={report.photo_url || report.details?.photo_url} 
                  alt="Foto da piscina" 
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Button 
                  variant="outline" 
                  className="border-green-600 text-green-600 hover:bg-green-50"
                  onClick={handleDownloadPhoto}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Foto
                </Button>
                <Button 
                  variant="outline" 
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={handleSendPhotoOnly}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Enviar Link
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                💡 Baixe a foto e compartilhe pelo WhatsApp para enviar a imagem real
              </p>
            </CardContent>
          </Card>
        )}

        {/* Technician */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Técnico Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{report.profiles?.name || 'Técnico'}</p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {report.status === 'pendente' && (
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700" 
              onClick={handleApprove}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprovar Relatório
            </Button>
          )}
          {report.status === 'enviado' && (
            <Button 
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white" 
              onClick={handleFinalize}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Limpar (Arquivar Relatório)
            </Button>
          )}
          {report.status !== 'finalizado' && (
            <Button 
              variant="outline" 
              className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
              onClick={handleSendWhatsApp}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar por WhatsApp
            </Button>
          )}
          {report.status === 'finalizado' && (
            <div className="flex-1 bg-green-100 text-green-800 p-3 rounded-lg flex items-center justify-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Visita Finalizada
            </div>
          )}
        </div>
      </main>
    </div>
  );
}