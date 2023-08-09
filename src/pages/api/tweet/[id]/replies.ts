import { ReactionType } from '@farcaster/hub-web';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import {
  Tweet,
  tweetConverter,
  TweetRepliesResponse
} from '../../../../lib/types/tweet';
import { User, userConverter } from '../../../../lib/types/user';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<TweetRepliesResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const id = req.query.id;
      const cursor = req.query.cursor
        ? new Date(req.query.cursor as string)
        : undefined;
      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;

      // Get the casts with the given parent_hash
      const casts = await prisma.casts.findMany({
        where: {
          AND: [
            {
              timestamp: {
                lt: cursor || undefined
              }
            },
            {
              parent_hash: Buffer.from(id as string, 'hex')
            },
            {
              deleted_at: null
            }
          ]
        },
        take: limit,
        orderBy: {
          timestamp: 'desc' // reverse chronological order
        }
      });

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

      const userData = await prisma.user_data.findMany({
        where: {
          fid: {
            in: fids
          }
        }
      });

      // Create a map of fid to user data
      const userDataMap = userData.reduce((acc: any, cur) => {
        const key = cur.fid.toString();
        if (acc[key]) {
          acc[key] = {
            ...acc[key],
            [cur.type]: cur.value
          };
        } else {
          acc[key] = {
            [cur.type]: cur.value
          };
        }
        return acc;
      }, {});

      // Transform users
      const users: { [key: string]: User } = Object.keys(userDataMap).reduce(
        (acc: any, fid) => {
          const user = userDataMap[fid];
          acc[fid] = userConverter.toUser({ ...user, fid });
          return acc;
        },
        {}
      );

      const nextPageCursor =
        casts.length > 0
          ? casts[casts.length - 1].timestamp.toISOString()
          : null;

      res.json({
        result: { tweets, users, nextPageCursor }
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
