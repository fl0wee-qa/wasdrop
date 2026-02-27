import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/account/sign-up-form";
import { getAuthSession } from "@/lib/auth";

export default async function SignUpPage() {
  const session = await getAuthSession();
  if (session?.user?.id) {
    redirect("/account");
  }

  return (
    <div className="py-16">
      <SignUpForm />
    </div>
  );
}
