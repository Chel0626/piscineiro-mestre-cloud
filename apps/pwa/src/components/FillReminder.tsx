'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Square, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface FillReminderState {
  isActive: boolean;
  timeRemaining: number;
  totalTime: number;
  isCompleted: boolean;
}

interface FillReminderProps {
  onStateChange: (state: FillReminderState) => void;
}

export function FillReminder({ onStateChange }: FillReminderProps) {
  const [duration, setDuration] = useState(30); // minutos
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Atualizar estado para o componente pai
  useEffect(() => {
    onStateChange({
      isActive,
      timeRemaining,
      totalTime,
      isCompleted
    });
  }, [isActive, timeRemaining, totalTime, isCompleted, onStateChange]);

  // Inicializar áudio
  useEffect(() => {
    try {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.volume = 0.8;
    } catch (error) {
      console.warn('Áudio de notificação não disponível:', error);
      audioRef.current = null;
    }
  }, []);

  // Timer
  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, timeRemaining]);

  const handleTimerComplete = () => {
    setIsActive(false);
    setIsPaused(false);
    
    // Tocar som/vibrar
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Fallback se o áudio não funcionar
        console.log('Audio playback failed');
      });
    }
    
    // Vibrar se disponível
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
    
    // Mostrar notificação
    if (Notification.permission === 'granted') {
      new Notification('Lembrete de Abastecimento', {
        body: 'Tempo de enchimento da piscina concluído!',
        icon: '/icon-192x192.png',
        tag: 'fill-reminder'
      });
    }
    
    toast.success('Tempo de abastecimento concluído! 💧', {
      duration: 10000,
      action: {
        label: 'Marcar como Feito',
        onClick: () => markAsCompleted()
      }
    });
  };

  const startTimer = () => {
    if (duration <= 0) {
      toast.error('Digite um tempo válido em minutos.');
      return;
    }
    
    const timeInSeconds = duration * 60;
    setTimeRemaining(timeInSeconds);
    setTotalTime(timeInSeconds);
    setIsActive(true);
    setIsPaused(false);
    setIsCompleted(false);
    
    toast.success(`Timer iniciado para ${duration} minutos!`);
  };

  const pauseTimer = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Timer retomado' : 'Timer pausado');
  };

  const stopTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(0);
    setTotalTime(0);
    toast.info('Timer cancelado');
  };

  const markAsCompleted = () => {
    setIsCompleted(true);
    setIsActive(false);
    setIsPaused(false);
    toast.success('Abastecimento marcado como concluído! ✅');
  };

  const resetReminder = () => {
    setIsCompleted(false);
    setIsActive(false);
    setIsPaused(false);
    setTimeRemaining(0);
    setTotalTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <Label htmlFor="duration">Tempo (minutos)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            max="180"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            placeholder="30"
          />
        </div>
        
        <Button onClick={startTimer} className="w-full">
          <Play className="h-4 w-4 mr-2" />
          Iniciar Timer
        </Button>
      </div>

      {/* Controles do timer ativo */}
      {isActive && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">restantes</div>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={pauseTimer}>
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={stopTimer}>
                  <Square className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary" onClick={markAsCompleted}>
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status de conclusão */}
      {isCompleted && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-200 font-medium">
                  Abastecimento Concluído
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetReminder}
                className="text-green-700 hover:text-green-800 dark:text-green-300"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}