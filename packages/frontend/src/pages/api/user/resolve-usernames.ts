import { NextApiRequest, NextApiResponse } from 'next';
import { BaseResponse } from '../../../lib/types/responses';
import { prisma } from '../../../lib/prisma';
import { UserDataType } from '@farcaster/hub-nodejs';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<BaseResponse<{ [key: string]: number }>>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      let usernames = (req.query.usernames as string).split(',');

      const userData = await prisma.user_data.findMany({
        where: {
          type: UserDataType.USERNAME,
          value: {
            in: usernames
          }
        }
      });

      const usernameToId: { [key: string]: number } = userData.reduce(
        (acc: { [key: string]: number }, cur) => {
          acc[cur.value] = Number(cur.fid);
          return acc;
        },
        {}
      );

      res.json({ result: usernameToId });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
