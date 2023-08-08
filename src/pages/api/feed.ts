import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { serialize } from '../../lib/utils';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
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

      // Get the casts made by the people the user follows
      const casts = await prisma.casts.findMany({
        where: {
          AND: [
            {
              fid: {
                in: targetFids
              }
            },
            {
              timestamp: {
                lt: cursor || undefined
              }
            }
          ]
        },
        take: limit,
        orderBy: {
          timestamp: 'desc' // reverse chronological order
        }
      });

      const fids = casts.map((cast) => cast.fid);
      const userData = await prisma.user_data.findMany({
        where: {
          fid: {
            in: fids
          }
        }
      });

      // Create a map of fid to user data
      const userDataMap = userData.reduce((acc: any, cur) => {
        const key = cur.fid.toString();
        if (acc[key]) {
          acc[key] = {
            ...acc[key],
            [cur.type]: cur.value
          };
        } else {
          acc[key] = {
            [cur.type]: cur.value
          };
        }
        return acc;
      }, {});

      const nextPageCursor =
        casts.length > 0
          ? casts[casts.length - 1].timestamp.toISOString()
          : null;

      res.json({
        casts: serialize(casts),
        nextPageCursor,
        users: userDataMap
      });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
