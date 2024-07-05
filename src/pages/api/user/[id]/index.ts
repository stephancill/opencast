import type { NextApiRequest, NextApiResponse } from 'next';
import { UserFull, UserResponse } from '../../../../lib/types/user';
import { resolveUserAmbiguous } from '../../../../lib/user/resolve-user';

type UserEndpointQuery = {
  id: string;
  full?: string;
};

export default async function userIdEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<UserResponse>
): Promise<void> {
  const { id, full = 'true' } = req.query as UserEndpointQuery;

  const user = (await resolveUserAmbiguous(id, full === 'true')) as UserFull;

  if (!user) {
    res.status(404).json({
      message: 'User not found'
    });
    return;
  }

  res.json({ result: user });
}
