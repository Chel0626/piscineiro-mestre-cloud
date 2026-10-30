import { NextResponse, type NextRequest } from 'next/server';

type ApiHandler = (req: NextRequest, context?: any) => Promise<NextResponse>;

interface SafetyOptions {
  timeoutMs?: number; // Tempo máximo de execução em milissegundos
  route?: string;     // Nome da rota para logs
}

/**
 * Wrapper de segurança para rotas da API.
 * Protege contra:
 * 1. Execução infinita (Timeout)
 * 2. Erros não tratados
 * 3. Monitoramento básico de memória
 */
export function withSafety(handler: ApiHandler, options: SafetyOptions = {}): ApiHandler {
  // Timeout padrão de 9.5 segundos (Vercel Hobby tem limite de 10s para Serverless Functions)
  // Deixamos uma margem de segurança.
  const { timeoutMs = 9500, route = 'unknown' } = options;

  return async (req: NextRequest, context?: any) => {
    const start = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      // Promise que rejeita após o tempo limite
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Execution Timeout'));
        }, timeoutMs);
      });

      // Corrida entre a execução da rota e o timeout
      const response = await Promise.race([
        handler(req, context),
        timeoutPromise
      ]);

      // Monitoramento pós-execução
      const duration = Date.now() - start;
      const endMemory = process.memoryUsage().heapUsed;
      const memoryDiff = (endMemory - startMemory) / 1024 / 1024; // MB

      // Log se houver consumo excessivo ou demora
      if (duration > timeoutMs * 0.8) {
        console.warn(`[Safety: ${route}] Rota lenta: ${duration}ms`);
      }
      if (memoryDiff > 50) { // Alerta se crescer mais de 50MB numa única requisição
        console.warn(`[Safety: ${route}] Alto consumo de memória: +${memoryDiff.toFixed(2)}MB`);
      }

      return response;

    } catch (error: any) {
      const duration = Date.now() - start;
      console.error(`[Safety: ${route}] Erro após ${duration}ms:`, error);

      if (error.message === 'Execution Timeout') {
        return NextResponse.json(
          { 
            error: 'A requisição demorou muito e foi interrompida para segurança.',
            code: 'TIMEOUT' 
          },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Erro interno processando a requisição.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
  };
}
