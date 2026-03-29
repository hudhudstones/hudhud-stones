// Cloudflare Workers handler - Serve React SPA + API backend
import { handleApiRequest } from './cf-router';
import { getAsset, getMimeType } from './assets-manifest';

export default {
  async fetch(request: Request, env: any, ctx: any) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      // Handle OPTIONS
      if (request.method === 'OPTIONS') {
        return new Response(null, { 
          status: 204,
          headers: corsHeaders 
        });
      }

      // Health check
      if (pathname === '/api/health') {
        return new Response(
          JSON.stringify({ 
            status: 'ok', 
            message: 'Hudhud Stones API is running on Cloudflare Workers',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            }
          }
        );
      }

      // tRPC endpoint
      if (pathname.startsWith('/api/trpc/')) {
        const path = pathname.replace('/api/trpc/', '');
        
        if (request.method === 'POST' || request.method === 'GET') {
          try {
            let body;
            if (request.method === 'POST') {
              body = await request.json();
            }

            const response = await handleApiRequest({
              method: request.method,
              path,
              body,
              headers: Object.fromEntries(request.headers),
            });

            return new Response(JSON.stringify(response), {
              status: response.success ? 200 : 400,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            });
          } catch (e) {
            return new Response(
              JSON.stringify({ success: false, error: 'Invalid request' }),
              { 
                status: 400,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                }
              }
            );
          }
        }
      }

      // 404 for other API routes
      if (pathname.startsWith('/api/')) {
        return new Response(
          JSON.stringify({ error: 'Not found', path: pathname }),
          { 
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            }
          }
        );
      }

      // Serve static assets from embedded manifest
      let assetPath = pathname;
      if (!assetPath.startsWith('/')) {
        assetPath = '/' + assetPath;
      }

      let asset = getAsset(assetPath);
      
      if (asset) {
        const mimeType = getMimeType(assetPath);
        const cacheControl = assetPath.includes('/assets/') 
          ? 'public, max-age=31536000' // 1 year for versioned assets
          : 'public, max-age=3600'; // 1 hour for HTML

        return new Response(asset, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': cacheControl,
          },
        });
      }

      // For SPA routing, serve index.html
      const indexHtml = getAsset('/index.html');
      if (indexHtml && pathname !== '/' && !pathname.includes('.')) {
        return new Response(indexHtml, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      // Serve index.html for root
      if (pathname === '/' && indexHtml) {
        return new Response(indexHtml, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      // 404
      return new Response(
        JSON.stringify({ error: 'Not found', path: pathname }),
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
};
