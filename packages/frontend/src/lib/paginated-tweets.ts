import { ReactionType } from '@farcaster/hub-web';
import { Cast, Prisma } from '@selekt/db';
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
 * @param sql Sql query which uses the returned cursor and returns all the fields of Cast table
 * @returns Promise<PaginatedTweets>
 */
export async function getTweetsPaginatedRawSql(sql: Sql, ...args: any[]) {
  const casts = await prisma.$queryRaw<Cast[]>(sql);
  return convertAndCalculateCursor(casts, ...args);
}

/**
 *
 * @param findManyArgs prisma.castFindManyArgs
 * @returns Promise<PaginatedTweets>
 */
export async function getTweetsPaginatedPrismaArgs(
  findManyArgs: Prisma.CastFindManyArgs,
  ...args: any[]
) {
  const casts = await prisma.cast.findMany(findManyArgs);
  return await convertAndCalculateCursor(casts, ...args);
}

/**
 *
 * @param casts Casts to be converted to tweets
 * @param calculateNextPageCursor Function to calculate the next page cursor
 * @returns PaginatedTweets
 */
async function convertAndCalculateCursor(
  casts: Cast[],
  calculateNextPageCursor?: (casts: Cast[]) => string | null
): Promise<PaginatedTweetsType> {
  let { tweets } = await castsToTweets(casts);

  const fids: Set<bigint> = casts.reduce((acc: Set<bigint>, cur) => {
    acc.add(cur.fid);
    if (cur.parentFid) acc.add(cur.parentFid);
    cur.mentions.forEach((mention) => acc.add(mention));
    return acc;
  }, new Set<bigint>());

  const usersMap = await resolveUsersMap([...fids]);

  const nextPageCursor =
    calculateNextPageCursor?.(casts) ||
    (casts.length > 0
      ? casts[casts.length - 1]!.timestamp.toISOString()
      : null);

  return {
    tweets,
    users: usersMap,
    nextPageCursor
  };
}

export async function castsToTweets(
  castsOrHashes: Buffer[] | Cast[]
): Promise<{ tweets: Tweet[]; casts: Cast[]; castHashes: Buffer[] }> {
  const casts =
    castsOrHashes[0] instanceof Buffer
      ? await prisma.cast.findMany({
          where: {
            hash: {
              in: castsOrHashes as Buffer[]
            }
          }
        })
      : (castsOrHashes as Cast[]);

  const castHashes =
    castsOrHashes[0] instanceof Buffer
      ? (castsOrHashes as Buffer[])
      : casts.map((cast) => cast.hash);

  const engagements = await prisma.reaction.findMany({
    where: {
      targetHash: {
        in: castHashes
      },
      deletedAt: null,
      message: {
        deletedAt: null
      }
    },
    select: {
      fid: true,
      reactionType: true,
      targetHash: true
    }
  });

  const replyCount = await prisma.cast.groupBy({
    by: ['parentHash'],
    where: {
      parentHash: {
        in: castHashes
      },
      deletedAt: null,
      message: {
        deletedAt: null
      }
    },
    _count: {
      parentHash: true
    }
  });

  // Create a map of parentHash to reply count
  const replyCountMap = replyCount.reduce((acc: any, cur) => {
    const key = cur.parentHash!.toString('hex');
    if (acc[key]) {
      acc[key] = cur._count.parentHash;
    } else {
      acc[key] = cur._count.parentHash;
    }
    return acc;
  }, {});

  // Group reactions by reactionType for each targetHash
  const reactionsMap = engagements.reduce(
    (acc: { [key: string]: { [key: number]: string[] } }, cur) => {
      const key = cur.targetHash!.toString('hex');
      if (!key) {
        return acc;
      }
      if (acc[key]) {
        if (acc[key]![cur.reactionType]) {
          acc[key]![cur.reactionType] = [
            ...acc[key]![cur.reactionType]!,
            cur.fid.toString()
          ];
        } else {
          acc[key]![cur.reactionType] = [cur.fid.toString()];
        }
      } else {
        acc[key] = {
          [cur.reactionType]: [cur.fid.toString()]
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
        ? reactionsMap[id]![ReactionType.LIKE] || []
        : [],
      userRetweets: reactionsMap[id]
        ? reactionsMap[id]![ReactionType.RECAST] || []
        : [],
      userReplies: replyCountMap[id] || 0
    };
  });

  return { tweets, casts, castHashes };
}
