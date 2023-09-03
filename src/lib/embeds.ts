import { casts } from '@prisma/client';
import getMetadata from 'metadata-scraper';
import { LRU } from './lru-cache';
import { prisma } from './prisma';
import { ExternalEmbed, Tweet } from './types/tweet';
import { isValidImageExtension } from './validation';
import { UserDataType } from '@farcaster/hub-web';
import { resolveUserFromFid } from './user/resolve-user';

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

    // Replace warpcast links with opencast links
    // Warpcast regex
    const regex = /https:\/\/warpcast\.com\/([^\/]+)\/0x([a-fA-F0-9]+)/;
    const match = url.match(regex);

    if (match && match.length === 3) {
      // Select cast
      const [cast] = (await prisma.$queryRaw`
        select c.* from casts c 
        inner join user_data ud on c.fid = ud.fid 
        where 
          ud."type" = ${UserDataType.USERNAME} and 
          SUBSTRING(encode(c.hash, 'hex'), 1, 6) = ${match[2].toLowerCase()} and 
          ud.value = ${match[1].toLowerCase()}
        `) as casts[];
      if (cast) {
        const user = await resolveUserFromFid(cast.fid);
        const images = (
          cast.embeds as { url?: string; cast?: string }[]
        ).filter((e) => e.url && isValidImageExtension(e.url));
        return {
          url: `/tweet/${cast.hash.toString('hex')}`,
          text: cast.text,
          title: user?.name,
          icon: user?.photoURL,
          image: images.length > 0 ? images[0].url : undefined
        };
      }
    }

    const metadata = await getMetadata(url, {
      maxRedirects: 1,
      timeout: 1000,
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
    console.log(`Error fetching embed for ${url}`);
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
