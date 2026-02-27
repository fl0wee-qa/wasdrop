import { env, isMockModeEnabled } from "@/lib/env";
import { cheapSharkAdapter } from "@/lib/source-adapters/aggregator/cheapshark-adapter";
import { mockDealsAdapter } from "@/lib/source-adapters/mock-adapter";
import type { DealsSourceAdapter } from "@/lib/source-adapters/types";

export function getPrimaryDealsAdapter(): DealsSourceAdapter {
  if (isMockModeEnabled()) {
    return mockDealsAdapter;
  }

  const apiBase = env().DEALS_API_BASE_URL;
  if (!apiBase) {
    throw new Error("DEALS_API_BASE_URL is required for non-mock mode.");
  }

  return cheapSharkAdapter;
}
