import { ReactionType } from '@farcaster/hub-web';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { FeedResponse } from '../../lib/types/feed';
import { Tweet, tweetConverter } from '../../lib/types/tweet';
import { User, userConverter } from '../../lib/types/user';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<FeedResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const userFid = Number(req.query.fid); // assuming 'fid' is passed as query param
      // const skip = req.query.skip ? Number(req.query.skip) : undefined;
      const cursor = req.query.cursor
        ? new Date(req.query.cursor as string)
        : undefined;
      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;

      // Get all the target_fids (people that the user follows)
      const links = await prisma.links.findMany({
        where: {
          AND: [{ fid: userFid }, { target_fid: { not: null } }]
        },
        select: {
          target_fid: true
        }
      });
      const targetFids = links.map((link) => link.target_fid) as bigint[];

      // Get the casts made by the people the user follows
      const casts = await prisma.casts.findMany({
        where: {
          AND: [
            {
              fid: {
                in: targetFids
              }
            },
            {
              timestamp: {
                lt: cursor || undefined
              }
            },
            {
              parent_hash: null
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
            : []
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
