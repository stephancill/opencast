import { ReactionType } from '@farcaster/hub-web';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { tweetConverter, TweetResponse } from '../../../../lib/types/tweet';
import { resolveUsersMap } from '../../../../lib/user/resolveUser';

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
      target_hash: cast.hash,
      deleted_at: null
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

  // Get all fids from cast and mentions
  const fids = new Set<bigint>();
  fids.add(cast.fid);
  if (cast.parent_fid) fids.add(cast.parent_fid);
  cast.mentions.forEach((mention) => fids.add(mention));

  const users = await resolveUsersMap([...fids]);

  const tweet = {
    ...tweetConverter.toTweet(cast),
    userLikes: reactions[ReactionType.LIKE] || [],
    userRetweets: reactions[ReactionType.RECAST] || [],
    users: users
  };

  res.json({
    result: tweet
  });
}
