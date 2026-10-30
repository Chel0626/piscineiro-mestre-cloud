import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ReactNode } from 'react';

// Trocamos o '@/' por '../' para garantir que ele ache a pasta components
import ClientProviders from '../components/ClientProviders'; 
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// 1. Configurações de Viewport (Adicionado o Viewport Type e o themeColor)
export const viewport: Viewport = {
  themeColor: '#0284c7', // Cor da barra de status (mude para a cor principal do seu app)
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Impede o Safari de dar aquele zoom chato nos formulários
  viewportFit: 'cover',
};

// 2. Configurações de Metadata (A mágica do PWA e da Apple entra aqui)
export const metadata: Metadata = {
  title: 'Piscineiro Owner Dashboard',
  description: 'Gestão de equipe e gráficos para donos de empresas de piscina',
  manifest: '/manifest.json', // Chama o manifesto que fica na pasta public
  appleWebApp: {
    capable: true, // É ISSO AQUI que faz abrir em tela cheia sem barras no iPhone!
    statusBarStyle: 'default',
    title: 'Piscineiro',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}