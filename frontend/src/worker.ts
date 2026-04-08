import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import manifestJSON from '__STATIC_CONTENT_MANIFEST'

const assetManifest = JSON.parse(manifestJSON)

export interface Env {
  __STATIC_CONTENT: KVNamespace
  DemoR2Bucket: R2Bucket
  CF_AIG_TOKEN: string
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/aig' && (request.method === 'POST' || request.method === 'OPTIONS')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204 })
      }
      const GW_URL = 'https://gateway.ai.cloudflare.com/v1/add808ef3e2b76bd4cec9c8247455e46/default/compat/chat/completions'
      const body = await request.text()
      const metadata = request.headers.get('cf-aig-metadata') ?? '{}'
      const upstream = await fetch(GW_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.CF_AIG_TOKEN}`,
          'Content-Type': 'application/json',
          'cf-aig-metadata': metadata,
        },
        body,
      })
      const data = await upstream.text()
      return new Response(data, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (url.pathname === '/r2/upload' && request.method === 'POST') {
      try {
        const formData = await request.formData()
        const file = formData.get('file')
        if (!file || !(file instanceof File)) {
          return new Response(JSON.stringify({ error: 'No file provided' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const key = `contentupload/${safeName}`
        await env.DemoR2Bucket.put(key, await file.arrayBuffer(), {
          httpMetadata: { contentType: file.type || 'application/octet-stream' },
        })
        return new Response(JSON.stringify({ success: true, key, url: `/r2/${key}` }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch {
        return new Response(JSON.stringify({ error: 'Upload failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    if (url.pathname.startsWith('/r2/')) {
      const key = url.pathname.replace('/r2/', '')
      const object = await env.DemoR2Bucket.get(key)
      if (!object) return new Response('Not Found', { status: 404 })
      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('Cache-Control', 'public, max-age=86400')
      return new Response(object.body, { headers })
    }

    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      )
    } catch {
      const url = new URL(request.url)
      url.pathname = '/index.html'
      const indexRequest = new Request(url.toString(), request)
      try {
        return await getAssetFromKV(
          { request: indexRequest, waitUntil: ctx.waitUntil.bind(ctx) },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
          }
        )
      } catch {
        return new Response('Not Found', { status: 404 })
      }
    }
  },
}
