import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveTopic } from '@lib/topics/resolve-topic';
import { TopicResponse } from '@lib/types/topic';

export default async function topicIdEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<TopicResponse>
): Promise<void> {
  const topicUrl = decodeURIComponent(req.query.url as string);

  const topic = await resolveTopic(topicUrl);

  if (!topic) {
    res.status(404).json({
      message: 'Topic not found'
    });
    return;
  }

  res.json({ result: topic });
}
