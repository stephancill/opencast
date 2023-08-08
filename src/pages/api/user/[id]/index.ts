import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { userConverter, USerResponse } from '../../../../lib/types/user';

type UserEndpointQuery = {
  id: string;
};

export default async function tweetIdEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<USerResponse>
): Promise<void> {
  const { id } = req.query as UserEndpointQuery;

  const userData = await prisma.user_data.findMany({
    where: {
      fid: Number(id)
    }
  });

  if (!userData) {
    res.status(404).json({
      message: 'User not found'
    });
    return;
  }

  // Create a map of fid to user data
  const userDataMap = userData.reduce((acc: any, cur) => {
    const key = cur.fid.toString();
    if (acc[key]) {
      acc[key] = {
        ...acc[key],
        [cur.type]: cur.value
      };
    } else {
      acc[key] = {
        [cur.type]: cur.value
      };
    }
    return acc;
  }, {});

  const users = Object.keys(userDataMap).map((fid) => {
    const user = userDataMap[fid];
    return userConverter.toUser({ ...user, fid });
  });

  res.json({ result: users[0] });
}
