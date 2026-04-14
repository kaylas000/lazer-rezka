# AI Image Generation Worker Setup

This project uses a Cloudflare Worker with Workers AI to automatically generate
preview images for blog posts based on their topic.

## How It Works

1. Each blog post can have an optional `image_prompt` field in its front matter
2. If a post has no manually set `image`, the templates request a generated image
   from the Cloudflare Worker
3. The worker uses the **Flux 1 Schnell** model (`@cf/black-forest-labs/flux-1-schnell`)
   which is included in the Cloudflare Workers AI free tier
4. Generated images are cached in KV storage so each image is only generated once

## Deployment

### Prerequisites

- A Cloudflare account with Workers AI enabled (free tier is sufficient)
- Wrangler CLI installed: `npm install -g wrangler`

### Steps

1. **Create a KV namespace for caching:**

```bash
wrangler kv namespace create IMAGE_CACHE
```

Note the namespace ID from the output.

2. **Create `wrangler-image.toml` config** (do not commit this file):

```toml
name = "image-worker"
main = "cloudflare-image-worker.js"
compatibility_date = "2024-01-01"

[ai]
binding = "AI"

[[kv_namespaces]]
binding = "IMAGE_CACHE"
id = "<YOUR_KV_NAMESPACE_ID>"
```

3. **Deploy the worker:**

```bash
wrangler deploy --config wrangler-image.toml
```

4. **Update `_config.yml`** with the deployed worker URL:

```yaml
ai_image_worker_url: "https://image-worker.<your-subdomain>.workers.dev"
```

## Blog Post Front Matter

### Required fields (for image generation)

None -- the system will fall back to the post `title` as the image prompt.

### Optional fields

- `image` -- a manually set image path (takes priority over AI generation)
- `image_prompt` -- an English description of the desired image, optimized for
  the AI model. Keep it descriptive and visual.

### Example

```yaml
---
layout: post
title: "Laser cutting vs plasma cutting"
image_prompt: "Split comparison of laser cutting beam and plasma cutting torch working on metal, sparks flying, industrial workshop"
---
```

If neither `image` nor `image_prompt` is set, the post title is used as the prompt.

## Free Tier Limits

Cloudflare Workers AI free tier includes:
- 10,000 neurons per day for image generation models
- Each Flux Schnell image (4 steps) uses approximately 500 neurons
- That gives roughly **20 images per day** on the free tier

Since images are cached in KV, you only use neurons when generating a new image
for the first time. Subsequent requests serve the cached version.

## Prompt Style

The worker wraps each prompt in a consistent style directive to maintain visual
coherence across all blog images:

> Professional industrial photography style, dark moody lighting with orange
> accent highlights, metalworking and laser cutting workshop atmosphere.
> [your prompt]. High quality, detailed, 16:9 aspect ratio, no text or watermarks.

## Troubleshooting

- **Images not showing:** Check that `ai_image_worker_url` in `_config.yml`
  points to your deployed worker. Visit `<worker-url>/health` to verify it is running.
- **Worker errors:** Check the Cloudflare dashboard Workers logs for details.
- **Fallback behavior:** If the worker is unreachable or returns an error, the
  template falls back to the placeholder icon.
