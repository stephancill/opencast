import { Prisma } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';
import { populateEmbedsForTweets } from '../../../../../../lib/embeds';
import {
  PaginatedTweetsType,
  getTweetsPaginatedRawSql
} from '../../../../../../lib/paginated-tweets';
import { BaseResponse } from '../../../../../../lib/types/responses';

type Query = {
  pubKey: string;
  id: string;
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<BaseResponse<PaginatedTweetsType>>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const { pubKey, id } = req.query as Query;
      const fid = parseInt(req.query.id as string);
      const pubKeyBytes = Buffer.from(pubKey, 'hex');

      const limit =
        req.query.limit && req.query.limit !== 'undefined'
          ? Number(req.query.limit)
          : 10;
      const skip = req.query.skip ? Number(req.query.skip) : 0;
      const cursor = req.query.cursor
        ? new Date(req.query.cursor as string)
        : null;
      const after = !!req.query.after && req.query.after !== 'false';
      const full = !!req.query.full && req.query.full !== 'false';

      if (after || !full) {
        res.json({
          result: {
            nextPageCursor: null,
            tweets: [],
            users: {}
          }
        });
        return;
      }

      let result: PaginatedTweetsType;

      result = await getTweetsPaginatedRawSql(
        Prisma.sql`
        SELECT * FROM messages m
        INNER JOIN casts c ON m.hash = c.hash
        WHERE
          signer = ${pubKeyBytes} AND
          (${cursor}::timestamp IS NULL OR c.timestamp < ${cursor}::timestamp)
        ORDER BY c.timestamp DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `,
        skip !== undefined
          ? () => {
              return (skip + limit).toString();
            }
          : undefined
      );

      const tweetsWithEmbeds = await populateEmbedsForTweets(result.tweets);

      res.json({
        result: {
          ...result,
          tweets: tweetsWithEmbeds
        }
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
