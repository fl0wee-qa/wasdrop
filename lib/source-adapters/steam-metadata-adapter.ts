import { networkLimiter } from "@/lib/rate-limit";
import { withRetry } from "@/lib/retry";

export type SteamMetadata = {
  description?: string;
  developers?: string[];
  publishers?: string[];
  screenshots?: string[];
  pcRequirements?: {
    minimum?: string;
    recommended?: string;
  };
};

type SteamResponse = {
  success: boolean;
  data?: {
    detailed_description?: string;
    developers?: string[];
    publishers?: string[];
    screenshots?: Array<{ path_full: string }>;
    pc_requirements?: {
      minimum?: string;
      recommended?: string;
    };
  };
};

export async function fetchSteamMetadata(steamAppId: string): Promise<SteamMetadata | null> {
  if (!steamAppId) {
    return null;
  }

  try {
    const response = await networkLimiter(() =>
      withRetry(() =>
        fetch(`https://store.steampowered.com/api/appdetails?appids=${steamAppId}&l=en&cc=us`, {
          headers: {
            "User-Agent": "WASDrop/1.0",
          },
          next: { revalidate: 60 * 60 * 12 },
        }),
      ),
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Record<string, SteamResponse>;
    const data = payload[steamAppId];
    if (!data?.success || !data.data) {
      return null;
    }

    return {
      description: data.data.detailed_description,
      developers: data.data.developers,
      publishers: data.data.publishers,
      screenshots: data.data.screenshots?.map((item) => item.path_full) ?? [],
      pcRequirements: {
        minimum: data.data.pc_requirements?.minimum,
        recommended: data.data.pc_requirements?.recommended,
      },
    };
  } catch {
    return null;
  }
}

