import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { ChangePasswordForm } from "./change-password-form";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Change Password
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your account password
        </p>
      </div>

      <div className="card-shadow rounded-2xl bg-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900">
              {session.user.name}
            </p>
            <p className="text-[12px] text-gray-400">
              Logged in as {session.user.email}
            </p>
          </div>
        </div>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
