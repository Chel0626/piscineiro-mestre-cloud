'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Activity, 
  Settings, 
  LogOut,
  PackageSearch,
  BadgeDollarSign
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Header() {
  const { signOut, tenant, role } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Roteiros', href: '/routes', icon: Calendar },
    { name: 'Engajamento', href: '/engajamento', icon: Activity },
    { name: 'Pedidos de Prod.', href: '/product-requests', icon: PackageSearch },
    { name: 'Preços', href: '/products', icon: BadgeDollarSign },
    { name: 'Configurações', href: '/settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
      <div className="flex h-16 items-center justify-between container mx-auto max-w-7xl">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Piscineiro Mestre
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 px-4 text-sm font-medium",
                    pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <div className="hidden md:block h-6 w-[1px] bg-border mx-2" />
          
          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-primary">{tenant?.name}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{role}</span>
            </div>

            {/* SININHO ADICIONADO AQUI (Versão Desktop) */}
            <NotificationBell />

            <Button variant="ghost" size="icon" onClick={() => signOut()} title="Sair">
              <LogOut className="h-5 w-5 text-muted-foreground hover:text-destructive transition-colors" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t py-4 space-y-2 animate-in slide-in-from-top-4 duration-200 shadow-lg absolute w-full bg-background left-0 px-4">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} onClick={() => setIsMenuOpen(false)}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-12 px-4 text-base",
                  pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          ))}
          <div className="pt-4 pb-2 border-t flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary">{tenant?.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{role}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* SININHO ADICIONADO AQUI (Versão Mobile) */}
              <NotificationBell />

              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}