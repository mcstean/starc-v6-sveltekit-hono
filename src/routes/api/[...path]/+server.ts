import { app } from '$lib/server/hono';
import { env } from '$lib/server/env';
const fallback = async ({ request }: any) => {
  return app.fetch(request, env);
};
export const GET = fallback;
export const POST = fallback;
export const PUT = fallback;
export const DELETE = fallback;
export const PATCH = fallback;
