import { redirect } from "next/navigation";

import { SignInForm } from "@/components/account/sign-in-form";
import { getAuthSession } from "@/lib/auth";
import { isGoogleConfigured } from "@/lib/env";

export default async function SignInPage() {
  const session = await getAuthSession();
  if (session?.user?.id) {
    redirect("/account");
  }

  return (
    <div className="py-16">
      <SignInForm googleEnabled={isGoogleConfigured()} />
    </div>
  );
}
