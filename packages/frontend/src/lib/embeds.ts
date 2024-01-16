import { UserDataType } from '@farcaster/hub-nodejs';
import { Embed as ModEmbed } from '@mod-protocol/core';
import { isFarcasterUrlEmbed } from '@mod-protocol/farcaster';
import { casts } from '@selekt/db';
import getMetaData from 'metadata-scraper';
import { LRU } from './lru-cache';
import { prisma } from './prisma';
import { ExternalEmbed, Tweet } from './types/tweet';
import { User, UsersMapType } from './types/user';
import { resolveUserFromFid } from './user/resolve-user';
import { isValidImageExtension } from './validation';

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

async function getEmbedsForTweetIds(ids: string[]) {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_MOD_API_URL}/cast-embeds-metadata`,
    {
      body: JSON.stringify(ids),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  const metadata: { [key: string]: ModEmbed[] } = await request.json();

  return metadata;
}

async function processWarpcastEmbed(embed: ModEmbed): Promise<ModEmbed> {
  // Replace warpcast links with opencast links
  // Warpcast regex
  const regex = /https:\/\/warpcast\.com\/([^\/]+)\/0x([a-fA-F0-9]+)/;
  const match = isFarcasterUrlEmbed(embed) && embed.url.match(regex);

  if (match && match.length === 3) {
    // Select cast
    const hashLength = match[2].length;
    const [cast] = (await prisma.$queryRaw`
        select c.*, ud.value from casts c 
        inner join user_data ud on c.fid = ud.fid 
        where 
          ud."type" = ${UserDataType.USERNAME} 
          and SUBSTRING(encode(c.hash, 'hex'), 1, ${hashLength}::integer) = ${match[2].toLowerCase()} 
          and ud.value = ${match[1].toLowerCase()}
      `) as casts[];
    if (cast) {
      const user = await resolveUserFromFid(cast.fid);
      const images = (cast.embeds as { url?: string; cast?: string }[]).filter(
        (e) => e.url && isValidImageExtension(e.url)
      );
      return {
        url: `/tweet/${cast.hash.toString('hex')}`,
        metadata: {
          title: `${user?.name} (@${user?.username})`,
          publisher: `Farcaster`,
          image: images.length > 0 ? { url: images[0].url } : undefined,
          // Hacky way to get full cast text
          description: embed.metadata?.description,
          logo: user?.photoURL
            ? {
                url: user.photoURL
              }
            : undefined
        },
        status: 'loaded'
      };
    }
  }

  return embed;
}

export async function populateEmbedsForTweets(
  tweets: Tweet[]
): Promise<Tweet[]> {
  const tweetEmbeds = await getEmbedsForTweetIds(tweets.map((t) => t.id));

  const merged = await Promise.all(
    tweets.map(async (tweet) => {
      const embeds = tweetEmbeds[`0x${tweet.id}`] || [];

      // Resolve users in embeds
      const embedsWithUsers: ModEmbed[] = await Promise.all(
        embeds.map(async (embed) => {
          const embedCopy = { ...embed };

          // If collection creator is a string, it is an fid, otherwise it is already a user object
          const partialFarcasterUser = embed.metadata?.nft?.collection?.creator;
          const creator: User | null = partialFarcasterUser?.fid
            ? await resolveUserFromFid(BigInt(partialFarcasterUser.fid))
            : null;
          const users: UsersMapType<User> = {};
          if (creator) {
            users[creator.id] = creator;
          }
          if (creator && embedCopy.metadata?.nft?.collection.creator) {
            embedCopy.metadata.nft.collection.creator = {
              displayName: creator.name,
              fid: parseInt(creator.id),
              username: creator?.username,
              pfp: {
                url: creator.photoURL
              }
            };
          }

          return embed as ModEmbed;
        })
      );

      const processedEmbeds = await Promise.all(
        embedsWithUsers.map(async (embed) => {
          const embedCopy = { ...embed };
          return await processWarpcastEmbed(embedCopy);
        })
      );

      return {
        ...tweet,
        embeds: processedEmbeds
      };
    })
  );

  return merged;
}

// TODO: Refactor to use opengraph api
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

    const metadata = await getMetaData(url, {
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
