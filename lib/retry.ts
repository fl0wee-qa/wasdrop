export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; initialDelayMs?: number; factor?: number } = {},
): Promise<T> {
  const retries = options.retries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 500;
  const factor = options.factor ?? 2;

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await sleep(delay);
      delay *= factor;
      attempt += 1;
    }
  }

  throw new Error("unreachable");
}
