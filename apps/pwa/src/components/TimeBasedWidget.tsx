'use client';

import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type TimeOfDay = 'morning' | 'afternoon' | 'night';

interface VerseData {
  reference: string;
  text: string;
}

const getTimeOfDay = (): TimeOfDay => {
  const currentHour = new Date().getHours();
  
  // Bom dia: 6h às 11h59
  if (currentHour >= 6 && currentHour < 12) {
    return 'morning';
  }
  // Boa tarde: 12h às 17h59  
  if (currentHour >= 12 && currentHour < 18) {
    return 'afternoon';
  }
  // Boa noite: 18h às 5h59 (incluindo madrugada)
  return 'night';
};

export function TimeBasedWidget() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [verse, setVerse] = useState<VerseData | null>(null);

  useEffect(() => {
    // Define a saudação correta após a montagem para evitar erro de hidratação
    setTimeOfDay(getTimeOfDay());

    // Busca o versículo do dia
    const fetchVerse = async () => {
      try {
        const response = await fetch('/api/verse');
        const data = await response.json();
        if (data.success && data.verse) {
          setVerse(data.verse);
        }
      } catch (error) {
        console.error('Erro ao buscar versículo:', error);
      }
    };

    fetchVerse();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-none shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
      <CardContent className="p-4 relative flex flex-col gap-2">
        <BookOpen className="absolute top-2 right-2 w-8 h-8 text-white/10" />
        
        <div className="relative z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {timeOfDay === 'morning' && 'Bom dia!'}
            {timeOfDay === 'afternoon' && 'Boa tarde!'}
            {timeOfDay === 'night' && 'Boa noite!'}
          </h2>
          
          {verse ? (
            <div className="mt-1">
              <p className="text-sm font-medium italic opacity-95 leading-snug">
                "{verse.text}"
              </p>
              <p className="text-xs font-semibold text-white/80 text-right mt-1">
                — {verse.reference}
              </p>
            </div>
          ) : (
            <div className="animate-pulse space-y-2 mt-2">
              <div className="h-3 bg-white/20 rounded w-3/4"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}