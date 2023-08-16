import { NextApiRequest, NextApiResponse } from 'next';
import { populateEmbed } from '../../lib/embeds';
import { ExternalEmbed } from '../../lib/types/tweet';

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse<(ExternalEmbed | null)[]>
) {
  const { method } = req;
  switch (method) {
    case 'GET':
      let urls = (req.query.urls as string).split(',');

      // console.log(urls);

      const embeds = await Promise.all(
        urls.map((url) => populateEmbed({ url }))
      );

      res.json(embeds);
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
