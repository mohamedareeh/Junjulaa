import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "./sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    name: session.user.name ?? "User",
    role: (session.user as { role?: string }).role ?? "crew",
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav user={user} />
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
        {children}
      </main>
    </div>
  );
}
