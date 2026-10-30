import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from '@/components/AppLayout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ChunkLoadErrorHandler } from '@/components/ChunkLoadErrorHandler';
import { SplashScreen } from '@/components/SplashScreen';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Piscineiro Mestre APP - Gestão Profissional de Piscinas',
  description: 'App completo para gestão profissional de piscinas com clientes, roteiros, calculadora de produtos químicos e controle de pagamentos',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['piscineiro', 'piscina', 'gestão', 'clientes', 'produtos químicos', 'manutenção'],
  authors: [
    { name: 'Piscineiro Team' },
  ],
  icons: {
    icon: '/icon-192x192.png',
    shortcut: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
  metadataBase: new URL('https://piscineiro-app.vercel.app'),
  openGraph: {
    type: 'website',
    title: 'Piscineiro Mestre APP - Gestão Profissional de Piscinas',
    description: 'App completo para gestão profissional de piscinas',
    siteName: 'Piscineiro Mestre APP',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Piscineiro Mestre APP',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Piscineiro Mestre APP',
    description: 'Gestão profissional de piscinas',
    images: ['/icon-512x512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Piscineiro Mestre APP',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Piscineiro Mestre APP',
    'application-name': 'Piscineiro Mestre APP',
    'msapplication-TileColor': '#0284c7',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#0284c7',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#0284c7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PiscineiroApp" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="PiscineiroApp" />
        <meta name="msapplication-TileColor" content="#0284c7" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={inter.className}>
        <SplashScreen />
        <ChunkLoadErrorHandler />
        <ServiceWorkerRegistration />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Não precisamos mais do AuthProvider aqui, o AppLayout e o middleware cuidam de tudo */}
          <AppLayout>{children}</AppLayout>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}