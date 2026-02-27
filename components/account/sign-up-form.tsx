"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signUpSchema } from "@/lib/validation/auth";

type FieldErrors = Partial<Record<"email" | "password" | "confirmPassword", string>>;

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");

    const parsed = signUpSchema.safeParse({ email, password, confirmPassword, marketingOptIn });
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (path === "email" || path === "password" || path === "confirmPassword") {
          nextErrors[path] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setPending(true);
    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setPending(false);
      setFormError(payload.error ?? "Failed to create account.");
      return;
    }

    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      callbackUrl: "/account",
    });
    setPending(false);

    if (!result || result.error) {
      setFormError("Account created, but auto sign-in failed. Please sign in manually.");
      return;
    }

    window.location.href = result.url ?? "/account";
  }

  return (
    <Card className="mx-auto max-w-md border-white/10 bg-[#111827]/80">
      <CardHeader>
        <CardTitle>Create your WASDrop account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="Email"
            />
            {fieldErrors.email ? <p className="text-xs text-red-400">{fieldErrors.email}</p> : null}
          </div>

          <div className="space-y-1">
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Password"
            />
            {fieldErrors.password ? <p className="text-xs text-red-400">{fieldErrors.password}</p> : null}
            <p className="text-xs text-zinc-500">Use at least 8 characters, 1 uppercase letter, and 1 number.</p>
          </div>

          <div className="space-y-1">
            <Input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
            />
            {fieldErrors.confirmPassword ? <p className="text-xs text-red-400">{fieldErrors.confirmPassword}</p> : null}
          </div>

          <label className="flex items-start gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(event) => setMarketingOptIn(event.target.checked)}
              className="mt-1"
            />
            I agree to receive email alerts / newsletter
          </label>

          {formError ? <p className="text-xs text-red-400">{formError}</p> : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-cyan-300 hover:underline">
            Sign In
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
