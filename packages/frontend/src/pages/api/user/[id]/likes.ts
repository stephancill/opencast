import { ReactionType, UserDataType } from '@farcaster/hub-web';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  getTweetsPaginatedPrismaArgs,
  PaginatedTweetsResponse
} from '../../../../lib/paginated-tweets';
import { prisma } from '../../../../lib/prisma';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedTweetsResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const cursor = req.query.cursor
        ? new Date(req.query.cursor as string)
        : undefined;
      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;

      // Try to convert id to number
      let id = req.query.id;
      if (isNaN(Number(id))) {
        const username = (id as string).toLowerCase();
        const userData = await prisma.user.findFirst({
          where: {
            type: UserDataType.USERNAME,
            value: username
          }
        });
        if (userData) {
          id = userData.fid.toString();
        } else {
          res.status(404).json({ message: 'User not found' });
          return;
        }
      }

      const reactions = await prisma.reaction.findMany({
        where: {
          timestamp: {
            lt: cursor || undefined
          },
          fid: BigInt(id as string),
          deleted_at: null,
          reaction_type: ReactionType.LIKE
        },
        take: limit,
        orderBy: {
          timestamp: 'desc' // reverse chronological order
        }
      });

      const result = await getTweetsPaginatedPrismaArgs({
        where: {
          hash: {
            in: reactions
              .map((reaction) => reaction.target_hash)
              .filter((hash) => hash !== null) as Buffer[]
          },
          deleted_at: null
        },
        take: limit,
        orderBy: {
          timestamp: 'desc' // reverse chronological order
        }
      });

      res.json({
        result
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
