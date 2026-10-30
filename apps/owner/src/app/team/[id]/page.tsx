'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import { WorkerRouteManager } from '@/components/WorkerRouteManager';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function WorkerDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { tenant, authLoading } = useAuth();
    const workerId = params.id as string;

    const [workerProfile, setWorkerProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchWorker() {
            if (!workerId) return;
            setLoading(true);

            // Fetch profile
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', workerId)
                .single();

            if (error) {
                console.error('Error fetching worker profile:', error);
            } else {
                setWorkerProfile(profile);
            }
            setLoading(false);
        }

        fetchWorker();
    }, [workerId]);

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!workerProfile) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                <Header />
                <main className="flex-1 p-6 container mx-auto max-w-7xl">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">Funcionário não encontrado</h2>
                        <Button onClick={() => router.push('/')} className="mt-4">
                            Voltar para o Dashboard
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Header />
            <main className="flex-1 p-4 sm:p-6 space-y-6 container mx-auto max-w-7xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-lg">
                                {workerProfile.name?.substring(0, 2).toUpperCase() || "F"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{workerProfile.name}</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {workerProfile.email}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-6">
                    {tenant?.id && (
                        <WorkerRouteManager 
                            workerId={workerId} 
                            tenantId={tenant.id} 
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
