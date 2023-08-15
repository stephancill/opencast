import getMetadata from 'metadata-scraper';
import { LRU } from './lru-cache';
import { ExternalEmbed, Tweet } from './types/tweet';

const KNOWN_HOSTS_MAP: {
  [key: string]: { urlBuilder?: (url: string) => string; userAgent?: string };
} = {
  'twitter.com': {
    urlBuilder: (url: string) => url.replace('twitter.com', 'fxtwitter.com'),
    userAgent: 'bot'
  },
  'x.com': {
    urlBuilder: (url: string) => url.replace('twitter.com', 'fxtwitter.com'),
    userAgent: 'bot'
  },
  'arxiv.org': {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  }
};

export async function populateEmbed(
  embed: ExternalEmbed
): Promise<ExternalEmbed | null> {
  const host = new URL(embed.url).host;
  const url = KNOWN_HOSTS_MAP[host]?.urlBuilder?.(embed.url) || embed.url;
  const cached = LRU.get(url);
  if (cached !== undefined) {
    return cached;
  }

  let result: ExternalEmbed | null = null;

  try {
    const userAgent = KNOWN_HOSTS_MAP[host]?.userAgent || undefined;
    const metadata = await getMetadata(url, {
      maxRedirects: 1,
      ua:
        userAgent ||
        'Mozilla/5.0 (compatible; TelegramBot/1.0; +https://core.telegram.org/bots/webhooks)'
    });
    const { title, description, icon, image } = metadata;

    if (title || description) {
      const populatedEmbed: ExternalEmbed = {
        url: embed.url,
        title: title,
        text: description,
        icon,
        image
      };
      LRU.set(url, populatedEmbed);
      result = populatedEmbed;
    }
  } catch (e) {
    console.error(e);
  }

  // If we get an error, cache the error for an hour
  LRU.set(url, result, { ttl: result === null ? 1000 * 60 * 60 : undefined });

  return result;
}

export async function populateTweetEmbeds(tweet: Tweet): Promise<Tweet> {
  const populatedTweet: Tweet = {
    ...tweet,
    embeds: (await Promise.all(tweet.embeds.map(populateEmbed))).filter(
      (embed) => embed !== null
    ) as ExternalEmbed[]
  };
  return populatedTweet;
}
