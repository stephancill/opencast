import { HubResult, Message } from '@farcaster/hub-nodejs';
import { NextApiRequest, NextApiResponse } from 'next';
import { hubClient } from '../../lib/farcaster';
import { BaseResponse } from '../../lib/types/responses';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<BaseResponse<HubResult<Message>>>
) {
  const { method } = req;
  switch (method) {
    case 'POST':
      const message = Message.fromJSON(req.body.message);
      const hubResult = await hubClient.submitMessage(message);
      console.log(hubResult);
      res.json({ result: hubResult });
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
