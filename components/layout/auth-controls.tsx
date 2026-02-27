"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";

type AuthControlsProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export function AuthControls({ mobile = false, onNavigate }: AuthControlsProps) {
  const { data } = useSession();
  const containerClass = mobile ? "flex w-full flex-col gap-2" : "flex items-center gap-2";
  const baseButtonClass = mobile ? "w-full justify-center" : "px-4";
  const signInClass = mobile ? "w-full font-extrabold tracking-wide" : "px-6 font-extrabold tracking-wide";

  if (!data?.user) {
    return (
      <Button asChild size="sm" className={signInClass}>
        <Link href="/auth/sign-in" onClick={onNavigate}>
          Sign In
        </Link>
      </Button>
    );
  }

  return (
    <div className={containerClass}>
      <Button asChild variant="secondary" size="sm" className={baseButtonClass}>
        <Link href="/account" onClick={onNavigate}>
          Account
        </Link>
      </Button>
      {data.user.role === "ADMIN" ? (
        <Button asChild variant="secondary" size="sm" className={baseButtonClass}>
          <Link href="/admin" onClick={onNavigate}>
            Admin
          </Link>
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        className={baseButtonClass}
        onClick={() => {
          onNavigate?.();
          void signOut({ callbackUrl: "/" });
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
