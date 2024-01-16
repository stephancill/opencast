import { Message } from '@farcaster/hub-nodejs';
import { NextApiRequest, NextApiResponse } from 'next';
import { hubClient } from '../../../lib/farcaster';
import { BaseResponse } from '../../../lib/types/responses';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<BaseResponse<Message>>
) {
  const { method } = req;
  switch (method) {
    case 'POST':
      const message = Message.fromJSON(req.body.message);
      const hubResult = await hubClient.submitMessage(message);
      const unwrapped = hubResult.unwrapOr(null);
      if (!unwrapped) {
        res.status(400).json({ message: 'Could not send message' });
        return;
      }
      res.json({ result: Message.toJSON(unwrapped) as Message });
      break;
    case 'GET':
      // Get cast
      const hash = req.query.hash as string;
      const fid = parseInt(req.query.fid as string);
      const castResult = await hubClient.getCast({
        fid,
        hash: Buffer.from(hash, 'hex')
      });
      const cast = castResult.unwrapOr(null);
      if (!cast) {
        res.status(400).json({ message: 'Could not get cast' });
        return;
      }
      res.json({ result: Message.toJSON(cast) as Message });
      break;

    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
