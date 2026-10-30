'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Square, CheckCircle } from 'lucide-react';
import { useFillReminder, FillReminderState } from '@/context/FillReminderContext';

interface FillReminderSimpleProps {
  onStateChange?: (state: FillReminderState) => void;
}

export function FillReminderSimple({ onStateChange }: FillReminderSimpleProps) {
  const [duration, setDuration] = useState(15); // minutos
  const { state, startTimer, stopTimer, markAsCompleted, resetTimer } = useFillReminder();
  
  const { isActive, timeRemaining, totalTime, isCompleted } = state;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    startTimer(duration);
  };

  const handleStopTimer = () => {
    stopTimer();
  };

  const handleMarkAsCompleted = () => {
    markAsCompleted();
  };

  const handleReset = () => {
    resetTimer();
  };

  return (
    <div className="space-y-4">
      {/* Configuração */}
      <div className="space-y-2">
        <Label htmlFor="duration">Tempo (minutos)</Label>
        <Input
          id="duration"
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          min={1}
          max={120}
          disabled={isActive}
        />
      </div>

      {/* Status atual */}
      {!isActive && !isCompleted && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span>Pronto para iniciar timer</span>
              <Button onClick={handleStartTimer} size="sm">
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timer ativo */}
      {isActive && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <div className="text-2xl font-mono text-blue-600 dark:text-blue-400">
                {formatTime(timeRemaining)}
              </div>
              <div className="flex justify-center gap-2">
                <Button size="sm" variant="outline" onClick={handleStopTimer}>
                  <Square className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary" onClick={handleMarkAsCompleted}>
                  <CheckCircle className="h-4 w-4" />
                  Concluir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Concluído */}
      {isCompleted && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Abastecimento Concluído
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
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