// Cloudflare Workers tRPC handler using the new D1-aware db.ts
import { setD1Binding } from './db';
import { appRouter } from './routers';
import type { User } from '../drizzle/schema';

export interface CloudflareRequest {
  method: string;
  pathname: string;
  headers: Record<string, string>;
  body?: any;
  env: any;
}

export async function handleTrpcRequest(req: CloudflareRequest) {
  const { method, pathname, headers, body, env } = req;
  
  // Initialize D1 binding
  if (env.DB) {
    setD1Binding(env.DB);
  }

  // Parse tRPC path: /api/trpc/categories.list or /api/trpc/products.create
  const trpcPath = pathname.replace('/api/trpc/', '');
  const [router, procedure] = trpcPath.split('.');
  
  if (!router || !procedure) {
    return {
      success: false,
      error: 'Invalid tRPC path',
    };
  }

  try {
    // Parse input from body or query
    let input: any = undefined;
    if (method === 'POST' && body) {
      input = body.input || body;
    } else if (method === 'GET') {
      // For GET requests, tRPC sends input in query string
      const url = new URL(pathname, 'http://localhost');
      const inputStr = url.searchParams.get('input');
      if (inputStr) {
        input = JSON.parse(inputStr);
      }
    }

    // Create mock context (simplified for Cloudflare)
    const context = {
      req: {
        headers: new Headers(headers),
      },
      res: null,
      user: null as User | null,
    };

    // Get the router
    const routerObj = (appRouter as any)[router];
    if (!routerObj) {
      return {
        success: false,
        error: `Unknown router: ${router}`,
      };
    }

    // Get the procedure
    const proc = routerObj[procedure];
    if (!proc) {
      return {
        success: false,
        error: `Unknown procedure: ${router}.${procedure}`,
      };
    }

    // Call the procedure
    const caller = routerObj.createCaller(context);
    const result = await caller[procedure](input);

    return {
      success: true,
      result,
    };
  } catch (error: any) {
    console.error('[tRPC Handler]', error);
    return {
      success: false,
      error: error.message || 'Internal server error',
    };
  }
}
