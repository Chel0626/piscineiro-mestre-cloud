'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useClients } from '@/hooks/useClients';
import { useClientesAvulsos } from '@/hooks/useClientesAvulsos';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ClientForm } from '@/components/ClientForm';
import { ClienteAvulsoHistoryModal } from '@/components/ClienteAvulsoHistoryModal';
import { MoreHorizontal, User, MapPin, Calendar, Search, ChevronDown, ChevronUp, Clock, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { RoleGuard } from '@/components/RoleGuard';

export default function ClientesPage() {
    const router = useRouter();
    const { role, authLoading: authContextLoading } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [isClientesFixosExpanded, setIsClientesFixosExpanded] = useState(true);
    const [isClientesAvulsosExpanded, setIsClientesAvulsosExpanded] = useState(false);
    
    // Removido o redirecionamento de Worker - Agora eles podem acessar para editar perfis
    useEffect(() => {
        // Apenas para logs ou futura lógica se necessário
    }, [role, authContextLoading, router]);

    // Toda a lógica agora vem do nosso hook customizado.
    const {
        clients,
        form,
        handleFormSubmit,
        handleDelete,
        openFormToEdit,
        openFormToCreate,
        closeForm,
        openAlert,
        closeAlert,
        isSubmitting,
        isFormOpen,
        isAlertOpen,
        editingClient,
        authLoading,
    } = useClients();

    // Hook para clientes avulsos
    const { clientesAvulsos, isLoading: isLoadingAvulsos } = useClientesAvulsos();

    // Estados para exclusão de avulsos
    const [deletingAvulsoKey, setDeletingAvulsoKey] = useState<string | null>(null);
    const [isAvulsoAlertOpen, setIsAvulsoAlertOpen] = useState(false);

    // Estados para histórico de avulsos
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedHistoryGroupKey, setSelectedHistoryGroupKey] = useState<string | null>(null);

    // Filtrar clientes baseado na busca
    const filteredClients = useMemo(() => {
        if (!searchTerm.trim()) return clients;
        
        const searchLower = searchTerm.toLowerCase();
        return clients.filter(client => 
            client.name.toLowerCase().includes(searchLower) ||
            client.address.toLowerCase().includes(searchLower) ||
            client.neighborhood.toLowerCase().includes(searchLower)
        );
    }, [clients, searchTerm]);

    // Filtrar clientes avulsos baseado na busca
    const filteredClientesAvulsos = useMemo(() => {
        if (!searchTerm.trim()) return clientesAvulsos;
        
        const searchLower = searchTerm.toLowerCase();
        return clientesAvulsos.filter(cliente => 
            cliente.nome.toLowerCase().includes(searchLower) ||
            (cliente.endereco && cliente.endereco.toLowerCase().includes(searchLower))
        );
    }, [clientesAvulsos, searchTerm]);

    // Agrupar clientes avulsos por nome e telefone
    const groupedClientesAvulsos = useMemo(() => {
        const groups: Record<string, typeof clientesAvulsos> = {};
        
        filteredClientesAvulsos.forEach(cliente => {
            // Normaliza a chave para agrupar
            const key = `${cliente.nome.trim()}-${cliente.telefone ? cliente.telefone.trim() : 'sem-telefone'}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(cliente);
        });

        return Object.entries(groups).map(([key, servicos]) => {
            // Pega o serviço mais recente para exibir os dados principais
            const latest = servicos.reduce((prev, current) => 
                new Date(prev.timestamp).getTime() > new Date(current.timestamp).getTime() ? prev : current
            );
            
            return {
                key,
                mainData: latest,
                services: servicos,
                totalServices: servicos.length,
                totalValue: servicos.reduce((acc, curr) => acc + (curr.valor || 0), 0)
            };
        }).sort((a, b) => a.mainData.nome.localeCompare(b.mainData.nome));
    }, [filteredClientesAvulsos]);

    const openAvulsoAlert = (key: string) => {
        setDeletingAvulsoKey(key);
        setIsAvulsoAlertOpen(true);
    };

    const closeAvulsoAlert = () => {
        setDeletingAvulsoKey(null);
        setIsAvulsoAlertOpen(false);
    };

    const handleDeleteAvulso = async () => {
        if (!deletingAvulsoKey) return;
        
        const group = groupedClientesAvulsos.find(g => g.key === deletingAvulsoKey);
        if (!group) return;

        try {
            const idsToDelete = group.services.map(s => s.id);
            const { error } = await supabase
                .from('ad_hoc_clients')
                .delete()
                .in('id', idsToDelete);

            if (error) throw error;
            
            toast.success(`${group.services.length} registros excluídos com sucesso!`);
        } catch (error) {
            console.error("Erro ao excluir cliente avulso:", error);
            toast.error("Erro ao excluir registros.");
        } finally {
            closeAvulsoAlert();
        }
    };
    
    const handleRowClick = (clientId: string) => {
        router.push(`/dashboard/clientes/${clientId}`);
    };

    const handleCardClick = (clientId: string) => {
        router.push(`/dashboard/clientes/${clientId}`);
    };

    // Obter dados para o modal de histórico
    const selectedHistoryGroup = useMemo(() => {
        if (!selectedHistoryGroupKey) return null;
        return groupedClientesAvulsos.find(g => g.key === selectedHistoryGroupKey);
    }, [selectedHistoryGroupKey, groupedClientesAvulsos]);

    const handleOpenHistory = (key: string) => {
        setSelectedHistoryGroupKey(key);
        setHistoryModalOpen(true);
    };

    const handleServiceDeleted = (serviceId: string) => {
        // A atualização acontece automaticamente via onSnapshot no hook useClientesAvulsos
        // Mas se o grupo ficar vazio, fechamos o modal
        if (selectedHistoryGroup && selectedHistoryGroup.services.length <= 1) {
            setHistoryModalOpen(false);
            setSelectedHistoryGroupKey(null);
        }
    };

    // Renderização condicional baseada no papel de worker
    const isWorker = role === 'worker';

    return (
        <div className="w-full max-w-full p-2 sm:p-4 overflow-hidden">
            {/* Header responsivo */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold truncate">Gerenciamento de Clientes</h1>
                <Button 
                    onClick={openFormToCreate} 
                    disabled={authLoading}
                    className="w-full sm:w-auto text-sm flex-shrink-0"
                >
                    {authLoading ? 'Aguarde...' : 'Adicionar Cliente'}
                </Button>
            </div>

            {/* Campo de busca */}
            <div className="mb-4 sm:mb-6 w-full">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                    <Input
                        placeholder="Buscar cliente por nome, endereço ou bairro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
                {searchTerm && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {filteredClients.length + groupedClientesAvulsos.length} cliente(s) encontrado(s) de {clients.length + groupedClientesAvulsos.length} total
                    </p>
                )}
            </div>

            {/* Seção de Clientes Fixos */}
            <Collapsible open={isClientesFixosExpanded} onOpenChange={setIsClientesFixosExpanded}>
                <Card className="mb-4 w-full">
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center justify-between w-full">
                                <CardTitle className="flex items-center gap-2 truncate">
                                    <User className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                    <span className="truncate">Clientes Fixos ({filteredClients.length})</span>
                                </CardTitle>
                                {isClientesFixosExpanded ? (
                                    <ChevronUp className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                )}
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="pt-0 w-full overflow-hidden">
                            {/* Layout para Desktop - Tabela */}
                            <div className="hidden sm:block border rounded-lg overflow-x-auto w-full">
                                <Table className="w-full">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-sm min-w-[120px]">Nome</TableHead>
                                            <TableHead className="text-sm min-w-[200px]">Endereço</TableHead>
                                            <TableHead className="text-sm min-w-[120px]">Dia da Visita</TableHead>
                                            <TableHead className="text-right text-sm min-w-[80px]">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredClients.map((client) => (
                                            <TableRow key={client.id} onClick={() => handleRowClick(client.id)} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50">
                                                <TableCell className="font-medium text-sm max-w-[150px] truncate">{client.name}</TableCell>
                                                <TableCell className="text-sm max-w-[250px] truncate">{`${client.address}, ${client.neighborhood}`}</TableCell>
                                                <TableCell className="text-sm max-w-[120px] truncate">
                                                  {client.visitDays ? client.visitDays.join(', ') : 
                                                   (client as typeof client & { visitDay?: string }).visitDay || 'Não definido'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                                <span className="sr-only">Abrir menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRowClick(client.id); }}>Ver Detalhes</DropdownMenuItem>
                                                            {!isWorker && (
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openAlert(client.id); }} className="text-red-600 dark:text-red-400">Excluir</DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Layout para Mobile - Cards */}
                            <div className="sm:hidden space-y-3">
                                {filteredClients.map((client) => (
                                    <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleCardClick(client.id)}>
                                        <CardContent className="p-3 sm:p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0 space-y-2 group-hover:opacity-80 transition-opacity">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                                                        <p className="font-semibold text-sm truncate">{client.name}</p>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{`${client.address}, ${client.neighborhood}`}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                                                        <p className="text-xs text-gray-600 dark:text-gray-300">
                                                          {client.visitDays ? client.visitDays.join(', ') : 
                                                           (client as typeof client & { visitDay?: string }).visitDay || 'Não definido'}
                                                        </p>
                                                    </div>
                                                    <div className="pt-1">
                                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Toque para ver detalhes</span>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                            <span className="sr-only">Abrir menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCardClick(client.id); }}>
                                                            Ver Detalhes
                                                        </DropdownMenuItem>
                                                        {!isWorker && (
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openAlert(client.id); }} className="text-red-600 dark:text-red-400">
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            {/* Seção de Clientes Avulsos */}
            <Collapsible open={isClientesAvulsosExpanded} onOpenChange={setIsClientesAvulsosExpanded}>
                <Card className="mb-4 w-full">
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center justify-between w-full">
                                <CardTitle className="flex items-center gap-2 truncate">
                                    <Clock className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                                    <span className="truncate">Clientes Avulsos ({groupedClientesAvulsos.length})</span>
                                </CardTitle>
                                {isClientesAvulsosExpanded ? (
                                    <ChevronUp className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                )}
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="pt-0 w-full overflow-hidden">
                            {isLoadingAvulsos ? (
                                <div className="text-center py-4">
                                    <p className="text-gray-500 dark:text-gray-400">Carregando clientes avulsos...</p>
                                </div>
                            ) : groupedClientesAvulsos.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-gray-500 dark:text-gray-400">Nenhum cliente avulso encontrado.</p>
                                </div>
                            ) : (
                                <div className="space-y-3 w-full">
                                    {groupedClientesAvulsos.map((group) => (
                                        <Card key={group.key} className="hover:shadow-md transition-shadow w-full">
                                            <CardContent className="p-3 sm:p-4 w-full">
                                                <div className="flex items-start justify-between gap-3 w-full">
                                                    <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400 flex-shrink-0" />
                                                            <p className="font-semibold text-sm truncate">{group.mainData.nome}</p>
                                                            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
                                                                {group.totalServices} serviço(s)
                                                            </span>
                                                        </div>
                                                        {group.mainData.endereco && (
                                                            <div className="flex items-start gap-2">
                                                                <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                                                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed break-words">{group.mainData.endereco}</p>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                                                Último: {new Date(group.mainData.timestamp).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleOpenHistory(group.key)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Ver Detalhes
                                                            </DropdownMenuItem>
                                                            {!isWorker && (
                                                                <DropdownMenuItem onClick={() => openAvulsoAlert(group.key)} className="text-red-600">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Excluir Todos
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>

            {/* Dialog do formulário - responsivo */}
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => !isOpen && closeForm()}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
                    <DialogHeader className="pb-3">
                        <DialogTitle className="text-base sm:text-lg">
                            Adicionar Novo Cliente
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            Preencha as informações do novo cliente abaixo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="w-full">
                        <ClientForm form={form} onSubmit={handleFormSubmit} />
                    </div>
                    <DialogFooter className="pt-3">
                        <Button 
                            type="submit" 
                            form="client-form" 
                            disabled={isSubmitting}
                            className="w-full sm:w-auto text-sm"
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Alert Dialog para Clientes Avulsos */}
            <AlertDialog open={isAvulsoAlertOpen} onOpenChange={(isOpen) => !isOpen && closeAvulsoAlert()}>
                <AlertDialogContent className="mx-2 sm:mx-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">Excluir Cliente Avulso?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Isso excluirá <strong>todos</strong> os registros de serviço associados a este nome. Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-sm">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAvulso} className="text-sm bg-red-600 hover:bg-red-700">Excluir Tudo</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alert Dialog */}
            <AlertDialog open={isAlertOpen} onOpenChange={(isOpen) => !isOpen && closeAlert()}>
                <AlertDialogContent className="mx-2 sm:mx-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <AlertDialogCancel className="text-sm">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="text-sm">Continuar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal de Histórico de Serviços Avulsos */}
            {selectedHistoryGroup && (
                <ClienteAvulsoHistoryModal
                    isOpen={historyModalOpen}
                    onClose={() => setHistoryModalOpen(false)}
                    clientName={selectedHistoryGroup.mainData.nome}
                    services={selectedHistoryGroup.services}
                    onServiceDeleted={handleServiceDeleted}
                />
            )}
        </div>
    );
}
