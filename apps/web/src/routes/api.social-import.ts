import { apiError, readJsonBody, withApi } from '@/lib/api.server';

export const action = withApi(async ({ request }) => {
  const body = await readJsonBody<{ url?: unknown }>(request);
  if (typeof body.url !== 'string' || body.url.length > 2048) return apiError(422, 'Enter a valid public Bluesky post link.');
  let url: URL;
  try { url = new URL(body.url); } catch { return apiError(422, 'Enter a valid public Bluesky post link.'); }
  const match = url.pathname.match(/^\/profile\/([^/]+)\/post\/([a-zA-Z0-9]+)\/?$/);
  if (url.protocol !== 'https:' || url.hostname !== 'bsky.app' || !match) return apiError(422, 'Direct import supports public bsky.app post links. Paste the post text for other platforms.');
  const uri = `at://${match[1]}/app.bsky.feed.post/${match[2]}`;
  const response = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=0`, { signal: AbortSignal.timeout(15000) });
  if ([400, 404].includes(response.status)) return apiError(422, 'This post could not be found. It may be deleted, private, or the link may be incorrect.');
  if (!response.ok) throw new Error(`Bluesky request failed: ${response.status} ${response.statusText}`);
  const data = await response.json() as { thread?: { post?: { author?: { displayName?: string; handle?: string }; record?: { text?: string } } } };
  const post = data.thread?.post;
  if (!post?.record?.text) return apiError(422, 'This post has no accessible text. Paste the content instead.');
  return { author: post.author?.displayName || post.author?.handle || 'Bluesky author', handle: `@${post.author?.handle || 'unknown'}`, text: post.record.text, url: url.href, platform: 'Bluesky' };
});
