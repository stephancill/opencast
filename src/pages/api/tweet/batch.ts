import { Prisma, casts } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  PaginatedTweetsResponse,
  PaginatedTweetsType,
  TweetsResponse,
  getTweetsPaginatedRawSql
} from '../../../lib/paginated-tweets';
import { prisma } from '../../../lib/prisma';
import { tweetConverter } from '../../../lib/types/tweet';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedTweetsResponse | TweetsResponse | string>
) {
  if (req.method === 'OPTIONS') {
    return res.status(200).send('Ok');
  }

  const { method } = req;
  switch (method) {
    case 'POST':
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
      const topicUrl = req.query.topic_url
        ? decodeURIComponent(req.query.topic_url as string)
        : null;

      const castHashes = req.body.castHashes as string[];

      console.log('castHashes', castHashes);

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

      let reverseChronologicalQuery = Prisma.sql`SELECT * FROM casts
      WHERE
        hash IN (${Prisma.join(castHashes.map((h) => Buffer.from(h, 'hex')))})
        AND parent_hash IS NULL
        AND casts.deleted_at IS NULL
      ORDER BY timestamp DESC`;

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
        reverseChronologicalQuery,
        skip !== undefined
          ? () => {
              return (skip + limit).toString();
            }
          : undefined
      );

      // const tweetsWithEmbeds = await populateEmbedsForTweets(result.tweets);

      res.json({
        result: {
          ...result,
          tweets: result.tweets
        }
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
