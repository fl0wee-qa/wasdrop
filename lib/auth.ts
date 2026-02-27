import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { env } from "@/lib/env";
import { consumeRateLimit, getClientIpFromUnknown } from "@/lib/ip-rate-limit";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { verifySteamLoginToken } from "@/lib/steam-openid";
import { signInCredentialsSchema } from "@/lib/validation/auth";

const e = env();

const providers = [];

if (e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: e.GOOGLE_CLIENT_ID,
      clientSecret: e.GOOGLE_CLIENT_SECRET,
    }),
  );
}

providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, request) {
      const ip = getClientIpFromUnknown(request);
      const authLimit = consumeRateLimit({
        bucket: "auth.credentials.signin",
        key: ip,
        limit: 10,
        windowMs: 10 * 60 * 1000,
      });

      if (!authLimit.allowed) {
        return null;
      }

      const parsed = signInCredentialsSchema.safeParse({
        email: credentials?.email,
        password: credentials?.password,
      });
      if (!parsed.success) {
        return null;
      }

      const email = parsed.data.email.toLowerCase();
      const user = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
      });
      if (!user?.passwordHash) {
        return null;
      }

      const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        preferredCountry: user.preferredCountry,
        steamId: user.steamId,
        marketingOptIn: user.marketingOptIn,
      };
    },
  }),
);

providers.push(
  CredentialsProvider({
    id: "steam",
    name: "Steam",
    credentials: {
      steamToken: { label: "steamToken", type: "text" },
    },
    async authorize(credentials) {
      const token = credentials?.steamToken;
      if (!token) {
        return null;
      }

      const verified = verifySteamLoginToken(token);
      if (!verified) {
        return null;
      }

      const existing = await prisma.user.findUnique({
        where: { steamId: verified.steamId },
      });

      if (existing) {
        return {
          id: existing.id,
          name: existing.name ?? `Steam ${verified.steamId}`,
          email: existing.email,
          image: existing.image,
          role: existing.role,
          preferredCountry: existing.preferredCountry,
          steamId: existing.steamId,
          marketingOptIn: existing.marketingOptIn,
        };
      }

      const created = await prisma.user.create({
        data: {
          name: `Steam ${verified.steamId}`,
          steamId: verified.steamId,
          preferredCountry: "US",
        },
      });

      return {
        id: created.id,
        name: created.name,
        email: created.email,
        image: created.image,
        role: created.role,
        preferredCountry: created.preferredCountry,
        steamId: created.steamId,
        marketingOptIn: created.marketingOptIn,
      };
    },
  }),
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  secret: e.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.preferredCountry = user.preferredCountry;
        token.steamId = user.steamId;
        token.marketingOptIn = user.marketingOptIn;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.role = token.role ?? "USER";
        session.user.preferredCountry = token.preferredCountry;
        session.user.steamId = token.steamId;
        session.user.marketingOptIn = token.marketingOptIn;
      }

      return session;
    },
    async signIn({ user, account }) {
      if (!account) {
        return true;
      }

      if (account.provider === "google") {
        if (!user.email) {
          return false;
        }

        if (e.ADMIN_EMAIL && user.email.toLowerCase() === e.ADMIN_EMAIL.toLowerCase()) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" },
          });
          user.role = "ADMIN";
        }
      }

      if ((account.provider === "credentials" || account.provider === "steam") && user.email && e.ADMIN_EMAIL) {
        if (user.email.toLowerCase() === e.ADMIN_EMAIL.toLowerCase()) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" },
          });
          user.role = "ADMIN";
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}
