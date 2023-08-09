import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { userConverter, UserResponse } from '../../../../lib/types/user';
import { resolveUserAmbiguous } from '../../../../lib/user/resolveUser';

type UserEndpointQuery = {
  id: string;
};

export default async function tweetIdEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<UserResponse>
): Promise<void> {
  const { id } = req.query as UserEndpointQuery;

  const user = await resolveUserAmbiguous(id);

  if (!user) {
    res.status(404).json({
      message: 'User not found'
    });
    return;
  }

  res.json({ result: user });
}
