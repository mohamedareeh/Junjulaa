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
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      <SidebarNav user={user} />
      <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-8 lg:pb-8">
        {children}
      </main>
    </div>
  );
}
