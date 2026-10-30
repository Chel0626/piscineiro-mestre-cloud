'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Save, Building2, Phone, Mail, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [companyData, setCompanyData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    async function loadSettings() {
      if (!tenant?.id) return;
      
      const { data, error } = await supabase
        .from('tenants')
        .select('name, phone, email, address')
        .eq('id', tenant.id)
        .single();

      if (data) {
        setCompanyData({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || ''
        });
      }
    }

    loadSettings();
  }, [tenant]);

  const handleSave = async () => {
    if (!tenant?.id) return;
    
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: companyData.name,
          phone: companyData.phone,
          email: companyData.email,
          address: companyData.address
        })
        .eq('id', tenant.id);

      if (error) throw error;
      
      // Mostrar mensagens de sucesso
      const message = '✓ Configurações salvas com sucesso!';
      setSuccessMessage(message);
      toast.success(message);
      
      // Limpar mensagem após 5 segundos
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro ao salvar configurações';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      
      // Limpar mensagem de erro após 5 segundos
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 space-y-6 container mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Configurações da Empresa</h1>
        </div>

        {/* Mensagem de Sucesso */}
        {successMessage && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
            <CardDescription>
              Dados da empresa que serão usados nos relatórios e contatos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  className="pl-9"
                  value={companyData.name}
                  onChange={e => setCompanyData({...companyData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone de Contato (WhatsApp)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="phone" 
                  className="pl-9"
                  placeholder="Ex: 5511999999999"
                  value={companyData.phone}
                  onChange={e => setCompanyData({...companyData, phone: e.target.value})}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Insira o número com DDD e o 55 no início. Este número será usado pelos funcionários para enviar relatórios para aprovação.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  className="pl-9"
                  type="email"
                  value={companyData.email}
                  onChange={e => setCompanyData({...companyData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="address" 
                  className="pl-9"
                  value={companyData.address}
                  onChange={e => setCompanyData({...companyData, address: e.target.value})}
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Button onClick={handleSave} disabled={loading} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
