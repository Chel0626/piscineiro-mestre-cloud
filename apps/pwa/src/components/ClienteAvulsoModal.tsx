'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IMaskInput } from 'react-imask';
import { User, Wrench, DollarSign, FileText, CheckCircle, MessageCircle, Calendar, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useClients } from '@/hooks/useClients';

interface ClienteAvulsoModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingService?: any; // Serviço existente para finalizar
}

interface ClienteAvulsoData {
  nome: string;
  endereco: string;
  telefone: string;
  tipoServico: string;
  valor: number;
  descricaoServico?: string;
  // Campos técnicos
  equipamento?: string;
  cargaUtilizada?: string;
  problemaIdentificado?: string;
  solucaoAplicada?: string;
  pecasUtilizadas?: { nome: string; valor: number }[];
}

const tiposServico = [
  'Limpeza de piscina',
  'Troca de areia',
  'Manutenção hidráulica',
  'Outros'
];

export function ClienteAvulsoModal({ isOpen, onClose, existingService }: ClienteAvulsoModalProps) {
  const { user, tenant } = useAuth();
  const { clients } = useClients();
  const [piscineiroName, setPiscineiroName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();
            
          if (data) {
            setPiscineiroName(data.name || user.user_metadata?.name || 'Técnico');
          } else {
            setPiscineiroName(user.user_metadata?.name || 'Técnico');
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          setPiscineiroName(user.user_metadata?.name || 'Técnico');
        }
      }
    };
    fetchProfile();
  }, [user]);

  const [serviceMode, setServiceMode] = useState<'execute' | 'schedule'>('execute');
  const [scheduledDate, setScheduledDate] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('new');
  
  const [clienteData, setClienteData] = useState<ClienteAvulsoData>({
    nome: '',
    endereco: '',
    telefone: '',
    tipoServico: '',
    valor: 0,
    pecasUtilizadas: []
  });

  // Carregar dados do serviço existente se houver
  useEffect(() => {
    if (existingService && isOpen) {
      setClienteData({
        nome: existingService.name || existingService.nome || '',
        endereco: existingService.address || existingService.endereco || '',
        telefone: existingService.phone || existingService.telefone || '',
        tipoServico: existingService.tipoServico || existingService.serviceType || '',
        valor: existingService.valor || 0,
        pecasUtilizadas: existingService.pecasUtilizadas || [],
        equipamento: existingService.equipamento || '',
        cargaUtilizada: existingService.cargaUtilizada || '',
        problemaIdentificado: existingService.problemaIdentificado || '',
        solucaoAplicada: existingService.solucaoAplicada || '',
      });
      setRelatorioData({
        descricaoServico: existingService.descricaoServico || existingService.description || '',
      });
      setServiceMode('execute'); // Se já existe, estamos executando/finalizando
      setSelectedClientId(existingService.clientId || 'new');
    } else if (!existingService && isOpen) {
      // Resetar se for novo
      setClienteData({
        nome: '',
        endereco: '',
        telefone: '',
        tipoServico: '',
        valor: 0,
        pecasUtilizadas: []
      });
      setRelatorioData({
        descricaoServico: '',
      });
      setServiceMode('execute');
      setSelectedClientId('new');
    }
  }, [existingService, isOpen]);
  
  const [relatorioData, setRelatorioData] = useState({
    descricaoServico: '',
  });

  const [novaPeca, setNovaPeca] = useState({ nome: '', valor: '' });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [servicoConcluido, setServicoConcluido] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Cliente, 2: Serviço, 3: Finalização

  // Resetar step quando abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!clienteData.nome || !clienteData.endereco || !clienteData.telefone) {
        toast.error('Preencha os dados do cliente');
        return;
      }
      if (serviceMode === 'schedule' && !scheduledDate) {
        toast.error('Selecione a data do agendamento');
        return;
      }
    }
    if (currentStep === 2) {
      if (!clienteData.tipoServico) {
        toast.error('Selecione o tipo de serviço');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'new') {
      setClienteData(prev => ({
        ...prev,
        nome: '',
        endereco: '',
        telefone: ''
      }));
    } else {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setClienteData(prev => {
          const newData = {
            ...prev,
            nome: client.name,
            endereco: client.address,
            telefone: client.phone || ''
          };

          // Se já estiver selecionado Troca de areia, preencher dados do equipamento
          if (prev.tipoServico === 'Troca de areia') {
            if (client.filterModel) newData.equipamento = client.filterModel;
            if (client.filterSandKg) newData.cargaUtilizada = client.filterSandKg.toString();
          }

          return newData;
        });
      }
    }
  };

  const handleInputChange = (field: keyof ClienteAvulsoData, value: any) => {
    setClienteData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-preencher dados do equipamento se for Troca de areia e tiver cliente selecionado
      if (field === 'tipoServico' && value === 'Troca de areia' && selectedClientId !== 'new') {
        const client = clients.find(c => c.id === selectedClientId);
        if (client) {
          if (client.filterModel && !prev.equipamento) newData.equipamento = client.filterModel;
          if (client.filterSandKg && !prev.cargaUtilizada) newData.cargaUtilizada = client.filterSandKg.toString();
        }
      }
      
      return newData;
    });
  };

  const handleAddPeca = () => {
    if (novaPeca.nome && novaPeca.valor) {
      const pecas = clienteData.pecasUtilizadas || [];
      handleInputChange('pecasUtilizadas', [...pecas, { nome: novaPeca.nome, valor: Number(novaPeca.valor) }]);
      setNovaPeca({ nome: '', valor: '' });
    }
  };

  const handleRemovePeca = (index: number) => {
    const pecas = clienteData.pecasUtilizadas || [];
    handleInputChange('pecasUtilizadas', pecas.filter((_, i) => i !== index));
  };

  const handleRelatorioChange = (field: string, value: string | number) => {
    setRelatorioData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinalizarServico = async () => {
    if (!clienteData.nome || !clienteData.endereco || !clienteData.telefone || !clienteData.tipoServico || !clienteData.valor) {
      toast.error('Preencha todos os campos obrigatórios do cadastro');
      return;
    }

    if (serviceMode === 'schedule' && !scheduledDate) {
      toast.error('Selecione uma data para o agendamento');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Calcular próxima troca de areia se for o caso
      let nextSandChange = null;
      if (clienteData.tipoServico === 'Troca de areia') {
        const today = new Date();
        today.setMonth(today.getMonth() + 18); // 1 ano e meio
        nextSandChange = today.toISOString().split('T')[0];
      }

      // 1. Gerenciar Cliente (Criar ou Atualizar)
      let finalClientId = selectedClientId;

      // Se for um novo cliente (ou não selecionado), verificar se já existe pelo telefone ou criar
      if (finalClientId === 'new') {
        // Tentar encontrar cliente pelo telefone para evitar duplicidade
        const { data: existingClients } = await supabase
            .from('clients')
            .select('id')
            .eq('phone', clienteData.telefone)
            .eq('tenant_id', tenant?.id);

        if (existingClients && existingClients.length > 0) {
          // Cliente já existe, usar o ID dele
          finalClientId = existingClients[0].id;
        } else {
          // Criar novo cliente na coleção 'clients'
          const { data: newClient, error: createError } = await supabase
            .from('clients')
            .insert({
                user_id: user.id,
                worker_id: user.id, // Adicionado worker_id para que o worker possa ver o cliente
                tenant_id: tenant?.id,
                name: clienteData.nome,
                address: clienteData.endereco,
                phone: clienteData.telefone,
                neighborhood: '',
                pool_volume: 0,
                service_value: 0,
                visit_frequency: 'weekly',
                visit_days: [],
                payment_due_date: 10,
                type: 'ad-hoc'
            })
            .select()
            .single();
          
          if (createError) throw createError;
          finalClientId = newClient.id;
        }
      }

      // 2. Atualizar Equipamento do Cliente (Se for Troca de Areia)
      if (clienteData.tipoServico === 'Troca de areia' && finalClientId !== 'new') {
        await supabase
            .from('clients')
            .update({
                filter_model: clienteData.equipamento,
                filter_sand_kg: parseFloat(clienteData.cargaUtilizada?.replace(/\D/g, '') || '0'),
                last_sand_change: scheduledDate || new Date().toISOString().split('T')[0],
                next_sand_change: nextSandChange
            })
            .eq('id', finalClientId);
      }

      // 3. Salvar o Serviço (Histórico)
      const docData = {
        user_id: user.id,
        tenant_id: tenant?.id,
        name: clienteData.nome,
        address: clienteData.endereco,
        phone: clienteData.telefone,
        service_type: clienteData.tipoServico,
        service_value: clienteData.valor,
        ph: relatorioData.ph,
        chlorine: relatorioData.cloro,
        alkalinity: relatorioData.alcalinidade,
        service_description: relatorioData.descricaoServico,
        service_date: serviceMode === 'schedule' ? scheduledDate : new Date().toISOString(),
        month: new Date().toISOString().slice(0, 7),
        client_id: finalClientId !== 'new' ? finalClientId : null,
        details: {
            status: serviceMode === 'schedule' ? 'scheduled' : 'completed',
            scheduledDate: serviceMode === 'schedule' ? scheduledDate : null,
            nextSandChange,
            pecasUtilizadas: clienteData.pecasUtilizadas,
            equipamento: clienteData.equipamento,
            cargaUtilizada: clienteData.cargaUtilizada,
            problemaIdentificado: clienteData.problemaIdentificado,
            solucaoAplicada: clienteData.solucaoAplicada
        }
      };

      if (existingService) {
        // Atualizar serviço existente
        await supabase
            .from('ad_hoc_clients')
            .update(docData)
            .eq('id', existingService.id);
            
        toast.success('Serviço finalizado com sucesso!');
        setServicoConcluido(true);
      } else {
        // Criar novo serviço
        await supabase
            .from('ad_hoc_clients')
            .insert(docData);

        if (serviceMode === 'schedule') {
          toast.success('Serviço agendado com sucesso!');
          handleClose(); // Fecha direto se for agendamento
        } else {
          setServicoConcluido(true);
          toast.success('Serviço avulso registrado com sucesso!');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar serviço avulso:', error);
      toast.error('Erro ao registrar serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnviarWhatsApp = () => {
    if (!clienteData.telefone) {
      toast.error('Telefone não informado');
      return;
    }

    let message = '';

    if (clienteData.tipoServico === 'Troca de areia' || clienteData.tipoServico === 'Manutenção hidráulica') {
      // Relatório Técnico
      message += `🛠️ *RELATÓRIO DE SERVIÇO TÉCNICO*\n*MHM Piscinas & Serviços*\n\n`;
      message += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
      message += `👤 Técnico: ${piscineiroName}\n`;
      message += `📍 Cliente: ${clienteData.nome}\n\n`;
      
      message += `🔧 *SERVIÇO REALIZADO:* ${clienteData.tipoServico}\n\n`;
      
      message += `📋 *DETALHES TÉCNICOS:*\n`;
      if (clienteData.tipoServico === 'Troca de areia') {
        if (clienteData.equipamento) message += `Filtro: ${clienteData.equipamento}\n`;
        if (clienteData.cargaUtilizada) {
          // Verifica se é apenas número para adicionar o sufixo
          const isNumber = /^\d+$/.test(clienteData.cargaUtilizada.trim());
          const cargaTexto = isNumber ? `${clienteData.cargaUtilizada} kg de areia para filtro de piscinas` : clienteData.cargaUtilizada;
          message += `Material: ${cargaTexto}\n`;
        }
      }
      
      if (clienteData.tipoServico === 'Manutenção hidráulica') {
        if (clienteData.problemaIdentificado) message += `Problema: ${clienteData.problemaIdentificado}\n`;
        if (clienteData.solucaoAplicada) message += `Solução: ${clienteData.solucaoAplicada}\n`;
        if (clienteData.pecasUtilizadas && clienteData.pecasUtilizadas.length > 0) {
          message += `\nPeças Utilizadas:\n`;
          clienteData.pecasUtilizadas.forEach(peca => {
            message += `- ${peca.nome}: R$ ${peca.valor.toFixed(2)}\n`;
          });
        }
      }

      message += `\n💰 *Valor Total:* R$ ${clienteData.valor.toFixed(2)}\n`;

      if (relatorioData.descricaoServico) {
        message += `\n✅ *SITUAÇÃO:* ${relatorioData.descricaoServico}\n`;
      }

      message += `\n🛡️ *GARANTIA E PRÓXIMA MANUTENÇÃO:*\nEste serviço tem garantia de 90 dias sobre a mão de obra.\n`;
      
      if (clienteData.tipoServico === 'Troca de areia') {
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 18);
        const monthYear = nextDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        message += `\n🔄 Próxima Troca Recomendada: ${monthYear} (Já agendamos um lembrete para você!)\n`;
      }

    } else {
      // Relatório Padrão (Limpeza)
      message += `🏊‍♂️ *Relatório de Serviço - ${clienteData.nome}*\n\n`;
      message += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
      message += `📍 Endereço: ${clienteData.endereco}\n`;
      message += `🔧 Serviço: ${clienteData.tipoServico}\n`;
      message += `💰 Valor: R$ ${clienteData.valor.toFixed(2)}\n\n`;
      
      if (relatorioData.descricaoServico) {
        message += `📝 *Descrição do Serviço:*\n${relatorioData.descricaoServico}\n\n`;
      }
      
      message += `\n\n✅ Serviço realizado com sucesso!`;
    }
    
    message += `\n\nEnviado via Piscineiro Mestre App`;

    const phoneNumber = clienteData.telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp aberto com o relatório!');
  };

  const handleClose = () => {
    setClienteData({
      nome: '',
      endereco: '',
      telefone: '',
      tipoServico: '',
      valor: 0,
      pecasUtilizadas: []
    });
    setRelatorioData({
      descricaoServico: '',
    });
    setServicoConcluido(false);
    setServiceMode('execute');
    setScheduledDate('');
    setSelectedClientId('new');
    // Não chamamos onClose aqui se estivermos apenas limpando o form, mas sim se o modal for fechar
    if (onClose) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {existingService ? 'Finalizar Serviço' : 'Novo Serviço Avulso'}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 1 && "Passo 1: Identificação do Cliente"}
            {currentStep === 2 && "Passo 2: Detalhes do Serviço"}
            {currentStep === 3 && "Passo 3: Valores e Finalização"}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper Visual */}
        <div className="flex items-center justify-center mb-6">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'} font-bold text-sm`}>1</div>
          <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'} font-bold text-sm`}>2</div>
          <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'} font-bold text-sm`}>3</div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-1">
          {/* Passo 1: Cliente e Agendamento */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Seleção de Modo - Apenas se não for serviço existente */}
              {!existingService && (
                <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="execute"
                      name="serviceMode"
                      checked={serviceMode === 'execute'}
                      onChange={() => setServiceMode('execute')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="execute" className="cursor-pointer dark:text-gray-200">Execução Imediata</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="schedule"
                      name="serviceMode"
                      checked={serviceMode === 'schedule'}
                      onChange={() => setServiceMode('schedule')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="schedule" className="cursor-pointer dark:text-gray-200">Agendamento</Label>
                  </div>
                </div>
              )}

              {/* Data de Agendamento */}
              {serviceMode === 'schedule' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Label htmlFor="scheduledDate" className="flex items-center gap-2 mb-2 text-blue-800 dark:text-blue-300">
                    <Calendar className="h-4 w-4" />
                    Data do Agendamento *
                  </Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-white dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
              )}

              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 space-y-4">
                <h3 className="font-medium flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <User className="h-4 w-4" />
                  Dados do Cliente
                </h3>
                
                {/* Seleção de Cliente Existente - Apenas se não for serviço existente */}
                {!existingService && (
                  <>
                    <div>
                      <Label htmlFor="clientSelect">Selecionar Cliente (Opcional)</Label>
                      <Select value={selectedClientId} onValueChange={handleClientSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente ou crie novo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">➕ Novo Cliente / Não Cadastrado</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">Ou preencha manualmente</span>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={clienteData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="João Silva"
                  />
                </div>
                
                <div>
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input
                    id="endereco"
                    value={clienteData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    placeholder="Rua das Flores, 123"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <IMaskInput
                    mask="(00) 00000-0000"
                    value={clienteData.telefone}
                    unmask={true}
                    onAccept={(value) => handleInputChange('telefone', value)}
                    placeholder="(19) 99999-9999"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Passo 2: Serviço */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 space-y-4">
                <h3 className="font-medium flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <Wrench className="h-4 w-4" />
                  Detalhes do Serviço
                </h3>

                <div>
                  <Label htmlFor="tipoServico">Tipo de Serviço *</Label>
                  <Select onValueChange={(value) => handleInputChange('tipoServico', value)} value={clienteData.tipoServico}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposServico.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos Específicos para Troca de Areia */}
                {clienteData.tipoServico === 'Troca de areia' && (
                  <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                    <h4 className="font-medium text-orange-800 dark:text-orange-300 flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Detalhes da Troca de Areia
                    </h4>
                    
                    <div>
                      <Label htmlFor="equipamento">Equipamento (Filtro)</Label>
                      <Input
                        id="equipamento"
                        value={clienteData.equipamento || ''}
                        onChange={(e) => handleInputChange('equipamento', e.target.value)}
                        placeholder="Ex: Sibrape BR-40"
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cargaUtilizada">Carga Utilizada (kg)</Label>
                      <div className="relative">
                        <Input
                          id="cargaUtilizada"
                          value={clienteData.cargaUtilizada || ''}
                          onChange={(e) => handleInputChange('cargaUtilizada', e.target.value)}
                          placeholder="Ex: 150"
                          className="pr-12 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 dark:text-gray-400">
                          kg
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 p-2 rounded">
                      ℹ️ A próxima troca será calculada automaticamente para daqui a 1 ano e meio.
                    </div>
                  </div>
                )}

                {/* Campos Específicos para Manutenção Hidráulica */}
                {clienteData.tipoServico === 'Manutenção hidráulica' && (
                  <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Detalhes do Reparo
                    </h4>
                    
                    <div>
                      <Label htmlFor="problemaIdentificado">Problema Identificado</Label>
                      <Textarea
                        id="problemaIdentificado"
                        value={clienteData.problemaIdentificado || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('problemaIdentificado', e.target.value)}
                        placeholder="Ex: Vazamento no registro de retorno"
                        rows={2}
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <Label htmlFor="solucaoAplicada">Solução Aplicada</Label>
                      <Textarea
                        id="solucaoAplicada"
                        value={clienteData.solucaoAplicada || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('solucaoAplicada', e.target.value)}
                        placeholder="Ex: Substituição do anel de vedação e luva de união"
                        rows={2}
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block">Peças Utilizadas</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Nome da peça"
                          value={novaPeca.nome}
                          onChange={(e) => setNovaPeca(prev => ({ ...prev, nome: e.target.value }))}
                          className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                        <Input
                          type="number"
                          placeholder="Valor (R$)"
                          value={novaPeca.valor}
                          onChange={(e) => setNovaPeca(prev => ({ ...prev, valor: e.target.value }))}
                          className="w-24 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                        <Button type="button" onClick={handleAddPeca} size="sm" variant="secondary">
                          Adicionar
                        </Button>
                      </div>
                      
                      {clienteData.pecasUtilizadas && clienteData.pecasUtilizadas.length > 0 && (
                        <ul className="space-y-1 bg-white dark:bg-gray-800 p-2 rounded border border-blue-100 dark:border-blue-800">
                          {clienteData.pecasUtilizadas.map((peca, index) => (
                            <li key={index} className="flex justify-between items-center text-sm p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                              <span className="dark:text-gray-200">{peca.nome}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium dark:text-gray-200">R$ {peca.valor.toFixed(2)}</span>
                                <button 
                                  onClick={() => handleRemovePeca(index)}
                                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                >
                                  ×
                                </button>
                              </div>
                            </li>
                          ))}
                          <li className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between font-bold text-sm dark:text-gray-200">
                            <span>Total Peças:</span>
                            <span>R$ {clienteData.pecasUtilizadas.reduce((acc, curr) => acc + curr.valor, 0).toFixed(2)}</span>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Passo 3: Finalização */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {servicoConcluido ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-300">Serviço Registrado!</h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md">
                    O serviço foi salvo com sucesso. Você pode enviar o relatório para o cliente agora.
                  </p>
                  <Button 
                    onClick={handleEnviarWhatsApp}
                    className="bg-green-600 hover:bg-green-700 text-white w-full max-w-xs flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar Relatório no WhatsApp
                  </Button>
                  <Button variant="outline" onClick={handleClose} className="mt-2">
                    Fechar
                  </Button>
                </div>
              ) : (
                <>
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 space-y-4">
                    <h3 className="font-medium flex items-center gap-2 text-gray-700 dark:text-gray-200">
                      <DollarSign className="h-4 w-4" />
                      Valores e Observações
                    </h3>

                    <div>
                      <Label htmlFor="valor">Valor Total do Serviço *</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-green-700 dark:text-green-400 font-bold">
                          R$
                        </div>
                        <IMaskInput
                          id="valor"
                          mask={Number}
                          radix=","
                          mapToRadix={['.']}
                          thousandsSeparator="."
                          scale={2}
                          padFractionalZeros={true}
                          normalizeZeros={true}
                          value={String(clienteData.valor)}
                          unmask={true}
                          onAccept={(value) => handleInputChange('valor', Number(value))}
                          placeholder="0,00"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-bold text-green-700 dark:text-green-400 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="descricaoServico">Observações / Relatório (Opcional)</Label>
                      <Textarea
                        id="descricaoServico"
                        value={relatorioData.descricaoServico}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleRelatorioChange('descricaoServico', e.target.value)}
                        placeholder="Descreva os procedimentos realizados ou observações importantes..."
                        rows={4}
                        className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800 text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-bold mb-1">Resumo:</p>
                    <p>Cliente: {clienteData.nome}</p>
                    <p>Serviço: {clienteData.tipoServico}</p>
                    <p>Valor: R$ {clienteData.valor.toFixed(2)}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer com Botões de Navegação */}
        {!servicoConcluido && (
          <div className="flex justify-between pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? handleClose : handlePrevStep}
            >
              {currentStep === 1 ? 'Cancelar' : 'Voltar'}
            </Button>

            {currentStep < 3 ? (
              <Button onClick={handleNextStep}>
                Próximo
              </Button>
            ) : (
              <Button 
                onClick={handleFinalizarServico} 
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'Salvando...' : (serviceMode === 'schedule' ? 'Agendar Serviço' : 'Finalizar Serviço')}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}