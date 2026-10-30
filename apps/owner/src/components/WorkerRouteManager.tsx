'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ClientFormData } from '@piscineiro/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Plus, Trash2, MapPin, Calendar, Users, CheckSquare, Square, Check } from "lucide-react";
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';

interface WorkerRouteManagerProps {
    workerId: string;
    tenantId: string;
}

interface Client extends ClientFormData {
    id: string;
    worker_id?: string | null;
    visit_days?: string[];
    visit_day?: string;
}

const DAYS = [
    { id: 'monday', label: 'Segunda-feira', shortLabel: 'Seg' },
    { id: 'tuesday', label: 'Terça-feira', shortLabel: 'Ter' },
    { id: 'wednesday', label: 'Quarta-feira', shortLabel: 'Qua' },
    { id: 'thursday', label: 'Quinta-feira', shortLabel: 'Qui' },
    { id: 'friday', label: 'Sexta-feira', shortLabel: 'Sex' },
    { id: 'saturday', label: 'Sábado', shortLabel: 'Sáb' },
    { id: 'sunday', label: 'Domingo', shortLabel: 'Dom' },
];

const DAY_MAP: Record<string, string> = {
    'Segunda-feira': 'monday', 'Terça-feira': 'tuesday', 'Quarta-feira': 'wednesday',
    'Quinta-feira': 'thursday', 'Sexta-feira': 'friday', 'Sábado': 'saturday', 'Domingo': 'sunday',
    'Segunda': 'monday', 'Terça': 'tuesday', 'Quarta': 'wednesday',
    'Quinta': 'thursday', 'Sexta': 'friday',
    'seg': 'monday', 'ter': 'tuesday', 'qua': 'wednesday',
    'qui': 'thursday', 'sex': 'friday', 'sab': 'saturday', 'dom': 'sunday',
    'monday': 'monday', 'tuesday': 'tuesday', 'wednesday': 'wednesday',
    'thursday': 'thursday', 'friday': 'friday', 'saturday': 'saturday', 'sunday': 'sunday',
    'mon': 'monday', 'tue': 'tuesday', 'wed': 'wednesday',
    'thu': 'thursday', 'fri': 'friday', 'sat': 'saturday', 'sun': 'sunday',
};

