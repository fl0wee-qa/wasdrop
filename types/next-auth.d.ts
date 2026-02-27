import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      preferredCountry?: string | null;
      steamId?: string | null;
      marketingOptIn?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "USER" | "ADMIN";
    preferredCountry?: string | null;
    steamId?: string | null;
    marketingOptIn?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "USER" | "ADMIN";
    preferredCountry?: string | null;
    steamId?: string | null;
    marketingOptIn?: boolean;
  }
}
