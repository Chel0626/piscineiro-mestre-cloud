'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitForm, VisitFormData } from '@/components/VisitForm';
import { ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';

interface CheckoutModalProps {
  clientId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (photoUrl?: string | null) => void;
}

export function CheckoutModal({ clientId, isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { client, isLoading } = useClientDetails(clientId);
  const { tenant, role } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ visit: true });
  const [visitData, setVisitData] = useState<VisitFormData | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleVisitSubmit = async (data: VisitFormData, structuredProducts?: any[], structuredRequestedProducts?: any[], photoBlob?: Blob | null, existingProductRequestId?: string | null) => {
    if (!clientId || !client) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado.");
        return;
      }

      // Upload da foto se existir
      let photoUrl: string | null = null;
      if (photoBlob) {
        const fileName = `pool-photos/${(client as any).tenant_id}/${clientId}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('diagnostics')
          .upload(fileName, photoBlob, {
            cacheControl: '3600',
            contentType: 'image/jpeg',
            upsert: false
          });
        if (uploadError) {
          console.error('Erro no upload da foto:', uploadError);
          toast.error('Erro ao salvar foto, mas a visita será registrada.');
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('diagnostics')
            .getPublicUrl(fileName);
          photoUrl = publicUrl;
        }
      }

      // 1. Create Visit
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .insert({
          client_id: clientId,
          tenant_id: (client as any)?.tenant_id || tenant?.id,
          user_id: user.id,
          date: new Date().toISOString(),
          status: 'pending_review',
          water_condition: data.waterCondition,
          ph: data.ph,
          chlorine: data.cloro,
          alkalinity: data.alcalinidade,
          chlorine_type: data.chlorineType,
          days_until_next: data.daysUntilNext,
          products_used: data.productsUsed,
          checklist: data.checklist,
          products_to_request: data.productsToRequest,
          description: data.notes, 
          departure_time: data.departureTime,
          photo_url: photoUrl
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // 2. Create or Update Product Request
      let createdProductRequest = false;
      const prepareProductRequest = (products: any[]) => ({
        tenant_id: (client as any)?.tenant_id || tenant?.id,
        client_id: clientId,
        user_id: user.id,
        client_name: client.name,
        products: products,
        status: (role === 'solo' || role === 'owner') ? 'approved' : 'pending',
        request_date: new Date().toISOString(),
        visit_id: visit.id
      });

      const productsToSave: any[] = [];
      if (structuredRequestedProducts && structuredRequestedProducts.length > 0) {
        const mappedProducts = structuredRequestedProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity
        }));
        productsToSave.push(...mappedProducts);
      }

      if (productsToSave.length > 0) {
        const payload = prepareProductRequest(productsToSave);

        if (existingProductRequestId) {
          const { error: requestError } = await supabase
            .from('product_requests')
            .update(payload)
            .eq('id', existingProductRequestId);
          
          if (requestError) {
            console.error("Error updating product request:", requestError);
            toast.error("Erro ao atualizar solicitação de produtos.");
          } else {
            toast.success('Solicitação de produtos atualizada!');
            createdProductRequest = true;
          }
        } else {
          const { error: requestError } = await supabase
            .from('product_requests')
            .insert(payload);
            
          if (requestError) {
            console.error("Error creating product request:", requestError);
            toast.error("Erro ao criar solicitação de produtos.");
          } else {
            toast.success('Solicitação de produtos salva!');
            createdProductRequest = true;
          }
        }
      }

      // 3. Update Client
      const today = new Date().toISOString().split('T')[0];
      const clientUpdate: any = {
        last_visit_date: today,
        visit_status: 'completed',
        chlorine_type: data.chlorineType
      };

      if (data.chlorineType === 'peroxido') {
        const currentStartDate = (client as any).peroxideStartDate;
        if (!currentStartDate) {
           clientUpdate.peroxide_start_date = today;
        } else {
           const startDate = new Date(currentStartDate);
           const diffTime = new Date().getTime() - startDate.getTime();
           const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
           
           if (diffDays > 21) {
             clientUpdate.peroxide_start_date = today;
           }
        }
      } else {
        clientUpdate.peroxide_start_date = null;
      }

      await supabase
        .from('clients')
        .update(clientUpdate)
        .eq('id', clientId);

      // ====================================================================
      // 4. DISPARO DA NOTIFICAÇÃO PUSH 
      // ====================================================================
      try {
        console.log('Disparando notificação push para o cliente...');
        const { error: pushError } = await supabase.functions.invoke('notificar-cliente', {
          body: {
            clientId: clientId,
            titulo: '💦 Manutenção Concluída!',
            mensagem: 'O piscineiro acabou de finalizar a visita. Clique aqui para ver o relatório completo e as fotos!',
            description: data.notes, 
            url: '/'
          }
        });
        
        if (pushError) {
          console.error('A Edge Function retornou um erro:', pushError);
        } else {
          console.log('Sinal de Push enviado com sucesso para a nuvem!');
        }
      } catch (pushException) {
        console.error('Falha na comunicação com a Edge Function:', pushException);
      }

      setVisitData({
        ...data,
        photo_url: photoUrl
      } as any);
      
      toast.success('Check-out realizado com sucesso!');
      if (onSuccess) {
        onSuccess(photoUrl);
      }
      return photoUrl; 
    } catch (error: any) {
      console.error('Erro ao salvar visita:', error);
      toast.error(error.message || 'Não foi possível realizar o check-out.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setVisitData(null);
    setOpenSections({});
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
            <DialogDescription>Aguarde enquanto carregamos os dados.</DialogDescription>
          </DialogHeader>
          <div className="p-6">Carregando dados do cliente...</div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!client) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Cliente não encontrado</DialogTitle>
            <DialogDescription>O cliente solicitado não foi encontrado.</DialogDescription>
          </DialogHeader>
          <div className="p-6">Não foi possível carregar os dados do cliente.</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-700 dark:text-blue-300">
            Check-out - {client.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            {client.address} • {client.neighborhood}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-1">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleSection('visit')}
            >
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Registrar Nova Visita
                </div>
                {openSections.visit ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </CardTitle>
            </CardHeader>
            {openSections.visit && (
              <CardContent>
                <VisitForm
                  onSubmit={handleVisitSubmit}
                  isLoading={isSubmitting}
                  clientId={clientId}
                  onFinish={handleClose}
                />
              </CardContent>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}