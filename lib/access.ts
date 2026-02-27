import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";

export async function requireUser() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  return session;
}

export async function requireAdmin() {
  const session = await getAuthSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return session;
}
