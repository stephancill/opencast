import { MessageType } from '@farcaster/hub-web';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  castsToTweets,
  PaginatedTweetsResponse
} from '../../lib/paginated-tweets';
import { prisma } from '../../lib/prisma';
import { resolveTopicsMap } from '../../lib/topics/resolve-topic';
import { resolveUsersMap } from '../../lib/user/resolve-user';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<PaginatedTweetsResponse>
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

      let startTime = Date.now();

      // Get all the targetFids (people that the user follows)
      const links = await prisma.link.findMany({
        where: {
          AND: [{ fid: userFid }, { targetFid: { not: null } }]
        },
        select: {
          targetFid: true
        }
      });
      const targetFids = links.map((link) => link.targetFid) as bigint[];

      console.log(`Got links in ${Date.now() - startTime}ms`);
      startTime = Date.now();

      const messages = await prisma.message.findMany({
        where: {
          fid: {
            in: targetFids
          },
          messageType: {
            in: [MessageType.REACTION_ADD, MessageType.CAST_ADD]
          },
          timestamp: {
            lt: cursor || undefined
          },
          deletedAt: null
        },
        include: {
          cast: {
            select: {
              hash: true,
              parentHash: true
            }
          },
          reaction: true
        },
        take: limit,
        orderBy: {
          timestamp: 'desc' // reverse chronological order
        }
      });

      console.log(`Got messages in ${Date.now() - startTime}ms`);
      startTime = Date.now();

      console.log(`Messages count: ${messages.length}`);
      console.log(
        `Messages without parent hash: ${
          messages.filter((message) => message.cast?.parentHash == null).length
        }`
      );

      const castRecastInfo = messages
        .filter((message) => message.cast?.parentHash == null)
        .map((message) =>
          message.messageType === MessageType.CAST_ADD
            ? { castHash: message.cast?.hash, recast: null }
            : {
                castHash: message.reaction?.targetHash,
                recast: message.fid
              }
        );
      const recastMap = castRecastInfo.reduce((acc, cur) => {
        if (cur.castHash && cur.recast) {
          acc[cur.castHash.toString('hex')] = cur.recast.toString();
        }
        return acc;
      }, {} as { [key: string]: string });

      const castHashes = castRecastInfo.map((cast) => cast.castHash!);

      let { tweets, casts } = await castsToTweets(castHashes);
      tweets = tweets.map((tweet, index) => ({
        ...tweet,
        retweet: castRecastInfo[index]!.recast
          ? { userId: castRecastInfo[index]!.recast!.toString() }
          : null
      }));

      console.log(`Got tweets in ${Date.now() - startTime}ms`);
      startTime = Date.now();

      const fids: Set<bigint> = casts.reduce((acc: Set<bigint>, cur) => {
        // Cast author
        acc.add(cur.fid);

        // Retweet author
        const castHash = cur.hash.toString('hex');
        const recaster = recastMap[castHash];
        if (recaster) acc.add(BigInt(parseInt(recaster)));

        // Parent cast author
        if (cur.parentFid) acc.add(cur.parentFid);

        // Mentions
        cur.mentions.forEach((mention) => acc.add(mention));

        return acc;
      }, new Set<bigint>());

      const [usersMap] = await Promise.all([
        resolveUsersMap([...fids]),
        resolveTopicsMap(
          casts
            .map((cast) => cast.parentUrl)
            .filter((url) => url !== null) as string[]
        )
      ]);

      console.log(`Got users and topics in ${Date.now() - startTime}ms`);

      const nextPageCursor =
        casts.length > 0
          ? casts[casts.length - 1]!.timestamp.toISOString()
          : null;

      res.json({
        result: {
          tweets,
          users: usersMap,
          nextPageCursor
        }
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}