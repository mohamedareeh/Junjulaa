"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Users,
  HardHat,
  Shirt,
  DollarSign,
  PiggyBank,
  MapPin,
  CalendarDays,
  FileText,
  Settings,
  Menu,
  LogOut,
  Clapperboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { logoutAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Episodes", href: "/episodes", icon: Film },
  { label: "Cast", href: "/cast", icon: Users },
  { label: "Crew", href: "/crew", icon: HardHat },
  { label: "Costumes", href: "/costumes", icon: Shirt },
  { label: "Expenses", href: "/expenses", icon: DollarSign },
  { label: "Budget", href: "/budget", icon: PiggyBank },
  { label: "Locations", href: "/locations", icon: MapPin },
  { label: "Schedule", href: "/schedule", icon: CalendarDays },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarNavProps {
  user: {
    name: string;
    role: string;
  };
}

function SidebarContent({ user, pathname }: SidebarNavProps & { pathname: string }) {
  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* App title */}
      <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-5">
        <Clapperboard className="h-6 w-6 text-white" />
        <span className="text-lg font-bold tracking-tight">Junjulaa</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-700 px-4 py-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs capitalize text-slate-400">{user.role}</p>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

export function SidebarNav({ user }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 md:block">
        <SidebarContent user={user} pathname={pathname} />
      </aside>

      {/* Mobile sidebar */}
      <div className="fixed top-0 left-0 z-40 flex h-14 w-full items-center border-b bg-white px-4 md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent user={user} pathname={pathname} />
          </SheetContent>
        </Sheet>
        <div className="ml-3 flex items-center gap-2">
          <Clapperboard className="h-5 w-5" />
          <span className="font-bold">Junjulaa</span>
        </div>
      </div>
      {/* Spacer for mobile header */}
      <div className="h-14 md:hidden" />
    </>
  );
}
