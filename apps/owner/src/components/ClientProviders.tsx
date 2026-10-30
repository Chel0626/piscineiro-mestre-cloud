"use client";

import React from 'react';
import { AuthContextProvider } from '@/context/AuthContext';
import { ThemeProvider } from 'next-themes';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </ThemeProvider>
  );
}
