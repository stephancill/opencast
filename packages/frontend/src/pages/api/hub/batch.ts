import { Message } from '@farcaster/hub-nodejs';
import { NextApiRequest, NextApiResponse } from 'next';
import { hubClient } from '../../../lib/farcaster';
import { BaseResponse } from '../../../lib/types/responses';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<BaseResponse<{}>>
) {
  const { method } = req;
  switch (method) {
    case 'POST':
      const messagesRaw = req.body.messages;
      const messages: Message[] = messagesRaw.map((m: any) =>
        Message.fromJSON(m)
      );

      try {
        await Promise.all(
          messages.map(async (m) => {
            const hubResult = await hubClient.submitMessage(m);
            return hubResult.unwrapOr(null);
          })
        );
      } catch (error) {
        console.log(error);
        res.status(400).json({ message: 'Could not send message' });
        return;
      }

      res.json({ message: 'Success' });

      break;

    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
