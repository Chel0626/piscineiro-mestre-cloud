'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

export interface FillReminderState {
  isActive: boolean;
  timeRemaining: number;
  totalTime: number;
  isCompleted: boolean;
}

interface FillReminderContextType {
  state: FillReminderState;
  startTimer: (minutes: number) => void;
  stopTimer: () => void;
  markAsCompleted: () => void;
  resetTimer: () => void;
}

const FillReminderContext = createContext<FillReminderContextType | null>(null);

export function useFillReminder() {
  const context = useContext(FillReminderContext);
  if (!context) {
    throw new Error('useFillReminder must be used within a FillReminderProvider');
  }
  return context;
}

interface FillReminderProviderProps {
  children: ReactNode;
}

export function FillReminderProvider({ children }: FillReminderProviderProps) {
  const [state, setState] = useState<FillReminderState>({
    isActive: false,
    timeRemaining: 0,
    totalTime: 0,
    isCompleted: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer principal que roda independente do UI
  useEffect(() => {
    if (state.isActive && state.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setState(prevState => {
          if (prevState.timeRemaining <= 1) {
            // Timer completou
            console.log('Timer de abastecimento concluído!');
            return {
              ...prevState,
              isActive: false,
              isCompleted: true,
              timeRemaining: 0
            };
          }
          return {
            ...prevState,
            timeRemaining: prevState.timeRemaining - 1
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive, state.timeRemaining]);

  const startTimer = (minutes: number) => {
    const totalSeconds = minutes * 60;
    console.log(`Iniciando timer: ${minutes} minutos (${totalSeconds} segundos)`);
    setState({
      isActive: true,
      timeRemaining: totalSeconds,
      totalTime: totalSeconds,
      isCompleted: false
    });
  };

  const stopTimer = () => {
    console.log('Timer parado');
    setState(prevState => ({
      ...prevState,
      isActive: false,
      timeRemaining: 0,
      totalTime: 0
    }));
  };

  const markAsCompleted = () => {
    console.log('Timer marcado como concluído');
    setState(prevState => ({
      ...prevState,
      isActive: false,
      isCompleted: true,
      timeRemaining: 0
    }));
  };

  const resetTimer = () => {
    console.log('Timer resetado');
    setState({
      isActive: false,
      timeRemaining: 0,
      totalTime: 0,
      isCompleted: false
    });
  };

  return (
    <FillReminderContext.Provider 
      value={{
        state,
        startTimer,
        stopTimer,
        markAsCompleted,
        resetTimer
      }}
    >
      {children}
    </FillReminderContext.Provider>
  );
}