import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/settings/user-form";
import { DeleteUserButton } from "@/components/settings/delete-user-button";
import { Users, Settings } from "lucide-react";

const roleColors: Record<string, string> = {
  producer: "border-violet-200 bg-violet-50 text-violet-700",
  director: "border-blue-200 bg-blue-50 text-blue-700",
  crew: "border-gray-200 bg-gray-50 text-gray-600",
};

const roleLabels: Record<string, string> = {
  producer: "Producer",
  director: "Director",
  crew: "Crew",
};

export default async function SettingsPage() {
  let userRows: {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    role: "producer" | "director" | "crew";
    avatarUrl: string | null;
    createdAt: Date;
  }[] = [];

  try {
    userRows = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  } catch {
    // DB not connected
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage users and team members
          </p>
        </div>
        <UserForm trigger={<Button className="rounded-xl bg-gray-900 hover:bg-gray-800">Add User</Button>} />
      </div>

      <div className="card-shadow rounded-2xl bg-white">
        {userRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              No users found. Add your first user to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {userRows.map((user) => (
              <div key={user.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-gray-900">{user.name}</p>
                  <p className="text-[12px] text-gray-400">{user.email}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] font-medium border ${roleColors[user.role] ?? ""}`}
                >
                  {roleLabels[user.role] ?? user.role}
                </Badge>
                <span className="text-[12px] text-gray-400 shrink-0">
                  {format(user.createdAt, "MMM d, yyyy")}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <UserForm
                    user={user}
                    trigger={
                      <Button variant="ghost" size="sm" className="rounded-lg text-gray-400 hover:text-gray-900">
                        Edit
                      </Button>
                    }
                  />
                  <DeleteUserButton id={user.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
