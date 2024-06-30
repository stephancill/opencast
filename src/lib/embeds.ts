import { getFrame } from 'frames.js';
import getMetaData from 'metadata-scraper';
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
    urlBuilder: (url: string) => url.replace('x.com', 'fxtwitter.com'),
    userAgent: 'bot'
  },
  'arxiv.org': {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  }
};

// TODO: This method's inputs should be more generic
export async function populateEmbed(
  embed: ExternalEmbed
): Promise<ExternalEmbed | null> {
  let host = '';
  try {
    host = new URL(embed.url).host;
  } catch (e) {
    console.error(`Error parsing URL ${embed.url}`);
    return null;
  }

  const url = KNOWN_HOSTS_MAP[host]?.urlBuilder?.(embed.url) || embed.url;
  const cached = LRU.get(url);
  if (cached !== undefined) {
    return cached;
  }

  let result: ExternalEmbed | null = null;

  try {
    const userAgent = KNOWN_HOSTS_MAP[host]?.userAgent || undefined;
    // TODO:
    // {
    //     maxRedirects: 1,
    //     timeout: 1000,
    //     ua:
    //       userAgent ||
    //       'Mozilla/5.0 (compatible; TelegramBot/1.0; +https://core.telegram.org/bots/webhooks)'
    //   }
    const req = await fetch(url, {
      headers: {
        'User-Agent':
          userAgent || 'Mozilla/5.0 (compatible; OpenframesBot/1.0;)'
      }
    });
    const contentType = req.headers.get('content-type');
    const html = await req.text();

    const metadata = await getMetaData({
      html
    });
    const { title, description, icon, image } = metadata;

    const frameResult = getFrame({ htmlString: html, url });

    if (!contentType) {
      return null;
    }

    if (title || description || contentType.startsWith('image/')) {
      const populatedEmbed: ExternalEmbed = {
        url: embed.url,
        title: title,
        text: description,
        icon: icon ? new URL(icon, url).toString() : undefined,
        image: image ? new URL(image).toString() : undefined,
        contentType,
        frame: frameResult.status === 'success' ? frameResult.frame : undefined
      };
      LRU.set(url, populatedEmbed);
      result = populatedEmbed;
    }
  } catch (e) {
    console.log(
      `Error fetching embed for ${url}`,
      e instanceof Error ? e.message : e
    );
    // console.error(e);
  }

  // If we get an error, cache the error for an hour
  LRU.set(url, result, { ttl: result === null ? 1000 * 60 * 60 : undefined });

  // console.log(`Finished populating embed for ${embed.url}`, result);

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
