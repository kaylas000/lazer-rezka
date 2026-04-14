// Cloudflare Worker for generating blog post preview images using Workers AI
// Model: @cf/black-forest-labs/flux-1-schnell (free tier)
// Caches generated images in KV to avoid regeneration
//
// Required bindings:
//   - AI: Workers AI binding
//   - IMAGE_CACHE: KV namespace for caching generated images
//
// Usage: GET /generate?slug=<post-slug>&prompt=<image-description>
// Returns: image/png

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Image generation endpoint
    if (url.pathname === '/generate') {
      return handleGenerate(url, env, corsHeaders);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
};

async function handleGenerate(url, env, corsHeaders) {
  const slug = url.searchParams.get('slug');
  const prompt = url.searchParams.get('prompt');

  if (!slug || !prompt) {
    return new Response(
      JSON.stringify({ error: true, message: 'Both "slug" and "prompt" query params are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Check KV cache first
    if (env.IMAGE_CACHE) {
      const cached = await env.IMAGE_CACHE.get(slug, { type: 'arrayBuffer' });
      if (cached) {
        return new Response(cached, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Image-Source': 'cache',
          },
        });
      }
    }

    // Build the image prompt -- we wrap the user prompt in a style directive
    // to get consistent, high-quality industrial/technical imagery
    const styledPrompt = buildImagePrompt(prompt);

    // Generate image via Workers AI (Flux Schnell -- free tier)
    const response = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt: styledPrompt,
      num_steps: 4, // flux-schnell works well with 4 steps
    });

    // response is a ReadableStream of the PNG image
    const imageBytes = await streamToArrayBuffer(response);

    // Cache in KV (expire in 90 days -- images rarely need to change)
    if (env.IMAGE_CACHE) {
      await env.IMAGE_CACHE.put(slug, imageBytes, {
        expirationTtl: 90 * 24 * 60 * 60,
        metadata: { prompt: prompt.substring(0, 200), generated: new Date().toISOString() },
      });
    }

    return new Response(imageBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Image-Source': 'generated',
      },
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return new Response(
      JSON.stringify({ error: true, message: 'Failed to generate image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Wraps the post-specific prompt in a consistent style directive
 * so all blog images share a cohesive visual language.
 */
function buildImagePrompt(postPrompt) {
  return (
    'Professional industrial photography style, ' +
    'dark moody lighting with orange accent highlights, ' +
    'metalworking and laser cutting workshop atmosphere. ' +
    postPrompt +
    '. High quality, detailed, 16:9 aspect ratio, no text or watermarks.'
  );
}

/**
 * Converts a ReadableStream to an ArrayBuffer.
 */
async function streamToArrayBuffer(stream) {
  // If already an ArrayBuffer or Uint8Array, return directly
  if (stream instanceof ArrayBuffer) return stream;
  if (stream instanceof Uint8Array) return stream.buffer;
  if (ArrayBuffer.isView(stream)) return stream.buffer;

  // Handle ReadableStream
  const reader = stream.getReader();
  const chunks = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.byteLength;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk.buffer || chunk), offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}
