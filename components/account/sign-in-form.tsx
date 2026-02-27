"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signInCredentialsSchema } from "@/lib/validation/auth";

type SignInFormProps = {
  googleEnabled: boolean;
};

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function SignInForm({ googleEnabled }: SignInFormProps) {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  const steamError = params.get("error");
  const steamToken = params.get("steamToken");

  useEffect(() => {
    if (!steamToken) {
      return;
    }

    void signIn("steam", {
      steamToken,
      callbackUrl: "/account",
    });
  }, [steamToken]);

  const providerError = useMemo(() => {
    if (steamError === "steam_verify_failed") {
      return "Steam login verification failed. Please try again.";
    }
    if (steamError === "steam_callback_failed") {
      return "Steam callback failed. Please retry.";
    }
    return steamError ? "Authentication failed. Please try again." : "";
  }, [steamError]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");

    const parsed = signInCredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (path === "email" || path === "password") {
          nextErrors[path] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setPending(true);
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      callbackUrl: "/account",
    });
    setPending(false);

    if (!result || result.error) {
      setFormError("Invalid email or password.");
      return;
    }

    window.location.href = result.url ?? "/account";
  }

  return (
    <Card className="mx-auto max-w-md border-white/10 bg-[#111827]/80">
      <CardHeader>
        <CardTitle>Sign in to WASDrop</CardTitle>
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
              autoComplete="current-password"
              placeholder="Password"
            />
            {fieldErrors.password ? <p className="text-xs text-red-400">{fieldErrors.password}</p> : null}
          </div>

          {formError ? <p className="text-xs text-red-400">{formError}</p> : null}
          {providerError ? <p className="text-xs text-red-400">{providerError}</p> : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {googleEnabled ? (
          <Button className="w-full" variant="secondary" onClick={() => signIn("google", { callbackUrl: "/account" })}>
            Continue with Google
          </Button>
        ) : (
          <p className="text-sm text-zinc-400">Google OAuth is not configured in this environment.</p>
        )}

        <Button className="w-full" variant="secondary" onClick={() => (window.location.href = "/api/auth/steam")}>
          Continue with Steam
        </Button>

        <p className="text-sm text-zinc-400">
          No account?{" "}
          <Link href="/auth/sign-up" className="text-cyan-300 hover:underline">
            Sign Up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
