'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Droplets, Beaker, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface ProductConsumed {
  item_id: string;
  name: string;
  qty: number;
  unit: string;
}

interface Visit {
  id: string;
  timestamp: any;
  products_consumed?: ProductConsumed[];
  measurements?: {
    ph: number;
    chlorine_ppm: number;
    alkalinity_ppm: number;
  };
  notes?: string;
}

interface VisitHistoryCardProps {
  visits: Visit[];
}

export function VisitHistoryCard({ visits }: VisitHistoryCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!visits || visits.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Visitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma visita registrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Visitas
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        
        {!isOpen && (
          <CardContent className="pb-4 pt-0">
            <p className="text-sm text-muted-foreground">
              {visits.length} visita{visits.length !== 1 ? 's' : ''} registrada{visits.length !== 1 ? 's' : ''}. 
              <span className="block text-xs mt-1">
                Última: {visits[0]?.timestamp ? format(
                  typeof visits[0].timestamp.toDate === 'function' ? visits[0].timestamp.toDate() : new Date(visits[0].timestamp),
                  "dd 'de' MMMM", { locale: ptBR }
                ) : 'N/A'}
              </span>
            </p>
          </CardContent>
        )}

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {visits.map((visit) => {
              let dateStr = 'Data desconhecida';
              if (visit.timestamp) {
                const date = typeof visit.timestamp.toDate === 'function' 
                  ? visit.timestamp.toDate() 
                  : new Date(visit.timestamp);
                dateStr = format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
              }

              return (
                <div key={visit.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm">{dateStr}</span>
                  </div>
                  
                  {/* Medições */}
                  {visit.measurements && (
                    <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Beaker className="h-3 w-3" />
                        <span>pH: {visit.measurements.ph}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="h-3 w-3" />
                        <span>Cloro: {visit.measurements.chlorine_ppm} ppm</span>
                      </div>
                    </div>
                  )}

                  {/* Produtos */}
                  {visit.products_consumed && visit.products_consumed.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
                      <span className="font-semibold block mb-1">Produtos Aplicados:</span>
                      <ul className="space-y-1">
                        {visit.products_consumed.map((prod, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>{prod.name}</span>
                            <span className="font-medium">{prod.qty} {prod.unit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {visit.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      "{visit.notes}"
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
