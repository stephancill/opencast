import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { AppProfile, OnlineUsersResponse } from '../../../lib/types/online';
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

      const combined = [...casts, ...reactions];

      const signersSet = new Set(combined.map((c) => c.signer));

      const timestampsByUser = combined
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) // ascending order - oldest first
        .reduce((acc, cur) => {
          if (!acc[cur.fid.toString()]) {
            acc[cur.fid.toString()] = {
              lastOnline: cur.timestamp,
              fid: cur.fid,
              signer: cur.signer
            };
          }
          return acc;
        }, {} as Record<string, { lastOnline: Date; fid: bigint; signer: Buffer }>);

      type SignerRow = {
        user_fid: bigint;
        requester_fid: bigint;
        pfp?: string;
        display?: string;
        bio?: string;
        url?: string;
        username?: string;
      };

      // TODO: Update this with convenience view
      const signers = (await prisma.$queryRaw`
        SELECT DISTINCT 
          s.fid as user_fid,
          s.key,
          s.requester_fid,
          MAX(CASE WHEN ud.type = 1 THEN ud.value END) AS pfp,
          MAX(CASE WHEN ud.type = 2 THEN ud.value END) AS display,
          MAX(CASE WHEN ud.type = 3 THEN ud.value END) AS bio,
          MAX(CASE WHEN ud.type = 5 THEN ud.value END) AS url,
          MAX(CASE WHEN ud.type = 6 THEN ud.value END) AS username
        FROM signers s
        LEFT JOIN user_data ud ON s.requester_fid = ud.fid
        WHERE s.key IN (${Prisma.join(Array.from(signersSet))})
        GROUP BY s.requester_fid, s.key, s.fid
      `) as SignerRow[];

      const appProfilesMap = signers.reduce((acc, cur) => {
        acc[cur.requester_fid.toString()] = {
          display: cur.display,
          pfp: cur.pfp,
          username: cur.username
        };
        return acc;
      }, {} as Record<string, AppProfile>);

      const appFidsByUserFid = signers.reduce((acc, cur) => {
        acc[cur.user_fid.toString()] = cur.requester_fid.toString();
        return acc;
      }, {} as Record<string, string>);

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
            lastOnline: timestampsByUser[u!.id.toString()].lastOnline,
            appFid: appFidsByUserFid[u!.id.toString()]
          };
        });

      res.json({ result: { users, appProfilesMap } });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
