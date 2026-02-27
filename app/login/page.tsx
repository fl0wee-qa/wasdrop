import { redirect } from "next/navigation";

export default function LoginCompatPage() {
  redirect("/auth/sign-in");
}
