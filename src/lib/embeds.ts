import { Embed as ModEmbed } from '@mod-protocol/core';
import { Tweet } from './types/tweet';
import { User, UsersMapType } from './types/user';
import { resolveUserFromFid } from './user/resolve-user';

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

      return {
        ...tweet,
        embeds: embedsWithUsers
      };
    })
  );

  return merged;
}
