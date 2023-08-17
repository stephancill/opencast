import type { NextApiRequest, NextApiResponse } from 'next';
import { UserResponse } from '../../../lib/types/user';
import { resolveTopic } from '../../../lib/topics/resolve-topic';
import { TopicResponse } from '../../../lib/types/topic';

export default async function topicIdEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<TopicResponse>
): Promise<void> {
  const topicUrl = req.query.url as string;

  const topic = await resolveTopic(topicUrl);

  if (!topic) {
    res.status(404).json({
      message: 'User not found'
    });
    return;
  }

  res.json({ result: topic });
}
