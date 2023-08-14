import { NextApiRequest, NextApiResponse } from 'next';
import { PaginatedUsersResponse } from '../../../../lib/paginated-reactions';
import { prisma } from '../../../../lib/prisma';
import { resolveUsers } from '../../../../lib/user/resolve-user';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedUsersResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const fid = parseInt(req.query.id as string);
      const cursor = req.query.cursor
        ? new Date(req.query.cursor as string)
        : undefined;
      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;
      const type = req.query.type as 'following' | 'followers';

      const links = await prisma.links.findMany({
        where: {
          timestamp: {
            lt: cursor || undefined
          },
          deleted_at: null,
          type: 'follow',
          fid: type === 'following' ? fid : undefined,
          target_fid: type === 'followers' ? fid : undefined
        },
        take: limit,
        distinct: ['target_fid', 'fid'],
        orderBy: {
          timestamp: 'desc'
        }
      });

      const users = await resolveUsers(
        type === 'following'
          ? links.map((link) => link.target_fid!)
          : links.map((link) => link.fid!)
      );

      const nextPageCursor =
        links.length > 0
          ? links[links.length - 1].timestamp.toISOString()
          : null;

      res.json({
        result: { users, nextPageCursor }
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
