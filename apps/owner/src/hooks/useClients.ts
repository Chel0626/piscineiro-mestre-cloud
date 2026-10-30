'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { addMonths, parseISO, format } from 'date-fns'; // Adicionado para cálculo de data inicial se necessário
import { 
    ClientFormData, 
    clientFormSchema, 
    useClientsData,
    mapClientToDB,
    mapClientFromDB
} from '@piscineiro/shared';

export function useClients() {
    const { user, tenant, authLoading } = useAuth();
    
    const { 
        clients, 
        isLoading: clientsLoading, 
        refetch: refreshClients 
    } = useClientsData(tenant?.id, user?.id);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any | null>(null);
    const [clientToDelete, setClientToDelete] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: {
            name: '',
            address: '',
            neighborhood: '',
            phone: '',
            email: '',
            poolVolume: undefined as any,
            serviceValue: 0,
            visitFrequency: 'weekly',
            visitDays: [],
            paymentDueDate: 10,
            filterModel: '',
            filterSandKg: 0,
            lastSandChange: '',
            nextSandChange: '',
            contractStartDate: '',
            planType: 'mensal', // NOVO CAMPO
            nextRenewalDate: '', // NOVO CAMPO
            type: 'monthly',
            workerId: undefined,
            chlorineType: undefined,
        },
    });

    const openFormToCreate = () => {
        setEditingClient(null);
        
        // Data de hoje e cálculo inicial para daqui 1 mês
        const todayStr = new Date().toISOString().split('T')[0];
        const nextMonthStr = format(addMonths(parseISO(todayStr), 1), 'yyyy-MM-dd');

        form.reset({
            name: '',
            address: '',
            neighborhood: '',
            phone: '',
            email: '',
            poolVolume: undefined as any,
            serviceValue: 0,
            visitFrequency: 'weekly',
            visitDays: [],
            paymentDueDate: 10,
            filterModel: '',
            filterSandKg: 0,
            lastSandChange: '',
            nextSandChange: '',
            contractStartDate: todayStr,
            planType: 'mensal',
            nextRenewalDate: nextMonthStr,
            type: 'monthly',
            workerId: undefined,
            chlorineType: undefined,
        });
        setIsFormOpen(true);
    };

    const openFormToEdit = (client: any) => {
        const mappedClient = client.pool_volume !== undefined ? mapClientFromDB(client) : client;
        
        setEditingClient(client);
        form.reset({
            name: mappedClient.name,
            address: mappedClient.address,
            neighborhood: mappedClient.neighborhood,
            phone: mappedClient.phone || '',
            email: mappedClient.email || '',
            poolVolume: mappedClient.poolVolume || 0,
            serviceValue: mappedClient.serviceValue || 0,
            visitFrequency: mappedClient.visitFrequency || 'weekly',
            visitDays: mappedClient.visitDays || [],
            paymentDueDate: mappedClient.paymentDueDate || 10,
            filterModel: mappedClient.filterModel || '',
            filterSandKg: mappedClient.filterSandKg || 0,
            lastSandChange: mappedClient.lastSandChange || '',
            nextSandChange: mappedClient.nextSandChange || '',
            contractStartDate: mappedClient.contractStartDate || '',
            planType: mappedClient.planType || 'mensal',
            nextRenewalDate: mappedClient.nextRenewalDate || '',
            type: mappedClient.type || 'monthly',
            workerId: mappedClient.workerId || undefined,
            chlorineType: mappedClient.chlorineType || undefined,
        });
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingClient(null);
        form.reset();
    };

    const openAlert = (id: string) => {
        setClientToDelete(id);
        setIsAlertOpen(true);
    };

    const closeAlert = () => {
        setClientToDelete(null);
        setIsAlertOpen(false);
    };

    const handleFormSubmit = async (data: ClientFormData) => {
        if (!tenant?.id || !user?.id) {
            toast.error('Erro de autenticação: Tenant ou usuário não encontrado');
            return;
        }

        setIsSubmitting(true);
        try {
            const dbMappedData = mapClientToDB(data, user.id);
            
            const dbData = {
                ...dbMappedData,
                tenant_id: tenant.id
            };

            const cleanData = Object.fromEntries(
                Object.entries(dbData).map(([key, value]) => {
                    if ((key.includes('date') || key.includes('change')) && value === '') {
                        return [key, null];
                    }
                    return [key, value];
                }).filter(([_, v]) => v !== undefined)
            );

            if (editingClient) {
                const { tenant_id, ...updateData } = cleanData;
                
                const result = await supabase
                    .from('clients')
                    .update(updateData)
                    .eq('id', editingClient.id);

                if (result.error) throw new Error(result.error.message);
                toast.success('Cliente atualizado com sucesso!');
            } else {
                const response = await fetch('/api/clientes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanData),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(`Erro ao criar cliente: ${result.error}`);
                
                toast.success('Cliente criado com acesso gerado com sucesso!');
            }

            refreshClients();
            closeForm();
        } catch (error: any) {
            toast.error(`Erro ao salvar cliente: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!clientToDelete) return;
        try {
            const { error } = await supabase.from('clients').delete().eq('id', clientToDelete);
            if (error) throw error;
            toast.success('Cliente excluído com sucesso!');
            refreshClients();
            closeAlert();
        } catch (error: any) {
            toast.error(`Erro ao excluir cliente: ${error.message}`);
        }
    };

    return {
        clients, refreshClients, form, handleFormSubmit, handleDelete,
        openFormToEdit, openFormToCreate, closeForm, openAlert, closeAlert,
        isSubmitting, isFormOpen, isAlertOpen, editingClient, authLoading,
    };
}