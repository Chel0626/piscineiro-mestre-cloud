'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { calculateTreatment, WaterAspect } from '@/lib/PoolCalculator';

const aspectOptions: { value: WaterAspect; label: string }[] = [
  { value: 'CRYSTAL', label: 'Cristalina/Limpa' },
  { value: 'CLOUDY', label: 'Turva/Embaçada' },
  { value: 'MILKY', label: 'Leitosa/Branca' },
  { value: 'GREEN', label: 'Verde/Algas' },
  { value: 'DARK_GREEN', label: 'Verde Pântano/Muito Suja' },
];

export function ProductCalculator() {
  const [poolVolume, setPoolVolume] = useState<number>(0);
  const [ph, setPh] = useState<number>(7.4);
  const [alkalinity, setAlkalinity] = useState<number>(100);
  const [chlorine, setChlorine] = useState<number>(3.0);
  const [aspect, setAspect] = useState<WaterAspect>('CRYSTAL');

  const result = poolVolume > 0
    ? calculateTreatment({ poolVolume, ph, alkalinity, chlorine, aspect })
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Tratamento Químico</CardTitle>
        <CardDescription>
          Algoritmo avançado para correção dos parâmetros e tratamento da água.
          <br />
          <strong>Metas:</strong> Alcalinidade: 80-120 ppm | pH: 7.2-7.6 | Cloro: 3.0 ppm
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="volume">Volume da Piscina (m³)</Label>
              <Input
                id="volume"
                type="number"
                step="1"
                placeholder="Ex: 30"
                value={poolVolume || ''}
                onChange={e => setPoolVolume(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="aspect">Aspecto da Água</Label>
              <select
                id="aspect"
                className="w-full border rounded px-2 py-2 bg-background"
                value={aspect}
                onChange={e => setAspect(e.target.value as WaterAspect)}
              >
                {aspectOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="ph">pH Atual</Label>
              <Input
                id="ph"
                type="number"
                step="0.1"
                placeholder="7.4"
                value={ph || ''}
                onChange={e => setPh(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="alkalinity">Alcalinidade (ppm)</Label>
              <Input
                id="alkalinity"
                type="number"
                step="1"
                placeholder="100"
                value={alkalinity || ''}
                onChange={e => setAlkalinity(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="chlorine">Cloro Livre (ppm)</Label>
              <Input
                id="chlorine"
                type="number"
                step="0.1"
                placeholder="3.0"
                value={chlorine || ''}
                onChange={e => setChlorine(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <h4 className="font-semibold text-lg mb-3">Plano de Ação:</h4>
            {poolVolume === 0 ? (
              <div className="text-orange-600 dark:text-orange-400 font-medium">⚠️ Informe o volume da piscina para calcular o tratamento.</div>
            ) : result && result.steps.length > 0 ? (
              <ol className="space-y-3 list-decimal ml-4">
                {result.steps.map(step => (
                  <li key={step.order} className="text-sm text-gray-800 dark:text-gray-200">
                    <span className="font-semibold">{step.product}:</span> <span className="font-mono">{step.amount} {step.unit}</span><br />
                    <span className="italic text-gray-600 dark:text-gray-400">{step.instruction}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-green-600 dark:text-green-400 font-medium">✅ Parâmetros dentro da faixa ideal. Manutenção normal.</div>
            )}
            {result && result.warnings.length > 0 && (
              <div className="mt-4 space-y-2">
                {result.warnings.map((w, i) => (
                  <div key={i} className="text-xs text-orange-700 dark:text-orange-400">⚠️ {w}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}