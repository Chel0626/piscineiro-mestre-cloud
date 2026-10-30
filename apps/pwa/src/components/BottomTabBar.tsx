'use client';

import { LayoutDashboard, Users, Calendar, ClipboardList } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  {
    icon: LayoutDashboard,
    label: "Início",
    href: "/dashboard",
  },
  {
    icon: Calendar,
    label: "Roteiros",
    href: "/dashboard/roteiros",
  },
  {
    icon: Users,
    label: "Clientes",
    href: "/dashboard/clientes",
  },
  {
    icon: ClipboardList,
    label: "Relatórios",
    href: "/dashboard/relatorios",
  },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-lg border-t border-border flex items-center justify-between px-0">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center h-full gap-1 transition-colors hover:bg-accent",
              isActive ? "text-blue-600" : "text-muted-foreground"
            )}
          >
            <tab.icon className={cn("h-5 w-5", isActive && "fill-current")} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
