'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';
import { useAppTemporaryReschedule } from '@/hooks/useAppTemporaryReschedule';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface DayRescheduleProps {
  clientId: string;
  clientName: string;
  originalDay: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const daysOfWeek = [
  'Segunda-feira',
  'Terça-feira', 
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

export function DayReschedule({ clientId, clientName, originalDay, onSuccess, onCancel }: DayRescheduleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const { rescheduleClient, isLoading, getClientReschedule } = useAppTemporaryReschedule();

  const isAlreadyRescheduled = getClientReschedule(clientId);

  const handleDaySelect = (day: string) => {
    setSelectedDay(day);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedDay || selectedDay === originalDay) {
      return;
    }

    const success = await rescheduleClient(clientId, clientName, originalDay, selectedDay);
    if (success) {
      setIsExpanded(false);
      setSelectedDay('');
      onSuccess?.();
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsExpanded(open);
    if (!open) {
        setSelectedDay('');
        onCancel?.();
    }
  }

  // Se já foi reagendado, mostrar status
  if (isAlreadyRescheduled) {
    return (
      <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        Movido para {isAlreadyRescheduled.newDay}
      </div>
    );
  }

  return (
    <Dialog open={isExpanded} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 px-2"
          disabled={isLoading}
          onClick={(e) => e.stopPropagation()}
        >
          <Calendar className="mr-1 h-3 w-3" />
          Mover Dia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Mover para outro dia</DialogTitle>
          <DialogDescription>
            Selecione o dia para onde deseja mover <strong className="text-gray-900 dark:text-white">{clientName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-1.5 py-4 max-h-[60vh] overflow-y-auto">
            {daysOfWeek.map((day) => (
            <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                size="sm"
                onClick={() => handleDaySelect(day)}
                disabled={day === originalDay}
                className={`justify-start text-sm h-9 ${
                day === originalDay 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
            >
                {day}
                {day === originalDay && ' (dia atual)'}
            </Button>
            ))}
        </div>

        <DialogFooter>
            <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="flex-1"
            >
            Cancelar
            </Button>
            <Button
            onClick={handleConfirmReschedule}
            disabled={!selectedDay || selectedDay === originalDay || isLoading}
            className="flex-1"
            >
            {isLoading ? (
                'Movendo...'
            ) : (
                <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Confirmar
                </>
            )}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}