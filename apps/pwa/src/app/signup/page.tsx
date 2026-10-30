'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Building2, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const [step, setStep] = useState<'selection' | 'form'>('selection');
  const [accountType, setAccountType] = useState<'solo' | 'company'>('solo');
  const [companyName, setCompanyName] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSelection = (type: 'solo' | 'company') => {
    setAccountType(type);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            account_type: accountType,
            company_name: accountType === 'company' ? companyName : null,
          }
        },
      });

      if (error) throw error;

      if (data.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${data.session.expires_in}; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=2592000; SameSite=Lax`; // 30 dias
        toast.success('Conta criada com sucesso!');
        router.push('/dashboard');
      } else if (data.user && !data.session) {
        toast.success('Conta criada! Verifique seu e-mail para ativar a conta.');
        router.push('/login');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'User already registered') {
        setError('Este e-mail já está em uso.');
      } else {
        setError(err.message || 'Falha ao criar a conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'selection') {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Crie sua conta
            </h2>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Para começar, selecione como você atua profissionalmente
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card 
              className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 group"
              onClick={() => handleSelection('solo')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto bg-blue-100 dark:bg-blue-900 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                </div>
                <CardTitle>Piscineiro Solo</CardTitle>
                <CardDescription>
                  Para profissionais autônomos que gerenciam suas próprias rotas e clientes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                  <li>✓ Gestão de clientes e rotas</li>
                  <li>✓ Calculadora de produtos</li>
                  <li>✓ Controle financeiro simples</li>
                </ul>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 group"
              onClick={() => handleSelection('company')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto bg-purple-100 dark:bg-purple-900 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-300" />
                </div>
                <CardTitle>Empresa</CardTitle>
                <CardDescription>
                  Para empresas com múltiplos funcionários e gestão centralizada.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                  <li>✓ Múltiplos usuários</li>
                  <li>✓ Gestão de equipe</li>
                  <li>✓ Relatórios avançados</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
             <p className="text-sm text-gray-600 dark:text-gray-300">
              Já tem uma conta?{' '}
              <Link href="/login" className="underline hover:text-blue-600 dark:hover:text-blue-400">Faça login</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center mb-2">
            <Button variant="ghost" size="icon" onClick={() => setStep('selection')} className="-ml-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500 ml-2">Voltar para seleção</span>
          </div>
          <CardTitle className="text-2xl">
            Cadastro {accountType === 'solo' ? 'Solo' : 'Empresa'}
          </CardTitle>
          <CardDescription>Preencha seus dados para criar a conta.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            
            {accountType === 'company' && (
              <div className="grid gap-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input 
                  id="companyName" 
                  type="text" 
                  placeholder="Nome da sua empresa" 
                  required 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                />
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
