import { app } from '$lib/server/hono';

const fallback = ({ request, platform }: any) =>
  app.fetch(request, (platform?.env ?? {}) as Record<string, any>);

export const GET = fallback;
export const POST = fallback;
export const PUT = fallback;
export const DELETE = fallback;
export const PATCH = fallback;
