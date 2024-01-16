import { UserDataType } from '@farcaster/hub-web';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { BaseResponse } from '../../lib/types/responses';
import { User } from '../../lib/types/user';
import { resolveUserFromFid } from '../../lib/user/resolve-user';
export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<BaseResponse<User[]>>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const query = req.query.q as string;

      if (!query.length) {
        res.json({ result: [] });
        return;
      }

      // Get users that match query
      const userData = await prisma.userData.findMany({
        where: {
          type: {
            in: [UserDataType.USERNAME, UserDataType.DISPLAY]
          },
          deleted_at: null,
          value: {
            contains: query,
            mode: 'insensitive'
          }
        },
        take: 5,
        distinct: 'fid'
      });

      const fids = userData.map((userData) => userData.fid);

      const userOrNulls = await Promise.all(
        fids.map((fid) => resolveUserFromFid(fid))
      );
      const users = userOrNulls.filter(
        (userOrNull) => userOrNull !== null
      ) as User[];

      res.json({ result: users });
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
