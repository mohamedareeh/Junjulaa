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
  LogOut,
  Clapperboard,
  Ellipsis,
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

// Bottom bar shows 4 primary items + "More" for producers
const producerBottomItems = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Episodes", href: "/episodes", icon: Film },
  { label: "Schedule", href: "/schedule", icon: CalendarDays },
  { label: "Expenses", href: "/expenses", icon: DollarSign },
];

const crewBottomItems = [
  { label: "Scripts", href: "/my-scripts", icon: FileText },
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

function BottomNav({ user, pathname }: SidebarNavProps & { pathname: string }) {
  const isProducer = user.role === "producer" || user.role === "director";
  const bottomItems = isProducer ? producerBottomItems : crewBottomItems;
  const allNavItems = isProducer ? producerNavItems : crewNavItems;

  // Items NOT shown in bottom bar (for the "More" sheet)
  const moreItems = isProducer
    ? allNavItems.filter((item) => !bottomItems.some((b) => b.href === item.href))
    : [];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
      <nav className="flex items-center justify-around px-2 py-1">
        {bottomItems.map((item) => {
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
                "flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors",
                isActive ? "text-gray-900" : "text-gray-400"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-gray-900" : "text-gray-400")} />
              <span className={cn("text-[10px] font-medium", isActive ? "text-gray-900" : "text-gray-400")}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -top-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gray-900" />
              )}
            </Link>
          );
        })}

        {/* More button for producers */}
        {isProducer && (
          <Sheet>
            <SheetTrigger
              render={
                <button
                  className={cn(
                    "flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors",
                    moreItems.some((item) =>
                      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                    )
                      ? "text-gray-900"
                      : "text-gray-400"
                  )}
                >
                  <Ellipsis className="h-5 w-5" />
                  <span className="text-[10px] font-medium">More</span>
                </button>
              }
            />
            <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" showCloseButton={false}>
              <SheetTitle className="sr-only">More options</SheetTitle>
              <div className="mx-auto mb-4 mt-2 h-1 w-10 rounded-full bg-gray-200" />
              <div className="grid grid-cols-4 gap-3 pb-2">
                {moreItems.map((item) => {
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
                        "flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-colors",
                        isActive
                          ? "bg-gray-900 text-white"
                          : "bg-gray-50 text-gray-600 active:bg-gray-100"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[11px] font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <form action={logoutAction} className="mt-2">
                <Button
                  type="submit"
                  variant="ghost"
                  className="w-full justify-center gap-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </form>
            </SheetContent>
          </Sheet>
        )}

        {/* Crew: sign out directly in bottom bar */}
        {!isProducer && (
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-gray-400 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-[10px] font-medium">Sign out</span>
            </button>
          </form>
        )}
      </nav>
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

      {/* Mobile bottom navigation */}
      <BottomNav user={user} pathname={pathname} />

      {/* Bottom spacer for mobile to prevent content being hidden behind bottom nav */}
      <div className="h-[72px] md:hidden fixed bottom-0 pointer-events-none" />
    </>
  );
}
