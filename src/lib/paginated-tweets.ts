import { ReactionType } from '@farcaster/hub-web';
import { casts, Prisma } from '@prisma/client';
import { populateTweetEmbeds } from './embeds';
import { prisma } from './prisma';
import { resolveTopicsMap, TopicsMapType } from './topics/resolve-topic';
import { BaseResponse } from './types/responses';
import { Tweet, tweetConverter } from './types/tweet';
import { UsersMapType } from './types/user';
import { resolveUsersMap } from './user/resolve-user';

export interface PaginatedTweetsResponse
  extends BaseResponse<{
    tweets: Tweet[];
    nextPageCursor: string | null;
    // fid -> User
    users: UsersMapType;
    // url -> Topic
    topics: TopicsMapType;
  }> {}

export async function getTweetsPaginated(
  findManyArgs: Prisma.castsFindManyArgs
) {
  const casts = await prisma.casts.findMany(findManyArgs);

  let { tweets } = await castsToTweets(casts);

  const tweetPromises = tweets.map(populateTweetEmbeds);

  const fids: Set<bigint> = casts.reduce((acc: Set<bigint>, cur) => {
    acc.add(cur.fid);
    if (cur.parent_fid) acc.add(cur.parent_fid);
    cur.mentions.forEach((mention) => acc.add(mention));
    return acc;
  }, new Set<bigint>());

  const [usersMap, topicsMap] = await Promise.all([
    resolveUsersMap([...fids]),
    resolveTopicsMap(
      casts
        .map((cast) => cast.parent_url)
        .filter((url) => url !== null) as string[]
    )
  ]);

  tweets = await Promise.all(tweetPromises);

  const nextPageCursor =
    casts.length > 0 ? casts[casts.length - 1].timestamp.toISOString() : null;

  return {
    tweets,
    users: usersMap,
    topics: topicsMap,
    nextPageCursor
  };
}

export async function castsToTweets(
  castsOrHashes: Buffer[] | casts[]
): Promise<{ tweets: Tweet[]; casts: casts[]; castHashes: Buffer[] }> {
  const casts =
    castsOrHashes[0] instanceof Buffer
      ? await prisma.casts.findMany({
          where: {
            hash: {
              in: castsOrHashes as Buffer[]
            }
          }
        })
      : (castsOrHashes as casts[]);

  const castHashes =
    castsOrHashes[0] instanceof Buffer
      ? (castsOrHashes as Buffer[])
      : casts.map((cast) => cast.hash);

  const engagements = await prisma.reactions.findMany({
    where: {
      target_hash: {
        in: castHashes
      }
    },
    select: {
      fid: true,
      reaction_type: true,
      target_hash: true
    }
  });

  const replyCount = await prisma.casts.groupBy({
    by: ['parent_hash'],
    where: {
      parent_hash: {
        in: castHashes
      },
      deleted_at: null
    },
    _count: {
      parent_hash: true
    }
  });

  // Create a map of parent_hash to reply count
  const replyCountMap = replyCount.reduce((acc: any, cur) => {
    const key = cur.parent_hash!.toString('hex');
    if (acc[key]) {
      acc[key] = cur._count.parent_hash;
    } else {
      acc[key] = cur._count.parent_hash;
    }
    return acc;
  }, {});

  // Group reactions by reaction_type for each target_hash
  const reactionsMap = engagements.reduce(
    (acc: { [key: string]: { [key: number]: string[] } }, cur) => {
      const key = cur.target_hash!.toString('hex');
      if (!key) {
        return acc;
      }
      if (acc[key]) {
        if (acc[key][cur.reaction_type]) {
          acc[key][cur.reaction_type] = [
            ...acc[key][cur.reaction_type],
            cur.fid.toString()
          ];
        } else {
          acc[key][cur.reaction_type] = [cur.fid.toString()];
        }
      } else {
        acc[key] = {
          [cur.reaction_type]: [cur.fid.toString()]
        };
      }
      return acc;
    },
    {}
  );

  // Merge the casts with the reactions
  const tweets = casts.map((cast): Tweet => {
    const id = cast.hash.toString('hex');
    return {
      ...tweetConverter.toTweet(cast),
      userLikes: reactionsMap[id]
        ? reactionsMap[id][ReactionType.LIKE] || []
        : [],
      userRetweets: reactionsMap[id]
        ? reactionsMap[id][ReactionType.RECAST] || []
        : [],
      userReplies: replyCountMap[id] || 0
    };
  });

  return { tweets, casts, castHashes };
}
