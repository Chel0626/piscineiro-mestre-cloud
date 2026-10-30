"use client";

import { Button } from "@/components/ui/button";

export default function SentryTestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Teste de Integração Sentry</h1>
      <p>Clique no botão abaixo para gerar um erro intencional.</p>
      
      <Button
        variant="destructive"
        onClick={() => {
          throw new Error("Sentry Test Error: Verificando se o Sentry está capturando erros!");
        }}
      >
        Gerar Erro (Client-Side)
      </Button>

      <Button
        variant="outline"
        onClick={async () => {
            await fetch("/api/sentry-test");
        }}
      >
        Gerar Erro (Server-Side / API)
      </Button>
    </div>
  );
}
