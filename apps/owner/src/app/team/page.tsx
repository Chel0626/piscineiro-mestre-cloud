'use client';

import { Header } from '@/components/Header';
import { TeamList } from "@/components/TeamList";

export default function TeamPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 space-y-6 container mx-auto max-w-7xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie sua equipe de técnicos e controle o acesso ao sistema.
          </p>
        </div>
        
        <div className="grid gap-4">
          <TeamList />
        </div>
      </main>
    </div>
  );
}
