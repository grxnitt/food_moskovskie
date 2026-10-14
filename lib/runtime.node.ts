// Vercel has no native D1 binding. Its route handlers use the private backend.
export const env: { DB?: D1Database } = {};
