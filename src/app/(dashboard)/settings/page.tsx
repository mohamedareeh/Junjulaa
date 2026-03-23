import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { format } from "date-fns";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserForm } from "@/components/settings/user-form";
import { DeleteUserButton } from "@/components/settings/delete-user-button";
import { UsersIcon } from "lucide-react";

const roleColors: Record<string, string> = {
  producer: "bg-purple-100 text-purple-800",
  director: "bg-blue-100 text-blue-800",
  crew: "bg-gray-100 text-gray-800",
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage users and team members
          </p>
        </div>
        <UserForm trigger={<Button>Add User</Button>} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <UsersIcon className="size-8 text-muted-foreground" />
                      No users found. Add your first user to get started.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                userRows.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${roleColors[user.role] ?? ""}`}
                      >
                        {roleLabels[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(user.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <UserForm
                          user={user}
                          trigger={
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          }
                        />
                        <DeleteUserButton id={user.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
