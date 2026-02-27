type BucketState = {
  count: number;
  resetAt: number;
};

type BucketMap = Map<string, BucketState>;

declare global {
  var __wasdropRateLimitBuckets: Map<string, BucketMap> | undefined;
}

const buckets = globalThis.__wasdropRateLimitBuckets ?? new Map<string, BucketMap>();
globalThis.__wasdropRateLimitBuckets = buckets;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

function getHeader(headers: Headers | Record<string, string | string[] | undefined>, key: string) {
  if (headers instanceof Headers) {
    return headers.get(key);
  }

  const value = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function getClientIpFromUnknown(request: unknown) {
  if (!request || typeof request !== "object") {
    return "unknown";
  }

  const asRequest = request as {
    ip?: string;
    headers?: Headers | Record<string, string | string[] | undefined>;
  };

  if (asRequest.ip) {
    return asRequest.ip;
  }

  if (asRequest.headers) {
    const forwarded = getHeader(asRequest.headers, "x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() ?? "unknown";
    }

    const realIp = getHeader(asRequest.headers, "x-real-ip");
    if (realIp) {
      return realIp;
    }
  }

  return "unknown";
}

export function consumeRateLimit(input: {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const scopedBucket = buckets.get(input.bucket) ?? new Map<string, BucketState>();
  buckets.set(input.bucket, scopedBucket);

  const entry = scopedBucket.get(input.key);
  if (!entry || entry.resetAt <= now) {
    scopedBucket.set(input.key, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(input.windowMs / 1000),
      remaining: input.limit - 1,
    };
  }

  entry.count += 1;
  scopedBucket.set(input.key, entry);

  const allowed = entry.count <= input.limit;
  return {
    allowed,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    remaining: Math.max(0, input.limit - entry.count),
  };
}

export function resetRateLimitBuckets() {
  buckets.clear();
}
