import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { format } from 'date-fns';
import { toast } from 'sonner';

export interface FinancialData {
  contract_start_date: string;
  service_value: number;
  payment_due_date: number;
  last_adjustment_date?: string;
  chlorine_type?: string;
}

interface FinancialCardProps {
  data: FinancialData;
  onSave: (data: Partial<FinancialData>) => Promise<void>;
}

const TREATMENT_METHODS: Record<string, string> = {
  'multiacao': 'Cloro Multiação',
  'estabilizado': 'Cloro Estabilizado',
  'hipoclorito': 'Hipoclorito',
  'gerador': 'Gerador de Cloro',
  'peroxido': 'Peróxido'
};

export function FinancialCard({ data, onSave }: FinancialCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  
  const [editData, setEditData] = useState<Partial<FinancialData>>({
    contract_start_date: data.contract_start_date,
    service_value: data.service_value,
    payment_due_date: data.payment_due_date,
    chlorine_type: data.chlorine_type
  });

  const [inflationRate, setInflationRate] = useState(4.5);
  const [adjustedValue, setAdjustedValue] = useState(data.service_value);

  const handleCalculateAdjustment = (rate: number) => {
    setInflationRate(rate);
    const newVal = data.service_value * (1 + rate / 100);
    setAdjustedValue(Number(newVal.toFixed(2)));
  };

  const handleSaveEdit = async () => {
    await onSave(editData);
    setIsEditing(false);
  };

  const handleApplyAdjustment = async () => {
    await onSave({ 
        service_value: adjustedValue,
        last_adjustment_date: new Date().toISOString().split('T')[0]
    });
    setIsAdjustmentOpen(false);
    toast.success('Valor reajustado com sucesso!');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium text-emerald-900">Financeiro</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => {
          setEditData({
            contract_start_date: data.contract_start_date,
            service_value: Number(data.service_value),
            payment_due_date: data.payment_due_date
          });
          setIsEditing(true);
        }}>
          <Edit className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              Início do Contrato
            </div>
            <div className="font-medium">
                {data.contract_start_date ? format(new Date(data.contract_start_date), 'dd/MM/yyyy') : '-'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <DollarSign className="mr-1 h-3 w-3" />
              Dia de Vencimento
            </div>
            <div className="font-medium">Todo dia {data.payment_due_date || '-'}</div>
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex items-center text-xs text-muted-foreground">
              Tratamento
            </div>
            <div className="font-medium">{TREATMENT_METHODS[data.chlorine_type || 'multiacao']}</div>
          </div>
        </div>

        <div className="pt-2">
          <div className="text-sm text-muted-foreground mb-1">Valor da Mensalidade</div>
          <div className="text-2xl font-bold text-emerald-700">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.service_value || 0)}
          </div>
          {data.last_adjustment_date && (
            <div className="text-[10px] text-muted-foreground mt-1 text-right italic">
              Último reajuste em {format(new Date(data.last_adjustment_date), 'dd/MM/yyyy')}
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          onClick={() => {
              setAdjustedValue(data.service_value);
              setIsAdjustmentOpen(true);
          }}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Reajuste Inflação
        </Button>
      </CardContent>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dados Financeiros</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="c_start_date">Data de Início</Label>
              <Input
                id="c_start_date"
                type="date"
                value={editData.contract_start_date || ''}
                onChange={(e) => setEditData({ ...editData, contract_start_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s_value">Valor da Mensalidade (R$)</Label>
              <Input
                id="s_value"
                type="number"
                step="0.01"
                value={editData.service_value || ''}
                onChange={(e) => setEditData({ ...editData, service_value: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p_due_day">Dia de Vencimento</Label>
              <Input
                id="p_due_day"
                type="number"
                min="1"
                max="31"
                value={editData.payment_due_date || ''}
                onChange={(e) => setEditData({ ...editData, payment_due_date: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Método de Tratamento</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={editData.chlorine_type || 'multiacao'}
                onChange={e => setEditData({...editData, chlorine_type: e.target.value})}
              >
                {Object.entries(TREATMENT_METHODS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simular Reajuste</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
               <div className="text-sm text-emerald-800 mb-1">Valor Atual</div>
               <div className="text-lg font-bold text-emerald-900">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.service_value || 0)}
               </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="inflation">Índice de Reajuste (%)</Label>
              <div className="flex gap-2">
                <Input
                  id="inflation"
                  type="number"
                  step="0.1"
                  value={inflationRate}
                  onChange={(e) => handleCalculateAdjustment(Number(e.target.value))}
                />
                <div className="flex gap-1">
                   <Button variant="outline" size="sm" onClick={() => handleCalculateAdjustment(4.5)}>IPCA</Button>
                   <Button variant="outline" size="sm" onClick={() => handleCalculateAdjustment(6.0)}>IGP-M</Button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mt-2">
               <div className="text-sm text-blue-800 mb-1">Novo Valor Sugerido</div>
               <div className="text-xl font-bold text-blue-900">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(adjustedValue || 0)}
               </div>
               <div className="text-xs text-blue-600 mt-1">
                 Acréscimo de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((adjustedValue || 0) - (data.service_value || 0))}
               </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustmentOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApplyAdjustment}>Aplicar Novo Valor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
