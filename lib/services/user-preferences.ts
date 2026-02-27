import { cookies } from "next/headers";

import { DEFAULT_COUNTRY, getCountryOption } from "@/lib/regions";
import { prisma } from "@/lib/prisma";

export const COUNTRY_COOKIE_KEY = "gdh-country";

export async function resolveCountry(userId?: string | null) {
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredCountry: true },
    });

    if (user?.preferredCountry) {
      return getCountryOption(user.preferredCountry).code;
    }
  }

  const cookieStore = await cookies();
  const cookieCountry = cookieStore.get(COUNTRY_COOKIE_KEY)?.value;
  if (cookieCountry) {
    return getCountryOption(cookieCountry).code;
  }

  return DEFAULT_COUNTRY;
}

export async function persistCountryPreference(country: string, userId?: string | null) {
  const normalizedCountry = getCountryOption(country).code;

  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { preferredCountry: normalizedCountry },
    });
  }

  return normalizedCountry;
}
