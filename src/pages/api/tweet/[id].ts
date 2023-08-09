import { ReactionType } from '@farcaster/hub-web';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { tweetConverter, TweetResponse } from '../../../lib/types/tweet';
import { userConverter } from '../../../lib/types/user';
import { serialize } from '../../../lib/utils';

type TweetEndpointQuery = {
  id: string;
};

export default async function tweetIdEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<TweetResponse>
): Promise<void> {
  const { id } = req.query as TweetEndpointQuery;

  const cast = await prisma.casts.findUnique({
    where: {
      hash: Buffer.from(id, 'hex')
    }
  });

  if (!cast) {
    res.status(404).json({
      message: 'Tweet not found'
    });
    return;
  }

  const engagements = await prisma.reactions.findMany({
    where: {
      target_hash: cast.hash
    },
    select: {
      fid: true,
      reaction_type: true
    }
  });

  // Group reactions by type
  const reactions = engagements.reduce((acc: any, cur) => {
    const key = cur.reaction_type;
    if (acc[key]) {
      acc[key] = [...acc[key], cur.fid.toString()];
    } else {
      acc[key] = [cur.fid.toString()];
    }
    return acc;
  }, {});

  const userData = await prisma.user_data.findMany({
    where: {
      fid: cast.fid
    }
  });

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

  const tweet = tweetConverter.toTweet(cast);

  res.json({
    result: serialize({
      ...tweet,
      userLikes: reactions[ReactionType.LIKE] || [],
      userRetweets: reactions[ReactionType.RECAST] || [],
      user: users[0]
    })
  });
}
