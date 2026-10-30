'use client';

import { useState } from 'react';
import { useInvitations } from '@piscineiro/shared';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export function TeamInviteWidget() {
  const { tenant } = useAuth();
  const { invitations, isLoading, createInvitation, cancelInvitation } = useInvitations(tenant?.id);
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsInviting(true);
    const result = await createInvitation(email, 'worker');
    setIsInviting(false);

    if (result.success) {
      toast.success('Convite criado com sucesso!');
      setEmail('');
    } else {
      toast.error('Erro ao criar convite: ' + result.error);
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar este convite?')) {
      const result = await cancelInvitation(id);
      if (result.success) {
        toast.success('Convite cancelado');
      } else {
        toast.error('Erro ao cancelar convite');
      }
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(token);
    toast.success('Link copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!tenant) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Equipe</CardTitle>
        <CardDescription>Convide novos membros para sua equipe</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            type="email"
            placeholder="Email do novo membro"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={isInviting}>
            {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
            Convidar
          </Button>
        </form>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Convites Pendentes</h3>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum convite pendente.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant={invite.status === 'pending' ? 'outline' : 'secondary'}>
                        {invite.status === 'pending' ? 'Pendente' : invite.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(invite.token)}
                        title="Copiar Link de Convite"
                      >
                        {copiedId === invite.token ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(invite.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
