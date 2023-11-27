import { Embed as ModEmbed } from '@mod-protocol/core';
import { Tweet } from './types/tweet';
import { User, UsersMapType } from './types/user';
import { resolveUserFromFid } from './user/resolve-user';
import { isValidImageExtension } from './validation';
import { UserDataType } from '@farcaster/hub-nodejs';
import { casts } from '@prisma/client';
import { isFarcasterUrlEmbed } from '@mod-protocol/farcaster';
import { prisma } from './prisma';

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
          description: cast?.text,
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
      const embeds = tweetEmbeds[`0x${tweet.id}`];

      // Resolve users in embeds
      const embedsWithUsers: ModEmbed[] = await Promise.all(
        embeds.map(async (embed) => {
          const embedCopy = { ...embed };

          // If collection creator is a string, it is an fid, otherwise it is already a user object
          const farcasterUserOrFid = embed.metadata?.nft?.collection?.creator;
          const creator: User | null = farcasterUserOrFid
            ? typeof farcasterUserOrFid === 'string'
              ? await resolveUserFromFid(BigInt(farcasterUserOrFid))
              : await resolveUserFromFid(BigInt(farcasterUserOrFid.fid))
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
