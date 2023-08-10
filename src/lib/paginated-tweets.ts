import { ReactionType } from '@farcaster/hub-web';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from './prisma';
import { BaseResponse } from './types/responses';
import { Tweet, tweetConverter } from './types/tweet';
import { User } from './types/user';
import { resolveUserFromFid } from './user/resolveUser';

export interface PaginatedTweetsResponse
  extends BaseResponse<{
    tweets: Tweet[];
    nextPageCursor: string | null;
    // fid -> User
    users: { [key: string]: User };
  }> {}

export async function getTweetsPaginated(
  findManyArgs: Prisma.castsFindManyArgs
) {
  const casts = await prisma.casts.findMany(findManyArgs);

  const engagements = await prisma.reactions.findMany({
    where: {
      target_hash: {
        in: casts.map((cast) => cast.hash)
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
        in: casts.map((cast) => cast.hash)
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

  const fids = casts.reduce((acc: bigint[], cur) => {
    if (!acc.includes(cur.fid)) {
      acc.push(cur.fid);
    }
    if (cur.parent_fid && !acc.includes(cur.parent_fid)) {
      acc.push(cur.parent_fid);
    }
    return acc;
  }, []);

  // TODO: Combine into one query
  // TODO: Cache results
  // TODO: Only pass minimal user data and fetch on-demand
  const users = await Promise.all(fids.map((fid) => resolveUserFromFid(fid)));
  const usersMap = users.reduce((acc: any, cur) => {
    if (cur) {
      acc[cur.id] = cur;
    }
    return acc;
  }, {});

  const nextPageCursor =
    casts.length > 0 ? casts[casts.length - 1].timestamp.toISOString() : null;

  return {
    tweets,
    users: usersMap,
    nextPageCursor
  };
}
