'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  order: number;
}

export function PlanSelection() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/plans');
        if (response.ok) {
          const plansData = await response.json();
          setPlans(plansData);
        } else {
          console.error('Erro ao buscar planos via API');
        }
      } catch (error) {
        console.error('Erro ao buscar planos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    if (plan.price > 0) {
      // Planos pagos ainda não disponíveis
      alert('Planos pagos em breve.');
      return;
    }

    setProcessingPlanId(plan.id);
    try {
      // Ativar plano gratuito
      if (!user) {
        alert('Você precisa estar logado para ativar um plano.');
        return;
      }

      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: 'free',
          status: 'authorized',
          updated_at: new Date().toISOString()
        });

      if (!error) {
        // Recarregar a página para atualizar o estado da assinatura
        window.location.reload();
        return;
      } else {
        console.error('Erro ao ativar plano gratuito:', error);
        alert('Erro ao ativar plano gratuito. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Erro de conexão. Verifique sua internet.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.id} className={`flex flex-col ${plan.price > 0 ? 'border-blue-500 shadow-lg' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {plan.name}
              {plan.price > 0 && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
            </CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="mb-4">
              <span className="text-3xl font-bold">
                {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
              </span>
              {plan.price > 0 && <span className="text-gray-500 dark:text-gray-400">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>}
            </div>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              variant={plan.price === 0 ? 'outline' : 'default'}
              onClick={() => handleSubscribe(plan)}
              disabled={plan.price > 0 || !!processingPlanId}
            >
              {processingPlanId === plan.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                plan.price === 0 ? 'Começar Grátis' : 'Em breve'
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
