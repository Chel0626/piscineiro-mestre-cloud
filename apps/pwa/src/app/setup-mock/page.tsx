'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SetupMockPage() {
  const [status, setStatus] = useState('idle');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  async function createMockAccount() {
    setStatus('running');
    addLog('Iniciando criação da conta mockup...');

    try {
      const email = 'mhmservicos91@gmail.com';
      const password = 'senha123';

      // 1. Criar ou Logar Usuário
      let user;
      addLog(`Tentando criar usuário ${email}...`);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        addLog(`Erro ao criar usuário: ${signUpError.message}. Tentando logar...`);
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (signInError) throw signInError;
        user = signInData.user;
        addLog('Logado com sucesso!');
      } else {
        user = signUpData.user;
        addLog('Usuário criado com sucesso!');
      }

      if (!user) throw new Error('Falha ao obter usuário.');

      // 2. Criar Perfil do Piscineiro
      addLog('Criando perfil do piscineiro...');
      await supabase.from('profiles').upsert({
        id: user.id,
        name: 'MHM Serviços',
        email: email,
        phone: '11999999999',
        updated_at: new Date().toISOString()
      });
      
      await supabase.from('subscriptions').upsert({
          user_id: user.id,
          status: 'active',
          plan_id: 'pro',
          updated_at: new Date().toISOString()
      });

      // 3. Criar Clientes Mockup
      addLog('Criando clientes de exemplo...');
      
      const clients = [
        {
          name: 'Condomínio Jardins',
          address: 'Rua das Flores, 123',
          neighborhood: 'Centro',
          phone: '11988887777',
          pool_volume: 50,
          service_value: 450,
          visit_frequency: 'biweekly',
          visit_days: ['Segunda-feira', 'Quinta-feira'],
          contract_start_date: '2024-01-10',
          filter_model: 'Dancor DFR-15',
          filter_sand_kg: 100,
          last_sand_change: '2024-06-15',
          next_sand_change: '2025-12-15',
          user_id: user.id
        },
        {
          name: 'Dona Maria Silva',
          address: 'Av. Paulista, 1000 - Casa 2',
          neighborhood: 'Bela Vista',
          phone: '11977776666',
          pool_volume: 25,
          service_value: 280,
          visit_frequency: 'weekly',
          visit_days: ['Sexta-feira'],
          contract_start_date: '2024-03-01',
          filter_model: 'Jacuzzi 15TP',
          filter_sand_kg: 50,
          last_sand_change: '2023-11-20',
          next_sand_change: '2025-05-20',
          user_id: user.id
        },
        {
          name: 'Clube Esportivo',
          address: 'Rua do Esporte, 500',
          neighborhood: 'Vila Olímpia',
          phone: '11966665555',
          pool_volume: 150,
          service_value: 1200,
          visit_frequency: 'biweekly',
          visit_days: ['Terça-feira', 'Sexta-feira'],
          contract_start_date: '2023-05-10',
          filter_model: 'Nautilus F650',
          filter_sand_kg: 250,
          last_sand_change: '2024-01-10',
          next_sand_change: '2025-07-10',
          user_id: user.id
        }
      ];

      for (const clientData of clients) {
        const { data: newClient, error } = await supabase.from('clients').insert(clientData).select().single();
        
        if (error) {
            addLog(`Erro ao criar cliente ${clientData.name}: ${error.message}`);
            continue;
        }
        
        addLog(`Cliente ${clientData.name} criado (ID: ${newClient.id})`);
        
        // Adicionar algumas visitas fictícias
        await supabase.from('visits').insert({
          client_id: newClient.id,
          user_id: user.id,
          date: '2024-12-01T10:00:00',
          ph: 7.2,
          chlorine: 3.0,
          alkalinity: 100,
          description: 'Condição da água: limpa'
        });
      }

      addLog('Processo concluído com sucesso!');
      setStatus('success');

    } catch (error: any) {
      console.error(error);
      addLog(`ERRO: ${error.message}`);
      setStatus('error');
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Setup Mock Account</h1>
      <p className="mb-4 text-gray-600">
        Esta página cria a conta <strong>mhmservicos91@gmail.com</strong> e popula com dados de exemplo.
      </p>
      
      <button 
        onClick={createMockAccount}
        disabled={status === 'running'}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'running' ? 'Criando...' : 'Criar Conta e Dados'}
      </button>

      <div className="mt-6 bg-gray-100 p-4 rounded h-64 overflow-y-auto text-xs font-mono">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
