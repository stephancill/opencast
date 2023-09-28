import { ReactionType } from '@farcaster/hub-web';
import { casts, Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { BaseResponse } from './types/responses';
import { Tweet, tweetConverter } from './types/tweet';
import { User, UserFull, UsersMapType } from './types/user';
import { resolveUsersMap } from './user/resolve-user';
import { Sql } from '@prisma/client/runtime/library';

export type PaginatedTweetsType = {
  tweets: Tweet[];
  nextPageCursor: string | null;
  // fid -> User
  users: UsersMapType<User | UserFull>;
};
export interface PaginatedTweetsResponse
  extends BaseResponse<PaginatedTweetsType> {}

export interface TweetsResponse extends BaseResponse<{ tweets: Tweet[] }> {}

/**
 *
 * @param sql Sql query which uses the returned cursor and returns all the fields of casts table
 * @returns Promise<PaginatedTweets>
 */
export async function getTweetsPaginatedRawSql(sql: Sql, ...args: any[]) {
  const casts = await prisma.$queryRaw<casts[]>(sql);
  return convertAndCalculateCursor(casts, ...args);
}

/**
 *
 * @param findManyArgs Prisma.castsFindManyArgs
 * @returns Promise<PaginatedTweets>
 */
export async function getTweetsPaginatedPrismaArgs(
  findManyArgs: Prisma.castsFindManyArgs,
  ...args: any[]
) {
  const casts = await prisma.casts.findMany(findManyArgs);
  return await convertAndCalculateCursor(casts, ...args);
}

/**
 *
 * @param casts Casts to be converted to tweets
 * @param calculateNextPageCursor Function to calculate the next page cursor
 * @returns PaginatedTweets
 */
export async function convertAndCalculateCursor(
  casts: casts[],
  calculateNextPageCursor?: (casts: casts[]) => string | null
): Promise<PaginatedTweetsType> {
  let { tweets } = await castsToTweets(casts);

  const fids: Set<bigint> = casts.reduce((acc: Set<bigint>, cur) => {
    acc.add(cur.fid);
    if (cur.parent_fid) acc.add(cur.parent_fid);
    cur.mentions.forEach((mention) => acc.add(mention));
    return acc;
  }, new Set<bigint>());

  const usersMap = await resolveUsersMap([...fids]);

  const nextPageCursor =
    calculateNextPageCursor?.(casts) ||
    (casts.length > 0 ? casts[casts.length - 1].timestamp.toISOString() : null);

  return {
    tweets,
    users: usersMap,
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
      deleted_at: null,
      messages: {
        deleted_at: null
      }
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
