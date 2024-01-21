import { ReactionType } from '@farcaster/hub-web';
import type { NextApiRequest, NextApiResponse } from 'next';
import { populateEmbedsForTweets } from '../../../../lib/embeds';
import { prisma } from '../../../../lib/prisma';
import { resolveTopic } from '../../../../lib/topics/resolve-topic';
import { TopicType } from '../../../../lib/types/topic';
import {
  Tweet,
  TweetResponse,
  TweetWithUsers,
  tweetConverter
} from '../../../../lib/types/tweet';
import { resolveUsersMap } from '../../../../lib/user/resolve-user';

type TweetEndpointQuery = {
  id: string;
};

export default async function tweetIdEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<TweetResponse>
): Promise<void> {
  const { id } = req.query as TweetEndpointQuery;

  const cast = await prisma.cast.findUnique({
    where: {
      hash: Buffer.from(id, 'hex'),
      deletedAt: null,
      message: {
        deletedAt: null
      }
    },
    include: {
      message: true
    }
  });

  if (!cast) {
    res.status(404).json({
      message: 'Cast not found'
    });
    return;
  }

  const signer = await prisma.signer.findFirst({
    where: {
      signer: cast.message.signer
    }
  });

  const engagements = await prisma.reaction.findMany({
    where: {
      targetHash: cast.hash,
      deletedAt: null
    },
    select: {
      fid: true,
      reactionType: true
    }
  });

  // Group reactions by type
  const reactions = engagements.reduce((acc: any, cur) => {
    const key = cur.reactionType;
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
  if (cast.parentFid) fids.add(cast.parentFid);
  cast.mentions.forEach((mention) => fids.add(mention));

  const users = await resolveUsersMap([...fids]);

  let topic: TopicType | null = null;
  if (cast.parentUrl) {
    topic = await resolveTopic(cast.parentUrl);
  }

  let tweet: Tweet = tweetConverter.toTweet(cast);
  const [tweetWithEmbeds] = await populateEmbedsForTweets([tweet]);

  // TODO: Fix
  const tweetWithUsers: TweetWithUsers = {
    ...tweetWithEmbeds,
    topic: topic,
    userLikes: reactions[ReactionType.LIKE] || [],
    userRetweets: reactions[ReactionType.RECAST] || [],
    users: users,
    client: signer?.name || null
  };

  res.json({
    result: tweetWithUsers
  });
}
