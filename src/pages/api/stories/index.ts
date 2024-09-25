import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { StoriesResponse } from '../../../lib/types/stories';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<StoriesResponse>
) {
  const { method } = req;
  switch (method) {
    case 'POST':
      const authToken = req.headers.authorization;
      const fid = req.query.fid as string;

      if (!authToken) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const fids = await prisma.links.findMany({
        where: {
          fid: BigInt(fid),
          type: 'follow',
          deleted_at: null
        },
        distinct: ['target_fid', 'fid'],
        select: {
          target_fid: true
        }
      });

      const stories = await fetch(
        `${process.env.STORIES_API_URL}/api/stories/feed`,
        {
          headers: {
            Authorization: authToken
          },
          method: 'POST',
          body: JSON.stringify({
            fids: fids.map((fid) => Number(fid.target_fid))
          })
        }
      );

      const storiesData = await stories.json();

      res.json({ result: storiesData });
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
