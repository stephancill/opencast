import { NextApiRequest, NextApiResponse } from 'next';
import {
  getReactionUsersPaginated,
  PaginatedUsersResponse
} from '../../../../lib/paginated-reactions';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedUsersResponse>
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
      const type = parseInt(req.query.type as string);

      const { users, nextPageCursor } = await getReactionUsersPaginated({
        where: {
          timestamp: {
            lt: cursor || undefined
          },
          target_cast_hash: Buffer.from(id as string, 'hex'),
          deleted_at: null,
          type: type
        },
        take: limit,
        orderBy: {
          timestamp: 'desc' // reverse chronological order
        },
        distinct: 'fid'
      });

      res.json({
        result: { users, nextPageCursor }
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
