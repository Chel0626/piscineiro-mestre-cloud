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
import { Label } from '@/components/ui/label';
import { IMaskInput } from 'react-imask';
import { UseFormReturn } from 'react-hook-form';
// Importamos nosso tipo unificado
import { ClientFormData } from '@/lib/validators/clientSchema';
import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { format } from 'date-fns';

interface ClientFormProps {
  // O formulário e a função de submit agora usam o mesmo tipo
  form: UseFormReturn<ClientFormData>; 
  onSubmit: (data: ClientFormData) => void;
}

export function ClientForm({ form, onSubmit }: ClientFormProps) {
  const { role } = useAuth();
  const isWorker = role === 'worker';

  const daysOfWeek = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo'
  ];
    // Sugestões automáticas baseadas em mudanças no formulário
    React.useEffect(() => {
      const subscription = form.watch((value, { name }) => {
        // Frequência de visitas automática
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
                <Input placeholder="John Doe" {...field} className="text-sm" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Grid responsivo: 1 coluna no mobile, 2 colunas no desktop */}
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
                  <Input placeholder="Condomínio Azul" {...field} className="text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Telefone</FormLabel>
              <FormControl>
                <IMaskInput
                  mask="(00) 00000-0000"
                  value={field.value || ''}
                  unmask={true}
                  onAccept={(value) => field.onChange(value)}
                  placeholder="(19) 99999-9999"
                  className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="poolVolume"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Volume da Piscina (m³)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="30" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    value={field.value}
                    className="text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {!isWorker && (
            <FormField
              control={form.control}
              name="paymentDueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Dia do Vencimento</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={31} 
                      placeholder="10" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {!isWorker && (
            <FormField
              control={form.control}
              name="serviceValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="250"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      value={field.value}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Dias da semana das visitas */}
        <div className="mt-4">
          <FormField
            control={form.control}
            name="visitDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Dia(s) da semana das visitas</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-2">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="flex items-center space-x-2 bg-muted/50 p-2 rounded-md">
                        <Checkbox
                          id={day}
                          checked={field.value?.includes(day) || false}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...(field.value || []), day]);
                            } else {
                              field.onChange(field.value?.filter((d: string) => d !== day) || []);
                            }
                          }}
                        />
                        <Label htmlFor={day} className="text-sm cursor-pointer flex-1 py-1">{day}</Label>
                      </div>
                    ))}
                  </div>
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