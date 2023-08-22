import { NextApiRequest, NextApiResponse } from 'next';
import { BaseResponse } from '../../../../lib/types/responses';
import { InterestType } from '../../../../lib/types/topic';
import { userInterests } from '../../../../lib/user/resolve-user';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<BaseResponse<InterestType[]>>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      const fid = parseInt(req.query.id as string);
      const type = req.query.type as 'reactions' | 'casts';

      if (!fid) {
        res.status(400).json({ message: 'Missing id' });
        return;
      }

      if (!type) {
        res.status(400).json({ message: 'Missing type' });
        return;
      }

      const topics = await userInterests(BigInt(fid), type);

      res.json({ result: topics });

      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
