'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Por favor, informe seu e-mail.');
      return;
    }
    
    setIsResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
      setIsResetOpen(false);
      setResetEmail('');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Opcional: Chamar API de login se precisar de validação server-side adicional ou cookies
      // Mas com Supabase Auth + RLS, muitas vezes não é necessário.
      // Se precisar de cookies no Next.js middleware, o supabase-js já lida com isso se configurado,
      // ou podemos setar manualmente.
      
      // Para manter compatibilidade com middleware existente que espera cookies:
      if (data.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${data.session.expires_in}; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=2592000; SameSite=Lax`; // 30 dias
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.message === 'Email not confirmed') {
        setError('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.');
      } else {
        setError(err.message || 'Falha ao fazer login. Verifique seu e-mail e senha.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <CardTitle className="text-2xl">Piscineiro Mestre APP</CardTitle>
          <CardDescription>Entre com seu e-mail e senha para acessar o painel.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400" type="button">
                      Esqueci a senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Redefinir Senha</DialogTitle>
                      <DialogDescription>
                        Informe seu e-mail para receber um link de redefinição de senha.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="reset-email">E-mail</Label>
                        <Input 
                          id="reset-email" 
                          type="email" 
                          placeholder="seu@email.com" 
                          value={resetEmail} 
                          onChange={(e) => setResetEmail(e.target.value)}
                          required 
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isResetLoading}>
                          {isResetLoading ? 'Enviando...' : 'Enviar Link'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div className="text-sm text-red-500 text-center">{error}</div>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
            <div className="text-center text-sm">
              Não tem uma conta?{' '}
              <Link href="/signup" className="underline text-blue-600 dark:text-blue-400">
                Cadastre-se
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
