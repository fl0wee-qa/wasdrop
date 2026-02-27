import { DEFAULT_COUNTRY, getCountryOption } from "@/lib/regions";

export async function suggestCountryFromIp(ip?: string | null) {
  try {
    const endpoint = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "WASDrop/1.0 (+https://example.com)",
      },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (!response.ok) {
      return DEFAULT_COUNTRY;
    }

    const data = (await response.json()) as { country?: string };
    return getCountryOption(data.country).code;
  } catch {
    return DEFAULT_COUNTRY;
  }
}

