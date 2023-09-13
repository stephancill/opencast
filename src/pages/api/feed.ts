import { Prisma, casts } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  PaginatedTweetsResponse,
  PaginatedTweetsType,
  TweetsResponse,
  getTweetsPaginatedRawSql
} from '../../lib/paginated-tweets';
import { prisma } from '../../lib/prisma';
import { FeedOrderingType } from '../../lib/types/feed';
import { tweetConverter } from '../../lib/types/tweet';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedTweetsResponse | TweetsResponse>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const userFid = Number(req.query.fid); // assuming 'fid' is passed as query param
      const cursor = req.query.cursor
        ? new Date(req.query.cursor as string)
        : undefined;
      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;
      const skip = req.query.skip ? Number(req.query.skip) : 0;
      const after = !!req.query.after && req.query.after !== 'false';
      const full = !!req.query.full && req.query.full !== 'false';
      const ordering = req.query.ordering as FeedOrderingType | undefined;

      // Get all the target_fids (people that the user follows)
      const links = await prisma.links.findMany({
        where: {
          fid: userFid,
          target_fid: { not: null },
          deleted_at: null
        },
        select: {
          target_fid: true
        }
      });
      const targetFids = [
        ...(links.map((link) => link.target_fid) as bigint[]),
        BigInt(userFid)
      ];

      let reverseChronologicalQuery: Prisma.Sql = Prisma.sql`
        SELECT * FROM casts
        WHERE
          fid IN (${Prisma.join(targetFids)})
          AND (
            (timestamp < ${cursor} AND ${!after})
            OR
            (timestamp > ${cursor} AND ${after})
            OR 
            ${cursor} IS NULL
          )
          AND parent_hash IS NULL
          AND casts.deleted_at IS NULL
        ORDER BY timestamp DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      if (!full) {
        const casts = await prisma.$queryRaw<casts[]>(
          reverseChronologicalQuery
        );
        const tweets = casts.map(tweetConverter.toTweet);
        res.json({
          result: { tweets }
        });
        return;
      }

      let result: PaginatedTweetsType;

      if (ordering === 'top') {
        result = await getTweetsPaginatedRawSql(
          Prisma.sql`
            SELECT 
                casts.*,
                COUNT(reactions.id) AS like_count
            FROM 
                casts
            LEFT JOIN 
                reactions ON casts.hash = reactions.target_hash AND reactions.reaction_type = 1
            WHERE 
              casts.parent_hash is null AND 
              casts.deleted_at is null AND
              casts.fid IN (${Prisma.join(targetFids)}) AND
              casts.timestamp > ${new Date(
                (cursor || new Date()).getTime() - 1000 * 60 * 60 * 24
              )}
            GROUP BY 
                casts.id
            ORDER BY 
                like_count DESC
            LIMIT ${limit}
            OFFSET ${skip}
          `,
          skip !== undefined
            ? () => {
                return (skip + limit).toString();
              }
            : undefined
        );
      } else {
        result = await getTweetsPaginatedRawSql(
          reverseChronologicalQuery,
          skip !== undefined
            ? () => {
                return (skip + limit).toString();
              }
            : undefined
        );
      }

      res.json({
        result
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
