'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { IMaskInput } from 'react-imask';
import { UseFormReturn } from 'react-hook-form';
import { ClientFormData } from '@piscineiro/shared';
import React from 'react';
import { format, addMonths, parseISO } from 'date-fns'; // Ferramentas de Data

interface ClientFormProps {
  form: UseFormReturn<ClientFormData>; 
  onSubmit: (data: ClientFormData) => void;
}

export function ClientForm({ form, onSubmit }: ClientFormProps) {
  const daysOfWeek = [
    'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
    'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'
  ];

  // Observa o tipo de plano atual em tempo real para alterar o texto do label dinamicamente
  const currentPlan = form.watch('planType');

  // Auto-cálculos assistidos por IA
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      
      // 1. Calcula a Frequência baseado nos dias clicados
      if (name === 'visitDays') {
        const selectedDaysCount = value.visitDays?.length || 0;
        let frequency: 'weekly' | 'biweekly' | 'monthly' = 'weekly';
        
        if (selectedDaysCount === 2) {
          frequency = 'biweekly';
        } else if (selectedDaysCount >= 3) {
          frequency = 'monthly';
        }
        form.setValue('visitFrequency', frequency);
      }

      // 2. A MÁGICA DA RENOVAÇÃO: Calcula a próxima data de renovação
      if (name === 'contractStartDate' || name === 'planType') {
        const startDateStr = form.getValues('contractStartDate');
        const plan = form.getValues('planType');

        if (startDateStr && plan) {
          try {
            const startDate = parseISO(startDateStr);
            let monthsToAdd = 1; // Padrão Mensal

            if (plan === 'semestral') monthsToAdd = 6;
            if (plan === 'anual') monthsToAdd = 12;

            const renewalDate = addMonths(startDate, monthsToAdd);
            form.setValue('nextRenewalDate', format(renewalDate, 'yyyy-MM-dd'));
          } catch (e) {
            console.error("Data inválida digitada");
          }
        }
      }

    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Form {...form}>
      <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do Cliente" {...field} className="text-sm" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua das Flores, 123" {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="neighborhood"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Bairro / Condomínio</FormLabel>
                <FormControl>
                  <Input placeholder="Centro" {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Telefone (WhatsApp)</FormLabel>
                <FormControl>
                  <IMaskInput
                    mask="(00) 00000-0000"
                    value={value}
                    unmask={true}
                    onAccept={(value) => onChange(value)}
                    placeholder="(11) 99999-9999"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="poolVolume"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Volume da Piscina (m³)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Ex: 45" 
                    {...field} 
                    value={field.value === undefined || field.value === 0 ? '' : field.value}
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    className="text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="visitDays"
          render={() => (
            <FormItem>
              <div className="mb-2">
                <FormLabel className="text-sm font-medium">Dias de Visita</FormLabel>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <FormField
                    key={day}
                    control={form.control}
                    name="visitDays"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={day}
                          className="flex flex-row items-start space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(day)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, day])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== day
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-xs sm:text-sm cursor-pointer">
                            {day}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <FormField
                control={form.control}
                name="serviceValue"
                render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                    {/* LABEL DINÂMICO BASEADO NO PLANO */}
                    <FormLabel className="text-sm font-medium">
                      {currentPlan === 'semestral' ? 'Valor Total do Contrato (Semestral)' :
                       currentPlan === 'anual' ? 'Valor Total do Contrato (Anual)' : 
                       'Valor da Mensalidade'}
                    </FormLabel>
                    <FormControl>
                    <IMaskInput
                        mask="R$ num"
                        blocks={{
                            num: {
                                mask: Number,
                                thousandsSeparator: '.',
                                radix: ',',
                                scale: 2,
                                padFractionalZeros: true,
                                normalizeZeros: true,
                                mapToRadix: ['.']
                            }
                        }}
                        value={value ? String(value) : ''}
                        unmask={true}
                        onAccept={(value) => {
                            const numericValue = Number(value.replace(',', '.'));
                            onChange(isNaN(numericValue) ? 0 : numericValue);
                        }}
                        placeholder="R$ 0,00"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="paymentDueDate"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-sm font-medium">Dia de Vencimento</FormLabel>
                    <FormControl>
                    <Input 
                        type="number" 
                        min={1}
                        max={31}
                        placeholder="Ex: 10" 
                        {...field} 
                        onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        className="text-sm"
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        {/* NOVO BLOCO: Tipo de Plano e Datas de Contrato */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 border-t border-border pt-4 mt-2">
            
            <FormField
              control={form.control}
              name="planType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Tipo de Plano</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Início do Contrato</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextRenewalDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Data de Renovação</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      className="text-sm bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 cursor-not-allowed" 
                      disabled 
                      title="Calculado automaticamente baseado no Tipo de Plano"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

        </div>

      </form>
    </Form>
  );
}