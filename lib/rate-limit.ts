import pLimit from "p-limit";

export const networkLimiter = pLimit(4);
