import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Loader2, Map, ChevronDown, ChevronUp, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AddWorkerModal } from "./AddWorkerModal";
import { useAuth } from "@/context/AuthContext";

interface Worker {
  id: string; // user_id
  role: string;
  profile: {
    name: string;
    email: string;
  } | null;
}

export function TeamList() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const fetchWorkers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get current tenant
      const { data: membersData } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1);

      const memberData = membersData?.[0];

      if (!memberData) return;

      // Get workers
      const { data: members, error } = await supabase
        .from('tenant_members')
        .select(`
          user_id,
          role
        `)
        .eq('tenant_id', memberData.tenant_id)
        .eq('role', 'worker');

      if (error) throw error;

      // Fetch profiles for these workers
      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        const workersData = members.map(m => ({
          id: m.user_id,
          role: m.role,
          profile: profiles?.find(p => p.id === m.user_id) || null
        }));
        setWorkers(workersData);
      } else {
        setWorkers([]);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [user]);

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este funcionário?")) return;
    
    try {
      // Obter o token de sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const response = await fetch("/api/workers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao remover funcionário");
      }

      fetchWorkers();
    } catch (error: any) {
      console.error("Error deleting worker:", error);
      alert(error.message || "Erro ao remover funcionário");
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-4 border-slate-200 dark:border-slate-800">
      <CardHeader 
        className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <CardTitle>Equipe ({workers.length})</CardTitle>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <AddWorkerModal onSuccess={fetchWorkers} />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
          >
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-8">
            {loading ? (
               <div className="flex justify-center p-4">
                 <Loader2 className="h-6 w-6 animate-spin" />
               </div>
            ) : workers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum funcionário cadastrado.
              </p>
            ) : (
              workers.map((worker) => (
                <div key={worker.id} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 font-bold">
                      {worker.profile?.name?.substring(0, 2).toUpperCase() || "F"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1 min-w-0 flex-1">
                    <p className="text-sm font-bold leading-none truncate text-slate-900 dark:text-slate-100">
                      {worker.profile?.name || "Sem nome"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {worker.profile?.email || "Sem email"}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400"
                      onClick={() => router.push(`/team/${worker.id}`)}
                    >
                      <Map className="h-4 w-4" />
                      Roteiro
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                      onClick={() => handleDelete(worker.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
