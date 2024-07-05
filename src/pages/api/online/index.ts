import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { OnlineUsersResponse } from '../../../lib/types/online';
import { UserFull } from '../../../lib/types/user';
import { resolveUserFromFid } from '../../../lib/user/resolve-user';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<OnlineUsersResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;
      const fid = req.query.fid as string;

      const cutoffTime = new Date(new Date().getTime() - 1000 * 60 * 60 * 2); // 2 hours ago

      // Get last cast/reaction for all user's following
      const following = await prisma.links.findMany({
        where: {
          fid: BigInt(fid),
          type: 'follow',
          deleted_at: null
        },
        distinct: ['target_fid', 'fid']
      });

      const fids = following.map((f) => f.target_fid);

      const casts = await prisma.casts.findMany({
        where: {
          fid: {
            in: fids
          },
          timestamp: {
            gte: cutoffTime
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit,
        distinct: ['fid']
      });

      const reactions = await prisma.reactions.findMany({
        where: {
          fid: {
            in: fids
          },
          timestamp: {
            gte: cutoffTime
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit,
        distinct: ['fid']
      });

      const timestampsByUser = [...casts, ...reactions]
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) // ascending order - oldest first
        .reduce((acc, cur) => {
          if (!acc[cur.fid.toString()]) {
            acc[cur.fid.toString()] = {
              lastOnline: cur.timestamp,
              fid: cur.fid
            };
          }
          return acc;
        }, {} as Record<string, { lastOnline: Date; fid: bigint }>);

      const users = (
        (
          await Promise.all(
            Object.values(timestampsByUser).map((user) =>
              resolveUserFromFid(user.fid)
            )
          )
        ).filter((user) => user !== null) as UserFull[]
      )
        .sort((a, b) => {
          return (
            timestampsByUser[b!.id.toString()].lastOnline.getTime() -
            timestampsByUser[a!.id.toString()].lastOnline.getTime()
          );
        })
        .map((u) => {
          return {
            user: u,
            lastOnline: timestampsByUser[u!.id.toString()].lastOnline
          };
        });

      res.json({ result: users });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
