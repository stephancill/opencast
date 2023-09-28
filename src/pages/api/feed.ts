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
      const userFid = req.query.fid ? Number(req.query.fid) : null;
      const cursor = req.query.cursor
        ? new Date(req.query.cursor as string)
        : null;
      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;
      const skip = req.query.skip ? Number(req.query.skip) : 0;
      const after = !!req.query.after && req.query.after !== 'false';
      const full = !!req.query.full && req.query.full !== 'false';
      const ordering: FeedOrderingType = req.query.ordering
        ? (req.query.ordering as FeedOrderingType)
        : 'latest';
      const topicUrl = req.query.topic_url
        ? decodeURIComponent(req.query.topic_url as string)
        : null;

      // Get all the target_fids (people that the user follows)
      let targetFids: bigint[] | null = null;
      if (userFid != null) {
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
        targetFids = [
          ...(links.map((link) => link.target_fid) as bigint[]),
          BigInt(userFid)
        ];
      }

      let reverseChronologicalQuery = Prisma.sql``;
      let topQuery = Prisma.sql``;

      // Build queries for top and reverse chronological and handle edge case where targetFids is empty
      // TODO: Find a cleaner way to conditionally add where clauses
      if (targetFids !== null && targetFids.length !== 0) {
        reverseChronologicalQuery = Prisma.sql`
          SELECT * FROM casts
          WHERE
            fid IN (${targetFids ? Prisma.join(targetFids) : 'null::bigint'})
            AND (
              ${cursor} IS NULL
              OR 
              (${!after} IS TRUE AND timestamp < ${cursor}::timestamp)
              OR
              (${after} IS TRUE AND timestamp > ${cursor}::timestamp)
            )
            AND (
              ${topicUrl}::text IS NULL
              OR
              (${topicUrl}::text IS NOT NULL AND parent_url = ${topicUrl}::text)
            )
            AND parent_hash IS NULL
            AND casts.deleted_at IS NULL
          ORDER BY timestamp DESC
          LIMIT ${limit}
          OFFSET ${skip}
        `;

        topQuery = Prisma.sql`
          SELECT 
              casts.*,
              COUNT(reactions.id) AS like_count
          FROM 
              casts
          LEFT JOIN 
              reactions ON casts.hash = reactions.target_hash AND reactions.reaction_type = 1
          WHERE 
            casts.parent_hash is null  
            AND casts.deleted_at is null
            AND casts.fid IN (${
              targetFids ? Prisma.join(targetFids) : 'null::bigint'
            })
            AND casts.timestamp > ${new Date(
              (cursor || new Date()).getTime() - 1000 * 60 * 60 * 24
            )}
            AND (
              ${topicUrl}::text IS NULL
              OR
              (${topicUrl}::text IS NOT NULL AND parent_url = ${topicUrl}::text)
            )
          GROUP BY 
              casts.id
          ORDER BY 
              like_count DESC
          LIMIT ${limit}
          OFFSET ${skip}
        `;
      } else {
        reverseChronologicalQuery = Prisma.sql`
          SELECT * FROM casts
          WHERE
            (
              ${cursor} IS NULL
              OR 
              (${!after} IS TRUE AND timestamp < ${cursor}::timestamp)
              OR
              (${after} IS TRUE AND timestamp > ${cursor}::timestamp)
            )
            AND (
              ${topicUrl}::text IS NULL
              OR
              (${topicUrl}::text IS NOT NULL AND parent_url = ${topicUrl}::text)
            )
            AND parent_hash IS NULL
            AND casts.deleted_at IS NULL
          ORDER BY timestamp DESC
          LIMIT ${limit}
          OFFSET ${skip}
        `;

        topQuery = Prisma.sql`
          SELECT 
              casts.*,
              COUNT(reactions.id) AS like_count
          FROM 
              casts
          LEFT JOIN 
              reactions ON casts.hash = reactions.target_hash AND reactions.reaction_type = 1
          WHERE 
            casts.parent_hash is null  
            AND casts.deleted_at is null
            AND casts.timestamp > ${new Date(
              (cursor || new Date()).getTime() - 1000 * 60 * 60 * 24
            )}
            AND (
              ${topicUrl}::text IS NULL
              OR
              (${topicUrl}::text IS NOT NULL AND parent_url = ${topicUrl}::text)
            )
          GROUP BY 
              casts.id
          ORDER BY 
              like_count DESC
          LIMIT ${limit}
          OFFSET ${skip}
        `;
      }

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

      result = await getTweetsPaginatedRawSql(
        ordering === 'top' ? topQuery : reverseChronologicalQuery,
        skip !== undefined
          ? () => {
              return (skip + limit).toString();
            }
          : undefined
      );

      res.json({
        result
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
