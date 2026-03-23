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

const producerNavItems = [
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

const crewNavItems = [
  { label: "My Scripts", href: "/my-scripts", icon: FileText },
  { label: "Schedule", href: "/schedule", icon: CalendarDays },
];

interface SidebarNavProps {
  user: {
    name: string;
    role: string;
  };
}

function SidebarContent({ user, pathname }: SidebarNavProps & { pathname: string }) {
  const navItems =
    user.role === "producer" || user.role === "director"
      ? producerNavItems
      : crewNavItems;

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-100">
      {/* App title */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900">
          <Clapperboard className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-gray-900">Junjulaa</span>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Production</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-gray-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-[11px] capitalize text-gray-400">{user.role}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900"
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
      <aside className="hidden w-[260px] shrink-0 md:block">
        <SidebarContent user={user} pathname={pathname} />
      </aside>

      {/* Mobile sidebar */}
      <div className="fixed top-0 left-0 z-40 flex h-14 w-full items-center border-b border-gray-100 bg-white/80 px-4 backdrop-blur-xl md:hidden">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="h-5 w-5 text-gray-600" />
                <span className="sr-only">Open menu</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-[260px] p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent user={user} pathname={pathname} />
          </SheetContent>
        </Sheet>
        <div className="ml-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-900">
            <Clapperboard className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Junjulaa</span>
        </div>
      </div>
      {/* Spacer for mobile header */}
      <div className="h-14 md:hidden" />
    </>
  );
}