export function WorkerRouteManager({ workerId, tenantId }: WorkerRouteManagerProps) {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchClients = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) {
            toast.error('Erro ao carregar clientes');
            console.error(error);
        } else {
            setClients(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchClients();
    }, [tenantId]);

    const myClients = useMemo(() => {
        return clients.filter(c => c.worker_id === workerId);
    }, [clients, workerId]);

    const availableClients = useMemo(() => {
        return clients.filter(c => !c.worker_id);
    }, [clients]);

    const filteredAvailableClients = useMemo(() => {
        if (!searchTerm) return availableClients;
        const term = searchTerm.toLowerCase();
        return availableClients.filter(c => 
            c.name?.toLowerCase().includes(term) || 
            c.neighborhood?.toLowerCase().includes(term)
        );
    }, [availableClients, searchTerm]);

    const toggleClientSelection = (clientId: string) => {
        const newSelected = new Set(selectedClientIds);
        if (newSelected.has(clientId)) {
            newSelected.delete(clientId);
        } else {
            newSelected.add(clientId);
        }
        setSelectedClientIds(newSelected);
    };

    const toggleSelectAll = () => {
        const allFilteredSelected = filteredAvailableClients.every(c => selectedClientIds.has(c.id));
        
        const next = new Set(selectedClientIds);
        if (allFilteredSelected) {
            // Unselect all in current list
            filteredAvailableClients.forEach(c => next.delete(c.id));
        } else {
            // Select all in current list
            filteredAvailableClients.forEach(c => next.add(c.id));
        }
        setSelectedClientIds(next);
    };

    const handleBulkAssign = async () => {
        if (selectedClientIds.size === 0) return;
        
        setIsSubmitting(true);
        try {
            const clientIds = Array.from(selectedClientIds);
            const { error } = await supabase
                .from('clients')
                .update({ worker_id: workerId })
                .in('id', clientIds);

            if (error) throw error;
            
            toast.success(`${clientIds.length} clientes adicionados ao roteiro`);
            setSelectedClientIds(new Set());
            setOpenCombobox(false);
            fetchClients();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atribuir clientes');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignClient = async (clientId: string) => {
        try {
            console.log('[WorkerRouteManager] Atribuindo cliente:', clientId, 'ao worker:', workerId);
            const { error } = await supabase
                .from('clients')
                .update({ worker_id: workerId })
                .eq('id', clientId);

            if (error) {
                console.error('[WorkerRouteManager] Erro na atribuição:', error);
                throw error;
            }
            console.log('[WorkerRouteManager] Cliente atribuído com sucesso!');
            toast.success('Cliente adicionado ao roteiro');
            setOpenCombobox(false);
            fetchClients();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atribuir cliente');
        }
    };

    const handleRemoveClient = async (clientId: string) => {
        try {
            const { error } = await supabase
                .from('clients')
                .update({ worker_id: null })
                .eq('id', clientId);

            if (error) throw error;
            toast.success('Cliente removido do roteiro');
            fetchClients();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao remover cliente');
        }
    };

    const clientVisitsOnDay = (client: Client, dayId: string) => {
        const days = client.visit_days || client.visitDays || [];
        const singleDay = client.visit_day || client.visitDay;
        
        if (Array.isArray(days) && days.length > 0) {
            return days.some(d => {
                if (!d) return false;
                const normalized = DAY_MAP[d] || d.toLowerCase();
                return normalized === dayId;
            });
        }
        
        if (singleDay) {
            const normalized = DAY_MAP[singleDay] || singleDay.toLowerCase();
            return normalized === dayId;
        }
        
        return false;
    };

    const clientsWithoutDays = useMemo(() => {
        return myClients.filter(c => {
            const days = c.visit_days || c.visitDays || [];
            const singleDay = c.visit_day || c.visitDay;
            return (!Array.isArray(days) || days.length === 0) && !singleDay;
        });
    }, [myClients]);

    const daysWithClients = useMemo(() => {
        return DAYS.filter(day => 
            myClients.some(c => clientVisitsOnDay(c, day.id))
        ).map(d => d.id);
    }, [myClients]);

    const totalClientsInRoute = myClients.length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">Roteiro Semanal</h2>
                    <Badge variant="secondary" className="text-sm">
                        <Users className="h-3 w-3 mr-1" />
                        {totalClientsInRoute} cliente{totalClientsInRoute !== 1 ? 's' : ''}
                    </Badge>
                </div>
                
                <Popover open={openCombobox} onOpenChange={(open) => {
                    setOpenCombobox(open);
                    if (!open) setSearchTerm('');
                }}>
                    <PopoverTrigger asChild>
                        <Button variant="default" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Cliente
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0" align="end">
                        <div className="p-3 border-b bg-muted/20">
                            <div className="flex items-center border bg-background rounded-md px-3 mb-3">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Buscar cliente..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                                />
                            </div>
                            
                            {filteredAvailableClients.length > 0 && (
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <Checkbox 
                                            id="select-all" 
                                            checked={filteredAvailableClients.length > 0 && filteredAvailableClients.every(c => selectedClientIds.has(c.id))}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                        <label htmlFor="select-all" className="text-xs font-semibold cursor-pointer">
                                            Selecionar Todos ({filteredAvailableClients.length})
                                        </label>
                                    </div>
                                    
                                    {selectedClientIds.size > 0 && (
                                        <Button 
                                            size="sm" 
                                            onClick={handleBulkAssign}
                                            disabled={isSubmitting}
                                            className="h-8 px-3"
                                        >
                                            Adicionar ({selectedClientIds.size})
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="max-h-[300px] overflow-y-auto p-2">
                            {filteredAvailableClients.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-8">
                                    Nenhum cliente disponível para atribuição.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {filteredAvailableClients.map((client) => {
                                        const isSelected = selectedClientIds.has(client.id);
                                        return (
                                            <div
                                                key={client.id}
                                                className={cn(
                                                    "flex items-center gap-3 w-full text-left px-3 py-2 rounded-md transition-colors cursor-pointer group",
                                                    isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-accent"
                                                )}
                                                onClick={() => toggleClientSelection(client.id)}
                                            >
                                                <Checkbox 
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleClientSelection(client.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="text-sm font-medium truncate">{client.name}</span>
                                                    <span className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider">
                                                        {client.neighborhood || 'Sem Bairro'} • {client.visitFrequency === 'biweekly' ? 'Quinzenal' : 'Semanal'}
                                                    </span>
                                                </div>
                                                <div 
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded-full text-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAssignClient(client.id);
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Warning for clients without days */}
            {clientsWithoutDays.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/50">
                    <CardContent className="py-3">
                        <div className="flex items-start gap-3">
                            <span className="text-lg">⚠️</span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-orange-700">
                                    {clientsWithoutDays.length} cliente{clientsWithoutDays.length !== 1 ? 's' : ''} sem dias de visita
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {clientsWithoutDays.map(client => (
                                        <Badge 
                                            key={client.id} 
                                            variant="outline" 
                                            className="border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-400 bg-card cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/20 group"
                                        >
                                            {client.name}
                                            <button 
                                                onClick={() => handleRemoveClient(client.id)}
                                                className="ml-1 opacity-50 hover:opacity-100"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Days Accordion */}
            <Card>
                <CardContent className="p-0">
                    <Accordion type="multiple" defaultValue={daysWithClients} className="w-full">
                        {DAYS.map((day) => {
                            const dayClients = myClients.filter(c => clientVisitsOnDay(c, day.id));
                            const hasClients = dayClients.length > 0;
                            
                            return (
                                <AccordionItem key={day.id} value={day.id} className="border-b last:border-b-0">
                                    <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{day.label}</span>
                                            <Badge 
                                                variant={hasClients ? "default" : "secondary"} 
                                                className={hasClients ? "" : "opacity-50"}
                                            >
                                                {dayClients.length}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                        {!hasClients ? (
                                            <p className="text-sm text-muted-foreground py-2 text-center">
                                                Nenhuma visita agendada
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {dayClients.map((client, index) => (
                                                    <div 
                                                        key={client.id} 
                                                        className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors group cursor-pointer"
                                                        onClick={() => router.push(`/clients/${client.id}?edit=true`)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm group-hover:text-primary transition-colors">{client.name}</p>
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <MapPin className="h-3 w-3" />
                                                                    <span>{client.neighborhood || 'Sem bairro'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveClient(client.id);
                                                            }}
                                                            title="Remover do roteiro"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    );
}
