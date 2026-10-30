import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Wrench, History, Settings } from "lucide-react";
import { format, addMonths } from 'date-fns';
import { toast } from 'sonner';

export type MaintenanceEvent = {
  date: string;
  type: 'sand_change' | 'crepina_change' | 'valve_maintenance';
  notes?: string;
};

export interface EquipmentData {
  filter_model: string;
  filter_sand_kg: number;
  last_sand_change: string;
  next_sand_change: string;
  maintenance_history: MaintenanceEvent[];
  sand_change_interval?: number;
}

interface EquipmentCardProps {
  equipment: EquipmentData;
  onSave: (equipment: Partial<EquipmentData>) => Promise<void>;
  onRegisterMaintenance: (event: MaintenanceEvent, nextDate?: string) => Promise<void>;
}

// A cor agora acompanha a matemática dinâmica do intervalo escolhido
function getProgressColor(monthsLeft: number, interval: number) {
  if (monthsLeft > (interval / 3) * 2) return 'bg-green-500';
  if (monthsLeft > (interval / 6)) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function EquipmentCard({ equipment, onSave, onRegisterMaintenance }: EquipmentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  const [editData, setEditData] = useState<Partial<EquipmentData>>({
      filter_model: equipment.filter_model,
      filter_sand_kg: equipment.filter_sand_kg,
      last_sand_change: equipment.last_sand_change,
      next_sand_change: equipment.next_sand_change
  });
  
  const [sandInterval, setSandInterval] = useState(equipment.sand_change_interval || 18);
  
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintenanceType, setMaintenanceType] = useState<'sand_change' | 'crepina_change' | 'valve_maintenance'>('sand_change');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  const monthsLeft = (() => {
    if (!equipment.next_sand_change) return 0;
    const next = new Date(`${equipment.next_sand_change}T12:00:00`); // Evita bug de fuso
    const now = new Date();
    const diff = (next.getFullYear() - now.getFullYear()) * 12 + (next.getMonth() - now.getMonth());
    return diff;
  })();

  const handleSaveEdit = async () => {
    await onSave(editData);
    setIsEditing(false);
  };

  const handleSaveConfig = async () => {
    await onSave({ sand_change_interval: sandInterval });
    setIsConfigOpen(false);
    toast.success('Configuração de intervalo atualizada!');
  };

  const handleRegisterMaintenance = async () => {
    const event: MaintenanceEvent = {
      date: maintenanceDate,
      type: maintenanceType,
      notes: maintenanceNotes
    };

    let nextDate;
    if (maintenanceType === 'sand_change') {
        // T12:00:00 garante que a conversão da data não caia pro dia anterior no Brasil
        const date = new Date(`${maintenanceDate}T12:00:00`); 
        const next = addMonths(date, sandInterval);
        nextDate = next.toISOString().split('T')[0];
    }

    await onRegisterMaintenance(event, nextDate);
    setIsMaintenanceOpen(false);
    setMaintenanceNotes('');
    setMaintenanceType('sand_change');
    setMaintenanceDate(new Date().toISOString().split('T')[0]);
  };

  const getMaintenanceLabel = (type: string) => {
    switch (type) {
      case 'sand_change': return 'Troca de Areia';
      case 'crepina_change': return 'Troca de Crepina';
      case 'valve_maintenance': return 'Manutenção Válvula';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium text-blue-900">Status do Equipamento</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setIsConfigOpen(true)}>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
            setEditData({
                filter_model: equipment.filter_model,
                filter_sand_kg: equipment.filter_sand_kg,
                last_sand_change: equipment.last_sand_change,
                next_sand_change: equipment.next_sand_change
            });
            setIsEditing(true);
          }}>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Filtro:</div>
          <div className="font-medium text-foreground">{equipment.filter_model || '-'}</div>
          
          <div className="text-muted-foreground">Areia:</div>
          <div className="font-medium text-foreground">{equipment.filter_sand_kg ? `${Number(equipment.filter_sand_kg)}kg` : '-'}</div>
          
          <div className="text-muted-foreground">Última troca:</div>
          <div className="font-medium text-foreground">{equipment.last_sand_change ? format(new Date(`${equipment.last_sand_change}T12:00:00`), 'dd/MM/yyyy') : '-'}</div>
          
          <div className="text-muted-foreground">Próxima troca:</div>
          <div className="font-bold text-foreground">{equipment.next_sand_change ? format(new Date(`${equipment.next_sand_change}T12:00:00`), 'dd/MM/yyyy') : '-'}</div>
        </div>

        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-secondary">
            <div 
              className={`h-2 rounded-full ${getProgressColor(monthsLeft, sandInterval)} transition-all`} 
              style={{ width: `${Math.max(0, Math.min(100, (monthsLeft / sandInterval) * 100))}%` }} 
            />
          </div>
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
            <span className={monthsLeft > (sandInterval/3)*2 ? "text-green-600" : "text-muted-foreground opacity-50"}>OK</span>
            <span className={monthsLeft <= (sandInterval/3)*2 && monthsLeft > (sandInterval/6) ? "text-yellow-600" : "text-muted-foreground opacity-50"}>Atenção</span>
            <span className={monthsLeft <= (sandInterval/6) ? "text-red-600" : "text-muted-foreground opacity-50"}>Troca Imediata</span>
          </div>
        </div>

        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setIsMaintenanceOpen(true)}>
          <Wrench className="mr-2 h-4 w-4" />
          Registrar Manutenção
        </Button>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-slate-700">Histórico Recente</span>
          </div>
          <ul className="space-y-2">
            {(equipment.maintenance_history || []).slice(0, 3).map((event, idx) => (
              <li key={idx} className="text-sm bg-background border border-border p-2 rounded-md">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-800">{getMaintenanceLabel(event.type)}</span>
                  <span className="text-muted-foreground text-xs">{format(new Date(`${event.date}T12:00:00`), 'dd/MM/yyyy')}</span>
                </div>
                {event.notes && <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>}
              </li>
            ))}
            {(!equipment.maintenance_history || equipment.maintenance_history.length === 0) && (
              <li className="text-sm text-muted-foreground italic">Nenhum registro encontrado.</li>
            )}
          </ul>
        </div>
      </CardContent>

      {/* Config Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Configuração de Equipamento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="sand_interval">Intervalo padrão para troca de areia (meses)</Label>
                    <Input 
                        id="sand_interval"
                        type="number"
                        value={sandInterval}
                        onChange={(e) => setSandInterval(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">O sistema sugerirá a próxima troca com base neste intervalo (atualmente {sandInterval} meses).</p>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSaveConfig}>Salvar Configuração</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="filter_model">Modelo do Filtro</Label>
              <Input
                id="filter_model"
                value={editData.filter_model || ''}
                onChange={(e) => setEditData({ ...editData, filter_model: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filter_sand_kg">Capacidade de Areia (kg)</Label>
              <Input
                id="filter_sand_kg"
                type="number"
                value={editData.filter_sand_kg || ''}
                onChange={(e) => setEditData({ ...editData, filter_sand_kg: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_sand_change">Última Troca de Areia</Label>
              <Input
                id="last_sand_change"
                type="date"
                value={editData.last_sand_change || ''}
                onChange={(e) => {
                  const newDate = e.target.value;
                  let nextDate = editData.next_sand_change;

                  // A MÁGICA ACONTECE AQUI: Recalcula a próxima troca automaticamente
                  if (newDate) {
                    const parsedDate = new Date(`${newDate}T12:00:00`);
                    const next = addMonths(parsedDate, sandInterval);
                    nextDate = next.toISOString().split('T')[0];
                  }

                  setEditData({ 
                    ...editData, 
                    last_sand_change: newDate, 
                    next_sand_change: nextDate 
                  });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="next_sand_change" className="text-indigo-600 dark:text-indigo-400 font-bold">
                Previsão Próxima Troca
              </Label>
              <Input
                id="next_sand_change"
                type="date"
                value={editData.next_sand_change || ''}
                disabled
                className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 cursor-not-allowed font-medium"
                title={`Calculado automaticamente baseado no intervalo de ${sandInterval} meses`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Manutenção</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="m_date">Data</Label>
              <Input
                id="m_date"
                type="date"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Tipo de Manutenção</Label>
              <Select value={maintenanceType} onValueChange={(val: any) => setMaintenanceType(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sand_change">Troca de Areia</SelectItem>
                  <SelectItem value="crepina_change">Troca de Crepina</SelectItem>
                  <SelectItem value="valve_maintenance">Manutenção Válvula</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="m_notes">Observações</Label>
              <Input
                id="m_notes"
                value={maintenanceNotes}
                onChange={(e) => setMaintenanceNotes(e.target.value)}
                placeholder="Detalhes do serviço..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaintenanceOpen(false)}>Cancelar</Button>
            <Button onClick={handleRegisterMaintenance}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}