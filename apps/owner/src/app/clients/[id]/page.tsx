'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { ArrowLeft, Edit, MapPin, Phone, User, Calendar, FileText, Loader2, Droplets } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientForm } from '@/components/ClientForm';
import { useClients } from '@/hooks/useClients';
import { ClientFormData } from '@piscineiro/shared';
import { EquipmentCard, EquipmentData, MaintenanceEvent } from '@/components/EquipmentCard';
import { FinancialCard, FinancialData } from '@/components/FinancialCard';
import { toast } from 'sonner';
import { UseFormReturn } from 'react-hook-form'; // Adicionado para corrigir a tipagem

interface Visit {
    id: string;
    date: string;
    notes: string;
}

export default function ClientDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const clientId = params.id as string;
    const shouldEdit = searchParams.get('edit') === 'true';
    
    const [client, setClient] = useState<any>(null);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);

    // Tipagem explícita adicionada aqui para corrigir o erro de build da Vercel
    const {
        form,
        handleFormSubmit,
        openFormToEdit,
        closeForm,
        isFormOpen,
        isSubmitting
    } = useClients() as {
        form: UseFormReturn<ClientFormData>;
        handleFormSubmit: (data: ClientFormData) => Promise<void>;
        openFormToEdit: (client: any) => void;
        closeForm: () => void;
        isFormOpen: boolean;
        isSubmitting: boolean;
    };

    useEffect(() => {
        if (client && shouldEdit && !isFormOpen) {
            openFormToEdit(client);
        }
    }, [client, shouldEdit]);

    useEffect(() => {
        async function fetchClientDetails() {
            setLoading(true);
            
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', clientId)
                .single();

            if (clientError) {
                console.error('Error fetching client:', clientError);
                setLoading(false);
                return;
            }

            setClient(clientData);

            // Fetch Visits
            const { data: visitsData } = await supabase
                .from('client_visits')
                .select('id, date, notes')
                .eq('client_id', clientId)
                .order('date', { ascending: false })
                .limit(5);

            if (visitsData) setVisits(visitsData);
            setLoading(false);
        }

        if (clientId) fetchClientDetails();
    }, [clientId]);

    const onEditSuccess = async (data: ClientFormData) => {
        await handleFormSubmit(data);
        const { data: updatedClient } = await supabase.from('clients').select('*').eq('id', clientId).single();
        if (updatedClient) setClient(updatedClient);
    };

    const handleSaveEquipment = async (updatedData: Partial<EquipmentData>) => {
        if (!client) return;
        try {
            const { error } = await supabase.from('clients').update(updatedData).eq('id', client.id);
            if (error) throw error;
            setClient({ ...client, ...updatedData });
            toast.success('Informações atualizadas!');
        } catch (error) {
            console.error("Error updating:", error);
            toast.error('Erro ao salvar.');
        }
    };

    const handleSaveFinancial = async (updatedData: Partial<FinancialData>) => {
        if (!client) return;
        try {
            const { error } = await supabase.from('clients').update(updatedData).eq('id', client.id);
            if (error) throw error;
            setClient({ ...client, ...updatedData });
            toast.success('Financeiro atualizado!');
        } catch (error) {
            console.error("Error updating financial:", error);
            toast.error('Erro ao salvar.');
        }
    };

    const handleRegisterMaintenance = async (event: MaintenanceEvent, nextDate?: string) => {
        if (!client) return;
        try {
            const currentHistory = client.maintenance_history || [];
            const newHistory = [event, ...currentHistory];
            const updates: any = { maintenance_history: newHistory };

            if (event.type === 'sand_change') {
                updates.last_sand_change = event.date;
                if (nextDate) updates.next_sand_change = nextDate;
            }

            const { error } = await supabase.from('clients').update(updates).eq('id', client.id);
            if (error) throw error;

            setClient({ ...client, ...updates });
            toast.success('Manutenção registrada!');
        } catch (error) {
             toast.error('Erro ao registrar manutenção.');
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (!client) return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 p-6 container mx-auto max-w-7xl text-center">
                <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
                <Button onClick={() => router.push('/clients')} className="mt-4">Voltar</Button>
            </main>
        </div>
    );

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 p-6 space-y-6 container mx-auto max-w-7xl">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/clients')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                    <Button variant="outline" size="icon" onClick={() => openFormToEdit(client)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Card 1: Informações Pessoais */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-medium text-foreground">Informações Pessoais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Nome</p>
                                    <p className="text-sm font-semibold">{client.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Telefone</p>
                                    <p className="text-sm font-semibold">{client.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Endereço</p>
                                    <p className="text-sm font-semibold leading-relaxed">
                                        {client.address}<br/>
                                        {client.neighborhood} {client.city ? `- ${client.city}` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-2 border-t">
                                <Droplets className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Volume da Piscina</p>
                                    <p className="text-lg font-bold text-blue-700">
                                        {client.pool_volume ? `${Number(client.pool_volume).toLocaleString('pt-BR')} m³` : 'Não informado'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card 2: Status do Equipamento */}
                    <EquipmentCard 
                        equipment={client} 
                        onSave={handleSaveEquipment} 
                        onRegisterMaintenance={handleRegisterMaintenance} 
                    />

                    {/* Card 3: Financeiro */}
                    <FinancialCard 
                        data={client} 
                        onSave={handleSaveFinancial} 
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Últimas Visitas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {visits.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhuma visita registrada.</p>
                            ) : (
                                <div className="space-y-4">
                                    {visits.map((visit) => (
                                        <div key={visit.id} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {new Date(visit.date).toLocaleDateString('pt-BR')}
                                                </p>
                                                <div className="flex items-start gap-2 mt-1">
                                                    <FileText className="h-3 w-3 text-muted-foreground mt-0.5" />
                                                    <p className="text-sm text-muted-foreground">{visit.notes || 'Sem observações'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Editar Cliente</DialogTitle>
                            <DialogDescription>Atualize os dados básicos do cliente.</DialogDescription>
                        </DialogHeader>
                        <ClientForm form={form} onSubmit={onEditSuccess} />
                        <DialogFooter className="gap-2 sm:gap-0 mt-4">
                            <Button variant="outline" onClick={closeForm} type="button">Cancelar</Button>
                            <Button type="submit" form="client-form" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}