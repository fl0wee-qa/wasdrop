import "@testing-library/jest-dom/vitest";

process.env.DATABASE_URL ??= "postgresql://postgres:postgres@127.0.0.1:5432/wasdrop?schema=public";
process.env.NEXTAUTH_SECRET ??= "test-secret-with-minimum-length";
