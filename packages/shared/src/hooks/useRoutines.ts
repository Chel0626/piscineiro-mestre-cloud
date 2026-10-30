'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { ClientFormData } from '../validators/clientSchema';
import { mapClientFromDB } from '../utils/mappers';


interface Client extends ClientFormData {
  id: string;
}

interface GroupedClients {
  [day: string]: Client[];
}

export function useRoutines(tenantId?: string, workerId?: string, day?: string) {
  const [groupedClients, setGroupedClients] = useState<GroupedClients>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      let resolvedTenantId = tenantId;

      // Se tenantId não foi passado, tentar resolver a partir do workerId (user id)
      if (!resolvedTenantId && workerId) {
        try {
          const { data: member, error: memberError } = await supabase
            .from('tenant_members')
            .select('tenant_id')
            .eq('user_id', workerId)
            .limit(1)
            .single();

          if (member && member.tenant_id) {
            resolvedTenantId = member.tenant_id;
          } else if (memberError) {
            console.warn('useRoutines: não foi possível resolver tenant_id a partir do workerId:', memberError);
          }
        } catch (err) {
          console.error('useRoutines: erro ao buscar tenant_members para resolver tenantId:', err);
        }
      }

      if (!resolvedTenantId) {
        // Ainda não temos tenantId — evita executar query sem tenant
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', resolvedTenantId);

      if (workerId) {
        query = query.eq('worker_id', workerId);
      }

      // Se day for informado, filtra direto no Supabase
      if (day) {
        query = query.contains('visit_days', [day]);
      }

      let data: any; let error: any;
      try {
        const resp: any = await query;
        data = resp.data;
        error = resp.error;
      } catch (err) {
        console.error('useRoutines: erro executando query clients:', err);
        setIsLoading(false);
        return;
      }

      if (error) {
        console.error("Erro ao buscar clientes para roteiros:", error);
        // continua para tentar fallback abaixo
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        // Nenhum resultado em `clients` — tentar fallback em `ad_hoc_clients`
        try {
          const fallback = await supabase
            .from('ad_hoc_clients')
            .select('*')
            .eq('tenant_id', resolvedTenantId);
          if (fallback.error) {
            console.warn('useRoutines: fallback ad_hoc_clients retornou erro:', fallback.error);
          } else if (fallback.data && fallback.data.length) {
            data = fallback.data;
          }
        } catch (err) {
          console.error('useRoutines: erro ao executar fallback ad_hoc_clients:', err);
        }
      }

      if (data) {
        const clientsData = data.map(mapClientFromDB);

        if (day) {
          setGroupedClients({ [day]: clientsData });
        } else {
          // Mapeamento flexível de nomes de dias para garantir agrupamento correto
          const dayAliases: Record<string, string[]> = {
            'Segunda-feira': ['segunda-feira', 'segunda', 'seg', 'monday', 'mon', '2'],
            'Terça-feira': ['terça-feira', 'terca-feira', 'terça', 'terca', 'ter', 'tue', 'tuesday', '3'],
            'Quarta-feira': ['quarta-feira', 'quarta', 'qua', 'wed', 'wednesday', '4'],
            'Quinta-feira': ['quinta-feira', 'quinta', 'qui', 'thu', 'thursday', '5'],
            'Sexta-feira': ['sexta-feira', 'sexta', 'sex', 'fri', 'friday', '6'],
            'Sábado': ['sábado', 'sabado', 'sab', 'sat', 'saturday', '7'],
            'Domingo': ['domingo', 'dom', 'sun', 'sunday', '1'],
          };

          // Função para normalizar e mapear qualquer valor para a chave do front
          function mapToDayKey(str: string): string | null {
            if (!str) return null;
            const norm = str
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[-_ ]/g, '')
              .toLowerCase();
            for (const [key, aliases] of Object.entries(dayAliases)) {
              if (aliases.some(alias => norm === alias.replace(/[-_ ]/g, '').toLowerCase())) {
                return key;
              }
            }
            return null;
          }

          // Agrupa clientes por dia, aceitando qualquer variação
          const grouped: GroupedClients = {
            'Segunda-feira': [],
            'Terça-feira': [],
            'Quarta-feira': [],
            'Quinta-feira': [],
            'Sexta-feira': [],
            'Sábado': [],
            'Domingo': [],
          };
          clientsData.forEach((client: Client) => {
            if (!Array.isArray(client.visitDays)) {
              console.warn('Cliente sem visitDays array:', client);
              return;
            }
            client.visitDays.forEach(dayRaw => {
              const mapped = mapToDayKey(dayRaw);
              if (mapped && grouped[mapped]) {
                grouped[mapped].push(client);
              }
            });
          });

          setGroupedClients(grouped);
        }
      }
      setIsLoading(false);
    };

    fetchClients();
  }, [tenantId, workerId, day]);

  return { groupedClients, isLoading };
}
