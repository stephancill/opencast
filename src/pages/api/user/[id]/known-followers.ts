import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { KnownFollowersResponse } from '../../../../lib/types/user';
import { resolveUsers } from '../../../../lib/user/resolve-user';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<KnownFollowersResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const fid = parseInt(req.query.id as string);
      const contextFid = parseInt(req.query.context_id as string);

      // Get all the target_fids (people that the user follows)
      const contextFollowing = await prisma.links.findMany({
        where: {
          fid: contextFid,
          target_fid: { not: undefined },
          deleted_at: null
        },
        select: {
          target_fid: true
        }
      });

      const links = await prisma.links.findMany({
        where: {
          deleted_at: null,
          type: 'follow',
          fid: {
            in: contextFollowing.map((link) => link.target_fid!)
          },
          target_fid: fid
        },
        distinct: ['target_fid', 'fid'],
        select: {
          fid: true
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      // TODO: Resolve the most popular users
      const resolvedUsers = await resolveUsers(
        links.slice(0, 6).map((link) => link.fid!)
      );

      res.json({
        result: { knownFollowerCount: links.length, resolvedUsers }
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
