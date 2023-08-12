import { NextApiRequest, NextApiResponse } from 'next';
import {
  getTweetsPaginated,
  PaginatedTweetsResponse
} from '../../lib/paginated-tweets';
import { prisma } from '../../lib/prisma';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedTweetsResponse>
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

      const { tweets, users, nextPageCursor } = await getTweetsPaginated({
        where: {
          fid: {
            in: targetFids
          },
          timestamp: {
            lt: cursor || undefined
          },
          parent_hash: null,
          deleted_at: null
        },
        take: limit,
        orderBy: {
          timestamp: 'desc' // reverse chronological order
        }
      });

      res.json({
        result: { tweets, users, nextPageCursor }
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
