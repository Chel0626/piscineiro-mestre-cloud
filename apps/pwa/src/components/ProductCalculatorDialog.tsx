'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { ProductCalculator } from './ProductCalculatorSimple';

interface ProductCalculatorDialogProps {
  triggerButton?: React.ReactNode | null;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductCalculatorDialog({ 
  triggerButton,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange
}: ProductCalculatorDialogProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Usa estado externo se fornecido, caso contrário usa interno
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnOpenChange || setInternalIsOpen;

  // Se triggerButton for null, não renderiza trigger (controlado externamente)
  const showTrigger = triggerButton !== null;
  
  const defaultTrigger = (
    <Button
      variant="ghost" 
      className="w-full justify-start px-4 py-2 mt-2 text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors h-auto"
    >
      <Calculator className="h-5 w-5" />
      <span className="ml-3">Calculadora de Produtos</span>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          {triggerButton || defaultTrigger}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
        <div className="mt-0">
          <ProductCalculator />
        </div>
      </DialogContent>
    </Dialog>
  );
}