'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  Clock, 
  MessageCircle, 
  User, 
  Calendar,
  ShoppingCart,
  MapPin,
  Calculator
} from "lucide-react";
import { Header } from "@/components/Header";
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface ProductRequest {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  products: any[]; // JSONB
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  provided_by?: 'empresa' | 'cliente';
  created_at: string;
  request_date: string;
  user_id: string;
  visit_id: string;
  profiles?: {
    name: string;
  };
  clients?: {
    name: string;
    address: string;
    phone: string;
  };
}

export default function ProductRequestsPage() {
  const router = useRouter();
  const { tenant } = useAuth();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [catalogue, setCatalogue] = useState<any[]>([]); // Estado para guardar os preços dos produtos
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!tenant) return;
    
    try {
      // 1. Busca as solicitações
      const { data: requestsData, error: reqError } = await supabase
        .from('product_requests')
        .select(`
          *,
          profiles:profiles(name),
          clients (name, address, phone)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;
      setRequests(requestsData as any || []);

      // 2. Busca o catálogo de produtos para pegar os preços atualizados
      const { data: productsData, error: prodError } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('tenant_id', tenant.id);
        
      if (!prodError && productsData) {
        setCatalogue(productsData);
      }

    } catch (error: any) {
      console.error('Erro ao buscar solicitações:', JSON.stringify(error, null, 2));
      toast.error(`Erro ao carregar solicitações: ${error.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para descobrir o preço do item cruzando com o catálogo
  const getItemPrice = (product: any) => {
    if (typeof product === 'object' && product.price !== undefined) return Number(product.price);
    const name = typeof product === 'object' ? product.name : product;
    const catItem = catalogue.find(p => p.name === name);
    return catItem ? Number(catItem.price) : 0;
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected', providedBy?: 'empresa' | 'cliente') => {
    try {
      const updateData: any = { 
        status, 
        approval_date: status === 'approved' ? new Date().toISOString() : null 
      };

      if (providedBy) {
        updateData.provided_by = providedBy;
      }

      const { error } = await supabase
        .from('product_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      let successMsg = status === 'approved' ? 'Solicitação aprovada!' : 'Solicitação rejeitada';
      if (providedBy) successMsg += ` (${providedBy === 'empresa' ? 'Empresa' : 'Cliente'} providenciará)`;
      
      toast.success(successMsg);
      fetchRequests();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar solicitação');
    }
  };

  const handleSendWhatsApp = (request: ProductRequest) => {
    const phone = request.clients?.phone || request.client_phone;
    if (!phone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const clientName = request.client_name || request.clients?.name || 'Cliente';
    const products = request.products || [];

    let message = `Olá, ${clientName}, espero encontrar-lhe bem!\n`;
    message += `Abaixo está a relação de produtos necessários para a próxima manutenção da sua piscina:\n\n`;
    
    let total = 0;
    
    products.forEach((product: any) => {
      const name = typeof product === 'object' ? product.name : product;
      const qty = typeof product === 'object' ? (product.quantity || 1) : 1;
      const price = getItemPrice(product);
      const itemTotal = price * qty;
      
      total += itemTotal;
      
      const formattedItemTotal = itemTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      message += `✅ ${qty}x ${name} - ${formattedItemTotal}\n`;
    });
    
    const formattedTotal = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    message += `\n*Total estimado: ${formattedTotal}*\n`;
    message += `\nPosso providenciar os produtos e enviar o link de pagamento, ou você prefere comprá-los por conta própria?`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCompleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('product_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Solicitação concluída!');
      fetchRequests();
    } catch (error) {
      console.error('Erro ao concluir solicitação:', error);
      toast.error('Erro ao concluir solicitação');
    }
  };

  const handleClearCompleted = async () => {
    if (!tenant) return;
    if (!confirm('Tem certeza que deseja excluir todas as solicitações finalizadas e rejeitadas?')) return;

    try {
      const { error } = await supabase
        .from('product_requests')
        .delete()
        .eq('tenant_id', tenant.id)
        .in('status', ['completed', 'rejected']);

      if (error) throw error;
      
      toast.success('Solicitações limpas com sucesso!');
      fetchRequests();
    } catch (error) {
      console.error('Erro ao limpar solicitações:', error);
      toast.error('Erro ao limpar solicitações');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [tenant]);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const completedRequests = requests.filter(r => r.status === 'rejected' || (r as any).status === 'completed');

  const RequestCard = ({ request }: { request: ProductRequest }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle2, label: 'Aprovado' },
      rejected: { color: 'bg-red-100 text-red-800', icon: X, label: 'Rejeitado' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Concluído' }
    };
    
    const config = statusConfig[request.status] || statusConfig.pending;
    const StatusIcon = config.icon;

    // Calcula o total geral da solicitação
    const requestTotal = (request.products || []).reduce((acc, curr) => {
        const qty = typeof curr === 'object' ? (curr.quantity || 1) : 1;
        const price = getItemPrice(curr);
        return acc + (price * qty);
    }, 0);

    return (
      <Card className={`border-l-4 ${
        request.status === 'pending' ? 'border-l-yellow-500' : 
        request.status === 'approved' ? 'border-l-blue-500' :
        request.status === 'rejected' ? 'border-l-red-500' : 'border-l-green-500'
      }`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                {request.client_name || request.clients?.name}
              </CardTitle>
              <CardDescription className="text-xs space-y-0.5 mt-1">
                {request.clients?.address && (
                  <div className="text-gray-600 flex items-start gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5 text-gray-500" />
                    <span>{request.clients.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(request.created_at).toLocaleDateString('pt-BR')}
                </div>
              </CardDescription>
            </div>
            <Badge className={config.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-slate-700">Produtos Solicitados</span>
            </div>
            <div className="space-y-2">
              {(request.products || []).map((product: any, index: number) => {
                const name = typeof product === 'object' ? product.name : product;
                const qty = typeof product === 'object' ? (product.quantity || 1) : 1;
                const price = getItemPrice(product);
                const itemTotal = price * qty;
                
                return (
                  <div 
                    key={index} 
                    className="flex flex-col bg-card rounded-md px-3 py-2 text-sm shadow-sm border border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{name}</span>
                      </div>
                      <span className="font-bold text-slate-700">
                         {itemTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    {/* Linha com Detalhe do Preço Unitário e Quantidade */}
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{qty} {qty > 1 ? 'unidades' : 'unidade'}</span>
                        <span>{price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} un</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* TOTAL DO PEDIDO */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
               <div className="flex items-center gap-1 text-slate-600">
                   <Calculator className="h-4 w-4" />
                   <span className="text-sm font-semibold">Total Estimado</span>
               </div>
               <span className="text-base font-bold text-blue-700">
                   {requestTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
               </span>
            </div>

          </div>

          {/* Technician Info */}
          {request.profiles?.name && (
            <div className="text-xs text-muted-foreground">
              Solicitado por: <span className="font-medium">{request.profiles.name}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-0">
          {request.status === 'pending' && (
            <>
              <Button 
                variant="outline"
                size="sm" 
                className="w-full border-green-600 text-green-600 hover:bg-green-50"
                onClick={() => handleSendWhatsApp(request)}
              >
                <MessageCircle className="mr-1 h-3 w-3" /> WhatsApp c/ Orçamento
              </Button>
              <div className="flex gap-2 w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Aprovar <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px] p-2">
                    <DropdownMenuItem 
                      onClick={() => handleUpdateStatus(request.id, 'approved', 'empresa')}
                      className="cursor-pointer focus:bg-green-50 focus:text-green-700 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">🏢 Empresa</span>
                        <span className="text-[10px] text-muted-foreground">Empresa leva e cobra</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleUpdateStatus(request.id, 'approved', 'cliente')}
                      className="cursor-pointer focus:bg-blue-50 focus:text-blue-700 py-2 mt-1"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">🏠 Cliente</span>
                        <span className="text-[10px] text-muted-foreground">Cliente providenciará</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  variant="outline"
                  size="sm" 
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => handleUpdateStatus(request.id, 'rejected')}
                >
                  <X className="mr-1 h-3 w-3" /> Rejeitar
                </Button>
              </div>
            </>
          )}
          {request.status === 'approved' && (
            <>
              <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-xs font-bold text-blue-700 uppercase">
                  {request.provided_by === 'empresa' ? '🏢 Empresa Providencia' : '🏠 Cliente Providencia'}
                </span>
              </div>
              <Button 
                size="sm" 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => handleCompleteRequest(request.id)}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Concluir Entrega
              </Button>
            </>
          )}
          {(request.status === 'rejected' || (request as any).status === 'completed') && (
            <Button 
              variant="outline"
              size="sm" 
              className="w-full"
              onClick={() => handleSendWhatsApp(request)}
            >
              <MessageCircle className="mr-1 h-3 w-3" /> Reenviar WhatsApp
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 space-y-6 container mx-auto max-w-7xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-7 w-7 text-blue-600" />
              Solicitações de Produtos
            </h1>
            <p className="text-sm text-muted-foreground">
              {pendingRequests.length} pendente(s) • {approvedRequests.length} aprovado(s)
            </p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="flex items-center gap-1 text-xs sm:text-sm">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Pendentes</span> ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-1 text-xs sm:text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Aprovados</span> ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1 text-xs sm:text-sm">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Finalizados</span> ({completedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <p className="col-span-full text-center py-8">Carregando solicitações...</p>
              ) : pendingRequests.length === 0 ? (
                <Card className="col-span-full p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Nenhuma solicitação pendente!</p>
                </Card>
              ) : (
                pendingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="approved">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <p className="col-span-full text-center py-8">Carregando solicitações...</p>
              ) : approvedRequests.length === 0 ? (
                <Card className="col-span-full p-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <p>Nenhuma solicitação aprovada aguardando.</p>
                </Card>
              ) : (
                approvedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-4">
              {completedRequests.length > 0 && (
                <div className="flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={handleClearCompleted}
                  >
                    <X className="mr-2 h-4 w-4" /> Limpar Tudo
                  </Button>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                  <p className="col-span-full text-center py-8">Carregando solicitações...</p>
                ) : completedRequests.length === 0 ? (
                  <Card className="col-span-full p-8 text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Nenhuma solicitação finalizada.</p>
                  </Card>
                ) : (
                  completedRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
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