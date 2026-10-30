'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';

import { clientFormSchema, ClientFormData } from '@/lib/validators/clientSchema';
import { useClientsData } from '@piscineiro/shared';

export interface UseClientsReturn {
  clients: (ClientFormData & { id: string; })[];
  form: UseFormReturn<ClientFormData>;
  handleFormSubmit: (data: ClientFormData) => Promise<void>;
  handleDelete: () => Promise<void>;
  openFormToEdit: (client: ClientFormData & { id: string; }) => void;
  openFormToCreate: () => void;
  closeForm: () => void;
  openAlert: (clientId: string) => void;
  closeAlert: () => void;
  isSubmitting: boolean;
  isFormOpen: boolean;
  isAlertOpen: boolean;
  editingClient: (ClientFormData & { id: string; }) | null;
  authLoading: boolean;
}

const defaultFormValues: Partial<ClientFormData> = {
    name: '',
    address: '',
    neighborhood: '',
    phone: '',
    visitFrequency: 'weekly',
    visitDays: [],
    filterSandKg: undefined,
    paymentDueDate: 10,
    serviceValue: 0,
};

export function useClients(): UseClientsReturn {
    const { user, role, tenant, authLoading } = useAuth();
    const isWorker = role === 'worker';
    const { 
        clients, 
        createClient, 
        updateClient, 
        deleteClient, 
        refetch 
    } = useClientsData(tenant?.id, user?.id);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<(ClientFormData & { id: string; }) | null>(null);
    const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: defaultFormValues,
    });

    useEffect(() => {
        if (isFormOpen) {
            form.reset(editingClient ? editingClient : defaultFormValues);
        }
    }, [isFormOpen, editingClient, form]);
    
    // Realtime subscription
    useEffect(() => {
        if (tenant) {
            const subscription = supabase
                .channel('clients_channel')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `tenant_id=eq.${tenant.id}` }, () => {
                    refetch();
                })
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [tenant, refetch]);

    const handleFormSubmit = async (data: ClientFormData) => {
        setIsSubmitting(true);
        try {
            if (editingClient) {
                 const result = await updateClient(editingClient.id, data);
                 if (result.error) throw new Error(result.error);
                 toast.success("Cliente atualizado com sucesso!");
            } else {
                // Se for worker, vincula automaticamente
                const clientData = {
                    ...data,
                    workerId: isWorker ? user?.id : data.workerId
                };
                const result = await createClient(clientData);
                if (result.error) throw new Error(result.error);
                toast.success("Cliente adicionado com sucesso!");
            }

            closeForm();
        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : "Não foi possível salvar o cliente.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingClientId) return;
        try {
            const result = await deleteClient(deletingClientId);
            if (result.error) throw new Error(result.error);

            toast.success("Cliente excluído com sucesso!");
        } catch (err) {
            console.error("Erro ao deletar cliente:", err);
            toast.error("Não foi possível excluir o cliente.");
        } finally {
            closeAlert();
        }
    };

    const openFormToEdit = (client: ClientFormData & { id: string; }) => { 
        console.warn("openFormToEdit is deprecated. Use dashboard for editing.");
    };
    const openFormToCreate = () => { setEditingClient(null); setIsFormOpen(true); };
    const closeForm = () => { setIsFormOpen(false); setEditingClient(null); form.reset(defaultFormValues); };
    const openAlert = (clientId: string) => { setDeletingClientId(clientId); setIsAlertOpen(true); };
    const closeAlert = () => { setIsAlertOpen(false); setDeletingClientId(null); };

    return {
        clients, form, handleFormSubmit, handleDelete, openFormToEdit,
        openFormToCreate, closeForm, openAlert, closeAlert, isSubmitting,
        isFormOpen, isAlertOpen, editingClient, authLoading,
    };
}
