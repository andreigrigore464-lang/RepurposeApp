/**
 * YouTube Channel RSS Discovery
 * Resolves YouTube channel handles (@handle), channel URLs, video URLs, or raw channel IDs
 * into native YouTube Atom RSS feeds (https://www.youtube.com/feeds/videos.xml?channel_id=UC...).
 * Pipeline Stage: 1-ingest
 */

export interface DiscoveredYoutubeFeed {
  channelId: string;
  channelTitle: string;
  feedUrl: string;
  canonicalUrl: string;
  thumbnailUrl?: string;
}

const YOUTUBE_FEED_PREFIX = "https://www.youtube.com/feeds/videos.xml?channel_id=";

export async function discoverYoutubeFeed(input: string): Promise<DiscoveredYoutubeFeed | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Direct YouTube RSS feed URL
  if (trimmed.includes("youtube.com/feeds/videos.xml?channel_id=")) {
    const channelIdMatch = trimmed.match(/channel_id=(UC[a-zA-Z0-9_-]{22})/);
    if (channelIdMatch) {
      const channelId = channelIdMatch[1];
      return {
        channelId,
        channelTitle: `YouTube Channel (${channelId.slice(0, 8)}...)`,
        feedUrl: `${YOUTUBE_FEED_PREFIX}${channelId}`,
        canonicalUrl: `https://www.youtube.com/channel/${channelId}`,
      };
    }
  }

  // 2. Direct Channel ID format (starts with UC and is 24 chars)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return {
      channelId: trimmed,
      channelTitle: `YouTube Channel (${trimmed.slice(0, 8)}...)`,
      feedUrl: `${YOUTUBE_FEED_PREFIX}${trimmed}`,
      canonicalUrl: `https://www.youtube.com/channel/${trimmed}`,
    };
  }

  // 3. Direct channel URL by ID (/channel/UC...)
  const channelUrlMatch = trimmed.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelUrlMatch) {
    const channelId = channelUrlMatch[1];
    return {
      channelId,
      channelTitle: `YouTube Channel (${channelId.slice(0, 8)}...)`,
      feedUrl: `${YOUTUBE_FEED_PREFIX}${channelId}`,
      canonicalUrl: `https://www.youtube.com/channel/${channelId}`,
    };
  }

  // 4. Video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)
  const videoMatch = trimmed.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/);
  if (videoMatch) {
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoMatch[2]}&format=json`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        if (oembed.author_url) {
          const resolved = await resolveChannelFromPage(oembed.author_url);
          if (resolved) {
            return {
              ...resolved,
              channelTitle: oembed.author_name || resolved.channelTitle,
              thumbnailUrl: oembed.thumbnail_url,
            };
          }
        }
      }
    } catch {
      // Fallback to direct page resolution if oembed fails
    }
  }

  // 5. Handle or custom channel URL (e.g. @ChannelName or https://www.youtube.com/@ChannelName)
  let channelUrl = trimmed;
  if (trimmed.startsWith("@")) {
    channelUrl = `https://www.youtube.com/${trimmed}`;
  } else if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    channelUrl = `https://www.youtube.com/@${trimmed}`;
  }

  return await resolveChannelFromPage(channelUrl);
}

/**
 * Scrapes a public YouTube channel HTML page to extract the unique channel ID and channel title.
 */
async function resolveChannelFromPage(url: string): Promise<DiscoveredYoutubeFeed | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) return null;
    const html = await res.text();

    // Strategy A: Atom RSS link tag
    const rssMatch = html.match(/feeds\/videos\.xml\?channel_id=(UC[a-zA-Z0-9_-]{22})/);
    // Strategy B: itemprop channelId meta tag
    const metaMatch = html.match(/itemprop=["']channelId["']\s+content=["'](UC[a-zA-Z0-9_-]{22})["']/);
    // Strategy C: JSON payload embedded channelId
    const jsonMatch = html.match(/"channelId":\s*"(UC[a-zA-Z0-9_-]{22})"/);

    const channelId = rssMatch?.[1] || metaMatch?.[1] || jsonMatch?.[1];
    if (!channelId) return null;

    // Extract channel title
    const titleMatch =
      html.match(/<meta property=["']og:title["']\s+content=["']([^"']+)["']/) ||
      html.match(/<title>([^<]+)<\/title>/);
    let channelTitle = titleMatch?.[1]?.replace(" - YouTube", "").trim() || `YouTube Channel (${channelId.slice(0, 8)})`;

    // Extract channel avatar
    const avatarMatch = html.match(/<meta property=["']og:image["']\s+content=["']([^"']+)["']/);

    return {
      channelId,
      channelTitle,
      feedUrl: `${YOUTUBE_FEED_PREFIX}${channelId}`,
      canonicalUrl: `https://www.youtube.com/channel/${channelId}`,
      thumbnailUrl: avatarMatch?.[1],
    };
  } catch (err) {
    console.warn(`[youtube:discover] Could not resolve channel from page "${url}":`, err);
    return null;
  }
}
